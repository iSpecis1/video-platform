import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { Heart, MessageCircle, Share2, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const ClipItem = ({ clip }) => {
  const ref = useRef(null);
  const { toggleFollow, follows, toggleLike, likes } = useApp();
  const isFollowing = follows.includes(clip.channel_handle);
  const isLiked = likes.includes(clip.id);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play?.().catch(() => {});
        else el.pause?.();
      },
      { threshold: 0.6 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="relative mx-auto flex h-[calc(100vh-4rem)] w-full max-w-[420px] snap-start items-center justify-center py-4">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-black">
        <video
          ref={ref}
          src={clip.video_url}
          poster={clip.thumbnail}
          loop
          muted
          playsInline
          data-testid={`clip-video-${clip.id}`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pb-6 text-white">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                to={`/channel/${clip.channel_handle}`}
                className="flex items-center gap-2 mb-2"
              >
                <img src={clip.channel_avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="text-sm font-semibold">{clip.channel_name}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFollow(clip.channel_handle);
                  }}
                  data-testid={`clip-follow-${clip.id}`}
                  className="ml-1 rounded-full border border-white/50 px-3 py-0.5 text-xs font-semibold hover:bg-white hover:text-black transition-colors"
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </Link>
              <p className="text-sm">{clip.title}</p>
              {clip.learn_mode_status === "approved" && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <GraduationCap className="h-3 w-3" /> Learn
                </span>
              )}
            </div>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => toggleLike(clip.id)}
                data-testid={`clip-like-${clip.id}`}
                className="flex flex-col items-center gap-1"
              >
                <div className={`rounded-full p-2 ${isLiked ? "bg-primary text-primary-foreground" : "bg-white/15"}`}>
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                </div>
                <span className="text-[11px]">{clip.likes.toLocaleString()}</span>
              </button>
              <button className="flex flex-col items-center gap-1" data-testid={`clip-comment-${clip.id}`}>
                <div className="rounded-full bg-white/15 p-2">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <span className="text-[11px]">Comments</span>
              </button>
              <button className="flex flex-col items-center gap-1" data-testid={`clip-share-${clip.id}`}>
                <div className="rounded-full bg-white/15 p-2">
                  <Share2 className="h-5 w-5" />
                </div>
                <span className="text-[11px]">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Clips() {
  const { learnMode } = useApp();
  const [clips, setClips] = useState([]);

  useEffect(() => {
    api.listClips(learnMode).then(setClips);
  }, [learnMode]);

  return (
    <div className="-my-8" data-testid="clips-page">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clips</h1>
        <p className="text-xs text-muted-foreground">Scroll to browse · {clips.length} clips</p>
      </div>
      <div className="clips-snap no-scrollbar">
        {clips.map((c) => (
          <ClipItem key={c.id} clip={c} />
        ))}
        {clips.length === 0 && (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No clips available right now.
          </div>
        )}
      </div>
    </div>
  );
}
