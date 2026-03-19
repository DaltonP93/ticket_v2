import type { SupportedLocale, TicketCall } from "@ticket-v2/contracts";
import { audioProfiles, currentCalls, services, tickets, ticketTypes } from "../../data/mock-db.js";

export class AudioService {
  listAudioProfiles() {
    return audioProfiles;
  }

  listCurrentCalls() {
    return currentCalls;
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

  callNextTicket(input: {
    ticketId: string;
    locale: SupportedLocale;
    counter: string;
    deskId?: string;
    deskName?: string;
  }): TicketCall {
    const ticket = tickets.find((item) => item.id === input.ticketId);

    if (!ticket) {
      throw new Error("Ticket no encontrado.");
    }

    const service = services.find((item) => item.id === ticket.serviceId);
    const ticketType = ticketTypes.find((item) => item.id === ticket.ticketTypeId);
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

    ticket.status = "called";
    currentCalls.unshift(call);

    return call;
  }

  private interpolate(template: string, params: Record<string, string>) {
    return Object.entries(params).reduce((value, [key, replacement]) => {
      return value.replace(new RegExp(`\\{${key}\\}`, "g"), replacement);
    }, template);
  }
}
