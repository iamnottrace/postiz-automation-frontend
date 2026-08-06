export type PostizIntegration = {
  id: string;
  type: string;
  name: string;
  picture: string;
  disabled: boolean;
  groupId: string | null;
  identifier: string;
};

export type PostizIntegrationListResponse = {
  integrations: PostizIntegration[];
};

export type PostizIntegrationSettings = {
  settings: Record<string, unknown>[];
  tools: Record<string, unknown>[];
};

export type PostizPostStatus = "draft" | "scheduled" | "published" | "failed" | "pending_review";

export type PostizPost = {
  id: string;
  content: string;
  date: string;
  type: "schedule" | "now" | "draft";
  status: PostizPostStatus;
  integrationId: string;
  integrationType: string;
  images: string[];
  videos: string[];
  settings: Record<string, unknown>;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostizPostListResponse = {
  posts: PostizPost[];
};

export type PostizCreatePostInput = {
  content: string;
  date?: string;
  type: "schedule" | "now" | "draft";
  integrationId: string;
  images?: string[];
  videos?: string[];
  settings?: Record<string, unknown>;
  groupId?: string;
};

export type PostizUploadResponse = {
  id: string;
  path: string;
  url: string;
};

export type PostizAnalytics = {
  integrationId: string;
  integrationType: string;
  metrics: {
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    engagementRate: number;
  };
  posts: {
    id: string;
    content: string;
    date: string;
    metrics: Record<string, number>;
  }[];
};

export type PostizSlotResponse = {
  date: string;
};

export type PostizConnectionStatus = {
  connected: boolean;
};
