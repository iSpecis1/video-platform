import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export const CategoryPills = ({ value, onChange }) => {
  const { learnMode } = useApp();
  const [cats, setCats] = useState([]);

  useEffect(() => {
    api.categories(learnMode).then((d) => setCats(["All", ...(d.categories || [])])).catch(() => {});
  }, [learnMode]);

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2" data-testid="category-pills">
      {cats.map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            data-testid={`category-pill-${c}`}
            onClick={() => onChange(c)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-background border-foreground"
                : "bg-secondary text-foreground border-transparent hover:bg-muted"
            )}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
};
