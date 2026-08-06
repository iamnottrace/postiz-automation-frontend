import { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById, getRecastModelById, getLipSyncModelById, getAudioModelById } from './models.js';

// ppq.ai API base — routed through Next.js proxy in browser to avoid CORS
const BASE_URL = (typeof window !== 'undefined' && window.location?.protocol?.startsWith('http'))
    ? '/api/ppq'
    : 'https://api.ppq.ai';

function notifyAuthRequired(status, detail) {
    if (typeof window === 'undefined') return;
    if (status !== 401 && status !== 403) return;
    window.dispatchEvent(new CustomEvent('muapi:auth-required', { detail: { status, message: detail } }));
}

function getHeaders(key) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
    };
}

// ppq.ai uses a simple poll: GET /v1/videos/{id}
async function pollForResult(requestId, key, maxAttempts = 900, interval = 3000) {
    const pollUrl = `${BASE_URL}/v1/videos/${requestId}`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        try {
            const response = await fetch(pollUrl, {
                headers: { 'Authorization': `Bearer ${key}` }
            });
            if (!response.ok) {
                const errText = await response.text();
                if (response.status >= 500) continue;
                notifyAuthRequired(response.status, errText);
                throw new Error(`Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
            }
            const data = await response.json();
            const status = (data.status || '').toLowerCase();
            if (status === 'completed' || status === 'succeeded' || status === 'success') {
                const outputUrl = data.data?.url || data.url || data.output?.url;
                return { ...data, url: outputUrl };
            }
            if (status === 'failed' || status === 'error') throw new Error(`Generation failed: ${data.error || 'Unknown error'}`);
        } catch (error) {
            if (attempt === maxAttempts) throw error;
        }
    }
    throw new Error('Generation timed out after polling.');
}

// ppq.ai submit: POST /v1/videos with { model, prompt, ... }
async function submitAndPoll(endpoint, payload, key, onRequestId, maxAttempts = 900) {
    // Map MuAPI-style endpoint to ppq.ai model field
    // The endpoint IS the model id in ppq.ai
    const model = payload.model || endpoint;
    const body = { ...payload, model };

    const response = await fetch(`${BASE_URL}/v1/videos`, {
        method: 'POST',
        headers: getHeaders(key),
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
    }
    const submitData = await response.json();
    const requestId = submitData.id || submitData.request_id;
    if (!requestId) return submitData;
    if (onRequestId) onRequestId(requestId);
    return await pollForResult(requestId, key, maxAttempts);
}

// ── Image generation ──
export async function generateImage(apiKey, params) {
    const modelInfo = getModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = { prompt: params.prompt };
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (params.image_url) {
        payload.image_url = params.image_url;
        payload.strength = params.strength || 0.6;
    } else if (params.images_list) {
        payload.images_list = params.images_list;
    } else {
        payload.image_url = null;
    }
    if (params.seed && params.seed !== -1) payload.seed = params.seed;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60);
}

export async function generateI2I(apiKey, params) {
    const modelInfo = getI2IModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = {};
    if (params.prompt) payload.prompt = params.prompt;
    const imageField = modelInfo?.imageField || 'image_url';
    const imagesList = params.images_list?.length > 0 ? params.images_list : (params.image_url ? [params.image_url] : null);
    if (imagesList) {
        if (imageField === 'images_list') payload.images_list = imagesList;
        else payload[imageField] = imagesList[0];
    }
    if (modelInfo?.swapField && params.swap_url) {
        payload[modelInfo.swapField] = params.swap_url;
    }
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60);
}

// ── Video generation ──
export async function generateVideo(apiKey, params) {
    const modelInfo = getVideoModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = { model: params.model };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (params.mode) payload.mode = params.mode;
    if (params.image_url) payload.image_url = params.image_url;
    if (params.images_list?.length > 0) payload.images_list = params.images_list;
    if (params.videos_list?.length > 0) payload.videos_list = params.videos_list;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900);
}

export async function generateI2V(apiKey, params) {
    const modelInfo = getI2VModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = { model: params.model };
    if (params.prompt) payload.prompt = params.prompt;
    const imageField = modelInfo?.imageField || 'image_url';
    const imageInput = modelInfo?.inputs?.[imageField];
    const imageUrls = params.images_list?.length > 0
        ? params.images_list
        : (params.image_url ? [params.image_url] : []);
    if (imageUrls.length > 0) {
        if (imageInput?.type === 'array' || imageField === 'images_list') {
            payload[imageField] = imageUrls;
        } else {
            payload[imageField] = imageUrls[0];
        }
    }
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (params.mode) payload.mode = params.mode;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900);
}

export async function generateMarketingStudioAd(apiKey, params) {
    const payload = {
        model: params.resolution === '1080p' ? 'seedance-2-vip-omni-reference-1080p' : 'seedance-2-vip-omni-reference',
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio || '16:9',
        duration: params.duration || 5,
        images_list: params.images_list || [],
        video_files: params.video_files || []
    };
    return submitAndPoll(payload.model, payload, apiKey, params.onRequestId, 900);
}

export async function processV2V(apiKey, params) {
    const modelInfo = getV2VModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const videoField = modelInfo?.videoField || 'video_url';
    const payload = { model: params.model, [videoField]: params.video_url };
    if (modelInfo?.imageField && params.image_url) {
        payload[modelInfo.imageField] = params.image_url;
    }
    if (modelInfo?.hasPrompt && params.prompt) {
        payload.prompt = params.prompt;
    }
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900);
}

export async function processRecast(apiKey, params) {
    const modelInfo = getRecastModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const videoField = modelInfo?.videoField || 'video_url';
    const payload = { model: params.model, [videoField]: params.video_url };
    if (modelInfo?.imageField && params.image_url) {
        payload[modelInfo.imageField] = params.image_url;
    }
    if (modelInfo?.hasPrompt && params.prompt) {
        payload.prompt = params.prompt;
    }
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.character_orientation) payload.character_orientation = params.character_orientation;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900);
}

export async function processLipSync(apiKey, params) {
    const modelInfo = getLipSyncModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = { model: params.model };
    if (params.audio_url) payload.audio_url = params.audio_url;
    if (params.image_url) payload.image_url = params.image_url;
    if (params.video_url) payload.video_url = params.video_url;
    if (modelInfo?.hasPrompt) payload.prompt = params.prompt || '';
    if (params.resolution) payload.resolution = params.resolution;
    if (params.seed !== undefined && params.seed !== -1) payload.seed = params.seed;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900);
}

export async function processAudio(apiKey, params) {
    const modelInfo = getAudioModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = { model: params.model };
    if (params.prompt) payload.prompt = params.prompt;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900);
}

// ── File upload ──
export async function uploadFile(apiKey, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/v1/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errText.slice(0, 100)}`);
    }
    const data = await response.json();
    return data.url || data.file_url || data;
}

// ── Workflow (pass-through, ppq.ai may not support this) ──
export async function executeWorkflow(apiKey, workflowId, inputs) {
    const response = await fetch(`${BASE_URL}/workflow/${workflowId}/api-execute`, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({ inputs })
    });
    if (!response.ok) throw new Error(`Failed to execute workflow: ${response.status}`);
    return await response.json();
}

