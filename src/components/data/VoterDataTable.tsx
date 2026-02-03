import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Users, 
  User, 
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Columns3,
  Settings2,
  RefreshCw,
  History,
  Filter,
  Check,
  GripVertical,
  Download,
  FileText,
  Eye,
  EyeOff,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParsedRecord } from '@/lib/fileParser';
import { extractSurname, isNewarName, AGE_RANGES } from '@/lib/surnameUtils';
import { detectCasteFromName, CASTE_CATEGORIES } from '@/lib/casteData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { exportToExcel, exportToCSV } from '@/lib/dataExporter';

// Helper to detect if text contains Nepali/Devanagari characters
const containsNepali = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  return /[\u0900-\u097F]/.test(text);
};

interface WardUploadData {
  wardNumber: number;
  file: File | null;
  records: ParsedRecord[];
  status: 'pending' | 'uploaded' | 'error';
  fileName?: string;
  versions?: Array<{
    id: string;
    fileName: string;
    records: ParsedRecord[];
    uploadedAt: Date;
  }>;
  currentVersionIndex?: number;
}

interface VoterDataTableProps {
  wards: WardUploadData[];
  municipalityName: string;
  selectedWardIndex: number;
  onWardSelect: (index: number) => void;
  onUploadMore?: () => void;
  onUpdateWard?: (wardIndex: number, file: File) => void;
}

interface ColumnConfig {
  id: string;
  labelKey: string;
  visible: boolean;
  width?: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'sn', labelKey: 'table.sn', visible: true, width: 'w-[60px]' },
  { id: 'voterId', labelKey: 'table.voterId', visible: true, width: 'w-[140px]' },
  { id: 'voterName', labelKey: 'table.name', visible: true },
  { id: 'surname', labelKey: 'table.surname', visible: true, width: 'w-[150px]' },
  { id: 'age', labelKey: 'table.age', visible: true, width: 'w-[80px]' },
  { id: 'gender', labelKey: 'table.gender', visible: true, width: 'w-[100px]' },
  { id: 'caste', labelKey: 'table.caste', visible: true, width: 'w-[120px]' },
  { id: 'centerName', labelKey: 'table.center', visible: false },
  { id: 'spouse', labelKey: 'table.spouse', visible: false },
  { id: 'parents', labelKey: 'table.parents', visible: true },
];

