# OmniMarket - Prediction Market Aggregator

## Overview

OmniMarket is a prediction market aggregator that pulls data from multiple platforms (Polymarket, Kalshi, and potentially others) and displays them in a unified dashboard. The application fetches market data periodically, stores it in a PostgreSQL database, and presents real-time statistics including total volume, 24-hour volume, and active market counts with data visualization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management with automatic refetching every 30 seconds
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration and CSS variables for theming
- **Animations**: Framer Motion for smooth list and component animations
- **Data Visualization**: Recharts for volume charts and bar graphs
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Module System**: ES Modules (`"type": "module"` in package.json)
- **API Design**: Simple REST API with a single `/api/markets` endpoint
- **Data Fetching**: Periodic background fetching from external prediction market APIs (Polymarket, Kalshi)
- **Static File Serving**: Production builds serve the Vite-built frontend from `dist/public`

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains the markets table definition
- **Key Fields**: externalId (unique), platform, question, url, totalVolume, volume24h, dates
- **Upsert Strategy**: Uses `onConflictDoUpdate` on externalId for efficient market updates
- **Indexes**: Optimized queries with indexes on `endDate`, `totalVolume`, and `lastUpdated` columns

### Build System
- **Development**: `tsx` for running TypeScript directly
- **Production Build**: Custom build script using esbuild for server bundling and Vite for client
- **Output**: Server bundles to `dist/index.cjs`, client builds to `dist/public`

### API Integration Patterns
- Polymarket: Fetches from `gamma-api.polymarket.com/markets` with active/open filters
- Kalshi: Fetches from `api.elections.kalshi.com/trade-api/v2/markets` with open status filter
- Both APIs use configurable limits defined in `server/constants.ts`

### Data Maintenance
- **Stale Market Cleanup**: Markets not seen in API responses for 24 hours are automatically removed from the database
- **Cleanup Threshold**: Configurable via `STALE_MARKET_THRESHOLD_MINUTES` in `server/constants.ts`
- **Safety**: The 24-hour threshold is intentionally long to tolerate temporary API hiccups or outages
- **Expired Market Filtering**: Markets with end dates in the past are filtered out at query time

### Frontend Features
- **Column Sorting**: Clickable headers for Total Vol, 24h Vol, and End Date columns
  - Descending only (largest values first)
  - Markets with no end date appear at bottom when sorting by End Date
  - Arrow icon shows which column is currently active
- **Search**: Real-time filtering by market question text
- **Data Quality**: Safe parsing for numeric and date values from external APIs

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **Drizzle Kit**: Database migrations and schema pushing (`npm run db:push`)

### External APIs
- **Polymarket API**: `https://gamma-api.polymarket.com/markets` - Prediction market data
- **Kalshi API**: `https://api.elections.kalshi.com/trade-api/v2/markets` - Prediction market data

### Key Runtime Dependencies
- `express`: Web server framework
- `drizzle-orm` + `pg`: Database connectivity
- `@tanstack/react-query`: Client-side data fetching and caching
- `recharts`: Data visualization charts
- `framer-motion`: Animation library
- `date-fns`: Date formatting utilities
- Shadcn/ui components (Radix UI based)

### Development Tools
- `tsx`: TypeScript execution for development
- `vite`: Frontend build tool with HMR
- `esbuild`: Server bundling for production
- `drizzle-kit`: Database schema management