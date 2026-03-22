"use client";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { SubscribeBanner } from "@/components/subscribe-banner";
import { DashboardHeader } from "@/components/dashboard-header";
import { TtftChart } from "@/components/ttft-chart";
import { StatsGrid } from "@/components/stats-grid";

export default function Home() {
  const {
    models,
    selected,
    loading,
    range,
    setRange,
    modelColors,
    rangeLabel,
    modelMap,
    selectedArray,
    chartData,
    chartConfig,
    allModelIds,
    stats,
    toggleModel,
  } = useDashboardData();

  return (
    <div className="bg-background min-h-screen">
      <SubscribeBanner />

      <div className="p-6 md:p-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <DashboardHeader
            range={range}
            setRange={setRange}
            rangeLabel={rangeLabel}
            models={models}
            selected={selected}
            toggleModel={toggleModel}
            modelColors={modelColors}
            modelMap={modelMap}
            selectedArray={selectedArray}
          />

          <TtftChart
            loading={loading}
            chartData={chartData}
            chartConfig={chartConfig}
            selectedArray={selectedArray}
            modelColors={modelColors}
            range={range}
          />

          <StatsGrid
            stats={stats}
            allModelIds={allModelIds}
            modelMap={modelMap}
            modelColors={modelColors}
            rangeLabel={rangeLabel}
          />
        </div>

        <footer className="text-muted-foreground py-6 text-center text-xs">
          Made with love with Claude Code
        </footer>
      </div>
    </div>
  );
}
