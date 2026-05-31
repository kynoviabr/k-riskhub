"use client";

import {
  BriefcaseBusiness,
  Eye,
  ListChecks,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  TriangleAlert,
  X
} from "lucide-react";
import type { Project, Risk, RiskForm, RiskResponseType, RiskStatus } from "@/lib/domain";
import {
  getRiskSeverity,
  getRiskSeverityClass,
  projectPhaseOptions,
  riskExternalToolOptions,
  riskGroupOptions,
  riskImpactLabels,
  riskMainImpactOptions,
  riskOriginOptions,
  riskResponseTypeLabels,
  riskScoreLabels,
  riskStatusLabels
} from "@/lib/domain";

type RisksModuleProps = {
  risksData: Risk[];
  projectsData: Project[];
  risksError: string;
  isRisksLoading: boolean;
  isRiskModalOpen: boolean;
  selectedRisk: Risk | null;
  editingRiskId: string | null;
  riskForm: RiskForm;
  isAdminProfile: boolean;
  onLoadRisks: () => void;
  onOpenRiskDetails: (risk: Risk) => void;
  onCloseRiskDetails: () => void;
  onOpenEditRiskModal: (risk: Risk) => void;
  onRequestDeleteRisk: (risk: Risk) => void;
  onCloseRiskModal: () => void;
  onRiskFormChange: (nextForm: RiskForm | ((current: RiskForm) => RiskForm)) => void;
  onSaveRisk: () => void;
};

function StatusPill({ status }: { status: string }) {
  return <span className="status-pill">{status}</span>;
}

function SeverityBadge({ score }: { score: number | null | undefined }) {
  const severity = getRiskSeverity(score);
  return <span className={`badge badge-${getRiskSeverityClass(score)}`}>{severity}</span>;
}

const scoreOptions = [1, 2, 3, 4, 5];

