import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  value: number | string;
  label: string;
  className?: string;
};

export function StatCard({ icon: Icon, iconColor, iconBgColor, value, label, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-card-border rounded-xl p-4 flex flex-col gap-3",
        className
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          iconBgColor || "bg-primary/10"
        )}
      >
        <Icon className={cn("w-5 h-5", iconColor || "text-primary")} />
      </div>
      <div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
