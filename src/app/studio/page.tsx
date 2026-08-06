"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  User,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { VIDEO_MODELS, VIDEO_STYLE_PRESETS } from "@/types/video";

interface Character {
  id: string;
  name: string;
  imageUrl: string;
  description: string | null;
  stylePreset: string | null;
}

export default function StudioPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("kling-2.1-pro");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("5");
  const [quality, setQuality] = useState("720p");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [postText, setPostText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/characters")
      .then((r) => r.json())
      .then((data) => setCharacters(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const selectedModelInfo = VIDEO_MODELS.find((m) => m.id === selectedModel);
  const selectedStyleInfo = VIDEO_STYLE_PRESETS.find((s) => s.id === selectedStyle);
  const isImageToVideo = selectedModelInfo?.type === "image-to-video";

  const buildPrompt = useCallback(() => {
    let p = prompt;
    if (selectedStyleInfo) {
      p = selectedStyleInfo.promptTemplate
        .replace("{prompt}", prompt)
        .replace("{character}", characters.find((c) => c.id === selectedCharacter)?.name || "a person");
    }
    if (selectedCharacter && !selectedStyleInfo) {
      const char = characters.find((c) => c.id === selectedCharacter);
      if (char) p = `${char.name} (${char.description || ""}) featuring ${p}`;
    }
    return p;
  }, [prompt, selectedStyleInfo, selectedCharacter, characters]);

  const handleGenerate = async () => {
    if (!prompt) {
      setError("Please enter a prompt");
      return;
    }
    if (isImageToVideo && !productImageUrl) {
      setError("Image-to-video models require a product image URL");
      return;
    }

    setGenerating(true);
    setError(null);
    setVideoStatus("pending");
    setVideoUrl(null);

    try {
      const finalPrompt = buildPrompt();
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: selectedModel,
          aspectRatio,
          duration,
          quality,
          characterId: selectedCharacter || null,
          productImageUrl: productImageUrl || null,
          postText: postText || null,
          name: `${selectedStyleInfo?.name || "Video"} — ${prompt.slice(0, 40)}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit video");
      }

      const data = await res.json();
      pollStatus(data.video.id);
    } catch (err) {
      setError(String(err));
      setVideoStatus("failed");
      setGenerating(false);
    }
  };

  const pollStatus = async (videoId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`);
        if (!res.ok) return;
        const data = await res.json();
        setVideoStatus(data.status);
        if (data.status === "completed" && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setGenerating(false);
          return;
        }
        if (data.status === "failed") {
          setError("Video generation failed");
          setGenerating(false);
          return;
        }
        setTimeout(poll, 8000);
      } catch {
        setTimeout(poll, 8000);
      }
    };
    setTimeout(poll, 5000);
  };

  const handlePostToSocial = () => {
    if (videoUrl) {
      router.push(`/posts/new?videoUrl=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(postText || prompt)}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProductImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Video Studio</h1>
          <p className="text-muted-foreground">Generate AI videos with characters and product photos</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/studio/gallery")}>
          <Video className="mr-2 h-4 w-4" /> Gallery
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Configuration */}
        <div className="space-y-4">
          {/* Product Image */}
          <Card className="p-4">
            <Label className="mb-2 block">Product Image {isImageToVideo && "(required)"}</Label>
            <div className="flex items-center gap-4">
              {productImageUrl ? (
                <img src={productImageUrl} alt="Product" className="h-24 w-24 rounded-lg object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
                    <Upload className="h-4 w-4" /> Upload Image
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
                <Input
                  placeholder="...or paste image URL"
                  value={productImageUrl.startsWith("data:") ? "" : productImageUrl}
                  onChange={(e) => setProductImageUrl(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Character */}
          <Card className="p-4">
            <Label className="mb-2 block">Character (optional)</Label>
            <Select value={selectedCharacter} onValueChange={(v) => setSelectedCharacter(v === "none" ? "" : (v || ""))}>
              <SelectTrigger>
                <SelectValue placeholder="No character" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No character</SelectItem>
                {characters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCharacter && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={characters.find((c) => c.id === selectedCharacter)?.imageUrl}
                  alt="Character"
                  className="h-12 w-12 rounded-full object-cover"
                />
                <p className="text-sm text-muted-foreground">
                  {characters.find((c) => c.id === selectedCharacter)?.description}
                </p>
              </div>
            )}
          </Card>

          {/* Style Preset */}
          <Card className="p-4">
            <Label className="mb-2 block">Style Preset</Label>
            <div className="grid grid-cols-3 gap-2">
              {VIDEO_STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    setSelectedStyle(style.id);
                    if (style.defaultModel) setSelectedModel(style.defaultModel);
                  }}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                    selectedStyle === style.id && "border-primary bg-primary/5"
                  )}
                >
                  <Sparkles className="mb-1 h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">{style.name}</p>
                  <p className="text-xs text-muted-foreground">{style.description}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Model & Settings */}
          <Card className="p-4 space-y-3">
            <div>
              <Label className="mb-2 block">Video Model</Label>
              <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v || "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label} — ${m.costPer5s}/5s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedModelInfo && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedModelInfo.description} · {selectedModelInfo.type}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v || "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Duration</Label>
                <Select value={duration} onValueChange={(v) => setDuration(v || "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(selectedModelInfo?.durations || ["5", "10"]).map((d) => (
                      <SelectItem key={d} value={d}>{d}s</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Quality</Label>
                <Select value={quality} onValueChange={(v) => setQuality(v || "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Prompt */}
          <Card className="p-4">
            <Label className="mb-2 block">Prompt</Label>
            <Textarea
              placeholder="Describe the video you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
            <Label className="mt-3 mb-2 block">Caption for social media post (optional)</Label>
            <Input
              placeholder="Caption text..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={generating || !prompt}
          >
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" /> Generate Video</>
            )}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Right: Preview & Result */}
        <div className="space-y-4">
          <Card className="p-4">
            <Label className="mb-3 block">Preview</Label>
            <div className="space-y-3">
              {productImageUrl && (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Product Image</p>
                  <img src={productImageUrl} alt="Product" className="w-full rounded-lg" />
                </div>
              )}
              {selectedCharacter && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {characters.find((c) => c.id === selectedCharacter)?.name}
                  </span>
                </div>
              )}
              {selectedStyleInfo && (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm">{selectedStyleInfo.name}</span>
                </div>
              )}
              {prompt && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Final prompt:</p>
                  <p className="mt-1">{buildPrompt()}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Status & Result */}
          <Card className="p-4">
            <Label className="mb-3 block">Result</Label>
            {videoStatus === "idle" && (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                <Video className="h-12 w-12" />
              </div>
            )}
            {videoStatus === "pending" && (
              <div className="flex h-48 flex-col items-center justify-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Submitting to {selectedModelInfo?.label}...</p>
              </div>
            )}
            {videoStatus === "processing" && (
              <div className="flex h-48 flex-col items-center justify-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating video... (this takes 60-120s)</p>
              </div>
            )}
            {videoStatus === "completed" && videoUrl && (
              <div className="space-y-3">
                <video src={videoUrl} controls className="w-full rounded-lg" />
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> Video ready!
                </div>
                <Button className="w-full" onClick={handlePostToSocial}>
                  Post to Social Media
                </Button>
              </div>
            )}
            {videoStatus === "failed" && (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-destructive">
                <XCircle className="h-12 w-12" />
                <p className="text-sm">Generation failed. Try again.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
