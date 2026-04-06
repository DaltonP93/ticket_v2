import type { PanelProfile, Ticket, TicketCall, TicketType, UnitSettings } from "@ticket-v2/contracts";
import { prisma } from "../../lib/prisma.js";
import {
  currentCalls as fallbackCalls,
  mediaAssets as fallbackMediaAssets,
  panelPlaylists as fallbackPanelPlaylists,
  panelProfiles as fallbackPanelProfiles,
  services as fallbackServices,
  ticketTypes as fallbackTicketTypes,
  tickets as fallbackTickets,
  unitSettings as fallbackUnitSettings,
  units as fallbackUnits
} from "../../data/mock-db.js";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

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

function normalizeUnitSetting(item: UnitSettings): UnitSettings {
  return {
    ...item,
    panelRuntime: {
      ...defaultPanelRuntime(),
      ...(item.panelRuntime ?? {})
    }
  };
}

function defaultUnitSetting(unitId: string, availableServiceIds: string[]): UnitSettings {
  return normalizeUnitSetting({
    unitId,
    printHeader: "",
    printFooter: "",
    printShowDate: true,
    printShowTicketType: true,
    printShowUnitName: true,
    printShowServiceName: true,
    triageServiceIds: availableServiceIds,
    panelShowHistory: true,
    panelShowClock: true,
    webhooks: {
      preTicket: "",
      postTicket: "",
      onPrint: ""
    },
    panelRuntime: {
      ...defaultPanelRuntime(),
      visibleServiceIds: availableServiceIds
    }
  });
}

function asTicket(item: {
  id: string;
  sequence: string;
  status: string;
  serviceId: string;
  unitId: string;
  ticketTypeId: string;
  clientName: string | null;
  clientDocument: string | null;
  metadata: unknown;
  createdAt: Date;
}): Ticket {
  return {
    id: item.id,
    sequence: item.sequence,
    status: item.status as Ticket["status"],
    serviceId: item.serviceId,
    unitId: item.unitId,
    ticketTypeId: item.ticketTypeId,
    clientName: item.clientName ?? undefined,
    clientDocument: item.clientDocument ?? undefined,
    metadata: (item.metadata as Ticket["metadata"]) ?? {},
    createdAt: item.createdAt.toISOString()
  };
}

function asCall(item: {
  ticketId: string;
  deskId: string;
  deskName: string;
  sequence: string;
  counter: string;
  serviceName: string;
  ticketTypeName: string;
  locale: string;
  announcementText: string;
  calledAt: Date;
}): TicketCall {
  return {
    ticketId: item.ticketId,
    deskId: item.deskId,
    deskName: item.deskName,
    sequence: item.sequence,
    counter: item.counter,
    serviceName: item.serviceName,
    ticketTypeName: item.ticketTypeName,
    locale: item.locale as TicketCall["locale"],
    announcementText: item.announcementText,
    calledAt: item.calledAt.toISOString()
  };
}

export class PanelService {
  async getPanelPayload(unitId?: string) {
    const availableUnits = await this.loadUnits();
    const activeUnitId = unitId ?? availableUnits[0]?.id;
    const [resolvedSettings, resolvedMedia, availableServices, availableTicketTypes, resolvedTickets, resolvedCalls] = await Promise.all([
      this.loadUnitSetting(activeUnitId),
      this.loadMediaAssets(activeUnitId),
      this.loadServices(activeUnitId),
      this.loadTicketTypes(activeUnitId),
      this.loadTickets(activeUnitId),
      this.loadCalls(activeUnitId)
    ]);
    const resolvedProfile = await this.loadPanelProfile(resolvedSettings.panelProfileId);
    const resolvedPlaylist = await this.loadPanelPlaylist(activeUnitId, resolvedSettings.panelPlaylistId);

    const visibleServiceIds = resolvedSettings.panelRuntime?.visibleServiceIds?.length
      ? resolvedSettings.panelRuntime.visibleServiceIds
      : availableServices.map((item) => item.id);
    const visibleDepartmentIds = resolvedSettings.panelRuntime?.visibleDepartmentIds?.length
      ? resolvedSettings.panelRuntime.visibleDepartmentIds
      : availableServices.map((item) => item.departmentId);
    const filteredServices = availableServices.filter((service) => {
      const serviceAllowed = visibleServiceIds.includes(service.id);
      const departmentAllowed = visibleDepartmentIds.includes(service.departmentId);
      return serviceAllowed && departmentAllowed;
    });
    const filteredServiceIds = filteredServices.map((item) => item.id);
    const filteredCalls = resolvedCalls.filter((call) =>
      filteredServices.some((service) => service.name === call.serviceName)
    );

    const playlistMedia = resolvedPlaylist?.items.length
      ? resolvedPlaylist.items.map((item) => ({
          id: item.assetId,
          kind: item.kind,
          title: item.title,
          path: item.url,
          durationSeconds: item.durationSeconds
        }))
      : [];

    return {
      config: resolvedProfile,
      calls: resolvedTickets
        .filter((ticket) => filteredServiceIds.includes(ticket.serviceId))
        .slice(0, 10)
        .map((ticket) => ({
          ...ticket,
          service: filteredServices.find((item) => item.id === ticket.serviceId) ?? null,
          ticketType: availableTicketTypes.find((item) => item.id === ticket.ticketTypeId) ?? null
        })),
      media: playlistMedia.length ? playlistMedia : resolvedMedia,
      playlist: resolvedPlaylist,
      audio: {
        enabled: resolvedSettings.panelRuntime?.speechEnabled ?? true,
        locale: resolvedProfile.locale ?? "es",
        currentCalls: filteredCalls
      }
    };
  }

