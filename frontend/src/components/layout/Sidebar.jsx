import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Film, GraduationCap, Users, Library, Upload, Settings, ShieldCheck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";

const items = [
  { to: "/", label: "Home", icon: Home, testid: "nav-home" },
  { to: "/clips", label: "Clips", icon: Film, testid: "nav-clips" },
  { to: "/learn", label: "Learn", icon: GraduationCap, testid: "nav-learn" },
  { to: "/following", label: "Following", icon: Users, testid: "nav-following" },
  { to: "/friends", label: "Friends", icon: Heart, testid: "nav-friends" },
  { to: "/library", label: "Library", icon: Library, testid: "nav-library" },
];

const secondary = [
  { to: "/upload", label: "Create", icon: Upload, testid: "nav-upload" },
  { to: "/settings", label: "Settings", icon: Settings, testid: "nav-settings" },
  { to: "/parental", label: "Parental controls", icon: ShieldCheck, testid: "nav-parental" },
];

export const Sidebar = ({ onNavigate }) => {
  const { follows } = useApp();

  return (
    <aside
      className="hidden md:flex sticky top-16 h-[calc(100vh-4rem)] w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border/60 bg-background px-3 py-4"
      data-testid="sidebar"
    >
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <SideLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="my-3 h-px bg-border/60" />

      <nav className="flex flex-col gap-1">
        {secondary.map((item) => (
          <SideLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      {follows.length > 0 && (
        <>
          <div className="my-3 h-px bg-border/60" />
          <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Following
          </p>
          <div className="flex flex-col gap-1">
            {follows.slice(0, 8).map((h) => (
              <NavLink
                key={h}
                to={`/channel/${h}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors",
                    isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  )
                }
                data-testid={`sidebar-follow-${h}`}
              >
                <span className="h-2 w-2 rounded-full bg-primary/70" />
                <span className="truncate">@{h}</span>
              </NavLink>
            ))}
          </div>
        </>
      )}

      <div className="mt-auto px-3 py-3 text-[11px] text-muted-foreground">
        VideoPlatform · v0.1 prototype
      </div>
    </aside>
  );
};

const SideLink = ({ item, onNavigate }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      data-testid={item.testid}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors",
          isActive ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:bg-muted"
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </NavLink>
  );
};
