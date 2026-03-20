import type { UnitSettings } from "@ticket-v2/contracts";
import { prisma } from "../../lib/prisma.js";
import { panelProfiles, unitSettings, units } from "../../data/mock-db.js";

type UnitSettingsPatch = Partial<Omit<UnitSettings, "webhooks" | "panelRuntime" | "triageRuntime">> & {
  webhooks?: Partial<NonNullable<UnitSettings["webhooks"]>>;
  panelRuntime?: Partial<NonNullable<UnitSettings["panelRuntime"]>>;
  triageRuntime?: Partial<NonNullable<UnitSettings["triageRuntime"]>>;
};

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
        ...(fallback.panelRuntime ?? {}),
        ...(patch.panelRuntime ?? {})
      },
      triageRuntime: {
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

    return unitSettings.map((item) => ({
      ...item,
      ...(persistedMap.get(item.unitId) ?? {}),
      unit: units.find((unit) => unit.id === item.unitId) ?? null
    }));
  }
}
