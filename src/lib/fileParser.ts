import ExcelJS from 'exceljs';
import { z } from 'zod';

export interface ParsedRecord {
  sn?: string;
  wardNo: string;
  centerName: string;
  voterId: string;
  voterName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  spouse?: string;
  parents?: string;
  surname?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  tole?: string;
  family?: string;
  party?: string;
  status?: string;
  green?: string;
  yellow?: string;
  red?: string;
  originalData: Record<string, string>;
}



const normalizeGender = (gender: string): 'male' | 'female' | 'other' => {
  const g = gender.toLowerCase().trim();
  if (g === 'male' || g === 'm' || g === 'पुरुष') return 'male';
  if (g === 'female' || g === 'f' || g === 'महिला') return 'female';
  return 'other';
};

const normalizeHeaders = (headers: string[]): Record<string, number> => {
  const headerMap: Record<string, number> = {};

  headers.forEach((h, idx) => {
    const lower = h.toLowerCase().trim();
    const original = h.trim();

    // Map common variations to standard keys (English and Nepali)
    // Serial Number - MUST check before other patterns
    if (original === 'सि.नं.' || original === 'सि.नं' || original === 'क्र.सं.' ||
    original === 'मतदाता क्र.सं.' ||
    lower === 'sn' || lower === 's.n' || lower === 's.n.' || lower === 'sn.') {
      headerMap['sn'] = idx;
    }
    // Voter ID - check for various Nepali and English patterns
    else if (original === 'मतदाता परिचयपत्र नं.' || original === 'मतदाता परिचयपत्र नं' ||
    original === 'मतदाता नं' || original === 'मतदाता नं.' || original === 'मतदाता आईडी' ||
    original === 'मतदाता नम्बर' ||
    lower.includes('voter id') || lower.includes('voter no') || lower === 'id' || lower === 'voterid') {
      headerMap['voterId'] = idx;
    }
    // Voter Name
    else if (original === 'मतदाताको नाम' || original === 'नाम' ||
    lower.includes('voter name') || lower === 'name') {
      headerMap['voterName'] = idx;
    }
    // Age
    else if (original === 'उमेर(वर्ष)' || original === 'उमेर' || lower === 'age') {
      headerMap['age'] = idx;
    }
    // Gender
    else if (original === 'लिङ्ग' || lower === 'gender' || lower === 'sex') {
      headerMap['gender'] = idx;
    }
    // Spouse
    else if (original === 'पति/पत्नीको नाम' || lower.includes('spouse')) {
      headerMap['spouse'] = idx;
    }
    // Parents / Father-Mother
    else if (original === 'पिता/माताको नाम' || original === 'आमाबुबाको नाम' ||
    lower.includes('parent') || lower.includes('father')) {
      headerMap['parents'] = idx;
    }
    // Surname
    else if (original === 'थर' || lower === 'surname') {
      headerMap['surname'] = idx;
    }
    // Status
    else if (original === 'स्थिति' || lower === 'status') {
      headerMap['status'] = idx;
    }
    // Ward Number
    else if (lower.includes('ward') || lower === 'ward no') {
      headerMap['wardNo'] = idx;
    }
    // Center
    else if (lower.includes('center') || lower.includes('centre')) {
      headerMap['centerName'] = idx;
    }
    // Phone / Mobile
    else if (original === 'मोबाइल नम्बर' || lower.includes('phone') || lower.includes('mobile')) {
      headerMap['phone'] = idx;
    }
    // Email
    else if (original === 'इमेल' || lower === 'email') {
      headerMap['email'] = idx;
    }
    // Occupation
    else if (original === 'व्यवसाय' || lower === 'occupation') {
      headerMap['occupation'] = idx;
    }
    // Tole
    else if (original === 'टोल' || lower === 'tole') {
      headerMap['tole'] = idx;
    }
    // Family
    else if (original === 'परिवार' || lower === 'family') {
      headerMap['family'] = idx;
    }
    // Party
    else if (original === 'पार्टि' || lower === 'party') {
      headerMap['party'] = idx;
    }
    // Color codes
    else if (lower === 'green') headerMap['green'] = idx;else
    if (lower === 'yellow') headerMap['yellow'] = idx;else
    if (lower === 'red') headerMap['red'] = idx;
  });

  return headerMap;
};

