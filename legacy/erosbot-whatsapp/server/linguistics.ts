import { readFileSync } from "node:fs";
import { join } from "node:path";

export const SUPPORTED_LANGUAGES = [
  "es-ES", "en-GB", "fr", "de", "it", "pt-PT", "nl", "pl", "ro", "el", "bg", "cs",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const languageHints: Record<SupportedLanguage, string[]> = {
  "es-ES": ["hola", "buenas", "gracias", "cuanto", "quiero", "necesito"],
  "en-GB": ["hello", "hi", "please", "thanks", "how much", "need"],
  fr: ["bonjour", "salut", "merci", "combien", "besoin", "rendez-vous"],
  de: ["hallo", "danke", "bitte", "wie viel", "brauche", "termin"],
  it: ["ciao", "grazie", "quanto", "bisogno", "appuntamento"],
  "pt-PT": ["olá", "obrigado", "quanto", "preciso", "marcação"],
  nl: ["hallo", "bedankt", "hoeveel", "nodig", "afspraak"],
  pl: ["cześć", "dziękuję", "ile", "potrzebuję", "spotkanie"],
  ro: ["salut", "mulțumesc", "cât", "am nevoie", "întâlnire"],
  el: ["γεια", "ευχαριστώ", "πόσο", "χρειάζομαι", "ραντεβού"],
  bg: ["здравей", "благодаря", "колко", "трябва", "среща"],
  cs: ["ahoj", "děkuji", "kolik", "potřebuji", "schůzka"],
};

const typoMap: Record<string, string> = {
  "kuanto": "cuanto", "cuantto": "cuanto", "qnto": "cuanto", "knto": "cuanto",
  "graciass": "gracias", "grasias": "gracias", "ola": "hola", "holaa": "hola",
  "pls": "please", "plz": "please", "thx": "thanks", "howmuch": "how much",
  "bonjor": "bonjour", "mercí": "merci", "danke schön": "danke",
  "obg": "obrigado", "obrigadaaa": "obrigada", "tks": "thanks",
  "ραντεβου": "ραντεβού", "ευχαριστω": "ευχαριστώ",
};

export function loadI18n(language: SupportedLanguage) {
  try {
    const path = join(process.cwd(), "server", "i18n", `${language}.json`);
    return JSON.parse(readFileSync(path, "utf8")) as { greeting: string; premium: string; human: string };
  } catch {
    return i18nDemo[language];
  }
}

function fold(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function normalizeText(text: string) {
  let result = text.trim().replace(/\s+/g, " ");
  for (const [typo, replacement] of Object.entries(typoMap)) {
    result = result.replace(new RegExp(`\\b${typo}\\b`, "gi"), replacement);
  }
  return result;
}

export function detectLanguage(text: string, preferred?: string): { language: SupportedLanguage; confidence: number } {
  if (preferred && (SUPPORTED_LANGUAGES as readonly string[]).includes(preferred)) {
    return { language: preferred as SupportedLanguage, confidence: 0.98 };
  }
  const folded = fold(text);
  let best: SupportedLanguage = "en-GB";
  let bestScore = 0;
  for (const language of SUPPORTED_LANGUAGES) {
    const score = languageHints[language].reduce((total, hint) => total + (folded.includes(fold(hint)) ? 1 : 0), 0);
    if (score > bestScore) { best = language; bestScore = score; }
  }
  return { language: best, confidence: bestScore ? Math.min(0.55 + bestScore * 0.12, 0.95) : 0.25 };
}

export function normalizeConversation(text: string, preferred?: string) {
  const normalized = normalizeText(text);
  const detection = detectLanguage(normalized, preferred);
  return { original: text, normalized, ...detection };
}

export const i18nDemo: Record<SupportedLanguage, Record<string, string>> = {
  "es-ES": { greeting: "Hola. Soy tu asistente de mensajes.", premium: "El acceso premium está activo.", human: "Puedo derivarte a una persona del equipo." },
  "en-GB": { greeting: "Hello. I am your messaging assistant.", premium: "Premium access is active.", human: "I can connect you with a member of the team." },
  fr: { greeting: "Bonjour. Je suis votre assistant de messagerie.", premium: "L'accès premium est actif.", human: "Je peux vous mettre en relation avec l'équipe." },
  de: { greeting: "Hallo. Ich bin dein Nachrichtenassistent.", premium: "Der Premiumzugang ist aktiv.", human: "Ich kann dich mit dem Team verbinden." },
  it: { greeting: "Ciao. Sono il tuo assistente per i messaggi.", premium: "L'accesso premium è attivo.", human: "Posso metterti in contatto con il team." },
  "pt-PT": { greeting: "Olá. Sou o seu assistente de mensagens.", premium: "O acesso premium está ativo.", human: "Posso encaminhar para a equipa." },
  nl: { greeting: "Hallo. Ik ben je berichtenassistent.", premium: "Premiumtoegang is actief.", human: "Ik kan je doorverbinden met het team." },
  pl: { greeting: "Cześć. Jestem asystentem wiadomości.", premium: "Dostęp premium jest aktywny.", human: "Mogę połączyć Cię z zespołem." },
  ro: { greeting: "Salut. Sunt asistentul tău de mesaje.", premium: "Accesul premium este activ.", human: "Te pot conecta cu echipa." },
  el: { greeting: "Γεια. Είμαι ο βοηθός μηνυμάτων σας.", premium: "Η premium πρόσβαση είναι ενεργή.", human: "Μπορώ να σας συνδέσω με την ομάδα." },
  bg: { greeting: "Здравейте. Аз съм вашият асистент за съобщения.", premium: "Премиум достъпът е активен.", human: "Мога да ви свържа с екипа." },
  cs: { greeting: "Ahoj. Jsem váš asistent pro zprávy.", premium: "Prémiový přístup je aktivní.", human: "Mohu vás spojit s týmem." },
};
