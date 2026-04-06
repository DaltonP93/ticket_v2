import type { FastifyReply, FastifyRequest } from "fastify";
import { loadEnv } from "../config/env.js";
import { prisma } from "./prisma.js";
import { verifySignedToken } from "./security.js";

export interface AuthSession {
  id: string;
  email: string;
  fullName: string;
  locale: string;
  profile: string;
  profileCode: string;
  permissions: string[];
  unitId: string | null;
  unit: string | null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeProfileCode(value: string) {
  const normalized = value
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

  return normalized;
}

export async function readSession(request: FastifyRequest): Promise<AuthSession | null> {
  const authorization = request.headers.authorization;
  const token = authorization?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  const env = loadEnv();
  const parsed = verifySignedToken(token, env.authSecret);
  if (!parsed) {
    return null;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: parsed.sub },
    include: {
      profile: true,
      unit: true
    }
  }).catch(() => null);

  if (!user || !user.active) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    locale: user.locale,
    profile: user.profile.name,
    profileCode: normalizeProfileCode(user.profile.code),
    permissions: asStringArray(user.profile.permissions),
    unitId: user.unitId,
    unit: user.unit?.name ?? null
  };
}

export async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  const session = await readSession(request);

  if (!session) {
    await reply.code(401).send({ message: "Sesion requerida." });
    return null;
  }

  return session;
}

export function hasAnyProfile(session: AuthSession, profileCodes: string[]) {
  return profileCodes.includes(session.profileCode);
}

export function hasPermission(session: AuthSession, permission: string) {
  return session.profileCode === "SUPERADMIN" || session.permissions.includes(permission);
}

export function hasAnyPermission(session: AuthSession, permissions: string[]) {
  return permissions.some((permission) => hasPermission(session, permission));
}

export async function requireAnyProfile(request: FastifyRequest, reply: FastifyReply, profileCodes: string[]) {
  const session = await requireSession(request, reply);
  if (!session) {
    return null;
  }

  if (!hasAnyProfile(session, profileCodes)) {
    await reply.code(403).send({ message: "Permisos insuficientes." });
    return null;
  }

  return session;
}

export async function requireAnyPermission(request: FastifyRequest, reply: FastifyReply, permissions: string[]) {
  const session = await requireSession(request, reply);
  if (!session) {
    return null;
  }

  if (!hasAnyPermission(session, permissions)) {
    await reply.code(403).send({ message: "Permisos insuficientes." });
    return null;
  }

  return session;
}

export function canManageUnit(session: AuthSession, unitId?: string | null) {
  if (session.profileCode === "SUPERADMIN") {
    return true;
  }

  return !!session.unitId && !!unitId && session.unitId === unitId;
}

export function isAttendanceOperator(session: AuthSession) {
  return ["SUPERADMIN", "UNIT_ADMIN", "ATTENDANCE"].includes(session.profileCode);
}
