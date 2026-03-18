import type { SupportedLocale } from "@ticket-v2/contracts";
import { audioProfiles, serviceItems, ticketTypeItems } from "../mock-api";
import { translate } from "../i18n";
import { speakAnnouncement } from "../lib/audio";

interface TriagePageProps {
  locale: SupportedLocale;
}

export function TriagePage({ locale }: TriagePageProps) {
  const audioProfile = audioProfiles[locale];
  const previewText = audioProfile.template
    .replace(/\{sequence\}/g, "A-142")
    .replace(/\{counter\}/g, locale === "en" ? "Counter 2" : locale === "pt" ? "Guiche 2" : "Box 2")
    .replace(/\{serviceName\}/g, "Laboratorio");

  return (
    <section className="page-grid">
      <div className="two-column-layout">
        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "issueTicket")}</h3>
            <span>{translate(locale, "guidedFlow")}</span>
          </div>

          <div className="form-grid">
            <label>
              {translate(locale, "service")}
              <select defaultValue="srv_caja">
                {serviceItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {translate(locale, "clientName")}
              <input placeholder="Juan Perez" />
            </label>

            <label>
              {translate(locale, "document")}
              <input placeholder="1234567" />
            </label>

            <label>
              {translate(locale, "triageObservation")}
              <textarea rows={4} placeholder="Datos clinicos, comentario operativo o nota de validacion" />
            </label>
          </div>

          <div className="ticket-type-grid compact">
            {ticketTypeItems.map((item) => (
              <button
                key={item.id}
                className="ticket-emit-button"
                style={{ background: item.color, color: item.textColor }}
                type="button"
              >
                <strong>{item.name}</strong>
                <span>{item.prefix}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel-card ticket-preview">
          <div className="card-header">
            <h3>{translate(locale, "ticketPreview")}</h3>
            <span>{translate(locale, "configurableTemplate")}</span>
          </div>

          <div className="receipt">
            <div className="receipt-brand">SAMAP</div>
            <div className="receipt-number">A-142</div>
            <div className="receipt-details">
              <span>{translate(locale, "service")}: Laboratorio</span>
              <span>Tipo: Agendado</span>
              <span>{translate(locale, "clientName")}: Juan Perez</span>
              <span>Hora: 10:42</span>
            </div>
            <p className="receipt-note">{translate(locale, "receiptInstruction")}</p>
          </div>

          <div className="announcement-box">
            <span>{translate(locale, "callPreview")}</span>
            <strong>{previewText}</strong>
          </div>

          <button className="primary-button" onClick={() => speakAnnouncement(previewText, audioProfile)} type="button">
            {translate(locale, "playAnnouncement")}
          </button>
        </article>
      </div>
    </section>
  );
}
