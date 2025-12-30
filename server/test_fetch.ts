
import { fetchKalshi, fetchPolymarket } from "./routes";

async function runTests() {
  console.log("--- TESTING KALSHI FETCH ---");
  try {
    const kalshiMarkets = await fetchKalshi();
    console.log(`Kalshi Markets Found: ${kalshiMarkets.length}`);
    if (kalshiMarkets.length > 0) {
      console.log("Sample Kalshi Market:", JSON.stringify(kalshiMarkets[0], null, 2));
    } else {
      console.log("No Kalshi markets returned. Check URL or API status.");
    }
  } catch (e) {
    console.error("Kalshi Test Error:", e);
  }

  console.log("\n--- TESTING POLYMARKET FETCH ---");
  try {
    const polyMarkets = await fetchPolymarket();
    console.log(`Polymarket Markets Found: ${polyMarkets.length}`);
    if (polyMarkets.length > 0) {
      console.log("Sample Polymarket Market:", JSON.stringify(polyMarkets[0], null, 2));
    } else {
      console.log("No Polymarket markets returned.");
    }
  } catch (e) {
    console.error("Polymarket Test Error:", e);
  }
}

runTests();