  private async loadPanelPlaylist(unitId?: string, preferredPlaylistId?: string) {
    const persisted = await prisma.panelPlaylist.findFirst({
      where: unitId
        ? {
            OR: [
              { id: preferredPlaylistId ?? "__no_playlist__" },
              { unitId, active: true }
            ]
          }
        : { active: true },
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
    }).catch(() => null);

    if (persisted) {
      return {
        id: persisted.id,
        unitId: persisted.unitId ?? undefined,
        name: persisted.name,
        active: persisted.active,
        items: persisted.items.map((item) => ({
          id: item.id,
          assetId: item.assetId,
          title: item.asset.title,
          kind: item.asset.kind,
          url: item.asset.url,
          durationSeconds: item.durationSeconds ?? item.asset.durationSeconds,
          position: item.position
        }))
      };
    }

    return (await this.hasPersistedUnits())
      ? null
      : fallbackPanelPlaylists.find((item) => !unitId || item.unitId === unitId) ?? null;
  }

  private async loadUnits() {
    const persisted = await prisma.unit.findMany().catch(() => []);

    if (persisted.length) {
      return persisted.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        brandName: item.brandName,
        locale: item.locale as "es" | "en" | "pt",
        logoUrl: item.logoUrl ?? undefined
      }));
    }

    return (await this.hasPersistedUnits()) ? [] : fallbackUnits;
  }

  private async loadPanelProfile(preferredProfileId?: string): Promise<PanelProfile> {
    const persistedProfile = await prisma.panelProfile.findFirst({
      where: preferredProfileId ? { id: preferredProfileId } : undefined
    }).catch(() => null);

    if (persistedProfile) {
      return {
        id: persistedProfile.id,
        name: persistedProfile.name,
        layout: persistedProfile.layout as PanelProfile["layout"],
        locale: (persistedProfile.locale as PanelProfile["locale"]) ?? "es",
        theme: {
          background: persistedProfile.themeBackground,
          accent: persistedProfile.themeAccent,
          text: persistedProfile.themeText
        }
      };
    }

    if (await this.hasPersistedUnits()) {
      const anyPersistedProfile = await prisma.panelProfile.findFirst().catch(() => null);

      if (anyPersistedProfile) {
        return {
          id: anyPersistedProfile.id,
          name: anyPersistedProfile.name,
          layout: anyPersistedProfile.layout as PanelProfile["layout"],
          locale: (anyPersistedProfile.locale as PanelProfile["locale"]) ?? "es",
          theme: {
            background: anyPersistedProfile.themeBackground,
            accent: anyPersistedProfile.themeAccent,
            text: anyPersistedProfile.themeText
          }
        };
      }

      return defaultPanelProfileValue();
    }

    const fallbackProfile = preferredProfileId
      ? fallbackPanelProfiles.find((item) => item.id === preferredProfileId)
      : undefined;

    if (fallbackProfile) {
      return fallbackProfile;
    }

    return fallbackPanelProfiles[0] ?? defaultPanelProfileValue();
  }

  private async loadMediaAssets(unitId?: string) {
    const persistedAssets = unitId
      ? await prisma.mediaAsset.findMany({
          where: {
            OR: [{ unitId }, { unitId: null }]
          }
        }).catch(() => [])
      : [];

    return persistedAssets.length
      ? persistedAssets.map((item) => ({
          id: item.id,
          kind: item.kind,
          title: item.title,
          path: item.url,
          durationSeconds: item.durationSeconds
        }))
      : (await this.hasPersistedUnits())
        ? []
        : fallbackMediaAssets
            .filter((item) => !unitId || !item.unitId || item.unitId === unitId)
            .map((item) => ({
              id: item.id,
              kind: item.kind,
              title: item.title,
              path: item.url,
              durationSeconds: item.durationSeconds
            }));
  }

  private async loadUnitSetting(unitId?: string) {
    if (!unitId) {
      return defaultUnitSetting("", []);
    }

    const persisted = await prisma.unitSetting.findUnique({
      where: { unitId }
    }).catch(() => null);

    if (!persisted) {
      if (await this.hasPersistedUnits()) {
        const services = await this.loadServices(unitId);
        return defaultUnitSetting(unitId, services.map((item) => item.id));
      }

      return normalizeUnitSetting(
        fallbackUnitSettings.find((item) => item.unitId === unitId) ?? fallbackUnitSettings[0]
      );
    }

    const services = await this.loadServices(unitId);
    const fallback = (await this.hasPersistedUnits())
      ? defaultUnitSetting(unitId, services.map((item) => item.id))
      : fallbackUnitSettings.find((item) => item.unitId === unitId) ?? fallbackUnitSettings[0];

    return normalizeUnitSetting({
      ...fallback,
      unitId,
      printHeader: persisted.printHeader,
      printFooter: persisted.printFooter,
      printShowDate: persisted.printShowDate,
      printShowTicketType: persisted.printShowTicketType,
      printShowUnitName: persisted.printShowUnitName,
      printShowServiceName: persisted.printShowServiceName,
      triageServiceIds: asStringArray(persisted.triageServiceIds),
      panelShowHistory: persisted.panelShowHistory,
      panelShowClock: persisted.panelShowClock,
      panelPrimaryMediaId: persisted.panelPrimaryMediaId ?? undefined,
      panelProfileId: persisted.panelProfileId ?? undefined,
      panelPlaylistId: persisted.panelPlaylistId ?? undefined,
      panelBrandingText: persisted.panelBrandingText ?? undefined,
      webhooks: (persisted.webhooks as UnitSettings["webhooks"]) ?? fallback.webhooks,
      panelRuntime: (persisted.panelRuntime as UnitSettings["panelRuntime"]) ?? fallback.panelRuntime,
      triageRuntime: (persisted.triageRuntime as UnitSettings["triageRuntime"]) ?? fallback.triageRuntime
    });
  }

  private async loadServices(unitId?: string) {
    const persisted = await prisma.service.findMany({
      where: unitId ? { unitId } : undefined
    }).catch(() => []);

    if (persisted.length) {
      return persisted.map((item) => ({
        id: item.id,
        unitId: item.unitId,
        code: item.code,
        name: item.name,
        departmentId: item.departmentId,
        allowPriority: item.allowPriority,
        ticketTypeIds: asStringArray(item.ticketTypeIds)
      }));
    }

    return (await this.hasPersistedUnits())
      ? []
      : unitId ? fallbackServices.filter((item) => item.unitId === unitId) : fallbackServices;
  }

  private async loadTicketTypes(unitId?: string): Promise<TicketType[]> {
    const persisted = await prisma.ticketType.findMany({
      where: unitId ? { unitId } : undefined
    }).catch(() => []);

    if (persisted.length) {
      return persisted.map((item) => ({
        id: item.id,
        unitId: item.unitId,
        code: item.code,
        name: item.name,
        description: item.description,
        prefix: item.prefix ?? undefined,
        color: item.color,
        textColor: item.textColor,
        icon: item.icon ?? undefined,
        baseWeight: item.baseWeight,
        requireClient: item.requireClient,
        requireDocument: item.requireDocument,
        requireExternalValidation: item.requireExternalValidation,
        allowPrint: item.allowPrint,
        allowPanel: item.allowPanel,
        triageMessage: item.triageMessage ?? undefined
      }));
    }

    return (await this.hasPersistedUnits())
      ? []
      : unitId ? fallbackTicketTypes.filter((item) => !item.unitId || item.unitId === unitId) : fallbackTicketTypes;
  }

  private async loadTickets(unitId?: string) {
    const persisted = await prisma.ticketRecord.findMany({
      where: unitId ? { unitId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 20
    }).catch(() => []);

    if (persisted.length) {
      return persisted.map(asTicket);
    }

    return (await this.hasPersistedUnits())
      ? []
      : unitId
        ? fallbackTickets.filter((item) => item.unitId === unitId)
        : fallbackTickets;
  }

  private async loadCalls(unitId?: string) {
    const persisted = await prisma.ticketCallLog.findMany({
      orderBy: { calledAt: "desc" },
      take: 20
    }).catch(() => []);

    if (persisted.length) {
      if (!unitId) {
        return persisted.map(asCall);
      }

      const unitTickets = await prisma.ticketRecord.findMany({
        where: { unitId },
        select: { id: true }
      }).catch(() => []);
      const ticketIds = new Set(unitTickets.map((item) => item.id));
      return persisted.filter((item) => ticketIds.has(item.ticketId)).map(asCall);
    }

    if (await this.hasPersistedUnits()) {
      return [];
    }

    if (!unitId) {
      return fallbackCalls;
    }

    const ticketIds = new Set(fallbackTickets.filter((item) => item.unitId === unitId).map((item) => item.id));
    return fallbackCalls.filter((item) => ticketIds.has(item.ticketId));
  }

  private async hasPersistedUnits() {
    const count = await prisma.unit.count().catch(() => 0);
    return count > 0;
  }
}
