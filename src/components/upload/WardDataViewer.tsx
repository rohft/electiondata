import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Users,
  User,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  X } from
'lucide-react';
import { cn } from '@/lib/utils';
import { ParsedRecord } from '@/lib/fileParser';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'@/components/ui/table';

interface WardUploadData {
  wardNumber: number;
  file: File | null;
  records: ParsedRecord[];
  status: 'pending' | 'uploaded' | 'error';
  fileName?: string;
}

interface WardDataViewerProps {
  wards: WardUploadData[];
  municipalityName: string;
  selectedWardIndex: number;
  onWardSelect: (index: number) => void;
}

interface WardStats {
  total: number;
  male: number;
  female: number;
}

export const WardDataViewer = ({
  wards,
  municipalityName,
  selectedWardIndex,
  onWardSelect
}: WardDataViewerProps) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Get only wards with data
  const uploadedWards = useMemo(() =>
  wards.filter((w) => w.status === 'uploaded' && w.records.length > 0),
  [wards]
  );

  const currentWard = uploadedWards[selectedWardIndex];
  const records = currentWard?.records || [];

  // Calculate stats
  const stats: WardStats = useMemo(() => {
    const total = records.length;
    const male = records.filter((r) => r.gender === 'male').length;
    const female = records.filter((r) => r.gender === 'female').length;
    return { total, male, female };
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch = searchQuery === '' ||
      record.voterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.voterId.includes(searchQuery);

      const matchesGender = genderFilter === 'all' || record.gender === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [records, searchQuery, genderFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleWardChange = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ?
    Math.max(0, selectedWardIndex - 1) :
    Math.min(uploadedWards.length - 1, selectedWardIndex + 1);
    onWardSelect(newIndex);
    setCurrentPage(1);
    setSearchQuery('');
    setGenderFilter('all');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setGenderFilter('all');
    setCurrentPage(1);
  };

  if (uploadedWards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">No data available</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Please go back and upload files for at least one ward
        </p>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Ward Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleWardChange('prev')}
            disabled={selectedWardIndex === 0}>

            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center min-w-[200px]">
            <h3 className="text-lg font-semibold text-foreground">
              {municipalityName} - Ward {currentWard?.wardNumber}
            </h3>
            <p className="text-xs text-muted-foreground">
              {selectedWardIndex + 1} of {uploadedWards.length} uploaded wards
            </p>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleWardChange('next')}
            disabled={selectedWardIndex === uploadedWards.length - 1}>

            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Ward Jump */}
        <Select
          value={selectedWardIndex.toString()}
          onValueChange={(v) => {
            onWardSelect(parseInt(v));
            setCurrentPage(1);
          }}>

          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Jump to ward" />
          </SelectTrigger>
          <SelectContent>
            {uploadedWards.map((ward, idx) =>
            <SelectItem key={ward.wardNumber} value={idx.toString()}>
                Ward {ward.wardNumber}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-accent" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t('segments.totalVoters')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.male.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t('segments.male')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.female.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t('segments.female')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or voter ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9" />

            </div>
            
            <Select value={genderFilter} onValueChange={(v) => {
              setGenderFilter(v);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || genderFilter !== 'all') &&
            <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            }
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
      <Card className="border-border/50">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[100px]">Voter ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[60px]">Age</TableHead>
                <TableHead className="w-[80px]">Gender</TableHead>
                <TableHead>Spouse/Parents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((record, idx) =>
              <TableRow key={record.voterId || idx}>
                  <TableCell className="font-mono text-xs">{record.voterId || '-'}</TableCell>
                  <TableCell className="font-medium">{record.voterName}</TableCell>
                  <TableCell>{record.age || '-'}</TableCell>
                  <TableCell>
                    <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      record.gender === 'male' && 'border-blue-500/50 text-blue-500',
                      record.gender === 'female' && 'border-pink-500/50 text-pink-500'
                    )}>

                      {record.gender === 'male' ? 'M' : record.gender === 'female' ? 'F' : 'O'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {record.spouse || record.parents || '-'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Pagination */}
      {totalPages > 1 &&
      <div className="flex items-center justify-center gap-2">
          <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}>

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
                onClick={() => setCurrentPage(pageNum)}>

                  {pageNum}
                </Button>);

          })}
          </div>
          
          <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}>

            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      }
    </div>);

};