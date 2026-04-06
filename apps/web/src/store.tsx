import type {
  AudioProfile,
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
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  callNextTicketRequest,
  createConnectorRequest,
  createDepartmentRequest,
  createDeskRequest,
  createLocationRequest,
  createMediaAssetRequest,
  createPanelProfileRequest,
  createPrintTemplateRequest,
  createPanelPlaylistRequest,
  createProfileRequest,
  createServiceRequest,
  createTicketTypeRequest,
  createUnitRequest,
  createUserRequest,
  deleteDepartmentRequest,
  deleteDeskRequest,
  deleteConnectorRequest,
  deleteLocationRequest,
  deleteMediaAssetRequest,
  deletePanelProfileRequest,
  deletePanelPlaylistRequest,
  deleteProfileRequest,
  deletePrintTemplateRequest,
  deleteServiceRequest,
  deleteTicketTypeRequest,
  deleteUnitRequest,
  deleteUserRequest,
  fetchBootstrapData,
  fetchOperationalSnapshot,
  finishTicketRequest,
  issueTicketRequest,
  savePanelProfileRequest,
  savePanelPlaylistRequest,
  savePrintTemplateRequest,
  saveUnitSettingsRequest,
  updateDeskRequest,
  updateDepartmentRequest,
  updateConnectorRequest,
  updateLocationRequest,
  updateProfileRequest,
  updateServiceRequest,
  updateTicketTypeRequest,
  updateUnitRequest,
  updateUserRequest
} from "./lib/api";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  profile: string;
  profileCode: string;
  unitId?: string | null;
}

interface ProfileItem {
  id: string;
  code: string;
  name: string;
  scope: string;
  permissions: string[];
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
  panelProfiles: PanelProfile[];
  panelPlaylists: PanelPlaylist[];
  unitSettings: UnitSettings[];
  panelProfile: PanelProfile;
  recentTickets: Ticket[];
  currentCalls: TicketCall[];
  audioProfiles: Record<SupportedLocale, AudioProfile>;
  connectors: IntegrationConnector[];
  mediaAssets: MediaAsset[];
  refreshFromApi: () => Promise<void>;
  setSelectedUnit: (unitId: string) => void;
  addUnit: (input: Pick<Unit, "name" | "code" | "brandName" | "locale" | "logoUrl">) => void;
  updateUnit: (unitId: string, patch: Partial<Pick<Unit, "name" | "code" | "brandName" | "locale" | "logoUrl">>) => void;
  deleteUnit: (unitId: string) => void;
  addDepartment: (name: string) => void;
  updateDepartment: (departmentId: string, name: string) => void;
  deleteDepartment: (departmentId: string) => void;
  addService: (input: Pick<ServiceCatalogItem, "unitId" | "name" | "code" | "departmentId" | "allowPriority" | "ticketTypeIds">) => void;
  addTicketType: (
    input: Pick<
      TicketType,
      "unitId" | "code" | "name" | "description" | "prefix" | "color" | "textColor" | "icon" | "baseWeight" | "requireClient" | "requireDocument" | "requireExternalValidation" | "allowPrint" | "allowPanel" | "triageMessage"
    >
  ) => void;
  updateService: (serviceId: string, patch: Partial<Pick<ServiceCatalogItem, "name" | "code" | "departmentId" | "allowPriority" | "ticketTypeIds">>) => void;
  deleteService: (serviceId: string) => void;
  updateTicketType: (
    ticketTypeId: string,
    patch: Partial<
      Pick<
        TicketType,
        "name" | "code" | "description" | "prefix" | "color" | "textColor" | "icon" | "baseWeight" | "requireClient" | "requireDocument" | "requireExternalValidation" | "allowPrint" | "allowPanel" | "triageMessage"
      >
    >
  ) => void;
  deleteTicketType: (ticketTypeId: string) => void;
  addLocation: (input: Pick<Location, "name" | "code" | "unitId">) => void;
  updateLocation: (locationId: string, patch: Partial<Pick<Location, "name" | "code">>) => void;
  deleteLocation: (locationId: string) => void;
  addDesk: (input: Pick<Desk, "name" | "unitId" | "locationId" | "operatorName" | "serviceIds">) => void;
  updateDesk: (deskId: string, patch: Partial<Pick<Desk, "locationId" | "name" | "operatorName" | "serviceIds">>) => void;
  deleteDesk: (deskId: string) => void;
  addProfile: (input: Pick<ProfileItem, "name" | "scope">) => void;
  updateProfile: (profileId: string, patch: Partial<Pick<ProfileItem, "name" | "scope" | "permissions">>) => void;
  deleteProfile: (profileId: string) => void;
  addConnector: (input: Omit<IntegrationConnector, "id">) => void;
  updateConnector: (connectorId: string, patch: Partial<Omit<IntegrationConnector, "id" | "unitId">>) => void;
  deleteConnector: (connectorId: string) => void;
  addUser: (input: Omit<AdminUser, "id"> & { profileId?: string; unitId?: string; password?: string }) => void;
  updateUser: (
    userId: string,
    patch: Partial<Pick<AdminUser, "name" | "email" | "unitId">> & { profileId?: string; password?: string; active?: boolean }
  ) => void;
  deleteUser: (userId: string) => void;
  savePrintTemplate: (template: PrintTemplate) => void;
  addPrintTemplate: (template: Omit<PrintTemplate, "id"> & { unitId?: string | null }) => void;
  deletePrintTemplate: (templateId: string) => void;
  addMediaAsset: (asset: Omit<MediaAsset, "id">) => void;
  deleteMediaAsset: (assetId: string) => void;
  savePanelPlaylist: (playlist: PanelPlaylist) => void;
  addPanelPlaylist: (playlist: Omit<PanelPlaylist, "id">) => void;
  deletePanelPlaylist: (playlistId: string) => void;
  addPanelProfile: (profile: Omit<PanelProfile, "id">) => void;
  deletePanelProfile: (profileId: string) => void;
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
  panelProfiles: PanelProfile[];
  panelPlaylists: PanelPlaylist[];
  connectors: IntegrationConnector[];
  unitSettings: UnitSettings[];
  panelProfile: PanelProfile;
  recentTickets: Ticket[];
  currentCalls: TicketCall[];
  audioProfiles: Record<SupportedLocale, AudioProfile>;
  mediaAssets: MediaAsset[];
}

