import { ArrowLeft, CheckCircle2, Zap, BarChart3, Clock, Smartphone, Download, Github } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function AboutPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
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
      description: "Check off routines by time of day — morning, noon, evening",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Zap,
      title: "Build Streaks",
      description: "Stay motivated with daily streaks and progress tracking",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: BarChart3,
      title: "See Progress",
      description: "Dashboard shows completion rates and weekly trends",
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
    },
    {
      icon: Clock,
      title: "Works Offline",
      description: "No internet? No problem. Syncs when you're back online",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">About Routine Minder</h1>
        <p className="text-muted-foreground mb-8">
          A simple, free habit tracker that syncs across all your devices.
        </p>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="p-4">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium">Add Your Routines</h3>
                <p className="text-sm text-muted-foreground">
                  Create habits like "Drink water", "Exercise", "Read" — or pick from presets
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium">Check Off Daily</h3>
                <p className="text-sm text-muted-foreground">
                  Mark routines complete throughout the day — morning, noon, or evening
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium">Build Momentum</h3>
                <p className="text-sm text-muted-foreground">
                  Watch your streaks grow and see progress on the dashboard
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Install Section */}
        {!isInstalled && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Install on Your Device
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* iOS */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                    </svg>
                  </div>
                  <h3 className="font-medium">iPhone / iPad</h3>
                </div>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Open in <strong className="text-foreground">Safari</strong></li>
                  <li>2. Tap <strong className="text-foreground">Share</strong> (square with arrow)</li>
                  <li>3. Tap <strong className="text-foreground">"Add to Home Screen"</strong></li>
                </ol>
              </Card>

              {/* Android */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.6 11.48L19.44 8.3C19.54 8.12 19.48 7.89 19.3 7.79C19.12 7.69 18.89 7.75 18.79 7.93L16.93 11.15C15.45 10.5 13.78 10.13 12 10.13C10.22 10.13 8.55 10.5 7.07 11.15L5.21 7.93C5.11 7.75 4.88 7.69 4.7 7.79C4.52 7.89 4.46 8.12 4.56 8.3L6.4 11.48C3.87 12.85 2.09 15.27 2 18H22C21.91 15.27 20.13 12.85 17.6 11.48ZM7 15.5C6.45 15.5 6 15.05 6 14.5C6 13.95 6.45 13.5 7 13.5C7.55 13.5 8 13.95 8 14.5C8 15.05 7.55 15.5 7 15.5ZM17 15.5C16.45 15.5 16 15.05 16 14.5C16 13.95 16.45 13.5 17 13.5C17.55 13.5 18 13.95 18 14.5C18 15.05 17.55 15.5 17 15.5Z"/>
                    </svg>
                  </div>
                  <h3 className="font-medium">Android</h3>
                </div>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Open in <strong className="text-foreground">Chrome</strong></li>
                  <li>2. Tap <strong className="text-foreground">menu</strong> (three dots)</li>
                  <li>3. Tap <strong className="text-foreground">"Install app"</strong></li>
                </ol>
                {deferredPrompt && (
                  <Button onClick={handleInstall} size="sm" className="w-full mt-3 gap-2">
                    <Download className="w-4 h-4" />
                    Install Now
                  </Button>
                )}
              </Card>
            </div>
          </section>
        )}

        {/* Open Source */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Open Source</h2>
          <p className="text-muted-foreground mb-4">
            Routine Minder is free and open-source. Built with React, TypeScript, and Cloudflare Workers. 
            Your data syncs securely across devices when you sign in with Google.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/ravishan16/routine-minder"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <Github className="w-4 h-4" />
                View on GitHub
              </Button>
            </a>
            <a
              href="https://github.com/ravishan16/routine-minder/blob/main/ROADMAP.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Roadmap
              </Button>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
