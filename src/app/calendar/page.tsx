"use client";

import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PostizPost } from "@/types/postiz";

const platformColors: Record<string, string> = {
  x: "#1DA1F2",
  linkedin: "#0A66C2",
  instagram: "#E1306C",
  facebook: "#1877F2",
  threads: "#000000",
  bluesky: "#0085FF",
  mastodon: "#6364FF",
  reddit: "#FF4500",
  discord: "#5865F2",
  youtube: "#FF0000",
  tiktok: "#000000",
  pinterest: "#E60023",
};

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/postiz/posts");
        const data = await res.json();
        const posts = (data.posts || []) as PostizPost[];
        setEvents(
          posts
            .filter((p) => p.date && p.status !== "draft")
            .map((p) => ({
              id: p.id,
              title: p.content?.substring(0, 50) || "Untitled",
              start: p.date,
              backgroundColor: platformColors[p.integrationType] || "#6366FF",
              borderColor: platformColors[p.integrationType] || "#6366FF",
              extendedProps: { post: p },
            }))
        );
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleEventDrop(info: any) {
    const postId = info.event.id;
    const newDate = info.event.start?.toISOString();
    if (!newDate) return;
    try {
      await fetch("/api/postiz/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: info.event.extendedProps.post.content,
          type: "schedule",
          integrationId: info.event.extendedProps.post.integrationId,
          date: newDate,
          images: info.event.extendedProps.post.images,
        }),
      });
      await fetch("/api/postiz/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId }),
      });
    } catch {
      alert("Failed to reschedule post");
      info.revert();
    }
  }

  if (loading) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Calendar</h2>
        <p className="text-muted-foreground">Drag and drop posts to reschedule</p>
      </div>
      <Card className="p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin as any, timeGridPlugin as any, interactionPlugin as any]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          editable={true}
          droppable={true}
          eventDrop={handleEventDrop}
          height={700}
        />
      </Card>
    </div>
  );
}
