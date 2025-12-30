import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: string;
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const getStyles = (p: string) => {
    switch (p.toLowerCase()) {
      case 'polymarket':
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case 'kalshi':
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case 'limitless':
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case 'opinion':
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case 'myriad':
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wide",
      getStyles(platform)
    )}>
      {platform}
    </span>
  );
}
