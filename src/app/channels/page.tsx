"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, RefreshCw } from "lucide-react";
import type { PostizIntegration } from "@/types/postiz";

export default function ChannelsPage() {
  const [integrations, setIntegrations] = useState<PostizIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    setLoading(true);
    try {
      const res = await fetch("/api/postiz/integrations");
      const data = await res.json();
      setIntegrations(data.integrations || []);
      setError(null);
    } catch {
      setError("Failed to load integrations. Check your Postiz connection in Settings.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteIntegration(id: string) {
    if (!confirm("Disconnect this channel?")) return;
    try {
      await fetch("/api/postiz/integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      loadIntegrations();
    } catch {
      alert("Failed to disconnect channel");
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Channels</h2>
          <p className="text-muted-foreground">Manage your connected social media accounts</p>
        </div>
        <Button variant="outline" onClick={loadIntegrations}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {integrations.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">No channels connected yet.</p>
            <p className="text-sm text-muted-foreground">
              Connect your social accounts in your Postiz instance first, then refresh this page.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                {integration.picture && (
                  <img src={integration.picture} alt={integration.name} className="h-10 w-10 rounded-full" />
                )}
                <div>
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                  <p className="text-xs text-muted-foreground capitalize">{integration.type}</p>
                </div>
              </div>
              <Badge variant={integration.disabled ? "secondary" : "default"}>
                {integration.disabled ? "Disabled" : "Active"}
              </Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ID: {integration.id.substring(0, 8)}...</span>
              <Button variant="ghost" size="icon" onClick={() => deleteIntegration(integration.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}

        <Card className="flex items-center justify-center border-dashed">
          <CardContent className="flex flex-col items-center py-10">
            <Plus className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Connect new channels via Postiz</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
