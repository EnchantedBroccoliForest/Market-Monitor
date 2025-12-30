
import { z } from "zod";
import { markets } from "./schema";

export const api = {
  markets: {
    list: {
      method: "GET" as const,
      path: "/api/markets",
      responses: {
        200: z.array(z.custom<typeof markets.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
