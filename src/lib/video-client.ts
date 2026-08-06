import type { PpqSubmitParams, PpqSubmitResponse, PpqStatusResponse } from "@/types/video";

const BASE_URL = process.env.PPQ_BASE_URL || "https://api.ppq.ai";
const API_KEY = process.env.PPQ_API_KEY || "";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };
}

export const videoClient = {
  submitVideo: async (params: PpqSubmitParams): Promise<PpqSubmitResponse> => {
    const body: Record<string, string> = {
      model: params.model,
      prompt: params.prompt,
      aspect_ratio: params.aspect_ratio || "16:9",
    };
    if (params.duration) body.duration = params.duration;
    if (params.quality) body.quality = params.quality;
    if (params.image_url) body.image_url = params.image_url;

    const res = await fetch(`${BASE_URL}/v1/videos`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      throw new Error(`ppq.ai submit ${res.status}: ${text}`);
    }
    return res.json() as Promise<PpqSubmitResponse>;
  },

  getVideoStatus: async (id: string): Promise<PpqStatusResponse> => {
    const res = await fetch(`${BASE_URL}/v1/videos/${id}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      throw new Error(`ppq.ai status ${res.status}: ${text}`);
    }
    return res.json() as Promise<PpqStatusResponse>;
  },

  listModels: async () => {
    const res = await fetch(`${BASE_URL}/v1/models?type=image,video`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) throw new Error(`ppq.ai models ${res.status}`);
    return res.json();
  },

  downloadVideo: async (url: string): Promise<ArrayBuffer> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    return res.arrayBuffer();
  },
};
