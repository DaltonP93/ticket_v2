import type { Department, Desk, Location, ServiceCatalogItem, TicketType, Unit } from "@ticket-v2/contracts";
import { prisma } from "../../lib/prisma.js";
import {
  departments as fallbackDepartments,
  desks as fallbackDesks,
  locations as fallbackLocations,
  services as fallbackServices,
  ticketTypes as fallbackTicketTypes,
  units as fallbackUnits
} from "../../data/mock-db.js";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export class CatalogService {
  async listUnits() {
    const persisted = await prisma.unit.findMany().catch(() => []);
    const normalized: Unit[] = persisted.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      brandName: item.brandName,
      locale: (item.locale as Unit["locale"]) ?? "es",
      logoUrl: item.logoUrl ?? undefined
    }));

    if (persisted.length) {
      return normalized;
    }

    return (await this.hasPersistedUnits()) ? [] : fallbackUnits;
  }

  async createUnit(input: Pick<Unit, "name" | "code" | "brandName" | "locale" | "logoUrl">) {
    const created = await prisma.unit.create({
      data: {
        code: input.code,
        name: input.name,
        brandName: input.brandName,
        locale: input.locale,
        logoUrl: input.logoUrl ?? null
      }
    });

    return {
      id: created.id,
      code: created.code,
      name: created.name,
      brandName: created.brandName,
      locale: (created.locale as Unit["locale"]) ?? "es",
      logoUrl: created.logoUrl ?? undefined
    } satisfies Unit;
  }

  async updateUnit(id: string, input: Partial<Pick<Unit, "name" | "code" | "brandName" | "locale" | "logoUrl">>) {
    const existing = await prisma.unit.findUnique({
      where: { id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Unidad no encontrada.");
    }

    const updated = await prisma.unit.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.brandName !== undefined ? { brandName: input.brandName } : {}),
        ...(input.locale !== undefined ? { locale: input.locale } : {}),
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl || null } : {})
      }
    });

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      brandName: updated.brandName,
      locale: (updated.locale as Unit["locale"]) ?? "es",
      logoUrl: updated.logoUrl ?? undefined
    } satisfies Unit;
  }

  async deleteUnit(id: string) {
    const existing = await prisma.unit.findUnique({
      where: { id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Unidad no encontrada.");
    }

    const unitDesks = await prisma.desk.findMany({
      where: { unitId: id },
      select: { id: true }
    }).catch(() => []);
    const deskIds = unitDesks.map((item) => item.id);

    const [
      serviceCount,
      locationCount,
      deskCount,
      ticketTypeCount,
      userCount,
      unitSettingsCount,
      mediaCount,
      playlistCount,
      printTemplateCount,
      connectorCount,
      ticketRecordCount,
      ticketCallLogCount
    ] = await Promise.all([
      prisma.service.count({ where: { unitId: id } }).catch(() => 0),
      prisma.location.count({ where: { unitId: id } }).catch(() => 0),
      prisma.desk.count({ where: { unitId: id } }).catch(() => 0),
      prisma.ticketType.count({ where: { unitId: id } }).catch(() => 0),
      prisma.adminUser.count({ where: { unitId: id } }).catch(() => 0),
      prisma.unitSetting.count({ where: { unitId: id } }).catch(() => 0),
      prisma.mediaAsset.count({ where: { unitId: id } }).catch(() => 0),
      prisma.panelPlaylist.count({ where: { unitId: id } }).catch(() => 0),
      prisma.printTemplate.count({ where: { unitId: id } }).catch(() => 0),
      prisma.integrationConnector.count({ where: { unitId: id } }).catch(() => 0),
      prisma.ticketRecord.count({ where: { unitId: id } }).catch(() => 0),
      deskIds.length
        ? prisma.ticketCallLog.count({ where: { deskId: { in: deskIds } } }).catch(() => 0)
        : Promise.resolve(0)
    ]);

    if (
      serviceCount ||
      locationCount ||
      deskCount ||
      ticketTypeCount ||
      userCount ||
      unitSettingsCount ||
      mediaCount ||
      playlistCount ||
      printTemplateCount ||
      connectorCount ||
      ticketRecordCount ||
      ticketCallLogCount
    ) {
      throw new Error("No se puede eliminar la unidad porque todavia tiene datos operativos asociados.");
    }

    await prisma.unit.delete({
      where: { id }
    });

    return { success: true, id };
  }

  async listDepartments() {
    const persisted = await prisma.department.findMany().catch(() => []);
    const normalized: Department[] = persisted.map((item) => ({
      id: item.id,
      name: item.name
    }));

    if (persisted.length) {
      return normalized;
    }

    return (await this.hasPersistedUnits()) ? [] : fallbackDepartments;
  }

  async createDepartment(name: string) {
    const created = await prisma.department.create({
      data: {
        name
      }
    });

    return {
      id: created.id,
      name: created.name
    } satisfies Department;
  }

  async updateDepartment(id: string, name: string) {
    const existing = await prisma.department.findUnique({
      where: { id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Departamento no encontrado.");
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name
      }
    });

    return {
      id: updated.id,
      name: updated.name
    } satisfies Department;
  }

  async deleteDepartment(id: string) {
    const serviceCount = await prisma.service.count({
      where: { departmentId: id }
    }).catch(() => 0);

    if (serviceCount > 0) {
      throw new Error("No se puede eliminar el departamento porque tiene servicios asociados.");
    }

    await prisma.department.delete({
      where: { id }
    });

    return { success: true, id };
  }

  async listServices(unitId?: string) {
    const persisted = await prisma.service.findMany({
      where: unitId ? { unitId } : undefined
    }).catch(() => []);
    const normalized: ServiceCatalogItem[] = persisted.map((item) => ({
      id: item.id,
      unitId: item.unitId,
      code: item.code,
      name: item.name,
      departmentId: item.departmentId,
      allowPriority: item.allowPriority,
      ticketTypeIds: asStringArray(item.ticketTypeIds)
    }));

    if (persisted.length) {
      return normalized;
    }

    const fallback = unitId ? fallbackServices.filter((item) => item.unitId === unitId) : fallbackServices;
    return (await this.hasPersistedUnits()) ? [] : fallback;
  }

  async createService(input: Pick<ServiceCatalogItem, "unitId" | "name" | "code" | "departmentId" | "allowPriority" | "ticketTypeIds">) {
    const units = await this.listUnits();
    const departments = await this.listDepartments();
    const ticketTypes = await this.listTicketTypes(input.unitId);

    if (!units.some((item) => item.id === input.unitId)) {
      throw new Error("Unidad invalida.");
    }

    if (!departments.some((item) => item.id === input.departmentId)) {
      throw new Error("Departamento invalido.");
    }

    const allowedTicketTypeIds = new Set(ticketTypes.map((item) => item.id));
    if ((input.ticketTypeIds ?? []).some((item) => !allowedTicketTypeIds.has(item))) {
      throw new Error("Uno o mas tipos de ticket no pertenecen a la unidad del servicio.");
    }

    const created = await prisma.service.create({
      data: {
        unitId: input.unitId,
        code: input.code,
        name: input.name,
        departmentId: input.departmentId,
        allowPriority: input.allowPriority,
        ticketTypeIds: input.ticketTypeIds ?? []
      }
    });

    return {
      id: created.id,
      unitId: created.unitId,
      code: created.code,
      name: created.name,
      departmentId: created.departmentId,
      allowPriority: created.allowPriority,
      ticketTypeIds: asStringArray(created.ticketTypeIds)
    } satisfies ServiceCatalogItem;
  }

  async updateService(id: string, input: Partial<Pick<ServiceCatalogItem, "name" | "code" | "departmentId" | "allowPriority" | "ticketTypeIds">>) {
    const existing = await prisma.service.findUnique({
      where: { id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Servicio no encontrado.");
    }

    const departments = await this.listDepartments();
    const ticketTypes = await this.listTicketTypes(existing.unitId);

    if (input.departmentId && !departments.some((item) => item.id === input.departmentId)) {
      throw new Error("Departamento invalido.");
    }

    if (input.ticketTypeIds) {
      const allowedTicketTypeIds = new Set(ticketTypes.map((item) => item.id));
      if (input.ticketTypeIds.some((item) => !allowedTicketTypeIds.has(item))) {
        throw new Error("Uno o mas tipos de ticket no pertenecen a la unidad del servicio.");
      }
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
        ...(input.allowPriority !== undefined ? { allowPriority: input.allowPriority } : {}),
        ...(input.ticketTypeIds !== undefined ? { ticketTypeIds: input.ticketTypeIds } : {})
      }
    });

    return {
      id: updated.id,
      unitId: updated.unitId,
      code: updated.code,
      name: updated.name,
      departmentId: updated.departmentId,
      allowPriority: updated.allowPriority,
      ticketTypeIds: asStringArray(updated.ticketTypeIds)
    } satisfies ServiceCatalogItem;
  }

  async deleteService(id: string) {
    const existing = await prisma.service.findUnique({
      where: { id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Servicio no encontrado.");
    }

    const desksUsingService = await prisma.desk.findMany().catch(() => []);
    if (desksUsingService.some((desk) => asStringArray(desk.serviceIds).includes(id))) {
      throw new Error("No se puede eliminar el servicio porque hay puestos que lo usan.");
    }

    const ticketRecordCount = await prisma.ticketRecord.count({
      where: { serviceId: id }
    }).catch(() => 0);

    if (ticketRecordCount > 0) {
      throw new Error("No se puede eliminar el servicio porque ya tiene tickets emitidos.");
    }

    const unitSetting = await prisma.unitSetting.findUnique({
      where: { unitId: existing.unitId }
    }).catch(() => null);

    if (unitSetting) {
      const triageServiceIds = asStringArray(unitSetting.triageServiceIds).filter((item) => item !== id);
      const panelRuntime = unitSetting.panelRuntime && typeof unitSetting.panelRuntime === "object"
        ? {
            ...(unitSetting.panelRuntime as Record<string, unknown>),
            visibleServiceIds: asStringArray((unitSetting.panelRuntime as Record<string, unknown>).visibleServiceIds).filter((item) => item !== id)
          }
        : unitSetting.panelRuntime;
      const triageRuntime = unitSetting.triageRuntime && typeof unitSetting.triageRuntime === "object"
        ? {
            ...(unitSetting.triageRuntime as Record<string, unknown>),
            visibleServiceIds: asStringArray((unitSetting.triageRuntime as Record<string, unknown>).visibleServiceIds).filter((item) => item !== id)
          }
        : unitSetting.triageRuntime;

      await prisma.unitSetting.update({
        where: { unitId: existing.unitId },
        data: {
          triageServiceIds,
          panelRuntime,
          triageRuntime
        }
      }).catch(() => null);
    }

    await prisma.service.delete({
      where: { id }
    });

    return { success: true, id };
  }

  async listTicketTypes(unitId?: string) {
    const persisted = await prisma.ticketType.findMany({
      where: unitId ? { unitId } : undefined
    }).catch(() => []);
    const normalized: TicketType[] = persisted.map((item) => ({
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

    if (persisted.length) {
      return normalized;
    }

    const fallback = unitId ? fallbackTicketTypes.filter((item) => !item.unitId || item.unitId === unitId) : fallbackTicketTypes;
    return (await this.hasPersistedUnits()) ? [] : fallback;
  }

  async createTicketType(input: Pick<TicketType, "unitId" | "code" | "name" | "description" | "prefix" | "color" | "textColor" | "icon" | "baseWeight" | "requireClient" | "requireDocument" | "requireExternalValidation" | "allowPrint" | "allowPanel" | "triageMessage">) {
    const units = await this.listUnits();
    if (!units.some((item) => item.id === input.unitId)) {
      throw new Error("Unidad invalida.");
    }

    const created = await prisma.ticketType.create({
      data: {
        unitId: input.unitId,
        code: input.code,
        name: input.name,
        description: input.description,
        prefix: input.prefix ?? null,
        color: input.color,
        textColor: input.textColor,
        icon: input.icon ?? null,
        baseWeight: input.baseWeight,
        requireClient: input.requireClient,
        requireDocument: input.requireDocument,
        requireExternalValidation: input.requireExternalValidation,
        allowPrint: input.allowPrint,
        allowPanel: input.allowPanel,
        triageMessage: input.triageMessage ?? null
      }
    });

    return {
      id: created.id,
      unitId: created.unitId,
      code: created.code,
      name: created.name,
      description: created.description,
      prefix: created.prefix ?? undefined,
      color: created.color,
      textColor: created.textColor,
      icon: created.icon ?? undefined,
      baseWeight: created.baseWeight,
      requireClient: created.requireClient,
      requireDocument: created.requireDocument,
      requireExternalValidation: created.requireExternalValidation,
      allowPrint: created.allowPrint,
      allowPanel: created.allowPanel,
      triageMessage: created.triageMessage ?? undefined
    } satisfies TicketType;
  }

  async updateTicketType(
    id: string,
    input: Partial<Pick<TicketType, "name" | "code" | "description" | "prefix" | "color" | "textColor" | "icon" | "baseWeight" | "requireClient" | "requireDocument" | "requireExternalValidation" | "allowPrint" | "allowPanel" | "triageMessage">>
  ) {
    const existing = await prisma.ticketType.findUnique({
      where: { id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Tipo de ticket no encontrado.");
    }

    const updated = await prisma.ticketType.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.prefix !== undefined ? { prefix: input.prefix } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.textColor !== undefined ? { textColor: input.textColor } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.baseWeight !== undefined ? { baseWeight: input.baseWeight } : {}),
        ...(input.requireClient !== undefined ? { requireClient: input.requireClient } : {}),
        ...(input.requireDocument !== undefined ? { requireDocument: input.requireDocument } : {}),
        ...(input.requireExternalValidation !== undefined ? { requireExternalValidation: input.requireExternalValidation } : {}),
        ...(input.allowPrint !== undefined ? { allowPrint: input.allowPrint } : {}),
        ...(input.allowPanel !== undefined ? { allowPanel: input.allowPanel } : {}),
        ...(input.triageMessage !== undefined ? { triageMessage: input.triageMessage } : {})
      }
    });

    return {
      id: updated.id,
      unitId: updated.unitId,
      code: updated.code,
      name: updated.name,
      description: updated.description,
      prefix: updated.prefix ?? undefined,
      color: updated.color,
      textColor: updated.textColor,
      icon: updated.icon ?? undefined,
      baseWeight: updated.baseWeight,
      requireClient: updated.requireClient,
      requireDocument: updated.requireDocument,
      requireExternalValidation: updated.requireExternalValidation,
      allowPrint: updated.allowPrint,
      allowPanel: updated.allowPanel,
      triageMessage: updated.triageMessage ?? undefined
    } satisfies TicketType;
  }

  async deleteTicketType(id: string) {
    const existing = await prisma.ticketType.findUnique({
      where: { id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Tipo de ticket no encontrado.");
    }

    const services = await prisma.service.findMany({
      where: { unitId: existing.unitId }
    }).catch(() => []);

    for (const service of services) {
      const currentIds = asStringArray(service.ticketTypeIds);
      if (currentIds.includes(id)) {
        await prisma.service.update({
          where: { id: service.id },
          data: {
            ticketTypeIds: currentIds.filter((item) => item !== id)
          }
        });
      }
    }

    const ticketRecordCount = await prisma.ticketRecord.count({
      where: { ticketTypeId: id }
    }).catch(() => 0);

    if (ticketRecordCount > 0) {
      throw new Error("No se puede eliminar el tipo de ticket porque ya fue utilizado en tickets emitidos.");
    }

    await prisma.ticketType.delete({
      where: { id }
    });

    return { success: true, id };
  }

  async listLocations(unitId?: string) {
    const persisted = await prisma.location.findMany({
      where: unitId ? { unitId } : undefined
    }).catch(() => []);
    const normalized: Location[] = persisted.map((item) => ({
      id: item.id,
      unitId: item.unitId,
      code: item.code,
      name: item.name
    }));

    if (persisted.length) {
      return normalized;
    }

    const fallback = unitId ? fallbackLocations.filter((item) => item.unitId === unitId) : fallbackLocations;
    return (await this.hasPersistedUnits()) ? [] : fallback;
  }

  async createLocation(input: Pick<Location, "unitId" | "code" | "name">) {
    const units = await this.listUnits();
    if (!units.some((item) => item.id === input.unitId)) {
      throw new Error("Unidad invalida.");
    }

    const created = await prisma.location.create({
      data: {
        unitId: input.unitId,
        code: input.code,
        name: input.name
      }
    });

    return {
      id: created.id,
      unitId: created.unitId,
      code: created.code,
      name: created.name
    } satisfies Location;
  }

  async updateLocation(id: string, input: Partial<Pick<Location, "code" | "name">>) {
    const existing = await prisma.location.findUnique({
      where: { id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Local no encontrado.");
    }

    const updated = await prisma.location.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {})
      }
    });

    return {
      id: updated.id,
      unitId: updated.unitId,
      code: updated.code,
      name: updated.name
    } satisfies Location;
  }

  async deleteLocation(id: string) {
    const deskCount = await prisma.desk.count({
      where: { locationId: id }
    }).catch(() => 0);

    if (deskCount > 0) {
      throw new Error("No se puede eliminar el local porque tiene puestos asociados.");
    }

    await prisma.location.delete({
      where: { id }
    });

    return { success: true, id };
  }

  async listDesks(unitId?: string) {
    const persisted = await prisma.desk.findMany({
      where: unitId ? { unitId } : undefined
    }).catch(() => []);
    const normalized: Desk[] = persisted.map((item) => ({
      id: item.id,
      unitId: item.unitId,
      locationId: item.locationId,
      name: item.name,
      operatorName: item.operatorName,
      serviceIds: asStringArray(item.serviceIds)
    }));

    if (persisted.length) {
      return normalized;
    }

    const fallback = unitId ? fallbackDesks.filter((item) => item.unitId === unitId) : fallbackDesks;
    return (await this.hasPersistedUnits()) ? [] : fallback;
  }

  async createDesk(input: Pick<Desk, "unitId" | "locationId" | "name" | "operatorName" | "serviceIds">) {
    const units = await this.listUnits();
    const locations = await this.listLocations(input.unitId);
    const services = await this.listServices(input.unitId);

    if (!units.some((item) => item.id === input.unitId)) {
      throw new Error("Unidad invalida.");
    }

    if (!locations.some((item) => item.id === input.locationId)) {
      throw new Error("Local invalido para la unidad seleccionada.");
    }

    const allowedServiceIds = new Set(services.map((item) => item.id));
    if (input.serviceIds.some((item) => !allowedServiceIds.has(item))) {
      throw new Error("Uno o mas servicios del puesto no pertenecen a la unidad seleccionada.");
    }

    const created = await prisma.desk.create({
      data: {
        unitId: input.unitId,
        locationId: input.locationId,
        name: input.name,
        operatorName: input.operatorName,
        serviceIds: input.serviceIds
      }
    });

    return {
      id: created.id,
      unitId: created.unitId,
      locationId: created.locationId,
      name: created.name,
      operatorName: created.operatorName,
      serviceIds: asStringArray(created.serviceIds)
    } satisfies Desk;
  }

  async updateDesk(
    id: string,
    input: Partial<Pick<Desk, "locationId" | "name" | "operatorName" | "serviceIds">>
  ) {
    const existing = await prisma.desk.findUnique({
      where: { id }
    }).catch(() => null);

    if (!existing) {
      throw new Error("Puesto no encontrado.");
    }

    const locations = await this.listLocations(existing.unitId);
    const services = await this.listServices(existing.unitId);

    if (input.locationId && !locations.some((item) => item.id === input.locationId)) {
      throw new Error("Local invalido para la unidad seleccionada.");
    }

    if (input.serviceIds) {
      const allowedServiceIds = new Set(services.map((item) => item.id));
      if (input.serviceIds.some((item) => !allowedServiceIds.has(item))) {
        throw new Error("Uno o mas servicios del puesto no pertenecen a la unidad seleccionada.");
      }
    }

    const updated = await prisma.desk.update({
      where: { id },
      data: {
        ...(input.locationId !== undefined ? { locationId: input.locationId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.operatorName !== undefined ? { operatorName: input.operatorName } : {}),
        ...(input.serviceIds !== undefined ? { serviceIds: input.serviceIds } : {})
      }
    });

    return {
      id: updated.id,
      unitId: updated.unitId,
      locationId: updated.locationId,
      name: updated.name,
      operatorName: updated.operatorName,
      serviceIds: asStringArray(updated.serviceIds)
    } satisfies Desk;
  }

  async deleteDesk(id: string) {
    const ticketCallLogCount = await prisma.ticketCallLog.count({
      where: { deskId: id }
    }).catch(() => 0);

    if (ticketCallLogCount > 0) {
      throw new Error("No se puede eliminar el puesto porque ya tiene llamados registrados.");
    }

    await prisma.desk.delete({
      where: { id }
    });

    return { success: true, id };
  }

  private async hasPersistedUnits() {
    const count = await prisma.unit.count().catch(() => 0);
    return count > 0;
  }
}
