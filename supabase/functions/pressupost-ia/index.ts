// APP CONTROL D'OBRES · V87.368 · Funció «pressupost-ia» (Supabase Edge Function). ENCARA NO INSTAL·LADA.
// Rep les instruccions que fa l'app (src/preusAuto.js, promptPreusIa: les partides sense preu, l'adreça, l'accés, la logística i
// els permisos) i, si n'hi ha, els plànols de l'obra; les passa a Claude (Anthropic), que pot buscar preus a internet (el
// generador de preus de CYPE, bancs públics…), i torna el text de la resposta, que és un BC3 (l'app el llegeix amb respostaIa).
// La clau d'Anthropic es guarda a Supabase (Edge Functions → Secrets → ANTHROPIC_API_KEY) i mai no surt del servidor. Només la
// poden fer servir usuaris connectats a l'app (Supabase comprova el permís de l'usuari abans d'arribar aquí).
// Per instal·lar-la (quan l'Héctor ho digui): supabase functions deploy pressupost-ia · secrets: ANTHROPIC_API_KEY,
// i si es vol, PRESSUPOST_MODEL (de sèrie claude-opus-5-5) i PRESSUPOST_WEB=0 per no buscar a internet.
import Anthropic from "npm:@anthropic-ai/sdk";

const KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("PRESSUPOST_MODEL") ?? "claude-opus-5-5";
const WEB = (Deno.env.get("PRESSUPOST_WEB") ?? "1") !== "0";
const MAX_TEXT = 60000, MAX_IMATGES = 4;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM = `Ets un tècnic de pressupostos d'obra de Catalunya. Respons sempre en català i només amb el que et demanen.
Quan facis preus, fes servir preus de mercat actuals de la zona de l'obra; si busques a internet, prefereix el generador de preus
de CYPE (amb la ubicació de l'obra) i els bancs de preus públics, i digues d'on surt cada preu a la línia ~T de la partida.
No t'inventis preus: si no en trobes cap de raonable, posa 0 i «A CONFIRMAR».`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!KEY) return json({ error: "Falta la clau ANTHROPIC_API_KEY a Supabase." }, 500);
  try {
    const { prompt = "", imatges = [] } = await req.json();
    const text = String(prompt || "");
    if (!text.trim()) return json({ error: "No hi ha cap partida per fer." }, 400);
    if (text.length > MAX_TEXT) return json({ error: "Massa partides de cop: fes-les en dues vegades." }, 400);
    const content: Anthropic.ContentBlockParam[] = [];
    for (const im of (Array.isArray(imatges) ? imatges : []).slice(0, MAX_IMATGES)) {
      const tipus = String(im?.tipus || ""), dades = String(im?.dades || "");
      if (!dades) continue;
      if (tipus === "application/pdf") content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: dades } });
      else if (/^image\/(png|jpeg|gif|webp)$/.test(tipus)) content.push({ type: "image", source: { type: "base64", media_type: tipus as "image/png", data: dades } });
    }
    content.push({ type: "text", text });

    const client = new Anthropic({ apiKey: KEY });
    const messages: Anthropic.MessageParam[] = [{ role: "user", content }];
    let sortida = "";
    // amb la cerca a internet, la IA pot fer una pausa llarga (pause_turn): es continua fins a 4 vegades
    for (let volta = 0; volta < 4; volta++) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 32000,
        system: SYSTEM,
        messages,
        ...(WEB ? { tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }] } : {}),
      });
      const msg = await stream.finalMessage();
      for (const b of msg.content) if (b.type === "text") sortida += b.text;
      if (msg.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: msg.content }); continue; }
      if (msg.stop_reason === "refusal") return json({ error: "La IA no ho ha volgut fer." }, 502);
      if (msg.stop_reason === "max_tokens") sortida += "\nCONTINUARÀ";
      break;
    }
    if (!/~C\|/.test(sortida)) return json({ error: "La IA no ha tornat cap preu.", text: sortida.slice(0, 2000) }, 502);
    return json({ text: sortida, model: MODEL });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: "La IA està saturada: torna-ho a provar d'aquí a un minut." }, 429);
    if (e instanceof Anthropic.AuthenticationError) return json({ error: "La clau d'Anthropic no és bona." }, 500);
    if (e instanceof Anthropic.APIError) return json({ error: `Error de la IA (${e.status}): ${e.message}` }, 502);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
