import type { UnitSettings } from "@ticket-v2/contracts";
import { prisma } from "../../lib/prisma.js";
import { panelProfiles, unitSettings, units } from "../../data/mock-db.js";

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

export class SettingsService {
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
    return panelProfiles;
  }

  async saveUnitSettings(unitId: string, patch: UnitSettingsPatch) {
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
        triageServiceIds: merged.triageServiceIds,
        panelShowHistory: merged.panelShowHistory,
        panelShowClock: merged.panelShowClock,
        panelPrimaryMediaId: merged.panelPrimaryMediaId,
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
        triageServiceIds: merged.triageServiceIds,
        panelShowHistory: merged.panelShowHistory,
        panelShowClock: merged.panelShowClock,
        panelPrimaryMediaId: merged.panelPrimaryMediaId,
        panelBrandingText: merged.panelBrandingText,
        webhooks: merged.webhooks,
        panelRuntime: merged.panelRuntime,
        triageRuntime: merged.triageRuntime
      }
    });

    return {
      ...merged,
      unit: units.find((unit) => unit.id === merged.unitId) ?? null
    };
  }

  private async readUnitSettings() {
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
          triageServiceIds: item.triageServiceIds as string[],
          panelShowHistory: item.panelShowHistory,
          panelShowClock: item.panelShowClock,
          panelPrimaryMediaId: item.panelPrimaryMediaId ?? undefined,
          panelBrandingText: item.panelBrandingText ?? undefined,
          webhooks: item.webhooks as UnitSettings["webhooks"],
          panelRuntime: (item.panelRuntime as UnitSettings["panelRuntime"]) ?? undefined,
          triageRuntime: (item.triageRuntime as UnitSettings["triageRuntime"]) ?? undefined
        }
      ])
    );

    return unitSettings.map((item) => {
      const normalized = normalizeUnitSetting({
        ...item,
        ...(persistedMap.get(item.unitId) ?? {})
      });

      return {
        ...normalized,
        unit: units.find((unit) => unit.id === item.unitId) ?? null
      };
    });
  }
}
