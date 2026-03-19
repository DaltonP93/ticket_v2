import type { FastifyInstance } from "fastify";
import { CatalogService } from "./catalog.service.js";

export async function registerCatalogRoutes(app: FastifyInstance) {
  const service = new CatalogService();

  app.get("/catalog/units", async () => service.listUnits());
  app.get("/catalog/departments", async () => service.listDepartments());
  app.get("/catalog/services", async () => service.listServices());
  app.get("/catalog/ticket-types", async () => service.listTicketTypes());
  app.get("/catalog/locations", async (request) => {
    const query = request.query as { unitId?: string };
    return service.listLocations(query.unitId);
  });
  app.get("/catalog/desks", async (request) => {
    const query = request.query as { unitId?: string };
    return service.listDesks(query.unitId);
  });
}
