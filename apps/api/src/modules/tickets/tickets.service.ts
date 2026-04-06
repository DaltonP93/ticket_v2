import type { ServiceCatalogItem, Ticket, TicketType, Unit, UnitSettings } from "@ticket-v2/contracts";
import { prisma } from "../../lib/prisma.js";
import { services as fallbackServices, ticketTypes as fallbackTicketTypes, tickets as fallbackTickets, unitSettings as fallbackUnitSettings, units as fallbackUnits } from "../../data/mock-db.js";

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

function defaultUnitSetting(unitId: string, unitName: string, availableServiceIds: string[]): UnitSettings {
  return normalizeUnitSetting({
    unitId,
    printHeader: unitName,
    printFooter: "Presente su documento y aguarde el llamado en pantalla.",
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
    },
    triageRuntime: {
      ...defaultTriageRuntime(),
      visibleServiceIds: availableServiceIds
    }
  });
}

function asTicket(record: {
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
    id: record.id,
    sequence: record.sequence,
    status: record.status as Ticket["status"],
    serviceId: record.serviceId,
    unitId: record.unitId,
    ticketTypeId: record.ticketTypeId,
    clientName: record.clientName ?? undefined,
    clientDocument: record.clientDocument ?? undefined,
    metadata: (record.metadata as Ticket["metadata"]) ?? {},
    createdAt: record.createdAt.toISOString()
  };
}

export class TicketsService {
  async getTriageSnapshot(unitId?: string) {
    const [units, settings, services, recentTickets] = await Promise.all([
      this.loadUnits(),
      this.loadUnitSettings(),
      this.loadServices(),
      this.listTickets(unitId)
    ]);

    const activeUnit = units.find((item) => item.id === unitId) ?? units[0] ?? null;
    const ticketTypes = await this.listTicketTypes(activeUnit?.id);
    const activeSettings = settings.find((item) => item.unitId === activeUnit?.id) ?? null;
    const unitServices = activeUnit ? services.filter((item) => item.unitId === activeUnit.id) : [];
    const visibleServiceIds =
      activeSettings?.triageRuntime?.visibleServiceIds?.length
        ? activeSettings.triageRuntime.visibleServiceIds
        : activeSettings?.triageServiceIds?.length
          ? activeSettings.triageServiceIds
          : unitServices.map((item) => item.id);
    const visibleDepartmentIds =
      activeSettings?.triageRuntime?.visibleDepartmentIds?.length
        ? activeSettings.triageRuntime.visibleDepartmentIds
        : unitServices.map((item) => item.departmentId);
    const availableServices = unitServices.filter((item) => visibleServiceIds.includes(item.id) && visibleDepartmentIds.includes(item.departmentId));
    const allowedTicketTypeIds = new Set(
      availableServices.flatMap((item) => asStringArray(item.ticketTypeIds))
    );
    const availableTicketTypes = ticketTypes.filter((item) => !allowedTicketTypeIds.size || allowedTicketTypeIds.has(item.id));

    return {
      unit: activeUnit,
      settings: activeSettings,
      services: availableServices,
      ticketTypes: availableTicketTypes,
      lastIssuedTicket: recentTickets[0] ?? null
    };
  }

