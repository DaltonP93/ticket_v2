import type { SupportedLocale } from "@ticket-v2/contracts";
import { useEffect, useMemo, useState } from "react";
import { translate } from "../i18n";
import { useTicketSystem } from "../store";

interface PublicPanelPageProps {
  locale: SupportedLocale;
}

export function PublicPanelPage({ locale }: PublicPanelPageProps) {
  const { currentCalls, mediaAssets, panelProfile, selectedUnitId, unitSettings, units } = useTicketSystem();
  const activeUnit = units.find((item) => item.id === selectedUnitId) ?? units[0];
  const activeSettings = unitSettings.find((item) => item.unitId === selectedUnitId) ?? unitSettings[0];
  const historyCalls = activeSettings?.panelShowHistory ? currentCalls.slice(0, 4) : [];
  const activeCall = currentCalls[0];
  const initialMediaIndex = Math.max(
    0,
    mediaAssets.findIndex((item) => item.id === activeSettings?.panelPrimaryMediaId)
  );
  const [mediaIndex, setMediaIndex] = useState(initialMediaIndex);
  const [clock, setClock] = useState(() => new Date());
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
          <div className="public-panel-media-frame">
            {activeMedia?.kind === "video" ? (
              <video autoPlay controls muted className="panel-media-element" src={activeMedia.url} />
            ) : activeMedia ? (
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
              {activeSettings?.panelShowClock ? <span>{timeLabel}</span> : null}
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