export const parseCSV = (content: string): ParsedRecord[] => {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const headerMap = normalizeHeaders(headers);
  const records: ParsedRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle CSV with quoted fields containing commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length < 3) continue;

    const originalData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      originalData[h] = sanitizeFieldValue(values[idx] || '');
    });

    const record: ParsedRecord = {
      wardNo: sanitizeFieldValue(values[headerMap['wardNo'] ?? 0] || ''),
      centerName: sanitizeFieldValue(values[headerMap['centerName'] ?? 1] || ''),
      voterId: sanitizeFieldValue(values[headerMap['voterId'] ?? 2] || ''),
      voterName: sanitizeFieldValue(values[headerMap['voterName'] ?? 3] || ''),
      age: parseInt(values[headerMap['age'] ?? 4]) || 0,
      gender: normalizeGender(values[headerMap['gender'] ?? 5] || ''),
      spouse: sanitizeFieldValue(values[headerMap['spouse'] ?? 6] || ''),
      parents: sanitizeFieldValue(values[headerMap['parents'] ?? 7] || ''),
      green: values[headerMap['green'] ?? 8],
      yellow: values[headerMap['yellow'] ?? 9],
      red: values[headerMap['red'] ?? 10],
      originalData
    };

    records.push(record);
  }

  validateRecordCount(records.length);
  return records;
};

export const parseExcel = async (file: File): Promise<ParsedRecord[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();

  // Determine file type and load accordingly
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'xlsx') {
    await workbook.xlsx.load(arrayBuffer);
  } else if (extension === 'xls') {
    // ExcelJS doesn't support legacy .xls format natively
    // For .xls files, we'll throw a helpful error
    throw new Error('Legacy .xls format is not fully supported. Please convert to .xlsx format.');
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in the Excel file');
  }

  // Convert worksheet to array of arrays
  const data: (string | number | boolean | null)[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const rowData: (string | number | boolean | null)[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Handle different cell value types
      let value = cell.value;
      if (value && typeof value === 'object' && 'result' in value) {
        // Handle formula cells - use the result, sanitize to prevent formula injection
        value = value.result;
        if (typeof value === 'string') {
          value = sanitizeFieldValue(value);
        }
      }
      if (value && typeof value === 'object' && 'richText' in value) {
        // Handle rich text - extract plain text
        value = (value as {richText: {text: string;}[];}).richText.map((rt) => rt.text).join('');
      }
      // Sanitize string cell values
      if (typeof value === 'string') {
        value = sanitizeFieldValue(value);
      }
      rowData[colNumber - 1] = value as string | number | boolean | null;
    });
    data[rowNumber - 1] = rowData;
  });

  if (data.length < 2) return [];

  const headers = (data[0] as (string | number | boolean | null)[]).map((h) => String(h || '').trim());
  const headerMap = normalizeHeaders(headers);
  const records: ParsedRecord[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as (string | number | boolean | null)[];
    if (!row || row.length < 3) continue;

    const originalData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      originalData[h] = String(row[idx] ?? '');
    });

    // Get voterId - prioritize the mapped column, convert numbers properly
    const voterIdIndex = headerMap['voterId'];
    let voterId = '';
    if (voterIdIndex !== undefined && voterIdIndex >= 0) {
      const rawValue = row[voterIdIndex];
      // Handle numeric voter IDs - convert to string without scientific notation
      if (typeof rawValue === 'number') {
        voterId = Math.floor(rawValue).toString();
      } else if (rawValue !== null && rawValue !== undefined) {
        voterId = String(rawValue).trim();
      }
    }
    // Fallback: if voterId is empty, try getting from column 1 (common position)
    if (!voterId && row[1] !== null && row[1] !== undefined) {
      const rawValue = row[1];
      if (typeof rawValue === 'number') {
        voterId = Math.floor(rawValue).toString();
      } else {
        voterId = String(rawValue).trim();
      }
    }

    const record: ParsedRecord = {
      sn: String(row[headerMap['sn'] ?? -1] ?? ''),
      wardNo: String(row[headerMap['wardNo'] ?? -1] ?? ''),
      centerName: String(row[headerMap['centerName'] ?? -1] ?? ''),
      voterId: voterId,
      voterName: String(row[headerMap['voterName'] ?? 2] ?? ''),
      age: parseInt(String(row[headerMap['age'] ?? 3])) || 0,
      gender: normalizeGender(String(row[headerMap['gender'] ?? 4] ?? '')),
      spouse: String(row[headerMap['spouse'] ?? -1] ?? ''),
      parents: String(row[headerMap['parents'] ?? -1] ?? ''),
      surname: String(row[headerMap['surname'] ?? -1] ?? ''),
      phone: String(row[headerMap['phone'] ?? -1] ?? ''),
      email: String(row[headerMap['email'] ?? -1] ?? ''),
      occupation: String(row[headerMap['occupation'] ?? -1] ?? ''),
      tole: String(row[headerMap['tole'] ?? -1] ?? ''),
      family: String(row[headerMap['family'] ?? -1] ?? ''),
      party: String(row[headerMap['party'] ?? -1] ?? ''),
      status: String(row[headerMap['status'] ?? -1] ?? ''),
      green: String(row[headerMap['green'] ?? -1] ?? ''),
      yellow: String(row[headerMap['yellow'] ?? -1] ?? ''),
      red: String(row[headerMap['red'] ?? -1] ?? ''),
      originalData
    };

    records.push(record);
  }

  validateRecordCount(records.length);
  return records;
};

