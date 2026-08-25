import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { VideoCard } from "@/components/VideoCard";
import { formatViews, timeAgo } from "@/lib/format";
import { Heart, Share2, Bookmark, GraduationCap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Watch() {
  const { id } = useParams();
  const { learnMode, toggleLike, likes, toggleFollow, follows, account } = useApp();
  const [video, setVideo] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [comments, setComments] = useState([]);
  const [expandDesc, setExpandDesc] = useState(false);

  useEffect(() => {
    setVideo(null);
    setExpandDesc(false);
    api.getVideo(id).then((v) => {
      setVideo(v);
      if (account) api.addHistory(account.id, id).catch(() => {});
    });
    api.recommended(id, learnMode).then(setRecommended);
    api.comments(id).then(setComments);
  }, [id, learnMode, account]);

  if (!video) {
    return <div className="animate-pulse text-muted-foreground">Loading video…</div>;
  }

  const isLiked = likes.includes(video.id);
  const isFollowing = follows.includes(video.channel_handle);
  const isEdu = video.learn_mode_status === "approved";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12" data-testid="watch-page">
      <div className="lg:col-span-8 xl:col-span-9">
        <div className="overflow-hidden rounded-2xl bg-black">
          <video
            src={video.video_url}
            poster={video.thumbnail}
            controls
            autoPlay
            className="aspect-video w-full"
            data-testid="watch-player"
          />
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {video.category}
            </span>
            {isEdu && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-primary-foreground" data-testid="learn-mode-eligible">
                <GraduationCap className="h-3 w-3" />
                Learn Mode Eligible
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{video.title}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {formatViews(video.views)} views · {timeAgo(video.published_at)}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={`/channel/${video.channel_handle}`} className="flex items-center gap-3">
              <img src={video.channel_avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold">{video.channel_name}</p>
                <p className="text-xs text-muted-foreground">@{video.channel_handle}</p>
              </div>
            </Link>
            <button
              onClick={() => toggleFollow(video.channel_handle)}
              data-testid="watch-follow-btn"
              className={cn(
                "ml-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                isFollowing
                  ? "bg-secondary text-foreground border border-border"
                  : "bg-foreground text-background hover:opacity-90"
              )}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleLike(video.id)}
              data-testid="watch-like-btn"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                isLiked ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-muted"
              )}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              {formatViews(video.likes + (isLiked ? 1 : 0))}
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-sm font-semibold hover:bg-muted transition-colors" data-testid="watch-share-btn">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-sm font-semibold hover:bg-muted transition-colors" data-testid="watch-save-btn">
              <Bookmark className="h-4 w-4" /> Save
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4">
          <button
            onClick={() => setExpandDesc((v) => !v)}
            className="flex w-full items-center justify-between text-left"
            data-testid="watch-desc-toggle"
          >
            <span className="text-sm font-semibold">Description</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", expandDesc && "rotate-180")} />
          </button>
          <p className={cn("mt-2 text-sm text-foreground/90 whitespace-pre-wrap", !expandDesc && "line-clamp-2")}>
            {video.description}
          </p>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold tracking-tight" data-testid="comments-header">
            {comments.length} comments
          </h2>
          <div className="mb-6 flex gap-3">
            <div className="h-9 w-9 rounded-full bg-secondary" />
            <input
              placeholder="Add a comment…"
              data-testid="comment-input"
              className="flex-1 border-b border-border bg-transparent py-2 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <ul className="space-y-5">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3" data-testid={`comment-${c.id}`}>
                <img src={c.author_avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold">{c.author_name}</span>
                    <span className="text-muted-foreground">{timeAgo(c.posted_at)}</span>
                  </div>
                  <p className="mt-1 text-sm">{c.text}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <button className="hover:text-foreground">Like ({c.likes})</button>
                    <button className="hover:text-foreground">Reply</button>
                  </div>
                </div>
              </li>
            ))}
            {comments.length === 0 && <li className="text-sm text-muted-foreground">Be the first to comment.</li>}
          </ul>
        </div>
      </div>

      <aside className="lg:col-span-4 xl:col-span-3">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {learnMode ? "More to learn" : "Recommended"}
        </h2>
        <div className="flex flex-col gap-4">
          {recommended.map((v, i) => (
            <VideoCard key={v.id} video={v} index={i} />
          ))}
        </div>
      </aside>
    </div>
  );
}
