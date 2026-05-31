export type ProfileStatus = "pending" | "active" | "blocked" | "invited";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  company_name: string | null;
  phone: string | null;
  job_title: string | null;
  role: "admin" | "gp" | "client" | "portfolio_manager" | "director";
  is_active: boolean;
  status: ProfileStatus;
  last_seen_at: string | null;
};

export type AdminUser = Profile & {
  created_at: string | null;
};

export type AccessRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type AccessRequest = {
  id: string;
  requester_id: string;
  full_name: string;
  email: string;
  company: string;
  phone: string | null;
  related_context: string | null;
  reason: string;
  status: AccessRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "id" | "full_name" | "email" | "company_name" | "phone" | "job_title" | "role" | "status"> | null;
};

export type AccessRequestForm = {
  full_name: string;
  company: string;
  phone: string;
  related_context: string;
  reason: string;
};

export type Client = {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  status: string;
  notes: string | null;
  created_at: string | null;
  deleted_at?: string | null;
  client_contacts?: ClientContact[];
};

export type ClientContact = {
  id?: string;
  client_id?: string;
  name: string;
  role_title: string | null;
  phone: string | null;
  email: string | null;
  is_primary?: boolean;
  deleted_at?: string | null;
};

export type ClientContactForm = {
  id?: string;
  name: string;
  role_title: string;
  phone: string;
  email: string;
};

export type ProfessionalFunction =
  | "project_manager"
  | "portfolio_manager"
  | "project_coordinator"
  | "project_lead"
  | "project_director";

export type Professional = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  function: ProfessionalFunction;
  is_active: boolean;
  created_at: string | null;
  deleted_at?: string | null;
};

export type ProfessionalForm = {
  full_name: string;
  email: string;
  whatsapp: string;
  function: ProfessionalFunction;
};

export type ProjectStatus = "planned" | "active" | "paused" | "completed" | "cancelled";

export type Project = {
  id: string;
  client_id: string;
  project_number: string;
  name: string;
  description: string | null;
  gp_id: string | null;
  portfolio_manager_id: string | null;
  professional_gp_id: string | null;
  professional_portfolio_manager_id: string | null;
  phase: string | null;
  status: ProjectStatus;
  starts_on: string | null;
  target_ends_on: string | null;
  created_at: string | null;
  deleted_at?: string | null;
  clients?: Pick<Client, "id" | "name"> | null;
  professional_gp?: Pick<Professional, "id" | "full_name" | "email" | "whatsapp" | "function"> | null;
  professional_portfolio_manager?: Pick<Professional, "id" | "full_name" | "email" | "whatsapp" | "function"> | null;
  gp?: Pick<Profile, "id" | "full_name" | "email" | "role"> | null;
  portfolio_manager?: Pick<Profile, "id" | "full_name" | "email" | "role"> | null;
};

export type RiskStatus = "open" | "in_progress" | "mitigated" | "closed" | "accepted";
export type RiskResponseType = "avoid" | "transfer" | "research" | "mitigate" | "accept" | "escalate";

export type Risk = {
  id: string;
  project_id: string;
  sequence_number: number | null;
  group_name: string;
  phase: string | null;
  description: string;
  root_cause: string | null;
  origin: string | null;
  business_impact: string | null;
  identified_on: string | null;
  main_impact: string | null;
  probability_label: string | null;
  probability_score: number | null;
  impact_label: string | null;
  impact_score: number | null;
  response_type: RiskResponseType | null;
  response_plan: string | null;
  external_tool: string | null;
  external_reference_id: string | null;
  external_reference_url: string | null;
  responsible_id: string | null;
  responsible_name: string | null;
  status: RiskStatus;
  closed_on: string | null;
  created_by: string | null;
  created_at: string | null;
  deleted_at?: string | null;
  score: number | null;
  projects?: Pick<Project, "id" | "project_number" | "name"> & {
    clients?: Pick<Client, "id" | "name"> | null;
  } | null;
};

export type RiskForm = {
  project_id: string;
  group_name: string;
  phase: string;
  description: string;
  root_cause: string;
  origin: string;
  business_impact: string;
  identified_on: string;
  main_impact: string;
  probability_score: string;
  impact_score: string;
  response_type: RiskResponseType;
  response_plan: string;
  external_tool: string;
  external_reference_id: string;
  external_reference_url: string;
  responsible_name: string;
  status: RiskStatus;
  closed_on: string;
};

