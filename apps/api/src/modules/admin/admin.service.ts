import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../../lib/security.js";
import { AttendanceService } from "../attendance/attendance.service.js";
import { CatalogService } from "../catalog/catalog.service.js";
import { IntegrationService } from "../integrations/integration.service.js";
import { SettingsService } from "../settings/settings.service.js";
import { TicketsService } from "../tickets/tickets.service.js";

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  SUPERADMIN: ["overview", "catalog", "settings", "users", "attendance", "media", "print", "panel", "integrations", "triage"],
  UNIT_ADMIN: ["overview", "catalog", "settings", "users", "attendance", "media", "print", "panel", "integrations", "triage"],
  ATTENDANCE: ["attendance"],
  TRIAGE: ["triage"]
};

const DEFAULT_PROFILES = [
  { code: "SUPERADMIN", name: "Superadmin", description: "Acceso total", permissions: DEFAULT_PERMISSIONS.SUPERADMIN },
  { code: "UNIT_ADMIN", name: "Admin de unidad", description: "Configuracion por unidad", permissions: DEFAULT_PERMISSIONS.UNIT_ADMIN },
  { code: "ATTENDANCE", name: "Atencion", description: "Operacion de atencion", permissions: DEFAULT_PERMISSIONS.ATTENDANCE },
  { code: "TRIAGE", name: "Triage", description: "Operacion de triage", permissions: DEFAULT_PERMISSIONS.TRIAGE }
];

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function resolvePermissions(code: string, value: unknown) {
  const normalized = asStringArray(value);
  return normalized.length ? normalized : (DEFAULT_PERMISSIONS[code] ?? []);
}

export class AdminService {
  private readonly catalogService = new CatalogService();
  private readonly settingsService = new SettingsService();
  private readonly attendanceService = new AttendanceService();
  private readonly integrationService = new IntegrationService();
  private readonly ticketsService = new TicketsService();

  private normalizeProfileCode(code: string) {
    return code.trim().toUpperCase();
  }

  private async ensureDefaultProfiles() {
    for (const profile of DEFAULT_PROFILES) {
      const code = this.normalizeProfileCode(profile.code);

      await prisma.adminProfile.upsert({
        where: { code },
        create: {
          code,
          name: profile.name,
          description: profile.description,
          permissions: profile.permissions
        },
        update: {
          name: profile.name,
          description: profile.description,
          permissions: profile.permissions
        }
      }).catch(() => undefined);
    }
  }

