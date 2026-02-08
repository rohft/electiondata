import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText, Download, Plus, Eye, Settings2,
  LayoutTemplate, Users, PieChart, BarChart3,
  Table2, Image, Printer } from
'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  nameNe: string;
  description: string;
  type: 'summary' | 'detailed' | 'comparison' | 'infographic';
  sections: string[];
  icon: typeof FileText;
}

const TEMPLATES: Template[] = [
{
  id: 'voter-summary',
  name: 'Voter Summary Report',
  nameNe: 'मतदाता सारांश रिपोर्ट',
  description: 'Overview of voter demographics by ward and municipality',
  type: 'summary',
  sections: ['header', 'stats', 'genderChart', 'ageChart'],
  icon: FileText
},
{
  id: 'detailed-demographics',
  name: 'Detailed Demographics',
  nameNe: 'विस्तृत जनसांख्यिकी',
  description: 'Complete breakdown of voter data with all segments',
  type: 'detailed',
  sections: ['header', 'stats', 'genderChart', 'ageChart', 'casteTable', 'surnameTable'],
  icon: Table2
},
{
  id: 'ward-comparison',
  name: 'Ward Comparison',
  nameNe: 'वडा तुलना',
  description: 'Side-by-side comparison of wards within a municipality',
  type: 'comparison',
  sections: ['header', 'wardStats', 'comparisonChart'],
  icon: BarChart3
},
{
  id: 'infographic-poster',
  name: 'Infographic Poster',
  nameNe: 'इन्फोग्राफिक पोस्टर',
  description: 'Visual poster with key statistics and charts',
  type: 'infographic',
  sections: ['header', 'heroStats', 'visualCharts', 'footer'],
  icon: Image
},
{
  id: 'caste-analysis',
  name: 'Caste Analysis Report',
  nameNe: 'जात विश्लेषण रिपोर्ट',
  description: 'Detailed breakdown by caste categories and surnames',
  type: 'detailed',
  sections: ['header', 'castePieChart', 'surnameBreakdown', 'casteTable'],
  icon: PieChart
},
{
  id: 'family-list',
  name: 'Family List Report',
  nameNe: 'परिवार सूची रिपोर्ट',
  description: 'Grouped list of voters by family relationships',
  type: 'detailed',
  sections: ['header', 'familyCards', 'memberTable'],
  icon: Users
}];


const SECTION_OPTIONS = [
{ id: 'header', label: 'Report Header', labelNe: 'रिपोर्ट हेडर' },
{ id: 'stats', label: 'Summary Statistics', labelNe: 'सारांश तथ्याङ्क' },
{ id: 'genderChart', label: 'Gender Distribution Chart', labelNe: 'लिङ्ग वितरण चार्ट' },
{ id: 'ageChart', label: 'Age Distribution Chart', labelNe: 'उमेर वितरण चार्ट' },
{ id: 'casteTable', label: 'Caste Breakdown Table', labelNe: 'जात तालिका' },
{ id: 'surnameTable', label: 'Surname Breakdown Table', labelNe: 'थर तालिका' },
{ id: 'voterList', label: 'Voter List', labelNe: 'मतदाता सूची' },
{ id: 'footer', label: 'Report Footer', labelNe: 'रिपोर्ट फुटर' }];


