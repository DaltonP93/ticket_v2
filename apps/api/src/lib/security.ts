import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string) {
  const incoming = Buffer.from(hashPassword(password), "utf8");
  const current = Buffer.from(hash, "utf8");

  if (incoming.length !== current.length) {
    return false;
  }

  return timingSafeEqual(incoming, current);
}

export function createSignedToken(payload: { sub: string; email: string }, secret: string) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 8 })).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifySignedToken(token: string, secret: string) {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (expected !== signature) {
    return null;
  }

  const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
    sub: string;
    email: string;
    exp: number;
  };

  if (parsed.exp < Date.now()) {
    return null;
  }

  return parsed;
}
