import type { ModelMetric } from "@/lib/api";
import type { TimeRange } from "@/hooks/use-dashboard-data";

export interface ChartPoint {
  date: string;
  [model: string]: number | string | null;
}

function toLocalBucketKey(utcTimestamp: string, range: TimeRange): string {
  const d = new Date(utcTimestamp);
  if (range === "24h") {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hour = String(d.getHours()).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function aggregateMetrics(
  metrics: ModelMetric[],
  selectedModels: string[],
  range: TimeRange
): ChartPoint[] {
  const buckets: Record<string, Record<string, number[]>> = {};

  for (const m of metrics) {
    if (m.ttft_ms == null) continue;
    const key = toLocalBucketKey(m.timestamp, range);
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
