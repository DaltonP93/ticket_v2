import type { SupportedLocale } from "@ticket-v2/contracts";
import { useEffect, useMemo, useState } from "react";
import { translate } from "../i18n";
import { useTicketSystem } from "../store";

interface PublicPanelPageProps {
  locale: SupportedLocale;
}

export function PublicPanelPage({ locale }: PublicPanelPageProps) {
  const { currentCalls, departments, services, mediaAssets, panelProfile, selectedUnitId, unitSettings, units, updateUnitSettings } = useTicketSystem();
  const activeUnit = units.find((item) => item.id === selectedUnitId) ?? units[0];
  const activeSettings = unitSettings.find((item) => item.unitId === selectedUnitId) ?? unitSettings[0];
  const panelRuntime = activeSettings?.panelRuntime;
  const visibleServiceIds = panelRuntime?.visibleServiceIds?.length ? panelRuntime.visibleServiceIds : services.map((service) => service.id);
  const filteredCalls = currentCalls.filter((call) => {
    const service = services.find((item) => item.name === call.serviceName);
    return service ? visibleServiceIds.includes(service.id) : true;
  });
  const historyCalls = (panelRuntime?.showHistory ?? activeSettings?.panelShowHistory) ? filteredCalls.slice(0, 4) : [];
  const activeCall = filteredCalls[0];
  const initialMediaIndex = Math.max(
    0,
    mediaAssets.findIndex((item) => item.id === activeSettings?.panelPrimaryMediaId)
  );
  const [mediaIndex, setMediaIndex] = useState(initialMediaIndex);
  const [clock, setClock] = useState(() => new Date());
  const [showSettings, setShowSettings] = useState(false);
  const activeMedia = mediaAssets[mediaIndex] ?? mediaAssets[0];

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mediaAssets.length) {
      return;
    }

    const timer = window.setInterval(() => {
      setMediaIndex((current) => (current + 1) % mediaAssets.length);
    }, (activeMedia?.durationSeconds ?? 12) * 1000);

    return () => window.clearInterval(timer);
  }, [activeMedia?.durationSeconds, mediaAssets.length]);

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-PY", {
        dateStyle: "long"
      }).format(clock),
    [clock, locale]
  );
  const timeLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-PY", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(clock),
    [clock, locale]
  );

  return (
    <div
      className="public-panel-screen public-panel-shell"
      style={{
        background: panelProfile.theme.background,
        color: panelProfile.theme.text
      }}
    >
      <section className="public-panel-stage split-view">
        <div className="public-panel-media-column">
          <div className="button-row panel-top-actions">
            <span className="status-pill">{activeUnit?.name}</span>
            <button className="secondary-button" onClick={() => setShowSettings((current) => !current)} type="button">
              Configuracion
            </button>
          </div>
          {showSettings && activeSettings ? (
            <div className="settings-surface compact-panel-settings">
              <div className="form-grid">
                <label>
                  Locale
                  <select
                    value={panelRuntime?.locale ?? locale}
                    onChange={(event) =>
                      updateUnitSettings(activeSettings.unitId, {
                        panelRuntime: { ...panelRuntime!, locale: event.target.value as SupportedLocale }
                      })
                    }
                  >
                    <option value="es">ES</option>
                    <option value="en">EN</option>
                    <option value="pt">PT</option>
                  </select>
                </label>
                <label>
                  Logo
                  <input value={activeUnit?.logoUrl ?? ""} readOnly />
                </label>
                <label>
                  Video / media principal
                  <select
                    value={activeSettings.panelPrimaryMediaId ?? mediaAssets[0]?.id ?? ""}
                    onChange={(event) => updateUnitSettings(activeSettings.unitId, { panelPrimaryMediaId: event.target.value })}
                  >
                    {mediaAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Server
                  <input
                    value={panelRuntime?.serverUrl ?? ""}
                    onChange={(event) =>
                      updateUnitSettings(activeSettings.unitId, {
                        panelRuntime: { ...panelRuntime!, serverUrl: event.target.value }
                      })
                    }
                  />
                </label>
                <label>
                  Username
                  <input
                    value={panelRuntime?.username ?? ""}
                    onChange={(event) =>
                      updateUnitSettings(activeSettings.unitId, {
                        panelRuntime: { ...panelRuntime!, username: event.target.value }
                      })
                    }
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={panelRuntime?.password ?? ""}
                    onChange={(event) =>
                      updateUnitSettings(activeSettings.unitId, {
                        panelRuntime: { ...panelRuntime!, password: event.target.value }
                      })
                    }
                  />
                </label>
                <label>
                  Client ID
                  <input
                    value={panelRuntime?.clientId ?? ""}
                    onChange={(event) =>
                      updateUnitSettings(activeSettings.unitId, {
                        panelRuntime: { ...panelRuntime!, clientId: event.target.value }
                      })
                    }
                  />
                </label>
                <label>
                  Client Secret
                  <input
                    value={panelRuntime?.clientSecret ?? ""}
                    onChange={(event) =>
                      updateUnitSettings(activeSettings.unitId, {
                        panelRuntime: { ...panelRuntime!, clientSecret: event.target.value }
                      })
                    }
                  />
                </label>
                <label>
                  Retries
                  <input
                    min={1}
                    type="number"
                    value={panelRuntime?.retries ?? 5}
                    onChange={(event) =>
                      updateUnitSettings(activeSettings.unitId, {
                        panelRuntime: { ...panelRuntime!, retries: Number(event.target.value) || 5 }
                      })
                    }
                  />
                </label>
              </div>
              <div className="toggle-grid">
                <label><input checked={panelRuntime?.speechEnabled ?? true} onChange={(event) => updateUnitSettings(activeSettings.unitId, { panelRuntime: { ...panelRuntime!, speechEnabled: event.target.checked } })} type="checkbox" /> Speech</label>
                <label><input checked={panelRuntime?.showMedia ?? true} onChange={(event) => updateUnitSettings(activeSettings.unitId, { panelRuntime: { ...panelRuntime!, showMedia: event.target.checked } })} type="checkbox" /> Multimedia</label>
                <label><input checked={panelRuntime?.showHistory ?? true} onChange={(event) => updateUnitSettings(activeSettings.unitId, { panelRuntime: { ...panelRuntime!, showHistory: event.target.checked } })} type="checkbox" /> Historial</label>
                <label><input checked={panelRuntime?.showClock ?? true} onChange={(event) => updateUnitSettings(activeSettings.unitId, { panelRuntime: { ...panelRuntime!, showClock: event.target.checked } })} type="checkbox" /> Reloj</label>
              </div>
              <div className="checklist">
                {services.map((service) => (
                  <label key={service.id} className="toggle-row">
                    <input
                      checked={visibleServiceIds.includes(service.id)}
                      onChange={() => {
                        const nextIds = visibleServiceIds.includes(service.id)
                          ? visibleServiceIds.filter((item) => item !== service.id)
                          : [...visibleServiceIds, service.id];
                        updateUnitSettings(activeSettings.unitId, {
                          panelRuntime: { ...panelRuntime!, visibleServiceIds: nextIds }
                        });
                      }}
                      type="checkbox"
                    />
                    <span>{service.name}</span>
                  </label>
                ))}
              </div>
              <div className="checklist">
                {departments.map((department) => (
                  <label key={department.id} className="toggle-row">
                    <input
                      checked={panelRuntime?.visibleDepartmentIds?.includes(department.id) ?? false}
                      onChange={() => {
                        const currentIds = panelRuntime?.visibleDepartmentIds ?? [];
                        const nextIds = currentIds.includes(department.id)
                          ? currentIds.filter((item) => item !== department.id)
                          : [...currentIds, department.id];
                        updateUnitSettings(activeSettings.unitId, {
                          panelRuntime: { ...panelRuntime!, visibleDepartmentIds: nextIds }
                        });
                      }}
                      type="checkbox"
                    />
                    <span>{department.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <div className="public-panel-media-frame">
            {(panelRuntime?.showMedia ?? true) && activeMedia?.kind === "video" ? (
              <video autoPlay controls muted className="panel-media-element" src={activeMedia.url} />
            ) : (panelRuntime?.showMedia ?? true) && activeMedia ? (
              <img alt={activeMedia.title} className="panel-media-element" src={activeMedia.url} />
            ) : (
              <div className="panel-media-empty">{translate(locale, "mediaTitle")}</div>
            )}
          </div>

          {historyCalls.length ? (
            <div className="public-panel-history-strip">
              <h3>{translate(locale, "recentCalls")}</h3>
              <div className="history-ticket-grid">
                {historyCalls.map((call) => (
                  <article key={`${call.ticketId}-${call.calledAt}`} className="history-ticket-card">
                    <strong>{call.sequence}</strong>
                    <span>{call.counter}</span>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="public-panel-call-column" style={{ background: panelProfile.theme.accent }}>
          <div className="public-call-stage">
            <span className="public-call-type">{activeCall?.ticketTypeName ?? "Normal"}</span>
            <strong className="public-call-sequence">{activeCall?.sequence ?? "--"}</strong>
            <div className="public-call-counter">{activeCall?.counter ?? "--"}</div>
            <div className="public-call-branding">{activeSettings?.panelBrandingText ?? activeUnit?.brandName ?? "SAMAP"}</div>
          </div>

          <footer className="public-panel-footer">
            <div>
              <strong>{dateLabel}</strong>
              {(panelRuntime?.showClock ?? activeSettings?.panelShowClock) ? <span>{timeLabel}</span> : null}
            </div>
            <div className="public-panel-footer-brand">
              {activeUnit?.logoUrl ? <img alt={activeUnit.brandName} src={activeUnit.logoUrl} /> : null}
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
