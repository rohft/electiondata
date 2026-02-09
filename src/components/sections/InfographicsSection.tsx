import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Treemap, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, AreaChart, Area, FunnelChart, Funnel, LabelList } from
'recharts';
import {
  BarChart3, PieChartIcon, LayoutGrid, Palette, Target, TrendingUp,
  Filter, Plus, Grid3X3, Gauge, Hash, Users, Activity } from
'lucide-react';
import { cn } from '@/lib/utils';

type ChartType = 'bar' | 'donut' | 'treemap' | 'radar' | 'area' | 'funnel';
type WidgetType = 'statCard' | 'counter' | 'gauge' | 'miniChart';

interface Widget {
  id: string;
  type: WidgetType;
  dataType: 'gender' | 'age' | 'caste' | 'newar';
  title: string;
}

const DEFAULT_COLORS = [
'#2d5a7b', '#2a9d8f', '#e9c46a', '#9b5de5', '#f15bb5', '#4cc9f0',
'#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];


const CHART_OPTIONS: {type: ChartType;icon: typeof BarChart3;labelKey: string;}[] = [
{ type: 'bar', icon: BarChart3, labelKey: 'infographics.bar' },
{ type: 'donut', icon: PieChartIcon, labelKey: 'infographics.donut' },
{ type: 'treemap', icon: LayoutGrid, labelKey: 'infographics.treemap' },
{ type: 'radar', icon: Target, labelKey: 'infographics.radar' },
{ type: 'area', icon: TrendingUp, labelKey: 'infographics.area' },
{ type: 'funnel', icon: Filter, labelKey: 'infographics.funnel' }];


const WIDGET_OPTIONS: {type: WidgetType;icon: typeof Hash;label: string;}[] = [
{ type: 'statCard', icon: Grid3X3, label: 'Stat Cards' },
{ type: 'counter', icon: Hash, label: 'Animated Counters' },
{ type: 'gauge', icon: Gauge, label: 'Gauge Charts' },
{ type: 'miniChart', icon: Activity, label: 'Mini Charts' }];


export const InfographicsSection = () => {
  const { t } = useLanguage();
  const { municipalities, getSegmentCounts } = useVoterData();
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [dataType, setDataType] = useState<'gender' | 'age' | 'caste' | 'newar'>('gender');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
  const [widgets, setWidgets] = useState<Widget[]>([
  { id: '1', type: 'statCard', dataType: 'gender', title: 'Gender Distribution' },
  { id: '2', type: 'counter', dataType: 'age', title: 'Age Groups' }]
  );
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);

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
        return Object.entries(segments.bySurname).
        sort((a, b) => b[1] - a[1]).
        slice(0, 8).
        map(([name, value]) => ({
          name: name || 'Unknown',
          value,
          size: value
        }));
      case 'newar':
        return [];

      default:
        return [];
    }
  };

  const data = getData();

  const updateColor = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    setColors(newColors);
  };

  const addWidget = (type: WidgetType) => {
    const newWidget: Widget = {
      id: crypto.randomUUID(),
      type,
      dataType: 'gender',
      title: `${type} Widget`
    };
    setWidgets([...widgets, newWidget]);
    setShowWidgetSelector(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          No data available. Upload CSV files to visualize.
        </div>);

    }

    const chartHeight = 320;

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60} />

              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }} />

              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((_, index) =>
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>);


      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
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
                labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}>

                {data.map((_, index) =>
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                )}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }} />

            </PieChart>
          </ResponsiveContainer>);


      case 'treemap':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <Treemap
              data={data}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="hsl(var(--background))">

              {data.map((_, index) =>
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              )}
            </Treemap>
          </ResponsiveContainer>);


      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <RadarChart data={data}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />

              <PolarRadiusAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Radar
                name="Value"
                dataKey="value"
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.5} />

              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }} />

            </RadarChart>
          </ResponsiveContainer>);


      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60} />

              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }} />

              <Area
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.3} />

            </AreaChart>
          </ResponsiveContainer>);


      case 'funnel':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }} />

              <Funnel
                data={data.sort((a, b) => b.value - a.value)}
                dataKey="value"
                nameKey="name">

                {data.map((_, index) =>
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                )}
                <LabelList
                  position="right"
                  fill="hsl(var(--foreground))"
                  fontSize={12}
                  dataKey="name" />

              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>);


      default:
        return null;
    }
  };

  const renderWidget = (widget: Widget) => {
    const widgetSegments = getSegmentCounts(selectedMunicipality !== 'all' ? selectedMunicipality : undefined);

    switch (widget.type) {
      case 'statCard':
        return (
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(widgetSegments.byGender).map(([gender, count], idx) =>
            <div
              key={gender}
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: `${colors[idx]}15`, borderColor: colors[idx] }}>

                <p className="text-xs text-muted-foreground capitalize">{gender}</p>
                <p className="text-lg font-bold" style={{ color: colors[idx] }}>{count.toLocaleString()}</p>
              </div>
            )}
          </div>);


      case 'counter':
        return (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl font-bold text-accent counter-animate">
                {widgetSegments.total.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Total Voters</p>
            </div>
          </div>);


      case 'gauge':
        const malePercent = widgetSegments.total > 0 ?
        widgetSegments.byGender.male / widgetSegments.total * 100 :
        0;
        return (
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-16 overflow-hidden">
              <div className="absolute w-32 h-32 border-[16px] border-muted rounded-full"></div>
              <div
                className="absolute w-32 h-32 border-[16px] rounded-full transition-all duration-1000"
                style={{
                  borderColor: colors[0],
                  clipPath: `polygon(0 0, ${malePercent}% 0, ${malePercent}% 100%, 0 100%)`
                }}>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">{malePercent.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Male Voters</p>
          </div>);


      case 'miniChart':
        const miniData = Object.entries(widgetSegments.byAge).map(([name, value]) => ({ name, value }));
        return (
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={miniData}>
              <Area type="monotone" dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>);


      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="widgets" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            {t('infographics.widgets')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          {/* Controls */}
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('infographics.selectStyle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Chart Type Selection */}
              <div className="flex flex-wrap gap-2">
                {CHART_OPTIONS.map(({ type, icon: Icon, labelKey }) =>
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    chartType === type ?
                    'bg-accent text-accent-foreground shadow-md' :
                    'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}>

                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t(labelKey)}</span>
                  </button>
                )}
              </div>

              {/* Data Type & Municipality */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
                      {municipalities.map((m) =>
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      )}
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
                  {colors.slice(0, 6).map((color, index) =>
                  <div key={index} className="flex items-center gap-2">
                      <Input
                      type="color"
                      value={color}
                      onChange={(e) => updateColor(index, e.target.value)}
                      className="h-8 w-12 cursor-pointer rounded border-0 p-0" />

                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    </div>
                  )}
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
              <div className="min-h-[320px]">
                {renderChart()}
              </div>

              {/* Legend */}
              {data.length > 0 &&
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                  {data.map((item, index) =>
                <div key={item.name} className="flex items-center gap-2">
                      <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }} />

                      <span className="text-sm text-muted-foreground">
                        {item.name}: {item.value.toLocaleString()}
                      </span>
                    </div>
                )}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="widgets" className="space-y-6">
          {/* Widget Controls */}
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                {t('infographics.widgets')}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWidgetSelector(!showWidgetSelector)}
                  className="gap-2">

                  <Plus className="h-4 w-4" />
                  {t('infographics.addWidget')}
                </Button>
              </CardTitle>
            </CardHeader>
            {showWidgetSelector &&
            <CardContent className="border-t border-border pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {WIDGET_OPTIONS.map(({ type, icon: Icon, label }) =>
                <button
                  key={type}
                  onClick={() => addWidget(type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-dashed border-border hover:border-accent hover:bg-accent/5 transition-all">

                      <Icon className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                )}
                </div>
              </CardContent>
            }
          </Card>

          {/* Widgets Grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {widgets.map((widget) =>
            <Card key={widget.id} className="card-shadow border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    {widget.title}
                    <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeWidget(widget.id)}>

                      ×
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderWidget(widget)}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>);

};