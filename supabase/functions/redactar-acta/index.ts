// APP CONTROL D'OBRES · V87.263 · Funció «redactar-acta» (Supabase Edge Function)
// Rep el text d'una acta (dictat o escrit a l'obra) i el torna redactat en llenguatge formal d'acta,
// sense inventar res. La clau d'Anthropic es guarda a Supabase (Edge Functions → Secrets →
// ANTHROPIC_API_KEY) i mai no surt del servidor. Només la poden fer servir usuaris connectats.
// ENCARA NO DESPLEGADA: mentre no ho estigui, l'app ofereix el camí manual (copiar a ChatGPT/Claude).
import Anthropic from "npm:@anthropic-ai/sdk@0.133.0";

const KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const MAX_CHARS = 12000;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Les mateixes instruccions que l'app fa servir en el camí manual (src/App.jsx, actaFormalPrompt878263).
function prompt(idioma: "ca" | "es") {
  return idioma === "es"
    ? "Redacta en castellano formal, como acta de visita de obra de un arquitecto técnico, el texto siguiente, " +
      "dictado o escrito en la obra. Corrige ortografía y puntuación y ordénalo en apartados breves si conviene " +
      "(comprobaciones, acuerdos, órdenes, incidencias, pendientes). No inventes nada: no añadas datos, nombres, " +
      "fechas ni cifras que no estén en el texto. Responde solo con el texto del acta, sin comentarios."
    : "Redacta en català formal, com a acta de visita d'obra d'un arquitecte tècnic, el text següent, dictat o " +
      "escrit a l'obra. Corregeix l'ortografia i la puntuació i ordena-ho en apartats breus si escau " +
      "(comprovacions, acords, ordres, incidències, pendents). No inventis res: no afegeixis dades, noms, dates " +
      "ni xifres que no hi siguin. Respon només amb el text de l'acta, sense comentaris.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Mètode no permès." }, 405);
  if (!KEY) return json({ error: "Falta la clau ANTHROPIC_API_KEY a Supabase." }, 500);

  // Només usuaris de l'app connectats (no n'hi ha prou amb la clau pública).
  const auth = req.headers.get("Authorization") ?? "";
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: auth, apikey: SUPABASE_ANON_KEY } });
  if (!who.ok) return json({ error: "Cal entrar a l'app." }, 401);

  let body: { text?: string; idioma?: string };
  try { body = await req.json(); } catch { return json({ error: "Petició incorrecta." }, 400); }
  const text = String(body.text ?? "").trim();
  if (!text) return json({ error: "No hi ha text." }, 400);
  if (text.length > MAX_CHARS) return json({ error: `El text és massa llarg (màxim ${MAX_CHARS} caràcters).` }, 413);
  const idioma = body.idioma === "es" ? "es" : "ca";

  const client = new Anthropic({ apiKey: KEY });
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "low" },
      // Si el model rebutja la petició per seguretat, l'API ho torna a provar amb un altre model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: prompt(idioma),
      messages: [{ role: "user", content: text }],
    } as Anthropic.Beta.MessageCreateParamsNonStreaming);
    if (response.stop_reason === "refusal") return json({ error: "La IA no ha pogut redactar aquest text." }, 422);
    const out = response.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").trim();
    if (!out) return json({ error: "La IA no ha tornat cap text." }, 502);
    return json({ text: out });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: "Massa peticions; torna-ho a provar d'aquí a un moment." }, 429);
    if (e instanceof Anthropic.APIError) return json({ error: `Error de la IA (${e.status}).` }, 502);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
