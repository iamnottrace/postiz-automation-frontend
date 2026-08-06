"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { PostizIntegration } from "@/types/postiz";
import type { PostizAnalytics } from "@/types/postiz";

export default function AnalyticsPage() {
  const [integrations, setIntegrations] = useState<PostizIntegration[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [analytics, setAnalytics] = useState<PostizAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/postiz/integrations");
        const data = await res.json();
        const ints = data.integrations || [];
        setIntegrations(ints);
        if (ints.length > 0) setSelectedId(ints[0].id);
      } catch {
        setIntegrations([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setAnalyticsLoading(true);
    async function loadAnalytics() {
      try {
        const res = await fetch(`/api/postiz/analytics?integrationId=${selectedId}`);
        const data = await res.json();
        setAnalytics(data);
      } catch {
        setAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    }
    loadAnalytics();
  }, [selectedId]);

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  const metrics = analytics?.metrics;
  const chartData = analytics?.posts?.map((p) => ({
    date: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    likes: p.metrics?.likes || 0,
    comments: p.metrics?.comments || 0,
    shares: p.metrics?.shares || 0,
  })) || [];

  const metricCards = [
    { label: "Impressions", value: metrics?.impressions || 0 },
    { label: "Likes", value: metrics?.likes || 0 },
    { label: "Comments", value: metrics?.comments || 0 },
    { label: "Shares", value: metrics?.shares || 0 },
    { label: "Reach", value: metrics?.reach || 0 },
    { label: "Engagement Rate", value: `${(metrics?.engagementRate || 0).toFixed(2)}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Track performance across platforms</p>
        </div>
        <Select value={selectedId} onValueChange={(v) => setSelectedId(v ?? "")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent>
            {integrations.map((int) => (
              <SelectItem key={int.id} value={int.id}>
                {int.name} ({int.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {analyticsLoading ? (
        <Skeleton className="h-96" />
      ) : !analytics ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-muted-foreground">No analytics data available for this channel.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {metricCards.map((m) => (
              <Card key={m.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{m.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{m.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="likes" stroke="#8884d8" />
                    <Line type="monotone" dataKey="comments" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="shares" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No post data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.posts?.slice(0, 10).map((post) => (
                  <div key={post.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="text-sm line-clamp-1 flex-1">{post.content?.substring(0, 80) || "Untitled"}</span>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{post.metrics?.likes || 0} likes</span>
                      <span>{post.metrics?.comments || 0} comments</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
