import { Badge } from "@/components/ui/badge";

export function Topbar({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-xs text-foreground-subtle">{description}</p>
        )}
      </div>
      <Badge variant="success">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        All systems operational
      </Badge>
    </header>
  );
}
