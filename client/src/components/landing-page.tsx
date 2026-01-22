import { useState, useEffect } from "react";
import { Github, Moon, Sun, Sparkles, CheckCircle2, Zap, Smartphone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Link } from "wouter";
import { signInWithGoogle } from "@/lib/storage";

type LandingPageProps = {
  onGetStarted: () => void;
};

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { theme, toggleTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setSignInError(null);
    try {
      await signInWithGoogle();
      // User authenticated - proceed to app
      onGetStarted();
    } catch (error) {
      console.error("Google sign-in error:", error);
      setSignInError("Sign-in failed. Try again or continue without sync.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/icon.svg" alt="Routine Minder" className="h-10 w-auto" />
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-70"></div>
        <div className="absolute top-1/4 -right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="max-w-3xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>v2.2 Now Available</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-foreground">
            Build habits that <br />
            <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-400">actually stick.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto font-light leading-relaxed">
            The offline-first habit tracker that syncs when you want it to.
            Beautiful, private, and yours forever.
          </p>

          {/* Primary CTA - Google Sign In for sync */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button
              size="lg"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="gap-3 h-14 px-8 text-lg w-full sm:w-auto shadow-xl shadow-primary/20"
            >
              {isSigningIn ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Get Started with Google
                </>
              )}
            </Button>

            {/* Secondary option - continue without sync */}
            <div>
              <button
                onClick={onGetStarted}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                or continue without sync →
              </button>
            </div>
          </div>

          {signInError && (
            <p className="text-sm text-destructive mb-4">{signInError}</p>
          )}

        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {[
            { icon: CheckCircle2, label: "Track Daily", color: "text-accent" },
            { icon: Zap, label: "Build Streaks", color: "text-primary" },
            { icon: Smartphone, label: "Offline First", color: "text-foreground" }
          ].map((prop, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <div className={`p-3 rounded-xl bg-muted/50 ${prop.color}`}>
                <prop.icon className="w-6 h-6" />
              </div>
              <span className="font-semibold">{prop.label}</span>
            </div>
          ))}
        </div>

        {/* Learn More Link */}
        <div className="mt-8">
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Learn more about features →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Routine Minder</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <a
              href="https://github.com/ravishan16/routine-minder/issues"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Support
            </a>
            <a
              href="https://github.com/ravishan16/routine-minder"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