export async function getAllNodeSchemas(apiKey, workflowId) {
    const response = await fetch(`${BASE_URL}/workflow/${workflowId}/node-schemas`, {
        headers: getHeaders(apiKey)
    });
    if (!response.ok) throw new Error(`Failed to fetch node schemas: ${response.status}`);
    return await response.json();
}

export async function getWorkflowData(apiKey, workflowId) {
    const response = await fetch(`${BASE_URL}/workflow/get-workflow-def/${workflowId}`, {
        headers: getHeaders(apiKey)
    });
    if (!response.ok) throw new Error(`Failed to fetch workflow data: ${response.status}`);
    return await response.json();
}

export async function getNodeSchemas(apiKey, workflowId) {
    const response = await fetch(`${BASE_URL}/workflow/${workflowId}/api-node-schemas`, {
        headers: getHeaders(apiKey)
    });
    if (!response.ok) throw new Error(`Failed to fetch node schemas: ${response.status}`);
    return await response.json();
}

export async function runSingleNode(apiKey, workflowId, nodeId, payload) {
    const response = await fetch(`${BASE_URL}/workflow/${workflowId}/node/${nodeId}/run`, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Failed to run single node: ${response.status}`);
    return await response.json();
}

export async function deleteNodeRun(apiKey, nodeRunId) {
    const response = await fetch(`${BASE_URL}/workflow/node-run/${nodeRunId}`, {
        method: 'DELETE',
        headers: getHeaders(apiKey)
    });
    if (!response.ok) throw new Error(`Failed to delete node run: ${response.status}`);
    return await response.json();
}

export async function getNodeStatus(apiKey, runId) {
    const response = await fetch(`${BASE_URL}/workflow/run/${runId}/status`, {
        headers: getHeaders(apiKey)
    });
    if (!response.ok) throw new Error(`Failed to get node status: ${response.status}`);
    return await response.json();
}

export async function handleProxyRequest(prefix, path, method, headers, body, apiKey) {
    const url = `${BASE_URL}/${prefix}/${path}`;
    const finalHeaders = new Headers(headers);
    finalHeaders.delete('host');
    finalHeaders.delete('connection');
    finalHeaders.delete('content-length');
    if (apiKey) {
        finalHeaders.set('Authorization', `Bearer ${apiKey}`);
    }
    try {
        const response = await fetch(url, { method, headers: finalHeaders, body: (method !== 'GET' && method !== 'HEAD') ? body : undefined, redirect: 'follow' });
        const contentType = response.headers.get('Content-Type') || 'application/json';
        const buffer = await response.arrayBuffer();
        return { status: response.status, contentType, data: buffer };
    } catch (error) {
        console.error(`ppq Proxy error for ${url}:`, error);
        throw error;
    }
}

export async function handleServerSideProxy(prefix, request, params, apiKey) {
    try {
        const slug = await params;
        const pathSegments = slug.path || [];
        const path = pathSegments.join('/');
        const method = request.method;
        let body = null;
        if (method !== 'GET' && method !== 'HEAD') {
            body = await request.arrayBuffer();
        }
        const { search } = new URL(request.url);
        const pathWithSearch = search ? `${path}${search}` : path;
        return await handleProxyRequest(prefix, pathWithSearch, method, request.headers, body, apiKey);
    } catch (error) {
        console.error(`Server proxy failed:`, error);
        throw error;
    }
}

export async function calculateDynamicCost(apiKey, taskName, payload) {
    const response = await fetch(`${BASE_URL}/v1/cost`, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({ task_name: taskName, payload })
    });
    if (!response.ok) throw new Error(`Failed to calculate cost: ${response.status}`);
    return await response.json();
}

export async function registerAppInterest(apiKey, appName) {
    const response = await fetch(`${BASE_URL}/app/interest`, {
        method: 'POST',
        headers: getHeaders(apiKey),
        body: JSON.stringify({ app_name: appName })
    });
    if (!response.ok) throw new Error(`Failed to register interest: ${response.status}`);
    return await response.json();
}

export async function getAppInterests(apiKey) {
    const response = await fetch(`${BASE_URL}/app/interests`, {
        headers: getHeaders(apiKey)
    });
    if (!response.ok) throw new Error(`Failed to fetch interests: ${response.status}`);
    return await response.json();
}

export async function getHistory(apiKey, { cursor, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    const response = await fetch(`${BASE_URL}/v1/videos?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (!response.ok) throw new Error(`Failed to fetch history: ${response.status}`);
    return await response.json();
}

export async function runClipping(apiKey, params) {
    const payload = {
        model: 'ai-clipping',
        video_url: params.video_url,
        num_highlights: params.num_highlights || 3,
        aspect_ratio: params.aspect_ratio || "9:16",
        return_coordinates_only: !!params.return_coordinates_only
    };
    return submitAndPoll("ai-clipping", payload, apiKey, params.onRequestId, 900);
}

export async function runMotionGraphics(apiKey, params) {
    const payload = {
        model: 'motion-graphics',
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio || "16:9",
        duration_seconds: params.duration_seconds || 6,
    };
    return submitAndPoll("motion-graphics", payload, apiKey, params.onRequestId, 900);
}

export async function runMotionGraphicsEdit(apiKey, params) {
    const payload = {
        model: 'motion-graphics-edit',
        request_id: params.request_id,
        edit_prompt: params.edit_prompt,
        aspect_ratio: params.aspect_ratio || "16:9",
        duration_seconds: params.duration_seconds || 6,
    };
    return submitAndPoll("motion-graphics-edit", payload, apiKey, params.onRequestId, 900);
}
