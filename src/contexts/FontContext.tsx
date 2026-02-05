 import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
 
 export interface CustomFont {
   id: string;
   name: string;
   fileName: string;
   url: string;
 }
 
 interface FontContextType {
   // Available fonts
   nepaliFont: string;
   englishFont: string;
   // Font options
   nepaliFontOptions: string[];
   englishFontOptions: string[];
   // Custom fonts
   customFonts: CustomFont[];
   // Setters
   setNepaliFont: (font: string) => void;
   setEnglishFont: (font: string) => void;
   addCustomFont: (font: CustomFont) => void;
   removeCustomFont: (id: string) => void;
 }
 
 const DEFAULT_NEPALI_FONTS = ['Kalimati', 'Kohinoor Devanagari', 'Noto Sans Devanagari'];
 const DEFAULT_ENGLISH_FONTS = ['Inter', 'system-ui', 'Arial', 'Helvetica'];
 
 const FontContext = createContext<FontContextType | undefined>(undefined);
 
 const STORAGE_KEY = 'voterpulse-fonts';
 
 interface StoredFontData {
   nepaliFont: string;
   englishFont: string;
   customFonts: CustomFont[];
 }
 
 export const FontProvider = ({ children }: { children: ReactNode }) => {
   const [nepaliFont, setNepaliFont] = useState('Kalimati');
   const [englishFont, setEnglishFont] = useState('Inter');
   const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
 
   // Load from localStorage on mount
   useEffect(() => {
     const stored = localStorage.getItem(STORAGE_KEY);
     if (stored) {
       try {
         const data: StoredFontData = JSON.parse(stored);
         if (data.nepaliFont) setNepaliFont(data.nepaliFont);
         if (data.englishFont) setEnglishFont(data.englishFont);
         if (data.customFonts) setCustomFonts(data.customFonts);
       } catch (e) {
         console.error('Failed to parse stored fonts:', e);
       }
     }
   }, []);
 
   // Save to localStorage whenever fonts change
   useEffect(() => {
     const data: StoredFontData = { nepaliFont, englishFont, customFonts };
     localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
   }, [nepaliFont, englishFont, customFonts]);
 
   // Load custom fonts into document
   useEffect(() => {
     customFonts.forEach(font => {
       const existingStyle = document.getElementById(`custom-font-${font.id}`);
       if (!existingStyle) {
         const style = document.createElement('style');
         style.id = `custom-font-${font.id}`;
         style.textContent = `
           @font-face {
             font-family: '${font.name}';
             src: url('${font.url}') format('${font.fileName.endsWith('.woff') ? 'woff' : font.fileName.endsWith('.woff2') ? 'woff2' : font.fileName.endsWith('.ttf') ? 'truetype' : 'opentype'}');
             font-weight: 400;
             font-style: normal;
             font-display: swap;
           }
         `;
         document.head.appendChild(style);
       }
     });
   }, [customFonts]);
 
   // Update CSS variables when fonts change
   useEffect(() => {
     document.documentElement.style.setProperty('--font-nepali', `'${nepaliFont}', 'Kohinoor Devanagari', 'Noto Sans Devanagari', system-ui, sans-serif`);
     document.documentElement.style.setProperty('--font-english', `'${englishFont}', system-ui, sans-serif`);
   }, [nepaliFont, englishFont]);
 
   const addCustomFont = (font: CustomFont) => {
     setCustomFonts(prev => [...prev, font]);
   };
 
   const removeCustomFont = (id: string) => {
     // Remove the style element
     const styleEl = document.getElementById(`custom-font-${id}`);
     if (styleEl) styleEl.remove();
     
     // Remove from state
     setCustomFonts(prev => prev.filter(f => f.id !== id));
     
     // Reset to default if current font was removed
     const font = customFonts.find(f => f.id === id);
     if (font) {
       if (nepaliFont === font.name) setNepaliFont('Kalimati');
       if (englishFont === font.name) setEnglishFont('Inter');
     }
   };
 
   const nepaliFontOptions = [...DEFAULT_NEPALI_FONTS, ...customFonts.map(f => f.name)];
   const englishFontOptions = [...DEFAULT_ENGLISH_FONTS, ...customFonts.map(f => f.name)];
 
   return (
     <FontContext.Provider value={{
       nepaliFont,
       englishFont,
       nepaliFontOptions,
       englishFontOptions,
       customFonts,
       setNepaliFont,
       setEnglishFont,
       addCustomFont,
       removeCustomFont,
     }}>
       {children}
     </FontContext.Provider>
   );
 };
 
 export const useFont = () => {
   const context = useContext(FontContext);
   if (!context) {
     throw new Error('useFont must be used within a FontProvider');
   }
   return context;
 };