
import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull(),
  platform: text("platform").notNull(), // 'polymarket', 'kalshi', 'limitless', 'opinion', 'myriad'
  question: text("question").notNull(),
  url: text("url").notNull(),
  totalVolume: numeric("total_volume").notNull(),
  volume24h: numeric("volume_24h"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  resolutionRules: text("resolution_rules"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertMarketSchema = createInsertSchema(markets).omit({ 
  id: true, 
  lastUpdated: true 
});

export type Market = typeof markets.$inferSelect;
export type InsertMarket = z.infer<typeof insertMarketSchema>;

export type MarketResponse = Market;
