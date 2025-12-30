import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type MarketResponse } from "@shared/schema";

export function useMarkets() {
  return useQuery({
    queryKey: [api.markets.list.path],
    queryFn: async () => {
      const res = await fetch(api.markets.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch markets");
      return api.markets.list.responses[200].parse(await res.json());
    },
    refetchInterval: 30000, // Refresh every 30 seconds for "real-time" feel
  });
}

// Helper to format currency
export function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "$0.00";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}
