import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { BarChart3 } from "lucide-react";

export function DashboardNav() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <Link href="/" className="text-xl font-bold">
            VFP Trading Dashboard
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
