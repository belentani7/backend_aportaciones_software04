import { mkdir, writeFile } from "node:fs/promises";
const entries = {
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
await mkdir("server/i18n", { recursive: true });
for (const [language, copy] of Object.entries(entries)) await writeFile(`server/i18n/${language}.json`, `${JSON.stringify(copy, null, 2)}\n`);
