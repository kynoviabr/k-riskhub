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
  }, [activeModule, loadAdminUsers]);

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

  const displayName = profile?.full_name || profile?.email || "Usuário";
  const isClientProfile = profile?.role === "client";
  const isAdminUsersView = isAdminProfile && activeModule === "Administração";
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
                <h2>{isAdminUsersView ? "Administração" : "Dashboard"}</h2>
              </div>
              {isAdminUsersView ? (
                <button className="ghost-button" onClick={loadAdminUsers}>
                  Atualizar
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
    </main>
  );
}
