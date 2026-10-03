const prohibitedPatterns = [
  /borr(?:ar|a|ado|ado)\s+(?:remotamente|a distancia)?.*(?:whatsapp|historial|chat)/i,
  /remote(?:ly)?\s+delete.*(?:whatsapp|chat|history)/i,
  /coartada|alibi|excuse\s+for\s+the\s+police/i,
  /llamada\s+(?:falsa|simulada)|fake\s+(?:call|phone\s+call)/i,
  /verific(?:ar|ación)\s+de\s+edad\s+(?:casera|solo\s+con\s+fecha)/i,
  /homemade\s+age\s+verification|date\s+of\s+birth\s+proves\s+age/i,
  /(?:buy|sell|deliver|traffic)\s+(?:cocaine|heroin|fentanyl|drugs)|drogas\s+(?:ilegales|prohibidas)/i,
  /(?:evade|avoid|hide)\s+tax(?:es)?|evasi[oó]n\s*fiscal/i,
];

export function isProhibitedTechnicalRequest(text: string) {
  return prohibitedPatterns.some(pattern => pattern.test(text));
}