  async listProfiles() {
    await this.ensureDefaultProfiles();

    const profiles = await prisma.adminProfile.findMany({
      orderBy: { name: "asc" }
    }).catch(() => []);

    return profiles.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      permissions: resolvePermissions(item.code, item.permissions)
    }));
  }

  async createProfile(input: { code: string; name: string; description?: string; permissions?: string[] }) {
    const code = this.normalizeProfileCode(input.code);
    const created = await prisma.adminProfile.create({
      data: {
        code,
        name: input.name,
        description: input.description ?? null,
        permissions: input.permissions ?? DEFAULT_PERMISSIONS[code] ?? []
      }
    });

    return {
      id: created.id,
      code: created.code,
      name: created.name,
      description: created.description ?? "",
      permissions: resolvePermissions(created.code, created.permissions)
    };
  }

  async updateProfile(input: {
    id: string;
    name?: string;
    description?: string;
    permissions?: string[];
  }) {
    const existing = await prisma.adminProfile.findUnique({
      where: { id: input.id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Perfil no encontrado.");
    }

    const updated = await prisma.adminProfile.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.permissions !== undefined ? { permissions: input.permissions } : {})
      }
    });

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      description: updated.description ?? "",
      permissions: resolvePermissions(updated.code, updated.permissions)
    };
  }

  async deleteProfile(id: string) {
    const existing = await prisma.adminProfile.findUnique({
      where: { id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Perfil no encontrado.");
    }

    if (DEFAULT_PROFILES.some((item) => this.normalizeProfileCode(item.code) === this.normalizeProfileCode(existing.code))) {
      throw new Error("No se puede eliminar un perfil base del sistema.");
    }

    const userCount = await prisma.adminUser.count({
      where: { profileId: id }
    }).catch(() => 0);

    if (userCount > 0) {
      throw new Error("No se puede eliminar el perfil porque tiene usuarios asociados.");
    }

    await prisma.adminProfile.delete({
      where: { id }
    });

    return { success: true, id };
  }

  async listUsers(unitId?: string) {
    const users = await prisma.adminUser.findMany({
      where: unitId ? { unitId } : undefined,
      include: {
        profile: true,
        unit: true
      },
      orderBy: { fullName: "asc" }
    }).catch(() => []);

    return users.map((item) => ({
      id: item.id,
      email: item.email,
      fullName: item.fullName,
      locale: item.locale,
      active: item.active,
      profileId: item.profileId,
      profileCode: item.profile.code,
      profile: item.profile.name,
      unitId: item.unitId,
      unit: item.unit?.name ?? null
    }));
  }

  async createUser(input: {
    email: string;
    fullName: string;
    profileId: string;
    unitId?: string;
    locale?: string;
    password?: string;
  }) {
    const initialPassword = input.password?.trim() ? input.password : "Cambiar123";
    const created = await prisma.adminUser.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        profileId: input.profileId,
        unitId: input.unitId ?? null,
        locale: input.locale ?? "es",
        passwordHash: hashPassword(initialPassword),
        active: true
      },
      include: {
        profile: true,
        unit: true
      }
    });

    return {
      id: created.id,
      email: created.email,
      fullName: created.fullName,
      locale: created.locale,
      active: created.active,
      profileId: created.profileId,
      profileCode: created.profile.code,
      profile: created.profile.name,
      unitId: created.unitId,
      unit: created.unit?.name ?? null,
      initialPassword
    };
  }

  async updateUser(input: {
    id: string;
    email?: string;
    fullName?: string;
    profileId?: string;
    unitId?: string | null;
    locale?: string;
    active?: boolean;
    password?: string;
  }) {
    const existing = await prisma.adminUser.findUnique({
      where: { id: input.id },
      include: {
        profile: true,
        unit: true
      }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Usuario no encontrado.");
    }

    const updated = await prisma.adminUser.update({
      where: { id: input.id },
      data: {
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.profileId !== undefined ? { profileId: input.profileId } : {}),
        ...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
        ...(input.locale !== undefined ? { locale: input.locale } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.password !== undefined && input.password.trim() ? { passwordHash: hashPassword(input.password.trim()) } : {})
      },
      include: {
        profile: true,
        unit: true
      }
    });

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      locale: updated.locale,
      active: updated.active,
      profileId: updated.profileId,
      profileCode: updated.profile.code,
      profile: updated.profile.name,
      unitId: updated.unitId,
      unit: updated.unit?.name ?? null
    };
  }

  async deleteUser(id: string) {
    await prisma.adminUser.delete({
      where: { id }
    });

    return { success: true, id };
  }

  async workspaceSnapshot(unitId?: string, restrictToUnitScope = false) {
    const [units, departments, services, ticketTypes, locations, desks, unitSettings, panelProfiles, printTemplates, mediaAssets, panelPlaylists, connectors, profiles, users, attendance, recentTickets] =
      await Promise.all([
        this.catalogService.listUnits(),
        this.catalogService.listDepartments(),
        this.catalogService.listServices(unitId),
        this.catalogService.listTicketTypes(unitId),
        this.catalogService.listLocations(unitId),
        this.catalogService.listDesks(unitId),
        this.settingsService.listUnitSettings(),
        this.settingsService.getPanelProfiles(),
        this.settingsService.listPrintTemplates(),
        this.settingsService.listMediaAssets(),
        this.settingsService.listPanelPlaylists(),
        this.integrationService.listConnectors(unitId),
        this.listProfiles(),
        this.listUsers(unitId),
        this.attendanceService.operationalSnapshot(unitId),
        this.ticketsService.listTickets(unitId)
      ]);

    const activeUnitId = unitId ?? units[0]?.id ?? null;
    const activeUnit = units.find((item) => item.id === activeUnitId) ?? units[0] ?? null;
    const scopedUnits = restrictToUnitScope && activeUnit ? [activeUnit] : units;
    const scopedSettings = restrictToUnitScope && activeUnit ? unitSettings.filter((item) => item.unitId === activeUnit.id) : unitSettings;
    const scopedDepartmentIds = new Set(services.map((item) => item.departmentId));
    const scopedDepartments = restrictToUnitScope ? departments.filter((item) => scopedDepartmentIds.has(item.id)) : departments;
    const scopedPrintTemplates = restrictToUnitScope && activeUnit
      ? printTemplates.filter((item) => item.unit === activeUnit.name || item.scope.toLowerCase() !== "unidad")
      : printTemplates;
    const scopedMediaAssets = restrictToUnitScope && activeUnit
      ? mediaAssets.filter((item) => {
          const mediaUnitId = (item as { unitId?: string }).unitId;
          return !mediaUnitId || mediaUnitId === activeUnit.id;
        })
      : mediaAssets;
    const scopedPanelPlaylists = restrictToUnitScope && activeUnit
      ? panelPlaylists.filter((item) => !item.unitId || item.unitId === activeUnit.id)
      : panelPlaylists;
    const scopedConnectors = restrictToUnitScope && activeUnit
      ? connectors.filter((item) => !item.unitId || item.unitId === activeUnit.id)
      : connectors;
    const activeSettings = scopedSettings.find((item) => item.unitId === activeUnit?.id) ?? scopedSettings[0] ?? null;

    return {
      unit: activeUnit,
      overview: {
        units: scopedUnits.length,
        departments: scopedDepartments.length,
        services: services.length,
        users: users.length,
        desks: desks.length,
        waitingTickets: attendance.monitor.reduce((total, item) => total + item.waitingCount, 0),
        inServiceTickets: attendance.monitor.reduce((total, item) => total + item.inServiceCount, 0),
        recentTickets: recentTickets.length
      },
      units: scopedUnits,
      departments: scopedDepartments,
      services,
      ticketTypes,
      locations,
      desks,
      unitSettings: scopedSettings,
      activeUnitSettings: activeSettings,
      panelProfiles,
      printTemplates: scopedPrintTemplates,
      mediaAssets: scopedMediaAssets,
      panelPlaylists: scopedPanelPlaylists,
      connectors: scopedConnectors,
      profiles,
      users,
      attendance
    };
  }
}
