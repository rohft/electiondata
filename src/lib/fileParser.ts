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
  caste?: string;
  surname?: string;
  status?: string;
  green?: string;
  yellow?: string;
  red?: string;
  originalData: Record<string, string>;
}

// Newar surnames list for detection
const NEWAR_SURNAMES = [
  'shrestha', 'shakya', 'maharjan', 'dangol', 'tuladhar', 'tamrakar',
  'manandhar', 'singh', 'amatya', 'joshi', 'pradhan', 'rajbhandari',
  'bajracharya', 'sthapit', 'ranjitkar', 'nakarmi', 'chitrakar', 'karmacharya',
  'श्रेष्ठ', 'शाक्य', 'महर्जन', 'डंगोल', 'तुलाधर', 'ताम्राकार',
  'मानन्धर', 'अमात्य', 'जोशी', 'प्रधान', 'राजभण्डारी',
  'बज्राचार्य', 'स्थापित', 'रञ्जितकार', 'नकर्मी', 'चित्रकार', 'कर्माचार्य'
];

export const isNewarName = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  return NEWAR_SURNAMES.some(s => lowerName.includes(s.toLowerCase()));
};

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
    if (original === 'सि.नं.' || original === 'सि.नं' || original === 'क्र.सं.' || lower === 'sn' || lower === 's.n' || lower === 's.n.' || lower === 'sn.') {
      headerMap['sn'] = idx;
    }
    // Voter ID - check for various Nepali and English patterns
    else if (original === 'मतदाता नं' || original === 'मतदाता नं.' || original === 'मतदाता आईडी' || original === 'मतदाता नम्बर' || 
             lower.includes('voter id') || lower.includes('voter no') || lower === 'id' || lower === 'voterid') {
      headerMap['voterId'] = idx;
    }
    // Voter Name
    else if (original === 'मतदाताको नाम' || lower.includes('voter name') || lower === 'name') {
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
    else if (original === 'पिता/माताको नाम' || lower.includes('parent') || lower.includes('father')) {
      headerMap['parents'] = idx;
    }
    // Caste
    else if (original === 'जात' || lower === 'caste') {
      headerMap['caste'] = idx;
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
    // Color codes
    else if (lower === 'green') headerMap['green'] = idx;
    else if (lower === 'yellow') headerMap['yellow'] = idx;
    else if (lower === 'red') headerMap['red'] = idx;
  });
  
  return headerMap;
};

export const parseCSV = (content: string): ParsedRecord[] => {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
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
      originalData[h] = values[idx] || '';
    });

    const record: ParsedRecord = {
      wardNo: values[headerMap['wardNo'] ?? 0] || '',
      centerName: values[headerMap['centerName'] ?? 1] || '',
      voterId: values[headerMap['voterId'] ?? 2] || '',
      voterName: values[headerMap['voterName'] ?? 3] || '',
      age: parseInt(values[headerMap['age'] ?? 4]) || 0,
      gender: normalizeGender(values[headerMap['gender'] ?? 5] || ''),
      spouse: values[headerMap['spouse'] ?? 6],
      parents: values[headerMap['parents'] ?? 7],
      green: values[headerMap['green'] ?? 8],
      yellow: values[headerMap['yellow'] ?? 9],
      red: values[headerMap['red'] ?? 10],
      originalData,
    };

    records.push(record);
  }

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
        // Handle formula cells - use the result
        value = value.result;
      }
      if (value && typeof value === 'object' && 'richText' in value) {
        // Handle rich text - extract plain text
        value = (value as { richText: { text: string }[] }).richText.map(rt => rt.text).join('');
      }
      rowData[colNumber - 1] = value as string | number | boolean | null;
    });
    data[rowNumber - 1] = rowData;
  });
  
  if (data.length < 2) return [];
  
  const headers = (data[0] as (string | number | boolean | null)[]).map(h => String(h || '').trim());
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
      caste: String(row[headerMap['caste'] ?? -1] ?? ''),
      surname: String(row[headerMap['surname'] ?? -1] ?? ''),
      status: String(row[headerMap['status'] ?? -1] ?? ''),
      green: String(row[headerMap['green'] ?? -1] ?? ''),
      yellow: String(row[headerMap['yellow'] ?? -1] ?? ''),
      red: String(row[headerMap['red'] ?? -1] ?? ''),
      originalData,
    };

    records.push(record);
  }

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
  RED: z.string().optional(),
}).passthrough(); // Allow additional fields

