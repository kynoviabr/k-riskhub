"use client";

import {
  BriefcaseBusiness,
  Building2,
  CircleUserRound,
  Eye,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  X
} from "lucide-react";
import type { Client, ClientContactForm } from "@/lib/domain";

type ClientStatusView = "active" | "inactive";

type ClientFormState = {
  name: string;
  notes: string;
  contacts: ClientContactForm[];
};

type ClientsModuleProps = {
  clients: Client[];
  clientsError: string;
  clientStatusView: ClientStatusView;
  isClientsLoading: boolean;
  isClientModalOpen: boolean;
  selectedClient: Client | null;
  editingClientId: string | null;
  clientForm: ClientFormState;
  onStatusViewChange: (statusView: ClientStatusView) => void;
  onLoadClients: () => void;
  onOpenClientDetails: (client: Client) => void;
  onCloseClientDetails: () => void;
  onOpenEditClientModal: (client: Client) => void;
  onRequestDeleteClient: (client: Client) => void;
  onCloseClientModal: () => void;
  onClientFormChange: (nextForm: ClientFormState | ((current: ClientFormState) => ClientFormState)) => void;
  onAddClientContact: () => void;
  onRemoveClientContact: (index: number) => void;
  onUpdateClientContact: (index: number, field: keyof ClientContactForm, value: string) => void;
  onSaveClient: () => void;
};

function StatusPill({ status }: { status: string }) {
  return <span className="status-pill">{status}</span>;
}

