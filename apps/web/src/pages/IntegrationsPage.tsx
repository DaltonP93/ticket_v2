import type { SupportedLocale } from "@ticket-v2/contracts";
import { translate } from "../i18n";
import { useTicketSystem } from "../store";

interface IntegrationsPageProps {
  locale: SupportedLocale;
}

export function IntegrationsPage({ locale }: IntegrationsPageProps) {
  const { connectors, selectedUnitId } = useTicketSystem();
  const visibleConnectors = connectors.filter((item) => !item.unitId || item.unitId === selectedUnitId);

  return (
    <section className="page-grid">
      <article className="panel-card">
        <div className="card-header">
          <h3>{translate(locale, "integrationCenter")}</h3>
          <span>{translate(locale, "integrationCenterDescription")}</span>
        </div>

        <div className="list-table">
          {visibleConnectors.map((connector) => (
            <div key={connector.id} className="list-row connector-row">
              <div>
                <strong>{connector.name}</strong>
                <p>{connector.type}{connector.endpoint ? ` | ${connector.endpoint}` : ""}</p>
              </div>
              <span className="status-pill">{connector.status}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
