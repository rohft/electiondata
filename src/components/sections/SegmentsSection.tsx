import { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData, VoterRecord } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Filter, Palette, Plus, Settings2, Edit3, Save, RotateCcw, Search, GripVertical, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CASTE_CATEGORIES, detectCasteFromName } from '@/lib/casteData';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const DEFAULT_COLORS = {
  male: '#3b82f6',
  female: '#ec4899',
  other: '#8b5cf6',
  age1: '#2d5a7b',
  age2: '#2a9d8f',
  age3: '#e9c46a',
  age4: '#f4a261',
  age5: '#e76f51',
  age6: '#9b5de5',
};

const DEFAULT_AGE_RANGES = [
  { label: '18-25', min: 18, max: 25 },
  { label: '26-35', min: 26, max: 35 },
  { label: '36-45', min: 36, max: 45 },
  { label: '46-55', min: 46, max: 55 },
  { label: '56-65', min: 56, max: 65 },
  { label: '65+', min: 65, max: 200 },
];

// Store manual caste/surname overrides
interface CasteOverride {
  voterId: string;
  caste: string;
  surname: string;
}

interface SurnameGroup {
  surname: string;
  count: number;
  caste: string;
  voterIds: string[];
}

// Draggable Surname Item Component
const DraggableSurname = ({ surname, count, caste, isOverlay = false }: { surname: string; count: number; caste: string; isOverlay?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ 
    id: `${surname}__${caste}`, 
    data: { surname, count, caste } 
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  if (isOverlay) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background shadow-lg ring-2 ring-accent"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">{surname}</span>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border bg-background cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-50 ring-2 ring-accent"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium text-sm">{surname}</span>
      <Badge variant="secondary" className="text-xs">{count}</Badge>
    </div>
  );
};

// Caste Drop Zone Component
const CasteDropZone = ({ 
  casteName, 
  casteNameNe,
  surnames,
  isActive,
  color
}: { 
  casteName: string; 
  casteNameNe: string;
  surnames: SurnameGroup[];
  isActive: boolean;
  color: string;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: casteName,
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "p-4 rounded-xl border-2 transition-all min-h-[120px]",
        (isActive || isOver) ? "border-accent bg-accent/10 shadow-lg" : "border-dashed border-border"
      )}
      style={{ borderColor: (isActive || isOver) ? undefined : `${color}40` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h4 className="font-semibold">{casteName}</h4>
        <span className="text-xs text-muted-foreground">({casteNameNe})</span>
        <Badge variant="outline" className="ml-auto">{surnames.length}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {surnames.slice(0, 8).map(s => (
          <DraggableSurname 
            key={`${s.surname}__${s.caste}`} 
            surname={s.surname} 
            count={s.count}
            caste={s.caste}
          />
        ))}
        {surnames.length > 8 && (
          <Badge variant="secondary" className="text-xs">
            +{surnames.length - 8} more
          </Badge>
        )}
        {surnames.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Drop surnames here</p>
        )}
      </div>
    </div>
  );
};

