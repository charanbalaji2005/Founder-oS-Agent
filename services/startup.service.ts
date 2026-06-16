import { BACKEND_URL } from "@/constants";
import type { FullProject } from "@/types";

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<FullProject[]> {
  const data = await apiFetch<{ projects: FullProject[] }>("/api/projects");
  return data.projects;
}

export async function fetchProject(id: string): Promise<FullProject> {
  const data = await apiFetch<{ project: FullProject }>(`/api/projects/${id}`);
  return data.project;
}

export async function createProjectAPI(data: {
  title: string;
  industry: string;
  targetUsers: string;
  description?: string;
}): Promise<FullProject> {
  return apiFetch<FullProject>("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function saveProjectResults(
  id: string,
  results: {
    research?: string;
    competitors?: string;
    mvp?: string;
    roadmap?: string;
    launch?: string;
  }
): Promise<void> {
  await apiFetch(`/api/projects/${id}/results`, {
    method: "PUT",
    body: JSON.stringify(results),
  });
}

export async function deleteProjectAPI(id: string): Promise<void> {
  await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export async function runAgentAPI(
  agentId: string,
  idea: string,
  industry: string,
  targetUsers: string,
  apiKey: string
): Promise<string> {
  const data = await apiFetch<{ result: string }>("/api/agents/run", {
    method: "POST",
    body: JSON.stringify({ agentId, idea, industry, targetUsers, apiKey }),
  });
  return data.result;
}

export async function runAllAgentsAPI(
  idea: string,
  industry: string,
  targetUsers: string,
  apiKey: string
): Promise<Record<string, string>> {
  const data = await apiFetch<{ results: Record<string, string> }>("/api/agents/run-all", {
    method: "POST",
    body: JSON.stringify({ idea, industry, targetUsers, apiKey }),
  });
  return data.results;
}
