import type { FastifyInstance } from "fastify";
import { IntegrationService } from "./integration.service.js";

export async function registerIntegrationRoutes(app: FastifyInstance) {
  const service = new IntegrationService();
  app.get("/integrations/connectors", async () => service.listConnectors());
}

