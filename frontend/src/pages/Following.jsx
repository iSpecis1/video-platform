import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { Link } from "react-router-dom";

export default function Following() {
  const { learnMode, follows, toggleFollow } = useApp();
  const [feed, setFeed] = useState(null);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    api.followingFeed(learnMode).then((r) => setFeed(r.videos));
    api.listChannels().then(setChannels);
  }, [learnMode]);

  const following = channels.filter((c) => follows.includes(c.handle));

  return (
    <div className="fade-up">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Following</h1>
      <p className="mb-8 text-sm text-muted-foreground">Latest from channels you follow.</p>

      {following.length > 0 && (
        <div className="mb-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Your channels</p>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {following.map((c) => (
              <Link
                key={c.id}
                to={`/channel/${c.handle}`}
                className="flex w-[140px] shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-center hover:bg-muted"
                data-testid={`following-channel-${c.handle}`}
              >
                <img src={c.avatar} alt={c.name} className="h-16 w-16 rounded-full object-cover" />
                <p className="line-clamp-1 text-sm font-semibold">{c.name}</p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFollow(c.handle);
                  }}
                  className="rounded-full bg-muted px-3 py-0.5 text-[11px] font-semibold hover:bg-background border border-border"
                >
                  Unfollow
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-4 text-xl font-bold tracking-tight">Latest videos</h2>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {!feed && Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={i} />)}
        {feed && feed.length === 0 && (
          <p className="col-span-full py-10 text-center text-muted-foreground">
            Nothing new from your follows{learnMode ? " in Learn Mode" : ""}.
          </p>
        )}
        {feed && feed.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
      </div>
    </div>
  );
}
