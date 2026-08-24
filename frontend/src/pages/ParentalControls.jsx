import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Info } from "lucide-react";
import { toast } from "sonner";

const CATS = ["Science", "Technology", "History", "Geography", "Cooking", "Music", "Gaming", "Entertainment", "Comedy", "Travel", "DIY", "Business"];

export default function ParentalControls() {
  const [lockLearn, setLockLearn] = useState(true);
  const [ageBand, setAgeBand] = useState("all");
  const [allowClips, setAllowClips] = useState(true);
  const [allowComments, setAllowComments] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [allowed, setAllowed] = useState(new Set(["Science", "Technology", "History", "Geography", "Cooking"]));

  const toggleCat = (c) => {
    setAllowed((s) => {
      const n = new Set(s);
      n.has(c) ? n.delete(c) : n.add(c);
      return n;
    });
  };

  return (
    <div className="max-w-3xl fade-up" data-testid="parental-page">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parental controls</h1>
          <p className="text-sm text-muted-foreground">Prototype preview. In production, this is bound to a supervised profile.</p>
        </div>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs text-primary">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Preview only. Settings are stored locally in this prototype and applied on the current session.</p>
      </div>

      <section className="mb-6 rounded-2xl border border-border p-6">
        <Row label="Lock Learn Mode" desc="Always keep Learn Mode on for the supervised account.">
          <Switch checked={lockLearn} onCheckedChange={setLockLearn} data-testid="parental-lock-learn" />
        </Row>
      </section>

      <section className="mb-6 rounded-2xl border border-border p-6">
        <p className="mb-3 text-sm font-semibold">Restrict content by age</p>
        <RadioGroup value={ageBand} onValueChange={setAgeBand} className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2"><RadioGroupItem value="kids" data-testid="parental-age-kids" /> Kids (6-9)</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="tween" data-testid="parental-age-tween" /> Tween (10-12)</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="teen" data-testid="parental-age-teen" /> Teen (13-17)</label>
          <label className="flex items-center gap-2"><RadioGroupItem value="all" data-testid="parental-age-all" /> No restriction</label>
        </RadioGroup>
      </section>

      <section className="mb-6 rounded-2xl border border-border p-6 space-y-4">
        <Row label="Allow Clips" desc="Let the supervised account browse short-form Clips.">
          <Switch checked={allowClips} onCheckedChange={setAllowClips} data-testid="parental-allow-clips" />
        </Row>
        <Row label="Allow comments" desc="Show and allow posting comments.">
          <Switch checked={allowComments} onCheckedChange={setAllowComments} data-testid="parental-allow-comments" />
        </Row>
        <Row label="Autoplay next video" desc="When off, playback stops after each video.">
          <Switch checked={autoplay} onCheckedChange={setAutoplay} data-testid="parental-autoplay" />
        </Row>
      </section>

      <section className="mb-6 rounded-2xl border border-border p-6">
        <p className="mb-3 text-sm font-semibold">Allowed content categories</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATS.map((c) => (
            <label key={c} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
              <Checkbox checked={allowed.has(c)} onCheckedChange={() => toggleCat(c)} data-testid={`parental-cat-${c}`} />
              {c}
            </label>
          ))}
        </div>
      </section>

      <button
        onClick={() => toast.success("Parental controls saved (preview)")}
        data-testid="parental-save"
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:scale-[1.02] transition-transform"
      >
        Save controls
      </button>
    </div>
  );
}

const Row = ({ label, desc, children }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    {children}
  </div>
);
