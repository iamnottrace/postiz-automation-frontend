export type VideoModel =
  | "veo3"
  | "veo3-fast"
  | "kling-2.1-pro"
  | "kling-2.1-master"
  | "kling-2.5-turbo"
  | "runway-gen4"
  | "runway-aleph"
  | "veo3-i2v"
  | "kling-2.1-master-i2v"
  | "kling-2.5-turbo-i2v";

export type VideoStatus = "pending" | "processing" | "completed" | "failed";

export interface VideoModelInfo {
  id: VideoModel;
  label: string;
  type: "text-to-video" | "image-to-video";
  description: string;
  durations: string[];
  maxQuality?: string;
  costPer5s: number;
}

export const VIDEO_MODELS: VideoModelInfo[] = [
  { id: "veo3", label: "Google Veo 3 (Quality)", type: "text-to-video", description: "8s high quality", durations: ["8"], costPer5s: 0.5 },
  { id: "veo3-fast", label: "Google Veo 3 (Fast)", type: "text-to-video", description: "8s fast generation", durations: ["8"], costPer5s: 0.25 },
  { id: "kling-2.1-pro", label: "Kling 2.6 Pro", type: "text-to-video", description: "5s/10s", durations: ["5", "10"], costPer5s: 0.29 },
  { id: "kling-2.1-master", label: "Kling 2.1 Master", type: "text-to-video", description: "1080p, 5s/10s", durations: ["5", "10"], maxQuality: "1080p", costPer5s: 0.35 },
  { id: "kling-2.5-turbo", label: "Kling 2.5 Turbo", type: "text-to-video", description: "5s/10s fast", durations: ["5", "10"], costPer5s: 0.2 },
  { id: "runway-gen4", label: "Runway Gen-4", type: "text-to-video", description: "720p/1080p, 5s/10s", durations: ["5", "10"], maxQuality: "1080p", costPer5s: 0.4 },
  { id: "runway-aleph", label: "Runway Aleph", type: "text-to-video", description: "5s/10s", durations: ["5", "10"], costPer5s: 0.3 },
  { id: "veo3-i2v", label: "Google Veo 3 I2V", type: "image-to-video", description: "Image-to-video, requires image", durations: ["8"], costPer5s: 0.5 },
  { id: "kling-2.1-master-i2v", label: "Kling 2.1 Master I2V", type: "image-to-video", description: "Image-to-video, 5s/10s", durations: ["5", "10"], costPer5s: 0.35 },
  { id: "kling-2.5-turbo-i2v", label: "Kling 2.5 Turbo I2V", type: "image-to-video", description: "Image-to-video, 5s/10s", durations: ["5", "10"], costPer5s: 0.2 },
];

export interface PpqSubmitResponse {
  id: string;
  model: string;
  status: string;
  created: number;
  estimated_cost: number;
}

export interface PpqStatusResponse {
  id: string;
  model: string;
  status: string;
  created: number;
  data?: {
    url: string;
    content_type: string;
  };
  cost?: number;
  error?: string;
}

export interface PpqSubmitParams {
  model: VideoModel;
  prompt: string;
  aspect_ratio?: string;
  duration?: string;
  quality?: string;
  image_url?: string;
}

export interface VideoStylePreset {
  id: string;
  name: string;
  promptTemplate: string;
  defaultModel: VideoModel;
  description: string;
}

export const VIDEO_STYLE_PRESETS: VideoStylePreset[] = [
  {
    id: "cinematic",
    name: "Cinematic",
    promptTemplate: "Cinematic {prompt}, dramatic lighting, professional camera movement, film grain, 4K quality",
    defaultModel: "kling-2.1-master",
    description: "Dramatic, professional film-style video",
  },
  {
    id: "product-showcase",
    name: "Product Showcase",
    promptTemplate: "Professional product showcase of {prompt}, studio lighting, clean background, rotating camera, commercial style",
    defaultModel: "kling-2.1-pro",
    description: "Clean studio product shot with rotation",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    promptTemplate: "Lifestyle scene featuring {prompt}, natural lighting, warm tones, candid feel, social media ready",
    defaultModel: "kling-2.5-turbo",
    description: "Natural, social-media-friendly lifestyle content",
  },
  {
    id: "ugc",
    name: "UGC Style",
    promptTemplate: "User-generated content style, {prompt}, handheld camera, authentic feel, vertical format, TikTok style",
    defaultModel: "kling-2.5-turbo",
    description: "Authentic TikTok/Reels style content",
  },
  {
    id: "character-story",
    name: "Character Story",
    promptTemplate: "{character} interacting with {prompt}, engaging narrative, expressive animation, social media ready",
    defaultModel: "veo3-fast",
    description: "Character-driven product story",
  },
  {
    id: "abstract",
    name: "Abstract / Artistic",
    promptTemplate: "Abstract artistic interpretation of {prompt}, creative visuals, motion graphics, vibrant colors",
    defaultModel: "runway-gen4",
    description: "Creative, artistic, motion-graphics style",
  },
];
