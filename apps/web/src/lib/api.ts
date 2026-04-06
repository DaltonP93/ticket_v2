import type {
  Department,
  Desk,
  IntegrationConnector,
  Location,
  MediaAsset,
  PanelPlaylist,
  PanelProfile,
  PrintTemplate,
  ServiceCatalogItem,
  SupportedLocale,
  Ticket,
  TicketCall,
  TicketType,
  Unit,
  UnitSettings
} from "@ticket-v2/contracts";

export interface AttendanceMonitorItem {
  serviceId: string;
  serviceName: string;
  code: string;
  waitingCount: number;
  inServiceCount: number;
  calledCount: number;
  totalOpen: number;
  waitingSequences: string[];
}

export interface AttendanceSearchResult {
  ticket: Ticket;
  service: { id: string; name: string } | null;
  ticketType: { id: string; name: string } | null;
  activeCall: TicketCall | null;
}

export interface AttendanceDeskState {
  desk: Desk;
  queue: Array<Ticket & { service?: { id: string; name: string } | null; ticketType?: { id: string; name: string } | null }>;
  currentCall: TicketCall | null;
}

export interface OperationalSnapshot {
  unitId: string | null;
  generatedAt: string;
  desks: AttendanceDeskState[];
  monitor: AttendanceMonitorItem[];
  recentTickets: Array<Ticket & { service?: { id: string; name: string } | null; ticketType?: { id: string; name: string } | null }>;
  currentCalls: TicketCall[];
}

export interface TriageSnapshot {
  unit: Unit | null;
  settings: UnitSettings | null;
  services: ServiceCatalogItem[];
  ticketTypes: TicketType[];
  lastIssuedTicket: Ticket | null;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (configured ?? `${window.location.origin}/api`).replace(/\/$/, "");
}

