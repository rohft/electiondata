import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GitCompare, Layers, SplitSquareVertical } from 'lucide-react';

type CompareMode = 'side-by-side' | 'overlay';

export const ComparisonSection = () => {
  const { t } = useLanguage();
  const { municipalities, getSegmentCounts } = useVoterData();
  const [compareType, setCompareType] = useState<'ward' | 'municipality'>('ward');
  const [compareMode, setCompareMode] = useState<CompareMode>('side-by-side');
  
  const [leftMunicipality, setLeftMunicipality] = useState<string>('');
  const [leftWard, setLeftWard] = useState<string>('');
  const [rightMunicipality, setRightMunicipality] = useState<string>('');
  const [rightWard, setRightWard] = useState<string>('');

  const leftMuni = municipalities.find(m => m.id === leftMunicipality);
  const rightMuni = municipalities.find(m => m.id === rightMunicipality);

  const leftSegments = compareType === 'ward' 
    ? getSegmentCounts(leftMunicipality || undefined, leftWard || undefined)
    : getSegmentCounts(leftMunicipality || undefined);
  
  const rightSegments = compareType === 'ward'
    ? getSegmentCounts(rightMunicipality || undefined, rightWard || undefined)
    : getSegmentCounts(rightMunicipality || undefined);

  const leftLabel = compareType === 'ward' 
    ? (leftMuni?.wards.find(w => w.id === leftWard)?.name || 'Select Ward')
    : (leftMuni?.name || 'Select Municipality');
  
  const rightLabel = compareType === 'ward'
    ? (rightMuni?.wards.find(w => w.id === rightWard)?.name || 'Select Ward')
    : (rightMuni?.name || 'Select Municipality');

  // Prepare chart data
  const ageComparisonData = Object.keys(leftSegments.byAge).map(range => ({
    range,
    [leftLabel]: leftSegments.byAge[range] || 0,
    [rightLabel]: rightSegments.byAge[range] || 0,
  }));

  const genderComparisonData = Object.keys(leftSegments.byGender).map(gender => ({
    gender: t(`segments.${gender}`),
    [leftLabel]: leftSegments.byGender[gender] || 0,
    [rightLabel]: rightSegments.byGender[gender] || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Compare Type Selection */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <GitCompare className="h-4 w-4 text-accent" />
            Comparison Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Tabs value={compareType} onValueChange={(v) => setCompareType(v as 'ward' | 'municipality')}>
              <TabsList>
                <TabsTrigger value="ward">{t('comparison.wardToWard')}</TabsTrigger>
                <TabsTrigger value="municipality">{t('comparison.municipalityToMunicipality')}</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <button
                onClick={() => setCompareMode('side-by-side')}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  compareMode === 'side-by-side' 
                    ? 'bg-accent text-accent-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <SplitSquareVertical className="h-4 w-4" />
                {t('comparison.sideBySide')}
              </button>
              <button
                onClick={() => setCompareMode('overlay')}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  compareMode === 'overlay' 
                    ? 'bg-accent text-accent-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Layers className="h-4 w-4" />
                {t('comparison.overlay')}
              </button>
            </div>
          </div>

          {/* Selectors */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-chart-1/30 bg-chart-1/5 p-4">
              <p className="text-sm font-medium text-chart-1">Left Selection</p>
              <Select value={leftMunicipality} onValueChange={(v) => { setLeftMunicipality(v); setLeftWard(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Municipality" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {compareType === 'ward' && leftMuni && (
                <Select value={leftWard} onValueChange={setLeftWard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {leftMuni.wards.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-chart-2/30 bg-chart-2/5 p-4">
              <p className="text-sm font-medium text-chart-2">Right Selection</p>
              <Select value={rightMunicipality} onValueChange={(v) => { setRightMunicipality(v); setRightWard(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Municipality" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {compareType === 'ward' && rightMuni && (
                <Select value={rightWard} onValueChange={setRightWard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {rightMuni.wards.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {(leftSegments.total > 0 || rightSegments.total > 0) ? (
        <>
          {/* Total Comparison */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="card-shadow border-chart-1/30 bg-chart-1/5">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-medium text-chart-1">{leftLabel}</p>
                <p className="mt-2 text-4xl font-bold text-foreground">{leftSegments.total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">voters</p>
              </CardContent>
            </Card>
            <Card className="card-shadow border-chart-2/30 bg-chart-2/5">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-medium text-chart-2">{rightLabel}</p>
                <p className="mt-2 text-4xl font-bold text-foreground">{rightSegments.total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">voters</p>
              </CardContent>
            </Card>
          </div>

          {/* Age Comparison Chart */}
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('segments.byAge')} Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey={leftLabel} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={rightLabel} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gender Comparison Chart */}
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('segments.byGender')} Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genderComparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis 
                      dataKey="gender" 
                      type="category" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey={leftLabel} fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey={rightLabel} fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="card-shadow border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GitCompare className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-center text-muted-foreground">
              Select municipalities or wards to compare voter demographics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
