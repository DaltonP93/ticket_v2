import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { SettingsService } from "./settings.service.js";

const updateUnitSettingsSchema = z.object({
  printHeader: z.string().optional(),
  printFooter: z.string().optional(),
  printShowDate: z.boolean().optional(),
  printShowTicketType: z.boolean().optional(),
  printShowUnitName: z.boolean().optional(),
  printShowServiceName: z.boolean().optional(),
  triageServiceIds: z.array(z.string()).optional(),
  panelShowHistory: z.boolean().optional(),
  panelShowClock: z.boolean().optional(),
  panelPrimaryMediaId: z.string().optional(),
  panelBrandingText: z.string().optional(),
  webhooks: z.object({
    preTicket: z.string().optional(),
    postTicket: z.string().optional(),
    onPrint: z.string().optional()
  }).optional(),
  panelRuntime: z.object({
    serverUrl: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    retries: z.number().optional(),
    locale: z.enum(["es", "en", "pt"]).optional(),
    visibleServiceIds: z.array(z.string()).optional(),
    visibleDepartmentIds: z.array(z.string()).optional(),
    speechEnabled: z.boolean().optional(),
    alertSound: z.string().optional(),
    showMedia: z.boolean().optional(),
    showHistory: z.boolean().optional(),
    showClock: z.boolean().optional()
  }).optional(),
  triageRuntime: z.object({
    serverUrl: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    locale: z.enum(["es", "en", "pt"]).optional(),
    columns: z.number().optional(),
    scale: z.number().optional(),
    waitTimeSeconds: z.number().optional(),
    printEnabled: z.boolean().optional(),
    showTitle: z.boolean().optional(),
    showSubtitle: z.boolean().optional(),
    lockMenu: z.boolean().optional(),
    groupByDepartment: z.boolean().optional(),
    visibleServiceIds: z.array(z.string()).optional(),
    visibleDepartmentIds: z.array(z.string()).optional()
  }).optional()
});

export async function registerSettingsRoutes(app: FastifyInstance) {
  const service = new SettingsService();
  app.get("/settings/summary", async () => service.getSystemSummary());
  app.get("/settings/features", async () => service.getFeatureFlags());
  app.get("/settings/units", async () => service.listUnitSettings());
  app.put("/settings/units/:unitId", async (request, reply) => {
    const params = request.params as { unitId: string };
    const payload = updateUnitSettingsSchema.parse(request.body);
    const settings = await service.saveUnitSettings(params.unitId, payload);
    return reply.code(200).send(settings);
  });
  app.get("/settings/panel-profiles", async () => service.getPanelProfiles());
}
