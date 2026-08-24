import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { UploadCloud, CheckCircle2, AlertCircle, Clock, Search, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Technology", "Science", "History", "Geography", "Business", "Finance", "Cooking", "DIY", "Gaming", "Entertainment", "Music", "Comedy", "Travel", "Documentaries", "Practical Skills", "Languages", "How Things Work"];

export default function Upload() {
  const { account } = useApp();
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Technology",
    creator_claims_educational: true,
    age_rating: "all",
    visibility: "public",
  });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!account?.has_channel) {
    return <NoChannelPrompt />;
  }

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please give your video a title.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.upload({
        ...form,
        account_id: account?.id,
        creator_claims_educational: !!form.creator_claims_educational,
      });
      setResult(res);
      toast.success("Video submitted for processing.");
    } catch (e) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl fade-up" data-testid="upload-page">
      <h1 className="mb-1 text-3xl font-bold tracking-tight">Create a video</h1>
      <p className="mb-8 text-sm text-muted-foreground">Prototype upload flow. No file is actually uploaded in V0.1.</p>

      <form onSubmit={submit} className="space-y-6">
        <div>
          <label
            htmlFor="video-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/40 py-14 text-center transition-colors hover:bg-muted"
            data-testid="upload-file-dropzone"
          >
            <UploadCloud className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-semibold">{file ? file.name : "Choose a video file"}</p>
              <p className="mt-1 text-xs text-muted-foreground">MP4, MOV up to 5 GB (prototype)</p>
            </div>
            <input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Give your video a clear, descriptive title"
              data-testid="upload-title"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={form.category} onValueChange={(v) => update("category", v)}>
              <SelectTrigger id="category" data-testid="upload-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            rows={5}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What is this video about? Who is it for?"
            data-testid="upload-description"
          />
        </div>

        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-primary">Learn Mode eligibility</p>
          </div>
          <p className="mb-3 text-sm">Is this video educational or informational?</p>
          <RadioGroup
            value={form.creator_claims_educational ? "yes" : "no"}
            onValueChange={(v) => update("creator_claims_educational", v === "yes")}
            className="flex gap-6"
          >
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="yes" id="edu-yes" data-testid="upload-edu-yes" />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="no" id="edu-no" data-testid="upload-edu-no" />
              No
            </label>
          </RadioGroup>
          {form.creator_claims_educational && (
            <p className="mt-3 text-xs text-muted-foreground">
              Videos marked as educational may appear in Learn Mode after verification. The creator&apos;s declaration
              is not sufficient by itself — automated systems review content for genuine educational value.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Audience & age suitability</Label>
            <RadioGroup
              value={form.age_rating}
              onValueChange={(v) => update("age_rating", v)}
              className="mt-2 flex flex-col gap-2 text-sm"
            >
              <label className="flex items-center gap-2">
                <RadioGroupItem value="all" data-testid="upload-age-all" />
                Suitable for all ages
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="teen" data-testid="upload-age-teen" />
                Teen (13+)
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="mature" data-testid="upload-age-mature" />
                Mature audiences
              </label>
            </RadioGroup>
          </div>
          <div>
            <Label>Visibility</Label>
            <RadioGroup
              value={form.visibility}
              onValueChange={(v) => update("visibility", v)}
              className="mt-2 flex flex-col gap-2 text-sm"
            >
              <label className="flex items-center gap-2">
                <RadioGroupItem value="public" data-testid="upload-visibility-public" />
                Public
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="unlisted" data-testid="upload-visibility-unlisted" />
                Unlisted
              </label>
              <label className="flex items-center gap-2">
                <RadioGroupItem value="private" data-testid="upload-visibility-private" />
                Private
              </label>
            </RadioGroup>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            data-testid="upload-submit"
            className={cn(
              "rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]",
              submitting && "opacity-70"
            )}
          >
            {submitting ? "Submitting…" : "Publish"}
          </button>
          <span className="text-xs text-muted-foreground">This is a prototype. Nothing is actually uploaded.</span>
        </div>
      </form>

      {result && <VerificationCard status={result.learn_mode_status} claimed={form.creator_claims_educational} />}
    </div>
  );
}

const NoChannelPrompt = () => {
  const { account } = useApp();
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-secondary/40 p-10 text-center" data-testid="upload-no-channel">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        {account?.avatar && <img src={account.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />}
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Create your Channel to start publishing.</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You&apos;re already <span className="font-semibold text-foreground">@{account?.username}</span>. Creating a Channel upgrades this same identity with creator capabilities — you won&apos;t get a second profile.
      </p>
      <Link
        to="/channel/new"
        className="mt-6 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
        data-testid="create-channel-btn"
      >
        Create your Channel
      </Link>
    </div>
  );
};

const VerificationCard = ({ status, claimed }) => {
  const cfg = {
    approved: {
      icon: CheckCircle2,
      title: "Approved for Learn Mode",
      body: "Your video has been marked as educational and will appear in Learn Mode surfaces.",
      tone: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
    },
    pending: {
      icon: Clock,
      title: "Pending verification",
      body: "Your video is queued for automated review. Learn Mode eligibility will be determined shortly.",
      tone: "text-amber-600 bg-amber-500/10 border-amber-500/30",
    },
    manual_review: {
      icon: Search,
      title: "In manual review",
      body: "A reviewer will inspect this video to determine if it qualifies as educational.",
      tone: "text-blue-600 bg-blue-500/10 border-blue-500/30",
    },
    not_eligible: {
      icon: AlertCircle,
      title: "Not eligible for Learn Mode",
      body: claimed
        ? "Automated review didn't detect enough educational value. Your video will still appear in Normal Mode."
        : "Your video will appear in Normal Mode only.",
      tone: "text-rose-600 bg-rose-500/10 border-rose-500/30",
    },
  }[status] || {
    icon: Clock,
    title: "Submitted",
    body: "Your video is being processed.",
    tone: "text-muted-foreground bg-secondary border-border",
  };

  const Icon = cfg.icon;
  return (
    <div className={cn("mt-6 flex items-start gap-3 rounded-2xl border p-4", cfg.tone)} data-testid={`verification-${status}`}>
      <Icon className="mt-0.5 h-5 w-5" />
      <div>
        <p className="text-sm font-semibold">{cfg.title}</p>
        <p className="mt-1 text-sm">{cfg.body}</p>
      </div>
    </div>
  );
};
