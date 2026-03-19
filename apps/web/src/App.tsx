import type { SupportedLocale } from "@ticket-v2/contracts";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "./components/AdminShell";
import { OperationalShell } from "./components/OperationalShell";
import { translate } from "./i18n";
import { getStoredUser, logout } from "./lib/auth";
import { AdminWorkspacePage } from "./pages/AdminWorkspacePage";
import { LoginPage } from "./pages/LoginPage";
import { PublicPanelPage } from "./pages/PublicPanelPage";
import { TriagePage } from "./pages/TriagePage";

type Route =
  | "/admin"
  | "/admin/catalog"
  | "/admin/users"
  | "/admin/print"
  | "/admin/panel"
  | "/admin/integrations"
  | "/login"
  | "/triage"
  | "/panel";

const validRoutes: Route[] = [
  "/admin",
  "/admin/catalog",
  "/admin/users",
  "/admin/print",
  "/admin/panel",
  "/admin/integrations",
  "/login",
  "/triage",
  "/panel"
];

function getCurrentRoute(): Route {
  const route = window.location.pathname as Route;
  return validRoutes.includes(route) ? route : "/admin";
}

export function App() {
  const [locale, setLocale] = useState<SupportedLocale>("es");
  const [route, setRoute] = useState<Route>(getCurrentRoute());
  const [sessionUser, setSessionUser] = useState(() => getStoredUser());

  useEffect(() => {
    const onPopState = () => setRoute(getCurrentRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(nextRoute: Route) {
    window.history.pushState({}, "", nextRoute);
    setRoute(nextRoute);
  }

  function handleLogout() {
    logout();
    setSessionUser(null);
    navigate("/login");
  }

  if (route === "/login") {
    return (
      <LoginPage
        onSuccess={() => {
          setSessionUser(getStoredUser());
          navigate("/admin");
        }}
      />
    );
  }

  const adminRoute = route.startsWith("/admin");
  if (adminRoute && !sessionUser) {
    window.history.replaceState({}, "", "/login");
    return (
      <LoginPage
        onSuccess={() => {
          setSessionUser(getStoredUser());
          navigate("/admin");
        }}
      />
    );
  }

  const adminNavigation = useMemo(
    () => [
      { id: "admin", label: translate(locale, "dashboardTab"), active: route === "/admin", onClick: () => navigate("/admin") },
      { id: "catalog", label: translate(locale, "catalogTab"), active: route === "/admin/catalog", onClick: () => navigate("/admin/catalog") },
      { id: "users", label: translate(locale, "usersTab"), active: route === "/admin/users", onClick: () => navigate("/admin/users") },
      { id: "print", label: translate(locale, "printTab"), active: route === "/admin/print", onClick: () => navigate("/admin/print") },
      { id: "panel", label: translate(locale, "panelDesignerTab"), active: route === "/admin/panel", onClick: () => navigate("/admin/panel") },
      { id: "integrations", label: translate(locale, "integrationsTab"), active: route === "/admin/integrations", onClick: () => navigate("/admin/integrations") }
    ],
    [locale, route]
  );

  if (route === "/triage") {
    return (
      <OperationalShell
        locale={locale}
        onChangeLocale={setLocale}
        title={translate(locale, "triageTitle")}
        subtitle={translate(locale, "triageSubtitle")}
        actions={
          <div className="topbar-meta">
            <button className="route-pill" onClick={() => navigate("/admin")} type="button">{translate(locale, "goToAdmin")}</button>
            <button className="route-pill" onClick={() => navigate("/panel")} type="button">{translate(locale, "publicPanelTab")}</button>
          </div>
        }
      >
        <TriagePage locale={locale} />
      </OperationalShell>
    );
  }

  if (route === "/panel") {
    return <PublicPanelPage locale={locale} />;
  }

  const adminSection = route === "/admin"
    ? "overview"
    : route === "/admin/catalog"
      ? "catalog"
      : route === "/admin/users"
        ? "users"
        : route === "/admin/print"
          ? "print"
          : route === "/admin/panel"
            ? "panel"
            : "integrations";

  const adminTitle = route === "/admin"
    ? translate(locale, "adminWorkspaceTitle")
    : route === "/admin/catalog"
      ? translate(locale, "catalogTab")
      : route === "/admin/users"
        ? translate(locale, "usersTab")
        : route === "/admin/print"
          ? translate(locale, "printTab")
          : route === "/admin/panel"
            ? translate(locale, "panelDesignerTab")
            : translate(locale, "integrationsTab");

  const adminSubtitle = route === "/admin"
    ? translate(locale, "adminWorkspaceSubtitle")
    : route === "/admin/catalog"
      ? translate(locale, "catalogSubtitle")
      : route === "/admin/users"
        ? translate(locale, "usersSubtitle")
        : route === "/admin/print"
          ? translate(locale, "printTemplatesSubtitle")
          : route === "/admin/panel"
            ? translate(locale, "panelProfilesSubtitle")
            : translate(locale, "integrationCenterDescription");

  return (
    <AdminShell
      locale={locale}
      onChangeLocale={setLocale}
      title={adminTitle}
      subtitle={adminSubtitle}
      navigation={adminNavigation}
      userName={sessionUser?.fullName ?? null}
      onLogout={handleLogout}
    >
      <div className="floating-tabs">
        <button onClick={() => navigate("/triage")} type="button">{translate(locale, "triageTab")}</button>
        <button onClick={() => navigate("/panel")} type="button">{translate(locale, "publicPanelTab")}</button>
      </div>
      <AdminWorkspacePage locale={locale} section={adminSection} />
    </AdminShell>
  );
}
