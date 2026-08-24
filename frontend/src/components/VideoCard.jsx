import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { formatViews, formatDuration, timeAgo } from "@/lib/format";

export const VideoCard = ({ video, index = 0 }) => {
  const isEdu = video.learn_mode_status === "approved";
  const navigate = useNavigate();

  const goToWatch = (e) => {
    // Skip if the click bubbled from an inner interactive element
    if (e.target.closest("[data-stop-card]")) return;
    navigate(`/watch/${video.id}`);
  };

  return (
    <div
      onClick={goToWatch}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/watch/${video.id}`);
        }
      }}
      role="link"
      tabIndex={0}
      data-testid={`video-card-${video.id}`}
      className="group flex cursor-pointer flex-col gap-3 fade-up focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      style={{ animationDelay: `${Math.min(index * 30, 400)}ms` }}
    >
      <div className="relative overflow-hidden rounded-xl bg-muted aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover thumb-hover"
        />
        <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {formatDuration(video.duration_seconds)}
        </span>
        {isEdu && (
          <span
            className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur"
            data-testid="learn-eligible-badge"
          >
            <GraduationCap className="h-3 w-3" />
            Learn
          </span>
        )}
      </div>
      <div className="flex gap-3">
        <Link
          to={`/channel/${video.channel_handle}`}
          data-stop-card
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
          data-testid={`video-card-channel-${video.id}`}
        >
          <img
            src={video.channel_avatar}
            alt={video.channel_name}
            className="h-9 w-9 rounded-full object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground truncate">{video.channel_name}</p>
          <p className="text-xs text-muted-foreground">
            {formatViews(video.views)} views · {timeAgo(video.published_at)}
          </p>
        </div>
      </div>
    </div>
  );
};

export const VideoCardSkeleton = () => (
  <div className="flex flex-col gap-3">
    <div className="aspect-video rounded-xl bg-muted animate-pulse" />
    <div className="flex gap-3">
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-full bg-muted animate-pulse rounded" />
        <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
      </div>
    </div>
  </div>
);