const STORAGE_KEY = "ticket-v2-store";

interface StoredPreferences {
  selectedUnitId: string;
}

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

const defaultAudioProfiles: Record<SupportedLocale, AudioProfile> = {
  es: {
    enabled: true,
    locale: "es",
    voiceName: "",
    volume: 1,
    rate: 1,
    pitch: 1,
    template: "Ticket {sequence}, dirigirse a {counter}, servicio {serviceName}.",
    repeat: 2
  },
  en: {
    enabled: true,
    locale: "en",
    voiceName: "",
    volume: 1,
    rate: 1,
    pitch: 1,
    template: "Ticket {sequence}, please proceed to {counter}, service {serviceName}.",
    repeat: 2
  },
  pt: {
    enabled: true,
    locale: "pt",
    voiceName: "",
    volume: 1,
    rate: 1,
    pitch: 1,
    template: "Senha {sequence}, dirija-se ao {counter}, servico {serviceName}.",
    repeat: 2
  }
};

const defaultPanelProfile: PanelProfile = {
  id: "panel_profile_default",
  name: "Panel institucional",
  layout: "calls-media",
  locale: "es",
  theme: {
    background: "#0f1b2d",
    accent: "#0f8b94",
    text: "#f5f7fb"
  }
};

const defaultPrintTemplate: PrintTemplate = {
  id: "print_template_default",
  name: "Plantilla base",
  scope: "unit",
  unit: "",
  header: "Sistema de Ticket",
  footer: "Presente su documento y aguarde el llamado en pantalla.",
  html: "<div class=\"ticket\"><h1>{{ticket.sequence}}</h1></div>"
};

function resolvePanelProfileForUnit(panelProfiles: PanelProfile[], unitSettings: UnitSettings[], selectedUnitId: string, fallback: PanelProfile) {
  const configuredProfileId = unitSettings.find((item) => item.unitId === selectedUnitId)?.panelProfileId;

  return panelProfiles.find((item) => item.id === configuredProfileId)
    ?? panelProfiles[0]
    ?? fallback;
}

function buildDefaultUnitSetting(unit: Pick<Unit, "id" | "brandName">, serviceIds: string[], mediaId?: string, playlistId?: string, printTemplateId?: string): UnitSettings {
  return normalizeUnitSetting({
    unitId: unit.id,
    printHeader: unit.brandName,
    printFooter: "Presente su documento y aguarde el llamado en pantalla.",
    printShowDate: true,
    printShowTicketType: true,
    printShowUnitName: true,
    printShowServiceName: true,
    printTemplateId,
    triageServiceIds: serviceIds,
    panelShowHistory: true,
    panelShowClock: true,
    panelPrimaryMediaId: mediaId,
    panelProfileId: defaultPanelProfile.id,
    panelPlaylistId: playlistId,
    panelBrandingText: unit.brandName,
    webhooks: {
      preTicket: "",
      postTicket: "",
      onPrint: ""
    },
    panelRuntime: {
      ...defaultPanelRuntime(),
      visibleServiceIds: serviceIds
    },
    triageRuntime: {
      ...defaultTriageRuntime(),
      visibleServiceIds: serviceIds
    }
  });
}

