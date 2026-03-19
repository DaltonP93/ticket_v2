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
  const { audioProfiles, emitTicket, printTemplates, recentTickets, selectedUnitId, services, ticketTypes, unitSettings, units } =
    useTicketSystem();
  const activeUnit = units.find((item) => item.id === selectedUnitId) ?? units[0];
  const activeSettings = unitSettings.find((item) => item.unitId === selectedUnitId) ?? unitSettings[0];
  const activeTemplate = printTemplates[0];
  const availableServices = services.filter((item) => activeSettings?.triageServiceIds.includes(item.id));
  const [selectedServiceId, setSelectedServiceId] = useState(availableServices[0]?.id ?? services[0]?.id ?? "");
  const [clientName, setClientName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [observation, setObservation] = useState("");
  const [lastSequence, setLastSequence] = useState(recentTickets[0]?.sequence ?? "C-001");

  const selectedService = availableServices.find((item) => item.id === selectedServiceId) ?? services[0];
  const allowedTypes = ticketTypes.filter((item) =>
    selectedService?.ticketTypeIds?.length ? selectedService.ticketTypeIds.includes(item.id) : true
  );
  const selectedType = allowedTypes[0] ?? ticketTypes[0];
  const audioProfile = audioProfiles[locale];

  const previewText = useMemo(
    () =>
      audioProfile.template
        .replace(/\{sequence\}/g, lastSequence)
        .replace(/\{counter\}/g, locale === "en" ? "Counter 2" : locale === "pt" ? "Guiche 2" : "Box 2")
        .replace(/\{serviceName\}/g, selectedService?.name ?? "Servicio"),
    [audioProfile, lastSequence, locale, selectedService]
  );

  const printHtml = useMemo(() => {
    const showDate = activeSettings?.printShowDate ?? true;
    const showType = activeSettings?.printShowTicketType ?? true;
    const showUnit = activeSettings?.printShowUnitName ?? true;
    const showService = activeSettings?.printShowServiceName ?? true;
    const dateLabel = new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-PY", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date());

    return `
      <div class="ticket">
        <div class="brand">${activeSettings?.printHeader ?? activeTemplate?.header ?? activeUnit?.brandName ?? "SAMAP"}</div>
        <h1>${lastSequence}</h1>
        <div class="meta">
          ${showUnit ? `<div>Unidad: ${activeUnit?.name ?? "-"}</div>` : ""}
          ${showService ? `<div>${translate(locale, "service")}: ${selectedService?.name ?? "-"}</div>` : ""}
          ${showType ? `<div>Tipo: ${selectedType?.name ?? "-"}</div>` : ""}
          ${clientName ? `<div>${translate(locale, "clientName")}: ${clientName}</div>` : ""}
          ${documentNumber ? `<div>${translate(locale, "document")}: ${documentNumber}</div>` : ""}
          ${showDate ? `<div>${dateLabel}</div>` : ""}
        </div>
        <p class="note">${observation || activeSettings?.printFooter || translate(locale, "receiptInstruction")}</p>
      </div>
    `;
  }, [
    activeSettings,
    activeTemplate,
    activeUnit,
    clientName,
    documentNumber,
    lastSequence,
    locale,
    observation,
    selectedService,
    selectedType
  ]);

  function handleEmit(ticketTypeId: string) {
    const ticket = emitTicket({
      locale,
      serviceId: selectedServiceId,
      ticketTypeId,
      clientName,
      clientDocument: documentNumber,
      observation
    });

    setLastSequence(ticket.sequence);

    const ticketType = ticketTypes.find((item) => item.id === ticketTypeId);
    const html = printHtml
      .replace(lastSequence, ticket.sequence)
      .replace(`Tipo: ${selectedType?.name ?? "-"}`, `Tipo: ${ticketType?.name ?? selectedType?.name ?? "-"}`);

    printTicket(html);
  }

  return (
    <section className="page-grid">
      <div className="triage-kiosk-layout">
        <article className="panel-card">
          <div className="card-header">
            <div>
              <h3>{translate(locale, "issueTicket")}</h3>
              <span>{translate(locale, "serviceStepHelp")}</span>
            </div>
            <span className="status-pill">{activeUnit?.name}</span>
          </div>

          <div className="kiosk-step">
            <h4>{translate(locale, "kioskSelectService")}</h4>
            <div className="service-kiosk-grid">
              {availableServices.map((item) => (
                <button
                  key={item.id}
                  className={selectedServiceId === item.id ? "kiosk-service-button active" : "kiosk-service-button"}
                  onClick={() => setSelectedServiceId(item.id)}
                  type="button"
                >
                  <strong>{item.name}</strong>
                  <span>{item.code}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="kiosk-step">
            <h4>{translate(locale, "chooseTicketType")}</h4>
            <p className="subtitle compact">{translate(locale, "directPrint")}</p>
            <div className="ticket-type-grid compact">
              {allowedTypes.map((item) => (
                <button
                  key={item.id}
                  className="ticket-emit-button"
                  onClick={() => handleEmit(item.id)}
                  style={{ background: item.color, color: item.textColor }}
                  type="button"
                >
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="template-editor compact-grid">
            <div className="card-header">
              <h3>{translate(locale, "optionalData")}</h3>
              <span>{translate(locale, "selectedService")}: {selectedService?.name}</span>
            </div>
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
              <textarea rows={3} value={observation} onChange={(event) => setObservation(event.target.value)} />
            </label>
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
            <div className="receipt-brand">{activeSettings?.printHeader ?? activeTemplate?.header ?? activeUnit?.brandName}</div>
            <div className="receipt-number">{lastSequence}</div>
            <div className="receipt-details">
              {(activeSettings?.printShowUnitName ?? true) ? <span>Unidad: {activeUnit?.name}</span> : null}
              {(activeSettings?.printShowServiceName ?? true) ? <span>{translate(locale, "service")}: {selectedService?.name}</span> : null}
              {(activeSettings?.printShowTicketType ?? true) ? <span>Tipo: {selectedType?.name}</span> : null}
              {clientName ? <span>{translate(locale, "clientName")}: {clientName}</span> : null}
              {documentNumber ? <span>{translate(locale, "document")}: {documentNumber}</span> : null}
            </div>
            <p className="receipt-note">{observation || activeSettings?.printFooter || translate(locale, "receiptInstruction")}</p>
          </div>

          <div className="announcement-box">
            <span>{translate(locale, "highlightedCall")}</span>
            <strong>{previewText}</strong>
          </div>

          <div className="triage-last-issued">
            <span>Ultimo ticket emitido</span>
            <strong>{recentTickets[0]?.sequence ?? lastSequence}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}
