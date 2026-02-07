import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { VoterDataProvider } from '@/contexts/VoterDataContext';
import { CustomTagsProvider } from '@/contexts/CustomTagsContext';
import { FontProvider } from '@/contexts/FontContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';

const queryClient = new QueryClient();

const App = () =>
<QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <VoterDataProvider>
            <CustomTagsProvider>
                <FontProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <Routes>
                      <Route path="/" element={<MainLayout />} />
                      <Route path="/dashboard" element={<MainLayout section="dashboard" />} />
                      <Route path="/upload" element={<MainLayout section="upload" />} />
                      <Route path="/map" element={<MainLayout section="map" />} />

                      <Route path="/category-mgmt" element={<MainLayout section="category-mgmt" />} />
                      <Route path="/segments" element={<MainLayout section="segments" />} />
                      <Route path="/comparison" element={<MainLayout section="comparison" />} />
                      <Route path="/infographics" element={<MainLayout section="infographics" />} />
                      <Route path="/templates" element={<MainLayout section="templates" />} />
                      
                      <Route path="/export" element={<MainLayout section="export" />} />
                      <Route path="/settings" element={<MainLayout section="settings" />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </TooltipProvider>
                </FontProvider>
            </CustomTagsProvider>
          </VoterDataProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>;


export default App;