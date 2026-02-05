import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardSection } from '@/components/sections/DashboardSection';
import { UploadSection } from '@/components/sections/UploadSection';
import { MapSection } from '@/components/sections/MapSection';
import { SegmentsSection } from '@/components/sections/SegmentsSection';
import { CasteSection } from '@/components/sections/CasteSection';
import { ComparisonSection } from '@/components/sections/ComparisonSection';
import { InfographicsSection } from '@/components/sections/InfographicsSection';
import { TemplatesSection } from '@/components/sections/TemplatesSection';

import { ExportSection } from '@/components/sections/ExportSection';
import { SettingsSection } from '@/components/sections/SettingsSection';
import { HomePage } from '@/pages/Home';

interface MainLayoutProps {
  section?: string;
}

const sectionTitles: Record<string, { titleKey: string; subtitleKey?: string }> = {
  dashboard: { titleKey: 'dashboard.title', subtitleKey: 'dashboard.subtitle' },
  upload: { titleKey: 'upload.title', subtitleKey: 'upload.description' },
  map: { titleKey: 'map.title', subtitleKey: 'map.description' },
  caste: { titleKey: 'nav.ethnicGroup' },
  segments: { titleKey: 'segments.title' },
  comparison: { titleKey: 'comparison.title' },
  infographics: { titleKey: 'infographics.title' },
  templates: { titleKey: 'nav.templates' },
  
  export: { titleKey: 'export.title' },
  settings: { titleKey: 'nav.settings' },
};

export const MainLayout = ({ section }: MainLayoutProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active section from prop or URL
  const activeSection = section || (location.pathname === '/' ? 'home' : location.pathname.slice(1));

  const handleSectionChange = (newSection: string) => {
    if (newSection === 'home') {
      navigate('/');
    } else {
      navigate(`/${newSection}`);
    }
  };

  // Show homepage when activeSection is 'home'
  if (activeSection === 'home') {
    return <HomePage onEnterDashboard={() => handleSectionChange('dashboard')} />;
  }

  const currentSection = sectionTitles[activeSection] || sectionTitles.dashboard;

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />;
      case 'upload':
        return <UploadSection />;
      case 'map':
        return <MapSection />;
      case 'caste':
        return <CasteSection />;
      case 'segments':
        return <SegmentsSection />;
      case 'comparison':
        return <ComparisonSection />;
      case 'infographics':
        return <InfographicsSection />;
      case 'templates':
        return <TemplatesSection />;
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
      <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
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
