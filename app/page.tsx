"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleUserRound,
  Download,
  FileText,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Mail,
  Moon,
  PanelsTopLeft,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  TriangleAlert,
  X
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  type AdminUser,
  type Client,
  type ClientContactForm,
  type Professional,
  type ProfessionalForm,
  type Profile,
  type Project,
  type ProjectForm,
  type ReportRecord,
  type ReportType,
  type Risk,
  type RiskForm,
  emptyClientContact,
  emptyProfessionalForm,
  emptyProjectForm,
  emptyRiskForm,
  formatPhone,
  hasContactData,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  getRiskSeverity,
  getRiskSeverityClass,
  reportTypeLabels,
  riskImpactLabels,
  riskScoreLabels,
  riskStatusLabels
} from "@/lib/domain";
import { ClientsModule } from "@/components/clients-module";
import { ProfessionalsModule } from "@/components/professionals-module";
import { ProjectsModule } from "@/components/projects-module";
import { ReportsModule } from "@/components/reports-module";
import { RiskDetailsModal, RisksModule } from "@/components/risks-module";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type PendingDelete =
  | { type: "client"; client: Client }
  | { type: "contact"; index: number; contactName: string }
  | { type: "project"; project: Project }
  | { type: "professional"; professional: Professional }
  | { type: "risk"; risk: Risk };

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Clientes", icon: Building2 },
  { label: "Projetos", icon: BriefcaseBusiness },
  { label: "Profissionais", icon: CircleUserRound },
  { label: "Riscos", icon: TriangleAlert },
  { label: "Portfólio", icon: BarChart3 },
  { label: "Relatórios", icon: FileText },
  { label: "Exportações", icon: Download },
  { label: "Administração", icon: ShieldCheck }
];

const roleLabels: Record<Profile["role"], string> = {
  admin: "Admin",
  gp: "GP",
  client: "Cliente",
  portfolio_manager: "Gerente de Portfólio",
  director: "Diretor"
};

const roleDescriptions: Record<Profile["role"], string> = {
  admin: "Acesso administrativo completo aos clientes, projetos, usuários e configurações.",
  gp: "Acesso aos projetos em que você atua como gerente de projeto.",
  client: "Acesso de leitura aos projetos vinculados ao seu perfil.",
  portfolio_manager: "Visão consolidada dos clientes e projetos sob sua gestão.",
  director: "Visão executiva dos indicadores e riscos do portfólio."
};

