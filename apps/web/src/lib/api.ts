import type {
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

function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (configured ?? `${window.location.origin}/api`).replace(/\/$/, "");
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
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchBootstrapData() {
  const [units, departments, services, ticketTypes, locations, desks, unitSettings, panelProfiles, recentTickets, currentCalls] =
    await Promise.all([
      requestJson<Unit[]>("/catalog/units"),
      requestJson<Department[]>("/catalog/departments"),
      requestJson<ServiceCatalogItem[]>("/catalog/services"),
      requestJson<TicketType[]>("/catalog/ticket-types"),
      requestJson<Location[]>("/catalog/locations"),
      requestJson<Desk[]>("/catalog/desks"),
      requestJson<Array<UnitSettings & { unit?: Unit | null }>>("/settings/units"),
      requestJson<PanelProfile[]>("/settings/panel-profiles"),
      requestJson<Ticket[]>("/tickets"),
      requestJson<TicketCall[]>("/audio/current-calls")
    ]);

  return {
    units,
    departments,
    services,
    ticketTypes,
    locations,
    desks,
    unitSettings: unitSettings.map(({ unit: _unit, ...item }) => item),
    panelProfile: panelProfiles[0] ?? null,
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
