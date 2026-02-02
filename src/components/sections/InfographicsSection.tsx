import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Treemap 
} from 'recharts';
import { BarChart3, PieChartIcon, LayoutGrid, Palette } from 'lucide-react';

type ChartType = 'bar' | 'donut' | 'treemap';

const DEFAULT_COLORS = [
  '#2d5a7b', '#2a9d8f', '#e9c46a', '#9b5de5', '#f15bb5', '#4cc9f0'
];

export const InfographicsSection = () => {
  const { t } = useLanguage();
  const { municipalities, getSegmentCounts } = useVoterData();
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [dataType, setDataType] = useState<'gender' | 'age' | 'caste' | 'newar'>('gender');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);

  const segments = getSegmentCounts(selectedMunicipality !== 'all' ? selectedMunicipality : undefined);

  const getData = () => {
    switch (dataType) {
      case 'gender':
        return Object.entries(segments.byGender).map(([name, value]) => ({
          name: t(`segments.${name}`),
          value,
          size: value
        }));
      case 'age':
        return Object.entries(segments.byAge).map(([name, value]) => ({
          name,
          value,
          size: value
        }));
      case 'caste':
        return Object.entries(segments.byCaste)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, value]) => ({
            name: name || 'Unknown',
            value,
            size: value
          }));
      case 'newar':
        return [
          { name: t('segments.newar'), value: segments.newarVsNonNewar.newar, size: segments.newarVsNonNewar.newar },
          { name: t('segments.nonNewar'), value: segments.newarVsNonNewar.nonNewar, size: segments.newarVsNonNewar.nonNewar }
        ];
      default:
        return [];
    }
  };

  const data = getData();

  const chartOptions: { type: ChartType; icon: typeof BarChart3; label: string }[] = [
    { type: 'bar', icon: BarChart3, label: t('infographics.bar') },
    { type: 'donut', icon: PieChartIcon, label: t('infographics.donut') },
    { type: 'treemap', icon: LayoutGrid, label: t('infographics.treemap') },
  ];

  const updateColor = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    setColors(newColors);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('infographics.selectStyle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chart Type Selection */}
          <div className="flex flex-wrap gap-3">
            {chartOptions.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  chartType === type
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Data Type & Municipality */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data Category</Label>
              <Select value={dataType} onValueChange={(v) => setDataType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gender">{t('segments.byGender')}</SelectItem>
                  <SelectItem value="age">{t('segments.byAge')}</SelectItem>
                  <SelectItem value="caste">{t('segments.byCaste')}</SelectItem>
                  <SelectItem value="newar">{t('segments.newar')} vs {t('segments.nonNewar')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('common.municipality')}</Label>
              <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Municipalities</SelectItem>
                  {municipalities.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color Customization */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Label>Custom Colors</Label>
            </div>
            <div className="flex flex-wrap gap-3">
              {colors.slice(0, 6).map((color, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => updateColor(index, e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border-0 p-0"
                  />
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {dataType === 'gender' && t('segments.byGender')}
            {dataType === 'age' && t('segments.byAge')}
            {dataType === 'caste' && t('segments.byCaste')}
            {dataType === 'newar' && `${t('segments.newar')} vs ${t('segments.nonNewar')}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              No data available. Upload CSV files to visualize.
            </div>
          ) : (
            <div className="h-80">
              {chartType === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === 'donut' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    >
                      {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartType === 'treemap' && (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={data}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="hsl(var(--background))"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Treemap>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Legend */}
          {data.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {data.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
