
import { db } from "./db";
import { markets, type InsertMarket, type Market } from "@shared/schema";
import { eq, desc, sql, or, isNull, gte } from "drizzle-orm";

export interface IStorage {
  getMarkets(): Promise<Market[]>;
  upsertMarkets(marketsList: InsertMarket[]): Promise<void>;
  deleteOldMarkets(days: number): Promise<void>;
  deleteStaleMarkets(minutes: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getMarkets(): Promise<Market[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db.select()
      .from(markets)
      .where(or(isNull(markets.endDate), gte(markets.endDate, today)))
      .orderBy(desc(markets.totalVolume));
  }

  async upsertMarkets(marketsList: InsertMarket[]): Promise<void> {
    if (marketsList.length === 0) return;

    // Split into chunks to avoid PostgreSQL parameter limit (max 65535 params)
    // 1000 rows * ~10 columns = ~10,000 params, which is safe.
    const CHUNK_SIZE = 1000;
    
    for (let i = 0; i < marketsList.length; i += CHUNK_SIZE) {
      const chunk = marketsList.slice(i, i + CHUNK_SIZE);
      
      await db.insert(markets)
        .values(chunk)
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

  async deleteOldMarkets(days: number): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    await db.delete(markets).where(sql`${markets.lastUpdated} < ${cutoff}`);
  }

  async deleteStaleMarkets(minutes: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - minutes);
    const result = await db.delete(markets)
      .where(sql`${markets.lastUpdated} < ${cutoff}`)
      .returning({ id: markets.id });
    return result.length;
  }
}

export const storage = new DatabaseStorage();
