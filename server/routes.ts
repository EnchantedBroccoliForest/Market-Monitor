
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { type InsertMarket } from "@shared/schema";
import { REFRESH_INTERVAL_MS, POLYMARKET_API_LIMIT, KALSHI_API_LIMIT, STALE_MARKET_THRESHOLD_MINUTES, REQUEST_TIMEOUT_MS } from "./constants";

// Helper to create a fetch with timeout
function fetchWithTimeout(url: string, timeoutMs: number = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

// Helper to safely parse numeric values (preserves negatives for potential delta values)
function safeParseNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) || !isFinite(num) ? 0 : num;
}

// Helper to safely parse dates
function safeParseDate(value: any): Date | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// Helper to fetch Polymarket data
export async function fetchPolymarket(): Promise<InsertMarket[]> {
  try {
    const response = await fetchWithTimeout(`https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=${POLYMARKET_API_LIMIT}`);
    if (!response.ok) {
      console.error(`Polymarket API error: ${response.status} ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error("Polymarket API returned unexpected format (not an array)");
      return [];
    }

    return data
      .filter((m: any) => m.active && !m.closed)
      .filter((m: any) => m.id || m.ticker)
      .map((m: any): InsertMarket => ({
        externalId: m.id || m.ticker,
        platform: 'polymarket',
        question: (m.question || m.title || "Untitled Market").trim().slice(0, 500),
        url: m.slug ? `https://polymarket.com/event/${m.slug}` : "https://polymarket.com",
        totalVolume: safeParseNumber(m.volume).toString(),
        volume24h: safeParseNumber(m.volume24hr || m.volume_24h || m['24hr_volume']).toString(),
        startDate: safeParseDate(m.startDate),
        endDate: safeParseDate(m.endDate),
        resolutionRules: (m.description || "").slice(0, 2000),
      }));
  } catch (error) {
    console.error("Error fetching Polymarket:", error);
    return [];
  }
}

// Helper to fetch Kalshi data
export async function fetchKalshi(): Promise<InsertMarket[]> {
  try {
    const response = await fetchWithTimeout(`https://api.elections.kalshi.com/trade-api/v2/markets?limit=${KALSHI_API_LIMIT}&status=open`);
    if (!response.ok) {
      console.error(`Kalshi API error: ${response.status} ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    
    const markets = data.markets || [];
    console.log(`Kalshi raw count: ${markets.length}`);

    return markets
      .filter((m: any) => m.ticker)
      .map((m: any): InsertMarket => {
        const vol = safeParseNumber(m.volume);
        const recentVol = safeParseNumber(m.recent_volume || m.last_24h_volume || m.volume_24h);
        
        return {
          externalId: m.ticker,
          platform: 'kalshi',
          question: (m.title || m.ticker || "Untitled Market").trim().slice(0, 500),
          url: `https://kalshi.com/markets/${m.ticker}`,
          totalVolume: vol.toString(),
          volume24h: recentVol.toString(),
          startDate: safeParseDate(m.open_date),
          endDate: safeParseDate(m.close_date),
          resolutionRules: (m.rules_primary || m.subtitle || "").slice(0, 2000),
        };
      });
  } catch (error) {
    console.error("Error fetching Kalshi:", error);
    return [];
  }
}

async function refreshAllMarkets() {
  console.log("Starting market refresh...");
  try {
    const [poly, kalshi] = await Promise.all([
      fetchPolymarket().catch(e => { console.error("Poly fetch failed", e); return []; }),
      fetchKalshi().catch(e => { console.error("Kalshi fetch failed", e); return []; })
    ]);
    
    console.log(`Fetched from Poly: ${poly.length}, Kalshi: ${kalshi.length}`);
    const allMarkets = [...poly, ...kalshi];
    
    if (allMarkets.length > 0) {
      await storage.upsertMarkets(allMarkets);
      console.log(`Successfully upserted ${allMarkets.length} total markets`);
      
      // Clean up stale markets that haven't been seen in recent refreshes
      const removedCount = await storage.deleteStaleMarkets(STALE_MARKET_THRESHOLD_MINUTES);
      if (removedCount > 0) {
        console.log(`Removed ${removedCount} stale markets not seen in the last ${STALE_MARKET_THRESHOLD_MINUTES} minutes`);
      }
    } else {
      console.warn("No markets fetched from any source");
    }
  } catch (error) {
    console.error("Global refresh error:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  refreshAllMarkets().catch(console.error);
  setInterval(() => refreshAllMarkets().catch(console.error), REFRESH_INTERVAL_MS);

  app.get(api.markets.list.path, async (req, res) => {
    try {
      const markets = await storage.getMarkets();
      res.json(markets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });

  app.post("/api/markets/refresh", async (req, res) => {
    try {
      await refreshAllMarkets();
      const markets = await storage.getMarkets();
      res.json(markets);
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh markets" });
    }
  });

  return httpServer;
}
