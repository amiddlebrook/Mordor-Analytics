interface Env {
  AI: {
    run: (model: string, input: {
      messages: { role: "system" | "user"; content: string }[];
      max_tokens: number;
      temperature: number;
    }) => Promise<{ response?: string; [key: string]: unknown }>;
  };
}

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === "/api/health") {
      return request.method === "GET"
        ? json({ ok: true, service: "mordor-analytics", runtime: "cloudflare-workers" })
        : json({ error: "Method not allowed" }, 405);
    }
    if (path !== "/api/insights") return json({ error: "Not found" }, 404);
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
      return json({ error: "Expected application/json" }, 415);
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return json({ error: "Forbidden origin" }, 403);
    if (Number(request.headers.get("content-length") || "0") > 12000)
      return json({ error: "Payload exceeds 12 KB" }, 413);

    let body: unknown;
    try {
      const raw = await request.text();
      if (raw.length > 12000) return json({ error: "Payload exceeds 12 KB" }, 413);
      body = JSON.parse(raw);
    } catch { return json({ error: "Invalid JSON" }, 400); }
    if (!body || typeof body !== "object") return json({ error: "Invalid payload" }, 400);
    const payload = body as Record<string, unknown>;
    const metrics = typeof payload.metrics === "string" ? payload.metrics.slice(0, 1500) : "";
    const question = typeof payload.question === "string" ? payload.question.trim().slice(0, 500) : "";
    if (!metrics || !question) return json({ error: "Metrics and question are required" }, 400);
    try {
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
        messages: [
          { role: "system", content:
            "You are a cautious financial data analyst. Only interpret the provided numbers. " +
            "Do not invent quotes, news, implied volatility, probabilities, or data sources. " +
            "Synthetic/demo prices are NOT live and must be explicitly described as synthetic. " +
            "Do not give personalized investment advice. Keep the answer concise and explain uncertainty." },
          { role: "user", content: "Dataset:\n" + metrics + "\n\nQuestion:\n" + question }
        ],
        max_tokens: 320,
        temperature: 0.2
      });
      if (typeof result?.response !== "string") throw new Error("Empty inference");
      return json({ answer: result.response });
    } catch {
      return json({ error: "AI is temporarily unavailable or the free daily allocation is exhausted." }, 503);
    }
  }
};
