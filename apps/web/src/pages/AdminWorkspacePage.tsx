import type { Desk, PanelProfile, SupportedLocale } from "@ticket-v2/contracts";
import { useMemo, useState } from "react";
import type { AuthUser } from "../lib/auth";
import { translate } from "../i18n";
import { useTicketSystem } from "../store";

type AdminSection = "overview" | "catalog" | "settings" | "users" | "attendance" | "media" | "print" | "panel" | "integrations";
type SettingsTab = "services" | "triage" | "attendance";

interface AdminWorkspacePageProps {
  authUser: AuthUser | null;
  locale: SupportedLocale;
  section: AdminSection;
}

function statusLabel(locale: SupportedLocale, status: string) {
  if (status === "waiting" || status === "called" || status === "in_service" || status === "finished" || status === "redirected") {
    return translate(locale, status);
  }

  return status;
}

export function AdminWorkspacePage({ authUser, locale, section }: AdminWorkspacePageProps) {
  const {
    addDepartment,
    addDesk,
    addLocation,
    addMediaAsset,
    addService,
    addUnit,
    addUser,
    callNextTicket,
    connectors,
    currentCalls,
    departments,
    desks,
    finishTicket,
    locations,
    mediaAssets,
    panelProfile,
    printTemplates,
    profiles,
    recentTickets,
    savePrintTemplate,
    selectedUnitId,
    services,
    setSelectedUnit,
    ticketTypes,
    unitSettings,
    units,
    updatePanelProfile,
    updateUnitSettings,
    users
  } = useTicketSystem();

  const [settingsTab, setSettingsTab] = useState<SettingsTab>("services");
  const [newUnitName, setNewUnitName] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCode, setNewServiceCode] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newMediaTitle, setNewMediaTitle] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaKind, setNewMediaKind] = useState("image");
  const [newDeskName, setNewDeskName] = useState("");
  const [newDeskOperator, setNewDeskOperator] = useState(authUser?.fullName ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(printTemplates[0]?.id ?? "");

  const currentUnit = units.find((item) => item.id === selectedUnitId) ?? units[0];
  const currentSettings = unitSettings.find((item) => item.unitId === selectedUnitId) ?? unitSettings[0];
  const selectedTemplate = printTemplates.find((item) => item.id === selectedTemplateId) ?? printTemplates[0];
  const unitLocations = locations.filter((item) => item.unitId === selectedUnitId);
  const unitDesks = desks.filter((item) => item.unitId === selectedUnitId);
  const operatorDesks = unitDesks.filter((item) => item.operatorName === authUser?.fullName);
  const visibleDesks = operatorDesks.length ? operatorDesks : unitDesks;

  const serviceMap = useMemo(() => new Map(services.map((item) => [item.id, item])), [services]);
  const locationMap = useMemo(() => new Map(locations.map((item) => [item.id, item])), [locations]);

  function toggleTriageService(serviceId: string) {
    if (!currentSettings) {
      return;
    }

    const triageServiceIds = currentSettings.triageServiceIds.includes(serviceId)
      ? currentSettings.triageServiceIds.filter((item) => item !== serviceId)
      : [...currentSettings.triageServiceIds, serviceId];

    updateUnitSettings(currentSettings.unitId, { triageServiceIds });
  }

  function activeCallForDesk(desk: Desk) {
    return currentCalls.find((call) => {
      if (call.deskId !== desk.id) {
        return false;
      }

      const ticket = recentTickets.find((item) => item.id === call.ticketId);
      return ticket?.status === "in_service";
    });
  }

  function queueForDesk(desk: Desk) {
    return recentTickets.filter((ticket) => ticket.status === "waiting" && desk.serviceIds.includes(ticket.serviceId));
  }

  if (section === "catalog") {
    return (
      <section className="page-grid">
        <div className="content-grid three-up">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "unitsTitle")}</h3>
              <span>{translate(locale, "unitsSubtitle")}</span>
            </div>
            <div className="list-table">
              {units.map((item) => (
                <button
                  key={item.id}
                  className={item.id === selectedUnitId ? "selectable-row active" : "selectable-row"}
                  onClick={() => setSelectedUnit(item.id)}
                  type="button"
                >
                  <strong>{item.name}</strong>
                  <span>{item.code}</span>
                </button>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                {translate(locale, "unitsTitle")}
                <input value={newUnitName} onChange={(event) => setNewUnitName(event.target.value)} placeholder="Nueva unidad" />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newUnitName.trim()) {
                    return;
                  }
                  addUnit({
                    name: newUnitName,
                    code: newUnitName.toUpperCase().replace(/\s+/g, "_"),
                    brandName: "SAMAP",
                    locale: "es",
                    logoUrl: currentUnit?.logoUrl
                  });
                  setNewUnitName("");
                }}
                type="button"
              >
                Agregar unidad
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
            <div className="template-editor compact-grid">
              <label>
                {translate(locale, "departmentsTitle")}
                <input value={newDepartmentName} onChange={(event) => setNewDepartmentName(event.target.value)} />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newDepartmentName.trim()) {
                    return;
                  }
                  addDepartment(newDepartmentName);
                  setNewDepartmentName("");
                }}
                type="button"
              >
                Agregar departamento
              </button>
            </div>
          </article>

          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "locationsTitle")}</h3>
              <span>{translate(locale, "locationsSubtitle")}</span>
            </div>
            <div className="list-table">
              {unitLocations.map((item) => (
                <div key={item.id} className="list-row">
                  <strong>{item.name}</strong>
                  <span>{item.code}</span>
                </div>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                {translate(locale, "locationsTitle")}
                <input value={newLocationName} onChange={(event) => setNewLocationName(event.target.value)} />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!currentUnit || !newLocationName.trim()) {
                    return;
                  }
                  addLocation({
                    name: newLocationName,
                    code: newLocationName.toUpperCase().replace(/\s+/g, "_"),
                    unitId: currentUnit.id
                  });
                  setNewLocationName("");
                }}
                type="button"
              >
                Agregar local
              </button>
            </div>
          </article>
        </div>

        <div className="content-grid">
          <article className="panel-card">
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
                  <span>{item.allowPriority ? "Prioridad habilitada" : "Solo flujo normal"}</span>
                </div>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                {translate(locale, "servicesAdminTitle")}
                <input value={newServiceName} onChange={(event) => setNewServiceName(event.target.value)} />
              </label>
              <label>
                Codigo
                <input value={newServiceCode} onChange={(event) => setNewServiceCode(event.target.value)} />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newServiceName.trim() || !newServiceCode.trim() || !departments[0]) {
                    return;
                  }
                  addService({
                    name: newServiceName,
                    code: newServiceCode.toUpperCase(),
                    departmentId: departments[0].id,
                    allowPriority: true,
                    ticketTypeIds: ticketTypes.map((item) => item.id)
                  });
                  setNewServiceName("");
                  setNewServiceCode("");
                }}
                type="button"
              >
                Agregar servicio
              </button>
            </div>
          </article>

          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "ticketTypesTitle")}</h3>
              <span>{translate(locale, "prioritiesTitle")}</span>
            </div>
            <div className="list-table">
              {ticketTypes.map((item) => (
                <div key={item.id} className="list-row stacked-row">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.description}</span>
                  </div>
                  <span style={{ color: item.color }}>{item.prefix}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (section === "settings") {
    return (
      <section className="page-grid">
        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "unitConfiguration")}</h3>
            <span>{currentUnit?.name}</span>
          </div>

          <div className="button-row">
            {units.map((item) => (
              <button
                key={item.id}
                className={item.id === selectedUnitId ? "route-pill active-pill" : "route-pill"}
                onClick={() => setSelectedUnit(item.id)}
                type="button"
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="config-tabs">
            <button className={settingsTab === "services" ? "config-tab active" : "config-tab"} onClick={() => setSettingsTab("services")} type="button">
              {translate(locale, "serviceConfigTab")}
            </button>
            <button className={settingsTab === "triage" ? "config-tab active" : "config-tab"} onClick={() => setSettingsTab("triage")} type="button">
              {translate(locale, "triageConfigTab")}
            </button>
            <button className={settingsTab === "attendance" ? "config-tab active" : "config-tab"} onClick={() => setSettingsTab("attendance")} type="button">
              {translate(locale, "attendanceConfigTab")}
            </button>
          </div>

          {settingsTab === "services" ? (
            <div className="content-grid">
              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "printTemplatesTitle")}</h3>
                  <span>{translate(locale, "serviceConfigTab")}</span>
                </div>
                <div className="template-editor compact-grid">
                  <label>
                    {translate(locale, "printHeader")}
                    <input
                      value={currentSettings?.printHeader ?? ""}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printHeader: event.target.value })}
                    />
                  </label>
                  <label>
                    {translate(locale, "printFooter")}
                    <textarea
                      rows={4}
                      value={currentSettings?.printFooter ?? ""}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printFooter: event.target.value })}
                    />
                  </label>
                  <div className="toggle-grid">
                    <label><input checked={currentSettings?.printShowDate ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printShowDate: event.target.checked })} type="checkbox" /> Fecha</label>
                    <label><input checked={currentSettings?.printShowTicketType ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printShowTicketType: event.target.checked })} type="checkbox" /> Tipo</label>
                    <label><input checked={currentSettings?.printShowUnitName ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printShowUnitName: event.target.checked })} type="checkbox" /> Unidad</label>
                    <label><input checked={currentSettings?.printShowServiceName ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printShowServiceName: event.target.checked })} type="checkbox" /> Servicio</label>
                  </div>
                </div>
              </article>

              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "servicesAdminTitle")}</h3>
                  <span>{translate(locale, "catalogTab")}</span>
                </div>
                <div className="list-table">
                  {services.map((item) => (
                    <div key={item.id} className="list-row">
                      <strong>{item.name}</strong>
                      <span>{item.code}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          ) : null}

          {settingsTab === "triage" ? (
            <div className="content-grid">
              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "triageTitle")}</h3>
                  <span>{translate(locale, "serviceConfigTab")}</span>
                </div>
                <div className="checklist">
                  {services.map((item) => (
                    <label key={item.id} className="toggle-row">
                      <input
                        checked={currentSettings?.triageServiceIds.includes(item.id) ?? false}
                        onChange={() => toggleTriageService(item.id)}
                        type="checkbox"
                      />
                      <span>{item.name}</span>
                    </label>
                  ))}
                </div>
              </article>

              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "webhooksTitle")}</h3>
                  <span>{translate(locale, "integrationsTab")}</span>
                </div>
                <div className="template-editor compact-grid">
                  <label>
                    Pre ticket
                    <input
                      value={currentSettings?.webhooks.preTicket ?? ""}
                      onChange={(event) =>
                        currentSettings &&
                        updateUnitSettings(currentSettings.unitId, {
                          webhooks: { ...currentSettings.webhooks, preTicket: event.target.value }
                        })
                      }
                    />
                  </label>
                  <label>
                    Post ticket
                    <input
                      value={currentSettings?.webhooks.postTicket ?? ""}
                      onChange={(event) =>
                        currentSettings &&
                        updateUnitSettings(currentSettings.unitId, {
                          webhooks: { ...currentSettings.webhooks, postTicket: event.target.value }
                        })
                      }
                    />
                  </label>
                  <label>
                    On print
                    <input
                      value={currentSettings?.webhooks.onPrint ?? ""}
                      onChange={(event) =>
                        currentSettings &&
                        updateUnitSettings(currentSettings.unitId, {
                          webhooks: { ...currentSettings.webhooks, onPrint: event.target.value }
                        })
                      }
                    />
                  </label>
                </div>
              </article>
            </div>
          ) : null}

          {settingsTab === "attendance" ? (
            <div className="content-grid">
              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "assignedDesks")}</h3>
                  <span>{translate(locale, "attendanceConfigTab")}</span>
                </div>
                <div className="list-table">
                  {unitDesks.map((desk) => (
                    <div key={desk.id} className="list-row stacked-row">
                      <div>
                        <strong>{desk.name}</strong>
                        <span>{desk.operatorName}</span>
                      </div>
                      <span>{locationMap.get(desk.locationId)?.name ?? desk.name}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "locationsTitle")}</h3>
                  <span>{translate(locale, "attendanceConfigTab")}</span>
                </div>
                <div className="template-editor compact-grid">
                  <label>
                    Puesto
                    <input value={newDeskName} onChange={(event) => setNewDeskName(event.target.value)} placeholder="Box 4" />
                  </label>
                  <label>
                    Operador
                    <input value={newDeskOperator} onChange={(event) => setNewDeskOperator(event.target.value)} />
                  </label>
                  <button
                    className="primary-button"
                    onClick={() => {
                      if (!currentUnit || !unitLocations[0] || !newDeskName.trim()) {
                        return;
                      }
                      addDesk({
                        name: newDeskName,
                        unitId: currentUnit.id,
                        locationId: unitLocations[0].id,
                        operatorName: newDeskOperator || authUser?.fullName || "Operador",
                        serviceIds: currentSettings?.triageServiceIds ?? []
                      });
                      setNewDeskName("");
                    }}
                    type="button"
                  >
                    Agregar puesto
                  </button>
                </div>
              </article>
            </div>
          ) : null}
        </article>
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
            <div className="template-editor compact-grid">
              <label>
                Nombre
                <input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} />
              </label>
              <label>
                Email
                <input value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newUserName.trim() || !newUserEmail.trim()) {
                    return;
                  }
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
                Agregar usuario
              </button>
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (section === "attendance") {
    return (
      <section className="page-grid">
        <div className="content-grid attendance-grid">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "currentOperator")}</h3>
              <span>{authUser?.fullName ?? "Operador"}</span>
            </div>
            <div className="desk-grid">
              {visibleDesks.map((desk) => {
                const activeCall = activeCallForDesk(desk);
                const queue = queueForDesk(desk);
                return (
                  <article key={desk.id} className="desk-card">
                    <div className="desk-card-top">
                      <div>
                        <strong>{desk.name}</strong>
                        <span>{locationMap.get(desk.locationId)?.name ?? desk.name}</span>
                      </div>
                      <span>{desk.operatorName}</span>
                    </div>
                    <div className="desk-service-chips">
                      {desk.serviceIds.map((serviceId) => (
                        <span key={serviceId} className="desk-chip">
                          {serviceMap.get(serviceId)?.name ?? serviceId}
                        </span>
                      ))}
                    </div>
                    <div className="desk-active-box">
                      <span>{translate(locale, "activeAttention")}</span>
                      <strong>{activeCall?.sequence ?? "--"}</strong>
                    </div>
                    <div className="button-row">
                      <button className="primary-button inline-action" onClick={() => callNextTicket({ locale, deskId: desk.id })} type="button">
                        {translate(locale, "callNext")}
                      </button>
                      {activeCall ? (
                        <button className="secondary-button inline-action" onClick={() => finishTicket(activeCall.ticketId)} type="button">
                          {translate(locale, "finishAttention")}
                        </button>
                      ) : null}
                    </div>
                    <div className="queue-inline-list">
                      {queue.length ? (
                        queue.slice(0, 4).map((item) => (
                          <div key={item.id} className="list-row">
                            <strong>{item.sequence}</strong>
                            <span>{serviceMap.get(item.serviceId)?.name}</span>
                          </div>
                        ))
                      ) : (
                        <p className="empty-copy">{translate(locale, "queueEmpty")}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "waitingQueue")}</h3>
              <span>{translate(locale, "queueForDesk")}</span>
            </div>
            <div className="list-table">
              {recentTickets.map((item) => (
                <div key={item.id} className="list-row stacked-row">
                  <div>
                    <strong>{item.sequence}</strong>
                    <span>{item.metadata.serviceName as string}</span>
                  </div>
                  <span>{statusLabel(locale, item.status)}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (section === "media") {
    return (
      <section className="page-grid">
        <div className="two-column-layout">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "mediaTitle")}</h3>
              <span>{translate(locale, "panelMediaTitle")}</span>
            </div>
            <div className="list-table">
              {mediaAssets.map((asset) => (
                <div key={asset.id} className="list-row stacked-row">
                  <div>
                    <strong>{asset.title}</strong>
                    <span>{asset.kind}</span>
                  </div>
                  <span>{asset.durationSeconds}s</span>
                </div>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                Titulo
                <input value={newMediaTitle} onChange={(event) => setNewMediaTitle(event.target.value)} />
              </label>
              <label>
                URL
                <input value={newMediaUrl} onChange={(event) => setNewMediaUrl(event.target.value)} />
              </label>
              <label>
                {translate(locale, "mediaKind")}
                <select value={newMediaKind} onChange={(event) => setNewMediaKind(event.target.value)}>
                  <option value="image">{translate(locale, "mediaImage")}</option>
                  <option value="video">{translate(locale, "mediaVideo")}</option>
                </select>
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newMediaTitle.trim() || !newMediaUrl.trim()) {
                    return;
                  }
                  addMediaAsset({
                    title: newMediaTitle,
                    kind: newMediaKind,
                    url: newMediaUrl,
                    durationSeconds: newMediaKind === "video" ? 20 : 12
                  });
                  setNewMediaTitle("");
                  setNewMediaUrl("");
                }}
                type="button"
              >
                Agregar medio
              </button>
            </div>
          </article>

          <article className="panel-card media-preview-card">
            <div className="card-header">
              <h3>{translate(locale, "panelMediaTitle")}</h3>
              <span>{currentUnit?.name}</span>
            </div>
            {mediaAssets[0]?.kind === "video" ? (
              <video controls className="media-preview" src={mediaAssets[0].url} />
            ) : mediaAssets[0] ? (
              <img alt={mediaAssets[0].title} className="media-preview" src={mediaAssets[0].url} />
            ) : null}
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
            <div className="template-editor compact-grid">
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
                  onChange={(event) => selectedTemplate && savePrintTemplate({ ...selectedTemplate, header: event.target.value })}
                />
              </label>
              <label>
                {translate(locale, "printFooter")}
                <textarea
                  rows={4}
                  value={selectedTemplate?.footer ?? ""}
                  onChange={(event) => selectedTemplate && savePrintTemplate({ ...selectedTemplate, footer: event.target.value })}
                />
              </label>
              <label>
                HTML
                <textarea
                  rows={8}
                  value={selectedTemplate?.html ?? ""}
                  onChange={(event) => selectedTemplate && savePrintTemplate({ ...selectedTemplate, html: event.target.value })}
                />
              </label>
            </div>
          </article>

          <article className="panel-card ticket-preview">
            <div className="card-header">
              <h3>{translate(locale, "printPreviewTitle")}</h3>
              <span>{currentUnit?.name}</span>
            </div>
            <div className="receipt">
              <div className="receipt-brand">{selectedTemplate?.header ?? currentSettings?.printHeader}</div>
              <div className="receipt-number">C-740</div>
              <div className="receipt-details">
                <span>Unidad: {currentUnit?.name}</span>
                <span>{translate(locale, "service")}: Con Turno</span>
                <span>Tipo: Normal</span>
                <span>{translate(locale, "clientName")}: Ana Torres</span>
              </div>
              <p className="receipt-note">{selectedTemplate?.footer ?? currentSettings?.printFooter}</p>
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
              <h3>{translate(locale, "panelSettingsTitle")}</h3>
              <span>{currentUnit?.name}</span>
            </div>
            <div className="form-grid">
              <label>
                {translate(locale, "layout")}
                <select value={panelProfile.layout} onChange={(event) => updatePanelProfile({ layout: event.target.value as PanelProfile["layout"] })}>
                  <option value="calls-only">Solo llamadas</option>
                  <option value="calls-history">Llamadas + historial</option>
                  <option value="calls-media">Llamadas + multimedia</option>
                </select>
              </label>
              <label>
                {translate(locale, "accentColor")}
                <input type="color" value={panelProfile.theme.accent} onChange={(event) => updatePanelProfile({ theme: { accent: event.target.value } })} />
              </label>
              <label>
                {translate(locale, "background")}
                <input type="color" value={panelProfile.theme.background} onChange={(event) => updatePanelProfile({ theme: { background: event.target.value } })} />
              </label>
              <label>
                {translate(locale, "textColor")}
                <input type="color" value={panelProfile.theme.text} onChange={(event) => updatePanelProfile({ theme: { text: event.target.value } })} />
              </label>
              <label>
                {translate(locale, "brandingText")}
                <input
                  value={currentSettings?.panelBrandingText ?? ""}
                  onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelBrandingText: event.target.value })}
                />
              </label>
            </div>
            <div className="toggle-grid spaced-top">
              <label><input checked={currentSettings?.panelShowHistory ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelShowHistory: event.target.checked })} type="checkbox" /> {translate(locale, "panelHistory")}</label>
              <label><input checked={currentSettings?.panelShowClock ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelShowClock: event.target.checked })} type="checkbox" /> {translate(locale, "panelClock")}</label>
            </div>
          </article>

          <article className="panel-preview public-panel-preview" style={{ background: panelProfile.theme.background, color: panelProfile.theme.text }}>
            <div className="panel-preview-header" style={{ borderColor: panelProfile.theme.accent }}>
              <strong>{translate(locale, "panelInstitutional")}</strong>
              <span>{translate(locale, "highlightedCall")}</span>
            </div>
            <div className="panel-preview-call">
              <span className="call-chip" style={{ background: panelProfile.theme.accent }}>C-739</span>
              <strong>Ventanilla 03</strong>
              <p className="announcement-copy">{currentSettings?.panelBrandingText ?? "Con turno"}</p>
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
            <h3>{translate(locale, "integrationsTitle")}</h3>
            <span>{translate(locale, "integrationsSubtitle")}</span>
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
            <h3>{translate(locale, "dashboardSummary")}</h3>
            <span>{currentUnit?.name}</span>
          </div>
          <div className="list-table">
            <div className="list-row"><strong>{translate(locale, "catalogTab")}</strong><span>{services.length} servicios</span></div>
            <div className="list-row"><strong>{translate(locale, "settingsTab")}</strong><span>{currentSettings?.triageServiceIds.length ?? 0} servicios en triage</span></div>
            <div className="list-row"><strong>{translate(locale, "attendanceTab")}</strong><span>{unitDesks.length} puestos</span></div>
            <div className="list-row"><strong>{translate(locale, "mediaTab")}</strong><span>{mediaAssets.length} activos</span></div>
          </div>
        </article>

        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "dashboardCoverage")}</h3>
            <span>{translate(locale, "adminWorkspaceSubtitle")}</span>
          </div>
          <div className="checklist">
            <div className="check-item">Triage kiosco por servicio y tipo de ticket</div>
            <div className="check-item">Atencion desde el portal administrativo</div>
            <div className="check-item">Panel publico visual con historial y multimedia</div>
            <div className="check-item">Configuracion por unidad con tabs operativas</div>
          </div>
        </article>
      </div>
    </section>
  );
}
