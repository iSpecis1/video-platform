import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { Link } from "react-router-dom";
import { VideoCard } from "@/components/VideoCard";
import { Clock, Heart, ListVideo } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Library() {
  const [history, setHistory] = useState([]);
  const [liked, setLiked] = useState([]);
  const { likes } = useApp();

  useEffect(() => {
    api.history().then(setHistory);
  }, []);

  useEffect(() => {
    (async () => {
      const results = await Promise.all(
        likes.map((id) => api.getVideo(id).catch(() => null))
      );
      setLiked(results.filter(Boolean));
    })();
  }, [likes]);

  return (
    <div className="fade-up">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Library</h1>
      <Tabs defaultValue="history" data-testid="library-tabs">
        <TabsList>
          <TabsTrigger value="history" data-testid="library-tab-history">
            <Clock className="h-4 w-4 mr-1.5" /> History
          </TabsTrigger>
          <TabsTrigger value="liked" data-testid="library-tab-liked">
            <Heart className="h-4 w-4 mr-1.5" /> Liked
          </TabsTrigger>
          <TabsTrigger value="playlists" data-testid="library-tab-playlists">
            <ListVideo className="h-4 w-4 mr-1.5" /> Playlists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="pt-6">
          {history.length === 0 ? (
            <EmptyState label="You haven't watched anything yet." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((h) => (
                <Link
                  key={h.video_id}
                  to={`/watch/${h.video_id}`}
                  className="flex gap-3 rounded-xl border border-border p-3 hover:bg-muted transition-colors"
                  data-testid={`history-item-${h.video_id}`}
                >
                  <img src={h.thumbnail} alt="" className="h-20 w-32 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold">{h.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{h.channel_name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="liked" className="pt-6">
          {liked.length === 0 ? (
            <EmptyState label="Videos you like will appear here." />
          ) : (
            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {liked.map((v, i) => (
                <VideoCard key={v.id} video={v} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="playlists" className="pt-6">
          <EmptyState label="Playlists are coming soon in the next iteration." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const EmptyState = ({ label }) => (
  <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
    {label}
  </div>
);
