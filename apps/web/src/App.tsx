import type { SupportedLocale } from "@ticket-v2/contracts";
import { useState } from "react";
import { Shell } from "./components/Shell";
import { translate } from "./i18n";
import { DashboardPage } from "./pages/DashboardPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { PanelDesignerPage } from "./pages/PanelDesignerPage";
import { PublicPanelPage } from "./pages/PublicPanelPage";
import { TriagePage } from "./pages/TriagePage";

type View = "dashboard" | "triage" | "panel" | "public-panel" | "integrations";

export function App() {
  const [view, setView] = useState<View>("dashboard");
  const [locale, setLocale] = useState<SupportedLocale>("es");

  const content = {
    dashboard: {
      title: translate(locale, "dashboardTitle"),
      subtitle: translate(locale, "dashboardSubtitle"),
      node: <DashboardPage locale={locale} />
    },
    triage: {
      title: translate(locale, "triageTitle"),
      subtitle: translate(locale, "triageSubtitle"),
      node: <TriagePage locale={locale} />
    },
    panel: {
      title: translate(locale, "panelTitle"),
      subtitle: translate(locale, "panelSubtitle"),
      node: <PanelDesignerPage locale={locale} />
    },
    "public-panel": {
      title: translate(locale, "publicPanelTitle"),
      subtitle: translate(locale, "publicPanelSubtitle"),
      node: <PublicPanelPage locale={locale} />
    },
    integrations: {
      title: translate(locale, "integrationsTitle"),
      subtitle: translate(locale, "integrationsSubtitle"),
      node: <IntegrationsPage locale={locale} />
    }
  }[view];

  return (
    <div>
      <div className="floating-tabs">
        <button onClick={() => setView("dashboard")} type="button">{translate(locale, "dashboardTab")}</button>
        <button onClick={() => setView("triage")} type="button">{translate(locale, "triageTab")}</button>
        <button onClick={() => setView("panel")} type="button">{translate(locale, "panelTab")}</button>
        <button onClick={() => setView("public-panel")} type="button">{translate(locale, "publicPanelTab")}</button>
        <button onClick={() => setView("integrations")} type="button">{translate(locale, "integrationsTab")}</button>
      </div>
      <Shell locale={locale} onChangeLocale={setLocale} title={content.title} subtitle={content.subtitle}>
        {content.node}
      </Shell>
    </div>
  );
}
