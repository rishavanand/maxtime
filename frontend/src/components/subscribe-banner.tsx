"use client";

import { Github } from "lucide-react";

export function SubscribeBanner() {
  return (
    <div className="sticky top-0 z-50 w-full bg-orange-700 px-4 text-white sm:px-6 md:px-10">
      {/* Mobile */}
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 py-2 sm:hidden">
        <a
          href="https://support.claude.com/en/articles/14063676-claude-march-2026-usage-promotion"
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-sm font-medium underline decoration-white/50 hover:decoration-white"
        >
          Mar 13-28: 2x usage off-peak (outside 8AM-2PM ET)
        </a>
        <a
          href="https://github.com/rishavanand/maxtime"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium hover:underline"
        >
          <Github className="h-3.5 w-3.5" />
          GitHub
        </a>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden max-w-6xl items-center py-1.5 sm:flex">
        <a
          href="https://support.claude.com/en/articles/14063676-claude-march-2026-usage-promotion"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-medium underline decoration-white/50 hover:decoration-white"
        >
          Mar 13–28 promo: 2x usage outside peak hours (8 AM–2 PM ET / 5–11 AM PT / 12–6 PM GMT
          weekdays)
        </a>
        <span className="ml-1 text-sm text-white/70">— code off-peak for double capacity</span>
        <div className="flex-1" />
        <a
          href="https://github.com/rishavanand/maxtime"
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <Github className="h-3.5 w-3.5" />
          Love on GitHub
        </a>
      </div>
    </div>
  );
}
