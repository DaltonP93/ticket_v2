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
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  adminUsers as defaultAdminUsers,
  audioProfiles as defaultAudioProfiles,
  connectors,
  currentCalls as defaultCurrentCalls,
  departments as defaultDepartments,
  deskItems as defaultDeskItems,
  locationItems as defaultLocationItems,
  mediaAssets as defaultMediaAssets,
  panelProfile as defaultPanelProfile,
  printTemplates as defaultPrintTemplates,
  profileItems as defaultProfileItems,
  recentTickets as defaultRecentTickets,
  serviceItems as defaultServiceItems,
  ticketTypeItems as defaultTicketTypes,
  unitItems as defaultUnitItems,
  unitSettingsItems as defaultUnitSettingsItems
} from "./mock-api";
import { callNextTicketRequest, fetchBootstrapData, finishTicketRequest, issueTicketRequest, saveUnitSettingsRequest } from "./lib/api";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  profile: string;
}

interface ProfileItem {
  id: string;
  name: string;
  scope: string;
}

interface PrintTemplate {
  id: string;
  name: string;
  scope: string;
  unit: string;
  header: string;
  footer: string;
  html: string;
}

interface StoreShape {
  isHydrated: boolean;
  syncError: string | null;
  selectedUnitId: string;
  units: Unit[];
  departments: Department[];
  services: ServiceCatalogItem[];
  locations: Location[];
  desks: Desk[];
  ticketTypes: TicketType[];
  profiles: ProfileItem[];
  users: AdminUser[];
  printTemplates: PrintTemplate[];
  unitSettings: UnitSettings[];
  panelProfile: PanelProfile;
  recentTickets: Ticket[];
  currentCalls: TicketCall[];
  audioProfiles: Record<SupportedLocale, AudioProfile>;
  connectors: typeof connectors;
  mediaAssets: { id: string; title: string; kind: string; url: string; durationSeconds: number }[];
  refreshFromApi: () => Promise<void>;
  setSelectedUnit: (unitId: string) => void;
  addUnit: (input: Pick<Unit, "name" | "code" | "brandName" | "locale" | "logoUrl">) => void;
  addDepartment: (name: string) => void;
  addService: (input: Pick<ServiceCatalogItem, "name" | "code" | "departmentId" | "allowPriority" | "ticketTypeIds">) => void;
  addLocation: (input: Pick<Location, "name" | "code" | "unitId">) => void;
  addDesk: (input: Pick<Desk, "name" | "unitId" | "locationId" | "operatorName" | "serviceIds">) => void;
  addUser: (input: Omit<AdminUser, "id">) => void;
  savePrintTemplate: (template: PrintTemplate) => void;
  addMediaAsset: (asset: { title: string; kind: string; url: string; durationSeconds: number }) => void;
  updatePanelProfile: (patch: Partial<Omit<PanelProfile, "theme">> & { theme?: Partial<PanelProfile["theme"]> }) => void;
  updateUnitSettings: (
    unitId: string,
    patch: Partial<Omit<UnitSettings, "webhooks" | "panelRuntime" | "triageRuntime">> & {
      webhooks?: Partial<NonNullable<UnitSettings["webhooks"]>>;
      panelRuntime?: Partial<NonNullable<UnitSettings["panelRuntime"]>>;
      triageRuntime?: Partial<NonNullable<UnitSettings["triageRuntime"]>>;
    }
  ) => void;
  emitTicket: (input: {
    locale: SupportedLocale;
    serviceId: string;
    ticketTypeId: string;
    clientName: string;
    clientDocument: string;
    observation: string;
  }) => Promise<Ticket>;
  callNextTicket: (input: { locale: SupportedLocale; deskId: string }) => Promise<TicketCall | undefined>;
  finishTicket: (ticketId: string) => Promise<void>;
}

interface PersistedState {
  selectedUnitId: string;
  units: Unit[];
  departments: Department[];
  services: ServiceCatalogItem[];
  locations: Location[];
  desks: Desk[];
  ticketTypes: TicketType[];
  profiles: ProfileItem[];
  users: AdminUser[];
  printTemplates: PrintTemplate[];
  unitSettings: UnitSettings[];
  panelProfile: PanelProfile;
  recentTickets: Ticket[];
  currentCalls: TicketCall[];
  audioProfiles: Record<SupportedLocale, AudioProfile>;
  mediaAssets: { id: string; title: string; kind: string; url: string; durationSeconds: number }[];
}

const STORAGE_KEY = "ticket-v2-store";

