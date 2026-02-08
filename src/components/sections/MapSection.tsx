import React, { useState, useMemo, useRef } from 'react';
import { useVoterData } from '@/contexts/VoterDataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomTags } from '@/contexts/CustomTagsContext';
import { Category } from '@/types/category';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel } from
'@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from
'@/components/ui/dialog';
import {
  ArrowRight, Save, RotateCcw, CheckCircle2, AlertCircle,
  Plus, Trash2, PlusCircle, GripVertical, Upload, FolderTree, ChevronUp, ChevronDown, AlertTriangle } from
'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger } from
'@/components/ui/alert-dialog';

// Application fields that data can be mapped to
const APP_FIELDS = [
{ id: 'voterId', labelEn: 'Voter ID', labelNe: 'मतदाता आईडी', aliases: ['मतदाता परिचयपत्र नं.', 'voter id', 'id', 'voterId'], isSystem: true },
{ id: 'serialNumber', labelEn: 'Serial Number', labelNe: 'क्र.सं.', aliases: ['मतदाता क्र.सं.', 'क्र.सं.', 'sn', 's.n.', 'serial'], isSystem: true },
{ id: 'fullName', labelEn: 'Full Name', labelNe: 'नाम', aliases: ['नाम', 'name', 'fullname', 'पुरा नाम'], isSystem: true },
{ id: 'surname', labelEn: 'Surname', labelNe: 'थर', aliases: ['थर', 'surname', 'family name'], isSystem: true },
{ id: 'age', labelEn: 'Age', labelNe: 'उमेर', aliases: ['उमेर', 'age'], isSystem: true },
{ id: 'gender', labelEn: 'Gender', labelNe: 'लिङ्ग', aliases: ['लिङ्ग', 'gender', 'sex'], isSystem: true },
{ id: 'caste', labelEn: 'Caste/Ethnic Group', labelNe: 'जात/जातीय समूह', aliases: ['जात', 'caste', 'ethnicity'], isSystem: true },
{ id: 'tole', labelEn: 'Tole/Address', labelNe: 'टोल/ठेगाना', aliases: ['टोल', 'tole', 'address', 'ठेगाना'], isSystem: true },
{ id: 'spouse', labelEn: 'Spouse', labelNe: 'पति/पत्नी', aliases: ['पति/पत्नी', 'spouse', 'husband', 'wife'], isSystem: true },
{ id: 'parents', labelEn: 'Parents', labelNe: 'अभिभावक', aliases: ['बाबु/आमा', 'parents', 'father', 'mother', 'अभिभावक'], isSystem: true },
{ id: 'center', labelEn: 'Voting Center', labelNe: 'मतदान केन्द्र', aliases: ['मतदान केन्द्र', 'center', 'booth'], isSystem: true }];


interface FieldMapping {
  sourceColumn: string;
  targetField: string | null;
  isCustom?: boolean;
}

interface CustomTargetField {
  id: string;
  labelEn: string;
  labelNe: string;
  isEthnicGroup?: boolean;
  parentGroup?: string;
}

