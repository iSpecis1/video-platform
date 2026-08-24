import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Info, BadgeCheck } from "lucide-react";

const AVATAR_CHOICES = [
  "https://i.pravatar.cc/200?img=5",
  "https://i.pravatar.cc/200?img=12",
  "https://i.pravatar.cc/200?img=25",
  "https://i.pravatar.cc/200?img=33",
  "https://i.pravatar.cc/200?img=47",
  "https://i.pravatar.cc/200?img=68",
];

export default function Settings() {
  const { theme, setTheme, learnMode, setLearnMode, account, accounts, switchAccount, updateAccount } = useApp();
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setUsername(account.username || "");
      setAvatar(account.avatar || "");
    }
  }, [account]);

  const dirty = account && (username !== account.username || avatar !== account.avatar);

  const save = async () => {
    if (!/^[a-zA-Z0-9 _.\-]{2,40}$/.test(username)) {
      toast.error("Username must be 2–40 chars: letters, numbers, spaces, . _ -");
      return;
    }
    setSaving(true);
    try {
      await updateAccount({ username: username.trim(), avatar });
      toast.success(
        account.has_channel
          ? "Identity updated — your Channel now reflects these changes too."
          : "Identity updated."
      );
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl fade-up" data-testid="settings-page">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Settings</h1>
      <p className="mb-8 text-sm text-muted-foreground">Preferences for your account and appearance.</p>

      <section className="mb-10 rounded-2xl border border-border p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold tracking-tight">Public identity</h2>
          {account?.has_channel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <BadgeCheck className="h-3 w-3" /> Also your Channel
            </span>
          )}
        </div>
        {account?.has_channel && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs text-primary">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Changes here update your Channel <span className="font-semibold">@{account.channel_handle}</span> everywhere on the platform — one identity, one profile.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-3">
            <img src={avatar || account?.avatar || undefined} alt="" className="h-24 w-24 rounded-full object-cover bg-muted" data-testid="settings-avatar-preview" />
            <div className="flex flex-wrap justify-center gap-2">
              {AVATAR_CHOICES.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setAvatar(url)}
                  data-testid={`settings-avatar-${url.split("=").pop()}`}
                  className={cn(
                    "h-8 w-8 overflow-hidden rounded-full border-2",
                    avatar === url ? "border-primary" : "border-transparent opacity-80"
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-within:border-primary transition-colors">
                <span className="text-muted-foreground">@</span>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9 _.\-]/g, ""))}
                  data-testid="settings-username"
                  className="w-full bg-transparent outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                2–40 chars · letters, numbers, spaces, . _ -. This name appears on your comments, follows and (if you have a channel) videos.
              </p>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={account?.email || ""} disabled />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={save}
                disabled={!dirty || saving}
                data-testid="settings-save-identity"
                className={cn(
                  "rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]",
                  (!dirty || saving) && "opacity-60 hover:scale-100"
                )}
              >
                {saving ? "Saving…" : "Save identity"}
              </button>
              {!account?.has_channel && (
                <Link
                  to="/channel/new"
                  data-testid="settings-create-channel"
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Create your Channel
                </Link>
              )}
              {account?.has_channel && (
                <Link
                  to={`/channel/${account.channel_handle}`}
                  data-testid="settings-your-channel"
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Go to your Channel
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Switch profile</p>
          <div className="flex flex-wrap gap-2">
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => switchAccount(a.id)}
                data-testid={`settings-switch-${a.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                  a.id === account?.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                )}
              >
                <img src={a.avatar} alt="" className="h-6 w-6 rounded-full object-cover" /> {a.username || a.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-border p-6">
        <h2 className="mb-4 text-lg font-bold tracking-tight">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <Label>Dark theme</Label>
            <p className="text-xs text-muted-foreground">Reduce eyestrain in low-light environments.</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} data-testid="settings-dark-toggle" />
        </div>
      </section>

      <section className="rounded-2xl border border-border p-6">
        <h2 className="mb-4 text-lg font-bold tracking-tight">Learn Mode</h2>
        <div className="flex items-center justify-between">
          <div>
            <Label>Prefer Learn Mode</Label>
            <p className="text-xs text-muted-foreground">Only educational and informational content will appear across the app.</p>
          </div>
          <Switch
            checked={learnMode}
            onCheckedChange={setLearnMode}
            disabled={account?.learn_mode_locked}
            data-testid="settings-learn-toggle"
          />
        </div>
        {account?.learn_mode_locked && (
          <p className="mt-3 text-xs text-primary">Learn Mode is locked on this account by parental controls.</p>
        )}
      </section>
    </div>
  );
}
