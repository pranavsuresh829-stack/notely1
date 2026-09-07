// Transcription is API-based and pluggable between providers, selected via
// TRANSCRIPTION_PROVIDER in .env. All are keyed per-deployer (bring your own
// key) — see .env.example. Groq is the cheapest/fastest option and has a
// free tier; OpenAI and AssemblyAI are there if you'd rather use those.

type Provider = "groq" | "openai" | "assemblyai";

function getProvider(): Provider {
  const provider = process.env.TRANSCRIPTION_PROVIDER;
  if (provider === "groq" || provider === "openai" || provider === "assemblyai") {
    return provider;
  }
  throw new Error(
    `TRANSCRIPTION_PROVIDER must be "groq", "openai", or "assemblyai", got: ${provider}`
  );
}

export async function transcribeAudio(
  audioBlob: Blob,
  filename: string
): Promise<string> {
  const provider = getProvider();
  if (provider === "groq") return transcribeWithGroq(audioBlob, filename);
  if (provider === "openai") return transcribeWithOpenAI(audioBlob, filename);
  return transcribeWithAssemblyAI(audioBlob);
}

async function transcribeWithGroq(audioBlob: Blob, filename: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY in .env");

  const model = process.env.GROQ_TRANSCRIBE_MODEL || "whisper-large-v3-turbo";

  const form = new FormData();
  form.append("file", audioBlob, filename);
  form.append("model", model);

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq transcription failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}

async function transcribeWithOpenAI(
  audioBlob: Blob,
  filename: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY in .env");

  const form = new FormData();
  form.append("file", audioBlob, filename);
  form.append("model", "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI transcription failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}

async function transcribeWithAssemblyAI(audioBlob: Blob): Promise<string> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) throw new Error("Missing ASSEMBLYAI_API_KEY in .env");

  const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: { authorization: apiKey },
    body: audioBlob,
  });
  if (!uploadRes.ok) {
    throw new Error(`AssemblyAI upload failed (${uploadRes.status})`);
  }
  const { upload_url } = (await uploadRes.json()) as { upload_url: string };

  const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ audio_url: upload_url }),
  });
  if (!transcriptRes.ok) {
    throw new Error(`AssemblyAI transcript request failed (${transcriptRes.status})`);
  }
  const { id } = (await transcriptRes.json()) as { id: string };

  const pollUrl = `https://api.assemblyai.com/v2/transcript/${id}`;
  const maxAttempts = 120; // ~10 minutes at 5s intervals, enough for a 60+ min lecture
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pollRes = await fetch(pollUrl, {
      headers: { authorization: apiKey },
    });
    if (!pollRes.ok) {
      throw new Error(`AssemblyAI poll failed (${pollRes.status})`);
    }
    const result = (await pollRes.json()) as {
      status: string;
      text?: string;
      error?: string;
    };

    if (result.status === "completed") return result.text ?? "";
    if (result.status === "error") {
      throw new Error(`AssemblyAI transcription error: ${result.error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error("AssemblyAI transcription timed out");
}
