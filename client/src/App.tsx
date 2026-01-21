import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/bottom-nav";
import TodayPage from "@/pages/today";
import RoutinesPage from "@/pages/routines";
import DashboardPage from "@/pages/dashboard";
import SettingsPage from "@/pages/settings";
import SetupPage from "@/pages/setup";
import NotFound from "@/pages/not-found";
import { isApiConfigured } from "@/lib/api";

function Router() {
  const isConfigured = isApiConfigured();
  const hasUser = !!localStorage.getItem("routineMinder_user");
  
  // Show setup page if not configured or no user
  if (!isConfigured || !hasUser) {
    return <SetupPage />;
  }

  return (
    <Switch>
      <Route path="/" component={TodayPage} />
      <Route path="/routines" component={RoutinesPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/setup" component={SetupPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background max-w-lg mx-auto relative">
            <Router />
            {isApiConfigured() && localStorage.getItem("routineMinder_user") && <BottomNav />}
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
