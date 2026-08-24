import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { VideoCard } from "@/components/VideoCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatViews } from "@/lib/format";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const { learnMode } = useApp();
  const [results, setResults] = useState({ videos: [], clips: [], channels: [] });

  useEffect(() => {
    if (!q) return;
    api.search(q, learnMode, "all").then(setResults);
  }, [q, learnMode]);

  const total = results.videos.length + results.clips.length + results.channels.length;

  return (
    <div className="fade-up" data-testid="search-page">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Results for “{q}”</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {total} matches{learnMode ? " · filtered for Learn Mode" : ""}
      </p>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" data-testid="search-tab-all">All</TabsTrigger>
          <TabsTrigger value="videos" data-testid="search-tab-videos">Videos ({results.videos.length})</TabsTrigger>
          <TabsTrigger value="clips" data-testid="search-tab-clips">Clips ({results.clips.length})</TabsTrigger>
          <TabsTrigger value="channels" data-testid="search-tab-channels">Channels ({results.channels.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="pt-6 space-y-10">
          {results.channels.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Channels</h2>
              <ChannelList channels={results.channels.slice(0, 4)} />
            </section>
          )}
          {results.videos.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Videos</h2>
              <VideoGrid videos={results.videos.slice(0, 8)} />
            </section>
          )}
          {results.clips.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Clips</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
                {results.clips.slice(0, 6).map((c) => (
                  <Link to={`/watch/${c.id}`} key={c.id} className="w-full" data-testid={`search-clip-${c.id}`}>
                    <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
                      <img src={c.thumbnail} alt="" className="h-full w-full object-cover thumb-hover" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-semibold">{c.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {total === 0 && <EmptyState learnMode={learnMode} />}
        </TabsContent>

        <TabsContent value="videos" className="pt-6">
          <VideoGrid videos={results.videos} />
        </TabsContent>

        <TabsContent value="clips" className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {results.clips.map((c) => (
              <Link to={`/watch/${c.id}`} key={c.id} className="w-full">
                <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
                  <img src={c.thumbnail} alt="" className="h-full w-full object-cover thumb-hover" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold">{c.title}</p>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="channels" className="pt-6">
          <ChannelList channels={results.channels} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const VideoGrid = ({ videos }) => (
  <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
    {videos.map((v, i) => (
      <VideoCard key={v.id} video={v} index={i} />
    ))}
  </div>
);

const ChannelList = ({ channels }) => (
  <div className="space-y-3">
    {channels.map((c) => (
      <Link
        key={c.id}
        to={`/channel/${c.handle}`}
        className="flex items-center gap-4 rounded-xl border border-border p-3 hover:bg-muted transition-colors"
        data-testid={`search-channel-${c.handle}`}
      >
        <img src={c.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{c.name}</p>
          <p className="text-xs text-muted-foreground">
            @{c.handle} · {formatViews(c.followers)} followers
          </p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{c.bio}</p>
        </div>
      </Link>
    ))}
  </div>
);

const EmptyState = ({ learnMode }) => (
  <div className="rounded-2xl border border-dashed border-border py-16 text-center">
    <p className="text-sm text-muted-foreground">
      No results{learnMode ? " under Learn Mode" : ""}. Try a broader search or toggle modes.
    </p>
  </div>
);
