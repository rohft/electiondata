export class FontValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontValidationError';
  }
}

const FONT_SIGNATURES: Record<string, number[]> = {
  woff: [0x77, 0x4f, 0x46, 0x46],   // 'wOFF'
  woff2: [0x77, 0x4f, 0x46, 0x32],   // 'wOF2'
  ttf: [0x00, 0x01, 0x00, 0x00],     // TrueType
  otf: [0x4f, 0x54, 0x54, 0x4f],     // 'OTTO'
};

const MAX_FONT_SIZE = 5 * 1024 * 1024; // 5MB

export const validateFontFile = async (file: File): Promise<void> => {
  if (file.size > MAX_FONT_SIZE) {
    throw new FontValidationError(
      `Font file too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum: 5MB`
    );
  }

  const validExtensions = ['.otf', '.ttf', '.woff', '.woff2'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (!validExtensions.includes(ext)) {
    throw new FontValidationError(
      'Invalid font format. Use .otf, .ttf, .woff, or .woff2'
    );
  }

  // Read and verify magic bytes
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const signatureValid = Object.values(FONT_SIGNATURES).some((signature) =>
    bytes.length >= signature.length && signature.every((byte, i) => bytes[i] === byte)
  );

  if (!signatureValid) {
    throw new FontValidationError(
      'Invalid font file. File content does not match a valid font format.'
    );
  }
};

/**
 * Sanitize a font name to prevent CSS injection.
 * Allows only alphanumeric, spaces, hyphens, and underscores.
 */
export const sanitizeFontName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9\s_\-\u0900-\u097F]/g, '').substring(0, 50);
};

/**
 * Escape a string for safe use inside CSS string literals.
 */
export const escapeCSSString = (str: string): string => {
  return str.replace(/[\\"']/g, '\\$&');
};
