import type { SupportedLocale } from "@ticket-v2/contracts";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "./components/AdminShell";
import { OperationalShell } from "./components/OperationalShell";
import { adminSectionFromRoute, canAccessSection, defaultRouteForAccess, resolveAccess, type AdminSection, type AppRoute } from "./lib/access";
import type { AuthUser } from "./lib/auth";
import { getStoredUser, logout } from "./lib/auth";
import { translate } from "./i18n";
import { AdminWorkspacePage } from "./pages/AdminWorkspacePage";
import { LoginPage } from "./pages/LoginPage";
import { PublicPanelPage } from "./pages/PublicPanelPage";
import { TriagePage } from "./pages/TriagePage";
import { useTicketSystem } from "./store";

const validRoutes: AppRoute[] = [
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

function getCurrentRoute(): AppRoute {
  const route = window.location.pathname as AppRoute;
  return validRoutes.includes(route) ? route : "/admin";
}

function resolveAdminCopy(locale: SupportedLocale, route: AppRoute) {
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
  const [route, setRoute] = useState<AppRoute>(getCurrentRoute());
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(() => getStoredUser());
  const { setSelectedUnit } = useTicketSystem();
  const access = resolveAccess(sessionUser);
  const adminSection = adminSectionFromRoute(route);

  function navigate(nextRoute: AppRoute) {
    window.history.pushState({}, "", nextRoute);
    setRoute(nextRoute);
  }

  useEffect(() => {
    const onPopState = () => setRoute(getCurrentRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!sessionUser) {
      return;
    }

    if (sessionUser.locale === "es" || sessionUser.locale === "en" || sessionUser.locale === "pt") {
      setLocale(sessionUser.locale);
    }

    if (sessionUser.unitId) {
      setSelectedUnit(sessionUser.unitId);
    }
  }, [sessionUser, setSelectedUnit]);

  useEffect(() => {
    if (!sessionUser) {
      return;
    }

    if (route.startsWith("/admin")) {
      if (!access.canUseAdmin || !canAccessSection(access, adminSection)) {
        navigate(defaultRouteForAccess(access));
      }
      return;
    }

    if (route === "/triage" && !access.canUseTriage && access.canUseAdmin) {
      navigate(defaultRouteForAccess(access));
    }
  }, [access, adminSection, route, sessionUser]);

  function handleLogout() {
    logout();
    setSessionUser(null);
    navigate("/login");
  }

  if (route === "/login") {
    return (
      <LoginPage
        onSuccess={() => {
          const nextUser = getStoredUser();
          setSessionUser(nextUser);
          navigate(defaultRouteForAccess(resolveAccess(nextUser)));
        }}
      />
    );
  }

  if (route.startsWith("/admin") && !sessionUser) {
    window.history.replaceState({}, "", "/login");
    return (
      <LoginPage
        onSuccess={() => {
          const nextUser = getStoredUser();
          setSessionUser(nextUser);
          navigate(defaultRouteForAccess(resolveAccess(nextUser)));
        }}
      />
    );
  }

  const adminNavigation = useMemo(
    () =>
      [
        { id: "overview", label: translate(locale, "dashboardTab"), active: route === "/admin", onClick: () => navigate("/admin") },
        { id: "catalog", label: translate(locale, "catalogTab"), active: route === "/admin/catalog", onClick: () => navigate("/admin/catalog") },
        { id: "settings", label: translate(locale, "settingsTab"), active: route === "/admin/settings", onClick: () => navigate("/admin/settings") },
        { id: "users", label: translate(locale, "usersTab"), active: route === "/admin/users", onClick: () => navigate("/admin/users") },
        { id: "attendance", label: translate(locale, "attendanceTab"), active: route === "/admin/attendance", onClick: () => navigate("/admin/attendance") },
        { id: "media", label: translate(locale, "mediaTab"), active: route === "/admin/media", onClick: () => navigate("/admin/media") },
        { id: "print", label: translate(locale, "printTab"), active: route === "/admin/print", onClick: () => navigate("/admin/print") },
        { id: "panel", label: translate(locale, "panelDesignerTab"), active: route === "/admin/panel", onClick: () => navigate("/admin/panel") },
        { id: "integrations", label: translate(locale, "integrationsTab"), active: route === "/admin/integrations", onClick: () => navigate("/admin/integrations") }
      ].filter((item) => canAccessSection(access, item.id as AdminSection)),
    [access, locale, route]
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
            {access.canUseAdmin ? (
              <button className="route-pill" onClick={() => navigate(defaultRouteForAccess(access))} type="button">
                {translate(locale, "goToAdmin")}
              </button>
            ) : null}
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
      userMeta={sessionUser ? `${sessionUser.profile}${sessionUser.unit ? ` | ${sessionUser.unit}` : ""}` : null}
      onLogout={handleLogout}
    >
      <div className="floating-tabs">
        {access.canUseTriage ? (
          <button onClick={() => navigate("/triage")} type="button">
            {translate(locale, "triageTab")}
          </button>
        ) : null}
        <button onClick={() => navigate("/panel")} type="button">
          {translate(locale, "publicPanelTab")}
        </button>
      </div>
      <AdminWorkspacePage authUser={sessionUser} locale={locale} section={adminSection} />
    </AdminShell>
  );
}
