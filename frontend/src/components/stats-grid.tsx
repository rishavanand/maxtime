"use client";

import type { ModelInfo } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsGridProps {
  stats: Record<string, { avg: number; min: number; max: number; count: number }>;
  allModelIds: string[];
  modelMap: Record<string, ModelInfo>;
  modelColors: Record<string, string>;
  rangeLabel: string;
}

export function StatsGrid({
  stats,
  allModelIds,
  modelMap,
  modelColors,
  rangeLabel,
}: StatsGridProps) {
  if (Object.keys(stats).length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold tracking-tight">Average TTFT — {rangeLabel}</h2>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {allModelIds.map((model) => {
          const s = stats[model];
          const info = modelMap[model];
          if (!s) return null;
          return (
            <Card key={model} className="border-border/40 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  background: `linear-gradient(135deg, ${modelColors[model]}, transparent)`,
                }}
              />
              <CardHeader className="pb-2">
                <CardDescription className="flex items-start gap-2">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: modelColors[model] }}
                  />
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">
                      {info?.short_name ?? model}
                    </span>
                    <span className="text-muted-foreground font-mono text-xs">{model}</span>
                  </div>
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">
                  {s.avg}
                  <span className="text-muted-foreground ml-0.5 text-lg">ms</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
                  <span>Min: {s.min}ms</span>
                  <span>Max: {s.max}ms</span>
                  <span>{s.count.toLocaleString()} samples</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