export function ClientsModule({
  clients,
  clientsError,
  clientStatusView,
  isClientsLoading,
  isClientModalOpen,
  selectedClient,
  editingClientId,
  clientForm,
  onStatusViewChange,
  onLoadClients,
  onOpenClientDetails,
  onCloseClientDetails,
  onOpenEditClientModal,
  onRequestDeleteClient,
  onCloseClientModal,
  onClientFormChange,
  onAddClientContact,
  onRemoveClientContact,
  onUpdateClientContact,
  onSaveClient
}: ClientsModuleProps) {
  return (
    <>
      <div className="metric-grid compact-metrics">
        <article className="metric">
          <Building2 size={15} />
          <span>{clientStatusView === "active" ? "Clientes ativos" : "Clientes inativos"}</span>
          <strong>{clients.length}</strong>
        </article>
        <article className="metric">
          <ListChecks size={15} />
          <span>Status</span>
          <strong>{clientStatusView === "active" ? "Ativo" : "Inativo"}</strong>
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
            <p>
              {clientStatusView === "active"
                ? "Cadastro corporativo para vincular projetos, responsáveis e permissões."
                : "Clientes removidos logicamente, mantidos para consulta e auditoria."}
            </p>
          </div>
          <div className="surface-actions">
            <div aria-label="Filtrar clientes" className="segmented-control">
              <button
                aria-pressed={clientStatusView === "active"}
                className={clientStatusView === "active" ? "active" : ""}
                onClick={() => onStatusViewChange("active")}
                type="button"
              >
                Ativos
              </button>
              <button
                aria-pressed={clientStatusView === "inactive"}
                className={clientStatusView === "inactive" ? "active" : ""}
                onClick={() => onStatusViewChange("inactive")}
                type="button"
              >
                Inativos
              </button>
            </div>
            <button className="ghost-button" onClick={onLoadClients}>
              Atualizar
            </button>
          </div>
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
            <strong>{clientStatusView === "active" ? "Nenhum cliente ativo" : "Nenhum cliente inativo"}</strong>
            <span>
              {clientStatusView === "active"
                ? "Crie o primeiro cliente para começar a estruturar projetos e vínculos."
                : "Clientes removidos aparecerão aqui para consulta administrativa."}
            </span>
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
            {clients.map((client) => {
              const primaryContact = client.client_contacts?.find((contact) => contact.is_primary)
                || client.client_contacts?.[0];

              return (
                <div className="table-row clients-row" key={client.id}>
                  <span>
                    <button className="link-button" onClick={() => onOpenClientDetails(client)} type="button">
                      {client.name}
                    </button>
                    <small>{client.notes || "Sem observações"}</small>
                  </span>
                  <span>{primaryContact?.name || "Sem contato"}</span>
                  <span>{primaryContact?.role_title || "Não informado"}</span>
                  <span>{primaryContact?.email || "Não informado"}</span>
                  <span>
                    <StatusPill status={client.deleted_at ? "Inativo" : "Ativo"} />
                  </span>
                  <span>{primaryContact?.phone || "Não informado"}</span>
                  <span className="table-actions">
                    <button
                      aria-label={`Ver detalhes de ${client.name}`}
                      className="icon-button small-icon-button"
                      onClick={() => onOpenClientDetails(client)}
                      title="Ver detalhes"
                      type="button"
                    >
                      <Eye size={14} />
                    </button>
                    {!client.deleted_at ? (
                      <>
                        <button className="ghost-button compact-button" onClick={() => onOpenEditClientModal(client)} type="button">
                          <Pencil size={14} />
                          Editar
                        </button>
                        <button
                          aria-label={`Remover ${client.name}`}
                          className="icon-button small-icon-button danger-icon-button"
                          onClick={() => onRequestDeleteClient(client)}
                          title="Remover cliente"
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {selectedClient ? (
        <div className="modal-backdrop" role="presentation" onClick={onCloseClientDetails}>
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
              <button className="icon-button" aria-label="Fechar" onClick={onCloseClientDetails}>
                <X size={18} />
              </button>
            </div>

            <div className="detail-summary">
              <div>
                <span>Status</span>
                <strong>{selectedClient.deleted_at ? "Inativo" : "Ativo"}</strong>
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
              {!selectedClient.deleted_at ? (
                <button className="ghost-button compact-button" onClick={() => onOpenEditClientModal(selectedClient)} type="button">
                  <Pencil size={14} />
                  Editar
                </button>
              ) : null}
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

      {isClientModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={onCloseClientModal}>
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
              <button className="icon-button" aria-label="Fechar" onClick={onCloseClientModal}>
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
                  onChange={(event) => onClientFormChange((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Empresa ABC"
                />
              </label>
              <label>
                Observações
                <textarea
                  value={clientForm.notes}
                  onChange={(event) => onClientFormChange((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Informações internas do cliente"
                />
              </label>
              <div className="form-section-header">
                <div>
                  <strong>Contatos</strong>
                  <span>O primeiro contato será exibido na tela principal.</span>
                </div>
                <button className="ghost-button compact-button" type="button" onClick={onAddClientContact}>
                  <Plus size={15} />
                  Adicionar
                </button>
              </div>
              <div className="contact-form-list">
                {clientForm.contacts.map((contact, index) => (
                  <div className="contact-form-card" key={`contact-${index}`}>
                    <div className="contact-form-title">
                      <strong>Contato {index + 1}</strong>
                      <button className="icon-button small-icon-button" type="button" aria-label="Remover contato" onClick={() => onRemoveClientContact(index)}>
                        <X size={15} />
                      </button>
                    </div>
                    <label>
                      Nome
                      <input
                        required
                        value={contact.name}
                        onChange={(event) => onUpdateClientContact(index, "name", event.target.value)}
                        placeholder="Nome do contato"
                      />
                    </label>
                    <div className="form-grid two-columns">
                      <label>
                        Cargo
                        <input
                          value={contact.role_title}
                          onChange={(event) => onUpdateClientContact(index, "role_title", event.target.value)}
                          placeholder="Diretor, PMO, Sponsor"
                        />
                      </label>
                      <label>
                        Telefone
                        <input
                          type="tel"
                          inputMode="tel"
                          value={contact.phone}
                          onChange={(event) => onUpdateClientContact(index, "phone", event.target.value)}
                          placeholder="+55 11 99999-9999"
                        />
                      </label>
                    </div>
                    <label>
                      E-mail
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(event) => onUpdateClientContact(index, "email", event.target.value)}
                        placeholder="contato@empresa.com"
                      />
                    </label>
                  </div>
                ))}
              </div>
              {clientsError ? <p className="auth-message modal-message">{clientsError}</p> : null}
              <button className="button full" disabled={isClientsLoading} onClick={onSaveClient} type="button">
                <Plus size={16} />
                {isClientsLoading ? "Salvando..." : editingClientId ? "Salvar alterações" : "Salvar cliente"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
