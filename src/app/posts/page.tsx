"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit } from "lucide-react";
import type { PostizPost } from "@/types/postiz";

export default function PostsPage() {
  const [posts, setPosts] = useState<PostizPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const res = await fetch("/api/postiz/posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    await fetch("/api/postiz/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadPosts();
  }

  const filtered = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const statusColors: Record<string, string> = {
    draft: "secondary",
    scheduled: "default",
    published: "default",
    failed: "destructive",
    pending_review: "outline",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Posts</h2>
          <p className="text-muted-foreground">Create and manage your social media posts</p>
        </div>
        <Link href="/posts/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Post</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {["all", "draft", "scheduled", "published", "failed"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="mb-4 text-muted-foreground">No posts found.</p>
            <Link href="/posts/new">
              <Button>Create your first post</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColors[post.status] as "default" | "secondary" | "destructive" | "outline"}>
                      {post.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{post.integrationType}</span>
                    {post.date && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.date).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2">{post.content}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deletePost(post.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
