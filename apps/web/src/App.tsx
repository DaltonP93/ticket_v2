import type { SupportedLocale } from "@ticket-v2/contracts";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "./components/AdminShell";
import { OperationalShell } from "./components/OperationalShell";
import type { AuthUser } from "./lib/auth";
import { getStoredUser, logout } from "./lib/auth";
import { translate } from "./i18n";
import { AdminWorkspacePage } from "./pages/AdminWorkspacePage";
import { LoginPage } from "./pages/LoginPage";
import { PublicPanelPage } from "./pages/PublicPanelPage";
import { TriagePage } from "./pages/TriagePage";

type Route =
  | "/admin"
  | "/admin/catalog"
  | "/admin/settings"
  | "/admin/users"
  | "/admin/attendance"
  | "/admin/media"
  | "/admin/print"
  | "/admin/panel"
  | "/admin/integrations"
  | "/login"
  | "/triage"
  | "/panel";

type AdminSection = "overview" | "catalog" | "settings" | "users" | "attendance" | "media" | "print" | "panel" | "integrations";

const validRoutes: Route[] = [
  "/admin",
  "/admin/catalog",
  "/admin/settings",
  "/admin/users",
  "/admin/attendance",
  "/admin/media",
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

function resolveAdminSection(route: Route): AdminSection {
  switch (route) {
    case "/admin/catalog":
      return "catalog";
    case "/admin/settings":
      return "settings";
    case "/admin/users":
      return "users";
    case "/admin/attendance":
      return "attendance";
    case "/admin/media":
      return "media";
    case "/admin/print":
      return "print";
    case "/admin/panel":
      return "panel";
    case "/admin/integrations":
      return "integrations";
    default:
      return "overview";
  }
}

function resolveAdminCopy(locale: SupportedLocale, route: Route) {
  switch (route) {
    case "/admin/catalog":
      return {
        title: translate(locale, "catalogTab"),
        subtitle: translate(locale, "catalogSubtitle")
      };
    case "/admin/settings":
      return {
        title: translate(locale, "unitConfiguration"),
        subtitle: translate(locale, "settingsSubtitle")
      };
    case "/admin/users":
      return {
        title: translate(locale, "usersTab"),
        subtitle: translate(locale, "usersManagementSubtitle")
      };
    case "/admin/attendance":
      return {
        title: translate(locale, "attendanceTitle"),
        subtitle: translate(locale, "attendanceSubtitle")
      };
    case "/admin/media":
      return {
        title: translate(locale, "mediaTitle"),
        subtitle: translate(locale, "mediaSubtitle")
      };
    case "/admin/print":
      return {
        title: translate(locale, "printTemplatesTitle"),
        subtitle: translate(locale, "printTemplatesSubtitle")
      };
    case "/admin/panel":
      return {
        title: translate(locale, "panelProfilesTitle"),
        subtitle: translate(locale, "panelProfilesSubtitle")
      };
    case "/admin/integrations":
      return {
        title: translate(locale, "integrationsTitle"),
        subtitle: translate(locale, "integrationsSubtitle")
      };
    default:
      return {
        title: translate(locale, "adminWorkspaceTitle"),
        subtitle: translate(locale, "adminWorkspaceSubtitle")
      };
  }
}

export function App() {
  const [locale, setLocale] = useState<SupportedLocale>("es");
  const [route, setRoute] = useState<Route>(getCurrentRoute());
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(() => getStoredUser());

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

  if (route.startsWith("/admin") && !sessionUser) {
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
      { id: "overview", label: translate(locale, "dashboardTab"), active: route === "/admin", onClick: () => navigate("/admin") },
      { id: "catalog", label: translate(locale, "catalogTab"), active: route === "/admin/catalog", onClick: () => navigate("/admin/catalog") },
      { id: "settings", label: translate(locale, "settingsTab"), active: route === "/admin/settings", onClick: () => navigate("/admin/settings") },
      { id: "users", label: translate(locale, "usersTab"), active: route === "/admin/users", onClick: () => navigate("/admin/users") },
      { id: "attendance", label: translate(locale, "attendanceTab"), active: route === "/admin/attendance", onClick: () => navigate("/admin/attendance") },
      { id: "media", label: translate(locale, "mediaTab"), active: route === "/admin/media", onClick: () => navigate("/admin/media") },
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
            <button className="route-pill" onClick={() => navigate("/admin")} type="button">
              {translate(locale, "goToAdmin")}
            </button>
            <button className="route-pill" onClick={() => navigate("/panel")} type="button">
              {translate(locale, "publicPanelTab")}
            </button>
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

  const adminCopy = resolveAdminCopy(locale, route);

  return (
    <AdminShell
      locale={locale}
      onChangeLocale={setLocale}
      title={adminCopy.title}
      subtitle={adminCopy.subtitle}
      navigation={adminNavigation}
      userName={sessionUser?.fullName ?? null}
      onLogout={handleLogout}
    >
      <div className="floating-tabs">
        <button onClick={() => navigate("/triage")} type="button">
          {translate(locale, "triageTab")}
        </button>
        <button onClick={() => navigate("/panel")} type="button">
          {translate(locale, "publicPanelTab")}
        </button>
      </div>
      <AdminWorkspacePage authUser={sessionUser} locale={locale} section={resolveAdminSection(route)} />
    </AdminShell>
  );
}
