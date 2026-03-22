"use client";

import { useState } from "react";
import { Github } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SubscribeBanner() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  if (subscribed) {
    return (
      <div className="sticky top-0 z-50 w-full bg-emerald-500 px-4 text-white sm:px-6 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 py-1.5">
          <span className="text-center text-sm font-medium">
            Subscribed! We&apos;ll notify you at {email} when latency changes.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-orange-700 px-4 text-white sm:px-6 md:px-10">
      {/* Mobile: compact, centred, stacked */}
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 py-2 sm:hidden">
        <span className="text-center text-sm font-medium">Get alerts on latency spikes</span>
        <form
          className="flex w-full items-center justify-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) setSubscribed(true);
          }}
        >
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-7 w-full max-w-[200px] border-orange-900/30 bg-white/90 text-xs text-black placeholder:text-black/40 focus-visible:ring-orange-900"
          />
          <Button
            type="submit"
            disabled={!email.trim()}
            className="h-7 bg-black px-3 text-xs text-white hover:bg-black/80"
          >
            Subscribe
          </Button>
        </form>
        <a
          href="https://github.com/rishavanand/maxtime"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <Github className="h-3.5 w-3.5" />
          GitHub
        </a>
      </div>

      {/* Desktop: original horizontal layout */}
      <div className="mx-auto hidden max-w-6xl items-center py-1.5 sm:flex">
        <span className="shrink-0 text-sm font-medium">
          Latency spike? We&apos;ll alert you — grab a coffee while it sorts out —
        </span>
        <form
          className="flex shrink-0 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) setSubscribed(true);
          }}
        >
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-7 w-52 border-orange-900/30 bg-white/90 text-xs text-black placeholder:text-black/40 focus-visible:ring-orange-900"
          />
          <Button
            type="submit"
            disabled={!email.trim()}
            className="h-7 bg-black px-3 text-xs text-white hover:bg-black/80"
          >
            Subscribe
          </Button>
        </form>
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
