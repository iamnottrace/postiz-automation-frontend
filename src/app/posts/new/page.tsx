"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Upload, Send, Clock, FileEdit, Loader2, Video, X } from "lucide-react";
import type { PostizIntegration } from "@/types/postiz";

const platformLimits: Record<string, number> = {
  x: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 5000,
  threads: 500,
  bluesky: 300,
  mastodon: 500,
  reddit: 40000,
  discord: 2000,
  youtube: 5000,
  tiktok: 2200,
  pinterest: 500,
};

export default function NewPostPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <NewPostContent />
    </Suspense>
  );
}

function NewPostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<PostizIntegration[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [postType, setPostType] = useState<"now" | "schedule" | "draft">("schedule");
  const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  useEffect(() => {
    const vUrl = searchParams.get("videoUrl");
    const text = searchParams.get("text");
    if (vUrl) setVideoUrl(vUrl);
    if (text) setContent(text);

    async function load() {
      try {
        const res = await fetch("/api/postiz/integrations");
        const data = await res.json();
        setIntegrations(data.integrations || []);
      } catch {
        setIntegrations([]);
      }
    }
    load();
  }, [searchParams]);

  function toggleChannel(id: string) {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/postiz/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.path) setUploadedMedia((prev) => [...prev, data.path]);
      } catch {
        alert("Upload failed");
      }
    }
  }

  async function handleGenerate() {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, count: 1 }),
      });
      const data = await res.json();
      if (data.texts?.[0]) setContent(data.texts[0]);
    } catch {
      alert("AI generation failed. Check your API key in Settings.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit() {
    if (!content.trim() || selectedChannels.length === 0) {
      alert("Please add content and select at least one channel");
      return;
    }
    setSubmitting(true);
    try {
      for (const integrationId of selectedChannels) {
        await fetch("/api/postiz/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            type: postType,
            integrationId,
            date: postType === "schedule" ? scheduleDate : undefined,
            images: uploadedMedia,
          }),
        });
      }
      router.push("/posts");
    } catch {
      alert("Failed to create post");
    } finally {
      setSubmitting(false);
    }
  }

  const activePlatform = integrations.find((i) => i.id === selectedChannels[0])?.type || "x";
  const charLimit = platformLimits[activePlatform] || 280;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create Post</h2>
        <p className="text-muted-foreground">Compose and schedule posts across your channels</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Post Text</Label>
                  <Badge variant={content.length > charLimit ? "destructive" : "secondary"}>
                    {content.length} / {charLimit}
                  </Badge>
                </div>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What do you want to share?"
                  rows={6}
                />
              </div>

              {videoUrl && (
                <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2"><Video className="h-4 w-4 text-primary" /> Video from Studio</Label>
                    <Button size="icon" variant="ghost" onClick={() => setVideoUrl(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <video src={videoUrl} controls className="w-full rounded-lg" />
                </div>
              )}

              <div className="space-y-2">
                <Label>Media</Label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <input type="file" multiple accept="image/*,video/*" onChange={handleUpload} className="hidden" />
                    <span className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
                      <Upload className="mr-2 h-4 w-4" /> Upload Media
                    </span>
                  </label>
                  {uploadedMedia.length > 0 && (
                    <Badge>{uploadedMedia.length} file(s) attached</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>AI Content Generator</Label>
                <div className="flex gap-2">
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe what you want to post about..."
                  />
                  <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={postType === "now" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType("now")}
                >
                  <Send className="mr-2 h-4 w-4" /> Post Now
                </Button>
                <Button
                  variant={postType === "schedule" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType("schedule")}
                >
                  <Clock className="mr-2 h-4 w-4" /> Schedule
                </Button>
                <Button
                  variant={postType === "draft" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType("draft")}
                >
                  <FileEdit className="mr-2 h-4 w-4" /> Save Draft
                </Button>
              </div>
              {postType === "schedule" && (
                <div className="space-y-2">
                  <Label htmlFor="date">Schedule Date & Time</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Channels</CardTitle>
              <CardDescription>Select target platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {integrations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No channels connected. Go to Channels page first.</p>
              ) : (
                integrations.map((integration) => (
                  <label
                    key={integration.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-2 hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(integration.id)}
                      onChange={() => toggleChannel(integration.id)}
                      className="h-4 w-4"
                    />
                    {integration.picture && (
                      <img src={integration.picture} alt="" className="h-8 w-8 rounded-full" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{integration.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{integration.type}</p>
                    </div>
                  </label>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={activePlatform}>
                <TabsList className="w-full">
                  {selectedChannels.slice(0, 3).map((id) => {
                    const int = integrations.find((i) => i.id === id);
                    if (!int) return null;
                    return (
                      <TabsTrigger key={id} value={int.type} className="capitalize">
                        {int.type}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {selectedChannels.slice(0, 3).map((id) => {
                  const int = integrations.find((i) => i.id === id);
                  if (!int) return null;
                  return (
                    <TabsContent key={id} value={int.type}>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {int.picture && <img src={int.picture} alt="" className="h-8 w-8 rounded-full" />}
                          <span className="text-sm font-medium">{int.name}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{content || "Your post will appear here..."}</p>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : postType === "now" ? "Post Now" : postType === "schedule" ? "Schedule Post" : "Save Draft"}
          </Button>
        </div>
      </div>
    </div>
  );
}