// Zod schema for validating JSON voter records
const VoterRecordSchema = z.object({
  wardNo: z.union([z.string(), z.number()]).optional(),
  ward_no: z.union([z.string(), z.number()]).optional(),
  'WARD NO': z.union([z.string(), z.number()]).optional(),
  centerName: z.string().optional(),
  center_name: z.string().optional(),
  'CENTER NAME': z.string().optional(),
  voterId: z.union([z.string(), z.number()]).optional(),
  voter_id: z.union([z.string(), z.number()]).optional(),
  'VOTER ID': z.union([z.string(), z.number()]).optional(),
  voterName: z.string().optional(),
  voter_name: z.string().optional(),
  name: z.string().optional(),
  'VOTER NAME': z.string().optional(),
  age: z.union([z.string(), z.number()]).optional(),
  AGE: z.union([z.string(), z.number()]).optional(),
  gender: z.string().optional(),
  GENDER: z.string().optional(),
  spouse: z.string().optional(),
  SPOUSE: z.string().optional(),
  parents: z.string().optional(),
  PARENTS: z.string().optional(),
  caste: z.string().optional(),
  surname: z.string().optional(),
  green: z.string().optional(),
  GREEN: z.string().optional(),
  yellow: z.string().optional(),
  YELLOW: z.string().optional(),
  red: z.string().optional(),
  RED: z.string().optional()
}).passthrough(); // Allow additional fields

const JSONDataSchema = z.union([
z.array(VoterRecordSchema),
z.object({
  data: z.array(VoterRecordSchema).optional(),
  records: z.array(VoterRecordSchema).optional(),
  voters: z.array(VoterRecordSchema).optional()
}).passthrough()]
);

export const parseJSON = async (file: File): Promise<ParsedRecord[]> => {
  const text = await file.text();

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON format: Unable to parse file content');
  }

  // Validate the parsed JSON structure
  const validationResult = JSONDataSchema.safeParse(data);
  if (!validationResult.success) {
    throw new Error(`Invalid JSON structure: ${validationResult.error.errors.map((e) => e.message).join(', ')}`);
  }

  const validatedData = validationResult.data;

  // Handle both array and object with data property
  const rows = Array.isArray(validatedData) ?
  validatedData :
  validatedData.data || validatedData.records || validatedData.voters || [];

  if (!Array.isArray(rows)) {
    throw new Error('Invalid JSON structure: Expected an array of records');
  }

  validateRecordCount(rows.length);

  return rows.map((row) => {
    const originalData: Record<string, string> = {};
    Object.entries(row).forEach(([key, value]) => {
      originalData[key] = sanitizeFieldValue(String(value || ''));
    });

    return {
      wardNo: sanitizeFieldValue(String(row.wardNo || row.ward_no || row['WARD NO'] || '')),
      centerName: sanitizeFieldValue(String(row.centerName || row.center_name || row['CENTER NAME'] || '')),
      voterId: sanitizeFieldValue(String(row.voterId || row.voter_id || row['VOTER ID'] || '')),
      voterName: sanitizeFieldValue(String(row.voterName || row.voter_name || row.name || row['VOTER NAME'] || '')),
      age: parseInt(String(row.age || row.AGE || 0)) || 0,
      gender: normalizeGender(String(row.gender || row.GENDER || '')),
      spouse: sanitizeFieldValue(String(row.spouse || row.SPOUSE || '')),
      parents: sanitizeFieldValue(String(row.parents || row.PARENTS || '')),
      surname: sanitizeFieldValue(String(row.surname || '')),
      green: String(row.green || row.GREEN || ''),
      yellow: String(row.yellow || row.YELLOW || ''),
      red: String(row.red || row.RED || ''),
      originalData
    } as ParsedRecord;
  });
};

// File validation constants
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_RECORDS = 50000;
const MAX_FIELD_LENGTH = 500;

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  csv: ['text/csv', 'text/plain', 'application/csv'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  xls: ['application/vnd.ms-excel'],
  json: ['application/json', 'text/plain']
};

export class FileValidationError extends Error {
  constructor(message: string, public code: 'SIZE_EXCEEDED' | 'INVALID_TYPE' | 'INVALID_MIME' | 'UNSUPPORTED_FORMAT' | 'INVALID_CONTENT' | 'TOO_MANY_RECORDS') {
    super(message);
    this.name = 'FileValidationError';
  }
}

