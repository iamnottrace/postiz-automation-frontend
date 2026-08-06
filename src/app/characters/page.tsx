"use client";

import { useState, useEffect } from "react";
import { User, Plus, Trash2, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VIDEO_STYLE_PRESETS } from "@/types/video";

interface Character {
  id: string;
  name: string;
  imageUrl: string;
  description: string | null;
  stylePreset: string | null;
  _count?: { videos: number };
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [stylePreset, setStylePreset] = useState("");

  const fetchCharacters = () => {
    fetch("/api/characters")
      .then((r) => r.json())
      .then((data) => setCharacters(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleCreate = async () => {
    if (!name || !imageUrl) return;
    await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, imageUrl, description, stylePreset: stylePreset || null }),
    });
    setName("");
    setImageUrl("");
    setDescription("");
    setStylePreset("");
    setShowForm(false);
    fetchCharacters();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/characters/${id}`, { method: "DELETE" });
    fetchCharacters();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Characters</h1>
          <p className="text-muted-foreground">Manage reusable characters for your videos</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="mr-2 h-4 w-4" /> Cancel</> : <><Plus className="mr-2 h-4 w-4" /> Add Character</>}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Character name" />
            </div>
            <div>
              <Label className="mb-1 block">Default Style</Label>
              <Select value={stylePreset} onValueChange={(v) => setStylePreset(v === "none" ? "" : (v || ""))}>
                <SelectTrigger><SelectValue placeholder="No default style" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No default style</SelectItem>
                  {VIDEO_STYLE_PRESETS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Character Image</Label>
            <div className="flex items-center gap-4">
              {imageUrl ? (
                <img src={imageUrl} alt="Character" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed">
                  <User className="h-8 w-8 text-muted-foreground" />
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
                  value={imageUrl.startsWith("data:") ? "" : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the character's personality, appearance, style..."
              rows={2}
            />
          </div>
          <Button onClick={handleCreate} disabled={!name || !imageUrl}>
            Save Character
          </Button>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : characters.length === 0 ? (
        <Card className="flex h-48 flex-col items-center justify-center gap-2 p-4">
          <User className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No characters yet. Click "Add Character" to create one.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((char) => (
            <Card key={char.id} className="group p-4">
              <div className="flex items-start gap-3">
                <img src={char.imageUrl} alt={char.name} className="h-16 w-16 rounded-full object-cover" />
                <div className="flex-1">
                  <h3 className="font-semibold">{char.name}</h3>
                  {char.stylePreset && (
                    <p className="text-xs text-primary">{char.stylePreset}</p>
                  )}
                  {char.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{char.description}</p>
                  )}
                  {char._count && (
                    <p className="mt-1 text-xs text-muted-foreground">{char._count.videos} videos</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleDelete(char.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