export const VoterDataTable = ({ 
  wards, 
  municipalityName, 
  selectedWardIndex, 
  onWardSelect,
  onUploadMore,
  onUpdateWard
}: VoterDataTableProps) => {
  const { t, getBilingual } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [ageRangeFilter, setAgeRangeFilter] = useState<string>('all');
  const [casteFilter, setCasteFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [compactMode, setCompactMode] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const itemsPerPage = 25;

  // Get only wards with data
  const uploadedWards = useMemo(() => 
    wards.filter(w => w.status === 'uploaded' && w.records.length > 0),
    [wards]
  );

  const pendingWards = useMemo(() => 
    wards.filter(w => w.status === 'pending'),
    [wards]
  );

  const currentWard = uploadedWards[selectedWardIndex];
  const records = currentWard?.records || [];

  // Enrich records with surname/caste data
  const enrichedRecords = useMemo(() => {
    return records.map((record, idx) => {
      const { surname, subCaste } = extractSurname(record.voterName);
      const detected = detectCasteFromName(record.voterName);
      return {
        ...record,
        sn: idx + 1,
        surname: record.surname || surname,
        subCaste: record.caste || detected.caste || subCaste,
        isNewar: isNewarName(record.voterName)
      };
    });
  }, [records]);

  // Get unique castes for filter (from CASTE_CATEGORIES)
  const uniqueCastes = useMemo(() => {
    const castesInData = new Set(enrichedRecords.map(r => r.subCaste).filter(Boolean));
    // Return castes from CASTE_CATEGORIES that exist in data, plus any others
    const orderedCastes = CASTE_CATEGORIES.map(c => c.name).filter(name => castesInData.has(name));
    const remaining = Array.from(castesInData).filter(c => !orderedCastes.includes(c)).sort();
    return [...orderedCastes, ...remaining];
  }, [enrichedRecords]);

  // Calculate stats by caste
  const stats = useMemo(() => {
    const total = records.length;
    const male = records.filter(r => r.gender === 'male').length;
    const female = records.filter(r => r.gender === 'female').length;
    
    // Count by caste
    const byCaste: Record<string, number> = {};
    enrichedRecords.forEach(r => {
      const caste = r.subCaste || 'Other';
      byCaste[caste] = (byCaste[caste] || 0) + 1;
    });
    
    return { total, male, female, byCaste };
  }, [records, enrichedRecords]);

  // Filter records
  const filteredRecords = useMemo(() => {
    const ageRange = AGE_RANGES.find(r => r.value === ageRangeFilter) || AGE_RANGES[0];
    
    return enrichedRecords.filter(record => {
      const matchesSearch = searchQuery === '' || 
        record.voterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.voterId.includes(searchQuery) ||
        record.surname.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGender = genderFilter === 'all' || record.gender === genderFilter;
      
      const matchesAge = ageRangeFilter === 'all' || 
        (record.age >= ageRange.min && record.age <= ageRange.max);
      
      const matchesCaste = casteFilter === 'all' || record.subCaste === casteFilter;
      
      return matchesSearch && matchesGender && matchesAge && matchesCaste;
    });
  }, [enrichedRecords, searchQuery, genderFilter, ageRangeFilter, casteFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleWardChange = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, selectedWardIndex - 1)
      : Math.min(uploadedWards.length - 1, selectedWardIndex + 1);
    onWardSelect(newIndex);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setGenderFilter('all');
    setAgeRangeFilter('all');
    setCasteFilter('all');
    setCurrentPage(1);
  };

  const toggleColumn = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const visibleColumns = columns.filter(col => col.visible);
  const hasActiveFilters = searchQuery || genderFilter !== 'all' || ageRangeFilter !== 'all' || casteFilter !== 'all';

  // Render bilingual text helper
  const renderBilingual = (enText: string, neText: string) => (
    <div className="flex flex-col leading-tight">
      <span className="text-sm">{enText}</span>
      <span className="text-xs text-muted-foreground">{neText}</span>
    </div>
  );

  // Get bilingual labels
  const genderLabels = {
    male: getBilingual('segments.male'),
    female: getBilingual('segments.female'),
    other: getBilingual('segments.other')
  };

  if (uploadedWards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">No data available</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Please upload files for at least one ward to view data
        </p>
        {onUploadMore && (
          <Button onClick={onUploadMore} className="mt-4">
            Upload Ward Data
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ward Selector & Stats Row */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Ward Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleWardChange('prev')}
            disabled={selectedWardIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Select 
            value={selectedWardIndex.toString()} 
            onValueChange={(v) => {
              onWardSelect(parseInt(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {uploadedWards.map((ward, idx) => (
                <SelectItem key={ward.wardNumber} value={idx.toString()}>
                  {municipalityName} - {t('common.ward')} {ward.wardNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleWardChange('next')}
            disabled={selectedWardIndex === uploadedWards.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {stats.total.toLocaleString()} {t('common.total')}
          </Badge>
          <Badge variant="outline" className="gap-1 border-blue-500/50 text-blue-500">
            <User className="h-3 w-3" />
            {stats.male.toLocaleString()} {t('segments.male')}
          </Badge>
          <Badge variant="outline" className="gap-1 border-pink-500/50 text-pink-500">
            <User className="h-3 w-3" />
            {stats.female.toLocaleString()} {t('segments.female')}
          </Badge>
          {/* Show top 3 castes */}
          {Object.entries(stats.byCaste)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([caste, count]) => (
              <Badge key={caste} variant="outline" className="gap-1">
                <UserCheck className="h-3 w-3" />
                {count.toLocaleString()} {caste}
              </Badge>
            ))}
        </div>

        {/* Version & Update Options */}
        <div className="flex items-center gap-2 ml-auto">
          {currentWard?.versions && currentWard.versions.length > 1 && (
            <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <History className="h-4 w-4" />
                  {t('upload.switchVersion')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('upload.switchVersion')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-4">
                  {currentWard.versions.map((version, idx) => (
                    <div
                      key={version.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                        idx === currentWard.currentVersionIndex 
                          ? "border-accent bg-accent/10" 
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div>
                        <p className="font-medium">{version.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {version.uploadedAt.toLocaleDateString()} - {version.records.length} records
                        </p>
                      </div>
                      {idx === currentWard.currentVersionIndex && (
                        <Badge>{t('common.current')}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {onUpdateWard && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv,.xlsx,.xls,.json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    onUpdateWard(selectedWardIndex, file);
                  }
                };
                input.click();
              }}
            >
              <RefreshCw className="h-4 w-4" />
              {t('upload.updateData')}
            </Button>
          )}

          {/* Download Button */}
          {currentWard && records.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('common.download')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      const fileName = `${municipalityName}_Ward${currentWard.wardNumber}_voters`;
                      // Convert enrichedRecords to ParsedRecord format for export
                      const recordsToExport = enrichedRecords.map(r => ({
                        ...r,
                        voterName: r.voterName,
                        voterId: r.voterId,
                        age: r.age,
                        gender: r.gender,
                        surname: r.surname,
                        caste: r.subCaste || '',
                        spouse: r.spouse || '',
                        parents: r.parents || '',
                        originalData: r.originalData
                      }));
                      exportToExcel(recordsToExport as any, fileName);
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
                      const fileName = `${municipalityName}_Ward${currentWard.wardNumber}_voters`;
                      const recordsToExport = enrichedRecords.map(r => ({
                        ...r,
                        voterName: r.voterName,
                        voterId: r.voterId,
                        age: r.age,
                        gender: r.gender,
                        surname: r.surname,
                        caste: r.subCaste || '',
                        spouse: r.spouse || '',
                        parents: r.parents || '',
                        originalData: r.originalData
                      }));
                      exportToCSV(recordsToExport as any, fileName);
                      toast.success('CSV file downloaded');
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {pendingWards.length > 0 && onUploadMore && (
            <Button variant="outline" size="sm" onClick={onUploadMore}>
              {pendingWards.length} pending
            </Button>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`${t('common.search')}`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            
            {/* Gender Filter */}
            <Select value={genderFilter} onValueChange={(v) => {
              setGenderFilter(v);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t('table.gender')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="male">{t('segments.male')}</SelectItem>
                <SelectItem value="female">{t('segments.female')}</SelectItem>
                <SelectItem value="other">{t('segments.other')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Age Range Filter */}
            <Select value={ageRangeFilter} onValueChange={(v) => {
              setAgeRangeFilter(v);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t('table.age')} />
              </SelectTrigger>
              <SelectContent>
                {AGE_RANGES.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Caste Filter - All castes */}
            {uniqueCastes.length > 0 && (
              <Select value={casteFilter} onValueChange={(v) => {
                setCasteFilter(v);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder={t('table.caste')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')} ({t('table.caste')})</SelectItem>
                  {uniqueCastes.map(caste => {
                    const category = CASTE_CATEGORIES.find(c => c.name === caste);
                    return (
                      <SelectItem key={caste} value={caste}>
                        <span className="flex items-center gap-2">
                          {caste}
                          {category?.nameNe && <span className="text-xs text-muted-foreground font-nepali">({category.nameNe})</span>}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}

            {/* Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Columns3 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.visible}
                    onCheckedChange={() => toggleColumn(column.id)}
                  >
                    {t(column.labelKey)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Table Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Table Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                >
                  Compact Mode
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Showing {filteredRecords.length.toLocaleString()} of {records.length.toLocaleString()} records
            </p>
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages || 1}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-border/50 overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                <TableRow className="hover:bg-transparent">
                  {visibleColumns.map(column => {
                    const labels = getBilingual(column.labelKey);
                    return (
                      <TableHead 
                        key={column.id} 
                        className={cn(
                          "font-semibold text-foreground",
                          column.width,
                          column.id === 'sn' && "sticky left-0 bg-muted/80 z-20",
                          compactMode && "py-2"
                        )}
                      >
                        <div className="flex flex-col leading-tight">
                          <span>{labels.en}</span>
                          <span className="text-xs font-normal text-muted-foreground">{labels.ne}</span>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record) => (
                  <TableRow 
                    key={`${record.voterId}-${record.sn}`}
                    className={cn(
                      "group transition-colors",
                      compactMode && "[&_td]:py-1"
                    )}
                  >
                    {visibleColumns.map(column => (
                      <TableCell 
                        key={column.id} 
                        className={cn(
                          column.width,
                          column.id === 'sn' && "sticky left-0 bg-background z-10"
                        )}
                      >
                        {column.id === 'sn' && (
                          <span className="font-mono text-sm text-muted-foreground">
                            {record.sn}
                          </span>
                        )}
                        {column.id === 'voterId' && (
                          <div className="text-sm">
                            <span className={cn(
                              "block text-foreground",
                              containsNepali(record.voterId) ? "font-nepali" : "font-mono"
                            )}>
                              {record.voterId || '-'}
                            </span>
                            {record.originalData?.['मतदाता नं'] && record.originalData['मतदाता नं'] !== record.voterId && (
                              <span className="block text-xs text-muted-foreground font-nepali">
                                {record.originalData['मतदाता नं']}
                              </span>
                            )}
                          </div>
                        )}
                        {column.id === 'voterName' && (
                          <div className="font-medium min-w-[150px]">
                            <span className={cn(
                              "block",
                              containsNepali(record.voterName) && "font-nepali"
                            )}>
                              {record.voterName}
                            </span>
                            {record.originalData?.['मतदाताको नाम'] && record.originalData['मतदाताको नाम'] !== record.voterName && (
                              <span className="block text-xs text-muted-foreground font-nepali">
                                {record.originalData['मतदाताको नाम']}
                              </span>
                            )}
                          </div>
                        )}
                        {column.id === 'surname' && (
                          <div className="flex flex-col">
                            <span className={cn("text-sm", containsNepali(record.surname) && "font-nepali")}>
                              {record.surname}
                            </span>
                            {record.subCaste && (
                              <span className="text-xs text-muted-foreground">{record.subCaste}</span>
                            )}
                          </div>
                        )}
                        {column.id === 'age' && (
                          <div>
                            <span className="block">{record.age || '-'}</span>
                            {record.age && (
                              <span className="block text-xs text-muted-foreground font-nepali">वर्ष</span>
                            )}
                          </div>
                        )}
                        {column.id === 'gender' && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs flex flex-col items-center py-1 h-auto',
                              record.gender === 'male' && 'border-blue-500/50 text-blue-500 bg-blue-500/5',
                              record.gender === 'female' && 'border-pink-500/50 text-pink-500 bg-pink-500/5'
                            )}
                          >
                            <span>{genderLabels[record.gender]?.en || record.gender}</span>
                            <span className="text-[10px] opacity-70 font-nepali">{genderLabels[record.gender]?.ne}</span>
                          </Badge>
                        )}
                        {column.id === 'caste' && (
                          record.subCaste ? (
                            <Badge variant="secondary" className="text-xs flex flex-col items-center py-1 h-auto">
                              <span>{record.subCaste}</span>
                              {CASTE_CATEGORIES.find(c => c.name === record.subCaste)?.nameNe && (
                                <span className="text-[10px] opacity-70 font-nepali">
                                  {CASTE_CATEGORIES.find(c => c.name === record.subCaste)?.nameNe}
                                </span>
                              )}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )
                        )}
                        {column.id === 'centerName' && (
                          <span className={cn(
                            "text-sm text-muted-foreground truncate max-w-[200px] block",
                            containsNepali(record.centerName || '') && "font-nepali"
                          )}>
                            {record.centerName || '-'}
                          </span>
                        )}
                        {column.id === 'spouse' && (
                          <span className={cn(
                            "text-sm text-muted-foreground",
                            containsNepali(record.spouse || '') && "font-nepali"
                          )}>
                            {record.spouse || '-'}
                          </span>
                        )}
                        {column.id === 'parents' && (
                          <span className={cn(
                            "text-sm text-muted-foreground truncate max-w-[200px] block",
                            containsNepali(record.parents || '') && "font-nepali"
                          )}>
                            {record.parents || '-'}
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {paginatedRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                      <p className="text-muted-foreground">No records found matching your filters</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length}
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
            
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <span className="sm:hidden px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
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
    </div>
  );
};
