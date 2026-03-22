export interface ModelInfo {
  model: string;
  short_name: string;
  measurement_count: number;
}

export interface ModelMetric {
  timestamp: string;
  model: string;
  ttft_ms: number | null;
  error: string | null;
  dns_ms: number | null;
  connect_ms: number | null;
  ttfb_ms: number | null;
  api_status: string | null;
  has_incident: boolean | null;
}

export interface MetricsResponse {
  metrics: ModelMetric[];
  count: number;
}

export async function fetchModels(): Promise<ModelInfo[]> {
  const res = await fetch("/api/models");
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export async function fetchMetrics(
  modelIds: string[],
  start: Date,
  end: Date
): Promise<MetricsResponse> {
  const res = await fetch("/api/metrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model_ids: modelIds,
      start: start.toISOString(),
      end: end.toISOString(),
    }),
  });
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}
