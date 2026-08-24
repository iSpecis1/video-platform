import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Upload, Menu, Sun, Moon, User } from "lucide-react";
import { LearnModeToggle } from "@/components/LearnModeToggle";
import { useApp } from "@/contexts/AppContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = ({ onOpenMobileNav }) => {
  const { theme, setTheme, account, accounts, switchAccount, learnMode } = useApp();
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="glass sticky top-0 z-40 h-16 w-full" data-testid="app-header">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4">
        <button
          onClick={onOpenMobileNav}
          className="rounded-full p-2 hover:bg-muted md:hidden"
          data-testid="mobile-nav-toggle"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex items-center gap-2 pr-2" data-testid="logo-home-link">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-foreground">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="h-0 w-0"
                style={{
                  borderLeft: "10px solid hsl(var(--background))",
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  marginLeft: 2,
                }}
              />
            </div>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight">VideoPlatform</span>
            {learnMode && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                Learn Mode
              </span>
            )}
          </div>
        </Link>

        <form onSubmit={submit} className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2 focus-within:border-primary/60 focus-within:bg-background transition-colors">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={learnMode ? "Search educational videos, clips, channels…" : "Search videos, clips, channels…"}
              data-testid="search-input"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LearnModeToggle />
          </div>

          <Link
            to="/upload"
            data-testid="create-btn"
            className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
          >
            <Upload className="h-4 w-4" />
            Create
          </Link>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full p-2 hover:bg-muted"
            data-testid="theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button className="hidden sm:block rounded-full p-2 hover:bg-muted" data-testid="notifications-btn" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-0.5 hover:ring-2 hover:ring-primary/40" data-testid="account-menu-trigger">
                {account?.avatar ? (
                  <img src={account.avatar} alt={account.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64" data-testid="account-menu-content">
              <DropdownMenuLabel className="flex items-center gap-3 py-3">
                <img src={account?.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{account?.username || "Guest"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {account?.has_channel ? `@${account.channel_handle}` : account?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" data-testid="menu-your-account">Your Account</Link>
              </DropdownMenuItem>
              {account?.has_channel ? (
                <DropdownMenuItem asChild>
                  <Link to={`/channel/${account.channel_handle}`} data-testid="menu-your-channel">Your Channel</Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/channel/new" data-testid="menu-create-channel">Create your Channel</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link to="/library" data-testid="menu-history">History</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/library" data-testid="menu-playlists">Playlists</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" data-testid="menu-settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/parental" data-testid="menu-parental">Parental controls</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Switch profile</DropdownMenuLabel>
              {accounts.map((a) => (
                <DropdownMenuItem
                  key={a.id}
                  onClick={() => switchAccount(a.id)}
                  data-testid={`switch-account-${a.id}`}
                  className="gap-2"
                >
                  <img src={a.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                  <span className="flex-1 truncate">{a.username || a.name}</span>
                  {a.id === account?.id && <span className="text-[10px] font-bold text-primary">CURRENT</span>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-sign-out">Sign out (mock)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
