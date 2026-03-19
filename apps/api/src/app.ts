import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerAudioRoutes } from "./modules/audio/audio.routes.js";
import { registerAuthRoutes } from "./modules/auth/auth.routes.js";
import { registerCatalogRoutes } from "./modules/catalog/catalog.routes.js";
import { registerIntegrationRoutes } from "./modules/integrations/integration.routes.js";
import { registerPanelRoutes } from "./modules/panel/panel.routes.js";
import { registerSettingsRoutes } from "./modules/settings/settings.routes.js";
import { registerTicketRoutes } from "./modules/tickets/tickets.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: true
  });

  app.get("/health", async () => ({
    status: "ok",
    uptime: process.uptime()
  }));

  await registerAuthRoutes(app);
  await registerCatalogRoutes(app);
  await registerTicketRoutes(app);
  await registerPanelRoutes(app);
  await registerAudioRoutes(app);
  await registerIntegrationRoutes(app);
  await registerSettingsRoutes(app);

  return app;
}
