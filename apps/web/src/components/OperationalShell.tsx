import type { SupportedLocale } from "@ticket-v2/contracts";
import { ReactNode } from "react";
import { locales } from "../i18n";

interface OperationalShellProps {
  locale: SupportedLocale;
  onChangeLocale: (locale: SupportedLocale) => void;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function OperationalShell({ locale, onChangeLocale, title, subtitle, actions, children }: OperationalShellProps) {
  return (
    <div className="operational-layout">
      <header className="operational-header">
        <div className="operational-brand">
          <div className="brand-mark">ST</div>
          <div>
            <strong>{title}</strong>
            <span>{subtitle}</span>
          </div>
        </div>

        <div className="operational-tools">
          <div className="locale-switcher compact">
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
          {actions}
        </div>
      </header>

      <main className="operational-content">{children}</main>
    </div>
  );
}