/**
 * Validate file name for suspicious patterns (e.g., double extensions)
 */
const validateFileName = (fileName: string): void => {
  const parts = fileName.split('.');
  if (parts.length > 2) {
    // Check if any intermediate parts are suspicious executable extensions
    const suspiciousExtensions = ['exe', 'bat', 'cmd', 'ps1', 'sh', 'msi', 'dll', 'com', 'vbs', 'js', 'ws', 'wsf'];
    for (let i = 1; i < parts.length - 1; i++) {
      if (suspiciousExtensions.includes(parts[i].toLowerCase())) {
        throw new FileValidationError(
          'File name contains suspicious extension patterns. Please rename the file.',
          'INVALID_TYPE'
        );
      }
    }
  }
};

/**
 * Verify file content matches the expected format via magic number / signature check
 */
const validateFileSignature = async (file: File): Promise<void> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (extension === 'xlsx') {
    // XLSX files are ZIP archives: signature 50 4B 03 04
    if (!(bytes[0] === 0x50 && bytes[1] === 0x4B)) {
      throw new FileValidationError(
        'File content does not match XLSX format (invalid file signature)',
        'INVALID_CONTENT'
      );
    }
  } else if (extension === 'json') {
    // JSON should start with { or [ (after optional whitespace/BOM)
    let startByte = bytes[0];
    // Skip UTF-8 BOM if present
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      startByte = bytes[3];
    }
    // Skip whitespace
    const textStart = String.fromCharCode(startByte).trim();
    if (textStart && textStart !== '{' && textStart !== '[') {
      throw new FileValidationError(
        'File content does not appear to be valid JSON',
        'INVALID_CONTENT'
      );
    }
  } else if (extension === 'csv') {
    // CSV should be text-like: check first bytes are printable ASCII or common Unicode
    const hasNullBytes = bytes.some(b => b === 0x00);
    if (hasNullBytes) {
      throw new FileValidationError(
        'File content does not appear to be valid CSV (contains binary data)',
        'INVALID_CONTENT'
      );
    }
  }
};

/**
 * Validate record count doesn't exceed safety limits
 */
const validateRecordCount = (count: number): void => {
  if (count > MAX_RECORDS) {
    throw new FileValidationError(
      `File contains too many records (${count.toLocaleString()}). Maximum allowed: ${MAX_RECORDS.toLocaleString()}`,
      'TOO_MANY_RECORDS'
    );
  }
};

/**
 * Sanitize a string value from file input to prevent injection
 */
const sanitizeFieldValue = (value: string): string => {
  if (!value) return value;
  // Truncate overly long fields
  if (value.length > MAX_FIELD_LENGTH) {
    return value.slice(0, MAX_FIELD_LENGTH);
  }
  // Strip formula injection characters at the start (=, +, -, @)
  // These can be dangerous in CSV/Excel contexts
  const stripped = value.replace(/^[=+\-@\t\r]+/, '');
  return stripped;
};

export const validateFile = async (file: File): Promise<void> => {
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileValidationError(
      `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed size of ${MAX_FILE_SIZE_MB} MB`,
      'SIZE_EXCEEDED'
    );
  }

  // Validate filename for suspicious patterns
  validateFileName(file.name);

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !['csv', 'xlsx', 'xls', 'json'].includes(extension)) {
    throw new FileValidationError(
      `Unsupported file extension: .${extension || 'unknown'}. Allowed: .csv, .xlsx, .xls, .json`,
      'UNSUPPORTED_FORMAT'
    );
  }

  // Check MIME type - warn but allow through due to browser inconsistencies
  const allowedMimes = ALLOWED_MIME_TYPES[extension];
  if (file.type && !allowedMimes.includes(file.type)) {
    console.warn(`MIME type mismatch: expected ${allowedMimes.join(' or ')}, got ${file.type}`);
  }

  // Verify file content signature (magic numbers)
  await validateFileSignature(file);
};

export const parseFile = async (file: File): Promise<ParsedRecord[]> => {
  // Validate file before processing (async - includes signature check)
  await validateFile(file);

  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv':
      const csvContent = await file.text();
      return parseCSV(csvContent);
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    case 'json':
      return parseJSON(file);
    default:
      throw new FileValidationError(`Unsupported file format: ${extension}`, 'UNSUPPORTED_FORMAT');
  }
};

export const getSupportedFormats = () => '.csv,.xlsx,.xls,.json';
export const getSupportedFormatsText = () => 'CSV, Excel (.xlsx, .xls), JSON';
export const getMaxFileSizeMB = () => MAX_FILE_SIZE_MB;