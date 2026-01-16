import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/utils";

type DateNavigatorProps = {
  date: Date;
  onDateChange: (date: Date) => void;
};

export function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
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

  const isToday = formatDisplayDate(date) === "Today";

  return (
    <div className="flex items-center justify-between gap-2 py-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPrevious}
        data-testid="button-prev-date"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <button
        onClick={goToToday}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover-elevate"
        data-testid="button-date-display"
      >
        <Calendar className="w-4 h-4 text-primary" />
        <span className="font-semibold text-lg">{formatDisplayDate(date)}</span>
      </button>

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
