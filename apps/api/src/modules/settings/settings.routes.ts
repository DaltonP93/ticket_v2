import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { canManageUnit, requireAnyPermission } from "../../lib/access.js";
import { SettingsService } from "./settings.service.js";

const updateUnitSettingsSchema = z.object({
  printHeader: z.string().optional(),
  printFooter: z.string().optional(),
  printShowDate: z.boolean().optional(),
  printShowTicketType: z.boolean().optional(),
  printShowUnitName: z.boolean().optional(),
  printShowServiceName: z.boolean().optional(),
  printTemplateId: z.string().optional(),
  triageServiceIds: z.array(z.string()).optional(),
  panelShowHistory: z.boolean().optional(),
  panelShowClock: z.boolean().optional(),
  panelPrimaryMediaId: z.string().optional(),
  panelProfileId: z.string().optional(),
  panelPlaylistId: z.string().optional(),
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

const updatePanelProfileSchema = z.object({
  name: z.string().optional(),
  layout: z.enum(["calls-only", "calls-history", "calls-media"]).optional(),
  locale: z.enum(["es", "en", "pt"]).optional(),
  theme: z.object({
    background: z.string().optional(),
    accent: z.string().optional(),
    text: z.string().optional()
  }).optional()
});

const createPanelProfileSchema = z.object({
  name: z.string().min(1),
  layout: z.enum(["calls-only", "calls-history", "calls-media"]),
  locale: z.enum(["es", "en", "pt"]).optional(),
  theme: z.object({
    background: z.string().min(1),
    accent: z.string().min(1),
    text: z.string().min(1)
  })
});

const updatePrintTemplateSchema = z.object({
  name: z.string().optional(),
  scope: z.string().optional(),
  unit: z.string().optional(),
  header: z.string().optional(),
  footer: z.string().optional(),
  html: z.string().optional()
});

const createPrintTemplateSchema = z.object({
  unitId: z.string().optional(),
  name: z.string().min(1),
  scope: z.string().min(1),
  unit: z.string().min(1),
  header: z.string().min(1),
  footer: z.string().min(1),
  html: z.string().min(1)
});

const createMediaAssetSchema = z.object({
  unitId: z.string().optional(),
  title: z.string().min(1),
  kind: z.string().min(1),
  url: z.string().min(1),
  durationSeconds: z.number().min(1)
});

const updatePanelPlaylistSchema = z.object({
  unitId: z.string().optional(),
  name: z.string().optional(),
  active: z.boolean().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      assetId: z.string(),
      title: z.string(),
      kind: z.string(),
      url: z.string(),
      durationSeconds: z.number().min(1),
      position: z.number().int().min(1)
    })
  ).optional()
});

const createPanelPlaylistSchema = z.object({
  unitId: z.string().optional(),
  name: z.string().min(1),
  active: z.boolean(),
  items: z.array(
    z.object({
      id: z.string(),
      assetId: z.string(),
      title: z.string(),
      kind: z.string(),
      url: z.string(),
      durationSeconds: z.number().min(1),
      position: z.number().int().min(1)
    })
  ).optional()
});

export async function registerSettingsRoutes(app: FastifyInstance) {
  const service = new SettingsService();
  app.get("/settings/summary", async () => service.getSystemSummary());
  app.get("/settings/features", async () => service.getFeatureFlags());
  app.get("/settings/units", async () => service.listUnitSettings());
  app.put("/settings/units/:unitId", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["settings"]);
    if (!session) {
      return;
    }
    const params = request.params as { unitId: string };
    if (!canManageUnit(session, params.unitId)) {
      return reply.code(403).send({ message: "No puede modificar la configuracion de otra unidad." });
    }
    const payload = updateUnitSettingsSchema.parse(request.body);
    const settings = await service.saveUnitSettings(params.unitId, payload);
    return reply.code(200).send(settings);
  });
  app.get("/settings/panel-profiles", async () => service.getPanelProfiles());
  app.post("/settings/panel-profiles", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["panel"]);
    if (!session) {
      return;
    }
    const payload = createPanelProfileSchema.parse(request.body);
    const profile = await service.createPanelProfile(payload);
    return reply.code(201).send(profile);
  });
  app.put("/settings/panel-profiles/:profileId", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["panel"]);
    if (!session) {
      return;
    }
    const params = request.params as { profileId: string };
    const payload = updatePanelProfileSchema.parse(request.body);
    const profile = await service.savePanelProfile(params.profileId, payload);
    return reply.code(200).send(profile);
  });
  app.delete("/settings/panel-profiles/:profileId", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["panel"]);
    if (!session) {
      return;
    }
    const params = request.params as { profileId: string };
    return reply.code(200).send(await service.deletePanelProfile(params.profileId));
  });
  app.get("/settings/print-templates", async () => service.listPrintTemplates());
  app.post("/settings/print-templates", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["print"]);
    if (!session) {
      return;
    }
    const payload = createPrintTemplateSchema.parse(request.body);
    const template = await service.createPrintTemplate(payload);
    return reply.code(201).send(template);
  });
  app.put("/settings/print-templates/:templateId", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["print"]);
    if (!session) {
      return;
    }
    const params = request.params as { templateId: string };
    const payload = updatePrintTemplateSchema.parse(request.body);
    const template = await service.savePrintTemplate(params.templateId, payload);
    return reply.code(200).send(template);
  });
  app.delete("/settings/print-templates/:templateId", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["print"]);
    if (!session) {
      return;
    }
    const params = request.params as { templateId: string };
    return reply.code(200).send(await service.deletePrintTemplate(params.templateId));
  });
  app.get("/settings/media-assets", async () => service.listMediaAssets());
  app.post("/settings/media-assets", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["media"]);
    if (!session) {
      return;
    }
    const payload = createMediaAssetSchema.parse(request.body);
    const asset = await service.createMediaAsset(payload);
    return reply.code(201).send(asset);
  });
  app.delete("/settings/media-assets/:assetId", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["media"]);
    if (!session) {
      return;
    }
    const params = request.params as { assetId: string };
    return reply.code(200).send(await service.deleteMediaAsset(params.assetId));
  });
  app.get("/settings/panel-playlists", async () => service.listPanelPlaylists());
  app.post("/settings/panel-playlists", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["panel", "media"]);
    if (!session) {
      return;
    }
    const payload = createPanelPlaylistSchema.parse(request.body);
    const playlist = await service.createPanelPlaylist(payload);
    return reply.code(201).send(playlist);
  });
  app.put("/settings/panel-playlists/:playlistId", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["panel", "media"]);
    if (!session) {
      return;
    }
    const params = request.params as { playlistId: string };
    const payload = updatePanelPlaylistSchema.parse(request.body);
    const playlist = await service.savePanelPlaylist(params.playlistId, payload);
    return reply.code(200).send(playlist);
  });
  app.delete("/settings/panel-playlists/:playlistId", async (request, reply) => {
    const session = await requireAnyPermission(request, reply, ["panel", "media"]);
    if (!session) {
      return;
    }
    const params = request.params as { playlistId: string };
    return reply.code(200).send(await service.deletePanelPlaylist(params.playlistId));
  });
}
