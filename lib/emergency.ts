const EMERGENCY_PATTERNS: RegExp[] = [
  /\bflood/i,
  /\bburst/i,
  /water (everywhere|all over|on the floor|coming)/i,
  /\bsewage\b/i,
  /\bsewer\b/i,
  /back(ed|ing)?[\s-]?up/i,
  /\boverflow/i,
  /no (hot )?water/i,
  /smell.*gas/i,
  /\bgas leak/i,
  /basement.*(full|flood)/i,
  /\bemergency\b/i,
  /\burgent\b/i,
];

export function detectEmergencyFromText(text: string): boolean {
  return EMERGENCY_PATTERNS.some((re) => re.test(text));
}

// Final call: emergency if the keyword net OR the model flags it.
export function isEmergency(rawText: string, modelFlag: boolean | null): boolean {
  return detectEmergencyFromText(rawText) || modelFlag === true;
}
