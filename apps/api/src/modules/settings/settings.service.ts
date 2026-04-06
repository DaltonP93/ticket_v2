import type { MediaAsset, PanelPlaylist, PanelProfile, PrintTemplate, UnitSettings } from "@ticket-v2/contracts";
import { prisma } from "../../lib/prisma.js";
import { mediaAssets, panelPlaylists, panelProfiles, printTemplates, services, unitSettings, units } from "../../data/mock-db.js";

type UnitSettingsPatch = Partial<Omit<UnitSettings, "webhooks" | "panelRuntime" | "triageRuntime">> & {
  webhooks?: Partial<NonNullable<UnitSettings["webhooks"]>>;
  panelRuntime?: Partial<NonNullable<UnitSettings["panelRuntime"]>>;
  triageRuntime?: Partial<NonNullable<UnitSettings["triageRuntime"]>>;
};

function defaultPanelRuntime(): NonNullable<UnitSettings["panelRuntime"]> {
  return {
    serverUrl: "",
    username: "",
    password: "",
    clientId: "",
    clientSecret: "",
    retries: 5,
    locale: "es",
    visibleServiceIds: [],
    visibleDepartmentIds: [],
    speechEnabled: true,
    alertSound: "default",
    showMedia: true,
    showHistory: true,
    showClock: true
  };
}

function defaultTriageRuntime(): NonNullable<UnitSettings["triageRuntime"]> {
  return {
    serverUrl: "",
    username: "",
    password: "",
    clientId: "",
    clientSecret: "",
    locale: "es",
    columns: 2,
    scale: 100,
    waitTimeSeconds: 10,
    printEnabled: true,
    showTitle: true,
    showSubtitle: true,
    lockMenu: false,
    groupByDepartment: false,
    visibleServiceIds: [],
    visibleDepartmentIds: []
  };
}

function defaultPanelProfileValue(): PanelProfile {
  return {
    id: "panel-default",
    name: "Perfil por defecto",
    layout: "calls-media",
    locale: "es",
    theme: {
      background: "#0f1c2e",
      accent: "#2db6ff",
      text: "#ffffff"
    }
  };
}

function defaultPrintTemplateValue(): PrintTemplate {
  return {
    id: "print-default",
    name: "Plantilla por defecto",
    scope: "unidad",
    unit: "General",
    header: "Sistema de Ticket",
    footer: "Presente su documento y aguarde el llamado en pantalla.",
    html: "<div class=\"ticket\"><h1>%ticket_sequence%</h1></div>"
  };
}

function normalizeUnitSetting(item: UnitSettings): UnitSettings {
  return {
    ...item,
    panelRuntime: {
      ...defaultPanelRuntime(),
      ...(item.panelRuntime ?? {})
    },
    triageRuntime: {
      ...defaultTriageRuntime(),
      ...(item.triageRuntime ?? {})
    }
  };
}

function defaultUnitSetting(
  unitId: string,
  unitName: string,
  availableServiceIds: string[],
  defaults?: {
    printTemplateId?: string;
    panelProfileId?: string;
    panelPlaylistId?: string;
  }
): UnitSettings {
  return {
    unitId,
    printHeader: unitName,
    printFooter: "Presente su documento y aguarde el llamado en pantalla.",
    printShowDate: true,
    printShowTicketType: true,
    printShowUnitName: true,
    printShowServiceName: true,
    printTemplateId: defaults?.printTemplateId,
    triageServiceIds: availableServiceIds,
    panelShowHistory: true,
    panelShowClock: true,
    panelPrimaryMediaId: undefined,
    panelProfileId: defaults?.panelProfileId,
    panelPlaylistId: defaults?.panelPlaylistId,
    panelBrandingText: unitName,
    webhooks: {
      preTicket: "",
      postTicket: "",
      onPrint: ""
    },
    panelRuntime: {
      ...defaultPanelRuntime(),
      visibleServiceIds: availableServiceIds
    },
    triageRuntime: {
      ...defaultTriageRuntime(),
      visibleServiceIds: availableServiceIds
    }
  };
}

