import type { PanelProfile, SupportedLocale } from "@ticket-v2/contracts";
import { useState } from "react";
import { translate } from "../i18n";
import { useTicketSystem } from "../store";

type AdminSection = "overview" | "catalog" | "users" | "print" | "panel" | "integrations";

interface AdminWorkspacePageProps {
  locale: SupportedLocale;
  section: AdminSection;
}

export function AdminWorkspacePage({ locale, section }: AdminWorkspacePageProps) {
  const {
    addDepartment,
    addService,
    addUnit,
    addUser,
    connectors,
    departments,
    panelProfile,
    printTemplates,
    profiles,
    savePrintTemplate,
    services,
    units,
    updatePanelProfile,
    users
  } = useTicketSystem();
  const [newUnitName, setNewUnitName] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCode, setNewServiceCode] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(printTemplates[0]?.id ?? "");

  const selectedTemplate = printTemplates.find((item) => item.id === selectedTemplateId) ?? printTemplates[0];

  if (section === "catalog") {
    return (
      <section className="page-grid">
        <div className="content-grid">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "unitsTitle")}</h3>
              <span>{translate(locale, "unitsSubtitle")}</span>
            </div>
            <div className="list-table">
              {units.map((item) => (
                <div key={item.id} className="list-row stacked-row">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.code}</span>
                  </div>
                  <span>{item.brandName}</span>
                </div>
              ))}
            </div>
            <div className="template-editor">
              <label>
                {translate(locale, "unitsTitle")}
                <input value={newUnitName} onChange={(event) => setNewUnitName(event.target.value)} placeholder="Nueva unidad" />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newUnitName.trim()) return;
                  addUnit({
                    name: newUnitName,
                    code: newUnitName.toUpperCase().replace(/\s+/g, "-"),
                    brandName: "SAMAP",
                    locale: "es"
                  });
                  setNewUnitName("");
                }}
                type="button"
              >
                {translate(locale, "unitsTitle")}
              </button>
            </div>
          </article>

          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "departmentsTitle")}</h3>
              <span>{translate(locale, "departmentsSubtitle")}</span>
            </div>
            <div className="list-table">
              {departments.map((item) => (
                <div key={item.id} className="list-row">
                  <strong>{item.name}</strong>
                  <span>{item.id}</span>
                </div>
              ))}
            </div>
            <div className="template-editor">
              <label>
                {translate(locale, "departmentsTitle")}
                <input value={newDepartmentName} onChange={(event) => setNewDepartmentName(event.target.value)} placeholder="Nuevo departamento" />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newDepartmentName.trim()) return;
                  addDepartment(newDepartmentName);
                  setNewDepartmentName("");
                }}
                type="button"
              >
                {translate(locale, "departmentsTitle")}
              </button>
            </div>
          </article>

          <article className="panel-card full-span">
            <div className="card-header">
              <h3>{translate(locale, "servicesAdminTitle")}</h3>
              <span>{translate(locale, "servicesAdminSubtitle")}</span>
            </div>
            <div className="list-table">
              {services.map((item) => (
                <div key={item.id} className="list-row stacked-row">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.code}</span>
                  </div>
                  <span>{item.allowPriority ? "Prioridad habilitada" : "Prioridad deshabilitada"}</span>
                </div>
              ))}
            </div>
            <div className="template-editor">
              <label>
                {translate(locale, "servicesAdminTitle")}
                <input value={newServiceName} onChange={(event) => setNewServiceName(event.target.value)} placeholder="Nuevo servicio" />
              </label>
              <label>
                Codigo
                <input value={newServiceCode} onChange={(event) => setNewServiceCode(event.target.value)} placeholder="COD" />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newServiceName.trim() || !newServiceCode.trim() || !departments[0]) return;
                  addService({
                    name: newServiceName,
                    code: newServiceCode.toUpperCase(),
                    departmentId: departments[0].id,
                    allowPriority: true
                  });
                  setNewServiceName("");
                  setNewServiceCode("");
                }}
                type="button"
              >
                {translate(locale, "servicesAdminTitle")}
              </button>
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (section === "users") {
    return (
      <section className="page-grid">
        <div className="content-grid">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "profilesTitle")}</h3>
              <span>{translate(locale, "profilesSubtitle")}</span>
            </div>
            <div className="list-table">
              {profiles.map((item) => (
                <div key={item.id} className="list-row">
                  <strong>{item.name}</strong>
                  <span>{item.scope}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "usersTitle")}</h3>
              <span>{translate(locale, "usersSubtitle")}</span>
            </div>
            <div className="list-table">
              {users.map((item) => (
                <div key={item.id} className="list-row stacked-row">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.email}</span>
                  </div>
                  <span>{item.profile}</span>
                </div>
              ))}
            </div>
            <div className="template-editor">
              <label>
                {translate(locale, "usersTitle")}
                <input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} placeholder="Nuevo usuario" />
              </label>
              <label>
                Email
                <input value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} placeholder="correo@dominio.com" />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newUserName.trim() || !newUserEmail.trim()) return;
                  addUser({
                    name: newUserName,
                    email: newUserEmail,
                    profile: profiles[0]?.name ?? "Superadmin"
                  });
                  setNewUserName("");
                  setNewUserEmail("");
                }}
                type="button"
              >
                {translate(locale, "usersTitle")}
              </button>
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (section === "print") {
    return (
      <section className="page-grid">
        <div className="two-column-layout">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "printTemplatesTitle")}</h3>
              <span>{translate(locale, "printTemplatesSubtitle")}</span>
            </div>

            <div className="list-table">
              {printTemplates.map((item) => (
                <div key={item.id} className="list-row stacked-row">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.scope}</span>
                  </div>
                  <span>{item.unit}</span>
                </div>
              ))}
            </div>

            <div className="template-editor">
              <label>
                Plantilla
                <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                  {printTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {translate(locale, "printHeader")}
                <input
                  value={selectedTemplate?.header ?? ""}
                  onChange={(event) =>
                    selectedTemplate && savePrintTemplate({ ...selectedTemplate, header: event.target.value })
                  }
                />
              </label>
              <label>
                {translate(locale, "printFooter")}
                <textarea
                  rows={4}
                  value={selectedTemplate?.footer ?? ""}
                  onChange={(event) =>
                    selectedTemplate && savePrintTemplate({ ...selectedTemplate, footer: event.target.value })
                  }
                />
              </label>
              <label>
                HTML
                <textarea
                  rows={10}
                  value={selectedTemplate?.html ?? ""}
                  onChange={(event) =>
                    selectedTemplate && savePrintTemplate({ ...selectedTemplate, html: event.target.value })
                  }
                />
              </label>
            </div>
          </article>

          <article className="panel-card ticket-preview">
            <div className="card-header">
              <h3>{translate(locale, "printPreviewTitle")}</h3>
              <span>{translate(locale, "configurableTemplate")}</span>
            </div>

            <div className="receipt">
              <div className="receipt-brand">SAMAP</div>
              <div className="receipt-number">P-032</div>
              <div className="receipt-details">
                <span>{translate(locale, "service")}: Laboratorio</span>
                <span>Tipo: Prioridad</span>
                <span>{translate(locale, "clientName")}: Ana Torres</span>
                <span>Hora: 11:12</span>
              </div>
              <p className="receipt-note">{selectedTemplate?.footer}</p>
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (section === "panel") {
    return (
      <section className="page-grid">
        <div className="two-column-layout">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "panelProfilesTitle")}</h3>
              <span>{translate(locale, "panelProfilesSubtitle")}</span>
            </div>
            <div className="form-grid">
              <label>
                {translate(locale, "layout")}
                <select
                  value={panelProfile.layout}
                  onChange={(event) => updatePanelProfile({ layout: event.target.value as PanelProfile["layout"] })}
                >
                  <option value="calls-only">Solo llamadas</option>
                  <option value="calls-history">Llamadas + historial</option>
                  <option value="calls-media">Llamadas + multimedia</option>
                </select>
              </label>
              <label>
                {translate(locale, "accentColor")}
                <input
                  type="color"
                  value={panelProfile.theme.accent}
                  onChange={(event) =>
                    updatePanelProfile({
                      theme: {
                        background: panelProfile.theme.background,
                        accent: event.target.value,
                        text: panelProfile.theme.text
                      }
                    })
                  }
                />
              </label>
              <label>
                {translate(locale, "background")}
                <input
                  type="color"
                  value={panelProfile.theme.background}
                  onChange={(event) =>
                    updatePanelProfile({
                      theme: {
                        background: event.target.value,
                        accent: panelProfile.theme.accent,
                        text: panelProfile.theme.text
                      }
                    })
                  }
                />
              </label>
              <label>
                {translate(locale, "textColor")}
                <input
                  type="color"
                  value={panelProfile.theme.text}
                  onChange={(event) =>
                    updatePanelProfile({
                      theme: {
                        background: panelProfile.theme.background,
                        accent: panelProfile.theme.accent,
                        text: event.target.value
                      }
                    })
                  }
                />
              </label>
            </div>
          </article>

          <article className="panel-preview" style={{ background: panelProfile.theme.background, color: panelProfile.theme.text }}>
            <div className="panel-preview-header" style={{ borderColor: panelProfile.theme.accent }}>
              <strong>{translate(locale, "panelInstitutional")}</strong>
              <span>{translate(locale, "highlightedCall")}</span>
            </div>
            <div className="panel-preview-call">
              <span className="call-chip" style={{ background: panelProfile.theme.accent }}>P-032</span>
              <strong>Laboratorio - Box 3</strong>
              <p className="announcement-copy">Ticket P-032, dirigirse a Box 3, servicio Laboratorio.</p>
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (section === "integrations") {
    return (
      <section className="page-grid">
        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "integrationCenter")}</h3>
            <span>{translate(locale, "integrationCenterDescription")}</span>
          </div>
          <div className="list-table">
            {connectors.map((connector) => (
              <div key={connector.id} className="list-row stacked-row">
                <div>
                  <strong>{connector.name}</strong>
                  <span>{connector.type}</span>
                </div>
                <span className="status-pill">{connector.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="metrics-grid">
        <article className="metric-card">
          <span>{translate(locale, "unitsTitle")}</span>
          <strong>{units.length}</strong>
        </article>
        <article className="metric-card">
          <span>{translate(locale, "departmentsTitle")}</span>
          <strong>{departments.length}</strong>
        </article>
        <article className="metric-card">
          <span>{translate(locale, "servicesAdminTitle")}</span>
          <strong>{services.length}</strong>
        </article>
        <article className="metric-card">
          <span>{translate(locale, "usersTitle")}</span>
          <strong>{users.length}</strong>
        </article>
      </div>

      <div className="content-grid">
        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "adminWorkspaceTitle")}</h3>
            <span>{translate(locale, "adminWorkspaceSubtitle")}</span>
          </div>
          <div className="list-table">
            <div className="list-row"><strong>{translate(locale, "unitsTitle")}</strong><span>{units[0]?.name}</span></div>
            <div className="list-row"><strong>{translate(locale, "printTemplatesTitle")}</strong><span>{printTemplates.length}</span></div>
            <div className="list-row"><strong>{translate(locale, "panelProfilesTitle")}</strong><span>1</span></div>
            <div className="list-row"><strong>{translate(locale, "integrationsTab")}</strong><span>{connectors.length}</span></div>
          </div>
        </article>

        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "nextMilestonesTitle")}</h3>
            <span>{translate(locale, "nextMilestonesSubtitle")}</span>
          </div>
          <div className="checklist">
            <div className="check-item">Catalogos por unidad</div>
            <div className="check-item">Reglas por tipo de ticket</div>
            <div className="check-item">Plantillas de impresion configurables</div>
            <div className="check-item">Paneles y playlists institucionales</div>
          </div>
        </article>
      </div>
    </section>
  );
}
