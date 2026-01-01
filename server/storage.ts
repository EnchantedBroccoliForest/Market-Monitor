
import { db } from "./db";
import { markets, type InsertMarket, type Market } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getMarkets(): Promise<Market[]>;
  upsertMarkets(marketsList: InsertMarket[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getMarkets(): Promise<Market[]> {
    return await db.select().from(markets).orderBy(desc(markets.totalVolume));
  }

  async upsertMarkets(marketsList: InsertMarket[]): Promise<void> {
    if (marketsList.length === 0) return;

    await db.insert(markets)
      .values(marketsList)
      .onConflictDoUpdate({
        target: markets.externalId,
        set: {
          totalVolume: sql`EXCLUDED.total_volume`,
          volume24h: sql`EXCLUDED.volume_24h`,
          lastUpdated: new Date(),
          question: sql`EXCLUDED.question`,
          endDate: sql`EXCLUDED.end_date`
        }
      });
  }
}

export const storage = new DatabaseStorage();
