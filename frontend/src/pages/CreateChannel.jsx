import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sparkles, ImageIcon, Info } from "lucide-react";

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

export default function CreateChannel() {
  const { account, createChannel } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState(BANNER_CHOICES[0]);
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prefill from account (unified identity)
  useEffect(() => {
    if (!account) return;
    setName(account.username || account.name || "");
    setHandle((account.username || "").replace(/[^a-z0-9_-]/gi, "").toLowerCase());
    setAvatar(account.avatar || AVATAR_CHOICES[0]);
  }, [account]);

  const canSubmit = useMemo(
    () => /^[a-zA-Z0-9 _.\-]{2,40}$/.test(name.trim()) && /^[a-z0-9_-]{3,24}$/i.test(handle) && !!avatar,
    [name, handle, avatar]
  );

  if (!account) return null;
  if (account.has_channel) {
    return <Navigate to={`/channel/${account.channel_handle}`} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please fill a valid name, handle (3–24 letters/numbers) and pick an avatar.");
      return;
    }
    setSubmitting(true);
    try {
      const channel = await createChannel({
        name: name.trim(),
        handle: handle.trim().toLowerCase(),
        avatar,
        banner,
        bio: bio.trim(),
        tags: [],
      });
      toast.success("Channel created. You now have publishing access.");
      navigate(`/channel/${channel.handle}`);
    } catch (err) {
      const detail = err?.response?.data?.detail || "Could not create channel.";
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl fade-up" data-testid="create-channel-page">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Upgrade your identity
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create your Channel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You keep using <span className="font-semibold text-foreground">@{account.username}</span> — a Channel just unlocks publishing on top of your existing identity. You can adjust your public name and picture here; changes apply to your Account too.
        </p>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs text-primary">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          One Account can own one Channel. Once created, your Account and Channel share the same public name and picture everywhere on VideoPlatform.
        </p>
      </div>

      {/* Banner preview */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-border">
        <img src={banner} alt="Channel banner preview" className="h-40 w-full object-cover sm:h-56" data-testid="cc-banner-preview" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute -bottom-8 left-6">
          <img src={avatar} alt="Avatar preview" className="h-20 w-20 rounded-full border-4 border-background object-cover" data-testid="cc-avatar-preview" />
        </div>
      </div>

      <form onSubmit={submit} className="mt-14 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="cc-name">Public name</Label>
            <Input
              id="cc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What people see on your videos & comments"
              data-testid="cc-name"
            />
            <p className="mt-1 text-xs text-muted-foreground">Shown everywhere as your public identity.</p>
          </div>
          <div>
            <Label htmlFor="cc-handle">@handle</Label>
            <div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-within:border-primary transition-colors">
              <span className="text-muted-foreground">@</span>
              <input
                id="cc-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-z0-9_-]/gi, "").toLowerCase())}
                placeholder="your-handle"
                data-testid="cc-handle"
                className="w-full bg-transparent outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">3–24 chars · letters, numbers, - and _</p>
          </div>
        </div>

        <div>
          <Label>Profile picture</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {AVATAR_CHOICES.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setAvatar(url)}
                data-testid={`cc-avatar-${url.split("=").pop()}`}
                className={cn(
                  "overflow-hidden rounded-full border-2 transition-transform hover:scale-105",
                  avatar === url ? "border-primary" : "border-transparent opacity-80"
                )}
              >
                <img src={url} alt="" className="h-14 w-14 object-cover" />
              </button>
            ))}
            <label className="flex h-14 w-14 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-border text-[10px] font-semibold text-muted-foreground hover:bg-muted">
              <ImageIcon className="h-4 w-4" />
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setAvatar(URL.createObjectURL(f));
                }}
                data-testid="cc-avatar-upload"
              />
            </label>
          </div>
        </div>

        <div>
          <Label>Channel banner</Label>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BANNER_CHOICES.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setBanner(url)}
                data-testid={`cc-banner-${url.slice(-20)}`}
                className={cn(
                  "overflow-hidden rounded-xl border-2 transition-transform hover:scale-[1.02]",
                  banner === url ? "border-primary" : "border-transparent opacity-80"
                )}
              >
                <img src={url} alt="" className="h-16 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="cc-bio">Short description</Label>
          <Textarea
            id="cc-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="What kind of content will you publish?"
            data-testid="cc-bio"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            data-testid="cc-submit"
            className={cn(
              "rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]",
              (submitting || !canSubmit) && "opacity-60 hover:scale-100"
            )}
          >
            {submitting ? "Creating…" : "Create Channel"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
            data-testid="cc-cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
