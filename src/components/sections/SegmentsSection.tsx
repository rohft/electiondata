import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Filter, Palette, Plus, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CASTE_CATEGORIES, detectCasteFromName } from '@/lib/casteData';

const DEFAULT_COLORS = {
  male: '#3b82f6',
  female: '#ec4899',
  other: '#8b5cf6',
  age1: '#2d5a7b',
  age2: '#2a9d8f',
  age3: '#e9c46a',
  age4: '#f4a261',
  age5: '#e76f51',
  age6: '#9b5de5',
};

const DEFAULT_AGE_RANGES = [
  { label: '18-25', min: 18, max: 25 },
  { label: '26-35', min: 26, max: 35 },
  { label: '36-45', min: 36, max: 45 },
  { label: '46-55', min: 46, max: 55 },
  { label: '56-65', min: 56, max: 65 },
  { label: '65+', min: 65, max: 200 },
];

export const SegmentsSection = () => {
  const { t, getBilingual, language } = useLanguage();
  const { municipalities, getSegmentCounts } = useVoterData();
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [ageRanges, setAgeRanges] = useState(DEFAULT_AGE_RANGES);
  const [editingAgeRanges, setEditingAgeRanges] = useState(false);
  const [selectedCastes, setSelectedCastes] = useState<string[]>([]);

  const currentMunicipality = municipalities.find(m => m.id === selectedMunicipality);
  const segments = getSegmentCounts(
    selectedMunicipality !== 'all' ? selectedMunicipality : undefined,
    selectedWard !== 'all' ? selectedWard : undefined
  );

  // Get all voters for caste detection
  const allVoters = useMemo(() => {
    if (selectedMunicipality !== 'all') {
      const municipality = municipalities.find(m => m.id === selectedMunicipality);
      if (selectedWard !== 'all') {
        const ward = municipality?.wards.find(w => w.id === selectedWard);
        return ward?.voters || [];
      }
      return municipality?.wards.flatMap(w => w.voters) || [];
    }
    return municipalities.flatMap(m => m.wards.flatMap(w => w.voters));
  }, [municipalities, selectedMunicipality, selectedWard]);

  // Compute caste distribution using AI detection
  const casteDistribution = useMemo(() => {
    const casteCounts: Record<string, { count: number; surnames: Record<string, number> }> = {};
    
    allVoters.forEach(voter => {
      const detected = detectCasteFromName(voter.fullName);
      const casteName = detected.caste;
      
      if (!casteCounts[casteName]) {
        casteCounts[casteName] = { count: 0, surnames: {} };
      }
      casteCounts[casteName].count++;
      
      const surname = detected.surname || voter.surname;
      if (surname) {
        casteCounts[casteName].surnames[surname] = (casteCounts[casteName].surnames[surname] || 0) + 1;
      }
    });
    
    return Object.entries(casteCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([caste, data]) => ({
        caste,
        count: data.count,
        surnames: Object.entries(data.surnames)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
      }));
  }, [allVoters]);

  // Surname distribution
  const surnameDistribution = useMemo(() => {
    const surnameCounts: Record<string, { count: number; caste: string }> = {};
    
    allVoters.forEach(voter => {
      const detected = detectCasteFromName(voter.fullName);
      const surname = detected.surname || voter.surname || 'Unknown';
      
      if (!surnameCounts[surname]) {
        surnameCounts[surname] = { count: 0, caste: detected.caste };
      }
      surnameCounts[surname].count++;
    });
    
    return Object.entries(surnameCounts)
      .sort((a, b) => b[1].count - a[1].count);
  }, [allVoters]);

  // Filtered voters by selected castes
  const filteredByCaste = useMemo(() => {
    if (selectedCastes.length === 0) return allVoters;
    return allVoters.filter(voter => {
      const detected = detectCasteFromName(voter.fullName);
      return selectedCastes.includes(detected.caste);
    });
  }, [allVoters, selectedCastes]);

  const toggleCasteFilter = (caste: string) => {
    setSelectedCastes(prev => 
      prev.includes(caste) 
        ? prev.filter(c => c !== caste)
        : [...prev, caste]
    );
  };

  const genderLabels = getBilingual('segments.male');
  const femaleLabels = getBilingual('segments.female');
  const otherLabels = getBilingual('segments.other');

  const genderData = [
    { key: 'male', labels: genderLabels, value: segments.byGender.male || 0, color: colors.male },
    { key: 'female', labels: femaleLabels, value: segments.byGender.female || 0, color: colors.female },
    { key: 'other', labels: otherLabels, value: segments.byGender.other || 0, color: colors.other },
  ];

  const ageColors = [colors.age1, colors.age2, colors.age3, colors.age4, colors.age5, colors.age6];

  const casteColors = ['#2d5a7b', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#9b5de5', '#ff6b6b', '#4ecdc4'];

  const updateAgeRange = (index: number, field: 'min' | 'max' | 'label', value: string | number) => {
    setAgeRanges(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Filter className="h-4 w-4 text-accent" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('common.municipality')}</label>
              <Select value={selectedMunicipality} onValueChange={(v) => { setSelectedMunicipality(v); setSelectedWard('all'); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Municipalities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Municipalities</SelectItem>
                  {municipalities.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('common.ward')}</label>
              <Select value={selectedWard} onValueChange={setSelectedWard} disabled={selectedMunicipality === 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="All Wards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {currentMunicipality?.wards.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {t('segments.colorPalette')}
              </label>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <span>{showColorPicker ? 'Hide Colors' : 'Customize Colors'}</span>
                <div className="flex gap-1">
                  {Object.values(colors).slice(0, 5).map((color, i) => (
                    <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </button>
            </div>
          </div>

          {/* Color Picker Grid */}
          {showColorPicker && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {Object.entries(colors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={value}
                      onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                      className="h-8 w-12 cursor-pointer rounded border-0 p-0"
                    />
                    <Label className="text-xs capitalize">{key.replace(/\d+/, ' $&')}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Count */}
      <Card className="card-shadow border-border/50 gradient-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">{t('common.total')} {t('common.voters')}</p>
              <p className="mt-1 text-4xl font-bold counter-animate">{segments.total.toLocaleString()}</p>
            </div>
            <Users className="h-12 w-12 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Segment Tabs */}
      <Tabs defaultValue="gender" className="space-y-4">
        <TabsList className="h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="gender" className="text-xs sm:text-sm">{t('segments.byGender')}</TabsTrigger>
          <TabsTrigger value="age" className="text-xs sm:text-sm">{t('segments.byAge')}</TabsTrigger>
          <TabsTrigger value="caste" className="text-xs sm:text-sm">{t('segments.byCaste')}</TabsTrigger>
          <TabsTrigger value="surname" className="text-xs sm:text-sm">{t('segments.bySurname')}</TabsTrigger>
          <TabsTrigger value="casteFilter" className="text-xs sm:text-sm">Filter by Caste</TabsTrigger>
        </TabsList>

        <TabsContent value="gender" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('segments.byGender')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                {genderData.map(({ key, labels, value, color }) => (
                  <div 
                    key={key} 
                    className="rounded-xl border p-4 text-center transition-all hover:shadow-md"
                    style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-sm text-muted-foreground">{labels.en}</p>
                      <p className="text-xs text-muted-foreground">{labels.ne}</p>
                    </div>
                    <p className="mt-2 text-3xl sm:text-4xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {segments.total > 0 ? ((value / segments.total) * 100).toFixed(1) : 0}%
                    </p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: segments.total > 0 ? `${(value / segments.total) * 100}%` : '0%',
                          backgroundColor: color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="age" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">{t('segments.byAge')}</CardTitle>
              <Dialog open={editingAgeRanges} onOpenChange={setEditingAgeRanges}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Edit Ranges
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Age Ranges</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {ageRanges.map((range, index) => (
                      <div key={index} className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Label</Label>
                          <Input 
                            value={range.label}
                            onChange={(e) => updateAgeRange(index, 'label', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Min Age</Label>
                          <Input 
                            type="number"
                            value={range.min}
                            onChange={(e) => updateAgeRange(index, 'min', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Max Age</Label>
                          <Input 
                            type="number"
                            value={range.max}
                            onChange={(e) => updateAgeRange(index, 'max', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => setAgeRanges([...ageRanges, { label: 'New', min: 0, max: 0 }])}
                    >
                      <Plus className="h-4 w-4" />
                      Add Range
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {Object.entries(segments.byAge).map(([range, count], index) => {
                  const color = ageColors[index % ageColors.length];
                  return (
                    <div 
                      key={range} 
                      className="rounded-xl border p-3 sm:p-4 text-center transition-all hover:shadow-md"
                      style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}
                    >
                      <p className="text-xs sm:text-sm font-medium text-foreground">{range}</p>
                      <p className="text-xs text-muted-foreground">वर्ष</p>
                      <p 
                        className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold"
                        style={{ color }}
                      >
                        {count.toLocaleString()}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: segments.total > 0 ? `${(count / segments.total) * 100}%` : '0%',
                            backgroundColor: color
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">
                        {segments.total > 0 ? ((count / segments.total) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caste" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                {t('segments.byCaste')}
                <Badge variant="secondary">{casteDistribution.length} categories detected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {casteDistribution.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Upload data to see caste distribution</p>
              ) : (
                <div className="space-y-4">
                  {casteDistribution.map((item, index) => {
                    const color = casteColors[index % casteColors.length];
                    const percentage = segments.total > 0 ? ((item.count / segments.total) * 100).toFixed(1) : 0;
                    return (
                      <div key={item.caste} className="space-y-2">
                        <div className="flex items-center gap-4">
                          <span className="w-6 text-sm font-medium text-muted-foreground">{index + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{item.caste}</span>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ borderColor: color, color }}
                                >
                                  {percentage}%
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">{item.count.toLocaleString()}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: casteDistribution[0] ? `${(item.count / casteDistribution[0].count) * 100}%` : '0%',
                                  backgroundColor: color
                                }}
                              />
                            </div>
                            {/* Surnames under this caste */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.surnames.slice(0, 5).map(([surname, count]) => (
                                <Badge key={surname} variant="secondary" className="text-xs">
                                  {surname} ({count})
                                </Badge>
                              ))}
                              {item.surnames.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.surnames.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surname" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                {t('segments.bySurname')}
                <Badge variant="secondary">{surnameDistribution.length} unique surnames</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {surnameDistribution.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {surnameDistribution.slice(0, 50).map(([surname, data], index) => (
                    <div key={surname} className="flex items-center gap-4">
                      <span className="w-6 text-sm font-medium text-muted-foreground">{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{surname || 'Unknown'}</span>
                            <Badge variant="outline" className="text-xs">{data.caste}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">{data.count.toLocaleString()}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div 
                            className="h-full rounded-full bg-chart-2 transition-all"
                            style={{ width: surnameDistribution[0] ? `${(data.count / surnameDistribution[0][1].count) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="casteFilter" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Filter by Caste Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Caste Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {CASTE_CATEGORIES.map((category) => {
                  const isSelected = selectedCastes.includes(category.name);
                  const count = casteDistribution.find(c => c.caste === category.name)?.count || 0;
                  return (
                    <div
                      key={category.name}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        isSelected ? "border-accent bg-accent/10" : "border-border hover:border-muted-foreground/50"
                      )}
                      onClick={() => toggleCasteFilter(category.name)}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.nameNe}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">{count}</Badge>
                    </div>
                  );
                })}
              </div>

              {/* Filtered Results */}
              {selectedCastes.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Filtered Results</h4>
                    <Badge variant="secondary">{filteredByCaste.length} voters</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {selectedCastes.map(caste => {
                      const data = casteDistribution.find(c => c.caste === caste);
                      return (
                        <Card key={caste} className="p-4 text-center">
                          <p className="text-sm font-medium">{caste}</p>
                          <p className="text-2xl font-bold text-accent mt-1">{data?.count || 0}</p>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Newar vs Non-Newar */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t('segments.newar')} vs {t('segments.nonNewar')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-xl border border-chart-2/30 bg-chart-2/5 p-4 sm:p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">{t('segments.newar')}</p>
              <p className="text-xs text-muted-foreground">नेवार</p>
              <p className="mt-2 text-3xl sm:text-4xl font-bold text-chart-2">{segments.newarVsNonNewar.newar.toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {segments.total > 0 ? ((segments.newarVsNonNewar.newar / segments.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="rounded-xl border border-chart-1/30 bg-chart-1/5 p-4 sm:p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">{t('segments.nonNewar')}</p>
              <p className="text-xs text-muted-foreground">गैर-नेवार</p>
              <p className="mt-2 text-3xl sm:text-4xl font-bold text-chart-1">{segments.newarVsNonNewar.nonNewar.toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {segments.total > 0 ? ((segments.newarVsNonNewar.nonNewar / segments.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
