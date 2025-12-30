
import { db } from "./db";
import { markets, type InsertMarket, type Market } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getMarkets(): Promise<Market[]>;
  upsertMarkets(marketsList: InsertMarket[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getMarkets(): Promise<Market[]> {
    return await db.select().from(markets).orderBy(desc(markets.totalVolume));
  }

  async upsertMarkets(marketsList: InsertMarket[]): Promise<void> {
    for (const market of marketsList) {
      // Very basic upsert logic for now to keep it simple
      const existing = await db.select().from(markets).where(eq(markets.externalId, market.externalId));
      if (existing.length > 0) {
        await db.update(markets)
          .set({
            totalVolume: market.totalVolume,
            volume24h: market.volume24h,
            lastUpdated: new Date(),
            // Update other fields if dynamic
            question: market.question, 
            endDate: market.endDate
          })
          .where(eq(markets.id, existing[0].id));
      } else {
        await db.insert(markets).values(market);
      }
    }
  }
}

export const storage = new DatabaseStorage();
