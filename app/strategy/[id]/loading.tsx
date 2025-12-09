import { DashboardNav } from "@/components/dashboard/nav";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav />
      
      {/* Loading bar at the top */}
      <div className="w-full h-1 bg-muted overflow-hidden">
        <div className="h-full bg-primary animate-loading-bar" />
      </div>
      
      <main className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-6">
            {/* Back button skeleton */}
            <Skeleton className="h-6 w-40" />
            
            {/* Title skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-96" />
            </div>

            {/* Key Performance Metrics skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-7 w-56" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-9 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Strategy Configuration skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-7 w-56" />
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-32" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Backtest Period skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-7 w-40" />
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-32" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trade Analysis skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-7 w-40" />
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-5 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
