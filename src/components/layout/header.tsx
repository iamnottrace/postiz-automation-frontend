"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/studio": "Video Studio",
  "/characters": "Characters",
  "/posts": "Posts",
  "/calendar": "Calendar",
  "/automations": "Automations",
  "/analytics": "Analytics",
  "/approvals": "Approvals",
  "/channels": "Channels",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const title = titles[pathname] || titles[`/${pathname.split("/")[1]}`] || "Postiz Control";

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="h-9 w-64 pl-8" />
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
