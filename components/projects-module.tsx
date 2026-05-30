"use client";

import {
  BriefcaseBusiness,
  Building2,
  Eye,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  X
} from "lucide-react";
import type { Client, Professional, Project, ProjectForm, ProjectStatus } from "@/lib/domain";
import { projectPhaseOptions, projectStatusLabels } from "@/lib/domain";

type ProjectsModuleProps = {
  projectsData: Project[];
  clients: Client[];
  projectManagers: Professional[];
  portfolioManagers: Professional[];
  projectsError: string;
  isProjectsLoading: boolean;
  isProjectModalOpen: boolean;
  selectedProject: Project | null;
  editingProjectId: string | null;
  projectForm: ProjectForm;
  isAdminProfile: boolean;
  onLoadProjects: () => void;
  onOpenProjectDetails: (project: Project) => void;
  onCloseProjectDetails: () => void;
  onOpenEditProjectModal: (project: Project) => void;
  onRequestDeleteProject: (project: Project) => void;
  onCloseProjectModal: () => void;
  onProjectFormChange: (nextForm: ProjectForm | ((current: ProjectForm) => ProjectForm)) => void;
  onSaveProject: () => void;
};

function StatusPill({ status }: { status: string }) {
  return <span className="status-pill">{status}</span>;
}

