import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { logError } from '@/lib/errorLogger';
const _w = window as any;

export type VoterStatus = 'available' | 'dead' | 'out_of_country' | 'married' | 'older_citizen' | 'disabled';

export interface VoterRecord {
  id: string;
  municipality: string;
  ward: string;
  fullName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  surname: string;
  familyName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  socialHandles?: string;
  partyName?: string;
  partyLogo?: string;
  voterStatus?: VoterStatus;
  tole?: string;
  occupation?: string;
  partyAffiliations?: string[];
  notes?: string[];
  customNote?: string;
  familyMemberIds?: string[];
  isMainFamilyMember?: boolean;
  originalData: Record<string, string>;
  isEdited?: boolean;
  editHistory?: Array<{field: string;oldValue: string;newValue: string;timestamp: Date;}>;
}

export interface BoothCentre {
  id: string;
  name: string;
  createdAt: Date;
  voters: VoterRecord[];
  fileName?: string;
  uploadedAt?: Date;
}

export interface WardData {
  id: string;
  name: string;
  municipality: string;
  voters: VoterRecord[];
  uploadedAt: Date;
  fileName: string;
  boothCentres?: BoothCentre[];
}

export interface MunicipalityData {
  id: string;
  name: string;
  wards: WardData[];
}

interface VoterDataContextType {
  municipalities: MunicipalityData[];
  addWardData: (municipalityName: string, wardData: WardData) => Promise<void>;
  removeWardData: (municipalityId: string, wardId: string) => Promise<void>;
  updateVoterRecord: (municipalityId: string, wardId: string, voterId: string, updates: Partial<VoterRecord>) => void;
  revertVoterRecord: (municipalityId: string, wardId: string, voterId: string) => void;
  addBoothCentre: (municipalityId: string, wardId: string, name: string) => Promise<void>;
  updateBoothCentre: (municipalityId: string, wardId: string, boothId: string, name: string) => Promise<void>;
  removeBoothCentre: (municipalityId: string, wardId: string, boothId: string) => Promise<void>;
  addBoothVoters: (municipalityId: string, wardId: string, boothId: string, voters: VoterRecord[], fileName: string) => Promise<void>;
  getWardVoters: (ward: WardData) => VoterRecord[];
  getTotalVoters: () => number;
  getTotalWards: () => number;
  getSegmentCounts: (municipalityId?: string, wardId?: string) => SegmentCounts;
  saveData: () => void;
  clearAllData: () => void;
  isDataLoaded: boolean;
}

export interface SegmentCounts {
  byAge: Record<string, number>;
  byGender: Record<string, number>;
  bySurname: Record<string, number>;
  total: number;
}

const STORAGE_KEY = 'voter_data_municipalities';
const WARDS_TABLE_ID = 74769;
const BOOTHS_TABLE_ID = 74770;
const VOTERS_TABLE_ID = 74771;

const VoterDataContext = createContext<VoterDataContextType | undefined>(undefined);

// Helper to serialize data for sessionStorage (handle Date objects)
const serializeData = (municipalities: MunicipalityData[]): string => {
  return JSON.stringify(municipalities, (key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  });
};

// Helper to deserialize data from sessionStorage (restore Date objects)
const deserializeData = (data: string): MunicipalityData[] => {
  return JSON.parse(data, (key, value) => {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  });
};

// Extract ward number from ward name (e.g., "Ward 1" -> 1)
const extractWardNumber = (wardName: string): number => {
  const match = wardName.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
};

// Helper to fetch all pages from the database API
const fetchAllPages = async (
  tableId: number,
  orderByField: string,
  filters: Array<{ name: string; op: string; value: any }> = [],
  pageSize = 500
): Promise<any[]> => {
  const allItems: any[] = [];
  let pageNo = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await _w.ezsite.apis.tablePage(tableId, {
      PageNo: pageNo,
      PageSize: pageSize,
      OrderByField: orderByField,
      IsAsc: true,
      Filters: filters
    });

    if (error) {
      logError(`FetchPage_${tableId}_${pageNo}`, error);
      break;
    }

    const items = data?.List || [];
    allItems.push(...items);

    // If we got fewer items than requested, we've reached the end
    if (items.length < pageSize) {
      hasMore = false;
    } else {
      pageNo++;
    }
  }

  return allItems;
};

