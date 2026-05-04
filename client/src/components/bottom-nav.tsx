import { useLocation, Link } from "wouter";
import { CheckSquare, List, BarChart3, Settings, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import { isOuraEnabledForCurrentUser } from "@/lib/storage";

const navItems = [
  { path: "/", label: "Today", icon: CheckSquare },
  { path: "/routines", label: "Routines", icon: List },
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const [location] = useLocation();
  const showOura = isOuraEnabledForCurrentUser();

  const items = showOura
    ? [...navItems.slice(0, 3), { path: "/oura", label: "Oura", icon: HeartPulse }, ...navItems.slice(3)]
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-[12px] safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map(({ path, label, icon: Icon }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <button
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-full transition-colors min-w-[64px]",
                  isActive
                    ? "text-primary bg-card"
                    : "text-muted-foreground hover-elevate"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                <span className={cn("text-xs font-medium", isActive && "font-semibold")}>
                  {label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
