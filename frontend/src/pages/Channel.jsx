import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { VideoCard } from "@/components/VideoCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BadgeCheck, Pencil, Heart, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatViews } from "@/lib/format";
import { toast } from "sonner";

const AVATAR_CHOICES = [
  "https://i.pravatar.cc/200?img=5",
  "https://i.pravatar.cc/200?img=12",
  "https://i.pravatar.cc/200?img=25",
  "https://i.pravatar.cc/200?img=33",
  "https://i.pravatar.cc/200?img=47",
  "https://i.pravatar.cc/200?img=68",
];

const BANNER_CHOICES = [
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&q=80",
];

export default function Channel() {
  const { handle } = useParams();
  const { learnMode, follows, toggleFollow, account, updateChannel } = useApp();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [clips, setClips] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [rel, setRel] = useState({ is_following: false, is_follower: false, is_friend: false, is_self: false });

  useEffect(() => {
    api.getChannel(handle).then(setChannel).catch(() => setChannel(null));
    api.channelVideos(handle, learnMode).then(setVideos);
    api.channelClips(handle, learnMode).then(setClips);
  }, [handle, learnMode]);

  useEffect(() => {
    if (!account) return;
    api.relationship(handle, account.id).then(setRel).catch(() => {});
  }, [handle, account, follows]);

  if (!channel) {
    return <div className="text-muted-foreground">Loading channel…</div>;
  }

  const isOwner = rel.is_self || (account?.has_channel && account?.channel_handle === channel.handle);

  const handleSaved = async (patch) => {
    try {
      const updated = await updateChannel(channel.handle, patch);
      setChannel(updated);
      toast.success("Channel updated — your Account identity is now in sync.");
      setEditOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not update channel.");
    }
  };

  return (
    <div className="fade-up" data-testid="channel-page">
      <div className="relative overflow-hidden rounded-2xl">
        <img src={channel.banner} alt="" className="h-40 w-full object-cover sm:h-56" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="-mt-10 flex flex-col gap-4 px-2 sm:flex-row sm:items-end sm:gap-6">
        <img
          src={channel.avatar}
          alt={channel.name}
          className="h-24 w-24 rounded-full border-4 border-background object-cover sm:h-28 sm:w-28"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{channel.name}</h1>
            {channel.verified && <BadgeCheck className="h-5 w-5 text-primary" data-testid="channel-verified" />}
            {isOwner && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary" data-testid="channel-owner-badge">
                You
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            @{channel.handle} · {formatViews(channel.followers)} followers · {videos.length} videos
          </p>
          <p className="mt-2 max-w-2xl text-sm">{channel.bio}</p>
        </div>
        {isOwner ? (
          <button
            onClick={() => setEditOpen(true)}
            data-testid="channel-edit-btn"
            className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] sm:self-end"
          >
            <Pencil className="h-4 w-4" /> Edit channel
          </button>
        ) : (
          <RelationshipButton channel={channel} rel={rel} onToggle={() => toggleFollow(channel.handle)} />
        )}
      </div>

      {isOwner && (
        <EditChannelDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          channel={channel}
          onSaved={handleSaved}
        />
      )}

      <div className="mt-8">
        <Tabs defaultValue="home">
          <TabsList data-testid="channel-tabs">
            <TabsTrigger value="home" data-testid="channel-tab-home">Home</TabsTrigger>
            <TabsTrigger value="videos" data-testid="channel-tab-videos">Videos</TabsTrigger>
            <TabsTrigger value="clips" data-testid="channel-tab-clips">Clips</TabsTrigger>
            <TabsTrigger value="playlists" data-testid="channel-tab-playlists">Playlists</TabsTrigger>
            <TabsTrigger value="about" data-testid="channel-tab-about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="pt-6">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Latest uploads</h3>
            <Grid videos={videos.slice(0, 8)} />
            {clips.length > 0 && (
              <>
                <h3 className="mt-10 mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Clips</h3>
                <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4">
                  {clips.slice(0, 8).map((c) => (
                    <div key={c.id} className="w-40 shrink-0">
                      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
                        <img src={c.thumbnail} alt="" className="h-full w-full object-cover thumb-hover" />
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs font-semibold">{c.title}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="videos" className="pt-6">
            <Grid videos={videos} />
          </TabsContent>

          <TabsContent value="clips" className="pt-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {clips.map((c) => (
                <div key={c.id} className="w-full">
                  <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
                    <img src={c.thumbnail} alt="" className="h-full w-full object-cover thumb-hover" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold">{c.title}</p>
                </div>
              ))}
              {clips.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No clips yet.</p>}
            </div>
          </TabsContent>

          <TabsContent value="playlists" className="pt-6">
            <p className="text-sm text-muted-foreground">Playlists arrive in the next iteration.</p>
          </TabsContent>

          <TabsContent value="about" className="pt-6">
            <div className="max-w-2xl space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Description</p>
                <p className="mt-1">{channel.bio}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {channel.tags.map((t) => (
                    <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Joined</p>
                <p className="mt-1">{new Date(channel.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const Grid = ({ videos }) => (
  <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
    {videos.map((v, i) => (
      <VideoCard key={v.id} video={v} index={i} />
    ))}
    {videos.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nothing here yet.</p>}
  </div>
);


const RelationshipButton = ({ channel, rel, onToggle }) => {
  // States: friend, follow-back (they follow me, I don't), following, follow (default)
  let label = "Follow";
  let variant = "primary";
  let Icon = null;
  if (rel.is_friend) {
    label = "Friends";
    variant = "friends";
    Icon = Heart;
  } else if (rel.is_follower && !rel.is_following) {
    label = "Follow back";
    variant = "back";
    Icon = UserPlus;
  } else if (rel.is_following) {
    label = "Following";
    variant = "following";
  }

  const styles = {
    primary: "bg-foreground text-background",
    following: "bg-secondary text-foreground border border-border",
    back: "bg-primary text-primary-foreground learn-glow",
    friends: "bg-primary/10 text-primary border border-primary/40",
  };

  return (
    <button
      onClick={onToggle}
      data-testid="channel-follow-btn"
      data-rel={rel.is_friend ? "friends" : rel.is_following ? "following" : rel.is_follower ? "follow-back" : "follow"}
      className={cn(
        "inline-flex items-center gap-1.5 self-start rounded-full px-5 py-2 text-sm font-semibold transition-colors sm:self-end",
        styles[variant]
      )}
    >
      {Icon && <Icon className={cn("h-4 w-4", rel.is_friend && "fill-current")} />}
      {label}
    </button>
  );
};


const EditChannelDialog = ({ open, onOpenChange, channel, onSaved }) => {
  const [name, setName] = useState(channel.name);
  const [avatar, setAvatar] = useState(channel.avatar);
  const [banner, setBanner] = useState(channel.banner);
  const [bio, setBio] = useState(channel.bio || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(channel.name);
      setAvatar(channel.avatar);
      setBanner(channel.banner);
      setBio(channel.bio || "");
    }
  }, [open, channel]);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[a-zA-Z0-9 _.\-]{2,40}$/.test(name.trim())) {
      toast.error("Name must be 2–40 chars: letters, numbers, spaces, . _ -");
      return;
    }
    setSaving(true);
    await onSaved({ name: name.trim(), avatar, banner, bio: bio.trim() });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="edit-channel-dialog">
        <DialogHeader>
          <DialogTitle>Edit your Channel</DialogTitle>
          <DialogDescription>
            Changes here update your Account identity too — one profile everywhere on VideoPlatform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="ec-name">Public name</Label>
            <Input
              id="ec-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="edit-channel-name"
            />
          </div>
          <div>
            <Label>Avatar</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVATAR_CHOICES.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setAvatar(url)}
                  data-testid={`edit-channel-avatar-${url.split("=").pop()}`}
                  className={cn(
                    "h-12 w-12 overflow-hidden rounded-full border-2",
                    avatar === url ? "border-primary" : "border-transparent opacity-80"
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Banner</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BANNER_CHOICES.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setBanner(url)}
                  className={cn(
                    "overflow-hidden rounded-lg border-2",
                    banner === url ? "border-primary" : "border-transparent opacity-80"
                  )}
                >
                  <img src={url} alt="" className="h-12 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="ec-bio">Description</Label>
            <Textarea
              id="ec-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              data-testid="edit-channel-bio"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              data-testid="edit-channel-save"
              className={cn(
                "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground",
                saving && "opacity-60"
              )}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
