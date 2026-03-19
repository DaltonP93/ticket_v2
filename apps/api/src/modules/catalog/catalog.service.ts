import { departments, desks, locations, services, ticketTypes, units } from "../../data/mock-db.js";

export class CatalogService {
  listUnits() {
    return units;
  }

  listDepartments() {
    return departments;
  }

  listServices() {
    return services;
  }

  listTicketTypes() {
    return ticketTypes;
  }

  listLocations(unitId?: string) {
    return unitId ? locations.filter((item) => item.unitId === unitId) : locations;
  }

  listDesks(unitId?: string) {
    return unitId ? desks.filter((item) => item.unitId === unitId) : desks;
  }
}
