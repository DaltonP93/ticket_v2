export interface AppEnv {
  port: number;
  appName: string;
  authSecret: string;
  bootstrapAdminEmail?: string;
  bootstrapAdminPassword?: string;
  bootstrapAdminName?: string;
}

export function loadEnv(): AppEnv {
  return {
    port: Number(process.env.PORT ?? 4010),
    appName: process.env.APP_NAME ?? "Sistema de Ticket V2",
    authSecret: process.env.AUTH_SECRET ?? "change-this-secret",
    bootstrapAdminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL?.trim() || undefined,
    bootstrapAdminPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim() || undefined,
    bootstrapAdminName: process.env.BOOTSTRAP_ADMIN_NAME?.trim() || undefined
  };
}
