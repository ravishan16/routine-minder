import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Sun, Moon, Download, Upload, Trash2, User, LogOut, Smartphone, Share2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { settingsApi, getGoogleUser, signInWithGoogle, signOutGoogle, deleteAccount } from "@/lib/storage";
import { exportData, importData, type ExportFormat, type ExportRange } from "@/lib/export";
import { requestNotificationPermission, subscribeToPushNotifications, isPushSupported } from "@/lib/notifications";
import type { Settings } from "@/lib/schema";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [exportRange, setExportRange] = useState<ExportRange>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });

  const { data: googleUser, refetch: refetchGoogleUser } = useQuery({
    queryKey: ["googleUser"],
    queryFn: getGoogleUser,
    staleTime: Infinity,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Settings>) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast({ title: "Notification permission denied", variant: "destructive" });
        return;
      }
      
      const subscribed = await subscribeToPushNotifications();
      if (subscribed) {
        updateMutation.mutate({ notificationsEnabled: true });
        toast({ title: "Notifications enabled" });
      } else {
        toast({ title: "Failed to enable notifications", variant: "destructive" });
      }
    } else {
      updateMutation.mutate({ notificationsEnabled: false });
      toast({ title: "Notifications disabled" });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportData(exportFormat, exportRange);
      toast({ title: "Exported successfully" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await importData(file);
      toast({ 
        title: "Import successful", 
        description: `Imported ${result.routines} routines` 
      });
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    } catch (err) {
      toast({ 
        title: "Import failed", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      await refetchGoogleUser();
      toast({ title: "Signed in successfully" });
    } catch (e) {
      toast({ 
        title: "Sign-in failed", 
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOutGoogle();
      await refetchGoogleUser();
      toast({ title: "Signed out" });
    } catch {
      toast({ title: "Sign-out failed", variant: "destructive" });
    }
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteAccount();
      if (success) {
        toast({ title: "Account deleted successfully" });
        window.location.reload();
      } else {
        // Still clear local data even if server delete fails
        toast({ 
          title: "Account data cleared",
          description: "Local data cleared. Server data may persist."
        });
        window.location.reload();
      }
    } catch {
      toast({ title: "Failed to delete account", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Routine Minder",
          text: "Check out this simple habit tracker!",
          url: window.location.origin,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      toast({ title: "Link copied to clipboard" });
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Account - Google Sign In */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Account & Sync
        </h2>
        <Separator />
        {googleUser ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {googleUser.photoURL && (
                  <img 
                    src={googleUser.photoURL} 
                    alt="" 
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-medium">{googleUser.displayName}</p>
                  <p className="text-xs text-muted-foreground">{googleUser.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleGoogleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Sync Enabled</p>
                <p className="text-xs text-muted-foreground">Your routines sync across all devices signed in with this Google account.</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Sign in with Google to sync your routines across multiple devices. Your data is backed up to the cloud automatically.
            </p>
            <Button onClick={handleGoogleSignIn} className="w-full" size="lg">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Without sign-in, your data only exists on this device
            </p>
          </>
        )}
      </Card>

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
        <h2 className="font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </h2>
        {isPushSupported() ? (
          <>
            <p className="text-sm text-muted-foreground">
              Get reminders to complete your routines.
            </p>
            <div className="flex items-center justify-between">
              <span>Enable Reminders</span>
              <Switch
                checked={settings?.notificationsEnabled || false}
                onCheckedChange={handleNotificationToggle}
                disabled={isLoading}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported in this browser.
          </p>
        )}
      </Card>

      {/* Export/Import */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export & Backup
        </h2>
        <p className="text-sm text-muted-foreground">
          Export your data as JSON or CSV for backup or analysis.
        </p>
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Format</label>
            <Select value={exportFormat} onValueChange={(v: string) => setExportFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Date Range</label>
            <Select value={exportRange} onValueChange={(v: string) => setExportRange(v as ExportRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExport} 
            disabled={isExporting} 
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <label className="flex-1">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              disabled={isImporting}
            />
            <Button 
              variant="outline" 
              disabled={isImporting}
              className="w-full"
              asChild
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? "Importing..." : "Import"}
              </span>
            </Button>
          </label>
        </div>
      </Card>

      {/* Install PWA */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          Install App
        </h2>
        <p className="text-sm text-muted-foreground">
          Add Routine Minder to your home screen for quick access.
        </p>
        <Separator />
        <div className="text-sm space-y-2">
          <p><strong>iOS:</strong> Tap Share → Add to Home Screen</p>
          <p><strong>Android:</strong> Tap Menu → Install App</p>
        </div>
        <Button variant="outline" onClick={handleShare} className="w-full">
          <Share2 className="h-4 w-4 mr-2" />
          Share App
        </Button>
      </Card>

      {/* Danger Zone */}
      <Card className="p-4 space-y-4 border-destructive/50">
        <h2 className="font-semibold text-destructive flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Danger Zone
        </h2>
        <Separator />
        
        {/* Clear Local Data */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Clear Local Data</p>
          <p className="text-xs text-muted-foreground">
            Remove all data from this device. Server data remains intact.
          </p>
          <Button variant="outline" onClick={handleClearData} className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Local Data
          </Button>
        </div>
        
        <Separator />
        
        {/* Delete Account */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Delete Account</p>
          <p className="text-xs text-muted-foreground">
            Permanently delete your account and all data from our servers. This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete Account?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All your routines</li>
                    <li>All completion history</li>
                    <li>All achievements and progress</li>
                    <li>Your account information</li>
                  </ul>
                  <p className="mt-3 font-medium text-destructive">
                    This action cannot be undone.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {/* About */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold">About</h2>
        <p className="text-sm text-muted-foreground">
          Routine Minder v2.2.0
        </p>
        <p className="text-xs text-muted-foreground">
          A simple habit tracker that works offline. Build better habits, track your progress, and celebrate your achievements.
        </p>
        
        <div className="flex flex-wrap gap-3 text-sm">
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Home
          </a>
          <span className="text-muted-foreground">•</span>
          <a 
            href="https://github.com/ravishan16/routine-minder" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub
          </a>
        </div>
      </Card>

      {/* Legal */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-sm">Legal</h2>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="space-y-1">
            <p className="font-medium text-foreground">Privacy Policy</p>
            <p>
              Your data is stored locally on your device and optionally synced to our secure cloud servers when you sign in with Google. We don't sell or share your personal information with third parties. Data is encrypted in transit.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Terms of Service</p>
            <p>
              By using Routine Minder, you agree to use it responsibly. We provide this service as-is without warranties. You can delete your account and all data at any time from the Danger Zone above.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Data Collection</p>
            <p>
              We collect only what's necessary: your Google profile info (if signed in) and your routine/completion data for sync. No analytics or tracking beyond basic Cloudflare metrics.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
