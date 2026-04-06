import type {
  AudioProfile,
  Department,
  Desk,
  IntegrationConnector,
  Location,
  MediaAsset,
  PanelPlaylist,
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
    unitId: "unit_samap",
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
    unitId: "unit_samap",
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
    unitId: "unit_samap",
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
  },
  {
    id: "tt_lab_normal",
    unitId: "unit_laboratorio",
    code: "LAB_NORMAL",
    name: "Normal",
    description: "Atencion de laboratorio",
    prefix: "L",
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
    id: "tt_lab_priority",
    unitId: "unit_laboratorio",
    code: "LAB_PRIORITY",
    name: "Prioridad",
    description: "Prioridad laboratorio",
    prefix: "LP",
    color: "#cf3a11",
    textColor: "#ffffff",
    baseWeight: 10,
    requireClient: false,
    requireDocument: false,
    requireExternalValidation: false,
    allowPrint: true,
    allowPanel: true
  }
];

export const serviceItems: ServiceCatalogItem[] = [
  {
    id: "srv_con_turno",
    unitId: "unit_samap",
    code: "CON",
    name: "Con Turno",
    departmentId: "dep_recepcion",
    allowPriority: true,
    ticketTypeIds: ["tt_normal", "tt_priority"]
  },
  {
    id: "srv_samap_turno",
    unitId: "unit_samap",
    code: "SAM",
    name: "SAMAP con Turno",
    departmentId: "dep_recepcion",
    allowPriority: true,
    ticketTypeIds: ["tt_normal", "tt_priority", "tt_schedule"]
  },
  {
    id: "srv_sin_turno",
    unitId: "unit_samap",
    code: "SIN",
    name: "Sin turno",
    departmentId: "dep_recepcion",
    allowPriority: false,
    ticketTypeIds: ["tt_normal"]
  },
  {
    id: "srv_laboratorio",
    unitId: "unit_laboratorio",
    code: "LAB",
    name: "Laboratorio",
    departmentId: "dep_estudios",
    allowPriority: true,
    ticketTypeIds: ["tt_lab_normal", "tt_lab_priority"]
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
    printTemplateId: "tpl_default",
    triageServiceIds: ["srv_con_turno", "srv_samap_turno", "srv_sin_turno"],
    panelShowHistory: true,
    panelShowClock: true,
    panelPrimaryMediaId: "media_001",
    panelProfileId: "pp_default",
    panelPlaylistId: "playlist_samap",
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
    printTemplateId: "tpl_lab",
    triageServiceIds: ["srv_laboratorio"],
    panelShowHistory: true,
    panelShowClock: true,
    panelPrimaryMediaId: "media_002",
    panelProfileId: "pp_default",
    panelPlaylistId: "playlist_lab",
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

export const panelProfiles: PanelProfile[] = [panelProfile];

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

export const mediaAssets: MediaAsset[] = [
  {
    id: "media_001",
    unitId: "unit_samap",
    title: "Video institucional principal",
    kind: "video",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    durationSeconds: 20
  },
  {
    id: "media_002",
    unitId: "unit_samap",
    title: "Chequeo preventivo",
    kind: "image",
    url: "https://placehold.co/1200x675?text=Chequeo+preventivo",
    durationSeconds: 12
  },
  {
    id: "media_003",
    unitId: "unit_laboratorio",
    title: "Promocion laboratorio",
    kind: "image",
    url: "https://placehold.co/1200x675?text=Promocion+Laboratorio",
    durationSeconds: 12
  }
];

export const panelPlaylists: PanelPlaylist[] = [
  {
    id: "playlist_samap",
    unitId: "unit_samap",
    name: "Rotacion principal",
    active: true,
    items: [
      {
        id: "playlist_item_001",
        assetId: "media_001",
        title: "Video institucional principal",
        kind: "video",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        durationSeconds: 20,
        position: 1
      },
      {
        id: "playlist_item_002",
        assetId: "media_002",
        title: "Chequeo preventivo",
        kind: "image",
        url: "https://placehold.co/1200x675?text=Chequeo+preventivo",
        durationSeconds: 12,
        position: 2
      }
    ]
  },
  {
    id: "playlist_lab",
    unitId: "unit_laboratorio",
    name: "Rotacion laboratorio",
    active: true,
    items: [
      {
        id: "playlist_item_003",
        assetId: "media_003",
        title: "Promocion laboratorio",
        kind: "image",
        url: "https://placehold.co/1200x675?text=Promocion+Laboratorio",
        durationSeconds: 12,
        position: 1
      },
      {
        id: "playlist_item_004",
        assetId: "media_002",
        title: "Chequeo preventivo",
        kind: "image",
        url: "https://placehold.co/1200x675?text=Chequeo+preventivo",
        durationSeconds: 12,
        position: 2
      }
    ]
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

export const connectors: IntegrationConnector[] = [
  {
    id: "int_1",
    unitId: "unit_samap",
    code: "his-rest",
    name: "HIS Connector",
    type: "REST outbound",
    status: "Online",
    endpoint: "https://his.example.com/api/tickets",
    enabled: true,
    events: ["ticket.emitted", "ticket.called", "attendance.finished"]
  },
  {
    id: "int_2",
    unitId: "unit_samap",
    code: "crm-webhook",
    name: "CRM Webhook",
    type: "Webhook",
    status: "Online",
    endpoint: "https://crm.example.com/hooks/tickets",
    enabled: true,
    events: ["ticket.pre_emit", "ticket.emitted"]
  },
  {
    id: "int_3",
    unitId: "unit_laboratorio",
    code: "coverage-validator",
    name: "Coverage Validator",
    type: "REST validation",
    status: "Sandbox",
    endpoint: "https://validator.example.com/coverage/check",
    enabled: true,
    events: ["ticket.pre_emit"]
  }
];

export const profileItems = [
  {
    id: "pf_superadmin",
    code: "SUPERADMIN",
    name: "Superadmin",
    scope: "Global",
    permissions: ["overview", "catalog", "settings", "users", "attendance", "media", "print", "panel", "integrations", "triage"]
  },
  {
    id: "pf_admin_unit",
    code: "UNIT_ADMIN",
    name: "Admin de unidad",
    scope: "Unidad",
    permissions: ["overview", "catalog", "settings", "users", "attendance", "media", "print", "panel", "integrations", "triage"]
  },
  {
    id: "pf_triage",
    code: "TRIAGE",
    name: "Operador de triage",
    scope: "Operacion",
    permissions: ["triage"]
  },
  {
    id: "pf_attendance",
    code: "ATTENDANCE",
    name: "Atencion",
    scope: "Puesto",
    permissions: ["attendance"]
  }
];

export const adminUsers = [
  { id: "usr_1", name: "Administrador General", email: "admin@saa.com.py", profile: "Superadmin", profileCode: "SUPERADMIN", unitId: "unit_samap" },
  { id: "usr_2", name: "Andrea Planas", email: "andrea@saa.com.py", profile: "Atencion", profileCode: "ATTENDANCE", unitId: "unit_samap" },
  { id: "usr_3", name: "Luis Ferreira", email: "luis@saa.com.py", profile: "Atencion", profileCode: "ATTENDANCE", unitId: "unit_laboratorio" }
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
