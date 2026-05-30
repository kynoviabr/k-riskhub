"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleUserRound,
  Download,
  Eye,
  FileText,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Mail,
  Moon,
  PanelsTopLeft,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  TriangleAlert,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: "admin" | "gp" | "client" | "portfolio_manager" | "director";
  is_active: boolean;
  last_seen_at: string | null;
};

type AdminUser = Profile & {
  created_at: string | null;
};

type Client = {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  status: string;
  notes: string | null;
  created_at: string | null;
  client_contacts?: ClientContact[];
};

type ClientContact = {
  id?: string;
  client_id?: string;
  name: string;
  role_title: string | null;
  phone: string | null;
  email: string | null;
  is_primary?: boolean;
};

type ClientContactForm = {
  id?: string;
  name: string;
  role_title: string;
  phone: string;
  email: string;
};

type PendingDelete =
  | { type: "client"; client: Client }
  | { type: "contact"; index: number; contactName: string };

const projects = [
  {
    number: "PRJ-2026-014",
    name: "SAP S/4HANA Upgrade",
    client: "Empresa XYZ",
    gp: "João Silva",
    phase: "3 - Realize",
    risks: 12,
    critical: 8,
    status: "Ativo"
  },
  {
    number: "PRJ-2026-019",
    name: "Rollout fiscal",
    client: "Grupo Atlante",
    gp: "Marina Costa",
    phase: "2 - Explore",
    risks: 7,
    critical: 2,
    status: "Ativo"
  },
  {
    number: "PRJ-2026-022",
    name: "Integração BTP",
    client: "Norte Energia",
    gp: "Rafael Lima",
    phase: "1 - Prepare",
    risks: 5,
    critical: 1,
    status: "Planejado"
  }
];

const risks = [
  {
    id: 1,
    title: "Ausência de equipe técnica especializada para pontos críticos SAP",
    group: "Técnico",
    project: "PRJ-2026-014",
    owner: "GP",
    score: 16,
    severity: "Alto",
    status: "Em andamento"
  },
  {
    id: 6,
    title: "Quebra de integrações com sistemas legados, APIs externas ou EDI",
    group: "Técnico",
    project: "PRJ-2026-014",
    owner: "Arquitetura",
    score: 16,
    severity: "Alto",
    status: "Em andamento"
  },
  {
    id: 11,
    title: "Mudanças no escopo durante o projeto",
    group: "Estratégico",
    project: "PRJ-2026-014",
    owner: "Comitê",
    score: 16,
    severity: "Alto",
    status: "Em andamento"
  }
];

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Clientes", icon: Building2 },
  { label: "Projetos", icon: BriefcaseBusiness },
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

const emptyClientContact: ClientContactForm = {
  name: "",
  role_title: "",
  phone: "",
  email: ""
};

function formatPhone(value: string) {
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const nationalDigits = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  return nationalDigits.length === 10 || nationalDigits.length === 11;
}

function hasContactData(contact: ClientContactForm) {
  return Boolean(contact.name.trim() || contact.role_title.trim() || contact.phone.trim() || contact.email.trim());
}

