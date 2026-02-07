import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Filter, Palette, Plus, Settings2 } from 'lucide-react';

const DEFAULT_COLORS = {
  male: '#3b82f6',
  female: '#ec4899',
  other: '#8b5cf6',
  age1: '#2d5a7b',
  age2: '#2a9d8f',
  age3: '#e9c46a',
  age4: '#f4a261',
  age5: '#e76f51',
  age6: '#9b5de5'
};

const DEFAULT_AGE_RANGES = [
{ label: '18-25', min: 18, max: 25 },
{ label: '26-35', min: 26, max: 35 },
{ label: '36-45', min: 36, max: 45 },
{ label: '46-55', min: 46, max: 55 },
{ label: '56-65', min: 56, max: 65 },
{ label: '65+', min: 65, max: 200 }];


export const SegmentsSection = () => {
  const { t, getBilingual } = useLanguage();
  const { municipalities, getSegmentCounts } = useVoterData();
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [ageRanges, setAgeRanges] = useState(DEFAULT_AGE_RANGES);
  const [editingAgeRanges, setEditingAgeRanges] = useState(false);

  const currentMunicipality = municipalities.find((m) => m.id === selectedMunicipality);
  const segments = getSegmentCounts(
    selectedMunicipality !== 'all' ? selectedMunicipality : undefined,
    selectedWard !== 'all' ? selectedWard : undefined
  );

  const genderLabels = getBilingual('segments.male');
  const femaleLabels = getBilingual('segments.female');
  const otherLabels = getBilingual('segments.other');

  const genderData = [
  { key: 'male', labels: genderLabels, value: segments.byGender.male || 0, color: colors.male },
  { key: 'female', labels: femaleLabels, value: segments.byGender.female || 0, color: colors.female },
  { key: 'other', labels: otherLabels, value: segments.byGender.other || 0, color: colors.other }];


  const ageColors = [colors.age1, colors.age2, colors.age3, colors.age4, colors.age5, colors.age6];

  const updateAgeRange = (index: number, field: 'min' | 'max' | 'label', value: string | number) => {
    setAgeRanges((prev) => {
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
               <label className="text-sm font-medium text-foreground">{t('common.ward')}</label>
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
             <div className="space-y-2">
               <label className="text-sm font-medium text-foreground flex items-center gap-2">
                 <Palette className="h-4 w-4" />
                 {t('segments.colorPalette')}
               </label>
               <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm flex items-center justify-between hover:bg-muted/50 transition-colors">

                 <span>{showColorPicker ? 'Hide Colors' : 'Customize Colors'}</span>
                 <div className="flex gap-1">
                   {Object.values(colors).slice(0, 5).map((color, i) =>
                  <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                  )}
                 </div>
               </button>
             </div>
           </div>
 
           {/* Color Picker Grid */}
           {showColorPicker &&
          <div className="mt-4 pt-4 border-t border-border">
               <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                 {Object.entries(colors).map(([key, value]) =>
              <div key={key} className="flex items-center gap-2">
                     <Input
                  type="color"
                  value={value}
                  onChange={(e) => setColors((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="h-8 w-12 cursor-pointer rounded border-0 p-0" />

                     <Label className="text-xs capitalize">{key.replace(/\d+/, ' $&')}</Label>
                   </div>
              )}
               </div>
             </div>
          }
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
         </TabsList>
 
         <TabsContent value="gender" className="fade-in">
           <Card className="card-shadow border-border/50">
             <CardHeader>
               <CardTitle className="text-base font-semibold">{t('segments.byGender')}</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                 {genderData.map(({ key, labels, value, color }) =>
                <div
                  key={key}
                  className="rounded-xl border p-4 text-center transition-all hover:shadow-md"
                  style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}>

                     <div className="flex flex-col items-center gap-1">
                       <p className="text-sm text-muted-foreground">{labels.en}</p>
                       <p className="text-xs text-muted-foreground">{labels.ne}</p>
                     </div>
                     <p className="mt-2 text-3xl sm:text-4xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
                     <p className="mt-1 text-xs text-muted-foreground">
                       {segments.total > 0 ? (value / segments.total * 100).toFixed(1) : 0}%
                     </p>
                     <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                       <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: segments.total > 0 ? `${value / segments.total * 100}%` : '0%',
                        backgroundColor: color
                      }} />

                     </div>
                   </div>
                )}
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
                     {ageRanges.map((range, index) =>
                    <div key={index} className="grid grid-cols-3 gap-3">
                         <div className="space-y-1">
                           <Label className="text-xs">Label</Label>
                           <Input
                          value={range.label}
                          onChange={(e) => updateAgeRange(index, 'label', e.target.value)} />

                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs">Min Age</Label>
                           <Input
                          type="number"
                          value={range.min}
                          onChange={(e) => updateAgeRange(index, 'min', parseInt(e.target.value) || 0)} />

                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs">Max Age</Label>
                           <Input
                          type="number"
                          value={range.max}
                          onChange={(e) => updateAgeRange(index, 'max', parseInt(e.target.value) || 0)} />

                         </div>
                       </div>
                    )}
                     <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setAgeRanges([...ageRanges, { label: 'New', min: 0, max: 0 }])}>

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
                      style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}>

                       <p className="text-xs sm:text-sm font-medium text-foreground">{range}</p>
                       <p className="text-xs text-muted-foreground">वर्ष</p>
                       <p
                        className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold"
                        style={{ color }}>

                         {count.toLocaleString()}
                       </p>
                       <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                         <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: segments.total > 0 ? `${count / segments.total * 100}%` : '0%',
                            backgroundColor: color
                          }} />

                       </div>
                       <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">
                         {segments.total > 0 ? (count / segments.total * 100).toFixed(1) : 0}%
                       </p>
                     </div>);

                })}
               </div>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </div>);

};