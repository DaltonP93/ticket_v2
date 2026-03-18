export class IntegrationService {
  listConnectors() {
    return [
      {
        id: "int_his",
        code: "his-rest",
        type: "rest_outbound",
        name: "HIS Connector",
        events: ["ticket.emitted", "ticket.called", "attendance.finished"],
        status: "ready"
      },
      {
        id: "int_crm",
        code: "crm-webhook",
        type: "webhook",
        name: "CRM Webhook",
        events: ["ticket.pre_emit", "ticket.emitted"],
        status: "ready"
      }
    ];
  }
}

