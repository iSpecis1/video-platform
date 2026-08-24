import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useApp } from "@/contexts/AppContext";
import { GraduationCap } from "lucide-react";

export const AppShell = ({ children }) => {
  const { learnMode } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="App min-h-screen bg-background text-foreground" data-testid="app-shell">
      <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
      {learnMode && (
        <div
          className="border-b border-primary/25 bg-primary/10 text-primary"
          data-testid="learn-mode-banner"
        >
          <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-1.5 text-xs font-medium">
            <GraduationCap className="h-3.5 w-3.5" />
            Learn Mode is on. Only educational and informational content is shown.
          </div>
        </div>
      )}
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur md:hidden"
          onClick={() => setMobileNavOpen(false)}
          data-testid="mobile-nav-overlay"
        >
          <div
            className="absolute left-0 top-0 h-full w-64 bg-background p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
