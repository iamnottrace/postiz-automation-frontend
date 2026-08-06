import type {
  N8nWorkflow,
  N8nWorkflowListResponse,
  N8nCreateWorkflowInput,
  N8nExecutionListResponse,
  N8nExecution,
} from "@/types/n8n";

const BASE_URL = process.env.N8N_API_URL || "http://n8n:5678/api/v1";
const API_KEY = process.env.N8N_API_KEY || "";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": API_KEY,
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`n8n API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const n8nClient = {
  listWorkflows: () => request<N8nWorkflowListResponse>("/workflows"),

  getWorkflow: (id: string) => request<N8nWorkflow>(`/workflows/${id}`),

  createWorkflow: (input: N8nCreateWorkflowInput) =>
    request<N8nWorkflow>("/workflows", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateWorkflow: (id: string, input: Partial<N8nCreateWorkflowInput>) =>
    request<N8nWorkflow>(`/workflows/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  deleteWorkflow: (id: string) =>
    request<void>(`/workflows/${id}`, { method: "DELETE" }),

  activateWorkflow: (id: string) =>
    request<N8nWorkflow>(`/workflows/${id}/activate`, { method: "POST" }),

  deactivateWorkflow: (id: string) =>
    request<N8nWorkflow>(`/workflows/${id}/deactivate`, { method: "POST" }),

  listExecutions: (workflowId?: string, limit = 20) =>
    request<N8nExecutionListResponse>(
      `/executions?limit=${limit}${workflowId ? `&workflowId=${workflowId}` : ""}`
    ),

  getExecution: (id: string) =>
    request<N8nExecution>(`/executions/${id}`),

  triggerExecution: (workflowId: string, data?: Record<string, unknown>) =>
    request<{ executionId: string }>("/executions/run", {
      method: "POST",
      body: JSON.stringify({ workflowId, data }),
    }),

  listCredentials: () =>
    request<{ data: { id: string; name: string; type: string }[] }>("/credentials"),
};
