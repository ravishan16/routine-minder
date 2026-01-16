import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Clock, Sun, Moon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-base font-medium">About</Label>
                  <p className="text-xs text-muted-foreground">
                    Routine Minder v1.0
                  </p>
                </div>
              </div>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
