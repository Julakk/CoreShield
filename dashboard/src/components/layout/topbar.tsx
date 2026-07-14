"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Topbar({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const router = useRouter();

  function handleLogout() {
    window.localStorage.removeItem("coreshield_token");
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-xs text-foreground-subtle">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          All systems operational
        </Badge>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
