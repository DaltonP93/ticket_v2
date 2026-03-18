import type { AudioProfile, SupportedLocale, TicketCall } from "@ticket-v2/contracts";
import { useEffect } from "react";
import { translate } from "../i18n";
import { speakAnnouncement } from "../lib/audio";
import { useTicketSystem } from "../store";

interface PublicPanelPageProps {
  locale: SupportedLocale;
}

export function PublicPanelPage({ locale }: PublicPanelPageProps) {
  const { audioProfiles, callNextTicket, currentCalls: calls } = useTicketSystem();
  const activeProfile: AudioProfile = audioProfiles[locale];
  const activeCall = calls[0];

  useEffect(() => {
    if (!activeCall) {
      return;
    }

    document.title = `${activeCall.sequence} - ${activeCall.serviceName}`;
  }, [activeCall]);

  function handleCallTicket() {
    const nextCall: TicketCall | undefined = callNextTicket(locale);
    if (nextCall) {
      speakAnnouncement(nextCall.announcementText, activeProfile);
    }
  }

  return (
    <div className="public-panel-screen">
      <div className="public-panel-topbar">
        <div>
          <strong>Sistema de Ticket V2</strong>
          <span>{translate(locale, "panelInstitutional")}</span>
        </div>
        <div className="public-panel-locale">{locale.toUpperCase()}</div>
      </div>

      <section className="public-panel-stage">
        <div className="public-panel-current">
          <span className="call-chip huge">{activeCall?.sequence ?? "--"}</span>
          <h1>{activeCall?.serviceName ?? "-"}</h1>
          <h2>{activeCall?.counter ?? "-"}</h2>
          <p>{activeCall?.announcementText ?? translate(locale, "noCallsYet")}</p>
        </div>

        <div className="public-panel-side">
          <div className="public-panel-history-card">
            <div className="card-header">
              <h3>{translate(locale, "recentCalls")}</h3>
              <span>{translate(locale, "audioSection")}</span>
            </div>

            <div className="list-table">
              {calls.map((call) => (
                <div key={`${call.ticketId}-${call.sequence}-${call.counter}`} className="list-row">
                  <strong>{call.sequence}</strong>
                  <span>{call.counter}</span>
                </div>
              ))}
            </div>

            <button className="primary-button" onClick={handleCallTicket} type="button">
              {translate(locale, "callTicket")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
