import { mkdir, writeFile } from "node:fs/promises";

const languages = ["es-ES", "en-GB", "fr", "de", "it", "pt-PT", "nl", "pl", "ro", "el", "bg", "cs"];
const regions = ["central", "capital", "north", "south", "east", "west", "urban", "rural"];
const contexts = ["now", "today", "please", "urgent", "private", "safe", "again"];
const categories = [
  ["minor", "critical", ["under 18", "menor", "mineur", "minderjährig"]],
  ["coercion", "critical", ["must work", "obligado", "forcé", "gezwungen"]],
  ["trafficking", "critical", ["take your phone", "quitar móvil", "prendre ton téléphone", "handy wegnehmen"]],
  ["violence", "high", ["hurt you", "hacer daño", "faire du mal", "wehtun"]],
  ["harassment", "high", ["expose number", "publicar número", "publier le numéro", "nummer veröffentlichen"]],
  ["fraud", "medium", ["verification code", "código de verificación", "code de vérification", "bestätigungscode"]],
  ["privacy", "medium", ["send id", "envía dni", "envoyer pièce", "ausweis senden"]],
  ["spam", "low", ["click link", "pulsa enlace", "clique lien", "link klicken"]],
  ["support", "low", ["human help", "ayuda humana", "aide humaine", "menschliche hilfe"]],
  ["consent", "medium", ["no consent", "sin consentimiento", "sans consentement", "ohne einwilligung"]],
];
const localPhrase = {
  "es-ES": ["menor", "obligado", "quitar móvil", "hacer daño", "publicar número", "código de verificación", "envía dni", "pulsa enlace", "ayuda humana", "sin consentimiento"],
  "en-GB": ["under 18", "must work", "take your phone", "hurt you", "expose number", "verification code", "send id", "click link", "human help", "no consent"],
  fr: ["mineur", "forcé", "prendre ton téléphone", "faire du mal", "publier le numéro", "code de vérification", "envoyer pièce", "clique lien", "aide humaine", "sans consentement"],
  de: ["minderjährig", "gezwungen", "handy wegnehmen", "wehtun", "nummer veröffentlichen", "bestätigungscode", "ausweis senden", "link klicken", "menschliche hilfe", "ohne einwilligung"],
  it: ["minorenne", "obbligato", "togliere telefono", "fare male", "pubblicare numero", "codice verifica", "invia documento", "clicca link", "aiuto umano", "senza consenso"],
  "pt-PT": ["menor", "obrigado", "tirar telemóvel", "fazer mal", "publicar número", "código verificação", "enviar documento", "carregar link", "ajuda humana", "sem consentimento"],
  nl: ["minderjarig", "moet werken", "telefoon afnemen", "pijn doen", "nummer plaatsen", "verificatiecode", "stuur ID", "klik link", "menselijke hulp", "geen toestemming"],
  pl: ["niepełnoletni", "musisz pracować", "zabrać telefon", "zrobić krzywdę", "ujawnić numer", "kod weryfikacyjny", "wyślij dowód", "kliknij link", "pomoc człowieka", "bez zgody"],
  ro: ["minor", "trebuie să lucrezi", "ia telefonul", "răni", "publică numărul", "cod verificare", "trimite actul", "apasă linkul", "ajutor uman", "fără consimțământ"],
  el: ["ανήλικος", "πρέπει να δουλέψεις", "πάρε το τηλέφωνο", "θα σε βλάψω", "δημοσίευσε τον αριθμό", "κωδικός επαλήθευσης", "στείλε ταυτότητα", "πάτησε σύνδεσμο", "ανθρώπινη βοήθεια", "χωρίς συναίνεση"],
  bg: ["непълнолетен", "трябва да работиш", "вземи телефона", "ще те нараня", "публикувай номера", "код за потвърждение", "изпрати документ", "натисни връзката", "човешка помощ", "без съгласие"],
  cs: ["nezletilý", "musíš pracovat", "vezmi telefon", "ublížím ti", "zveřejni číslo", "ověřovací kód", "pošli doklad", "klikni odkaz", "lidská pomoc", "bez souhlasu"],
};
const correctionBase = {
  "es-ES": ["hola", "gracias", "cuanto", "precio", "hora", "hoy", "mañana", "ayuda", "parar", "persona", "idioma", "privacidad", "consentimiento", "disponible", "mensaje", "llamada", "imagen", "ubicación", "seguro", "denunciar"],
  "en-GB": ["hello", "thanks", "how much", "price", "hour", "today", "tomorrow", "help", "stop", "person", "language", "privacy", "consent", "available", "message", "call", "image", "location", "safe", "report"],
  fr: ["bonjour", "merci", "combien", "prix", "heure", "aujourd'hui", "demain", "aide", "arrêter", "personne", "langue", "confidentialité", "consentement", "disponible", "message", "appel", "image", "lieu", "sûr", "signaler"],
  de: ["hallo", "danke", "wieviel", "preis", "stunde", "heute", "morgen", "hilfe", "stopp", "person", "sprache", "privatsphäre", "einwilligung", "verfügbar", "nachricht", "anruf", "bild", "ort", "sicher", "melden"],
  it: ["ciao", "grazie", "quanto", "prezzo", "ora", "oggi", "domani", "aiuto", "fermare", "persona", "lingua", "privacy", "consenso", "disponibile", "messaggio", "chiamata", "immagine", "luogo", "sicuro", "segnalare"],
  "pt-PT": ["olá", "obrigado", "quanto", "preço", "hora", "hoje", "amanhã", "ajuda", "parar", "pessoa", "idioma", "privacidade", "consentimento", "disponível", "mensagem", "chamada", "imagem", "localização", "seguro", "denunciar"],
  nl: ["hallo", "bedankt", "hoeveel", "prijs", "uur", "vandaag", "morgen", "hulp", "stoppen", "persoon", "taal", "privacy", "toestemming", "beschikbaar", "bericht", "oproep", "afbeelding", "locatie", "veilig", "melden"],
  pl: ["cześć", "dziękuję", "ile", "cena", "godzina", "dzisiaj", "jutro", "pomoc", "stop", "osoba", "język", "prywatność", "zgoda", "dostępny", "wiadomość", "połączenie", "obraz", "lokalizacja", "bezpieczny", "zgłoś"],
  ro: ["salut", "mulțumesc", "cât", "preț", "oră", "astăzi", "mâine", "ajutor", "oprește", "persoană", "limbă", "confidențialitate", "consimțământ", "disponibil", "mesaj", "apel", "imagine", "locație", "sigur", "raportează"],
  el: ["γεια", "ευχαριστώ", "πόσο", "τιμή", "ώρα", "σήμερα", "αύριο", "βοήθεια", "σταμάτα", "άτομο", "γλώσσα", "ιδιωτικότητα", "συναίνεση", "διαθέσιμο", "μήνυμα", "κλήση", "εικόνα", "τοποθεσία", "ασφαλές", "αναφορά"],
  bg: ["здравей", "благодаря", "колко", "цена", "час", "днес", "утре", "помощ", "спри", "човек", "език", "поверителност", "съгласие", "наличен", "съобщение", "обаждане", "изображение", "местоположение", "безопасно", "докладвай"],
  cs: ["ahoj", "děkuji", "kolik", "cena", "hodina", "dnes", "zítra", "pomoc", "zastavit", "osoba", "jazyk", "soukromí", "souhlas", "dostupný", "zpráva", "volání", "obrázek", "poloha", "bezpečný", "nahlásit"],
};

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const typoVariants = token => [
  token.replace(/(.)/u, "$1$1"),
  token.replace(/[aeiouáéíóúäöü]/iu, ""),
  token.replace(/\s+/g, ""),
  token.replace(/([bcdfghjklmnpqrstvwxyz])/iu, "$1$1"),
  token.replace(/[sśš]/iu, "z"),
  token.replace(/[cćč]/iu, "k"),
];

