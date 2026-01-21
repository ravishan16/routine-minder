import { useState, useEffect } from "react";
import { Smartphone, Download, CheckCircle2, Github, Sparkles, Moon, Sun, Clock, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";

type LandingPageProps = {
  onGetStarted: () => void;
};

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { theme, toggleTheme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const features = [
    {
      icon: CheckCircle2,
      title: "Daily Tracking",
      description: "Check off routines by time of day - morning, noon, evening",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Zap,
      title: "Build Streaks",
      description: "Stay motivated with daily streaks and progress tracking",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: BarChart3,
      title: "See Progress",
      description: "Dashboard shows completion rates and weekly trends",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Clock,
      title: "Works Offline",
      description: "No internet? No problem. Syncs when you're back online",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg">Routine Minder</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <a
              href="https://github.com/ravishan16/routine-minder"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon">
                <Github className="h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Free & Open Source
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Build Better Habits,<br />
            <span className="text-primary">One Day at a Time</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            A simple, privacy-focused habit tracker that works offline. 
            No account required. Your data stays on your device.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={onGetStarted} className="gap-2 h-12 px-8 text-base">
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </Button>
            
            {!isInstalled && (
              isIOS ? (
                <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base" asChild>
                  <a href="#install">
                    <Download className="w-5 h-5" />
                    Install App
                  </a>
                </Button>
              ) : deferredPrompt ? (
                <Button variant="outline" size="lg" onClick={handleInstall} className="gap-2 h-12 px-6 text-base">
                  <Download className="w-5 h-5" />
                  Install App
                </Button>
              ) : null
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Everything You Need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Choose Your Routines</h3>
              <p className="text-sm text-muted-foreground">
                Pick from presets like Hydration, Vitamins, Exercise, or create your own
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Check Off Daily</h3>
              <p className="text-sm text-muted-foreground">
                Mark routines complete throughout the day - morning, noon, or evening
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Build Momentum</h3>
              <p className="text-sm text-muted-foreground">
                Watch your streaks grow and see your progress on the dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Install Section */}
      <section id="install" className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            <Smartphone className="w-6 h-6 inline mr-2" />
            Install on Your Device
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* iOS Instructions */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg">iPhone / iPad</h3>
              </div>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">1.</span>
                  Open this page in <strong className="text-foreground">Safari</strong>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">2.</span>
                  Tap the <strong className="text-foreground">Share</strong> button (square with arrow)
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">3.</span>
                  Scroll down and tap <strong className="text-foreground">"Add to Home Screen"</strong>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">4.</span>
                  Tap <strong className="text-foreground">"Add"</strong> to install
                </li>
              </ol>
            </Card>

            {/* Android Instructions */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.6 11.48L19.44 8.3C19.54 8.12 19.48 7.89 19.3 7.79C19.12 7.69 18.89 7.75 18.79 7.93L16.93 11.15C15.45 10.5 13.78 10.13 12 10.13C10.22 10.13 8.55 10.5 7.07 11.15L5.21 7.93C5.11 7.75 4.88 7.69 4.7 7.79C4.52 7.89 4.46 8.12 4.56 8.3L6.4 11.48C3.87 12.85 2.09 15.27 2 18H22C21.91 15.27 20.13 12.85 17.6 11.48ZM7 15.5C6.45 15.5 6 15.05 6 14.5C6 13.95 6.45 13.5 7 13.5C7.55 13.5 8 13.95 8 14.5C8 15.05 7.55 15.5 7 15.5ZM17 15.5C16.45 15.5 16 15.05 16 14.5C16 13.95 16.45 13.5 17 13.5C17.55 13.5 18 13.95 18 14.5C18 15.05 17.55 15.5 17 15.5Z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg">Android</h3>
              </div>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">1.</span>
                  Open this page in <strong className="text-foreground">Chrome</strong>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">2.</span>
                  Tap the <strong className="text-foreground">menu</strong> (three dots)
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">3.</span>
                  Tap <strong className="text-foreground">"Install app"</strong> or "Add to Home screen"
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">4.</span>
                  Tap <strong className="text-foreground">"Install"</strong> to confirm
                </li>
              </ol>
              {deferredPrompt && (
                <Button onClick={handleInstall} className="w-full mt-4 gap-2">
                  <Download className="w-4 h-4" />
                  Install Now
                </Button>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">About Routine Minder</h2>
          <p className="text-muted-foreground mb-6">
            Routine Minder is a free, open-source habit tracking app built with privacy in mind. 
            Your data stays on your device - no account required, no tracking, no ads. 
            Built with React, TypeScript, and Cloudflare Workers.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://github.com/ravishan16/routine-minder"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <Github className="w-4 h-4" />
                View on GitHub
              </Button>
            </a>
            <a
              href="https://github.com/ravishan16/routine-minder/blob/main/ROADMAP.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Roadmap
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p className="mb-2">
            Made with ❤️ for better habits
          </p>
          <p>
            © {new Date().getFullYear()} Routine Minder • 
            <a href="https://github.com/ravishan16/routine-minder" className="hover:text-foreground ml-1">
              Open Source
            </a>
          </p>
        </div>
      </footer>

      {/* Floating CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button size="lg" onClick={onGetStarted} className="gap-2 shadow-lg h-12 px-8 rounded-full">
          <Sparkles className="w-5 h-5" />
          Start Tracking
        </Button>
      </div>
    </div>
  );
}
