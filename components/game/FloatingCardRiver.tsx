/** @jsxImportSource preact */
import { useEffect, useState } from "preact/hooks";
import { deckCardImagePath } from "@scoundrel/game";
import type { DeckInfo } from "@scoundrel/game";
import type { Rank, Suit } from "@scoundrel/engine";

type RiverCard = {
  imagePath: string;
  deckId: string;
};

const MONSTER_SUITS: Suit[] = ["clubs", "spades"];
const MONSTER_RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const PIP_SUITS: Suit[] = ["diamonds", "hearts"];
const PIP_RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];

const ROTATIONS = [
  "rotate-2",
  "-rotate-2",
  "rotate-1",
  "-rotate-3",
  "rotate-3",
  "-rotate-1",
  "rotate-2",
  "-rotate-2",
];

export function buildCardPool(decks: DeckInfo[]): RiverCard[] {
  const pool: RiverCard[] = [];
  for (const deck of decks) {
    for (const suit of MONSTER_SUITS) {
      for (const rank of MONSTER_RANKS) {
        pool.push({
          imagePath: deckCardImagePath(deck, { suit, rank }),
          deckId: deck.id,
        });
      }
    }
    for (const suit of PIP_SUITS) {
      for (const rank of PIP_RANKS) {
        pool.push({
          imagePath: deckCardImagePath(deck, { suit, rank }),
          deckId: deck.id,
        });
      }
    }
  }
  return pool;
}

export function shuffleAndPick<T>(pool: T[], count: number): T[] {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr.slice(0, Math.min(count, arr.length));
}

type Props = {
  decks: DeckInfo[];
};

export function FloatingCardRiver({ decks }: Props) {
  const [leftCards, setLeftCards] = useState<RiverCard[]>([]);
  const [rightCards, setRightCards] = useState<RiverCard[]>([]);
  const [mobileCards, setMobileCards] = useState<RiverCard[]>([]);

  useEffect(() => {
    const pool = buildCardPool(decks);
    const picked = shuffleAndPick(pool, 22);
    setLeftCards(picked.slice(0, 8));
    setRightCards(picked.slice(8, 16));
    setMobileCards(picked.slice(16, 22));
  }, [decks.length]);

  return (
    <div aria-hidden="true" class="pointer-events-none">
      {/* Desktop: two flanking vertical columns */}
      <div class="hidden md:flex absolute inset-0 overflow-hidden justify-between">
        {/* Left column - drift downward */}
        <div class="w-[80px] ml-4 lg:ml-12 opacity-[0.35] overflow-hidden self-stretch">
          <div class="animate-card-river-down flex flex-col gap-3 will-change-transform">
            {[...leftCards, ...leftCards].map((card, i) => (
              <img
                key={i}
                src={card.imagePath}
                alt=""
                loading="lazy"
                class={`w-full rounded-sm ${ROTATIONS[i % ROTATIONS.length]}`}
              />
            ))}
          </div>
        </div>
        {/* Right column - drift upward */}
        <div class="w-[80px] mr-4 lg:mr-12 opacity-[0.35] overflow-hidden self-stretch">
          <div class="animate-card-river-up flex flex-col gap-3 will-change-transform">
            {[...rightCards, ...rightCards].map((card, i) => (
              <img
                key={i}
                src={card.imagePath}
                alt=""
                loading="lazy"
                class={`w-full rounded-sm ${ROTATIONS[i % ROTATIONS.length]}`}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Mobile: horizontal ribbon near the top */}
      <div class="flex md:hidden absolute top-12 left-0 right-0 overflow-hidden opacity-[0.30]">
        <div class="animate-card-river-horizontal flex gap-2 will-change-transform">
          {[...mobileCards, ...mobileCards].map((card, i) => (
            <img
              key={i}
              src={card.imagePath}
              alt=""
              loading="lazy"
              class={`w-[50px] rounded-sm flex-shrink-0 ${
                ROTATIONS[i % ROTATIONS.length]
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
