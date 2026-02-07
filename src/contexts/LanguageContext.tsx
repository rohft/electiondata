import React, { createContext, useContext, useState, useCallback } from 'react';

type Language = 'en' | 'ne';

interface Translations {
  [key: string]: {
    en: string;
    ne: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', ne: 'ड्यासबोर्ड' },
  'nav.upload': { en: 'Upload Data', ne: 'डाटा अपलोड' },
  'nav.ethnicGroup': { en: 'Ethnic Group', ne: 'जातीय समूह' },
  'nav.segments': { en: 'Segments', ne: 'खण्डहरू' },
  'nav.comparison': { en: 'Comparison', ne: 'तुलना' },
  'nav.infographics': { en: 'Infographics', ne: 'इन्फोग्राफिक्स' },
  'nav.edit': { en: 'Edit Data', ne: 'डाटा सम्पादन' },
  'nav.export': { en: 'Export', ne: 'निर्यात' },
  'nav.settings': { en: 'Settings', ne: 'सेटिङहरू' },
  'nav.templates': { en: 'Templates', ne: 'टेम्प्लेटहरू' },
  'nav.map': { en: 'Map Data', ne: 'डाटा म्यापिङ' },
  'nav.categoryMgmt': { en: 'Category Management', ne: 'श्रेणी व्यवस्थापन' },
  'map.title': { en: 'Map Data Fields', ne: 'डाटा फिल्डहरू म्याप गर्नुहोस्' },
  'map.description': { en: 'Map columns from your uploaded data to application fields', ne: 'अपलोड गरिएको डाटाबाट स्तम्भहरूलाई एप्लिकेशन फिल्डहरूमा म्याप गर्नुहोस्' },
  'map.sourceColumn': { en: 'Source Column', ne: 'स्रोत स्तम्भ' },
  'map.targetField': { en: 'Target Field', ne: 'लक्षित फिल्ड' },
  'map.unmapped': { en: 'Unmapped', ne: 'म्याप नगरिएको' },
  'map.saveMapping': { en: 'Save Mapping', ne: 'म्यापिङ सेभ गर्नुहोस्' },
  'map.resetMapping': { en: 'Reset Mapping', ne: 'म्यापिङ रिसेट गर्नुहोस्' },
  

  // Common
  'common.search': { en: 'Search...', ne: 'खोज्नुहोस्...' },
  'common.upload': { en: 'Upload', ne: 'अपलोड' },
  'common.save': { en: 'Save', ne: 'सेभ गर्नुहोस्' },
  'common.cancel': { en: 'Cancel', ne: 'रद्द गर्नुहोस्' },
  'common.delete': { en: 'Delete', ne: 'मेट्नुहोस्' },
  'common.edit': { en: 'Edit', ne: 'सम्पादन' },
  'common.add': { en: 'Add', ne: 'थप्नुहोस्' },
  'common.remove': { en: 'Remove', ne: 'हटाउनुहोस्' },
  'common.export': { en: 'Export', ne: 'निर्यात' },
  'common.loading': { en: 'Loading...', ne: 'लोड हुँदैछ...' },
  'common.total': { en: 'Total', ne: 'कुल' },
  'common.voters': { en: 'Voters', ne: 'मतदाताहरू' },
  'common.ward': { en: 'Ward', ne: 'वडा' },
  'common.municipality': { en: 'Municipality', ne: 'नगरपालिका' },
  'common.next': { en: 'Next', ne: 'अर्को' },
  'common.back': { en: 'Back', ne: 'पछाडि' },
  'common.of': { en: 'of', ne: 'को' },
  'common.select': { en: 'Select', ne: 'छान्नुहोस्' },
  'common.all': { en: 'All', ne: 'सबै' },
  'common.version': { en: 'Version', ne: 'संस्करण' },
  'common.current': { en: 'Current', ne: 'हालको' },
  'common.download': { en: 'Download', ne: 'डाउनलोड' },

  // Dashboard
  'dashboard.title': { en: 'Voter Analysis Dashboard', ne: 'मतदाता विश्लेषण ड्यासबोर्ड' },
  'dashboard.subtitle': { en: 'Comprehensive analysis across municipalities', ne: 'नगरपालिकाहरूमा व्यापक विश्लेषण' },
  'dashboard.totalVoters': { en: 'Total Voters', ne: 'कुल मतदाताहरू' },
  'dashboard.totalMunicipalities': { en: 'Municipalities', ne: 'नगरपालिकाहरू' },
  'dashboard.totalWards': { en: 'Total Wards', ne: 'कुल वडाहरू' },
  'dashboard.dataFiles': { en: 'Data Files', ne: 'डाटा फाइलहरू' },

  // Upload
  'upload.title': { en: 'Upload Voter Data', ne: 'मतदाता डाटा अपलोड गर्नुहोस्' },
  'upload.description': { en: 'Upload voter data files for municipalities and wards', ne: 'नगरपालिका र वडाहरूको लागि मतदाता डाटा फाइलहरू अपलोड गर्नुहोस्' },
  'upload.dragDrop': { en: 'Drag & drop files here, or click to browse', ne: 'फाइलहरू यहाँ तान्नुहोस् वा ब्राउज गर्न क्लिक गर्नुहोस्' },
  'upload.supportedFormats': { en: 'Supported: CSV, Excel, JSON', ne: 'समर्थित: CSV, Excel, JSON' },
  'upload.selectWard': { en: 'Select Ward', ne: 'वडा छान्नुहोस्' },
  'upload.selectMunicipality': { en: 'Select Municipality', ne: 'नगरपालिका छान्नुहोस्' },
  'upload.addWard': { en: 'Add Ward', ne: 'वडा थप्नुहोस्' },
  'upload.success': { en: 'Upload successful', ne: 'अपलोड सफल भयो' },
  'upload.error': { en: 'Upload failed', ne: 'अपलोड असफल भयो' },
  'upload.step': { en: 'Step', ne: 'चरण' },
  'upload.municipalityName': { en: 'Municipality Name', ne: 'नगरपालिकाको नाम' },
  'upload.numberOfWards': { en: 'Number of Wards', ne: 'वडाहरूको संख्या' },
  'upload.viewData': { en: 'View Data', ne: 'डाटा हेर्नुहोस्' },
  'upload.municipalityHint': { en: 'Enter the name of the municipality you want to analyze', ne: 'तपाईंले विश्लेषण गर्न चाहनुभएको नगरपालिकाको नाम प्रविष्ट गर्नुहोस्' },
  'upload.wardCountHint': { en: 'Enter the total number of wards in', ne: 'मा रहेका वडाहरूको कुल संख्या प्रविष्ट गर्नुहोस्' },
  'upload.uploadFilesForWards': { en: 'Upload files for each ward', ne: 'प्रत्येक वडाको लागि फाइलहरू अपलोड गर्नुहोस्' },
  'upload.wardsUploaded': { en: 'wards uploaded', ne: 'वडाहरू अपलोड भयो' },
  'upload.uploadPartialHint': { en: 'You can upload files for some wards now and add more later', ne: 'तपाईं अहिले केही वडाहरूको लागि फाइलहरू अपलोड गर्न सक्नुहुन्छ र पछि थप गर्न सक्नुहुन्छ' },
  'upload.saveAndView': { en: 'Save & View Data', ne: 'सेभ गर्नुहोस् र डाटा हेर्नुहोस्' },
  'upload.noData': { en: 'No data uploaded yet', ne: 'अझै कुनै डाटा अपलोड भएको छैन' },
  'upload.noDataDescription': { en: 'Upload CSV, Excel, or JSON files containing voter data to start analyzing demographics across municipalities and wards.', ne: 'नगरपालिका र वडाहरूमा जनसांख्यिकी विश्लेषण सुरु गर्न मतदाता डाटा समावेश गरिएका CSV, Excel, वा JSON फाइलहरू अपलोड गर्नुहोस्।' },
  'upload.uploadData': { en: 'Upload Data', ne: 'डाटा अपलोड गर्नुहोस्' },
  'upload.addMoreData': { en: 'Add More Data', ne: 'थप डाटा थप्नुहोस्' },
  'upload.addMunicipality': { en: 'Add Municipality', ne: 'नगरपालिका थप्नुहोस्' },
  'upload.addWardData': { en: 'Add Ward Data', ne: 'वडा डाटा थप्नुहोस्' },
  'upload.existingWards': { en: 'Existing wards', ne: 'अवस्थित वडाहरू' },
  'upload.quickAddWards': { en: 'Quick add remaining wards', ne: 'बाँकी वडाहरू छिटो थप्नुहोस्' },
  'upload.wardsToUpload': { en: 'Wards to upload', ne: 'अपलोड गर्ने वडाहरू' },
  'upload.saveWards': { en: 'Save Wards', ne: 'वडाहरू सेभ गर्नुहोस्' },
  'upload.updateData': { en: 'Update Data', ne: 'डाटा अपडेट गर्नुहोस्' },
  'upload.switchVersion': { en: 'Switch Version', ne: 'संस्करण बदल्नुहोस्' },
  'upload.currentVersion': { en: 'Current Version', ne: 'हालको संस्करण' },

  // Table Headers
  'table.sn': { en: 'S.N.', ne: 'क्र.सं.' },
  'table.voterId': { en: 'Voter ID', ne: 'मतदाता आईडी' },
  'table.name': { en: 'Name', ne: 'नाम' },
  'table.surname': { en: 'Surname/Sub-caste', ne: 'थर/उपजात' },
  'table.age': { en: 'Age', ne: 'उमेर' },
  'table.gender': { en: 'Gender', ne: 'लिङ्ग' },
  'table.caste': { en: 'Caste Category', ne: 'जात श्रेणी' },
  'table.center': { en: 'Center', ne: 'केन्द्र' },
  'table.spouse': { en: 'Spouse', ne: 'पति/पत्नी' },
  'table.parents': { en: 'Parents', ne: 'अभिभावक' },
  'table.tole': { en: 'Tole/Address', ne: 'टोल/ठेगाना' },
  'table.occupation': { en: 'Occupation', ne: 'पेशा' },
  'table.party': { en: 'Party', ne: 'पार्टी' },
  'table.family': { en: 'Family', ne: 'परिवार' },

  // Segments
  'segments.title': { en: 'Data Segments', ne: 'डाटा खण्डहरू' },
  'segments.byAge': { en: 'By Age Range', ne: 'उमेर समूह अनुसार' },
  'segments.byGender': { en: 'By Gender', ne: 'लिङ्ग अनुसार' },
  'segments.byCaste': { en: 'By Caste', ne: 'जात अनुसार' },
  'segments.bySurname': { en: 'By Surname', ne: 'थर अनुसार' },
  'segments.newar': { en: 'Newar', ne: 'नेवार' },
  'segments.nonNewar': { en: 'Non-Newar', ne: 'गैर-नेवार' },
  'segments.male': { en: 'Male', ne: 'पुरुष' },
  'segments.female': { en: 'Female', ne: 'महिला' },
  'segments.other': { en: 'Other', ne: 'अन्य' },
  'segments.totalVoters': { en: 'Total Voters', ne: 'कुल मतदाताहरू' },
  'segments.colorPalette': { en: 'Color Palette', ne: 'रंग प्यालेट' },
  'segments.selectColors': { en: 'Select Colors', ne: 'रंग छान्नुहोस्' },

  // Comparison
  'comparison.title': { en: 'Ward & Municipality Comparison', ne: 'वडा र नगरपालिका तुलना' },
  'comparison.wardToWard': { en: 'Ward to Ward', ne: 'वडा देखि वडा' },
  'comparison.municipalityToMunicipality': { en: 'Municipality to Municipality', ne: 'नगरपालिका देखि नगरपालिका' },
  'comparison.sideBySide': { en: 'Side by Side', ne: 'छेउछाउ' },
  'comparison.overlay': { en: 'Overlay', ne: 'ओभरले' },

  // Infographics
  'infographics.title': { en: 'Infographics', ne: 'इन्फोग्राफिक्स' },
  'infographics.selectStyle': { en: 'Select Chart Style', ne: 'चार्ट शैली छान्नुहोस्' },
  'infographics.bar': { en: 'Bar Chart', ne: 'बार चार्ट' },
  'infographics.donut': { en: 'Donut Chart', ne: 'डोनट चार्ट' },
  'infographics.treemap': { en: 'Treemap', ne: 'ट्रीम्याप' },
  'infographics.sankey': { en: 'Sankey Diagram', ne: 'स्यान्की डायग्राम' },
  'infographics.radar': { en: 'Radar Chart', ne: 'रडार चार्ट' },
  'infographics.area': { en: 'Area Chart', ne: 'एरिया चार्ट' },
  'infographics.funnel': { en: 'Funnel Chart', ne: 'फनेल चार्ट' },
  'infographics.widgets': { en: 'Widgets', ne: 'विजेटहरू' },
  'infographics.addWidget': { en: 'Add Widget', ne: 'विजेट थप्नुहोस्' },
  'infographics.customLayout': { en: 'Custom Layout', ne: 'अनुकूलन लेआउट' },
  'infographics.statCards': { en: 'Stat Cards', ne: 'तथ्याङ्क कार्डहरू' },
  'infographics.counters': { en: 'Animated Counters', ne: 'एनिमेटेड काउन्टरहरू' },
  'infographics.gauges': { en: 'Gauge Charts', ne: 'गेज चार्टहरू' },

  // Edit
  'edit.title': { en: 'Edit Voter Data', ne: 'मतदाता डाटा सम्पादन' },
  'edit.selectWard': { en: 'Select Ward to Edit', ne: 'सम्पादन गर्न वडा छान्नुहोस्' },
  'edit.voterRecord': { en: 'Voter Record', ne: 'मतदाता रेकर्ड' },
  'edit.originalData': { en: 'Original Data', ne: 'मूल डाटा' },
  'edit.tole': { en: 'Tole/Local Address', ne: 'टोल/स्थानीय ठेगाना' },
  'edit.totalFamilies': { en: 'Total Families', ne: 'कुल परिवार' },
  'edit.mainMember': { en: 'Main Family Member', ne: 'मुख्य परिवार सदस्य' },
  'edit.familyMembers': { en: 'Family Members', ne: 'परिवारका सदस्यहरू' },
  'edit.addFamilyMember': { en: 'Add Family Member', ne: 'परिवार सदस्य थप्नुहोस्' },
  'edit.occupation': { en: 'Occupation', ne: 'पेशा' },
  'edit.partyAffiliation': { en: 'Party Affiliation', ne: 'पार्टी सम्बन्धन' },
  'edit.notes': { en: 'Notes', ne: 'टिप्पणीहरू' },
  'edit.addNote': { en: 'Add Note', ne: 'टिप्पणी थप्नुहोस्' },

  // Export
  'export.title': { en: 'Export Reports', ne: 'रिपोर्टहरू निर्यात गर्नुहोस्' },
  'export.asPDF': { en: 'Export as PDF', ne: 'PDF मा निर्यात' },
  'export.asCSV': { en: 'Export as CSV', ne: 'CSV मा निर्यात' },
  'export.asExcel': { en: 'Export as Excel', ne: 'Excel मा निर्यात' },

  // Theme
  'theme.light': { en: 'Light', ne: 'उज्यालो' },
  'theme.dark': { en: 'Dark', ne: 'अँध्यारो' },
  'theme.system': { en: 'System', ne: 'सिस्टम' },

  // Language
  'language.english': { en: 'English', ne: 'अंग्रेजी' },
  'language.nepali': { en: 'नेपाली', ne: 'नेपाली' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getBilingual: (key: string) => { en: string; ne: string };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  }, [language]);

  const getBilingual = useCallback((key: string): { en: string; ne: string } => {
    const translation = translations[key];
    if (!translation) {
      return { en: key, ne: key };
    }
    return translation;
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getBilingual }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
