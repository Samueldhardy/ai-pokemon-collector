import pokemon from "pokemontcgsdk";
// Simple currency conversion function (copied from pokemon-api.ts)
function convertToGBP(amount: number, fromCurrency: 'USD' | 'EUR'): number {
  const USD_TO_GBP = 0.79; // Approximate conversion rate
  const EUR_TO_GBP = 0.85; // Approximate conversion rate
  
  if (fromCurrency === 'USD') {
    return Math.round(amount * USD_TO_GBP * 100) / 100;
  } else if (fromCurrency === 'EUR') {
    return Math.round(amount * EUR_TO_GBP * 100) / 100;
  }
  return amount;
}

// Enhanced interfaces for hybrid data
export interface HybridCardPrice {
  id: string;
  name: string;
  number: string;
  rarity: string;
  setId: string;
  setName: string;
  prices: {
    tcgplayer?: {
      market: number;
      low: number;
      high: number;
    };
    ebay?: {
      market: number;
    };
    cardmarket?: {
      market: number;
      low: number;
      high: number;
    };
    fallback?: {
      market: number;
      source: string;
    };
  };
  imageUrl: string;
  rank?: number;
  hasRealPricing: boolean; // Track if we have real vs fallback pricing
}

// Pokemon TCG API set mappings to our UI (using correct Pokemon TCG API set IDs)
const POKEMON_TCG_SET_MAPPINGS: Record<string, string> = {
  sv1: "sv1",     // Scarlet & Violet Base Set
  sv2: "sv2",     // Paldea Evolved  
  sv3: "sv3",     // Obsidian Flames
  sv4: "sv4",     // Paradox Rift
  sv5: "sv5",     // Temporal Forces
  sv6: "sv6",     // Twilight Masquerade
  sv7: "sv7",     // Stellar Crown
  sv8: "sv8",     // Surging Sparks
  sv9: "sv9",     // Journey Together
  sv10: "sv10",   // Destined Rivals
  "sv-prismatic": "sv8pt5", // Prismatic Evolutions (correct format)
  "sv-black-bolt": "sv10pt5", // Black Bolt (correct format)
  "sv-white-flare": "sv10pt5", // White Flare (same as Black Bolt)
};

// Fallback pricing for popular chase cards (in GBP)
const FALLBACK_CHASE_PRICING: Record<string, Record<string, number>> = {
  sv1: {
    "Charizard ex Special Art Rare": 89.99,
    "Miraidon ex Special Art Rare": 45.99,
    "Koraidon ex Special Art Rare": 42.99,
    "Professor's Research Special Art Rare": 38.99,
    "Nemona Special Art Rare": 35.99,
    "Arven Special Art Rare": 32.99,
    "Charizard ex": 28.99,
    "Miraidon ex": 18.99,
    "Koraidon ex": 16.99,
    "Gardevoir ex": 14.99,
  },
  sv2: {
    "Charizard ex Special Art Rare": 65.99,
    "Chien-Pao ex Special Art Rare": 35.99,
    "Miraidon ex Gold": 45.99,
    "Professor Sada Special Art Rare": 28.99,
    "Professor Turo Special Art Rare": 28.99,
  },
  sv3: {
    "Charizard ex Special Art Rare": 89.99,
    "Ting-Lu ex Special Art Rare": 32.99,
    "Pidgeot ex Special Art Rare": 28.99,
    "Mela Special Art Rare": 25.99,
  },
  // Add more sets as needed
};

// Enhanced rarity priorities for Pokemon TCG API
const CHASE_RARITIES_ENHANCED = [
  "Special Illustration Rare",
  "Hyper Rare", 
  "Special Art Rare",
  "Ultra Rare",
  "Illustration Rare",
  "Double Rare",
  "Rare Holo V",
  "Rare Holo VMAX",
  "Rare Holo VSTAR",
  "Rare Secret",
  "Rare Rainbow",
  "Rare Gold",
];

/**
 * Fetch cards from Pokemon TCG API for a given set
 */
