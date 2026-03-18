import type { FastifyInstance } from "fastify";
import { CatalogService } from "./catalog.service.js";

export async function registerCatalogRoutes(app: FastifyInstance) {
  const service = new CatalogService();

  app.get("/catalog/units", async () => service.listUnits());
  app.get("/catalog/departments", async () => service.listDepartments());
  app.get("/catalog/services", async () => service.listServices());
}

