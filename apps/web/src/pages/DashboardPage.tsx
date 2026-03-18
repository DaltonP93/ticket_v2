import type { SupportedLocale } from "@ticket-v2/contracts";
import { connectors, recentTickets, serviceItems, stats, ticketTypeItems } from "../mock-api";
import { translate } from "../i18n";

interface DashboardPageProps {
  locale: SupportedLocale;
}

export function DashboardPage({ locale }: DashboardPageProps) {
  return (
    <section className="page-grid">
      <div className="metrics-grid">
        <article className="metric-card">
          <span>{translate(locale, "ticketsToday")}</span>
          <strong>{stats.ticketsToday}</strong>
        </article>
        <article className="metric-card">
          <span>{translate(locale, "averageWait")}</span>
          <strong>{stats.averageWaitMinutes} min</strong>
        </article>
        <article className="metric-card">
          <span>{translate(locale, "activeServices")}</span>
          <strong>{stats.activeServices}</strong>
        </article>
        <article className="metric-card">
          <span>{translate(locale, "integrationsOnline")}</span>
          <strong>{stats.integrationsOnline}</strong>
        </article>
      </div>

      <div className="content-grid">
        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "ticketTypes")}</h3>
            <span>{translate(locale, "richExperience")}</span>
          </div>
          <div className="ticket-type-grid">
            {ticketTypeItems.map((item) => (
              <div
                key={item.id}
                className="ticket-type-card"
                style={{ background: item.color, color: item.textColor }}
              >
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "configuredServices")}</h3>
            <span>{translate(locale, "operationByDepartment")}</span>
          </div>
          <div className="list-table">
            {serviceItems.map((item) => (
              <div key={item.id} className="list-row">
                <strong>{item.name}</strong>
                <span>{item.code}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "latestTickets")}</h3>
            <span>{translate(locale, "operationsSummary")}</span>
          </div>
          <div className="list-table">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="list-row emphasized">
                <strong>{ticket.sequence}</strong>
                <span>{translate(locale, ticket.status)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "connectors")}</h3>
            <span>{translate(locale, "enterpriseIntegrations")}</span>
          </div>
          <div className="list-table">
            {connectors.map((connector) => (
              <div key={connector.id} className="list-row">
                <strong>{connector.name}</strong>
                <span>{connector.status}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