function hasAuthToken() {
  return Boolean(window.localStorage.getItem("ticket-v2-auth-token"));
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const token = window.localStorage.getItem("ticket-v2-auth-token");
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

interface AdminWorkspaceSnapshot {
  unit: Unit | null;
  overview: {
    units: number;
    departments: number;
    services: number;
    users: number;
    desks: number;
    waitingTickets: number;
    inServiceTickets: number;
    recentTickets: number;
  };
  units: Unit[];
  departments: Department[];
  services: ServiceCatalogItem[];
  ticketTypes: TicketType[];
  locations: Location[];
  desks: Desk[];
  unitSettings: Array<UnitSettings & { unit?: Unit | null }>;
  activeUnitSettings: (UnitSettings & { unit?: Unit | null }) | null;
  panelProfiles: PanelProfile[];
  printTemplates: PrintTemplate[];
  mediaAssets: MediaAsset[];
  panelPlaylists: PanelPlaylist[];
  connectors: IntegrationConnector[];
  profiles: Array<{ id: string; code: string; name: string; description: string; permissions?: string[] }>;
  users: Array<{ id: string; email: string; fullName: string; profile: string; profileCode: string; unitId?: string | null }>;
  attendance: OperationalSnapshot;
}

type UnitSettingsPatch = Partial<Omit<UnitSettings, "webhooks" | "panelRuntime" | "triageRuntime">> & {
  webhooks?: Partial<NonNullable<UnitSettings["webhooks"]>>;
  panelRuntime?: Partial<NonNullable<UnitSettings["panelRuntime"]>>;
  triageRuntime?: Partial<NonNullable<UnitSettings["triageRuntime"]>>;
};

export async function fetchBootstrapData(unitId?: string) {
  const ticketQuery = unitId ? `?unitId=${encodeURIComponent(unitId)}` : "";
  if (hasAuthToken()) {
    try {
      const workspaceQuery = unitId ? `?unitId=${encodeURIComponent(unitId)}` : "";
      const workspace = await requestJson<AdminWorkspaceSnapshot>(`/admin/workspace${workspaceQuery}`);

      return {
        units: workspace.units,
        departments: workspace.departments,
        services: workspace.services,
        ticketTypes: workspace.ticketTypes,
        locations: workspace.locations,
        desks: workspace.desks,
        unitSettings: workspace.unitSettings.map(({ unit: _unit, ...item }) => item),
        panelProfiles: workspace.panelProfiles,
        panelProfile: workspace.panelProfiles[0] ?? null,
        printTemplates: workspace.printTemplates,
        mediaAssets: workspace.mediaAssets,
        panelPlaylists: workspace.panelPlaylists ?? [],
        connectors: workspace.connectors ?? [],
        profiles: workspace.profiles,
        users: workspace.users,
        recentTickets: workspace.attendance.recentTickets,
        currentCalls: workspace.attendance.currentCalls
      };
    } catch (_error) {
      // Fallback to granular bootstrap below.
    }
  }

  const [
    units,
    departments,
    services,
    ticketTypes,
    locations,
    desks,
    unitSettings,
    panelProfiles,
    printTemplates,
    mediaAssets,
    panelPlaylists,
    recentTickets,
    currentCalls
  ] = await Promise.all([
    requestJson<Unit[]>("/catalog/units"),
    requestJson<Department[]>("/catalog/departments"),
    requestJson<ServiceCatalogItem[]>("/catalog/services"),
    requestJson<TicketType[]>(`/catalog/ticket-types${ticketQuery}`),
    requestJson<Location[]>("/catalog/locations"),
    requestJson<Desk[]>("/catalog/desks"),
    requestJson<Array<UnitSettings & { unit?: Unit | null }>>("/settings/units"),
    requestJson<PanelProfile[]>("/settings/panel-profiles"),
    requestJson<PrintTemplate[]>("/settings/print-templates"),
    requestJson<MediaAsset[]>("/settings/media-assets"),
    requestJson<PanelPlaylist[]>("/settings/panel-playlists"),
    requestJson<Ticket[]>(`/tickets${ticketQuery}`),
    requestJson<TicketCall[]>(`/audio/current-calls${ticketQuery}`)
  ]);

  let profiles: Array<{ id: string; code: string; name: string; description: string; permissions?: string[] }> = [];
  let users: Array<{ id: string; email: string; fullName: string; profile: string; profileCode: string; unitId?: string | null }> = [];

  if (hasAuthToken()) {
    try {
      profiles = await requestJson<Array<{ id: string; code: string; name: string; description: string; permissions?: string[] }>>("/admin/profiles");
    } catch (_error) {
      profiles = [];
    }

    try {
      users = await requestJson<Array<{ id: string; email: string; fullName: string; profile: string; profileCode: string; unitId?: string | null }>>("/admin/users");
    } catch (_error) {
      users = [];
    }
  }

  return {
    units,
    departments,
    services,
    ticketTypes,
    locations,
    desks,
    unitSettings: unitSettings.map(({ unit: _unit, ...item }) => item),
    panelProfiles,
    panelProfile: panelProfiles[0] ?? null,
    printTemplates,
    mediaAssets,
    panelPlaylists,
    connectors: await requestJson<IntegrationConnector[]>(`/integrations/connectors${ticketQuery}`),
    profiles,
    users,
    recentTickets,
    currentCalls
  };
}

export function issueTicketRequest(input: {
  serviceId: string;
  ticketTypeId: string;
  clientName?: string;
  clientDocument?: string;
  metadata?: Record<string, string | number | boolean>;
}) {
  return requestJson<Ticket>("/tickets/issue", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function fetchTriageSnapshot(unitId?: string) {
  const query = unitId ? `?unitId=${encodeURIComponent(unitId)}` : "";
  return requestJson<TriageSnapshot>(`/tickets/triage-snapshot${query}`);
}

export function callNextTicketRequest(input: { deskId: string; locale: SupportedLocale }) {
  return requestJson<TicketCall | null>("/attendance/call-next", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function finishTicketRequest(ticketId: string) {
  return requestJson<{ success: boolean; ticketId: string }>("/attendance/finish", {
    method: "POST",
    body: JSON.stringify({ ticketId })
  });
}

export function fetchPanelPayload(unitId?: string) {
  const query = unitId ? `?unitId=${encodeURIComponent(unitId)}` : "";
  return requestJson<{
    config: PanelProfile;
    calls: Array<
      Ticket & {
        service?: { id: string; name: string } | null;
        ticketType?: { id: string; name: string } | null;
      }
    >;
    media: Array<{ id: string; kind: string; title: string; path: string; durationSeconds: number }>;
    playlist?: PanelPlaylist | null;
    audio: {
      enabled: boolean;
      locale: SupportedLocale;
      currentCalls: TicketCall[];
    };
  }>(`/panel/payload${query}`);
}

export function savePanelPlaylistRequest(playlistId: string, patch: Partial<PanelPlaylist>) {
  return requestJson<PanelPlaylist>(`/settings/panel-playlists/${playlistId}`, {
    method: "PUT",
    body: JSON.stringify(patch)
  });
}

export function createConnectorRequest(input: Omit<IntegrationConnector, "id">) {
  return requestJson<IntegrationConnector>("/integrations/connectors", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateConnectorRequest(connectorId: string, patch: Partial<Omit<IntegrationConnector, "id" | "unitId">>) {
  return requestJson<IntegrationConnector>(`/integrations/connectors/${connectorId}`, {
    method: "PUT",
    body: JSON.stringify(patch)
  });
}

export function deleteConnectorRequest(connectorId: string) {
  return requestJson<{ success: boolean; id: string }>(`/integrations/connectors/${connectorId}`, {
    method: "DELETE"
  });
}

export function fetchAttendanceMonitor(unitId?: string) {
  const query = unitId ? `?unitId=${encodeURIComponent(unitId)}` : "";
  return requestJson<AttendanceMonitorItem[]>(`/attendance/monitor${query}`);
}

export function fetchOperationalSnapshot(unitId?: string) {
  const query = unitId ? `?unitId=${encodeURIComponent(unitId)}` : "";
  return requestJson<OperationalSnapshot>(`/attendance/snapshot${query}`);
}

export function searchAttendanceTicket(sequence: string) {
  const query = `?sequence=${encodeURIComponent(sequence)}`;
  return requestJson<AttendanceSearchResult | null>(`/attendance/search${query}`);
}

export function fetchDeskQueue(deskId: string) {
  const query = `?deskId=${encodeURIComponent(deskId)}`;
  return requestJson<Array<Ticket & { service?: { id: string; name: string } | null; ticketType?: { id: string; name: string } | null }>>(
    `/attendance/queue${query}`
  );
}

export function fetchDeskCurrentCall(deskId: string) {
  const query = `?deskId=${encodeURIComponent(deskId)}`;
  return requestJson<TicketCall | null>(`/attendance/current-call${query}`);
}

export function fetchDesksState(unitId?: string) {
  const query = unitId ? `?unitId=${encodeURIComponent(unitId)}` : "";
  return requestJson<AttendanceDeskState[]>(`/attendance/desks-state${query}`);
}

export function saveUnitSettingsRequest(unitId: string, patch: UnitSettingsPatch) {
  return requestJson<UnitSettings & { unit?: Unit | null }>(`/settings/units/${unitId}`, {
    method: "PUT",
    body: JSON.stringify(patch)
  });
}

export function savePanelProfileRequest(profileId: string, patch: Partial<PanelProfile>) {
  return requestJson<PanelProfile>(`/settings/panel-profiles/${profileId}`, {
    method: "PUT",
    body: JSON.stringify(patch)
  });
}

export function createPanelProfileRequest(input: Omit<PanelProfile, "id">) {
  return requestJson<PanelProfile>("/settings/panel-profiles", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function deletePanelProfileRequest(profileId: string) {
  return requestJson<{ success: boolean; id: string }>(`/settings/panel-profiles/${profileId}`, {
    method: "DELETE"
  });
}

export function savePrintTemplateRequest(templateId: string, patch: Partial<PrintTemplate>) {
  return requestJson<PrintTemplate>(`/settings/print-templates/${templateId}`, {
    method: "PUT",
    body: JSON.stringify(patch)
  });
}

export function createPrintTemplateRequest(input: Omit<PrintTemplate, "id"> & { unitId?: string | null }) {
  return requestJson<PrintTemplate>("/settings/print-templates", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function deletePrintTemplateRequest(templateId: string) {
  return requestJson<{ success: boolean; id: string }>(`/settings/print-templates/${templateId}`, {
    method: "DELETE"
  });
}

export function createMediaAssetRequest(asset: Omit<MediaAsset, "id">) {
  return requestJson<MediaAsset>("/settings/media-assets", {
    method: "POST",
    body: JSON.stringify(asset)
  });
}

export function deleteMediaAssetRequest(assetId: string) {
  return requestJson<{ success: boolean; id: string }>(`/settings/media-assets/${assetId}`, {
    method: "DELETE"
  });
}

export function createPanelPlaylistRequest(input: Omit<PanelPlaylist, "id">) {
  return requestJson<PanelPlaylist>("/settings/panel-playlists", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function deletePanelPlaylistRequest(playlistId: string) {
  return requestJson<{ success: boolean; id: string }>(`/settings/panel-playlists/${playlistId}`, {
    method: "DELETE"
  });
}

export function createUnitRequest(input: Pick<Unit, "name" | "code" | "brandName" | "locale" | "logoUrl">) {
  return requestJson<Unit>("/catalog/units", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateUnitRequest(unitId: string, input: Partial<Pick<Unit, "name" | "code" | "brandName" | "locale" | "logoUrl">>) {
  return requestJson<Unit>(`/catalog/units/${unitId}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteUnitRequest(unitId: string) {
  return requestJson<{ success: boolean; id: string }>(`/catalog/units/${unitId}`, {
    method: "DELETE"
  });
}

export function createDepartmentRequest(name: string) {
  return requestJson<Department>("/catalog/departments", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export function updateDepartmentRequest(departmentId: string, name: string) {
  return requestJson<Department>(`/catalog/departments/${departmentId}`, {
    method: "PUT",
    body: JSON.stringify({ name })
  });
}

export function deleteDepartmentRequest(departmentId: string) {
  return requestJson<{ success: boolean; id: string }>(`/catalog/departments/${departmentId}`, {
    method: "DELETE"
  });
}

export function createServiceRequest(input: Pick<ServiceCatalogItem, "unitId" | "name" | "code" | "departmentId" | "allowPriority" | "ticketTypeIds">) {
  return requestJson<ServiceCatalogItem>("/catalog/services", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateServiceRequest(
  serviceId: string,
  input: Partial<Pick<ServiceCatalogItem, "name" | "code" | "departmentId" | "allowPriority" | "ticketTypeIds">>
) {
  return requestJson<ServiceCatalogItem>(`/catalog/services/${serviceId}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteServiceRequest(serviceId: string) {
  return requestJson<{ success: boolean; id: string }>(`/catalog/services/${serviceId}`, {
    method: "DELETE"
  });
}

export function createTicketTypeRequest(
  input: Pick<
    TicketType,
    "unitId" | "code" | "name" | "description" | "prefix" | "color" | "textColor" | "icon" | "baseWeight" | "requireClient" | "requireDocument" | "requireExternalValidation" | "allowPrint" | "allowPanel" | "triageMessage"
  >
) {
  return requestJson<TicketType>("/catalog/ticket-types", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateTicketTypeRequest(
  ticketTypeId: string,
  input: Partial<
    Pick<
      TicketType,
      "name" | "code" | "description" | "prefix" | "color" | "textColor" | "icon" | "baseWeight" | "requireClient" | "requireDocument" | "requireExternalValidation" | "allowPrint" | "allowPanel" | "triageMessage"
    >
  >
) {
  return requestJson<TicketType>(`/catalog/ticket-types/${ticketTypeId}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteTicketTypeRequest(ticketTypeId: string) {
  return requestJson<{ success: boolean; id: string }>(`/catalog/ticket-types/${ticketTypeId}`, {
    method: "DELETE"
  });
}

export function createLocationRequest(input: Pick<Location, "unitId" | "name" | "code">) {
  return requestJson<Location>("/catalog/locations", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateLocationRequest(locationId: string, input: Partial<Pick<Location, "name" | "code">>) {
  return requestJson<Location>(`/catalog/locations/${locationId}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteLocationRequest(locationId: string) {
  return requestJson<{ success: boolean; id: string }>(`/catalog/locations/${locationId}`, {
    method: "DELETE"
  });
}

export function createDeskRequest(input: Pick<Desk, "unitId" | "locationId" | "name" | "operatorName" | "serviceIds">) {
  return requestJson<Desk>("/catalog/desks", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateDeskRequest(
  deskId: string,
  input: Partial<Pick<Desk, "locationId" | "name" | "operatorName" | "serviceIds">>
) {
  return requestJson<Desk>(`/catalog/desks/${deskId}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteDeskRequest(deskId: string) {
  return requestJson<{ success: boolean; id: string }>(`/catalog/desks/${deskId}`, {
    method: "DELETE"
  });
}

export function createProfileRequest(input: { code: string; name: string; description?: string; permissions?: string[] }) {
  return requestJson<{ id: string; code: string; name: string; description: string; permissions?: string[] }>("/admin/profiles", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateProfileRequest(
  profileId: string,
  input: { name?: string; description?: string; permissions?: string[] }
) {
  return requestJson<{ id: string; code: string; name: string; description: string; permissions?: string[] }>(`/admin/profiles/${profileId}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteProfileRequest(profileId: string) {
  return requestJson<{ success: boolean; id: string }>(`/admin/profiles/${profileId}`, {
    method: "DELETE"
  });
}

export function createUserRequest(input: {
  email: string;
  fullName: string;
  profileId: string;
  unitId?: string;
  locale?: SupportedLocale;
  password?: string;
}) {
  return requestJson<{ id: string; email: string; fullName: string; profile: string; profileCode: string; profileId: string; unitId?: string | null; initialPassword: string }>("/admin/users", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateUserRequest(input: {
  id: string;
  email?: string;
  fullName?: string;
  profileId?: string;
  unitId?: string | null;
  locale?: SupportedLocale;
  active?: boolean;
  password?: string;
}) {
  return requestJson<{ id: string; email: string; fullName: string; profile: string; profileCode: string; profileId: string; unitId?: string | null }>(`/admin/users/${input.id}`, {
    method: "PUT",
    body: JSON.stringify({
      email: input.email,
      fullName: input.fullName,
      profileId: input.profileId,
      unitId: input.unitId,
      locale: input.locale,
      active: input.active,
      password: input.password
    })
  });
}

export function deleteUserRequest(userId: string) {
  return requestJson<{ success: boolean; id: string }>(`/admin/users/${userId}`, {
    method: "DELETE"
  });
}
