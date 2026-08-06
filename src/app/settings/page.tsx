"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [postizStatus, setPostizStatus] = useState<"loading" | "connected" | "disconnected">("loading");
  const [n8nStatus, setN8nStatus] = useState<"loading" | "connected" | "disconnected">("loading");
  const [aiStatus, setAiStatus] = useState<boolean>(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/postiz/status");
        const data = await res.json();
        setPostizStatus(data.connected ? "connected" : "disconnected");
      } catch {
        setPostizStatus("disconnected");
      }
      try {
        const res = await fetch("/api/n8n/workflows");
        if (res.ok) setN8nStatus("connected");
        else setN8nStatus("disconnected");
      } catch {
        setN8nStatus("disconnected");
      }
      try {
        const res = await fetch("/api/ai/generate");
        const data = await res.json();
        setAiStatus(data.configured ?? false);
      } catch {
        setAiStatus(false);
      }
    }
    check();
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Configure your API connections</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Postiz Connection</CardTitle>
              <CardDescription>Connect to your self-hosted Postiz instance</CardDescription>
            </div>
            <StatusBadge status={postizStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="postiz-url">Postiz API URL</Label>
            <Input id="postiz-url" placeholder="http://postiz:3000/api/public/v1" defaultValue={process.env.NEXT_PUBLIC_POSTIZ_API_URL || ""} disabled />
            <p className="text-xs text-muted-foreground">Set via POSTIZ_API_URL environment variable</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="postiz-key">Postiz API Key</Label>
            <Input id="postiz-key" type="password" placeholder="••••••••••••" disabled />
            <p className="text-xs text-muted-foreground">Set via POSTIZ_API_KEY environment variable</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Test Connection
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>n8n Connection</CardTitle>
              <CardDescription>Connect to your self-hosted n8n instance</CardDescription>
            </div>
            <StatusBadge status={n8nStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="n8n-url">n8n API URL</Label>
            <Input id="n8n-url" placeholder="http://n8n:5678/api/v1" disabled />
            <p className="text-xs text-muted-foreground">Set via N8N_API_URL environment variable</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="n8n-key">n8n API Key</Label>
            <Input id="n8n-key" type="password" placeholder="••••••••••••" disabled />
            <p className="text-xs text-muted-foreground">Set via N8N_API_KEY environment variable. Enable API in n8n Settings → API.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Provider</CardTitle>
              <CardDescription>OpenAI or Anthropic for content generation</CardDescription>
            </div>
            <Badge variant={aiStatus ? "default" : "secondary"}>
              {aiStatus ? "Configured" : "Not configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-key">AI API Key</Label>
            <Input id="ai-key" type="password" placeholder="••••••••••••" disabled />
            <p className="text-xs text-muted-foreground">Set via OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Video Generation (ppq.ai)</CardTitle>
              <CardDescription>AI video generation — Veo3, Kling, Runway models</CardDescription>
            </div>
            <Badge variant={aiStatus ? "default" : "secondary"}>
              {aiStatus ? "Configured" : "Not configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ppq-key">ppq.ai API Key</Label>
            <Input id="ppq-key" type="password" placeholder="sk-..." disabled />
            <p className="text-xs text-muted-foreground">Set via PPQ_API_KEY environment variable</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ppq-url">ppq.ai Base URL</Label>
            <Input id="ppq-url" placeholder="https://api.ppq.ai" disabled />
            <p className="text-xs text-muted-foreground">Set via PPQ_BASE_URL environment variable</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Posting Schedule</CardTitle>
          <CardDescription>Set default time windows for scheduling posts</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">Start Time</Label>
            <Input id="start-time" type="time" defaultValue="09:00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">End Time</Label>
            <Input id="end-time" type="time" defaultValue="21:00" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: "loading" | "connected" | "disconnected" }) {
  if (status === "loading") {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
  if (status === "connected") {
    return (
      <Badge className="bg-green-500 hover:bg-green-600">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <XCircle className="mr-1 h-3 w-3" /> Disconnected
    </Badge>
  );
}