async function fetchPokemonTCGCards(setId: string, limit: number = 50): Promise<any[]> {
  try {
    const mappedSetId = POKEMON_TCG_SET_MAPPINGS[setId];
    if (!mappedSetId) {
      console.error(`Set ID ${setId} not found in mappings`);
      throw new Error(`Set ID ${setId} not supported`);
    }

    console.log(`Fetching cards from Pokemon TCG API for set: ${mappedSetId}`);
    
    // Fetch cards from the set, prioritizing high-rarity cards
    const cards = await pokemon.card.where({
      q: `set.id:${mappedSetId}`,
      pageSize: limit,
      orderBy: "number", // We'll sort by rarity afterwards
    });

    console.log(`Pokemon TCG API returned ${cards.data?.length || 0} cards`);
    
    if (!cards.data || cards.data.length === 0) {
      console.warn(`No cards found for set ${mappedSetId}. Set might not exist or be empty.`);
    }
    
    return cards.data || [];
  } catch (error) {
    console.error("Error fetching from Pokemon TCG API:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Try to fetch pricing from Pokemon Price Tracker API (if quota available)
 */
async function fetchPricingData(pokemonTCGCard: any): Promise<any> {
  const apiKey = process.env.POKEMON_PRICE_TRACKER_API_KEY;
  
  if (!apiKey) {
    console.log("No Pokemon Price Tracker API key - using fallback pricing");
    return null;
  }

  try {
    // Try to match card by name and set
    const response = await fetch(
      `https://www.pokemonpricetracker.com/api/prices?name=${encodeURIComponent(pokemonTCGCard.name)}&setId=${pokemonTCGCard.set.id}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      console.log(`Pokemon Price Tracker API failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const cards = Array.isArray(data) ? data : (data.data || data.cards || []);
    
    return cards.length > 0 ? cards[0] : null;
  } catch (error) {
    console.log("Pokemon Price Tracker API unavailable - using fallback:", error);
    return null;
  }
}

/**
 * Get fallback pricing for a card
 */
function getFallbackPrice(setId: string, cardName: string): number | null {
  const setFallbacks = FALLBACK_CHASE_PRICING[setId];
  if (!setFallbacks) return null;

  // Try exact match first
  if (setFallbacks[cardName]) {
    return setFallbacks[cardName];
  }

  // Try partial matches for cards with variations
  for (const fallbackName in setFallbacks) {
    if (cardName.includes(fallbackName.split(" ")[0]) || 
        fallbackName.includes(cardName.split(" ")[0])) {
      return setFallbacks[fallbackName];
    }
  }

  return null;
}

/**
 * Main function to fetch hybrid chase card data
 */
export async function fetchHybridChaseCards(
  setId: string,
  limit: number = 10
): Promise<HybridCardPrice[]> {
  console.log(`Starting hybrid fetch for set: ${setId}`);

  // Step 1: Get all cards from Pokemon TCG API
  const pokemonTCGCards = await fetchPokemonTCGCards(setId, 100); // Get more cards to filter from
  
  if (pokemonTCGCards.length === 0) {
    console.log("No cards found from Pokemon TCG API");
    return [];
  }

  // Step 2: Filter for chase cards by rarity
  const chaseCards = pokemonTCGCards.filter(card => 
    CHASE_RARITIES_ENHANCED.includes(card.rarity)
  );

  console.log(`Found ${chaseCards.length} potential chase cards from ${pokemonTCGCards.length} total cards`);

  // Step 3: Sort by rarity priority
  const sortedCards = chaseCards.sort((a, b) => {
    const aRarityScore = CHASE_RARITIES_ENHANCED.indexOf(a.rarity);
    const bRarityScore = CHASE_RARITIES_ENHANCED.indexOf(b.rarity);
    return aRarityScore - bRarityScore;
  });

  // Step 4: Process cards with hybrid pricing
  const hybridCards: HybridCardPrice[] = [];
  let priceApiCallsUsed = 0;
  const maxPriceApiCalls = 20; // Conservative limit to preserve daily quota

  for (const card of sortedCards.slice(0, limit * 2)) { // Get extra cards in case some don't have pricing
    if (hybridCards.length >= limit) break;

    let pricingData = null;
    let hasRealPricing = false;

    // Try to get real pricing (if we haven't hit our conservative limit)
    if (priceApiCallsUsed < maxPriceApiCalls) {
      pricingData = await fetchPricingData(card);
      if (pricingData) {
        hasRealPricing = true;
        priceApiCallsUsed++;
        console.log(`Got real pricing for ${card.name} (API calls used: ${priceApiCallsUsed})`);
      }
    }

    // Build pricing object
    const prices: HybridCardPrice['prices'] = {};

    if (hasRealPricing && pricingData) {
      // Use real pricing data (similar to existing logic)
      if (pricingData.tcgplayer) {
        const getTcgPrice = () => {
          const tcg = pricingData.tcgplayer;
          if (tcg.market || tcg.price) return tcg.market || tcg.price;
          if (tcg.prices?.holofoil?.market) return tcg.prices.holofoil.market;
          if (tcg.prices?.normal?.market) return tcg.prices.normal.market;
          return 0;
        };

        prices.tcgplayer = {
          market: convertToGBP(getTcgPrice(), 'USD'),
          low: convertToGBP(pricingData.tcgplayer.low || 0, 'USD'),
          high: convertToGBP(pricingData.tcgplayer.high || 0, 'USD'),
        };
      }
    } else {
      // Use fallback pricing
      const fallbackPrice = getFallbackPrice(setId, card.name);
      if (fallbackPrice) {
        prices.fallback = {
          market: fallbackPrice,
          source: "Curated Market Data"
        };
        console.log(`Using fallback pricing for ${card.name}: £${fallbackPrice}`);
      }
    }

    // Only include cards with some pricing
    const hasAnyPricing = (prices.tcgplayer?.market || 0) > 0 || 
                         (prices.fallback?.market || 0) > 0;

    if (hasAnyPricing) {
      hybridCards.push({
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity,
        setId: card.set.id,
        setName: card.set.name,
        prices,
        imageUrl: card.images.large || card.images.small || "",
        hasRealPricing,
        rank: hybridCards.length + 1,
      });
    }
  }

  // Step 5: Sort by highest price and assign final ranks
  hybridCards.sort((a, b) => {
    const aPrice = a.prices.tcgplayer?.market || a.prices.fallback?.market || 0;
    const bPrice = b.prices.tcgplayer?.market || b.prices.fallback?.market || 0;
    return bPrice - aPrice;
  });

  // Assign final ranks
  hybridCards.forEach((card, index) => {
    card.rank = index + 1;
  });

  console.log(`Hybrid API completed: ${hybridCards.length} cards, ${priceApiCallsUsed} price API calls used`);
  console.log("Cards with real pricing:", hybridCards.filter(c => c.hasRealPricing).length);
  console.log("Cards with fallback pricing:", hybridCards.filter(c => !c.hasRealPricing).length);

  return hybridCards.slice(0, limit);
}