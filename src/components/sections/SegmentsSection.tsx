import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Filter } from 'lucide-react';

export const SegmentsSection = () => {
  const { t } = useLanguage();
  const { municipalities, getSegmentCounts } = useVoterData();
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');

  const currentMunicipality = municipalities.find(m => m.id === selectedMunicipality);
  const segments = getSegmentCounts(
    selectedMunicipality !== 'all' ? selectedMunicipality : undefined,
    selectedWard !== 'all' ? selectedWard : undefined
  );

  // Sort and get top entries
  const sortedCastes = Object.entries(segments.byCaste)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const sortedSurnames = Object.entries(segments.bySurname)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

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
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
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
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none">
          <TabsTrigger value="gender">{t('segments.byGender')}</TabsTrigger>
          <TabsTrigger value="age">{t('segments.byAge')}</TabsTrigger>
          <TabsTrigger value="caste">{t('segments.byCaste')}</TabsTrigger>
          <TabsTrigger value="surname">{t('segments.bySurname')}</TabsTrigger>
        </TabsList>

        <TabsContent value="gender" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('segments.byGender')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {Object.entries(segments.byGender).map(([gender, count]) => (
                  <div key={gender} className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                    <p className="text-sm text-muted-foreground">{t(`segments.${gender}`)}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{count.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {segments.total > 0 ? ((count / segments.total) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="age" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t('segments.byAge')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {Object.entries(segments.byAge).map(([range, count]) => (
                  <div key={range} className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                    <p className="text-sm font-medium text-foreground">{range}</p>
                    <p className="mt-1 text-2xl font-bold text-accent">{count.toLocaleString()}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div 
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: segments.total > 0 ? `${(count / segments.total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caste" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                {t('segments.byCaste')}
                <Badge variant="secondary">{Object.keys(segments.byCaste).length} unique</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedCastes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                <div className="space-y-3">
                  {sortedCastes.map(([caste, count], index) => (
                    <div key={caste} className="flex items-center gap-4">
                      <span className="w-6 text-sm font-medium text-muted-foreground">{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{caste || 'Unknown'}</span>
                          <span className="text-sm text-muted-foreground">{count.toLocaleString()}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div 
                            className="h-full rounded-full bg-chart-1 transition-all"
                            style={{ width: sortedCastes[0] ? `${(count / sortedCastes[0][1]) * 100}%` : '0%' }}
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

        <TabsContent value="surname" className="fade-in">
          <Card className="card-shadow border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base font-semibold">
                {t('segments.bySurname')}
                <Badge variant="secondary">{Object.keys(segments.bySurname).length} unique</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedSurnames.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                <div className="space-y-3">
                  {sortedSurnames.map(([surname, count], index) => (
                    <div key={surname} className="flex items-center gap-4">
                      <span className="w-6 text-sm font-medium text-muted-foreground">{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{surname || 'Unknown'}</span>
                          <span className="text-sm text-muted-foreground">{count.toLocaleString()}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div 
                            className="h-full rounded-full bg-chart-2 transition-all"
                            style={{ width: sortedSurnames[0] ? `${(count / sortedSurnames[0][1]) * 100}%` : '0%' }}
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
      </Tabs>

      {/* Newar vs Non-Newar */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t('segments.newar')} vs {t('segments.nonNewar')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-chart-2/30 bg-chart-2/5 p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">{t('segments.newar')}</p>
              <p className="mt-2 text-4xl font-bold text-chart-2">{segments.newarVsNonNewar.newar.toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {segments.total > 0 ? ((segments.newarVsNonNewar.newar / segments.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="rounded-xl border border-chart-1/30 bg-chart-1/5 p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">{t('segments.nonNewar')}</p>
              <p className="mt-2 text-4xl font-bold text-chart-1">{segments.newarVsNonNewar.nonNewar.toLocaleString()}</p>
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
