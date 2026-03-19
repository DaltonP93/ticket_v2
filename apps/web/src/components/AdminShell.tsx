import type { SupportedLocale } from "@ticket-v2/contracts";
import { ReactNode, useMemo } from "react";
import { locales, translate } from "../i18n";

interface AdminNavItem {
  id: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}

interface AdminShellProps {
  title: string;
  subtitle: string;
  locale: SupportedLocale;
  onChangeLocale: (locale: SupportedLocale) => void;
  navigation: AdminNavItem[];
  userName: string | null;
  onLogout: () => void;
  children: ReactNode;
}

export function AdminShell({
  title,
  subtitle,
  locale,
  onChangeLocale,
  navigation,
  userName,
  onLogout,
  children
}: AdminShellProps) {
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-PY", {
        dateStyle: "full",
        timeStyle: "short"
      }).format(new Date()),
    [locale]
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ST</div>
          <div>
            <strong>Sistema de Ticket V2</strong>
            <span>{translate(locale, "appTagline")}</span>
          </div>
        </div>

        <div className="locale-switcher">
          {locales.map((option) => (
            <button
              key={option}
              className={locale === option ? "locale-chip active" : "locale-chip"}
              onClick={() => onChangeLocale(option)}
              type="button"
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>

        <nav className="nav">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={item.active ? "nav-item active" : "nav-item"}
              onClick={item.onClick}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <h4>{translate(locale, "principlesTitle")}</h4>
          <p>{translate(locale, "principlesBody")}</p>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{translate(locale, "topbarLabel")}</p>
            <h1>{title}</h1>
            <p className="subtitle">{subtitle}</p>
          </div>

          <div className="topbar-meta">
            {userName ? <span>{userName}</span> : null}
            <button className="route-pill" onClick={onLogout} type="button">Salir</button>
            <span>{translate(locale, "version")}</span>
            <span>{dateLabel}</span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
