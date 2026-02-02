import React, { createContext, useContext, useState, useCallback } from 'react';

export type VoterStatus = 'available' | 'dead' | 'out_of_country' | 'married' | 'older_citizen' | 'disabled';

export interface VoterRecord {
  id: string;
  municipality: string;
  ward: string;
  fullName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  caste: string;
  surname: string;
  familyName?: string;
  lastName?: string;
  isNewar: boolean;
  phone?: string;
  email?: string;
  socialHandles?: string;
  partyName?: string;
  partyLogo?: string;
  voterStatus?: VoterStatus;
  originalData: Record<string, string>;
  isEdited?: boolean;
  editHistory?: Array<{ field: string; oldValue: string; newValue: string; timestamp: Date }>;
}

export interface WardData {
  id: string;
  name: string;
  municipality: string;
  voters: VoterRecord[];
  uploadedAt: Date;
  fileName: string;
}

export interface MunicipalityData {
  id: string;
  name: string;
  wards: WardData[];
}

interface VoterDataContextType {
  municipalities: MunicipalityData[];
  addWardData: (municipalityName: string, wardData: WardData) => void;
  removeWardData: (municipalityId: string, wardId: string) => void;
  updateVoterRecord: (municipalityId: string, wardId: string, voterId: string, updates: Partial<VoterRecord>) => void;
  revertVoterRecord: (municipalityId: string, wardId: string, voterId: string) => void;
  getTotalVoters: () => number;
  getTotalWards: () => number;
  getSegmentCounts: (municipalityId?: string, wardId?: string) => SegmentCounts;
}

export interface SegmentCounts {
  byAge: Record<string, number>;
  byGender: Record<string, number>;
  byCaste: Record<string, number>;
  bySurname: Record<string, number>;
  newarVsNonNewar: { newar: number; nonNewar: number };
  total: number;
}

const VoterDataContext = createContext<VoterDataContextType | undefined>(undefined);

export const VoterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([]);

  const addWardData = useCallback((municipalityName: string, wardData: WardData) => {
    setMunicipalities(prev => {
      const existingMunicipality = prev.find(m => m.name === municipalityName);
      
      if (existingMunicipality) {
        return prev.map(m => 
          m.name === municipalityName 
            ? { ...m, wards: [...m.wards, wardData] }
            : m
        );
      } else {
        return [...prev, {
          id: crypto.randomUUID(),
          name: municipalityName,
          wards: [wardData]
        }];
      }
    });
  }, []);

  const removeWardData = useCallback((municipalityId: string, wardId: string) => {
    setMunicipalities(prev => {
      return prev.map(m => {
        if (m.id === municipalityId) {
          const updatedWards = m.wards.filter(w => w.id !== wardId);
          return { ...m, wards: updatedWards };
        }
        return m;
      }).filter(m => m.wards.length > 0);
    });
  }, []);

  const updateVoterRecord = useCallback((
    municipalityId: string, 
    wardId: string, 
    voterId: string, 
    updates: Partial<VoterRecord>
  ) => {
    setMunicipalities(prev => {
      return prev.map(m => {
        if (m.id === municipalityId) {
          return {
            ...m,
            wards: m.wards.map(w => {
              if (w.id === wardId) {
                return {
                  ...w,
                  voters: w.voters.map(v => {
                    if (v.id === voterId) {
                      const editHistory = v.editHistory || [];
                      Object.entries(updates).forEach(([key, value]) => {
                        if (key !== 'isEdited' && key !== 'editHistory') {
                          editHistory.push({
                            field: key,
                            oldValue: String(v[key as keyof VoterRecord]),
                            newValue: String(value),
                            timestamp: new Date()
                          });
                        }
                      });
                      return { ...v, ...updates, isEdited: true, editHistory };
                    }
                    return v;
                  })
                };
              }
              return w;
            })
          };
        }
        return m;
      });
    });
  }, []);

  const revertVoterRecord = useCallback((municipalityId: string, wardId: string, voterId: string) => {
    setMunicipalities(prev => {
      return prev.map(m => {
        if (m.id === municipalityId) {
          return {
            ...m,
            wards: m.wards.map(w => {
              if (w.id === wardId) {
                return {
                  ...w,
                  voters: w.voters.map(v => {
                    if (v.id === voterId && v.editHistory && v.editHistory.length > 0) {
                      const lastEdit = v.editHistory[v.editHistory.length - 1];
                      const newEditHistory = v.editHistory.slice(0, -1);
                      return {
                        ...v,
                        [lastEdit.field]: lastEdit.oldValue,
                        editHistory: newEditHistory,
                        isEdited: newEditHistory.length > 0
                      };
                    }
                    return v;
                  })
                };
              }
              return w;
            })
          };
        }
        return m;
      });
    });
  }, []);

  const getTotalVoters = useCallback(() => {
    return municipalities.reduce((total, m) => 
      total + m.wards.reduce((wTotal, w) => wTotal + w.voters.length, 0), 0
    );
  }, [municipalities]);

  const getTotalWards = useCallback(() => {
    return municipalities.reduce((total, m) => total + m.wards.length, 0);
  }, [municipalities]);

  const getSegmentCounts = useCallback((municipalityId?: string, wardId?: string): SegmentCounts => {
    let voters: VoterRecord[] = [];

    if (municipalityId && wardId) {
      const municipality = municipalities.find(m => m.id === municipalityId);
      const ward = municipality?.wards.find(w => w.id === wardId);
      voters = ward?.voters || [];
    } else if (municipalityId) {
      const municipality = municipalities.find(m => m.id === municipalityId);
      voters = municipality?.wards.flatMap(w => w.voters) || [];
    } else {
      voters = municipalities.flatMap(m => m.wards.flatMap(w => w.voters));
    }

    const byAge: Record<string, number> = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0
    };

    const byGender: Record<string, number> = {
      male: 0,
      female: 0,
      other: 0
    };

    const byCaste: Record<string, number> = {};
    const bySurname: Record<string, number> = {};
    let newar = 0;
    let nonNewar = 0;

    voters.forEach(voter => {
      // Age
      if (voter.age >= 18 && voter.age <= 25) byAge['18-25']++;
      else if (voter.age <= 35) byAge['26-35']++;
      else if (voter.age <= 45) byAge['36-45']++;
      else if (voter.age <= 55) byAge['46-55']++;
      else if (voter.age <= 65) byAge['56-65']++;
      else byAge['65+']++;

      // Gender
      byGender[voter.gender]++;

      // Caste
      byCaste[voter.caste] = (byCaste[voter.caste] || 0) + 1;

      // Surname
      bySurname[voter.surname] = (bySurname[voter.surname] || 0) + 1;

      // Newar
      if (voter.isNewar) newar++;
      else nonNewar++;
    });

    return {
      byAge,
      byGender,
      byCaste,
      bySurname,
      newarVsNonNewar: { newar, nonNewar },
      total: voters.length
    };
  }, [municipalities]);

  return (
    <VoterDataContext.Provider value={{
      municipalities,
      addWardData,
      removeWardData,
      updateVoterRecord,
      revertVoterRecord,
      getTotalVoters,
      getTotalWards,
      getSegmentCounts
    }}>
      {children}
    </VoterDataContext.Provider>
  );
};

export const useVoterData = () => {
  const context = useContext(VoterDataContext);
  if (!context) {
    throw new Error('useVoterData must be used within a VoterDataProvider');
  }
  return context;
};
