 import { useState, useMemo } from 'react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { 
   ChevronLeft, ChevronRight, Users, User, UserCheck, History, RefreshCw, Download, FileText
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { ParsedRecord } from '@/lib/fileParser';
 import { extractSurname, isNewarName } from '@/lib/surnameUtils';
 import { detectCasteFromName, CASTE_CATEGORIES } from '@/lib/casteData';
 import { SpreadsheetTable, DEFAULT_SPREADSHEET_COLUMNS } from './SpreadsheetTable';
 import { exportToExcel, exportToCSV } from '@/lib/dataExporter';
 import { toast } from 'sonner';
 
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
 
 export const VoterDataTable = ({ 
   wards, 
   municipalityName, 
   selectedWardIndex, 
   onWardSelect,
   onUploadMore,
   onUpdateWard
 }: VoterDataTableProps) => {
   const { t } = useLanguage();
   const [versionDialogOpen, setVersionDialogOpen] = useState(false);
 
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
 
   // Calculate stats
   const stats = useMemo(() => {
     const total = records.length;
     const male = records.filter(r => r.gender === 'male').length;
     const female = records.filter(r => r.gender === 'female').length;
     
     const byCaste: Record<string, number> = {};
     enrichedRecords.forEach(r => {
       const caste = r.subCaste || 'Other';
       byCaste[caste] = (byCaste[caste] || 0) + 1;
     });
     
     return { total, male, female, byCaste };
   }, [records, enrichedRecords]);
 
   const handleWardChange = (direction: 'prev' | 'next') => {
     const newIndex = direction === 'prev' 
       ? Math.max(0, selectedWardIndex - 1)
       : Math.min(uploadedWards.length - 1, selectedWardIndex + 1);
     onWardSelect(newIndex);
   };
 
   // getValue function for SpreadsheetTable
   const getValue = (row: typeof enrichedRecords[0], key: string, index: number): string | number => {
     switch (key) {
       case 'sn': return row.sn;
       case 'voterName': return row.voterName;
       case 'surname': return row.surname || '';
       case 'voterId': return row.voterId;
       case 'gender': return row.gender === 'male' ? 'पुरुष' : row.gender === 'female' ? 'महिला' : 'अन्य';
       case 'age': return row.age;
       case 'spouse': return row.spouse || row.originalData?.['पति/पत्नीको नाम'] || '';
       case 'parents': return row.parents || row.originalData?.['आमाबुबाको नाम'] || '';
       case 'caste': return row.subCaste || '';
       case 'subCaste': return row.originalData?.['जाति'] || '';
       case 'phone': return row.phone || row.originalData?.['मोबाइल नम्बर'] || '';
       case 'email': return row.email || row.originalData?.['इमेल'] || '';
       case 'occupation': return row.occupation || row.originalData?.['व्यवसाय'] || '';
       case 'tole': return row.tole || row.originalData?.['टोल'] || '';
       case 'family': return row.family || row.originalData?.['परिवार'] || '';
       case 'party': return row.party || row.originalData?.['पार्टि'] || '';
       default: return '-';
     }
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
             onValueChange={(v) => onWardSelect(parseInt(v))}
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
           <Badge variant="outline" className="gap-1 border-info/50 text-info">
             <User className="h-3 w-3" />
             {stats.male.toLocaleString()} {t('segments.male')}
           </Badge>
           <Badge variant="outline" className="gap-1 border-destructive/50 text-destructive">
             <User className="h-3 w-3" />
             {stats.female.toLocaleString()} {t('segments.female')}
           </Badge>
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
           
           {pendingWards.length > 0 && onUploadMore && (
             <Button variant="outline" size="sm" onClick={onUploadMore}>
               {pendingWards.length} pending
             </Button>
           )}
         </div>
       </div>
 
       {/* SpreadsheetTable */}
       <Card className="card-shadow border-border/50 p-4">
         <SpreadsheetTable
           data={enrichedRecords}
           columns={DEFAULT_SPREADSHEET_COLUMNS}
           getValue={getValue}
           getRowId={(row) => row.voterId || String(row.sn)}
           exportFileName={`${municipalityName}_Ward${currentWard?.wardNumber}_voters`}
           showSearch={true}
           showExport={true}
           showColumnToggle={true}
           showLanguageToggle={true}
           pageSize={25}
           emptyMessage="No voter records found"
         />
       </Card>
     </div>
   );
 };