function SeverityBadge({ label }: { label: string }) {
  return <span className={`badge badge-${label.toLowerCase()}`}>{label}</span>;
}

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
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, legal_name, tax_id, status, notes, created_at, client_contacts(id, name, role_title, phone, email, is_primary)")
      .order("name", { ascending: true })
      .returns<Client[]>();

    if (error) {
      setClientsError(error.message);
      setClients([]);
      setIsClientsLoading(false);
      return;
    }

    setClients(data ?? []);
    setIsClientsLoading(false);
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
    if (activeModule === "Clientes") {
      void loadClients();
    }
  }, [activeModule, loadAdminUsers, loadClients]);

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
        .delete()
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
    const { error } = await supabase.from("clients").delete().eq("id", client.id);

    if (error) {
      setClientsError(error.message);
      setIsClientsLoading(false);
      return;
    }

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

  const displayName = profile?.full_name || profile?.email || "Usuário";
  const isClientProfile = profile?.role === "client";
  const isAdminUsersView = isAdminProfile && activeModule === "Administração";
  const isClientsView = activeModule === "Clientes";
  const visibleProjects = isClientProfile
    ? projects.map((project) => ({ ...project, client: displayName }))
    : projects;
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
                <span>Workspace de riscos</span>
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
                <h2>{isAdminUsersView ? "Administração" : isClientsView ? "Clientes" : "Dashboard"}</h2>
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
              ) : !isClientProfile ? (
                <button className="button">
                  <Plus size={16} />
                  Solicitar vínculo
                </button>
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
              <>
                <div className="metric-grid compact-metrics">
                  <article className="metric">
                    <Building2 size={15} />
                    <span>Clientes</span>
                    <strong>{clients.length}</strong>
                  </article>
                  <article className="metric">
                    <ListChecks size={15} />
                    <span>Ativos</span>
                    <strong>{clients.filter((client) => client.status === "active").length}</strong>
                  </article>
                  <article className="metric">
                    <BriefcaseBusiness size={15} />
                    <span>Com projetos</span>
                    <strong>0</strong>
                  </article>
                  <article className="metric">
                    <TriangleAlert size={15} />
                    <span>Com riscos críticos</span>
                    <strong>0</strong>
                  </article>
                </div>

                <article className="surface">
                  <div className="surface-header">
                    <div>
                      <h3>Clientes</h3>
                      <p>Cadastro corporativo para vincular projetos, responsáveis e permissões.</p>
                    </div>
                    <button className="ghost-button" onClick={loadClients}>
                      Atualizar
                    </button>
                  </div>

                  {clientsError && !isClientModalOpen ? <p className="auth-message">{clientsError}</p> : null}
                  {isClientsLoading ? (
                    <div className="empty-state">
                      <Building2 size={20} />
                      <strong>Carregando clientes</strong>
                      <span>Consultando cadastros liberados para o seu perfil.</span>
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="empty-state">
                      <Building2 size={20} />
                      <strong>Nenhum cliente cadastrado</strong>
                      <span>Crie o primeiro cliente para começar a estruturar projetos e vínculos.</span>
                    </div>
                  ) : (
                    <div className="table clients-table">
                      <div className="table-row table-head clients-row">
                        <span>Cliente</span>
                        <span>Contato principal</span>
                        <span>Cargo</span>
                        <span>E-mail</span>
                        <span>Status</span>
                        <span>Telefone</span>
                        <span>Ações</span>
                      </div>
                      {clients.map((client) => (
                        (() => {
                          const primaryContact = client.client_contacts?.find((contact) => contact.is_primary)
                            || client.client_contacts?.[0];

                          return (
                            <div className="table-row clients-row" key={client.id}>
                              <span>
                                <button className="link-button" onClick={() => openClientDetails(client)} type="button">
                                  {client.name}
                                </button>
                                <small>{client.notes || "Sem observações"}</small>
                              </span>
                              <span>{primaryContact?.name || "Sem contato"}</span>
                              <span>{primaryContact?.role_title || "Não informado"}</span>
                              <span>{primaryContact?.email || "Não informado"}</span>
                              <span>
                                <StatusPill status={client.status === "active" ? "Ativo" : "Inativo"} />
                              </span>
                              <span>{primaryContact?.phone || "Não informado"}</span>
                              <span className="table-actions">
                                <button
                                  aria-label={`Ver detalhes de ${client.name}`}
                                  className="icon-button small-icon-button"
                                  onClick={() => openClientDetails(client)}
                                  title="Ver detalhes"
                                  type="button"
                                >
                                  <Eye size={14} />
                                </button>
                                <button className="ghost-button compact-button" onClick={() => openEditClientModal(client)} type="button">
                                  <Pencil size={14} />
                                  Editar
                                </button>
                                <button
                                  aria-label={`Remover ${client.name}`}
                                  className="icon-button small-icon-button danger-icon-button"
                                  onClick={() => requestDeleteClient(client)}
                                  title="Remover cliente"
                                  type="button"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </span>
                            </div>
                          );
                        })()
                      ))}
                    </div>
                  )}
                </article>
              </>
            ) : (
              <>
                <div className="metric-grid compact-metrics">
                  <article className="metric">
                    <BriefcaseBusiness size={15} />
                    <span>Projetos ativos</span>
                    <strong>18</strong>
                  </article>
                  <article className="metric">
                    <TriangleAlert size={15} />
                    <span>Riscos de alto impacto</span>
                    <strong>31</strong>
                  </article>
                  <article className="metric">
                    <ListChecks size={15} />
                    <span>Planos em atraso</span>
                    <strong>9</strong>
                  </article>
                  <article className="metric">
                    <Building2 size={15} />
                    <span>{isClientProfile ? "Projetos vinculados" : "Clientes monitorados"}</span>
                    <strong>{isClientProfile ? visibleProjects.length : 7}</strong>
                  </article>
                </div>

                {!isClientProfile ? (
                  <div className="project-grid">
                    <article className="surface">
                      <div className="surface-header">
                        <div>
                          <h3>Vínculos</h3>
                          <p>Clientes e projetos serão exibidos aqui.</p>
                        </div>
                      </div>
                      <div className="empty-state">
                        <Building2 size={20} />
                        <strong>Nenhum vínculo cadastrado</strong>
                        <span>Depois do CRUD administrativo, esta área mostrará os clientes e projetos liberados para o usuário.</span>
                      </div>
                    </article>
                  </div>
                ) : null}

                <div className="project-grid">
                  <article className="surface">
                    <div className="surface-header">
                      <div>
                        <h3>Projetos</h3>
                        <p>
                          {isClientProfile
                            ? "Projetos liberados para acompanhamento pelo seu perfil."
                            : "Visão consolidada por cliente, GP e criticidade."}
                        </p>
                      </div>
                      <button className="ghost-button">Ver todos</button>
                    </div>
                    <div className="table">
                      <div className={isClientProfile ? "table-row table-head client-project-row" : "table-row table-head"}>
                        <span>Número</span>
                        <span>Projeto</span>
                        {!isClientProfile ? <span>Cliente</span> : null}
                        <span>GP</span>
                        <span>Riscos</span>
                        <span>Status</span>
                      </div>
                      {visibleProjects.map((project) => (
                        <div className={isClientProfile ? "table-row client-project-row" : "table-row"} key={project.number}>
                          <span className="mono">{project.number}</span>
                          <span>
                            <strong>{project.name}</strong>
                            <small>{project.phase}</small>
                          </span>
                          {!isClientProfile ? <span>{project.client}</span> : null}
                          <span>{project.gp}</span>
                          <span>
                            <strong>{project.critical}</strong> / {project.risks}
                          </span>
                          <span>
                            <StatusPill status={project.status} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>

                {profile?.role !== "admin" ? (
                  <article className="surface">
                    <div className="surface-header">
                      <div>
                        <h3>Riscos prioritários</h3>
                        <p>Somente riscos do contexto selecionado.</p>
                      </div>
                      <button className="ghost-button">Abrir módulo</button>
                    </div>
                    <div className="risk-list">
                      {risks.map((risk) => (
                        <div className="risk-row" key={risk.id}>
                          <span className="risk-id">#{risk.id}</span>
                          <div>
                            <strong>{risk.title}</strong>
                            <small>
                              {risk.project} · {risk.group} · Responsável: {risk.owner}
                            </small>
                          </div>
                          <span className="score">{risk.score}</span>
                          <SeverityBadge label={risk.severity} />
                          <StatusPill status={risk.status} />
                        </div>
                      ))}
                    </div>
                  </article>
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
      {selectedClient ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedClient(null)}>
          <section
            aria-labelledby="client-details-title"
            className="modal client-details-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Cliente</p>
                <h3 id="client-details-title">{selectedClient.name}</h3>
              </div>
              <button className="icon-button" aria-label="Fechar" onClick={() => setSelectedClient(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-summary">
              <div>
                <span>Status</span>
                <strong>{selectedClient.status === "active" ? "Ativo" : "Inativo"}</strong>
              </div>
              <div>
                <span>Contatos</span>
                <strong>{selectedClient.client_contacts?.length || 0}</strong>
              </div>
              <div>
                <span>Criado em</span>
                <strong>{selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleDateString("pt-BR") : "Sem data"}</strong>
              </div>
            </div>

            <div className="detail-block">
              <span>Observações</span>
              <p>{selectedClient.notes || "Sem observações cadastradas."}</p>
            </div>

            <div className="modal-header detail-section-header">
              <div>
                <p className="eyebrow">Contatos</p>
                <h3>Dados de contato</h3>
              </div>
              <button className="ghost-button compact-button" onClick={() => {
                setSelectedClient(null);
                openEditClientModal(selectedClient);
              }} type="button">
                <Pencil size={14} />
                Editar
              </button>
            </div>

            <div className="contact-detail-list">
              {selectedClient.client_contacts?.length ? (
                selectedClient.client_contacts.map((contact) => (
                  <article className="contact-detail-card" key={contact.id}>
                    <div>
                      <strong>{contact.name}</strong>
                      <span>{contact.role_title || "Cargo não informado"}</span>
                    </div>
                    <div>
                      <span>E-mail</span>
                      <strong>{contact.email || "Não informado"}</strong>
                    </div>
                    <div>
                      <span>Telefone</span>
                      <strong>{contact.phone || "Não informado"}</strong>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <CircleUserRound size={20} />
                  <strong>Nenhum contato cadastrado</strong>
                  <span>Use Editar para adicionar contatos ao cliente.</span>
                </div>
              )}
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
                <h3 id="delete-confirmation-title">Remover {pendingDelete.type === "client" ? "cliente" : "contato"}</h3>
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
                disabled={deleteConfirmationText.trim().toLocaleLowerCase("pt-BR") !== "remover" || isClientsLoading}
                onClick={confirmPendingDelete}
                type="button"
              >
                <Trash2 size={16} />
                {isClientsLoading ? "Removendo..." : "Remover"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {isClientModalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            resetClientForm();
            setIsClientModalOpen(false);
          }}
        >
          <section
            aria-labelledby="client-modal-title"
            className="modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Clientes</p>
                <h3 id="client-modal-title">{editingClientId ? "Editar cliente" : "Novo cliente"}</h3>
              </div>
              <button
                className="icon-button"
                aria-label="Fechar"
                onClick={() => {
                  resetClientForm();
                  setIsClientModalOpen(false);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="field-stack modal-form">
              <label>
                Nome do cliente
                <input
                  aria-invalid={Boolean(clientsError && !clientForm.name.trim())}
                  required
                  value={clientForm.name}
                  onChange={(event) => setClientForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Empresa ABC"
                />
              </label>
              <label>
                Observações
                <textarea
                  value={clientForm.notes}
                  onChange={(event) => setClientForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Informações internas do cliente"
                />
              </label>
              <div className="form-section-header">
                <div>
                  <strong>Contatos</strong>
                  <span>O primeiro contato será exibido na tela principal.</span>
                </div>
                <button className="ghost-button compact-button" type="button" onClick={addClientContact}>
                  <Plus size={15} />
                  Adicionar
                </button>
              </div>
              <div className="contact-form-list">
                {clientForm.contacts.map((contact, index) => (
                  <div className="contact-form-card" key={`contact-${index}`}>
                    <div className="contact-form-title">
                      <strong>Contato {index + 1}</strong>
                      <button className="icon-button small-icon-button" type="button" aria-label="Remover contato" onClick={() => removeClientContact(index)}>
                        <X size={15} />
                      </button>
                    </div>
                    <label>
                      Nome
                      <input
                        required
                        value={contact.name}
                        onChange={(event) => updateClientContact(index, "name", event.target.value)}
                        placeholder="Nome do contato"
                      />
                    </label>
                    <div className="form-grid two-columns">
                      <label>
                        Cargo
                        <input
                          value={contact.role_title}
                          onChange={(event) => updateClientContact(index, "role_title", event.target.value)}
                          placeholder="Diretor, PMO, Sponsor"
                        />
                      </label>
                      <label>
                        Telefone
                        <input
                          type="tel"
                          inputMode="tel"
                          value={contact.phone}
                          onChange={(event) => updateClientContact(index, "phone", event.target.value)}
                          placeholder="+55 11 99999-9999"
                        />
                      </label>
                    </div>
                    <label>
                      E-mail
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(event) => updateClientContact(index, "email", event.target.value)}
                        placeholder="contato@empresa.com"
                      />
                    </label>
                  </div>
                ))}
              </div>
              {clientsError ? <p className="auth-message modal-message">{clientsError}</p> : null}
              <button className="button full" disabled={isClientsLoading} onClick={saveClient} type="button">
                <Plus size={16} />
                {isClientsLoading ? "Salvando..." : editingClientId ? "Salvar alterações" : "Salvar cliente"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
