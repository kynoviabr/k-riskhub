"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  ListChecks,
  Plus,
  TriangleAlert
} from "lucide-react";
import type { Project, ReportRecord, ReportType, Risk } from "@/lib/domain";
import {
  getRiskSeverity,
  getRiskSeverityClass,
  reportTypeLabels,
  riskImpactLabels,
  riskResponseTypeLabels,
  riskScoreLabels,
  riskStatusLabels
} from "@/lib/domain";

type ReportsModuleProps = {
  projectsData: Project[];
  risksData: Risk[];
  reportsData: ReportRecord[];
  reportsError: string;
  isReportsLoading: boolean;
  reportProjectId: string;
  reportType: ReportType;
  canRegisterReport: boolean;
  onReportProjectChange: (projectId: string) => void;
  onReportTypeChange: (reportType: ReportType) => void;
  onLoadReports: () => void;
  onRegisterReport: () => void;
};

const probabilityAxis = [1, 2, 3, 4, 5];
const impactAxis = [5, 4, 3, 2, 1];

function ReportStatusPill({ status }: { status: string }) {
  return <span className="status-pill">{status}</span>;
}

function formatPercent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

type MatrixCell = {
  key: string;
  count: number;
  severityClass: string;
};

function RiskMatrixPanel({ extremeRisksCount, matrixCells }: { extremeRisksCount: number; matrixCells: MatrixCell[] }) {
  return (
    <div className="report-panel">
      <div className="report-panel-header">
        <h4>Matriz probabilidade x impacto</h4>
        <span>{extremeRisksCount} risco{extremeRisksCount === 1 ? "" : "s"} extremo{extremeRisksCount === 1 ? "" : "s"}</span>
      </div>
      <div className="report-matrix">
        <div />
        {probabilityAxis.map((probability) => (
          <span className="report-matrix-axis" key={`report-probability-${probability}`}>
            {riskScoreLabels[probability]}
          </span>
        ))}
        {impactAxis.map((impact) => (
          <div className="report-matrix-row" key={`report-impact-${impact}`}>
            <span className="report-matrix-axis report-matrix-impact">{riskImpactLabels[impact]}</span>
            {matrixCells.slice((5 - impact) * 5, (5 - impact) * 5 + 5).map((cell) => (
              <span className={`report-matrix-cell matrix-${cell.severityClass}`} key={cell.key}>
                {cell.count > 0 ? cell.count : ""}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskListPanel({
  emptyText,
  risks,
  showPlans = false,
  title
}: {
  emptyText: string;
  risks: Risk[];
  showPlans?: boolean;
  title: string;
}) {
  return (
    <div className="report-panel">
      <div className="report-panel-header">
        <h4>{title}</h4>
        <span>Top {risks.length}</span>
      </div>
      {risks.length === 0 ? (
        <div className="empty-state compact-empty">
          <FileText size={18} />
          <strong>Nenhum risco cadastrado</strong>
          <span>{emptyText}</span>
        </div>
      ) : (
        <div className="report-risk-list">
          {risks.map((risk) => (
            <div className={`report-risk-row${showPlans ? " report-risk-row-with-plan" : ""}`} key={risk.id}>
              <div className="report-risk-main">
                <span className="mono">{risk.sequence_number ? `#${risk.sequence_number}` : "-"}</span>
                <div>
                  <strong>{risk.description}</strong>
                  <small>{risk.projects?.project_number || "Sem projeto"} · {risk.group_name} · {risk.responsible_name || "Sem responsável"}</small>
                </div>
                <span className="score">{risk.score || "-"}</span>
                <span className={`badge badge-${getRiskSeverityClass(risk.score)}`}>{getRiskSeverity(risk.score)}</span>
                <ReportStatusPill status={riskStatusLabels[risk.status]} />
              </div>
              {showPlans ? (
                <div className="report-risk-plan">
                  <span>Plano / resposta planejada (5W2H)</span>
                  <p>{risk.response_plan?.trim() || "Plano ainda não informado."}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportSectionTitle({ children, number }: { children: string; number: number }) {
  return (
    <div className="document-section-title">
      <span>{number}</span>
      <h4>{children}</h4>
    </div>
  );
}

function ReportEditableField({
  ariaLabel,
  onChange,
  rows,
  value
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  rows: number;
  value: string;
}) {
  return (
    <label className="report-editable-field">
      <span>Texto sugerido editável</span>
      <textarea
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        value={value}
      />
    </label>
  );
}

export function ReportsModule({
  projectsData,
  risksData,
  reportsData,
  reportsError,
  isReportsLoading,
  reportProjectId,
  reportType,
  canRegisterReport,
  onReportProjectChange,
  onReportTypeChange,
  onLoadReports,
  onRegisterReport
}: ReportsModuleProps) {
  const selectedProject = projectsData.find((project) => project.id === reportProjectId) || null;
  const reportRisks = selectedProject
    ? risksData.filter((risk) => risk.project_id === selectedProject.id)
    : risksData;
  const openRisks = reportRisks.filter((risk) => ["open", "in_progress"].includes(risk.status));
  const highRisks = reportRisks.filter((risk) => (risk.score || 0) >= 11);
  const extremeRisks = reportRisks.filter((risk) => (risk.score || 0) > 16);
  const risksWithoutResponse = reportRisks.filter((risk) => !risk.response_plan?.trim() && ["open", "in_progress"].includes(risk.status));
  const risksWithResponse = reportRisks.filter((risk) => risk.response_plan?.trim());
  const topRisks = [...reportRisks]
    .sort((firstRisk, secondRisk) => (secondRisk.score || 0) - (firstRisk.score || 0))
    .slice(0, 6);
  const detailedRisks = [...reportRisks]
    .sort((firstRisk, secondRisk) => (secondRisk.score || 0) - (firstRisk.score || 0))
    .slice(0, 12);
  const responsePlanRisks = [...reportRisks]
    .filter((risk) => risk.response_plan?.trim())
    .sort((firstRisk, secondRisk) => (secondRisk.score || 0) - (firstRisk.score || 0))
    .slice(0, 8);
  const reportProjects = selectedProject ? [selectedProject] : projectsData;
  const reportClientNames = Array.from(new Set(reportProjects.map((project) => project.clients?.name).filter(Boolean)));
  const reportClients = new Set(reportProjects.map((project) => project.client_id)).size;
  const reportClientLabel = selectedProject?.clients?.name
    || (reportClientNames.length === 1 ? reportClientNames[0] : `${reportClients} clientes`);
  const generatedAt = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const reportPeriod = new Date().toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric"
  });
  const groupSummary = Object.entries(
    reportRisks.reduce<Record<string, number>>((summary, risk) => {
      summary[risk.group_name] = (summary[risk.group_name] || 0) + 1;
      return summary;
    }, {})
  ).sort((firstGroup, secondGroup) => secondGroup[1] - firstGroup[1]);
  const responsibilitySummary = Object.entries(
    reportRisks.reduce<Record<string, { count: number; totalScore: number; riskNumbers: string[] }>>((summary, risk) => {
      const owner = risk.responsible_name || "Sem responsável";
      if (!summary[owner]) {
        summary[owner] = { count: 0, totalScore: 0, riskNumbers: [] };
      }
      summary[owner].count += 1;
      summary[owner].totalScore += risk.score || 0;
      summary[owner].riskNumbers.push(risk.sequence_number ? `#${risk.sequence_number}` : "-");
      return summary;
    }, {})
  )
    .map(([owner, summary]) => ({
      owner,
      count: summary.count,
      averageScore: summary.count ? Math.round(summary.totalScore / summary.count) : 0,
      risks: summary.riskNumbers.slice(0, 4).join(", ") + (summary.riskNumbers.length > 4 ? " +" : "")
    }))
    .sort((firstOwner, secondOwner) => secondOwner.averageScore - firstOwner.averageScore);
  const recommendations = [
    highRisks.length > 0
      ? `Acompanhar semanalmente os ${highRisks.length} riscos altos ou extremos nas reuniões de status.`
      : "Manter monitoramento regular dos riscos cadastrados e revisar a matriz no ciclo de status.",
    risksWithoutResponse.length > 0
      ? `Formalizar resposta planejada para ${risksWithoutResponse.length} risco${risksWithoutResponse.length === 1 ? "" : "s"} ainda sem ação registrada.`
      : "Manter a rastreabilidade das respostas planejadas já cadastradas.",
    topRisks[0]
      ? `Priorizar o risco ${topRisks[0].sequence_number ? `#${topRisks[0].sequence_number}` : "de maior score"}: ${topRisks[0].description}`
      : "Cadastrar riscos para habilitar recomendações automáticas.",
    "Atualizar responsáveis, status e evidências antes do próximo comitê de acompanhamento."
  ];
  const executiveSummarySuggestion = `Este relatório apresenta o status atual da gestão de riscos para ${selectedProject ? "o projeto selecionado" : "o contexto consolidado"}, contemplando ${reportRisks.length} risco${reportRisks.length === 1 ? "" : "s"} identificado${reportRisks.length === 1 ? "" : "s"}. Deste total, ${highRisks.length} estão classificados como alto ou extremo e exigem atenção prioritária.`;
  const matrixContextSuggestion = `O contexto selecionado apresenta ${reportRisks.length} risco${reportRisks.length === 1 ? "" : "s"}, ${highRisks.length} em nível alto ou extremo e ${risksWithoutResponse.length} sem resposta planejada registrada. A recomendação é priorizar os riscos de maior score, revisar responsáveis e manter o plano de resposta rastreável.`;
  const detailObjectiveSuggestion = `Este relatório detalha identificação, criticidade, status, responsáveis e respostas planejadas para análise operacional dos riscos no ${selectedProject ? "projeto selecionado" : "contexto consolidado"}. A visão considera ${detailedRisks.length} risco${detailedRisks.length === 1 ? "" : "s"} priorizado${detailedRisks.length === 1 ? "" : "s"} de um total de ${reportRisks.length}.`;
  const detailResponsibilitiesSuggestion = responsibilitySummary.length > 0
    ? `O mapa de responsabilidades indica ${responsibilitySummary.length} responsável${responsibilitySummary.length === 1 ? "" : "eis"} associado${responsibilitySummary.length === 1 ? "" : "s"} aos riscos registrados. Recomenda-se validar a carga de acompanhamento, confirmar responsáveis por riscos críticos e atualizar evidências antes da próxima reunião de status.`
    : "Nenhum responsável foi informado para os riscos selecionados. Recomenda-se revisar a governança do cadastro e atribuir responsáveis antes da circulação do relatório.";
  const planGuidelinesSuggestion = `Este relatório consolida critérios de acompanhamento, estratégia de resposta e ações planejadas para governança do ciclo de riscos. O contexto possui ${risksWithResponse.length} risco${risksWithResponse.length === 1 ? "" : "s"} com resposta registrada e ${risksWithoutResponse.length} pendente${risksWithoutResponse.length === 1 ? "" : "s"} de formalização.`;
  const planCoverageSuggestion = risksWithoutResponse.length > 0
    ? `A cobertura de resposta ainda requer atenção: ${risksWithoutResponse.length} risco${risksWithoutResponse.length === 1 ? "" : "s"} permanece${risksWithoutResponse.length === 1 ? "" : "m"} sem plano registrado. Recomenda-se completar as ações em formato 5W2H, definir responsáveis e pactuar prazos de acompanhamento.`
    : "Todos os riscos aplicáveis possuem resposta planejada registrada. Recomenda-se manter a revisão periódica das ações, atualizar status e registrar evidências de execução.";
  const recommendationsSuggestion = recommendations.join("\n");
  const [executiveSummaryText, setExecutiveSummaryText] = useState(executiveSummarySuggestion);
  const [matrixContextText, setMatrixContextText] = useState(matrixContextSuggestion);
  const [detailObjectiveText, setDetailObjectiveText] = useState(detailObjectiveSuggestion);
  const [detailResponsibilitiesText, setDetailResponsibilitiesText] = useState(detailResponsibilitiesSuggestion);
  const [planGuidelinesText, setPlanGuidelinesText] = useState(planGuidelinesSuggestion);
  const [planCoverageText, setPlanCoverageText] = useState(planCoverageSuggestion);
  const [recommendationsText, setRecommendationsText] = useState(recommendationsSuggestion);

  useEffect(() => {
    setExecutiveSummaryText(executiveSummarySuggestion);
  }, [executiveSummarySuggestion]);

  useEffect(() => {
    setMatrixContextText(matrixContextSuggestion);
  }, [matrixContextSuggestion]);

  useEffect(() => {
    setDetailObjectiveText(detailObjectiveSuggestion);
  }, [detailObjectiveSuggestion]);

  useEffect(() => {
    setDetailResponsibilitiesText(detailResponsibilitiesSuggestion);
  }, [detailResponsibilitiesSuggestion]);

  useEffect(() => {
    setPlanGuidelinesText(planGuidelinesSuggestion);
  }, [planGuidelinesSuggestion]);

  useEffect(() => {
    setPlanCoverageText(planCoverageSuggestion);
  }, [planCoverageSuggestion]);

  useEffect(() => {
    setRecommendationsText(recommendationsSuggestion);
  }, [recommendationsSuggestion]);

  const matrixCells = impactAxis.flatMap((impact) =>
    probabilityAxis.map((probability) => {
      const count = reportRisks.filter((risk) =>
        risk.probability_score === probability && risk.impact_score === impact
      ).length;
      const score = probability * impact;
      return {
        key: `${probability}-${impact}`,
        count,
        severityClass: getRiskSeverityClass(score)
      };
    })
  );

  return (
    <>
      <article className="surface report-builder">
        <div className="surface-header">
          <div>
            <h3>Prévia do relatório</h3>
            <p>Monte a prévia antes de gerar arquivo Word ou PDF.</p>
          </div>
          <div className="report-actions">
            <button className="ghost-button" onClick={onLoadReports} type="button">
              Atualizar
            </button>
            {canRegisterReport ? (
              <button className="button" onClick={onRegisterReport} type="button">
                <Plus size={16} />
                Salvar no histórico
              </button>
            ) : null}
          </div>
        </div>

        {reportsError ? <p className="auth-message">{reportsError}</p> : null}

        <div className="report-controls">
          <label>
            Contexto
            <select value={reportProjectId} onChange={(event) => onReportProjectChange(event.target.value)}>
              <option value="all">Visão geral</option>
              {projectsData.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_number} - {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo de relatório
            <select value={reportType} onChange={(event) => onReportTypeChange(event.target.value as ReportType)}>
              <option value="executive">{reportTypeLabels.executive}</option>
              <option value="risk_detail">{reportTypeLabels.risk_detail}</option>
              <option value="risk_plan">{reportTypeLabels.risk_plan}</option>
            </select>
          </label>
        </div>

        <section className="report-preview">
          <div className="report-cover-page">
            <div className="report-document-cover">
              <div>
                <p className="eyebrow">Capa do relatório</p>
                <h3>Relatório de Gestão de Riscos</h3>
                <span>{reportTypeLabels[reportType]} · {selectedProject ? `${selectedProject.project_number} - ${selectedProject.name}` : "Visão consolidada"}</span>
              </div>
              <strong>Confidencial</strong>
            </div>

            <div className="report-metadata-grid">
              <div><span>Cliente</span><strong>{reportClientLabel}</strong></div>
              <div><span>Projeto</span><strong>{selectedProject?.name || "Visão consolidada"}</strong></div>
              <div><span>Período</span><strong>{reportPeriod}</strong></div>
              <div><span>Data</span><strong>{generatedAt}</strong></div>
            </div>
          </div>

          <div className="report-kpis report-document-kpis">
            <div>
              <BriefcaseBusiness size={15} />
              <span>Projetos</span>
              <strong>{reportProjects.length}</strong>
            </div>
            <div>
              <TriangleAlert size={15} />
              <span>Riscos altos/extremos</span>
              <strong>{highRisks.length}</strong>
            </div>
            <div>
              <ListChecks size={15} />
              <span>Riscos em aberto</span>
              <strong>{openRisks.length}</strong>
            </div>
            <div>
              <BarChart3 size={15} />
              <span>Sem resposta</span>
              <strong>{risksWithoutResponse.length}</strong>
            </div>
          </div>

          {reportType === "executive" ? (
            <>
              <ReportSectionTitle number={1}>Resumo executivo</ReportSectionTitle>
              <div className="report-panel document-narrative-panel">
                <ReportEditableField ariaLabel="Resumo executivo" onChange={setExecutiveSummaryText} rows={5} value={executiveSummaryText} />
              </div>

              <ReportSectionTitle number={2}>Distribuição por grupo</ReportSectionTitle>
              <div className="table report-group-table">
                <div className="table-row table-head report-group-row">
                  <span>Grupo</span>
                  <span>Qtd.</span>
                  <span>%</span>
                </div>
                {groupSummary.length === 0 ? (
                  <div className="table-row report-group-row">
                    <span>Nenhum grupo registrado</span>
                    <span>0</span>
                    <span>0%</span>
                  </div>
                ) : groupSummary.map(([group, count]) => (
                  <div className="table-row report-group-row" key={group}>
                    <span>{group}</span>
                    <span>{count}</span>
                    <span>{formatPercent(count, reportRisks.length)}</span>
                  </div>
                ))}
              </div>

              <ReportSectionTitle number={3}>Matriz de risco</ReportSectionTitle>
              <div className="report-section-grid">
                <RiskMatrixPanel extremeRisksCount={extremeRisks.length} matrixCells={matrixCells} />

                <div className="report-panel">
                  <div className="report-panel-header">
                    <h4>Contexto da matriz</h4>
                    <span>{reportRisks.length} risco{reportRisks.length === 1 ? "" : "s"} no contexto</span>
                  </div>
                  <ReportEditableField ariaLabel="Contexto da matriz" onChange={setMatrixContextText} rows={6} value={matrixContextText} />
                </div>
              </div>

              <ReportSectionTitle number={4}>Riscos prioritários</ReportSectionTitle>
              <RiskListPanel emptyText="Cadastre riscos para gerar a prévia executiva." risks={topRisks} showPlans title="Riscos prioritários" />

              <ReportSectionTitle number={5}>Próximos passos e recomendações</ReportSectionTitle>
              <div className="report-panel">
                <ReportEditableField ariaLabel="Próximos passos e recomendações" onChange={setRecommendationsText} rows={6} value={recommendationsText} />
              </div>

              <ReportSectionTitle number={6}>Assinatura e aprovação</ReportSectionTitle>
              <div className="report-approval-grid">
                <div>
                  <span>Responsável pelo relatório</span>
                  <strong>_________________________________</strong>
                </div>
                <div>
                  <span>Aprovação do cliente</span>
                  <strong>_________________________________</strong>
                </div>
              </div>
            </>
          ) : null}

          {reportType === "risk_detail" ? (
            <>
              <ReportSectionTitle number={1}>Objetivo do relatório</ReportSectionTitle>
              <div className="report-section-grid report-section-grid-detail">
                <div className="report-panel">
                  <div className="report-panel-header">
                    <h4>Inventário detalhado</h4>
                    <span>{detailedRisks.length} de {reportRisks.length} risco{reportRisks.length === 1 ? "" : "s"}</span>
                  </div>
                  <ReportEditableField ariaLabel="Objetivo do relatório detalhado" onChange={setDetailObjectiveText} rows={6} value={detailObjectiveText} />
                </div>
                <RiskMatrixPanel extremeRisksCount={extremeRisks.length} matrixCells={matrixCells} />
              </div>

              <ReportSectionTitle number={2}>Inventário de riscos e respostas</ReportSectionTitle>
              {detailedRisks.length === 0 ? (
                <div className="empty-state compact-empty">
                  <FileText size={18} />
                  <strong>Nenhum risco cadastrado</strong>
                  <span>Cadastre riscos para gerar o inventário detalhado.</span>
                </div>
              ) : (
                <div className="table report-detail-table">
                  <div className="table-row table-head report-detail-row">
                    <span>ID</span>
                    <span>Risco</span>
                    <span>Avaliação</span>
                    <span>Resposta</span>
                    <span>Status</span>
                  </div>
                  {detailedRisks.map((risk) => (
                    <div className="table-row report-detail-row" key={risk.id}>
                      <span className="mono">{risk.sequence_number ? `#${risk.sequence_number}` : "-"}</span>
                      <span>
                        <strong>{risk.description}</strong>
                        <small>{risk.projects?.project_number || "Sem projeto"} · {risk.group_name} · {risk.responsible_name || "Sem responsável"}</small>
                      </span>
                      <span>
                        <strong>{risk.score || "-"}</strong>
                        <small>{risk.probability_label || "Prob. n/i"} x {risk.impact_label || "Impacto n/i"}</small>
                      </span>
                      <span>
                        <strong>{risk.response_type ? riskResponseTypeLabels[risk.response_type] : "Não informada"}</strong>
                        <small>{risk.response_plan || "Sem ação registrada"}</small>
                      </span>
                      <span>
                        <ReportStatusPill status={riskStatusLabels[risk.status]} />
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <ReportSectionTitle number={3}>Mapa de responsabilidades</ReportSectionTitle>
              <div className="table report-responsibility-table">
                <div className="table-row table-head report-responsibility-row">
                  <span>Responsável</span>
                  <span>Riscos</span>
                  <span>Grau médio</span>
                  <span>Principais riscos</span>
                </div>
                {responsibilitySummary.length === 0 ? (
                  <div className="table-row report-responsibility-row">
                    <span>Nenhum responsável informado</span>
                    <span>0</span>
                    <span>-</span>
                    <span>-</span>
                  </div>
                ) : responsibilitySummary.map((summary) => (
                  <div className="table-row report-responsibility-row" key={summary.owner}>
                    <span>{summary.owner}</span>
                    <span>{summary.count}</span>
                    <span>{summary.averageScore}</span>
                    <span>{summary.risks}</span>
                  </div>
                ))}
              </div>

              <ReportSectionTitle number={4}>Recomendações operacionais</ReportSectionTitle>
              <div className="report-panel">
                <ReportEditableField ariaLabel="Recomendações operacionais" onChange={setDetailResponsibilitiesText} rows={6} value={detailResponsibilitiesText} />
              </div>

              <ReportSectionTitle number={5}>Assinatura e aprovação</ReportSectionTitle>
              <div className="report-approval-grid">
                <div>
                  <span>Responsável pelo relatório</span>
                  <strong>_________________________________</strong>
                </div>
                <div>
                  <span>Aprovação do cliente</span>
                  <strong>_________________________________</strong>
                </div>
              </div>
            </>
          ) : null}

          {reportType === "risk_plan" ? (
            <>
              <ReportSectionTitle number={1}>Diretrizes de gestão</ReportSectionTitle>
              <div className="report-section-grid">
                <div className="report-panel">
                  <div className="report-panel-header">
                    <h4>Plano de gestão</h4>
                    <span>{risksWithResponse.length} risco{risksWithResponse.length === 1 ? "" : "s"} com resposta</span>
                  </div>
                  <ReportEditableField ariaLabel="Diretrizes de gestão" onChange={setPlanGuidelinesText} rows={5} value={planGuidelinesText} />
                  <div className="report-governance-list">
                    <span>Escala 1 a 5 para probabilidade e impacto</span>
                    <span>Gravidade calculada por score</span>
                    <span>Resposta esperada em formato 5W2H</span>
                    <span>Revisão recomendada em reuniões de status</span>
                  </div>
                </div>

                <div className="report-panel">
                  <div className="report-panel-header">
                    <h4>Cobertura de resposta</h4>
                    <span>{risksWithoutResponse.length} pendente{risksWithoutResponse.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="report-kpis report-kpis-compact">
                    <div>
                      <span>Com resposta</span>
                      <strong>{risksWithResponse.length}</strong>
                    </div>
                    <div>
                      <span>Sem resposta</span>
                      <strong>{risksWithoutResponse.length}</strong>
                    </div>
                  </div>
                  <div className="report-editable-spacer">
                    <ReportEditableField ariaLabel="Cobertura de resposta" onChange={setPlanCoverageText} rows={5} value={planCoverageText} />
                  </div>
                </div>
              </div>

              <ReportSectionTitle number={2}>Matriz de risco</ReportSectionTitle>
              <div className="report-section-grid">
                <RiskMatrixPanel extremeRisksCount={extremeRisks.length} matrixCells={matrixCells} />

                <div className="report-panel">
                  <div className="report-panel-header">
                    <h4>Contexto da matriz</h4>
                    <span>{reportRisks.length} risco{reportRisks.length === 1 ? "" : "s"} no contexto</span>
                  </div>
                  <ReportEditableField ariaLabel="Contexto da matriz no plano de gestão" onChange={setMatrixContextText} rows={6} value={matrixContextText} />
                </div>
              </div>

              <ReportSectionTitle number={3}>Ações planejadas e respostas</ReportSectionTitle>
              <div className="report-panel">
                <div className="report-panel-header">
                  <h4>Ações planejadas (5W2H)</h4>
                  <span>{responsePlanRisks.length} {responsePlanRisks.length === 1 ? "ação" : "ações"}</span>
                </div>
                {responsePlanRisks.length === 0 ? (
                  <div className="empty-state compact-empty">
                    <ListChecks size={18} />
                    <strong>Nenhuma ação registrada</strong>
                    <span>Registre respostas planejadas nos riscos para compor o plano.</span>
                  </div>
                ) : (
                  <div className="report-action-list">
                    {responsePlanRisks.map((risk) => (
                      <div className="report-action-card" key={risk.id}>
                        <span className="mono">{risk.sequence_number ? `#${risk.sequence_number}` : "-"}</span>
                        <div>
                          <strong>{risk.description}</strong>
                          <p>{risk.response_plan}</p>
                          <small>{risk.response_type ? riskResponseTypeLabels[risk.response_type] : "Resposta não classificada"} · {risk.responsible_name || "Sem responsável"}</small>
                        </div>
                        <span className="score">{risk.score || "-"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ReportSectionTitle number={4}>Recomendações de governança</ReportSectionTitle>
              <div className="report-panel">
                <ReportEditableField ariaLabel="Recomendações de governança" onChange={setRecommendationsText} rows={6} value={recommendationsText} />
              </div>

              <ReportSectionTitle number={5}>Assinatura e aprovação</ReportSectionTitle>
              <div className="report-approval-grid">
                <div>
                  <span>Gerente de Projetos</span>
                  <strong>_________________________________</strong>
                </div>
                <div>
                  <span>Responsável pelo cliente</span>
                  <strong>_________________________________</strong>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </article>

      <article className="surface">
        <div className="surface-header">
          <div>
            <h3>Histórico</h3>
            <p>Relatórios registrados para consulta e rastreabilidade.</p>
          </div>
        </div>

        {isReportsLoading ? (
          <div className="empty-state">
            <FileText size={20} />
            <strong>Carregando relatórios</strong>
            <span>Consultando histórico liberado para seu perfil.</span>
          </div>
        ) : reportsData.length === 0 ? (
          <div className="empty-state">
            <FileText size={20} />
            <strong>Nenhum relatório registrado</strong>
            <span>Salve a prévia para criar o primeiro registro no histórico.</span>
          </div>
        ) : (
          <div className="table reports-table">
            <div className="table-row table-head reports-row">
              <span>Relatório</span>
              <span>Tipo</span>
              <span>Contexto</span>
              <span>Gerado em</span>
            </div>
            {reportsData.map((report) => (
              <div className="table-row reports-row" key={report.id}>
                <span>
                  <strong>{report.title}</strong>
                  <small>{report.file_name || "Preview registrado"}</small>
                </span>
                <span>{reportTypeLabels[report.report_type] || report.report_type}</span>
                <span>{report.projects ? `${report.projects.project_number} - ${report.projects.name}` : report.clients?.name || "Visão geral"}</span>
                <span>
                  <CalendarDays size={14} />
                  {new Date(report.generated_at).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>
    </>
  );
}
