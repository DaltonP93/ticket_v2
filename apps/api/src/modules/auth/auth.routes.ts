import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { loadEnv } from "../../config/env.js";
import { verifySignedToken } from "../../lib/security.js";
import { AuthService } from "./auth.service.js";

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function registerAuthRoutes(app: FastifyInstance) {
  const service = new AuthService();
  const env = loadEnv();

  app.post("/auth/login", async (request, reply) => {
    const payload = loginSchema.parse(request.body);

    try {
      const session = await service.login({
        ...payload,
        secret: env.authSecret
      });

      return reply.code(200).send(session);
    } catch (error) {
      return reply.code(401).send({
        message: error instanceof Error ? error.message : "No autorizado."
      });
    }
  });

  app.get("/auth/me", async (request: FastifyRequest, reply) => {
    const authorization = request.headers.authorization;
    const token = authorization?.replace("Bearer ", "");

    if (!token) {
      return reply.code(401).send({ message: "Token requerido." });
    }

    const parsed = verifySignedToken(token, env.authSecret);
    if (!parsed) {
      return reply.code(401).send({ message: "Token invalido." });
    }

    const user = await service.me(parsed.sub);
    if (!user) {
      return reply.code(404).send({ message: "Usuario no encontrado." });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        profile: user.profile.name,
        profileCode: user.profile.code,
        permissions: asStringArray(user.profile.permissions),
        unitId: user.unitId,
        unit: user.unit?.name ?? null
      }
    };
  });
}
