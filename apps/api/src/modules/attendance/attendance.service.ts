import type { SupportedLocale, TicketCall } from "@ticket-v2/contracts";
import { audioProfiles, currentCalls, desks, locations, services, tickets, ticketTypes } from "../../data/mock-db.js";

export class AttendanceService {
  listDesks(unitId?: string) {
    return unitId ? desks.filter((desk) => desk.unitId === unitId) : desks;
  }

  queueForDesk(deskId: string) {
    const desk = desks.find((item) => item.id === deskId);

    if (!desk) {
      throw new Error("Puesto no encontrado.");
    }

    return tickets
      .filter((ticket) => ticket.status === "waiting" && desk.serviceIds.includes(ticket.serviceId))
      .map((ticket) => ({
        ...ticket,
        service: services.find((item) => item.id === ticket.serviceId) ?? null,
        ticketType: ticketTypes.find((item) => item.id === ticket.ticketTypeId) ?? null
      }));
  }

  currentCallForDesk(deskId: string) {
    return currentCalls.find((call) => call.deskId === deskId) ?? null;
  }

  callNext(input: { deskId: string; locale: SupportedLocale }) {
    const desk = desks.find((item) => item.id === input.deskId);

    if (!desk) {
      throw new Error("Puesto no encontrado.");
    }

    const activeCall = currentCalls.find((call) => {
      if (call.deskId !== desk.id) {
        return false;
      }

      const activeTicket = tickets.find((ticket) => ticket.id === call.ticketId);
      return activeTicket?.status === "in_service";
    });

    if (activeCall) {
      return activeCall;
    }

    const waitingTicket = tickets
      .filter((ticket) => ticket.status === "waiting" && desk.serviceIds.includes(ticket.serviceId))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];

    if (!waitingTicket) {
      return null;
    }

    const service = services.find((item) => item.id === waitingTicket.serviceId);
    const ticketType = ticketTypes.find((item) => item.id === waitingTicket.ticketTypeId);
    const location = locations.find((item) => item.id === desk.locationId);
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

    waitingTicket.status = "in_service";
    currentCalls.unshift(nextCall);

    return nextCall;
  }

  finishTicket(ticketId: string) {
    const ticket = tickets.find((item) => item.id === ticketId);

    if (!ticket) {
      throw new Error("Ticket no encontrado.");
    }

    ticket.status = "finished";

    return {
      success: true,
      ticketId
    };
  }

  private interpolate(template: string, params: Record<string, string>) {
    return Object.entries(params).reduce((value, [key, replacement]) => {
      return value.replace(new RegExp(`\\{${key}\\}`, "g"), replacement);
    }, template);
  }
}
