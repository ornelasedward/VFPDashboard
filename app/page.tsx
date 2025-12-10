import { Suspense } from "react";
import { getTimeframeStats, getTopPerformers, getAllResults, getTopPerformersByTimeframe, getUniqueTickers } from "@/lib/supabase/queries";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Activity } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/nav";

async function DashboardContent() {
  const [timeframeStats, topPerformers, allResults, availableTickers] = await Promise.all([
    getTimeframeStats(),
    getTopPerformers(20),
    getAllResults(),
    getUniqueTickers(),
  ]);
  
  // Extract unique timeframes from the stats (dynamically discovered)
  const uniqueTimeframes = timeframeStats.map(stat => stat.timeframe);
  
  // Fetch top 20 performers for each discovered timeframe
  const timeframeTopPerformers = await Promise.all(
    uniqueTimeframes.map(async (tf) => ({
      timeframe: tf,
      results: await getTopPerformersByTimeframe(tf, 20)
    }))
  );

  return (
    <DashboardClient
      timeframeStats={timeframeStats}
      topPerformers={topPerformers}
      allResults={allResults}
      timeframeTopPerformers={timeframeTopPerformers}
      availableTickers={availableTickers}
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