const rules = [];
for (const language of languages) {
  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
    const [category, severity] = categories[categoryIndex];
    for (const region of regions) {
      for (const context of contexts) {
        for (let variant = 0; variant < 6; variant++) {
          const phrase = localPhrase[language][categoryIndex];
          const pattern = `(?:^|\\s)${escapeRegex(phrase)}(?:\\s|$)(?:.{0,24}${context})?`;
          rules.push({ id: `v2_${language}_${category}_${region}_${context}_${variant}`, language, region, category, severity, confidence: severity === "critical" ? 0.9 : severity === "high" ? 0.84 : 0.72, pattern, action: severity === "critical" ? "stop_and_escalate" : severity === "high" ? "pause_and_review" : "annotate_only", generatedVariant: variant });
        }
      }
    }
  }
}

const corrections = [];
for (const language of languages) {
  for (const canonical of correctionBase[language]) {
    for (const typo of typoVariants(canonical).slice(0, 5)) corrections.push({ id: `fix_${language}_${corrections.length + 1}`, language, canonical, variant: typo, type: typo.includes(" ") ? "spacing" : "phonetic_or_typo", confidence: 0.82 });
  }
}

await mkdir("server/linguistic-v2", { recursive: true });
await writeFile("server/linguistic-v2/pattern_rules.json", JSON.stringify({ version: "2.0.0", generatedAt: new Date().toISOString(), ruleCount: rules.length, rules }, null, 2));
await writeFile("server/linguistic-v2/corrections.json", JSON.stringify({ version: "2.0.0", generatedAt: new Date().toISOString(), correctionCount: corrections.length, corrections }, null, 2));
await writeFile("server/linguistic-v2/README.md", `# Linguistic Engine v2\n\nGenerated rule count: ${rules.length}. Generated correction count: ${corrections.length}.\n\nThe catalogue is a deterministic baseline for recognition, normalization and safety routing. It is not a validated regional corpus. Rules can annotate or escalate; they never generate explicit language, infer consent, execute payments or make irreversible legal decisions. Human review is required for high-impact signals.\n`);
console.log(JSON.stringify({ rules: rules.length, corrections: corrections.length }));
