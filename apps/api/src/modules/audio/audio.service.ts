import type { SupportedLocale, TicketCall } from "@ticket-v2/contracts";
import { prisma } from "../../lib/prisma.js";
import { audioProfiles, currentCalls, services, tickets, ticketTypes } from "../../data/mock-db.js";

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

export class AudioService {
  listAudioProfiles() {
    return audioProfiles;
  }

  async listCurrentCalls(unitId?: string) {
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

    const unitTicketIds = new Set(tickets.filter((item) => item.unitId === unitId).map((item) => item.id));
    return currentCalls.filter((item) => unitTicketIds.has(item.ticketId));
  }

  previewAnnouncement(input: {
    locale: SupportedLocale;
    sequence: string;
    counter: string;
    serviceName: string;
  }) {
    const profile = audioProfiles[input.locale];

    return {
      locale: profile.locale,
      text: this.interpolate(profile.template, {
        sequence: input.sequence,
        counter: input.counter,
        serviceName: input.serviceName
      }),
      profile
    };
  }

  async callNextTicket(input: {
    ticketId: string;
    locale: SupportedLocale;
    counter: string;
    deskId?: string;
    deskName?: string;
  }): Promise<TicketCall> {
    const hasPersistedUnits = await this.hasPersistedUnits();
    const persistedTicket = await prisma.ticketRecord.findUnique({
      where: { id: input.ticketId }
    }).catch(() => null);
    const ticket =
      persistedTicket
        ? {
            id: persistedTicket.id,
            sequence: persistedTicket.sequence,
            serviceId: persistedTicket.serviceId,
            ticketTypeId: persistedTicket.ticketTypeId
          }
        : hasPersistedUnits
          ? undefined
          : tickets.find((item) => item.id === input.ticketId);

    if (!ticket) {
      throw new Error("Ticket no encontrado.");
    }

    const persistedService = await prisma.service.findUnique({
      where: { id: ticket.serviceId }
    }).catch(() => null);
    const persistedTicketType = await prisma.ticketType.findUnique({
      where: { id: ticket.ticketTypeId }
    }).catch(() => null);
    const service = persistedService
      ? {
          id: persistedService.id,
          name: persistedService.name
        }
      : hasPersistedUnits
        ? undefined
        : services.find((item) => item.id === ticket.serviceId);
    const ticketType = persistedTicketType
      ? {
          id: persistedTicketType.id,
          name: persistedTicketType.name
        }
      : hasPersistedUnits
        ? undefined
        : ticketTypes.find((item) => item.id === ticket.ticketTypeId);

    if (hasPersistedUnits && (!service || !ticketType)) {
      throw new Error("El ticket no tiene un servicio o tipo valido para generar el audio.");
    }

    const profile = audioProfiles[input.locale];

    const call: TicketCall = {
      ticketId: ticket.id,
      deskId: input.deskId ?? `desk_${input.counter.toLowerCase().replace(/\s+/g, "_")}`,
      deskName: input.deskName ?? input.counter,
      sequence: ticket.sequence,
      counter: input.counter,
      serviceName: service?.name ?? "Servicio",
      ticketTypeName: ticketType?.name ?? "Ticket",
      locale: input.locale,
      announcementText: this.interpolate(profile.template, {
        sequence: ticket.sequence,
        counter: input.counter,
        serviceName: service?.name ?? "Servicio"
      }),
      calledAt: new Date().toISOString()
    };

    const updated = await prisma.ticketRecord.update({
      where: { id: ticket.id },
      data: { status: "called" }
    }).catch(() => null);

    await prisma.ticketCallLog.create({
      data: {
        ticketId: call.ticketId,
        deskId: call.deskId,
        deskName: call.deskName,
        sequence: call.sequence,
        counter: call.counter,
        serviceName: call.serviceName,
        ticketTypeName: call.ticketTypeName,
        locale: call.locale,
        announcementText: call.announcementText
      }
    }).catch(() => null);

    if (!updated) {
      if (hasPersistedUnits) {
        throw new Error("No se pudo persistir el llamado de audio en la base de datos.");
      }

      const fallbackTicket = tickets.find((item) => item.id === ticket.id);
      if (fallbackTicket) {
        fallbackTicket.status = "called";
      }
      currentCalls.unshift(call);
    }

    return call;
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
