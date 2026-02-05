import React, { useState, useMemo } from 'react';
import { useVoterData } from '@/contexts/VoterDataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowRight, Save, RotateCcw, Wand2, CheckCircle2, AlertCircle, Plus, Trash2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

// Application fields that data can be mapped to
const APP_FIELDS = [
  { id: 'voterId', labelEn: 'Voter ID', labelNe: 'मतदाता आईडी', aliases: ['मतदाता परिचयपत्र नं.', 'voter id', 'id', 'voterId'] },
  { id: 'serialNumber', labelEn: 'Serial Number', labelNe: 'क्र.सं.', aliases: ['मतदाता क्र.सं.', 'क्र.सं.', 'sn', 's.n.', 'serial'] },
  { id: 'fullName', labelEn: 'Full Name', labelNe: 'नाम', aliases: ['नाम', 'name', 'fullname', 'पुरा नाम'] },
  { id: 'surname', labelEn: 'Surname', labelNe: 'थर', aliases: ['थर', 'surname', 'family name'] },
  { id: 'age', labelEn: 'Age', labelNe: 'उमेर', aliases: ['उमेर', 'age'] },
  { id: 'gender', labelEn: 'Gender', labelNe: 'लिङ्ग', aliases: ['लिङ्ग', 'gender', 'sex'] },
  { id: 'caste', labelEn: 'Caste/Ethnic Group', labelNe: 'जात/जातीय समूह', aliases: ['जात', 'caste', 'ethnicity'] },
  { id: 'tole', labelEn: 'Tole/Address', labelNe: 'टोल/ठेगाना', aliases: ['टोल', 'tole', 'address', 'ठेगाना'] },
  { id: 'spouse', labelEn: 'Spouse', labelNe: 'पति/पत्नी', aliases: ['पति/पत्नी', 'spouse', 'husband', 'wife'] },
  { id: 'parents', labelEn: 'Parents', labelNe: 'अभिभावक', aliases: ['बाबु/आमा', 'parents', 'father', 'mother', 'अभिभावक'] },
  { id: 'center', labelEn: 'Voting Center', labelNe: 'मतदान केन्द्र', aliases: ['मतदान केन्द्र', 'center', 'booth'] },
];

interface FieldMapping {
  sourceColumn: string;
  targetField: string | null;
  isCustom?: boolean;
}

interface CustomTargetField {
  id: string;
  labelEn: string;
  labelNe: string;
}

