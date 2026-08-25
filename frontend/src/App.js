import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "@/contexts/AppContext";
import { AppShell } from "@/components/layout/AppShell";
import Home from "@/pages/Home";
import Clips from "@/pages/Clips";
import Learn from "@/pages/Learn";
import Following from "@/pages/Following";
import Library from "@/pages/Library";
import Watch from "@/pages/Watch";
import Channel from "@/pages/Channel";
import Search from "@/pages/Search";
import Upload from "@/pages/Upload";
import Settings from "@/pages/Settings";
import ParentalControls from "@/pages/ParentalControls";
import CreateChannel from "@/pages/CreateChannel";
import Friends from "@/pages/Friends";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/clips" element={<Clips />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/following" element={<Following />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/library" element={<Library />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/channel/new" element={<CreateChannel />} />
            <Route path="/channel/:handle" element={<Channel />} />
            <Route path="/search" element={<Search />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/parental" element={<ParentalControls />} />
          </Routes>
        </AppShell>
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
