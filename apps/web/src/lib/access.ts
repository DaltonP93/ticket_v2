import type { AuthUser } from "./auth";

export type AdminSection =
  | "overview"
  | "catalog"
  | "settings"
  | "users"
  | "attendance"
  | "media"
  | "print"
  | "panel"
  | "integrations";

export type AppRoute =
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

export interface AccessDescriptor {
  profileCode: string;
  permissions: string[];
  isSuperadmin: boolean;
  restrictToOwnUnit: boolean;
  allowedAdminSections: AdminSection[];
  canUseAdmin: boolean;
  canUseTriage: boolean;
}

const ALL_ADMIN_SECTIONS: AdminSection[] = ["overview", "catalog", "settings", "users", "attendance", "media", "print", "panel", "integrations"];

function normalizeProfileCode(user: Pick<AuthUser, "profile" | "profileCode"> | null) {
  const raw = user?.profileCode ?? user?.profile ?? "";
  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (normalized.includes("SUPERADMIN")) {
    return "SUPERADMIN";
  }

  if (normalized.includes("UNIT_ADMIN") || normalized.includes("ADMIN_DE_UNIDAD")) {
    return "UNIT_ADMIN";
  }

  if (normalized.includes("ATTENDANCE") || normalized.includes("ATENCION")) {
    return "ATTENDANCE";
  }

  if (normalized.includes("TRIAGE")) {
    return "TRIAGE";
  }

  return normalized || "SUPERADMIN";
}

function normalizePermissions(user: Pick<AuthUser, "profile" | "profileCode" | "permissions"> | null, profileCode: string) {
  const explicit = Array.isArray(user?.permissions)
    ? user.permissions.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];

  if (explicit.length) {
    return explicit;
  }

  if (profileCode === "ATTENDANCE") {
    return ["attendance"];
  }

  if (profileCode === "TRIAGE") {
    return ["triage"];
  }

  if (profileCode === "UNIT_ADMIN") {
    return [...ALL_ADMIN_SECTIONS, "triage"];
  }

  return [...ALL_ADMIN_SECTIONS, "triage"];
}

export function resolveAccess(user: Pick<AuthUser, "profile" | "profileCode" | "permissions"> | null): AccessDescriptor {
  const profileCode = normalizeProfileCode(user);
  const permissions = normalizePermissions(user, profileCode);
  const allowedAdminSections = ALL_ADMIN_SECTIONS.filter((section) => permissions.includes(section));
  const isSuperadmin = profileCode === "SUPERADMIN";

  return {
    profileCode,
    permissions,
    isSuperadmin,
    restrictToOwnUnit: !isSuperadmin,
    allowedAdminSections,
    canUseAdmin: allowedAdminSections.length > 0,
    canUseTriage: permissions.includes("triage")
  };
}

export function canAccessSection(access: AccessDescriptor, section: AdminSection) {
  return access.allowedAdminSections.includes(section);
}

export function defaultRouteForAccess(access: AccessDescriptor): AppRoute {
  if (access.canUseAdmin) {
    if (access.allowedAdminSections.includes("attendance") && access.allowedAdminSections.length === 1) {
      return "/admin/attendance";
    }

    return "/admin";
  }

  if (access.canUseTriage) {
    return "/triage";
  }

  return "/panel";
}

export function adminSectionFromRoute(route: AppRoute): AdminSection {
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
