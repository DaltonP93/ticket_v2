import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { canManageUnit, requireAnyPermission, requireAnyProfile } from "../../lib/access.js";
import { AdminService } from "./admin.service.js";

const createProfileSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional()
});
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional()
});

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  profileId: z.string().min(1),
  unitId: z.string().optional(),
  locale: z.enum(["es", "en", "pt"]).optional(),
  password: z.string().optional()
});
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(1).optional(),
  profileId: z.string().min(1).optional(),
  unitId: z.string().nullable().optional(),
  locale: z.enum(["es", "en", "pt"]).optional(),
  active: z.boolean().optional(),
  password: z.string().optional()
});

export async function registerAdminRoutes(app: FastifyInstance) {
  const service = new AdminService();

  app.get("/admin/workspace", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["overview", "catalog", "settings", "users", "attendance", "media", "print", "panel", "integrations", "triage"]);
    if (!session) {
      return;
    }
    const query = request.query as { unitId?: string };
    const effectiveUnitId = session.profileCode === "SUPERADMIN" ? query.unitId : session.unitId ?? query.unitId;
    return service.workspaceSnapshot(effectiveUnitId, session.profileCode !== "SUPERADMIN");
  });

  app.get("/admin/profiles", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["users"]);
    if (!session) {
      return;
    }
    return service.listProfiles();
  });
  app.post("/admin/profiles", async (request, reply) => {
    const session = await requireAnyProfile(request, reply, ["SUPERADMIN"]);
    if (!session) {
      return;
    }
    const payload = createProfileSchema.parse(request.body);
    return reply.code(201).send(await service.createProfile(payload));
  });
  app.put("/admin/profiles/:id", async (request, reply) => {
    const session = await requireAnyProfile(request, reply, ["SUPERADMIN"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const payload = updateProfileSchema.parse(request.body);
    try {
      return reply.send(await service.updateProfile({ id: params.id, ...payload }));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo actualizar el perfil." });
    }
  });
  app.delete("/admin/profiles/:id", async (request, reply) => {
    const session = await requireAnyProfile(request, reply, ["SUPERADMIN"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    try {
      return reply.send(await service.deleteProfile(params.id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo eliminar el perfil." });
    }
  });

  app.get("/admin/users", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["users"]);
    if (!session) {
      return;
    }
    const query = request.query as { unitId?: string };
    return service.listUsers(session.profileCode === "SUPERADMIN" ? query.unitId : session.unitId ?? query.unitId);
  });
  app.post("/admin/users", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["users"]);
    if (!session) {
      return;
    }
    const payload = createUserSchema.parse(request.body);
    if (!canManageUnit(session, payload.unitId ?? session.unitId)) {
      return reply.code(403).send({ message: "No puede crear usuarios fuera de su unidad." });
    }
    return reply.code(201).send(await service.createUser(payload));
  });
  app.put("/admin/users/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["users"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const existingUsers = await service.listUsers(session.profileCode === "SUPERADMIN" ? undefined : session.unitId);
    const existing = existingUsers.find((item) => item.id === params.id);
    if (!existing) {
      return reply.code(404).send({ message: "Usuario no encontrado." });
    }
    const payload = updateUserSchema.parse(request.body);
    if (!canManageUnit(session, payload.unitId === undefined ? existing.unitId ?? session.unitId : payload.unitId ?? session.unitId)) {
      return reply.code(403).send({ message: "No puede editar usuarios fuera de su unidad." });
    }
    try {
      return reply.send(await service.updateUser({ id: params.id, ...payload }));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo actualizar el usuario." });
    }
  });
  app.delete("/admin/users/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["users"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const existingUsers = await service.listUsers(session.profileCode === "SUPERADMIN" ? undefined : session.unitId);
    const existing = existingUsers.find((item) => item.id === params.id);
    if (!existing) {
      return reply.code(404).send({ message: "Usuario no encontrado." });
    }
    if (!canManageUnit(session, existing.unitId ?? session.unitId)) {
      return reply.code(403).send({ message: "No puede eliminar usuarios fuera de su unidad." });
    }
    try {
      return reply.send(await service.deleteUser(params.id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo eliminar el usuario." });
    }
  });
}
