"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, CheckCircle2, Radio, Zap, Plus, Video, DollarSign } from "lucide-react";

type DashboardData = {
  postizConnected: boolean;
  n8nConnected: boolean;
  scheduledCount: number;
  publishedCount: number;
  pendingApprovals: number;
  channelCount: number;
  activeAutomations: number;
  videoCount: number;
  videoCost: number;
  recentActivity: { id: string; text: string; time: string; type: string }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [postizStatus, integrations, posts, workflows, videos] = await Promise.all([
          fetch("/api/postiz/status").then((r) => r.json()),
          fetch("/api/postiz/integrations").then((r) => r.json()).catch(() => ({ integrations: [] })),
          fetch("/api/postiz/posts").then((r) => r.json()).catch(() => ({ posts: [] })),
          fetch("/api/n8n/workflows").then((r) => r.json()).catch(() => ({ data: [] })),
          fetch("/api/videos").then((r) => r.json()).catch(() => []),
        ]);

        const allPosts = posts.posts || [];
        const scheduled = allPosts.filter((p: { status: string }) => p.status === "scheduled");
        const published = allPosts.filter((p: { status: string }) => p.status === "published");
        const pending = allPosts.filter((p: { status: string }) => p.status === "draft" || p.status === "pending_review");
        const active = (workflows.data || []).filter((w: { active: boolean }) => w.active);
        const videoList = Array.isArray(videos) ? videos : [];
        const totalVideoCost = videoList.reduce((sum: number, v: any) => sum + (v.cost || 0), 0);

        setData({
          postizConnected: postizStatus.connected ?? false,
          n8nConnected: workflows.data !== undefined,
          scheduledCount: scheduled.length,
          publishedCount: published.length,
          pendingApprovals: pending.length,
          channelCount: integrations.integrations?.length || 0,
          activeAutomations: active.length,
          videoCount: videoList.length,
          videoCost: totalVideoCost,
          recentActivity: allPosts.slice(0, 10).map((p: any) => ({
            id: p.id,
            text: p.content?.substring(0, 60) || "Untitled",
            time: p.date || p.createdAt || "",
            type: p.status,
          })),
        });
      } catch {
        setData({
          postizConnected: false,
          n8nConnected: false,
          scheduledCount: 0,
          publishedCount: 0,
          pendingApprovals: 0,
          channelCount: 0,
          activeAutomations: 0,
          videoCount: 0,
          videoCost: 0,
          recentActivity: [],
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Scheduled Posts", value: data?.scheduledCount ?? 0, icon: Calendar, href: "/calendar", color: "text-blue-500" },
    { label: "Published This Week", value: data?.publishedCount ?? 0, icon: FileText, href: "/posts", color: "text-green-500" },
    { label: "Pending Approvals", value: data?.pendingApprovals ?? 0, icon: CheckCircle2, href: "/approvals", color: "text-orange-500" },
    { label: "Connected Channels", value: data?.channelCount ?? 0, icon: Radio, href: "/channels", color: "text-purple-500" },
    { label: "Active Automations", value: data?.activeAutomations ?? 0, icon: Zap, href: "/automations", color: "text-yellow-500" },
    { label: "Videos Generated", value: data?.videoCount ?? 0, icon: Video, href: "/studio/gallery", color: "text-pink-500" },
    { label: "Video Cost", value: `$${(data?.videoCost ?? 0).toFixed(2)}`, icon: DollarSign, href: "/studio/gallery", color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-muted-foreground">Here&apos;s your social media overview</p>
        </div>
        <div className="flex gap-2">
          <Link href="/studio">
            <Button><Video className="mr-2 h-4 w-4" /> New Video</Button>
          </Link>
          <Link href="/posts/new">
            <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> New Post</Button>
          </Link>
          <Link href="/automations">
            <Button variant="outline"><Zap className="mr-2 h-4 w-4" /> New Automation</Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-3">
        <Badge variant={data?.postizConnected ? "default" : "destructive"}>
          Postiz {data?.postizConnected ? "Connected" : "Disconnected"}
        </Badge>
        <Badge variant={data?.n8nConnected ? "default" : "destructive"}>
          n8n {data?.n8nConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity. Create your first post!</p>
          ) : (
            <div className="space-y-3">
              {data?.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{activity.type}</Badge>
                    <span className="text-sm">{activity.text}</span>
                  </div>
                  {activity.time && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.time).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
