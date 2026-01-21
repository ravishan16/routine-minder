import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Clock, Sun, Moon, Download, ExternalLink, LogOut, Link2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { settingsApi, exportApi, getConfiguredScriptUrl, setScriptUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Settings } from "@/lib/schema";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [newScriptUrl, setNewScriptUrl] = useState(getConfiguredScriptUrl() || "");

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Settings>) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
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

  const handleExportJSON = async () => {
    try {
      const data = await exportApi.getData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `routine-minder-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Your data has been downloaded." });
    } catch (error) {
      toast({ title: "Export failed", description: "Could not export data.", variant: "destructive" });
    }
  };

  const handleUpdateScriptUrl = () => {
    if (newScriptUrl.trim()) {
      setScriptUrl(newScriptUrl.trim());
      toast({ title: "Updated", description: "Apps Script URL has been updated." });
      window.location.reload();
    }
  };

  const handleSignOut = () => {
    signOut();
    localStorage.removeItem("routineMinder_scriptUrl");
    window.location.reload();
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
                    Download your routine data as JSON
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleExportJSON}
                data-testid="button-export-json"
              >
                <Download className="w-4 h-4" />
                Download as JSON
              </Button>
            </Card>

            {/* Google Apps Script URL */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-base font-medium">Data Connection</Label>
                  <p className="text-xs text-muted-foreground">
                    Your Google Apps Script URL
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  value={newScriptUrl}
                  onChange={(e) => setNewScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/..."
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpdateScriptUrl}
                  className="w-full"
                >
                  Update Connection
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Your data is stored in your own Google Sheet for privacy and portability.
              </p>
            </Card>

            {/* Account Section */}
            {user && (
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.picture && (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <Label className="text-base font-medium">{user.name}</Label>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </Card>
            )}

            {/* About Section */}
            <Card className="p-4 space-y-4">
              <div>
                <Label className="text-base font-medium">About Routine Minder</Label>
                <p className="text-xs text-muted-foreground">Version 2.0 - PWA with Google Sheets</p>
              </div>

              <p className="text-sm text-muted-foreground">
                A simple, privacy-focused daily habit tracker. Your data is stored in your own Google Sheet,
                giving you full control and portability.
              </p>

              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-primary"
                onClick={() => window.open("https://github.com/your-repo/routine-minder", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View on GitHub
              </Button>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
