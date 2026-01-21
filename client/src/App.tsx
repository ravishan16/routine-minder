import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { BottomNav } from "@/components/bottom-nav";
import { LandingPage } from "@/components/landing-page";
import TodayPage from "@/pages/today";
import RoutinesPage from "@/pages/routines";
import DashboardPage from "@/pages/dashboard";
import SettingsPage from "@/pages/settings";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import AboutPage from "@/pages/about";
import NotFound from "@/pages/not-found";
import { initAuth, startBackgroundSync, hasVisited, setVisited } from "@/lib/storage";

// Public pages that don't require auth
const PUBLIC_ROUTES = ["/privacy", "/terms", "/about"];

function Router() {
  return (
    <Switch>
      <Route path="/" component={TodayPage} />
      <Route path="/routines" component={RoutinesPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/about" component={AboutPage} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const [showLanding, setShowLanding] = useState(!hasVisited());
  
  // Check if current route is a public page
  const isPublicRoute = PUBLIC_ROUTES.includes(location);
  
  // Public routes render without landing check
  if (isPublicRoute) {
    return <PublicRouter />;
  }

  const handleGetStarted = () => {
    setVisited();
    setShowLanding(false);
  };

  // Show landing page for first-time visitors
  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Go directly to app - Today page shows empty state if no routines
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative pb-20">
      <Router />
      <BottomNav />
    </div>
  );
}

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize auth and start background sync
    initAuth().then(() => {
      setIsReady(true);
      startBackgroundSync();
    });
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
