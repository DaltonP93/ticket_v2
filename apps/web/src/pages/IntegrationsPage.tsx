import type { SupportedLocale } from "@ticket-v2/contracts";
import { connectors } from "../mock-api";
import { translate } from "../i18n";

interface IntegrationsPageProps {
  locale: SupportedLocale;
}

export function IntegrationsPage({ locale }: IntegrationsPageProps) {
  return (
    <section className="page-grid">
      <article className="panel-card">
        <div className="card-header">
          <h3>{translate(locale, "integrationCenter")}</h3>
          <span>{translate(locale, "integrationCenterDescription")}</span>
        </div>

        <div className="list-table">
          {connectors.map((connector) => (
            <div key={connector.id} className="list-row connector-row">
              <div>
                <strong>{connector.name}</strong>
                <p>{connector.type}</p>
              </div>
              <span className="status-pill">{connector.status}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
