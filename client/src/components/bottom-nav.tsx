import { useLocation, Link } from "wouter";
import { CheckSquare, List, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Today", icon: CheckSquare },
  { path: "/routines", label: "Routines", icon: List },
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <button
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[64px]",
                  isActive
                    ? "text-primary"
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
