import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardSection } from '@/components/sections/DashboardSection';
import { UploadSection } from '@/components/sections/UploadSection';
import { SegmentsSection } from '@/components/sections/SegmentsSection';
import { ComparisonSection } from '@/components/sections/ComparisonSection';
import { InfographicsSection } from '@/components/sections/InfographicsSection';
import { TemplatesSection } from '@/components/sections/TemplatesSection';
import { EditSection } from '@/components/sections/EditSection';
import { ExportSection } from '@/components/sections/ExportSection';
import { SettingsSection } from '@/components/sections/SettingsSection';
import { HomePage } from '@/pages/Home';

const sectionTitles: Record<string, { titleKey: string; subtitleKey?: string }> = {
  dashboard: { titleKey: 'dashboard.title', subtitleKey: 'dashboard.subtitle' },
  upload: { titleKey: 'upload.title', subtitleKey: 'upload.description' },
  segments: { titleKey: 'segments.title' },
  comparison: { titleKey: 'comparison.title' },
  infographics: { titleKey: 'infographics.title' },
  templates: { titleKey: 'nav.templates' },
  edit: { titleKey: 'nav.edit' },
  export: { titleKey: 'export.title' },
  settings: { titleKey: 'nav.settings' },
};

export const MainLayout = () => {
  const [activeSection, setActiveSection] = useState('home');
  const { t } = useLanguage();

  // Show homepage when activeSection is 'home'
  if (activeSection === 'home') {
    return <HomePage onEnterDashboard={() => setActiveSection('dashboard')} />;
  }

  const currentSection = sectionTitles[activeSection] || sectionTitles.dashboard;

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />;
      case 'upload':
        return <UploadSection />;
      case 'segments':
        return <SegmentsSection />;
      case 'comparison':
        return <ComparisonSection />;
      case 'infographics':
        return <InfographicsSection />;
      case 'templates':
        return <TemplatesSection />;
      case 'edit':
        return <EditSection />;
      case 'export':
        return <ExportSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="pl-16 lg:pl-64 transition-all duration-300">
        <Header 
          title={t(currentSection.titleKey)} 
          subtitle={currentSection.subtitleKey ? t(currentSection.subtitleKey) : undefined}
        />
        <main className="p-6">
          <div className="fade-in">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
};