export const TemplatesSection = () => {
  const { t, language } = useLanguage();
  const { municipalities, getSegmentCounts } = useVoterData();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const currentMunicipality = municipalities.find((m) => m.id === selectedMunicipality);
  const segments = getSegmentCounts(
    selectedMunicipality !== 'all' ? selectedMunicipality : undefined,
    selectedWard !== 'all' ? selectedWard : undefined
  );

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setSelectedSections(template.sections);
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
    prev.includes(sectionId) ?
    prev.filter((s) => s !== sectionId) :
    [...prev, sectionId]
    );
  };

  const handleExportPDF = () => {
    toast.success('Generating PDF report...', {
      description: 'Your report will download shortly'
    });
    // PDF generation would be implemented here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('nav.templates') || 'Report Templates'}</h2>
          <p className="text-muted-foreground">Generate professional reports from your voter data</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Custom Template
        </Button>
      </div>

      <Tabs defaultValue="gallery" className="space-y-6">
        <TabsList>
          <TabsTrigger value="gallery" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Template Gallery
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Custom Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="space-y-6">
          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate?.id === template.id;
              return (
                <Card
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-accent border-accent"
                  )}
                  onClick={() => handleTemplateSelect(template)}>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isSelected ? "gradient-accent" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          isSelected ? "text-accent-foreground" : "text-muted-foreground"
                        )} />
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {template.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-3">
                      {language === 'ne' ? template.nameNe : template.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1">
                      {template.sections.slice(0, 3).map((section) =>
                      <Badge key={section} variant="secondary" className="text-xs">
                          {section}
                        </Badge>
                      )}
                      {template.sections.length > 3 &&
                      <Badge variant="secondary" className="text-xs">
                          +{template.sections.length - 3} more
                        </Badge>
                      }
                    </div>
                  </CardContent>
                </Card>);

            })}
          </div>

          {/* Template Configuration */}
          {selectedTemplate &&
          <Card className="card-shadow border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <selectedTemplate.icon className="h-5 w-5 text-accent" />
                  Configure: {language === 'ne' ? selectedTemplate.nameNe : selectedTemplate.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data Selection */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Municipality</Label>
                    <Select value={selectedMunicipality} onValueChange={(v) => {setSelectedMunicipality(v);setSelectedWard('all');}}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Municipalities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Municipalities</SelectItem>
                        {municipalities.map((m) =>
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ward</Label>
                    <Select value={selectedWard} onValueChange={setSelectedWard} disabled={selectedMunicipality === 'all'}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Wards" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Wards</SelectItem>
                        {currentMunicipality?.wards.map((w) =>
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Section Selection */}
                <div className="space-y-3">
                  <Label>Include Sections</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {SECTION_OPTIONS.map((section) =>
                  <div key={section.id} className="flex items-center space-x-2">
                        <Checkbox
                      id={section.id}
                      checked={selectedSections.includes(section.id)}
                      onCheckedChange={() => toggleSection(section.id)} />

                        <label
                      htmlFor={section.id}
                      className="text-sm cursor-pointer">

                          {language === 'ne' ? section.labelNe : section.label}
                        </label>
                      </div>
                  )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                  <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>Report Preview</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[70vh]">
                        <div className="p-6 bg-white text-black space-y-6">
                          {/* Preview Header with Total Count */}
                          <div className="text-center border-b pb-4">
                            <h1 className="text-2xl font-bold">
                              {language === 'ne' ? selectedTemplate.nameNe : selectedTemplate.name}
                            </h1>
                            <p className="text-gray-600">
                              {currentMunicipality?.name || 'All Municipalities'}
                              {selectedWard !== 'all' && ` - Ward ${selectedWard}`}
                            </p>
                            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                              <Users className="h-5 w-5 text-blue-600" />
                              <span className="text-lg font-bold text-blue-600">
                                Total Voters: {segments.total.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Preview Stats - Summary Cards with Totals */}
                          <div className="grid grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                              <p className="text-3xl font-bold text-blue-600">{segments.total.toLocaleString()}</p>
                              <p className="text-sm text-gray-600">Total Voters</p>
                              <p className="text-xs text-gray-500">कुल मतदाता</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                              <p className="text-3xl font-bold text-green-600">{segments.byGender.male?.toLocaleString() || 0}</p>
                              <p className="text-sm text-gray-600">Male Voters</p>
                              <p className="text-xs text-gray-500">पुरुष</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                              <p className="text-3xl font-bold text-pink-600">{segments.byGender.female?.toLocaleString() || 0}</p>
                              <p className="text-sm text-gray-600">Female Voters</p>
                              <p className="text-xs text-gray-500">महिला</p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                              <p className="text-3xl font-bold text-purple-600">{segments.byGender.other?.toLocaleString() || 0}</p>
                              <p className="text-sm text-gray-600">Other</p>
                              <p className="text-xs text-gray-500">अन्य</p>
                            </div>
                          </div>

                          {/* Age Distribution with Totals */}
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold">Age Distribution (उमेर वितरण)</h3>
                              <span className="text-sm text-gray-500">Total: {segments.total.toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                              {Object.entries(segments.byAge).map(([range, count]) =>
                            <div key={range} className="flex items-center gap-3">
                                  <span className="w-16 text-sm font-medium">{range}</span>
                                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                                    <div
                                  className="h-full bg-blue-500 transition-all flex items-center justify-end pr-2"
                                  style={{ width: segments.total > 0 ? `${Math.max(count / segments.total * 100, 10)}%` : '10%' }}>

                                      {segments.total > 0 && count / segments.total * 100 > 15 &&
                                  <span className="text-xs text-white font-medium">
                                          {(count / segments.total * 100).toFixed(1)}%
                                        </span>
                                  }
                                    </div>
                                  </div>
                                  <span className="w-20 text-sm text-right font-medium">{count.toLocaleString()}</span>
                                </div>
                            )}
                            </div>
                          </div>

                          {/* Surname Distribution with Totals */}
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold">Surname Distribution (थर वितरण)</h3>
                              <span className="text-sm text-muted-foreground">
                                {Object.keys(segments.bySurname).length} surnames | Total: {segments.total.toLocaleString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(segments.bySurname)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10)
                            .map(([surname, count]) =>
                            <div key={surname} className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-sm">{surname}</span>
                                    <span className="text-sm font-medium">{count.toLocaleString()}</span>
                                  </div>
                            )}
                            </div>
                          </div>

                          {/* Footer with Generation Info */}
                          <div className="border-t pt-4 mt-6 text-center text-xs text-gray-500">
                            <p>Report Generated: {new Date().toLocaleDateString()} | Total Records: {segments.total.toLocaleString()}</p>
                            <p className="mt-1">VoterPulse Analytics Dashboard</p>
                          </div>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  
                  <Button onClick={handleExportPDF} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          }
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-accent" />
                Build Custom Template
              </CardTitle>
              <CardDescription>
                Create a personalized report template by selecting the sections you need
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  placeholder="e.g., Ward 4 Monthly Report"
                  value={customTemplateName}
                  onChange={(e) => setCustomTemplateName(e.target.value)} />

              </div>

              <div className="space-y-3">
                <Label>Select Sections to Include</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SECTION_OPTIONS.map((section) =>
                  <div
                    key={section.id}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedSections.includes(section.id) ?
                      "border-accent bg-accent/5" :
                      "border-border hover:border-muted-foreground/50"
                    )}
                    onClick={() => toggleSection(section.id)}>

                      <Checkbox
                      checked={selectedSections.includes(section.id)}
                      onCheckedChange={() => toggleSection(section.id)} />

                      <div>
                        <p className="font-medium text-sm">{section.label}</p>
                        <p className="text-xs text-muted-foreground">{section.labelNe}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" className="gap-2">
                  Save Template
                </Button>
                <Button onClick={handleExportPDF} className="gap-2">
                  <Download className="h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};