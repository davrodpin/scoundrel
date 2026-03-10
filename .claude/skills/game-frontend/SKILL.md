---
name: game-frontend
description: >
  Game Frontend Design Skill for the Scoundrel dungeon crawler. Use this skill
  whenever building, modifying, or reviewing any UI component, page, island,
  layout, or visual element in the Scoundrel web app — including cards, health
  bars, game board layout, buttons, panels, and animations. Invoke this any time
  someone touches the frontend: adding a new component, changing a page's look,
  styling an island, adjusting colors or typography, or wiring up game state to
  the UI. This skill defines the visual identity, Tailwind color palette,
  component conventions, and anti-patterns that keep the dungeon crawler
  aesthetic consistent.
---

# Game Frontend Design Skill

Use this skill when building or modifying any UI component, page, or layout for
the Scoundrel game. It defines the visual identity, component conventions, and
design constraints that keep the frontend consistent and thematic.

> **Before writing any code:** follow the `git-workflow` skill to create a git
> worktree and branch. Never implement directly on `main`.

## Design Identity

The game UI should feel like a dungeon crawler — dark, weathered, atmospheric.
Think tavern bulletin board, candlelit stone chamber, aged parchment. Never
sterile, never corporate, never "modern SaaS dashboard."

Every screen should feel like the player is sitting at a wooden table in a
torch-lit room, playing cards.

## Color Palette

Define these as Tailwind custom colors in `tailwind.config.ts`:

| Token             | Hex       | Usage                                     |
| ----------------- | --------- | ----------------------------------------- |
| `dungeon-bg`      | `#1a1a1a` | Primary background (dark stone)           |
| `dungeon-surface` | `#2a2520` | Card areas, panels (dark wood/leather)    |
| `dungeon-border`  | `#3d3428` | Borders, separators (worn wood grain)     |
| `parchment`       | `#d4c5a0` | Card faces, text areas (aged paper)       |
| `parchment-dark`  | `#b8a882` | Secondary text on dark backgrounds        |
| `torch-amber`     | `#c8841d` | Primary accent, highlights, active states |
| `torch-glow`      | `#e6a832` | Hover states, emphasis                    |
| `blood-red`       | `#8b1a1a` | Damage indicators, health loss            |
| `blood-bright`    | `#c62828` | Critical damage, warnings                 |
| `potion-green`    | `#2e6b30` | Health gain, healing indicators           |
| `weapon-steel`    | `#7a7d85` | Weapon-related UI elements                |
| `ink`             | `#1c1410` | Primary text on light backgrounds         |
| `shadow`          | `#0d0d0d` | Deep shadows, overlays                    |

## Typography

- **Headings:** Serif font for a medieval/antique feel. Use a self-hosted font
  or system serif stack:
  `"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif`
- **Body/Game info:** Clean, readable:
  `"Segoe UI", system-ui, -apple-system, sans-serif`
- **Card values/numbers:** Bold, high contrast against card backgrounds
- No external CDN font loading — self-host or use system fonts only

## Card Assets

Card images live in `assets/cards/`. The naming pattern:

- **Face-up cards:** `{suit}_{value}.jpg`
  - Suits: `clubs`, `spades`, `diamonds`, `hearts`
  - Values: `2`-`10`, `j`, `q`, `k`, `a`
  - Examples: `clubs_2.jpg`, `spades_j.jpg`, `hearts_9.jpg`
- **Card back (face-down):** `card_cover.jpg` (primary) or `card_cover_1.jpg`
  (alternate)

### Rendering Cards

```tsx
// Face-up card
<img
  src={`/cards/${suit}_${value}.jpg`}
  alt={`${value} of ${suit}`}
  class="w-24 h-auto"
/>

// Face-down card (dungeon pile, discard pile)
<img
  src="/cards/card_cover.jpg"
  alt="Card back"
  class="w-24 h-auto"
/>
```

Cards should never have `rounded-xl` or heavy `shadow-xl`. Use minimal rounding
(`rounded` or `rounded-sm`) and subtle borders (`border border-dungeon-border`).

### Stacked Cards (Weapon + Slain Monsters)

