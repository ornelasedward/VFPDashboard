// Helper to parse percentage strings like "45.2%" to numbers
export function parsePercentage(value: string | null): number {
  if (!value) return 0;
  // Replace Unicode minus sign (−) with regular minus (-)
  const normalized = value.replace(/−/g, '-');
  const cleaned = normalized.replace('%', '').trim();
  return parseFloat(cleaned) || 0;
}

// Helper to parse dollar amounts like "$1,234.56" to numbers
export function parseDollar(value: string | null): number {
  if (!value) return 0;
  // Replace Unicode minus sign (−) with regular minus (-)
  const normalized = value.replace(/−/g, '-');
  const cleaned = normalized.replace(/[$,]/g, '').trim();
  return parseFloat(cleaned) || 0;
}
