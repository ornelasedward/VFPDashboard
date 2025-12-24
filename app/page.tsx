import { Suspense } from "react";
import { getTopPerformers, getTotalResultsCount, getUniqueTickers, computeBestStrategiesFromData } from "@/lib/supabase/queries";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Activity } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/nav";

async function DashboardContent() {
  // Fetch data - topPerformers is the main data source
  const [topPerformers, totalCount] = await Promise.all([
    getTopPerformers(),
    getTotalResultsCount(),
  ]);

  // Compute matrix from already-fetched data (no extra DB calls)
  const coinTimeframeMatrix = computeBestStrategiesFromData(topPerformers);
  const availableTickers = [...new Set(topPerformers.map(s => s.ticker))].sort();

  return (
    <DashboardClient
      topPerformers={topPerformers}
      totalCount={totalCount}
      availableTickers={availableTickers}
      coinTimeframeMatrix={coinTimeframeMatrix}
    />
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav />
      <main className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
            </div>
          }>
            <DashboardContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