export class SettingsService {
  private async ensureUnitExists(unitId: string) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId }
    }).catch(() => null);

    if (!unit) {
      throw new Error("Unidad no encontrada.");
    }

    return unit;
  }

  getFeatureFlags() {
    return {
      modularIntegrations: true,
      customPrintTemplates: true,
      dynamicTriageForms: true,
      panelProfiles: true,
      multimediaPlaylists: true,
      multilingualUi: true,
      audioAnnouncements: true
    };
  }

  getSystemSummary() {
    return {
      productName: "Sistema de Ticket V2",
      release: "3.0.0",
      mode: "modular",
      target: "salud, banca, retail, gobierno y corporativo",
      supportedLocales: ["es", "en", "pt"]
    };
  }

  listUnitSettings() {
    return this.readUnitSettings();
  }

  getPanelProfiles() {
    return this.readPanelProfiles();
  }

  async createPanelProfile(input: Omit<PanelProfile, "id">) {
    const created = await prisma.panelProfile.create({
      data: {
        name: input.name,
        layout: input.layout,
        locale: input.locale ?? "es",
        themeBackground: input.theme.background,
        themeAccent: input.theme.accent,
        themeText: input.theme.text
      }
    });

    return {
      id: created.id,
      name: created.name,
      layout: created.layout as PanelProfile["layout"],
      locale: (created.locale as PanelProfile["locale"]) ?? "es",
      theme: {
        background: created.themeBackground,
        accent: created.themeAccent,
        text: created.themeText
      }
    } satisfies PanelProfile;
  }

  listPrintTemplates() {
    return this.readPrintTemplates();
  }

  listMediaAssets() {
    return this.readMediaAssets();
  }

  listPanelPlaylists() {
    return this.readPanelPlaylists();
  }

  async createPrintTemplate(input: Omit<PrintTemplate, "id"> & { unitId?: string | null }) {
    if (input.unitId) {
      await this.ensureUnitExists(input.unitId);
    }

    const created = await prisma.printTemplate.create({
      data: {
        unitId: input.unitId ?? null,
        name: input.name,
        scope: input.scope,
        unit: input.unit,
        header: input.header,
        footer: input.footer,
        html: input.html
      }
    });

    return {
      id: created.id,
      name: created.name,
      scope: created.scope,
      unit: created.unit,
      header: created.header,
      footer: created.footer,
      html: created.html
    } satisfies PrintTemplate;
  }

  async savePanelProfile(profileId: string, patch: Partial<PanelProfile>) {
    const currentProfiles = await this.readPanelProfiles();
    const fallback = currentProfiles.find((item) => item.id === profileId);

    if (!fallback) {
      throw new Error("Perfil de panel no encontrado.");
    }

    const merged: PanelProfile = {
      ...fallback,
      ...patch,
      theme: {
        ...fallback.theme,
        ...(patch.theme ?? {})
      }
    };

    await prisma.panelProfile.upsert({
      where: { id: profileId },
      create: {
        id: profileId,
        name: merged.name,
        layout: merged.layout,
        locale: merged.locale ?? "es",
        themeBackground: merged.theme.background,
        themeAccent: merged.theme.accent,
        themeText: merged.theme.text
      },
      update: {
        name: merged.name,
        layout: merged.layout,
        locale: merged.locale ?? "es",
        themeBackground: merged.theme.background,
        themeAccent: merged.theme.accent,
        themeText: merged.theme.text
      }
    });

    return merged;
  }

  async savePrintTemplate(templateId: string, patch: Partial<PrintTemplate>) {
    const currentTemplates = await this.readPrintTemplates();
    const fallback = currentTemplates.find((item) => item.id === templateId);

    if (!fallback) {
      throw new Error("Plantilla no encontrada.");
    }

    const merged: PrintTemplate = {
      ...fallback,
      ...patch
    };

    const existing = await prisma.printTemplate.findUnique({
      where: { id: templateId }
    }).catch(() => null);

    await prisma.printTemplate.upsert({
      where: { id: templateId },
      create: {
        id: templateId,
        name: merged.name,
        scope: merged.scope,
        unit: merged.unit,
        header: merged.header,
        footer: merged.footer,
        html: merged.html,
        unitId: existing?.unitId ?? null
      },
      update: {
        name: merged.name,
        scope: merged.scope,
        unit: merged.unit,
        header: merged.header,
        footer: merged.footer,
        html: merged.html,
        unitId: existing?.unitId ?? null
      }
    });

    return merged;
  }

  async deletePrintTemplate(templateId: string) {
    await prisma.unitSetting.updateMany({
      where: { printTemplateId: templateId },
      data: { printTemplateId: null }
    }).catch(() => undefined);

    await prisma.printTemplate.delete({
      where: { id: templateId }
    }).catch(() => undefined);

    return { success: true, id: templateId };
  }

  async createMediaAsset(asset: Omit<MediaAsset, "id">) {
    if (asset.unitId) {
      await this.ensureUnitExists(asset.unitId);
    }

    const created = await prisma.mediaAsset.create({
      data: {
        unitId: asset.unitId ?? null,
        title: asset.title,
        kind: asset.kind,
        url: asset.url,
        durationSeconds: asset.durationSeconds
      }
    });

    return {
      id: created.id,
      unitId: created.unitId ?? undefined,
      title: created.title,
      kind: created.kind,
      url: created.url,
      durationSeconds: created.durationSeconds
    } satisfies MediaAsset;
  }

  async deleteMediaAsset(assetId: string) {
    const settings = await prisma.unitSetting.findMany().catch(() => []);

    for (const item of settings) {
      if (item.panelPrimaryMediaId === assetId) {
        await prisma.unitSetting.update({
          where: { unitId: item.unitId },
          data: {
            panelPrimaryMediaId: null
          }
        }).catch(() => null);
      }
    }

    await prisma.mediaAsset.delete({
      where: { id: assetId }
    });

    return { success: true, id: assetId };
  }

  async createPanelPlaylist(input: Omit<PanelPlaylist, "id" | "items"> & { items?: PanelPlaylist["items"] }) {
    if (input.unitId) {
      await this.ensureUnitExists(input.unitId);
    }

    if (input.items?.length) {
      const existingAssets = await prisma.mediaAsset.findMany({
        where: {
          id: {
            in: input.items.map((item) => item.assetId)
          }
        }
      }).catch(() => []);
      const assetMap = new Map(existingAssets.map((item) => [item.id, item]));

      for (const item of input.items) {
        const asset = assetMap.get(item.assetId);

        if (!asset) {
          throw new Error("Uno o mas assets de la playlist no existen.");
        }

        if (input.unitId && asset.unitId && asset.unitId !== input.unitId) {
          throw new Error("La playlist contiene assets de otra unidad.");
        }
      }
    }

    const created = await prisma.panelPlaylist.create({
      data: {
        unitId: input.unitId ?? null,
        name: input.name,
        active: input.active
      }
    });

    if (input.items?.length) {
      await prisma.panelPlaylistItem.createMany({
        data: input.items.map((item, index) => ({
          playlistId: created.id,
          assetId: item.assetId,
          position: index + 1,
          durationSeconds: item.durationSeconds
        }))
      });
    }

    return {
      id: created.id,
      unitId: created.unitId ?? undefined,
      name: created.name,
      active: created.active,
      items: input.items?.map((item, index) => ({
        ...item,
        position: index + 1
      })) ?? []
    } satisfies PanelPlaylist;
  }

  async savePanelPlaylist(playlistId: string, patch: Partial<PanelPlaylist>) {
    const currentPlaylists = await this.readPanelPlaylists();
    const fallback = currentPlaylists.find((item) => item.id === playlistId);

    if (!fallback) {
      throw new Error("Playlist no encontrada.");
    }

    const merged: PanelPlaylist = {
      ...fallback,
      ...patch,
      items: (patch.items ?? fallback.items)
        .map((item, index) => ({
          ...item,
          position: index + 1
        }))
        .sort((left, right) => left.position - right.position)
    };

    if (merged.unitId) {
      await this.ensureUnitExists(merged.unitId);
    }

    if (merged.items.length) {
      const existingAssets = await prisma.mediaAsset.findMany({
        where: {
          id: {
            in: merged.items.map((item) => item.assetId)
          }
        }
      }).catch(() => []);
      const assetMap = new Map(existingAssets.map((item) => [item.id, item]));

      for (const item of merged.items) {
        const asset = assetMap.get(item.assetId);

        if (!asset) {
          throw new Error("Uno o mas assets de la playlist no existen.");
        }

        if (merged.unitId && asset.unitId && asset.unitId !== merged.unitId) {
          throw new Error("La playlist contiene assets de otra unidad.");
        }
      }
    }

    const existing = await prisma.panelPlaylist.findUnique({
      where: { id: playlistId }
    }).catch(() => null);

    await prisma.panelPlaylist.upsert({
      where: { id: playlistId },
      create: {
        id: playlistId,
        name: merged.name,
        active: merged.active,
        unitId: merged.unitId ?? existing?.unitId ?? null
      },
      update: {
        name: merged.name,
        active: merged.active,
        unitId: merged.unitId ?? existing?.unitId ?? null
      }
    });

    await prisma.panelPlaylistItem.deleteMany({
      where: { playlistId }
    });

    if (merged.items.length) {
      await prisma.panelPlaylistItem.createMany({
        data: merged.items.map((item, index) => ({
          playlistId,
          assetId: item.assetId,
          position: index + 1,
          durationSeconds: item.durationSeconds
        }))
      });
    }

    return merged;
  }

  async deletePanelPlaylist(playlistId: string) {
    const settings = await prisma.unitSetting.findMany({
      where: { panelPlaylistId: playlistId }
    }).catch(() => []);

    for (const item of settings) {
      await prisma.unitSetting.update({
        where: { unitId: item.unitId },
        data: {
          panelPlaylistId: null
        }
      }).catch(() => null);
    }

    await prisma.panelPlaylist.delete({
      where: { id: playlistId }
    });

    return { success: true, id: playlistId };
  }

  async deletePanelProfile(profileId: string) {
    await prisma.unitSetting.updateMany({
      where: { panelProfileId: profileId },
      data: { panelProfileId: null }
    }).catch(() => undefined);

    await prisma.panelProfile.delete({
      where: { id: profileId }
    }).catch(() => undefined);

    return { success: true, id: profileId };
  }

  async saveUnitSettings(unitId: string, patch: UnitSettingsPatch) {
    await this.ensureUnitExists(unitId);

    const settings = await this.readUnitSettings();
    const fallback = settings.find((item) => item.unitId === unitId);

    if (!fallback) {
      throw new Error("Unidad no encontrada para configuracion.");
    }

    const merged: UnitSettings = {
      ...fallback,
      ...patch,
      webhooks: {
        ...fallback.webhooks,
        ...(patch.webhooks ?? {})
      },
      panelRuntime: {
        ...defaultPanelRuntime(),
        ...(fallback.panelRuntime ?? {}),
        ...(patch.panelRuntime ?? {})
      },
      triageRuntime: {
        ...defaultTriageRuntime(),
        ...(fallback.triageRuntime ?? {}),
        ...(patch.triageRuntime ?? {})
      }
    };

    const [availableServices, availablePanelProfiles, availablePrintTemplates, availablePlaylists, availableAssets] = await Promise.all([
      prisma.service.findMany({ where: { unitId } }).catch(() => []),
      prisma.panelProfile.findMany().catch(() => []),
      prisma.printTemplate.findMany({
        where: {
          OR: [{ unitId }, { unitId: null }]
        }
      }).catch(() => []),
      prisma.panelPlaylist.findMany({
        where: {
          OR: [{ unitId }, { unitId: null }]
        }
      }).catch(() => []),
      prisma.mediaAsset.findMany({
        where: {
          OR: [{ unitId }, { unitId: null }]
        }
      }).catch(() => [])
    ]);

    const serviceIds = new Set(availableServices.map((item) => item.id));
    const departmentIds = new Set(availableServices.map((item) => item.departmentId));

    if (merged.triageServiceIds.some((item) => !serviceIds.has(item))) {
      throw new Error("La configuracion de triage incluye servicios que no pertenecen a la unidad.");
    }

    if (merged.panelRuntime.visibleServiceIds.some((item) => !serviceIds.has(item))) {
      throw new Error("La configuracion del panel incluye servicios visibles invalidos para la unidad.");
    }

    if (merged.triageRuntime.visibleServiceIds.some((item) => !serviceIds.has(item))) {
      throw new Error("La configuracion de triage incluye servicios visibles invalidos para la unidad.");
    }

    if (merged.panelRuntime.visibleDepartmentIds.some((item) => !departmentIds.has(item))) {
      throw new Error("La configuracion del panel incluye departamentos invalidos para la unidad.");
    }

    if (merged.triageRuntime.visibleDepartmentIds.some((item) => !departmentIds.has(item))) {
      throw new Error("La configuracion de triage incluye departamentos invalidos para la unidad.");
    }

    if (merged.panelProfileId && !availablePanelProfiles.some((item) => item.id === merged.panelProfileId)) {
      throw new Error("El perfil de panel seleccionado no existe.");
    }

    if (merged.printTemplateId && !availablePrintTemplates.some((item) => item.id === merged.printTemplateId)) {
      throw new Error("La plantilla de impresion seleccionada no pertenece a la unidad.");
    }

    if (merged.panelPlaylistId && !availablePlaylists.some((item) => item.id === merged.panelPlaylistId)) {
      throw new Error("La playlist seleccionada no pertenece a la unidad.");
    }

    if (merged.panelPrimaryMediaId && !availableAssets.some((item) => item.id === merged.panelPrimaryMediaId)) {
      throw new Error("El asset principal del panel no pertenece a la unidad.");
    }

    await prisma.unitSetting.upsert({
      where: {
        unitId
      },
      create: {
        unitId,
        printHeader: merged.printHeader,
        printFooter: merged.printFooter,
        printShowDate: merged.printShowDate,
        printShowTicketType: merged.printShowTicketType,
        printShowUnitName: merged.printShowUnitName,
        printShowServiceName: merged.printShowServiceName,
        printTemplateId: merged.printTemplateId,
        triageServiceIds: merged.triageServiceIds,
        panelShowHistory: merged.panelShowHistory,
        panelShowClock: merged.panelShowClock,
        panelPrimaryMediaId: merged.panelPrimaryMediaId,
        panelProfileId: merged.panelProfileId,
        panelPlaylistId: merged.panelPlaylistId,
        panelBrandingText: merged.panelBrandingText,
        webhooks: merged.webhooks,
        panelRuntime: merged.panelRuntime,
        triageRuntime: merged.triageRuntime
      },
      update: {
        printHeader: merged.printHeader,
        printFooter: merged.printFooter,
        printShowDate: merged.printShowDate,
        printShowTicketType: merged.printShowTicketType,
        printShowUnitName: merged.printShowUnitName,
        printShowServiceName: merged.printShowServiceName,
        printTemplateId: merged.printTemplateId,
        triageServiceIds: merged.triageServiceIds,
        panelShowHistory: merged.panelShowHistory,
        panelShowClock: merged.panelShowClock,
        panelPrimaryMediaId: merged.panelPrimaryMediaId,
        panelProfileId: merged.panelProfileId,
        panelPlaylistId: merged.panelPlaylistId,
        panelBrandingText: merged.panelBrandingText,
        webhooks: merged.webhooks,
        panelRuntime: merged.panelRuntime,
        triageRuntime: merged.triageRuntime
      }
    });

    return {
      ...merged,
      unit: settings.find((item) => item.unitId === merged.unitId)?.unit ?? null
    };
  }

  private async readUnitSettings() {
    const persistedUnits = await prisma.unit.findMany().catch(() => []);
    const persistedServices = await prisma.service.findMany().catch(() => []);
    const resolvedPanelProfiles = await this.readPanelProfiles();
    const resolvedPrintTemplates = await this.readPrintTemplates();
    const resolvedPlaylists = await this.readPanelPlaylists();
    const hasPersistedUnits = persistedUnits.length > 0;
    const availableUnits = hasPersistedUnits
      ? persistedUnits.map((item) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          brandName: item.brandName,
          locale: (item.locale as "es" | "en" | "pt") ?? "es",
          logoUrl: item.logoUrl ?? undefined
        }))
      : units;
    const persistedServiceMap = new Map<string, string[]>();

    for (const item of persistedServices) {
      const serviceIds = persistedServiceMap.get(item.unitId) ?? [];
      serviceIds.push(item.id);
      persistedServiceMap.set(item.unitId, serviceIds);
    }

    const persisted = await prisma.unitSetting.findMany().catch(() => []);
    const persistedMap = new Map(
      persisted.map((item) => [
        item.unitId,
        {
          printHeader: item.printHeader,
          printFooter: item.printFooter,
          printShowDate: item.printShowDate,
          printShowTicketType: item.printShowTicketType,
          printShowUnitName: item.printShowUnitName,
          printShowServiceName: item.printShowServiceName,
          printTemplateId: item.printTemplateId ?? undefined,
          triageServiceIds: item.triageServiceIds as string[],
          panelShowHistory: item.panelShowHistory,
          panelShowClock: item.panelShowClock,
          panelPrimaryMediaId: item.panelPrimaryMediaId ?? undefined,
          panelProfileId: item.panelProfileId ?? undefined,
          panelPlaylistId: item.panelPlaylistId ?? undefined,
          panelBrandingText: item.panelBrandingText ?? undefined,
          webhooks: item.webhooks as UnitSettings["webhooks"],
          panelRuntime: (item.panelRuntime as UnitSettings["panelRuntime"]) ?? undefined,
          triageRuntime: (item.triageRuntime as UnitSettings["triageRuntime"]) ?? undefined
        }
      ])
    );

    const resolvedSettings: Array<UnitSettings & { unit: typeof availableUnits[number] }> = [];

    for (const unit of availableUnits) {
      const availableServiceIds = hasPersistedUnits
        ? [...new Set(persistedServiceMap.get(unit.id) ?? [])]
        : [
            ...new Set([
              ...services.filter((item) => item.unitId === unit.id).map((item) => item.id),
              ...(persistedServiceMap.get(unit.id) ?? [])
            ])
          ];
      const base = hasPersistedUnits
        ? defaultUnitSetting(
            unit.id,
            unit.brandName || unit.name,
            availableServiceIds,
            {
              printTemplateId: resolvedPrintTemplates[0]?.id,
              panelProfileId: resolvedPanelProfiles[0]?.id,
              panelPlaylistId: resolvedPlaylists.find((item) => !item.unitId || item.unitId === unit.id)?.id
            }
          )
        : unitSettings.find((item) => item.unitId === unit.id) ?? defaultUnitSetting(
            unit.id,
            unit.brandName || unit.name,
            availableServiceIds,
            {
              printTemplateId: resolvedPrintTemplates[0]?.id ?? printTemplates[0]?.id,
              panelProfileId: resolvedPanelProfiles[0]?.id ?? panelProfiles[0]?.id,
              panelPlaylistId: resolvedPlaylists.find((item) => !item.unitId || item.unitId === unit.id)?.id
            }
          );
      const normalized = normalizeUnitSetting({
        ...base,
        ...(persistedMap.get(unit.id) ?? {})
      });

      if (hasPersistedUnits && !persistedMap.has(unit.id)) {
        await prisma.unitSetting.upsert({
          where: { unitId: unit.id },
          create: {
            unitId: unit.id,
            printHeader: normalized.printHeader,
            printFooter: normalized.printFooter,
            printShowDate: normalized.printShowDate,
            printShowTicketType: normalized.printShowTicketType,
            printShowUnitName: normalized.printShowUnitName,
            printShowServiceName: normalized.printShowServiceName,
            printTemplateId: normalized.printTemplateId ?? null,
            triageServiceIds: normalized.triageServiceIds,
            panelShowHistory: normalized.panelShowHistory,
            panelShowClock: normalized.panelShowClock,
            panelPrimaryMediaId: normalized.panelPrimaryMediaId ?? null,
            panelProfileId: normalized.panelProfileId ?? null,
            panelPlaylistId: normalized.panelPlaylistId ?? null,
            panelBrandingText: normalized.panelBrandingText ?? null,
            webhooks: normalized.webhooks,
            panelRuntime: normalized.panelRuntime,
            triageRuntime: normalized.triageRuntime
          },
          update: {}
        }).catch(() => undefined);
      }

      resolvedSettings.push({
        ...normalized,
        unit
      });
    }

    return resolvedSettings;
  }

  private async readPanelProfiles() {
    const persisted = await prisma.panelProfile.findMany().catch(() => []);
    const normalized: PanelProfile[] = persisted.map((item) => ({
      id: item.id,
      name: item.name,
      layout: item.layout as PanelProfile["layout"],
      locale: (item.locale as PanelProfile["locale"]) ?? "es",
      theme: {
        background: item.themeBackground,
        accent: item.themeAccent,
        text: item.themeText
      }
    }));

    if (persisted.length) {
      return normalized;
    }

    if (await this.hasPersistedUnits()) {
      return [await this.ensureDefaultPanelProfile()];
    }

    return panelProfiles;
  }

  private async readPrintTemplates() {
    const persisted = await prisma.printTemplate.findMany().catch(() => []);
    const normalized: PrintTemplate[] = persisted.map((item) => ({
      id: item.id,
      name: item.name,
      scope: item.scope,
      unit: item.unit,
      header: item.header,
      footer: item.footer,
      html: item.html
    }));

    if (persisted.length) {
      return normalized;
    }

    if (await this.hasPersistedUnits()) {
      return [await this.ensureDefaultPrintTemplate()];
    }

    return printTemplates;
  }

  private async readMediaAssets() {
    const persisted = await prisma.mediaAsset.findMany().catch(() => []);
    const normalized: MediaAsset[] = persisted.map((item) => ({
      id: item.id,
      unitId: item.unitId ?? undefined,
      title: item.title,
      kind: item.kind,
      url: item.url,
      durationSeconds: item.durationSeconds
    }));

    if (persisted.length) {
      return normalized;
    }

    return (await this.hasPersistedUnits()) ? [] : mediaAssets;
  }

  private async readPanelPlaylists() {
    const persisted = await prisma.panelPlaylist.findMany({
      include: {
        items: {
          include: {
            asset: true
          },
          orderBy: {
            position: "asc"
          }
        }
      }
    }).catch(() => []);

    const normalized: PanelPlaylist[] = persisted.map((item) => ({
      id: item.id,
      unitId: item.unitId ?? undefined,
      name: item.name,
      active: item.active,
      items: item.items.map((playlistItem) => ({
        id: playlistItem.id,
        assetId: playlistItem.assetId,
        title: playlistItem.asset.title,
        kind: playlistItem.asset.kind,
        url: playlistItem.asset.url,
        durationSeconds: playlistItem.durationSeconds ?? playlistItem.asset.durationSeconds,
        position: playlistItem.position
      }))
    }));

    if (persisted.length) {
      return normalized;
    }

    return (await this.hasPersistedUnits()) ? [] : panelPlaylists;
  }

  private async hasPersistedUnits() {
    const count = await prisma.unit.count().catch(() => 0);
    return count > 0;
  }

  private async ensureDefaultPanelProfile() {
    const fallback = defaultPanelProfileValue();
    const persisted = await prisma.panelProfile.upsert({
      where: { id: fallback.id },
      create: {
        id: fallback.id,
        name: fallback.name,
        layout: fallback.layout,
        locale: fallback.locale,
        themeBackground: fallback.theme.background,
        themeAccent: fallback.theme.accent,
        themeText: fallback.theme.text
      },
      update: {}
    });

    return {
      id: persisted.id,
      name: persisted.name,
      layout: persisted.layout as PanelProfile["layout"],
      locale: (persisted.locale as PanelProfile["locale"]) ?? "es",
      theme: {
        background: persisted.themeBackground,
        accent: persisted.themeAccent,
        text: persisted.themeText
      }
    } satisfies PanelProfile;
  }

  private async ensureDefaultPrintTemplate() {
    const fallback = defaultPrintTemplateValue();
    const persisted = await prisma.printTemplate.upsert({
      where: { id: fallback.id },
      create: {
        id: fallback.id,
        unitId: null,
        name: fallback.name,
        scope: fallback.scope,
        unit: fallback.unit,
        header: fallback.header,
        footer: fallback.footer,
        html: fallback.html
      },
      update: {}
    });

    return {
      id: persisted.id,
      name: persisted.name,
      scope: persisted.scope,
      unit: persisted.unit,
      header: persisted.header,
      footer: persisted.footer,
      html: persisted.html
    } satisfies PrintTemplate;
  }
}
