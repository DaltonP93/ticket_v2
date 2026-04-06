import type { Desk, SupportedLocale, Ticket, TicketCall } from "@ticket-v2/contracts";
import { prisma } from "../../lib/prisma.js";
import { audioProfiles, currentCalls, desks, locations, services, tickets, ticketTypes } from "../../data/mock-db.js";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asDesk(item: { id: string; unitId: string; locationId: string; name: string; operatorName: string; serviceIds: unknown }): Desk {
  return {
    id: item.id,
    unitId: item.unitId,
    locationId: item.locationId,
    name: item.name,
    operatorName: item.operatorName,
    serviceIds: asStringArray(item.serviceIds)
  };
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
    locale: item.locale as SupportedLocale,
    announcementText: item.announcementText,
    calledAt: item.calledAt.toISOString()
  };
}

export class AttendanceService {
  async listDesks(unitId?: string) {
    const persisted = await prisma.desk.findMany({
      where: unitId ? { unitId } : undefined
    }).catch(() => []);

    if (persisted.length) {
      return persisted.map(asDesk);
    }

    return (await this.hasPersistedUnits())
      ? []
      : unitId ? desks.filter((desk) => desk.unitId === unitId) : desks;
  }

  async operationalSnapshot(unitId?: string) {
    const [resolvedDesks, monitor, recentTickets, currentCalls, availableServices, availableTicketTypes] = await Promise.all([
      this.desksState(unitId),
      this.monitorSummary(unitId),
      this.loadTickets(unitId),
      this.loadCalls(unitId),
      this.loadServices(unitId),
      this.loadTicketTypes(unitId)
    ]);

    return {
      unitId: unitId ?? null,
      generatedAt: new Date().toISOString(),
      desks: resolvedDesks,
      monitor,
      recentTickets: recentTickets.slice(0, 20).map((ticket) => ({
        ...ticket,
        service: availableServices.find((item) => item.id === ticket.serviceId) ?? null,
        ticketType: availableTicketTypes.find((item) => item.id === ticket.ticketTypeId) ?? null
      })),
      currentCalls
    };
  }

  async desksState(unitId?: string) {
    const availableDesks = await this.listDesks(unitId);
    const [availableTickets, availableCalls, availableServices, availableTicketTypes] = await Promise.all([
      this.loadTickets(unitId),
      this.loadCalls(unitId),
      this.loadServices(unitId),
      this.loadTicketTypes(unitId)
    ]);

    return availableDesks.map((desk) => {
      const queue = availableTickets
        .filter((ticket) => ticket.status === "waiting" && desk.serviceIds.includes(ticket.serviceId))
        .map((ticket) => ({
          ...ticket,
          service: availableServices.find((item) => item.id === ticket.serviceId) ?? null,
          ticketType: availableTicketTypes.find((item) => item.id === ticket.ticketTypeId) ?? null
        }));

      return {
        desk,
        queue,
        currentCall: availableCalls.find((call) => call.deskId === desk.id) ?? null
      };
    });
  }

  async queueForDesk(deskId: string) {
    const desk = await this.findDesk(deskId);

    if (!desk) {
      throw new Error("Puesto no encontrado.");
    }

    const [waitingTickets, availableServices, availableTicketTypes] = await Promise.all([
      this.loadTickets(desk.unitId),
      this.loadServices(desk.unitId),
      this.loadTicketTypes(desk.unitId)
    ]);

    return waitingTickets
      .filter((ticket) => ticket.status === "waiting" && desk.serviceIds.includes(ticket.serviceId))
      .map((ticket) => ({
        ...ticket,
        service: availableServices.find((item) => item.id === ticket.serviceId) ?? null,
        ticketType: availableTicketTypes.find((item) => item.id === ticket.ticketTypeId) ?? null
      }));
  }

  async currentCallForDesk(deskId: string) {
    const desk = await this.findDesk(deskId);
    if (!desk) {
      return null;
    }
    const calls = await this.loadCalls(desk.unitId);
    return calls.find((call) => call.deskId === deskId) ?? null;
  }

  async monitorSummary(unitId?: string) {
    const [allTickets, availableServices] = await Promise.all([this.loadTickets(unitId), this.loadServices(unitId)]);

    return availableServices.map((service) => {
      const serviceTickets = allTickets.filter((ticket) => ticket.serviceId === service.id);
      const waiting = serviceTickets.filter((ticket) => ticket.status === "waiting");
      const inService = serviceTickets.filter((ticket) => ticket.status === "in_service");
      const called = serviceTickets.filter((ticket) => ticket.status === "called");

      return {
        serviceId: service.id,
        serviceName: service.name,
        code: service.code,
        waitingCount: waiting.length,
        inServiceCount: inService.length,
        calledCount: called.length,
        totalOpen: waiting.length + inService.length + called.length,
        waitingSequences: waiting.slice(0, 8).map((ticket) => ticket.sequence)
      };
    });
  }

  async findTicket(sequence: string, unitId?: string) {
    const normalized = sequence.trim().toUpperCase();
    if (!normalized) {
      return null;
    }

    const tickets = await this.loadTickets(unitId);
    const ticket = tickets.find((item) => item.sequence.toUpperCase() === normalized);
    if (!ticket) {
      return null;
    }

    const service = (await this.loadServices(ticket.unitId)).find((item) => item.id === ticket.serviceId) ?? null;
    const ticketType = (await this.loadTicketTypes(ticket.unitId)).find((item) => item.id === ticket.ticketTypeId) ?? null;
    const activeCall = (await this.loadCalls(ticket.unitId)).find((item) => item.ticketId === ticket.id) ?? null;

    return {
      ticket,
      service,
      ticketType,
      activeCall
    };
  }

