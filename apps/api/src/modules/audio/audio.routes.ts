import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AudioService } from "./audio.service.js";

const previewSchema = z.object({
  locale: z.enum(["es", "en", "pt"]),
  sequence: z.string().min(1),
  counter: z.string().min(1),
  serviceName: z.string().min(1)
});

const callSchema = z.object({
  ticketId: z.string().min(1),
  locale: z.enum(["es", "en", "pt"]),
  counter: z.string().min(1),
  deskId: z.string().min(1).optional(),
  deskName: z.string().min(1).optional()
});

export async function registerAudioRoutes(app: FastifyInstance) {
  const service = new AudioService();

  app.get("/audio/profiles", async () => service.listAudioProfiles());
  app.get("/audio/current-calls", async () => service.listCurrentCalls());

  app.post("/audio/preview", async (request) => {
    const payload = previewSchema.parse(request.body);
    return service.previewAnnouncement(payload);
  });

  app.post("/audio/call", async (request, reply) => {
    const payload = callSchema.parse(request.body);
    return reply.code(201).send(service.callNextTicket(payload));
  });
}
