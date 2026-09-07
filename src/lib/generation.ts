import Anthropic from "@anthropic-ai/sdk";
import type { GeneratedContent } from "./types";

// Note/flashcard/quiz generation is pluggable between providers, selected
// via LLM_PROVIDER in .env:
// - "groq"      cheapest/fastest cloud option, has a free tier
// - "anthropic" Claude, if you'd rather use that directly
// - "ollama"    fully local and free, no key — but only reachable when
//               running the app locally (npm run dev), since a Vercel
//               deployment can't reach a process on your own machine

const TOOL_NAME = "emit_lecture_materials";

const PROMPT = (transcript: string) => `You are turning a raw lecture transcript into study materials for a student.

1. Write structured notes in markdown: use headings for each topic covered, bullet points for supporting details, and end with a "Key Terms" section defining important terms/concepts.
2. Generate 10-20 flashcards covering the most important facts and concepts.
3. Generate a 5-10 question multiple choice quiz (3-5 choices each) testing understanding of the material.

Base everything strictly on the transcript content below — don't invent facts that weren't covered.

Transcript:
"""
${transcript}
"""`;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    notesMarkdown: {
      type: "string",
      description:
        "Structured lecture notes in markdown: headings for topics, bullet points for details, and a key terms section with definitions.",
    },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "answer"],
      },
    },
    quiz: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          choices: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 5,
          },
          correctAnswer: {
            type: "string",
            description: "Must exactly match one of the strings in choices.",
          },
        },
        required: ["question", "choices", "correctAnswer"],
      },
    },
  },
  required: ["notesMarkdown", "flashcards", "quiz"],
};

export async function generateLectureMaterials(
  transcript: string
): Promise<GeneratedContent> {
  const provider = process.env.LLM_PROVIDER;
  if (provider === "anthropic") return generateWithAnthropic(transcript);
  if (provider === "groq") return generateWithGroq(transcript);
  if (provider === "ollama") return generateWithOllama(transcript);
  throw new Error(
    `LLM_PROVIDER must be "groq", "anthropic", or "ollama", got: ${provider}`
  );
}

async function generateWithAnthropic(transcript: string): Promise<GeneratedContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY in .env");

  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model,
    max_tokens: 8000,
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Emit the structured notes, flashcards, and quiz generated from a lecture transcript.",
        input_schema: JSON_SCHEMA as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [{ role: "user", content: PROMPT(transcript) }],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("Claude did not return structured output as expected");
  }

  return toolUse.input as GeneratedContent;
}

// Shared by Groq and Ollama — both speak the OpenAI-compatible chat
// completions + tool calling format.
async function generateWithOpenAICompatible(
  providerLabel: string,
  baseUrl: string,
  model: string,
  apiKey: string | undefined,
  transcript: string,
  retriesLeft = 1
): Promise<GeneratedContent> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: PROMPT(transcript) }],
        tools: [
          {
            type: "function",
            function: {
              name: TOOL_NAME,
              description:
                "Emit the structured notes, flashcards, and quiz generated from a lecture transcript.",
              parameters: JSON_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: TOOL_NAME } },
      }),
    });
  } catch (err) {
    throw new Error(
      `Could not reach ${providerLabel} at ${baseUrl}. ${
        err instanceof Error ? err.message : ""
      }`
    );
  }

  if (!res.ok) {
    const text = await res.text();

    // Longer/messier source text (PDFs especially) occasionally makes the
    // model emit tool-call arguments the provider itself can't parse as
    // JSON (e.g. an unescaped smart quote). It's transient and
    // non-deterministic — retrying once, silently, usually just works.
    const isToolCallJsonFailure = /tool_use_failed|failed to parse tool call/i.test(text);
    if (isToolCallJsonFailure && retriesLeft > 0) {
      return generateWithOpenAICompatible(
        providerLabel,
        baseUrl,
        model,
        apiKey,
        transcript,
        retriesLeft - 1
      );
    }

    throw new Error(`${providerLabel} generation failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    choices: {
      message: {
        tool_calls?: { function: { arguments: string } }[];
        content?: string | null;
      };
    }[];
  };
  const message = data.choices[0]?.message;
  const call = message?.tool_calls?.[0];

  if (call) {
    return JSON.parse(call.function.arguments) as GeneratedContent;
  }

  // Some OpenAI-compatible servers (Ollama, depending on model) don't
  // populate tool_calls and instead dump the call as JSON text in content,
  // sometimes as {name, parameters} and sometimes fenced in ```json.
  if (message?.content) {
    const fromContent = parseToolCallFromText(message.content);
    if (fromContent) return fromContent;
  }

  throw new Error(`${providerLabel} did not return structured output as expected`);
}

function parseToolCallFromText(content: string): GeneratedContent | null {
  const unfenced = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();

  const tryParse = (text: string): unknown => {
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  };

  // Smaller local models often emit near-valid JSON with trailing commas
  // before a closing } or ] — strip those and retry before giving up.
  const parsed =
    tryParse(unfenced) ?? tryParse(unfenced.replace(/,(\s*[}\]])/g, "$1"));

  if (parsed && typeof parsed === "object") {
    if ("parameters" in parsed) {
      return (parsed as { parameters: unknown }).parameters as GeneratedContent;
    }
    if ("notesMarkdown" in parsed) {
      return parsed as GeneratedContent;
    }
  }
  return null;
}

async function generateWithGroq(transcript: string): Promise<GeneratedContent> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY in .env");

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  return generateWithOpenAICompatible(
    "Groq",
    "https://api.groq.com/openai/v1",
    model,
    apiKey,
    transcript
  );
}

async function generateWithOllama(transcript: string): Promise<GeneratedContent> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.1";

  try {
    return await generateWithOpenAICompatible(
      "Ollama",
      `${baseUrl}/v1`,
      model,
      undefined,
      transcript
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `${message} Make sure Ollama is installed and running (\`ollama serve\`) and the model is pulled (\`ollama pull ${model}\`). Ollama only works when running this app locally — it can't be reached from a Vercel deployment.`
    );
  }
}
