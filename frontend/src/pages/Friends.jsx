import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserPlus, Users, Heart, ArrowRightLeft, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Friends() {
  const { learnMode, account, friends, follows, toggleFollow, refreshFriends } = useApp();
  const [feed, setFeed] = useState({ videos: [], clips: [] });
  const [followers, setFollowers] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  useEffect(() => {
    if (!account) return;
    setLoadingFeed(true);
    api.friendsFeed(account.id, learnMode)
      .then((d) => setFeed({ videos: d.videos || [], clips: d.clips || [] }))
      .finally(() => setLoadingFeed(false));
    api.followers(account.id).then((d) => setFollowers(d.followers || []));
  }, [account, learnMode, friends]);

  if (!account) return null;

  const noChannel = !account.has_channel;

  return (
    <div className="fade-up" data-testid="friends-page">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Friends</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            When two people follow each other, they become Friends. See what they publish here.
          </p>
        </div>
        {learnMode && (
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
            Learn Mode active
          </div>
        )}
      </div>

      {noChannel ? (
        <NoChannelEmpty />
      ) : (
        <Tabs defaultValue="feed">
          <TabsList data-testid="friends-tabs">
            <TabsTrigger value="feed" data-testid="friends-tab-feed">
              <ArrowRightLeft className="h-4 w-4 mr-1.5" /> Feed
            </TabsTrigger>
            <TabsTrigger value="friends" data-testid="friends-tab-friends">
              <Heart className="h-4 w-4 mr-1.5" /> Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="followers" data-testid="friends-tab-followers">
              <Users className="h-4 w-4 mr-1.5" /> Followers ({followers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="pt-6">
            {loadingFeed ? (
              <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={i} />)}
              </div>
            ) : feed.videos.length === 0 && feed.clips.length === 0 ? (
              <EmptyState label={friends.length === 0
                ? "You don't have any Friends yet. Follow a creator who follows you back — that's how friendships form."
                : `Your friends haven't published anything ${learnMode ? "in Learn Mode " : ""}yet.`} />
            ) : (
              <>
                {feed.videos.length > 0 && (
                  <section className="mb-10">
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      Videos from Friends
                    </h2>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                      {feed.videos.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
                    </div>
                  </section>
                )}
                {feed.clips.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      Clips from Friends
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
                      {feed.clips.map((c) => (
                        <Link to={`/watch/${c.id}`} key={c.id} className="w-full" data-testid={`friend-clip-${c.id}`}>
                          <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
                            <img src={c.thumbnail} alt="" className="h-full w-full object-cover thumb-hover" />
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs font-semibold">{c.title}</p>
                          <p className="text-[11px] text-muted-foreground">{c.channel_name}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="friends" className="pt-6">
            {friends.length === 0 ? (
              <EmptyState label="Nobody follows you and is followed back by you yet." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {friends.map((f) => (
                  <FriendCard key={f.id} person={f} onUnfriend={() => toggleFollow(f.channel_handle)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="pt-6">
            {followers.length === 0 ? (
              <EmptyState label="You have no followers yet." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {followers.map((f) => (
                  <FollowerCard
                    key={f.id}
                    person={f}
                    isFollowingBack={f.channel_handle ? follows.includes(f.channel_handle) : false}
                    onFollowBack={() => f.channel_handle && toggleFollow(f.channel_handle)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

const NoChannelEmpty = () => (
  <div className="mx-auto max-w-lg rounded-2xl border border-border bg-secondary/40 p-10 text-center" data-testid="friends-no-channel">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
      <UserPlus className="h-6 w-6" />
    </div>
    <h2 className="text-xl font-bold tracking-tight">Friends need a Channel</h2>
    <p className="mt-2 text-sm text-muted-foreground">
      A friendship forms when two people follow each other. Create your Channel so others can follow you back.
    </p>
    <Link
      to="/channel/new"
      className="mt-6 inline-flex rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background hover:scale-[1.02] transition-transform"
      data-testid="friends-create-channel"
    >
      Create your Channel
    </Link>
  </div>
);

const FriendCard = ({ person, onUnfriend }) => (
  <Link
    to={person.channel_handle ? `/channel/${person.channel_handle}` : "#"}
    className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-muted"
    data-testid={`friend-${person.id}`}
  >
    <img src={person.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        <p className="truncate text-sm font-semibold">{person.username}</p>
        <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
      </div>
      {person.channel_handle && (
        <p className="truncate text-xs text-muted-foreground">@{person.channel_handle}</p>
      )}
    </div>
    <button
      onClick={(e) => {
        e.preventDefault();
        onUnfriend();
      }}
      data-testid={`friend-unfriend-${person.id}`}
      className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-background"
    >
      Unfollow
    </button>
  </Link>
);

const FollowerCard = ({ person, isFollowingBack, onFollowBack }) => (
  <div
    className={cn(
      "flex items-center gap-3 rounded-2xl border p-3",
      isFollowingBack ? "border-primary/40 bg-primary/5" : "border-border"
    )}
    data-testid={`follower-${person.id}`}
  >
    <Link to={person.channel_handle ? `/channel/${person.channel_handle}` : "#"}>
      <img src={person.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
    </Link>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{person.username}</p>
      <p className="truncate text-xs text-muted-foreground">
        {person.channel_handle ? `@${person.channel_handle}` : "Viewer"}
        {isFollowingBack && <span className="ml-2 font-bold text-primary">· Friends</span>}
      </p>
    </div>
    {person.channel_handle && (
      <button
        onClick={onFollowBack}
        disabled={!person.channel_handle}
        data-testid={`followback-${person.id}`}
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          isFollowingBack
            ? "bg-primary/10 text-primary"
            : "bg-foreground text-background hover:scale-[1.02]"
        )}
      >
        {isFollowingBack ? "Friends" : "Follow back"}
      </button>
    )}
  </div>
);

const EmptyState = ({ label }) => (
  <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
    {label}
  </div>
);
