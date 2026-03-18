import type { AudioProfile, SupportedLocale, TicketCall } from "@ticket-v2/contracts";
import { useEffect, useState } from "react";
import { audioProfiles, currentCalls, recentTickets, serviceItems, ticketTypeItems } from "../mock-api";
import { translate } from "../i18n";
import { speakAnnouncement } from "../lib/audio";

interface PublicPanelPageProps {
  locale: SupportedLocale;
}

export function PublicPanelPage({ locale }: PublicPanelPageProps) {
  const [calls, setCalls] = useState<TicketCall[]>(currentCalls);
  const [announcement, setAnnouncement] = useState(calls[0]?.announcementText ?? "");

  const activeProfile: AudioProfile = audioProfiles[locale];
  const activeCall = calls[0];

  useEffect(() => {
    setAnnouncement(activeCall?.announcementText ?? "");
  }, [activeCall]);

  function handleCallTicket() {
    const waitingTicket = recentTickets.find((ticket) => ticket.status === "waiting") ?? recentTickets[0];
    const service = serviceItems.find((item) => item.id === waitingTicket.serviceId);
    const type = ticketTypeItems.find((item) => item.id === waitingTicket.ticketTypeId);
    const counterLabel = locale === "en" ? "Counter 4" : locale === "pt" ? "Guiche 4" : "Box 4";
    const template = activeProfile.template
      .replace(/\{sequence\}/g, waitingTicket.sequence)
      .replace(/\{counter\}/g, counterLabel)
      .replace(/\{serviceName\}/g, service?.name ?? "Servicio");

    const nextCall: TicketCall = {
      ticketId: waitingTicket.id,
      sequence: waitingTicket.sequence,
      counter: counterLabel,
      serviceName: service?.name ?? "Servicio",
      ticketTypeName: type?.name ?? "Ticket",
      locale,
      announcementText: template
    };

    setCalls((prev) => [nextCall, ...prev].slice(0, 6));
    setAnnouncement(template);
    speakAnnouncement(template, activeProfile);
  }

  return (
    <section className="page-grid">
      <div className="two-column-layout">
        <article className="panel-preview public-panel">
          <div className="panel-preview-header">
            <strong>{translate(locale, "panelInstitutional")}</strong>
            <span>{translate(locale, "highlightedCall")}</span>
          </div>

          {activeCall ? (
            <>
              <div className="panel-preview-call">
                <span className="call-chip">{activeCall.sequence}</span>
                <strong>
                  {activeCall.serviceName} - {activeCall.counter}
                </strong>
                <p className="announcement-copy">{announcement}</p>
              </div>

              <button className="primary-button" onClick={handleCallTicket} type="button">
                {translate(locale, "callTicket")}
              </button>
            </>
          ) : (
            <p className="empty-copy">{translate(locale, "noCallsYet")}</p>
          )}
        </article>

        <article className="panel-card">
          <div className="card-header">
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
              <strong>{activeProfile.voiceName ?? "-"}</strong>
            </div>
            <div className="info-item">
              <span>{translate(locale, "repeat")}</span>
              <strong>{activeProfile.repeat}</strong>
            </div>
            <div className="info-item">
              <span>{translate(locale, "audioEnabled")}</span>
              <strong>{activeProfile.enabled ? "ON" : "OFF"}</strong>
            </div>
          </div>

          <div className="announcement-box">
            <span>{translate(locale, "previewAnnouncementLabel")}</span>
            <strong>{announcement}</strong>
          </div>

          <div className="list-table">
            <div className="card-header">
              <h3>{translate(locale, "recentCalls")}</h3>
              <span>{translate(locale, "callSimulatorDescription")}</span>
            </div>

            {calls.map((call) => (
              <div key={`${call.ticketId}-${call.sequence}-${call.counter}`} className="list-row">
                <strong>{call.sequence}</strong>
                <span>{call.counter}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
