export type Identifier = string;
export type SupportedLocale = "es" | "en" | "pt";

export interface Unit {
  id: Identifier;
  code: string;
  name: string;
  brandName: string;
  locale: SupportedLocale;
  logoUrl?: string;
}

export interface Department {
  id: Identifier;
  name: string;
}

export interface ServiceCatalogItem {
  id: Identifier;
  unitId: Identifier;
  code: string;
  name: string;
  departmentId: Identifier;
  allowPriority: boolean;
  ticketTypeIds?: Identifier[];
}

export interface Location {
  id: Identifier;
  unitId: Identifier;
  code: string;
  name: string;
}

export interface Desk {
  id: Identifier;
  unitId: Identifier;
  locationId: Identifier;
  name: string;
  operatorName: string;
  serviceIds: Identifier[];
}

export interface TicketType {
  id: Identifier;
  unitId?: Identifier;
  code: string;
  name: string;
  description: string;
  prefix?: string;
  color: string;
  textColor: string;
  icon?: string;
  baseWeight: number;
  requireClient: boolean;
  requireDocument: boolean;
  requireExternalValidation: boolean;
  allowPrint: boolean;
  allowPanel: boolean;
  triageMessage?: string;
}

export interface Ticket {
  id: Identifier;
  sequence: string;
  status: "waiting" | "called" | "in_service" | "finished" | "redirected";
  serviceId: Identifier;
  unitId: Identifier;
  ticketTypeId: Identifier;
  clientName?: string;
  clientDocument?: string;
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface UnitSettings {
  unitId: Identifier;
  printHeader: string;
  printFooter: string;
  printShowDate: boolean;
  printShowTicketType: boolean;
  printShowUnitName: boolean;
  printShowServiceName: boolean;
  printTemplateId?: Identifier;
  triageServiceIds: Identifier[];
  panelShowHistory: boolean;
  panelShowClock: boolean;
  panelPrimaryMediaId?: Identifier;
  panelProfileId?: Identifier;
  panelPlaylistId?: Identifier;
  panelBrandingText?: string;
  webhooks: {
    preTicket: string;
    postTicket: string;
    onPrint: string;
  };
  panelRuntime?: {
    serverUrl: string;
    username: string;
    password: string;
    clientId: string;
    clientSecret: string;
    retries: number;
    locale: SupportedLocale;
    visibleServiceIds: Identifier[];
    visibleDepartmentIds: Identifier[];
    speechEnabled: boolean;
    alertSound: string;
    showMedia: boolean;
    showHistory: boolean;
    showClock: boolean;
  };
  triageRuntime?: {
    serverUrl: string;
    username: string;
    password: string;
    clientId: string;
    clientSecret: string;
    locale: SupportedLocale;
    columns: number;
    scale: number;
    waitTimeSeconds: number;
    printEnabled: boolean;
    showTitle: boolean;
    showSubtitle: boolean;
    lockMenu: boolean;
    groupByDepartment: boolean;
    visibleServiceIds: Identifier[];
    visibleDepartmentIds: Identifier[];
  };
}

export interface PanelProfile {
  id: Identifier;
  name: string;
  layout: "calls-only" | "calls-history" | "calls-media";
  locale?: SupportedLocale;
  theme: {
    background: string;
    accent: string;
    text: string;
  };
}

export interface PrintTemplate {
  id: Identifier;
  name: string;
  scope: string;
  unit: string;
  header: string;
  footer: string;
  html: string;
}

export interface MediaAsset {
  id: Identifier;
  unitId?: Identifier;
  title: string;
  kind: string;
  url: string;
  durationSeconds: number;
}

export interface PanelPlaylistItem {
  id: Identifier;
  assetId: Identifier;
  title: string;
  kind: string;
  url: string;
  durationSeconds: number;
  position: number;
}

export interface PanelPlaylist {
  id: Identifier;
  unitId?: Identifier;
  name: string;
  active: boolean;
  items: PanelPlaylistItem[];
}

export interface IntegrationConnector {
  id: Identifier;
  unitId?: Identifier;
  code: string;
  name: string;
  type: string;
  status: string;
  endpoint?: string;
  enabled: boolean;
  events: string[];
}

export interface AudioProfile {
  enabled: boolean;
  locale: SupportedLocale;
  voiceName?: string;
  volume: number;
  rate: number;
  pitch: number;
  template: string;
  repeat: number;
}

export interface TicketCall {
  ticketId: Identifier;
  deskId: Identifier;
  deskName: string;
  sequence: string;
  counter: string;
  serviceName: string;
  ticketTypeName: string;
  locale: SupportedLocale;
  announcementText: string;
  calledAt: string;
}
