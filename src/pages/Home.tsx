import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, Users, PieChart, TrendingUp, Upload, Shield, 
  Zap, Globe2, ArrowRight, Play, CheckCircle2, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomePageProps {
  onEnterDashboard: () => void;
}

const features = [
  {
    icon: Upload,
    title: 'Easy Data Upload',
    description: 'Upload CSV, Excel, or JSON files with automatic field detection and validation.',
  },
  {
    icon: PieChart,
    title: 'Smart Segmentation',
    description: 'Automatic categorization by age, gender, caste, and surname with AI-powered detection.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Interactive charts, widgets, and customizable visualizations for deep insights.',
  },
  {
    icon: Globe2,
    title: 'Bilingual Support',
    description: 'Full English and Nepali language support for all data views and exports.',
  },
];

const stats = [
  { value: '100K+', label: 'Records Processed' },
  { value: '50+', label: 'Municipalities' },
  { value: '99.9%', label: 'Accuracy Rate' },
];

export const HomePage = ({ onEnterDashboard }: HomePageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent shadow-lg">
                <BarChart3 className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">VoterPulse</span>
              <Badge variant="secondary" className="hidden sm:inline-flex">Beta</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Documentation
              </Button>
              <Button onClick={onEnterDashboard} className="gap-2">
                <Zap className="h-4 w-4" />
                Launch App
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={cn(
            "text-center transition-all duration-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-accent/50">
              <Sparkles className="h-3.5 w-3.5 mr-2 text-accent" />
              Professional Voter Data Analysis Platform
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="text-foreground">Transform Voter Data into</span>
              <br />
              <span className="text-gradient">Actionable Insights</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Comprehensive voter analysis across municipalities and wards. 
              Upload, segment, visualize, and export demographic data with powerful analytics tools.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={onEnterDashboard} className="gap-2 text-lg px-8 py-6">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6">
                <Play className="h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className={cn(
            "mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto transition-all duration-1000 delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Powerful Features for <span className="text-accent">Data Analysis</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage, analyze, and visualize voter demographics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === activeFeature;
              return (
                <Card 
                  key={index}
                  className={cn(
                    "card-shadow border-border/50 transition-all duration-500 cursor-pointer",
                    isActive && "border-accent shadow-lg scale-105"
                  )}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <CardContent className="p-6">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl mb-4 transition-colors",
                      isActive ? "gradient-accent" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-6 w-6",
                        isActive ? "text-accent-foreground" : "text-muted-foreground"
                      )} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="card-shadow-heavy gradient-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60" />
            <CardContent className="relative z-10 p-8 sm:p-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Ready to Analyze Your Voter Data?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Start uploading your municipality data and get instant insights with 
                powerful visualization tools and export options.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={onEnterDashboard}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Enter Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            <span className="font-semibold">VoterPulse</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 VoterPulse. Built for professional voter data analysis.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
