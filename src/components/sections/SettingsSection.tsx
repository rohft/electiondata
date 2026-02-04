import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomTags } from '@/contexts/CustomTagsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sun, Moon, Monitor, Languages, Palette, Users, MapPin, Tag, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CloudTagInput } from '@/components/settings/CloudTagInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const SettingsSection = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const {
    tags,
    addCaste, removeCaste,
    addSurname, removeSurname,
    addNewarCategory, removeNewarCategory,
    addNonNewarCategory, removeNonNewarCategory,
    addTole, removeTole
  } = useCustomTags();

  const themeOptions = [
    { value: 'light', label: t('theme.light'), icon: Sun },
    { value: 'dark', label: t('theme.dark'), icon: Moon },
    { value: 'system', label: t('theme.system'), icon: Monitor },
  ] as const;

  const languageOptions = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'ne', label: 'नेपाली', flag: '🇳🇵' },
  ] as const;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Theme Settings */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Palette className="h-4 w-4 text-accent" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                      theme === option.value
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', theme === option.value ? 'text-accent' : 'text-muted-foreground')} />
                    <span className={cn('text-sm font-medium', theme === option.value ? 'text-foreground' : 'text-muted-foreground')}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Languages className="h-4 w-4 text-accent" />
            Language
          </CardTitle>
          <CardDescription>Select your preferred language</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setLanguage(option.value)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 p-4 transition-all',
                  language === option.value
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-accent/50'
                )}
              >
                <span className="text-2xl">{option.flag}</span>
                <span className={cn('font-medium', language === option.value ? 'text-foreground' : 'text-muted-foreground')}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cloud Tags - Demographics */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Cloud className="h-4 w-4 text-accent" />
            <Users className="h-4 w-4 text-accent" />
            Demographic Cloud Tags
          </CardTitle>
          <CardDescription>
            Manage caste, surname, and Newar/Non-Newar categories. These tags are saved and available across all projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="caste" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="caste">Caste</TabsTrigger>
              <TabsTrigger value="surname">Surname</TabsTrigger>
              <TabsTrigger value="newar">Newar</TabsTrigger>
              <TabsTrigger value="non-newar">Non-Newar</TabsTrigger>
            </TabsList>

            <TabsContent value="caste" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <Tag className="h-3.5 w-3.5 inline mr-1.5" />
                  Caste Categories ({tags.castes.length})
                </Label>
                <CloudTagInput
                  tags={tags.castes}
                  onAddTag={addCaste}
                  onRemoveTag={removeCaste}
                  placeholder="Add new caste (e.g., Brahmin, Chhetri)..."
                />
              </div>
            </TabsContent>

            <TabsContent value="surname" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <Tag className="h-3.5 w-3.5 inline mr-1.5" />
                  Surname List ({tags.surnames.length})
                </Label>
                <CloudTagInput
                  tags={tags.surnames}
                  onAddTag={addSurname}
                  onRemoveTag={removeSurname}
                  placeholder="Add new surname (e.g., Shrestha, Sharma)..."
                />
              </div>
            </TabsContent>

            <TabsContent value="newar" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <Tag className="h-3.5 w-3.5 inline mr-1.5" />
                  Newar Surnames ({tags.newarCategories.length})
                </Label>
                <CloudTagInput
                  tags={tags.newarCategories}
                  onAddTag={addNewarCategory}
                  onRemoveTag={removeNewarCategory}
                  placeholder="Add Newar surname (e.g., Shakya, Maharjan)..."
                  tagClassName="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
                />
              </div>
            </TabsContent>

            <TabsContent value="non-newar" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <Tag className="h-3.5 w-3.5 inline mr-1.5" />
                  Non-Newar Surnames ({tags.nonNewarCategories.length})
                </Label>
                <CloudTagInput
                  tags={tags.nonNewarCategories}
                  onAddTag={addNonNewarCategory}
                  onRemoveTag={removeNonNewarCategory}
                  placeholder="Add Non-Newar surname (e.g., Sharma, Gurung)..."
                  tagClassName="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cloud Tags - Tole/Location */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Cloud className="h-4 w-4 text-accent" />
            <MapPin className="h-4 w-4 text-accent" />
            Tole / Location Cloud Tags
          </CardTitle>
          <CardDescription>
            Manage location/neighborhood (Tole) names. These suggestions are available when editing voter records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="text-sm font-medium mb-2 block">
            <Tag className="h-3.5 w-3.5 inline mr-1.5" />
            Tole Names ({tags.toles.length})
          </Label>
          <CloudTagInput
            tags={tags.toles}
            onAddTag={addTole}
            onRemoveTag={removeTole}
            placeholder="Add new Tole name (e.g., Kamaladi, Baluwatar)..."
            tagClassName="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
          />
        </CardContent>
      </Card>

      {/* About */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">About VoterPulse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            VoterPulse is a comprehensive voter analysis tool designed for municipalities in Nepal. 
            It enables data-driven insights into voter demographics across wards and municipalities.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <div className="rounded-lg bg-muted px-3 py-1.5">
              <span className="text-xs font-medium text-foreground">Version 1.0.0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
