import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { VoterDataProvider } from '@/contexts/VoterDataContext';
import { CustomTagsProvider } from '@/contexts/CustomTagsContext';
import { FontProvider } from '@/contexts/FontContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicRoute } from '@/components/auth/PublicRoute';
import HomePage from '@/pages/Home';
import SignUp from '@/pages/SignUp';
import SignIn from '@/pages/SignIn';
import OnAuthSuccess from '@/pages/OnAuthSuccess';

const queryClient = new QueryClient();

// Wrapper component for Home page to access navigation
const HomePageWrapper = () => {
  const navigate = useNavigate();
  return <HomePage onEnterDashboard={() => navigate('/dashboard')} />;
};

const App = () =>
<QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <VoterDataProvider>
              <CustomTagsProvider>
                <FontProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <Routes>
                      {/* Public Home Page - Accessible to Everyone */}
                      <Route path="/" element={<HomePageWrapper />} />
                      
                      {/* Protected Routes - Require Authentication */}
                      <Route path="/dashboard" element={<ProtectedRoute><MainLayout section="dashboard" /></ProtectedRoute>} />
                      <Route path="/upload" element={<ProtectedRoute><MainLayout section="upload" /></ProtectedRoute>} />
                      <Route path="/map" element={<ProtectedRoute><MainLayout section="map" /></ProtectedRoute>} />
                      <Route path="/category-mgmt" element={<ProtectedRoute><MainLayout section="category-mgmt" /></ProtectedRoute>} />
                      <Route path="/segments" element={<ProtectedRoute><MainLayout section="segments" /></ProtectedRoute>} />
                      <Route path="/comparison" element={<ProtectedRoute><MainLayout section="comparison" /></ProtectedRoute>} />
                      <Route path="/infographics" element={<ProtectedRoute><MainLayout section="infographics" /></ProtectedRoute>} />
                      <Route path="/templates" element={<ProtectedRoute><MainLayout section="templates" /></ProtectedRoute>} />
                      <Route path="/export" element={<ProtectedRoute><MainLayout section="export" /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><MainLayout section="settings" /></ProtectedRoute>} />
                      
                      {/* Public Routes - Redirect if Already Authenticated */}
                      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
                      <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
                      
                      {/* Public Route - No redirect */}
                      <Route path="/onauthsuccess" element={<OnAuthSuccess />} />
                      
                      {/* Catch all - redirect to home */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </TooltipProvider>
                </FontProvider>
              </CustomTagsProvider>
            </VoterDataProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>;


export default App;