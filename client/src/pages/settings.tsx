import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Sun, Moon, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { settingsApi, routinesApi } from "@/lib/storage";
import type { Settings } from "@/lib/schema";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Settings>) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Settings saved" });
    },
  });

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({ title: "Permission denied", variant: "destructive" });
        return;
      }
    }
    updateMutation.mutate({ notificationsEnabled: enabled });
  };

  const handleExport = async () => {
    try {
      const routines = await routinesApi.getAll();
      const data = {
        routines,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `routine-minder-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported successfully" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Appearance */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span>Dark Mode</span>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold">Notifications</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5" />
            <span>Enable Reminders</span>
          </div>
          <Switch
            checked={settings?.notificationsEnabled || false}
            onCheckedChange={handleNotificationToggle}
            disabled={isLoading}
          />
        </div>
      </Card>

      {/* Data */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold">Data</h2>
        <p className="text-sm text-muted-foreground">
          Your data is stored locally on this device and synced to the cloud when online.
        </p>
        <Separator />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="destructive" onClick={handleClearData} className="flex-1">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Data
          </Button>
        </div>
      </Card>

      {/* About */}
      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">About</h2>
        <p className="text-sm text-muted-foreground">
          Routine Minder v2.0.0
        </p>
        <p className="text-xs text-muted-foreground">
          A simple habit tracker that works offline.
        </p>
      </Card>
    </div>
  );
}
