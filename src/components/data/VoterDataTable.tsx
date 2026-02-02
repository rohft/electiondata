import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParsedRecord } from '@/lib/fileParser';
import { extractSurname, isNewarName, AGE_RANGES } from '@/lib/surnameUtils';
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
      return {
        ...record,
        sn: idx + 1,
        surname,
        subCaste,
        isNewar: isNewarName(record.voterName)
      };
    });
  }, [records]);

  // Get unique castes for filter
  const uniqueCastes = useMemo(() => {
    const castes = new Set(enrichedRecords.map(r => r.subCaste).filter(Boolean));
    return Array.from(castes).sort();
  }, [enrichedRecords]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = records.length;
    const male = records.filter(r => r.gender === 'male').length;
    const female = records.filter(r => r.gender === 'female').length;
    const newar = enrichedRecords.filter(r => r.isNewar).length;
    return { total, male, female, newar };
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
          <Badge variant="outline" className="gap-1 border-cyan-500/50 text-cyan-500">
            <UserCheck className="h-3 w-3" />
            {stats.newar.toLocaleString()} {t('segments.newar')}
          </Badge>
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

            {/* Caste Filter */}
            {uniqueCastes.length > 0 && (
              <Select value={casteFilter} onValueChange={(v) => {
                setCasteFilter(v);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('table.caste')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {uniqueCastes.map(caste => (
                    <SelectItem key={caste} value={caste}>
                      {caste}
                    </SelectItem>
                  ))}
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
        <ScrollArea className="h-[500px]">
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
                    <TableCell key={column.id} className={cn(column.width)}>
                      {column.id === 'sn' && (
                        <span className="font-mono text-sm text-muted-foreground">
                          {record.sn}
                        </span>
                      )}
                      {column.id === 'voterId' && (
                        <div className="font-mono text-sm">
                          <span className="block text-foreground">{record.voterId || '-'}</span>
                          {record.originalData?.['मतदाता नम्बर'] && (
                            <span className="block text-xs text-muted-foreground">
                              {record.originalData['मतदाता नम्बर']}
                            </span>
                          )}
                        </div>
                      )}
                      {column.id === 'voterName' && (
                        <div className="font-medium">
                          <span className="block">{record.voterName}</span>
                          {record.originalData?.['नाम'] && record.originalData['नाम'] !== record.voterName && (
                            <span className="block text-xs text-muted-foreground">
                              {record.originalData['नाम']}
                            </span>
                          )}
                        </div>
                      )}
                      {column.id === 'surname' && (
                        <div className="flex flex-col">
                          <span className="text-sm">{record.surname}</span>
                          {record.subCaste && (
                            <span className="text-xs text-muted-foreground">{record.subCaste}</span>
                          )}
                        </div>
                      )}
                      {column.id === 'age' && (
                        <div>
                          <span className="block">{record.age || '-'}</span>
                          {record.age && (
                            <span className="block text-xs text-muted-foreground">वर्ष</span>
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
                          <span className="text-[10px] opacity-70">{genderLabels[record.gender]?.ne}</span>
                        </Badge>
                      )}
                      {column.id === 'caste' && (
                        record.isNewar ? (
                          <Badge className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-0 flex flex-col items-center py-1 h-auto">
                            <span>Newar</span>
                            <span className="text-[10px] opacity-70">नेवार</span>
                          </Badge>
                        ) : record.subCaste ? (
                          <Badge variant="secondary" className="text-xs">
                            {record.subCaste}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )
                      )}
                      {column.id === 'centerName' && (
                        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                          {record.centerName || '-'}
                        </span>
                      )}
                      {column.id === 'spouse' && (
                        <span className="text-sm text-muted-foreground">
                          {record.spouse || '-'}
                        </span>
                      )}
                      {column.id === 'parents' && (
                        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
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
        </ScrollArea>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
