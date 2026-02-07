export const NEPALI_DIGITS_MAP: Record<string, string> = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९'
};

/**
 * Convert any ASCII digits inside a string/number to Nepali (Devanagari) digits.
 * Keeps all non-digit characters unchanged.
 */
export const toNepaliDigits = (input: string | number | null | undefined): string => {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str.replace(/[0-9]/g, (d) => NEPALI_DIGITS_MAP[d] ?? d);
};