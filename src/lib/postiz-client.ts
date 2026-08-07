import type {
  PostizIntegration,
  PostizIntegrationListResponse,
  PostizIntegrationSettings,
  PostizPost,
  PostizPostListResponse,
  PostizCreatePostInput,
  PostizUploadResponse,
  PostizAnalytics,
  PostizSlotResponse,
  PostizConnectionStatus,
} from "@/types/postiz";

const BASE_URL = process.env.POSTIZ_API_URL || "http://postiz:3000/api/public/v1";
const API_KEY = process.env.POSTIZ_API_KEY || "";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Postiz API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const postizClient = {
  isConnected: () => request<PostizConnectionStatus>("/is-connected"),

  listIntegrations: () => request<PostizIntegrationListResponse>("/integrations"),

  getIntegrationSettings: (id: string) =>
    request<PostizIntegrationSettings>(`/integration-settings/${id}`),

  triggerIntegrationTool: (id: string, methodName: string, data: Record<string, unknown>) =>
    request<unknown>(`/integration-trigger/${id}`, {
      method: "POST",
      body: JSON.stringify({ methodName, data }),
    }),

  deleteIntegration: (id: string) =>
    request<void>(`/integration/${id}`, { method: "DELETE" }),

  getOAuthUrl: (integration: string, refresh = false) =>
    request<{ url: string }>(`/social/${integration}?refresh=${refresh}`),

  findSlot: (integrationId: string) =>
    request<PostizSlotResponse>(`/find-slot/${integrationId}`),

  listPosts: () => request<PostizPostListResponse>("/posts"),

  createPost: (input: PostizCreatePostInput) =>
    request<{ post: PostizPost }>("/posts", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  deletePost: (id: string) => request<void>(`/posts/${id}`, { method: "DELETE" }),

  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: { "x-api-key": API_KEY },
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json() as Promise<PostizUploadResponse>;
  },

  getAnalytics: (integrationId: string) =>
    request<PostizAnalytics>(`/analytics/${integrationId}`),

  getIntegrations: () => request<PostizIntegrationListResponse>("/integrations"),
};