export const VoterDataProvider: React.FC<{children: React.ReactNode;}> = ({ children }) => {
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load data from database on mount
  useEffect(() => {
    const loadFromDatabase = async () => {
      try {
        // Load wards using paginated fetcher
        const wardsList = await fetchAllPages(WARDS_TABLE_ID, 'ward_number');

        if (wardsList.length === 0) {
          // No data in database, try sessionStorage
          const savedData = sessionStorage.getItem(STORAGE_KEY);
          if (savedData) {
            const parsedData = deserializeData(savedData);
            setMunicipalities(parsedData);
          }
          setIsDataLoaded(true);
          return;
        }

        // Load booths using paginated fetcher
        const boothsList = await fetchAllPages(BOOTHS_TABLE_ID, 'id');

        // Load ALL voters using paginated fetcher (handles large datasets)
        const votersList = await fetchAllPages(VOTERS_TABLE_ID, 'id');

        // Reconstruct municipalities structure from database
        const municipalitiesMap = new Map<string, MunicipalityData>();

        for (const wardRow of wardsList) {
          const municipalityName = wardRow.municipality_name;
          const wardNumber = wardRow.ward_number;
          const wardName = `Ward ${wardNumber}`;
          const wardId = `ward-${wardRow.id}`;

          // Get municipality or create new one
          if (!municipalitiesMap.has(municipalityName)) {
            municipalitiesMap.set(municipalityName, {
              id: `municipality-${municipalityName}`,
              name: municipalityName,
              wards: []
            });
          }

          const municipality = municipalitiesMap.get(municipalityName)!;

          // Get voters for this ward
          const wardVoters: VoterRecord[] = [];
          for (const voterRow of votersList) {
            if (voterRow.ward_id === wardRow.id) {
              try {
                const voterData = JSON.parse(voterRow.voter_data);
                wardVoters.push(voterData);
              } catch (e) {
                logError('ParseVoterData', e);
              }
            }
          }

          // Get booths for this ward
          const wardBooths: BoothCentre[] = [];
          for (const boothRow of boothsList) {
            if (boothRow.ward_id === wardRow.id) {
              // Get voters for this booth
              const boothVoters: VoterRecord[] = [];
              for (const voterRow of votersList) {
                if (voterRow.ward_id === wardRow.id && voterRow.booth_number === boothRow.booth_number) {
                  try {
                    const voterData = JSON.parse(voterRow.voter_data);
                    boothVoters.push(voterData);
                  } catch (e) {
                    logError('ParseBoothVoterData', e);
                  }
                }
              }

              wardBooths.push({
                id: `booth-${boothRow.id}`,
                name: boothRow.booth_centre,
                createdAt: new Date(),
                voters: boothVoters,
                fileName: '',
                uploadedAt: new Date()
              });
            }
          }

          municipality.wards.push({
            id: wardId,
            name: wardName,
            municipality: municipalityName,
            voters: wardVoters,
            uploadedAt: new Date(wardRow.upload_date),
            fileName: '',
            boothCentres: wardBooths.length > 0 ? wardBooths : undefined
          });
        }

        const loadedMunicipalities = Array.from(municipalitiesMap.values());
        setMunicipalities(loadedMunicipalities);

        // Also save to sessionStorage as backup
        sessionStorage.setItem(STORAGE_KEY, serializeData(loadedMunicipalities));
      } catch (error) {
        logError('LoadDatabase', error);
        // Fall back to sessionStorage
        const savedData = sessionStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = deserializeData(savedData);
          setMunicipalities(parsedData);
        }
      } finally {
        setIsDataLoaded(true);
      }
    };

    loadFromDatabase();
  }, []);

  // Auto-save to sessionStorage when data changes (debounced)
  useEffect(() => {
    if (!isDataLoaded) return;

    const timeoutId = setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, serializeData(municipalities));
      } catch (error) {
        logError('AutoSaveSession', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [municipalities, isDataLoaded]);

  const saveData = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, serializeData(municipalities));
    } catch (error) {
      logError('SaveData', error);
    }
  }, [municipalities]);

  const clearAllData = useCallback(async () => {
    try {
      // Clear from database
      const wardsList = await fetchAllPages(WARDS_TABLE_ID, 'id');

      for (const ward of wardsList) {
        // Delete all voters for this ward
        const votersList = await fetchAllPages(VOTERS_TABLE_ID, 'id', [
          { name: 'ward_id', op: 'Equal', value: ward.id }
        ]);

        for (const voter of votersList) {
          await _w.ezsite.apis.tableDelete(VOTERS_TABLE_ID, { ID: voter.id });
        }

        // Delete all booths for this ward
        const boothsList = await fetchAllPages(BOOTHS_TABLE_ID, 'id', [
          { name: 'ward_id', op: 'Equal', value: ward.id }
        ]);

        for (const booth of boothsList) {
          await _w.ezsite.apis.tableDelete(BOOTHS_TABLE_ID, { ID: booth.id });
        }

        // Delete ward
        await _w.ezsite.apis.tableDelete(WARDS_TABLE_ID, { ID: ward.id });
      }

      toast.success('All data cleared from database');
    } catch (error) {
      logError('ClearDatabase', error);
      toast.error('Failed to clear some data from database');
    }

    // Clear local state and sessionStorage
    setMunicipalities([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const addWardData = useCallback(async (municipalityName: string, wardData: WardData) => {
    // Extract ward number from ward name
    const wardNumber = extractWardNumber(wardData.name);

    try {
      // Save ward to database
      const { error: wardError } = await _w.ezsite.apis.tableCreate(WARDS_TABLE_ID, {
        ward_number: wardNumber,
        municipality_name: municipalityName,
        upload_date: new Date().toISOString()
      });

      if (wardError) {
        toast.error('Failed to save ward to database. Please try again.');
        throw new Error(wardError);
      }

      // Get the created ward's database ID
      const { data: createdWard } = await _w.ezsite.apis.tablePage(WARDS_TABLE_ID, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
        { name: 'municipality_name', op: 'Equal', value: municipalityName },
        { name: 'ward_number', op: 'Equal', value: wardNumber }]

      });

      const dbWardId = createdWard?.List?.[0]?.id;

      if (!dbWardId) {
        logError('GetCreatedWardId');
      } else {
        // Save booth centres to database
        if (wardData.boothCentres && wardData.boothCentres.length > 0) {
          for (const booth of wardData.boothCentres) {
            const boothNumber = booth.id;

            const { error: boothError } = await _w.ezsite.apis.tableCreate(BOOTHS_TABLE_ID, {
              ward_id: dbWardId,
              booth_number: boothNumber,
              booth_centre: booth.name
            });

            if (boothError) {
              logError('SaveBooth', boothError);
              continue;
            }

            // Save voters for this booth
            if (booth.voters && booth.voters.length > 0) {
              for (const voter of booth.voters) {
                const { error: voterError } = await _w.ezsite.apis.tableCreate(VOTERS_TABLE_ID, {
                  ward_id: dbWardId,
                  booth_number: boothNumber,
                  voter_data: JSON.stringify(voter),
                  upload_date: new Date().toISOString()
                });

                if (voterError) {
                  logError('SaveBoothVoter', voterError);
                }
              }
            }
          }
        } else {
          // Save voters directly to ward (no booths)
          if (wardData.voters && wardData.voters.length > 0) {
            for (const voter of wardData.voters) {
              const { error: voterError } = await _w.ezsite.apis.tableCreate(VOTERS_TABLE_ID, {
                ward_id: dbWardId,
                booth_number: '',
                voter_data: JSON.stringify(voter),
                upload_date: new Date().toISOString()
              });

              if (voterError) {
                logError('SaveWardVoter', voterError);
              }
            }
          }
        }
      }

      // Update local state
      setMunicipalities((prev) => {
        const existingMunicipality = prev.find((m) => m.name === municipalityName);

        if (existingMunicipality) {
          return prev.map((m) =>
          m.name === municipalityName ?
          { ...m, wards: [...m.wards, wardData] } :
          m
          );
        } else {
          return [...prev, {
            id: crypto.randomUUID(),
            name: municipalityName,
            wards: [wardData]
          }];
        }
      });

      toast.success(`Ward data saved to database successfully`);
    } catch (error) {
      logError('SaveWardData', error);
      toast.error('Failed to save ward data to database');
    }
  }, []);

  const removeWardData = useCallback(async (municipalityId: string, wardId: string) => {
    const municipality = municipalities.find((m) => m.id === municipalityId);
    const ward = municipality?.wards.find((w) => w.id === wardId);

    if (!ward) return;

    const wardNumber = extractWardNumber(ward.name);
    let deletionSuccessful = false;

    try {
      // Get ward from database
      const { data: wardData, error: wardFetchError } = await _w.ezsite.apis.tablePage(WARDS_TABLE_ID, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [
        { name: 'municipality_name', op: 'Equal', value: municipality.name },
        { name: 'ward_number', op: 'Equal', value: wardNumber }]

      });

      if (wardFetchError) {
        throw new Error(`Failed to fetch ward: ${wardFetchError}`);
      }

      const dbWardId = wardData?.List?.[0]?.id;

      if (dbWardId) {
        // Delete voters for this ward (paginated)
        const votersList = await fetchAllPages(VOTERS_TABLE_ID, 'id', [
          { name: 'ward_id', op: 'Equal', value: dbWardId }
        ]);

        for (const voter of votersList) {
          const { error: deleteError } = await _w.ezsite.apis.tableDelete(VOTERS_TABLE_ID, { ID: voter.id });
          if (deleteError) {
            throw new Error(`Failed to delete voter ${voter.id}: ${deleteError}`);
          }
        }

        // Delete booths for this ward (paginated)
        const boothsList = await fetchAllPages(BOOTHS_TABLE_ID, 'id', [
          { name: 'ward_id', op: 'Equal', value: dbWardId }
        ]);

        for (const booth of boothsList) {
          const { error: deleteError } = await _w.ezsite.apis.tableDelete(BOOTHS_TABLE_ID, { ID: booth.id });
          if (deleteError) {
            throw new Error(`Failed to delete booth ${booth.id}: ${deleteError}`);
          }
        }

        // Delete ward
        const { error: wardDeleteError } = await _w.ezsite.apis.tableDelete(WARDS_TABLE_ID, { ID: dbWardId });
        if (wardDeleteError) {
          throw new Error(`Failed to delete ward: ${wardDeleteError}`);
        }

        deletionSuccessful = true;
      } else {
        // No ward found in database, still update local state
        deletionSuccessful = true;
      }
    } catch (error) {
      logError('DeleteWard', error);
      toast.error('Failed to delete ward. Please try again.');
      // Don't update local state if database deletion failed
      return;
    }

    // Only update local state if database deletion was successful
    if (deletionSuccessful) {
      setMunicipalities((prev) => {
        const updated = prev.map((m) => {
          if (m.id === municipalityId) {
            const updatedWards = m.wards.filter((w) => w.id !== wardId);
            return { ...m, wards: updatedWards };
          }
          return m;
        }).filter((m) => m.wards.length > 0);

        // Immediately save to sessionStorage after successful deletion
        try {
          sessionStorage.setItem(STORAGE_KEY, serializeData(updated));
        } catch (error) {
           logError('SaveSessionAfterDelete', error);
        }

        return updated;
      });
    }
  }, [municipalities]);

  const updateVoterRecord = useCallback((
  municipalityId: string,
  wardId: string,
  voterId: string,
  updates: Partial<VoterRecord>) =>
  {
    const updateVoterInList = (voters: VoterRecord[]) => {
      return voters.map((v) => {
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
      });
    };

    setMunicipalities((prev) => {
      return prev.map((m) => {
        if (m.id === municipalityId) {
          return {
            ...m,
            wards: m.wards.map((w) => {
              if (w.id === wardId) {
                const updatedBooths = w.boothCentres?.map((b) => ({
                  ...b,
                  voters: updateVoterInList(b.voters || [])
                }));
                const allVoters = updatedBooths ?
                updatedBooths.flatMap((b) => b.voters || []) :
                updateVoterInList(w.voters);
                return { ...w, voters: allVoters, boothCentres: updatedBooths || w.boothCentres };
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
    const revertVoterInList = (voters: VoterRecord[]) => {
      return voters.map((v) => {
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
      });
    };

    setMunicipalities((prev) => {
      return prev.map((m) => {
        if (m.id === municipalityId) {
          return {
            ...m,
            wards: m.wards.map((w) => {
              if (w.id === wardId) {
                const updatedBooths = w.boothCentres?.map((b) => ({
                  ...b,
                  voters: revertVoterInList(b.voters || [])
                }));
                const allVoters = updatedBooths ?
                updatedBooths.flatMap((b) => b.voters || []) :
                revertVoterInList(w.voters);
                return { ...w, voters: allVoters, boothCentres: updatedBooths || w.boothCentres };
              }
              return w;
            })
          };
        }
        return m;
      });
    });
  }, []);

  const addBoothCentre = useCallback(async (municipalityId: string, wardId: string, name: string) => {
    const municipality = municipalities.find((m) => m.id === municipalityId);
    const ward = municipality?.wards.find((w) => w.id === wardId);

    if (!ward) return;

    const wardNumber = extractWardNumber(ward.name);

    try {
      // Get ward from database
      const { data: wardData } = await _w.ezsite.apis.tablePage(WARDS_TABLE_ID, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [
        { name: 'municipality_name', op: 'Equal', value: municipality.name },
        { name: 'ward_number', op: 'Equal', value: wardNumber }]

      });

      const dbWardId = wardData?.List?.[0]?.id;

      if (dbWardId) {
        const boothId = crypto.randomUUID();

        const { error: boothError } = await _w.ezsite.apis.tableCreate(BOOTHS_TABLE_ID, {
          ward_id: dbWardId,
          booth_number: boothId,
          booth_centre: name
        });

        if (boothError) {
          toast.error('Failed to save booth. Please try again.');
          throw new Error(boothError);
        }
      }
    } catch (error) {
      logError('SaveBoothCentre', error);
    }

    // Update local state
    setMunicipalities((prev) => {
      return prev.map((m) => {
        if (m.id === municipalityId) {
          return {
            ...m,
            wards: m.wards.map((w) => {
              if (w.id === wardId) {
                const newBooth: BoothCentre = {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  createdAt: new Date(),
                  voters: []
                };
                return { ...w, boothCentres: [...(w.boothCentres || []), newBooth] };
              }
              return w;
            })
          };
        }
        return m;
      });
    });
  }, [municipalities]);

  const updateBoothCentre = useCallback(async (municipalityId: string, wardId: string, boothId: string, name: string) => {
    // Update local state first
    setMunicipalities((prev) => {
      return prev.map((m) => {
        if (m.id === municipalityId) {
          return {
            ...m,
            wards: m.wards.map((w) => {
              if (w.id === wardId && w.boothCentres) {
                return {
                  ...w,
                  boothCentres: w.boothCentres.map((b) =>
                  b.id === boothId ? { ...b, name: name.trim() } : b
                  )
                };
              }
              return w;
            })
          };
        }
        return m;
      });
    });

    // Update database
    try {
      const { data: boothData } = await _w.ezsite.apis.tablePage(BOOTHS_TABLE_ID, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [{ name: 'booth_number', op: 'Equal', value: boothId }]
      });

      const dbBoothId = boothData?.List?.[0]?.id;

      if (dbBoothId) {
        await _w.ezsite.apis.tableUpdate(BOOTHS_TABLE_ID, {
          ID: dbBoothId,
          booth_centre: name
        });
      }
    } catch (error) {
      logError('UpdateBoothDB', error);
    }
  }, []);

  const removeBoothCentre = useCallback(async (municipalityId: string, wardId: string, boothId: string) => {
    let deletionSuccessful = false;

    // Delete from database
    try {
      const { data: boothData, error: boothError } = await _w.ezsite.apis.tablePage(BOOTHS_TABLE_ID, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [{ name: 'booth_number', op: 'Equal', value: boothId }]
      });

      if (boothError) {
        throw new Error(`Failed to fetch booth: ${boothError}`);
      }

      const dbBoothId = boothData?.List?.[0]?.id;
      const dbWardId = boothData?.List?.[0]?.ward_id;

      if (dbBoothId) {
        // Delete voters for this booth (paginated)
        const votersList = await fetchAllPages(VOTERS_TABLE_ID, 'id', [
          { name: 'ward_id', op: 'Equal', value: dbWardId },
          { name: 'booth_number', op: 'Equal', value: boothId }
        ]);

        for (const voter of votersList) {
          const { error: deleteError } = await _w.ezsite.apis.tableDelete(VOTERS_TABLE_ID, { ID: voter.id });
          if (deleteError) {
            throw new Error(`Failed to delete voter ${voter.id}: ${deleteError}`);
          }
        }

        // Delete booth
        const { error: deleteBoothError } = await _w.ezsite.apis.tableDelete(BOOTHS_TABLE_ID, { ID: dbBoothId });
        if (deleteBoothError) {
          throw new Error(`Failed to delete booth: ${deleteBoothError}`);
        }

        deletionSuccessful = true;
      } else {
        // No booth found in database, still update local state
        deletionSuccessful = true;
      }
    } catch (error) {
      logError('DeleteBoothDB', error);
      toast.error('Failed to delete booth. Please try again.');
      return;
    }

    // Update local state only if deletion was successful
    if (deletionSuccessful) {
      setMunicipalities((prev) => {
        const updated = prev.map((m) => {
          if (m.id === municipalityId) {
            return {
              ...m,
              wards: m.wards.map((w) => {
                if (w.id === wardId && w.boothCentres) {
                  const updatedBooths = w.boothCentres.filter((b) => b.id !== boothId);
                  const allVoters = updatedBooths.flatMap((b) => b.voters || []);
                  return { ...w, boothCentres: updatedBooths, voters: allVoters };
                }
                return w;
              })
            };
          }
          return m;
        });

        // Immediately save to sessionStorage after successful deletion
        try {
          sessionStorage.setItem(STORAGE_KEY, serializeData(updated));
        } catch (error) {
          logError('SaveSessionAfterBoothDelete', error);
        }

        return updated;
      });
    }
  }, []);

  // Sync ward.voters from booth centres
  const syncWardVoters = (ward: WardData): VoterRecord[] => {
    if (ward.boothCentres && ward.boothCentres.length > 0) {
      return ward.boothCentres.flatMap((b) => b.voters || []);
    }
    return ward.voters || [];
  };

  const getWardVoters = useCallback((ward: WardData): VoterRecord[] => {
    return syncWardVoters(ward);
  }, []);

  const addBoothVoters = useCallback(async (municipalityId: string, wardId: string, boothId: string, voters: VoterRecord[], fileName: string) => {
    const municipality = municipalities.find((m) => m.id === municipalityId);
    const ward = municipality?.wards.find((w) => w.id === wardId);

    if (!ward) return;

    const wardNumber = extractWardNumber(ward.name);

    try {
      // Get ward from database
      const { data: wardData } = await _w.ezsite.apis.tablePage(WARDS_TABLE_ID, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [
        { name: 'municipality_name', op: 'Equal', value: municipality.name },
        { name: 'ward_number', op: 'Equal', value: wardNumber }]

      });

      const dbWardId = wardData?.List?.[0]?.id;

      if (dbWardId && voters.length > 0) {
        // Save voters to database
        for (const voter of voters) {
          const { error: voterError } = await _w.ezsite.apis.tableCreate(VOTERS_TABLE_ID, {
            ward_id: dbWardId,
            booth_number: boothId,
            voter_data: JSON.stringify(voter),
            upload_date: new Date().toISOString()
          });

          if (voterError) {
            logError('SaveBoothVoterDB', voterError);
          }
        }

        toast.success(`${voters.length} voters saved to database`);
      }
    } catch (error) {
      logError('SaveBoothVoters', error);
      toast.error('Failed to save voters to database');
    }

    // Update local state
    setMunicipalities((prev) => {
      return prev.map((m) => {
        if (m.id === municipalityId) {
          return {
            ...m,
            wards: m.wards.map((w) => {
              if (w.id === wardId && w.boothCentres) {
                const updatedBooths = w.boothCentres.map((b) =>
                b.id === boothId ?
                { ...b, voters, fileName, uploadedAt: new Date() } :
                b
                );
                // Sync ward.voters from booths
                const allVoters = updatedBooths.flatMap((b) => b.voters || []);
                return { ...w, boothCentres: updatedBooths, voters: allVoters };
              }
              return w;
            })
          };
        }
        return m;
      });
    });
  }, [municipalities]);

  const getTotalVoters = useCallback(() => {
    return municipalities.reduce((total, m) =>
    total + m.wards.reduce((wTotal, w) => {
      const voters = syncWardVoters(w);
      return wTotal + voters.length;
    }, 0), 0
    );
  }, [municipalities]);

  const getTotalWards = useCallback(() => {
    return municipalities.reduce((total, m) => total + m.wards.length, 0);
  }, [municipalities]);

  const getSegmentCounts = useCallback((municipalityId?: string, wardId?: string): SegmentCounts => {
    let voters: VoterRecord[] = [];

    if (municipalityId && wardId) {
      const municipality = municipalities.find((m) => m.id === municipalityId);
      const ward = municipality?.wards.find((w) => w.id === wardId);
      voters = ward?.voters || [];
    } else if (municipalityId) {
      const municipality = municipalities.find((m) => m.id === municipalityId);
      voters = municipality?.wards.flatMap((w) => w.voters) || [];
    } else {
      voters = municipalities.flatMap((m) => m.wards.flatMap((w) => w.voters));
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

    const bySurname: Record<string, number> = {};

    voters.forEach((voter) => {
      // Age
      if (voter.age >= 18 && voter.age <= 25) byAge['18-25']++;else
      if (voter.age <= 35) byAge['26-35']++;else
      if (voter.age <= 45) byAge['36-45']++;else
      if (voter.age <= 55) byAge['46-55']++;else
      if (voter.age <= 65) byAge['56-65']++;else
      byAge['65+']++;

      // Gender
      byGender[voter.gender]++;

      // Surname
      bySurname[voter.surname] = (bySurname[voter.surname] || 0) + 1;
    });

    return {
      byAge,
      byGender,
      bySurname,
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
      addBoothCentre,
      updateBoothCentre,
      removeBoothCentre,
      addBoothVoters,
      getWardVoters,
      getTotalVoters,
      getTotalWards,
      getSegmentCounts,
      saveData,
      clearAllData,
      isDataLoaded
    }}>
      {children}
    </VoterDataContext.Provider>);

};

export const useVoterData = () => {
  const context = useContext(VoterDataContext);
  if (!context) {
    throw new Error('useVoterData must be used within a VoterDataProvider');
  }
  return context;
};