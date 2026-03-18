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
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  adminUsers as defaultAdminUsers,
  audioProfiles as defaultAudioProfiles,
  connectors,
  currentCalls as defaultCurrentCalls,
  departments as defaultDepartments,
  panelProfile as defaultPanelProfile,
  printTemplates as defaultPrintTemplates,
  profileItems as defaultProfileItems,
  recentTickets as defaultRecentTickets,
  serviceItems as defaultServiceItems,
  ticketTypeItems as defaultTicketTypes,
  unitItems as defaultUnitItems
} from "./mock-api";

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
  units: Unit[];
  departments: Department[];
  services: ServiceCatalogItem[];
  ticketTypes: TicketType[];
  profiles: ProfileItem[];
  users: AdminUser[];
  printTemplates: PrintTemplate[];
  panelProfile: PanelProfile;
  recentTickets: Ticket[];
  currentCalls: TicketCall[];
  audioProfiles: Record<SupportedLocale, AudioProfile>;
  connectors: typeof connectors;
  addUnit: (input: Pick<Unit, "name" | "code" | "brandName" | "locale">) => void;
  addDepartment: (name: string) => void;
  addService: (input: Pick<ServiceCatalogItem, "name" | "code" | "departmentId" | "allowPriority">) => void;
  addUser: (input: Omit<AdminUser, "id">) => void;
  savePrintTemplate: (template: PrintTemplate) => void;
  updatePanelProfile: (patch: Partial<PanelProfile>) => void;
  emitTicket: (input: {
    locale: SupportedLocale;
    serviceId: string;
    ticketTypeId: string;
    clientName: string;
    clientDocument: string;
    observation: string;
  }) => Ticket;
  callNextTicket: (locale: SupportedLocale) => TicketCall | undefined;
}

interface PersistedState {
  units: Unit[];
  departments: Department[];
  services: ServiceCatalogItem[];
  ticketTypes: TicketType[];
  profiles: ProfileItem[];
  users: AdminUser[];
  printTemplates: PrintTemplate[];
  panelProfile: PanelProfile;
  recentTickets: Ticket[];
  currentCalls: TicketCall[];
  audioProfiles: Record<SupportedLocale, AudioProfile>;
}

const STORAGE_KEY = "ticket-v2-store";

const initialState: PersistedState = {
  units: defaultUnitItems,
  departments: defaultDepartments,
  services: defaultServiceItems,
  ticketTypes: defaultTicketTypes,
  profiles: defaultProfileItems,
  users: defaultAdminUsers,
  printTemplates: defaultPrintTemplates.map((item) => ({
    ...item,
    header: "SAMAP - Medicina Prepaga",
    footer: "Presente su documento y aguarde el llamado en pantalla.",
    html: `<div class="ticket">\n  <h1>{{ticket.sequence}}</h1>\n  <p>{{service.name}}</p>\n  <p>{{client.name}}</p>\n</div>`
  })),
  panelProfile: defaultPanelProfile,
  recentTickets: defaultRecentTickets,
  currentCalls: defaultCurrentCalls,
  audioProfiles: defaultAudioProfiles
};

const TicketSystemContext = createContext<StoreShape | null>(null);

function buildId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export function TicketSystemProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => {
    if (typeof window === "undefined") {
      return initialState;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...initialState, ...JSON.parse(stored) } : initialState;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<StoreShape>(
    () => ({
      ...state,
      connectors,
      addUnit(input) {
        setState((current) => ({
          ...current,
          units: [...current.units, { id: buildId("unit"), ...input }]
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
      updatePanelProfile(patch) {
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
      emitTicket(input) {
        const service = state.services.find((item) => item.id === input.serviceId);
        const ticketType = state.ticketTypes.find((item) => item.id === input.ticketTypeId);
        const prefix = ticketType?.prefix ?? "T";
        const number = Math.floor(Math.random() * 900 + 100);
        const ticket: Ticket = {
          id: buildId("tk"),
          sequence: `${prefix}-${number}`,
          status: "waiting",
          serviceId: input.serviceId,
          unitId: state.units[0]?.id ?? "unit_default",
          ticketTypeId: input.ticketTypeId,
          clientName: input.clientName,
          clientDocument: input.clientDocument,
          metadata: {
            observation: input.observation,
            serviceName: service?.name ?? "",
            ticketTypeName: ticketType?.name ?? ""
          },
          createdAt: new Date().toISOString()
        };

        setState((current) => ({
          ...current,
          recentTickets: [ticket, ...current.recentTickets].slice(0, 30)
        }));

        return ticket;
      },
      callNextTicket(locale) {
        const waitingTicket = state.recentTickets.find((item) => item.status === "waiting");
        if (!waitingTicket) {
          return undefined;
        }

        const service = state.services.find((item) => item.id === waitingTicket.serviceId);
        const ticketType = state.ticketTypes.find((item) => item.id === waitingTicket.ticketTypeId);
        const counter = locale === "en" ? "Counter 4" : locale === "pt" ? "Guiche 4" : "Box 4";
        const profile = state.audioProfiles[locale];
        const text = profile.template
          .replace(/\{sequence\}/g, waitingTicket.sequence)
          .replace(/\{counter\}/g, counter)
          .replace(/\{serviceName\}/g, service?.name ?? "Servicio");

        const call: TicketCall = {
          ticketId: waitingTicket.id,
          sequence: waitingTicket.sequence,
          counter,
          serviceName: service?.name ?? "Servicio",
          ticketTypeName: ticketType?.name ?? "Ticket",
          locale,
          announcementText: text
        };

        setState((current) => ({
          ...current,
          recentTickets: current.recentTickets.map((item) =>
            item.id === waitingTicket.id ? { ...item, status: "called" } : item
          ),
          currentCalls: [call, ...current.currentCalls].slice(0, 12)
        }));

        return call;
      }
    }),
    [state]
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
