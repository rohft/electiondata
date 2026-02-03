// Comprehensive caste/surname mapping for Nepal
// Source: https://www.nepalinames.com/blog/list-of-nepali-surnames-and-castes
export interface CasteCategory {
  name: string;
  nameNe: string;
  surnames: string[];
  surnamesNe: string[];
}

export const CASTE_CATEGORIES: CasteCategory[] = [
  {
    name: 'Brahmin',
    nameNe: 'ब्राह्मण',
    surnames: [
      'adhikari', 'alphaltopi', 'arjal', 'bagyal', 'baral', 'bharari', 'bhurtyal', 'bikral',
      'chapagai', 'dahal', 'dangal', 'devakota', 'dhakal', 'dhungana', 'dhurari', 'doeja',
      'dongyal', 'dotiyal', 'dulal', 'gaithaula', 'ghartmel', 'ghartyal', 'khannal', 'khatiwada',
      'koikyal', 'koirala', 'lamsal', 'loityal', 'loiyal', 'maharajila', 'muthbari', 'neopanya',
      'nepalya', 'osti', 'paneru', 'parajuli', 'paudyal', 'pokhrel', 'pokharel', 'punwal',
      'regmi', 'rijal', 'rimal', 'risyal', 'rukai', 'rupakheti', 'sapkota', 'sattyal',
      'sighdel', 'simkhara', 'singyal', 'soti', 'sutar', 'suyal', 'tumrakot', 'ukniyal',
      'pandey', 'pandit', 'sharma', 'poudel', 'subedi', 'bhattarai', 'acharya', 'upadhyay',
      'aryal', 'lamichhane', 'ghimire', 'tiwari', 'gautam', 'upreti', 'luitel', 'neupane',
      'pathak', 'sanjel', 'bhandari', 'prasai', 'tewari', 'banskota', 'bhatta', 'niraula',
      'nepal', 'panthi', 'panta', 'bajgai', 'amgai', 'gilal', 'sijal', 'batyal', 'ganjal',
      'khukhriyal', 'bhiryal', 'sikhmiyal', 'loyal', 'dhongyal', 'chonvala', 'satyagai',
      'garhtola', 'soera', 'balya', 'chonial', 'chalatani', 'kelathoni', 'bamankota',
      'porseni', 'homyagai', 'kandaraih', 'pungyal', 'satonya'
    ],
    surnamesNe: [
      'पाण्डे', 'पण्डित', 'शर्मा', 'पौडेल', 'सुबेदी', 'भट्टराई', 'दाहाल',
      'खतिवडा', 'रिजाल', 'आचार्य', 'उपाध्याय', 'अर्याल', 'लामिछाने',
      'घिमिरे', 'कोइराला', 'सापकोटा', 'तिवारी', 'गौतम', 'रेग्मी', 'अधिकारी',
      'देवकोटा', 'ढकाल', 'पराजुली', 'पोखरेल', 'पन्त', 'उप्रेती', 'बराल',
      'लुइटेल', 'न्यौपाने', 'पाठक', 'संझेल', 'भण्डारी', 'ढुंगाना', 'लम्साल',
      'रिमाल', 'रुपाखेती', 'निरौला', 'नेपाल', 'पन्थी', 'बास्कोटा'
    ]
  },
  {
    name: 'Chhetri',
    nameNe: 'क्षेत्री',
    surnames: [
      'khatri', 'kshetri', 'chhettri', 'thapa', 'rana', 'basnet', 'karki', 'bhandari',
      'khadka', 'bogati', 'boghati', 'budhathoki', 'burathoki', 'chand', 'gharti', 'hamal',
      'kunwar', 'mahat', 'rawal', 'raut', 'rawat', 'ravat', 'rokaya', 'sahi', 'thakuri',
      'kc', 'gc', 'adhikari', 'bista', 'bishta', 'bohara', 'shahi', 'pande', 'raya',
      'katwal', 'khati', 'maghati', 'chohan', 'savan', 'barwal', 'dangi', 'raimanjhi',
      'bhukandi', 'bhusal', 'kutal', 'dikshit', 'chokhal', 'chohara', 'durrah', 'chiloti',
      'shah', 'shaha', 'malla', 'singh', 'sen', 'maan', 'ruchal', 'jiva', 'rakhsya',
      'samal', 'uchhai', 'raika', 'khan', 'khand', 'jalandhari', 'kalyal', 'khulal',
      'pawar', 'ghimirya', 'lamichhanya', 'maharajil', 'deoja', 'gudar', 'palami',
      'thakuryal', 'bagyal', 'maharji', 'lakangi', 'kalikotya', 'bagalya', 'arjal',
      'baniya', 'dani', 'raghuvansi', 'lama', 'sijapati', 'dhami', 'thararai', 'musiah',
      'khadsena', 'bam'
    ],
    surnamesNe: [
      'खत्री', 'क्षेत्री', 'थापा', 'राणा', 'बस्नेत', 'कार्की', 'भण्डारी',
      'खड्का', 'बोगटी', 'बुढाथोकी', 'चन्द', 'घर्ती', 'हमाल', 'कुँवर',
      'महत', 'रावल', 'राउत', 'रावत', 'रोकाया', 'साही', 'ठकुरी', 'केसी',
      'अधिकारी', 'विष्ट', 'बोहरा', 'शाही', 'पाण्डे', 'छेत्री', 'जीसी',
      'शाह', 'मल्ल', 'सिंह', 'सेन', 'भुसाल', 'दंगी', 'बम'
    ]
  },
  {
    name: 'Newar',
    nameNe: 'नेवार',
    surnames: [
      'shrestha', 'shakya', 'maharjan', 'dangol', 'tuladhar', 'tamrakar',
      'manandhar', 'amatya', 'joshi', 'pradhan', 'rajbhandari', 'balami',
      'bajracharya', 'vajracharya', 'sthapit', 'ranjitkar', 'nakarmi', 'chitrakar',
      'karmacharya', 'gopali', 'silwal', 'singh', 'malla', 'duwal', 'kansakar',
      'baniya', 'bania', 'awale', 'awal', 'awa', 'hada', 'kakshapati', 'kakchapati',
      'kayastha', 'lakhey', 'lakhe', 'mali', 'prajapati', 'rajkarnikar', 'suwal',
      'tandukar', 'udas', 'bhaju', 'bhikshu', 'byanjankar', 'chamkhalak', 'chyame',
      'dali', 'darshandhari', 'deola', 'desar', 'gurju', 'guruvacharya', 'halahulu',
      'halwai', 'kapali', 'karanjit', 'khadgi', 'kulu', 'kumah', 'kumhal', 'kusle',
      'madhikarmi', 'malakar', 'nagarkoti', 'napit', 'nepali', 'nyachhyon', 'pahari',
      'patrabansh', 'pode', 'pradhananga', 'pujari', 'pulu', 'putwar', 'rajbahak',
      'rajopadhyaya', 'rajvanshi', 'ranjit', 'sayami', 'shilpakar', 'sikarmi',
      'sikhrakar', 'silakar', 'sindurakar', 'sivacharya', 'tepe', 'vaidya',
      'maskey', 'mathema', 'mulmi', 'banmala', 'bha'
    ],
    surnamesNe: [
      'श्रेष्ठ', 'शाक्य', 'महर्जन', 'डंगोल', 'तुलाधर', 'ताम्राकार',
      'मानन्धर', 'अमात्य', 'जोशी', 'प्रधान', 'राजभण्डारी', 'बलामी',
      'बज्राचार्य', 'स्थापित', 'रञ्जितकार', 'नकर्मी', 'चित्रकार', 'कर्माचार्य',
      'गोपाली', 'सिलवाल', 'सिंह', 'मल्ल', 'दुवाल', 'कंसाकार', 'बनिया',
      'अवाले', 'हाडा', 'काक्षपति', 'कायस्थ', 'लाखे', 'माली',
      'प्रजापति', 'राजकर्णिकार', 'सुवाल', 'तण्डुकार', 'उदास', 'खड्गी',
      'कपाली', 'नगरकोटी', 'नापित', 'नेपाली', 'पोडे', 'वैद्य', 'मास्के'
    ]
  },
  {
    name: 'Magar',
    nameNe: 'मगर',
    surnames: [
      'magar', 'ale', 'aley', 'bura', 'gharti', 'pun', 'rana', 'roka', 'thapa',
      'sinjali', 'singjali', 'budhuja', 'chantyal', 'aslami', 'yahayo', 'saru',
      'arghounle', 'gyangmi', 'palami', 'gacha', 'thada', 'byangnasi', 'phyuyali',
      'lamichhanya', 'gandharma', 'kyapchaki', 'durralama', 'maski', 'charmi',
      'dutt', 'granja', 'namjali', 'marsyandi', 'panthi', 'gelang', 'chumi',
      'lengali', 'chituaorai', 'keli', 'jhandi', 'yangdi', 'jhari', 'bareya',
      'rijal', 'yangmi', 'suryavansi', 'thokchaki', 'sithung', 'lahakpa',
      'pachhai', 'sarangi', 'gonda', 'dukhchaki', 'meng', 'sripali', 'sijapati',
      'lamsal', 'suyal', 'rakhal', 'bhusal'
    ],
    surnamesNe: [
      'मगर', 'आले', 'बुरा', 'घर्ती', 'पुन', 'राना', 'रोका', 'थापा',
      'सिंजाली', 'बुधुजा', 'चन्त्याल', 'पलामी', 'भुसाल'
    ]
  },
  {
    name: 'Gurung',
    nameNe: 'गुरुङ',
    surnames: [
      'gurung', 'ghale', 'ghandarba', 'gandharva', 'tamu', 'byapri', 'vamjan',
      'lama', 'thathung', 'gothi', 'gondok', 'ghotane', 'gohori', 'barahi',
      'gharti', 'lamichhanya', 'siddh', 'karamati', 'gosti', 'bagalya', 'chada',
      'charki', 'khati', 'guabari', 'palami', 'pengi', 'dhakaren', 'khaptari',
      'ghundane', 'dharen', 'jimel', 'lopate', 'lothang', 'bulung', 'shakya lama',
      'golanya', 'khangya', 'tange', 'ghonya', 'paindi', 'mengi', 'dhalama',
      'kurangi', 'suryavansi lama', 'madan'
    ],
    surnamesNe: [
      'गुरुङ', 'घले', 'गन्धर्व', 'तमु', 'लामा', 'घर्ती'
    ]
  },
  {
    name: 'Tamang',
    nameNe: 'तामाङ',
    surnames: [
      'tamang', 'lama', 'bomjan', 'bonzan', 'dong', 'ghalan', 'glan', 'goley', 'gole',
      'lo', 'loba', 'moktan', 'muktan', 'pakhrin', 'syangtan', 'syangdan', 'syangbo',
      'thokar', 'thing', 'waiba', 'yonjan', 'yonzon', 'rumba', 'bal', 'grangdan',
      'titung', 'dimdong', 'gongba', 'gyamden', 'dartang', 'gangtang', 'dumzan',
      'lopchan', 'mikchan', 'ghising', 'yhesur', 'zimba', 'gyaba', 'chothen',
      'blenden', 'blon', 'shyongsun', 'nharten', 'galden', 'marpa', 'nyasur',
      'singar', 'toisang', 'tupa', 'bajyu', 'lungpa', 'gyapa'
    ],
    surnamesNe: [
      'तामाङ', 'लामा', 'बोम्जन', 'डोङ', 'घलान', 'गोले', 'लो',
      'मोक्तान', 'मुक्तान', 'पाख्रिन', 'स्याङ्तान', 'थोकर', 'थिङ', 'वाइबा',
      'योञ्जन', 'रुम्बा', 'बल', 'घिसिङ', 'जिम्बा'
    ]
  },
  {
    name: 'Rai',
    nameNe: 'राई',
    surnames: [
      'rai', 'khambu', 'chamling', 'bantawa', 'khaling', 'thulung', 'athpahariya',
      'yakha', 'sunuwar', 'yamphu', 'kulung', 'sampang', 'mewahang', 'lohorung'
    ],
    surnamesNe: [
      'राई', 'खम्बु', 'चाम्लिङ', 'बन्तावा', 'खालिङ', 'थुलुङ', 'अठपहरिया',
      'याखा', 'सुनुवार', 'याम्फु'
    ]
  },
  {
    name: 'Limbu',
    nameNe: 'लिम्बू',
    surnames: [
      'limbu', 'subba', 'chemjong', 'lingden', 'angbuhang', 'nembang', 'tumbahang',
      'tumrok', 'yakthung', 'thebe', 'maden', 'phago', 'thegsim'
    ],
    surnamesNe: [
      'लिम्बू', 'सुब्बा', 'चेम्जोङ', 'लिङदेन', 'आङ्बुहाङ', 'नेम्बाङ', 'तुम्बाहाङ'
    ]
  },
  {
    name: 'Thakuri',
    nameNe: 'ठकुरी',
    surnames: [
      'shahi', 'thakuri', 'singh', 'malla', 'chand', 'shah', 'bam', 'sen'
    ],
    surnamesNe: [
      'शाही', 'ठकुरी', 'सिंह', 'मल्ल', 'चन्द', 'शाह', 'बम', 'सेन'
    ]
  },
  {
    name: 'Kami',
    nameNe: 'कामी',
    surnames: [
      'kami', 'biswakarma', 'bishwokarma', 'agri', 'acharya', 'wokheda', 'kadara',
      'kandara', 'kasara', 'kallohar', 'kalikote', 'kaliraj', 'shahoo', 'kumaki',
      'kaini', 'koirala', 'koli', 'khadkathoki', 'khapangi', 'khati', 'gajmer',
      'gajurel', 'gadal', 'gadaili', 'gahate', 'gahatraj', 'giri', 'gotame',
      'gowa', 'ghatani', 'ghamal', 'gharti', 'ghimire', 'ghamghotle', 'ghotane',
      'chilime', 'tiwari', 'chhistal', 'jandkami', 'thagunna', 'thatera', 'tiruwa',
      'dayal', 'diyali', 'dalami', 'darnal', 'dudraj', 'dudhraj', 'dural', 'deupate',
      'dewal', 'dhamala', 'dhanik', 'dhanuk', 'niraula', 'nepal', 'panthi',
      'portel', 'poudel', 'baraili', 'barali', 'baral', 'bunchebhale', 'banskota',
      'bipali', 'bhatta', 'bhattarai', 'bhusal', 'mahilipar', 'mar', 'mahar',
      'risyal', 'rasali', 'rasaili', 'rahpal', 'rajilohar', 'ramdam', 'ramdamoo',
      'rijal', 'ruchal', 'raikal', 'lakandri', 'latopi', 'labad', 'lamgade',
      'lamakarmi', 'lamichhane', 'poudeli', 'lohani', 'lwagun', 'luhagun',
      'shahsankar', 'sherala', 'sadasankar', 'sattasankar', 'sapkota', 'sani',
      'sundhuwa', 'sunchyuri', 'sunchiuri', 'singaure', 'sijapati', 'sirpali',
      'shripali', 'suni', 'setipar', 'seti mahara', 'setisural', 'sonam',
      'himchyuri', 'palla', 'parajuli', 'padhyawati', 'pagri', 'pulami', 'pokharel',
      'lohar', 'chunara', 'sunar', 'bk'
    ],
    surnamesNe: [
      'कामी', 'विश्वकर्मा', 'बिश्वोकर्मा', 'लोहार', 'चुनारा', 'सुनार',
      'खपंगी', 'गजमेर', 'गहतराज', 'गोतामे', 'घर्ती', 'घिमिरे', 'दर्नाल',
      'देवाल', 'धमाला', 'पौडेल', 'भट्टराई', 'भुसाल', 'रसाइली', 'लामिछाने',
      'सापकोटा', 'सिजापति', 'पोखरेल', 'बिके'
    ]
  },
  {
    name: 'Damai',
    nameNe: 'दमाई',
    surnames: [
      'damai', 'pariyar', 'darji', 'asasai', 'aauji', 'kandel', 'katuwal',
      'karki', 'khulal', 'mudula', 'lama', 'sutar', 'kalakhati', 'koirala',
      'khatiwada', 'guinde', 'gautam', 'gotame', 'ghatani', 'ghale', 'chahar',
      'chuhan', 'chhinal', 'jairu', 'thagunna', 'thatal', 'daunde', 'dholi',
      'dhyaki', 'tikhatri', 'thapa', 'darnal', 'parel', 'das', 'deukar',
      'dewal', 'nagwag', 'nagwan', 'nagarchi', 'negi', 'nepal', 'naubag',
      'achhame', 'chudal', 'panchkoti', 'panchakoti', 'bahak', 'pokharel',
      'bagchan', 'bagdas', 'budhapothi', 'boodhaprithi', 'baiju', 'bhandari',
      'bhitrikoti', 'bhusal', 'magar', 'mahate', 'mahara', 'male', 'ranpal',
      'ranpahenli', 'ratna', 'ratne', 'ratnapariyar', 'rana', 'raigain',
      'raika', 'ryainjhyain', 'lamghate', 'luintel', 'shinal', 'shilal',
      'shiwa', 'siwa', 'kukhure', 'bhede', 'samudrasai', 'sunal', 'sunam',
      'sundas', 'sunchyuri', 'sunchiuri', 'sudas', 'sasmundra', 'shahassamudra',
      'sooji', 'hingmang', 'hudke', 'bardewa'
    ],
    surnamesNe: [
      'दमाई', 'परियार', 'दर्जी', 'कठुवाल', 'कार्की', 'गौतम', 'घाले',
      'थापा', 'दर्नाल', 'देवाल', 'नेपाल', 'पोखरेल', 'भण्डारी', 'भुसाल',
      'मगर', 'महरा', 'राणा', 'लुइँटेल', 'सुन्दास'
    ]
  },
  {
    name: 'Sarki',
    nameNe: 'सार्की',
    surnames: [
      'sarki', 'achchhami', 'achhami', 'uparkoti', 'upreti', 'kamar', 'koirala',
      'khatiwada', 'giri', 'gaire', 'gairepipan', 'gothe', 'ghimire', 'chamar',
      'chudal', 'chuhan', 'chhatkuli', 'thagunna', 'chhamarki', 'thakursya',
      'thararai', 'dale', 'tolangi', 'thapaliya', 'thak', 'daulakoti', 'dyaulakoti',
      'dabe', 'dahal', 'dulal', 'dhamel', 'naghali', 'pahenli', 'panyeli',
      'purkoti', 'batsyal', 'basel', 'bamrel', 'bayalkoti', 'bastakoti', 'bisunkhe',
      'bogati', 'bhangyal', 'bhul', 'bheyanl', 'bhurtel', 'mangrati', 'magarati',
      'majboti', 'malbule', 'malbok', 'mudel', 'ramtel', 'ruchal', 'roila',
      'rokka', 'lamjel', 'lamsal', 'shahi', 'shrimati', 'sirimal', 'sarmaute',
      'siraute', 'surkheni', 'suyenl', 'sejwal', 'hitang'
    ],
    surnamesNe: [
      'सार्की', 'आछामी', 'उपर्कोटी', 'कामार', 'कोइराला', 'खतिवडा',
      'गिरी', 'घिमिरे', 'चमार', 'चुडाल', 'दाहाल', 'दुलाल', 'बोगटी',
      'भुर्तेल', 'रोइला', 'रोक्का', 'लाम्साल', 'शाही'
    ]
  },
  {
    name: 'Gaine',
    nameNe: 'गाईने',
    surnames: [
      'gaine', 'gandharba', 'adhikari', 'kala kaushik', 'kala poudel', 'kalichan',
      'gosai', 'jogi', 'thakuri', 'turki', 'bahun', 'budhathoki', 'baikar',
      'wagyakar', 'baistha', 'bistha', 'meghnath', 'bishwakarma', 'bishnupad',
      'samudri', 'sai', 'sursaman', 'setaparbate', 'setichan', 'hukchingrana',
      'bogate', 'bhusal', 'bhusalparbate', 'maheshwar'
    ],
    surnamesNe: [
      'गाईने', 'गन्धर्व', 'अधिकारी', 'जोगी', 'ठकुरी', 'बुढाथोकी',
      'बिश्वकर्मा', 'भुसाल'
    ]
  },
  {
    name: 'Dalit',
    nameNe: 'दलित',
    surnames: [
      'nepali', 'harijan', 'pode', 'chyame', 'mijar', 'nagarkoti'
    ],
    surnamesNe: [
      'नेपाली', 'हरिजन', 'पोडे', 'च्यामे', 'मिजार', 'नगरकोटी'
    ]
  },
  {
    name: 'Sherpa',
    nameNe: 'शेर्पा',
    surnames: [
      'sherpa', 'lama', 'ang', 'mingma', 'dawa', 'pasang', 'phurba', 'nima',
      'tenzing', 'norbu', 'dorje', 'karma', 'thupten', 'sonam', 'tshering'
    ],
    surnamesNe: [
      'शेर्पा', 'लामा', 'आङ', 'मिंग्मा', 'दावा', 'पासाङ', 'फुर्बा',
      'निमा', 'तेन्जिङ', 'नोर्बु', 'दोर्जे', 'कर्मा', 'सोनाम', 'छेरिङ'
    ]
  },
  {
    name: 'Tharu',
    nameNe: 'थारू',
    surnames: [
      'tharu', 'chaudhary', 'mahato', 'dagaura', 'rana', 'kathariya', 'dangaura'
    ],
    surnamesNe: [
      'थारू', 'चौधरी', 'महतो', 'दगौरा', 'राणा', 'कठरिया', 'दंगौरा'
    ]
  },
  {
    name: 'Madhesi',
    nameNe: 'मधेशी',
    surnames: [
      'yadav', 'sah', 'mandal', 'jha', 'mishra', 'thakur', 'rajput', 'kurmi',
      'koiri', 'teli', 'kalwar', 'kanu', 'mallah', 'sahani', 'kewat', 'dhobi',
      'hajam', 'chamar', 'dusadh', 'musahar', 'dom', 'mehtar'
    ],
    surnamesNe: [
      'यादव', 'साह', 'मण्डल', 'झा', 'मिश्र', 'ठाकुर', 'राजपुत', 'कुर्मी',
      'कोइरी', 'तेली', 'कलवार', 'कानु', 'मल्लाह', 'सहानी', 'केवट', 'धोबी',
      'हजाम', 'चमार', 'दुसाध', 'मुसहर', 'डोम', 'मेहतर'
    ]
  },
  {
    name: 'Muslim',
    nameNe: 'मुस्लिम',
    surnames: [
      'ansari', 'khan', 'shaikh', 'miya', 'siddiqui', 'pathan', 'qureshi',
      'mansuri', 'dhobi', 'muslim'
    ],
    surnamesNe: [
      'अन्सारी', 'खान', 'शेख', 'मियाँ', 'सिद्दिकी', 'पठान', 'कुरेशी',
      'मन्सुरी', 'मुस्लिम'
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

export const detectCasteFromSurname = (surname: string): { caste: string; casteNe: string } => {
  const surnameLower = surname.toLowerCase().trim();
  
  for (const category of CASTE_CATEGORIES) {
    // Check English surnames
    if (category.surnames.some(s => s.toLowerCase() === surnameLower)) {
      return { caste: category.name, casteNe: category.nameNe };
    }
    // Check Nepali surnames
    if (category.surnamesNe.includes(surname)) {
      return { caste: category.name, casteNe: category.nameNe };
    }
  }
  
  return { caste: 'Other', casteNe: 'अन्य' };
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

export const isNewarSurname = (surname: string): boolean => {
  const newarCategory = CASTE_CATEGORIES.find(c => c.name === 'Newar');
  if (!newarCategory) return false;
  
  const surnameLower = surname.toLowerCase().trim();
  return newarCategory.surnames.some(s => s.toLowerCase() === surnameLower) ||
         newarCategory.surnamesNe.includes(surname);
};
