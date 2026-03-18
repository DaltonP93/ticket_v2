import type { FastifyInstance } from "fastify";
import { PanelService } from "./panel.service.js";

export async function registerPanelRoutes(app: FastifyInstance) {
  const service = new PanelService();
  app.get("/panel/payload", async () => service.getPanelPayload());
}

