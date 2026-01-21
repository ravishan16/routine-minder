import { useState, useEffect } from "react";
import { CheckCircle2, Smartphone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Pre-deployed Google Apps Script URL
// This runs as "User accessing the web app" so data goes to THEIR Google Drive
const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "";

export default function SetupPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleSignIn = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Open the Apps Script URL - it will handle Google Sign-In
      // The script runs as "User accessing the web app" so it uses THEIR Google account
      const authUrl = `${SCRIPT_URL}?action=auth`;
      
      // Open in popup for auth
      const popup = window.open(
        authUrl,
        "Google Sign In",
        "width=500,height=600,menubar=no,toolbar=no"
      );

      // Listen for callback
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "ROUTINE_MINDER_AUTH") {
          if (event.data.success) {
            localStorage.setItem("routineMinder_scriptUrl", SCRIPT_URL);
            localStorage.setItem("routineMinder_user", JSON.stringify(event.data.user));
            window.location.reload();
          } else {
            setError(event.data.error || "Sign in failed");
          }
          popup?.close();
          setIsConnecting(false);
        }
      };

      window.addEventListener("message", handleMessage);

      // Check if popup was closed without completing
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          setIsConnecting(false);
        }
      }, 500);

    } catch (err) {
      setError("Failed to connect. Please try again.");
      setIsConnecting(false);
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      (deferredPrompt as any).prompt();
      const result = await (deferredPrompt as any).userChoice;
      if (result.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    }
  };

  // Detect if running as installed PWA
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-8">
        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-primary rounded-2xl mx-auto flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Routine Minder</h1>
          <p className="text-muted-foreground">
            Build better habits, one day at a time
          </p>
        </div>

        {/* Main Action Card */}
        <Card className="p-6 space-y-6 shadow-xl border-2">
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-semibold">Get Started</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with Google to sync your routines across devices
            </p>
          </div>

          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold gap-3"
            onClick={handleSignIn}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Your data is stored in your own Google Drive.
            <br />
            We never see or access your routine data.
          </p>
        </Card>

        {/* Install Prompt - Only show if installable */}
        {(isInstallable || (isIOS && !isStandalone)) && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {isIOS ? (
                  <Smartphone className="w-5 h-5 text-primary" />
                ) : (
                  <Download className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Add to Home Screen</p>
                {isIOS ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span>
                  </p>
                ) : isInstallable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleInstall}
                  >
                    Install App
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        )}

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          {[
            { icon: "✓", label: "Track daily" },
            { icon: "🔥", label: "Build streaks" },
            { icon: "📊", label: "See progress" },
          ].map((feature) => (
            <div key={feature.label} className="text-center space-y-1">
              <div className="text-2xl">{feature.icon}</div>
              <p className="text-xs text-muted-foreground">{feature.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
