import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData, VoterRecord, VoterStatus } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { 
  Edit3, Undo2, Save, Search, X, FolderOpen, ChevronRight, 
  Users, UserPlus, FileText, Building2, Plus, Filter, Trash2, Eye, EyeOff,
  ChevronLeft, ChevronRight as ChevronRightIcon, ChevronsLeft, ChevronsRight,
  Sparkles, Wand2, MapPin, Check, Heart, Plane, Skull, UserCheck, Accessibility, Replace,
  GripVertical, Columns3, ArrowLeftRight, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { detectCasteFromName, CASTE_CATEGORIES } from '@/lib/casteData';
import { BulkSurnameReplace } from '@/components/edit/BulkSurnameReplace';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { exportToExcel, exportToCSV } from '@/lib/dataExporter';
// Helper to detect if text contains Nepali/Devanagari characters
const containsNepali = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  // Devanagari Unicode range: \u0900-\u097F
  return /[\u0900-\u097F]/.test(text);
};

const OCCUPATIONS = [
  'Agriculture', 'Business', 'Government Service', 'Private Job', 'Teacher',
  'Doctor', 'Engineer', 'Lawyer', 'Student', 'Homemaker', 'Retired', 'Other'
];

const POLITICAL_PARTIES = [
  { name: 'Nepali Congress', short: 'NC' },
  { name: 'CPN-UML', short: 'UML' },
  { name: 'CPN-Maoist', short: 'Maoist' },
  { name: 'Rastriya Swatantra Party', short: 'RSP' },
  { name: 'Rastriya Prajatantra Party', short: 'RPP' },
  { name: 'Janata Samajwadi Party', short: 'JSP' },
  { name: 'Independent', short: 'IND' },
  { name: 'None', short: '-' },
];

const NOTE_TAGS = [
  'Supporter', 'Volunteer', 'Donor', 'Inactive', 'New Voter', 'Senior Citizen',
  'Youth Leader', 'Requires Follow-up', 'Key Contact', 'Community Leader'
];

