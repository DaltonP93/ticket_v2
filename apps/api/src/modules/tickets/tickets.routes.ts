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

  app.get("/ticket-types", async () => service.listTicketTypes());
  app.get("/tickets", async () => service.listTickets());

  app.post("/tickets/issue", async (request, reply) => {
    const payload = issueTicketSchema.parse(request.body);
    const ticket = service.issueTicket(payload);
    return reply.code(201).send(ticket);
  });
}

