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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 py-1.5">
        <span className="text-sm font-medium">Latency spike? We&apos;ll alert you —</span>
        <form
          className="flex items-center gap-2"
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
            className="h-7 w-40 border-orange-900/30 bg-white/90 text-xs text-black placeholder:text-black/40 focus-visible:ring-orange-900 sm:w-52"
          />
          <Button
            type="submit"
            disabled={!email.trim()}
            className="h-7 bg-black px-3 text-xs text-white hover:bg-black/80"
          >
            Subscribe
          </Button>
        </form>
        <div className="hidden flex-1 sm:block" />
        <a
          href="https://github.com/rishavanand/maxtime"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-medium hover:underline sm:ml-0"
        >
          <Github className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Love on GitHub</span>
          <span className="sm:hidden">GitHub</span>
        </a>
      </div>
    </div>
  );
}
