// Surname/sub-caste extraction utilities
const NEWAR_SURNAMES = [
  'shrestha', 'shakya', 'maharjan', 'dangol', 'tuladhar', 'tamrakar',
  'manandhar', 'singh', 'amatya', 'joshi', 'pradhan', 'rajbhandari',
  'bajracharya', 'sthapit', 'ranjitkar', 'nakarmi', 'chitrakar', 'karmacharya',
  'श्रेष्ठ', 'शाक्य', 'महर्जन', 'डंगोल', 'तुलाधर', 'ताम्राकार',
  'मानन्धर', 'अमात्य', 'जोशी', 'प्रधान', 'राजभण्डारी',
  'बज्राचार्य', 'स्थापित', 'रञ्जितकार', 'नकर्मी', 'चित्रकार', 'कर्माचार्य'
];

const COMMON_SURNAMES: Record<string, string> = {
  // Brahmin surnames
  'पाण्डे': 'Brahmin', 'पण्डित': 'Brahmin', 'शर्मा': 'Brahmin', 'पौडेल': 'Brahmin',
  'सुवेदी': 'Brahmin', 'सुबेदी': 'Brahmin', 'भट्टराई': 'Brahmin', 'दाहाल': 'Brahmin',
  'खतिवडा': 'Brahmin', 'रिजाल': 'Brahmin', 'आचार्य': 'Brahmin', 'उपाध्याय': 'Brahmin',
  
  // Chhetri surnames
  'खत्री': 'Chhetri', 'क्षेत्री': 'Chhetri', 'थापा': 'Chhetri', 'राणा': 'Chhetri',
  'बस्नेत': 'Chhetri', 'कार्की': 'Chhetri', 'भण्डारी': 'Chhetri', 'खड्का': 'Chhetri',
  
  // Tamang/Lama
  'तामाङ': 'Tamang', 'तामाङ्ग': 'Tamang/Lama', 'लामा': 'Tamang/Lama',
  
  // Newar
  'श्रेष्ठ': 'Newar', 'शाक्य': 'Newar', 'महर्जन': 'Newar', 'तुलाधर': 'Newar',
  'मानन्धर': 'Newar', 'बज्राचार्य': 'Newar', 'जोशी': 'Newar', 'प्रधान': 'Newar',
  'राजभण्डारी': 'Newar', 'कर्माचार्य': 'Newar', 'चित्रकार': 'Newar',
  
  // Dalit
  'खड्गी': 'Dalit', 'बिश्वकर्मा': 'Dalit', 'नेपाली': 'Dalit', 'परियार': 'Dalit',
  'दर्जी': 'Dalit', 'सार्की': 'Dalit', 'कामी': 'Dalit', 'दमाई': 'Dalit',
  
  // Others
  'शाही': 'Thakuri/Shahi', 'वलामी': 'Balami', 'बलामी': 'Balami',
  'गोपाली': 'Gopali', 'सिलवाल': 'Silwal', 'मुक्तान': 'Muktan',
  'व्लोन': 'Blon', 'मिजार': 'Mijar'
};

export const extractSurname = (fullName: string): { surname: string; subCaste: string } => {
  const nameParts = fullName.trim().split(/\s+/);
  if (nameParts.length === 0) return { surname: '', subCaste: '' };
  
  // Get the last word as potential surname
  const lastName = nameParts[nameParts.length - 1];
  
  // Check for compound surnames in parentheses
  const parenMatch = fullName.match(/\(([^)]+)\)/);
  if (parenMatch) {
    return { 
      surname: parenMatch[1], 
      subCaste: COMMON_SURNAMES[parenMatch[1]] || detectCaste(parenMatch[1]) 
    };
  }
  
  // Try to find a known surname anywhere in the name
  for (const [surname, caste] of Object.entries(COMMON_SURNAMES)) {
    if (fullName.includes(surname)) {
      return { surname, subCaste: caste };
    }
  }
  
  // Default to last name
  return { 
    surname: lastName, 
    subCaste: detectCaste(lastName) 
  };
};

const detectCaste = (name: string): string => {
  const lower = name.toLowerCase();
  if (NEWAR_SURNAMES.some(s => lower.includes(s.toLowerCase()))) {
    return 'Newar';
  }
  return '';
};

export const isNewarName = (name: string): boolean => {
  const lower = name.toLowerCase();
  return NEWAR_SURNAMES.some(s => lower.includes(s.toLowerCase()));
};

export const AGE_RANGES = [
  { label: 'All Ages', value: 'all', min: 0, max: 200 },
  { label: '18-25', value: '18-25', min: 18, max: 25 },
  { label: '26-35', value: '26-35', min: 26, max: 35 },
  { label: '36-45', value: '36-45', min: 36, max: 45 },
  { label: '46-55', value: '46-55', min: 46, max: 55 },
  { label: '56-65', value: '56-65', min: 56, max: 65 },
  { label: '65+', value: '65+', min: 65, max: 200 },
];
