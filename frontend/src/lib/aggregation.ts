import type { ModelMetric } from "@/lib/api";
import type { TimeRange } from "@/hooks/use-dashboard-data";

export interface ChartPoint {
  date: string;
  [model: string]: number | string | null;
}

export function aggregateMetrics(
  metrics: ModelMetric[],
  selectedModels: string[],
  range: TimeRange
): ChartPoint[] {
  const buckets: Record<string, Record<string, number[]>> = {};

  for (const m of metrics) {
    if (m.ttft_ms == null) continue;
    // 24h → hourly buckets, 7d/30d → daily buckets
    const key = range === "24h" ? m.timestamp.slice(0, 13) : m.timestamp.slice(0, 10);
    if (!buckets[key]) buckets[key] = {};
    if (!buckets[key][m.model]) buckets[key][m.model] = [];
    buckets[key][m.model].push(m.ttft_ms);
  }

  const keys = Object.keys(buckets).sort();
  return keys.map((key) => {
    const point: ChartPoint = { date: key };
    for (const model of selectedModels) {
      const vals = buckets[key]?.[model];
      point[model] = vals ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    }
    return point;
  });
}
