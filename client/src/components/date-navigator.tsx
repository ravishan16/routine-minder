import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDisplayDate } from "@/lib/utils";

type DateNavigatorProps = {
  date: Date;
  onDateChange: (date: Date) => void;
};

export function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const goToPrevious = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(selectedDate);
      setIsCalendarOpen(false);
    }
  };

  // Swipe gesture handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      const threshold = 50; // minimum swipe distance
      
      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          // Swipe left - go to next day (if not today)
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (date < tomorrow) {
            goToNext();
          }
        } else {
          // Swipe right - go to previous day
          goToPrevious();
        }
      }
      
      touchStartX.current = null;
    };

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [date]);

  const isToday = formatDisplayDate(date) === "Today";
  const today = new Date();

  return (
    <div ref={containerRef} className="flex items-center justify-between gap-2 py-3 flex-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrevious}
        data-testid="button-prev-date"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-date-display"
          >
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-semibold text-lg">{formatDisplayDate(date)}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <CalendarPicker
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(d) => d > today}
            initialFocus
          />
          {!isToday && (
            <div className="p-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full" 
                onClick={() => {
                  goToToday();
                  setIsCalendarOpen(false);
                }}
              >
                Go to Today
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNext}
        disabled={isToday}
        data-testid="button-next-date"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
