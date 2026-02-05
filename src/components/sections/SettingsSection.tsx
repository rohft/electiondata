import { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomTags } from '@/contexts/CustomTagsContext';
import { useFont } from '@/contexts/FontContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, Monitor, Languages, Palette, Users, MapPin, Tag, Cloud, Type, Upload, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CloudTagInput } from '@/components/settings/CloudTagInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export const SettingsSection = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { 
    nepaliFont, 
    englishFont, 
    nepaliFontOptions, 
    englishFontOptions,
    customFonts,
    setNepaliFont, 
    setEnglishFont,
    addCustomFont,
    removeCustomFont
  } = useFont();
  const {
    tags,
    addCaste, removeCaste,
    addSurname, removeSurname,
    addNewarCategory, removeNewarCategory,
    addNonNewarCategory, removeNonNewarCategory,
    addTole, removeTole
  } = useCustomTags();

  const fileInputRef = useRef<HTMLInputElement>(null);
 
  const handleFontUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const validExtensions = ['.otf', '.ttf', '.woff', '.woff2'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      toast.error('Invalid font format. Use .otf, .ttf, .woff, or .woff2');
      return;
    }
    
    try {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        
        addCustomFont({
          id: Date.now().toString(),
          name: fontName,
          fileName: file.name,
          url: url,
        });
        
        toast.success(`Font "${fontName}" uploaded successfully`);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload font');
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
 
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

      {/* Font Settings */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Type className="h-4 w-4 text-accent" />
            Font Settings
          </CardTitle>
          <CardDescription>Choose fonts for Nepali and English text display</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nepali Font Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nepali Font (नेपाली फन्ट)</Label>
            <Select value={nepaliFont} onValueChange={setNepaliFont}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {nepaliFontOptions.map(font => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Preview: <span className="font-nepali" style={{ fontFamily: nepaliFont }}>यो नेपाली पाठ हो</span>
            </p>
          </div>
          
          {/* English Font Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">English Font</Label>
            <Select value={englishFont} onValueChange={setEnglishFont}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {englishFontOptions.map(font => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Preview: <span style={{ fontFamily: englishFont }}>This is English text</span>
            </p>
          </div>
          
          {/* Upload Custom Font */}
          <div className="space-y-3 pt-2 border-t border-border">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Custom Font
            </Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".otf,.ttf,.woff,.woff2"
                onChange={handleFontUpload}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: .otf, .ttf, .woff, .woff2
            </p>
            
            {/* Custom Fonts List */}
            {customFonts.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="text-xs text-muted-foreground">Custom Fonts:</Label>
                <div className="flex flex-wrap gap-2">
                  {customFonts.map(font => (
                    <Badge 
                      key={font.id} 
                      variant="secondary" 
                      className="gap-1 pr-1"
                    >
                      <span style={{ fontFamily: font.name }}>{font.name}</span>
                      {(nepaliFont === font.name || englishFont === font.name) && (
                        <Check className="h-3 w-3 text-accent ml-1" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                        onClick={() => removeCustomFont(font.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
