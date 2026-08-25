import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { CategoryPills } from "@/components/CategoryPills";
import { GraduationCap, Flame, Clock, Sparkles } from "lucide-react";

const Rail = ({ title, icon: Icon, videos }) => (
  <section className="mb-10">
    <div className="mb-4 flex items-baseline gap-2">
      {Icon && <Icon className="h-4 w-4 text-primary" />}
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
    </div>
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
      {videos.map((v, i) => (
        <div key={v.id} className="w-[280px] shrink-0 sm:w-[320px]">
          <VideoCard video={v} index={i} />
        </div>
      ))}
    </div>
  </section>
);

export default function Home() {
  const { learnMode, account } = useApp();
  const [category, setCategory] = useState("All");
  const [videos, setVideos] = useState(null);
  const [trending, setTrending] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);

  useEffect(() => {
    setVideos(null);
    api.listVideos({ learn_mode: learnMode, category, sort: "recent", limit: 40 }).then(setVideos);
  }, [learnMode, category]);

  useEffect(() => {
    if (!account) return;
    api.listVideos({ learn_mode: learnMode, sort: "trending", limit: 10 }).then(setTrending);
    api.history(account.id).then((h) => setContinueWatching(h || [])).catch(() => setContinueWatching([]));
  }, [learnMode, account]);

  return (
    <div className="fade-up">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {learnMode ? "Learn something today" : "What to watch"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {learnMode
              ? "Only educational and informational content · curated for you."
              : "A modern feed across every category you care about."}
          </p>
        </div>
        {learnMode && (
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
            Learn Mode active
          </div>
        )}
      </div>

      <CategoryPills value={category} onChange={setCategory} />

      {continueWatching.length > 0 && (
        <section className="mb-10 mt-6">
          <div className="mb-4 flex items-baseline gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Continue watching</h2>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {continueWatching.slice(0, 8).map((h, i) => (
              <a
                key={h.video_id}
                href={`/watch/${h.video_id}`}
                className="w-[280px] shrink-0 sm:w-[320px] fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
                data-testid={`continue-${h.video_id}`}
              >
                <div className="relative aspect-video overflow-hidden rounded-xl">
                  <img src={h.thumbnail} alt={h.title} className="h-full w-full object-cover thumb-hover" />
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-primary" style={{ width: `${20 + (i * 11) % 70}%` }} />
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-semibold">{h.title}</p>
                <p className="text-xs text-muted-foreground">{h.channel_name}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <Rail title="Trending now" icon={Flame} videos={trending.slice(0, 8)} />
      )}

      <section className="mt-2">
        <div className="mb-4 flex items-baseline gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Recommended for you</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {!videos && Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)}
          {videos && videos.length === 0 && (
            <p className="col-span-full py-10 text-center text-muted-foreground">
              No videos match this filter{learnMode ? " in Learn Mode" : ""}.
            </p>
          )}
          {videos && videos.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
        </div>
      </section>
    </div>
  );
}
