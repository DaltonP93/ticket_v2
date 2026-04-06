import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { canManageUnit, requireAnyPermission, requireAnyProfile } from "../../lib/access.js";
import { CatalogService } from "./catalog.service.js";

export async function registerCatalogRoutes(app: FastifyInstance) {
  const service = new CatalogService();
  const createUnitSchema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    brandName: z.string().min(1),
    locale: z.enum(["es", "en", "pt"]),
    logoUrl: z.string().optional()
  });
  const createDepartmentSchema = z.object({
    name: z.string().min(1)
  });
  const updateDepartmentSchema = createDepartmentSchema.partial();
  const createServiceSchema = z.object({
    unitId: z.string().min(1),
    code: z.string().min(1),
    name: z.string().min(1),
    departmentId: z.string().min(1),
    allowPriority: z.boolean(),
    ticketTypeIds: z.array(z.string()).optional()
  });
  const createTicketTypeSchema = z.object({
    unitId: z.string().min(1),
    code: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    prefix: z.string().optional(),
    color: z.string().min(1),
    textColor: z.string().min(1),
    icon: z.string().optional(),
    baseWeight: z.number().int(),
    requireClient: z.boolean(),
    requireDocument: z.boolean(),
    requireExternalValidation: z.boolean(),
    allowPrint: z.boolean(),
    allowPanel: z.boolean(),
    triageMessage: z.string().optional()
  });
  const createLocationSchema = z.object({
    unitId: z.string().min(1),
    code: z.string().min(1),
    name: z.string().min(1)
  });
  const createDeskSchema = z.object({
    unitId: z.string().min(1),
    locationId: z.string().min(1),
    name: z.string().min(1),
    operatorName: z.string().min(1),
    serviceIds: z.array(z.string())
  });
  const updateServiceSchema = createServiceSchema.omit({ unitId: true }).partial();
  const updateTicketTypeSchema = createTicketTypeSchema.omit({ unitId: true }).partial();
  const updateUnitSchema = createUnitSchema.partial();
  const updateLocationSchema = createLocationSchema.omit({ unitId: true }).partial();
  const updateDeskSchema = createDeskSchema.omit({ unitId: true }).partial();

  app.get("/catalog/units", async () => service.listUnits());
  app.post("/catalog/units", async (request, reply) => {
    const session = await requireAnyProfile(request, reply, ["SUPERADMIN"]);
    if (!session) {
      return;
    }
    const payload = createUnitSchema.parse(request.body);
    return reply.code(201).send(await service.createUnit(payload));
  });
  app.put("/catalog/units/:id", async (request, reply) => {
    const session = await requireAnyProfile(request, reply, ["SUPERADMIN"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const payload = updateUnitSchema.parse(request.body);
    try {
      return reply.send(await service.updateUnit(params.id, payload));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo actualizar la unidad." });
    }
  });
  app.delete("/catalog/units/:id", async (request, reply) => {
    const session = await requireAnyProfile(request, reply, ["SUPERADMIN"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    try {
      return reply.send(await service.deleteUnit(params.id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo eliminar la unidad." });
    }
  });
  app.get("/catalog/departments", async () => service.listDepartments());
  app.post("/catalog/departments", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const payload = createDepartmentSchema.parse(request.body);
    try {
      return reply.code(201).send(await service.createDepartment(payload.name));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo crear el departamento." });
    }
  });
  app.put("/catalog/departments/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const payload = updateDepartmentSchema.parse(request.body);
    try {
      return reply.send(await service.updateDepartment(params.id, payload.name ?? ""));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo actualizar el departamento." });
    }
  });
  app.delete("/catalog/departments/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    try {
      return reply.send(await service.deleteDepartment(params.id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo eliminar el departamento." });
    }
  });
  app.get("/catalog/services", async (request) => {
    const query = request.query as { unitId?: string };
    return service.listServices(query.unitId);
  });
  app.post("/catalog/services", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const payload = createServiceSchema.parse(request.body);
    if (!canManageUnit(session, payload.unitId)) {
      return reply.code(403).send({ message: "No puede crear servicios fuera de su unidad." });
    }
    try {
      return reply.code(201).send(await service.createService(payload));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo crear el servicio." });
    }
  });
  app.put("/catalog/services/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const existing = (await service.listServices()).find((item) => item.id === params.id);
    if (!existing) {
      return reply.code(404).send({ message: "Servicio no encontrado." });
    }
    if (!canManageUnit(session, existing.unitId)) {
      return reply.code(403).send({ message: "No puede editar servicios fuera de su unidad." });
    }
    const payload = updateServiceSchema.parse(request.body);
    try {
      return reply.send(await service.updateService(params.id, payload));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo actualizar el servicio." });
    }
  });
  app.delete("/catalog/services/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const existing = (await service.listServices()).find((item) => item.id === params.id);
    if (!existing) {
      return reply.code(404).send({ message: "Servicio no encontrado." });
    }
    if (!canManageUnit(session, existing.unitId)) {
      return reply.code(403).send({ message: "No puede eliminar servicios fuera de su unidad." });
    }
    try {
      return reply.send(await service.deleteService(params.id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo eliminar el servicio." });
    }
  });
  app.get("/catalog/ticket-types", async (request) => {
    const query = request.query as { unitId?: string };
    return service.listTicketTypes(query.unitId);
  });
  app.post("/catalog/ticket-types", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const payload = createTicketTypeSchema.parse(request.body);
    if (!canManageUnit(session, payload.unitId)) {
      return reply.code(403).send({ message: "No puede crear tipos de ticket fuera de su unidad." });
    }
    try {
      return reply.code(201).send(await service.createTicketType(payload));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo crear el tipo de ticket." });
    }
  });
  app.put("/catalog/ticket-types/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const existing = (await service.listTicketTypes()).find((item) => item.id === params.id);
    if (!existing) {
      return reply.code(404).send({ message: "Tipo de ticket no encontrado." });
    }
    if (!canManageUnit(session, existing.unitId)) {
      return reply.code(403).send({ message: "No puede editar tipos de ticket fuera de su unidad." });
    }
    const payload = updateTicketTypeSchema.parse(request.body);
    try {
      return reply.send(await service.updateTicketType(params.id, payload));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo actualizar el tipo de ticket." });
    }
  });
  app.delete("/catalog/ticket-types/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const existing = (await service.listTicketTypes()).find((item) => item.id === params.id);
    if (!existing) {
      return reply.code(404).send({ message: "Tipo de ticket no encontrado." });
    }
    if (!canManageUnit(session, existing.unitId)) {
      return reply.code(403).send({ message: "No puede eliminar tipos de ticket fuera de su unidad." });
    }
    try {
      return reply.send(await service.deleteTicketType(params.id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo eliminar el tipo de ticket." });
    }
  });
  app.get("/catalog/locations", async (request) => {
    const query = request.query as { unitId?: string };
    return service.listLocations(query.unitId);
  });
  app.post("/catalog/locations", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const payload = createLocationSchema.parse(request.body);
    if (!canManageUnit(session, payload.unitId)) {
      return reply.code(403).send({ message: "No puede crear locales fuera de su unidad." });
    }
    try {
      return reply.code(201).send(await service.createLocation(payload));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo crear el local." });
    }
  });
  app.put("/catalog/locations/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const existing = (await service.listLocations()).find((item) => item.id === params.id);
    if (!existing) {
      return reply.code(404).send({ message: "Local no encontrado." });
    }
    if (!canManageUnit(session, existing.unitId)) {
      return reply.code(403).send({ message: "No puede editar locales fuera de su unidad." });
    }
    const payload = updateLocationSchema.parse(request.body);
    try {
      return reply.send(await service.updateLocation(params.id, payload));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo actualizar el local." });
    }
  });
  app.delete("/catalog/locations/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const existing = (await service.listLocations()).find((item) => item.id === params.id);
    if (!existing) {
      return reply.code(404).send({ message: "Local no encontrado." });
    }
    if (!canManageUnit(session, existing.unitId)) {
      return reply.code(403).send({ message: "No puede eliminar locales fuera de su unidad." });
    }
    try {
      return reply.send(await service.deleteLocation(params.id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo eliminar el local." });
    }
  });
  app.get("/catalog/desks", async (request) => {
    const query = request.query as { unitId?: string };
    return service.listDesks(query.unitId);
  });
  app.post("/catalog/desks", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const payload = createDeskSchema.parse(request.body);
    if (!canManageUnit(session, payload.unitId)) {
      return reply.code(403).send({ message: "No puede crear puestos fuera de su unidad." });
    }
    try {
      return reply.code(201).send(await service.createDesk(payload));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo crear el puesto." });
    }
  });
  app.put("/catalog/desks/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const existing = (await service.listDesks()).find((item) => item.id === params.id);
    if (!existing) {
      return reply.code(404).send({ message: "Puesto no encontrado." });
    }
    if (!canManageUnit(session, existing.unitId)) {
      return reply.code(403).send({ message: "No puede editar puestos fuera de su unidad." });
    }
    const payload = updateDeskSchema.parse(request.body);
    try {
      return reply.send(await service.updateDesk(params.id, payload));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo actualizar el puesto." });
    }
  });
  app.delete("/catalog/desks/:id", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["catalog"]);
    if (!session) {
      return;
    }
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const existing = (await service.listDesks()).find((item) => item.id === params.id);
    if (!existing) {
      return reply.code(404).send({ message: "Puesto no encontrado." });
    }
    if (!canManageUnit(session, existing.unitId)) {
      return reply.code(403).send({ message: "No puede eliminar puestos fuera de su unidad." });
    }
    try {
      return reply.send(await service.deleteDesk(params.id));
    } catch (error) {
      return reply.code(400).send({ message: error instanceof Error ? error.message : "No se pudo eliminar el puesto." });
    }
  });
}