function defaultPanelRuntime(): NonNullable<UnitSettings["panelRuntime"]> {
  return {
    serverUrl: "",
    username: "",
    password: "",
    clientId: "",
    clientSecret: "",
    retries: 5,
    locale: "es",
    visibleServiceIds: [],
    visibleDepartmentIds: [],
    speechEnabled: true,
    alertSound: "default",
    showMedia: true,
    showHistory: true,
    showClock: true
  };
}

function defaultTriageRuntime(): NonNullable<UnitSettings["triageRuntime"]> {
  return {
    serverUrl: "",
    username: "",
    password: "",
    clientId: "",
    clientSecret: "",
    locale: "es",
    columns: 2,
    scale: 100,
    waitTimeSeconds: 10,
    printEnabled: true,
    showTitle: true,
    showSubtitle: true,
    lockMenu: false,
    groupByDepartment: false,
    visibleServiceIds: [],
    visibleDepartmentIds: []
  };
}

function normalizeUnitSetting(item: UnitSettings): UnitSettings {
  return {
    ...item,
    panelRuntime: {
      ...defaultPanelRuntime(),
      ...(item.panelRuntime ?? {})
    },
    triageRuntime: {
      ...defaultTriageRuntime(),
      ...(item.triageRuntime ?? {})
    }
  };
}

function normalizeUnitSettings(items: UnitSettings[]) {
  return items.map(normalizeUnitSetting);
}

const initialState: PersistedState = {
  selectedUnitId: defaultUnitItems[0]?.id ?? "",
  units: defaultUnitItems,
  departments: defaultDepartments,
  services: defaultServiceItems,
  locations: defaultLocationItems,
  desks: defaultDeskItems,
  ticketTypes: defaultTicketTypes,
  profiles: defaultProfileItems,
  users: defaultAdminUsers,
  printTemplates: defaultPrintTemplates,
  unitSettings: normalizeUnitSettings(defaultUnitSettingsItems),
  panelProfile: defaultPanelProfile,
  recentTickets: defaultRecentTickets,
  currentCalls: defaultCurrentCalls,
  audioProfiles: defaultAudioProfiles,
  mediaAssets: defaultMediaAssets
};

const TicketSystemContext = createContext<StoreShape | null>(null);

function buildId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function nextSequence(tickets: Ticket[], prefix: string) {
  const lastNumber = tickets
    .filter((item) => item.sequence.startsWith(`${prefix}-`))
    .map((item) => Number.parseInt(item.sequence.split("-")[1] ?? "0", 10))
    .filter((item) => Number.isFinite(item))
    .sort((left, right) => right - left)[0] ?? 0;

  return `${prefix}-${String(lastNumber + 1).padStart(3, "0")}`;
}

