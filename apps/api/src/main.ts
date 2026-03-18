import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";

async function bootstrap() {
  const env = loadEnv();
  const app = await buildApp();

  await app.listen({
    host: "0.0.0.0",
    port: env.port
  });

  app.log.info(`${env.appName} API listening on ${env.port}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
