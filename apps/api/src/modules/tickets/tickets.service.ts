import { services, ticketTypes, tickets } from "../../data/mock-db.js";

export class TicketsService {
  listTicketTypes() {
    return ticketTypes;
  }

  issueTicket(input: {
    serviceId: string;
    ticketTypeId: string;
    clientName?: string;
    clientDocument?: string;
    metadata?: Record<string, string | number | boolean>;
  }) {
    const service = services.find((item) => item.id === input.serviceId);
    const ticketType = ticketTypes.find((item) => item.id === input.ticketTypeId);

    if (!service || !ticketType) {
      throw new Error("Servicio o tipo de ticket invalido.");
    }

    const nextNumber = String(tickets.length + 1).padStart(3, "0");
    const ticket = {
      id: `tk_${nextNumber}`,
      sequence: `${ticketType.prefix ?? "T"}-${nextNumber}`,
      status: "waiting" as const,
      serviceId: service.id,
      unitId: "unit_samap",
      ticketTypeId: ticketType.id,
      clientName: input.clientName,
      clientDocument: input.clientDocument,
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString()
    };

    tickets.unshift(ticket);
    return ticket;
  }

  listTickets() {
    return tickets;
  }
}

