
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { type InsertMarket } from "@shared/schema";

// Helper to fetch Polymarket data
async function fetchPolymarket(): Promise<InsertMarket[]> {
  try {
    const response = await fetch("https://gamma-api.polymarket.com/markets?limit=50&sort=volume&order=desc");
    if (!response.ok) return [];
    const data = await response.json();
    
    return data.map((m: any): InsertMarket => ({
      externalId: m.id,
      platform: 'polymarket',
      question: m.question,
      url: `https://polymarket.com/event/${m.slug}`,
      totalVolume: m.volume?.toString() || "0",
      volume24h: m.volume_24h?.toString() || "0",
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
    // Fetching public markets
    const response = await fetch("https://api.elections.kalshi.com/trade-api/v2/markets?limit=50&status=open");
    if (!response.ok) return [];
    const data = await response.json();
    
    return (data.markets || []).map((m: any): InsertMarket => ({
      externalId: m.ticker,
      platform: 'kalshi',
      question: m.title,
      url: `https://kalshi.com/markets/${m.ticker}`,
      totalVolume: (m.volume || 0).toString(), // Kalshi volume is usually contracts, not USD directly in some endpoints, but we'll use it as is for MVP
      volume24h: (m.recent_volume || 0).toString(), // This might need adjustment based on actual API response structure
      startDate: m.open_date ? new Date(m.open_date) : null,
      endDate: m.close_date ? new Date(m.close_date) : null,
      resolutionRules: m.rules_primary || "",
    }));
  } catch (error) {
    console.error("Error fetching Kalshi:", error);
    return [];
  }
}

// Mock/Stub for Limitless (since API might need complex auth or specific headers)
async function fetchLimitless(): Promise<InsertMarket[]> {
    // In a real scenario, we would hit the API. 
    // For MVP/Demo purposes if we can't easily access it without a wallet signature:
    return [];
}

async function refreshAllMarkets() {
  const [poly, kalshi, limitless] = await Promise.all([
    fetchPolymarket(),
    fetchKalshi(),
    fetchLimitless()
  ]);
  
  const allMarkets = [...poly, ...kalshi, ...limitless];
  console.log(`Fetched ${allMarkets.length} markets`);
  await storage.upsertMarkets(allMarkets);
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
