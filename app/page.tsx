"use client";

import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleUserRound,
  Download,
  FileText,
  Gauge,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Mail,
  PanelsTopLeft,
  Plus,
  Search,
  ShieldCheck,
  TriangleAlert,
  UsersRound
} from "lucide-react";
import { useState } from "react";

const projects = [
  {
    number: "PRJ-2026-014",
    name: "SAP S/4HANA Upgrade",
    client: "Empresa XYZ",
    gp: "Joao Silva",
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
    title: "Ausencia de equipe tecnica especializada para pontos criticos SAP",
    group: "Tecnico",
    project: "PRJ-2026-014",
    owner: "GP",
    score: 16,
    severity: "Alto",
    status: "Em andamento"
  },
  {
    id: 6,
    title: "Quebra de integracoes com sistemas legados, APIs externas ou EDI",
    group: "Tecnico",
    project: "PRJ-2026-014",
    owner: "Arquitetura",
    score: 16,
    severity: "Alto",
    status: "Em andamento"
  },
  {
    id: 11,
    title: "Mudancas no escopo durante o projeto",
    group: "Estrategico",
    project: "PRJ-2026-014",
    owner: "Comite",
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
  { label: "Portfolio", icon: BarChart3 },
  { label: "Relatorios", icon: FileText },
  { label: "Exportacoes", icon: Download },
  { label: "Administracao", icon: ShieldCheck }
];

function SeverityBadge({ label }: { label: string }) {
  return <span className={`badge badge-${label.toLowerCase()}`}>{label}</span>;
}

function StatusPill({ status }: { status: string }) {
  return <span className="status-pill">{status}</span>;
}

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  return (
    <main className={isSignedIn ? "page authenticated" : "page login-only"}>
      {!isSignedIn ? (
      <section className="login-preview">
        <div className="login-panel">
          <div>
            <p className="eyebrow">Acesso seguro</p>
            <h1>K-RiskHub</h1>
            <p className="muted">Gestao moderna de riscos em projetos, clientes e portfolios.</p>
          </div>

          <div className="login-actions">
            <button className="oauth-button primary-oauth" onClick={() => setIsSignedIn(true)}>
              <PanelsTopLeft size={18} />
              Entrar com Microsoft
            </button>
            <button className="oauth-button" onClick={() => setIsSignedIn(true)}>
              <Mail size={18} />
              Entrar com Google
            </button>
          </div>

          <div className="field-stack">
            <label>
              E-mail
              <input type="email" placeholder="voce@empresa.com" />
            </label>
            <label>
              Senha
              <input type="password" placeholder="Senha" />
            </label>
            <button className="button full" onClick={() => setIsSignedIn(true)}>
              <KeyRound size={16} />
              Entrar
            </button>
            <a className="reset-link" href="#">
              Esqueci minha senha
            </a>
          </div>
        </div>
      </section>
      ) : (
      <section className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">K</div>
            <div>
              <strong>K-RiskHub</strong>
              <span>Risk workspace</span>
            </div>
          </div>

          <nav className="nav">
            {nav.map((item) => (
              <a className={item.active ? "nav-item active" : "nav-item"} href="#" key={item.label}>
                <item.icon size={18} />
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="workspace">
          <header className="topbar">
            <div className="context-select">
              <span>Portfolio</span>
              <strong>Todos os clientes</strong>
              <ChevronDown size={16} />
            </div>
            <div className="topbar-actions">
              <div className="search">
                <Search size={16} />
                <input placeholder="Buscar clientes, projetos ou riscos" />
              </div>
              <button className="icon-user">
                <CircleUserRound size={20} />
              </button>
            </div>
          </header>

          <section className="content">
            <div className="section-header">
              <div>
                <p className="eyebrow">Perfil executivo</p>
                <h2>Dashboard do portfolio</h2>
              </div>
              <button className="button">
                <Plus size={16} />
                Novo projeto
              </button>
            </div>

            <div className="metric-grid">
              <article className="metric">
                <Gauge size={18} />
                <span>Projetos ativos</span>
                <strong>18</strong>
              </article>
              <article className="metric">
                <TriangleAlert size={18} />
                <span>Riscos alto impacto</span>
                <strong>31</strong>
              </article>
              <article className="metric">
                <ListChecks size={18} />
                <span>Planos em atraso</span>
                <strong>9</strong>
              </article>
              <article className="metric">
                <Activity size={18} />
                <span>Clientes monitorados</span>
                <strong>7</strong>
              </article>
            </div>

            <div className="main-grid">
              <article className="surface">
                <div className="surface-header">
                  <div>
                    <h3>Projetos</h3>
                    <p>Visao consolidada por cliente, GP e criticidade.</p>
                  </div>
                  <button className="ghost-button">Ver todos</button>
                </div>
                <div className="table">
                  <div className="table-row table-head">
                    <span>Numero</span>
                    <span>Projeto</span>
                    <span>Cliente</span>
                    <span>GP</span>
                    <span>Riscos</span>
                    <span>Status</span>
                  </div>
                  {projects.map((project) => (
                    <div className="table-row" key={project.number}>
                      <span className="mono">{project.number}</span>
                      <span>
                        <strong>{project.name}</strong>
                        <small>{project.phase}</small>
                      </span>
                      <span>{project.client}</span>
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

              <aside className="surface compact">
                <div className="surface-header">
                  <div>
                    <h3>Meu perfil</h3>
                    <p>Entrada contextual apos login.</p>
                  </div>
                </div>
                <div className="profile-card">
                  <div className="avatar">AD</div>
                  <div>
                    <strong>Admin Demo</strong>
                    <span>Admin</span>
                  </div>
                </div>
                <div className="profile-list">
                  <span>
                    <UsersRound size={15} /> Acesso total
                  </span>
                  <span>
                    <Building2 size={15} /> 7 clientes
                  </span>
                  <span>
                    <BriefcaseBusiness size={15} /> 18 projetos
                  </span>
                </div>
              </aside>
            </div>

            <article className="surface">
              <div className="surface-header">
                <div>
                  <h3>Riscos prioritarios</h3>
                  <p>Somente riscos do contexto selecionado.</p>
                </div>
                <button className="ghost-button">Abrir modulo</button>
              </div>
              <div className="risk-list">
                {risks.map((risk) => (
                  <div className="risk-row" key={risk.id}>
                    <span className="risk-id">#{risk.id}</span>
                    <div>
                      <strong>{risk.title}</strong>
                      <small>
                        {risk.project} · {risk.group} · Responsavel: {risk.owner}
                      </small>
                    </div>
                    <span className="score">{risk.score}</span>
                    <SeverityBadge label={risk.severity} />
                    <StatusPill status={risk.status} />
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </section>
      )}
    </main>
  );
}
