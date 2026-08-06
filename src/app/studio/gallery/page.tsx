"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Video, Play, Trash2, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VideoProject {
  id: string;
  name: string | null;
  status: string;
  videoUrl: string | null;
  prompt: string;
  model: string;
  cost: number | null;
  productImageUrl: string | null;
  character?: { name: string; imageUrl: string } | null;
  createdAt: string;
}

const statusConfig = {
  pending: { icon: Clock, label: "Pending", color: "text-yellow-500" },
  processing: { icon: Loader2, label: "Processing", color: "text-blue-500" },
  completed: { icon: CheckCircle2, label: "Completed", color: "text-green-500" },
  failed: { icon: XCircle, label: "Failed", color: "text-red-500" },
};

export default function GalleryPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchVideos = () => {
    fetch("/api/videos")
      .then((r) => r.json())
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/videos/${id}`, { method: "DELETE" });
    fetchVideos();
  };

  const filtered = filter === "all" ? videos : videos.filter((v) => v.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Video Gallery</h1>
          <p className="text-muted-foreground">All generated videos</p>
        </div>
        <Button onClick={() => router.push("/studio")}>
          <Video className="mr-2 h-4 w-4" /> New Video
        </Button>
      </div>

      <div className="flex gap-2">
        {["all", "completed", "processing", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm capitalize transition-colors",
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card className="flex h-48 flex-col items-center justify-center gap-2 p-4">
          <Video className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No videos yet. Generate one in the Studio.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => {
            const sc = statusConfig[video.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = sc.icon;
            return (
              <Card key={video.id} className="group overflow-hidden p-0">
                <div className="relative aspect-video bg-muted">
                  {video.videoUrl ? (
                    <video src={video.videoUrl} className="h-full w-full object-cover" controls />
                  ) : video.productImageUrl ? (
                    <img src={video.productImageUrl} alt={video.name || "Video"} className="h-full w-full object-cover opacity-50" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Play className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                    <StatusIcon className={cn("h-3 w-3", video.status === "processing" && "animate-spin", sc.color)} />
                    {sc.label}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="truncate font-medium text-sm">{video.name || "Untitled"}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{video.prompt}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{video.model}</span>
                    {video.cost && <span className="text-xs text-muted-foreground">${video.cost.toFixed(2)}</span>}
                  </div>
                  {video.character && (
                    <div className="mt-2 flex items-center gap-1">
                      <img src={video.character.imageUrl} alt="" className="h-5 w-5 rounded-full" />
                      <span className="text-xs text-muted-foreground">{video.character.name}</span>
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    {video.status === "completed" && video.videoUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/posts/new?videoUrl=${encodeURIComponent(video.videoUrl || "")}&text=${encodeURIComponent(video.prompt)}`)}
                      >
                        Post
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(video.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
