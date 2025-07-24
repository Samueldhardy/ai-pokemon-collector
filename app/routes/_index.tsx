import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import {
  fetchTopChaseCards,
  fallbackChaseCards,
  type CardPrice,
} from "~/utils/pokemon-api";

// Type for fallback cards
type FallbackCard = {
  rank: number;
  name: string;
  image: string;
  price: number;
};

// Union type for cards that can come from API or fallback
type DisplayCard = CardPrice | FallbackCard;

export const meta: MetaFunction = () => {
  return [
    { title: "Pokemon TCG Chase Cards" },
    {
      name: "description",
      content: "Find the top chase cards from Scarlet & Violet sets",
    },
  ];
};

const scarletVioletSets = [
  { id: "sv1", name: "Scarlet & Violet Base Set" },
  { id: "sv2", name: "Paldea Evolved" },
  { id: "sv3", name: "Obsidian Flames" },
  { id: "sv4", name: "Paradox Rift" },
  { id: "sv5", name: "Temporal Forces" },
  { id: "sv6", name: "Twilight Masquerade" },
  { id: "sv7", name: "Stellar Crown" },
  { id: "sv8", name: "Surging Sparks" },
  { id: "sv9", name: "Journey Together" },
  { id: "sv10", name: "Destined Rivals" },
  { id: "sv-prismatic", name: "Prismatic Evolutions" },
  { id: "sv-black-bolt", name: "Black Bolt" },
  { id: "sv-white-flare", name: "White Flare" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const setId = url.searchParams.get("set");

  if (!setId) {
    return json({ chaseCards: [], selectedSet: null, error: null });
  }

  try {
    const chaseCards = await fetchTopChaseCards(setId, 10);
    console.log("Fetched chase cards:", chaseCards.length);
    return json({ chaseCards, selectedSet: setId, error: null });
  } catch (error) {
    console.error("Failed to fetch chase cards:", error);
    // Use fallback data if API fails
    const fallbackCards = fallbackChaseCards[setId] || [];
    return json({
      chaseCards: fallbackCards,
      selectedSet: setId,
      error: "Using sample data - API unavailable",
    });
  }
}

export default function Index() {
  const { chaseCards, selectedSet, error } = useLoaderData<typeof loader>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DisplayCard | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSetChange = async (setId: string) => {
    if (!setId) return;

    setIsLoading(true);
    setIsDropdownOpen(false);
    // Navigate to the same page with the set parameter
    window.location.href = `/?set=${setId}`;
  };

  const handleCardClick = (card: DisplayCard) => {
    setSelectedCard(card);
  };

  const closeModal = () => {
    setSelectedCard(null);
  };

  // Handle keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedCard) {
        closeModal();
      }
    };

    if (selectedCard) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedCard]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
      <header className='relative z-[100] border-b border-purple-500/20 bg-black/40 shadow-xl backdrop-blur-lg'>
        <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
          <div className='flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0'>
            <h1 className='bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-center text-3xl font-black text-transparent sm:text-4xl lg:text-left lg:text-5xl'>
              ⚡ POKEMON TCG CHASE
            </h1>

            {/* Custom Dropdown in Header */}
            <div className='relative w-full lg:ml-8 lg:flex-1'>
              {/* Dropdown Button */}
              <button
                onClick={toggleDropdown}
                className='flex w-full cursor-pointer items-center justify-between rounded-xl border-2 border-purple-500/50 bg-black/60 px-4 py-3 text-white shadow-2xl backdrop-blur-sm transition-all duration-300 hover:border-purple-400 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/25 sm:px-6'
              >
                <span className='text-sm font-medium sm:text-base'>
                  {selectedSet
                    ? scarletVioletSets.find((s) => s.id === selectedSet)?.name
                    : "Choose a set..."}
                </span>
                <svg
                  className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className='fixed inset-0 z-10'
                    onClick={closeDropdown}
                    onKeyDown={(e) => e.key === "Escape" && closeDropdown()}
                    role='button'
                    tabIndex={0}
                    aria-label='Close dropdown'
                  />

                  {/* Dropdown Options */}
                  <div className='custom-scrollbar absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border-2 border-purple-500/50 bg-black shadow-2xl'>
                    {!selectedSet && (
                      <div className='cursor-default px-4 py-3 text-sm text-gray-400 sm:px-6'>
                        Choose a set...
                      </div>
                    )}
                    {scarletVioletSets.map((set) => (
                      <button
                        key={set.id}
                        onClick={() => handleSetChange(set.id)}
                        className={`w-full px-4 py-3 text-left text-white transition-all duration-200 hover:bg-purple-500/20 hover:border-l-4 hover:border-l-purple-400 focus:outline-none focus:bg-purple-500/20 text-sm sm:px-6 sm:text-base ${
                          selectedSet === set.id
                            ? "bg-purple-500/30 border-l-4 border-l-purple-400"
                            : ""
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <span className='font-medium'>{set.name}</span>
                          {selectedSet === set.id && (
                            <svg
                              className='h-4 w-4 text-purple-400'
                              fill='currentColor'
                              viewBox='0 0 20 20'
                            >
                              <path
                                fillRule='evenodd'
                                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                clipRule='evenodd'
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {error && (
          <div className='mb-6 rounded-xl border border-orange-500/50 bg-orange-500/10 p-4 text-orange-300 backdrop-blur-sm'>
            <p className='text-sm font-medium'>⚠️ {error}</p>
          </div>
        )}

        {isLoading && (
          <div className='py-16 text-center'>
            <div className='inline-flex items-center space-x-3'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent'></div>
              <p className='text-xl font-medium text-white'>
                Loading chase cards...
              </p>
            </div>
          </div>
        )}

        {chaseCards.length > 0 && !isLoading && (
          <div>
            <h2 className='mb-8 bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 bg-clip-text text-center text-3xl font-black text-transparent'>
              🔥 TOP 10 CHASE CARDS 🔥
            </h2>
            <h3 className='mb-8 text-center text-xl font-bold text-purple-300'>
              {scarletVioletSets.find((s) => s.id === selectedSet)?.name}
            </h3>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5'>
              {(chaseCards as DisplayCard[]).map((card: DisplayCard) => {
                // Type guards to check which type of card we have
                const isApiCard = (card: DisplayCard): card is CardPrice =>
                  "id" in card;
                const isFallbackCard = (
                  card: DisplayCard,
                ): card is FallbackCard => "image" in card;

                // Helper functions that work with both card types
                const getRank = (): number => {
                  if (isApiCard(card)) return card.rank || 0;
                  if (isFallbackCard(card)) return card.rank;
                  return 0;
                };

                const getName = (): string => {
                  return card.name || "";
                };

                const getImageUrl = (): string => {
                  if (isFallbackCard(card)) return card.image;
                  if (isApiCard(card)) {
                    return (
                      card.imageUrl ||
                      `https://images.pokemontcg.io/${card.setId}/${card.number}.png`
                    );
                  }
                  return "";
                };

                const getPrice = (): number => {
                  if (isFallbackCard(card)) return card.price;
                  if (isApiCard(card)) {
                    const tcgPrice = card.prices?.tcgplayer?.market || 0;
                    const ebayPrice = card.prices?.ebay?.market || 0;
                    const cardMarketPrice =
                      card.prices?.cardmarket?.market || 0;
                    return Math.max(tcgPrice, ebayPrice, cardMarketPrice);
                  }
                  return 0;
                };

                const getRarity = (): string | undefined => {
                  if (isApiCard(card)) return card.rarity;
                  return undefined;
                };

                const getKey = (): string => {
                  if (isApiCard(card)) return card.id;
                  if (isFallbackCard(card)) return `fallback-${card.rank}`;
                  return Math.random().toString();
                };

                return (
                  <div
                    key={getKey()}
                    onClick={() => handleCardClick(card)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCardClick(card);
                      }
                    }}
                    role='button'
                    tabIndex={0}
                    aria-label={`View details for ${getName()}`}
                    className='group relative mx-auto w-full max-w-[280px] transform-gpu cursor-pointer overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-gray-900/90 to-black/90 shadow-2xl backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400'
                  >
                    {/* Card Image */}
                    <div className='relative w-full flex justify-center'>
                      <img
                        src={getImageUrl()}
                        alt={getName()}
                        className='w-full h-auto'
                        loading='lazy'
                      />
                    </div>

                    {/* Card Info Below Image */}
                    <div className='relative p-6'>
                      <div className='absolute left-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-xs font-black text-black shadow-lg'>
                        #{getRank()}
                      </div>
                      <h3 className='mb-3 text-center text-base font-bold leading-tight text-white'>
                        {getName()}
                      </h3>
                      {getPrice() > 0 && (
                        <div className='mb-3 text-center'>
                          <span className='inline-block rounded-full bg-gradient-to-r from-emerald-500 to-green-400 px-4 py-2 text-xl font-black text-black shadow-lg'>
                            £{getPrice()}
                          </span>
                        </div>
                      )}
                      {getRarity() && (
                        <p className='text-center text-xs font-medium uppercase tracking-wider text-purple-300'>
                          {getRarity()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedSet && chaseCards.length === 0 && !isLoading && (
          <div className='py-16 text-center'>
            <div className='inline-block rounded-2xl border border-purple-500/30 bg-black/60 p-8 backdrop-blur-sm'>
              <p className='text-xl font-medium text-purple-300'>
                💫 No chase card data available for this set yet.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm'
          role='dialog'
          aria-modal='true'
          aria-labelledby='card-modal-title'
        >
          {/* Invisible backdrop button for closing */}
          <button
            className='absolute inset-0 h-full w-full cursor-default'
            onClick={closeModal}
            aria-label='Close modal'
          />
          <div
            className='relative mx-2 w-full max-w-4xl rounded-3xl border border-purple-500/50 bg-gradient-to-br from-gray-900/95 to-black/95 shadow-2xl backdrop-blur-lg sm:mx-4'
            role='document'
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className='absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/80 text-lg font-bold text-white transition-all duration-300 hover:bg-red-500 sm:right-4 sm:top-4 sm:h-10 sm:w-10 sm:text-xl'
            >
              ×
            </button>

            <div className='grid grid-cols-1 gap-4 p-4 sm:gap-8 sm:p-8 lg:grid-cols-2'>
              {/* Card Image */}
              <div className='flex flex-col items-center'>
                <div className='relative'>
                  <div className='absolute -left-1 -top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-sm font-black text-black shadow-lg sm:-left-2 sm:-top-2 sm:h-12 sm:w-12 sm:text-lg'>
                    #
                    {(() => {
                      const isApiCard = (
                        card: DisplayCard,
                      ): card is CardPrice => "id" in card;
                      const isFallbackCard = (
                        card: DisplayCard,
                      ): card is FallbackCard => "image" in card;
                      if (isApiCard(selectedCard))
                        return selectedCard.rank || 0;
                      if (isFallbackCard(selectedCard))
                        return selectedCard.rank;
                      return 0;
                    })()}
                  </div>
                  <img
                    src={(() => {
                      const isFallbackCard = (
                        card: DisplayCard,
                      ): card is FallbackCard => "image" in card;
                      const isApiCard = (
                        card: DisplayCard,
                      ): card is CardPrice => "id" in card;
                      if (isFallbackCard(selectedCard))
                        return selectedCard.image;
                      if (isApiCard(selectedCard)) {
                        return (
                          selectedCard.imageUrl ||
                          `https://images.pokemontcg.io/${selectedCard.setId}/${selectedCard.number}.png`
                        );
                      }
                      return "";
                    })()}
                    alt={selectedCard.name}
                    className='w-full max-w-xs rounded-2xl shadow-2xl sm:max-w-sm'
                  />
                </div>
              </div>

              {/* Card Details */}
              <div className='flex flex-col justify-center space-y-4 sm:space-y-6'>
                <div>
                  <h2
                    id='card-modal-title'
                    className='mb-2 text-xl font-black text-white sm:text-2xl lg:text-3xl'
                  >
                    {selectedCard.name}
                  </h2>
                  {(() => {
                    const isApiCard = (card: DisplayCard): card is CardPrice =>
                      "id" in card;
                    if (isApiCard(selectedCard) && selectedCard.rarity) {
                      return (
                        <p className='text-lg font-semibold uppercase tracking-wider text-purple-300'>
                          {selectedCard.rarity}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Pricing Information */}
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='mb-2 text-lg font-bold text-yellow-400 sm:mb-3 sm:text-xl'>
                    💰 Pricing Information
                  </h3>

                  {(() => {
                    const isApiCard = (card: DisplayCard): card is CardPrice =>
                      "id" in card;
                    const isFallbackCard = (
                      card: DisplayCard,
                    ): card is FallbackCard => "image" in card;

                    if (isFallbackCard(selectedCard)) {
                      return (
                        <div className='rounded-xl bg-black/50 p-4'>
                          <div className='flex items-center justify-between'>
                            <span className='text-gray-300'>Market Price:</span>
                            <span className='text-2xl font-black text-green-400'>
                              £{selectedCard.price}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (isApiCard(selectedCard)) {
                      return (
                        <div className='space-y-3'>
                          {selectedCard.prices?.tcgplayer && (
                            <div className='rounded-xl border border-blue-500/30 bg-blue-500/20 p-4'>
                              <h4 className='mb-2 font-bold text-blue-300'>
                                🇺🇸 TCGPlayer
                              </h4>
                              <div className='grid grid-cols-3 gap-2 text-sm'>
                                <div className='text-center'>
                                  <p className='text-gray-300'>Low</p>
                                  <p className='font-bold text-red-400'>
                                    £{selectedCard.prices.tcgplayer.low}
                                  </p>
                                </div>
                                <div className='text-center'>
                                  <p className='text-gray-300'>Market</p>
                                  <p className='font-bold text-green-400'>
                                    £{selectedCard.prices.tcgplayer.market}
                                  </p>
                                </div>
                                <div className='text-center'>
                                  <p className='text-gray-300'>High</p>
                                  <p className='font-bold text-blue-400'>
                                    £{selectedCard.prices.tcgplayer.high}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedCard.prices?.ebay && (
                            <div className='rounded-xl border border-yellow-500/30 bg-yellow-500/20 p-4'>
                              <h4 className='mb-2 font-bold text-yellow-300'>
                                🛒 eBay
                              </h4>
                              <div className='text-center'>
                                <p className='text-gray-300'>Market Price</p>
                                <p className='text-lg font-bold text-green-400'>
                                  £{selectedCard.prices.ebay.market}
                                </p>
                              </div>
                            </div>
                          )}

                          {selectedCard.prices?.cardmarket && (
                            <div className='rounded-xl border border-purple-500/30 bg-purple-500/20 p-4'>
                              <h4 className='mb-2 font-bold text-purple-300'>
                                🇪🇺 CardMarket
                              </h4>
                              <div className='grid grid-cols-3 gap-2 text-sm'>
                                <div className='text-center'>
                                  <p className='text-gray-300'>Low</p>
                                  <p className='font-bold text-red-400'>
                                    £{selectedCard.prices.cardmarket.low}
                                  </p>
                                </div>
                                <div className='text-center'>
                                  <p className='text-gray-300'>Market</p>
                                  <p className='font-bold text-green-400'>
                                    £{selectedCard.prices.cardmarket.market}
                                  </p>
                                </div>
                                <div className='text-center'>
                                  <p className='text-gray-300'>High</p>
                                  <p className='font-bold text-blue-400'>
                                    £{selectedCard.prices.cardmarket.high}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>

                {/* Card Info */}
                {(() => {
                  const isApiCard = (card: DisplayCard): card is CardPrice =>
                    "id" in card;
                  if (isApiCard(selectedCard)) {
                    return (
                      <div className='space-y-3'>
                        <h3 className='text-xl font-bold text-yellow-400'>
                          📋 Card Information
                        </h3>
                        <div className='space-y-2 rounded-xl bg-black/50 p-4'>
                          <div className='flex justify-between'>
                            <span className='text-gray-300'>Card ID:</span>
                            <span className='font-mono text-white'>
                              {selectedCard.id}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-300'>Number:</span>
                            <span className='font-bold text-white'>
                              #{selectedCard.number}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-300'>Set:</span>
                            <span className='text-white'>
                              {scarletVioletSets.find(
                                (s) => s.id === selectedCard.setId,
                              )?.name || selectedCard.setId}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