  async callNext(input: { deskId: string; locale: SupportedLocale }) {
    const hasPersistedUnits = await this.hasPersistedUnits();
    const desk = await this.findDesk(input.deskId);

    if (!desk) {
      throw new Error("Puesto no encontrado.");
    }

    const activeCall = await this.currentCallForDesk(desk.id);
    if (activeCall) {
      const activeTickets = await this.loadTickets(desk.unitId);
      const activeTicket = activeTickets.find((ticket) => ticket.id === activeCall.ticketId);
      if (activeTicket?.status === "in_service") {
        return activeCall;
      }
    }

    const waitingTicket = (await this.loadTickets(desk.unitId))
      .filter((ticket) => ticket.status === "waiting" && desk.serviceIds.includes(ticket.serviceId))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];

    if (!waitingTicket) {
      return null;
    }

    const service = (await this.loadServices(desk.unitId)).find((item) => item.id === waitingTicket.serviceId);
    const ticketType = (await this.loadTicketTypes(desk.unitId)).find((item) => item.id === waitingTicket.ticketTypeId);
    const location = await this.findLocation(desk.locationId);
    const profile = audioProfiles[input.locale];
    const counter = location?.name ?? desk.name;

    const nextCall: TicketCall = {
      ticketId: waitingTicket.id,
      deskId: desk.id,
      deskName: desk.name,
      sequence: waitingTicket.sequence,
      counter,
      serviceName: service?.name ?? "Servicio",
      ticketTypeName: ticketType?.name ?? "Ticket",
      locale: input.locale,
      announcementText: this.interpolate(profile.template, {
        sequence: waitingTicket.sequence,
        counter,
        serviceName: service?.name ?? "Servicio"
      }),
      calledAt: new Date().toISOString()
    };

    const updated = await prisma.ticketRecord.update({
      where: { id: waitingTicket.id },
      data: { status: "in_service" }
    }).catch(() => null);

    await prisma.ticketCallLog.create({
      data: {
        ticketId: nextCall.ticketId,
        deskId: nextCall.deskId,
        deskName: nextCall.deskName,
        sequence: nextCall.sequence,
        counter: nextCall.counter,
        serviceName: nextCall.serviceName,
        ticketTypeName: nextCall.ticketTypeName,
        locale: nextCall.locale,
        announcementText: nextCall.announcementText
      }
    }).catch(() => null);

    if (!updated) {
      if (hasPersistedUnits) {
        throw new Error("No se pudo persistir el llamado en la base de datos.");
      }

      const fallbackTicket = tickets.find((item) => item.id === waitingTicket.id);
      if (fallbackTicket) {
        fallbackTicket.status = "in_service";
      }
      currentCalls.unshift(nextCall);
    }

    return nextCall;
  }

  async finishTicket(ticketId: string) {
    const hasPersistedUnits = await this.hasPersistedUnits();
    const updated = await prisma.ticketRecord.update({
      where: { id: ticketId },
      data: { status: "finished" }
    }).catch(() => null);

    if (!updated) {
      if (hasPersistedUnits) {
        throw new Error("No se pudo finalizar el ticket en la base de datos.");
      }

      const ticket = tickets.find((item) => item.id === ticketId);
      if (!ticket) {
        throw new Error("Ticket no encontrado.");
      }
      ticket.status = "finished";
    }

    return {
      success: true,
      ticketId
    };
  }

  async findDeskById(deskId: string) {
    return this.findDesk(deskId);
  }

  async findTicketById(ticketId: string) {
    const persisted = await prisma.ticketRecord.findUnique({
      where: { id: ticketId }
    }).catch(() => null);

    if (persisted) {
      return asTicket(persisted);
    }

    return (await this.hasPersistedUnits()) ? null : tickets.find((item) => item.id === ticketId) ?? null;
  }

  private async loadTickets(unitId?: string) {
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
      : unitId ? tickets.filter((item) => item.unitId === unitId) : tickets;
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
      : unitId ? services.filter((item) => item.unitId === unitId) : services;
  }

  private async loadTicketTypes(unitId?: string) {
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
      : unitId ? ticketTypes.filter((item) => !item.unitId || item.unitId === unitId) : ticketTypes;
  }

  private async loadCalls(unitId?: string) {
    const persisted = await prisma.ticketCallLog.findMany({
      orderBy: { calledAt: "desc" },
      take: 30
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
      return currentCalls;
    }

    const ticketIds = new Set(tickets.filter((item) => item.unitId === unitId).map((item) => item.id));
    return currentCalls.filter((item) => ticketIds.has(item.ticketId));
  }

  private async findDesk(deskId: string) {
    const persisted = await prisma.desk.findUnique({
      where: { id: deskId }
    }).catch(() => null);

    if (persisted) {
      return asDesk(persisted);
    }

    return (await this.hasPersistedUnits()) ? null : desks.find((item) => item.id === deskId) ?? null;
  }

  private async findLocation(locationId: string) {
    const persisted = await prisma.location.findUnique({
      where: { id: locationId }
    }).catch(() => null);

    if (persisted) {
      return {
        id: persisted.id,
        unitId: persisted.unitId,
        code: persisted.code,
        name: persisted.name
      };
    }

    return (await this.hasPersistedUnits()) ? null : locations.find((item) => item.id === locationId) ?? null;
  }

  private interpolate(template: string, params: Record<string, string>) {
    return Object.entries(params).reduce((value, [key, replacement]) => {
      return value.replace(new RegExp(`\\{${key}\\}`, "g"), replacement);
    }, template);
  }

  private async hasPersistedUnits() {
    const count = await prisma.unit.count().catch(() => 0);
    return count > 0;
  }
}
