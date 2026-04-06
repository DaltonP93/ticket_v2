import { prisma } from "../../lib/prisma.js";
import { createSignedToken, hashPassword, verifyPassword } from "../../lib/security.js";
import { loadEnv } from "../../config/env.js";

const DEFAULT_SUPERADMIN_PERMISSIONS = ["overview", "catalog", "settings", "users", "attendance", "media", "print", "panel", "integrations", "triage"];

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export class AuthService {
  async ensureBootstrapAdmin() {
    const env = loadEnv();
    const email = env.bootstrapAdminEmail;
    const password = env.bootstrapAdminPassword;
    const fullName = env.bootstrapAdminName || "Administrador General";

    if (!email || !password) {
      return;
    }

    const adminCount = await prisma.adminUser.count().catch(() => 0);
    if (adminCount > 0) {
      return;
    }

    const superadminProfile = await prisma.adminProfile.upsert({
      where: { code: "SUPERADMIN" },
      create: {
        code: "SUPERADMIN",
        name: "Superadmin",
        description: "Acceso total",
        permissions: DEFAULT_SUPERADMIN_PERMISSIONS
      },
      update: {
        name: "Superadmin",
        description: "Acceso total",
        permissions: DEFAULT_SUPERADMIN_PERMISSIONS
      }
    });

    await prisma.adminUser.upsert({
      where: { email },
      create: {
        email,
        passwordHash: hashPassword(password),
        fullName,
        active: true,
        locale: "es",
        profileId: superadminProfile.id,
        unitId: null
      },
      update: {
        fullName,
        active: true,
        profileId: superadminProfile.id
      }
    }).catch(() => undefined);
  }

  async login(input: { email: string; password: string; secret: string }) {
    await this.ensureBootstrapAdmin();

    const user = await prisma.adminUser.findUnique({
      where: {
        email: input.email
      },
      include: {
        profile: true,
        unit: true
      }
    });

    if (!user || !user.active) {
      throw new Error("Usuario no encontrado o inactivo.");
    }

    if (!verifyPassword(input.password, user.passwordHash)) {
      throw new Error("Credenciales invalidas.");
    }

    const token = createSignedToken({ sub: user.id, email: user.email }, input.secret);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        profile: user.profile.name,
        profileCode: user.profile.code,
        permissions: asStringArray(user.profile.permissions),
        unitId: user.unitId,
        unit: user.unit?.name ?? null
      }
    };
  }

  async me(userId: string) {
    return prisma.adminUser.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        unit: true
      }
    });
  }
}
