import type { FastifyInstance } from "fastify";
import { z } from "zod";
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
    return service.listDesks(query.unitId);
  });

  app.get("/attendance/queue", async (request) => {
    const query = request.query as { deskId?: string };

    if (!query.deskId) {
      return [];
    }

    return service.queueForDesk(query.deskId);
  });

  app.get("/attendance/current-call", async (request) => {
    const query = request.query as { deskId?: string };

    if (!query.deskId) {
      return null;
    }

    return service.currentCallForDesk(query.deskId);
  });

  app.post("/attendance/call-next", async (request, reply) => {
    const payload = callSchema.parse(request.body);
    const result = service.callNext(payload);
    return reply.code(201).send(result);
  });

  app.post("/attendance/finish", async (request) => {
    const payload = finishSchema.parse(request.body);
    return service.finishTicket(payload.ticketId);
  });
}
