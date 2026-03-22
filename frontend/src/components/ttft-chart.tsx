"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartPoint } from "@/lib/aggregation";
import type { TimeRange } from "@/hooks/use-dashboard-data";

interface LiveDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  dataKey?: string;
  payload?: Record<string, unknown>;
  points?: unknown[];
  color: string;
}

function LiveDot({ cx, cy, index, dataKey, payload, points, color }: LiveDotProps) {
  if (cx == null || cy == null || dataKey == null) return null;
  if (payload?.[dataKey] == null) return null;
  const isLast = index === (points?.length ?? 0) - 1;
  if (!isLast) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.15}>
        <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        stroke="hsl(var(--background))"
        strokeWidth={2}
        style={{ animation: "live-pulse 2s ease-in-out infinite" }}
      />
    </g>
  );
}

interface TtftChartProps {
  loading: boolean;
  chartData: ChartPoint[];
  chartConfig: ChartConfig;
  selectedArray: string[];
  modelColors: Record<string, string>;
  range: TimeRange;
}

export function TtftChart({
  loading,
  chartData,
  chartConfig,
  selectedArray,
  modelColors,
  range,
}: TtftChartProps) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          Time to First Token
          <span className="flex items-center gap-1.5 text-xs font-normal text-emerald-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            LIVE
          </span>
        </CardTitle>
        <CardDescription>
          {range === "24h" ? "Hourly" : "Daily"} average TTFT in milliseconds
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="text-muted-foreground flex h-[280px] items-center justify-center sm:h-[420px]">
            Loading...
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-muted-foreground flex h-[280px] items-center justify-center sm:h-[420px]">
            No data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full sm:h-[420px]">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {selectedArray.map((model) => (
                  <linearGradient key={model} id={`fill-${model}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={modelColors[model]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={modelColors[model]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.4}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => {
                  if (range === "24h") {
                    const d = new Date(v + ":00:00");
                    return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
                  }
                  const d = new Date(v + "T00:00:00");
                  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}ms`}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                width={60}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(v: string) => {
                      if (range === "24h") {
                        const d = new Date(v + ":00:00");
                        return d.toLocaleString("en-US", {
                          weekday: "short",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });
                      }
                      const d = new Date(v + "T00:00:00");
                      return d.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "long",
                        day: "numeric",
                      });
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {selectedArray.map((model) => (
                <Area
                  key={model}
                  type="natural"
                  dataKey={model}
                  stroke={modelColors[model]}
                  strokeWidth={2}
                  fill={`url(#fill-${model})`}
                  dot={(dotProps: Record<string, unknown> & { key?: string }) => {
                    const { key, ...rest } = dotProps;
                    return (
                      <LiveDot
                        key={key}
                        cx={rest.cx as number | undefined}
                        cy={rest.cy as number | undefined}
                        index={rest.index as number | undefined}
                        payload={rest.payload as Record<string, unknown> | undefined}
                        points={chartData}
                        dataKey={model}
                        color={modelColors[model]}
                      />
                    );
                  }}
                  activeDot={{
                    r: 5,
                    strokeWidth: 2,
                    fill: "hsl(var(--background))",
                  }}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
