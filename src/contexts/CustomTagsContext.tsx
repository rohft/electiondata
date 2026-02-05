 import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
 
 interface CasteHierarchyNode {
   subfolders: string[];
   surnames: string[];
 }
 
 interface CustomTagsData {
   castes: string[];
   surnames: string[];
   deletedDefaultCastes: string[];
   casteHierarchy: Record<string, CasteHierarchyNode>;
   newarCategories: string[];
   nonNewarCategories: string[];
   toles: string[];
 }
 
 interface CustomTagsContextType {
   tags: CustomTagsData;
   addCaste: (caste: string) => void;
   removeCaste: (caste: string) => void;
   renameCaste: (oldName: string, newName: string) => void;
   addSubfolder: (parentCaste: string, subfolderName: string) => void;
   removeSubfolder: (parentCaste: string, subfolderName: string) => void;
   importCasteData: (data: Partial<Pick<CustomTagsData, 'castes' | 'deletedDefaultCastes' | 'casteHierarchy'>>) => void;
   exportCasteData: () => Pick<CustomTagsData, 'castes' | 'deletedDefaultCastes' | 'casteHierarchy'>;
   isDefaultCasteDeleted: (caste: string) => boolean;
   getVisibleCastes: () => string[];
   addSurname: (surname: string) => void;
   removeSurname: (surname: string) => void;
   addNewarCategory: (category: string) => void;
   removeNewarCategory: (category: string) => void;
   addNonNewarCategory: (category: string) => void;
   removeNonNewarCategory: (category: string) => void;
   addTole: (tole: string) => void;
   removeTole: (tole: string) => void;
   getCasteSuggestions: (query: string) => string[];
   getSurnameSuggestions: (query: string) => string[];
   getToleSuggestions: (query: string) => string[];
 }
 
 const STORAGE_KEY = 'voter_custom_tags';
 
 const DEFAULT_CASTES = ['Brahmin', 'Chhetri', 'Newar', 'Magar', 'Gurung', 'Tamang', 'Rai', 'Limbu', 'Thakuri', 'Kami', 'Damai', 'Sarki', 'Dalit', 'Sherpa', 'Tharu', 'Madhesi', 'Muslim'];
 
 const defaultTags: CustomTagsData = {
   castes: [...DEFAULT_CASTES],
   surnames: [],
   deletedDefaultCastes: [],
   casteHierarchy: {},
   newarCategories: ['Shrestha', 'Shakya', 'Maharjan', 'Dangol', 'Joshi', 'Pradhan', 'Manandhar', 'Bajracharya', 'Tuladhar', 'Amatya'],
   nonNewarCategories: ['Sharma', 'Adhikari', 'Poudel', 'Gurung', 'Tamang', 'Rai', 'Limbu', 'Magar'],
   toles: []
 };
 
 const CustomTagsContext = createContext<CustomTagsContextType | undefined>(undefined);
 
 export const CustomTagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [tags, setTags] = useState<CustomTagsData>(defaultTags);
 
   // Load from localStorage on mount
   useEffect(() => {
     try {
       const saved = localStorage.getItem(STORAGE_KEY);
       if (saved) {
         const parsed = JSON.parse(saved);
         setTags({ ...defaultTags, ...parsed });
       }
     } catch (error) {
       console.error('Error loading custom tags:', error);
     }
   }, []);
 
   // Save to localStorage when tags change
   useEffect(() => {
     try {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
     } catch (error) {
       console.error('Error saving custom tags:', error);
     }
   }, [tags]);
 
   const addCaste = useCallback((caste: string) => {
     const trimmed = caste.trim();
     if (!trimmed) return;
     setTags(prev => {
       // If it's a previously deleted default, restore it
       if (DEFAULT_CASTES.includes(trimmed) && prev.deletedDefaultCastes.includes(trimmed)) {
         return { ...prev, deletedDefaultCastes: prev.deletedDefaultCastes.filter(c => c !== trimmed) };
       }
       if (prev.castes.includes(trimmed)) return prev;
       return { ...prev, castes: [...prev.castes, trimmed].sort() };
     });
   }, []);
 
   const removeCaste = useCallback((caste: string) => {
     if (DEFAULT_CASTES.includes(caste)) {
       // Mark as deleted instead of removing
       setTags(prev => ({
         ...prev,
         deletedDefaultCastes: prev.deletedDefaultCastes.includes(caste) ? prev.deletedDefaultCastes : [...prev.deletedDefaultCastes, caste]
       }));
     } else {
       setTags(prev => ({ ...prev, castes: prev.castes.filter(c => c !== caste) }));
     }
   }, []);
 
   const renameCaste = useCallback((oldName: string, newName: string) => {
     const trimmedNew = newName.trim();
     if (!trimmedNew || oldName === trimmedNew) return;
     setTags(prev => ({
       ...prev,
       castes: prev.castes.map(c => c === oldName ? trimmedNew : c),
       casteHierarchy: Object.fromEntries(
         Object.entries(prev.casteHierarchy).map(([key, val]) => [key === oldName ? trimmedNew : key, val])
       )
     }));
   }, []);
 
   const addSubfolder = useCallback((parentCaste: string, subfolderName: string) => {
     const trimmed = subfolderName.trim();
     if (!trimmed) return;
     setTags(prev => {
       const existing = prev.casteHierarchy[parentCaste] || { subfolders: [], surnames: [] };
       if (existing.subfolders.includes(trimmed)) return prev;
       return {
         ...prev,
         casteHierarchy: {
           ...prev.casteHierarchy,
           [parentCaste]: { ...existing, subfolders: [...existing.subfolders, trimmed] }
         }
       };
     });
   }, []);
 
   const removeSubfolder = useCallback((parentCaste: string, subfolderName: string) => {
     setTags(prev => {
       const existing = prev.casteHierarchy[parentCaste];
       if (!existing) return prev;
       return {
         ...prev,
         casteHierarchy: {
           ...prev.casteHierarchy,
           [parentCaste]: { ...existing, subfolders: existing.subfolders.filter(s => s !== subfolderName) }
         }
       };
     });
   }, []);
 
   const isDefaultCasteDeleted = useCallback((caste: string): boolean => {
     return tags.deletedDefaultCastes.includes(caste);
   }, [tags.deletedDefaultCastes]);
 
   const getVisibleCastes = useCallback((): string[] => {
     const visibleDefaults = DEFAULT_CASTES.filter(c => !tags.deletedDefaultCastes.includes(c));
     const customCastes = tags.castes.filter(c => !DEFAULT_CASTES.includes(c));
     return [...new Set([...visibleDefaults, ...customCastes])].sort();
   }, [tags.castes, tags.deletedDefaultCastes]);
 
   const importCasteData = useCallback((data: Partial<Pick<CustomTagsData, 'castes' | 'deletedDefaultCastes' | 'casteHierarchy'>>) => {
     setTags(prev => ({
       ...prev,
       castes: data.castes ? [...new Set([...prev.castes, ...data.castes])] : prev.castes,
       deletedDefaultCastes: data.deletedDefaultCastes ? [...new Set([...prev.deletedDefaultCastes, ...data.deletedDefaultCastes])] : prev.deletedDefaultCastes,
       casteHierarchy: data.casteHierarchy ? { ...prev.casteHierarchy, ...data.casteHierarchy } : prev.casteHierarchy
     }));
   }, []);
 
   const exportCasteData = useCallback(() => {
     return {
       castes: tags.castes,
       deletedDefaultCastes: tags.deletedDefaultCastes,
       casteHierarchy: tags.casteHierarchy
     };
   }, [tags.castes, tags.deletedDefaultCastes, tags.casteHierarchy]);
 
   const addSurname = useCallback((surname: string) => {
     const trimmed = surname.trim();
     if (trimmed && !tags.surnames.includes(trimmed)) {
       setTags(prev => ({ ...prev, surnames: [...prev.surnames, trimmed].sort() }));
     }
   }, [tags.surnames]);
 
   const removeSurname = useCallback((surname: string) => {
     setTags(prev => ({ ...prev, surnames: prev.surnames.filter(s => s !== surname) }));
   }, []);
 
   const addNewarCategory = useCallback((category: string) => {
     const trimmed = category.trim();
     if (trimmed && !tags.newarCategories.includes(trimmed)) {
       setTags(prev => ({ ...prev, newarCategories: [...prev.newarCategories, trimmed].sort() }));
     }
   }, [tags.newarCategories]);
 
   const removeNewarCategory = useCallback((category: string) => {
     setTags(prev => ({ ...prev, newarCategories: prev.newarCategories.filter(c => c !== category) }));
   }, []);
 
   const addNonNewarCategory = useCallback((category: string) => {
     const trimmed = category.trim();
     if (trimmed && !tags.nonNewarCategories.includes(trimmed)) {
       setTags(prev => ({ ...prev, nonNewarCategories: [...prev.nonNewarCategories, trimmed].sort() }));
     }
   }, [tags.nonNewarCategories]);
 
   const removeNonNewarCategory = useCallback((category: string) => {
     setTags(prev => ({ ...prev, nonNewarCategories: prev.nonNewarCategories.filter(c => c !== category) }));
   }, []);
 
   const addTole = useCallback((tole: string) => {
     const trimmed = tole.trim();
     if (trimmed && !tags.toles.includes(trimmed)) {
       setTags(prev => ({ ...prev, toles: [...prev.toles, trimmed].sort() }));
     }
   }, [tags.toles]);
 
   const removeTole = useCallback((tole: string) => {
     setTags(prev => ({ ...prev, toles: prev.toles.filter(t => t !== tole) }));
   }, []);
 
   const getCasteSuggestions = useCallback((query: string): string[] => {
     const visible = getVisibleCastes();
     if (!query) return visible;
     const lowerQuery = query.toLowerCase();
     return visible.filter(c => c.toLowerCase().includes(lowerQuery));
   }, [getVisibleCastes]);
 
   const getSurnameSuggestions = useCallback((query: string): string[] => {
     if (!query) return tags.surnames;
     const lowerQuery = query.toLowerCase();
     return tags.surnames.filter(s => s.toLowerCase().includes(lowerQuery));
   }, [tags.surnames]);
 
   const getToleSuggestions = useCallback((query: string): string[] => {
     if (!query) return tags.toles;
     const lowerQuery = query.toLowerCase();
     return tags.toles.filter(t => t.toLowerCase().includes(lowerQuery));
   }, [tags.toles]);
 
   return (
     <CustomTagsContext.Provider value={{
       tags,
       addCaste,
       removeCaste,
       renameCaste,
       addSubfolder,
       removeSubfolder,
       importCasteData,
       exportCasteData,
       isDefaultCasteDeleted,
       getVisibleCastes,
       addSurname,
       removeSurname,
       addNewarCategory,
       removeNewarCategory,
       addNonNewarCategory,
       removeNonNewarCategory,
       addTole,
       removeTole,
       getCasteSuggestions,
       getSurnameSuggestions,
       getToleSuggestions
     }}>
       {children}
     </CustomTagsContext.Provider>
   );
 };
 
 export const useCustomTags = () => {
   const context = useContext(CustomTagsContext);
   if (!context) {
     throw new Error('useCustomTags must be used within a CustomTagsProvider');
   }
   return context;
 };