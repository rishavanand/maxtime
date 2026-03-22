"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import { fetchMetrics, fetchModels, type ModelInfo, type ModelMetric } from "@/lib/api";
import type { ChartConfig } from "@/components/ui/chart";
import { buildModelColors, getLatestPerFamily } from "@/lib/colors";
import { aggregateMetrics, type ChartPoint } from "@/lib/aggregation";

export type TimeRange = "24h" | "7d" | "30d";

const RANGE_DAYS: Record<TimeRange, number> = { "24h": 1, "7d": 7, "30d": 30 };
const RANGE_LABELS: Record<TimeRange, string> = {
  "24h": "last 24 hours",
  "7d": "last 7 days",
  "30d": "last 30 days",
};

export interface DashboardData {
  models: ModelInfo[];
  selected: Set<string>;
  loading: boolean;
  range: TimeRange;
  setRange: (r: TimeRange) => void;
  modelColors: Record<string, string>;
  rangeLabel: string;
  modelMap: Record<string, ModelInfo>;
  selectedArray: string[];
  chartData: ChartPoint[];
  chartConfig: ChartConfig;
  allModelIds: string[];
  stats: Record<string, { avg: number; min: number; max: number; count: number }>;
  toggleModel: (id: string) => void;
}

export function useDashboardData(): DashboardData {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allMetrics, setAllMetrics] = useState<ModelMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>("30d");

  const modelColors = useMemo(() => buildModelColors(models), [models]);

  const rangeStart = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() - RANGE_DAYS[range]);
    return now;
  }, [range]);

  const rangeLabel = RANGE_LABELS[range];

  useEffect(() => {
    fetchModels()
      .then((m) => {
        setModels(m);
        setSelected(getLatestPerFamily(m));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (models.length === 0) return;

    const load = () => {
      const end = new Date();
      const allIds = models.map((x) => x.model);
      fetchMetrics(allIds, rangeStart, end)
        .then((data) => {
          setAllMetrics(data.metrics);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [models, rangeStart]);

  const toggleModel = useCallback((modelId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  }, []);

  const modelMap = useMemo(() => {
    const map: Record<string, ModelInfo> = {};
    for (const m of models) map[m.model] = m;
    return map;
  }, [models]);

  const selectedArray = useMemo(() => Array.from(selected), [selected]);

  const chartMetrics = useMemo(
    () => allMetrics.filter((m) => selected.has(m.model)),
    [allMetrics, selected]
  );

  const chartData = useMemo(
    () => aggregateMetrics(chartMetrics, selectedArray, range),
    [chartMetrics, selectedArray, range]
  );

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const m of models) {
      if (!selected.has(m.model)) continue;
      config[m.model] = {
        label: m.short_name,
        color: modelColors[m.model] ?? "hsl(0, 0%, 50%)",
      };
    }
    return config;
  }, [models, selected, modelColors]);

  const allModelIds = useMemo(() => models.map((m) => m.model), [models]);

  const stats = useMemo(() => {
    const accum: Record<string, { sum: number; min: number; max: number; count: number }> = {};
    for (const m of allMetrics) {
      if (m.ttft_ms == null) continue;
      const existing = accum[m.model];
      if (!existing) {
        accum[m.model] = { sum: m.ttft_ms, min: m.ttft_ms, max: m.ttft_ms, count: 1 };
      } else {
        existing.sum += m.ttft_ms;
        existing.min = Math.min(existing.min, m.ttft_ms);
        existing.max = Math.max(existing.max, m.ttft_ms);
        existing.count++;
      }
    }
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    for (const [model, s] of Object.entries(accum)) {
      result[model] = {
        avg: Math.round(s.sum / s.count),
        min: Math.round(s.min),
        max: Math.round(s.max),
        count: s.count,
      };
    }
    return result;
  }, [allMetrics]);

  return {
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
  };
}
