 import { useState, useMemo, useCallback, useRef } from 'react';
 import { cn } from '@/lib/utils';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Checkbox } from '@/components/ui/checkbox';
 import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
 import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
 import {
   Search, Filter, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
   ArrowUpDown, ArrowUp, ArrowDown, X, Check, Edit3, Columns3, Languages, FileText
 } from 'lucide-react';
 import { exportToExcel, exportToCSV } from '@/lib/dataExporter';
 import { toast } from 'sonner';
import { toNepaliDigits } from '@/lib/nepaliDigits';
 
 // Column definition matching Excel headers
 export interface SpreadsheetColumn {
   key: string;
   labelNe: string;
   labelEn: string;
   width?: string;
   sticky?: boolean;
   sortable?: boolean;
   visible?: boolean;
 }
 
 // Default columns based on uploaded Excel file
 export const DEFAULT_SPREADSHEET_COLUMNS: SpreadsheetColumn[] = [
   { key: 'sn', labelNe: 'मतदाता क्र.सं.', labelEn: 'SN', width: 'w-16', sticky: true, sortable: true, visible: true },
   { key: 'voterName', labelNe: 'नाम', labelEn: 'Name', width: 'min-w-[180px]', sortable: true, visible: true },
   { key: 'surname', labelNe: 'थर', labelEn: 'Surname', width: 'w-28', sortable: true, visible: true },
   { key: 'voterId', labelNe: 'मतदाता परिचयपत्र नं.', labelEn: 'Voter ID', width: 'w-32', sortable: true, visible: true },
   { key: 'gender', labelNe: 'लिङ्ग', labelEn: 'Gender', width: 'w-24', sortable: true, visible: true },
   { key: 'age', labelNe: 'उमेर', labelEn: 'Age', width: 'w-20', sortable: true, visible: true },
   { key: 'spouse', labelNe: 'पति/पत्नीको नाम', labelEn: 'Spouse', width: 'w-40', visible: true },
   { key: 'parents', labelNe: 'आमाबुबाको नाम', labelEn: 'Parents', width: 'w-44', visible: true },
   { key: 'caste', labelNe: 'जात', labelEn: 'Caste', width: 'w-28', sortable: true, visible: true },
   { key: 'subCaste', labelNe: 'जाति', labelEn: 'Sub-caste', width: 'w-28', visible: false },
   { key: 'phone', labelNe: 'मोबाइल नम्बर', labelEn: 'Phone', width: 'w-32', visible: false },
   { key: 'email', labelNe: 'इमेल', labelEn: 'Email', width: 'w-40', visible: false },
   { key: 'occupation', labelNe: 'व्यवसाय', labelEn: 'Occupation', width: 'w-28', visible: false },
   { key: 'tole', labelNe: 'टोल', labelEn: 'Tole', width: 'w-32', visible: true },
   { key: 'family', labelNe: 'परिवार', labelEn: 'Family', width: 'w-24', visible: false },
   { key: 'party', labelNe: 'पार्टि', labelEn: 'Party', width: 'w-24', visible: false },
 ];
 
 type SortDirection = 'asc' | 'desc' | null;
 type DisplayLanguage = 'nepali' | 'english' | 'bilingual';
 
 // Helper to detect Nepali text
 const containsNepali = (text: string): boolean => {
   if (!text || typeof text !== 'string') return false;
   return /[\u0900-\u097F]/.test(text);
 };

  const hasAsciiDigits = (text: string) => /[0-9]/.test(text);
 
 interface SpreadsheetTableProps<T> {
   data: T[];
   columns?: SpreadsheetColumn[];
   getValue: (row: T, key: string, index: number) => string | number;
   onRowClick?: (row: T, index: number) => void;
   onRowEdit?: (row: T, index: number) => void;
   selectedRows?: string[];
   onSelectionChange?: (ids: string[]) => void;
   getRowId?: (row: T) => string;
   title?: string;
   exportFileName?: string;
   showSearch?: boolean;
   showFilters?: boolean;
   showExport?: boolean;
   showColumnToggle?: boolean;
   showLanguageToggle?: boolean;
   pageSize?: number;
   emptyMessage?: string;
   className?: string;
   headerExtra?: React.ReactNode;
 }
 
 export function SpreadsheetTable<T>({
   data,
   columns = DEFAULT_SPREADSHEET_COLUMNS,
   getValue,
   onRowClick,
   onRowEdit,
   selectedRows = [],
   onSelectionChange,
   getRowId = (row: any) => row.id || row.voterId || String(Math.random()),
   title,
   exportFileName = 'export',
   showSearch = true,
   showFilters = false,
   showExport = true,
   showColumnToggle = true,
   showLanguageToggle = true,
   pageSize = 25,
   emptyMessage = 'No data available',
   className,
   headerExtra,
 }: SpreadsheetTableProps<T>) {
   const [searchQuery, setSearchQuery] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [sortColumn, setSortColumn] = useState<string | null>(null);
   const [sortDirection, setSortDirection] = useState<SortDirection>(null);
   const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguage>('nepali');
   const [visibleColumns, setVisibleColumns] = useState<string[]>(
     columns.filter(c => c.visible !== false).map(c => c.key)
   );
   const tableRef = useRef<HTMLDivElement>(null);
 
   // Filter data based on search
   const filteredData = useMemo(() => {
     if (!searchQuery.trim()) return data;
     
     const query = searchQuery.toLowerCase();
     return data.filter((row, idx) => {
       return columns.some(col => {
         const value = String(getValue(row, col.key, idx) || '').toLowerCase();
         return value.includes(query);
       });
     });
   }, [data, searchQuery, columns, getValue]);
 
   // Sort data
   const sortedData = useMemo(() => {
     if (!sortColumn || !sortDirection) return filteredData;
     
     return [...filteredData].sort((a, b) => {
       const aVal = getValue(a, sortColumn, 0);
       const bVal = getValue(b, sortColumn, 0);
       
       if (typeof aVal === 'number' && typeof bVal === 'number') {
         return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
       }
       
       const comparison = String(aVal).localeCompare(String(bVal));
       return sortDirection === 'asc' ? comparison : -comparison;
     });
   }, [filteredData, sortColumn, sortDirection, getValue]);
 
   // Paginate
   const totalPages = Math.ceil(sortedData.length / pageSize);
   const paginatedData = useMemo(() => {
     const start = (currentPage - 1) * pageSize;
     return sortedData.slice(start, start + pageSize);
   }, [sortedData, currentPage, pageSize]);
 
   // Handlers
   const handleSort = useCallback((key: string) => {
     if (sortColumn === key) {
       if (sortDirection === 'asc') {
         setSortDirection('desc');
       } else if (sortDirection === 'desc') {
         setSortColumn(null);
         setSortDirection(null);
       }
     } else {
       setSortColumn(key);
       setSortDirection('asc');
     }
     setCurrentPage(1);
   }, [sortColumn, sortDirection]);
 
   const getSortIcon = (key: string) => {
     if (sortColumn !== key) {
       return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
     }
     return sortDirection === 'asc' 
       ? <ArrowUp className="h-3 w-3 text-accent" />
       : <ArrowDown className="h-3 w-3 text-accent" />;
   };
 
   const toggleColumn = (key: string) => {
     setVisibleColumns(prev => 
       prev.includes(key) 
         ? prev.filter(k => k !== key)
         : [...prev, key]
     );
   };
 
   const handleExport = (format: 'excel' | 'csv') => {
     const exportData = sortedData.map((row, idx) => {
       const obj: Record<string, any> = {};
       columns.forEach(col => {
         obj[col.labelEn] = getValue(row, col.key, idx);
       });
       return obj;
     });
     
     if (format === 'excel') {
       exportToExcel(exportData as any, exportFileName);
       toast.success('Excel file downloaded');
     } else {
       exportToCSV(exportData as any, exportFileName);
       toast.success('CSV file downloaded');
     }
   };
 
   const visibleColumnDefs = columns.filter(c => visibleColumns.includes(c.key));
 
   const getColumnLabel = (col: SpreadsheetColumn) => {
     if (displayLanguage === 'english') return col.labelEn;
     if (displayLanguage === 'nepali') return col.labelNe;
     return (
       <div className="flex flex-col leading-tight">
         <span className="font-nepali">{col.labelNe}</span>
         <span className="text-xs text-muted-foreground">{col.labelEn}</span>
       </div>
     );
   };
 
    const renderCellValue = (value: string | number, key: string) => {
      const strValue = String(value ?? '');
      const isNepaliText = containsNepali(strValue);
      const showNepaliNumerals = displayLanguage !== 'english' && hasAsciiDigits(strValue);
      const renderedText = showNepaliNumerals ? toNepaliDigits(strValue) : (strValue || '-');
     
     // Gender display
     if (key === 'gender') {
       const isMale = strValue.toLowerCase() === 'male' || strValue === 'पुरुष';
       const isFemale = strValue.toLowerCase() === 'female' || strValue === 'महिला';
       
       return (
         <Badge 
           variant="outline" 
           className={cn(
             'text-xs font-medium',
             isMale && 'border-info/50 text-info bg-info/5',
             isFemale && 'border-destructive/50 text-destructive bg-destructive/5'
           )}
         >
           {displayLanguage === 'english' 
             ? (isMale ? 'Male' : isFemale ? 'Female' : strValue)
             : displayLanguage === 'nepali'
             ? (isMale ? 'पुरुष' : isFemale ? 'महिला' : strValue)
             : (
               <span className="flex flex-col items-center">
                 <span className="font-nepali">{isMale ? 'पुरुष' : isFemale ? 'महिला' : strValue}</span>
                 <span className="text-[10px] opacity-70">{isMale ? 'Male' : isFemale ? 'Female' : ''}</span>
               </span>
             )
           }
         </Badge>
       );
     }
     
     // Age display
     if (key === 'age' && value) {
        const ageText = showNepaliNumerals ? toNepaliDigits(value) : String(value);
       return (
          <span className={cn("font-medium", displayLanguage !== 'english' && "font-nepali")}>
            {ageText}{' '}
            <span className="text-xs text-muted-foreground font-nepali">वर्ष</span>
          </span>
       );
     }
     
     return (
        <span className={cn((isNepaliText || showNepaliNumerals) && 'font-nepali')}>{renderedText}</span>
     );
   };
 
   return (
     <div className={cn("space-y-3", className)}>
       {/* Toolbar */}
       <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
         <div className="flex items-center gap-3 flex-wrap">
           {title && (
             <h3 className="text-sm font-semibold text-foreground">{title}</h3>
           )}
           <Badge variant="secondary" className="font-mono">
             {sortedData.length.toLocaleString()} records
           </Badge>
           {headerExtra}
         </div>
         
         <div className="flex items-center gap-2 flex-wrap">
           {/* Search */}
           {showSearch && (
             <div className="relative">
               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 placeholder="खोज्नुहोस्..."
                 value={searchQuery}
                 onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                 className="pl-8 w-48 h-9"
               />
             </div>
           )}
           
           {/* Language Toggle */}
           {showLanguageToggle && (
             <Popover>
               <PopoverTrigger asChild>
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className={cn("h-9 gap-1.5", displayLanguage !== 'bilingual' && 'border-accent')}
                 >
                   <Languages className="h-4 w-4" />
                   {displayLanguage === 'nepali' ? 'ने' : displayLanguage === 'english' ? 'EN' : 'NE/EN'}
                 </Button>
               </PopoverTrigger>
               <PopoverContent align="end" className="w-44 p-1.5">
                 {[
                   { value: 'nepali', label: 'नेपाली मात्र', sub: 'Nepali Only' },
                   { value: 'english', label: 'English Only', sub: 'अंग्रेजी' },
                   { value: 'bilingual', label: 'दुवै / Both', sub: 'Bilingual' },
                 ].map(opt => (
                   <Button
                     key={opt.value}
                     variant={displayLanguage === opt.value ? 'secondary' : 'ghost'}
                     size="sm"
                     className="w-full justify-start gap-2 h-9"
                     onClick={() => setDisplayLanguage(opt.value as DisplayLanguage)}
                   >
                     {displayLanguage === opt.value && <Check className="h-3 w-3" />}
                     <span className="font-nepali">{opt.label}</span>
                   </Button>
                 ))}
               </PopoverContent>
             </Popover>
           )}
           
           {/* Column Toggle */}
           {showColumnToggle && (
             <Popover>
               <PopoverTrigger asChild>
                 <Button variant="outline" size="sm" className="h-9 gap-1.5">
                   <Columns3 className="h-4 w-4" />
                   Columns
                 </Button>
               </PopoverTrigger>
               <PopoverContent align="end" className="w-56 p-2">
                 <div className="space-y-1 max-h-64 overflow-y-auto">
                   {columns.map(col => (
                     <label 
                       key={col.key}
                       className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                     >
                       <Checkbox 
                         checked={visibleColumns.includes(col.key)}
                         onCheckedChange={() => toggleColumn(col.key)}
                       />
                       <span className="text-sm">{col.labelEn}</span>
                       <span className="text-xs text-muted-foreground font-nepali ml-auto">{col.labelNe}</span>
                     </label>
                   ))}
                 </div>
               </PopoverContent>
             </Popover>
           )}
           
           {/* Export */}
           {showExport && (
             <Popover>
               <PopoverTrigger asChild>
                 <Button variant="outline" size="sm" className="h-9 gap-1.5">
                   <Download className="h-4 w-4" />
                   Export
                 </Button>
               </PopoverTrigger>
               <PopoverContent align="end" className="w-36 p-1.5">
                 <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => handleExport('excel')}>
                   <FileText className="h-4 w-4" /> Excel
                 </Button>
                 <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => handleExport('csv')}>
                   <FileText className="h-4 w-4" /> CSV
                 </Button>
               </PopoverContent>
             </Popover>
           )}
         </div>
       </div>
 
       {/* Table */}
       <div className="border border-border rounded-lg overflow-hidden bg-card">
         <ScrollArea className="w-full" ref={tableRef}>
           <div className="min-w-max">
             <table className="w-full text-sm">
               <thead className="bg-muted/60 sticky top-0 z-10">
                 <tr>
                   {visibleColumnDefs.map((col) => (
                     <th
                       key={col.key}
                       className={cn(
                         "px-3 py-2.5 text-left font-semibold text-foreground border-b border-border",
                         col.width,
                         col.sticky && "sticky left-0 bg-muted/60 z-20",
                         col.sortable && "cursor-pointer hover:bg-muted/80 select-none transition-colors"
                       )}
                       onClick={() => col.sortable && handleSort(col.key)}
                     >
                       <div className="flex items-center gap-1.5">
                         <span className={cn(displayLanguage === 'nepali' && 'font-nepali')}>
                           {getColumnLabel(col)}
                         </span>
                         {col.sortable && getSortIcon(col.key)}
                       </div>
                     </th>
                   ))}
                   {onRowEdit && (
                     <th className="px-3 py-2.5 text-center font-semibold text-foreground border-b border-border w-16">
                       <span className="sr-only">Actions</span>
                     </th>
                   )}
                 </tr>
               </thead>
               <tbody>
                 {paginatedData.length === 0 ? (
                   <tr>
                     <td 
                       colSpan={visibleColumnDefs.length + (onRowEdit ? 1 : 0)} 
                       className="px-4 py-12 text-center text-muted-foreground"
                     >
                       {emptyMessage}
                     </td>
                   </tr>
                 ) : (
                   paginatedData.map((row, idx) => {
                     const rowId = getRowId(row);
                     const globalIdx = (currentPage - 1) * pageSize + idx;
                     const isSelected = selectedRows.includes(rowId);
                     
                     return (
                       <tr
                         key={rowId}
                         className={cn(
                           "border-b border-border/50 transition-colors",
                           "hover:bg-muted/30",
                           isSelected && "bg-accent/10",
                           onRowClick && "cursor-pointer"
                         )}
                         onClick={() => onRowClick?.(row, globalIdx)}
                       >
                         {visibleColumnDefs.map((col) => (
                           <td
                             key={col.key}
                             className={cn(
                               "px-3 py-2",
                               col.width,
                               col.sticky && "sticky left-0 bg-card z-10"
                             )}
                           >
                             {renderCellValue(getValue(row, col.key, globalIdx), col.key)}
                           </td>
                         ))}
                         {onRowEdit && (
                           <td className="px-3 py-2 text-center">
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-7 w-7 p-0"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 onRowEdit(row, globalIdx);
                               }}
                             >
                               <Edit3 className="h-3.5 w-3.5" />
                             </Button>
                           </td>
                         )}
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
           </div>
           <ScrollBar orientation="horizontal" />
         </ScrollArea>
       </div>
 
       {/* Pagination */}
       {totalPages > 1 && (
         <div className="flex items-center justify-between text-sm">
           <p className="text-muted-foreground">
             Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
           </p>
           <div className="flex items-center gap-1">
             <Button
               variant="outline"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => setCurrentPage(1)}
               disabled={currentPage === 1}
             >
               <ChevronsLeft className="h-4 w-4" />
             </Button>
             <Button
               variant="outline"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               disabled={currentPage === 1}
             >
               <ChevronLeft className="h-4 w-4" />
             </Button>
             <span className="px-3 font-medium">
               {currentPage} / {totalPages}
             </span>
             <Button
               variant="outline"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               disabled={currentPage === totalPages}
             >
               <ChevronRight className="h-4 w-4" />
             </Button>
             <Button
               variant="outline"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => setCurrentPage(totalPages)}
               disabled={currentPage === totalPages}
             >
               <ChevronsRight className="h-4 w-4" />
             </Button>
           </div>
         </div>
       )}
     </div>
   );
 }