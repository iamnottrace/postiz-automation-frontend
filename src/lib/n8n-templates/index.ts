import type { N8nCreateWorkflowInput } from "@/types/n8n";

export type TemplateParam = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  default: string;
  options?: { label: string; value: string }[];
  placeholder?: string;
};

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  params: TemplateParam[];
  build: (values: Record<string, string>) => N8nCreateWorkflowInput;
};

const postizBaseUrl = process.env.POSTIZ_API_URL?.replace("/api/public/v1", "") || "http://postiz:3000";
const postizApiUrl = `${postizBaseUrl}/api/public/v1`;
const postizApiKey = process.env.POSTIZ_API_KEY || "";

export const templates: WorkflowTemplate[] = [
  {
    id: "rss-to-post",
    name: "RSS → AI → Post",
    description: "Monitor an RSS feed, generate social posts with AI, and schedule them via Postiz.",
    icon: "Newspaper",
    params: [
      { key: "rssUrl", label: "RSS Feed URL", type: "text", default: "", placeholder: "https://example.com/feed.xml" },
      { key: "interval", label: "Check Interval (hours)", type: "number", default: "4" },
      { key: "aiPrompt", label: "AI Prompt", type: "textarea", default: "Write a engaging social media post about this article. Keep it concise and add relevant hashtags." },
      { key: "integrationId", label: "Postiz Integration ID", type: "text", default: "", placeholder: "Channel ID from Postiz" },
    ],
    build: (v) => ({
      name: "RSS → AI → Post",
      nodes: [
        {
          id: "trigger",
          name: "Schedule Trigger",
          type: "n8n-nodes-base.scheduleTrigger",
          typeVersion: 1.1,
          position: [240, 300],
          parameters: { rule: { interval: [{ field: "hours", hoursInterval: parseInt(v.interval || "4") }] } },
        },
        {
          id: "rss",
          name: "Fetch RSS",
          type: "n8n-nodes-base.rssFeedRead",
          typeVersion: 1.1,
          position: [460, 300],
          parameters: { url: v.rssUrl, options: {} },
        },
        {
          id: "ai",
          name: "Generate Post",
          type: "n8n-nodes-base.openAi",
          typeVersion: 1.4,
          position: [680, 300],
          parameters: {
            resource: "text",
            operation: "message",
            messages: {
              messageValues: [
                { content: v.aiPrompt + "\n\nArticle: {{$json[\"title\"]}} - {{$json[\"content\"]}}" },
              ],
            },
          },
        },
        {
          id: "postiz",
          name: "Schedule Post",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [900, 300],
          parameters: {
            method: "POST",
            url: `${postizApiUrl}/posts`,
            authentication: "genericCredentialType",
            genericAuthType: "httpHeaderAuth",
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: "content", value: "={{ $json.content }}" },
                { name: "type", value: "schedule" },
                { name: "integrationId", value: v.integrationId },
                { name: "date", value: "={{ $now.plus(1, 'hour').toISOString() }}" },
              ],
            },
          },
        },
      ],
      connections: {
        ScheduleTrigger: { main: [[{ node: "Fetch RSS", type: "main", index: 0 }]] },
        "Fetch RSS": { main: [[{ node: "Generate Post", type: "main", index: 0 }]] },
        "Generate Post": { main: [[{ node: "Schedule Post", type: "main", index: 0 }]] },
      },
      tags: ["postiz", "rss", "ai"],
    }),
  },
  {
    id: "ai-content-gen",
    name: "AI Content Generator",
    description: "Generate multiple post variants for different platforms with AI, saved as drafts for review.",
    icon: "Sparkles",
    params: [
      { key: "prompt", label: "Content Prompt", type: "textarea", default: "", placeholder: "Write about our new product launch..." },
      { key: "platforms", label: "Target Platforms", type: "text", default: "x,linkedin,instagram", placeholder: "Comma-separated" },
      { key: "integrationIds", label: "Integration IDs (comma-separated)", type: "text", default: "", placeholder: "id1,id2,id3" },
    ],
    build: (v) => ({
      name: "AI Content Generator",
      nodes: [
        {
          id: "webhook",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [240, 300],
          parameters: { httpMethod: "POST", path: "ai-generate", responseMode: "responseNode" },
        },
        {
          id: "ai",
          name: "Generate Content",
          type: "n8n-nodes-base.openAi",
          typeVersion: 1.4,
          position: [460, 300],
          parameters: {
            resource: "text",
            operation: "message",
            messages: {
              messageValues: [
                { content: `Generate social media posts for these platforms: ${v.platforms}. Prompt: ${v.prompt}. Output one post per line.` },
              ],
            },
          },
        },
        {
          id: "split",
          name: "Split Lines",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [680, 300],
          parameters: { jsCode: "const lines = $input.first().json.content.split('\\n').filter(l => l.trim()); return lines.map(l => ({ json: { content: l.trim() } }));" },
        },
        {
          id: "postiz",
          name: "Save Draft",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [900, 300],
          parameters: {
            method: "POST",
            url: `${postizApiUrl}/posts`,
            authentication: "genericCredentialType",
            genericAuthType: "httpHeaderAuth",
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: "content", value: "={{ $json.content }}" },
                { name: "type", value: "draft" },
                { name: "integrationId", value: v.integrationIds.split(",")[0] || "" },
              ],
            },
          },
        },
        {
          id: "respond",
          name: "Respond",
          type: "n8n-nodes-base.respondToWebhook",
          typeVersion: 1,
          position: [1120, 300],
          parameters: { respondWith: "json", responseBody: "={{ { success: true } }}", options: {} },
        },
      ],
      connections: {
        Webhook: { main: [[{ node: "Generate Content", type: "main", index: 0 }]] },
        "Generate Content": { main: [[{ node: "Split Lines", type: "main", index: 0 }]] },
        "Split Lines": { main: [[{ node: "Save Draft", type: "main", index: 0 }]] },
        "Save Draft": { main: [[{ node: "Respond", type: "main", index: 0 }]] },
      },
      tags: ["postiz", "ai", "content"],
    }),
  },
  {
    id: "auto-engage",
    name: "Auto-Engage",
    description: "Monitor post milestones and automatically like or comment when engagement thresholds are reached.",
    icon: "Heart",
    params: [
      { key: "interval", label: "Check Interval (minutes)", type: "number", default: "30" },
      { key: "likeThreshold", label: "Like Threshold", type: "number", default: "100" },
      { key: "integrationId", label: "Integration ID", type: "text", default: "" },
    ],
    build: (v) => ({
      name: "Auto-Engage",
      nodes: [
        {
          id: "trigger",
          name: "Schedule Trigger",
          type: "n8n-nodes-base.scheduleTrigger",
          typeVersion: 1.1,
          position: [240, 300],
          parameters: { rule: { interval: [{ field: "minutes", minutesInterval: parseInt(v.interval || "30") }] } },
        },
        {
          id: "analytics",
          name: "Get Analytics",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [460, 300],
          parameters: {
            method: "GET",
            url: `${postizApiUrl}/analytics/${v.integrationId}`,
            authentication: "genericCredentialType",
            genericAuthType: "httpHeaderAuth",
          },
        },
        {
          id: "check",
          name: "Check Milestone",
          type: "n8n-nodes-base.if",
          typeVersion: 2.2,
          position: [680, 300],
          parameters: {
            conditions: {
              number: [{ value1: "={{ $json.metrics.likes }}", operation: "largerEqual", value2: parseInt(v.likeThreshold || "100") }],
            },
          },
        },
        {
          id: "engage",
          name: "Trigger Engagement",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [900, 200],
          parameters: {
            method: "POST",
            url: `${postizApiUrl}/integration-trigger/${v.integrationId}`,
            authentication: "genericCredentialType",
            genericAuthType: "httpHeaderAuth",
            sendBody: true,
            bodyParameters: { parameters: [{ name: "methodName", value: "like" }, { name: "data", value: "{}" }] },
          },
        },
      ],
      connections: {
        "Schedule Trigger": { main: [[{ node: "Get Analytics", type: "main", index: 0 }]] },
        "Get Analytics": { main: [[{ node: "Check Milestone", type: "main", index: 0 }]] },
        "Check Milestone": { main: [[{ node: "Trigger Engagement", type: "main", index: 0 }]] },
      },
      tags: ["postiz", "engage"],
    }),
  },
  {
    id: "bulk-schedule",
    name: "Bulk Schedule",
    description: "Upload a CSV of posts and schedule them across multiple channels in bulk.",
    icon: "Upload",
    params: [
      { key: "integrationId", label: "Default Integration ID", type: "text", default: "" },
    ],
    build: (v) => ({
      name: "Bulk Schedule",
      nodes: [
        {
          id: "webhook",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [240, 300],
          parameters: { httpMethod: "POST", path: "bulk-schedule", responseMode: "responseNode" },
        },
        {
          id: "parse",
          name: "Parse CSV",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [460, 300],
          parameters: { jsCode: "const items = $input.first().json.rows; return items.map(row => ({ json: row }));" },
        },
        {
          id: "postiz",
          name: "Schedule Post",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [680, 300],
          parameters: {
            method: "POST",
            url: `${postizApiUrl}/posts`,
            authentication: "genericCredentialType",
            genericAuthType: "httpHeaderAuth",
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: "content", value: "={{ $json.content }}" },
                { name: "type", value: "schedule" },
                { name: "integrationId", value: "={{ $json.integrationId || '" + v.integrationId + "' }}" },
                { name: "date", value: "={{ $json.date }}" },
              ],
            },
          },
        },
        {
          id: "respond",
          name: "Respond",
          type: "n8n-nodes-base.respondToWebhook",
          typeVersion: 1,
          position: [900, 300],
          parameters: { respondWith: "json", responseBody: "={{ { success: true, count: $items.length } }}", options: {} },
        },
      ],
      connections: {
        Webhook: { main: [[{ node: "Parse CSV", type: "main", index: 0 }]] },
        "Parse CSV": { main: [[{ node: "Schedule Post", type: "main", index: 0 }]] },
        "Schedule Post": { main: [[{ node: "Respond", type: "main", index: 0 }]] },
      },
      tags: ["postiz", "bulk"],
    }),
  },
  {
    id: "evergreen-recycler",
    name: "Evergreen Recycler",
    description: "Weekly reschedule your top-performing posts with AI-refreshed content.",
    icon: "Recycle",
    params: [
      { key: "integrationId", label: "Integration ID", type: "text", default: "" },
      { key: "topN", label: "Top N Posts", type: "number", default: "5" },
    ],
    build: (v) => ({
      name: "Evergreen Recycler",
      nodes: [
        {
          id: "trigger",
          name: "Weekly Trigger",
          type: "n8n-nodes-base.scheduleTrigger",
          typeVersion: 1.1,
          position: [240, 300],
          parameters: { rule: { interval: [{ field: "weeks", weeksInterval: 1 }] } },
        },
        {
          id: "analytics",
          name: "Get Top Posts",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [460, 300],
          parameters: {
            method: "GET",
            url: `${postizApiUrl}/analytics/${v.integrationId}`,
            authentication: "genericCredentialType",
            genericAuthType: "httpHeaderAuth",
          },
        },
        {
          id: "sort",
          name: "Sort & Limit",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [680, 300],
          parameters: { jsCode: `const posts = $input.first().json.posts || []; posts.sort((a,b) => (b.metrics?.likes||0) - (a.metrics?.likes||0)); return posts.slice(0, ${v.topN || 5}).map(p => ({ json: p }));` },
        },
        {
          id: "ai",
          name: "Refresh Content",
          type: "n8n-nodes-base.openAi",
          typeVersion: 1.4,
          position: [900, 300],
          parameters: {
            resource: "text",
            operation: "message",
            messages: { messageValues: [{ content: "Rewrite this social media post with a fresh angle but keep the same message: {{$json.content}}" }] },
          },
        },
        {
          id: "postiz",
          name: "Reschedule",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [1120, 300],
          parameters: {
            method: "POST",
            url: `${postizApiUrl}/posts`,
            authentication: "genericCredentialType",
            genericAuthType: "httpHeaderAuth",
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: "content", value: "={{ $json.content }}" },
                { name: "type", value: "schedule" },
                { name: "integrationId", value: v.integrationId },
                { name: "date", value: "={{ $now.plus(2, 'days').toISOString() }}" },
              ],
            },
          },
        },
      ],
      connections: {
        "Weekly Trigger": { main: [[{ node: "Get Top Posts", type: "main", index: 0 }]] },
        "Get Top Posts": { main: [[{ node: "Sort & Limit", type: "main", index: 0 }]] },
        "Sort & Limit": { main: [[{ node: "Refresh Content", type: "main", index: 0 }]] },
        "Refresh Content": { main: [[{ node: "Reschedule", type: "main", index: 0 }]] },
      },
      tags: ["postiz", "evergreen"],
    }),
  },
  {
    id: "daily-product-video",
    name: "Daily Product Video → Post",
    description: "Generate a product video daily via ppq.ai, then post it to social media through Postiz.",
    icon: "Video",
    params: [
      { key: "prompt", label: "Video Prompt", type: "textarea", default: "Professional product showcase, rotating camera, studio lighting", placeholder: "Describe the video..." },
      { key: "model", label: "Video Model", type: "select", default: "kling-2.1-pro", options: [
        { label: "Kling 2.6 Pro (5s/10s)", value: "kling-2.1-pro" },
        { label: "Kling 2.5 Turbo (fast)", value: "kling-2.5-turbo" },
        { label: "Veo 3 (8s quality)", value: "veo3" },
        { label: "Veo 3 Fast (8s)", value: "veo3-fast" },
        { label: "Runway Gen-4", value: "runway-gen4" },
      ]},
      { key: "cron", label: "Schedule (Cron)", type: "text", default: "0 10 * * *", placeholder: "0 10 * * * = daily at 10am" },
      { key: "integrationId", label: "Postiz Integration ID", type: "text", default: "", placeholder: "Target channel ID" },
    ],
    build: (v) => ({
      name: "Daily Product Video",
      nodes: [
        { name: "Daily Trigger", type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2, position: [250, 300], parameters: { rule: { interval: [{ field: "cronExpression", expression: v.cron }] } } },
        { name: "Generate Video", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [450, 300], parameters: {
          method: "POST", url: "https://api.ppq.ai/v1/videos",
          sendHeaders: true, headerParameters: { parameters: [
            { name: "Authorization", value: `Bearer ${process.env.PPQ_API_KEY || ""}` },
            { name: "Content-Type", value: "application/json" },
          ]},
          sendBody: true, specifyBody: "json",
          jsonBody: JSON.stringify({ model: v.model, prompt: v.prompt, aspect_ratio: "9:16", duration: "5" }),
        }},
        { name: "Wait for Video", type: "n8n-nodes-base.wait", typeVersion: 1.1, position: [650, 300], parameters: { wait: 90 } },
        { name: "Check Status", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [850, 300], parameters: {
          method: "GET", url: "={{ 'https://api.ppq.ai/v1/videos/' + $('Generate Video').first().json.id }}",
          sendHeaders: true, headerParameters: { parameters: [{ name: "Authorization", value: `Bearer ${process.env.PPQ_API_KEY || ""}` }] },
        }},
        { name: "Download Video", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [1050, 300], parameters: {
          method: "GET", url: "={{ $json.data.url }}", responseFormat: "file",
        }},
        { name: "Upload to Postiz", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [1250, 300], parameters: {
          method: "POST", url: `${postizApiUrl}/upload`,
          sendHeaders: true, headerParameters: { parameters: [{ name: "apiKey", value: postizApiKey }] },
          sendBody: true, contentType: "multipart-form-data",
          bodyParameters: { parameters: [{ name: "file", parameterType: "form-data-binary-data", inputDataFieldName: "data" }] },
        }},
        { name: "Create Post", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [1450, 300], parameters: {
          method: "POST", url: `${postizApiUrl}/posts`,
          sendHeaders: true, headerParameters: { parameters: [{ name: "apiKey", value: postizApiKey }, { name: "Content-Type", value: "application/json" }] },
          sendBody: true, specifyBody: "json",
          jsonBody: JSON.stringify({ content: v.prompt, integrationId: v.integrationId, type: "now" }),
        }},
      ],
      connections: {
        "Daily Trigger": { main: [[{ node: "Generate Video", type: "main", index: 0 }]] },
        "Generate Video": { main: [[{ node: "Wait for Video", type: "main", index: 0 }]] },
        "Wait for Video": { main: [[{ node: "Check Status", type: "main", index: 0 }]] },
        "Check Status": { main: [[{ node: "Download Video", type: "main", index: 0 }]] },
        "Download Video": { main: [[{ node: "Upload to Postiz", type: "main", index: 0 }]] },
        "Upload to Postiz": { main: [[{ node: "Create Post", type: "main", index: 0 }]] },
      },
      tags: ["postiz", "video", "ppq.ai"],
    }),
  },
  {
    id: "rss-to-video",
    name: "RSS → AI Prompt → Video → Post",
    description: "Monitor RSS feed, generate a video prompt from articles using AI, create a video via ppq.ai, and post to Postiz.",
    icon: "Video",
    params: [
      { key: "rssUrl", label: "RSS Feed URL", type: "text", default: "https://feeds.example.com/feed.xml", placeholder: "https://..." },
      { key: "model", label: "Video Model", type: "select", default: "kling-2.5-turbo", options: [
        { label: "Kling 2.5 Turbo (fast)", value: "kling-2.5-turbo" },
        { label: "Kling 2.6 Pro", value: "kling-2.1-pro" },
        { label: "Veo 3 Fast", value: "veo3-fast" },
      ]},
      { key: "integrationId", label: "Postiz Integration ID", type: "text", default: "", placeholder: "Target channel ID" },
    ],
    build: (v) => ({
      name: "RSS to Video",
      nodes: [
        { name: "RSS Trigger", type: "n8n-nodes-base.rssFeedRead", typeVersion: 1.1, position: [250, 300], parameters: { url: v.rssUrl, limit: 1 } },
        { name: "AI Prompt", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [450, 300], parameters: {
          method: "POST", url: "https://api.openai.com/v1/chat/completions",
          sendHeaders: true, headerParameters: { parameters: [{ name: "Authorization", value: `Bearer ${process.env.OPENAI_API_KEY || ""}` }] },
          sendBody: true, specifyBody: "json",
          jsonBody: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: `Create a 1-sentence video prompt for a social media video about: {{ $json.title }} - {{ $json.contentSnippet }}` }] }),
        }},
        { name: "Generate Video", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [650, 300], parameters: {
          method: "POST", url: "https://api.ppq.ai/v1/videos",
          sendHeaders: true, headerParameters: { parameters: [
            { name: "Authorization", value: `Bearer ${process.env.PPQ_API_KEY || ""}` },
            { name: "Content-Type", value: "application/json" },
          ]},
          sendBody: true, specifyBody: "json",
          jsonBody: "={\"model\": \"" + v.model + "\", \"prompt\": \"{{ $json.choices[0].message.content }}\", \"aspect_ratio\": \"16:9\", \"duration\": \"5\"}",
        }},
        { name: "Wait", type: "n8n-nodes-base.wait", typeVersion: 1.1, position: [850, 300], parameters: { wait: 90 } },
        { name: "Check Status", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [1050, 300], parameters: {
          method: "GET", url: "={{ 'https://api.ppq.ai/v1/videos/' + $('Generate Video').first().json.id }}",
          sendHeaders: true, headerParameters: { parameters: [{ name: "Authorization", value: `Bearer ${process.env.PPQ_API_KEY || ""}` }] },
        }},
        { name: "Download", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [1250, 300], parameters: {
          method: "GET", url: "={{ $json.data.url }}", responseFormat: "file",
        }},
        { name: "Upload & Post", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [1450, 300], parameters: {
          method: "POST", url: `${postizApiUrl}/posts`,
          sendHeaders: true, headerParameters: { parameters: [{ name: "apiKey", value: postizApiKey }, { name: "Content-Type", value: "application/json" }] },
          sendBody: true, specifyBody: "json",
          jsonBody: JSON.stringify({ content: "New video from RSS!", integrationId: v.integrationId, type: "now" }),
        }},
      ],
      connections: {
        "RSS Trigger": { main: [[{ node: "AI Prompt", type: "main", index: 0 }]] },
        "AI Prompt": { main: [[{ node: "Generate Video", type: "main", index: 0 }]] },
        "Generate Video": { main: [[{ node: "Wait", type: "main", index: 0 }]] },
        "Wait": { main: [[{ node: "Check Status", type: "main", index: 0 }]] },
        "Check Status": { main: [[{ node: "Download", type: "main", index: 0 }]] },
        "Download": { main: [[{ node: "Upload & Post", type: "main", index: 0 }]] },
      },
      tags: ["postiz", "video", "rss", "ppq.ai"],
    }),
  },
  {
    id: "trending-topic-video",
    name: "Trending Topic → Video → Post",
    description: "Webhook-triggered: receive a trending topic, generate a video about it via ppq.ai, and post to Postiz.",
    icon: "TrendingUp",
    params: [
      { key: "model", label: "Video Model", type: "select", default: "veo3-fast", options: [
        { label: "Veo 3 Fast (8s)", value: "veo3-fast" },
        { label: "Kling 2.5 Turbo", value: "kling-2.5-turbo" },
        { label: "Runway Gen-4", value: "runway-gen4" },
      ]},
      { key: "integrationId", label: "Postiz Integration ID", type: "text", default: "", placeholder: "Target channel ID" },
    ],
    build: (v) => ({
      name: "Trending Topic Video",
      nodes: [
        { name: "Webhook", type: "n8n-nodes-base.webhook", typeVersion: 2, position: [250, 300], parameters: { path: "trending-video", responseMode: "lastNode" } },
        { name: "Generate Video", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [450, 300], parameters: {
          method: "POST", url: "https://api.ppq.ai/v1/videos",
          sendHeaders: true, headerParameters: { parameters: [
            { name: "Authorization", value: `Bearer ${process.env.PPQ_API_KEY || ""}` },
            { name: "Content-Type", value: "application/json" },
          ]},
          sendBody: true, specifyBody: "json",
          jsonBody: "={\"model\": \"" + v.model + "\", \"prompt\": \"{{ $json.body.topic }} - trending news video, engaging, social media style\", \"aspect_ratio\": \"9:16\", \"duration\": \"5\"}",
        }},
        { name: "Wait", type: "n8n-nodes-base.wait", typeVersion: 1.1, position: [650, 300], parameters: { wait: 90 } },
        { name: "Check Status", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [850, 300], parameters: {
          method: "GET", url: "={{ 'https://api.ppq.ai/v1/videos/' + $('Generate Video').first().json.id }}",
          sendHeaders: true, headerParameters: { parameters: [{ name: "Authorization", value: `Bearer ${process.env.PPQ_API_KEY || ""}` }] },
        }},
        { name: "Download", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [1050, 300], parameters: {
          method: "GET", url: "={{ $json.data.url }}", responseFormat: "file",
        }},
        { name: "Upload to Postiz", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [1250, 300], parameters: {
          method: "POST", url: `${postizApiUrl}/upload`,
          sendHeaders: true, headerParameters: { parameters: [{ name: "apiKey", value: postizApiKey }] },
          sendBody: true, contentType: "multipart-form-data",
          bodyParameters: { parameters: [{ name: "file", parameterType: "form-data-binary-data", inputDataFieldName: "data" }] },
        }},
        { name: "Create Post", type: "n8n-nodes-base.httpRequest", typeVersion: 4.1, position: [1450, 300], parameters: {
          method: "POST", url: `${postizApiUrl}/posts`,
          sendHeaders: true, headerParameters: { parameters: [{ name: "apiKey", value: postizApiKey }, { name: "Content-Type", value: "application/json" }] },
          sendBody: true, specifyBody: "json",
          jsonBody: "={\"content\": \"{{ $('Webhook').first().json.body.topic }}\", \"integrationId\": \"" + v.integrationId + "\", \"type\": \"now\"}",
        }},
      ],
      connections: {
        "Webhook": { main: [[{ node: "Generate Video", type: "main", index: 0 }]] },
        "Generate Video": { main: [[{ node: "Wait", type: "main", index: 0 }]] },
        "Wait": { main: [[{ node: "Check Status", type: "main", index: 0 }]] },
        "Check Status": { main: [[{ node: "Download", type: "main", index: 0 }]] },
        "Download": { main: [[{ node: "Upload to Postiz", type: "main", index: 0 }]] },
        "Upload to Postiz": { main: [[{ node: "Create Post", type: "main", index: 0 }]] },
      },
      tags: ["postiz", "video", "trending", "ppq.ai"],
    }),
  },
];

export function getTemplate(id: string): WorkflowTemplate | undefined {
  return templates.find((t) => t.id === id);
}