export function RisksModule({
  risksData,
  projectsData,
  risksError,
  isRisksLoading,
  isRiskModalOpen,
  selectedRisk,
  editingRiskId,
  riskForm,
  isAdminProfile,
  onLoadRisks,
  onOpenRiskDetails,
  onCloseRiskDetails,
  onOpenEditRiskModal,
  onRequestDeleteRisk,
  onCloseRiskModal,
  onRiskFormChange,
  onSaveRisk
}: RisksModuleProps) {
  const highImpactRisks = risksData.filter((risk) => (risk.score || 0) >= 11);
  const openRisks = risksData.filter((risk) => ["open", "in_progress"].includes(risk.status));

  return (
    <>
      <div className="metric-grid compact-metrics">
        <article className="metric">
          <TriangleAlert size={15} />
          <span>Riscos</span>
          <strong>{risksData.length}</strong>
        </article>
        <article className="metric">
          <ShieldAlert size={15} />
          <span>Alto impacto</span>
          <strong>{highImpactRisks.length}</strong>
        </article>
        <article className="metric">
          <ListChecks size={15} />
          <span>Em aberto</span>
          <strong>{openRisks.length}</strong>
        </article>
        <article className="metric">
          <BriefcaseBusiness size={15} />
          <span>Projetos</span>
          <strong>{new Set(risksData.map((risk) => risk.project_id)).size}</strong>
        </article>
      </div>

      <article className="surface">
        <div className="surface-header">
          <div>
            <h3>Riscos</h3>
            <p>Registro operacional dos riscos por projeto, criticidade, responsável e status.</p>
          </div>
          <button className="ghost-button" onClick={onLoadRisks}>
            Atualizar
          </button>
        </div>

        {risksError && !isRiskModalOpen ? <p className="auth-message">{risksError}</p> : null}
        {isRisksLoading ? (
          <div className="empty-state">
            <TriangleAlert size={20} />
            <strong>Carregando riscos</strong>
            <span>Consultando riscos liberados para o seu perfil.</span>
          </div>
        ) : risksData.length === 0 ? (
          <div className="empty-state">
            <TriangleAlert size={20} />
            <strong>Nenhum risco cadastrado</strong>
            <span>Crie riscos vinculados aos projetos para acompanhar exposição e resposta.</span>
          </div>
        ) : (
          <div className="table risks-table">
            <div className="table-row table-head risks-row">
              <span>ID</span>
              <span>Risco</span>
              <span>Projeto</span>
              <span>Grupo</span>
              <span>Score</span>
              <span>Gravidade</span>
              <span>Status</span>
              <span>Ações</span>
            </div>
            {risksData.map((risk) => (
              <div className="table-row risks-row" key={risk.id}>
                <span className="mono">{risk.sequence_number ? `#${risk.sequence_number}` : "-"}</span>
                <span>
                  <button className="link-button" onClick={() => onOpenRiskDetails(risk)} type="button">
                    {risk.description}
                  </button>
                  <small>{risk.main_impact || "Impacto principal não informado"}</small>
                </span>
                <span>
                  <strong>{risk.projects?.project_number || "Sem número"}</strong>
                  <small>{risk.projects?.name || "Projeto não informado"}</small>
                </span>
                <span>{risk.group_name}</span>
                <span className="score">{risk.score || "-"}</span>
                <span>
                  <SeverityBadge score={risk.score} />
                </span>
                <span>
                  <StatusPill status={riskStatusLabels[risk.status]} />
                </span>
                <span className="table-actions">
                  <button
                    aria-label={`Ver detalhes do risco ${risk.sequence_number || risk.description}`}
                    className="icon-button small-icon-button"
                    onClick={() => onOpenRiskDetails(risk)}
                    title="Ver detalhes"
                    type="button"
                  >
                    <Eye size={14} />
                  </button>
                  {isAdminProfile ? (
                    <>
                      <button className="ghost-button compact-button" onClick={() => onOpenEditRiskModal(risk)} type="button">
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        aria-label={`Remover risco ${risk.sequence_number || risk.description}`}
                        className="icon-button small-icon-button danger-icon-button"
                        onClick={() => onRequestDeleteRisk(risk)}
                        title="Remover risco"
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

      {selectedRisk ? (
        <div className="modal-backdrop" role="presentation" onClick={onCloseRiskDetails}>
          <section
            aria-labelledby="risk-details-title"
            className="modal risk-details-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Risco</p>
                <h3 id="risk-details-title">{selectedRisk.sequence_number ? `#${selectedRisk.sequence_number}` : "Detalhes do risco"}</h3>
              </div>
              <button className="icon-button" aria-label="Fechar" onClick={onCloseRiskDetails}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-summary">
              <div>
                <span>Projeto</span>
                <strong>{selectedRisk.projects?.project_number || "Não informado"}</strong>
              </div>
              <div>
                <span>Score</span>
                <strong>{selectedRisk.score || "Não avaliado"}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{riskStatusLabels[selectedRisk.status]}</strong>
              </div>
            </div>

            <div className="detail-summary">
              <div>
                <span>Grupo</span>
                <strong>{selectedRisk.group_name}</strong>
              </div>
              <div>
                <span>Data identificação</span>
                <strong>{selectedRisk.identified_on ? new Date(selectedRisk.identified_on).toLocaleDateString("pt-BR") : "Sem data"}</strong>
              </div>
              <div>
                <span>Data encerramento</span>
                <strong>{selectedRisk.closed_on ? new Date(selectedRisk.closed_on).toLocaleDateString("pt-BR") : "Em aberto"}</strong>
              </div>
            </div>

            <div className="detail-summary">
              <div>
                <span>Probabilidade</span>
                <strong>{selectedRisk.probability_score || "-"} - {selectedRisk.probability_label || "Não informada"}</strong>
              </div>
              <div>
                <span>Impacto</span>
                <strong>{selectedRisk.impact_score || "-"} - {selectedRisk.impact_label || "Não informado"}</strong>
              </div>
            </div>

            <div className="detail-block">
              <span>Descrição</span>
              <p>{selectedRisk.description}</p>
            </div>
            <div className="detail-block">
              <span>Causa raiz</span>
              <p>{selectedRisk.root_cause || "Não informada."}</p>
            </div>
            <div className="detail-block">
              <span>Origem</span>
              <p>{selectedRisk.origin || "Não informada."}</p>
            </div>
            <div className="detail-block">
              <span>Impacto principal</span>
              <p>{selectedRisk.main_impact || "Não informado."}</p>
            </div>
            <div className="detail-block">
              <span>Tipo de resposta ao risco</span>
              <p>{selectedRisk.response_type ? riskResponseTypeLabels[selectedRisk.response_type] : "Não informado."}</p>
            </div>
            <div className="detail-block">
              <span>Ação / resposta planejada (5W2H)</span>
              <p>{selectedRisk.response_plan || "Não informada."}</p>
            </div>
            <div className="detail-block">
              <span>Referência externa</span>
              {selectedRisk.external_reference_url ? (
                <p>
                  <a href={selectedRisk.external_reference_url} rel="noreferrer" target="_blank">
                    {selectedRisk.external_tool || "Ferramenta externa"}
                    {selectedRisk.external_reference_id ? ` - ${selectedRisk.external_reference_id}` : ""}
                  </a>
                </p>
              ) : (
                <p>
                  {[selectedRisk.external_tool, selectedRisk.external_reference_id].filter(Boolean).join(" - ") ||
                    "Nenhuma referência externa informada."}
                </p>
              )}
            </div>

            {isAdminProfile ? (
              <div className="modal-actions">
                <button className="ghost-button" onClick={() => onOpenEditRiskModal(selectedRisk)} type="button">
                  <Pencil size={14} />
                  Editar
                </button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {isRiskModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={onCloseRiskModal}>
          <section
            aria-labelledby="risk-modal-title"
            className="modal risk-form-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Riscos</p>
                <h3 id="risk-modal-title">{editingRiskId ? "Editar risco" : "Novo risco"}</h3>
                <span className="modal-subtitle">Cadastre o risco no padrão do inventário e mantenha a resposta rastreável.</span>
              </div>
              <button className="icon-button" aria-label="Fechar" onClick={onCloseRiskModal}>
                <X size={18} />
              </button>
            </div>

            <div className="risk-modal-form">
              <section className="form-panel form-panel-primary">
                <div className="form-section-header">
                  <div>
                    <strong>Identificação</strong>
                    <span>Projeto, classificação e descrição do evento de risco.</span>
                  </div>
                </div>
                <div className="form-grid risk-form-grid">
                  <label className="span-2">
                    Projeto
                    <select
                      value={riskForm.project_id}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, project_id: event.target.value }))}
                    >
                      <option value="">Selecione</option>
                      {projectsData.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project_number} - {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Grupo
                    <select
                      value={riskForm.group_name}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, group_name: event.target.value }))}
                    >
                      <option value="">Selecione</option>
                      {riskGroupOptions.map((group) => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Origem
                    <select
                      value={riskForm.origin}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, origin: event.target.value }))}
                    >
                      <option value="">Selecione</option>
                      {riskOriginOptions.map((origin) => (
                        <option key={origin} value={origin}>{origin}</option>
                      ))}
                    </select>
                  </label>
                  <label className="span-3">
                    Descrição do risco
                    <textarea
                      className="compact-textarea"
                      value={riskForm.description}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Descreva o evento de risco"
                    />
                  </label>
                  <label className="span-3">
                    Causa raiz
                    <textarea
                      className="compact-textarea"
                      value={riskForm.root_cause}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, root_cause: event.target.value }))}
                      placeholder="Informe a causa raiz ou hipótese principal do risco"
                    />
                  </label>
                </div>
              </section>

              <section className="form-panel">
                <div className="form-section-header">
                  <div>
                    <strong>Avaliação</strong>
                    <span>Impacto, probabilidade e fase conforme a planilha.</span>
                  </div>
                </div>
                <div className="risk-assessment-grid">
                  <label>
                    Impacto principal
                    <select
                      value={riskForm.main_impact}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, main_impact: event.target.value }))}
                    >
                      <option value="">Selecione</option>
                      {riskMainImpactOptions.map((impact) => (
                        <option key={impact} value={impact}>{impact}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Probabilidade
                    <select
                      value={riskForm.probability_score}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, probability_score: event.target.value }))}
                    >
                      {scoreOptions.map((score) => (
                        <option key={score} value={score}>{score} - {riskScoreLabels[score]}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Impacto
                    <select
                      value={riskForm.impact_score}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, impact_score: event.target.value }))}
                    >
                      {scoreOptions.map((score) => (
                        <option key={score} value={score}>{score} - {riskImpactLabels[score]}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Fase
                    <select
                      value={riskForm.phase}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, phase: event.target.value }))}
                    >
                      <option value="">Não definida</option>
                      {projectPhaseOptions.map((phase) => (
                        <option key={phase} value={phase}>{phase}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="form-panel">
                <div className="form-section-header">
                  <div>
                    <strong>Plano e acompanhamento</strong>
                    <span>Responsável, resposta ao risco e situação atual.</span>
                  </div>
                </div>
                <div className="form-grid risk-form-grid">
                  <label>
                    Responsável
                    <input
                      value={riskForm.responsible_name}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, responsible_name: event.target.value }))}
                      placeholder="Nome do responsável"
                    />
                  </label>
                  <label>
                    Tipo de resposta ao risco
                    <select
                      value={riskForm.response_type}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, response_type: event.target.value as RiskResponseType }))}
                    >
                      {Object.entries(riskResponseTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Status
                    <select
                      value={riskForm.status}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, status: event.target.value as RiskStatus }))}
                    >
                      {Object.entries(riskStatusLabels).map(([status, label]) => (
                        <option key={status} value={status}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Data identificação
                    <input
                      type="date"
                      value={riskForm.identified_on}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, identified_on: event.target.value }))}
                    />
                  </label>
                  <label>
                    Data encerramento risco
                    <input
                      type="date"
                      value={riskForm.closed_on}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, closed_on: event.target.value }))}
                    />
                  </label>
                  <label className="span-2">
                    Ação / resposta planejada (5W2H)
                    <textarea
                      className="compact-textarea"
                      value={riskForm.response_plan}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, response_plan: event.target.value }))}
                      placeholder="Estratégia de resposta ou mitigação inicial"
                    />
                  </label>
                </div>
              </section>

              <section className="form-panel">
                <div className="form-section-header">
                  <div>
                    <strong>Referência externa</strong>
                    <span>Use apenas para apontar a tarefa operacional em Asana, Jira, Planner ou ferramenta equivalente.</span>
                  </div>
                </div>
                <div className="form-grid risk-form-grid">
                  <label>
                    Ferramenta
                    <select
                      value={riskForm.external_tool}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, external_tool: event.target.value }))}
                    >
                      <option value="">Não vinculada</option>
                      {riskExternalToolOptions.map((tool) => (
                        <option key={tool} value={tool}>{tool}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    ID externo
                    <input
                      value={riskForm.external_reference_id}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, external_reference_id: event.target.value }))}
                      placeholder="Ex.: KRISK-123, TASK-45"
                    />
                  </label>
                  <label>
                    Link externo
                    <input
                      value={riskForm.external_reference_url}
                      onChange={(event) => onRiskFormChange((current) => ({ ...current, external_reference_url: event.target.value }))}
                      placeholder="https://"
                      type="url"
                    />
                  </label>
                </div>
              </section>

              {risksError ? <p className="auth-message modal-message">{risksError}</p> : null}
              <div className="modal-footer-actions">
                <button className="ghost-button compact-button" onClick={onCloseRiskModal} type="button">
                  Cancelar
                </button>
                <button className="button compact-button" disabled={isRisksLoading} onClick={onSaveRisk} type="button">
                  <Plus size={16} />
                  {isRisksLoading ? "Salvando..." : editingRiskId ? "Salvar alterações" : "Salvar risco"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
