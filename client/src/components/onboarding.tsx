import { useState } from "react";
import { Droplets, Pill, BookOpen, Music, Check, Sparkles, Dumbbell, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
  isLoading?: boolean;
};

export function Onboarding({ onComplete, isLoading }: OnboardingProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(["hydration", "vitamins", "journaling"]));

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Routine Minder</h1>
          <p className="text-muted-foreground text-sm">
            Choose some habits to track. You can always customize later.
          </p>
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
