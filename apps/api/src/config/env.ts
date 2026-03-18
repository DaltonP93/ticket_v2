export interface AppEnv {
  port: number;
  appName: string;
}

export function loadEnv(): AppEnv {
  return {
    port: Number(process.env.PORT ?? 4010),
    appName: process.env.APP_NAME ?? "Sistema de Ticket V2"
  };
}

