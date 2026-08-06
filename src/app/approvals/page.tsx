"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Clock } from "lucide-react";
import type { PostizPost } from "@/types/postiz";

export default function ApprovalsPage() {
  const [posts, setPosts] = useState<PostizPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const res = await fetch("/api/postiz/posts");
      const data = await res.json();
      const allPosts = (data.posts || []) as PostizPost[];
      setPosts(allPosts.filter((p) => p.status === "draft" || p.status === "pending_review"));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  async function approve(post: PostizPost) {
    await fetch("/api/postiz/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: post.content,
        type: "schedule",
        integrationId: post.integrationId,
        date: new Date(Date.now() + 3600000).toISOString(),
        images: post.images,
      }),
    });
    await fetch("/api/postiz/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id }),
    });
    loadPosts();
  }

  async function reject(post: PostizPost) {
    await fetch("/api/postiz/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id }),
    });
    loadPosts();
  }

  async function approveAll() {
    for (const post of posts) {
      await approve(post);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Approvals</h2>
          <p className="text-muted-foreground">Review and approve pending posts</p>
        </div>
        {posts.length > 0 && (
          <Button onClick={approveAll}>
            <Check className="mr-2 h-4 w-4" /> Approve All
          </Button>
        )}
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Check className="mb-2 h-12 w-12 text-green-500" />
            <p className="text-muted-foreground">All caught up! No posts pending approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{post.integrationType}</Badge>
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" /> {post.status}
                      </Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                    {post.images && post.images.length > 0 && (
                      <p className="text-xs text-muted-foreground">{post.images.length} media attachment(s)</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="default" onClick={() => approve(post)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => reject(post)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
