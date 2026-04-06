import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { canManageUnit, readSession, requireAnyPermission } from "../../lib/access.js";
import { AttendanceService } from "./attendance.service.js";

const callSchema = z.object({
  deskId: z.string().min(1),
  locale: z.enum(["es", "en", "pt"])
});

const finishSchema = z.object({
  ticketId: z.string().min(1)
});

export async function registerAttendanceRoutes(app: FastifyInstance) {
  const service = new AttendanceService();

  app.get("/attendance/desks", async (request) => {
    const query = request.query as { unitId?: string };
    const session = await readSession(request);
    const unitId = session && !canManageUnit(session, query.unitId ?? session.unitId) ? session.unitId ?? undefined : query.unitId;
    return service.listDesks(unitId);
  });

  app.get("/attendance/desks-state", async (request) => {
    const query = request.query as { unitId?: string };
    const session = await readSession(request);
    const unitId = session && !canManageUnit(session, query.unitId ?? session.unitId) ? session.unitId ?? undefined : query.unitId;
    return service.desksState(unitId);
  });

  app.get("/attendance/queue", async (request, reply) => {
    const query = request.query as { deskId?: string };

    if (!query.deskId) {
      return [];
    }

    const session = await readSession(request);
    const desk = await service.findDeskById(query.deskId);
    if (!desk) {
      return [];
    }
    if (session && !canManageUnit(session, desk.unitId)) {
      return reply.code(403).send({ message: "No puede consultar la fila de otra unidad." });
    }

    try {
      return await service.queueForDesk(query.deskId);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo consultar la fila." });
    }
  });

  app.get("/attendance/current-call", async (request, reply) => {
    const query = request.query as { deskId?: string };

    if (!query.deskId) {
      return null;
    }

    const session = await readSession(request);
    const desk = await service.findDeskById(query.deskId);
    if (!desk) {
      return null;
    }
    if (session && !canManageUnit(session, desk.unitId)) {
      return reply.code(403).send({ message: "No puede consultar llamados de otra unidad." });
    }

    try {
      return await service.currentCallForDesk(query.deskId);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo consultar el llamado actual." });
    }
  });

  app.get("/attendance/monitor", async (request) => {
    const query = request.query as { unitId?: string };
    const session = await readSession(request);
    const unitId = session && !canManageUnit(session, query.unitId ?? session.unitId) ? session.unitId ?? undefined : query.unitId;
    return service.monitorSummary(unitId);
  });

  app.get("/attendance/snapshot", async (request) => {
    const query = request.query as { unitId?: string };
    const session = await readSession(request);
    const unitId = session && !canManageUnit(session, query.unitId ?? session.unitId) ? session.unitId ?? undefined : query.unitId;
    return service.operationalSnapshot(unitId);
  });

  app.get("/attendance/search", async (request, reply) => {
    const query = request.query as { sequence?: string };
    if (!query.sequence) {
      return null;
    }
    const session = await readSession(request);
    try {
      return await service.findTicket(query.sequence, session && session.profileCode !== "SUPERADMIN" ? session.unitId ?? undefined : undefined);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo buscar el ticket." });
    }
  });

  app.post("/attendance/call-next", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["attendance"]);
    if (!session) {
      return;
    }
    const payload = callSchema.parse(request.body);
    const desk = await service.findDeskById(payload.deskId);
    if (!desk) {
      return reply.code(404).send({ message: "Puesto no encontrado." });
    }
    if (!canManageUnit(session, desk.unitId)) {
      return reply.code(403).send({ message: "No puede operar puestos de otra unidad." });
    }
    try {
      const result = await service.callNext(payload);
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo llamar el siguiente ticket." });
    }
  });

  app.post("/attendance/finish", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["attendance"]);
    if (!session) {
      return;
    }
    const payload = finishSchema.parse(request.body);
    const ticket = await service.findTicketById(payload.ticketId);
    if (!ticket) {
      return reply.code(404).send({ message: "Ticket no encontrado." });
    }
    if (!canManageUnit(session, ticket.unitId)) {
      return reply.code(403).send({ message: "No puede finalizar tickets de otra unidad." });
    }
    try {
      return await service.finishTicket(payload.ticketId);
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo finalizar el ticket." });
    }
  });
}
