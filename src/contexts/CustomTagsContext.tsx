import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface CustomTagsData {
  castes: string[];
  surnames: string[];
  newarCategories: string[];
  nonNewarCategories: string[];
  toles: string[];
}

interface CustomTagsContextType {
  tags: CustomTagsData;
  addCaste: (caste: string) => void;
  removeCaste: (caste: string) => void;
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

const defaultTags: CustomTagsData = {
  castes: ['Brahmin', 'Chhetri', 'Newar', 'Magar', 'Gurung', 'Tamang', 'Rai', 'Limbu', 'Thakuri', 'Kami', 'Damai', 'Sarki', 'Dalit', 'Sherpa', 'Tharu', 'Madhesi', 'Muslim'],
  surnames: [],
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
    if (trimmed && !tags.castes.includes(trimmed)) {
      setTags(prev => ({ ...prev, castes: [...prev.castes, trimmed].sort() }));
    }
  }, [tags.castes]);

  const removeCaste = useCallback((caste: string) => {
    setTags(prev => ({ ...prev, castes: prev.castes.filter(c => c !== caste) }));
  }, []);

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
    if (!query) return tags.castes;
    const lowerQuery = query.toLowerCase();
    return tags.castes.filter(c => c.toLowerCase().includes(lowerQuery));
  }, [tags.castes]);

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
