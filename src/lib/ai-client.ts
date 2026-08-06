const API_KEY = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || "";
const PROVIDER = process.env.OPENAI_API_KEY ? "openai" : "anthropic";
const OPENAI_URL = "https://api.openai.com/v1";
const ANTHROPIC_URL = "https://api.anthropic.com/v1";

export type AIGenerateInput = {
  prompt: string;
  platform?: string;
  tone?: string;
  maxLength?: number;
  count?: number;
};

export type AIGenerateResult = {
  texts: string[];
};

export const aiClient = {
  isConfigured: () => Boolean(API_KEY),

  generate: async (input: AIGenerateInput): Promise<AIGenerateResult> => {
    if (PROVIDER === "openai") {
      return generateWithOpenAI(input);
    }
    return generateWithAnthropic(input);
  },
};

async function generateWithOpenAI(input: AIGenerateInput): Promise<AIGenerateResult> {
  const count = input.count || 1;
  const systemPrompt = buildSystemPrompt(input.platform, input.tone, input.maxLength);

  const res = await fetch(`${OPENAI_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.prompt },
      ],
      n: count,
      temperature: 0.8,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return {
    texts: data.choices.map((c: { message: { content: string } }) => c.message.content),
  };
}

async function generateWithAnthropic(input: AIGenerateInput): Promise<AIGenerateResult> {
  const systemPrompt = buildSystemPrompt(input.platform, input.tone, input.maxLength);

  const res = await fetch(`${ANTHROPIC_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: input.prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return {
    texts: [data.content[0].text],
  };
}

function buildSystemPrompt(platform?: string, tone?: string, maxLength?: number): string {
  let prompt = "You are a social media content writer. Write engaging, concise posts.";
  if (platform) {
    prompt += ` The target platform is ${platform}. Adapt the style accordingly.`;
  }
  if (tone) {
    prompt += ` Use a ${tone} tone.`;
  }
  if (maxLength) {
    prompt += ` Keep it under ${maxLength} characters.`;
  }
  prompt += " Do not include quotes or meta-commentary. Just output the post text.";
  return prompt;
}
