import { prisma } from "../../lib/prisma.js";
import { createSignedToken, verifyPassword } from "../../lib/security.js";

export class AuthService {
  async login(input: { email: string; password: string; secret: string }) {
    const user = await prisma.adminUser.findUnique({
      where: {
        email: input.email
      },
      include: {
        profile: true,
        unit: true
      }
    });

    if (!user || !user.active) {
      throw new Error("Usuario no encontrado o inactivo.");
    }

    if (!verifyPassword(input.password, user.passwordHash)) {
      throw new Error("Credenciales invalidas.");
    }

    const token = createSignedToken({ sub: user.id, email: user.email }, input.secret);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        profile: user.profile.name,
        unit: user.unit?.name ?? null
      }
    };
  }

  async me(userId: string) {
    return prisma.adminUser.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        unit: true
      }
    });
  }
}