const initialState: PersistedState = {
  selectedUnitId: "",
  units: [],
  departments: [],
  services: [],
  locations: [],
  desks: [],
  ticketTypes: [],
  profiles: [],
  users: [],
  printTemplates: [defaultPrintTemplate],
  panelProfiles: [defaultPanelProfile],
  panelPlaylists: [],
  connectors: [],
  unitSettings: [],
  panelProfile: defaultPanelProfile,
  recentTickets: [],
  currentCalls: [],
  audioProfiles: defaultAudioProfiles,
  mediaAssets: []
};

const TicketSystemContext = createContext<StoreShape | null>(null);

function buildId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function currentProfileId(profiles: ProfileItem[], profileName: string) {
  return profiles.find((item) => item.name === profileName || item.code === profileName)?.id ?? profiles[0]?.id ?? "";
}

function slugCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function defaultProfilePermissions(code: string, scope?: string) {
  if (code === "SUPERADMIN" || code === "UNIT_ADMIN") {
    return ["overview", "catalog", "settings", "users", "attendance", "media", "print", "panel", "integrations", "triage"];
  }

  if (code === "ATTENDANCE") {
    return ["attendance"];
  }

  if (code === "TRIAGE") {
    return ["triage"];
  }

  const normalizedScope = (scope ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (normalizedScope.includes("GLOBAL") || normalizedScope.includes("UNIDAD")) {
    return ["overview", "catalog", "settings", "users", "attendance", "media", "print", "panel", "integrations", "triage"];
  }

  if (normalizedScope.includes("PUESTO") || normalizedScope.includes("ATENCION")) {
    return ["attendance"];
  }

  return ["triage"];
}

function normalizeProfile(item: Partial<ProfileItem> & Pick<ProfileItem, "id" | "name">): ProfileItem {
  const code = item.code ?? slugCode(item.name);
  const scope = item.scope ?? item.code ?? "Operacion";

  return {
    id: item.id,
    code,
    name: item.name,
    scope,
    permissions: Array.isArray(item.permissions) && item.permissions.length ? item.permissions : defaultProfilePermissions(code, scope)
  };
}

function normalizeUser(item: Partial<AdminUser> & Pick<AdminUser, "id" | "name" | "email" | "profile">): AdminUser {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    profile: item.profile,
    profileCode: item.profileCode ?? slugCode(item.profile),
    unitId: item.unitId ?? null
  };
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

    const parsed = JSON.parse(stored) as Partial<StoredPreferences>;

    return {
      ...initialState,
      selectedUnitId: parsed.selectedUnitId ?? initialState.selectedUnitId
    };
  });

  useEffect(() => {
    const preferences: StoredPreferences = {
      selectedUnitId: state.selectedUnitId
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [state.selectedUnitId]);

  async function refreshFromApi(unitId = state.selectedUnitId) {
    try {
      const [payload, snapshot] = await Promise.all([
        fetchBootstrapData(unitId),
        fetchOperationalSnapshot(unitId).catch(() => null)
      ]);

      setState((current) => {
        const nextSelectedUnitId = payload.units.some((item) => item.id === unitId)
          ? unitId
          : payload.units.some((item) => item.id === current.selectedUnitId)
            ? current.selectedUnitId
            : payload.units[0]?.id ?? current.selectedUnitId;
        const nextPanelProfiles = payload.panelProfiles?.length ? payload.panelProfiles : current.panelProfiles;
        const nextUnitSettings = payload.unitSettings.length ? normalizeUnitSettings(payload.unitSettings) : current.unitSettings;

        return {
          ...current,
          selectedUnitId: nextSelectedUnitId,
          units: payload.units,
          departments: payload.departments,
          services: payload.services,
          locations: payload.locations,
          desks: payload.desks,
          ticketTypes: payload.ticketTypes,
          profiles: payload.profiles.map((item) =>
            normalizeProfile({
              id: item.id,
              code: item.code,
              name: item.name,
              scope: item.description || item.code,
              permissions: item.permissions
            })
          ),
          users: payload.users.map((item) =>
            normalizeUser({
              id: item.id,
              name: item.fullName,
              email: item.email,
              profile: item.profile,
              profileCode: item.profileCode,
              unitId: item.unitId ?? null
            })
          ),
          connectors: payload.connectors?.length ? payload.connectors : current.connectors,
          unitSettings: nextUnitSettings,
          panelProfiles: nextPanelProfiles,
          panelProfile: resolvePanelProfileForUnit(nextPanelProfiles, nextUnitSettings, nextSelectedUnitId, payload.panelProfile ?? current.panelProfile),
          printTemplates: payload.printTemplates,
          mediaAssets: payload.mediaAssets,
          panelPlaylists: payload.panelPlaylists,
          recentTickets: snapshot?.recentTickets ?? payload.recentTickets,
          currentCalls: snapshot?.currentCalls ?? payload.currentCalls
        };
      });
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

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void refreshFromApi(state.selectedUnitId);
  }, [isHydrated, state.selectedUnitId]);

  const value = useMemo<StoreShape>(
    () => ({
      isHydrated,
      syncError,
      ...state,
      connectors: state.connectors,
      refreshFromApi,
      setSelectedUnit(unitId) {
        setState((current) => ({ ...current, selectedUnitId: unitId }));
      },
      addUnit(input) {
        const newUnitId = buildId("unit");
        const optimisticUnit = { id: newUnitId, ...input };
        setState((current) => ({
          ...current,
          selectedUnitId: newUnitId,
          units: [...current.units, optimisticUnit],
          unitSettings: [
            ...current.unitSettings,
            buildDefaultUnitSetting(
              optimisticUnit,
              current.services.filter((service) => service.unitId === newUnitId).map((service) => service.id),
              current.mediaAssets[0]?.id,
              current.panelPlaylists.find((item) => !item.unitId || item.unitId === newUnitId)?.id,
              current.printTemplates.find((item) => item.unit === optimisticUnit.name)?.id ?? current.printTemplates[0]?.id
            )
          ]
        }));

        void createUnitRequest(input)
          .then(async (created) => {
            const persistedSettings = buildDefaultUnitSetting(
              created,
              [],
              state.mediaAssets[0]?.id,
              state.panelPlaylists.find((item) => !item.unitId || item.unitId === created.id)?.id,
              state.printTemplates.find((item) => item.unit === created.name)?.id ?? state.printTemplates[0]?.id
            );
            setState((current) => ({
              ...current,
              selectedUnitId: created.id,
              units: current.units.map((item) => (item.id === newUnitId ? created : item)),
              unitSettings: current.unitSettings.map((item) => (item.unitId === newUnitId ? persistedSettings : item))
            }));
            await saveUnitSettingsRequest(created.id, persistedSettings);
            await refreshFromApi();
          })
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear la unidad en el backend.");
          });
      },
      updateUnit(unitId, patch) {
        setState((current) => ({
          ...current,
          units: current.units.map((item) => (item.id === unitId ? { ...item, ...patch } : item))
        }));

        void updateUnitRequest(unitId, patch)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo actualizar la unidad.");
          });
      },
      deleteUnit(unitId) {
        setState((current) => ({
          ...current,
          selectedUnitId: current.selectedUnitId === unitId ? current.units.find((item) => item.id !== unitId)?.id ?? "" : current.selectedUnitId,
          units: current.units.filter((item) => item.id !== unitId),
          services: current.services.filter((item) => item.unitId !== unitId),
          locations: current.locations.filter((item) => item.unitId !== unitId),
          desks: current.desks.filter((item) => item.unitId !== unitId),
          ticketTypes: current.ticketTypes.filter((item) => item.unitId !== unitId),
          users: current.users.filter((item) => item.unitId !== unitId),
          unitSettings: current.unitSettings.filter((item) => item.unitId !== unitId)
        }));

        void deleteUnitRequest(unitId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar la unidad.");
            void refreshFromApi();
          });
      },
      addDepartment(name) {
        setState((current) => ({
          ...current,
          departments: [...current.departments, { id: buildId("dep"), name }]
        }));

        void createDepartmentRequest(name)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear el departamento en el backend.");
          });
      },
      updateDepartment(departmentId, name) {
        setState((current) => ({
          ...current,
          departments: current.departments.map((item) => (item.id === departmentId ? { ...item, name } : item))
        }));

        void updateDepartmentRequest(departmentId, name)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo actualizar el departamento.");
          });
      },
      deleteDepartment(departmentId) {
        setState((current) => ({
          ...current,
          departments: current.departments.filter((item) => item.id !== departmentId)
        }));

        void deleteDepartmentRequest(departmentId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar el departamento.");
            void refreshFromApi();
          });
      },
      addService(input) {
        const optimisticServiceId = buildId("srv");
        setState((current) => ({
          ...current,
          services: [...current.services, { id: optimisticServiceId, ...input }],
          unitSettings: current.unitSettings.map((item) =>
            item.unitId === input.unitId
              ? normalizeUnitSetting({
                  ...item,
                  triageServiceIds: item.triageServiceIds.includes(optimisticServiceId)
                    ? item.triageServiceIds
                    : [...item.triageServiceIds, optimisticServiceId],
                  panelRuntime: {
                    ...(item.panelRuntime ?? defaultPanelRuntime()),
                    visibleServiceIds: item.panelRuntime?.visibleServiceIds?.includes(optimisticServiceId)
                      ? item.panelRuntime.visibleServiceIds
                      : [...(item.panelRuntime?.visibleServiceIds ?? []), optimisticServiceId]
                  },
                  triageRuntime: {
                    ...(item.triageRuntime ?? defaultTriageRuntime()),
                    visibleServiceIds: item.triageRuntime?.visibleServiceIds?.includes(optimisticServiceId)
                      ? item.triageRuntime.visibleServiceIds
                      : [...(item.triageRuntime?.visibleServiceIds ?? []), optimisticServiceId]
                  }
                })
              : item
          )
        }));

        void createServiceRequest(input)
          .then(async (created) => {
            let settingsPatch:
              | {
                  triageServiceIds: string[];
                  panelRuntime: Partial<NonNullable<UnitSettings["panelRuntime"]>>;
                  triageRuntime: Partial<NonNullable<UnitSettings["triageRuntime"]>>;
                }
              | undefined;

            setState((current) => {
              const nextUnitSettings = current.unitSettings.map((item) => {
                if (item.unitId !== created.unitId) {
                  return item;
                }

                const triageServiceIds = item.triageServiceIds.map((itemId) => (itemId === optimisticServiceId ? created.id : itemId));
                const panelVisibleServiceIds = (item.panelRuntime?.visibleServiceIds ?? []).map((itemId) => (itemId === optimisticServiceId ? created.id : itemId));
                const triageVisibleServiceIds = (item.triageRuntime?.visibleServiceIds ?? []).map((itemId) => (itemId === optimisticServiceId ? created.id : itemId));

                settingsPatch = {
                  triageServiceIds,
                  panelRuntime: {
                    visibleServiceIds: panelVisibleServiceIds
                  },
                  triageRuntime: {
                    visibleServiceIds: triageVisibleServiceIds
                  }
                };

                return normalizeUnitSetting({
                  ...item,
                  triageServiceIds,
                  panelRuntime: {
                    ...(item.panelRuntime ?? defaultPanelRuntime()),
                    visibleServiceIds: panelVisibleServiceIds
                  },
                  triageRuntime: {
                    ...(item.triageRuntime ?? defaultTriageRuntime()),
                    visibleServiceIds: triageVisibleServiceIds
                  }
                });
              });

              return {
                ...current,
                services: current.services.map((item) => (item.id === optimisticServiceId ? created : item)),
                unitSettings: nextUnitSettings
              };
            });

            if (settingsPatch) {
              await saveUnitSettingsRequest(created.unitId, settingsPatch);
            }

            await refreshFromApi();
          })
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear el servicio en el backend.");
          });
      },
      addTicketType(input) {
        setState((current) => ({
          ...current,
          ticketTypes: [
            ...current.ticketTypes,
            {
              id: buildId("tt"),
              ...input
            }
          ]
        }));

        void createTicketTypeRequest(input)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear el tipo de ticket en el backend.");
          });
      },
      updateService(serviceId, patch) {
        setState((current) => ({
          ...current,
          services: current.services.map((item) => (item.id === serviceId ? { ...item, ...patch } : item))
        }));

        void updateServiceRequest(serviceId, patch)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo actualizar el servicio.");
          });
      },
      deleteService(serviceId) {
        setState((current) => ({
          ...current,
          services: current.services.filter((item) => item.id !== serviceId),
          unitSettings: current.unitSettings.map((item) =>
            normalizeUnitSetting({
              ...item,
              triageServiceIds: item.triageServiceIds.filter((entry) => entry !== serviceId),
              panelRuntime: {
                ...(item.panelRuntime ?? defaultPanelRuntime()),
                visibleServiceIds: (item.panelRuntime?.visibleServiceIds ?? []).filter((entry) => entry !== serviceId)
              },
              triageRuntime: {
                ...(item.triageRuntime ?? defaultTriageRuntime()),
                visibleServiceIds: (item.triageRuntime?.visibleServiceIds ?? []).filter((entry) => entry !== serviceId)
              }
            })
          ),
          desks: current.desks.map((item) => ({
            ...item,
            serviceIds: item.serviceIds.filter((entry) => entry !== serviceId)
          }))
        }));

        void deleteServiceRequest(serviceId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar el servicio.");
            void refreshFromApi();
          });
      },
      updateTicketType(ticketTypeId, patch) {
        setState((current) => ({
          ...current,
          ticketTypes: current.ticketTypes.map((item) => (item.id === ticketTypeId ? { ...item, ...patch } : item))
        }));

        void updateTicketTypeRequest(ticketTypeId, patch)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo actualizar el tipo de ticket.");
          });
      },
      deleteTicketType(ticketTypeId) {
        setState((current) => ({
          ...current,
          ticketTypes: current.ticketTypes.filter((item) => item.id !== ticketTypeId),
          services: current.services.map((item) => ({
            ...item,
            ticketTypeIds: item.ticketTypeIds.filter((entry) => entry !== ticketTypeId)
          }))
        }));

        void deleteTicketTypeRequest(ticketTypeId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar el tipo de ticket.");
            void refreshFromApi();
          });
      },
      addLocation(input) {
        setState((current) => ({
          ...current,
          locations: [...current.locations, { id: buildId("loc"), ...input }]
        }));

        void createLocationRequest(input)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear el local en el backend.");
          });
      },
      updateLocation(locationId, patch) {
        setState((current) => ({
          ...current,
          locations: current.locations.map((item) => (item.id === locationId ? { ...item, ...patch } : item))
        }));

        void updateLocationRequest(locationId, patch)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo actualizar el local.");
          });
      },
      deleteLocation(locationId) {
        setState((current) => ({
          ...current,
          locations: current.locations.filter((item) => item.id !== locationId),
          desks: current.desks.filter((item) => item.locationId !== locationId)
        }));

        void deleteLocationRequest(locationId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar el local.");
            void refreshFromApi();
          });
      },
      addDesk(input) {
        setState((current) => ({
          ...current,
          desks: [...current.desks, { id: buildId("desk"), ...input }]
        }));

        void createDeskRequest(input)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear el puesto en el backend.");
          });
      },
      updateDesk(deskId, patch) {
        setState((current) => ({
          ...current,
          desks: current.desks.map((item) => (item.id === deskId ? { ...item, ...patch } : item))
        }));

        void updateDeskRequest(deskId, patch)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo actualizar el puesto.");
          });
      },
      deleteDesk(deskId) {
        setState((current) => ({
          ...current,
          desks: current.desks.filter((item) => item.id !== deskId)
        }));

        void deleteDeskRequest(deskId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar el puesto.");
            void refreshFromApi();
          });
      },
      addProfile(input) {
        const code = slugCode(input.name);
        const permissions = defaultProfilePermissions(code, input.scope);
        setState((current) => ({
          ...current,
          profiles: [...current.profiles, normalizeProfile({ id: buildId("pf"), code, permissions, ...input })]
        }));

        void createProfileRequest({
          code,
          name: input.name,
          description: input.scope,
          permissions
        })
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear el perfil en el backend.");
          });
      },
      updateProfile(profileId, patch) {
        setState((current) => ({
          ...current,
          profiles: current.profiles.map((item) =>
            item.id === profileId
              ? normalizeProfile({
                  ...item,
                  name: patch.name ?? item.name,
                  scope: patch.scope ?? item.scope,
                  permissions: patch.permissions ?? item.permissions
                })
              : item
          )
        }));

        void updateProfileRequest(profileId, {
          name: patch.name,
          description: patch.scope,
          permissions: patch.permissions
        })
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo actualizar el perfil.");
          });
      },
      deleteProfile(profileId) {
        setState((current) => ({
          ...current,
          profiles: current.profiles.filter((item) => item.id !== profileId)
        }));

        void deleteProfileRequest(profileId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar el perfil.");
            void refreshFromApi();
          });
      },
      addConnector(input) {
        setState((current) => ({
          ...current,
          connectors: [...current.connectors, { id: buildId("conn"), ...input }]
        }));

        void createConnectorRequest(input)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear el conector.");
          });
      },
      updateConnector(connectorId, patch) {
        setState((current) => ({
          ...current,
          connectors: current.connectors.map((item) => (item.id === connectorId ? { ...item, ...patch } : item))
        }));

        void updateConnectorRequest(connectorId, patch)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo actualizar el conector.");
          });
      },
      deleteConnector(connectorId) {
        setState((current) => ({
          ...current,
          connectors: current.connectors.filter((item) => item.id !== connectorId)
        }));

        void deleteConnectorRequest(connectorId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar el conector.");
            void refreshFromApi();
          });
      },
      addUser(input) {
        setState((current) => ({
          ...current,
          users: [
            ...current.users,
            normalizeUser({
              id: buildId("usr"),
              name: input.name,
              email: input.email,
              profile: input.profile,
              profileCode: current.profiles.find((item) => item.id === (input.profileId ?? currentProfileId(current.profiles, input.profile)))?.code ?? "UNIT_ADMIN",
              unitId: input.unitId ?? null
            })
          ]
        }));

        void createUserRequest({
          email: input.email,
          fullName: input.name,
          profileId: input.profileId ?? currentProfileId(state.profiles, input.profile),
          unitId: input.unitId,
          locale: "es",
          password: input.password
        })
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear el usuario en el backend.");
          });
      },
      updateUser(userId, patch) {
        setState((current) => ({
          ...current,
          users: current.users.map((item) =>
            item.id === userId
              ? normalizeUser({
                  ...item,
                  name: patch.name ?? item.name,
                  email: patch.email ?? item.email,
                  unitId: patch.unitId === undefined ? item.unitId : patch.unitId,
                  profile: patch.profileId
                    ? current.profiles.find((profile) => profile.id === patch.profileId)?.name ?? item.profile
                    : item.profile,
                  profileCode: patch.profileId
                    ? current.profiles.find((profile) => profile.id === patch.profileId)?.code ?? item.profileCode
                    : item.profileCode
                })
              : item
          )
        }));

        void updateUserRequest({
          id: userId,
          email: patch.email,
          fullName: patch.name,
          profileId: patch.profileId,
          unitId: patch.unitId,
          password: patch.password,
          active: patch.active
        })
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo actualizar el usuario.");
          });
      },
      deleteUser(userId) {
        setState((current) => ({
          ...current,
          users: current.users.filter((item) => item.id !== userId)
        }));

        void deleteUserRequest(userId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar el usuario.");
            void refreshFromApi();
          });
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

        void savePrintTemplateRequest(template.id, template)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo guardar la plantilla de impresion.");
          });
      },
      addPrintTemplate(template) {
        const optimisticId = buildId("tpl");
        setState((current) => ({
          ...current,
          printTemplates: [...current.printTemplates, { id: optimisticId, ...template }],
          unitSettings: current.unitSettings.map((item) =>
            item.unitId === current.selectedUnitId
              ? normalizeUnitSetting({
                  ...item,
                  printTemplateId: optimisticId
                })
              : item
          )
        }));

        void createPrintTemplateRequest(template)
          .then((created) =>
            saveUnitSettingsRequest(state.selectedUnitId, { printTemplateId: created.id }).then(() => refreshFromApi())
          )
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear la plantilla de impresion.");
            void refreshFromApi();
          });
      },
      deletePrintTemplate(templateId) {
        setState((current) => {
          const remainingTemplates = current.printTemplates.filter((item) => item.id !== templateId);
          const fallbackTemplate = remainingTemplates[0];

          return {
            ...current,
            printTemplates: remainingTemplates,
            unitSettings: current.unitSettings.map((item) =>
              item.printTemplateId === templateId
                ? normalizeUnitSetting({
                    ...item,
                    printTemplateId: fallbackTemplate?.id
                  })
                : item
            )
          };
        });

        void deletePrintTemplateRequest(templateId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar la plantilla de impresion.");
            void refreshFromApi();
          });
      },
      savePanelPlaylist(playlist) {
        setState((current) => {
          const exists = current.panelPlaylists.some((item) => item.id === playlist.id);
          return {
            ...current,
            panelPlaylists: exists
              ? current.panelPlaylists.map((item) => (item.id === playlist.id ? playlist : item))
              : [...current.panelPlaylists, playlist]
          };
        });

        void savePanelPlaylistRequest(playlist.id, playlist)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo guardar la playlist del panel.");
          });
      },
      addPanelPlaylist(playlist) {
        const optimisticId = buildId("playlist");
        setState((current) => ({
          ...current,
          panelPlaylists: [...current.panelPlaylists, { id: optimisticId, ...playlist }]
        }));

        void createPanelPlaylistRequest(playlist)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear la playlist del panel.");
            void refreshFromApi();
          });
      },
      deletePanelPlaylist(playlistId) {
        setState((current) => ({
          ...current,
          panelPlaylists: current.panelPlaylists.filter((item) => item.id !== playlistId),
          unitSettings: current.unitSettings.map((item) =>
            item.panelPlaylistId === playlistId
              ? normalizeUnitSetting({
                  ...item,
                  panelPlaylistId: undefined
                })
              : item
          )
        }));

        void deletePanelPlaylistRequest(playlistId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar la playlist del panel.");
            void refreshFromApi();
          });
      },
      addPanelProfile(profile) {
        const optimisticProfile: PanelProfile = {
          id: buildId("pp"),
          ...profile
        };

        setState((current) => ({
          ...current,
          panelProfiles: [...current.panelProfiles, optimisticProfile],
          panelProfile: optimisticProfile
        }));

        void createPanelProfileRequest(profile)
          .then((created) => {
            setState((current) => ({
              ...current,
              panelProfiles: current.panelProfiles.map((item) => (item.id === optimisticProfile.id ? created : item)),
              panelProfile: current.panelProfile.id === optimisticProfile.id ? created : current.panelProfile,
              unitSettings: current.unitSettings.map((item) =>
                item.unitId === current.selectedUnitId
                  ? normalizeUnitSetting({
                      ...item,
                      panelProfileId: created.id
                    })
                  : item
              )
            }));

            return saveUnitSettingsRequest(state.selectedUnitId, { panelProfileId: created.id });
          })
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo crear el perfil del panel.");
            void refreshFromApi();
          });
      },
      deletePanelProfile(profileId) {
        setState((current) => {
          const remainingProfiles = current.panelProfiles.filter((item) => item.id !== profileId);
          const fallbackProfile = remainingProfiles[0] ?? current.panelProfile;

          return {
            ...current,
            panelProfiles: remainingProfiles,
            panelProfile: current.panelProfile.id === profileId ? fallbackProfile : current.panelProfile,
            unitSettings: current.unitSettings.map((item) =>
              item.panelProfileId === profileId
                ? normalizeUnitSetting({
                    ...item,
                    panelProfileId: fallbackProfile?.id
                  })
                : item
            )
          };
        });

        void deletePanelProfileRequest(profileId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar el perfil del panel.");
            void refreshFromApi();
          });
      },
      addMediaAsset(asset) {
        setState((current) => ({
          ...current,
          mediaAssets: [...current.mediaAssets, { id: buildId("media"), ...asset }]
        }));

        void createMediaAssetRequest(asset)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo guardar el activo multimedia.");
          });
      },
      deleteMediaAsset(assetId) {
        setState((current) => ({
          ...current,
          mediaAssets: current.mediaAssets.filter((item) => item.id !== assetId),
          unitSettings: current.unitSettings.map((item) =>
            item.panelPrimaryMediaId === assetId
              ? normalizeUnitSetting({
                  ...item,
                  panelPrimaryMediaId: undefined
                })
              : item
          ),
          panelPlaylists: current.panelPlaylists.map((playlist) => ({
            ...playlist,
            items: playlist.items.filter((item) => item.assetId !== assetId)
          }))
        }));

        void deleteMediaAssetRequest(assetId)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo eliminar el medio.");
            void refreshFromApi();
          });
      },
      updatePanelProfile(patch: Partial<Omit<PanelProfile, "theme">> & { theme?: Partial<PanelProfile["theme"]> }) {
        setState((current) => ({
          ...current,
          panelProfiles: current.panelProfiles.map((item) =>
            item.id === current.panelProfile.id
              ? {
                  ...item,
                  ...patch,
                  theme: {
                    ...item.theme,
                    ...(patch.theme ?? {})
                  }
                }
              : item
          ),
          panelProfile: {
            ...current.panelProfile,
            ...patch,
            theme: {
              ...current.panelProfile.theme,
              ...(patch.theme ?? {})
            }
          }
        }));

        void savePanelProfileRequest(state.panelProfile.id, patch)
          .then(() => refreshFromApi())
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "No se pudo guardar el perfil del panel.");
          });
      },
      updateUnitSettings(unitId, patch) {
        setState((current) => {
          const nextUnitSettings = current.unitSettings.map((item) =>
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
          );

          return {
            ...current,
            unitSettings: nextUnitSettings,
            panelProfile: patch.panelProfileId
              ? resolvePanelProfileForUnit(current.panelProfiles, nextUnitSettings, unitId, current.panelProfile)
              : current.panelProfile
          };
        });

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
          void refreshFromApi();

          return createdTicket;
        } catch (error) {
          setSyncError(error instanceof Error ? error.message : "No se pudo emitir el ticket.");
          throw error;
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
          void refreshFromApi();

          return nextCall;
        } catch (error) {
          setSyncError(error instanceof Error ? error.message : "No se pudo llamar el siguiente ticket.");
          throw error;
        }
      },
      async finishTicket(ticketId) {
        try {
          await finishTicketRequest(ticketId);
          setState((current) => ({
            ...current,
            recentTickets: current.recentTickets.map((item) =>
              item.id === ticketId ? { ...item, status: "finished" } : item
            ),
            currentCalls: current.currentCalls.filter((item) => item.ticketId !== ticketId)
          }));
          void refreshFromApi();
          return;
        } catch (error) {
          setSyncError(error instanceof Error ? error.message : "No se pudo finalizar el ticket.");
          throw error;
        }
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
