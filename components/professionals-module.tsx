"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  CircleUserRound,
  Eye,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  X
} from "lucide-react";
import type { Professional, ProfessionalForm, ProfessionalFunction, Project } from "@/lib/domain";
import { formatPhone, professionalFunctionLabels } from "@/lib/domain";

type ProfessionalsModuleProps = {
  professionals: Professional[];
  projectsData: Project[];
  professionalsError: string;
  isProfessionalsLoading: boolean;
  isProfessionalModalOpen: boolean;
  selectedProfessional: Professional | null;
  editingProfessionalId: string | null;
  professionalForm: ProfessionalForm;
  isAdminProfile: boolean;
  onLoadProfessionals: () => void;
  onOpenProfessionalDetails: (professional: Professional) => void;
  onCloseProfessionalDetails: () => void;
  onOpenEditProfessionalModal: (professional: Professional) => void;
  onRequestDeleteProfessional: (professional: Professional) => void;
  onCloseProfessionalModal: () => void;
  onProfessionalFormChange: (nextForm: ProfessionalForm | ((current: ProfessionalForm) => ProfessionalForm)) => void;
  onSaveProfessional: () => void;
};

function StatusPill({ status }: { status: string }) {
  return <span className="status-pill">{status}</span>;
}

export function ProfessionalsModule({
  professionals,
  projectsData,
  professionalsError,
  isProfessionalsLoading,
  isProfessionalModalOpen,
  selectedProfessional,
  editingProfessionalId,
  professionalForm,
  isAdminProfile,
  onLoadProfessionals,
  onOpenProfessionalDetails,
  onCloseProfessionalDetails,
  onOpenEditProfessionalModal,
  onRequestDeleteProfessional,
  onCloseProfessionalModal,
  onProfessionalFormChange,
  onSaveProfessional
}: ProfessionalsModuleProps) {
  return (
    <>
      <div className="metric-grid compact-metrics">
        <article className="metric">
          <CircleUserRound size={15} />
          <span>Profissionais</span>
          <strong>{professionals.length}</strong>
        </article>
        <article className="metric">
          <BriefcaseBusiness size={15} />
          <span>Projetos</span>
          <strong>{professionals.filter((professional) =>
            ["project_manager", "project_coordinator", "project_lead"].includes(professional.function)
          ).length}</strong>
        </article>
        <article className="metric">
          <BarChart3 size={15} />
          <span>Portfólio e direção</span>
          <strong>{professionals.filter((professional) =>
            ["portfolio_manager", "project_director"].includes(professional.function)
          ).length}</strong>
        </article>
        <article className="metric">
          <ListChecks size={15} />
          <span>Ativos</span>
          <strong>{professionals.filter((professional) => professional.is_active).length}</strong>
        </article>
      </div>

      <article className="surface">
        <div className="surface-header">
          <div>
            <h3>Profissionais</h3>
            <p>Cadastro de GPs e gerentes de portfólio usados nos projetos.</p>
          </div>
          <button className="ghost-button" onClick={onLoadProfessionals}>
            Atualizar
          </button>
        </div>

        {professionalsError && !isProfessionalModalOpen ? <p className="auth-message">{professionalsError}</p> : null}
        {isProfessionalsLoading ? (
          <div className="empty-state">
            <CircleUserRound size={20} />
            <strong>Carregando profissionais</strong>
            <span>Consultando profissionais cadastrados.</span>
          </div>
        ) : professionals.length === 0 ? (
          <div className="empty-state">
            <CircleUserRound size={20} />
            <strong>Nenhum profissional cadastrado</strong>
            <span>Cadastre GPs e gerentes de portfólio antes de criar projetos.</span>
          </div>
        ) : (
          <div className="table professionals-table">
            <div className="table-row table-head professionals-row">
              <span>Nome</span>
              <span>Função</span>
              <span>E-mail</span>
              <span>WhatsApp</span>
              <span>Status</span>
              <span>Ações</span>
            </div>
            {professionals.map((professional) => (
              <div className="table-row professionals-row" key={professional.id}>
                <span>
                  <button className="link-button" onClick={() => onOpenProfessionalDetails(professional)} type="button">
                    {professional.full_name}
                  </button>
                  <small>{professional.created_at ? new Date(professional.created_at).toLocaleDateString("pt-BR") : "Sem data"}</small>
                </span>
                <span>{professionalFunctionLabels[professional.function]}</span>
                <span>{professional.email}</span>
                <span>{professional.whatsapp || "Não informado"}</span>
                <span>
                  <StatusPill status={professional.is_active ? "Ativo" : "Inativo"} />
                </span>
                <span className="table-actions">
                  <button
                    aria-label={`Ver detalhes de ${professional.full_name}`}
                    className="icon-button small-icon-button"
                    onClick={() => onOpenProfessionalDetails(professional)}
                    title="Ver detalhes"
                    type="button"
                  >
                    <Eye size={14} />
                  </button>
                  {isAdminProfile ? (
                    <>
                      <button className="ghost-button compact-button" onClick={() => onOpenEditProfessionalModal(professional)} type="button">
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        aria-label={`Remover ${professional.full_name}`}
                        className="icon-button small-icon-button danger-icon-button"
                        onClick={() => onRequestDeleteProfessional(professional)}
                        title="Remover profissional"
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

      {selectedProfessional ? (
        <div className="modal-backdrop" role="presentation" onClick={onCloseProfessionalDetails}>
          <section
            aria-labelledby="professional-details-title"
            className="modal professional-details-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Profissional</p>
                <h3 id="professional-details-title">{selectedProfessional.full_name}</h3>
              </div>
              <button className="icon-button" aria-label="Fechar" onClick={onCloseProfessionalDetails}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-summary">
              <div>
                <span>Função</span>
                <strong>{professionalFunctionLabels[selectedProfessional.function]}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{selectedProfessional.is_active ? "Ativo" : "Inativo"}</strong>
              </div>
              <div>
                <span>Criado em</span>
                <strong>{selectedProfessional.created_at ? new Date(selectedProfessional.created_at).toLocaleDateString("pt-BR") : "Sem data"}</strong>
              </div>
            </div>
            <div className="detail-summary">
              <div>
                <span>E-mail</span>
                <strong>{selectedProfessional.email}</strong>
              </div>
              <div>
                <span>WhatsApp</span>
                <strong>{selectedProfessional.whatsapp || "Não informado"}</strong>
              </div>
              <div>
                <span>Projetos</span>
                <strong>
                  {projectsData.filter((project) =>
                    project.professional_gp_id === selectedProfessional.id
                    || project.professional_portfolio_manager_id === selectedProfessional.id
                  ).length}
                </strong>
              </div>
            </div>
            {isAdminProfile ? (
              <div className="modal-actions">
                <button className="ghost-button" onClick={() => onOpenEditProfessionalModal(selectedProfessional)} type="button">
                  <Pencil size={14} />
                  Editar
                </button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {isProfessionalModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={onCloseProfessionalModal}>
          <section
            aria-labelledby="professional-modal-title"
            className="modal professional-form-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Profissionais</p>
                <h3 id="professional-modal-title">{editingProfessionalId ? "Editar profissional" : "Novo profissional"}</h3>
              </div>
              <button className="icon-button" aria-label="Fechar" onClick={onCloseProfessionalModal}>
                <X size={18} />
              </button>
            </div>

            <div className="field-stack modal-form">
              <label>
                Nome completo
                <input
                  value={professionalForm.full_name}
                  onChange={(event) => onProfessionalFormChange((current) => ({ ...current, full_name: event.target.value }))}
                  placeholder="Nome do profissional"
                />
              </label>
              <div className="form-grid two-columns">
                <label>
                  E-mail
                  <input
                    type="email"
                    value={professionalForm.email}
                    onChange={(event) => onProfessionalFormChange((current) => ({ ...current, email: event.target.value }))}
                    placeholder="profissional@empresa.com"
                  />
                </label>
                <label>
                  WhatsApp
                  <input
                    type="tel"
                    inputMode="tel"
                    value={professionalForm.whatsapp}
                    onChange={(event) => onProfessionalFormChange((current) => ({ ...current, whatsapp: formatPhone(event.target.value) }))}
                    placeholder="+55 11 99999-9999"
                  />
                </label>
              </div>
              <label>
                Função
                <select
                  value={professionalForm.function}
                  onChange={(event) => onProfessionalFormChange((current) => ({ ...current, function: event.target.value as ProfessionalFunction }))}
                >
                  {Object.entries(professionalFunctionLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              {professionalsError ? <p className="auth-message modal-message">{professionalsError}</p> : null}
              <button className="button full" disabled={isProfessionalsLoading} onClick={onSaveProfessional} type="button">
                <Plus size={16} />
                {isProfessionalsLoading ? "Salvando..." : editingProfessionalId ? "Salvar alterações" : "Salvar profissional"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
