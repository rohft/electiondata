// DEPRECATED: Caste detection and categorization has been disabled
// This file is kept for backward compatibility but returns empty/null values

export const CASTE_CATEGORIES = {
  OTHER: 'Other'
} as const;

// DEPRECATED: Caste surname mapping disabled
const CASTE_SURNAME_MAP: Record<string, string> = {
  // Brahmin surnames
  'पौडेल': CASTE_CATEGORIES.BRAHMIN,
  'पाण्डे': CASTE_CATEGORIES.BRAHMIN,
  'पन्त': CASTE_CATEGORIES.BRAHMIN,
  'भट्टराई': CASTE_CATEGORIES.BRAHMIN,
  'अधिकारी': CASTE_CATEGORIES.BRAHMIN,
  'उपाध्याय': CASTE_CATEGORIES.BRAHMIN,
  'आचार्य': CASTE_CATEGORIES.BRAHMIN,
  'न्यौपाने': CASTE_CATEGORIES.BRAHMIN,
  'रिजाल': CASTE_CATEGORIES.BRAHMIN,
  'खतिवडा': CASTE_CATEGORIES.BRAHMIN,
  'गौतम': CASTE_CATEGORIES.BRAHMIN,
  'ढकाल': CASTE_CATEGORIES.BRAHMIN,
  'शर्मा': CASTE_CATEGORIES.BRAHMIN,
  'तिवारी': CASTE_CATEGORIES.BRAHMIN,
  'पाठक': CASTE_CATEGORIES.BRAHMIN,
  'दाहाल': CASTE_CATEGORIES.BRAHMIN,
  'पोखरेल': CASTE_CATEGORIES.BRAHMIN,
  'न्यौपाने': CASTE_CATEGORIES.BRAHMIN,
  'Poudel': CASTE_CATEGORIES.BRAHMIN,
  'Pandey': CASTE_CATEGORIES.BRAHMIN,
  'Bhattarai': CASTE_CATEGORIES.BRAHMIN,
  'Adhikari': CASTE_CATEGORIES.BRAHMIN,
  'Sharma': CASTE_CATEGORIES.BRAHMIN,

  // Chhetri surnames
  'थापा': CASTE_CATEGORIES.CHHETRI,
  'बस्नेत': CASTE_CATEGORIES.CHHETRI,
  'खत्री': CASTE_CATEGORIES.CHHETRI,
  'खड्का': CASTE_CATEGORIES.CHHETRI,
  'रावल': CASTE_CATEGORIES.CHHETRI,
  'बोहरा': CASTE_CATEGORIES.CHHETRI,
  'कार्की': CASTE_CATEGORIES.CHHETRI,
  'रोका': CASTE_CATEGORIES.CHHETRI,
  'ओली': CASTE_CATEGORIES.CHHETRI,
  'केसी': CASTE_CATEGORIES.CHHETRI,
  'शाह': CASTE_CATEGORIES.CHHETRI,
  'Thapa': CASTE_CATEGORIES.CHHETRI,
  'Basnet': CASTE_CATEGORIES.CHHETRI,
  'Khadka': CASTE_CATEGORIES.CHHETRI,
  'Shah': CASTE_CATEGORIES.CHHETRI,
  'KC': CASTE_CATEGORIES.CHHETRI,

  // Newar surnames
  'श्रेष्ठ': CASTE_CATEGORIES.NEWAR,
  'महर्जन': CASTE_CATEGORIES.NEWAR,
  'शाक्य': CASTE_CATEGORIES.NEWAR,
  'तुलाधर': CASTE_CATEGORIES.NEWAR,
  'बज्राचार्य': CASTE_CATEGORIES.NEWAR,
  'प्रधान': CASTE_CATEGORIES.NEWAR,
  'देउला': CASTE_CATEGORIES.NEWAR,
  'कर्माचार्य': CASTE_CATEGORIES.NEWAR,
  'अमात्य': CASTE_CATEGORIES.NEWAR,
  'जोशी': CASTE_CATEGORIES.NEWAR,
  'Shrestha': CASTE_CATEGORIES.NEWAR,
  'Maharjan': CASTE_CATEGORIES.NEWAR,
  'Shakya': CASTE_CATEGORIES.NEWAR,

  // Tamang surnames
  'तामाङ': CASTE_CATEGORIES.TAMANG,
  'लामा': CASTE_CATEGORIES.TAMANG,
  'Tamang': CASTE_CATEGORIES.TAMANG,
  'Lama': CASTE_CATEGORIES.TAMANG,

  // Magar surnames
  'मगर': CASTE_CATEGORIES.MAGAR,
  'थापा मगर': CASTE_CATEGORIES.MAGAR,
  'पुन': CASTE_CATEGORIES.MAGAR,
  'Magar': CASTE_CATEGORIES.MAGAR,
  'Pun': CASTE_CATEGORIES.MAGAR,

  // Tharu surnames
  'थारु': CASTE_CATEGORIES.THARU,
  'चौधरी': CASTE_CATEGORIES.THARU,
  'डंगौरा': CASTE_CATEGORIES.THARU,
  'Tharu': CASTE_CATEGORIES.THARU,
  'Chaudhary': CASTE_CATEGORIES.THARU,

  // Sherpa surnames
  'शेर्पा': CASTE_CATEGORIES.SHERPA,
  'Sherpa': CASTE_CATEGORIES.SHERPA,

  // Gurung surnames
  'गुरुङ': CASTE_CATEGORIES.GURUNG,
  'घले': CASTE_CATEGORIES.GURUNG,
  'Gurung': CASTE_CATEGORIES.GURUNG,
  'Ghale': CASTE_CATEGORIES.GURUNG,

  // Rai surnames
  'राई': CASTE_CATEGORIES.RAI,
  'Rai': CASTE_CATEGORIES.RAI,

  // Limbu surnames
  'लिम्बु': CASTE_CATEGORIES.LIMBU,
  'Limbu': CASTE_CATEGORIES.LIMBU,

  // Dalit surnames
  'दमाई': CASTE_CATEGORIES.DALIT,
  'कामी': CASTE_CATEGORIES.DALIT,
  'सार्की': CASTE_CATEGORIES.DALIT,
  'परियार': CASTE_CATEGORIES.DALIT,
  'बिश्वकर्मा': CASTE_CATEGORIES.DALIT,
  'Damai': CASTE_CATEGORIES.DALIT,
  'Kami': CASTE_CATEGORIES.DALIT,
  'Sarki': CASTE_CATEGORIES.DALIT,
  'Pariyar': CASTE_CATEGORIES.DALIT,
  'Bishwakarma': CASTE_CATEGORIES.DALIT
};

/**
 * DEPRECATED: Caste detection has been disabled
 * Always returns null
 */
export function detectCasteFromName(fullName: string): {
  caste: string | null;
  confidence: 'high' | 'medium' | 'low';
} {
  return { caste: null, confidence: 'low' };
}

/**
 * DEPRECATED: Returns empty array
 */
export function getAllCasteCategories(): string[] {
  return [];
}

/**
 * DEPRECATED: Returns empty object
 */
export function getCasteStats(names: string[]): Record<string, number> {
  return {};
}