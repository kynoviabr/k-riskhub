export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: "admin" | "gp" | "client" | "portfolio_manager" | "director";
  is_active: boolean;
  last_seen_at: string | null;
};

export type AdminUser = Profile & {
  created_at: string | null;
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
export type RiskResponseType = "avoid" | "transfer" | "mitigate" | "accept" | "escalate";

export type Risk = {
  id: string;
  project_id: string;
  sequence_number: number | null;
  group_name: string;
  phase: string | null;
  description: string;
  origin: string | null;
  identified_on: string | null;
  main_impact: string | null;
  probability_label: string | null;
  probability_score: number | null;
  impact_label: string | null;
  impact_score: number | null;
  response_type: RiskResponseType | null;
  response_plan: string | null;
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
  origin: string;
  main_impact: string;
  probability_score: string;
  impact_score: string;
  response_type: RiskResponseType;
  response_plan: string;
  responsible_name: string;
  status: RiskStatus;
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
  origin: "",
  main_impact: "",
  probability_score: "3",
  impact_score: "3",
  response_type: "mitigate",
  response_plan: "",
  responsible_name: "",
  status: "open"
};

export const projectPhaseOptions = [
  "Preparação",
  "Descoberta",
  "Planejamento",
  "Explore",
  "Realize",
  "Deploy",
  "Go-live",
  "Suporte",
  "Encerramento"
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
  closed: "Fechado",
  accepted: "Aceito"
};

export const riskResponseTypeLabels: Record<RiskResponseType, string> = {
  avoid: "Avoid",
  transfer: "Transfer",
  mitigate: "Mitigate",
  accept: "Accept",
  escalate: "Escalate"
};

export const riskGroupOptions = [
  "Técnico",
  "Cronograma",
  "Financeiro",
  "Escopo",
  "Recursos",
  "Stakeholders",
  "Qualidade",
  "Fornecedores",
  "Governança",
  "Segurança"
];

export const riskScoreLabels: Record<number, string> = {
  1: "Muito baixo",
  2: "Baixo",
  3: "Médio",
  4: "Alto",
  5: "Muito alto"
};

export function getRiskSeverity(score: number | null | undefined) {
  if (!score) return "Não avaliado";
  if (score >= 16) return "Crítico";
  if (score >= 10) return "Alto";
  if (score >= 5) return "Médio";
  return "Baixo";
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  const hasCountryCode = digits.startsWith("55") && digits.length > 11;
  const nationalDigits = hasCountryCode ? digits.slice(2) : digits;
  const countryPrefix = hasCountryCode ? "+55 " : "";
  const areaCode = nationalDigits.slice(0, 2);
  const firstPart = nationalDigits.length > 10 ? nationalDigits.slice(2, 7) : nationalDigits.slice(2, 6);
  const secondPart = nationalDigits.length > 10 ? nationalDigits.slice(7, 11) : nationalDigits.slice(6, 10);

  if (nationalDigits.length <= 2) return `${countryPrefix}${areaCode}`;
  if (nationalDigits.length <= 6) return `${countryPrefix}(${areaCode}) ${firstPart}`;
  return `${countryPrefix}(${areaCode}) ${firstPart}-${secondPart}`;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const nationalDigits = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  return nationalDigits.length === 10 || nationalDigits.length === 11;
}

export function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function hasContactData(contact: ClientContactForm) {
  return Boolean(contact.name.trim() || contact.role_title.trim() || contact.phone.trim() || contact.email.trim());
}
