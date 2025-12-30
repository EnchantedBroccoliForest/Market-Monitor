import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  delay?: number;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp,
  color = "text-primary",
  delay = 0 
}: StatsCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="glass-card rounded-2xl p-6 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
        <Icon className={cn("w-24 h-24 -mr-4 -mt-4", color)} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm border border-white/5", color)}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
        </div>
        
        <div className="mt-4">
          <div className="text-3xl font-bold font-display tracking-tight text-foreground">
            {value}
          </div>
          {trend && (
            <div className={cn(
              "text-sm mt-1 font-medium flex items-center gap-1",
              trendUp ? "text-green-400" : "text-red-400"
            )}>
              <span>{trendUp ? "↑" : "↓"}</span>
              {trend}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
