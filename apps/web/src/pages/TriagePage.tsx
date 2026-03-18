import type { SupportedLocale } from "@ticket-v2/contracts";
import { useMemo, useState } from "react";
import { translate } from "../i18n";
import { speakAnnouncement } from "../lib/audio";
import { useTicketSystem } from "../store";

interface TriagePageProps {
  locale: SupportedLocale;
}

function printTicket(html: string) {
  const printWindow = window.open("", "_blank", "width=420,height=720");
  if (!printWindow) {
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          .ticket { max-width: 320px; margin: 0 auto; border: 1px dashed #555; padding: 20px; border-radius: 16px; }
          .ticket h1 { font-size: 44px; text-align: center; margin: 18px 0; }
          .ticket .brand { text-align: center; letter-spacing: 0.2em; font-weight: 700; }
          .ticket .meta { display: grid; gap: 8px; margin-top: 18px; }
          .ticket .note { margin-top: 18px; color: #4b5563; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function TriagePage({ locale }: TriagePageProps) {
  const { audioProfiles, emitTicket, printTemplates, services, ticketTypes } = useTicketSystem();
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? "");
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState(ticketTypes[0]?.id ?? "");
  const [clientName, setClientName] = useState("Juan Perez");
  const [documentNumber, setDocumentNumber] = useState("1234567");
  const [observation, setObservation] = useState("");
  const [sequence, setSequence] = useState("A-142");

  const selectedService = services.find((item) => item.id === selectedServiceId) ?? services[0];
  const selectedType = ticketTypes.find((item) => item.id === selectedTicketTypeId) ?? ticketTypes[0];
  const audioProfile = audioProfiles[locale];
  const activeTemplate = printTemplates[0];

  const previewText = useMemo(
    () =>
      audioProfile.template
        .replace(/\{sequence\}/g, sequence)
        .replace(/\{counter\}/g, locale === "en" ? "Counter 2" : locale === "pt" ? "Guiche 2" : "Box 2")
        .replace(/\{serviceName\}/g, selectedService?.name ?? "Laboratorio"),
    [audioProfile, locale, selectedService, sequence]
  );

  const printHtml = useMemo(
    () => `
      <div class="ticket">
        <div class="brand">SAMAP</div>
        <h1>${sequence}</h1>
        <div class="meta">
          <div>${translate(locale, "service")}: ${selectedService?.name ?? "-"}</div>
          <div>Tipo: ${selectedType?.name ?? "-"}</div>
          <div>${translate(locale, "clientName")}: ${clientName || "-"}</div>
          <div>${translate(locale, "document")}: ${documentNumber || "-"}</div>
          <div>Hora: ${new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-PY", {
            hour: "2-digit",
            minute: "2-digit"
          }).format(new Date())}</div>
        </div>
        <p class="note">${observation || translate(locale, "receiptInstruction")}</p>
      </div>
    `,
    [clientName, documentNumber, locale, observation, selectedService, selectedType, sequence]
  );

  function handleEmitAndPrint() {
    const ticket = emitTicket({
      locale,
      serviceId: selectedServiceId,
      ticketTypeId: selectedTicketTypeId,
      clientName,
      clientDocument: documentNumber,
      observation
    });
    setSequence(ticket.sequence);
    const rendered = printHtml
      .replace(sequence, ticket.sequence)
      .replace("SAMAP", activeTemplate?.header || "SAMAP");
    printTicket(rendered);
  }

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
              <select value={selectedServiceId} onChange={(event) => setSelectedServiceId(event.target.value)}>
                {services.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {translate(locale, "clientName")}
              <input value={clientName} onChange={(event) => setClientName(event.target.value)} />
            </label>

            <label>
              {translate(locale, "document")}
              <input value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} />
            </label>

            <label>
              {translate(locale, "triageObservation")}
              <textarea rows={4} value={observation} onChange={(event) => setObservation(event.target.value)} />
            </label>
          </div>

          <div className="ticket-type-grid compact">
            {ticketTypes.map((item) => (
              <button
                key={item.id}
                className={selectedTicketTypeId === item.id ? "ticket-emit-button active" : "ticket-emit-button"}
                onClick={() => setSelectedTicketTypeId(item.id)}
                style={{ background: item.color, color: item.textColor }}
                type="button"
              >
                <strong>{item.name}</strong>
                <span>{item.prefix}</span>
              </button>
            ))}
          </div>

          <div className="button-row">
            <button className="primary-button" onClick={handleEmitAndPrint} type="button">
              {translate(locale, "emitAndPrint")}
            </button>
            <button className="secondary-button" onClick={() => speakAnnouncement(previewText, audioProfile)} type="button">
              {translate(locale, "playAnnouncement")}
            </button>
          </div>
        </article>

        <article className="panel-card ticket-preview">
          <div className="card-header">
            <h3>{translate(locale, "ticketPreview")}</h3>
            <span>{translate(locale, "configurableTemplate")}</span>
          </div>

          <div className="receipt">
            <div className="receipt-brand">SAMAP</div>
            <div className="receipt-number">{sequence}</div>
            <div className="receipt-details">
              <span>{translate(locale, "service")}: {selectedService?.name}</span>
              <span>Tipo: {selectedType?.name}</span>
              <span>{translate(locale, "clientName")}: {clientName}</span>
              <span>{translate(locale, "document")}: {documentNumber}</span>
            </div>
            <p className="receipt-note">{observation || translate(locale, "receiptInstruction")}</p>
          </div>

          <div className="announcement-box">
            <span>{translate(locale, "callPreview")}</span>
            <strong>{previewText}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}