  async listTicketTypes(unitId?: string) {
    const persisted = await prisma.ticketType.findMany({
      where: unitId ? { unitId } : undefined
    }).catch(() => []);
    if (!persisted.length) {
      return (await this.hasPersistedUnits())
        ? []
        : unitId ? fallbackTicketTypes.filter((item) => !item.unitId || item.unitId === unitId) : fallbackTicketTypes;
    }

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
    } satisfies TicketType));
  }

  async issueTicket(input: {
    serviceId: string;
    ticketTypeId: string;
    clientName?: string;
    clientDocument?: string;
    metadata?: Record<string, string | number | boolean>;
  }) {
    const hasPersistedUnits = await this.hasPersistedUnits();
    const persistedServices = await prisma.service.findMany().catch(() => []);
    const persistedTicketTypes = await prisma.ticketType.findMany().catch(() => []);
    const service =
      persistedServices.find((item) => item.id === input.serviceId) ??
      (hasPersistedUnits ? undefined : fallbackServices.find((item) => item.id === input.serviceId));
    const ticketType =
      persistedTicketTypes.find((item) => item.id === input.ticketTypeId) ??
      (hasPersistedUnits ? undefined : fallbackTicketTypes.find((item) => item.id === input.ticketTypeId));

    if (!service || !ticketType) {
      throw new Error("Servicio o tipo de ticket invalido.");
    }

    const allowedTicketTypeIds =
      "ticketTypeIds" in service
        ? asStringArray((service as ServiceCatalogItem).ticketTypeIds)
        : [];

    if (allowedTicketTypeIds.length && !allowedTicketTypeIds.includes(input.ticketTypeId)) {
      throw new Error("El tipo de ticket no esta habilitado para este servicio.");
    }

    if ("unitId" in ticketType && ticketType.unitId && ticketType.unitId !== service.unitId) {
      throw new Error("El tipo de ticket no pertenece a la misma unidad del servicio.");
    }

    const currentTickets = await this.listTickets();
    const prefix = ("prefix" in ticketType ? ticketType.prefix : undefined) ?? ticketType.code.slice(0, 1) ?? service.code.slice(0, 1) ?? "T";
    const nextNumber =
      currentTickets
        .filter((item) => item.sequence.startsWith(`${prefix}-`))
        .map((item) => Number.parseInt(item.sequence.split("-")[1] ?? "0", 10))
        .filter(Number.isFinite)
        .sort((left, right) => right - left)[0] ?? 0;
    const sequence = `${prefix}-${String(nextNumber + 1).padStart(3, "0")}`;

    const created = await prisma.ticketRecord.create({
      data: {
        sequence,
        status: "waiting",
        serviceId: input.serviceId,
        unitId: service.unitId,
        ticketTypeId: input.ticketTypeId,
        clientName: input.clientName ?? null,
        clientDocument: input.clientDocument ?? null,
        metadata: input.metadata ?? {}
      }
    }).catch(() => null);

    if (!created) {
      if (hasPersistedUnits) {
        throw new Error("No se pudo persistir el ticket en la base de datos.");
      }

      const ticket = {
        id: `tk_${String(fallbackTickets.length + 1).padStart(3, "0")}`,
        sequence,
        status: "waiting" as const,
        serviceId: input.serviceId,
        unitId: service.unitId,
        ticketTypeId: input.ticketTypeId,
        clientName: input.clientName,
        clientDocument: input.clientDocument,
        metadata: input.metadata ?? {},
        createdAt: new Date().toISOString()
      };

      fallbackTickets.unshift(ticket);
      return ticket;
    }

    return asTicket(created);
  }

  async listTickets(unitId?: string) {
    const persisted = await prisma.ticketRecord.findMany({
      where: unitId ? { unitId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 80
    }).catch(() => []);

    if (persisted.length) {
      return persisted.map(asTicket);
    }

    return (await this.hasPersistedUnits())
      ? []
      : unitId ? fallbackTickets.filter((item) => item.unitId === unitId) : fallbackTickets;
  }

  private async loadUnits(): Promise<Unit[]> {
    const persisted = await prisma.unit.findMany().catch(() => []);

    if (persisted.length) {
      return persisted.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        brandName: item.brandName,
        locale: item.locale as Unit["locale"],
        logoUrl: item.logoUrl ?? undefined
      }));
    }

    return (await this.hasPersistedUnits()) ? [] : fallbackUnits;
  }

  private async loadServices(): Promise<ServiceCatalogItem[]> {
    const persisted = await prisma.service.findMany().catch(() => []);

    if (persisted.length) {
      return persisted.map((item) => ({
        id: item.id,
        unitId: item.unitId,
        code: item.code,
        name: item.name,
        departmentId: item.departmentId,
        allowPriority: item.allowPriority,
        ticketTypeIds: Array.isArray(item.ticketTypeIds)
          ? item.ticketTypeIds.filter((value): value is string => typeof value === "string")
          : []
      }));
    }

    return (await this.hasPersistedUnits()) ? [] : fallbackServices;
  }

  private async loadUnitSettings(): Promise<UnitSettings[]> {
    const units = await this.loadUnits();
    const services = await this.loadServices();
    const persisted = await prisma.unitSetting.findMany().catch(() => []);

    if (!persisted.length) {
      if (!(await this.hasPersistedUnits())) {
        return fallbackUnitSettings.map(normalizeUnitSetting);
      }

      return units.map((unit) =>
        defaultUnitSetting(
          unit.id,
          unit.brandName ?? unit.name,
          services.filter((item) => item.unitId === unit.id).map((item) => item.id)
        )
      );
    }

    return persisted.map((item) => {
      const unit = units.find((entry) => entry.id === item.unitId);
      const availableServiceIds = services.filter((entry) => entry.unitId === item.unitId).map((entry) => entry.id);
      const fallback = unit
        ? defaultUnitSetting(item.unitId, unit.brandName ?? unit.name, availableServiceIds)
        : defaultUnitSetting(item.unitId, "", availableServiceIds);

      return normalizeUnitSetting({
        ...fallback,
        unitId: item.unitId,
        printHeader: item.printHeader,
        printFooter: item.printFooter,
        printShowDate: item.printShowDate,
        printShowTicketType: item.printShowTicketType,
        printShowUnitName: item.printShowUnitName,
        printShowServiceName: item.printShowServiceName,
        printTemplateId: item.printTemplateId ?? undefined,
        triageServiceIds: Array.isArray(item.triageServiceIds)
          ? item.triageServiceIds.filter((value): value is string => typeof value === "string")
          : availableServiceIds,
        panelShowHistory: item.panelShowHistory,
        panelShowClock: item.panelShowClock,
        panelPrimaryMediaId: item.panelPrimaryMediaId ?? undefined,
        panelBrandingText: item.panelBrandingText ?? undefined,
        webhooks: (item.webhooks as UnitSettings["webhooks"]) ?? fallback.webhooks,
        panelRuntime: (item.panelRuntime as UnitSettings["panelRuntime"]) ?? fallback.panelRuntime,
        triageRuntime: (item.triageRuntime as UnitSettings["triageRuntime"]) ?? fallback.triageRuntime
      });
    });
  }

  private async hasPersistedUnits() {
    const count = await prisma.unit.count().catch(() => 0);
    return count > 0;
  }
}
