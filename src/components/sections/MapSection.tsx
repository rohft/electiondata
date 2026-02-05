import React, { useState, useMemo } from 'react';
import { useVoterData } from '@/contexts/VoterDataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { ArrowRight, Save, RotateCcw, Wand2, CheckCircle2, AlertCircle } from 'lucide-react';
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
}

export const MapSection = () => {
  const { t, language } = useLanguage();
  const { municipalities } = useVoterData();
  
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

  // Initialize mappings
  const [mappings, setMappings] = useState<FieldMapping[]>(() => 
    allHeaders.map(header => ({
      sourceColumn: header,
      targetField: null,
    }))
  );

  // Update mappings when headers change
  React.useEffect(() => {
    setMappings(allHeaders.map(header => ({
      sourceColumn: header,
      targetField: mappings.find(m => m.sourceColumn === header)?.targetField || null,
    })));
  }, [allHeaders]);

  const handleMappingChange = (sourceColumn: string, targetField: string | null) => {
    setMappings(prev => prev.map(m => 
      m.sourceColumn === sourceColumn 
        ? { ...m, targetField: targetField === 'unmapped' ? null : targetField }
        : m
    ));
  };

  const autoDetectMappings = () => {
    const newMappings = allHeaders.map(header => {
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
      };
    });
    setMappings(newMappings);
    toast.success(language === 'ne' ? 'म्यापिङ स्वत: पत्ता लगाइयो' : 'Auto-detected mappings');
  };

  const resetMappings = () => {
    setMappings(allHeaders.map(header => ({
      sourceColumn: header,
      targetField: null,
    })));
    toast.info(language === 'ne' ? 'म्यापिङ रिसेट गरियो' : 'Mappings reset');
  };

  const saveMappings = () => {
    // Save to localStorage for persistence
    localStorage.setItem('voter_field_mappings', JSON.stringify(mappings));
    toast.success(language === 'ne' ? 'म्यापिङ सेभ गरियो' : 'Mappings saved successfully');
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
          <div className="flex gap-2 mb-4">
            <Button variant="outline" onClick={autoDetectMappings} className="gap-2">
              <Wand2 className="h-4 w-4" />
              {t('map.autoDetect')}
            </Button>
            <Button variant="outline" onClick={resetMappings} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t('map.resetMapping')}
            </Button>
            <Button onClick={saveMappings} className="gap-2 ml-auto">
              <Save className="h-4 w-4" />
              {t('map.saveMapping')}
            </Button>
          </div>

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
                  const targetFieldInfo = APP_FIELDS.find(f => f.id === mapping.targetField);
                  return (
                    <TableRow key={mapping.sourceColumn}>
                      <TableCell className="font-medium">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {mapping.sourceColumn}
                        </code>
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
                            {APP_FIELDS.map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {language === 'ne' ? field.labelNe : field.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
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
