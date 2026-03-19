import type { FastifyInstance } from "fastify";
import { SettingsService } from "./settings.service.js";

export async function registerSettingsRoutes(app: FastifyInstance) {
  const service = new SettingsService();
  app.get("/settings/summary", async () => service.getSystemSummary());
  app.get("/settings/features", async () => service.getFeatureFlags());
  app.get("/settings/units", async () => service.listUnitSettings());
  app.get("/settings/panel-profiles", async () => service.getPanelProfiles());
}
