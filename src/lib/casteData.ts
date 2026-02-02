// Comprehensive caste/surname mapping for Nepal
export interface CasteCategory {
  name: string;
  nameNe: string;
  surnames: string[];
  surnamesNe: string[];
}

export const CASTE_CATEGORIES: CasteCategory[] = [
  {
    name: 'Newar',
    nameNe: 'नेवार',
    surnames: [
      'shrestha', 'shakya', 'maharjan', 'dangol', 'tuladhar', 'tamrakar',
      'manandhar', 'amatya', 'joshi', 'pradhan', 'rajbhandari', 'balami',
      'bajracharya', 'sthapit', 'ranjitkar', 'nakarmi', 'chitrakar', 'karmacharya',
      'gopali', 'silwal', 'singh', 'malla', 'duwal', 'kansakar', 'baniya',
      'awale', 'bhandary', 'hada', 'kakshapati', 'kayastha', 'lakhe', 'mali',
      'prajapati', 'rajkarnikar', 'suwal', 'tandukar', 'udas'
    ],
    surnamesNe: [
      'श्रेष्ठ', 'शाक्य', 'महर्जन', 'डंगोल', 'तुलाधर', 'ताम्राकार',
      'मानन्धर', 'अमात्य', 'जोशी', 'प्रधान', 'राजभण्डारी', 'बलामी',
      'बज्राचार्य', 'स्थापित', 'रञ्जितकार', 'नकर्मी', 'चित्रकार', 'कर्माचार्य',
      'गोपाली', 'सिलवाल', 'सिंह', 'मल्ल', 'दुवाल', 'कंसाकार', 'बनिया',
      'अवाले', 'भण्डारी', 'हाडा', 'काक्षपति', 'कायस्थ', 'लाखे', 'माली',
      'प्रजापति', 'राजकर्णिकार', 'सुवाल', 'तण्डुकार', 'उदास'
    ]
  },
  {
    name: 'Brahmin',
    nameNe: 'ब्राह्मण',
    surnames: [
      'pandey', 'pandit', 'sharma', 'poudel', 'subedi', 'bhattarai', 'dahal',
      'khatiwada', 'rijal', 'acharya', 'upadhyay', 'aryal', 'lamichhane',
      'ghimire', 'koirala', 'sapkota', 'tiwari', 'gautam', 'regmi', 'adhikari',
      'devkota', 'dhakal', 'parajuli', 'pokharel', 'panta', 'upreti', 'baral',
      'luitel', 'neupane', 'pathak', 'sanjel', 'bhandari'
    ],
    surnamesNe: [
      'पाण्डे', 'पण्डित', 'शर्मा', 'पौडेल', 'सुबेदी', 'भट्टराई', 'दाहाल',
      'खतिवडा', 'रिजाल', 'आचार्य', 'उपाध्याय', 'अर्याल', 'लामिछाने',
      'घिमिरे', 'कोइराला', 'सापकोटा', 'तिवारी', 'गौतम', 'रेग्मी', 'अधिकारी',
      'देवकोटा', 'ढकाल', 'पराजुली', 'पोखरेल', 'पन्त', 'उप्रेती', 'बराल',
      'लुइटेल', 'न्यौपाने', 'पाठक', 'संझेल', 'भण्डारी'
    ]
  },
  {
    name: 'Chhetri',
    nameNe: 'क्षेत्री',
    surnames: [
      'khatri', 'kshetri', 'thapa', 'rana', 'basnet', 'karki', 'bhandari',
      'khadka', 'bogati', 'budhathoki', 'chand', 'gharti', 'hamal', 'kunwar',
      'mahat', 'rawal', 'raut', 'rawat', 'rokaya', 'sahi', 'thakuri', 'kc',
      'adhikari', 'bista', 'bohara', 'shahi', 'chhettri', 'gc', 'pande'
    ],
    surnamesNe: [
      'खत्री', 'क्षेत्री', 'थापा', 'राणा', 'बस्नेत', 'कार्की', 'भण्डारी',
      'खड्का', 'बोगटी', 'बुढाथोकी', 'चन्द', 'घर्ती', 'हमाल', 'कुँवर',
      'महत', 'रावल', 'राउत', 'रावत', 'रोकाया', 'साही', 'ठकुरी', 'केसी',
      'अधिकारी', 'विष्ट', 'बोहरा', 'शाही', 'छेत्री', 'जीसी', 'पाण्डे'
    ]
  },
  {
    name: 'Tamang/Lama',
    nameNe: 'तामाङ/लामा',
    surnames: [
      'tamang', 'lama', 'bomjan', 'dong', 'ghalan', 'gole', 'gurung', 'lo',
      'moktan', 'muktan', 'pakhrin', 'syangtan', 'thokar', 'thing', 'waiba',
      'yonjan', 'rumba', 'bal'
    ],
    surnamesNe: [
      'तामाङ', 'लामा', 'बोम्जन', 'डोङ', 'घलान', 'गोले', 'गुरुङ', 'लो',
      'मोक्तान', 'मुक्तान', 'पाख्रिन', 'स्याङ्तान', 'थोकर', 'थिङ', 'वाइबा',
      'योञ्जन', 'रुम्बा', 'बल'
    ]
  },
  {
    name: 'Gurung',
    nameNe: 'गुरुङ',
    surnames: [
      'gurung', 'ghale', 'ghandarba', 'tamu'
    ],
    surnamesNe: [
      'गुरुङ', 'घले', 'गन्धर्व', 'तमु'
    ]
  },
  {
    name: 'Magar',
    nameNe: 'मगर',
    surnames: [
      'magar', 'ale', 'bura', 'gharti', 'pun', 'rana', 'roka', 'thapa',
      'sinjali', 'budhuja', 'chantyal'
    ],
    surnamesNe: [
      'मगर', 'आले', 'बुरा', 'घर्ती', 'पुन', 'राना', 'रोका', 'थापा',
      'सिंजाली', 'बुधुजा', 'चन्त्याल'
    ]
  },
  {
    name: 'Dalit',
    nameNe: 'दलित',
    surnames: [
      'biswakarma', 'bishwokarma', 'kami', 'sunar', 'lohar', 'chunara',
      'pariyar', 'damai', 'darji', 'sarki', 'chamar', 'nepali', 'harijan',
      'pode', 'chyame', 'mijar', 'rasaili', 'sundas', 'nagarkoti', 'khapangi',
      'bk', 'khadgi'
    ],
    surnamesNe: [
      'विश्वकर्मा', 'बिश्वोकर्मा', 'कामी', 'सुनार', 'लोहार', 'चुनारा',
      'परियार', 'दमाई', 'दर्जी', 'सार्की', 'चमार', 'नेपाली', 'हरिजन',
      'पोडे', 'च्यामे', 'मिजार', 'रसाइली', 'सुन्दास', 'नगरकोटी', 'खपंगी',
      'बिके', 'खड्गी'
    ]
  },
  {
    name: 'Thakuri/Shahi',
    nameNe: 'ठकुरी/शाही',
    surnames: [
      'shahi', 'thakuri', 'singh', 'malla', 'chand', 'shah', 'bam'
    ],
    surnamesNe: [
      'शाही', 'ठकुरी', 'सिंह', 'मल्ल', 'चन्द', 'शाह', 'बम'
    ]
  },
  {
    name: 'Rai/Limbu',
    nameNe: 'राई/लिम्बू',
    surnames: [
      'rai', 'limbu', 'subba', 'khambu', 'chamling', 'bantawa', 'khaling',
      'thulung', 'athpahariya', 'yakha', 'sunuwar', 'yamphu'
    ],
    surnamesNe: [
      'राई', 'लिम्बू', 'सुब्बा', 'खम्बु', 'चाम्लिङ', 'बन्तावा', 'खालिङ',
      'थुलुङ', 'अठपहरिया', 'याखा', 'सुनुवार', 'याम्फु'
    ]
  }
];

