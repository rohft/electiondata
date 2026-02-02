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
  'nav.segments': { en: 'Segments', ne: 'खण्डहरू' },
  'nav.comparison': { en: 'Comparison', ne: 'तुलना' },
  'nav.infographics': { en: 'Infographics', ne: 'इन्फोग्राफिक्स' },
  'nav.edit': { en: 'Edit Data', ne: 'डाटा सम्पादन' },
  'nav.export': { en: 'Export', ne: 'निर्यात' },
  'nav.settings': { en: 'Settings', ne: 'सेटिङहरू' },

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
  'common.next': { en: 'Next', ne: 'अर्को' },
  'common.back': { en: 'Back', ne: 'पछाडि' },
  'segments.totalVoters': { en: 'Total Voters', ne: 'कुल मतदाताहरू' },

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

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
