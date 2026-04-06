import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { TicketsService } from "./tickets.service.js";

const issueTicketSchema = z.object({
  serviceId: z.string().min(1),
  ticketTypeId: z.string().min(1),
  clientName: z.string().optional(),
  clientDocument: z.string().optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional()
});

export async function registerTicketRoutes(app: FastifyInstance) {
  const service = new TicketsService();

  app.get("/ticket-types", async (request) => {
    const query = z.object({ unitId: z.string().optional() }).parse(request.query);
    return service.listTicketTypes(query.unitId);
  });
  app.get("/tickets/triage-snapshot", async (request) => {
    const query = z.object({ unitId: z.string().optional() }).parse(request.query);
    return service.getTriageSnapshot(query.unitId);
  });
  app.get("/tickets", async (request) => {
    const query = z.object({ unitId: z.string().optional() }).parse(request.query);
    return service.listTickets(query.unitId);
  });

  app.post("/tickets/issue", async (request, reply) => {
    const payload = issueTicketSchema.parse(request.body);
    try {
      const ticket = await service.issueTicket(payload);
      return reply.code(201).send(ticket);
    } catch (error) {
      return reply.code(400).send({
        message: error instanceof Error ? error.message : "No se pudo emitir el ticket."
      });
    }
  });
}
