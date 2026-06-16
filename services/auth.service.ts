import { BACKEND_URL } from "@/constants";
import type { User } from "@/types";

interface AuthResponse {
  user: User;
  token: string;
  twoFactorRequired?: boolean;
  userId?: string;
  email?: string;
}

export async function loginAPI(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Invalid email or password");
  }

  return data;
}

export async function registerAPI(
  name: string,
  email: string,
  password: string,
  workspaceName?: string,
  industry?: string,
  teamSize?: string,
  companyName?: string,
  username?: string
): Promise<AuthResponse & { workspaceCode: string }> {
  const res = await fetch(`${BACKEND_URL}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, workspaceName, industry, teamSize, companyName, username }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || "Registration failed";
    const details = data.details ? (Array.isArray(data.details) ? data.details.join(", ") : data.details) : "";
    throw new Error(details ? `${message}: ${details}` : message);
  }

  return data;
}

export async function googleLoginAPI(idToken: string): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}/api/users/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Google login failed");
  }

  return data;
}
