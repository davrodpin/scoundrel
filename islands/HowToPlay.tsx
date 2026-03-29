import SvgCard from "../components/how-to-play/SvgCard.tsx";
import SvgCardBack from "../components/how-to-play/SvgCardBack.tsx";
import CombatDemo from "./demos/CombatDemo.tsx";
import HealthPotionDemo from "./demos/HealthPotionDemo.tsx";
import RoomFlowDemo from "./demos/RoomFlowDemo.tsx";
import WeaponDegradationDemo from "./demos/WeaponDegradationDemo.tsx";

const TOC_ENTRIES = [
  { id: "overview", label: "Overview" },
  { id: "setup", label: "Setup" },
  { id: "card-types", label: "Card Types" },
  { id: "turn-flow", label: "Turn Flow" },
  { id: "combat", label: "Combat" },
  { id: "weapon-degradation", label: "Weapon Degradation" },
  { id: "health-potions", label: "Health Potions" },
  { id: "room-avoidance", label: "Room Avoidance" },
  { id: "game-interface", label: "Game Interface" },
  { id: "keyboard-shortcuts", label: "Keyboard Shortcuts" },
  { id: "scoring", label: "Scoring" },
];

function TableOfContents() {
  return (
    <nav
      aria-label="Table of contents"
      class="bg-dungeon-surface border border-dungeon-border rounded-sm p-4"
    >
      <h2 class="font-heading text-torch-amber text-sm uppercase tracking-wider mb-3">
        Contents
      </h2>
      <ol class="space-y-1">
        {TOC_ENTRIES.map(({ id, label }, i) => (
          <li key={id} class="flex items-baseline gap-2">
            <span class="font-body text-parchment-dark/50 text-xs w-5 text-right shrink-0">
              {i + 1}.
            </span>
            <a
              href={`#${id}`}
              class="font-body text-sm text-parchment hover:text-torch-amber transition-colors"
            >
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function SectionHeading({ children, id }: { children: string; id: string }) {
  return (
    <h2 class="group font-heading text-torch-amber text-2xl border-b border-dungeon-border pb-2 mb-4 flex items-center gap-2">
      {children}
      <a
        href={`#${id}`}
        class="opacity-0 group-hover:opacity-100 transition-opacity text-parchment-dark hover:text-torch-amber font-body text-lg"
        aria-label={`Link to ${children} section`}
      >
        #
      </a>
    </h2>
  );
}

function Prose({ children }: { children: preact.ComponentChildren }) {
  return (
    <p class="font-body text-parchment leading-relaxed text-sm sm:text-base">
      {children}
    </p>
  );
}

type HowToPlayProps = {
  embedded?: boolean;
};

export default function HowToPlay({ embedded = false }: HowToPlayProps) {
  return (
    <div
      class={`${embedded ? "" : "min-h-screen"} bg-dungeon-bg text-parchment`}
    >
      {/* Header */}
      {!embedded && (
        <header class="border-b border-dungeon-border bg-dungeon-surface px-4 py-6">
          <div class="max-w-3xl mx-auto">
            <a
              href="/play"
              class="text-xs font-body text-parchment-dark hover:text-torch-amber transition-colors mb-3 inline-block"
            >
              &larr; Back to Game
            </a>
            <h1 class="font-heading text-torch-amber text-3xl sm:text-4xl">
              How to Play Scoundrel
            </h1>
            <p class="font-body text-parchment-dark text-sm mt-2">
              A Single Player Rogue-like Card Game
            </p>
          </div>
        </header>
      )}

      <main class="max-w-3xl mx-auto px-4 py-8 space-y-12">
        {!embedded && <TableOfContents />}
        {/* Overview */}
        <section id="overview">
          <SectionHeading id="overview">Overview</SectionHeading>
          <Prose>
            You are a scoundrel delving into a dangerous dungeon. Each turn you
            face a room of four cards — monsters to slay, weapons to equip, and
            potions to drink. Choose wisely: survive the entire dungeon for a
            high score, or die trying and face a penalty for every monster that
            remains.
          </Prose>
        </section>

        {/* Setup */}
        <section id="setup">
          <SectionHeading id="setup">Setup</SectionHeading>
          <Prose>
            Scoundrel uses a standard 52-card deck with all Jokers, Red Face
            Cards (J, Q, K of Hearts and Diamonds), and Red Aces removed. This
            leaves{" "}
            <strong class="text-torch-amber">44 cards</strong>: 26 monsters, 9
            weapons, and 9 potions. Shuffle and place the deck face-down — that
            is your Dungeon. You start with{" "}
            <strong class="text-torch-amber">20 Health</strong>.
          </Prose>
          <div class="flex gap-3 mt-4 flex-wrap items-end">
            <SvgCardBack />
            <span class="font-body text-parchment-dark text-sm self-center">
              44-card dungeon
            </span>
          </div>
        </section>

        {/* Card Types */}
        <section id="card-types">
          <SectionHeading id="card-types">Card Types</SectionHeading>
          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <div class="flex gap-2 shrink-0">
                <SvgCard card={{ suit: "clubs", rank: 8 }} small />
                <SvgCard card={{ suit: "spades", rank: 13 }} small />
              </div>
              <div>
                <h3 class="font-heading text-blood-red text-lg">
                  Monsters (Clubs & Spades)
                </h3>
                <Prose>
                  All 13 ranks from both black suits. Their damage equals their
                  rank value (Ace = 14, King = 13, Jack = 11).
                </Prose>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="flex gap-2 shrink-0">
                <SvgCard card={{ suit: "diamonds", rank: 7 }} small />
              </div>
              <div>
                <h3 class="font-heading text-weapon-steel text-lg">
                  Weapons (Diamonds)
                </h3>
                <Prose>
                  Ranks 2–10 only (9 cards). Equipping a weapon discards your
                  previous one. Weapons reduce monster damage but degrade over
                  use.
                </Prose>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="flex gap-2 shrink-0">
                <SvgCard card={{ suit: "hearts", rank: 5 }} small />
              </div>
              <div>
                <h3 class="font-heading text-potion-green text-lg">
                  Potions (Hearts)
                </h3>
                <Prose>
                  Ranks 2–10 only (9 cards). Heals HP equal to rank, capped at
                  20. Only one potion may be used per turn.
                </Prose>
              </div>
            </div>
          </div>
        </section>

        {/* Turn Flow */}
        <section id="turn-flow">
          <SectionHeading id="turn-flow">Turn Flow</SectionHeading>
          <Prose>
            Flip four cards face-up to form a Room. You must face{" "}
            <strong class="text-torch-amber">3 of the 4</strong>{" "}
            cards. The remaining card stays and becomes part of the next room.
            You may also avoid an entire room (scooping all 4 to the bottom),
            but never two rooms in a row.
          </Prose>
          <div class="mt-4">
            <RoomFlowDemo />
          </div>
        </section>

        {/* Combat */}
        <section id="combat">
          <SectionHeading id="combat">Combat</SectionHeading>
          <Prose>
            When you face a monster you choose how to fight. Barehanded means
            taking the monster's full value as damage. With a weapon, you
            subtract the weapon's value — the remainder hits your health. A
            weapon strong enough to block the monster entirely deals zero
            damage.
          </Prose>
          <div class="mt-4">
            <CombatDemo />
          </div>
        </section>

        {/* Weapon Degradation */}
        <section id="weapon-degradation">
          <SectionHeading id="weapon-degradation">
            Weapon Degradation
          </SectionHeading>
          <Prose>
            Once you use a weapon against a monster, it can only be used against
            monsters with a{" "}
            <strong class="text-torch-amber">lower or equal rank</strong>{" "}
            than the last monster it slew. The weapon stays equipped even when
            it can no longer be used — it might still be useful for weaker
            monsters later. Remember, you can{" "}
            <strong class="text-torch-amber">
              always choose to fight barehanded
            </strong>{" "}
            instead of using your weapon, even against monsters your weapon
            could handle.
          </Prose>
          <div class="mt-4">
            <WeaponDegradationDemo />
          </div>
        </section>

        {/* Health Potions */}
        <section id="health-potions">
          <SectionHeading id="health-potions">Health Potions</SectionHeading>
          <Prose>
            Potions restore health equal to their rank, but your health can
            never exceed 20, and you may only use{" "}
            <strong class="text-torch-amber">one potion per turn</strong>. If
            you encounter two potions in the same room, the second is simply
            discarded.
          </Prose>
          <div class="mt-4">
            <HealthPotionDemo />
          </div>
        </section>

        {/* Room Avoidance */}
        <section id="room-avoidance">
          <SectionHeading id="room-avoidance">Room Avoidance</SectionHeading>
          <Prose>
            If the room looks dangerous, you may avoid it entirely — scoop all
            four cards in one motion and place them at the bottom of the
            Dungeon. However, you{" "}
            <strong class="text-blood-red">
              cannot avoid two rooms in a row
            </strong>
            . If you avoided the last room, you must face this one.
          </Prose>
        </section>

        {/* Game Interface */}
        <section id="game-interface">
          <SectionHeading id="game-interface">Game Interface</SectionHeading>
          <Prose>
            Five buttons appear in the top-right corner of the screen while you
            are playing.
          </Prose>
          <div class="mt-4 space-y-4">
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-5 h-5"
                >
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                  <polyline points="10 17 5 12 10 7" />
                  <line x1="15" y1="12" x2="5" y2="12" />
                </svg>
              </div>
              <div>
                <h3 class="font-heading text-torch-amber text-lg">
                  Flee the Dungeon
                </h3>
                <Prose>
                  Returns you to the main menu. Your game is not lost — use the
                  {" "}
                  <strong class="text-torch-amber">Copy Link</strong>{" "}
                  button to copy your game URL before fleeing, and you can
                  resume your run anytime by visiting that link.
                </Prose>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="shrink-0 w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment font-heading text-lg">
                ?
              </div>
              <div>
                <h3 class="font-heading text-torch-amber text-lg">Rules</h3>
                <Prose>
                  Opens the full rules panel without leaving the game. Useful
                  when you need a reminder mid-run.
                </Prose>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="shrink-0 w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="w-5 h-5"
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h3 class="font-heading text-torch-amber text-lg">
                  Death Ledger
                </h3>
                <Prose>
                  Shows the top scores from all completed runs. Your current
                  game is highlighted once it ends.
                </Prose>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="shrink-0 w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-5 h-5"
                >
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div>
                <h3 class="font-heading text-torch-amber text-lg">Copy Link</h3>
                <Prose>
                  Copies a shareable URL for your current game to the clipboard.
                  Anyone with the link can view your run and resume it if it is
                  still in progress.
                </Prose>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="shrink-0 w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-5 h-5"
                >
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <h3 class="font-heading text-torch-amber text-lg">
                  Send Feedback
                </h3>
                <Prose>
                  Opens a panel where you can whisper a message to the innkeeper
                  — bug reports, ideas, or anything else on your mind. Anonymous
                  by default; an optional email field lets you leave a way to be
                  reached.
                </Prose>
              </div>
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section id="keyboard-shortcuts">
          <SectionHeading id="keyboard-shortcuts">
            Keyboard Shortcuts
          </SectionHeading>
          <Prose>
            You can control the game entirely from the keyboard. Action keys
            only work when the corresponding action is available.
          </Prose>
          <div class="mt-4 overflow-x-auto">
            <table class="w-full font-body text-sm border-collapse">
              <thead>
                <tr class="border-b border-dungeon-border">
                  <th class="text-left text-parchment-dark py-2 pr-6 font-body font-normal">
                    Key
                  </th>
                  <th class="text-left text-parchment-dark py-2 font-body font-normal">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dungeon-border/50">
                {[
                  ["← / →", "Navigate cards in the room"],
                  ["Enter", "Select focused card"],
                  ["Escape", "Deselect card / clear focus"],
                  ["W", "Fight with Weapon"],
                  ["B", "Fight Barehanded"],
                  ["A", "Avoid Room"],
                  ["E", "Equip Weapon"],
                  ["D", "Draw a Card (drawing phase)"],
                  ["P", "Drink Potion"],
                  ["?", "Open / close Rules"],
                  ["L", "Open / close the Death Ledger"],
                  ["C", "Copy game link"],
                ].map(([key, description]) => (
                  <tr key={key}>
                    <td class="py-2 pr-6">
                      <kbd class="inline-block px-2 py-0.5 bg-dungeon-surface border border-dungeon-border rounded-sm text-torch-amber font-body text-xs">
                        {key}
                      </kbd>
                    </td>
                    <td class="py-2 text-parchment">{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Scoring */}
        <section id="scoring">
          <SectionHeading id="scoring">Scoring</SectionHeading>
          <Prose>
            If your health reaches zero, the game is over. Find all remaining
            monsters in the Dungeon and subtract their values from your health —
            that negative number is your score. If you clear the entire Dungeon,
            your score is your remaining health (positive). If your last card
            was a potion and you were already at 20, add its value to your
            score.
          </Prose>
          <div class="mt-3 grid grid-cols-2 gap-3 max-w-xs">
            <div class="bg-dungeon-surface border border-blood-red rounded-sm p-3 text-center">
              <div class="font-heading text-blood-red text-xl">-17</div>
              <div class="font-body text-xs text-parchment-dark mt-1">
                Died, monsters remain
              </div>
            </div>
            <div class="bg-dungeon-surface border border-potion-green rounded-sm p-3 text-center">
              <div class="font-heading text-potion-green text-xl">+12</div>
              <div class="font-body text-xs text-parchment-dark mt-1">
                Dungeon cleared!
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer CTA */}
      {!embedded && (
        <footer class="border-t border-dungeon-border bg-dungeon-surface mt-12 py-10 text-center">
          <p class="font-body text-parchment-dark text-sm mb-4">
            Ready to face the dungeon?
          </p>
          <a
            href="/play"
            class="inline-block px-6 py-3 bg-torch-amber text-ink font-heading text-lg rounded-sm hover:bg-torch-glow transition-colors"
          >
            Enter the Dungeon
          </a>
          <p class="font-body text-parchment-dark/50 text-xs text-center mt-8 max-w-3xl mx-auto px-4">
            This is an unofficial fan-made implementation. Scoundrel was
            designed{" "}
            <a
              href="http://stfj.net/art/2011/Scoundrel.pdf"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-parchment-dark underline transition-colors duration-200"
            >
              by Zach Gage and Kurt Bieg
            </a>
            . This app is not affiliated with, endorsed by, or associated with
            the original authors in any way.
          </p>
        </footer>
      )}
    </div>
  );
}
