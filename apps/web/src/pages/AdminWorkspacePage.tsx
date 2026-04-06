import type { Desk, PanelProfile, SupportedLocale, Ticket } from "@ticket-v2/contracts";
import { useEffect, useMemo, useState } from "react";
import { canAccessSection, resolveAccess } from "../lib/access";
import { fetchOperationalSnapshot, searchAttendanceTicket, type AttendanceSearchResult } from "../lib/api";
import type { AuthUser } from "../lib/auth";
import { translate } from "../i18n";
import { useTicketSystem } from "../store";

type AdminSection = "overview" | "catalog" | "settings" | "users" | "attendance" | "media" | "print" | "panel" | "integrations";
type SettingsTab = "services" | "triage" | "attendance";

interface AdminWorkspacePageProps {
  authUser: AuthUser | null;
  locale: SupportedLocale;
  section: AdminSection;
}

function statusLabel(locale: SupportedLocale, status: string) {
  if (status === "waiting" || status === "called" || status === "in_service" || status === "finished" || status === "redirected") {
    return translate(locale, status);
  }

  return status;
}

export function AdminWorkspacePage({ authUser, locale, section }: AdminWorkspacePageProps) {
  const {
    addDepartment,
    addDesk,
    addLocation,
    addMediaAsset,
    addConnector,
    addPanelProfile,
    addPanelPlaylist,
    addPrintTemplate,
    addProfile,
    addService,
    addTicketType,
    addUnit,
    addUser,
    callNextTicket,
    connectors,
    currentCalls,
    deleteDepartment,
    deleteDesk,
    deleteConnector,
    deleteLocation,
    deleteMediaAsset,
    deletePanelProfile,
    deletePanelPlaylist,
    deleteProfile,
    deletePrintTemplate,
    deleteService,
    deleteTicketType,
    deleteUnit,
    deleteUser,
    departments,
    desks,
    finishTicket,
    locations,
    mediaAssets,
    panelProfiles,
    panelPlaylists,
    panelProfile,
    printTemplates,
    profiles,
    recentTickets,
    savePrintTemplate,
    savePanelPlaylist,
    selectedUnitId,
    services,
    setSelectedUnit,
    ticketTypes,
    unitSettings,
    units,
    updateDepartment,
    updateDesk,
    updateConnector,
    updateLocation,
    updateProfile,
    updateService,
    updateTicketType,
    updatePanelProfile,
    updateUnit,
    updateUnitSettings,
    updateUser,
    users
  } = useTicketSystem();

  const [settingsTab, setSettingsTab] = useState<SettingsTab>("services");
  const [newUnitName, setNewUnitName] = useState("");
  const [editingUnitName, setEditingUnitName] = useState("");
  const [editingUnitCode, setEditingUnitCode] = useState("");
  const [editingUnitBrand, setEditingUnitBrand] = useState("");
  const [editingUnitLocale, setEditingUnitLocale] = useState<SupportedLocale>("es");
  const [editingUnitLogoUrl, setEditingUnitLogoUrl] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [editingDepartmentId, setEditingDepartmentId] = useState("");
  const [editingDepartmentName, setEditingDepartmentName] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCode, setNewServiceCode] = useState("");
  const [editingServiceId, setEditingServiceId] = useState("");
  const [editingServiceName, setEditingServiceName] = useState("");
  const [editingServiceCode, setEditingServiceCode] = useState("");
  const [editingServiceDepartmentId, setEditingServiceDepartmentId] = useState("");
  const [editingServiceAllowPriority, setEditingServiceAllowPriority] = useState(true);
  const [editingServiceTicketTypeIds, setEditingServiceTicketTypeIds] = useState<string[]>([]);
  const [newTicketTypeName, setNewTicketTypeName] = useState("");
  const [newTicketTypeCode, setNewTicketTypeCode] = useState("");
  const [newTicketTypePrefix, setNewTicketTypePrefix] = useState("");
  const [newTicketTypeColor, setNewTicketTypeColor] = useState("#1f57b8");
  const [newTicketTypeMessage, setNewTicketTypeMessage] = useState("");
  const [editingTicketTypeId, setEditingTicketTypeId] = useState("");
  const [editingTicketTypeName, setEditingTicketTypeName] = useState("");
  const [editingTicketTypeCode, setEditingTicketTypeCode] = useState("");
  const [editingTicketTypePrefix, setEditingTicketTypePrefix] = useState("");
  const [editingTicketTypeMessage, setEditingTicketTypeMessage] = useState("");
  const [editingTicketTypeAllowPanel, setEditingTicketTypeAllowPanel] = useState(true);
  const [editingTicketTypeAllowPrint, setEditingTicketTypeAllowPrint] = useState(true);
  const [editingTicketTypeRequireClient, setEditingTicketTypeRequireClient] = useState(false);
  const [editingTicketTypeRequireDocument, setEditingTicketTypeRequireDocument] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [editingLocationId, setEditingLocationId] = useState("");
  const [editingLocationName, setEditingLocationName] = useState("");
  const [editingLocationCode, setEditingLocationCode] = useState("");
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileScope, setNewProfileScope] = useState("Operacion");
  const [editingProfileId, setEditingProfileId] = useState("");
  const [editingProfileName, setEditingProfileName] = useState("");
  const [editingProfileScope, setEditingProfileScope] = useState("Operacion");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [editingUserName, setEditingUserName] = useState("");
  const [editingUserEmail, setEditingUserEmail] = useState("");
  const [editingUserProfileId, setEditingUserProfileId] = useState("");
  const [editingUserPassword, setEditingUserPassword] = useState("");
  const [newMediaTitle, setNewMediaTitle] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaKind, setNewMediaKind] = useState("image");
  const [newPanelProfileName, setNewPanelProfileName] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newDeskName, setNewDeskName] = useState("");
  const [newDeskOperator, setNewDeskOperator] = useState(authUser?.fullName ?? "");
  const [editingDeskId, setEditingDeskId] = useState("");
  const [editingDeskName, setEditingDeskName] = useState("");
  const [editingDeskOperator, setEditingDeskOperator] = useState("");
  const [editingDeskLocationId, setEditingDeskLocationId] = useState("");
  const [editingDeskServiceIds, setEditingDeskServiceIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(printTemplates[0]?.id ?? "");
  const [selectedPanelProfileId, setSelectedPanelProfileId] = useState(panelProfile.id);
  const [newConnectorName, setNewConnectorName] = useState("");
  const [newConnectorCode, setNewConnectorCode] = useState("");
  const [newConnectorType, setNewConnectorType] = useState("Webhook");
  const [newConnectorStatus, setNewConnectorStatus] = useState("Draft");
  const [newConnectorEndpoint, setNewConnectorEndpoint] = useState("");
  const [newConnectorEvents, setNewConnectorEvents] = useState("ticket.emitted");
  const [editingConnectorId, setEditingConnectorId] = useState("");
  const [editingConnectorName, setEditingConnectorName] = useState("");
  const [editingConnectorCode, setEditingConnectorCode] = useState("");
  const [editingConnectorType, setEditingConnectorType] = useState("Webhook");
  const [editingConnectorStatus, setEditingConnectorStatus] = useState("Draft");
  const [editingConnectorEndpoint, setEditingConnectorEndpoint] = useState("");
  const [editingConnectorEnabled, setEditingConnectorEnabled] = useState(true);
  const [editingConnectorEvents, setEditingConnectorEvents] = useState("ticket.emitted");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceActionError, setAttendanceActionError] = useState("");
  const [remoteAttendanceSummary, setRemoteAttendanceSummary] = useState<Array<{
    serviceId: string;
    serviceName: string;
    waitingCount: number;
    inServiceCount: number;
    calledCount: number;
    sequences: string[];
  }> | null>(null);
  const [remoteAttendanceTicket, setRemoteAttendanceTicket] = useState<AttendanceSearchResult | null>(null);
  const [remoteDeskQueues, setRemoteDeskQueues] = useState<Record<string, Array<{ id: string; sequence: string; serviceId: string; service?: { id: string; name: string } | null }>>>({});
  const [remoteDeskCalls, setRemoteDeskCalls] = useState<Record<string, { ticketId: string; sequence: string; counter: string } | null>>({});
  const [remoteRecentTickets, setRemoteRecentTickets] = useState<Array<Ticket & { service?: { id: string; name: string } | null; ticketType?: { id: string; name: string } | null }>>([]);

  const access = resolveAccess(authUser);
  const availableUnits = access.restrictToOwnUnit && authUser?.unitId ? units.filter((item) => item.id === authUser.unitId) : units;
  const currentUnit = availableUnits.find((item) => item.id === selectedUnitId) ?? availableUnits[0] ?? units[0];
  const currentSettings = unitSettings.find((item) => item.unitId === currentUnit?.id) ?? unitSettings[0];
  const triageRuntime = currentSettings?.triageRuntime;
  const panelRuntime = currentSettings?.panelRuntime;
  const selectedTemplate = printTemplates.find((item) => item.id === (currentSettings?.printTemplateId ?? selectedTemplateId)) ?? printTemplates[0];
  const currentPlaylist = panelPlaylists.find((item) => item.id === currentSettings?.panelPlaylistId) ?? panelPlaylists.find((item) => item.unitId === currentUnit?.id) ?? panelPlaylists[0];
  const currentPanelProfile = panelProfiles.find((item) => item.id === (currentSettings?.panelProfileId ?? selectedPanelProfileId))
    ?? panelProfiles[0]
    ?? panelProfile;
  const unitServices = services.filter((item) => item.unitId === currentUnit?.id);
  const unitTicketTypes = ticketTypes.filter((item) => !item.unitId || item.unitId === currentUnit?.id);
  const unitLocations = locations.filter((item) => item.unitId === currentUnit?.id);
  const unitDesks = desks.filter((item) => item.unitId === currentUnit?.id);
  const unitMediaAssets = mediaAssets.filter((item) => !item.unitId || item.unitId === currentUnit?.id);
  const operatorDesks = unitDesks.filter((item) => item.operatorName === authUser?.fullName);
  const visibleDesks = operatorDesks.length ? operatorDesks : unitDesks;
  const selectedProfile = profiles.find((item) => item.id === selectedProfileId) ?? profiles[0];
  const visibleUsers = access.restrictToOwnUnit && currentUnit ? users.filter((item) => item.unitId === currentUnit.id) : users;
  const visibleConnectors = connectors.filter((item) => !item.unitId || item.unitId === currentUnit?.id);

  const serviceMap = useMemo(() => new Map(services.map((item) => [item.id, item])), [services]);
  const locationMap = useMemo(() => new Map(locations.map((item) => [item.id, item])), [locations]);
  const unitRecentTickets = recentTickets.filter((item) => item.unitId === currentUnit?.id);
  const displayRecentTickets: Array<Ticket & { service?: { id: string; name: string } | null; ticketType?: { id: string; name: string } | null }> =
    remoteRecentTickets.length ? remoteRecentTickets : unitRecentTickets;
  const localAttendanceServiceSummary = unitServices.map((service) => {
    const serviceTickets = displayRecentTickets.filter((ticket) => ticket.serviceId === service.id);
    const waiting = serviceTickets.filter((ticket) => ticket.status === "waiting");
    const inService = serviceTickets.filter((ticket) => ticket.status === "in_service");
    const called = serviceTickets.filter((ticket) => ticket.status === "called");

    return {
      serviceId: service.id,
      serviceName: service.name,
      waitingCount: waiting.length,
      inServiceCount: inService.length,
      calledCount: called.length,
      sequences: waiting.slice(0, 6).map((ticket) => ticket.sequence)
    };
  });
  const attendanceServiceSummary = remoteAttendanceSummary ?? localAttendanceServiceSummary;
  const searchedTicket = remoteAttendanceTicket
    ? {
        sequence: remoteAttendanceTicket.ticket.sequence,
        status: remoteAttendanceTicket.ticket.status,
        serviceName: remoteAttendanceTicket.service?.name
          ?? (remoteAttendanceTicket.ticket.metadata.serviceName as string | undefined)
          ?? serviceMap.get(remoteAttendanceTicket.ticket.serviceId)?.name
          ?? "Servicio",
        ticketTypeName: remoteAttendanceTicket.ticketType?.name
          ?? (remoteAttendanceTicket.ticket.metadata.ticketTypeName as string | undefined)
          ?? "Ticket",
        activeCall: remoteAttendanceTicket.activeCall
      }
    : attendanceSearch.trim()
      ? (() => {
          const localTicket = displayRecentTickets.find((item) => item.sequence.toUpperCase() === attendanceSearch.trim().toUpperCase()) ?? null;
          return localTicket
            ? {
                sequence: localTicket.sequence,
                status: localTicket.status,
                serviceName: (localTicket.metadata.serviceName as string | undefined) ?? serviceMap.get(localTicket.serviceId)?.name ?? "Servicio",
                ticketTypeName: (localTicket.metadata.ticketTypeName as string | undefined) ?? "Ticket",
                activeCall: currentCalls.find((item) => item.ticketId === localTicket.id) ?? null
              }
            : null;
        })()
      : null;

  function confirmRemoval(label: string) {
    return window.confirm(`Se eliminara ${label}. Esta accion no se puede deshacer.`);
  }

  function parseConnectorEvents(value: string) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  useEffect(() => {
    let active = true;

    async function loadOperationalSnapshot() {
      if (section !== "attendance" || !visibleDesks.length) {
        return;
      }

      try {
        const payload = await fetchOperationalSnapshot(currentUnit?.id);
        if (!active) {
          return;
        }

        setRemoteAttendanceSummary(
          payload.monitor.map((item) => ({
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            waitingCount: item.waitingCount,
            inServiceCount: item.inServiceCount,
            calledCount: item.calledCount,
            sequences: item.waitingSequences
          }))
        );
        setRemoteRecentTickets(payload.recentTickets);
        setRemoteDeskQueues(
          payload.desks.reduce<Record<string, Array<{ id: string; sequence: string; serviceId: string; service?: { id: string; name: string } | null }>>>((acc, item) => {
            acc[item.desk.id] = item.queue;
            return acc;
          }, {})
        );
        setRemoteDeskCalls(
          payload.desks.reduce<Record<string, { ticketId: string; sequence: string; counter: string } | null>>((acc, item) => {
            acc[item.desk.id] = item.currentCall
              ? {
                  ticketId: item.currentCall.ticketId,
                  sequence: item.currentCall.sequence,
                  counter: item.currentCall.counter
                }
              : null;
            return acc;
          }, {})
        );
      } catch (_error) {
        if (active) {
          setRemoteAttendanceSummary(null);
          setRemoteRecentTickets([]);
          setRemoteDeskQueues({});
          setRemoteDeskCalls({});
        }
      }
    }

    if (section === "attendance") {
      void loadOperationalSnapshot();
      const timer = window.setInterval(() => {
        void loadOperationalSnapshot();
      }, 10000);

      return () => {
        active = false;
        window.clearInterval(timer);
      };
    }

    setRemoteAttendanceSummary(null);
    setRemoteRecentTickets([]);
    setRemoteDeskQueues({});
    setRemoteDeskCalls({});
    return () => {
      active = false;
    };
  }, [currentUnit?.id, section, visibleDesks.length]);

  useEffect(() => {
    let active = true;
    const normalized = attendanceSearch.trim();

    if (section !== "attendance" || !normalized) {
      setRemoteAttendanceTicket(null);
      return () => {
        active = false;
      };
    }

    const timer = window.setTimeout(() => {
      void searchAttendanceTicket(normalized)
        .then((payload) => {
          if (active) {
            setRemoteAttendanceTicket(payload);
          }
        })
        .catch(() => {
          if (active) {
            setRemoteAttendanceTicket(null);
          }
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [attendanceSearch, section]);

  useEffect(() => {
    setSelectedTemplateId(currentSettings?.printTemplateId ?? printTemplates[0]?.id ?? "");
  }, [currentSettings?.printTemplateId, printTemplates]);

  useEffect(() => {
    setSelectedPanelProfileId(currentSettings?.panelProfileId ?? panelProfile.id);
  }, [currentSettings?.panelProfileId, panelProfile.id]);

  useEffect(() => {
    if (!currentUnit) {
      setEditingUnitName("");
      setEditingUnitCode("");
      setEditingUnitBrand("");
      setEditingUnitLocale("es");
      setEditingUnitLogoUrl("");
      return;
    }

    setEditingUnitName(currentUnit.name);
    setEditingUnitCode(currentUnit.code);
    setEditingUnitBrand(currentUnit.brandName);
    setEditingUnitLocale(currentUnit.locale);
    setEditingUnitLogoUrl(currentUnit.logoUrl ?? "");
  }, [currentUnit]);

  useEffect(() => {
    const nextDepartment = departments.find((item) => item.id === editingDepartmentId) ?? departments[0] ?? null;
    if (!nextDepartment) {
      setEditingDepartmentId("");
      setEditingDepartmentName("");
      return;
    }

    setEditingDepartmentId(nextDepartment.id);
    setEditingDepartmentName(nextDepartment.name);
  }, [departments, editingDepartmentId]);

  useEffect(() => {
    const nextService = unitServices.find((item) => item.id === editingServiceId) ?? unitServices[0] ?? null;
    if (!nextService) {
      setEditingServiceId("");
      setEditingServiceName("");
      setEditingServiceCode("");
      setEditingServiceDepartmentId(departments[0]?.id ?? "");
      setEditingServiceAllowPriority(true);
      setEditingServiceTicketTypeIds([]);
      return;
    }

    setEditingServiceId(nextService.id);
    setEditingServiceName(nextService.name);
    setEditingServiceCode(nextService.code);
    setEditingServiceDepartmentId(nextService.departmentId);
    setEditingServiceAllowPriority(nextService.allowPriority);
    setEditingServiceTicketTypeIds(nextService.ticketTypeIds ?? []);
  }, [departments, editingServiceId, unitServices]);

  useEffect(() => {
    const nextTicketType = unitTicketTypes.find((item) => item.id === editingTicketTypeId) ?? unitTicketTypes[0] ?? null;
    if (!nextTicketType) {
      setEditingTicketTypeId("");
      setEditingTicketTypeName("");
      setEditingTicketTypeCode("");
      setEditingTicketTypePrefix("");
      setEditingTicketTypeMessage("");
      setEditingTicketTypeAllowPanel(true);
      setEditingTicketTypeAllowPrint(true);
      setEditingTicketTypeRequireClient(false);
      setEditingTicketTypeRequireDocument(false);
      return;
    }

    setEditingTicketTypeId(nextTicketType.id);
    setEditingTicketTypeName(nextTicketType.name);
    setEditingTicketTypeCode(nextTicketType.code);
    setEditingTicketTypePrefix(nextTicketType.prefix ?? "");
    setEditingTicketTypeMessage(nextTicketType.triageMessage ?? "");
    setEditingTicketTypeAllowPanel(nextTicketType.allowPanel);
    setEditingTicketTypeAllowPrint(nextTicketType.allowPrint);
    setEditingTicketTypeRequireClient(nextTicketType.requireClient);
    setEditingTicketTypeRequireDocument(nextTicketType.requireDocument);
  }, [editingTicketTypeId, unitTicketTypes]);

  useEffect(() => {
    const nextLocation = unitLocations.find((item) => item.id === editingLocationId) ?? unitLocations[0] ?? null;
    if (!nextLocation) {
      setEditingLocationId("");
      setEditingLocationName("");
      setEditingLocationCode("");
      return;
    }

    setEditingLocationId(nextLocation.id);
    setEditingLocationName(nextLocation.name);
    setEditingLocationCode(nextLocation.code);
  }, [editingLocationId, unitLocations]);

  useEffect(() => {
    const nextDesk = unitDesks.find((item) => item.id === editingDeskId) ?? unitDesks[0] ?? null;
    if (!nextDesk) {
      setEditingDeskId("");
      setEditingDeskName("");
      setEditingDeskOperator("");
      setEditingDeskLocationId(unitLocations[0]?.id ?? "");
      setEditingDeskServiceIds([]);
      return;
    }

    setEditingDeskId(nextDesk.id);
    setEditingDeskName(nextDesk.name);
    setEditingDeskOperator(nextDesk.operatorName);
    setEditingDeskLocationId(nextDesk.locationId);
    setEditingDeskServiceIds(nextDesk.serviceIds);
  }, [editingDeskId, unitDesks, unitLocations]);

  useEffect(() => {
    const nextProfile = profiles.find((item) => item.id === editingProfileId) ?? profiles[0] ?? null;
    if (!nextProfile) {
      setEditingProfileId("");
      setEditingProfileName("");
      setEditingProfileScope("Operacion");
      return;
    }

    setEditingProfileId(nextProfile.id);
    setEditingProfileName(nextProfile.name);
    setEditingProfileScope(nextProfile.scope);
  }, [editingProfileId, profiles]);

  useEffect(() => {
    const nextUser = visibleUsers.find((item) => item.id === editingUserId) ?? visibleUsers[0] ?? null;
    if (!nextUser) {
      setEditingUserId("");
      setEditingUserName("");
      setEditingUserEmail("");
      setEditingUserProfileId(profiles[0]?.id ?? "");
      setEditingUserPassword("");
      return;
    }

    setEditingUserId(nextUser.id);
    setEditingUserName(nextUser.name);
    setEditingUserEmail(nextUser.email);
    setEditingUserProfileId(profiles.find((item) => item.code === nextUser.profileCode || item.name === nextUser.profile)?.id ?? profiles[0]?.id ?? "");
    setEditingUserPassword("");
  }, [editingUserId, profiles, visibleUsers]);

  function toggleTriageService(serviceId: string) {
    if (!currentSettings) {
      return;
    }

    const triageServiceIds = currentSettings.triageServiceIds.includes(serviceId)
      ? currentSettings.triageServiceIds.filter((item) => item !== serviceId)
      : [...currentSettings.triageServiceIds, serviceId];

    updateUnitSettings(currentSettings.unitId, { triageServiceIds });
  }

  async function handleCallNext(deskId: string) {
    setAttendanceActionError("");
    try {
      await callNextTicket({ locale, deskId });
    } catch (error) {
      setAttendanceActionError(error instanceof Error ? error.message : "No se pudo llamar el siguiente ticket.");
    }
  }

  async function handleFinishTicket(ticketId: string) {
    setAttendanceActionError("");
    try {
      await finishTicket(ticketId);
    } catch (error) {
      setAttendanceActionError(error instanceof Error ? error.message : "No se pudo finalizar el ticket.");
    }
  }

  function activeCallForDesk(desk: Desk) {
    return currentCalls.find((call) => {
      if (call.deskId !== desk.id) {
        return false;
      }

      const ticket = recentTickets.find((item) => item.id === call.ticketId);
      return ticket?.status === "in_service";
    });
  }

  function queueForDesk(desk: Desk) {
    return recentTickets.filter((ticket) => ticket.status === "waiting" && desk.serviceIds.includes(ticket.serviceId));
  }

  if (!canAccessSection(access, section)) {
    return (
      <section className="page-grid">
        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "accessDeniedTitle")}</h3>
            <span>{translate(locale, "accessDeniedSubtitle")}</span>
          </div>
          <p className="empty-copy">{translate(locale, "accessDeniedBody")}</p>
        </article>
      </section>
    );
  }

  if (section === "catalog") {
    return (
      <section className="page-grid">
        <div className="content-grid three-up">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "unitsTitle")}</h3>
              <span>{translate(locale, "unitsSubtitle")}</span>
            </div>
            <div className="list-table">
              {availableUnits.map((item) => (
                <button
                  key={item.id}
                  className={item.id === currentUnit?.id ? "selectable-row active" : "selectable-row"}
                  onClick={() => setSelectedUnit(item.id)}
                  type="button"
                >
                  <strong>{item.name}</strong>
                  <span>{item.code}</span>
                </button>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                {translate(locale, "unitsTitle")}
                <input value={newUnitName} onChange={(event) => setNewUnitName(event.target.value)} placeholder="Nueva unidad" />
              </label>
              <button
                className="primary-button"
                disabled={!access.isSuperadmin}
                onClick={() => {
                  if (!newUnitName.trim()) {
                    return;
                  }
                  if (access.isSuperadmin) {
                    addUnit({
                      name: newUnitName,
                      code: newUnitName.toUpperCase().replace(/\s+/g, "_"),
                      brandName: "SAMAP",
                      locale: "es",
                      logoUrl: currentUnit?.logoUrl
                    });
                    setNewUnitName("");
                  }
                }}
                type="button"
              >
                {access.isSuperadmin ? "Agregar unidad" : translate(locale, "unitLocked")}
              </button>
              {currentUnit && access.isSuperadmin ? (
                <>
                  <label>
                    Editar nombre
                    <input value={editingUnitName} onChange={(event) => setEditingUnitName(event.target.value)} />
                  </label>
                  <label>
                    Editar codigo
                    <input value={editingUnitCode} onChange={(event) => setEditingUnitCode(event.target.value)} />
                  </label>
                  <label>
                    Brand
                    <input value={editingUnitBrand} onChange={(event) => setEditingUnitBrand(event.target.value)} />
                  </label>
                  <label>
                    Locale
                    <select value={editingUnitLocale} onChange={(event) => setEditingUnitLocale(event.target.value as SupportedLocale)}>
                      <option value="es">ES</option>
                      <option value="en">EN</option>
                      <option value="pt">PT</option>
                    </select>
                  </label>
                  <label>
                    Logo URL
                    <input value={editingUnitLogoUrl} onChange={(event) => setEditingUnitLogoUrl(event.target.value)} />
                  </label>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (!currentUnit || !editingUnitName.trim() || !editingUnitCode.trim() || !editingUnitBrand.trim()) {
                        return;
                      }
                      updateUnit(currentUnit.id, {
                        name: editingUnitName.trim(),
                        code: editingUnitCode.trim().toUpperCase(),
                        brandName: editingUnitBrand.trim(),
                        locale: editingUnitLocale,
                        logoUrl: editingUnitLogoUrl.trim() || undefined
                      });
                    }}
                    type="button"
                  >
                    Guardar unidad
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (!currentUnit || !confirmRemoval(`la unidad ${currentUnit.name}`)) {
                        return;
                      }
                      deleteUnit(currentUnit.id);
                    }}
                    type="button"
                  >
                    Eliminar unidad
                  </button>
                </>
              ) : null}
            </div>
          </article>

          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "departmentsTitle")}</h3>
              <span>{translate(locale, "departmentsSubtitle")}</span>
            </div>
            <div className="list-table">
              {departments.map((item) => (
                <button
                  key={item.id}
                  className={item.id === editingDepartmentId ? "selectable-row active" : "selectable-row"}
                  onClick={() => setEditingDepartmentId(item.id)}
                  type="button"
                >
                  <strong>{item.name}</strong>
                  <span>{item.id}</span>
                </button>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                {translate(locale, "departmentsTitle")}
                <input value={newDepartmentName} onChange={(event) => setNewDepartmentName(event.target.value)} />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newDepartmentName.trim()) {
                    return;
                  }
                  addDepartment(newDepartmentName);
                  setNewDepartmentName("");
                }}
                type="button"
              >
                Agregar departamento
              </button>
              {editingDepartmentId ? (
                <>
                  <label>
                    Editar departamento
                    <input value={editingDepartmentName} onChange={(event) => setEditingDepartmentName(event.target.value)} />
                  </label>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (!editingDepartmentId || !editingDepartmentName.trim()) {
                        return;
                      }
                      updateDepartment(editingDepartmentId, editingDepartmentName.trim());
                    }}
                    type="button"
                  >
                    Guardar departamento
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (!editingDepartmentId || !confirmRemoval(`el departamento ${editingDepartmentName || editingDepartmentId}`)) {
                        return;
                      }
                      deleteDepartment(editingDepartmentId);
                    }}
                    type="button"
                  >
                    Eliminar departamento
                  </button>
                </>
              ) : null}
            </div>
          </article>

          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "locationsTitle")}</h3>
              <span>{translate(locale, "locationsSubtitle")}</span>
            </div>
            <div className="list-table">
              {unitLocations.map((item) => (
                <button
                  key={item.id}
                  className={item.id === editingLocationId ? "selectable-row active" : "selectable-row"}
                  onClick={() => setEditingLocationId(item.id)}
                  type="button"
                >
                  <strong>{item.name}</strong>
                  <span>{item.code}</span>
                </button>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                {translate(locale, "locationsTitle")}
                <input value={newLocationName} onChange={(event) => setNewLocationName(event.target.value)} />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!currentUnit || !newLocationName.trim()) {
                    return;
                  }
                  addLocation({
                    name: newLocationName,
                    code: newLocationName.toUpperCase().replace(/\s+/g, "_"),
                    unitId: currentUnit.id
                  });
                  setNewLocationName("");
                }}
                type="button"
              >
                Agregar local
              </button>
              {editingLocationId ? (
                <>
                  <label>
                    Editar nombre
                    <input value={editingLocationName} onChange={(event) => setEditingLocationName(event.target.value)} />
                  </label>
                  <label>
                    Editar codigo
                    <input value={editingLocationCode} onChange={(event) => setEditingLocationCode(event.target.value)} />
                  </label>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (!editingLocationId || !editingLocationName.trim() || !editingLocationCode.trim()) {
                        return;
                      }
                      updateLocation(editingLocationId, {
                        name: editingLocationName.trim(),
                        code: editingLocationCode.trim().toUpperCase()
                      });
                    }}
                    type="button"
                  >
                    Guardar local
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (!editingLocationId || !confirmRemoval(`el local ${editingLocationName || editingLocationId}`)) {
                        return;
                      }
                      deleteLocation(editingLocationId);
                    }}
                    type="button"
                  >
                    Eliminar local
                  </button>
                </>
              ) : null}
            </div>
          </article>
        </div>

        <div className="content-grid">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "servicesAdminTitle")}</h3>
              <span>{translate(locale, "servicesAdminSubtitle")}</span>
            </div>
            <div className="list-table">
              {unitServices.map((item) => (
                <div
                  key={item.id}
                  className={item.id === editingServiceId ? "selectable-row active stacked-row" : "selectable-row stacked-row"}
                  onClick={() => setEditingServiceId(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setEditingServiceId(item.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.code}</span>
                  </div>
                  <div className="button-row">
                    <span>{item.allowPriority ? "Prioridad habilitada" : "Solo flujo normal"}</span>
                    <button
                      className="secondary-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        updateService(item.id, { allowPriority: !item.allowPriority });
                      }}
                      type="button"
                    >
                      {item.allowPriority ? "Desactivar prioridad" : "Activar prioridad"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                {translate(locale, "servicesAdminTitle")}
                <input value={newServiceName} onChange={(event) => setNewServiceName(event.target.value)} />
              </label>
              <label>
                Codigo
                <input value={newServiceCode} onChange={(event) => setNewServiceCode(event.target.value)} />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newServiceName.trim() || !newServiceCode.trim() || !departments[0]) {
                    return;
                  }
                  addService({
                    unitId: currentUnit.id,
                    name: newServiceName,
                    code: newServiceCode.toUpperCase(),
                    departmentId: departments[0].id,
                    allowPriority: true,
                    ticketTypeIds: unitTicketTypes.map((item) => item.id)
                  });
                  setNewServiceName("");
                  setNewServiceCode("");
                }}
                type="button"
              >
                Agregar servicio
              </button>
              {editingServiceId ? (
                <>
                  <label>
                    Editar nombre
                    <input value={editingServiceName} onChange={(event) => setEditingServiceName(event.target.value)} />
                  </label>
                  <label>
                    Editar codigo
                    <input value={editingServiceCode} onChange={(event) => setEditingServiceCode(event.target.value)} />
                  </label>
                  <label>
                    Departamento
                    <select value={editingServiceDepartmentId} onChange={(event) => setEditingServiceDepartmentId(event.target.value)}>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="toggle-row">
                    <input checked={editingServiceAllowPriority} onChange={(event) => setEditingServiceAllowPriority(event.target.checked)} type="checkbox" />
                    <span>Prioridad habilitada</span>
                  </label>
                  <div className="checklist compact-checklist">
                    {unitTicketTypes.map((ticketType) => (
                      <label key={ticketType.id} className="toggle-row">
                        <input
                          checked={editingServiceTicketTypeIds.includes(ticketType.id)}
                          onChange={() =>
                            setEditingServiceTicketTypeIds((currentIds) =>
                              currentIds.includes(ticketType.id)
                                ? currentIds.filter((item) => item !== ticketType.id)
                                : [...currentIds, ticketType.id]
                            )
                          }
                          type="checkbox"
                        />
                        <span>{ticketType.name}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (!editingServiceId || !editingServiceName.trim() || !editingServiceCode.trim() || !editingServiceDepartmentId) {
                        return;
                      }
                      updateService(editingServiceId, {
                        name: editingServiceName.trim(),
                        code: editingServiceCode.trim().toUpperCase(),
                        departmentId: editingServiceDepartmentId,
                        allowPriority: editingServiceAllowPriority,
                        ticketTypeIds: editingServiceTicketTypeIds
                      });
                    }}
                    type="button"
                  >
                    Guardar servicio
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (!editingServiceId || !confirmRemoval(`el servicio ${editingServiceName || editingServiceId}`)) {
                        return;
                      }
                      deleteService(editingServiceId);
                    }}
                    type="button"
                  >
                    Eliminar servicio
                  </button>
                </>
              ) : null}
            </div>
          </article>

          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "ticketTypesTitle")}</h3>
              <span>{translate(locale, "prioritiesTitle")}</span>
            </div>
            <div className="list-table">
              {unitTicketTypes.map((item) => (
                <div
                  key={item.id}
                  className={item.id === editingTicketTypeId ? "selectable-row active stacked-row" : "selectable-row stacked-row"}
                  onClick={() => setEditingTicketTypeId(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setEditingTicketTypeId(item.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.triageMessage || item.description}</span>
                  </div>
                  <div className="button-row">
                    <span style={{ color: item.color }}>{item.prefix || item.code}</span>
                    <button
                      className="secondary-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        updateTicketType(item.id, { allowPanel: !item.allowPanel });
                      }}
                      type="button"
                    >
                      {item.allowPanel ? "Ocultar en panel" : "Mostrar en panel"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                Nombre
                <input value={newTicketTypeName} onChange={(event) => setNewTicketTypeName(event.target.value)} />
              </label>
              <label>
                Codigo
                <input value={newTicketTypeCode} onChange={(event) => setNewTicketTypeCode(event.target.value)} />
              </label>
              <label>
                Prefijo
                <input value={newTicketTypePrefix} onChange={(event) => setNewTicketTypePrefix(event.target.value)} />
              </label>
              <label>
                Color
                <input type="color" value={newTicketTypeColor} onChange={(event) => setNewTicketTypeColor(event.target.value)} />
              </label>
              <label>
                Mensaje triage
                <input value={newTicketTypeMessage} onChange={(event) => setNewTicketTypeMessage(event.target.value)} />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!currentUnit || !newTicketTypeName.trim() || !newTicketTypeCode.trim()) {
                    return;
                  }
                  addTicketType({
                    unitId: currentUnit.id,
                    code: newTicketTypeCode.toUpperCase(),
                    name: newTicketTypeName,
                    description: "Tipo configurable",
                    prefix: newTicketTypePrefix.trim().toUpperCase() || undefined,
                    color: newTicketTypeColor,
                    textColor: "#ffffff",
                    icon: "ticket",
                    baseWeight: 0,
                    requireClient: false,
                    requireDocument: false,
                    requireExternalValidation: false,
                    allowPrint: true,
                    allowPanel: true,
                    triageMessage: newTicketTypeMessage.trim() || undefined
                  });
                  setNewTicketTypeName("");
                  setNewTicketTypeCode("");
                  setNewTicketTypePrefix("");
                  setNewTicketTypeMessage("");
                }}
                type="button"
              >
                Agregar tipo
              </button>
              {editingTicketTypeId ? (
                <>
                  <label>
                    Editar nombre
                    <input value={editingTicketTypeName} onChange={(event) => setEditingTicketTypeName(event.target.value)} />
                  </label>
                  <label>
                    Editar codigo
                    <input value={editingTicketTypeCode} onChange={(event) => setEditingTicketTypeCode(event.target.value)} />
                  </label>
                  <label>
                    Editar prefijo
                    <input value={editingTicketTypePrefix} onChange={(event) => setEditingTicketTypePrefix(event.target.value)} />
                  </label>
                  <label>
                    Mensaje triage
                    <input value={editingTicketTypeMessage} onChange={(event) => setEditingTicketTypeMessage(event.target.value)} />
                  </label>
                  <div className="toggle-grid">
                    <label><input checked={editingTicketTypeAllowPanel} onChange={(event) => setEditingTicketTypeAllowPanel(event.target.checked)} type="checkbox" /> Visible en panel</label>
                    <label><input checked={editingTicketTypeAllowPrint} onChange={(event) => setEditingTicketTypeAllowPrint(event.target.checked)} type="checkbox" /> Imprimible</label>
                    <label><input checked={editingTicketTypeRequireClient} onChange={(event) => setEditingTicketTypeRequireClient(event.target.checked)} type="checkbox" /> Requiere cliente</label>
                    <label><input checked={editingTicketTypeRequireDocument} onChange={(event) => setEditingTicketTypeRequireDocument(event.target.checked)} type="checkbox" /> Requiere documento</label>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (!editingTicketTypeId || !editingTicketTypeName.trim() || !editingTicketTypeCode.trim()) {
                        return;
                      }
                      updateTicketType(editingTicketTypeId, {
                        name: editingTicketTypeName.trim(),
                        code: editingTicketTypeCode.trim().toUpperCase(),
                        prefix: editingTicketTypePrefix.trim().toUpperCase() || undefined,
                        triageMessage: editingTicketTypeMessage.trim() || undefined,
                        allowPanel: editingTicketTypeAllowPanel,
                        allowPrint: editingTicketTypeAllowPrint,
                        requireClient: editingTicketTypeRequireClient,
                        requireDocument: editingTicketTypeRequireDocument
                      });
                    }}
                    type="button"
                  >
                    Guardar tipo
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (!editingTicketTypeId || !confirmRemoval(`el tipo ${editingTicketTypeName || editingTicketTypeId}`)) {
                        return;
                      }
                      deleteTicketType(editingTicketTypeId);
                    }}
                    type="button"
                  >
                    Eliminar tipo
                  </button>
                </>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (section === "settings") {
    return (
      <section className="page-grid">
        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "unitConfiguration")}</h3>
            <span>{currentUnit?.name}</span>
          </div>

          <div className="button-row">
            {availableUnits.map((item) => (
              <button
                key={item.id}
                className={item.id === currentUnit?.id ? "route-pill active-pill" : "route-pill"}
                onClick={() => setSelectedUnit(item.id)}
                type="button"
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="config-tabs">
            <button className={settingsTab === "services" ? "config-tab active" : "config-tab"} onClick={() => setSettingsTab("services")} type="button">
              {translate(locale, "serviceConfigTab")}
            </button>
            <button className={settingsTab === "triage" ? "config-tab active" : "config-tab"} onClick={() => setSettingsTab("triage")} type="button">
              {translate(locale, "triageConfigTab")}
            </button>
            <button className={settingsTab === "attendance" ? "config-tab active" : "config-tab"} onClick={() => setSettingsTab("attendance")} type="button">
              {translate(locale, "attendanceConfigTab")}
            </button>
          </div>

          {settingsTab === "services" ? (
            <div className="content-grid">
              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "printTemplatesTitle")}</h3>
                  <span>{translate(locale, "serviceConfigTab")}</span>
                </div>
                <div className="template-editor compact-grid">
                  <label>
                    {translate(locale, "printHeader")}
                    <input
                      value={currentSettings?.printHeader ?? ""}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printHeader: event.target.value })}
                    />
                  </label>
                  <label>
                    {translate(locale, "printFooter")}
                    <textarea
                      rows={4}
                      value={currentSettings?.printFooter ?? ""}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printFooter: event.target.value })}
                    />
                  </label>
                  <div className="toggle-grid">
                    <label><input checked={currentSettings?.printShowDate ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printShowDate: event.target.checked })} type="checkbox" /> Fecha</label>
                    <label><input checked={currentSettings?.printShowTicketType ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printShowTicketType: event.target.checked })} type="checkbox" /> Tipo</label>
                    <label><input checked={currentSettings?.printShowUnitName ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printShowUnitName: event.target.checked })} type="checkbox" /> Unidad</label>
                    <label><input checked={currentSettings?.printShowServiceName ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { printShowServiceName: event.target.checked })} type="checkbox" /> Servicio</label>
                  </div>
                </div>
              </article>

              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "servicesAdminTitle")}</h3>
                  <span>{translate(locale, "catalogTab")}</span>
                </div>
                <div className="list-table">
                  {unitServices.map((item) => (
                    <div key={item.id} className="list-row">
                      <strong>{item.name}</strong>
                      <span>{item.code}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          ) : null}

          {settingsTab === "triage" ? (
            <div className="content-grid">
              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "triageTitle")}</h3>
                  <span>{translate(locale, "serviceConfigTab")}</span>
                </div>
                <div className="checklist">
                  {unitServices.map((item) => (
                    <label key={item.id} className="toggle-row">
                      <input
                        checked={currentSettings?.triageServiceIds.includes(item.id) ?? false}
                        onChange={() => toggleTriageService(item.id)}
                        type="checkbox"
                      />
                      <span>{item.name}</span>
                    </label>
                  ))}
                </div>
                <div className="form-grid spaced-top">
                  <label>
                    Server
                    <input
                      value={triageRuntime?.serverUrl ?? ""}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, serverUrl: event.target.value } })}
                    />
                  </label>
                  <label>
                    Username
                    <input
                      value={triageRuntime?.username ?? ""}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, username: event.target.value } })}
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      value={triageRuntime?.password ?? ""}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, password: event.target.value } })}
                    />
                  </label>
                  <label>
                    Client ID
                    <input
                      value={triageRuntime?.clientId ?? ""}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, clientId: event.target.value } })}
                    />
                  </label>
                  <label>
                    Client Secret
                    <input
                      value={triageRuntime?.clientSecret ?? ""}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, clientSecret: event.target.value } })}
                    />
                  </label>
                  <label>
                    Locale
                    <select
                      value={triageRuntime?.locale ?? locale}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, locale: event.target.value as SupportedLocale } })}
                    >
                      <option value="es">ES</option>
                      <option value="en">EN</option>
                      <option value="pt">PT</option>
                    </select>
                  </label>
                  <label>
                    Columnas
                    <input
                      min={1}
                      type="number"
                      value={triageRuntime?.columns ?? 2}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, columns: Number(event.target.value) || 1 } })}
                    />
                  </label>
                  <label>
                    Escala
                    <input
                      min={50}
                      step={10}
                      type="number"
                      value={triageRuntime?.scale ?? 100}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, scale: Number(event.target.value) || 100 } })}
                    />
                  </label>
                  <label>
                    Wait time
                    <input
                      min={1}
                      type="number"
                      value={triageRuntime?.waitTimeSeconds ?? 10}
                      onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, waitTimeSeconds: Number(event.target.value) || 10 } })}
                    />
                  </label>
                </div>
                <div className="toggle-grid spaced-top">
                  <label><input checked={triageRuntime?.printEnabled ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, printEnabled: event.target.checked } })} type="checkbox" /> Print enabled</label>
                  <label><input checked={triageRuntime?.showTitle ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, showTitle: event.target.checked } })} type="checkbox" /> Show title</label>
                  <label><input checked={triageRuntime?.showSubtitle ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, showSubtitle: event.target.checked } })} type="checkbox" /> Show subtitle</label>
                  <label><input checked={triageRuntime?.lockMenu ?? false} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, lockMenu: event.target.checked } })} type="checkbox" /> Lock menu</label>
                  <label><input checked={triageRuntime?.groupByDepartment ?? false} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { triageRuntime: { ...triageRuntime!, groupByDepartment: event.target.checked } })} type="checkbox" /> Group by department</label>
                </div>
              </article>

              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "webhooksTitle")}</h3>
                  <span>{translate(locale, "integrationsTab")}</span>
                </div>
                <div className="template-editor compact-grid">
                  <label>
                    Pre ticket
                    <input
                      value={currentSettings?.webhooks.preTicket ?? ""}
                      onChange={(event) =>
                        currentSettings &&
                        updateUnitSettings(currentSettings.unitId, {
                          webhooks: { ...currentSettings.webhooks, preTicket: event.target.value }
                        })
                      }
                    />
                  </label>
                  <label>
                    Post ticket
                    <input
                      value={currentSettings?.webhooks.postTicket ?? ""}
                      onChange={(event) =>
                        currentSettings &&
                        updateUnitSettings(currentSettings.unitId, {
                          webhooks: { ...currentSettings.webhooks, postTicket: event.target.value }
                        })
                      }
                    />
                  </label>
                  <label>
                    On print
                    <input
                      value={currentSettings?.webhooks.onPrint ?? ""}
                      onChange={(event) =>
                        currentSettings &&
                        updateUnitSettings(currentSettings.unitId, {
                          webhooks: { ...currentSettings.webhooks, onPrint: event.target.value }
                        })
                      }
                    />
                  </label>
                </div>
              </article>
            </div>
          ) : null}

          {settingsTab === "attendance" ? (
            <div className="content-grid">
              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "assignedDesks")}</h3>
                  <span>{translate(locale, "attendanceConfigTab")}</span>
                </div>
                <div className="list-table">
                  {unitDesks.map((desk) => (
                    <button
                      key={desk.id}
                      className={desk.id === editingDeskId ? "selectable-row active stacked-row" : "selectable-row stacked-row"}
                      onClick={() => setEditingDeskId(desk.id)}
                      type="button"
                    >
                      <div>
                        <strong>{desk.name}</strong>
                        <span>{desk.operatorName}</span>
                      </div>
                      <span>{locationMap.get(desk.locationId)?.name ?? desk.name}</span>
                    </button>
                  ))}
                </div>
              </article>

              <article className="panel-card nested-card">
                <div className="card-header">
                  <h3>{translate(locale, "locationsTitle")}</h3>
                  <span>{translate(locale, "attendanceConfigTab")}</span>
                </div>
                <div className="template-editor compact-grid">
                  <label>
                    Puesto
                    <input value={newDeskName} onChange={(event) => setNewDeskName(event.target.value)} placeholder="Box 4" />
                  </label>
                  <label>
                    Operador
                    <input value={newDeskOperator} onChange={(event) => setNewDeskOperator(event.target.value)} />
                  </label>
                  <button
                    className="primary-button"
                    onClick={() => {
                      if (!currentUnit || !unitLocations[0] || !newDeskName.trim()) {
                        return;
                      }
                      addDesk({
                        name: newDeskName,
                        unitId: currentUnit.id,
                        locationId: unitLocations[0].id,
                        operatorName: newDeskOperator || authUser?.fullName || "Operador",
                        serviceIds: currentSettings?.triageServiceIds ?? []
                      });
                      setNewDeskName("");
                    }}
                    type="button"
                  >
                    Agregar puesto
                  </button>
                  {editingDeskId ? (
                    <>
                      <label>
                        Editar puesto
                        <input value={editingDeskName} onChange={(event) => setEditingDeskName(event.target.value)} />
                      </label>
                      <label>
                        Editar operador
                        <input value={editingDeskOperator} onChange={(event) => setEditingDeskOperator(event.target.value)} />
                      </label>
                      <label>
                        Local asignado
                        <select value={editingDeskLocationId} onChange={(event) => setEditingDeskLocationId(event.target.value)}>
                          {unitLocations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="checklist compact-checklist">
                        {unitServices.map((service) => (
                          <label key={service.id} className="toggle-row">
                            <input
                              checked={editingDeskServiceIds.includes(service.id)}
                              onChange={() =>
                                setEditingDeskServiceIds((currentIds) =>
                                  currentIds.includes(service.id)
                                    ? currentIds.filter((item) => item !== service.id)
                                    : [...currentIds, service.id]
                                )
                              }
                              type="checkbox"
                            />
                            <span>{service.name}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        className="secondary-button"
                        onClick={() => {
                          if (!editingDeskId || !editingDeskName.trim() || !editingDeskLocationId || !editingDeskOperator.trim()) {
                            return;
                          }
                          updateDesk(editingDeskId, {
                            name: editingDeskName.trim(),
                            operatorName: editingDeskOperator.trim(),
                            locationId: editingDeskLocationId,
                            serviceIds: editingDeskServiceIds
                          });
                        }}
                        type="button"
                      >
                        Guardar puesto
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => {
                          if (!editingDeskId || !confirmRemoval(`el puesto ${editingDeskName || editingDeskId}`)) {
                            return;
                          }
                          deleteDesk(editingDeskId);
                        }}
                        type="button"
                      >
                        Eliminar puesto
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            </div>
          ) : null}
        </article>
      </section>
    );
  }

  if (section === "users") {
    return (
      <section className="page-grid">
        <div className="content-grid">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "profilesTitle")}</h3>
              <span>{translate(locale, "profilesSubtitle")}</span>
            </div>
            <div className="list-table">
              {profiles.map((item) => (
                <button
                  key={item.id}
                  className={item.id === editingProfileId ? "selectable-row active stacked-row" : "selectable-row stacked-row"}
                  onClick={() => setEditingProfileId(item.id)}
                  type="button"
                >
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.scope}</span>
                  </div>
                  <span>{item.permissions.join(", ")}</span>
                </button>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                Perfil
                <input value={newProfileName} onChange={(event) => setNewProfileName(event.target.value)} />
              </label>
              <label>
                Alcance
                <select value={newProfileScope} onChange={(event) => setNewProfileScope(event.target.value)}>
                  <option value="Global">Global</option>
                  <option value="Unidad">Unidad</option>
                  <option value="Puesto">Puesto</option>
                  <option value="Operacion">Operacion</option>
                </select>
              </label>
              <button
                className="primary-button"
                disabled={!access.isSuperadmin}
                onClick={() => {
                  if (!access.isSuperadmin || !newProfileName.trim()) {
                    return;
                  }
                  addProfile({
                    name: newProfileName,
                    scope: newProfileScope || "Operacion"
                  });
                  setNewProfileName("");
                  setNewProfileScope("Operacion");
                }}
                type="button"
              >
                {access.isSuperadmin ? "Agregar perfil" : translate(locale, "accessDeniedTitle")}
              </button>
              {editingProfileId && access.isSuperadmin ? (
                <>
                  <label>
                    Editar perfil
                    <input value={editingProfileName} onChange={(event) => setEditingProfileName(event.target.value)} />
                  </label>
                  <label>
                    Editar alcance
                    <select value={editingProfileScope} onChange={(event) => setEditingProfileScope(event.target.value)}>
                      <option value="Global">Global</option>
                      <option value="Unidad">Unidad</option>
                      <option value="Puesto">Puesto</option>
                      <option value="Operacion">Operacion</option>
                    </select>
                  </label>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (!editingProfileId || !editingProfileName.trim()) {
                        return;
                      }
                      updateProfile(editingProfileId, {
                        name: editingProfileName.trim(),
                        scope: editingProfileScope
                      });
                    }}
                    type="button"
                  >
                    Guardar perfil
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (!editingProfileId || !confirmRemoval(`el perfil ${editingProfileName || editingProfileId}`)) {
                        return;
                      }
                      deleteProfile(editingProfileId);
                    }}
                    type="button"
                  >
                    Eliminar perfil
                  </button>
                </>
              ) : null}
            </div>
          </article>

          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "usersTitle")}</h3>
              <span>{translate(locale, "usersSubtitle")}</span>
            </div>
            <div className="list-table">
              {visibleUsers.map((item) => (
                <button
                  key={item.id}
                  className={item.id === editingUserId ? "selectable-row active stacked-row" : "selectable-row stacked-row"}
                  onClick={() => setEditingUserId(item.id)}
                  type="button"
                >
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.email}</span>
                  </div>
                  <span>{`${item.profile}${item.unitId && currentUnit?.id !== item.unitId ? " · Otra unidad" : ""}`}</span>
                </button>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                Nombre
                <input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} />
              </label>
              <label>
                Email
                <input value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} />
              </label>
              <label>
                Perfil
                <select value={selectedProfileId} onChange={(event) => setSelectedProfileId(event.target.value)}>
                  {profiles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Password inicial
                <input value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} placeholder="Cambiar123" />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newUserName.trim() || !newUserEmail.trim()) {
                    return;
                  }
                  addUser({
                    name: newUserName,
                    email: newUserEmail,
                    profile: selectedProfile?.name ?? "Superadmin",
                    profileId: selectedProfile?.id,
                    unitId: currentUnit?.id,
                    password: newUserPassword
                  });
                  setNewUserName("");
                  setNewUserEmail("");
                  setNewUserPassword("");
                }}
                type="button"
              >
                Agregar usuario
              </button>
              {editingUserId ? (
                <>
                  <label>
                    Editar nombre
                    <input value={editingUserName} onChange={(event) => setEditingUserName(event.target.value)} />
                  </label>
                  <label>
                    Editar email
                    <input value={editingUserEmail} onChange={(event) => setEditingUserEmail(event.target.value)} />
                  </label>
                  <label>
                    Editar perfil
                    <select value={editingUserProfileId} onChange={(event) => setEditingUserProfileId(event.target.value)}>
                      {profiles.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Nueva password
                    <input value={editingUserPassword} onChange={(event) => setEditingUserPassword(event.target.value)} placeholder="Sin cambios" />
                  </label>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (!editingUserId || !editingUserName.trim() || !editingUserEmail.trim()) {
                        return;
                      }
                      updateUser(editingUserId, {
                        name: editingUserName.trim(),
                        email: editingUserEmail.trim(),
                        profileId: editingUserProfileId,
                        unitId: currentUnit?.id ?? null,
                        password: editingUserPassword.trim() || undefined
                      });
                    }}
                    type="button"
                  >
                    Guardar usuario
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (!editingUserId || !confirmRemoval(`el usuario ${editingUserName || editingUserEmail || editingUserId}`)) {
                        return;
                      }
                      deleteUser(editingUserId);
                    }}
                    type="button"
                  >
                    Eliminar usuario
                  </button>
                </>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (section === "attendance") {
    return (
      <section className="page-grid">
        <div className="metrics-grid">
          <article className="metric-card">
            <span>{translate(locale, "waitingQueue")}</span>
            <strong>{attendanceServiceSummary.reduce((total, item) => total + item.waitingCount, 0)}</strong>
          </article>
          <article className="metric-card">
            <span>{translate(locale, "activeAttention")}</span>
            <strong>{attendanceServiceSummary.reduce((total, item) => total + item.inServiceCount, 0)}</strong>
          </article>
          <article className="metric-card">
            <span>{translate(locale, "servicesAdminTitle")}</span>
            <strong>{attendanceServiceSummary.length}</strong>
          </article>
          <article className="metric-card">
            <span>{translate(locale, "assignedDesks")}</span>
            <strong>{visibleDesks.length}</strong>
          </article>
        </div>

        <div className="content-grid attendance-grid">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "currentOperator")}</h3>
              <span>{authUser?.fullName ?? "Operador"}</span>
            </div>
            {attendanceActionError ? <p className="subtitle compact" style={{ color: "#c1121f" }}>{attendanceActionError}</p> : null}
            <div className="desk-grid">
              {!visibleDesks.length ? <p className="empty-copy">{translate(locale, "queueEmpty")}</p> : null}
              {visibleDesks.map((desk) => {
                const activeCall = remoteDeskCalls[desk.id] ?? activeCallForDesk(desk);
                const queue = remoteDeskQueues[desk.id]
                  ?? queueForDesk(desk).map((item) => ({
                    id: item.id,
                    sequence: item.sequence,
                    serviceId: item.serviceId,
                    service: serviceMap.get(item.serviceId) ? { id: item.serviceId, name: serviceMap.get(item.serviceId)!.name } : null
                  }));
                return (
                  <article key={desk.id} className="desk-card">
                    <div className="desk-card-top">
                      <div>
                        <strong>{desk.name}</strong>
                        <span>{locationMap.get(desk.locationId)?.name ?? desk.name}</span>
                      </div>
                      <span>{desk.operatorName}</span>
                    </div>
                    <div className="desk-service-chips">
                      {desk.serviceIds.map((serviceId) => (
                        <span key={serviceId} className="desk-chip">
                          {serviceMap.get(serviceId)?.name ?? serviceId}
                        </span>
                      ))}
                    </div>
                    <div className="desk-active-box">
                      <span>{translate(locale, "activeAttention")}</span>
                      <strong>{activeCall?.sequence ?? "--"}</strong>
                    </div>
                    <div className="button-row">
                      <button className="primary-button inline-action" onClick={() => void handleCallNext(desk.id)} type="button">
                        {translate(locale, "callNext")}
                      </button>
                      {activeCall ? (
                        <button className="secondary-button inline-action" onClick={() => void handleFinishTicket(activeCall.ticketId)} type="button">
                          {translate(locale, "finishAttention")}
                        </button>
                      ) : null}
                    </div>
                    <div className="queue-inline-list">
                      {queue.length ? (
                        queue.slice(0, 4).map((item) => (
                          <div key={item.id} className="list-row">
                            <strong>{item.sequence}</strong>
                            <span>{item.service?.name ?? serviceMap.get(item.serviceId)?.name}</span>
                          </div>
                        ))
                      ) : (
                        <p className="empty-copy">{translate(locale, "queueEmpty")}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "waitingQueue")}</h3>
              <span>{translate(locale, "queueForDesk")}</span>
            </div>
            <div className="template-editor compact-grid">
              <label>
                Buscar ticket
                <input value={attendanceSearch} onChange={(event) => setAttendanceSearch(event.target.value)} placeholder="C-739" />
              </label>
            </div>
            {searchedTicket ? (
              <div className="announcement-box">
                <span>Resultado</span>
                <strong>{searchedTicket.sequence}</strong>
                <p className="announcement-copy">
                  {searchedTicket.serviceName} | {searchedTicket.ticketTypeName} | {statusLabel(locale, searchedTicket.status)}
                </p>
                {searchedTicket.activeCall ? <p className="announcement-copy">Llamado en {searchedTicket.activeCall.counter}</p> : null}
              </div>
            ) : null}
            <div className="list-table">
              {displayRecentTickets.map((item) => (
                <div key={item.id} className="list-row stacked-row">
                  <div>
                    <strong>{item.sequence}</strong>
                    <span>{item.service?.name ?? (item.metadata.serviceName as string)}</span>
                  </div>
                  <span>{statusLabel(locale, item.status)}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="panel-card">
          <div className="card-header">
            <h3>Monitor por servicio</h3>
            <span>{currentUnit?.name}</span>
          </div>
          <div className="service-monitor-grid">
            {attendanceServiceSummary.map((service) => (
              <article key={service.serviceId} className="service-monitor-card">
                <div className="desk-card-top">
                  <div>
                    <strong>{service.serviceName}</strong>
                    <span>{service.waitingCount} en espera</span>
                  </div>
                  <span>{service.inServiceCount} en atencion</span>
                </div>
                <div className="desk-service-chips">
                  <span className="desk-chip">Espera {service.waitingCount}</span>
                  <span className="desk-chip">Llamado {service.calledCount}</span>
                  <span className="desk-chip">Atencion {service.inServiceCount}</span>
                </div>
                <div className="queue-inline-list">
                  {service.sequences.length ? (
                    service.sequences.map((sequence) => (
                      <div key={sequence} className="list-row">
                        <strong>{sequence}</strong>
                        <span>{service.serviceName}</span>
                      </div>
                    ))
                  ) : (
                    <p className="empty-copy">{translate(locale, "queueEmpty")}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    );
  }

  if (section === "media") {
    return (
      <section className="page-grid">
        <div className="two-column-layout">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "mediaTitle")}</h3>
              <span>{translate(locale, "panelMediaTitle")}</span>
            </div>
            {currentSettings ? (
              <div className="template-editor compact-grid">
                <label>
                  Playlist activa
                  <select
                    value={currentSettings.panelPlaylistId ?? currentPlaylist?.id ?? ""}
                    onChange={(event) => updateUnitSettings(currentSettings.unitId, { panelPlaylistId: event.target.value })}
                  >
                    {panelPlaylists
                      .filter((item) => !item.unitId || item.unitId === currentUnit?.id)
                      .map((playlist) => (
                        <option key={playlist.id} value={playlist.id}>
                          {playlist.name}
                        </option>
                    ))}
                  </select>
                </label>
                <label>
                  Nueva playlist
                  <input value={newPlaylistName} onChange={(event) => setNewPlaylistName(event.target.value)} placeholder="Playlist institucional" />
                </label>
                <button
                  className="primary-button"
                  onClick={() => {
                    if (!newPlaylistName.trim()) {
                      return;
                    }
                    addPanelPlaylist({
                      unitId: currentUnit?.id,
                      name: newPlaylistName.trim(),
                      active: true,
                      items: []
                    });
                    setNewPlaylistName("");
                  }}
                  type="button"
                >
                  Crear playlist
                </button>
              </div>
            ) : null}
            <div className="list-table">
              {unitMediaAssets.map((asset) => (
                <div key={asset.id} className="list-row stacked-row">
                  <div>
                    <strong>{asset.title}</strong>
                    <span>{asset.kind}</span>
                  </div>
                  <div className="button-row">
                    <span>{asset.durationSeconds}s</span>
                    <button
                      className="danger-button"
                      onClick={() => {
                        if (!confirmRemoval(`el medio ${asset.title}`)) {
                          return;
                        }
                        deleteMediaAsset(asset.id);
                      }}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="template-editor compact-grid">
              <label>
                Titulo
                <input value={newMediaTitle} onChange={(event) => setNewMediaTitle(event.target.value)} />
              </label>
              <label>
                URL
                <input value={newMediaUrl} onChange={(event) => setNewMediaUrl(event.target.value)} />
              </label>
              <label>
                {translate(locale, "mediaKind")}
                <select value={newMediaKind} onChange={(event) => setNewMediaKind(event.target.value)}>
                  <option value="image">{translate(locale, "mediaImage")}</option>
                  <option value="video">{translate(locale, "mediaVideo")}</option>
                </select>
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newMediaTitle.trim() || !newMediaUrl.trim()) {
                    return;
                  }
                  addMediaAsset({
                    unitId: currentUnit?.id,
                    title: newMediaTitle,
                    kind: newMediaKind,
                    url: newMediaUrl,
                    durationSeconds: newMediaKind === "video" ? 20 : 12
                  });
                  setNewMediaTitle("");
                  setNewMediaUrl("");
                }}
                type="button"
              >
                Agregar medio
              </button>
            </div>
            {currentPlaylist ? (
              <div className="list-table spaced-top">
                <div className="button-row">
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (!confirmRemoval(`la playlist ${currentPlaylist.name}`)) {
                        return;
                      }
                      deletePanelPlaylist(currentPlaylist.id);
                    }}
                    type="button"
                  >
                    Eliminar playlist
                  </button>
                </div>
                {currentPlaylist.items.map((item, index) => (
                  <div key={item.id} className="list-row stacked-row">
                    <div>
                      <strong>{index + 1}. {item.title}</strong>
                      <span>{item.kind}</span>
                    </div>
                    <div className="button-row">
                      <button
                        className="secondary-button"
                        disabled={index === 0}
                        onClick={() => {
                          const nextItems = [...currentPlaylist.items];
                          [nextItems[index - 1], nextItems[index]] = [nextItems[index], nextItems[index - 1]];
                          savePanelPlaylist({ ...currentPlaylist, items: nextItems });
                        }}
                        type="button"
                      >
                        Subir
                      </button>
                      <button
                        className="secondary-button"
                        disabled={index === currentPlaylist.items.length - 1}
                        onClick={() => {
                          const nextItems = [...currentPlaylist.items];
                          [nextItems[index], nextItems[index + 1]] = [nextItems[index + 1], nextItems[index]];
                          savePanelPlaylist({ ...currentPlaylist, items: nextItems });
                        }}
                        type="button"
                      >
                        Bajar
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() =>
                          savePanelPlaylist({
                            ...currentPlaylist,
                            items: currentPlaylist.items.filter((playlistItem) => playlistItem.id !== item.id)
                          })
                        }
                        type="button"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
                {unitMediaAssets
                  .filter((asset) => !currentPlaylist.items.some((item) => item.assetId === asset.id))
                  .map((asset) => (
                    <div key={asset.id} className="list-row">
                      <div>
                        <strong>{asset.title}</strong>
                        <span>{asset.kind}</span>
                      </div>
                      <button
                        className="primary-button"
                        onClick={() =>
                          savePanelPlaylist({
                            ...currentPlaylist,
                            items: [
                              ...currentPlaylist.items,
                              {
                                id: `playlist_item_${asset.id}`,
                                assetId: asset.id,
                                title: asset.title,
                                kind: asset.kind,
                                url: asset.url,
                                durationSeconds: asset.durationSeconds,
                                position: currentPlaylist.items.length + 1
                              }
                            ]
                          })
                        }
                        type="button"
                      >
                        Agregar a playlist
                      </button>
                    </div>
                  ))}
              </div>
            ) : null}
          </article>

          <article className="panel-card media-preview-card">
            <div className="card-header">
              <h3>{translate(locale, "panelMediaTitle")}</h3>
              <span>{currentUnit?.name}</span>
            </div>
            {currentPlaylist?.items[0]?.kind === "video" ? (
              <video controls className="media-preview" src={currentPlaylist.items[0].url} />
            ) : currentPlaylist?.items[0] ? (
              <img alt={currentPlaylist.items[0].title} className="media-preview" src={currentPlaylist.items[0].url} />
            ) : null}
          </article>
        </div>
      </section>
    );
  }

  if (section === "print") {
    return (
      <section className="page-grid">
        <div className="two-column-layout">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "printTemplatesTitle")}</h3>
              <span>{translate(locale, "printTemplatesSubtitle")}</span>
            </div>
            <div className="template-editor compact-grid">
              <label>
                Plantilla
                <select
                  value={currentSettings?.printTemplateId ?? selectedTemplateId}
                  onChange={(event) => {
                    setSelectedTemplateId(event.target.value);
                    currentSettings && updateUnitSettings(currentSettings.unitId, { printTemplateId: event.target.value });
                  }}
                >
                  {printTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nueva plantilla
                <input value={newTemplateName} onChange={(event) => setNewTemplateName(event.target.value)} placeholder="Ticket institucional" />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newTemplateName.trim() || !currentUnit) {
                    return;
                  }
                  addPrintTemplate({
                    unitId: currentUnit.id,
                    name: newTemplateName.trim(),
                    scope: "Unidad",
                    unit: currentUnit.name,
                    header: currentSettings?.printHeader ?? currentUnit.brandName,
                    footer: currentSettings?.printFooter ?? "Presente su documento y aguarde el llamado en pantalla.",
                    html: "<div class=\"ticket\"><h1>{{ticket.sequence}}</h1></div>"
                  });
                  setNewTemplateName("");
                }}
                type="button"
              >
                Crear plantilla
              </button>
              <label>
                {translate(locale, "printHeader")}
                <input
                  value={selectedTemplate?.header ?? ""}
                  onChange={(event) => selectedTemplate && savePrintTemplate({ ...selectedTemplate, header: event.target.value })}
                />
              </label>
              <label>
                {translate(locale, "printFooter")}
                <textarea
                  rows={4}
                  value={selectedTemplate?.footer ?? ""}
                  onChange={(event) => selectedTemplate && savePrintTemplate({ ...selectedTemplate, footer: event.target.value })}
                />
              </label>
              <label>
                HTML
                <textarea
                  rows={8}
                  value={selectedTemplate?.html ?? ""}
                  onChange={(event) => selectedTemplate && savePrintTemplate({ ...selectedTemplate, html: event.target.value })}
                />
              </label>
              {selectedTemplate ? (
                <button
                  className="danger-button"
                  onClick={() => {
                    if (!confirmRemoval(`la plantilla ${selectedTemplate.name}`)) {
                      return;
                    }
                    deletePrintTemplate(selectedTemplate.id);
                  }}
                  type="button"
                >
                  Eliminar plantilla
                </button>
              ) : null}
            </div>
          </article>

          <article className="panel-card ticket-preview">
            <div className="card-header">
              <h3>{translate(locale, "printPreviewTitle")}</h3>
              <span>{currentUnit?.name}</span>
            </div>
            <div className="receipt">
              <div className="receipt-brand">{selectedTemplate?.header ?? currentSettings?.printHeader}</div>
              <div className="receipt-number">C-740</div>
              <div className="receipt-details">
                <span>Unidad: {currentUnit?.name}</span>
                <span>{translate(locale, "service")}: Con Turno</span>
                <span>Tipo: Normal</span>
                <span>{translate(locale, "clientName")}: Ana Torres</span>
              </div>
              <p className="receipt-note">{selectedTemplate?.footer ?? currentSettings?.printFooter}</p>
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (section === "panel") {
    return (
      <section className="page-grid">
        <div className="two-column-layout">
          <article className="panel-card">
            <div className="card-header">
              <h3>{translate(locale, "panelSettingsTitle")}</h3>
              <span>{currentUnit?.name}</span>
            </div>
            <div className="form-grid">
              <label>
                Perfil de panel
                <select
                  value={currentSettings?.panelProfileId ?? currentPanelProfile.id}
                  onChange={(event) => {
                    setSelectedPanelProfileId(event.target.value);
                    currentSettings && updateUnitSettings(currentSettings.unitId, { panelProfileId: event.target.value });
                  }}
                >
                  {panelProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nuevo perfil
                <input value={newPanelProfileName} onChange={(event) => setNewPanelProfileName(event.target.value)} placeholder="Panel institucional" />
              </label>
              <button
                className="primary-button"
                onClick={() => {
                  if (!newPanelProfileName.trim()) {
                    return;
                  }
                  addPanelProfile({
                    name: newPanelProfileName.trim(),
                    layout: "calls-media",
                    locale: currentUnit?.locale ?? "es",
                    theme: {
                      background: currentPanelProfile.theme.background,
                      accent: currentPanelProfile.theme.accent,
                      text: currentPanelProfile.theme.text
                    }
                  });
                  setNewPanelProfileName("");
                }}
                type="button"
              >
                Crear perfil
              </button>
              <label>
                Nombre del perfil
                <input value={currentPanelProfile.name} onChange={(event) => updatePanelProfile({ name: event.target.value })} />
              </label>
              <label>
                Locale del panel
                <select value={currentPanelProfile.locale ?? "es"} onChange={(event) => updatePanelProfile({ locale: event.target.value as SupportedLocale })}>
                  <option value="es">ES</option>
                  <option value="en">EN</option>
                  <option value="pt">PT</option>
                </select>
              </label>
              <label>
                {translate(locale, "layout")}
                <select value={currentPanelProfile.layout} onChange={(event) => updatePanelProfile({ layout: event.target.value as PanelProfile["layout"] })}>
                  <option value="calls-only">Solo llamadas</option>
                  <option value="calls-history">Llamadas + historial</option>
                  <option value="calls-media">Llamadas + multimedia</option>
                </select>
              </label>
              <label>
                {translate(locale, "accentColor")}
                <input type="color" value={currentPanelProfile.theme.accent} onChange={(event) => updatePanelProfile({ theme: { accent: event.target.value } })} />
              </label>
              <label>
                {translate(locale, "background")}
                <input type="color" value={currentPanelProfile.theme.background} onChange={(event) => updatePanelProfile({ theme: { background: event.target.value } })} />
              </label>
              <label>
                {translate(locale, "textColor")}
                <input type="color" value={currentPanelProfile.theme.text} onChange={(event) => updatePanelProfile({ theme: { text: event.target.value } })} />
              </label>
              {panelProfiles.length > 1 ? (
                <button
                  className="danger-button"
                  onClick={() => {
                    if (!confirmRemoval(`el perfil de panel ${currentPanelProfile.name}`)) {
                      return;
                    }
                    deletePanelProfile(currentPanelProfile.id);
                  }}
                  type="button"
                >
                  Eliminar perfil
                </button>
              ) : null}
              <label>
                {translate(locale, "brandingText")}
                <input
                  value={currentSettings?.panelBrandingText ?? ""}
                  onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelBrandingText: event.target.value })}
                />
              </label>
              <label>
                Playlist
                <select
                  value={currentSettings?.panelPlaylistId ?? currentPlaylist?.id ?? ""}
                  onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelPlaylistId: event.target.value })}
                >
                  {panelPlaylists
                    .filter((item) => !item.unitId || item.unitId === currentUnit?.id)
                    .map((playlist) => (
                      <option key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Server
                <input
                  value={panelRuntime?.serverUrl ?? ""}
                  onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelRuntime: { ...panelRuntime!, serverUrl: event.target.value } })}
                />
              </label>
              <label>
                Username
                <input
                  value={panelRuntime?.username ?? ""}
                  onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelRuntime: { ...panelRuntime!, username: event.target.value } })}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={panelRuntime?.password ?? ""}
                  onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelRuntime: { ...panelRuntime!, password: event.target.value } })}
                />
              </label>
              <label>
                Client ID
                <input
                  value={panelRuntime?.clientId ?? ""}
                  onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelRuntime: { ...panelRuntime!, clientId: event.target.value } })}
                />
              </label>
              <label>
                Client Secret
                <input
                  value={panelRuntime?.clientSecret ?? ""}
                  onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelRuntime: { ...panelRuntime!, clientSecret: event.target.value } })}
                />
              </label>
              <label>
                Retries
                <input
                  min={1}
                  type="number"
                  value={panelRuntime?.retries ?? 5}
                  onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelRuntime: { ...panelRuntime!, retries: Number(event.target.value) || 5 } })}
                />
              </label>
              <label>
                Alerta
                <input
                  value={panelRuntime?.alertSound ?? "default"}
                  onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelRuntime: { ...panelRuntime!, alertSound: event.target.value } })}
                />
              </label>
            </div>
            <div className="toggle-grid spaced-top">
              <label><input checked={currentSettings?.panelShowHistory ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelShowHistory: event.target.checked })} type="checkbox" /> {translate(locale, "panelHistory")}</label>
              <label><input checked={currentSettings?.panelShowClock ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelShowClock: event.target.checked })} type="checkbox" /> {translate(locale, "panelClock")}</label>
              <label><input checked={panelRuntime?.speechEnabled ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelRuntime: { ...panelRuntime!, speechEnabled: event.target.checked } })} type="checkbox" /> Speech</label>
              <label><input checked={panelRuntime?.showMedia ?? true} onChange={(event) => currentSettings && updateUnitSettings(currentSettings.unitId, { panelRuntime: { ...panelRuntime!, showMedia: event.target.checked } })} type="checkbox" /> Multimedia</label>
            </div>
            <div className="checklist spaced-top">
              {unitServices.map((service) => (
                <label key={service.id} className="toggle-row">
                  <input
                    checked={panelRuntime?.visibleServiceIds?.includes(service.id) ?? false}
                    onChange={() => {
                      if (!currentSettings) {
                        return;
                      }
                      const currentIds = panelRuntime?.visibleServiceIds ?? [];
                      const visibleServiceIds = currentIds.includes(service.id)
                        ? currentIds.filter((item) => item !== service.id)
                        : [...currentIds, service.id];
                      updateUnitSettings(currentSettings.unitId, { panelRuntime: { ...panelRuntime!, visibleServiceIds } });
                    }}
                    type="checkbox"
                  />
                  <span>{service.name}</span>
                </label>
              ))}
            </div>
          </article>

          <article className="panel-preview public-panel-preview" style={{ background: currentPanelProfile.theme.background, color: currentPanelProfile.theme.text }}>
            <div className="panel-preview-header" style={{ borderColor: currentPanelProfile.theme.accent }}>
              <strong>{translate(locale, "panelInstitutional")}</strong>
              <span>{translate(locale, "highlightedCall")}</span>
            </div>
            <div className="panel-preview-call">
              <span className="call-chip" style={{ background: currentPanelProfile.theme.accent }}>C-739</span>
              <strong>Ventanilla 03</strong>
              <p className="announcement-copy">{currentSettings?.panelBrandingText ?? "Con turno"}</p>
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (section === "integrations") {
    return (
      <section className="page-grid">
        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "integrationsTitle")}</h3>
            <span>{translate(locale, "integrationsSubtitle")}</span>
          </div>
          <div className="split-admin-grid">
            <div className="list-table">
              {visibleConnectors.map((connector) => (
                <button
                  key={connector.id}
                  className={`list-row stacked-row selectable-row${editingConnectorId === connector.id ? " selected" : ""}`}
                  onClick={() => {
                    setEditingConnectorId(connector.id);
                    setEditingConnectorName(connector.name);
                    setEditingConnectorCode(connector.code);
                    setEditingConnectorType(connector.type);
                    setEditingConnectorStatus(connector.status);
                    setEditingConnectorEndpoint(connector.endpoint ?? "");
                    setEditingConnectorEnabled(connector.enabled);
                    setEditingConnectorEvents(connector.events.join(", "));
                  }}
                  type="button"
                >
                  <div>
                    <strong>{connector.name}</strong>
                    <span>{connector.type}</span>
                    <small>{connector.endpoint ?? "Sin endpoint"}</small>
                  </div>
                  <span className="status-pill">{connector.status}</span>
                </button>
              ))}
            </div>

            <div className="settings-surface">
              <div className="card-header">
                <h3>Nuevo conector</h3>
                <span>{currentUnit?.name ?? "Unidad"}</span>
              </div>
              <div className="form-grid">
                <label>
                  Nombre
                  <input value={newConnectorName} onChange={(event) => setNewConnectorName(event.target.value)} />
                </label>
                <label>
                  Codigo
                  <input value={newConnectorCode} onChange={(event) => setNewConnectorCode(event.target.value)} />
                </label>
                <label>
                  Tipo
                  <input value={newConnectorType} onChange={(event) => setNewConnectorType(event.target.value)} />
                </label>
                <label>
                  Estado
                  <input value={newConnectorStatus} onChange={(event) => setNewConnectorStatus(event.target.value)} />
                </label>
                <label className="full-span">
                  Endpoint
                  <input value={newConnectorEndpoint} onChange={(event) => setNewConnectorEndpoint(event.target.value)} />
                </label>
                <label className="full-span">
                  Eventos
                  <input value={newConnectorEvents} onChange={(event) => setNewConnectorEvents(event.target.value)} placeholder="ticket.emitted, attendance.finished" />
                </label>
              </div>
              <button
                className="primary-button"
                onClick={() => {
                  if (!currentUnit || !newConnectorName.trim() || !newConnectorCode.trim()) {
                    return;
                  }

                  addConnector({
                    unitId: currentUnit.id,
                    code: newConnectorCode.trim(),
                    name: newConnectorName.trim(),
                    type: newConnectorType.trim() || "Webhook",
                    status: newConnectorStatus.trim() || "Draft",
                    endpoint: newConnectorEndpoint.trim(),
                    enabled: true,
                    events: parseConnectorEvents(newConnectorEvents)
                  });
                  setNewConnectorName("");
                  setNewConnectorCode("");
                  setNewConnectorType("Webhook");
                  setNewConnectorStatus("Draft");
                  setNewConnectorEndpoint("");
                  setNewConnectorEvents("ticket.emitted");
                }}
                type="button"
              >
                Crear conector
              </button>

              {editingConnectorId ? (
                <>
                  <div className="card-header spaced-top">
                    <h3>Editar conector</h3>
                    <span>{editingConnectorCode || "Seleccionado"}</span>
                  </div>
                  <div className="form-grid">
                    <label>
                      Nombre
                      <input value={editingConnectorName} onChange={(event) => setEditingConnectorName(event.target.value)} />
                    </label>
                    <label>
                      Codigo
                      <input value={editingConnectorCode} onChange={(event) => setEditingConnectorCode(event.target.value)} />
                    </label>
                    <label>
                      Tipo
                      <input value={editingConnectorType} onChange={(event) => setEditingConnectorType(event.target.value)} />
                    </label>
                    <label>
                      Estado
                      <input value={editingConnectorStatus} onChange={(event) => setEditingConnectorStatus(event.target.value)} />
                    </label>
                    <label className="full-span">
                      Endpoint
                      <input value={editingConnectorEndpoint} onChange={(event) => setEditingConnectorEndpoint(event.target.value)} />
                    </label>
                    <label className="full-span">
                      Eventos
                      <input value={editingConnectorEvents} onChange={(event) => setEditingConnectorEvents(event.target.value)} />
                    </label>
                    <label className="checkbox-field">
                      <input checked={editingConnectorEnabled} onChange={(event) => setEditingConnectorEnabled(event.target.checked)} type="checkbox" />
                      <span>Activo</span>
                    </label>
                  </div>
                  <div className="button-row">
                    <button
                      className="primary-button"
                      onClick={() =>
                        updateConnector(editingConnectorId, {
                          name: editingConnectorName.trim(),
                          code: editingConnectorCode.trim(),
                          type: editingConnectorType.trim(),
                          status: editingConnectorStatus.trim(),
                          endpoint: editingConnectorEndpoint.trim(),
                          enabled: editingConnectorEnabled,
                          events: parseConnectorEvents(editingConnectorEvents)
                        })
                      }
                      type="button"
                    >
                      Guardar conector
                    </button>
                    <button
                      className="danger-button"
                      onClick={() => {
                        if (confirmRemoval("el conector")) {
                          deleteConnector(editingConnectorId);
                          setEditingConnectorId("");
                        }
                      }}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="metrics-grid">
        <article className="metric-card">
          <span>{translate(locale, "unitsTitle")}</span>
          <strong>{units.length}</strong>
        </article>
        <article className="metric-card">
          <span>{translate(locale, "departmentsTitle")}</span>
          <strong>{departments.length}</strong>
        </article>
        <article className="metric-card">
          <span>{translate(locale, "servicesAdminTitle")}</span>
          <strong>{services.length}</strong>
        </article>
        <article className="metric-card">
          <span>{translate(locale, "usersTitle")}</span>
          <strong>{visibleUsers.length}</strong>
        </article>
        <article className="metric-card">
          <span>{translate(locale, "integrationsTab")}</span>
          <strong>{visibleConnectors.length}</strong>
        </article>
      </div>

      <div className="content-grid">
        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "dashboardSummary")}</h3>
            <span>{currentUnit?.name}</span>
          </div>
          <div className="list-table">
            <div className="list-row"><strong>{translate(locale, "catalogTab")}</strong><span>{services.length} servicios</span></div>
            <div className="list-row"><strong>{translate(locale, "settingsTab")}</strong><span>{currentSettings?.triageServiceIds.length ?? 0} servicios en triage</span></div>
            <div className="list-row"><strong>{translate(locale, "attendanceTab")}</strong><span>{unitDesks.length} puestos</span></div>
            <div className="list-row"><strong>{translate(locale, "mediaTab")}</strong><span>{mediaAssets.length} activos</span></div>
            <div className="list-row"><strong>{translate(locale, "integrationsTab")}</strong><span>{visibleConnectors.length} conectores</span></div>
          </div>
        </article>

        <article className="panel-card">
          <div className="card-header">
            <h3>{translate(locale, "dashboardCoverage")}</h3>
            <span>{translate(locale, "adminWorkspaceSubtitle")}</span>
          </div>
          <div className="checklist">
            <div className="check-item">Triage kiosco por servicio y tipo de ticket</div>
            <div className="check-item">Atencion desde el portal administrativo</div>
            <div className="check-item">Panel publico visual con historial y multimedia</div>
            <div className="check-item">Configuracion por unidad con tabs operativas</div>
          </div>
        </article>
      </div>
    </section>
  );
}
