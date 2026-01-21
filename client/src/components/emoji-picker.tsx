import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Curated emoji list for routines
const ROUTINE_EMOJIS = [
  // Health & Fitness
  "💧", "💊", "🏋️", "🧘", "🏃", "🚴", "🚶", "⚽", "🏀", "🎾",
  // Mind & Learning
  "📖", "✍️", "🧠", "🎯", "📝", "💭", "🎓", "📚", "🔬", "💡",
  // Creative
  "🎵", "🎨", "📷", "🎮", "🎸", "🎹", "🎤", "✏️", "🎬", "🎭",
  // Daily Life
  "☀️", "🌙", "🍎", "🥗", "💤", "🛁", "🧹", "🍳", "☕", "🥤",
  // Work & Productivity
  "💻", "📧", "📞", "📊", "🗓️", "✅", "📌", "💼", "🔔", "⏰",
  // Nature & Outdoors
  "🌳", "🌺", "🐕", "🌿", "🌊", "🏔️", "🌅", "🦋", "🌻", "🍃",
  // Self-care
  "🧴", "💅", "🧖", "🪥", "😊", "❤️", "🙏", "🌟", "✨", "🎉",
];

interface EmojiPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ value = "✅", onChange, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-14 h-14 text-2xl p-0 hover:bg-muted/50 transition-colors",
            className
          )}
        >
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="grid grid-cols-10 gap-1">
          {ROUTINE_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSelect(emoji)}
              className={cn(
                "w-7 h-7 text-lg flex items-center justify-center rounded hover:bg-muted/80 transition-colors",
                value === emoji && "bg-primary/20 ring-2 ring-primary"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Default emoji suggestions based on routine name
export function suggestEmoji(routineName: string): string {
  const name = routineName.toLowerCase();
  
  const suggestions: Record<string, string> = {
    // Common routines
    water: "💧", hydration: "💧", drink: "💧",
    vitamin: "💊", medicine: "💊", supplement: "💊", pills: "💊",
    exercise: "🏋️", workout: "🏋️", gym: "🏋️", fitness: "🏋️",
    meditate: "🧘", meditation: "🧘", mindful: "🧘", breathe: "🧘",
    run: "🏃", running: "🏃", jog: "🏃", cardio: "🏃",
    stroll: "🚶", walking: "🚶", steps: "🚶",
    read: "📖", reading: "📖", book: "📖",
    journal: "✍️", write: "✍️", writing: "✍️", diary: "✍️",
    study: "📚", learn: "📚", course: "📚",
    sleep: "💤", rest: "💤", nap: "💤",
    breakfast: "🍳", morning: "☀️", wake: "☀️",
    coffee: "☕", tea: "☕",
    shower: "🛁", bath: "🛁",
    brush: "🪥", teeth: "🪥", floss: "🪥",
    skincare: "🧴", skin: "🧴", moisturize: "🧴",
    stretch: "🧘", yoga: "🧘",
    music: "🎵", practice: "🎸", piano: "🎹", guitar: "🎸",
    email: "📧", inbox: "📧",
    plan: "📝", todo: "✅", tasks: "✅",
    call: "📞", phone: "📞",
    code: "💻", program: "💻", dev: "💻",
    dog: "🐕", pet: "🐕", walkdog: "🐕",
    plant: "🌿", watering: "🌿", garden: "🌳",
    clean: "🧹", tidy: "🧹",
    cook: "🍳", meal: "🥗", eat: "🍎",
    gratitude: "🙏", thankful: "🙏",
    affirmation: "✨", positive: "🌟",
  };

  for (const [keyword, emoji] of Object.entries(suggestions)) {
    if (name.includes(keyword)) {
      return emoji;
    }
  }

  return "✅";
}
