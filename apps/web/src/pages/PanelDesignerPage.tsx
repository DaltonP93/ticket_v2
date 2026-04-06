import type { PanelProfile, SupportedLocale } from "@ticket-v2/contracts";
import { translate } from "../i18n";
import { speakAnnouncement } from "../lib/audio";
import { useTicketSystem } from "../store";

interface PanelDesignerPageProps {
  locale: SupportedLocale;
}

export function PanelDesignerPage({ locale }: PanelDesignerPageProps) {
  const { audioProfiles, currentCalls, panelProfile, recentTickets, updatePanelProfile } = useTicketSystem();
  const audioProfile = audioProfiles[locale];
  const previewText =
    currentCalls[0]?.announcementText ??
    audioProfile.template
      .replace(/\{sequence\}/g, "P-032")
      .replace(/\{counter\}/g, locale === "en" ? "Counter 3" : locale === "pt" ? "Guiche 3" : "Box 3")
      .replace(/\{serviceName\}/g, "Laboratorio");

  return (
    <section className="page-grid">
      <div className="two-column-layout">
        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "designer")}</h3>
            <span>{translate(locale, "brandingLayout")}</span>
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
          </div>

          <div className="card-header spaced-top">
            <h3>{translate(locale, "audioSection")}</h3>
            <span>{translate(locale, "audioDescription")}</span>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span>{translate(locale, "locale")}</span>
              <strong>{locale.toUpperCase()}</strong>
            </div>
            <div className="info-item">
              <span>{translate(locale, "voice")}</span>
              <strong>{audioProfile.voiceName ?? "-"}</strong>
            </div>
            <div className="info-item">
              <span>{translate(locale, "repeat")}</span>
              <strong>{audioProfile.repeat}</strong>
            </div>
          </div>

          <div className="announcement-box">
            <span>{translate(locale, "previewAnnouncementLabel")}</span>
            <strong>{previewText}</strong>
          </div>

          <button className="primary-button" onClick={() => speakAnnouncement(previewText, audioProfile)} type="button">
            {translate(locale, "playAnnouncement")}
          </button>
        </article>

        <article className="panel-preview" style={{ background: panelProfile.theme.background, color: panelProfile.theme.text }}>
          <div className="panel-preview-header" style={{ borderColor: panelProfile.theme.accent }}>
            <strong>{translate(locale, "panelInstitutional")}</strong>
            <span>{translate(locale, "highlightedCall")}</span>
          </div>

          <div className="panel-preview-call">
            <span className="call-chip" style={{ background: panelProfile.theme.accent }}>
              P-032
            </span>
            <strong>Laboratorio - {translate(locale, "box")} 3</strong>
            <p className="announcement-copy">{previewText}</p>
          </div>

          <div className="panel-preview-history">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="panel-history-row">
                <strong>{ticket.sequence}</strong>
                <span>{translate(locale, ticket.status)}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