function StatusPill({ status }: { status: string }) {
  return <span className="status-pill">{status}</span>;
}

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersError, setAdminUsersError] = useState("");
  const [isAdminUsersLoading, setIsAdminUsersLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientStatusView, setClientStatusView] = useState<"active" | "inactive">("active");
  const [clientsError, setClientsError] = useState("");
  const [isClientsLoading, setIsClientsLoading] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [deletedContactIds, setDeletedContactIds] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [clientForm, setClientForm] = useState({
    name: "",
    notes: "",
    contacts: [{ ...emptyClientContact }]
  });
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [projectsError, setProjectsError] = useState("");
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm>({ ...emptyProjectForm });
  const [risksData, setRisksData] = useState<Risk[]>([]);
  const [risksError, setRisksError] = useState("");
  const [isRisksLoading, setIsRisksLoading] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [riskForm, setRiskForm] = useState<RiskForm>({ ...emptyRiskForm });
  const [dashboardProjectId, setDashboardProjectId] = useState("all");
  const [dashboardMatrixFilter, setDashboardMatrixFilter] = useState<{ probability: number; impact: number } | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professionalsError, setProfessionalsError] = useState("");
  const [isProfessionalsLoading, setIsProfessionalsLoading] = useState(false);
  const [isProfessionalModalOpen, setIsProfessionalModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [editingProfessionalId, setEditingProfessionalId] = useState<string | null>(null);
  const [professionalForm, setProfessionalForm] = useState<ProfessionalForm>({ ...emptyProfessionalForm });
  const [reportsData, setReportsData] = useState<ReportRecord[]>([]);
  const [reportsError, setReportsError] = useState("");
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [reportProjectId, setReportProjectId] = useState("all");
  const [reportType, setReportType] = useState<ReportType>("executive");

  const visibleNav = useMemo(() => {
    if (!profile || profile.role === "admin") return nav;
    if (profile.role === "client") {
      return nav.filter((item) => !["Administração", "Clientes", "Portfólio"].includes(item.label));
    }
    return nav.filter((item) => item.label !== "Administração");
  }, [profile]);

  const isAdminProfile = profile?.role === "admin";

  const loadAdminUsers = useCallback(async () => {
    if (!isSupabaseConfigured || !isAdminProfile) return;

    setIsAdminUsersLoading(true);
    setAdminUsersError("");

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role, is_active, last_seen_at, created_at")
      .order("full_name", { ascending: true, nullsFirst: false })
      .returns<AdminUser[]>();

    if (error) {
      setAdminUsersError(error.message);
      setAdminUsers([]);
      setIsAdminUsersLoading(false);
      return;
    }

    setAdminUsers(data ?? []);
    setIsAdminUsersLoading(false);
  }, [isAdminProfile]);

  const loadClients = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setIsClientsLoading(true);
    setClientsError("");

    const supabase = getSupabaseBrowserClient();
    let clientsQuery = supabase
      .from("clients")
      .select("id, name, legal_name, tax_id, status, notes, created_at, deleted_at, client_contacts(id, name, role_title, phone, email, is_primary, deleted_at)")
      .is("client_contacts.deleted_at", null)
      .order("name", { ascending: true });

    clientsQuery = clientStatusView === "active"
      ? clientsQuery.is("deleted_at", null)
      : clientsQuery.not("deleted_at", "is", null);

    const { data, error } = await clientsQuery.returns<Client[]>();

    if (error) {
      setClientsError(error.message);
      setClients([]);
      setIsClientsLoading(false);
      return;
    }

    setClients((data ?? []).map((client) => ({
      ...client,
      client_contacts: client.client_contacts?.filter((contact) => !contact.deleted_at)
    })));
    setIsClientsLoading(false);
  }, [clientStatusView]);

  const loadProjects = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setIsProjectsLoading(true);
    setProjectsError("");

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("projects")
      .select("id, client_id, project_number, name, description, gp_id, portfolio_manager_id, professional_gp_id, professional_portfolio_manager_id, phase, status, starts_on, target_ends_on, created_at, deleted_at, clients(id, name), professional_gp:professionals!projects_professional_gp_id_fkey(id, full_name, email, whatsapp, function), professional_portfolio_manager:professionals!projects_professional_portfolio_manager_id_fkey(id, full_name, email, whatsapp, function), gp:profiles!projects_gp_id_fkey(id, full_name, email, role), portfolio_manager:profiles!projects_portfolio_manager_id_fkey(id, full_name, email, role)")
      .is("deleted_at", null)
      .order("project_number", { ascending: true })
      .returns<Project[]>();

    if (error) {
      setProjectsError(error.message);
      setProjectsData([]);
      setIsProjectsLoading(false);
      return;
    }

    setProjectsData(data ?? []);
    setIsProjectsLoading(false);
  }, []);

  const loadProfessionals = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setIsProfessionalsLoading(true);
    setProfessionalsError("");

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("professionals")
      .select("id, full_name, email, whatsapp, function, is_active, created_at, deleted_at")
      .is("deleted_at", null)
      .order("full_name", { ascending: true })
      .returns<Professional[]>();

    if (error) {
      setProfessionalsError(error.message);
      setProfessionals([]);
      setIsProfessionalsLoading(false);
      return;
    }

    setProfessionals(data ?? []);
    setIsProfessionalsLoading(false);
  }, []);

  const loadRisks = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setIsRisksLoading(true);
    setRisksError("");

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("risks")
      .select("id, project_id, sequence_number, group_name, phase, description, root_cause, origin, business_impact, identified_on, main_impact, probability_label, probability_score, impact_label, impact_score, response_type, response_plan, external_tool, external_reference_id, external_reference_url, responsible_id, responsible_name, status, closed_on, created_by, created_at, deleted_at, score, projects(id, project_number, name, clients(id, name))")
      .is("deleted_at", null)
      .order("score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .returns<Risk[]>();

    if (error) {
      setRisksError(error.message);
      setRisksData([]);
      setIsRisksLoading(false);
      return;
    }

    setRisksData(data ?? []);
    setIsRisksLoading(false);
  }, []);

  const loadReports = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setIsReportsLoading(true);
    setReportsError("");

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("reports")
      .select("id, project_id, client_id, report_type, title, file_name, generated_by, generated_at, projects(id, project_number, name), clients(id, name)")
      .order("generated_at", { ascending: false })
      .returns<ReportRecord[]>();

    if (error) {
      setReportsError(error.message);
      setReportsData([]);
      setIsReportsLoading(false);
      return;
    }

    setReportsData(data ?? []);
    setIsReportsLoading(false);
  }, []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("k-riskhub-theme");
    if (storedTheme === "dark") {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (isAdminProfile) {
      setActiveModule("Administração");
    }
  }, [isAdminProfile]);

  useEffect(() => {
    if (activeModule === "Administração") {
      void loadAdminUsers();
    }
    if (activeModule === "Dashboard" || activeModule === "Portfólio") {
      void loadClients();
      void loadProjects();
      void loadRisks();
    }
    if (activeModule === "Clientes") {
      void loadClients();
    }
    if (activeModule === "Projetos") {
      void loadProjects();
      void loadClients();
      void loadProfessionals();
    }
    if (activeModule === "Profissionais") {
      void loadProfessionals();
    }
    if (activeModule === "Riscos") {
      void loadRisks();
      void loadProjects();
    }
    if (activeModule === "Relatórios") {
      void loadReports();
      void loadProjects();
      void loadRisks();
    }
  }, [activeModule, loadAdminUsers, loadClients, loadProfessionals, loadProjects, loadReports, loadRisks]);

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      window.localStorage.setItem("k-riskhub-theme", nextTheme);
      return nextTheme;
    });
  }

  const loadProfile = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role, is_active, last_seen_at")
      .eq("id", userId)
      .single<Profile>();

    if (error) {
      setAuthMessage(error.message);
      setIsSignedIn(false);
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    setProfile(data);
    setEmail(data.email);
    setIsSignedIn(true);
    setIsProfileLoading(false);
    void supabase.rpc("touch_current_profile_last_seen");
  }, []);

  const loadSession = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsProfileLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
      ]);

      if (!sessionResult) {
        setAuthMessage("Não foi possível carregar a sessão. Tente entrar novamente.");
        setIsSignedIn(false);
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      const { data } = sessionResult;

      if (!data.session?.user) {
        setIsSignedIn(false);
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      await loadProfile(data.session.user.id);
    } catch {
      setAuthMessage("Não foi possível carregar a sessão. Tente entrar novamente.");
      setIsSignedIn(false);
      setProfile(null);
      setIsProfileLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthErrorCode = params.get("error_code");
    const oauthErrorDescription = params.get("error_description");

    if (oauthErrorCode) {
      setAuthMessage(
        oauthErrorCode === "bad_oauth_state"
          ? "O login expirou antes de concluir. Tente entrar novamente."
          : oauthErrorDescription?.replaceAll("+", " ") || "Não foi possível concluir o login."
      );
      window.history.replaceState({}, "", window.location.pathname);
    }

    void loadSession();
  }, [loadSession]);

  async function signInWithOAuth(provider: "azure" | "google") {
    setAuthMessage("");

    if (!isSupabaseConfigured) {
      setIsSignedIn(true);
      return;
    }

    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        scopes: provider === "azure" ? "email" : undefined
      }
    });

    if (error) {
      setAuthMessage(error.message);
      setIsLoading(false);
    }
  }

  async function signInWithEmail() {
    setAuthMessage("");

    if (!isSupabaseConfigured) {
      setIsSignedIn(true);
      return;
    }

    if (!email || !password) {
      setAuthMessage("Informe e-mail e senha.");
      return;
    }

    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthMessage(error.message);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await loadProfile(data.user.id);
    } else {
      setIsSignedIn(true);
    }
    setIsLoading(false);
  }

  async function resetPassword() {
    setAuthMessage("");

    if (!isSupabaseConfigured) {
      setAuthMessage("Preencha a anon key do Supabase para testar o reset de senha.");
      return;
    }

    if (!email) {
      setAuthMessage("Informe seu e-mail antes de solicitar o reset.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });

    setAuthMessage(error ? error.message : "Enviamos o link de reset para o e-mail informado.");
  }

  async function signOut() {
    if (isSupabaseConfigured) {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    setIsSignedIn(false);
    setProfile(null);
    setPassword("");
  }

  async function writeAuditLog(entityTable: string, entityId: string | null, action: string, newData?: Record<string, unknown>) {
    if (!isSupabaseConfigured || !profile?.id) return;

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("audit_log").insert({
      actor_id: profile.id,
      entity_table: entityTable,
      entity_id: entityId,
      action,
      new_data: newData ?? null
    });

    if (error) {
      console.warn("Falha ao registrar auditoria", error.message);
    }
  }

  function resetClientForm() {
    setClientForm({ name: "", notes: "", contacts: [{ ...emptyClientContact }] });
    setEditingClientId(null);
    setDeletedContactIds([]);
    setClientsError("");
  }

  function openNewClientModal() {
    resetClientForm();
    setIsClientModalOpen(true);
  }

  function openEditClientModal(client: Client) {
    const contacts = client.client_contacts?.length
      ? [...client.client_contacts]
          .sort((firstContact, secondContact) => Number(Boolean(secondContact.is_primary)) - Number(Boolean(firstContact.is_primary)))
          .map((contact) => ({
            id: contact.id,
            name: contact.name || "",
            role_title: contact.role_title || "",
            phone: contact.phone || "",
            email: contact.email || ""
          }))
      : [{ ...emptyClientContact }];

    setClientForm({
      name: client.name,
      notes: client.notes || "",
      contacts
    });
    setEditingClientId(client.id);
    setDeletedContactIds([]);
    setClientsError("");
    setIsClientModalOpen(true);
  }

  function openClientDetails(client: Client) {
    setSelectedClient(client);
  }

  async function saveClient() {
    setClientsError("");

    if (!clientForm.name.trim()) {
      setClientsError("Informe o nome do cliente.");
      return;
    }

    if (!isSupabaseConfigured) {
      setClientsError("Supabase não configurado para salvar clientes.");
      return;
    }

    const normalizedClientName = clientForm.name.trim().toLocaleLowerCase("pt-BR");
    const duplicatedClient = clients.find((client) =>
      client.id !== editingClientId && client.name.trim().toLocaleLowerCase("pt-BR") === normalizedClientName
    );

    if (duplicatedClient) {
      setClientsError("Já existe um cliente cadastrado com este nome.");
      return;
    }

    const contactsWithData = clientForm.contacts.filter(hasContactData);
    const contactWithoutName = contactsWithData.find((contact) => !contact.name.trim());

    if (contactsWithData.length === 0) {
      setClientsError("Informe pelo menos um contato do cliente.");
      return;
    }

    if (contactWithoutName) {
      setClientsError("Informe o nome de todos os contatos preenchidos.");
      return;
    }

    setIsClientsLoading(true);
    const validContacts = contactsWithData;
    const contactWithInvalidEmail = validContacts.find((contact) => contact.email.trim() && !isValidEmail(contact.email.trim()));
    const contactWithInvalidPhone = validContacts.find((contact) => contact.phone.trim() && !isValidPhone(contact.phone));

    if (contactWithInvalidEmail) {
      setClientsError(`Revise o e-mail de ${contactWithInvalidEmail.name.trim()}.`);
      setIsClientsLoading(false);
      return;
    }

    if (contactWithInvalidPhone) {
      setClientsError(`Revise o telefone de ${contactWithInvalidPhone.name.trim()}.`);
      setIsClientsLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let clientId = editingClientId;

    if (editingClientId) {
      const { error } = await supabase
        .from("clients")
        .update({
          name: clientForm.name.trim(),
          legal_name: null,
          tax_id: null,
          notes: clientForm.notes.trim() || null
        })
        .eq("id", editingClientId);

      if (error) {
        setClientsError(error.message);
        setIsClientsLoading(false);
        return;
      }
    } else {
      const { data, error } = await supabase.from("clients").insert({
        name: clientForm.name.trim(),
        legal_name: null,
        tax_id: null,
        notes: clientForm.notes.trim() || null,
        status: "active"
      }).select("id").single<{ id: string }>();

      if (error) {
        setClientsError(error.message);
        setIsClientsLoading(false);
        return;
      }

      clientId = data.id;
    }

    if (!clientId) {
      setClientsError("Não foi possível identificar o cliente para salvar.");
      setIsClientsLoading(false);
      return;
    }

    if (deletedContactIds.length > 0) {
      const { error: deleteContactsError } = await supabase
        .from("client_contacts")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", deletedContactIds);

      if (deleteContactsError) {
        setClientsError(deleteContactsError.message);
        setIsClientsLoading(false);
        return;
      }
    }

    const existingContacts = validContacts.filter((contact) => contact.id);
    const newContacts = validContacts.filter((contact) => !contact.id);

    const updateResults = await Promise.all(existingContacts.map((contact, index) =>
      supabase
        .from("client_contacts")
        .update({
          name: contact.name.trim(),
          role_title: contact.role_title.trim() || null,
          phone: contact.phone.trim() || null,
          email: contact.email.trim() || null,
          is_primary: index === 0
        })
        .eq("id", contact.id)
        .eq("client_id", clientId)
    ));

    const updateContactsError = updateResults.find((result) => result.error)?.error;
    if (updateContactsError) {
      setClientsError(updateContactsError.message);
      setIsClientsLoading(false);
      return;
    }

    if (newContacts.length > 0) {
      const { error: insertContactsError } = await supabase.from("client_contacts").insert(
        newContacts.map((contact, index) => ({
          client_id: clientId,
          name: contact.name.trim(),
          role_title: contact.role_title.trim() || null,
          phone: contact.phone.trim() || null,
          email: contact.email.trim() || null,
          is_primary: existingContacts.length === 0 && index === 0
        }))
      );

      if (insertContactsError) {
        setClientsError(insertContactsError.message);
        setIsClientsLoading(false);
        return;
      }
    }

    void writeAuditLog("clients", clientId, editingClientId ? "update" : "insert", {
      name: clientForm.name.trim(),
      contacts_count: validContacts.length
    });

    if (deletedContactIds.length > 0) {
      void writeAuditLog("client_contacts", clientId, "soft_delete_batch", {
        contact_ids: deletedContactIds
      });
    }

    resetClientForm();
    setIsClientModalOpen(false);
    await loadClients();
  }

  function requestDeleteClient(client: Client) {
    setClientsError("");
    setDeleteConfirmationText("");
    setPendingDelete({ type: "client", client });
  }

  async function deleteClient(client: Client) {
    setClientsError("");

    if (!isSupabaseConfigured) {
      setClientsError("Supabase não configurado para remover clientes.");
      return;
    }

    setIsClientsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("clients")
      .update({ deleted_at: new Date().toISOString(), status: "inactive" })
      .eq("id", client.id);

    if (error) {
      setClientsError(error.message);
      setIsClientsLoading(false);
      return;
    }

    void writeAuditLog("clients", client.id, "soft_delete", { name: client.name });

    if (selectedClient?.id === client.id) {
      setSelectedClient(null);
    }

    await loadClients();
  }

  async function confirmPendingDelete() {
    if (deleteConfirmationText.trim().toLocaleLowerCase("pt-BR") !== "remover" || !pendingDelete) return;

    if (pendingDelete.type === "client") {
      const clientToDelete = pendingDelete.client;
      setPendingDelete(null);
      setDeleteConfirmationText("");
      await deleteClient(clientToDelete);
      return;
    }

    if (pendingDelete.type === "project") {
      const projectToDelete = pendingDelete.project;
      setPendingDelete(null);
      setDeleteConfirmationText("");
      await deleteProject(projectToDelete);
      return;
    }

    if (pendingDelete.type === "professional") {
      const professionalToDelete = pendingDelete.professional;
      setPendingDelete(null);
      setDeleteConfirmationText("");
      await deleteProfessional(professionalToDelete);
      return;
    }

    if (pendingDelete.type === "risk") {
      const riskToDelete = pendingDelete.risk;
      setPendingDelete(null);
      setDeleteConfirmationText("");
      await deleteRisk(riskToDelete);
      return;
    }

    removeClientContactImmediately(pendingDelete.index);
    setPendingDelete(null);
    setDeleteConfirmationText("");
  }

  function updateClientContact(index: number, field: keyof ClientContactForm, value: string) {
    const nextValue = field === "phone" ? formatPhone(value) : value;

    setClientForm((current) => ({
      ...current,
      contacts: current.contacts.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [field]: nextValue } : contact
      )
    }));
  }

  function addClientContact() {
    setClientForm((current) => ({
      ...current,
      contacts: [...current.contacts, { ...emptyClientContact }]
    }));
  }

  function removeClientContact(index: number) {
    const contact = clientForm.contacts[index];
    if (contact?.id) {
      setDeleteConfirmationText("");
      setPendingDelete({
        type: "contact",
        index,
        contactName: contact.name || `Contato ${index + 1}`
      });
      return;
    }

    removeClientContactImmediately(index);
  }

  function removeClientContactImmediately(index: number) {
    const removedContactId = clientForm.contacts[index]?.id;

    setClientForm((current) => ({
      ...current,
      contacts: current.contacts.length === 1
        ? [{ ...emptyClientContact }]
        : current.contacts.filter((_, contactIndex) => contactIndex !== index)
    }));

    if (removedContactId) {
      setDeletedContactIds((current) => [...current, removedContactId]);
    }
  }

  function resetProfessionalForm() {
    setProfessionalForm({ ...emptyProfessionalForm });
    setEditingProfessionalId(null);
    setProfessionalsError("");
  }

  function openNewProfessionalModal() {
    resetProfessionalForm();
    setIsProfessionalModalOpen(true);
  }

  function openProfessionalDetails(professional: Professional) {
    setSelectedProfessional(professional);
  }

  function openEditProfessionalModal(professional: Professional) {
    setProfessionalForm({
      full_name: professional.full_name,
      email: professional.email,
      whatsapp: professional.whatsapp || "",
      function: professional.function
    });
    setEditingProfessionalId(professional.id);
    setProfessionalsError("");
    setIsProfessionalModalOpen(true);
  }

  async function saveProfessional() {
    setProfessionalsError("");

    if (!professionalForm.full_name.trim()) {
      setProfessionalsError("Informe o nome completo do profissional.");
      return;
    }

    if (!professionalForm.email.trim() || !isValidEmail(professionalForm.email.trim())) {
      setProfessionalsError("Informe um e-mail válido.");
      return;
    }

    if (professionalForm.whatsapp.trim() && !isValidPhone(professionalForm.whatsapp)) {
      setProfessionalsError("Informe um WhatsApp válido.");
      return;
    }

    const duplicatedProfessional = professionals.find((professional) =>
      professional.id !== editingProfessionalId
      && normalizeEmail(professional.email) === normalizeEmail(professionalForm.email)
      && professional.function === professionalForm.function
    );

    if (duplicatedProfessional) {
      setProfessionalsError("Já existe um profissional com este e-mail e função.");
      return;
    }

    if (!isSupabaseConfigured) {
      setProfessionalsError("Supabase não configurado para salvar profissionais.");
      return;
    }

    setIsProfessionalsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const payload = {
      full_name: professionalForm.full_name.trim(),
      email: normalizeEmail(professionalForm.email),
      whatsapp: professionalForm.whatsapp.trim() || null,
      function: professionalForm.function,
      is_active: true
    };

    let professionalId = editingProfessionalId;
    const professionalResult = editingProfessionalId
      ? await supabase.from("professionals").update(payload).eq("id", editingProfessionalId)
      : await supabase.from("professionals").insert(payload).select("id").single<{ id: string }>();

    if (professionalResult.error) {
      setProfessionalsError(professionalResult.error.message);
      setIsProfessionalsLoading(false);
      return;
    }

    if (!editingProfessionalId && "data" in professionalResult && professionalResult.data) {
      professionalId = professionalResult.data.id;
    }

    void writeAuditLog("professionals", professionalId, editingProfessionalId ? "update" : "insert", {
      full_name: payload.full_name,
      email: payload.email,
      function: payload.function
    });

    resetProfessionalForm();
    setIsProfessionalModalOpen(false);
    await loadProfessionals();
  }

  function requestDeleteProfessional(professional: Professional) {
    setProfessionalsError("");
    setDeleteConfirmationText("");
    setPendingDelete({ type: "professional", professional });
  }

  async function deleteProfessional(professional: Professional) {
    setProfessionalsError("");

    if (!isSupabaseConfigured) {
      setProfessionalsError("Supabase não configurado para remover profissionais.");
      return;
    }

    setIsProfessionalsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("professionals")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", professional.id);

    if (error) {
      setProfessionalsError(error.message);
      setIsProfessionalsLoading(false);
      return;
    }

    void writeAuditLog("professionals", professional.id, "soft_delete", {
      full_name: professional.full_name,
      email: professional.email
    });

    if (selectedProfessional?.id === professional.id) {
      setSelectedProfessional(null);
    }

    await loadProfessionals();
  }

  function resetProjectForm() {
    setProjectForm({ ...emptyProjectForm });
    setEditingProjectId(null);
    setProjectsError("");
  }

  function openNewProjectModal() {
    resetProjectForm();
    setProjectForm((current) => ({
      ...current,
      client_id: clients[0]?.id || ""
    }));
    setIsProjectModalOpen(true);
  }

  function openProjectDetails(project: Project) {
    setSelectedProject(project);
  }

  function openEditProjectModal(project: Project) {
    setProjectForm({
      client_id: project.client_id,
      project_number: project.project_number,
      name: project.name,
      description: project.description || "",
      professional_gp_id: project.professional_gp_id || "",
      professional_portfolio_manager_id: project.professional_portfolio_manager_id || "",
      phase: project.phase || "",
      status: project.status,
      starts_on: project.starts_on || "",
      target_ends_on: project.target_ends_on || ""
    });
    setEditingProjectId(project.id);
    setProjectsError("");
    setIsProjectModalOpen(true);
  }

  async function saveProject() {
    setProjectsError("");

    if (!projectForm.client_id) {
      setProjectsError("Selecione o cliente do projeto.");
      return;
    }

    if (!projectForm.project_number.trim()) {
      setProjectsError("Informe o número do projeto.");
      return;
    }

    if (!projectForm.name.trim()) {
      setProjectsError("Informe o nome do projeto.");
      return;
    }

    const duplicatedProject = projectsData.find((project) =>
      project.id !== editingProjectId
      && project.client_id === projectForm.client_id
      && project.project_number.trim().toLocaleLowerCase("pt-BR") === projectForm.project_number.trim().toLocaleLowerCase("pt-BR")
    );

    if (duplicatedProject) {
      setProjectsError("Este cliente já possui um projeto com este número.");
      return;
    }

    if (!isSupabaseConfigured) {
      setProjectsError("Supabase não configurado para salvar projetos.");
      return;
    }

    setIsProjectsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const payload = {
      client_id: projectForm.client_id,
      project_number: projectForm.project_number.trim(),
      name: projectForm.name.trim(),
      description: projectForm.description.trim() || null,
      professional_gp_id: projectForm.professional_gp_id || null,
      professional_portfolio_manager_id: projectForm.professional_portfolio_manager_id || null,
      gp_id: null,
      portfolio_manager_id: null,
      phase: projectForm.phase.trim() || null,
      status: projectForm.status,
      starts_on: projectForm.starts_on || null,
      target_ends_on: projectForm.target_ends_on || null
    };

    let projectId = editingProjectId;
    const projectResult = editingProjectId
      ? await supabase.from("projects").update(payload).eq("id", editingProjectId)
      : await supabase.from("projects").insert(payload).select("id").single<{ id: string }>();

    if (projectResult.error) {
      setProjectsError(projectResult.error.message);
      setIsProjectsLoading(false);
      return;
    }

    if (!editingProjectId && "data" in projectResult && projectResult.data) {
      projectId = projectResult.data.id;
    }

    void writeAuditLog("projects", projectId, editingProjectId ? "update" : "insert", {
      project_number: payload.project_number,
      name: payload.name,
      client_id: payload.client_id
    });

    resetProjectForm();
    setIsProjectModalOpen(false);
    await loadProjects();
  }

  function requestDeleteProject(project: Project) {
    setProjectsError("");
    setDeleteConfirmationText("");
    setPendingDelete({ type: "project", project });
  }

  async function deleteProject(project: Project) {
    setProjectsError("");

    if (!isSupabaseConfigured) {
      setProjectsError("Supabase não configurado para remover projetos.");
      return;
    }

    setIsProjectsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString(), status: "cancelled" })
      .eq("id", project.id);

    if (error) {
      setProjectsError(error.message);
      setIsProjectsLoading(false);
      return;
    }

    void writeAuditLog("projects", project.id, "soft_delete", {
      project_number: project.project_number,
      name: project.name
    });

    if (selectedProject?.id === project.id) {
      setSelectedProject(null);
    }

    await loadProjects();
  }

  function resetRiskForm() {
    setRiskForm({ ...emptyRiskForm });
    setEditingRiskId(null);
    setRisksError("");
  }

  function openNewRiskModal() {
    resetRiskForm();
    setRiskForm((current) => ({
      ...current,
      project_id: projectsData[0]?.id || ""
    }));
    setIsRiskModalOpen(true);
  }

  function openRiskDetails(risk: Risk) {
    setSelectedRisk(risk);
  }

  function openEditRiskModal(risk: Risk) {
    setRiskForm({
      project_id: risk.project_id,
      group_name: risk.group_name,
      phase: risk.phase || "",
      description: risk.description,
      root_cause: risk.root_cause || "",
      origin: risk.origin || "",
      business_impact: risk.business_impact || "",
      identified_on: risk.identified_on || new Date().toISOString().slice(0, 10),
      main_impact: risk.main_impact || "",
      probability_score: String(risk.probability_score || 3),
      impact_score: String(risk.impact_score || 3),
      response_type: risk.response_type || "mitigate",
      response_plan: risk.response_plan || "",
      external_tool: risk.external_tool || "",
      external_reference_id: risk.external_reference_id || "",
      external_reference_url: risk.external_reference_url || "",
      responsible_name: risk.responsible_name || "",
      status: risk.status,
      closed_on: risk.closed_on || ""
    });
    setEditingRiskId(risk.id);
    setRisksError("");
    setIsRiskModalOpen(true);
  }

  async function saveRisk() {
    setRisksError("");

    if (!riskForm.project_id) {
      setRisksError("Selecione o projeto do risco.");
      return;
    }

    if (!riskForm.group_name) {
      setRisksError("Selecione o grupo do risco.");
      return;
    }

    if (!riskForm.description.trim()) {
      setRisksError("Informe a descrição do risco.");
      return;
    }

    if (!isSupabaseConfigured) {
      setRisksError("Supabase não configurado para salvar riscos.");
      return;
    }

    setIsRisksLoading(true);
    const supabase = getSupabaseBrowserClient();
    const probabilityScore = Number(riskForm.probability_score);
    const impactScore = Number(riskForm.impact_score);
    const nextSequenceNumber = editingRiskId
      ? risksData.find((risk) => risk.id === editingRiskId)?.sequence_number || null
      : Math.max(0, ...risksData
          .filter((risk) => risk.project_id === riskForm.project_id)
          .map((risk) => risk.sequence_number || 0)) + 1;

    const payload = {
      project_id: riskForm.project_id,
      sequence_number: nextSequenceNumber,
      group_name: riskForm.group_name,
      phase: riskForm.phase || null,
      description: riskForm.description.trim(),
      root_cause: riskForm.root_cause.trim() || null,
      origin: riskForm.origin.trim() || null,
      business_impact: riskForm.business_impact.trim() || null,
      identified_on: riskForm.identified_on || new Date().toISOString().slice(0, 10),
      main_impact: riskForm.main_impact.trim() || null,
      probability_score: probabilityScore,
      probability_label: riskScoreLabels[probabilityScore],
      impact_score: impactScore,
      impact_label: riskImpactLabels[impactScore],
      response_type: riskForm.response_type,
      response_plan: riskForm.response_plan.trim() || null,
      external_tool: riskForm.external_tool.trim() || null,
      external_reference_id: riskForm.external_reference_id.trim() || null,
      external_reference_url: riskForm.external_reference_url.trim() || null,
      responsible_name: riskForm.responsible_name.trim() || null,
      status: riskForm.status,
      closed_on: riskForm.closed_on || (riskForm.status === "closed" ? new Date().toISOString().slice(0, 10) : null),
      created_by: profile?.id || null
    };

    let riskId = editingRiskId;
    const riskResult = editingRiskId
      ? await supabase.from("risks").update(payload).eq("id", editingRiskId)
      : await supabase.from("risks").insert(payload).select("id").single<{ id: string }>();

    if (riskResult.error) {
      setRisksError(riskResult.error.message);
      setIsRisksLoading(false);
      return;
    }

    if (!editingRiskId && "data" in riskResult && riskResult.data) {
      riskId = riskResult.data.id;
    }

    void writeAuditLog("risks", riskId, editingRiskId ? "update" : "insert", {
      project_id: payload.project_id,
      group_name: payload.group_name,
      status: payload.status
    });

    resetRiskForm();
    setIsRiskModalOpen(false);
    await loadRisks();
  }

  function requestDeleteRisk(risk: Risk) {
    setRisksError("");
    setDeleteConfirmationText("");
    setPendingDelete({ type: "risk", risk });
  }

  async function deleteRisk(risk: Risk) {
    setRisksError("");

    if (!isSupabaseConfigured) {
      setRisksError("Supabase não configurado para remover riscos.");
      return;
    }

    setIsRisksLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("risks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", risk.id);

    if (error) {
      setRisksError(error.message);
      setIsRisksLoading(false);
      return;
    }

    void writeAuditLog("risks", risk.id, "soft_delete", {
      project_id: risk.project_id,
      sequence_number: risk.sequence_number
    });

    if (selectedRisk?.id === risk.id) {
      setSelectedRisk(null);
    }

    await loadRisks();
  }

  async function registerReportPreview() {
    setReportsError("");

    if (!isSupabaseConfigured || !profile?.id) {
      setReportsError("Supabase não configurado para salvar relatórios.");
      return;
    }

    const selectedReportProject = projectsData.find((project) => project.id === reportProjectId) || null;
    const titleContext = selectedReportProject
      ? `${selectedReportProject.project_number} - ${selectedReportProject.name}`
      : "Visão geral";
    const title = `${reportTypeLabels[reportType]} - ${titleContext}`;

    setIsReportsLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("reports")
      .insert({
        project_id: selectedReportProject?.id ?? null,
        client_id: selectedReportProject?.client_id ?? null,
        report_type: reportType,
        title,
        file_name: null,
        generated_by: profile.id
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      setReportsError(error.message);
      setIsReportsLoading(false);
      return;
    }

    void writeAuditLog("reports", data?.id ?? null, "insert", {
      project_id: selectedReportProject?.id ?? null,
      report_type: reportType,
      title
    });

    await loadReports();
  }

  const displayName = profile?.full_name || profile?.email || "Usuário";
  const isClientProfile = profile?.role === "client";
  const isAdminUsersView = isAdminProfile && activeModule === "Administração";
  const isClientsView = activeModule === "Clientes";
  const isProjectsView = activeModule === "Projetos";
  const isProfessionalsView = activeModule === "Profissionais";
  const isRisksView = activeModule === "Riscos";
  const isReportsView = activeModule === "Relatórios";
  const isPortfolioView = activeModule === "Portfólio";
  const projectManagers = professionals.filter((professional) =>
    ["project_manager", "project_coordinator", "project_lead"].includes(professional.function)
    && professional.is_active
  );
  const portfolioManagers = professionals.filter((professional) =>
    ["portfolio_manager", "project_director"].includes(professional.function)
    && professional.is_active
  );
  const selectedDashboardProject = projectsData.find((project) => project.id === dashboardProjectId) || null;
  const dashboardProjects = selectedDashboardProject ? [selectedDashboardProject] : projectsData;
  const dashboardRisks = selectedDashboardProject
    ? risksData.filter((risk) => risk.project_id === selectedDashboardProject.id)
    : risksData;
  const activeProjects = dashboardProjects.filter((project) => project.status === "active");
  const openRisks = dashboardRisks.filter((risk) => ["open", "in_progress"].includes(risk.status));
  const highRisks = dashboardRisks.filter((risk) => (risk.score || 0) >= 11);
  const extremeRisks = dashboardRisks.filter((risk) => (risk.score || 0) > 16);
  const risksWithoutResponse = dashboardRisks.filter((risk) => !risk.response_plan?.trim() && ["open", "in_progress"].includes(risk.status));
  const filteredDashboardRisks = dashboardMatrixFilter
    ? dashboardRisks.filter((risk) =>
        risk.probability_score === dashboardMatrixFilter.probability
        && risk.impact_score === dashboardMatrixFilter.impact
      )
    : dashboardRisks;
  const priorityRisks = [...filteredDashboardRisks]
    .sort((firstRisk, secondRisk) => (secondRisk.score || 0) - (firstRisk.score || 0))
    .slice(0, 8);
  const matrixFilterLabel = dashboardMatrixFilter
    ? `${riskScoreLabels[dashboardMatrixFilter.probability]} x ${riskImpactLabels[dashboardMatrixFilter.impact]}`
    : "";
  const severitySummary = [
    { label: "Extremos", count: extremeRisks.length },
    { label: "Altos", count: dashboardRisks.filter((risk) => (risk.score || 0) >= 11 && (risk.score || 0) <= 16).length },
    { label: "Moderados", count: dashboardRisks.filter((risk) => (risk.score || 0) >= 5 && (risk.score || 0) <= 10).length },
    { label: "Baixos", count: dashboardRisks.filter((risk) => (risk.score || 0) > 0 && (risk.score || 0) < 5).length }
  ];
  const probabilityAxis = [1, 2, 3, 4, 5];
  const impactAxis = [5, 4, 3, 2, 1];
  const riskMatrixCells = impactAxis.flatMap((impact) =>
    probabilityAxis.map((probability) => {
      const cellRisks = dashboardRisks.filter((risk) =>
        risk.probability_score === probability && risk.impact_score === impact
      );
      const score = probability * impact;
      return {
        key: `${probability}-${impact}`,
        probability,
        impact,
        score,
        count: cellRisks.length,
        severityClass: getRiskSeverityClass(score)
      };
    })
  );
  const clientRiskSummary = clients
    .map((client) => {
      const clientProjects = dashboardProjects.filter((project) => project.client_id === client.id);
      const clientProjectIds = new Set(clientProjects.map((project) => project.id));
      const clientRisks = dashboardRisks.filter((risk) => clientProjectIds.has(risk.project_id));
      return {
        client,
        projects: clientProjects.length,
        total: clientRisks.length,
        high: clientRisks.filter((risk) => (risk.score || 0) >= 11).length,
        exposure: clientRisks.reduce((sum, risk) => sum + (risk.score || 0), 0)
      };
    })
    .filter((summary) => summary.projects > 0 || summary.total > 0)
    .sort((firstClient, secondClient) => secondClient.exposure - firstClient.exposure)
    .slice(0, 5);
  const dashboardTitle = selectedDashboardProject ? `Dashboard do Projeto` : isPortfolioView ? "Portfólio" : "Dashboard";
  const dashboardContextLabel = selectedDashboardProject
    ? `${selectedDashboardProject.project_number} · ${selectedDashboardProject.name}`
    : "Visão geral";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className={`${isSignedIn ? "page authenticated" : "page login-only"} theme-${theme}`}>
      {isProfileLoading ? (
        <section className="login-preview">
          <div className="login-panel loading-panel">
            <div className="loading-mark">K</div>
            <strong>Carregando seu workspace...</strong>
          </div>
        </section>
      ) : !isSignedIn ? (
      <section className="login-preview">
        <div className="login-panel">
          <div>
            <p className="eyebrow">Acesso seguro</p>
            <h1>K-RiskHub</h1>
            <p className="muted">Gestão moderna de riscos em projetos, clientes e portfólios.</p>
          </div>

          <div className="login-actions">
            <button className="oauth-button primary-oauth" disabled={isLoading} onClick={() => signInWithOAuth("azure")}>
              <PanelsTopLeft size={18} />
              Entrar com Microsoft
            </button>
            <button className="oauth-button" disabled={isLoading} onClick={() => signInWithOAuth("google")}>
              <Mail size={18} />
              Entrar com Google
            </button>
          </div>

          <div className="field-stack">
            <label>
              E-mail
              <input
                type="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="button full" disabled={isLoading} onClick={signInWithEmail}>
              <KeyRound size={16} />
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
            <button className="reset-link" type="button" onClick={resetPassword}>
              Esqueci minha senha
            </button>
            {authMessage ? <p className="auth-message">{authMessage}</p> : null}
            {!isSupabaseConfigured ? (
              <p className="auth-note">
                Preview local ativo. Preencha a anon key para autenticar pelo Supabase.
              </p>
            ) : null}
          </div>
        </div>
      </section>
      ) : (
      <section className="app-shell">
        <aside className="sidebar">
          <div>
            <div className="brand">
              <div className="brand-mark">K</div>
              <div>
                <strong>K-RiskHub</strong>
                <span>Project Risk Management</span>
              </div>
            </div>

            <nav className="nav">
              {visibleNav.map((item) => (
                <button
                  className={activeModule === item.label ? "nav-item active" : "nav-item"}
                  key={item.label}
                  onClick={() => setActiveModule(item.label)}
                  type="button"
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="sidebar-footer">
            <button className="ghost-button sidebar-signout" onClick={signOut}>Sair</button>
          </div>
        </aside>

        <div className="workspace">
          <header className="topbar">
            {!isClientProfile ? (
              <div className="context-select">
                <span>Portfólio</span>
                <strong>Todos os clientes</strong>
                <ChevronDown size={16} />
              </div>
            ) : null}
            <div className="topbar-actions">
              <div className="search">
                <Search size={16} />
                <input placeholder="Buscar clientes, projetos ou riscos" />
              </div>
              <button
                aria-pressed={theme === "dark"}
                className="theme-toggle"
                onClick={toggleTheme}
                title="Alternar tema"
                type="button"
              >
                <span aria-label="Tema claro" className={theme === "light" ? "active" : ""} title="Tema claro">
                  <Sun size={14} />
                </span>
                <span aria-label="Tema escuro" className={theme === "dark" ? "active" : ""} title="Tema escuro">
                  <Moon size={14} />
                </span>
              </button>
              <button
                aria-label="Meu perfil"
                className="icon-user"
                onClick={() => setIsAccountOpen(true)}
                title="Meu perfil"
                type="button"
              >
                <CircleUserRound size={20} />
              </button>
            </div>
          </header>

          <section className="content">
            <div className="section-header">
              <div>
                <p className="eyebrow">Visão geral</p>
                <h2>{isAdminUsersView ? "Administração" : isClientsView ? "Clientes" : isProjectsView ? "Projetos" : isProfessionalsView ? "Profissionais" : isRisksView ? "Riscos" : isReportsView ? "Relatórios" : dashboardTitle}</h2>
                {(!isAdminUsersView && !isClientsView && !isProjectsView && !isProfessionalsView && !isRisksView && !isReportsView) ? (
                  <span className="dashboard-context">{dashboardContextLabel}</span>
                ) : null}
              </div>
              {isAdminUsersView ? (
                <button className="ghost-button" onClick={loadAdminUsers}>
                  Atualizar
                </button>
              ) : isClientsView && isAdminProfile ? (
                <button
                  className="button"
                  onClick={openNewClientModal}
                >
                  <Plus size={16} />
                  Novo cliente
                </button>
              ) : isProjectsView && isAdminProfile ? (
                <button
                  className="button"
                  onClick={openNewProjectModal}
                >
                  <Plus size={16} />
                  Novo projeto
                </button>
              ) : isProfessionalsView && isAdminProfile ? (
                <button
                  className="button"
                  onClick={openNewProfessionalModal}
                >
                  <Plus size={16} />
                  Novo profissional
                </button>
              ) : isRisksView && isAdminProfile ? (
                <button
                  className="button"
                  onClick={openNewRiskModal}
                >
                  <Plus size={16} />
                  Novo risco
                </button>
              ) : !isClientsView && !isProjectsView && !isProfessionalsView && !isRisksView && !isReportsView && !isAdminUsersView ? (
                <label className="dashboard-selector">
                  <span>Visualização</span>
                  <select
                    value={selectedDashboardProject ? selectedDashboardProject.id : "all"}
                    onChange={(event) => {
                      setDashboardProjectId(event.target.value);
                      setDashboardMatrixFilter(null);
                    }}
                  >
                    <option value="all">Visão geral</option>
                    {projectsData.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_number} - {project.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            {isAdminUsersView ? (
              <>
                <div className="metric-grid compact-metrics">
                  <article className="metric">
                    <CircleUserRound size={15} />
                    <span>Usuários</span>
                    <strong>{adminUsers.length}</strong>
                  </article>
                  <article className="metric">
                    <ShieldCheck size={15} />
                    <span>Admins</span>
                    <strong>{adminUsers.filter((user) => user.role === "admin").length}</strong>
                  </article>
                  <article className="metric">
                    <Building2 size={15} />
                    <span>Clientes</span>
                    <strong>{adminUsers.filter((user) => user.role === "client").length}</strong>
                  </article>
                  <article className="metric">
                    <ListChecks size={15} />
                    <span>Ativos</span>
                    <strong>{adminUsers.filter((user) => user.is_active).length}</strong>
                  </article>
                </div>

                <article className="surface">
                  <div className="surface-header">
                    <div>
                      <h3>Usuários</h3>
                      <p>Perfis cadastrados no Supabase.</p>
                    </div>
                  </div>

                  {adminUsersError ? <p className="auth-message">{adminUsersError}</p> : null}
                  {isAdminUsersLoading ? (
                    <div className="empty-state">
                      <CircleUserRound size={20} />
                      <strong>Carregando usuários</strong>
                      <span>Consultando perfis cadastrados.</span>
                    </div>
                  ) : (
                    <div className="table">
                      <div className="table-row table-head admin-users-row">
                        <span>Nome</span>
                        <span>E-mail</span>
                        <span>Perfil</span>
                        <span>Status</span>
                        <span>Último acesso</span>
                      </div>
                      {adminUsers.map((user) => (
                        <div className="table-row admin-users-row" key={user.id}>
                          <span>
                            <strong>{user.full_name || "Sem nome"}</strong>
                            <small>{user.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "Sem data"}</small>
                          </span>
                          <span>{user.email}</span>
                          <span>{roleLabels[user.role]}</span>
                          <span>
                            <StatusPill status={user.is_active ? "Ativo" : "Inativo"} />
                          </span>
                          <span>{user.last_seen_at ? new Date(user.last_seen_at).toLocaleString("pt-BR") : "Primeiro acesso"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </>
            ) : isClientsView ? (
              <ClientsModule
                clients={clients}
                clientsError={clientsError}
                clientStatusView={clientStatusView}
                isClientsLoading={isClientsLoading}
                isClientModalOpen={isClientModalOpen}
                selectedClient={selectedClient}
                editingClientId={editingClientId}
                clientForm={clientForm}
                onStatusViewChange={setClientStatusView}
                onLoadClients={loadClients}
                onOpenClientDetails={openClientDetails}
                onCloseClientDetails={() => setSelectedClient(null)}
                onOpenEditClientModal={(client) => {
                  setSelectedClient(null);
                  openEditClientModal(client);
                }}
                onRequestDeleteClient={requestDeleteClient}
                onCloseClientModal={() => {
                  resetClientForm();
                  setIsClientModalOpen(false);
                }}
                onClientFormChange={setClientForm}
                onAddClientContact={addClientContact}
                onRemoveClientContact={removeClientContact}
                onUpdateClientContact={updateClientContact}
                onSaveClient={saveClient}
              />
            ) : isProfessionalsView ? (
              <ProfessionalsModule
                professionals={professionals}
                projectsData={projectsData}
                professionalsError={professionalsError}
                isProfessionalsLoading={isProfessionalsLoading}
                isProfessionalModalOpen={isProfessionalModalOpen}
                selectedProfessional={selectedProfessional}
                editingProfessionalId={editingProfessionalId}
                professionalForm={professionalForm}
                isAdminProfile={Boolean(isAdminProfile)}
                onLoadProfessionals={loadProfessionals}
                onOpenProfessionalDetails={openProfessionalDetails}
                onCloseProfessionalDetails={() => setSelectedProfessional(null)}
                onOpenEditProfessionalModal={(professional) => {
                  setSelectedProfessional(null);
                  openEditProfessionalModal(professional);
                }}
                onRequestDeleteProfessional={requestDeleteProfessional}
                onCloseProfessionalModal={() => {
                  resetProfessionalForm();
                  setIsProfessionalModalOpen(false);
                }}
                onProfessionalFormChange={setProfessionalForm}
                onSaveProfessional={saveProfessional}
              />
            ) : isProjectsView ? (
              <ProjectsModule
                projectsData={projectsData}
                clients={clients}
                projectManagers={projectManagers}
                portfolioManagers={portfolioManagers}
                projectsError={projectsError}
                isProjectsLoading={isProjectsLoading}
                isProjectModalOpen={isProjectModalOpen}
                selectedProject={selectedProject}
                editingProjectId={editingProjectId}
                projectForm={projectForm}
                isAdminProfile={Boolean(isAdminProfile)}
                onLoadProjects={loadProjects}
                onOpenProjectDetails={openProjectDetails}
                onCloseProjectDetails={() => setSelectedProject(null)}
                onOpenEditProjectModal={(project) => {
                  setSelectedProject(null);
                  openEditProjectModal(project);
                }}
                onRequestDeleteProject={requestDeleteProject}
                onCloseProjectModal={() => {
                  resetProjectForm();
                  setIsProjectModalOpen(false);
                }}
                onProjectFormChange={setProjectForm}
                onSaveProject={saveProject}
              />
            ) : isRisksView ? (
              <RisksModule
                risksData={risksData}
                projectsData={projectsData}
                risksError={risksError}
                isRisksLoading={isRisksLoading}
                isRiskModalOpen={isRiskModalOpen}
                selectedRisk={selectedRisk}
                editingRiskId={editingRiskId}
                riskForm={riskForm}
                isAdminProfile={Boolean(isAdminProfile)}
                onLoadRisks={loadRisks}
                onOpenRiskDetails={openRiskDetails}
                onCloseRiskDetails={() => setSelectedRisk(null)}
                onOpenEditRiskModal={(risk) => {
                  setSelectedRisk(null);
                  openEditRiskModal(risk);
                }}
                onRequestDeleteRisk={requestDeleteRisk}
                onCloseRiskModal={() => {
                  resetRiskForm();
                  setIsRiskModalOpen(false);
                }}
                onRiskFormChange={setRiskForm}
                onSaveRisk={saveRisk}
              />
            ) : isReportsView ? (
              <ReportsModule
                projectsData={projectsData}
                risksData={risksData}
                reportsData={reportsData}
                reportsError={reportsError}
                isReportsLoading={isReportsLoading}
                reportProjectId={reportProjectId}
                reportType={reportType}
                canRegisterReport={!isClientProfile && (Boolean(isAdminProfile) || reportProjectId !== "all")}
                onReportProjectChange={setReportProjectId}
                onReportTypeChange={setReportType}
                onLoadReports={loadReports}
                onRegisterReport={registerReportPreview}
              />
            ) : (
              <>
                <div className="metric-grid compact-metrics">
                  <article className="metric">
                    <BriefcaseBusiness size={15} />
                    <span>Projetos ativos</span>
                    <strong>{activeProjects.length}</strong>
                  </article>
                  <article className="metric">
                    <TriangleAlert size={15} />
                    <span>Riscos altos/extremos</span>
                    <strong>{highRisks.length}</strong>
                  </article>
                  <article className="metric">
                    <ListChecks size={15} />
                    <span>Riscos em aberto</span>
                    <strong>{openRisks.length}</strong>
                  </article>
                  <article className="metric">
                    <Building2 size={15} />
                    <span>Sem resposta</span>
                    <strong>{risksWithoutResponse.length}</strong>
                  </article>
                </div>

                <div className="dashboard-grid dashboard-grid-single">
                  <article className="surface risk-matrix-surface">
                    <div className="surface-header">
                      <div>
                        <h3>Matriz probabilidade x impacto</h3>
                        <p>Mapa de concentração dos riscos por score e gravidade.</p>
                      </div>
                    </div>
                    <div className="risk-matrix-wrap" aria-label="Matriz de probabilidade por impacto">
                      <div className="risk-matrix">
                        <div className="risk-matrix-corner" />
                        {probabilityAxis.map((probability) => (
                          <div className="risk-matrix-axis" key={`probability-${probability}`}>
                            {riskScoreLabels[probability]}
                          </div>
                        ))}
                        {impactAxis.map((impact) => (
                          <Fragment key={`impact-row-${impact}`}>
                            <div className="risk-matrix-axis risk-matrix-impact">
                              {riskImpactLabels[impact]}
                            </div>
                            {riskMatrixCells
                              .filter((cell) => cell.impact === impact)
                              .map((cell) => (
                                <button
                                  aria-label={`${cell.count} risco${cell.count === 1 ? "" : "s"} com probabilidade ${riskScoreLabels[cell.probability]} e impacto ${riskImpactLabels[cell.impact]}`}
                                  className={`risk-matrix-cell matrix-${cell.severityClass}${dashboardMatrixFilter?.probability === cell.probability && dashboardMatrixFilter?.impact === cell.impact ? " is-selected" : ""}`}
                                  disabled={cell.count === 0}
                                  key={cell.key}
                                  onClick={() => setDashboardMatrixFilter((currentFilter) =>
                                    currentFilter?.probability === cell.probability && currentFilter?.impact === cell.impact
                                      ? null
                                      : { probability: cell.probability, impact: cell.impact }
                                  )}
                                  title={`Score ${cell.score} · ${cell.count} risco${cell.count === 1 ? "" : "s"}`}
                                  type="button"
                                >
                                  {cell.count > 0 ? <strong>{cell.count}</strong> : <span />}
                                </button>
                              ))}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="risk-matrix-footer">
                      {severitySummary.map((item) => (
                        <span key={item.label}>
                          <i className={`matrix-dot matrix-${item.label.toLowerCase()}`} />
                          {item.label}: {item.count}
                        </span>
                      ))}
                    </div>
                  </article>
                </div>

                <article className="surface dashboard-priority-surface">
                  <div className="surface-header dashboard-priority-header">
                    <div>
                      <h3>Riscos prioritários</h3>
                      <p>
                        {dashboardMatrixFilter
                          ? `Filtrados pela matriz: ${matrixFilterLabel}.`
                          : "Riscos mais críticos do contexto selecionado."}
                      </p>
                    </div>
                    <div className="dashboard-priority-actions">
                      {dashboardMatrixFilter ? (
                        <button className="ghost-button" onClick={() => setDashboardMatrixFilter(null)} type="button">
                          Limpar filtro
                        </button>
                      ) : null}
                      <button className="ghost-button" onClick={() => setActiveModule("Riscos")} type="button">Abrir riscos</button>
                    </div>
                  </div>
                  {priorityRisks.length === 0 ? (
                    <div className="empty-state">
                      <TriangleAlert size={20} />
                      <strong>Nenhum risco encontrado</strong>
                      <span>
                        {dashboardMatrixFilter
                          ? "Não há riscos cadastrados nesta célula da matriz."
                          : "Os riscos mais críticos aparecerão aqui após o cadastro."}
                      </span>
                    </div>
                  ) : (
                    <div className="dashboard-risk-list">
                      {priorityRisks.map((risk) => (
                        <button className="dashboard-risk-card" key={risk.id} onClick={() => openRiskDetails(risk)} type="button">
                          <span className="risk-id">{risk.sequence_number ? `#${risk.sequence_number}` : "-"}</span>
                          <div className="dashboard-risk-copy">
                            <strong>{risk.description}</strong>
                            <small>
                              {risk.projects?.project_number || "Sem projeto"} · {risk.group_name} · {risk.responsible_name || "Sem responsável"}
                            </small>
                          </div>
                          <span className="score">{risk.score || "-"}</span>
                          <span className="status-pill">{getRiskSeverity(risk.score)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </article>

                {!isClientProfile ? (
                  <div className="dashboard-grid dashboard-grid-single">
                    <article className="surface">
                      <div className="surface-header">
                        <div>
                          <h3>Clientes por exposição</h3>
                          <p>Consolidação por cliente e projetos associados.</p>
                        </div>
                      </div>
                      {clientRiskSummary.length === 0 ? (
                        <div className="empty-state">
                          <Building2 size={20} />
                          <strong>Nenhum cliente com risco registrado</strong>
                          <span>O consolidado será exibido quando houver projetos e riscos associados.</span>
                        </div>
                      ) : (
                        <div className="table dashboard-clients-table">
                          <div className="table-row table-head dashboard-client-row">
                            <span>Cliente</span>
                            <span>Projetos</span>
                            <span>Riscos</span>
                            <span>Altos</span>
                            <span>Exposição</span>
                          </div>
                          {clientRiskSummary.map((summary) => (
                            <div className="table-row dashboard-client-row" key={summary.client.id}>
                              <span>
                                <strong>{summary.client.name}</strong>
                                <small>{summary.client.status === "active" ? "Ativo" : "Inativo"}</small>
                              </span>
                              <span>{summary.projects}</span>
                              <span>{summary.total}</span>
                              <span>{summary.high}</span>
                              <span className="score">{summary.exposure}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  </div>
                ) : null}

                {risksWithoutResponse.length > 0 ? (
                  <article className="surface">
                    <div className="surface-header">
                      <div>
                        <h3>Riscos sem resposta planejada</h3>
                        <p>Itens abertos que precisam de estratégia ou ação registrada.</p>
                      </div>
                    </div>
                    <div className="table dashboard-actions-table">
                      <div className="table-row table-head dashboard-action-row">
                        <span>ID</span>
                        <span>Risco</span>
                        <span>Projeto</span>
                        <span>Status</span>
                        <span>Score</span>
                      </div>
                      {risksWithoutResponse.slice(0, 5).map((risk) => (
                        <div className="table-row dashboard-action-row" key={risk.id}>
                          <span className="mono">{risk.sequence_number ? `#${risk.sequence_number}` : "-"}</span>
                          <span>
                            <button className="link-button" onClick={() => openRiskDetails(risk)} type="button">
                              {risk.description}
                            </button>
                            <small>{risk.group_name}</small>
                          </span>
                          <span>{risk.projects?.project_number || "Sem projeto"}</span>
                          <span>
                            <StatusPill status={riskStatusLabels[risk.status]} />
                          </span>
                          <span className="score">{risk.score || "-"}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                ) : null}

                {selectedRisk ? (
                  <RiskDetailsModal
                    selectedRisk={selectedRisk}
                    isAdminProfile={Boolean(isAdminProfile)}
                    onCloseRiskDetails={() => setSelectedRisk(null)}
                    onOpenEditRiskModal={(risk) => {
                      setSelectedRisk(null);
                      openEditRiskModal(risk);
                    }}
                  />
                ) : null}
              </>
            )}
          </section>
        </div>
      </section>
      )}
      {isAccountOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsAccountOpen(false)}>
          <section
            aria-labelledby="account-title"
            className="modal account-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Conta</p>
                <h3 id="account-title">Meu perfil</h3>
              </div>
              <button className="icon-button" aria-label="Fechar" onClick={() => setIsAccountOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="profile-summary modal-profile-summary">
              <div className="profile-card large">
                <div className="avatar large-avatar">{initials || "U"}</div>
                <div>
                  <p className="eyebrow">Resumo da conta</p>
                  <h3>{displayName}</h3>
                  <span>{profile?.email}</span>
                </div>
              </div>
              <div className="profile-detail-grid">
                <div className="profile-detail-card">
                  <span>Perfil</span>
                  <strong>{profile ? roleLabels[profile.role] : "Não definido"}</strong>
                </div>
                <div className="profile-detail-card">
                  <span>Status</span>
                  <strong>{profile?.is_active ? "Ativo" : "Inativo"}</strong>
                </div>
                <div className="profile-detail-card">
                  <span>Último acesso</span>
                  <strong>{profile?.last_seen_at ? new Date(profile.last_seen_at).toLocaleDateString("pt-BR") : "Primeiro acesso"}</strong>
                </div>
              </div>
            </div>

            <p className="muted">{profile ? roleDescriptions[profile.role] : "Perfil ainda não carregado."}</p>
            <div className="permission-list">
              {visibleNav.map((item) => (
                <span key={item.label}>
                  <item.icon size={15} />
                  {item.label}
                </span>
              ))}
            </div>
          </section>
        </div>
      ) : null}
      {pendingDelete ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            setPendingDelete(null);
            setDeleteConfirmationText("");
          }}
        >
          <section
            aria-labelledby="delete-confirmation-title"
            className="modal delete-confirmation-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Confirmação</p>
                <h3 id="delete-confirmation-title">
                  Remover {pendingDelete.type === "client" ? "cliente" : pendingDelete.type === "project" ? "projeto" : pendingDelete.type === "professional" ? "profissional" : pendingDelete.type === "risk" ? "risco" : "contato"}
                </h3>
              </div>
              <button
                className="icon-button"
                aria-label="Fechar"
                onClick={() => {
                  setPendingDelete(null);
                  setDeleteConfirmationText("");
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p className="muted">
              {pendingDelete.type === "client"
                ? `Esta ação removerá o cliente "${pendingDelete.client.name}" e seus contatos vinculados.`
                : pendingDelete.type === "project"
                  ? `Esta ação removerá o projeto "${pendingDelete.project.name}" e seus vínculos dependentes.`
                  : pendingDelete.type === "professional"
                    ? `Esta ação removerá o profissional "${pendingDelete.professional.full_name}".`
                    : pendingDelete.type === "risk"
                      ? `Esta ação removerá o risco "${pendingDelete.risk.sequence_number ? `#${pendingDelete.risk.sequence_number}` : pendingDelete.risk.description}".`
                      : `Esta ação removerá o contato "${pendingDelete.contactName}" deste cliente.`}
            </p>
            <label className="confirm-delete-field">
              Digite remover para confirmar
              <input
                autoFocus
                value={deleteConfirmationText}
                onChange={(event) => setDeleteConfirmationText(event.target.value)}
                placeholder="remover"
              />
            </label>
            <div className="modal-actions">
              <button
                className="ghost-button"
                onClick={() => {
                  setPendingDelete(null);
                  setDeleteConfirmationText("");
                }}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="button danger-button"
                disabled={deleteConfirmationText.trim().toLocaleLowerCase("pt-BR") !== "remover" || isClientsLoading || isProjectsLoading || isProfessionalsLoading || isRisksLoading}
                onClick={confirmPendingDelete}
                type="button"
              >
                <Trash2 size={16} />
                {isClientsLoading || isProjectsLoading || isProfessionalsLoading || isRisksLoading ? "Removendo..." : "Remover"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