export type ReportType = "executive" | "risk_detail" | "risk_plan";

export type ReportRecord = {
  id: string;
  project_id: string | null;
  client_id: string | null;
  report_type: ReportType;
  title: string;
  file_name: string | null;
  generated_by: string | null;
  generated_at: string;
  projects?: Pick<Project, "id" | "project_number" | "name"> | null;
  clients?: Pick<Client, "id" | "name"> | null;
};

export type ProjectForm = {
  client_id: string;
  project_number: string;
  name: string;
  description: string;
  professional_gp_id: string;
  professional_portfolio_manager_id: string;
  phase: string;
  status: ProjectStatus;
  starts_on: string;
  target_ends_on: string;
};

export const emptyClientContact: ClientContactForm = {
  name: "",
  role_title: "",
  phone: "",
  email: ""
};

export const emptyProfessionalForm: ProfessionalForm = {
  full_name: "",
  email: "",
  whatsapp: "",
  function: "project_manager"
};

export const emptyProjectForm: ProjectForm = {
  client_id: "",
  project_number: "",
  name: "",
  description: "",
  professional_gp_id: "",
  professional_portfolio_manager_id: "",
  phase: "",
  status: "planned",
  starts_on: "",
  target_ends_on: ""
};

export const emptyRiskForm: RiskForm = {
  project_id: "",
  group_name: "",
  phase: "",
  description: "",
  root_cause: "",
  origin: "",
  business_impact: "",
  identified_on: new Date().toISOString().slice(0, 10),
  main_impact: "",
  probability_score: "3",
  impact_score: "3",
  response_type: "mitigate",
  response_plan: "",
  external_tool: "",
  external_reference_id: "",
  external_reference_url: "",
  responsible_name: "",
  status: "in_progress",
  closed_on: ""
};

export const projectPhaseOptions = [
  "1 - Prepare",
  "2 - Explore",
  "3 - Realize",
  "3.1 - Testes Integrados",
  "4 - Deploy",
  "5 - Run",
  "Todas"
];

export const professionalFunctionLabels: Record<ProfessionalFunction, string> = {
  project_manager: "Gerente de Projetos",
  portfolio_manager: "Gerente de Portfólio",
  project_coordinator: "Coordenador de Projetos",
  project_lead: "Líder de Projetos",
  project_director: "Diretor de Projetos"
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  planned: "Planejado",
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado"
};

export const riskStatusLabels: Record<RiskStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  mitigated: "Mitigado",
  closed: "Concluído",
  accepted: "Aceito"
};

export const riskResponseTypeLabels: Record<RiskResponseType, string> = {
  avoid: "Evitar",
  transfer: "Transferir",
  research: "Pesquisar",
  mitigate: "Mitigar",
  accept: "Aceitar",
  escalate: "Escalar"
};

export const reportTypeLabels: Record<ReportType, string> = {
  executive: "Executivo",
  risk_detail: "Detalhado de riscos",
  risk_plan: "Plano de gestão"
};

export const riskOriginOptions = ["Externo", "Interno"];

export const riskGroupOptions = ["Estratégico", "Ambiental", "Operacional", "Técnico"];

export const riskMainImpactOptions = ["Custo", "Escopo", "Tempo", "Qualidade", "Resultado"];

export const riskBusinessImpactOptions = [
  "Reputacional",
  "Comercial / Vendas",
  "Financeiro",
  "Legal / Regulatório",
  "Cliente / Experiência",
  "Operacional",
  "Tecnológico",
  "Segurança da Informação",
  "Estratégico",
  "Produto / Qualidade",
  "Pessoas / Equipe",
  "Fornecedores / Terceiros"
];

export const riskExternalToolOptions = ["Asana", "Jira", "Planner", "Azure DevOps", "Outra"];

export const riskScoreLabels: Record<number, string> = {
  1: "Muito Pequena",
  2: "Pequena",
  3: "Média",
  4: "Grande",
  5: "Muito Grande"
};

export const riskImpactLabels: Record<number, string> = {
  1: "Insignificante",
  2: "Baixo",
  3: "Moderado",
  4: "Alto",
  5: "Catastrófico"
};

