import { departments, services, units } from "../../data/mock-db.js";

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
}

