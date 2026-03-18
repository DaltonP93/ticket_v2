import type { AudioProfile, Department, PanelProfile, ServiceCatalogItem, SupportedLocale, Ticket, TicketCall, TicketType, Unit } from "@ticket-v2/contracts";

export const stats = {
  ticketsToday: 248,
  averageWaitMinutes: 11,
  activeServices: 18,
  integrationsOnline: 6
};

export const serviceItems: ServiceCatalogItem[] = [
  { id: "srv_caja", code: "CAJA", name: "Caja general", departmentId: "dep_cajas", allowPriority: true },
  { id: "srv_laboratorio", code: "LAB", name: "Laboratorio", departmentId: "dep_estudios", allowPriority: true },
  { id: "srv_consultas", code: "CON", name: "Consultas medicas", departmentId: "dep_consultas", allowPriority: false }
];

export const unitItems: Unit[] = [
  { id: "unit_samap", code: "SAMAP", name: "Unidad Central", brandName: "SAMAP", locale: "es" },
  { id: "unit_sucursal", code: "SAMAP-SUR", name: "Sucursal Sur", brandName: "SAMAP", locale: "es" }
];

export const departments: Department[] = [
  { id: "dep_cajas", name: "Cajas" },
  { id: "dep_estudios", name: "Estudios" },
  { id: "dep_consultas", name: "Consultas" }
];

export const ticketTypeItems: TicketType[] = [
  {
    id: "tt_normal",
    code: "NORMAL",
    name: "Normal",
    description: "Atencion estandar",
    prefix: "N",
    color: "#173b6c",
    textColor: "#ffffff",
    icon: "ticket",
    baseWeight: 0,
    requireClient: false,
    requireDocument: false,
    requireExternalValidation: false,
    allowPrint: true,
    allowPanel: true
  },
  {
    id: "tt_priority",
    code: "PRIORITY",
    name: "Prioridad",
    description: "Atencion preferente",
    prefix: "P",
    color: "#b42318",
    textColor: "#ffffff",
    icon: "shield",
    baseWeight: 10,
    requireClient: false,
    requireDocument: false,
    requireExternalValidation: false,
    allowPrint: true,
    allowPanel: true
  },
  {
    id: "tt_schedule",
    code: "SCHEDULED",
    name: "Agendado",
    description: "Turno con cita previa",
    prefix: "A",
    color: "#147d64",
    textColor: "#ffffff",
    icon: "calendar",
    baseWeight: 5,
    requireClient: true,
    requireDocument: true,
    requireExternalValidation: false,
    allowPrint: true,
    allowPanel: true
  }
];

export const panelProfile: PanelProfile = {
  id: "pp_default",
  name: "Panel institucional",
  layout: "calls-media",
  locale: "es",
  theme: {
    background: "#07111f",
    accent: "#35b7ff",
    text: "#eef7ff"
  }
};

export const recentTickets: Ticket[] = [
  {
    id: "tk_001",
    sequence: "N-148",
    status: "waiting",
    serviceId: "srv_caja",
    unitId: "unit_samap",
    ticketTypeId: "tt_normal",
    metadata: {},
    createdAt: new Date().toISOString()
  },
  {
    id: "tk_002",
    sequence: "P-032",
    status: "called",
    serviceId: "srv_laboratorio",
    unitId: "unit_samap",
    ticketTypeId: "tt_priority",
    metadata: { box: "Lab 3" },
    createdAt: new Date().toISOString()
  }
];

export const connectors = [
  { id: "int_1", name: "HIS Connector", type: "REST outbound", status: "Online" },
  { id: "int_2", name: "CRM Webhook", type: "Webhook", status: "Online" },
  { id: "int_3", name: "Coverage Validator", type: "REST validation", status: "Sandbox" }
];

export const profileItems = [
  { id: "pf_superadmin", name: "Superadmin", scope: "Global" },
  { id: "pf_admin_unit", name: "Admin de unidad", scope: "Unidad" },
  { id: "pf_triage", name: "Operador de triage", scope: "Operacion" },
  { id: "pf_monitor", name: "Monitor de panel", scope: "Pantalla" }
];

export const adminUsers = [
  { id: "usr_1", name: "Dalton Perez", email: "admin@saa.com.py", profile: "Superadmin" },
  { id: "usr_2", name: "Ana Gomez", email: "triage@saa.com.py", profile: "Operador de triage" },
  { id: "usr_3", name: "Luis Ferreira", email: "panel@saa.com.py", profile: "Monitor de panel" }
];

export const printTemplates = [
  { id: "tpl_default", name: "Ticket institucional", scope: "Default", unit: "Unidad Central" },
  { id: "tpl_lab", name: "Ticket laboratorio", scope: "Servicio", unit: "Unidad Central" },
  { id: "tpl_priority", name: "Ticket preferencial", scope: "Tipo de ticket", unit: "Sucursal Sur" }
];

export const audioProfiles: Record<SupportedLocale, AudioProfile> = {
  es: {
    enabled: true,
    locale: "es",
    voiceName: "Microsoft Sabina Desktop",
    volume: 1,
    rate: 0.92,
    pitch: 1,
    template: "Ticket {sequence}, dirigirse a {counter}, servicio {serviceName}.",
    repeat: 2
  },
  en: {
    enabled: true,
    locale: "en",
    voiceName: "Microsoft Zira Desktop",
    volume: 1,
    rate: 0.94,
    pitch: 1,
    template: "Ticket {sequence}, please go to {counter}, service {serviceName}.",
    repeat: 2
  },
  pt: {
    enabled: true,
    locale: "pt",
    voiceName: "Microsoft Maria Desktop",
    volume: 1,
    rate: 0.94,
    pitch: 1,
    template: "Senha {sequence}, dirigir-se ao {counter}, servico {serviceName}.",
    repeat: 2
  }
};

export const currentCalls: TicketCall[] = [
  {
    ticketId: "tk_002",
    sequence: "P-032",
    counter: "Box 3",
    serviceName: "Laboratorio",
    ticketTypeName: "Prioridad",
    locale: "es",
    announcementText: "Ticket P-032, dirigirse a Box 3, servicio Laboratorio."
  }
];
