import type { ModelInfo } from "@/lib/api";

const FAMILY_HUES: Record<string, number> = {
  opus: 270, // purple
  sonnet: 210, // blue
  haiku: 145, // green
};
const FALLBACK_HUES = [30, 0, 180, 330, 60]; // orange, red, cyan, pink, yellow

export function getFamily(modelId: string): string {
  return modelId.split("-")[1] ?? modelId;
}

export function groupByFamily(models: ModelInfo[]): Record<string, string[]> {
  const families: Record<string, string[]> = {};
  for (const m of models) {
    const family = getFamily(m.model);
    if (!families[family]) families[family] = [];
    families[family].push(m.model);
  }
  return families;
}

/**
 * Assign colors: same hue per family, varying lightness per version.
 * Newer versions get brighter/more saturated colors.
 */
export function buildModelColors(models: ModelInfo[]): Record<string, string> {
  const families = groupByFamily(models);

  let fallbackIdx = 0;
  const hueMap: Record<string, number> = { ...FAMILY_HUES };
  for (const family of Object.keys(families)) {
    if (!(family in hueMap)) {
      hueMap[family] = FALLBACK_HUES[fallbackIdx % FALLBACK_HUES.length];
      fallbackIdx++;
    }
  }

  const colors: Record<string, string> = {};
  for (const [family, ids] of Object.entries(families)) {
    const hue = hueMap[family];
    const sorted = [...ids].sort();
    const count = sorted.length;
    sorted.forEach((id, i) => {
      const lightness = count === 1 ? 55 : 35 + (i / (count - 1)) * 30;
      colors[id] = `hsl(${hue}, 80%, ${Math.round(lightness)}%)`;
    });
  }
  return colors;
}

/**
 * Pick the latest model per family by sorting IDs descending.
 */
export function getLatestPerFamily(models: ModelInfo[]): Set<string> {
  const families = groupByFamily(models);
  const latest = new Set<string>();
  for (const ids of Object.values(families)) {
    ids.sort();
    latest.add(ids[ids.length - 1]);
  }
  return latest;
}
