import { useState } from "react";
import { Droplets, Pill, BookOpen, Music, Check, Sparkles, Dumbbell, Brain, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { signInWithGoogle, syncFromServerAfterGoogleSignIn, getGoogleUserSync } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import type { TimeCategory } from "@/lib/schema";

type PresetRoutine = {
  id: string;
  name: string;
  timeCategories: TimeCategory[];
  icon: typeof Droplets;
  description: string;
  color: string;
  bgColor: string;
};

const presetRoutines: PresetRoutine[] = [
  {
    id: "hydration",
    name: "Hydration",
    timeCategories: ["AM", "NOON", "PM"],
    icon: Droplets,
    description: "8 glasses daily",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "vitamins",
    name: "Vitamins",
    timeCategories: ["AM", "PM"],
    icon: Pill,
    description: "Morning & evening",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "journaling",
    name: "Journaling",
    timeCategories: ["PM"],
    icon: BookOpen,
    description: "Evening reflection",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "exercise",
    name: "Exercise",
    timeCategories: ["AM"],
    icon: Dumbbell,
    description: "Morning workout",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "meditation",
    name: "Meditation",
    timeCategories: ["AM", "PM"],
    icon: Brain,
    description: "Mindfulness practice",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  {
    id: "music",
    name: "Music Practice",
    timeCategories: ["PM"],
    icon: Music,
    description: "Daily practice",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

type OnboardingProps = {
  onComplete: (selectedRoutines: { name: string; timeCategories: TimeCategory[] }[]) => void;
  onGoogleSignIn?: () => void;
  isLoading?: boolean;
};

export function Onboarding({ onComplete, onGoogleSignIn, isLoading }: OnboardingProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set(["hydration", "vitamins", "journaling"]));
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signedInUser, setSignedInUser] = useState<{ displayName: string | null } | null>(() => getGoogleUserSync());

  const toggleRoutine = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleStart = () => {
    const routinesToCreate = presetRoutines
      .filter((r) => selected.has(r.id))
      .map((r) => ({ name: r.name, timeCategories: r.timeCategories }));
    onComplete(routinesToCreate);
  };

  const handleSkip = () => {
    onComplete([]);
  };

  const handleGoogleRestore = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      const user = getGoogleUserSync();
      setSignedInUser(user);
      const routinesRestored = await syncFromServerAfterGoogleSignIn();
      if (routinesRestored) {
        toast({ 
          title: "Welcome back!", 
          description: "Your routines have been restored." 
        });
        onGoogleSignIn?.();
      } else {
        toast({ 
          title: "Signed in!", 
          description: "No existing routines found. Choose some below to get started." 
        });
      }
    } catch (e) {
      toast({ 
        title: "Sign-in failed", 
        description: e instanceof Error ? e.message : "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            {signedInUser ? "Let's Get Started!" : "Welcome to Routine Minder"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {signedInUser 
              ? "Select the habits you want to track below, then tap the button to begin."
              : "Choose some habits to track. You can always customize later."
            }
          </p>
        </div>

        {/* Returning user - Google restore option */}
        <Card className="p-4 bg-muted/50 border-dashed">
          <div className="text-center space-y-3">
            {signedInUser ? (
              <>
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Signed in as {signedInUser.displayName || "Google User"}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your routines will sync to this account
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Already have routines on another device?</p>
                <Button 
                  variant="outline" 
                  onClick={handleGoogleRestore}
                  disabled={isSigningIn}
                  className="gap-2"
                >
                  {isSigningIn ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {isSigningIn ? "Restoring..." : "Sign in with Google to restore"}
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">
            {signedInUser ? "pick routines to track" : "or start fresh"}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Routine Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {presetRoutines.map((routine) => {
            const Icon = routine.icon;
            const isSelected = selected.has(routine.id);

            return (
              <Card
                key={routine.id}
                onClick={() => toggleRoutine(routine.id)}
                className={cn(
                  "p-3 cursor-pointer transition-all relative",
                  "hover:shadow-md active:scale-[0.98]",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", routine.bgColor, routine.color)}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{routine.name}</h3>
                    <p className="text-[11px] text-muted-foreground leading-tight">{routine.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={handleStart}
            disabled={isLoading || selected.size === 0}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {isLoading ? "Setting up..." : `Start with ${selected.size} routine${selected.size !== 1 ? "s" : ""}`}
          </Button>
          
          <button
            onClick={handleSkip}
            disabled={isLoading}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Skip and add my own
          </button>
        </div>
      </div>
    </div>
  );
}