export function getRiskSeverity(score: number | null | undefined) {
  if (!score) return "Não avaliado";
  if (score > 16) return "Risco Extremamente Alto";
  if (score >= 11) return "Risco Alto";
  if (score >= 5) return "Risco Moderado";
  return "Risco Baixo";
}

export function getRiskSeverityClass(score: number | null | undefined) {
  if (!score) return "nao-avaliado";
  if (score > 16) return "extremo";
  if (score >= 11) return "alto";
  if (score >= 5) return "moderado";
  return "baixo";
}

const defaultPhoneCountryCode = "55";
const knownPhoneCountryCodes = [
  "1", "7", "20", "27", "30", "31", "32", "33", "34", "36", "39", "40", "41", "43", "44", "45", "46", "47", "48", "49",
  "51", "52", "53", "54", "55", "56", "57", "58", "60", "61", "62", "63", "64", "65", "66", "81", "82", "84", "86", "90",
  "91", "92", "93", "94", "95", "98", "212", "213", "216", "218", "351", "352", "353", "354", "355", "356", "357", "358",
  "359", "370", "371", "372", "373", "374", "375", "376", "377", "378", "380", "381", "382", "385", "386", "420", "421",
  "423", "971", "972", "973", "974"
].sort((a, b) => b.length - a.length);

function splitPhoneCountryCode(value: string) {
  const trimmedValue = value.trim();
  const digits = trimmedValue.replace(/\D/g, "");

  if (!digits) {
    return { countryCode: defaultPhoneCountryCode, nationalDigits: "" };
  }

  if (!trimmedValue.startsWith("+") && !trimmedValue.startsWith("00")) {
    const nationalDigits = digits.startsWith(defaultPhoneCountryCode) && digits.length > 11
      ? digits.slice(defaultPhoneCountryCode.length)
      : digits;

    return {
      countryCode: defaultPhoneCountryCode,
      nationalDigits
    };
  }

  const internationalDigits = trimmedValue.startsWith("00") ? digits.slice(2) : digits;
  const separatedCountryCode = trimmedValue.match(/^(?:\+|00)(\d{1,3})(?=\D|$)/)?.[1];
  const countryCode = separatedCountryCode
    || knownPhoneCountryCodes.find((code) => internationalDigits.startsWith(code))
    || internationalDigits.slice(0, Math.min(3, internationalDigits.length));

  return {
    countryCode,
    nationalDigits: internationalDigits.slice(countryCode.length)
  };
}

function formatBrazilianPhone(nationalDigits: string) {
  const digits = nationalDigits.slice(0, 11);
  const areaCode = digits.slice(0, 2);
  const firstPart = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
  const secondPart = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);

  if (!digits) return "+55";
  if (digits.length <= 2) return `+55 (${areaCode}`;
  if (digits.length <= 6) return `+55 (${areaCode}) ${firstPart}`;
  return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
}

function formatInternationalLocalNumber(nationalDigits: string) {
  const digits = nationalDigits.slice(0, 14);
  const groups: string[] = [];

  for (let index = 0; index < digits.length; index += index === 0 ? 3 : 4) {
    groups.push(digits.slice(index, index + (index === 0 ? 3 : 4)));
  }

  return groups.filter(Boolean).join(" ");
}

export function formatPhone(value: string) {
  const { countryCode, nationalDigits } = splitPhoneCountryCode(value);

  if (!countryCode || countryCode === defaultPhoneCountryCode) {
    return formatBrazilianPhone(nationalDigits);
  }

  const formattedLocalNumber = formatInternationalLocalNumber(nationalDigits);
  return formattedLocalNumber ? `+${countryCode} ${formattedLocalNumber}` : `+${countryCode}`;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function isValidPhone(value: string) {
  const trimmedValue = value.trim();
  const { countryCode, nationalDigits } = splitPhoneCountryCode(trimmedValue);

  if (countryCode === defaultPhoneCountryCode) {
    return nationalDigits.length === 10 || nationalDigits.length === 11;
  }

  const totalDigits = `${countryCode}${nationalDigits}`.length;
  return (trimmedValue.startsWith("+") || trimmedValue.startsWith("00")) && totalDigits >= 7 && totalDigits <= 15;
}

export function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function hasContactData(contact: ClientContactForm) {
  return Boolean(contact.name.trim() || contact.role_title.trim() || contact.phone.trim() || contact.email.trim());
}
