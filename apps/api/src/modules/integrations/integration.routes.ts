import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { canManageUnit, requireAnyPermission } from "../../lib/access.js";
import { IntegrationService } from "./integration.service.js";

export async function registerIntegrationRoutes(app: FastifyInstance) {
  const service = new IntegrationService();
  const connectorSchema = z.object({
    unitId: z.string().nullable().optional(),
    code: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
    status: z.string().min(1).optional(),
    endpoint: z.string().optional(),
    enabled: z.boolean().optional(),
    events: z.array(z.string()).optional()
  });
  const connectorUpdateSchema = connectorSchema.partial();

  app.get("/integrations/connectors", async (request) => {
    const query = request.query as { unitId?: string };
    return service.listConnectors(query.unitId);
  });

  app.post("/integrations/connectors", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["integrations"]);
    if (!session) {
      return;
    }

    const payload = connectorSchema.parse(request.body);
    if (payload.unitId && !canManageUnit(session, payload.unitId)) {
      return reply.code(403).send({ message: "No puede crear conectores fuera de su unidad." });
    }
    if (!payload.unitId && session.profileCode !== "SUPERADMIN") {
      return reply.code(403).send({ message: "Solo un superadmin puede crear conectores globales." });
    }

    try {
      return reply.code(201).send(await service.createConnector(payload));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo crear el conector." });
    }
  });

  app.put("/integrations/connectors/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["integrations"]);
    if (!session) {
      return;
    }

    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const payload = connectorUpdateSchema.parse(request.body);
    const existing = (await service.listConnectors()).find((item) => item.id === params.id);

    if (!existing) {
      return reply.code(404).send({ message: "Conector no encontrado." });
    }
    if (existing.unitId && !canManageUnit(session, existing.unitId)) {
      return reply.code(403).send({ message: "No puede editar conectores fuera de su unidad." });
    }
    if (!existing.unitId && session.profileCode !== "SUPERADMIN") {
      return reply.code(403).send({ message: "Solo un superadmin puede editar conectores globales." });
    }

    try {
      return reply.send(await service.updateConnector(params.id, payload));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo actualizar el conector." });
    }
  });

  app.delete("/integrations/connectors/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["integrations"]);
    if (!session) {
      return;
    }

    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const existing = (await service.listConnectors()).find((item) => item.id === params.id);

    if (!existing) {
      return reply.code(404).send({ message: "Conector no encontrado." });
    }
    if (existing.unitId && !canManageUnit(session, existing.unitId)) {
      return reply.code(403).send({ message: "No puede eliminar conectores fuera de su unidad." });
    }
    if (!existing.unitId && session.profileCode !== "SUPERADMIN") {
      return reply.code(403).send({ message: "Solo un superadmin puede eliminar conectores globales." });
    }

    try {
      return reply.send(await service.deleteConnector(params.id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo eliminar el conector." });
    }
  });
}
