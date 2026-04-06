import { prisma } from "../../lib/prisma.js";

const DEFAULT_CONNECTORS = [
  {
    id: "int_his",
    unitId: "unit_samap",
    code: "his-rest",
    type: "REST outbound",
    name: "HIS Connector",
    endpoint: "https://his.example.com/api/tickets",
    events: ["ticket.emitted", "ticket.called", "attendance.finished"],
    status: "Online",
    enabled: true
  },
  {
    id: "int_crm",
    unitId: "unit_samap",
    code: "crm-webhook",
    type: "Webhook",
    name: "CRM Webhook",
    endpoint: "https://crm.example.com/hooks/tickets",
    events: ["ticket.pre_emit", "ticket.emitted"],
    status: "Online",
    enabled: true
  },
  {
    id: "int_cov",
    unitId: "unit_laboratorio",
    code: "coverage-validator",
    type: "REST validation",
    name: "Coverage Validator",
    endpoint: "https://validator.example.com/coverage/check",
    events: ["ticket.pre_emit"],
    status: "Sandbox",
    enabled: true
  }
];

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export class IntegrationService {
  async listConnectors(unitId?: string) {
    const persisted = await prisma.integrationConnector.findMany({
      where: unitId ? { OR: [{ unitId }, { unitId: null }] } : undefined,
      orderBy: [{ unitId: "asc" }, { name: "asc" }]
    }).catch(() => []);

    if (persisted.length) {
      return persisted.map((item) => ({
        id: item.id,
        unitId: item.unitId ?? undefined,
        code: item.code,
        name: item.name,
        type: item.type,
        status: item.status,
        endpoint: item.endpoint ?? undefined,
        enabled: item.enabled,
        events: asStringArray(item.events)
      }));
    }

    return (await this.hasPersistedUnits())
      ? []
      : DEFAULT_CONNECTORS.filter((item) => !unitId || !item.unitId || item.unitId === unitId);
  }

  async createConnector(input: {
    unitId?: string | null;
    code: string;
    name: string;
    type: string;
    status?: string;
    endpoint?: string;
    enabled?: boolean;
    events?: string[];
  }) {
    const created = await prisma.integrationConnector.create({
      data: {
        unitId: input.unitId ?? null,
        code: input.code,
        name: input.name,
        type: input.type,
        status: input.status ?? "Draft",
        endpoint: input.endpoint ?? null,
        enabled: input.enabled ?? true,
        events: input.events ?? []
      }
    });

    return {
      id: created.id,
      unitId: created.unitId ?? undefined,
      code: created.code,
      name: created.name,
      type: created.type,
      status: created.status,
      endpoint: created.endpoint ?? undefined,
      enabled: created.enabled,
      events: asStringArray(created.events)
    };
  }

  async updateConnector(
    id: string,
    patch: {
      code?: string;
      name?: string;
      type?: string;
      status?: string;
      endpoint?: string;
      enabled?: boolean;
      events?: string[];
    }
  ) {
    const existing = await prisma.integrationConnector.findUnique({
      where: { id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Conector no encontrado.");
    }

    const updated = await prisma.integrationConnector.update({
      where: { id },
      data: {
        ...(patch.code !== undefined ? { code: patch.code } : {}),
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.type !== undefined ? { type: patch.type } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.endpoint !== undefined ? { endpoint: patch.endpoint || null } : {}),
        ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
        ...(patch.events !== undefined ? { events: patch.events } : {})
      }
    });

    return {
      id: updated.id,
      unitId: updated.unitId ?? undefined,
      code: updated.code,
      name: updated.name,
      type: updated.type,
      status: updated.status,
      endpoint: updated.endpoint ?? undefined,
      enabled: updated.enabled,
      events: asStringArray(updated.events)
    };
  }

  async deleteConnector(id: string) {
    await prisma.integrationConnector.delete({
      where: { id }
    });

    return { success: true, id };
  }

  private async hasPersistedUnits() {
    const count = await prisma.unit.count().catch(() => 0);
    return count > 0;
  }
}
