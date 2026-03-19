const TOKEN_KEY = "ticket-v2-auth-token";
const USER_KEY = "ticket-v2-auth-user";

function apiBaseUrl() {
  return `${window.location.origin}/api`;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  locale: string;
  profile: string;
  unit: string | null;
}

export async function loginRequest(input: { email: string; password: string }) {
  const response = await fetch(`${apiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? "No se pudo iniciar sesion.");
  }

  const data = (await response.json()) as { token: string; user: AuthUser };
  window.localStorage.setItem(TOKEN_KEY, data.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));

  return data;
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function logout() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
