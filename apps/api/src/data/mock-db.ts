import type {
  AudioProfile,
  Department,
  PanelProfile,
  ServiceCatalogItem,
  SupportedLocale,
  Ticket,
  TicketCall,
  TicketType,
  Unit
} from "@ticket-v2/contracts";

export const units: Unit[] = [
  {
    id: "unit_samap",
    code: "SAMAP",
    name: "Unidad Local",
    brandName: "SAMAP",
    locale: "es"
  }
];

export const departments: Department[] = [
  { id: "dep_cajas", name: "Cajas" },
  { id: "dep_estudios", name: "Estudios" },
  { id: "dep_consultas", name: "Consultas" }
];

export const services: ServiceCatalogItem[] = [
  { id: "srv_caja", code: "CAJA", name: "Caja general", departmentId: "dep_cajas", allowPriority: true },
  { id: "srv_laboratorio", code: "LAB", name: "Laboratorio", departmentId: "dep_estudios", allowPriority: true },
  { id: "srv_consultas", code: "CON", name: "Consultas medicas", departmentId: "dep_consultas", allowPriority: false }
];

export const ticketTypes: TicketType[] = [
  {
    id: "tt_normal",
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
    sequence: "P-032",
    counter: "Box 3",
    serviceName: "Laboratorio",
    ticketTypeName: "Prioridad",
    locale: "es",
    announcementText: "Ticket P-032, dirigirse a Box 3, servicio Laboratorio."
  }
];
