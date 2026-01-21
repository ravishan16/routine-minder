import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { BottomNav } from "@/components/bottom-nav";
import { Onboarding } from "@/components/onboarding";
import TodayPage from "@/pages/today";
import RoutinesPage from "@/pages/routines";
import DashboardPage from "@/pages/dashboard";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { initAuth, startBackgroundSync, routinesApi, isOnboarded, setOnboarded } from "@/lib/storage";
import type { TimeCategory } from "@/lib/schema";

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

function AppContent() {
  const { data: routines, isLoading } = useQuery({
    queryKey: ["routines"],
    queryFn: routinesApi.getAll,
  });

  const createRoutinesMutation = useMutation({
    mutationFn: async (routinesToCreate: { name: string; timeCategories: TimeCategory[] }[]) => {
      for (const routine of routinesToCreate) {
        await routinesApi.create(routine);
      }
      setOnboarded();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });

  // Show onboarding if no routines and not yet onboarded
  const showOnboarding = !isLoading && (!routines || routines.length === 0) && !isOnboarded();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={createRoutinesMutation.mutate}
        isLoading={createRoutinesMutation.isPending}
      />
    );
  }

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
