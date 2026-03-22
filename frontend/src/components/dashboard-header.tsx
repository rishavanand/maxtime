"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import type { ModelInfo } from "@/lib/api";
import type { TimeRange } from "@/hooks/use-dashboard-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Logo } from "@/components/logo";

interface DashboardHeaderProps {
  range: TimeRange;
  setRange: (r: TimeRange) => void;
  rangeLabel: string;
  models: ModelInfo[];
  selected: Set<string>;
  toggleModel: (id: string) => void;
  modelColors: Record<string, string>;
  modelMap: Record<string, ModelInfo>;
  selectedArray: string[];
}

const RANGES: TimeRange[] = ["24h", "7d", "30d"];
const RANGE_LABELS: Record<TimeRange, string> = { "24h": "24H", "7d": "7D", "30d": "30D" };

export function DashboardHeader({
  range,
  setRange,
  rangeLabel,
  models,
  selected,
  toggleModel,
  modelColors,
  modelMap,
  selectedArray,
}: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Logo className="h-7 w-7 sm:h-8 sm:w-8" />
            <span>
              <span className="text-brand">Max</span>Time
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">Claude TTFS monitor — {rangeLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="border-border/40 flex items-center rounded-md border">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                } ${r === "24h" ? "rounded-l-md" : r === "30d" ? "rounded-r-md" : ""}`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between sm:w-[300px]"
            />
          }
        >
          <span className="truncate">
            {selected.size === 0
              ? "Select models..."
              : `${selected.size} model${selected.size > 1 ? "s" : ""} selected`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search models..." />
            <CommandList>
              <CommandEmpty>No models found.</CommandEmpty>
              <CommandGroup>
                {models.map((m) => (
                  <CommandItem key={m.model} value={m.model} onSelect={() => toggleModel(m.model)}>
                    <div className="flex flex-1 items-center gap-2">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                          selected.has(m.model)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {selected.has(m.model) && <Check className="h-3 w-3" />}
                      </div>
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: modelColors[m.model] }}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm">{m.short_name}</span>
                        <span className="text-muted-foreground truncate font-mono text-xs">
                          {m.model}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedArray.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedArray.map((modelId) => {
            const info = modelMap[modelId];
            return (
              <Badge
                key={modelId}
                variant="secondary"
                className="cursor-default gap-1.5 py-1 pr-1 pl-2"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: modelColors[modelId] }}
                />
                <span className="text-xs">{info?.short_name ?? modelId}</span>
                <button
                  onClick={() => toggleModel(modelId)}
                  className="hover:bg-muted-foreground/20 ml-0.5 rounded-sm p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </>
  );
}