export const MapSection = () => {
  const { t, language } = useLanguage();
  const { municipalities } = useVoterData();
  
  // Custom target fields added by user
  const [customTargetFields, setCustomTargetFields] = useState<CustomTargetField[]>(() => {
    const saved = localStorage.getItem('voter_custom_target_fields');
    return saved ? JSON.parse(saved) : [];
  });

  // Dialog states
  const [addSourceDialogOpen, setAddSourceDialogOpen] = useState(false);
  const [addTargetDialogOpen, setAddTargetDialogOpen] = useState(false);
  const [newSourceColumn, setNewSourceColumn] = useState('');
  const [newTargetFieldEn, setNewTargetFieldEn] = useState('');
  const [newTargetFieldNe, setNewTargetFieldNe] = useState('');
  
  // Get all unique headers from uploaded data
  const allHeaders = useMemo(() => {
    const headers = new Set<string>();
    municipalities.forEach(m => {
      m.wards.forEach(w => {
        w.voters.forEach(v => {
          if (v.originalData) {
            Object.keys(v.originalData).forEach(key => headers.add(key));
          }
        });
      });
    });
    return Array.from(headers);
  }, [municipalities]);

  // Combined target fields (default + custom)
  const allTargetFields = useMemo(() => {
    return [...APP_FIELDS, ...customTargetFields.map(f => ({ ...f, aliases: [] }))];
  }, [customTargetFields]);

  // Initialize mappings from localStorage or headers
  const [mappings, setMappings] = useState<FieldMapping[]>(() => {
    const saved = localStorage.getItem('voter_field_mappings');
    if (saved) {
      return JSON.parse(saved);
    }
    return allHeaders.map(header => ({
      sourceColumn: header,
      targetField: null,
      isCustom: false,
    }));
  });

  // Update mappings when headers change (preserve custom mappings)
  React.useEffect(() => {
    setMappings(prev => {
      const customMappings = prev.filter(m => m.isCustom);
      const headerMappings = allHeaders.map(header => {
        const existing = prev.find(m => m.sourceColumn === header && !m.isCustom);
        return {
          sourceColumn: header,
          targetField: existing?.targetField || null,
          isCustom: false,
        };
      });
      return [...headerMappings, ...customMappings];
    });
  }, [allHeaders]);

  const handleMappingChange = (sourceColumn: string, targetField: string | null) => {
    setMappings(prev => prev.map(m => 
      m.sourceColumn === sourceColumn 
        ? { ...m, targetField: targetField === 'unmapped' ? null : targetField }
        : m
    ));
  };

  const addCustomSourceColumn = () => {
    if (!newSourceColumn.trim()) {
      toast.error(language === 'ne' ? 'स्रोत कलम नाम आवश्यक छ' : 'Source column name is required');
      return;
    }
    if (mappings.some(m => m.sourceColumn === newSourceColumn.trim())) {
      toast.error(language === 'ne' ? 'यो स्रोत कलम पहिले नै छ' : 'This source column already exists');
      return;
    }
    setMappings(prev => [...prev, {
      sourceColumn: newSourceColumn.trim(),
      targetField: null,
      isCustom: true,
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
    if (allTargetFields.some(f => f.id === id)) {
      toast.error(language === 'ne' ? 'यो फिल्ड पहिले नै छ' : 'This field already exists');
      return;
    }
    const newField: CustomTargetField = {
      id,
      labelEn: newTargetFieldEn.trim(),
      labelNe: newTargetFieldNe.trim() || newTargetFieldEn.trim(),
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
    setMappings(prev => prev.filter(m => m.sourceColumn !== sourceColumn));
    toast.info(language === 'ne' ? 'म्यापिङ हटाइयो' : 'Mapping removed');
  };

  const removeCustomTargetField = (id: string) => {
    const updated = customTargetFields.filter(f => f.id !== id);
    setCustomTargetFields(updated);
    localStorage.setItem('voter_custom_target_fields', JSON.stringify(updated));
    // Also update any mappings using this field
    setMappings(prev => prev.map(m => m.targetField === id ? { ...m, targetField: null } : m));
    toast.info(language === 'ne' ? 'लक्ष्य फिल्ड हटाइयो' : 'Target field removed');
  };

  const autoDetectMappings = () => {
    setMappings(prev => {
      const customMappings = prev.filter(m => m.isCustom);
      const headerMappings = allHeaders.map(header => {
        const headerLower = header.toLowerCase().trim();
        const matchedField = APP_FIELDS.find(field => 
          field.aliases.some(alias => 
            headerLower === alias.toLowerCase() || 
            headerLower.includes(alias.toLowerCase())
          )
        );
        return {
          sourceColumn: header,
          targetField: matchedField?.id || null,
          isCustom: false,
        };
      });
      return [...headerMappings, ...customMappings];
    });
    toast.success(language === 'ne' ? 'म्यापिङ स्वत: पत्ता लगाइयो' : 'Auto-detected mappings');
  };

  const resetMappings = () => {
    setMappings(allHeaders.map(header => ({
      sourceColumn: header,
      targetField: null,
      isCustom: false,
    })));
    toast.info(language === 'ne' ? 'म्यापिङ रिसेट गरियो' : 'Mappings reset');
  };

  const saveMappings = () => {
    // Save to localStorage for persistence
    localStorage.setItem('voter_field_mappings', JSON.stringify(mappings));
    localStorage.setItem('voter_custom_target_fields', JSON.stringify(customTargetFields));
    toast.success(language === 'ne' ? 'म्यापिङ सेभ गरियो र डाटा अपडेट हुनेछ' : 'Mappings saved - data will be updated');
  };

  const mappedCount = mappings.filter(m => m.targetField).length;
  const unmappedCount = mappings.filter(m => !m.targetField).length;

  if (allHeaders.length === 0) {
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
              <p className="text-muted-foreground max-w-md">
                {language === 'ne' 
                  ? 'म्यापिङ कन्फिगर गर्न पहिले डाटा अपलोड गर्नुहोस्।' 
                  : 'Please upload data first to configure field mappings.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
            <Button variant="outline" onClick={autoDetectMappings} className="gap-2">
              <Wand2 className="h-4 w-4" />
              {t('map.autoDetect')}
            </Button>
            <Button variant="outline" onClick={resetMappings} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t('map.resetMapping')}
            </Button>
            
            {/* Add Source Column Dialog */}
            <Dialog open={addSourceDialogOpen} onOpenChange={setAddSourceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {language === 'ne' ? 'स्रोत कलम थप्नुहोस्' : 'Add Source Column'}
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
                    onChange={(e) => setNewSourceColumn(e.target.value)}
                  />
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
                  {language === 'ne' ? 'लक्ष्य फिल्ड थप्नुहोस्' : 'Add Target Field'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === 'ne' ? 'नयाँ लक्ष्य फिल्ड थप्नुहोस्' : 'Add New Target Field'}</DialogTitle>
                  <DialogDescription>
                    {language === 'ne' ? 'कस्टम लक्ष्य फिल्ड थप्नुहोस् जुन म्यापिङमा प्रयोग गर्न सकिन्छ' : 'Add a custom target field that can be used in mappings'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder={language === 'ne' ? 'अंग्रेजी नाम' : 'English Name'}
                    value={newTargetFieldEn}
                    onChange={(e) => setNewTargetFieldEn(e.target.value)}
                  />
                  <Input
                    placeholder={language === 'ne' ? 'नेपाली नाम (वैकल्पिक)' : 'Nepali Name (optional)'}
                    value={newTargetFieldNe}
                    onChange={(e) => setNewTargetFieldNe(e.target.value)}
                  />
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

            <Button onClick={saveMappings} className="gap-2 ml-auto">
              <Save className="h-4 w-4" />
              {t('map.saveMapping')}
            </Button>
          </div>

          {/* Custom Target Fields List */}
          {customTargetFields.length > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">
                {language === 'ne' ? 'कस्टम लक्ष्य फिल्डहरू:' : 'Custom Target Fields:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {customTargetFields.map(field => (
                  <Badge key={field.id} variant="secondary" className="gap-1">
                    {language === 'ne' ? field.labelNe : field.labelEn}
                    <button
                      onClick={() => removeCustomTargetField(field.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">{t('map.sourceColumn')}</TableHead>
                  <TableHead className="w-16"></TableHead>
                  <TableHead className="w-1/3">{t('map.targetField')}</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => {
                  const targetFieldInfo = allTargetFields.find(f => f.id === mapping.targetField);
                  return (
                    <TableRow key={mapping.sourceColumn}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {mapping.sourceColumn}
                          </code>
                          {mapping.isCustom && (
                            <Badge variant="outline" className="text-xs">
                              {language === 'ne' ? 'कस्टम' : 'Custom'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.targetField || 'unmapped'}
                          onValueChange={(value) => handleMappingChange(mapping.sourceColumn, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('map.unmapped')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unmapped">
                              <span className="text-muted-foreground">— {t('map.unmapped')} —</span>
                            </SelectItem>
                            {allTargetFields.map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {language === 'ne' ? field.labelNe : field.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {mapping.targetField ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {language === 'ne' ? 'म्याप गरिएको' : 'Mapped'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <AlertCircle className="h-3 w-3" />
                              {t('map.unmapped')}
                            </Badge>
                          )}
                          {mapping.isCustom && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeMapping(mapping.sourceColumn)}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
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
        </CardContent>
      </Card>

      {/* Preview of sample data */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ne' ? 'डाटा पूर्वावलोकन' : 'Data Preview'}
          </CardTitle>
          <CardDescription>
            {language === 'ne' 
              ? 'अपलोड गरिएको डाटाबाट नमूना रेकर्डहरू' 
              : 'Sample records from uploaded data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {allHeaders.slice(0, 6).map(header => (
                    <TableHead key={header} className="min-w-[120px]">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {municipalities[0]?.wards[0]?.voters.slice(0, 5).map((voter, idx) => (
                  <TableRow key={idx}>
                    {allHeaders.slice(0, 6).map(header => (
                      <TableCell key={header} className="text-sm">
                        {voter.originalData?.[header] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
