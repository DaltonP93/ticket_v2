import { currentCalls, panelProfiles, services, tickets, ticketTypes } from "../../data/mock-db.js";

export class PanelService {
  getPanelPayload() {
    return {
      config: panelProfiles[0],
      calls: tickets.slice(0, 10).map((ticket) => ({
        ...ticket,
        service: services.find((item) => item.id === ticket.serviceId),
        ticketType: ticketTypes.find((item) => item.id === ticket.ticketTypeId)
      })),
      media: [
        {
          id: "media_001",
          kind: "image",
          title: "Promocion institucional",
          path: "/assets/promocion-1.jpg",
          durationSeconds: 12
        }
      ],
      audio: {
        enabled: true,
        locale: panelProfiles[0].locale ?? "es",
        currentCalls
      }
    };
  }
}
