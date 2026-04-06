import type {
  AudioProfile,
  Department,
  Desk,
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

export const units: Unit[] = [
  {
    id: "unit_samap",
    code: "SAMAP",
    name: "Unidad Local",
    brandName: "SAMAP",
    locale: "es",
    logoUrl: "https://ticket.saa.com.py/logo-samap.png"
  }
];

export const departments: Department[] = [
  { id: "dep_cajas", name: "Cajas" },
  { id: "dep_estudios", name: "Estudios" },
  { id: "dep_consultas", name: "Consultas" }
];

export const services: ServiceCatalogItem[] = [
  {
    id: "srv_caja",
    unitId: "unit_samap",
    code: "CAJA",
    name: "Caja general",
    departmentId: "dep_cajas",
    allowPriority: true,
    ticketTypeIds: ["tt_normal", "tt_priority"]
  },
  {
    id: "srv_laboratorio",
    unitId: "unit_samap",
    code: "LAB",
    name: "Laboratorio",
    departmentId: "dep_estudios",
    allowPriority: true,
    ticketTypeIds: ["tt_normal", "tt_priority", "tt_schedule"]
  },
  {
    id: "srv_consultas",
    unitId: "unit_samap",
    code: "CON",
    name: "Consultas medicas",
    departmentId: "dep_consultas",
    allowPriority: false,
    ticketTypeIds: ["tt_normal", "tt_schedule"]
  }
];

export const locations: Location[] = [
  {
    id: "loc_caja_1",
    unitId: "unit_samap",
    code: "CAJA_1",
    name: "Caja 1"
  },
  {
    id: "loc_box_3",
    unitId: "unit_samap",
    code: "BOX_3",
    name: "Box 3"
  },
  {
    id: "loc_box_4",
    unitId: "unit_samap",
    code: "BOX_4",
    name: "Box 4"
  }
];

export const desks: Desk[] = [
  {
    id: "desk_caja_1",
    unitId: "unit_samap",
    locationId: "loc_caja_1",
    name: "Caja 1",
    operatorName: "Administrador General",
    serviceIds: ["srv_caja"]
  },
  {
    id: "desk_box3",
    unitId: "unit_samap",
    locationId: "loc_box_3",
    name: "Box 3",
    operatorName: "Laboratorio",
    serviceIds: ["srv_laboratorio"]
  },
  {
    id: "desk_box4",
    unitId: "unit_samap",
    locationId: "loc_box_4",
    name: "Box 4",
    operatorName: "Consultas",
    serviceIds: ["srv_consultas", "srv_laboratorio"]
  }
];

export const ticketTypes: TicketType[] = [
  {
    id: "tt_normal",
    unitId: "unit_samap",
    code: "NORMAL",
    name: "Normal",
    description: "Atencion estandar",
    prefix: "N",
    color: "#13315c",
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
    unitId: "unit_samap",
    code: "PRIORITY",
    name: "Prioridad",
    description: "Atencion preferente",
    prefix: "P",
    color: "#c1121f",
    textColor: "#ffffff",
    icon: "shield",
    baseWeight: 10,
    requireClient: false,
    requireDocument: false,
    requireExternalValidation: false,
    allowPrint: true,
    allowPanel: true,
    triageMessage: "Usar solo cuando corresponda por protocolo."
  },
  {
    id: "tt_schedule",
    unitId: "unit_samap",
    code: "SCHEDULED",
    name: "Agendado",
    description: "Turno con cita previa",
    prefix: "A",
    color: "#2a9d8f",
    textColor: "#ffffff",
    icon: "calendar",
    baseWeight: 5,
    requireClient: true,
    requireDocument: true,
    requireExternalValidation: false,
    allowPrint: true,
    allowPanel: true
  },
  {
    id: "tt_laboratorio_normal",
    unitId: "unit_laboratorio",
    code: "LAB_NORMAL",
    name: "Normal",
    description: "Atencion laboratorio",
    prefix: "L",
    color: "#13315c",
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
    id: "tt_laboratorio_priority",
    unitId: "unit_laboratorio",
    code: "LAB_PRIORITY",
    name: "Prioridad",
    description: "Atencion preferente laboratorio",
    prefix: "LP",
    color: "#c1121f",
    textColor: "#ffffff",
    icon: "shield",
    baseWeight: 10,
    requireClient: false,
    requireDocument: false,
    requireExternalValidation: false,
    allowPrint: true,
    allowPanel: true
  }
];

export const panelProfiles: PanelProfile[] = [
  {
    id: "pp_default",
    name: "Panel institucional",
    layout: "calls-media",
    locale: "es",
    theme: {
      background: "#0b132b",
      accent: "#29b6f6",
      text: "#f8fafc"
    }
  }
];

export const unitSettings: UnitSettings[] = [
  {
    unitId: "unit_samap",
    printHeader: "SAMAP Medicina Prepaga",
    printFooter: "Presente su documento y aguarde el llamado en pantalla.",
    printShowDate: true,
    printShowTicketType: true,
    printShowUnitName: true,
    printShowServiceName: true,
    printTemplateId: "tpl_default",
    triageServiceIds: ["srv_caja", "srv_laboratorio", "srv_consultas"],
    panelShowHistory: true,
    panelShowClock: true,
    panelPrimaryMediaId: "media_001",
    panelProfileId: "pp_default",
    panelPlaylistId: "playlist_samap",
    panelBrandingText: "Sistema de Ticket V2",
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
      visibleServiceIds: ["srv_caja", "srv_laboratorio", "srv_consultas"],
      visibleDepartmentIds: ["dep_cajas", "dep_estudios", "dep_consultas"],
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
      visibleServiceIds: ["srv_caja", "srv_laboratorio", "srv_consultas"],
      visibleDepartmentIds: ["dep_cajas", "dep_estudios", "dep_consultas"]
    }
  }
];

export const printTemplates = [
  {
    id: "tpl_default",
    name: "Ticket institucional",
    scope: "Unidad",
    unit: "Unidad Local",
    header: "SAMAP Medicina Prepaga",
    footer: "Presente su documento y aguarde el llamado en pantalla.",
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
    unitId: "unit_samap",
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
  }
];

export const tickets: Ticket[] = [
  {
    id: "tk_001",
    sequence: "N-001",
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
    status: "in_service",
    serviceId: "srv_laboratorio",
    unitId: "unit_samap",
    ticketTypeId: "tt_priority",
    metadata: {
      serviceName: "Laboratorio",
      ticketTypeName: "Prioridad"
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: "tk_003",
    sequence: "N-109",
    status: "waiting",
    serviceId: "srv_consultas",
    unitId: "unit_samap",
    ticketTypeId: "tt_normal",
    metadata: {
      serviceName: "Consultas medicas",
      ticketTypeName: "Normal"
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  }
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
    deskId: "desk_box3",
    deskName: "Box 3",
    sequence: "P-032",
    counter: "Box 3",
    serviceName: "Laboratorio",
    ticketTypeName: "Prioridad",
    locale: "es",
    announcementText: "Ticket P-032, dirigirse a Box 3, servicio Laboratorio.",
    calledAt: new Date().toISOString()
  }
];