When a weapon has slain monsters stacked on it, render them overlapping
vertically so the weapon's value remains visible:

```tsx
<div class="relative">
  {/* Weapon at bottom */}
  <img src={weaponSrc} class="w-24" />
  {/* Each slain monster offset downward */}
  {slainMonsters.map((monster, i) => (
    <img
      src={monsterSrc}
      class="w-24 absolute"
      style={`top: ${(i + 1) * 28}px`}
    />
  ))}
</div>;
```

## Game Board Layout

Maps the table layout from `docs/SCOUNDREL.md` into a responsive grid:

```
+--------------------------------------------------+
|                   Health Display                  |
+----------+------------------------+--------------+
| Dungeon  |     Room (4 cards)     |   Discard    |
|  pile    |  [C1] [C2] [C3] [C4]  |    pile      |
+----------+------------------------+--------------+
|          |   Equipped Weapon Area                 |
|          |   [Weapon + Slain stack]               |
+----------+---------------------------------------+
```

Implementation approach:

```tsx
<div class="min-h-screen bg-dungeon-bg text-parchment p-4">
  {/* Health bar - top */}
  <div class="text-center mb-6">...</div>

  {/* Main play area */}
  <div class="grid grid-cols-[auto_1fr_auto] gap-4 items-start max-w-4xl mx-auto">
    {/* Dungeon pile */}
    <div class="flex flex-col items-center gap-1">...</div>

    {/* Room - 4 cards in a row */}
    <div class="flex justify-center gap-3">...</div>

    {/* Discard pile */}
    <div class="flex flex-col items-center gap-1">...</div>
  </div>

  {/* Equipped weapon area - below room */}
  <div class="flex justify-center mt-6">...</div>
</div>;
```

- Health display should be prominent — large text, styled like carved stone or
  etched metal
- Dungeon pile shows the card back with a count of remaining cards
- Discard pile shows the card back (or top discarded card) with count
- Room cards are interactive (selectable) — see Islands section

## Component Conventions

### When to use Islands (interactive)

Islands are for anything that responds to user input or manages client-side
state:

- **Card selection** — clicking a card in the Room to play it
- **Game action buttons** — "Avoid Room", "Fight Barehanded", "Fight with
  Weapon"
- **Health animation** — dynamic health bar changes
- **Game state management** — signals that track the current game state

### When to use Components (static/server-rendered)

Components are for pure rendering with no interactivity:

- **Card display** — rendering a single card image
- **Health bar** — the visual bar itself (the island wraps it for reactivity)
- **Score display** — end-of-game score rendering
- **Layout shells** — page structure, headers

### State Management

Use Preact signals for game state. Keep game logic in `lib/scoundrel` and call
it from islands — islands should only handle UI state and user interaction, not
game rules.

## Animation and Transitions

Use CSS transitions for all animations. No JS animation libraries.

- **Card draw:** `transition-all duration-300 ease-out` — cards slide into
  position
- **Damage flash:** Brief red overlay on health display (`animate-pulse` with
  `text-blood-bright`)
- **Health change:** Smooth width transition on health bar
  (`transition-[width] duration-500`)
- **Card selection hover:** Subtle lift effect
  (`hover:-translate-y-1 transition-transform`)
- **Card played:** Fade/slide out
  (`opacity-0 translate-y-2 transition-all duration-200`)

Keep animations subtle and quick. The game should feel responsive, not flashy.

## Anti-Patterns — Do NOT Do These

- **No `rounded-xl` on cards** — cards are rectangular objects, not pill buttons
- **No `shadow-xl` or `shadow-2xl`** — use subtle shadows or border-based depth
- **No gradient backgrounds** — use flat dark colors or subtle CSS texture
  patterns
- **No emoji as icons** — use text symbols or SVG if icons are needed
- **No bright saturated colors** — the palette is muted and earthy
- **No bright white (`#fff`)** — use `parchment` tones for light elements
- **No DaisyUI components** — pure Tailwind utilities only
- **No generic component library aesthetics** — no Material Design, no Bootstrap
  look
- **No external font CDNs** — self-host or system fonts
- **No heavy box shadows on interactive elements** — prefer border color changes
  for focus/hover states
