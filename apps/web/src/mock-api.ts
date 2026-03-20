import type {
  AudioProfile,
  Department,
  Desk,
  Location,
  PanelProfile,
  ServiceCatalogItem,
  SupportedLocale,
  Ticket,
  TicketCall,
  TicketType,
  Unit,
  UnitSettings
} from "@ticket-v2/contracts";

export const stats = {
  ticketsToday: 248,
  averageWaitMinutes: 11,
  activeServices: 18,
  integrationsOnline: 6
};

export const unitItems: Unit[] = [
  {
    id: "unit_samap",
    code: "SAMAP",
    name: "Nueva Torre",
    brandName: "SAMAP",
    locale: "es",
    logoUrl: "https://placehold.co/240x90?text=SAMAP"
  },
  {
    id: "unit_laboratorio",
    code: "LAB",
    name: "Laboratorio",
    brandName: "SAMAP",
    locale: "es",
    logoUrl: "https://placehold.co/240x90?text=SAMAP+LAB"
  }
];

export const departments: Department[] = [
  { id: "dep_recepcion", name: "Recepcion" },
  { id: "dep_estudios", name: "Estudios" },
  { id: "dep_caja", name: "Caja" }
];

export const ticketTypeItems: TicketType[] = [
  {
    id: "tt_normal",
    code: "NORMAL",
    name: "Normal",
    description: "Atencion convencional",
    prefix: "C",
    color: "#1f57b8",
    textColor: "#ffffff",
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
    description: "Atencion preferencial",
    prefix: "P",
    color: "#cf3a11",
    textColor: "#ffffff",
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
    color: "#0e8c74",
    textColor: "#ffffff",
    baseWeight: 5,
    requireClient: true,
    requireDocument: true,
    requireExternalValidation: false,
    allowPrint: true,
    allowPanel: true
  }
];

export const serviceItems: ServiceCatalogItem[] = [
  {
    id: "srv_con_turno",
    code: "CON",
    name: "Con Turno",
    departmentId: "dep_recepcion",
    allowPriority: true,
    ticketTypeIds: ["tt_normal", "tt_priority"]
  },
  {
    id: "srv_samap_turno",
    code: "SAM",
    name: "SAMAP con Turno",
    departmentId: "dep_recepcion",
    allowPriority: true,
    ticketTypeIds: ["tt_normal", "tt_priority", "tt_schedule"]
  },
  {
    id: "srv_sin_turno",
    code: "SIN",
    name: "Sin turno",
    departmentId: "dep_recepcion",
    allowPriority: false,
    ticketTypeIds: ["tt_normal"]
  },
  {
    id: "srv_laboratorio",
    code: "LAB",
    name: "Laboratorio",
    departmentId: "dep_estudios",
    allowPriority: true,
    ticketTypeIds: ["tt_normal", "tt_priority"]
  }
];

export const locationItems: Location[] = [
  { id: "loc_box_1", unitId: "unit_samap", code: "BOX1", name: "Ventanilla 01" },
  { id: "loc_box_2", unitId: "unit_samap", code: "BOX2", name: "Ventanilla 02" },
  { id: "loc_box_3", unitId: "unit_samap", code: "BOX3", name: "Ventanilla 03" },
  { id: "loc_lab_1", unitId: "unit_laboratorio", code: "LAB1", name: "Box Laboratorio" }
];

export const deskItems: Desk[] = [
  {
    id: "desk_admin",
    unitId: "unit_samap",
    locationId: "loc_box_1",
    name: "Box 1",
    operatorName: "Administrador General",
    serviceIds: ["srv_con_turno", "srv_sin_turno"]
  },
  {
    id: "desk_andrea",
    unitId: "unit_samap",
    locationId: "loc_box_2",
    name: "Box 2",
    operatorName: "Andrea Planas",
    serviceIds: ["srv_samap_turno"]
  },
  {
    id: "desk_lab",
    unitId: "unit_laboratorio",
    locationId: "loc_lab_1",
    name: "Box 3",
    operatorName: "Luis Ferreira",
    serviceIds: ["srv_laboratorio"]
  }
];