export function TicketSystemProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [state, setState] = useState<PersistedState>(() => {
    if (typeof window === "undefined") {
      return initialState;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initialState;
    }

    const parsed = JSON.parse(stored) as Partial<PersistedState>;

    return {
      ...initialState,
      ...parsed,
      unitSettings: normalizeUnitSettings((parsed.unitSettings as UnitSettings[] | undefined) ?? initialState.unitSettings)
    };
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  async function refreshFromApi() {
    try {
      const payload = await fetchBootstrapData();

      setState((current) => ({
        ...current,
        selectedUnitId: payload.units.some((item) => item.id === current.selectedUnitId)
          ? current.selectedUnitId
          : payload.units[0]?.id ?? current.selectedUnitId,
        units: payload.units,
        departments: payload.departments,
        services: payload.services,
        locations: payload.locations,
        desks: payload.desks,
        ticketTypes: payload.ticketTypes,
        unitSettings: payload.unitSettings.length ? normalizeUnitSettings(payload.unitSettings) : current.unitSettings,
        panelProfile: payload.panelProfile ?? current.panelProfile,
        recentTickets: payload.recentTickets,
        currentCalls: payload.currentCalls
      }));
      setIsHydrated(true);
      setSyncError(null);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "No se pudo sincronizar con el API.");
      setIsHydrated(true);
    }
  }

  useEffect(() => {
    void refreshFromApi();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshFromApi();
    }, 15000);

    return () => window.clearInterval(timer);
  }, []);

  const value = useMemo<StoreShape>(
    () => ({
      isHydrated,
      syncError,
      ...state,
      connectors,
      refreshFromApi,
      setSelectedUnit(unitId) {
        setState((current) => ({ ...current, selectedUnitId: unitId }));
      },
      addUnit(input) {
        const newUnitId = buildId("unit");
        setState((current) => ({
          ...current,
          selectedUnitId: newUnitId,
          units: [...current.units, { id: newUnitId, ...input }],
          unitSettings: [
            ...current.unitSettings,
            {
              unitId: newUnitId,
              printHeader: input.brandName,
              printFooter: "Presente su documento y aguarde el llamado en pantalla.",
              printShowDate: true,
              printShowTicketType: true,
              printShowUnitName: true,
              printShowServiceName: true,
              triageServiceIds: current.services.slice(0, 3).map((service) => service.id),
              panelShowHistory: true,
              panelShowClock: true,
              panelPrimaryMediaId: current.mediaAssets[0]?.id,
              panelBrandingText: input.brandName,
              webhooks: {
                preTicket: "",
                postTicket: "",
                onPrint: ""
              },
              panelRuntime: defaultPanelRuntime(),
              triageRuntime: defaultTriageRuntime()
            }
          ]
        }));
      },
      addDepartment(name) {
        setState((current) => ({
          ...current,
          departments: [...current.departments, { id: buildId("dep"), name }]
        }));
      },
      addService(input) {
        setState((current) => ({
          ...current,
          services: [...current.services, { id: buildId("srv"), ...input }]
        }));
      },
      addLocation(input) {
        setState((current) => ({
          ...current,
          locations: [...current.locations, { id: buildId("loc"), ...input }]
        }));
      },
      addDesk(input) {
        setState((current) => ({
          ...current,
          desks: [...current.desks, { id: buildId("desk"), ...input }]
        }));
      },
      addUser(input) {
        setState((current) => ({
          ...current,
          users: [...current.users, { id: buildId("usr"), ...input }]
        }));
      },
      savePrintTemplate(template) {
        setState((current) => {
          const exists = current.printTemplates.some((item) => item.id === template.id);
          return {
            ...current,
            printTemplates: exists
              ? current.printTemplates.map((item) => (item.id === template.id ? template : item))
              : [...current.printTemplates, template]
          };
        });
      },
      addMediaAsset(asset) {
        setState((current) => ({
          ...current,
          mediaAssets: [...current.mediaAssets, { id: buildId("media"), ...asset }]
        }));
      },
      updatePanelProfile(patch: Partial<Omit<PanelProfile, "theme">> & { theme?: Partial<PanelProfile["theme"]> }) {
        setState((current) => ({
          ...current,
          panelProfile: {
            ...current.panelProfile,
            ...patch,
            theme: {
              ...current.panelProfile.theme,
              ...(patch.theme ?? {})
            }
          }
        }));
      },
      updateUnitSettings(unitId, patch) {
        setState((current) => ({
          ...current,
          unitSettings: current.unitSettings.map((item) =>
            item.unitId === unitId
              ? {
                  ...item,
                  ...patch,
                  webhooks: {
                    ...item.webhooks,
                    ...(patch.webhooks ?? {})
                  },
                  panelRuntime: {
                    ...defaultPanelRuntime(),
                    ...(item.panelRuntime ?? {}),
                    ...(patch.panelRuntime ?? {})
                  },
                  triageRuntime: {
                    ...defaultTriageRuntime(),
                    ...(item.triageRuntime ?? {}),
                    ...(patch.triageRuntime ?? {})
                  }
                }
              : item
          )
        }));

        void saveUnitSettingsRequest(unitId, patch).catch((error) => {
          setSyncError(error instanceof Error ? error.message : "No se pudo guardar la configuracion de la unidad.");
        });
      },
      async emitTicket(input) {
        const service = state.services.find((item) => item.id === input.serviceId);
        const ticketType = state.ticketTypes.find((item) => item.id === input.ticketTypeId);
        const unit = state.units.find((item) => item.id === state.selectedUnitId) ?? state.units[0];

        try {
          const createdTicket = await issueTicketRequest({
            serviceId: input.serviceId,
            ticketTypeId: input.ticketTypeId,
            clientName: input.clientName || undefined,
            clientDocument: input.clientDocument || undefined,
            metadata: {
              observation: input.observation,
              serviceName: service?.name ?? "",
              ticketTypeName: ticketType?.name ?? "",
              unitName: unit?.name ?? "",
              createdLocale: input.locale
            }
          });

          setState((current) => ({
            ...current,
            recentTickets: [createdTicket, ...current.recentTickets.filter((item) => item.id !== createdTicket.id)].slice(0, 40)
          }));

          return createdTicket;
        } catch (_error) {
          let createdTicket: Ticket | undefined;

          setState((current) => {
            const localService = current.services.find((item) => item.id === input.serviceId);
            const localTicketType = current.ticketTypes.find((item) => item.id === input.ticketTypeId);
            const localUnit = current.units.find((item) => item.id === current.selectedUnitId) ?? current.units[0];
            const prefix = localTicketType?.prefix ?? localService?.code.slice(0, 1) ?? "T";
            const sequence = nextSequence(current.recentTickets, prefix);

            createdTicket = {
              id: buildId("tk"),
              sequence,
              status: "waiting",
              serviceId: input.serviceId,
              unitId: localUnit?.id ?? current.selectedUnitId,
              ticketTypeId: input.ticketTypeId,
              clientName: input.clientName,
              clientDocument: input.clientDocument,
              metadata: {
                observation: input.observation,
                serviceName: localService?.name ?? "",
                ticketTypeName: localTicketType?.name ?? "",
                unitName: localUnit?.name ?? "",
                createdLocale: input.locale
              },
              createdAt: new Date().toISOString()
            };

            return {
              ...current,
              recentTickets: [createdTicket, ...current.recentTickets].slice(0, 40)
            };
          });

          return createdTicket!;
        }
      },
      async callNextTicket(input) {
        try {
          const nextCall = await callNextTicketRequest(input);

          if (!nextCall) {
            return undefined;
          }

          setState((current) => ({
            ...current,
            recentTickets: current.recentTickets.map((item) =>
              item.id === nextCall?.ticketId ? { ...item, status: "in_service" } : item
            ),
            currentCalls: [nextCall, ...current.currentCalls.filter((item) => item.ticketId !== nextCall.ticketId)].slice(0, 16)
          }));

          return nextCall;
        } catch (_error) {
          let nextCall: TicketCall | undefined;

          setState((current) => {
            const desk = current.desks.find((item) => item.id === input.deskId);
            if (!desk) {
              return current;
            }

            const activeTicket = current.currentCalls.find((call) => {
              if (call.deskId !== desk.id) {
                return false;
              }

              const ticket = current.recentTickets.find((item) => item.id === call.ticketId);
              return ticket?.status === "in_service";
            });

            if (activeTicket) {
              nextCall = activeTicket;
              return current;
            }

            const waitingTicket = current.recentTickets
              .filter((item) => item.status === "waiting" && desk.serviceIds.includes(item.serviceId))
              .sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];

            if (!waitingTicket) {
              return current;
            }

            const service = current.services.find((item) => item.id === waitingTicket.serviceId);
            const ticketType = current.ticketTypes.find((item) => item.id === waitingTicket.ticketTypeId);
            const location = current.locations.find((item) => item.id === desk.locationId);
            const counter = location?.name ?? desk.name;
            const profile = current.audioProfiles[input.locale];
            const announcementText = profile.template
              .replace(/\{sequence\}/g, waitingTicket.sequence)
              .replace(/\{counter\}/g, counter)
              .replace(/\{serviceName\}/g, service?.name ?? "Servicio");

            nextCall = {
              ticketId: waitingTicket.id,
              deskId: desk.id,
              deskName: desk.name,
              sequence: waitingTicket.sequence,
              counter,
              serviceName: service?.name ?? "Servicio",
              ticketTypeName: ticketType?.name ?? "Ticket",
              locale: input.locale,
              announcementText,
              calledAt: new Date().toISOString()
            };

            return {
              ...current,
              recentTickets: current.recentTickets.map((item) =>
                item.id === waitingTicket.id ? { ...item, status: "in_service" } : item
              ),
              currentCalls: [nextCall, ...current.currentCalls].slice(0, 16)
            };
          });

          return nextCall;
        }
      },
      async finishTicket(ticketId) {
        try {
          await finishTicketRequest(ticketId);
        } catch (_error) {
          // Keep local fallback below.
        }

        setState((current) => ({
          ...current,
          recentTickets: current.recentTickets.map((item) =>
            item.id === ticketId ? { ...item, status: "finished" } : item
          )
        }));
      }
    }),
    [isHydrated, state, syncError]
  );

  return <TicketSystemContext.Provider value={value}>{children}</TicketSystemContext.Provider>;
}

export function useTicketSystem() {
  const context = useContext(TicketSystemContext);
  if (!context) {
    throw new Error("useTicketSystem debe usarse dentro de TicketSystemProvider");
  }

  return context;
}
