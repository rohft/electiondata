import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sun, Moon, Monitor, Languages, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SettingsSection = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

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
    <div className="max-w-2xl space-y-6">
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
