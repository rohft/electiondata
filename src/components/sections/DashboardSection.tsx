import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Map, FileSpreadsheet, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
];

export const DashboardSection = () => {
  const { t } = useLanguage();
  const { municipalities, getTotalVoters, getTotalWards, getSegmentCounts } = useVoterData();

  const totalVoters = getTotalVoters();
  const totalWards = getTotalWards();
  const totalFiles = municipalities.reduce((acc, m) => acc + m.wards.length, 0);
  const segments = getSegmentCounts();

  const genderData = Object.entries(segments.byGender).map(([name, value]) => ({
    name: t(`segments.${name}`),
    value,
  }));

  const ageData = Object.entries(segments.byAge).map(([range, count]) => ({
    range,
    count,
  }));

  const stats = [
    { 
      label: t('dashboard.totalVoters'), 
      value: totalVoters.toLocaleString(), 
      icon: Users,
      color: 'bg-chart-1/10 text-chart-1'
    },
    { 
      label: t('dashboard.totalMunicipalities'), 
      value: municipalities.length, 
      icon: Building2,
      color: 'bg-chart-2/10 text-chart-2'
    },
    { 
      label: t('dashboard.totalWards'), 
      value: totalWards, 
      icon: Map,
      color: 'bg-chart-3/10 text-chart-3'
    },
    { 
      label: t('dashboard.dataFiles'), 
      value: totalFiles, 
      icon: FileSpreadsheet,
      color: 'bg-chart-4/10 text-chart-4'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="card-shadow border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground counter-animate">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {totalVoters === 0 && (
        <Card className="card-shadow border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No data uploaded yet</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground max-w-md">
              Upload CSV files containing voter data to start analyzing demographics across municipalities and wards.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      {totalVoters > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gender Distribution */}
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Activity className="h-4 w-4 text-accent" />
                {t('segments.byGender')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {genderData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
              </div>
              <div className="mt-4 flex justify-center gap-6">
                {genderData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Age Distribution */}
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="h-4 w-4 text-accent" />
                {t('segments.byAge')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--chart-2))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Newar vs Non-Newar */}
          <Card className="card-shadow border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {t('segments.newar')} vs {t('segments.nonNewar')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-foreground">{t('segments.newar')}</span>
                    <span className="text-muted-foreground">{segments.newarVsNonNewar.newar}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div 
                      className="h-full rounded-full bg-chart-2 transition-all duration-500"
                      style={{ 
                        width: segments.total > 0 
                          ? `${(segments.newarVsNonNewar.newar / segments.total) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-foreground">{t('segments.nonNewar')}</span>
                    <span className="text-muted-foreground">{segments.newarVsNonNewar.nonNewar}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div 
                      className="h-full rounded-full bg-chart-1 transition-all duration-500"
                      style={{ 
                        width: segments.total > 0 
                          ? `${(segments.newarVsNonNewar.nonNewar / segments.total) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
