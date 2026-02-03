import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface ToleDataContextType {
  toles: string[];
  addTole: (tole: string) => void;
  removeTole: (tole: string) => void;
  getToleSuggestions: (query: string) => string[];
}

const TOLE_STORAGE_KEY = 'voter_tole_suggestions';

const ToleDataContext = createContext<ToleDataContextType | undefined>(undefined);

export const ToleDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toles, setToles] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TOLE_STORAGE_KEY);
      if (saved) {
        setToles(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading tole data:', error);
    }
  }, []);

  // Save to localStorage when toles change
  useEffect(() => {
    try {
      localStorage.setItem(TOLE_STORAGE_KEY, JSON.stringify(toles));
    } catch (error) {
      console.error('Error saving tole data:', error);
    }
  }, [toles]);

  const addTole = useCallback((tole: string) => {
    const trimmedTole = tole.trim();
    if (trimmedTole && !toles.includes(trimmedTole)) {
      setToles(prev => [...prev, trimmedTole].sort());
    }
  }, [toles]);

  const removeTole = useCallback((tole: string) => {
    setToles(prev => prev.filter(t => t !== tole));
  }, []);

  const getToleSuggestions = useCallback((query: string): string[] => {
    if (!query) return toles;
    const lowerQuery = query.toLowerCase();
    return toles.filter(t => t.toLowerCase().includes(lowerQuery));
  }, [toles]);

  return (
    <ToleDataContext.Provider value={{
      toles,
      addTole,
      removeTole,
      getToleSuggestions
    }}>
      {children}
    </ToleDataContext.Provider>
  );
};

export const useToleData = () => {
  const context = useContext(ToleDataContext);
  if (!context) {
    throw new Error('useToleData must be used within a ToleDataProvider');
  }
  return context;
};