export const unitSettingsItems: UnitSettings[] = [
  {
    unitId: "unit_samap",
    printHeader: "Sistema de Ticket Sanatorio Adventista",
    printFooter: "Presente su documento y aguarde el llamado en pantalla.",
    printShowDate: true,
    printShowTicketType: true,
    printShowUnitName: true,
    printShowServiceName: true,
    triageServiceIds: ["srv_con_turno", "srv_samap_turno", "srv_sin_turno"],
    panelShowHistory: true,
    panelShowClock: true,
    panelPrimaryMediaId: "media_001",
    panelBrandingText: "Con turno",
    webhooks: {
      preTicket: "",
      postTicket: "",
      onPrint: ""
    },
    panelRuntime: {
      serverUrl: "http://ticket.saa.com.py/api",
      username: "panel",
      password: "",
      clientId: "panel_client",
      clientSecret: "panel_secret",
      retries: 5,
      locale: "es",
      visibleServiceIds: ["srv_con_turno", "srv_samap_turno", "srv_sin_turno"],
      visibleDepartmentIds: ["dep_recepcion", "dep_estudios"],
      speechEnabled: true,
      alertSound: "default",
      showMedia: true,
      showHistory: true,
      showClock: true
    },
    triageRuntime: {
      serverUrl: "http://ticket.saa.com.py/api",
      username: "triage",
      password: "",
      clientId: "triage_client",
      clientSecret: "triage_secret",
      locale: "es",
      columns: 2,
      scale: 100,
      waitTimeSeconds: 10,
      printEnabled: true,
      showTitle: true,
      showSubtitle: true,
      lockMenu: false,
      groupByDepartment: false,
      visibleServiceIds: ["srv_con_turno", "srv_samap_turno", "srv_sin_turno"],
      visibleDepartmentIds: ["dep_recepcion"]
    }
  },
  {
    unitId: "unit_laboratorio",
    printHeader: "Ticket Laboratorio",
    printFooter: "Dirijase al box asignado para la toma de muestra.",
    printShowDate: true,
    printShowTicketType: true,
    printShowUnitName: true,
    printShowServiceName: true,
    triageServiceIds: ["srv_laboratorio"],
    panelShowHistory: true,
    panelShowClock: true,
    panelPrimaryMediaId: "media_002",
    panelBrandingText: "Panel institucional",
    webhooks: {
      preTicket: "",
      postTicket: "",
      onPrint: ""
    },
    panelRuntime: {
      serverUrl: "http://ticket.saa.com.py/api",
      username: "panel_lab",
      password: "",
      clientId: "panel_lab_client",
      clientSecret: "panel_lab_secret",
      retries: 5,
      locale: "es",
      visibleServiceIds: ["srv_laboratorio"],
      visibleDepartmentIds: ["dep_estudios"],
      speechEnabled: true,
      alertSound: "default",
      showMedia: true,
      showHistory: true,
      showClock: true
    },
    triageRuntime: {
      serverUrl: "http://ticket.saa.com.py/api",
      username: "triage_lab",
      password: "",
      clientId: "triage_lab_client",
      clientSecret: "triage_lab_secret",
      locale: "es",
      columns: 1,
      scale: 100,
      waitTimeSeconds: 10,
      printEnabled: true,
      showTitle: true,
      showSubtitle: true,
      lockMenu: false,
      groupByDepartment: false,
      visibleServiceIds: ["srv_laboratorio"],
      visibleDepartmentIds: ["dep_estudios"]
    }
  }
];

export const panelProfile: PanelProfile = {
  id: "pp_default",
  name: "Panel institucional",
  layout: "calls-media",
  locale: "es",
  theme: {
    background: "#0b3f97",
    accent: "#1f66ff",
    text: "#ffffff"
  }
};

export const printTemplates = [
  {
    id: "tpl_default",
    name: "Ticket institucional",
    scope: "Unidad",
    unit: "Nueva Torre",
    header: "Sistema de Ticket Sanatorio Adventista",
    footer: "Presente su documento y aguarde el llamado en pantalla.",
    html: "<div class=\"ticket\"><h1>{{ticket.sequence}}</h1></div>"
  },
  {
    id: "tpl_lab",
    name: "Ticket laboratorio",
    scope: "Servicio",
    unit: "Laboratorio",
    header: "Ticket Laboratorio",
    footer: "Dirijase al box asignado para la toma de muestra.",
    html: "<div class=\"ticket\"><h1>{{ticket.sequence}}</h1></div>"
  }
];

export const mediaAssets = [
  {
    id: "media_001",
    title: "Video institucional principal",
    kind: "video",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    durationSeconds: 20
  },
  {
    id: "media_002",
    title: "Chequeo preventivo",
    kind: "image",
    url: "https://placehold.co/1200x675?text=Chequeo+preventivo",
    durationSeconds: 12
  },
  {
    id: "media_003",
    title: "Promocion laboratorio",
    kind: "image",
    url: "https://placehold.co/1200x675?text=Promocion+Laboratorio",
    durationSeconds: 12
  }
];

export const recentTickets: Ticket[] = [
  {
    id: "tk_001",
    sequence: "C-739",
    status: "waiting",
    serviceId: "srv_con_turno",
    unitId: "unit_samap",
    ticketTypeId: "tt_normal",
    metadata: {
      serviceName: "Con Turno",
      ticketTypeName: "Normal",
      unitName: "Nueva Torre"
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "tk_002",
    sequence: "S-413",
    status: "waiting",
    serviceId: "srv_sin_turno",
    unitId: "unit_samap",
    ticketTypeId: "tt_normal",
    metadata: {
      serviceName: "Sin turno",
      ticketTypeName: "Normal",
      unitName: "Nueva Torre"
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "tk_003",
    sequence: "A-185",
    status: "waiting",
    serviceId: "srv_samap_turno",
    unitId: "unit_samap",
    ticketTypeId: "tt_schedule",
    metadata: {
      serviceName: "SAMAP con Turno",
      ticketTypeName: "Agendado",
      unitName: "Nueva Torre"
    },
    createdAt: new Date().toISOString()
  }
];

export const currentCalls: TicketCall[] = [
  {
    ticketId: "tk_900",
    deskId: "desk_lab",
    deskName: "Box 3",
    sequence: "P-032",
    counter: "Ventanilla 03",
    serviceName: "Laboratorio",
    ticketTypeName: "Prioridad",
    locale: "es",
    announcementText: "Ticket P-032, dirigirse a Ventanilla 03, servicio Laboratorio.",
    calledAt: new Date().toISOString()
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
  { id: "pf_attendance", name: "Atencion", scope: "Puesto" }
];

export const adminUsers = [
  { id: "usr_1", name: "Administrador General", email: "admin@saa.com.py", profile: "Superadmin" },
  { id: "usr_2", name: "Andrea Planas", email: "andrea@saa.com.py", profile: "Atencion" },
  { id: "usr_3", name: "Luis Ferreira", email: "luis@saa.com.py", profile: "Atencion" }
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
