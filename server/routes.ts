
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { type InsertMarket } from "@shared/schema";

// Helper to fetch Polymarket data
async function fetchPolymarket(): Promise<InsertMarket[]> {
  try {
    // Using Gamma API to get high volume markets
    // Note: Polymarket Gamma API often returns an array of markets directly.
    const response = await fetch("https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=100");
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
async function fetchKalshi(): Promise<InsertMarket[]> {
  try {
    const response = await fetch("https://api.elections.kalshi.com/trade-api/v2/markets?limit=50&status=open");
    if (!response.ok) {
      console.error(`Kalshi API error: ${response.status} ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    
    return (data.markets || []).map((m: any): InsertMarket => ({
      externalId: m.ticker,
      platform: 'kalshi',
      question: m.title,
      url: `https://kalshi.com/markets/${m.ticker}`,
      totalVolume: (m.volume || 0).toString(),
      volume24h: (m.recent_volume || 0).toString(),
      startDate: m.open_date ? new Date(m.open_date) : null,
      endDate: m.close_date ? new Date(m.close_date) : null,
      resolutionRules: m.rules_primary || "",
    }));
  } catch (error) {
    console.error("Error fetching Kalshi:", error);
    return [];
  }
}

async function refreshAllMarkets() {
  console.log("Starting market refresh...");
  const [poly, kalshi] = await Promise.all([
    fetchPolymarket(),
    fetchKalshi()
  ]);
  
  console.log(`Fetched from Poly: ${poly.length}, Kalshi: ${kalshi.length}`);
  const allMarkets = [...poly, ...kalshi];
  
  if (allMarkets.length > 0) {
    await storage.upsertMarkets(allMarkets);
    console.log(`Successfully upserted ${allMarkets.length} total markets`);
  } else {
    console.warn("No markets fetched from any source");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Initial fetch on startup
  refreshAllMarkets().catch(console.error);

  // Poll every minute
  setInterval(() => refreshAllMarkets().catch(console.error), 60 * 1000);

  app.get(api.markets.list.path, async (req, res) => {
    const markets = await storage.getMarkets();
    res.json(markets);
  });

  app.post("/api/markets/refresh", async (req, res) => {
    await refreshAllMarkets();
    const markets = await storage.getMarkets();
    res.json(markets);
  });

  return httpServer;
}
