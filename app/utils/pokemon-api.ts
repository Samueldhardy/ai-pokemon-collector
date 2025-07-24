export interface CardPrice {
  id: string;
  name: string;
  number: string;
  rarity: string;
  setId: string;
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
  };
  imageUrl?: string;
  rank?: number;
}

interface PokemonSet {
  id: string;
  name: string;
  releaseDate: string;
  totalCards: number;
}

// API Response types
interface ApiCardImages {
  small?: string;
  large?: string;
}

interface ApiPriceData {
  price?: number;
  market?: number;
  low?: number;
  high?: number;
  // TCGPlayer nested structure
  prices?: {
    normal?: { market?: number; low?: number; high?: number; mid?: number };
    holofoil?: { market?: number; low?: number; high?: number; mid?: number };
    reverseHolofoil?: {
      market?: number;
      low?: number;
      high?: number;
      mid?: number;
    };
    [key: string]:
      | { market?: number; low?: number; high?: number; mid?: number }
      | undefined;
  };
  url?: string;
  updatedAt?: string;
  // eBay specific fields
  salesByGrade?: Record<string, unknown>;
  salesVelocity?: Record<string, unknown>;
  timePeriods?: Record<string, unknown>;
}

interface ApiSetData {
  id?: string;
  name?: string;
}

interface ApiCardData {
  images: ApiCardImages;
  _id: string;
  id: string;
  name: string;
  number: string;
  rarity: string;
  cardmarket: ApiPriceData;
  tcgplayer: ApiPriceData;
  set: ApiSetData;
  ebay: ApiPriceData;
  lastUpdated: string;
}

// API Response wrapper type (currently unused but may be needed for future API changes)
// interface ApiResponse {
//   data: ApiCardData[];
// }

const API_BASE_URL = "https://www.pokemonpricetracker.com/api";

// Simple currency conversion - you could replace this with a live API
const USD_TO_GBP = 0.79; // Approximate conversion rate
const EUR_TO_GBP = 0.85; // Approximate conversion rate

function convertToGBP(amount: number, fromCurrency: "USD" | "EUR"): number {
  if (fromCurrency === "USD") {
    return Math.round(amount * USD_TO_GBP * 100) / 100;
  } else if (fromCurrency === "EUR") {
    return Math.round(amount * EUR_TO_GBP * 100) / 100;
  }
  return amount;
}

// Get the card number ranges that typically contain chase cards for each set
// Currently unused but may be useful for future filtering enhancements
// function getChaseCardNumbers(setId: string): string[] {
//   const chaseRanges: Record<string, string[]> = {
//     // SV1 base set: Secret rares and special arts are typically 180+
//     sv1: [
//       "190", "191", "192", "193", "194", "195", "196", "197", "198", "199",
//       "200", "201", "202", "203", "204", "205",
//     ],
//     // For other sets, we'll use similar high-number ranges
//     sv2: ["190", "200", "210", "220", "230", "240", "250", "260"],
//     sv3: ["190", "200", "210", "220", "230", "240"],
//     sv4: ["190", "200", "210", "220", "230", "240"],
//     sv5: ["190", "200", "210", "220", "230"],
//     sv6: ["190", "200", "210", "220", "230"],
//     sv7: ["190", "200", "210", "220", "230"],
//     sv8: ["190", "200", "210", "220", "230"],
//     sv9: ["190", "200", "210", "220", "230"],
//     sv10: ["190", "200", "210", "220", "230"],
//     "sv-prismatic": ["190", "200", "210", "220"],
//     "sv-black-bolt": ["150", "160", "170", "180"],
//     "sv-white-flare": ["150", "160", "170", "180"],
//   };
//   return chaseRanges[setId] || ["190", "200", "210", "220", "230"];
// }

// Set mappings from our UI to Pokemon Price Tracker API set IDs
const SET_ID_MAPPINGS: Record<string, string> = {
  sv1: "sv1", // Scarlet & Violet Base Set
  sv2: "sv2", // Paldea Evolved
  sv3: "sv3", // Obsidian Flames
  sv4: "sv4", // Paradox Rift
  sv5: "sv5", // Temporal Forces
  sv6: "sv6", // Twilight Masquerade
  sv7: "sv7", // Stellar Crown
  sv8: "sv8", // Surging Sparks
  sv9: "sv9", // Journey Together
  sv10: "sv10", // Destined Rivals
  "sv-prismatic": "sv-prismatic", // Prismatic Evolutions
  "sv-black-bolt": "sv-black-bolt", // Black Bolt
  "sv-white-flare": "sv-white-flare", // White Flare
};

