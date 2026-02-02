import * as XLSX from 'xlsx';

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
    if (original === 'सि.नं.' || original === 'सि.नं' || original === 'क्र.सं.' || lower === 'sn' || lower === 's.n' || lower === 's.n.') {
      headerMap['sn'] = idx;
    }
    // Voter ID
    else if (original === 'मतदाता नं' || original === 'मतदाता नं.' || lower.includes('voter id') || lower.includes('voter no') || lower === 'id') {
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
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to array of arrays
  const data = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
  
  if (data.length < 2) return [];
  
  const headers = (data[0] as string[]).map(h => String(h || '').trim());
  const headerMap = normalizeHeaders(headers);
  const records: ParsedRecord[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as string[];
    if (!row || row.length < 3) continue;

    const originalData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      originalData[h] = String(row[idx] || '');
    });

    const record: ParsedRecord = {
      sn: String(row[headerMap['sn'] ?? -1] || ''),
      wardNo: String(row[headerMap['wardNo'] ?? -1] || ''),
      centerName: String(row[headerMap['centerName'] ?? -1] || ''),
      voterId: String(row[headerMap['voterId'] ?? 1] || ''),
      voterName: String(row[headerMap['voterName'] ?? 2] || ''),
      age: parseInt(String(row[headerMap['age'] ?? 3])) || 0,
      gender: normalizeGender(String(row[headerMap['gender'] ?? 4] || '')),
      spouse: String(row[headerMap['spouse'] ?? -1] || ''),
      parents: String(row[headerMap['parents'] ?? -1] || ''),
      caste: String(row[headerMap['caste'] ?? -1] || ''),
      surname: String(row[headerMap['surname'] ?? -1] || ''),
      status: String(row[headerMap['status'] ?? -1] || ''),
      green: String(row[headerMap['green'] ?? -1] || ''),
      yellow: String(row[headerMap['yellow'] ?? -1] || ''),
      red: String(row[headerMap['red'] ?? -1] || ''),
      originalData,
    };

    records.push(record);
  }

  return records;
};

export const parseJSON = async (file: File): Promise<ParsedRecord[]> => {
  const text = await file.text();
  const data = JSON.parse(text);
  
  // Handle both array and object with data property
  const rows = Array.isArray(data) ? data : (data.data || data.records || data.voters || []);
  
  return rows.map((row: Record<string, unknown>) => {
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
      green: String(row.green || row.GREEN || ''),
      yellow: String(row.yellow || row.YELLOW || ''),
      red: String(row.red || row.RED || ''),
      originalData,
    } as ParsedRecord;
  });
};

export const parseFile = async (file: File): Promise<ParsedRecord[]> => {
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
      throw new Error(`Unsupported file format: ${extension}`);
  }
};

export const getSupportedFormats = () => '.csv,.xlsx,.xls,.json';
export const getSupportedFormatsText = () => 'CSV, Excel (.xlsx, .xls), JSON';
