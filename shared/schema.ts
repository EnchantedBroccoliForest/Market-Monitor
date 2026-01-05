
import { pgTable, text, serial, timestamp, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  platform: text("platform").notNull(),
  question: text("question").notNull(),
  url: text("url").notNull(),
  totalVolume: numeric("total_volume").notNull(),
  volume24h: numeric("volume_24h"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  resolutionRules: text("resolution_rules"),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => [
  index("idx_markets_end_date").on(table.endDate),
  index("idx_markets_total_volume").on(table.totalVolume),
  index("idx_markets_last_updated").on(table.lastUpdated),
]);

export const insertMarketSchema = createInsertSchema(markets).omit({ 
  id: true, 
  lastUpdated: true 
});

export type Market = typeof markets.$inferSelect;
export type InsertMarket = z.infer<typeof insertMarketSchema>;

export type MarketResponse = Market;
