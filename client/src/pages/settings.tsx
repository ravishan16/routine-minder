import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Clock, Sun, Moon, Info, Download, FileSpreadsheet, Shield, FileText, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Settings } from "@shared/schema";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Settings>) => apiRequest("PUT", "/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    },
  });

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast({ title: "Notifications enabled", description: "You'll receive routine reminders." });
      return true;
    } else {
      toast({
        title: "Permission denied",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;
    }
    updateMutation.mutate({ notificationsEnabled: enabled });
  };

  const handleTimeChange = (field: keyof Settings, value: string) => {
    updateMutation.mutate({ [field]: value });
  };

  const handleExportCSV = () => {
    window.open("/api/export/csv", "_blank");
    toast({ title: "Exporting CSV", description: "Your data is being downloaded." });
  };

  const handleExportJSON = () => {
    window.open("/api/export/json", "_blank");
    toast({ title: "Exporting JSON", description: "Your data is being downloaded." });
  };

  const handleExportGoogleSheets = async () => {
    try {
      const response = await fetch("/api/export/csv");
      const csvData = await response.text();
      
      // Copy to clipboard for manual paste into Google Sheets
      await navigator.clipboard.writeText(csvData);
      toast({ 
        title: "Copied to Clipboard", 
        description: "Open Google Sheets and paste (Ctrl+V) to import your data." 
      });
    } catch (error) {
      toast({ 
        title: "Export Ready", 
        description: "Download the CSV file and import it into Google Sheets.", 
        variant: "destructive" 
      });
      handleExportCSV();
    }
  };

  const handleExportICloud = () => {
    // Export JSON for iCloud - user can save to iCloud Drive
    handleExportJSON();
    toast({ 
      title: "Save to iCloud", 
      description: "Save the downloaded file to your iCloud Drive for sync." 
    });
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : settings ? (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === "light" ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-400" />
                  )}
                  <div>
                    <Label className="text-base font-medium">Dark Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      {theme === "light" ? "Light theme active" : "Dark theme active"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  data-testid="switch-dark-mode"
                />
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <Label className="text-base font-medium">Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Get reminded about your routines
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                  data-testid="switch-notifications"
                />
              </div>

              {settings.notificationsEnabled && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    Set default notification times for each period
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="am-time" className="text-xs text-muted-foreground">
                        Morning
                      </Label>
                      <Input
                        id="am-time"
                        type="time"
                        value={settings.amNotificationTime}
                        onChange={(e) => handleTimeChange("amNotificationTime", e.target.value)}
                        className="text-sm"
                        data-testid="input-am-time"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="noon-time" className="text-xs text-muted-foreground">
                        Noon
                      </Label>
                      <Input
                        id="noon-time"
                        type="time"
                        value={settings.noonNotificationTime}
                        onChange={(e) => handleTimeChange("noonNotificationTime", e.target.value)}
                        className="text-sm"
                        data-testid="input-noon-time"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pm-time" className="text-xs text-muted-foreground">
                        Evening
                      </Label>
                      <Input
                        id="pm-time"
                        type="time"
                        value={settings.pmNotificationTime}
                        onChange={(e) => handleTimeChange("pmNotificationTime", e.target.value)}
                        className="text-sm"
                        data-testid="input-pm-time"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Export Data Section */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-base font-medium">Export Your Data</Label>
                  <p className="text-xs text-muted-foreground">
                    Download or sync your routine data
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={handleExportCSV}
                  data-testid="button-export-csv"
                >
                  <FileText className="w-4 h-4" />
                  Download as CSV
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={handleExportJSON}
                  data-testid="button-export-json"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download as JSON
                </Button>

                <Separator className="my-3" />
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={handleExportGoogleSheets}
                  data-testid="button-export-google"
                >
                  <ExternalLink className="w-4 h-4" />
                  Copy for Google Sheets
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={handleExportICloud}
                  data-testid="button-export-icloud"
                >
                  <ExternalLink className="w-4 h-4" />
                  Export for iCloud
                </Button>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Export your data anytime. For Google Sheets, data is copied to clipboard - paste into a new sheet.
                For iCloud, save the downloaded file to your iCloud Drive.
              </p>
            </Card>

            {/* About Section */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-base font-medium">About Routine Minder</Label>
                  <p className="text-xs text-muted-foreground">Version 1.0</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Routine Minder is a simple, privacy-focused daily habit tracker. Build healthy habits by tracking your daily routines, 
                monitor your progress with streaks and milestones, and stay motivated on your journey to better habits.
              </p>

              <Separator />

              {/* Privacy & Data Control */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <Label className="text-sm font-medium">Your Data, Your Control</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      All your data is stored locally. We do not track, collect, or share any of your personal information or habit data.
                      You have full control over your data at all times.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <Label className="text-sm font-medium">Data Disclaimer</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      This app uses in-memory storage. Data may be lost when the server restarts. 
                      We strongly recommend exporting your data regularly. We are not responsible for any loss of data.
                      Please use the export feature above to backup your habits.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Legal Links */}
              <div className="space-y-2">
                <a 
                  href="/privacy" 
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                  data-testid="link-privacy"
                >
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </a>
                <a 
                  href="/terms" 
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                  data-testid="link-terms"
                >
                  <FileText className="w-4 h-4" />
                  Terms of Service
                </a>
              </div>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
