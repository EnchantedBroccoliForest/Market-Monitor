
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { type InsertMarket } from "@shared/schema";
import { REFRESH_INTERVAL_MS, POLYMARKET_API_LIMIT, KALSHI_API_LIMIT } from "./constants";

// Helper to fetch Polymarket data
export async function fetchPolymarket(): Promise<InsertMarket[]> {
  try {
    const response = await fetch(`https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=${POLYMARKET_API_LIMIT}`);
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
      .map((m: any): InsertMarket => ({
        externalId: m.id || m.ticker || Math.random().toString(),
        platform: 'polymarket',
        question: m.question || m.title || "Untitled Market",
        url: m.slug ? `https://polymarket.com/event/${m.slug}` : "https://polymarket.com",
        totalVolume: (m.volume || 0).toString(),
        volume24h: (m.volume24h || m.volume_24h || 0).toString(),
        startDate: m.startDate ? new Date(m.startDate) : null,
        endDate: m.endDate ? new Date(m.endDate) : null,
        resolutionRules: m.description || "",
      }));
  } catch (error) {
    console.error("Error fetching Polymarket:", error);
    return [];
  }
}

// Helper to fetch Kalshi data
export async function fetchKalshi(): Promise<InsertMarket[]> {
  try {
    // Kalshi's V2 public market list
    // Use the elections subdomain as it's often more up-to-date for general markets as well
    const response = await fetch(`https://api.elections.kalshi.com/trade-api/v2/markets?limit=${KALSHI_API_LIMIT}&status=open`);
    if (!response.ok) {
      console.error(`Kalshi API error: ${response.status} ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    
    const markets = data.markets || [];
    console.log(`Kalshi raw count: ${markets.length}`);

    return markets.map((m: any): InsertMarket => {
      // Kalshi volume is in contract units.
      // We will treat it as a volume indicator.
      const vol = m.volume || 0;
      const recentVol = m.recent_volume || 0;
      
      return {
        externalId: m.ticker,
        platform: 'kalshi',
        question: m.title || m.ticker,
        url: `https://kalshi.com/markets/${m.ticker}`,
        totalVolume: vol.toString(),
        volume24h: recentVol.toString(),
        startDate: m.open_date ? new Date(m.open_date) : null,
        endDate: m.close_date ? new Date(m.close_date) : null,
        resolutionRules: m.rules_primary || m.subtitle || "",
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
