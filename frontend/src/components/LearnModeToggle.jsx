import React from "react";
import { GraduationCap, Play, Lock } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export const LearnModeToggle = ({ compact = false }) => {
  const { learnMode, toggleLearnMode, account } = useApp();
  const locked = account?.learn_mode_locked;

  return (
    <button
      onClick={toggleLearnMode}
      disabled={locked}
      data-testid="learn-mode-toggle"
      aria-pressed={learnMode}
      title={locked ? "Learn Mode is locked by parental controls" : "Toggle Learn Mode"}
      className={cn(
        "relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
        learnMode
          ? "bg-primary text-primary-foreground border-primary learn-glow"
          : "bg-secondary text-foreground border-transparent hover:bg-muted",
        locked && "opacity-80 cursor-not-allowed"
      )}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        {learnMode ? <GraduationCap className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </span>
      {!compact && (
        <span className="hidden sm:inline">
          {learnMode ? "Learn Mode" : "Normal Mode"}
        </span>
      )}
      {locked && <Lock className="ml-1 h-3 w-3" />}
    </button>
  );
};
