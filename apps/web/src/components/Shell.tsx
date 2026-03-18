import type { SupportedLocale } from "@ticket-v2/contracts";
import { ReactNode, useMemo } from "react";
import { locales, translate } from "../i18n";

interface ShellProps {
  title: string;
  subtitle: string;
  locale: SupportedLocale;
  onChangeLocale: (locale: SupportedLocale) => void;
  children: ReactNode;
}

export function Shell({ title, subtitle, locale, onChangeLocale, children }: ShellProps) {
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
            <span>{translate(locale, "version")}</span>
            <span>{dateLabel}</span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