export const MapSection = () => {
  const { t, language } = useLanguage();
  const { municipalities, clearAllData } = useVoterData();
  const { tags, getVisibleCastes, importCasteData } = useCustomTags();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom target fields added by user
  const [customTargetFields, setCustomTargetFields] = useState<CustomTargetField[]>(() => {
    const saved = localStorage.getItem('voter_custom_target_fields');
    return saved ? JSON.parse(saved) : [];
  });

  // Dialog states
  const [addSourceDialogOpen, setAddSourceDialogOpen] = useState(false);
  const [addTargetDialogOpen, setAddTargetDialogOpen] = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [newSourceColumn, setNewSourceColumn] = useState('');
  const [newTargetFieldEn, setNewTargetFieldEn] = useState('');
  const [newTargetFieldNe, setNewTargetFieldNe] = useState('');
  const [bulkCategories, setBulkCategories] = useState('');

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Get all unique headers from uploaded data
  const allHeaders = useMemo(() => {
    const headers = new Set<string>();
    municipalities.forEach((m) => {
      m.wards.forEach((w) => {
        w.voters.forEach((v) => {
          if (v.originalData) {
            Object.keys(v.originalData).forEach((key) => headers.add(key));
          }
        });
      });
    });
    return Array.from(headers);
  }, [municipalities]);

  // Get ethnic group categories from CustomTagsContext
  const ethnicGroupCategories = useMemo(() => {
    const visibleCastes = getVisibleCastes();
    const categories: CustomTargetField[] = [];

    visibleCastes.forEach((caste) => {
      categories.push({
        id: `ethnic_${caste.toLowerCase().replace(/\s+/g, '_')}`,
        labelEn: caste,
        labelNe: caste,
        isEthnicGroup: true
      });

      // Add subfolders if they exist
      const hierarchy = tags.casteHierarchy[caste];
      if (hierarchy?.subfolders) {
        hierarchy.subfolders.forEach((sub) => {
          categories.push({
            id: `ethnic_${caste.toLowerCase().replace(/\s+/g, '_')}_${sub.toLowerCase().replace(/\s+/g, '_')}`,
            labelEn: `${caste} > ${sub}`,
            labelNe: `${caste} > ${sub}`,
            isEthnicGroup: true,
            parentGroup: caste
          });
        });
      }
    });

    return categories;
  }, [getVisibleCastes, tags.casteHierarchy]);

  // Load category management categories from localStorage
  const categoryMgmtCategories = useMemo(() => {
    try {
      const saved = localStorage.getItem('voter_category_tree');
      if (!saved) return [];
      const cats: Category[] = JSON.parse(saved);
      const flatten = (categories: Category[], parentPath = ''): { id: string; label: string; depth: number }[] => {
        const result: { id: string; label: string; depth: number }[] = [];
        for (const cat of categories) {
          const path = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
          result.push({ id: `catmgmt_${cat.id}`, label: path, depth: parentPath ? 1 : 0 });
          result.push(...flatten(cat.children, path));
        }
        return result;
      };
      return flatten(cats);
    } catch {
      return [];
    }
  }, []);

  // Combined target fields (default + custom + ethnic groups)
  const allTargetFields = useMemo(() => {
    return [
    ...APP_FIELDS,
    ...customTargetFields.map((f) => ({ ...f, aliases: [], isSystem: false }))];

  }, [customTargetFields]);

  // Initialize mappings from localStorage or headers
  const [mappings, setMappings] = useState<FieldMapping[]>(() => {
    const saved = localStorage.getItem('voter_field_mappings');
    if (saved) {
      return JSON.parse(saved);
    }
    return allHeaders.map((header) => ({
      sourceColumn: header,
      targetField: null,
      isCustom: false
    }));
  });

  // Update mappings when headers change (preserve custom mappings)
  React.useEffect(() => {
    setMappings((prev) => {
      const customMappings = prev.filter((m) => m.isCustom);
      const existingSourceColumns = new Set(prev.map((m) => m.sourceColumn));

      // Only add new headers that don't exist yet
      const newHeaders = allHeaders.filter((h) => !existingSourceColumns.has(h));
      const headerMappings = prev.filter((m) => !m.isCustom && allHeaders.includes(m.sourceColumn));

      const newMappings = newHeaders.map((header) => ({
        sourceColumn: header,
        targetField: null,
        isCustom: false
      }));

      return [...headerMappings, ...newMappings, ...customMappings];
    });
  }, [allHeaders]);

  const handleMappingChange = (sourceColumn: string, targetField: string | null) => {
    setMappings((prev) => prev.map((m) =>
    m.sourceColumn === sourceColumn ?
    { ...m, targetField: targetField === 'unmapped' ? null : targetField } :
    m
    ));
  };

  const addCustomSourceColumn = () => {
    if (!newSourceColumn.trim()) {
      toast.error(language === 'ne' ? 'स्रोत कलम नाम आवश्यक छ' : 'Source column name is required');
      return;
    }
    if (mappings.some((m) => m.sourceColumn === newSourceColumn.trim())) {
      toast.error(language === 'ne' ? 'यो स्रोत कलम पहिले नै छ' : 'This source column already exists');
      return;
    }
    setMappings((prev) => [...prev, {
      sourceColumn: newSourceColumn.trim(),
      targetField: null,
      isCustom: true
    }]);
    setNewSourceColumn('');
    setAddSourceDialogOpen(false);
    toast.success(language === 'ne' ? 'स्रोत कलम थपियो' : 'Source column added');
  };

  const addCustomTargetField = () => {
    if (!newTargetFieldEn.trim()) {
      toast.error(language === 'ne' ? 'अंग्रेजी नाम आवश्यक छ' : 'English name is required');
      return;
    }
    const id = newTargetFieldEn.trim().toLowerCase().replace(/\s+/g, '_');
    if (allTargetFields.some((f) => f.id === id)) {
      toast.error(language === 'ne' ? 'यो फिल्ड पहिले नै छ' : 'This field already exists');
      return;
    }
    const newField: CustomTargetField = {
      id,
      labelEn: newTargetFieldEn.trim(),
      labelNe: newTargetFieldNe.trim() || newTargetFieldEn.trim()
    };
    const updated = [...customTargetFields, newField];
    setCustomTargetFields(updated);
    localStorage.setItem('voter_custom_target_fields', JSON.stringify(updated));
    setNewTargetFieldEn('');
    setNewTargetFieldNe('');
    setAddTargetDialogOpen(false);
    toast.success(language === 'ne' ? 'लक्ष्य फिल्ड थपियो' : 'Target field added');
  };

  const removeMapping = (sourceColumn: string) => {
    setMappings((prev) => prev.filter((m) => m.sourceColumn !== sourceColumn));
    toast.info(language === 'ne' ? 'म्यापिङ हटाइयो' : 'Mapping removed');
  };

  const removeCustomTargetField = (id: string) => {
    const updated = customTargetFields.filter((f) => f.id !== id);
    setCustomTargetFields(updated);
    localStorage.setItem('voter_custom_target_fields', JSON.stringify(updated));
    setMappings((prev) => prev.map((m) => m.targetField === id ? { ...m, targetField: null } : m));
    toast.info(language === 'ne' ? 'लक्ष्य फिल्ड हटाइयो' : 'Target field removed');
  };

  // Move mapping up/down
  const moveMapping = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= mappings.length) return;

    setMappings((prev) => {
      const newMappings = [...prev];
      [newMappings[index], newMappings[newIndex]] = [newMappings[newIndex], newMappings[index]];
      return newMappings;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setMappings((prev) => {
      const newMappings = [...prev];
      const draggedItem = newMappings[draggedIndex];
      newMappings.splice(draggedIndex, 1);
      newMappings.splice(index, 0, draggedItem);
      return newMappings;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Bulk upload ethnic group categories
  const handleBulkUploadCategories = () => {
    const lines = bulkCategories.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      toast.error(language === 'ne' ? 'कुनै श्रेणी प्रविष्ट गरिएको छैन' : 'No categories entered');
      return;
    }

    const newCastes: string[] = [];
    const newHierarchy: Record<string, {subfolders: string[];surnames: string[];}> = {};

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.includes('>')) {
        // It's a subfolder: "Parent > Child"
        const [parent, child] = trimmed.split('>').map((s) => s.trim());
        if (parent && child) {
          if (!newCastes.includes(parent)) {
            newCastes.push(parent);
          }
          if (!newHierarchy[parent]) {
            newHierarchy[parent] = { subfolders: [], surnames: [] };
          }
          if (!newHierarchy[parent].subfolders.includes(child)) {
            newHierarchy[parent].subfolders.push(child);
          }
        }
      } else if (trimmed) {
        // It's a main category
        if (!newCastes.includes(trimmed)) {
          newCastes.push(trimmed);
        }
      }
    });

    importCasteData({
      castes: newCastes,
      casteHierarchy: newHierarchy
    });

    setBulkCategories('');
    setBulkUploadDialogOpen(false);
    toast.success(language === 'ne' ?
    `${newCastes.length} श्रेणीहरू थपियो` :
    `Added ${newCastes.length} categories`);
  };


  const resetMappings = () => {
    setMappings((prev) => prev.map((m) => ({ ...m, targetField: null })));
    toast.info(language === 'ne' ? 'म्यापिङ रिसेट गरियो' : 'Mappings reset');
  };

  const saveMappings = () => {
    localStorage.setItem('voter_field_mappings', JSON.stringify(mappings));
    localStorage.setItem('voter_custom_target_fields', JSON.stringify(customTargetFields));
    toast.success(language === 'ne' ? 'म्यापिङ सेभ गरियो र डाटा अपडेट हुनेछ' : 'Mappings saved - data will be updated');
  };

  const mappedCount = mappings.filter((m) => m.targetField).length;
  const unmappedCount = mappings.filter((m) => !m.targetField).length;

  if (allHeaders.length === 0 && mappings.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('map.title')}</CardTitle>
            <CardDescription>{t('map.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {language === 'ne' ? 'कुनै डाटा अपलोड भएको छैन' : 'No Data Uploaded'}
              </h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {language === 'ne' ?
                'म्यापिङ कन्फिगर गर्न पहिले डाटा अपलोड गर्नुहोस् वा म्यानुअल रूपमा थप्नुहोस्।' :
                'Please upload data first to configure field mappings, or add manually.'}
              </p>
              <Button onClick={() => setAddSourceDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {language === 'ne' ? 'स्रोत कलम थप्नुहोस्' : 'Add Source Column'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>);

  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('map.title')}</CardTitle>
              <CardDescription>{t('map.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {mappedCount} {language === 'ne' ? 'म्याप गरिएको' : 'mapped'}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {unmappedCount} {t('map.unmapped')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" onClick={resetMappings} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t('map.resetMapping')}
            </Button>
            
            {/* Clear All Data */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {language === 'ne' ? 'सबै डाटा मेट्नुहोस्' : 'Clear All Data'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {language === 'ne' ? 'सबै डाटा मेट्ने?' : 'Clear All Data?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === 'ne' ?
                    'यो कार्यले सबै अपलोड गरिएको डाटा, म्यापिङहरू र म्युनिसिपालिटीहरू मेट्नेछ। यो कार्य पूर्ववत गर्न सकिँदैन।' :
                    'This will delete all uploaded data, mappings, and municipalities. This action cannot be undone.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      clearAllData();
                      setMappings([]);
                      localStorage.removeItem('voter_field_mappings');
                      toast.success(language === 'ne' ? 'सबै डाटा मेटाइयो' : 'All data cleared');
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90">

                    {language === 'ne' ? 'मेट्नुहोस्' : 'Delete All'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {/* Add Source Column Dialog */}
            <Dialog open={addSourceDialogOpen} onOpenChange={setAddSourceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {language === 'ne' ? 'स्रोत कलम' : 'Source Column'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === 'ne' ? 'नयाँ स्रोत कलम थप्नुहोस्' : 'Add New Source Column'}</DialogTitle>
                  <DialogDescription>
                    {language === 'ne' ? 'कस्टम स्रोत कलम नाम प्रविष्ट गर्नुहोस्' : 'Enter a custom source column name'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder={language === 'ne' ? 'स्रोत कलम नाम' : 'Source Column Name'}
                    value={newSourceColumn}
                    onChange={(e) => setNewSourceColumn(e.target.value)} />

                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddSourceDialogOpen(false)}>
                    {language === 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'}
                  </Button>
                  <Button onClick={addCustomSourceColumn}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'ne' ? 'थप्नुहोस्' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add Target Field Dialog */}
            <Dialog open={addTargetDialogOpen} onOpenChange={setAddTargetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  {language === 'ne' ? 'लक्ष्य फिल्ड' : 'Target Field'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === 'ne' ? 'नयाँ लक्ष्य फिल्ड थप्नुहोस्' : 'Add New Target Field'}</DialogTitle>
                  <DialogDescription>
                    {language === 'ne' ? 'कस्टम लक्ष्य फिल्ड थप्नुहोस्' : 'Add a custom target field'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder={language === 'ne' ? 'अंग्रेजी नाम' : 'English Name'}
                    value={newTargetFieldEn}
                    onChange={(e) => setNewTargetFieldEn(e.target.value)} />

                  <Input
                    placeholder={language === 'ne' ? 'नेपाली नाम (वैकल्पिक)' : 'Nepali Name (optional)'}
                    value={newTargetFieldNe}
                    onChange={(e) => setNewTargetFieldNe(e.target.value)} />

                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddTargetDialogOpen(false)}>
                    {language === 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'}
                  </Button>
                  <Button onClick={addCustomTargetField}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'ne' ? 'थप्नुहोस्' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Bulk Upload Ethnic Categories Dialog */}
            <Dialog open={bulkUploadDialogOpen} onOpenChange={setBulkUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FolderTree className="h-4 w-4" />
                  {language === 'ne' ? 'जातीय समूह थप्नुहोस्' : 'Ethnic Categories'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{language === 'ne' ? 'जातीय समूह श्रेणीहरू थप्नुहोस्' : 'Bulk Add Ethnic Categories'}</DialogTitle>
                  <DialogDescription>
                    {language === 'ne' ?
                    'प्रति लाइन एक श्रेणी। उप-फोल्डरको लागि "अभिभावक > बच्चा" प्रयोग गर्नुहोस्।' :
                    'One category per line. Use "Parent > Child" for subfolders.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea
                    placeholder={language === 'ne' ?
                    "ब्राह्मण\nक्षेत्री\nनेवार > श्रेष्ठ\nनेवार > जोशी\nमगर" :
                    "Brahmin\nChhetri\nNewar > Shrestha\nNewar > Joshi\nMagar"}
                    value={bulkCategories}
                    onChange={(e) => setBulkCategories(e.target.value)}
                    rows={8}
                    className="font-mono text-sm" />

                  <p className="text-xs text-muted-foreground">
                    {language === 'ne' ?
                    'यी श्रेणीहरू जातीय समूह ट्याबमा थपिनेछन् र म्यापिङमा प्रयोग गर्न सकिन्छ।' :
                    'These categories will be added to Ethnic Group tab and available for mapping.'}
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBulkUploadDialogOpen(false)}>
                    {language === 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'}
                  </Button>
                  <Button onClick={handleBulkUploadCategories}>
                    <Upload className="h-4 w-4 mr-2" />
                    {language === 'ne' ? 'थप्नुहोस्' : 'Import'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button onClick={saveMappings} className="gap-2 ml-auto">
              <Save className="h-4 w-4" />
              {t('map.saveMapping')}
            </Button>
          </div>

          {/* Custom Target Fields List */}
          {customTargetFields.length > 0 &&
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">
                {language === 'ne' ? 'कस्टम लक्ष्य फिल्डहरू:' : 'Custom Target Fields:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {customTargetFields.map((field) =>
              <Badge key={field.id} variant="secondary" className="gap-1">
                    {language === 'ne' ? field.labelNe : field.labelEn}
                    <button
                  onClick={() => removeCustomTargetField(field.id)}
                  className="ml-1 hover:text-destructive">

                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
              )}
              </div>
            </div>
          }

          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-1/3">{t('map.sourceColumn')}</TableHead>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-1/3">{t('map.targetField')}</TableHead>
                  <TableHead>{language === 'ne' ? 'कार्य' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping, index) => {
                  const targetFieldInfo = allTargetFields.find((f) => f.id === mapping.targetField);
                  const isEthnicTarget = mapping.targetField?.startsWith('ethnic_');

                  return (
                    <TableRow
                      key={mapping.sourceColumn}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={draggedIndex === index ? 'opacity-50' : ''}>

                      <TableCell className="cursor-grab">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {mapping.sourceColumn}
                          </code>
                          {mapping.isCustom &&
                          <Badge variant="outline" className="text-xs">
                              {language === 'ne' ? 'कस्टम' : 'Custom'}
                            </Badge>
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.targetField || 'unmapped'}
                          onValueChange={(value) => handleMappingChange(mapping.sourceColumn, value)}>

                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('map.unmapped')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unmapped">
                              <span className="text-muted-foreground">— {t('map.unmapped')} —</span>
                            </SelectItem>
                            
                            <SelectGroup>
                              <SelectLabel>{language === 'ne' ? 'प्रणाली फिल्डहरू' : 'System Fields'}</SelectLabel>
                              {APP_FIELDS.map((field) =>
                              <SelectItem key={field.id} value={field.id}>
                                  {language === 'ne' ? field.labelNe : field.labelEn}
                                </SelectItem>
                              )}
                            </SelectGroup>
                            
                            {customTargetFields.length > 0 &&
                            <SelectGroup>
                                <SelectLabel>{language === 'ne' ? 'कस्टम फिल्डहरू' : 'Custom Fields'}</SelectLabel>
                                {customTargetFields.map((field) =>
                              <SelectItem key={field.id} value={field.id}>
                                    {language === 'ne' ? field.labelNe : field.labelEn}
                                  </SelectItem>
                              )}
                              </SelectGroup>
                            }
                            
                            {ethnicGroupCategories.length > 0 &&
                            <SelectGroup>
                                <SelectLabel>{language === 'ne' ? 'जातीय समूह' : 'Ethnic Groups'}</SelectLabel>
                                {ethnicGroupCategories.map((cat) =>
                              <SelectItem key={cat.id} value={cat.id}>
                                    <span className={cat.parentGroup ? 'pl-2 text-muted-foreground' : ''}>
                                      {cat.labelEn}
                                    </span>
                                  </SelectItem>
                              )}
                              </SelectGroup>
                            }
                            
                            {categoryMgmtCategories.length > 0 &&
                            <SelectGroup>
                                <SelectLabel>{language === 'ne' ? 'श्रेणी व्यवस्थापन' : 'Category Management'}</SelectLabel>
                                {categoryMgmtCategories.map((cat) =>
                              <SelectItem key={cat.id} value={cat.id}>
                                    <span className={cat.depth > 0 ? 'pl-2 text-muted-foreground' : ''}>
                                      {cat.label}
                                    </span>
                                  </SelectItem>
                              )}
                              </SelectGroup>
                            }
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {mapping.targetField ?
                          <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {language === 'ne' ? 'म्याप' : 'Mapped'}
                            </Badge> :

                          <Badge variant="outline" className="gap-1 text-muted-foreground text-xs">
                              <AlertCircle className="h-3 w-3" />
                            </Badge>
                          }
                          <div className="flex">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveMapping(index, 'up')}
                              disabled={index === 0}>

                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveMapping(index, 'down')}
                              disabled={index === mappings.length - 1}>

                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeMapping(mapping.sourceColumn)}>

                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>);

                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Preview of sample data */}
      {municipalities.length > 0 && municipalities[0]?.wards?.[0]?.voters?.length > 0 &&
      <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ne' ? 'डाटा पूर्वावलोकन' : 'Data Preview'}
            </CardTitle>
            <CardDescription>
              {language === 'ne' ?
            'अपलोड गरिएको डाटाबाट नमूना रेकर्डहरू' :
            'Sample records from uploaded data'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {allHeaders.slice(0, 6).map((header) =>
                  <TableHead key={header} className="min-w-[120px]">
                        {header}
                      </TableHead>
                  )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {municipalities[0]?.wards[0]?.voters.slice(0, 5).map((voter, idx) =>
                <TableRow key={idx}>
                      {allHeaders.slice(0, 6).map((header) =>
                  <TableCell key={header} className="text-sm">
                          {voter.originalData?.[header] || '-'}
                        </TableCell>
                  )}
                    </TableRow>
                )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      }
    </div>);

};