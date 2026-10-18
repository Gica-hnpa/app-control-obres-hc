// V87.257 · Projecte Supabase de l'app. La clau publicable es pot posar al codi:
// la seguretat la donen l'usuari/contrasenya i les regles (RLS) de la taula aco_kv.
export const CLOUD_URL = import.meta.env.VITE_CLOUD_URL || "https://bdjendguvbevyowghzfh.supabase.co";
export const CLOUD_KEY = import.meta.env.VITE_CLOUD_KEY || "sb_publishable_-cl67_lhiPrWZBkbwTFA-Q__8iLboS9";
// V87.295 · Google Calendar: identificador de client OAuth (tipus «Aplicació web») del projecte de Google Cloud de
// l'Héctor. És públic (no és cap secret). Buit = el botó «Connectar amb Google Calendar» no surt. Passos:
// docs/google-calendar.md.
export const GOOGLE_CLIENT_ID = "527236679901-vukljqm1410aufc4emdt5akvut63nslh.apps.googleusercontent.com";
