import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { useApp } from "@/contexts/AppContext";
import { GraduationCap, Atom, Cpu, Landmark, Globe, Briefcase, Languages, Hammer, Cog } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = {
  Science: Atom,
  Technology: Cpu,
  History: Landmark,
  Geography: Globe,
  Business: Briefcase,
  Languages: Languages,
  "Practical Skills": Hammer,
  "How Things Work": Cog,
};

const EDU_CATS = ["Science", "Technology", "History", "Geography", "Business", "Languages", "Practical Skills", "How Things Work"];

export default function Learn() {
  const { learnMode, setLearnMode } = useApp();
  const [selected, setSelected] = useState("Science");
  const [videos, setVideos] = useState(null);

  // Auto-enable Learn Mode when visiting this page
  useEffect(() => {
    if (!learnMode) setLearnMode(true);
  }, [learnMode, setLearnMode]);

  useEffect(() => {
    setVideos(null);
    api.listVideos({ learn_mode: true, category: selected, limit: 30 }).then(setVideos);
  }, [selected]);

  return (
    <div className="fade-up">
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-primary/25 bg-primary/10 p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground">
            <GraduationCap className="h-3.5 w-3.5" /> Learn Mode
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Where you go to actually learn something.
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Everything you see here has been reviewed for genuine educational or informational value.
            Not just school subjects — practical skills, how things work, deep dives, and honest explainers.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
      </div>

      <div className="mb-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Explore learning categories</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {EDU_CATS.map((c) => {
            const Icon = CATEGORY_ICONS[c] || GraduationCap;
            const active = selected === c;
            return (
              <button
                key={c}
                onClick={() => setSelected(c)}
                data-testid={`learn-cat-${c}`}
                className={cn(
                  "group flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/50 hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-semibold leading-tight">{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="mb-4 text-xl font-bold tracking-tight">{selected} · picked for learners</h2>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {!videos && Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)}
        {videos && videos.length === 0 && (
          <p className="col-span-full py-10 text-center text-muted-foreground">
            Nothing here yet in {selected}.
          </p>
        )}
        {videos && videos.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
      </div>
    </div>
  );
}