// Voter status options with colors and icons
const VOTER_STATUS_OPTIONS: { 
  value: VoterStatus; 
  label: string; 
  labelNe: string;
  color: string; 
  bgColor: string;
  icon: React.ReactNode;
}[] = [
  { value: 'available', label: 'Available', labelNe: 'उपलब्ध', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10 border-emerald-500/30', icon: <UserCheck className="h-3 w-3" /> },
  { value: 'dead', label: 'Deceased', labelNe: 'मृत', color: 'text-slate-500', bgColor: 'bg-slate-500/10 border-slate-500/30', icon: <Skull className="h-3 w-3" /> },
  { value: 'out_of_country', label: 'Out of Country', labelNe: 'विदेशमा', color: 'text-blue-600', bgColor: 'bg-blue-500/10 border-blue-500/30', icon: <Plane className="h-3 w-3" /> },
  { value: 'married', label: 'Married (Moved)', labelNe: 'विवाहित', color: 'text-pink-600', bgColor: 'bg-pink-500/10 border-pink-500/30', icon: <Heart className="h-3 w-3" /> },
  { value: 'older_citizen', label: 'Older Citizen', labelNe: 'वृद्ध नागरिक', color: 'text-amber-600', bgColor: 'bg-amber-500/10 border-amber-500/30', icon: <Users className="h-3 w-3" /> },
  { value: 'disabled', label: 'Disabled', labelNe: 'अपाङ्ग', color: 'text-purple-600', bgColor: 'bg-purple-500/10 border-purple-500/30', icon: <Accessibility className="h-3 w-3" /> },
];

// All available columns with bilingual labels
const ALL_COLUMNS = [
  { key: 'sn', label: 'SN', labelNe: 'सि.नं.' },
  { key: 'voterId', label: 'Voter ID', labelNe: 'मतदाता नं' },
  { key: 'fullName', label: 'Voter Name', labelNe: 'मतदाताको नाम' },
  { key: 'age', label: 'Age', labelNe: 'उमेर' },
  { key: 'gender', label: 'Gender', labelNe: 'लिङ्ग' },
  { key: 'spouse', label: 'Spouse', labelNe: 'पति/पत्नी' },
  { key: 'parents', label: 'Father/Mother', labelNe: 'पिता/माता' },
  { key: 'caste', label: 'Caste', labelNe: 'जात' },
  { key: 'surname', label: 'Surname', labelNe: 'थर' },
  { key: 'voterStatus', label: 'Status', labelNe: 'स्थिति' },
  { key: 'tole', label: 'Tole', labelNe: 'टोल' },
  { key: 'phone', label: 'Phone', labelNe: 'फोन' },
];

// Default column order
const DEFAULT_COLUMN_ORDER = ['sn', 'voterId', 'fullName', 'age', 'gender', 'spouse', 'parents', 'caste', 'surname', 'tole', 'voterStatus'];

// Sortable Table Header Cell Component
const SortableHeaderCell = ({ 
  column, 
  isVisible,
  onToggleVisibility 
}: { 
  column: typeof ALL_COLUMNS[0]; 
  isVisible: boolean;
  onToggleVisibility: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableHead 
      ref={setNodeRef}
      style={style}
      className={cn(
        "min-w-[80px] select-none",
        column.key === 'sn' && "sticky left-0 bg-background z-20 w-[60px]",
        column.key === 'fullName' && "min-w-[180px]",
        isDragging && "bg-accent/20"
      )}
    >
      <div className="flex items-center gap-1">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="font-medium">{column.label}</div>
          <div className="text-xs text-muted-foreground font-nepali">{column.labelNe}</div>
        </div>
      </div>
    </TableHead>
  );
};

// Voter Status Cell Component with dropdown to change status
const VoterStatusCell = ({ 
  status, 
  voter,
  municipalityId,
  wardId,
  onUpdate
}: { 
  status: VoterStatus; 
  voter: VoterRecord;
  municipalityId?: string;
  wardId: string;
  onUpdate: (mId: string, wId: string, vId: string, updates: Partial<VoterRecord>) => void;
}) => {
  const statusOption = VOTER_STATUS_OPTIONS.find(s => s.value === status) || VOTER_STATUS_OPTIONS[0];
  
  const handleStatusChange = (newStatus: VoterStatus) => {
    if (municipalityId && wardId) {
      onUpdate(municipalityId, wardId, voter.id, { voterStatus: newStatus });
      toast.success(`Status updated to ${VOTER_STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-7 px-2 gap-1 border text-xs font-medium",
            statusOption.bgColor,
            statusOption.color
          )}
        >
          {statusOption.icon}
          {statusOption.label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1 bg-popover" align="start">
        {VOTER_STATUS_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start gap-2 text-xs",
              status === opt.value && "bg-accent/10",
              opt.color
            )}
            onClick={() => handleStatusChange(opt.value)}
          >
            {opt.icon}
            <span>{opt.label}</span>
            <span className="text-muted-foreground ml-auto">({opt.labelNe})</span>
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

// AI Family matching function - finds potential family members based on surname, age, and tole
const findPotentialFamilyMembers = (
  currentVoter: VoterRecord,
  allVoters: VoterRecord[],
  existingFamilyIds: string[]
): { voter: VoterRecord; score: number; reasons: string[] }[] => {
  const currentSurname = currentVoter.surname || detectCasteFromName(currentVoter.fullName).surname;
  const currentTole = currentVoter.originalData?.['Tole'] || currentVoter.originalData?.['टोल'] || '';
  const currentFatherName = currentVoter.originalData?.['Father Name'] || 
                            currentVoter.originalData?.['बाबुको नाम'] || 
                            currentVoter.originalData?.['बुबाको नाम'] || '';
  
  const potentialMembers: { voter: VoterRecord; score: number; reasons: string[] }[] = [];
  
  allVoters.forEach(voter => {
    // Skip self and already added family members
    if (voter.id === currentVoter.id || existingFamilyIds.includes(voter.id)) return;
    
    const voterSurname = voter.surname || detectCasteFromName(voter.fullName).surname;
    const voterTole = voter.originalData?.['Tole'] || voter.originalData?.['टोल'] || '';
    const voterFatherName = voter.originalData?.['Father Name'] || 
                           voter.originalData?.['बाबुको नाम'] || 
                           voter.originalData?.['बुबाको नाम'] || '';
    
    let score = 0;
    const reasons: string[] = [];
    
    // Same surname (strong indicator)
    if (currentSurname && voterSurname && 
        currentSurname.toLowerCase() === voterSurname.toLowerCase()) {
      score += 40;
      reasons.push('Same surname');
    }
    
    // Same tole (moderate indicator)
    if (currentTole && voterTole && 
        currentTole.toLowerCase() === voterTole.toLowerCase()) {
      score += 30;
      reasons.push('Same tole/location');
    }
    
    // Same father's name (strong indicator)
    if (currentFatherName && voterFatherName && 
        currentFatherName.toLowerCase() === voterFatherName.toLowerCase()) {
      score += 50;
      reasons.push('Same father name');
    }
    
    // Age difference suggests parent/child/sibling relationship
    const ageDiff = Math.abs(currentVoter.age - voter.age);
    if (ageDiff <= 5) {
      score += 15;
      reasons.push('Similar age (sibling?)');
    } else if (ageDiff >= 18 && ageDiff <= 35) {
      score += 20;
      reasons.push('Parent/child age gap');
    } else if (ageDiff >= 36 && ageDiff <= 55) {
      score += 10;
      reasons.push('Grandparent/grandchild age gap');
    }
    
    // Check if voter's name appears in current voter's father name field
    if (currentFatherName) {
      const fatherNameParts = currentFatherName.toLowerCase().split(/\s+/);
      const voterNameParts = voter.fullName.toLowerCase().split(/\s+/);
      if (voterNameParts.some(part => fatherNameParts.includes(part) && part.length > 2)) {
        score += 25;
        reasons.push('Name matches father field');
      }
    }
    
    // Check if current voter's name appears in other's father name
    if (voterFatherName) {
      const fatherNameParts = voterFatherName.toLowerCase().split(/\s+/);
      const currentNameParts = currentVoter.fullName.toLowerCase().split(/\s+/);
      if (currentNameParts.some(part => fatherNameParts.includes(part) && part.length > 2)) {
        score += 25;
        reasons.push('Appears as their father');
      }
    }
    
    // Only include if there's some match
    if (score >= 30) {
      potentialMembers.push({ voter, score, reasons });
    }
  });
  
  // Sort by score descending
  return potentialMembers.sort((a, b) => b.score - a.score).slice(0, 20);
};

export const EditSection = () => {
  const { t, getBilingual } = useLanguage();
  const { municipalities, updateVoterRecord, revertVoterRecord } = useVoterData();
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVoter, setEditingVoter] = useState<VoterRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<VoterRecord> & {
    tole?: string;
    occupation?: string;
    partyAffiliations?: string[];
    notes?: string[];
    customNote?: string;
    familyMemberIds?: string[];
    isMainFamilyMember?: boolean;
  }>({});
  const [showOriginalData, setShowOriginalData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Column visibility and order
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMN_ORDER);
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COLUMN_ORDER);
  const [showColumnManager, setShowColumnManager] = useState(false);
  
  // DnD sensors for column reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  // Multi-select filter states
  const [filterGenders, setFilterGenders] = useState<string[]>([]);
  const [filterCastes, setFilterCastes] = useState<string[]>([]);
  const [filterSurnames, setFilterSurnames] = useState<string[]>([]);
  const [filterAgeRanges, setFilterAgeRanges] = useState<string[]>([]);
  const [filterAgeMin, setFilterAgeMin] = useState<string>('');
  const [filterAgeMax, setFilterAgeMax] = useState<string>('');
  const [filterVoterStatuses, setFilterVoterStatuses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Predefined age ranges
  const AGE_RANGES = [
    { label: 'All Ages', value: 'all', min: 0, max: 200 },
    { label: '16-28 (Youth)', value: '16-28', min: 16, max: 28 },
    { label: '29-40 (Young Adult)', value: '29-40', min: 29, max: 40 },
    { label: '41-55 (Middle Age)', value: '41-55', min: 41, max: 55 },
    { label: '56-68 (Senior)', value: '56-68', min: 56, max: 68 },
    { label: '68+ (Elder)', value: '68+', min: 68, max: 200 },
    { label: 'Custom Range', value: 'custom', min: 0, max: 200 },
  ];
  
  // AI Family suggestions
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [familySearchTerm, setFamilySearchTerm] = useState('');
  
  // Custom tole input
  const [customTole, setCustomTole] = useState('');

  // Auto-select municipality if only one exists
  const autoSelectedMunicipality = municipalities.length === 1 ? municipalities[0] : null;
  const effectiveMunicipalityId = selectedMunicipality || (autoSelectedMunicipality?.id || '');
  const effectiveMunicipality = municipalities.find(m => m.id === effectiveMunicipalityId);
  const currentWard = effectiveMunicipality?.wards.find(w => w.id === selectedWard);
  
  // Get all voters in the current ward for family member selection
  const allWardVoters = currentWard?.voters || [];
  
  // AI-suggested family members
  const aiSuggestedFamily = useMemo(() => {
    if (!editingVoter || !showAISuggestions) return [];
    return findPotentialFamilyMembers(
      editingVoter, 
      allWardVoters, 
      editForm.familyMemberIds || []
    );
  }, [editingVoter, allWardVoters, editForm.familyMemberIds, showAISuggestions]);
  
  // Apply filters
  const voters = useMemo(() => {
    let filtered = allWardVoters;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.caste.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.originalData?.['मतदाता नं'] || '').includes(searchTerm) ||
        (v.originalData?.['Voter No'] || '').includes(searchTerm)
      );
    }
    
    // Gender filter (multi-select)
    if (filterGenders.length > 0) {
      filtered = filtered.filter(v => filterGenders.includes(v.gender));
    }
    
    // Caste filter (multi-select)
    if (filterCastes.length > 0) {
      filtered = filtered.filter(v => {
        const detected = detectCasteFromName(v.fullName);
        return filterCastes.includes(v.caste || detected.caste);
      });
    }
    
    // Surname filter (multi-select)
    if (filterSurnames.length > 0) {
      filtered = filtered.filter(v => {
        const detected = detectCasteFromName(v.fullName);
        return filterSurnames.includes(v.surname || detected.surname);
      });
    }
    
    // Voter status filter (multi-select)
    if (filterVoterStatuses.length > 0) {
      filtered = filtered.filter(v => filterVoterStatuses.includes(v.voterStatus || 'available'));
    }
    
    // Age filter - use predefined ranges (multi-select) or custom
    if (filterAgeRanges.length > 0) {
      if (filterAgeRanges.includes('custom')) {
        const minAge = parseInt(filterAgeMin) || 0;
        const maxAge = parseInt(filterAgeMax) || 200;
        filtered = filtered.filter(v => v.age >= minAge && v.age <= maxAge);
      } else {
        filtered = filtered.filter(v => {
          return filterAgeRanges.some(rangeValue => {
            const range = AGE_RANGES.find(r => r.value === rangeValue);
            if (range) {
              return v.age >= range.min && v.age <= range.max;
            }
            return false;
          });
        });
      }
    }
    
    return filtered;
  }, [allWardVoters, searchTerm, filterGenders, filterCastes, filterSurnames, filterAgeRanges, filterAgeMin, filterAgeMax, filterVoterStatuses]);

  const paginatedVoters = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return voters.slice(start, start + pageSize);
  }, [voters, currentPage, pageSize]);

  const totalPages = Math.ceil(voters.length / pageSize);

  // Get unique toles from the data
  const uniqueToles = useMemo(() => {
    const toles = new Set<string>();
    allWardVoters.forEach(v => {
      if (v.originalData?.['Tole'] || v.originalData?.['टोल']) {
        toles.add(v.originalData['Tole'] || v.originalData['टोल']);
      }
    });
    return Array.from(toles).sort();
  }, [allWardVoters]);

  // Get unique castes for filter (linked to CASTE_CATEGORIES from segment)
  const uniqueCastes = useMemo(() => {
    const castes = new Set<string>();
    allWardVoters.forEach(v => {
      const detected = detectCasteFromName(v.fullName);
      castes.add(v.caste || detected.caste);
    });
    // Sort by CASTE_CATEGORIES order
    const orderedCastes = CASTE_CATEGORIES.map(c => c.name).filter(name => castes.has(name));
    const remaining = Array.from(castes).filter(c => !orderedCastes.includes(c)).sort();
    return [...orderedCastes, ...remaining];
  }, [allWardVoters]);

  // Get unique surnames for filter
  const uniqueSurnames = useMemo(() => {
    const surnames = new Set<string>();
    allWardVoters.forEach(v => {
      const detected = detectCasteFromName(v.fullName);
      const surname = v.surname || detected.surname;
      if (surname) surnames.add(surname);
    });
    return Array.from(surnames).sort();
  }, [allWardVoters]);

  // Filter family search results
  const filteredFamilyMembers = useMemo(() => {
    let available = allWardVoters.filter(v => 
      v.id !== editingVoter?.id && 
      !editForm.familyMemberIds?.includes(v.id)
    );
    
    if (familySearchTerm) {
      available = available.filter(v =>
        v.fullName.toLowerCase().includes(familySearchTerm.toLowerCase()) ||
        v.surname.toLowerCase().includes(familySearchTerm.toLowerCase())
      );
    }
    
    return available.slice(0, 50);
  }, [allWardVoters, editingVoter, editForm.familyMemberIds, familySearchTerm]);

  const handleEditClick = (voter: VoterRecord) => {
    setEditingVoter(voter);
    const detected = detectCasteFromName(voter.fullName);
    setEditForm({
      fullName: voter.fullName,
      age: voter.age,
      gender: voter.gender,
      caste: voter.caste || detected.caste,
      surname: voter.surname || detected.surname,
      phone: voter.phone,
      email: voter.email,
      tole: voter.originalData?.['Tole'] || voter.originalData?.['टोल'] || '',
      occupation: '',
      partyAffiliations: [],
      notes: [],
      customNote: '',
      familyMemberIds: [],
      isMainFamilyMember: false,
    });
    setShowOriginalData(false);
    setShowAISuggestions(false);
    setCustomTole('');
    setFamilySearchTerm('');
  };

  const handleSaveEdit = () => {
    if (!editingVoter || !effectiveMunicipality || !selectedWard) return;

    // Include custom tole if provided
    const finalTole = customTole || editForm.tole;
    const updatedForm = { ...editForm, tole: finalTole };

    // If surname was changed, also update caste and isNewar based on new surname
    if (updatedForm.surname && updatedForm.surname !== editingVoter.surname) {
      const detected = detectCasteFromName(updatedForm.surname);
      // Only auto-update caste if it wasn't manually changed
      if (!updatedForm.caste || updatedForm.caste === editingVoter.caste) {
        updatedForm.caste = detected.caste;
      }
      // Update isNewar based on caste
      const isNewCasteNewar = (updatedForm.caste || detected.caste) === 'Newar' ||
        CASTE_CATEGORIES.find(c => c.name === 'Newar')?.surnames.some(s => 
          updatedForm.surname?.toLowerCase().includes(s.toLowerCase())
        ) ||
        CASTE_CATEGORIES.find(c => c.name === 'Newar')?.surnamesNe.some(s => 
          updatedForm.surname?.includes(s)
        );
      (updatedForm as any).isNewar = !!isNewCasteNewar;
    }

    updateVoterRecord(effectiveMunicipality.id, selectedWard, editingVoter.id, updatedForm);
    toast.success('Record updated successfully');
    setEditingVoter(null);
    setEditForm({});
    setCustomTole('');
  };

  const handleRevert = (voterId: string) => {
    if (!effectiveMunicipality || !selectedWard) return;
    revertVoterRecord(effectiveMunicipality.id, selectedWard, voterId);
    toast.success('Last change reverted');
  };

  const togglePartyAffiliation = (partyName: string) => {
    setEditForm(prev => ({
      ...prev,
      partyAffiliations: prev.partyAffiliations?.includes(partyName)
        ? prev.partyAffiliations.filter(p => p !== partyName)
        : [...(prev.partyAffiliations || []), partyName]
    }));
  };

  const toggleNote = (note: string) => {
    setEditForm(prev => ({
      ...prev,
      notes: prev.notes?.includes(note)
        ? prev.notes.filter(n => n !== note)
        : [...(prev.notes || []), note]
    }));
  };

  const toggleFamilyMember = (memberId: string) => {
    setEditForm(prev => ({
      ...prev,
      familyMemberIds: prev.familyMemberIds?.includes(memberId)
        ? prev.familyMemberIds.filter(id => id !== memberId)
        : [...(prev.familyMemberIds || []), memberId]
    }));
  };

  const addAISuggestedFamily = (voterId: string) => {
    setEditForm(prev => ({
      ...prev,
      familyMemberIds: [...(prev.familyMemberIds || []), voterId]
    }));
    toast.success('Family member added');
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  // Handle column drag end for reordering
  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Get ordered visible columns
  const orderedVisibleColumns = useMemo(() => {
    return columnOrder
      .filter(key => visibleColumns.includes(key))
      .map(key => ALL_COLUMNS.find(c => c.key === key)!)
      .filter(Boolean);
  }, [columnOrder, visibleColumns]);

  const clearFilters = () => {
    setFilterGenders([]);
    setFilterCastes([]);
    setFilterSurnames([]);
    setFilterAgeRanges([]);
    setFilterAgeMin('');
    setFilterAgeMax('');
    setFilterVoterStatuses([]);
    setSearchTerm('');
  };

  // Toggle filter value in multi-select array
  const toggleFilter = (
    current: string[], 
    setter: React.Dispatch<React.SetStateAction<string[]>>, 
    value: string
  ) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  // Helper to get cell value with bilingual support
  const getCellValue = (voter: VoterRecord, columnKey: string, index: number): { en: string; ne: string } | string | number => {
    const detected = detectCasteFromName(voter.fullName);
    const voterNo = voter.originalData?.['मतदाता नं'] || 
                    voter.originalData?.['Voter No'] || 
                    voter.id.slice(0, 8);
    const spouseName = voter.originalData?.['पति/पत्नीको नाम'] || 
                       voter.originalData?.['Spouse'] || 
                       '-';
    const parentsName = voter.originalData?.['पिता/माताको नाम'] || 
                        voter.originalData?.['Father Name'] || 
                        voter.originalData?.['बाबुको नाम'] || 
                        '-';
    const tole = voter.tole || 
                 voter.originalData?.['Tole'] || 
                 voter.originalData?.['टोल'] || 
                 '-';

    switch (columnKey) {
      case 'sn': 
        return (currentPage - 1) * pageSize + index + 1;
      case 'voterId': 
        return voterNo;
      case 'fullName': 
        return voter.fullName;
      case 'age': 
        return voter.age;
      case 'gender': 
        return { 
          en: voter.gender === 'male' ? 'Male' : voter.gender === 'female' ? 'Female' : 'Other',
          ne: voter.gender === 'male' ? 'पुरुष' : voter.gender === 'female' ? 'महिला' : 'अन्य'
        };
      case 'spouse':
        return spouseName;
      case 'parents':
        return parentsName;
      case 'caste': 
        return voter.caste || detected.caste;
      case 'surname': 
        return voter.surname || detected.surname;
      case 'tole': 
        return tole;
      case 'phone': 
        return voter.phone || '-';
      case 'voterStatus': 
        return voter.voterStatus || 'available';
      default: 
        return '-';
    }
  };

  // Render cell content with bilingual display
  const renderCellContent = (value: { en: string; ne: string } | string | number, columnKey: string): React.ReactNode => {
    if (typeof value === 'object' && 'en' in value && 'ne' in value) {
      return (
        <div className="flex flex-col">
          <span className="text-sm">{value.en}</span>
          <span className="text-xs text-muted-foreground font-nepali">{value.ne}</span>
        </div>
      );
    }
    
    const stringValue = String(value);
    const hasNepali = containsNepali(stringValue);
    
    return (
      <span className={cn(hasNepali && "font-nepali")}>{stringValue}</span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Folder-like Navigation */}
      <Card className="card-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FolderOpen className="h-4 w-4 text-accent" />
            {t('edit.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {effectiveMunicipality?.name || 'Select Municipality'}
            </span>
            {selectedWard && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {currentWard?.name}
                </span>
                <Badge variant="secondary" className="ml-2">
                  {allWardVoters.length} voters
                </Badge>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Municipality Selection - Only show if multiple exist */}
            {municipalities.length > 1 && (
              <div className="space-y-2">
                <Label>{t('common.municipality')}</Label>
                <Select 
                  value={selectedMunicipality} 
                  onValueChange={(v) => { setSelectedMunicipality(v); setSelectedWard(''); setCurrentPage(1); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Municipality" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipalities.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Ward Selection - Show if municipality is selected/auto-selected */}
            {effectiveMunicipality && (
              <div className="space-y-2">
                <Label>{t('common.ward')}</Label>
                <Select value={selectedWard} onValueChange={(v) => { setSelectedWard(v); setCurrentPage(1); clearFilters(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('edit.selectWard')} />
                  </SelectTrigger>
                  <SelectContent>
                    {effectiveMunicipality.wards.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          {w.name}
                          <Badge variant="secondary" className="ml-2">
                            {w.voters.length}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search */}
            {selectedWard && (
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, surname..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {/* Toggle Filters */}
            {selectedWard && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={showFilters ? "default" : "outline"} 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                  <Button 
                    variant={showColumnManager ? "default" : "outline"} 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowColumnManager(!showColumnManager)}
                  >
                    {showColumnManager ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    Columns
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && selectedWard && (
            <div className="mt-4 pt-4 border-t border-border space-y-4">
              {/* Gender Multi-select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gender (लिङ्ग)</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'male', label: 'Male', labelNe: 'पुरुष' },
                    { value: 'female', label: 'Female', labelNe: 'महिला' },
                    { value: 'other', label: 'Other', labelNe: 'अन्य' },
                  ].map(g => (
                    <Button
                      key={g.value}
                      variant={filterGenders.includes(g.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFilter(filterGenders, setFilterGenders, g.value)}
                      className="gap-1"
                    >
                      {filterGenders.includes(g.value) && <Check className="h-3 w-3" />}
                      {g.label} ({g.labelNe})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Caste Multi-select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Caste (जात)</Label>
                <div className="flex flex-wrap gap-2">
                  {[...CASTE_CATEGORIES, { name: 'Other', nameNe: 'अन्य' }].map(cat => (
                    <Button
                      key={cat.name}
                      variant={filterCastes.includes(cat.name) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFilter(filterCastes, setFilterCastes, cat.name)}
                      className="gap-1"
                    >
                      {filterCastes.includes(cat.name) && <Check className="h-3 w-3" />}
                      {cat.name} ({cat.nameNe})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Surname Multi-select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Surname (थर)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {filterSurnames.length === 0 
                        ? "Select Surnames..." 
                        : `${filterSurnames.length} surname(s) selected`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 max-h-60 overflow-y-auto bg-popover" align="start">
                    <div className="space-y-1">
                      {uniqueSurnames.map(s => (
                        <div
                          key={s}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted",
                            filterSurnames.includes(s) && "bg-accent/10"
                          )}
                          onClick={() => toggleFilter(filterSurnames, setFilterSurnames, s)}
                        >
                          <Checkbox checked={filterSurnames.includes(s)} className="pointer-events-none" />
                          <span className="text-sm">{s}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {filterSurnames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {filterSurnames.map(s => (
                      <Badge key={s} variant="secondary" className="gap-1">
                        {s}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter(filterSurnames, setFilterSurnames, s)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Age Range Multi-select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Age Range (उमेर)</Label>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGES.filter(r => r.value !== 'all').map(range => (
                    <Button
                      key={range.value}
                      variant={filterAgeRanges.includes(range.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFilter(filterAgeRanges, setFilterAgeRanges, range.value)}
                      className="gap-1"
                    >
                      {filterAgeRanges.includes(range.value) && <Check className="h-3 w-3" />}
                      {range.label}
                    </Button>
                  ))}
                </div>
                {filterAgeRanges.includes('custom') && (
                  <div className="flex gap-2 mt-2">
                    <Input 
                      type="number" 
                      placeholder="Min Age" 
                      value={filterAgeMin}
                      onChange={(e) => setFilterAgeMin(e.target.value)}
                      className="w-24"
                    />
                    <span className="self-center">to</span>
                    <Input 
                      type="number" 
                      placeholder="Max Age" 
                      value={filterAgeMax}
                      onChange={(e) => setFilterAgeMax(e.target.value)}
                      className="w-24"
                    />
                  </div>
                )}
              </div>

              {/* Voter Status Multi-select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Voter Status (स्थिति)</Label>
                <div className="flex flex-wrap gap-2">
                  {VOTER_STATUS_OPTIONS.map(status => (
                    <Button
                      key={status.value}
                      variant={filterVoterStatuses.includes(status.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFilter(filterVoterStatuses, setFilterVoterStatuses, status.value)}
                      className={cn("gap-1", filterVoterStatuses.includes(status.value) ? "" : status.color)}
                    >
                      {filterVoterStatuses.includes(status.value) && <Check className="h-3 w-3" />}
                      {status.icon}
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Clear Filters & Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  {(filterGenders.length > 0 || filterCastes.length > 0 || filterSurnames.length > 0 || filterAgeRanges.length > 0 || filterVoterStatuses.length > 0) && (
                    <>
                      <span className="text-sm text-muted-foreground">Active filters:</span>
                      {filterGenders.length > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          {filterGenders.length} gender(s)
                          <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterGenders([])} />
                        </Badge>
                      )}
                      {filterCastes.length > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          {filterCastes.length} caste(s)
                          <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterCastes([])} />
                        </Badge>
                      )}
                      {filterSurnames.length > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          {filterSurnames.length} surname(s)
                          <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterSurnames([])} />
                        </Badge>
                      )}
                      {filterAgeRanges.length > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          {filterAgeRanges.length} age range(s)
                          <X className="h-3 w-3 cursor-pointer" onClick={() => { setFilterAgeRanges([]); setFilterAgeMin(''); setFilterAgeMax(''); }} />
                        </Badge>
                      )}
                      {filterVoterStatuses.length > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          {filterVoterStatuses.length} status(es)
                          <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterVoterStatuses([])} />
                        </Badge>
                      )}
                    </>
                  )}
                  <Badge variant="outline" className="border-accent text-accent">
                    Total: {voters.length} voters
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Column Manager */}
          {showColumnManager && selectedWard && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-4 mb-3">
                <Label className="flex items-center gap-2">
                  <Columns3 className="h-4 w-4" />
                  Manage Columns (स्तम्भ प्रबन्धन)
                </Label>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GripVertical className="h-3 w-3" />
                  <span>Drag column headers to reorder</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {ALL_COLUMNS.map(col => (
                  <div
                    key={col.key}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                      visibleColumns.includes(col.key) 
                        ? "bg-primary/10 border-primary/30" 
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    )}
                    onClick={() => toggleColumn(col.key)}
                  >
                    <Checkbox
                      checked={visibleColumns.includes(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{col.label}</div>
                      <div className="text-xs text-muted-foreground font-nepali truncate">{col.labelNe}</div>
                    </div>
                    {visibleColumns.includes(col.key) ? (
                      <Eye className="h-3 w-3 text-primary shrink-0" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setVisibleColumns(DEFAULT_COLUMN_ORDER)}
                  className="text-xs"
                >
                  Reset to Default
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.key))}
                  className="text-xs"
                >
                  Show All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setColumnOrder(DEFAULT_COLUMN_ORDER)}
                  className="text-xs"
                >
                  Reset Order
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      {selectedWard && currentWard ? (
        <Card className="card-shadow border-border/50">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base font-semibold">
              <div className="flex items-center gap-2">
                <span>{currentWard.name} - {effectiveMunicipality?.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{voters.length} records</Badge>
                {(filterGenders.length > 0 || filterCastes.length > 0 || filterSurnames.length > 0 || filterAgeRanges.length > 0 || filterVoterStatuses.length > 0 || searchTerm) && (
                  <Badge variant="outline" className="border-accent text-accent">Filtered</Badge>
                )}
                {/* Bulk Surname Replace */}
                {effectiveMunicipality && (
                  <BulkSurnameReplace
                    municipalityId={effectiveMunicipality.id}
                    wardId={selectedWard}
                    voters={allWardVoters}
                    onReplace={updateVoterRecord}
                  />
                )}
                {/* Download Button */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          const fileName = `${effectiveMunicipality?.name}_${currentWard?.name}_voters`;
                          exportToExcel(voters, fileName);
                          toast.success('Excel file downloaded');
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        Excel (.xlsx)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          const fileName = `${effectiveMunicipality?.name}_${currentWard?.name}_voters`;
                          exportToCSV(voters, fileName);
                          toast.success('CSV file downloaded');
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        CSV
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {voters.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No voters found matching your criteria</p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear all filters
                </Button>
              </div>
            ) : (
                <>
                <ScrollArea className="w-full">
                  <div className="min-w-[800px]">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleColumnDragEnd}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <SortableContext items={orderedVisibleColumns.map(c => c.key)} strategy={horizontalListSortingStrategy}>
                              {orderedVisibleColumns.map(col => (
                                <SortableHeaderCell
                                  key={col.key}
                                  column={col}
                                  isVisible={visibleColumns.includes(col.key)}
                                  onToggleVisibility={() => toggleColumn(col.key)}
                                />
                              ))}
                            </SortableContext>
                            <TableHead className="text-right sticky right-0 bg-background z-10 w-[80px]">
                              <div>Actions</div>
                              <div className="text-xs text-muted-foreground font-nepali">कार्य</div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedVoters.map((voter, index) => (
                            <TableRow key={voter.id} className={voter.isEdited ? 'bg-warning/5' : ''}>
                              {orderedVisibleColumns.map(col => {
                                const value = getCellValue(voter, col.key, index);
                                return (
                                  <TableCell 
                                    key={col.key}
                                    className={cn(
                                      col.key === 'sn' && "font-mono text-sm text-muted-foreground sticky left-0 bg-background z-10",
                                      col.key === 'voterId' && "font-mono text-xs font-medium",
                                      col.key === 'fullName' && "font-medium"
                                    )}
                                  >
                                    {col.key === 'caste' ? (
                                      <Badge variant="outline" className="text-xs font-nepali">
                                        {renderCellContent(value, col.key)}
                                      </Badge>
                                    ) : col.key === 'surname' ? (
                                      <span className="text-sm font-nepali">
                                        {renderCellContent(value, col.key)}
                                      </span>
                                    ) : col.key === 'voterStatus' ? (
                                      <VoterStatusCell 
                                        status={(typeof value === 'string' ? value : 'available') as VoterStatus} 
                                        voter={voter}
                                        municipalityId={effectiveMunicipality?.id}
                                        wardId={selectedWard}
                                        onUpdate={updateVoterRecord}
                                      />
                                    ) : (
                                      renderCellContent(value, col.key)
                                    )}
                                  </TableCell>
                                );
                              })}
                            <TableCell className="text-right sticky right-0 bg-background z-10">
                              <div className="flex justify-end gap-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7"
                                      onClick={() => handleEditClick(voter)}
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <Edit3 className="h-5 w-5" />
                                        {t('edit.voterRecord')}
                                      </DialogTitle>
                                    </DialogHeader>
                                    
                                    <ScrollArea className="flex-1 pr-4">
                                      <Tabs defaultValue="basic" className="w-full">
                                        <TabsList className="grid w-full grid-cols-4 mb-4">
                                          <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                          <TabsTrigger value="family">Family</TabsTrigger>
                                          <TabsTrigger value="party">Party</TabsTrigger>
                                          <TabsTrigger value="notes">Notes</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="basic" className="space-y-4">
                                          {/* Show Original Data Toggle */}
                                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4 text-muted-foreground" />
                                              <span className="text-sm">{t('edit.originalData')}</span>
                                            </div>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => setShowOriginalData(!showOriginalData)}
                                            >
                                              {showOriginalData ? 'Hide' : 'Show'}
                                            </Button>
                                          </div>

                                          {showOriginalData && editingVoter && (
                                            <div className="p-4 rounded-lg bg-muted/30 border border-border">
                                              <p className="text-sm font-medium mb-2">Original File Data:</p>
                                              <div className="grid grid-cols-2 gap-2 text-xs">
                                                {Object.entries(editingVoter.originalData).map(([key, value]) => (
                                                  <div key={key} className="flex justify-between gap-2">
                                                    <span className="text-muted-foreground">{key}:</span>
                                                    <span className="font-medium truncate">{value}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Basic Fields */}
                                          <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                              <Label>Full Name</Label>
                                              <Input
                                                value={editForm.fullName || ''}
                                                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Age</Label>
                                              <Input
                                                type="number"
                                                value={editForm.age || ''}
                                                onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) })}
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Gender</Label>
                                              <Select 
                                                value={editForm.gender} 
                                                onValueChange={(v) => setEditForm({ ...editForm, gender: v as any })}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="male">Male</SelectItem>
                                                  <SelectItem value="female">Female</SelectItem>
                                                  <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Caste</Label>
                                              <Select 
                                                value={editForm.caste} 
                                                onValueChange={(v) => setEditForm({ ...editForm, caste: v })}
                                              >
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
                                              <Label>Surname</Label>
                                              <Input
                                                value={editForm.surname || ''}
                                                onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                                              />
                                            </div>
                                            
                                            {/* Enhanced Tole Input */}
                                            <div className="space-y-2">
                                              <Label className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                {t('edit.tole')} / टोल
                                              </Label>
                                              <Select 
                                                value={editForm.tole} 
                                                onValueChange={(v) => {
                                                  if (v === '__custom__') {
                                                    // Keep select empty, use custom input
                                                    setEditForm({ ...editForm, tole: '' });
                                                  } else {
                                                    setEditForm({ ...editForm, tole: v });
                                                    setCustomTole('');
                                                  }
                                                }}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select or add Tole" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {uniqueToles.map(tole => (
                                                    <SelectItem key={tole} value={tole}>{tole}</SelectItem>
                                                  ))}
                                                  <SelectItem value="__custom__">
                                                    <span className="flex items-center gap-2">
                                                      <Plus className="h-3 w-3" />
                                                      Add New Tole
                                                    </span>
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                              {/* Custom Tole Input */}
                                              {(!editForm.tole || editForm.tole === '__custom__') && (
                                                <Input
                                                  placeholder="Enter new tole name..."
                                                  value={customTole}
                                                  onChange={(e) => setCustomTole(e.target.value)}
                                                  className="mt-2"
                                                />
                                              )}
                                            </div>
                                            
                                            <div className="space-y-2">
                                              <Label>Occupation</Label>
                                              <Select 
                                                value={editForm.occupation} 
                                                onValueChange={(v) => setEditForm({ ...editForm, occupation: v })}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select Occupation" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {OCCUPATIONS.map(occ => (
                                                    <SelectItem key={occ} value={occ}>{occ}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Phone</Label>
                                              <Input
                                                value={editForm.phone || ''}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                              />
                                            </div>
                                          </div>
                                        </TabsContent>

                                        <TabsContent value="family" className="space-y-4">
                                          <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                                            <Checkbox
                                              checked={editForm.isMainFamilyMember}
                                              onCheckedChange={(checked) => 
                                                setEditForm({ ...editForm, isMainFamilyMember: !!checked })
                                              }
                                            />
                                            <Label>This person is the main family member</Label>
                                          </div>

                                          {/* AI Family Suggestions */}
                                          <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-accent" />
                                                <span className="font-medium text-sm">AI Family Detection</span>
                                              </div>
                                              <Button
                                                variant={showAISuggestions ? "default" : "outline"}
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => setShowAISuggestions(!showAISuggestions)}
                                              >
                                                <Wand2 className="h-4 w-4" />
                                                {showAISuggestions ? 'Hide Suggestions' : 'Find Family Members'}
                                              </Button>
                                            </div>
                                            
                                            {showAISuggestions && (
                                              <div className="space-y-2">
                                                <p className="text-xs text-muted-foreground">
                                                  AI suggestions based on surname, location, and age patterns
                                                </p>
                                                <ScrollArea className="h-[200px] border rounded-lg bg-background p-2">
                                                  {aiSuggestedFamily.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-4">
                                                      No potential family members found
                                                    </p>
                                                  ) : (
                                                    aiSuggestedFamily.map(({ voter, score, reasons }) => (
                                                      <div 
                                                        key={voter.id}
                                                        className="flex items-center justify-between p-3 mb-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                                      >
                                                        <div className="flex-1">
                                                          <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium">{voter.fullName}</p>
                                                            <Badge variant="outline" className="text-xs">
                                                              {score}% match
                                                            </Badge>
                                                          </div>
                                                          <p className="text-xs text-muted-foreground">
                                                            {voter.age} years, {voter.gender}
                                                          </p>
                                                          <div className="flex flex-wrap gap-1 mt-1">
                                                            {reasons.map((reason, i) => (
                                                              <Badge key={i} variant="secondary" className="text-[10px]">
                                                                {reason}
                                                              </Badge>
                                                            ))}
                                                          </div>
                                                        </div>
                                                        <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-8 w-8"
                                                          onClick={() => addAISuggestedFamily(voter.id)}
                                                        >
                                                          <UserPlus className="h-4 w-4" />
                                                        </Button>
                                                      </div>
                                                    ))
                                                  )}
                                                </ScrollArea>
                                              </div>
                                            )}
                                          </div>

                                          <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                              <Users className="h-4 w-4" />
                                              Family Members ({editForm.familyMemberIds?.length || 0})
                                            </Label>
                                            
                                            {/* Selected family members */}
                                            {editForm.familyMemberIds && editForm.familyMemberIds.length > 0 && (
                                              <div className="flex flex-wrap gap-2 mb-3">
                                                {editForm.familyMemberIds.map(id => {
                                                  const member = allWardVoters.find(v => v.id === id);
                                                  return member ? (
                                                    <Badge key={id} variant="secondary" className="gap-1">
                                                      {member.fullName}
                                                      <X 
                                                        className="h-3 w-3 cursor-pointer" 
                                                        onClick={() => toggleFamilyMember(id)}
                                                      />
                                                    </Badge>
                                                  ) : null;
                                                })}
                                              </div>
                                            )}

                                            {/* Search family members */}
                                            <div className="relative mb-2">
                                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                              <Input
                                                placeholder="Search by name or surname..."
                                                value={familySearchTerm}
                                                onChange={(e) => setFamilySearchTerm(e.target.value)}
                                                className="pl-9"
                                              />
                                            </div>

                                            {/* Add family member */}
                                            <ScrollArea className="h-[200px] border rounded-lg p-2">
                                              {filteredFamilyMembers.map(v => (
                                                <div 
                                                  key={v.id}
                                                  className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
                                                  onClick={() => toggleFamilyMember(v.id)}
                                                >
                                                  <div>
                                                    <p className="text-sm font-medium">{v.fullName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                      {v.age} years, {v.gender}
                                                    </p>
                                                  </div>
                                                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                              ))}
                                            </ScrollArea>
                                          </div>
                                        </TabsContent>

                                        <TabsContent value="party" className="space-y-4">
                                          <Label>Political Party Affiliation (Multi-select)</Label>
                                          <div className="grid grid-cols-2 gap-2">
                                            {POLITICAL_PARTIES.map(party => (
                                              <div 
                                                key={party.name}
                                                className={cn(
                                                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                                                  editForm.partyAffiliations?.includes(party.name)
                                                    ? "border-accent bg-accent/10"
                                                    : "border-border hover:bg-muted/50"
                                                )}
                                                onClick={() => togglePartyAffiliation(party.name)}
                                              >
                                                <Checkbox 
                                                  checked={editForm.partyAffiliations?.includes(party.name)}
                                                  className="pointer-events-none"
                                                />
                                                <div>
                                                  <p className="text-sm font-medium">{party.name}</p>
                                                  <p className="text-xs text-muted-foreground">{party.short}</p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </TabsContent>

                                        <TabsContent value="notes" className="space-y-4">
                                          <Label>Note Tags (Multi-select)</Label>
                                          <div className="flex flex-wrap gap-2">
                                            {NOTE_TAGS.map(tag => (
                                              <Badge
                                                key={tag}
                                                variant={editForm.notes?.includes(tag) ? "default" : "outline"}
                                                className="cursor-pointer"
                                                onClick={() => toggleNote(tag)}
                                              >
                                                {tag}
                                              </Badge>
                                            ))}
                                          </div>

                                          <div className="space-y-2">
                                            <Label>Custom Note</Label>
                                            <Textarea
                                              value={editForm.customNote || ''}
                                              onChange={(e) => setEditForm({ ...editForm, customNote: e.target.value })}
                                              placeholder="Add any additional notes..."
                                              rows={4}
                                            />
                                          </div>
                                        </TabsContent>
                                      </Tabs>
                                    </ScrollArea>

                                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                      <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogClose>
                                      <DialogClose asChild>
                                        <Button onClick={handleSaveEdit} className="gap-2">
                                          <Save className="h-4 w-4" />
                                          Save Changes
                                        </Button>
                                      </DialogClose>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                {voter.isEdited && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => handleRevert(voter.id)}
                                  >
                                    <Undo2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </DndContext>
                  </div>
                </ScrollArea>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, voters.length)} of {voters.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-3 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="card-shadow border-border/50">
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-semibold">{t('edit.selectWardPrompt')}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {t('edit.selectWardDescription')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