export async function fetchTopChaseCards(
  setId: string,
  limit: number = 10,
): Promise<CardPrice[]> {
  const apiKey = process.env.POKEMON_PRICE_TRACKER_API_KEY;

  if (!apiKey) {
    throw new Error("Pokemon Price Tracker API key not configured");
  }

  const mappedSetId = SET_ID_MAPPINGS[setId];

  console.log("Fetching chase cards for set:", mappedSetId);

  if (!mappedSetId) {
    throw new Error(`Set ID ${setId} not supported`);
  }

  try {
    // Since the API doesn't sort by price server-side but we're limited to 50 cards,
    // let's at least filter client-side to prioritize high-rarity cards
    console.log("Requesting cards and filtering for chase cards...");

    const response = await fetch(
      `${API_BASE_URL}/prices?setId=${mappedSetId}&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as
      | ApiCardData[]
      | { data?: ApiCardData[]; cards?: ApiCardData[] };
    console.log("API Response structure:", JSON.stringify(data, null, 2)); // Debug log

    // Handle different response formats - be more flexible
    let cards: ApiCardData[] = [];
    if (Array.isArray(data)) {
      cards = data;
    } else if (data.data && Array.isArray(data.data)) {
      cards = data.data;
    } else if (data.cards && Array.isArray(data.cards)) {
      cards = data.cards;
    } else {
      console.error("Unexpected API response format:", data);
      throw new Error("Unexpected API response format");
    }

    console.log("Total cards from API:", cards.length); // Debug log

    // First, prioritize cards by rarity (chase cards are typically high rarity)
    const chaseRarities = [
      "Special Illustration Rare",
      "Hyper Rare",
      "Special Art Rare",
      "Ultra Rare",
      "Illustration Rare",
    ];

    const prioritizedCards = cards.sort((a: ApiCardData, b: ApiCardData) => {
      const aRarityScore =
        chaseRarities.indexOf(a.rarity) !== -1
          ? chaseRarities.indexOf(a.rarity)
          : 999;
      const bRarityScore =
        chaseRarities.indexOf(b.rarity) !== -1
          ? chaseRarities.indexOf(b.rarity)
          : 999;
      return aRarityScore - bRarityScore;
    });

    console.log(
      "Prioritized by rarity. Top 10 cards:",
      prioritizedCards
        .slice(0, 10)
        .map((c) => ({ name: c.name, rarity: c.rarity })),
    );

    // Filter and sort by highest market price
    const sortedCards = prioritizedCards
      .filter((card: ApiCardData) => {
        // Handle nested price structure - be very flexible
        const getTcgPrice = () => {
          const tcg = card.tcgplayer;
          if (!tcg) return 0;

          // Try direct market/price first
          if (tcg.market || tcg.price) return tcg.market || tcg.price;

          // Try nested prices structure
          if (tcg.prices) {
            const prices = tcg.prices;
            if (prices.holofoil?.market) return prices.holofoil.market;
            if (prices.normal?.market) return prices.normal.market;
            if (prices.reverseHolofoil?.market)
              return prices.reverseHolofoil.market;
            if (prices.holofoil?.mid) return prices.holofoil.mid;
            if (prices.normal?.mid) return prices.normal.mid;
          }

          return 0;
        };

        const getEbayPrice = () => {
          const ebay = card.ebay;
          if (!ebay) return 0;

          // Try direct market/price first
          if (ebay.market || ebay.price) return ebay.market || ebay.price;

          // Try nested prices structure with grades
          if (ebay.prices) {
            const prices = ebay.prices;
            if (prices["10"]?.market) return prices["10"].market;
            if (prices["9"]?.market) return prices["9"].market;
            if (prices["8"]?.market) return prices["8"].market;
          }

          return 0;
        };

        const getCardMarketPrice = () => {
          const cardmarket = card.cardmarket;
          if (!cardmarket) return 0;

          // Try direct market/price first
          if (cardmarket.market || cardmarket.price)
            return cardmarket.market || cardmarket.price;

          // Try nested prices structure
          if (cardmarket.prices) {
            const prices = cardmarket.prices;
            if (prices.normal?.market) return prices.normal.market;
            if (prices.holofoil?.market) return prices.holofoil.market;
            if (prices.reverseHolofoil?.market)
              return prices.reverseHolofoil.market;
          }

          return 0;
        };

        const tcgPrice = convertToGBP(getTcgPrice() || 0, "USD");
        const ebayPrice = convertToGBP(getEbayPrice() || 0, "USD");
        const cardMarketPrice = convertToGBP(getCardMarketPrice() || 0, "EUR");
        const hasPrice = tcgPrice > 0 || ebayPrice > 0 || cardMarketPrice > 0;

        if (!hasPrice) {
          console.log("Card filtered out (no price):", card.name);
        } else {
          console.log("Card with price:", card.name, {
            tcgPrice,
            ebayPrice,
            cardMarketPrice,
          });
        }

        return hasPrice;
      })
      .sort((a: ApiCardData, b: ApiCardData) => {
        const getPriceForCard = (card: ApiCardData) => {
          const getTcgPrice = () => {
            const tcg = card.tcgplayer;
            if (!tcg) return 0;
            if (tcg.market || tcg.price) return tcg.market || tcg.price;
            if (tcg.prices) {
              const prices = tcg.prices;
              if (prices.holofoil?.market) return prices.holofoil.market;
              if (prices.normal?.market) return prices.normal.market;
              if (prices.reverseHolofoil?.market)
                return prices.reverseHolofoil.market;
              if (prices.holofoil?.mid) return prices.holofoil.mid;
              if (prices.normal?.mid) return prices.normal.mid;
            }
            return 0;
          };

          const getEbayPrice = () => {
            const ebay = card.ebay;
            if (!ebay) return 0;
            if (ebay.market || ebay.price) return ebay.market || ebay.price;
            if (ebay.prices) {
              const prices = ebay.prices;
              if (prices["10"]?.market) return prices["10"].market;
              if (prices["9"]?.market) return prices["9"].market;
              if (prices["8"]?.market) return prices["8"].market;
            }
            return 0;
          };

          const getCardMarketPrice = () => {
            const cardmarket = card.cardmarket;
            if (!cardmarket) return 0;
            if (cardmarket.market || cardmarket.price)
              return cardmarket.market || cardmarket.price;
            if (cardmarket.prices) {
              const prices = cardmarket.prices;
              if (prices.normal?.market) return prices.normal.market;
              if (prices.holofoil?.market) return prices.holofoil.market;
              if (prices.reverseHolofoil?.market)
                return prices.reverseHolofoil.market;
            }
            return 0;
          };

          const tcgPriceGBP = convertToGBP(getTcgPrice() || 0, "USD");
          const ebayPriceGBP = convertToGBP(getEbayPrice() || 0, "USD");
          const cardMarketPriceGBP = convertToGBP(
            getCardMarketPrice() || 0,
            "EUR",
          );

          return Math.max(tcgPriceGBP, ebayPriceGBP, cardMarketPriceGBP);
        };

        return getPriceForCard(b) - getPriceForCard(a);
      })
      .slice(0, limit);

    console.log("Cards after filtering and sorting:", sortedCards.length); // Debug log
    console.log(
      "Top 3 card prices:",
      sortedCards.slice(0, 3).map((card) => ({
        name: card.name,
        rarity: card.rarity,
        tcgPrice: card.tcgplayer?.market || 0,
        ebayPrice: card.ebay?.market || 0,
        cardMarketPrice: card.cardmarket?.market || 0,
      })),
    );

    return sortedCards.map((card: ApiCardData, index: number) => {
      // Helper functions to extract prices
      const getTcgPrice = () => {
        const tcg = card.tcgplayer;
        if (!tcg) return 0;
        if (tcg.market || tcg.price) return tcg.market || tcg.price;
        if (tcg.prices) {
          const prices = tcg.prices;
          if (prices.holofoil?.market) return prices.holofoil.market;
          if (prices.normal?.market) return prices.normal.market;
          if (prices.reverseHolofoil?.market)
            return prices.reverseHolofoil.market;
          if (prices.holofoil?.mid) return prices.holofoil.mid;
          if (prices.normal?.mid) return prices.normal.mid;
        }
        return 0;
      };

      const getEbayPrice = () => {
        const ebay = card.ebay;
        if (!ebay) return 0;
        if (ebay.market || ebay.price) return ebay.market || ebay.price;
        if (ebay.prices) {
          const prices = ebay.prices;
          if (prices["10"]?.market) return prices["10"].market;
          if (prices["9"]?.market) return prices["9"].market;
          if (prices["8"]?.market) return prices["8"].market;
        }
        return 0;
      };

      const getCardMarketPrice = () => {
        const cardmarket = card.cardmarket;
        if (!cardmarket) return 0;
        if (cardmarket.market || cardmarket.price)
          return cardmarket.market || cardmarket.price;
        if (cardmarket.prices) {
          const prices = cardmarket.prices;
          if (prices.normal?.market) return prices.normal.market;
          if (prices.holofoil?.market) return prices.holofoil.market;
          if (prices.reverseHolofoil?.market)
            return prices.reverseHolofoil.market;
        }
        return 0;
      };

      return {
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity,
        setId: card.set?.id || mappedSetId,
        prices: {
          tcgplayer: card.tcgplayer
            ? {
                market: convertToGBP(getTcgPrice() || 0, "USD"),
                low: convertToGBP(
                  card.tcgplayer.prices?.normal?.low || card.tcgplayer.low || 0,
                  "USD",
                ),
                high: convertToGBP(
                  card.tcgplayer.prices?.normal?.high ||
                    card.tcgplayer.high ||
                    0,
                  "USD",
                ),
              }
            : undefined,
          ebay: card.ebay
            ? {
                market: convertToGBP(getEbayPrice() || 0, "USD"),
              }
            : undefined,
          cardmarket: card.cardmarket
            ? {
                market: convertToGBP(getCardMarketPrice() || 0, "EUR"),
                low: convertToGBP(
                  card.cardmarket.prices?.normal?.low ||
                    card.cardmarket.low ||
                    0,
                  "EUR",
                ),
                high: convertToGBP(
                  card.cardmarket.prices?.normal?.high ||
                    card.cardmarket.high ||
                    0,
                  "EUR",
                ),
              }
            : undefined,
        },
        imageUrl: card.images?.large || card.images?.small,
        rank: index + 1,
      };
    });
  } catch (error) {
    console.error("Error fetching chase cards:", error);
    throw error;
  }
}

export async function fetchPokemonSets(): Promise<PokemonSet[]> {
  const apiKey = process.env.POKEMON_PRICE_TRACKER_API_KEY;

  if (!apiKey) {
    throw new Error("Pokemon Price Tracker API key not configured");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sets?sortBy=releaseDate`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Pokemon sets:", error);
    throw error;
  }
}

// Fallback data in case API is unavailable
export const fallbackChaseCards: Record<
  string,
  Array<{ rank: number; name: string; image: string; price: number }>
> = {
  sv1: [
    {
      rank: 1,
      name: "Charizard ex Special Art Rare",
      image: "https://images.pokemontcg.io/sv1/195.png",
      price: 89.99,
    },
    {
      rank: 2,
      name: "Miraidon ex Special Art Rare",
      image: "https://images.pokemontcg.io/sv1/194.png",
      price: 45.99,
    },
    {
      rank: 3,
      name: "Koraidon ex Special Art Rare",
      image: "https://images.pokemontcg.io/sv1/193.png",
      price: 42.99,
    },
    {
      rank: 4,
      name: "Professor's Research Special Art Rare",
      image: "https://images.pokemontcg.io/sv1/190.png",
      price: 38.99,
    },
    {
      rank: 5,
      name: "Nemona Special Art Rare",
      image: "https://images.pokemontcg.io/sv1/191.png",
      price: 35.99,
    },
    {
      rank: 6,
      name: "Arven Special Art Rare",
      image: "https://images.pokemontcg.io/sv1/192.png",
      price: 32.99,
    },
    {
      rank: 7,
      name: "Charizard ex",
      image: "https://images.pokemontcg.io/sv1/6.png",
      price: 28.99,
    },
    {
      rank: 8,
      name: "Miraidon ex",
      image: "https://images.pokemontcg.io/sv1/101.png",
      price: 18.99,
    },
    {
      rank: 9,
      name: "Koraidon ex",
      image: "https://images.pokemontcg.io/sv1/71.png",
      price: 16.99,
    },
    {
      rank: 10,
      name: "Gardevoir ex",
      image: "https://images.pokemontcg.io/sv1/86.png",
      price: 14.99,
    },
  ],
};
