import { useState, useMemo } from "react";
import { useMarkets, formatCurrency } from "@/hooks/use-markets";
import { StatsCard } from "@/components/StatsCard";
import { VolumeChart } from "@/components/VolumeChart";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Search, 
  RefreshCw,
  ExternalLink,
  CalendarDays,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

type SortColumn = "totalVolume" | "volume24h" | "endDate";
type SortDirection = "asc" | "desc";

export default function Home() {
  const { data: markets = [], isLoading, isRefetching, refetch } = useMarkets();
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("totalVolume");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Derived Statistics
  const totalVolume = markets.reduce((acc, m) => acc + parseFloat(m.totalVolume || "0"), 0);
  const volume24h = markets.reduce((acc, m) => acc + parseFloat(m.volume24h || "0"), 0);
  const activeMarkets = markets.length;

  // Handle column sort click
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Get sort icon for column
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  // Filter & Sort
  const filteredMarkets = useMemo(() => {
    const filtered = markets.filter(m => 
      m.question.toLowerCase().includes(search.toLowerCase())
    );
    
    return [...filtered].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      if (sortColumn === "totalVolume") {
        aVal = parseFloat(a.totalVolume || "0");
        bVal = parseFloat(b.totalVolume || "0");
      } else if (sortColumn === "volume24h") {
        aVal = parseFloat(a.volume24h || "0");
        bVal = parseFloat(b.volume24h || "0");
      } else {
        const aDate = a.endDate ? new Date(a.endDate).getTime() : null;
        const bDate = b.endDate ? new Date(b.endDate).getTime() : null;
        
        if (aDate === null && bDate === null) return 0;
        if (aDate === null) return 1;
        if (bDate === null) return -1;
        
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      }

      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [markets, search, sortColumn, sortDirection]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header with Blur Effect */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight">
              Omni<span className="text-primary">Market</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden md:block">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Live Updates
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isRefetching}
              className="bg-card/50 border-white/10 hover:bg-white/5"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard 
            title="Total Volume" 
            value={formatCurrency(totalVolume)} 
            icon={BarChart3}
            color="text-primary"
            delay={0.1}
          />
          <StatsCard 
            title="24h Volume" 
            value={formatCurrency(volume24h)} 
            icon={Activity}
            color="text-emerald-400"
            delay={0.2}
          />
          <StatsCard 
            title="Active Markets" 
            value={activeMarkets.toString()} 
            icon={TrendingUp}
            color="text-purple-400"
            delay={0.3}
          />
        </div>

        {/* Charts Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card rounded-2xl p-6 border-white/5"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            Volume Distribution
          </h2>
          {isLoading ? (
            <div className="h-[300px] w-full flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
            </div>
          ) : (
            <VolumeChart markets={markets} />
          )}
        </motion.div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 z-40 bg-background/95 backdrop-blur py-4 border-b border-border/50">
          <h2 className="text-2xl font-bold font-display">Top Markets</h2>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search markets..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-10 rounded-xl"
            />
          </div>
        </div>

        {/* Markets Table */}
        <div className="glass-card rounded-2xl overflow-hidden border-white/5 min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider w-16 text-center">#</th>
                  <th className="p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider w-32">Platform</th>
                  <th className="p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Market Question</th>
                  <th className="p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider text-right">
                    <button 
                      onClick={() => handleSort("totalVolume")}
                      className="inline-flex items-center hover:text-foreground transition-colors cursor-pointer"
                      data-testid="sort-total-volume"
                    >
                      Total Vol
                      {getSortIcon("totalVolume")}
                    </button>
                  </th>
                  <th className="p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider text-right">
                    <button 
                      onClick={() => handleSort("volume24h")}
                      className="inline-flex items-center hover:text-foreground transition-colors cursor-pointer"
                      data-testid="sort-24h-volume"
                    >
                      24h Vol
                      {getSortIcon("volume24h")}
                    </button>
                  </th>
                  <th className="p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider text-right">
                    <button 
                      onClick={() => handleSort("endDate")}
                      className="inline-flex items-center hover:text-foreground transition-colors cursor-pointer"
                      data-testid="sort-end-date"
                    >
                      End Date
                      {getSortIcon("endDate")}
                    </button>
                  </th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  // Loading Skeletons
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-4"><div className="h-4 w-8 bg-white/5 rounded mx-auto" /></td>
                      <td className="p-4"><div className="h-6 w-20 bg-white/5 rounded" /></td>
                      <td className="p-4"><div className="h-4 w-64 bg-white/5 rounded" /></td>
                      <td className="p-4"><div className="h-4 w-24 bg-white/5 rounded ml-auto" /></td>
                      <td className="p-4"><div className="h-4 w-20 bg-white/5 rounded ml-auto" /></td>
                      <td className="p-4"><div className="h-4 w-24 bg-white/5 rounded ml-auto" /></td>
                      <td className="p-4"></td>
                    </tr>
                  ))
                ) : filteredMarkets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      No markets found matching your search.
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {filteredMarkets.map((market, idx) => (
                      <motion.tr 
                        key={market.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-4 text-center font-mono text-muted-foreground text-sm">
                          {idx + 1}
                        </td>
                        <td className="p-4">
                          <PlatformBadge platform={market.platform} />
                        </td>
                        <td className="p-4">
                          <a 
                            href={market.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 md:line-clamp-1 group-hover:underline decoration-primary/50 underline-offset-4"
                          >
                            {market.question}
                          </a>
                        </td>
                        <td className="p-4 text-right font-mono font-medium">
                          {formatCurrency(market.totalVolume)}
                        </td>
                        <td className="p-4 text-right font-mono text-muted-foreground">
                          {formatCurrency(Number(market.volume24h))}
                        </td>
                        <td className="p-4 text-right text-sm text-muted-foreground">
                          {market.endDate ? format(new Date(market.endDate), "MMM d, yyyy") : "-"}
                        </td>
                        <td className="p-4 text-right">
                          <a 
                            href={market.url}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="inline-flex p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="text-center text-sm text-muted-foreground pt-12">
          <p>© {new Date().getFullYear()} OmniMarket Dashboard. Aggregating the future.</p>
        </footer>
      </main>
    </div>
  );
}
