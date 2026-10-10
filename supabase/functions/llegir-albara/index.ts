// APP CONTROL D'OBRES · V87.259.2 · Funció «llegir-albara» (Supabase Edge Function)
// Rep la foto o el PDF d'un albarà i el fa llegir a Claude (Anthropic). Retorna les
// dades en JSON perquè l'app les posi soles a l'albarà.
// La clau d'Anthropic es guarda a Supabase (Edge Functions → Secrets → ANTHROPIC_API_KEY)
// i mai no surt del servidor. Només la poden fer servir usuaris connectats a l'app.

const KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("ALBARA_MODEL") ?? "claude-haiku-4-5-20251001";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PROMPT = `Llegeix aquest albarà o factura de materials de construcció i retorna NOMÉS un objecte JSON, sense cap text més:
{"proveidor":"","numero":"","data":"AAAA-MM-DD","base":0,"iva":21,"total":0,"linies":[{"concepte":"","quantitat":0,"unitat":"","preu":0,"import":0}]}
Normes: números amb punt decimal i sense símbol de moneda; «base» és l'import sense IVA i «total» amb IVA; «iva» és el percentatge;
una línia per cada material; si una dada no hi és, deixa el text buit o 0.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!KEY) return json({ error: "Falta la clau ANTHROPIC_API_KEY a Supabase." }, 500);
  try {
    const { tipus = "image/jpeg", dades = "", text = "" } = await req.json();
    const content: unknown[] = [];
    if (dades) {
      content.push(tipus === "application/pdf"
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: dades } }
        : { type: "image", source: { type: "base64", media_type: tipus, data: dades } });
    }
    if (text) content.push({ type: "text", text: "Text extret del document:\n" + String(text).slice(0, 8000) });
    if (!content.length) return json({ error: "No hi ha cap fitxer." }, 400);
    content.push({ type: "text", text: PROMPT });
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages: [{ role: "user", content }] }),
    });
    const j = await r.json();
    if (!r.ok) return json({ error: j?.error?.message ?? "Error de la IA" }, 502);
    const out = (j.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
    const m = out.match(/\{[\s\S]*\}/);
    if (!m) return json({ error: "La IA no ha tornat dades." }, 502);
    return new Response(m[0], { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
