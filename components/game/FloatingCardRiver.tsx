/** @jsxImportSource preact */
import { useEffect, useRef, useState } from "preact/hooks";
import { deckCardImagePath } from "@scoundrel/game";
import type { DeckInfo } from "@scoundrel/game";
import type { Rank, Suit } from "@scoundrel/engine";

type RiverCard = {
  imagePath: string;
  deckId: string;
};

export type CardLayout = RiverCard & {
  offsetX: number;
  gapY: number;
  rotationClass: string;
};

const MONSTER_SUITS: Suit[] = ["clubs", "spades"];
const MONSTER_RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const PIP_SUITS: Suit[] = ["diamonds", "hearts"];
const PIP_RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];

const ROTATION_CLASSES = [
  "rotate-1",
  "rotate-2",
  "rotate-3",
  "-rotate-1",
  "-rotate-2",
  "-rotate-3",
];

// Left column cards start around x=10, right column around x=150.
// Jitter of ±20px makes each placement feel organic.
const LEFT_BASE_X = 10;
const RIGHT_BASE_X = 150;
const JITTER = 20;

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

export function generateCardLayout(cards: RiverCard[]): CardLayout[] {
  return cards.map((card, i) => {
    const isLeft = i % 2 === 0;
    const baseX = isLeft ? LEFT_BASE_X : RIGHT_BASE_X;
    const jitter = Math.floor(Math.random() * (JITTER * 2 + 1)) - JITTER;
    const gapY = 8 + Math.floor(Math.random() * 33);
    const rotationClass =
      ROTATION_CLASSES[Math.floor(Math.random() * ROTATION_CLASSES.length)];
    return {
      ...card,
      offsetX: baseX + jitter,
      gapY,
      rotationClass,
    };
  });
}

export function findAnimationClass(
  classList: Iterable<string>,
): string | undefined {
  return [...classList].find((c) => c.startsWith("animate-card-river-"));
}

export function restartAnimation(el: HTMLElement): void {
  const animClass = findAnimationClass(el.classList);
  if (!animClass) return;
  el.classList.remove(animClass);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add(animClass);
    });
  });
}

export function handlePageShow(
  event: PageTransitionEvent,
  onRestart: () => void,
): void {
  if (event.persisted) {
    onRestart();
  }
}

type Props = {
  decks: DeckInfo[];
};

export function FloatingCardRiver({ decks }: Props) {
  const [leftCards, setLeftCards] = useState<CardLayout[]>([]);
  const [rightCards, setRightCards] = useState<CardLayout[]>([]);
  const [mobileCards, setMobileCards] = useState<CardLayout[]>([]);
  const leftAnimRef = useRef<HTMLDivElement>(null);
  const rightAnimRef = useRef<HTMLDivElement>(null);
  const mobileAnimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pool = buildCardPool(decks);
    const picked = shuffleAndPick(pool, 36);
    setLeftCards(generateCardLayout(picked.slice(0, 12)));
    setRightCards(generateCardLayout(picked.slice(12, 24)));
    setMobileCards(generateCardLayout(picked.slice(24, 36)));
  }, [decks.length]);

  useEffect(() => {
    const listener = (e: PageTransitionEvent) =>
      handlePageShow(e, () => {
        for (const ref of [leftAnimRef, rightAnimRef, mobileAnimRef]) {
          if (ref.current) restartAnimation(ref.current);
        }
      });
    globalThis.addEventListener("pageshow", listener);
    return () => globalThis.removeEventListener("pageshow", listener);
  }, []);

  return (
    <div aria-hidden="true" class="pointer-events-none">
      {/* Desktop: two flanking river lanes */}
      <div class="hidden md:flex absolute inset-0 overflow-hidden justify-between">
        {/* Left lane - drift downward */}
        <div class="bg-river-dark w-[clamp(300px,32vw,460px)] overflow-hidden self-stretch">
          <div
            ref={leftAnimRef}
            class="animate-card-river-down will-change-transform"
          >
            {[...leftCards, ...leftCards].map((card, i) => (
              <div
                key={i}
                style={`margin-top: ${card.gapY}px; margin-left: ${card.offsetX}px`}
              >
                <img
                  src={card.imagePath}
                  alt=""
                  loading="lazy"
                  class={`w-[clamp(140px,28vw,230px)] rounded-sm ${card.rotationClass}`}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Right lane - drift upward */}
        <div class="bg-river-dark w-[clamp(300px,32vw,460px)] overflow-hidden self-stretch">
          <div
            ref={rightAnimRef}
            class="animate-card-river-up will-change-transform"
          >
            {[...rightCards, ...rightCards].map((card, i) => (
              <div
                key={i}
                style={`margin-top: ${card.gapY}px; margin-left: ${card.offsetX}px`}
              >
                <img
                  src={card.imagePath}
                  alt=""
                  loading="lazy"
                  class={`w-[clamp(140px,28vw,230px)] rounded-sm ${card.rotationClass}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Mobile: horizontal ribbon pinned to bottom */}
      <div class="flex md:hidden absolute bottom-0 left-0 right-0 bg-river-dark h-[140px] overflow-hidden">
        <div
          ref={mobileAnimRef}
          class="animate-card-river-horizontal flex min-w-max will-change-transform"
        >
          {[...mobileCards, ...mobileCards].map((card, i) => (
            <div
              key={i}
              class="flex-shrink-0"
              style={`margin-right: ${
                Math.round(card.gapY / 2)
              }px; margin-top: ${card.offsetX % 20}px`}
            >
              <img
                src={card.imagePath}
                alt=""
                loading="lazy"
                class={`w-[90px] rounded-sm ${card.rotationClass}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