export function ProjectsModule({
  projectsData,
  clients,
  projectManagers,
  portfolioManagers,
  projectsError,
  isProjectsLoading,
  isProjectModalOpen,
  selectedProject,
  editingProjectId,
  projectForm,
  isAdminProfile,
  onLoadProjects,
  onOpenProjectDetails,
  onCloseProjectDetails,
  onOpenEditProjectModal,
  onRequestDeleteProject,
  onCloseProjectModal,
  onProjectFormChange,
  onSaveProject
}: ProjectsModuleProps) {
  return (
    <>
      <div className="metric-grid compact-metrics">
        <article className="metric">
          <BriefcaseBusiness size={15} />
          <span>Projetos</span>
          <strong>{projectsData.length}</strong>
        </article>
        <article className="metric">
          <ListChecks size={15} />
          <span>Ativos</span>
          <strong>{projectsData.filter((project) => project.status === "active").length}</strong>
        </article>
        <article className="metric">
          <Building2 size={15} />
          <span>Clientes vinculados</span>
          <strong>{new Set(projectsData.map((project) => project.client_id)).size}</strong>
        </article>
        <article className="metric">
          <TriangleAlert size={15} />
          <span>Sem GP</span>
          <strong>{projectsData.filter((project) => !project.professional_gp_id).length}</strong>
        </article>
      </div>

      <article className="surface">
        <div className="surface-header">
          <div>
            <h3>Projetos</h3>
            <p>Cadastro operacional por cliente, número, GP, fase e status.</p>
          </div>
          <button className="ghost-button" onClick={onLoadProjects}>
            Atualizar
          </button>
        </div>

        {projectsError && !isProjectModalOpen ? <p className="auth-message">{projectsError}</p> : null}
        {isProjectsLoading ? (
          <div className="empty-state">
            <BriefcaseBusiness size={20} />
            <strong>Carregando projetos</strong>
            <span>Consultando projetos liberados para o seu perfil.</span>
          </div>
        ) : projectsData.length === 0 ? (
          <div className="empty-state">
            <BriefcaseBusiness size={20} />
            <strong>Nenhum projeto cadastrado</strong>
            <span>Crie o primeiro projeto vinculando um cliente e um número de projeto.</span>
          </div>
        ) : (
          <div className="table projects-table">
            <div className="table-row table-head projects-row">
              <span>Número</span>
              <span>Projeto</span>
              <span>Cliente</span>
              <span>GP</span>
              <span>Fase</span>
              <span>Status</span>
              <span>Prazo</span>
              <span>Ações</span>
            </div>
            {projectsData.map((project) => (
              <div className="table-row projects-row" key={project.id}>
                <span className="mono">{project.project_number}</span>
                <span>
                  <button className="link-button" onClick={() => onOpenProjectDetails(project)} type="button">
                    {project.name}
                  </button>
                  <small>{project.description || "Sem descrição"}</small>
                </span>
                <span>{project.clients?.name || "Cliente não informado"}</span>
                <span>{project.professional_gp?.full_name || "Não definido"}</span>
                <span>{project.phase || "Não informada"}</span>
                <span>
                  <StatusPill status={projectStatusLabels[project.status]} />
                </span>
                <span>{project.target_ends_on ? new Date(project.target_ends_on).toLocaleDateString("pt-BR") : "Sem prazo"}</span>
                <span className="table-actions">
                  <button
                    aria-label={`Ver detalhes de ${project.name}`}
                    className="icon-button small-icon-button"
                    onClick={() => onOpenProjectDetails(project)}
                    title="Ver detalhes"
                    type="button"
                  >
                    <Eye size={14} />
                  </button>
                  {isAdminProfile ? (
                    <>
                      <button className="ghost-button compact-button" onClick={() => onOpenEditProjectModal(project)} type="button">
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        aria-label={`Remover ${project.name}`}
                        className="icon-button small-icon-button danger-icon-button"
                        onClick={() => onRequestDeleteProject(project)}
                        title="Remover projeto"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>

      {selectedProject ? (
        <div className="modal-backdrop" role="presentation" onClick={onCloseProjectDetails}>
          <section
            aria-labelledby="project-details-title"
            className="modal project-details-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Projeto</p>
                <h3 id="project-details-title">{selectedProject.name}</h3>
              </div>
              <button className="icon-button" aria-label="Fechar" onClick={onCloseProjectDetails}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-summary">
              <div>
                <span>Número</span>
                <strong>{selectedProject.project_number}</strong>
              </div>
              <div>
                <span>Cliente</span>
                <strong>{selectedProject.clients?.name || "Não informado"}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{projectStatusLabels[selectedProject.status]}</strong>
              </div>
            </div>

            <div className="detail-summary">
              <div>
                <span>GP</span>
                <strong>{selectedProject.professional_gp?.full_name || "Não definido"}</strong>
              </div>
              <div>
                <span>Portfólio</span>
                <strong>{selectedProject.professional_portfolio_manager?.full_name || "Não definido"}</strong>
              </div>
              <div>
                <span>Fase</span>
                <strong>{selectedProject.phase || "Não informada"}</strong>
              </div>
            </div>

            <div className="detail-summary">
              <div>
                <span>Início</span>
                <strong>{selectedProject.starts_on ? new Date(selectedProject.starts_on).toLocaleDateString("pt-BR") : "Sem data"}</strong>
              </div>
              <div>
                <span>Fim previsto</span>
                <strong>{selectedProject.target_ends_on ? new Date(selectedProject.target_ends_on).toLocaleDateString("pt-BR") : "Sem data"}</strong>
              </div>
              <div>
                <span>Criado em</span>
                <strong>{selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString("pt-BR") : "Sem data"}</strong>
              </div>
            </div>

            <div className="detail-block">
              <span>Descrição</span>
              <p>{selectedProject.description || "Sem descrição cadastrada."}</p>
            </div>

            {isAdminProfile ? (
              <div className="modal-actions">
                <button className="ghost-button" onClick={() => onOpenEditProjectModal(selectedProject)} type="button">
                  <Pencil size={14} />
                  Editar
                </button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {isProjectModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={onCloseProjectModal}>
          <section
            aria-labelledby="project-modal-title"
            className="modal project-form-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Projetos</p>
                <h3 id="project-modal-title">{editingProjectId ? "Editar projeto" : "Novo projeto"}</h3>
              </div>
              <button className="icon-button" aria-label="Fechar" onClick={onCloseProjectModal}>
                <X size={18} />
              </button>
            </div>

            <div className="field-stack modal-form">
              <div className="form-grid two-columns">
                <label>
                  Cliente
                  <select
                    value={projectForm.client_id}
                    onChange={(event) => onProjectFormChange((current) => ({ ...current, client_id: event.target.value }))}
                  >
                    <option value="">Selecione</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Número do projeto
                  <input
                    value={projectForm.project_number}
                    onChange={(event) => onProjectFormChange((current) => ({ ...current, project_number: event.target.value }))}
                    placeholder="PRJ-2026-001"
                  />
                </label>
              </div>
              <label>
                Nome do projeto
                <input
                  value={projectForm.name}
                  onChange={(event) => onProjectFormChange((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nome do projeto"
                />
              </label>
              <label>
                Descrição
                <textarea
                  value={projectForm.description}
                  onChange={(event) => onProjectFormChange((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Resumo operacional do projeto"
                />
              </label>
              <div className="form-grid two-columns">
                <label>
                  GP responsável
                  <select
                    value={projectForm.professional_gp_id}
                    onChange={(event) => onProjectFormChange((current) => ({ ...current, professional_gp_id: event.target.value }))}
                  >
                    <option value="">Não definido</option>
                    {projectManagers.map((professional) => (
                      <option key={professional.id} value={professional.id}>{professional.full_name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Gerente de portfólio
                  <select
                    value={projectForm.professional_portfolio_manager_id}
                    onChange={(event) => onProjectFormChange((current) => ({ ...current, professional_portfolio_manager_id: event.target.value }))}
                  >
                    <option value="">Não definido</option>
                    {portfolioManagers.map((professional) => (
                      <option key={professional.id} value={professional.id}>{professional.full_name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-grid two-columns">
                <label>
                  Fase
                  <select
                    value={projectForm.phase}
                    onChange={(event) => onProjectFormChange((current) => ({ ...current, phase: event.target.value }))}
                  >
                    <option value="">Não definida</option>
                    {projectPhaseOptions.map((phase) => (
                      <option key={phase} value={phase}>{phase}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={projectForm.status}
                    onChange={(event) => onProjectFormChange((current) => ({ ...current, status: event.target.value as ProjectStatus }))}
                  >
                    {Object.entries(projectStatusLabels).map(([status, label]) => (
                      <option key={status} value={status}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-grid two-columns">
                <label>
                  Início
                  <input
                    type="date"
                    value={projectForm.starts_on}
                    onChange={(event) => onProjectFormChange((current) => ({ ...current, starts_on: event.target.value }))}
                  />
                </label>
                <label>
                  Fim previsto
                  <input
                    type="date"
                    value={projectForm.target_ends_on}
                    onChange={(event) => onProjectFormChange((current) => ({ ...current, target_ends_on: event.target.value }))}
                  />
                </label>
              </div>
              {projectsError ? <p className="auth-message modal-message">{projectsError}</p> : null}
              <button className="button full" disabled={isProjectsLoading} onClick={onSaveProject} type="button">
                <Plus size={16} />
                {isProjectsLoading ? "Salvando..." : editingProjectId ? "Salvar alterações" : "Salvar projeto"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