export const detectCasteFromName = (fullName: string): { caste: string; casteNe: string; surname: string } => {
  const nameLower = fullName.toLowerCase().trim();
  const nameParts = nameLower.split(/\s+/);
  const lastName = nameParts[nameParts.length - 1] || '';
  
  // Check against each caste category
  for (const category of CASTE_CATEGORIES) {
    for (const surname of category.surnames) {
      if (lastName === surname.toLowerCase() || nameLower.includes(surname.toLowerCase())) {
        return { 
          caste: category.name, 
          casteNe: category.nameNe,
          surname: surname 
        };
      }
    }
    // Check Nepali surnames
    for (let i = 0; i < category.surnamesNe.length; i++) {
      if (fullName.includes(category.surnamesNe[i])) {
        return { 
          caste: category.name, 
          casteNe: category.nameNe,
          surname: category.surnamesNe[i] 
        };
      }
    }
  }
  
  return { caste: 'Other', casteNe: 'अन्य', surname: lastName };
};

export const getSurnamesByCaste = (casteName: string): string[] => {
  const category = CASTE_CATEGORIES.find(c => 
    c.name.toLowerCase() === casteName.toLowerCase() ||
    c.nameNe === casteName
  );
  return category ? [...category.surnames, ...category.surnamesNe] : [];
};

export const getAllCasteNames = (): { name: string; nameNe: string }[] => {
  return CASTE_CATEGORIES.map(c => ({ name: c.name, nameNe: c.nameNe }));
};