export const SegmentsSection = () => {
  const { t, getBilingual, language } = useLanguage();
  const { municipalities, getSegmentCounts, updateVoterRecord } = useVoterData();
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [ageRanges, setAgeRanges] = useState(DEFAULT_AGE_RANGES);
  const [editingAgeRanges, setEditingAgeRanges] = useState(false);
  const [selectedCastes, setSelectedCastes] = useState<string[]>([]);
  
  // Manual override state
  const [casteOverrides, setCasteOverrides] = useState<Record<string, CasteOverride>>({});
  const [editingVoter, setEditingVoter] = useState<VoterRecord | null>(null);
  const [editCaste, setEditCaste] = useState('');
  const [editSurname, setEditSurname] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCasteEditor, setShowCasteEditor] = useState(false);
  
  // Drag and drop state
  const [activeDragItem, setActiveDragItem] = useState<SurnameGroup | null>(null);
  const [pendingChanges, setPendingChanges] = useState<{ surname: string; fromCaste: string; toCaste: string; voterIds: string[] }[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const currentMunicipality = municipalities.find(m => m.id === selectedMunicipality);
  const segments = getSegmentCounts(
    selectedMunicipality !== 'all' ? selectedMunicipality : undefined,
    selectedWard !== 'all' ? selectedWard : undefined
  );

  // Get all voters for caste detection
  const allVoters = useMemo(() => {
    if (selectedMunicipality !== 'all') {
      const municipality = municipalities.find(m => m.id === selectedMunicipality);
      if (selectedWard !== 'all') {
        const ward = municipality?.wards.find(w => w.id === selectedWard);
        return ward?.voters || [];
      }
      return municipality?.wards.flatMap(w => w.voters) || [];
    }
    return municipalities.flatMap(m => m.wards.flatMap(w => w.voters));
  }, [municipalities, selectedMunicipality, selectedWard]);

  // Get caste/surname with override support
  const getVoterCaste = useCallback((voter: VoterRecord) => {
    if (casteOverrides[voter.id]) {
      return { caste: casteOverrides[voter.id].caste, surname: casteOverrides[voter.id].surname };
    }
    if (voter.caste && voter.surname) {
      return { caste: voter.caste, surname: voter.surname };
    }
    const detected = detectCasteFromName(voter.fullName);
    return { caste: detected.caste, surname: detected.surname };
  }, [casteOverrides]);

  // Compute caste distribution using AI detection with overrides
  const casteDistribution = useMemo(() => {
    const casteCounts: Record<string, { count: number; surnames: Record<string, number> }> = {};
    
    allVoters.forEach(voter => {
      const { caste, surname } = getVoterCaste(voter);
      
      if (!casteCounts[caste]) {
        casteCounts[caste] = { count: 0, surnames: {} };
      }
      casteCounts[caste].count++;
      
      if (surname) {
        casteCounts[caste].surnames[surname] = (casteCounts[caste].surnames[surname] || 0) + 1;
      }
    });
    
    return Object.entries(casteCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([caste, data]) => ({
        caste,
        count: data.count,
        surnames: Object.entries(data.surnames)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
      }));
  }, [allVoters, getVoterCaste]);

  // Surname distribution with caste grouping for drag-drop
  const surnamesByCaste = useMemo(() => {
    const result: Record<string, SurnameGroup[]> = {};
    
    // Initialize all categories
    CASTE_CATEGORIES.forEach(cat => {
      result[cat.name] = [];
    });
    result['Other'] = [];
    
    // Group voters by surname and their caste
    const surnameMap: Record<string, { count: number; caste: string; voterIds: string[] }> = {};
    
    allVoters.forEach(voter => {
      const { caste, surname } = getVoterCaste(voter);
      const key = `${surname}__${caste}`;
      
      if (!surnameMap[key]) {
        surnameMap[key] = { count: 0, caste, voterIds: [] };
      }
      surnameMap[key].count++;
      surnameMap[key].voterIds.push(voter.id);
    });
    
    // Distribute to caste buckets
    Object.entries(surnameMap).forEach(([key, data]) => {
      const surname = key.split('__')[0];
      if (!result[data.caste]) {
        result[data.caste] = [];
      }
      result[data.caste].push({
        surname,
        count: data.count,
        caste: data.caste,
        voterIds: data.voterIds
      });
    });
    
    // Sort each caste's surnames by count
    Object.keys(result).forEach(caste => {
      result[caste].sort((a, b) => b.count - a.count);
    });
    
    return result;
  }, [allVoters, getVoterCaste]);

  // Surname distribution with overrides
  const surnameDistribution = useMemo(() => {
    const surnameCounts: Record<string, { count: number; caste: string }> = {};
    
    allVoters.forEach(voter => {
      const { caste, surname } = getVoterCaste(voter);
      const surnameKey = surname || 'Unknown';
      
      if (!surnameCounts[surnameKey]) {
        surnameCounts[surnameKey] = { count: 0, caste };
      }
      surnameCounts[surnameKey].count++;
    });
    
    return Object.entries(surnameCounts)
      .sort((a, b) => b[1].count - a[1].count);
  }, [allVoters, getVoterCaste]);

  // Filtered voters by selected castes
  const filteredByCaste = useMemo(() => {
    if (selectedCastes.length === 0) return allVoters;
    return allVoters.filter(voter => {
      const { caste } = getVoterCaste(voter);
      return selectedCastes.includes(caste);
    });
  }, [allVoters, selectedCastes, getVoterCaste]);

  // Filtered voters for editing
  const filteredVotersForEdit = useMemo(() => {
    if (!searchTerm) return allVoters.slice(0, 100);
    return allVoters.filter(v => 
      v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.surname.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 100);
  }, [allVoters, searchTerm]);

  const toggleCasteFilter = (caste: string) => {
    setSelectedCastes(prev => 
      prev.includes(caste) 
        ? prev.filter(c => c !== caste)
        : [...prev, caste]
    );
  };

  const handleEditCaste = (voter: VoterRecord) => {
    setEditingVoter(voter);
    const current = getVoterCaste(voter);
    setEditCaste(current.caste);
    setEditSurname(current.surname);
  };

  const handleSaveCasteEdit = () => {
    if (!editingVoter) return;
    
    setCasteOverrides(prev => ({
      ...prev,
      [editingVoter.id]: {
        voterId: editingVoter.id,
        caste: editCaste,
        surname: editSurname
      }
    }));
    
    // Also update the voter record in context
    const municipality = municipalities.find(m => 
      m.wards.some(w => w.voters.some(v => v.id === editingVoter.id))
    );
    const ward = municipality?.wards.find(w => 
      w.voters.some(v => v.id === editingVoter.id)
    );
    
    if (municipality && ward) {
      updateVoterRecord(municipality.id, ward.id, editingVoter.id, {
        caste: editCaste,
        surname: editSurname
      });
    }
    
    toast.success('Caste/Surname updated');
    setEditingVoter(null);
  };

  const handleResetOverride = (voterId: string) => {
    setCasteOverrides(prev => {
      const updated = { ...prev };
      delete updated[voterId];
      return updated;
    });
    toast.success('Reset to auto-detected values');
  };

  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as SurnameGroup | undefined;
    if (data) {
      setActiveDragItem({ surname: data.surname, count: data.count, caste: data.caste, voterIds: [] });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    
    if (!over || !active.data.current) return;
    
    const sourceSurname = (active.data.current as SurnameGroup).surname;
    const sourceCaste = (active.data.current as SurnameGroup).caste;
    const targetCaste = over.id as string;
    
    if (sourceCaste === targetCaste) return;
    
    // Find all voters with this surname in the source caste
    const affectedVoters = allVoters.filter(v => {
      const { caste, surname } = getVoterCaste(v);
      return surname === sourceSurname && caste === sourceCaste;
    });
    
    if (affectedVoters.length === 0) return;
    
    // Add to pending changes
    setPendingChanges(prev => {
      // Remove any existing change for this surname
      const filtered = prev.filter(p => p.surname !== sourceSurname);
      return [...filtered, {
        surname: sourceSurname,
        fromCaste: sourceCaste,
        toCaste: targetCaste,
        voterIds: affectedVoters.map(v => v.id)
      }];
    });
    
    // Show save dialog
    setShowSaveDialog(true);
  };

  const handleSaveChanges = () => {
    pendingChanges.forEach(change => {
      change.voterIds.forEach(voterId => {
        setCasteOverrides(prev => ({
          ...prev,
          [voterId]: {
            voterId,
            caste: change.toCaste,
            surname: change.surname
          }
        }));
        
        // Update in context
        const municipality = municipalities.find(m => 
          m.wards.some(w => w.voters.some(v => v.id === voterId))
        );
        const ward = municipality?.wards.find(w => 
          w.voters.some(v => v.id === voterId)
        );
        
        if (municipality && ward) {
          updateVoterRecord(municipality.id, ward.id, voterId, {
            caste: change.toCaste,
            surname: change.surname
          });
        }
      });
    });
    
    toast.success(`Updated ${pendingChanges.reduce((acc, c) => acc + c.voterIds.length, 0)} voter records`);
    setPendingChanges([]);
    setShowSaveDialog(false);
  };

  const handleDiscardChanges = () => {
    setPendingChanges([]);
    setShowSaveDialog(false);
  };

  const genderLabels = getBilingual('segments.male');
  const femaleLabels = getBilingual('segments.female');
  const otherLabels = getBilingual('segments.other');

  const genderData = [
    { key: 'male', labels: genderLabels, value: segments.byGender.male || 0, color: colors.male },
    { key: 'female', labels: femaleLabels, value: segments.byGender.female || 0, color: colors.female },
    { key: 'other', labels: otherLabels, value: segments.byGender.other || 0, color: colors.other },
  ];

  const ageColors = [colors.age1, colors.age2, colors.age3, colors.age4, colors.age5, colors.age6];

  const casteColors = ['#2d5a7b', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#9b5de5', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];

  const updateAgeRange = (index: number, field: 'min' | 'max' | 'label', value: string | number) => {
    setAgeRanges(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Save Changes Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Save Caste Changes?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You have made the following changes to caste assignments:
            </p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {pendingChanges.map(change => (
                <div key={change.surname} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline">{change.surname}</Badge>
                  <span className="text-sm text-muted-foreground">{change.fromCaste}</span>
                  <span className="text-sm">→</span>
                  <Badge>{change.toCaste}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    ({change.voterIds.length} voters)
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              This will update all voters with these surnames to the new caste category.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardChanges}>
              Discard
            </Button>
            <Button onClick={handleSaveChanges} className="gap-2">
              <Check className="h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Filter className="h-4 w-4 text-accent" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('common.municipality')}</label>
              <Select value={selectedMunicipality} onValueChange={(v) => { setSelectedMunicipality(v); setSelectedWard('all'); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Municipalities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Municipalities</SelectItem>
                  {municipalities.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('common.ward')}</label>
              <Select value={selectedWard} onValueChange={setSelectedWard} disabled={selectedMunicipality === 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="All Wards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {currentMunicipality?.wards.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {t('segments.colorPalette')}
              </label>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <span>{showColorPicker ? 'Hide Colors' : 'Customize Colors'}</span>
                <div className="flex gap-1">
                  {Object.values(colors).slice(0, 5).map((color, i) => (
                    <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </button>
            </div>
          </div>

          {/* Color Picker Grid */}
          {showColorPicker && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {Object.entries(colors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={value}
                      onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                      className="h-8 w-12 cursor-pointer rounded border-0 p-0"
                    />
                    <Label className="text-xs capitalize">{key.replace(/\d+/, ' $&')}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Count */}
      <Card className="card-shadow border-border/50 gradient-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">{t('common.total')} {t('common.voters')}</p>
              <p className="mt-1 text-4xl font-bold counter-animate">{segments.total.toLocaleString()}</p>
            </div>
            <Users className="h-12 w-12 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Segment Tabs */}
      <Tabs defaultValue="gender" className="space-y-4">
        <TabsList className="h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="gender" className="text-xs sm:text-sm">{t('segments.byGender')}</TabsTrigger>
          <TabsTrigger value="age" className="text-xs sm:text-sm">{t('segments.byAge')}</TabsTrigger>
          <TabsTrigger value="caste" className="text-xs sm:text-sm">{t('segments.byCaste')}</TabsTrigger>
          <TabsTrigger value="surname" className="text-xs sm:text-sm">{t('segments.bySurname')}</TabsTrigger>
          <TabsTrigger value="dragDrop" className="text-xs sm:text-sm">Organize Castes</TabsTrigger>
          <TabsTrigger value="casteFilter" className="text-xs sm:text-sm">Filter by Caste</TabsTrigger>
        </TabsList>

        <TabsContent value="gender" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('segments.byGender')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                {genderData.map(({ key, labels, value, color }) => (
                  <div 
                    key={key} 
                    className="rounded-xl border p-4 text-center transition-all hover:shadow-md"
                    style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-sm text-muted-foreground">{labels.en}</p>
                      <p className="text-xs text-muted-foreground">{labels.ne}</p>
                    </div>
                    <p className="mt-2 text-3xl sm:text-4xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {segments.total > 0 ? ((value / segments.total) * 100).toFixed(1) : 0}%
                    </p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: segments.total > 0 ? `${(value / segments.total) * 100}%` : '0%',
                          backgroundColor: color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="age" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">{t('segments.byAge')}</CardTitle>
              <Dialog open={editingAgeRanges} onOpenChange={setEditingAgeRanges}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Edit Ranges
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Age Ranges</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {ageRanges.map((range, index) => (
                      <div key={index} className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Label</Label>
                          <Input 
                            value={range.label}
                            onChange={(e) => updateAgeRange(index, 'label', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Min Age</Label>
                          <Input 
                            type="number"
                            value={range.min}
                            onChange={(e) => updateAgeRange(index, 'min', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Max Age</Label>
                          <Input 
                            type="number"
                            value={range.max}
                            onChange={(e) => updateAgeRange(index, 'max', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => setAgeRanges([...ageRanges, { label: 'New', min: 0, max: 0 }])}
                    >
                      <Plus className="h-4 w-4" />
                      Add Range
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {Object.entries(segments.byAge).map(([range, count], index) => {
                  const color = ageColors[index % ageColors.length];
                  return (
                    <div 
                      key={range} 
                      className="rounded-xl border p-3 sm:p-4 text-center transition-all hover:shadow-md"
                      style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}
                    >
                      <p className="text-xs sm:text-sm font-medium text-foreground">{range}</p>
                      <p className="text-xs text-muted-foreground">वर्ष</p>
                      <p 
                        className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold"
                        style={{ color }}
                      >
                        {count.toLocaleString()}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: segments.total > 0 ? `${(count / segments.total) * 100}%` : '0%',
                            backgroundColor: color
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">
                        {segments.total > 0 ? ((count / segments.total) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caste" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                <div className="flex items-center gap-2">
                  {t('segments.byCaste')}
                  <Badge variant="secondary">{casteDistribution.length} categories detected</Badge>
                </div>
                <Dialog open={showCasteEditor} onOpenChange={setShowCasteEditor}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit3 className="h-4 w-4" />
                      Edit Caste Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Edit Voter Caste/Surname Data</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or surname..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                      />
                      {Object.keys(casteOverrides).length > 0 && (
                        <Badge variant="secondary">
                          {Object.keys(casteOverrides).length} manual edits
                        </Badge>
                      )}
                    </div>

                    <ScrollArea className="flex-1 max-h-[500px] border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name / नाम</TableHead>
                            <TableHead>Detected Caste</TableHead>
                            <TableHead>Detected Surname</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVotersForEdit.map(voter => {
                            const detected = detectCasteFromName(voter.fullName);
                            const current = getVoterCaste(voter);
                            const hasOverride = !!casteOverrides[voter.id];
                            
                            return (
                              <TableRow key={voter.id}>
                                <TableCell className="font-medium">{voter.fullName}</TableCell>
                                <TableCell>
                                  <Badge variant={hasOverride ? "default" : "outline"}>
                                    {current.caste}
                                  </Badge>
                                </TableCell>
                                <TableCell>{current.surname}</TableCell>
                                <TableCell>
                                  {hasOverride ? (
                                    <Badge variant="outline" className="text-xs border-warning/50 text-warning">
                                      Manually Edited
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      Auto-detected
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-7 w-7"
                                          onClick={() => handleEditCaste(voter)}
                                        >
                                          <Edit3 className="h-3 w-3" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Edit Caste/Surname</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="p-3 bg-muted/50 rounded-lg">
                                            <p className="font-medium">{voter.fullName}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Auto-detected: {detected.caste} / {detected.surname}
                                            </p>
                                          </div>
                                          
                                          <div className="space-y-2">
                                            <Label>Caste Category</Label>
                                            <Select value={editCaste} onValueChange={setEditCaste}>
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {CASTE_CATEGORIES.map(cat => (
                                                  <SelectItem key={cat.name} value={cat.name}>
                                                    {cat.name} ({cat.nameNe})
                                                  </SelectItem>
                                                ))}
                                                <SelectItem value="Other">Other (अन्य)</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          
                                          <div className="space-y-2">
                                            <Label>Surname / थर</Label>
                                            <Input
                                              value={editSurname}
                                              onChange={(e) => setEditSurname(e.target.value)}
                                              placeholder="Enter surname"
                                            />
                                          </div>
                                          
                                          <div className="flex justify-end gap-2">
                                            <DialogClose asChild>
                                              <Button variant="outline">Cancel</Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                              <Button onClick={handleSaveCasteEdit} className="gap-2">
                                                <Save className="h-4 w-4" />
                                                Save
                                              </Button>
                                            </DialogClose>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    
                                    {hasOverride && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        onClick={() => handleResetOverride(voter.id)}
                                      >
                                        <RotateCcw className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {filteredVotersForEdit.length} of {allVoters.length} voters
                      </p>
                      <DialogClose asChild>
                        <Button>Done</Button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {casteDistribution.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Upload data to see caste distribution</p>
              ) : (
                <div className="space-y-4">
                  {casteDistribution.map((item, index) => {
                    const color = casteColors[index % casteColors.length];
                    const percentage = segments.total > 0 ? ((item.count / segments.total) * 100).toFixed(1) : 0;
                    return (
                      <div key={item.caste} className="space-y-2">
                        <div className="flex items-center gap-4">
                          <span className="w-6 text-sm font-medium text-muted-foreground">{index + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{item.caste}</span>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ borderColor: color, color }}
                                >
                                  {percentage}%
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">{item.count.toLocaleString()}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: casteDistribution[0] ? `${(item.count / casteDistribution[0].count) * 100}%` : '0%',
                                  backgroundColor: color
                                }}
                              />
                            </div>
                            {/* Surnames under this caste */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.surnames.slice(0, 5).map(([surname, count]) => (
                                <Badge key={surname} variant="secondary" className="text-xs">
                                  {surname} ({count})
                                </Badge>
                              ))}
                              {item.surnames.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.surnames.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surname" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                <div className="flex items-center gap-2">
                  {t('segments.bySurname')}
                  <Badge variant="secondary">{surnameDistribution.length} unique surnames</Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setShowCasteEditor(true)}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Data
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {surnameDistribution.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {surnameDistribution.slice(0, 50).map(([surname, data], index) => {
                    const hasOverrides = Object.values(casteOverrides).some(o => o.surname === surname);
                    return (
                      <div key={surname} className="flex items-center gap-4">
                        <span className="w-6 text-sm font-medium text-muted-foreground">{index + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{surname || 'Unknown'}</span>
                              <Badge variant="outline" className="text-xs">{data.caste}</Badge>
                              {hasOverrides && (
                                <Badge variant="outline" className="text-xs border-warning/50 text-warning">
                                  Has edits
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">{data.count.toLocaleString()}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div 
                              className="h-full rounded-full bg-chart-2 transition-all"
                              style={{ width: surnameDistribution[0] ? `${(data.count / surnameDistribution[0][1].count) * 100}%` : '0%' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {surnameDistribution.length > 50 && (
                    <p className="text-center text-sm text-muted-foreground py-2">
                      Showing top 50 of {surnameDistribution.length} surnames
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drag and Drop Tab */}
        <TabsContent value="dragDrop" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4" />
                  Drag & Drop Surnames to Castes
                  <Badge variant="secondary">Interactive</Badge>
                </div>
                {pendingChanges.length > 0 && (
                  <Badge variant="default" className="gap-1">
                    {pendingChanges.length} pending changes
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allVoters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Upload data to organize castes</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Drag surnames between caste categories to reassign them. Changes will be applied to all voters with that surname.
                  </p>
                  
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {CASTE_CATEGORIES.map((cat, index) => (
                        <div 
                          key={cat.name}
                          id={cat.name}
                          data-droppable="true"
                        >
                          <CasteDropZone
                            casteName={cat.name}
                            casteNameNe={cat.nameNe}
                            surnames={surnamesByCaste[cat.name] || []}
                            isActive={activeDragItem !== null}
                            color={casteColors[index % casteColors.length]}
                          />
                        </div>
                      ))}
                      <div 
                        id="Other"
                        data-droppable="true"
                      >
                        <CasteDropZone
                          casteName="Other"
                          casteNameNe="अन्य"
                          surnames={surnamesByCaste['Other'] || []}
                          isActive={activeDragItem !== null}
                          color="#888888"
                        />
                      </div>
                    </div>
                    
                    <DragOverlay>
                      {activeDragItem ? (
                        <DraggableSurname 
                          surname={activeDragItem.surname} 
                          count={activeDragItem.count}
                          caste={activeDragItem.caste}
                          isOverlay
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="casteFilter" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter by Caste
                  {selectedCastes.length > 0 && (
                    <Badge variant="default">{selectedCastes.length} selected</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Caste Selection */}
                <div className="flex flex-wrap gap-2">
                  {CASTE_CATEGORIES.map(cat => (
                    <Button
                      key={cat.name}
                      variant={selectedCastes.includes(cat.name) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCasteFilter(cat.name)}
                      className="gap-2"
                    >
                      {cat.name}
                      <span className="text-xs opacity-70">({cat.nameNe})</span>
                    </Button>
                  ))}
                  <Button
                    variant={selectedCastes.includes('Other') ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCasteFilter('Other')}
                  >
                    Other (अन्य)
                  </Button>
                </div>

                {selectedCastes.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedCastes([])}
                    className="gap-2"
                  >
                    Clear Selection
                  </Button>
                )}

                {/* Filtered Results */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium">
                      {selectedCastes.length === 0 ? 'All Voters' : `Filtered: ${selectedCastes.join(', ')}`}
                    </p>
                    <Badge variant="secondary">{filteredByCaste.length} voters</Badge>
                  </div>
                  
                  <ScrollArea className="h-[400px] border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SN</TableHead>
                          <TableHead>Name / नाम</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Caste</TableHead>
                          <TableHead>Surname</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredByCaste.slice(0, 100).map((voter, index) => {
                          const { caste, surname } = getVoterCaste(voter);
                          return (
                            <TableRow key={voter.id}>
                              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                              <TableCell className="font-medium">{voter.fullName}</TableCell>
                              <TableCell>{voter.age}</TableCell>
                              <TableCell className="capitalize">{voter.gender}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{caste}</Badge>
                              </TableCell>
                              <TableCell>{surname}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  
                  {filteredByCaste.length > 100 && (
                    <p className="text-center text-sm text-muted-foreground mt-2">
                      Showing first 100 of {filteredByCaste.length} voters
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