const JSONDataSchema = z.union([
  z.array(VoterRecordSchema),
  z.object({
    data: z.array(VoterRecordSchema).optional(),
    records: z.array(VoterRecordSchema).optional(),
    voters: z.array(VoterRecordSchema).optional(),
  }).passthrough(),
]);

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
    throw new Error(`Invalid JSON structure: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
  }
  
  const validatedData = validationResult.data;
  
  // Handle both array and object with data property
  const rows = Array.isArray(validatedData) 
    ? validatedData 
    : (validatedData.data || validatedData.records || validatedData.voters || []);
  
  if (!Array.isArray(rows)) {
    throw new Error('Invalid JSON structure: Expected an array of records');
  }
  
  return rows.map((row) => {
    const originalData: Record<string, string> = {};
    Object.entries(row).forEach(([key, value]) => {
      originalData[key] = String(value || '');
    });

    return {
      wardNo: String(row.wardNo || row.ward_no || row['WARD NO'] || ''),
      centerName: String(row.centerName || row.center_name || row['CENTER NAME'] || ''),
      voterId: String(row.voterId || row.voter_id || row['VOTER ID'] || ''),
      voterName: String(row.voterName || row.voter_name || row.name || row['VOTER NAME'] || ''),
      age: parseInt(String(row.age || row.AGE || 0)) || 0,
      gender: normalizeGender(String(row.gender || row.GENDER || '')),
      spouse: String(row.spouse || row.SPOUSE || ''),
      parents: String(row.parents || row.PARENTS || ''),
      caste: String(row.caste || ''),
      surname: String(row.surname || ''),
      green: String(row.green || row.GREEN || ''),
      yellow: String(row.yellow || row.YELLOW || ''),
      red: String(row.red || row.RED || ''),
      originalData,
    } as ParsedRecord;
  });
};

// File validation constants
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  csv: ['text/csv', 'text/plain', 'application/csv'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  xls: ['application/vnd.ms-excel'],
  json: ['application/json', 'text/plain'],
};

export class FileValidationError extends Error {
  constructor(message: string, public code: 'SIZE_EXCEEDED' | 'INVALID_TYPE' | 'INVALID_MIME' | 'UNSUPPORTED_FORMAT') {
    super(message);
    this.name = 'FileValidationError';
  }
}

export const validateFile = (file: File): void => {
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileValidationError(
      `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed size of ${MAX_FILE_SIZE_MB} MB`,
      'SIZE_EXCEEDED'
    );
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !['csv', 'xlsx', 'xls', 'json'].includes(extension)) {
    throw new FileValidationError(
      `Unsupported file extension: .${extension || 'unknown'}. Allowed: .csv, .xlsx, .xls, .json`,
      'UNSUPPORTED_FORMAT'
    );
  }

  // Check MIME type
  const allowedMimes = ALLOWED_MIME_TYPES[extension];
  // Allow empty MIME type as some browsers don't set it correctly
  if (file.type && !allowedMimes.includes(file.type)) {
    console.warn(`MIME type mismatch: expected ${allowedMimes.join(' or ')}, got ${file.type}`);
    // Don't throw - some browsers report incorrect MIME types, especially for CSV
  }
};

export const parseFile = async (file: File): Promise<ParsedRecord[]> => {
  // Validate file before processing
  validateFile(file);
  
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
