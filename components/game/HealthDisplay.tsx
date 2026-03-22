export type HealthDisplayActionButton = {
  enabled: boolean;
  tooltip: string;
  onClick: () => void;
};

export type HealthDisplayActions = {
  avoidRoom: { enabled: boolean; onClick: () => void };
  fightWithWeapon: HealthDisplayActionButton;
  fightBarehanded: HealthDisplayActionButton;
  equipWeapon: HealthDisplayActionButton;
  drinkPotion: HealthDisplayActionButton;
};

type ToolButtons = {
  onBackToMenu: () => void;
  onCopyLink: () => void;
  onToggleLeaderboard: () => void;
  onToggleRules: () => void;
  onToggleFeedback?: () => void;
  copiedLink: boolean;
};

type HealthDisplayProps = {
  health: number;
  maxHealth: number;
  playerName: string;
  damageFlash?: boolean;
  healFlash?: boolean;
  actions?: HealthDisplayActions;
  toolButtons?: ToolButtons;
};

type ActionButtonDef = {
  label: string;
  color: string;
  button: HealthDisplayActionButton | {
    enabled: boolean;
    tooltip?: string;
    onClick: () => void;
  };
};

function ActionTooltipButton(
  { label, color, enabled, tooltip, onClick }: {
    label: string;
    color: string;
    enabled: boolean;
    tooltip?: string;
    onClick: () => void;
  },
) {
  const btnClass = enabled
    ? `px-4 py-1.5 text-sm rounded-sm border font-body transition-colors duration-200 ${color}`
    : "px-4 py-1.5 text-sm rounded-sm border font-body transition-colors duration-200 bg-dungeon-surface text-parchment-dark border-dungeon-border opacity-40 cursor-not-allowed";

  if (!tooltip || !enabled) {
    return (
      <button
        type="button"
        class={btnClass}
        onClick={enabled ? onClick : undefined}
        disabled={!enabled}
      >
        {label}
      </button>
    );
  }

  return (
    <div class="relative group">
      <button
        type="button"
        class={btnClass}
        onClick={onClick}
        disabled={false}
      >
        {label}
      </button>
      <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap">
        <div class="bg-ink border border-torch-amber text-white text-xs font-body px-3 py-1.5 rounded-sm text-center">
          {tooltip}
        </div>
        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-torch-amber" />
      </div>
    </div>
  );
}

export function HealthDisplay(
  {
    health,
    maxHealth,
    playerName,
    damageFlash,
    healFlash,
    actions,
    toolButtons,
  }: HealthDisplayProps,
) {
  const pct = Math.max(0, (health / maxHealth) * 100);

  let barColor = "bg-potion-green";
  if (pct <= 25) barColor = "bg-blood-bright";
  else if (pct <= 50) barColor = "bg-torch-amber";

  const buttonDefs: ActionButtonDef[] = actions
    ? [
      {
        label: "Avoid Room",
        color:
          "bg-torch-amber text-white border-torch-amber hover:bg-torch-glow",
        button: { ...actions.avoidRoom, tooltip: "" },
      },
      {
        label: "Fight w/ Weapon",
        color:
          "bg-weapon-steel text-white border-weapon-steel hover:border-torch-amber",
        button: actions.fightWithWeapon,
      },
      {
        label: "Fight Barehanded",
        color:
          "bg-blood-red text-white border-blood-red hover:border-blood-bright",
        button: actions.fightBarehanded,
      },
      {
        label: "Equip Weapon",
        color:
          "bg-parchment-dark text-white border-parchment-dark hover:bg-parchment",
        button: actions.equipWeapon,
      },
      {
        label: "Drink Potion",
        color:
          "bg-potion-green text-white border-potion-green hover:border-torch-amber",
        button: actions.drinkPotion,
      },
    ]
    : [];

  return (
    <div
      class={`hidden md:block mb-10 ${
        damageFlash ? "animate-damage-flash" : ""
      } ${healFlash ? "animate-heal-glow" : ""}`}
    >
      <div class="flex w-full border border-dungeon-border bg-dungeon-surface rounded-sm divide-x divide-dungeon-border">
        {/* Name field */}
        <div class="px-5 py-3 flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <span class="text-parchment-dark/70 text-xs font-body uppercase tracking-[0.2em]">
            Hero
          </span>
          <span class="font-heading text-xl text-parchment border-b border-dungeon-border/60 pb-1 leading-tight truncate">
            {playerName}
          </span>
        </div>

        {/* Health field */}
        <div class="px-5 py-3 flex flex-col gap-1.5">
          <span class="text-parchment-dark/70 text-xs font-body uppercase tracking-[0.2em]">
            Vitality
          </span>
          <div class="flex items-baseline gap-2">
            <span class="font-heading text-xl text-parchment leading-tight">
              {health}
            </span>
            <span class="text-parchment-dark/50 font-body text-sm">
              / {maxHealth}
            </span>
          </div>
          <div class="w-36 h-1.5 bg-dungeon-bg rounded-sm border border-dungeon-border/60 overflow-hidden">
            <div
              class={`h-full ${barColor} transition-[width] duration-500`}
              style={`width: ${pct}%`}
            />
          </div>
        </div>

        {/* Actions field */}
        {actions && (
          <div class="px-5 py-3 flex flex-col gap-1.5 min-w-0">
            <span class="text-parchment-dark/70 text-xs font-body uppercase tracking-[0.2em]">
              Actions
            </span>
            <div class="flex flex-wrap gap-1.5">
              {buttonDefs.map(({ label, color, button }) => (
                <ActionTooltipButton
                  key={label}
                  label={label}
                  color={color}
                  enabled={button.enabled}
                  tooltip={"tooltip" in button ? button.tooltip : ""}
                  onClick={button.onClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Menu field */}
        {toolButtons && (
          <div class="px-5 py-3 flex flex-col gap-1.5 flex-shrink-0">
            <span class="text-parchment-dark/70 text-xs font-body uppercase tracking-[0.2em]">
              Menu
            </span>
            <div class="flex gap-1.5">
              {/* Back to menu button */}
              <div class="relative group">
                <button
                  type="button"
                  onClick={toolButtons.onBackToMenu}
                  class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber transition-colors duration-200"
                  aria-label="Flee the Dungeon"
                >
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
                </button>
                <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap">
                  <div class="bg-dungeon-surface border border-dungeon-border text-parchment text-xs font-body px-3 py-1.5 rounded-sm">
                    Flee the Dungeon
                  </div>
                  <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dungeon-border" />
                </div>
              </div>

              {/* Copy link button */}
              <div class="relative group">
                <button
                  type="button"
                  onClick={toolButtons.onCopyLink}
                  class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber transition-colors duration-200"
                  aria-label={toolButtons.copiedLink
                    ? "Link copied!"
                    : "Copy shareable link"}
                >
                  {toolButtons.copiedLink
                    ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="w-5 h-5 text-torch-amber"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )
                    : (
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
                    )}
                </button>
                <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap">
                  <div class="bg-dungeon-surface border border-dungeon-border text-parchment text-xs font-body px-3 py-1.5 rounded-sm">
                    {toolButtons.copiedLink ? "Copied!" : "Copy link"}
                  </div>
                  <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dungeon-border" />
                </div>
              </div>

              {/* Leaderboard button */}
              <div class="relative group">
                <button
                  type="button"
                  class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber transition-colors duration-200"
                  onClick={toolButtons.onToggleLeaderboard}
                  aria-label="The Gravekeeper's Ledger"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="w-5 h-5"
                  >
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap">
                  <div class="bg-dungeon-surface border border-dungeon-border text-parchment text-xs font-body px-3 py-1.5 rounded-sm">
                    The Gravekeeper's Ledger
                  </div>
                  <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dungeon-border" />
                </div>
              </div>

              {/* Rules button */}
              <div class="relative group">
                <button
                  type="button"
                  class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber font-heading text-lg transition-colors duration-200"
                  onClick={toolButtons.onToggleRules}
                  aria-label="Game rules"
                >
                  ?
                </button>
                <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap">
                  <div class="bg-dungeon-surface border border-dungeon-border text-parchment text-xs font-body px-3 py-1.5 rounded-sm">
                    Rules
                  </div>
                  <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dungeon-border" />
                </div>
              </div>

              {/* Feedback button */}
              {toolButtons.onToggleFeedback && (
                <div class="relative group">
                  <button
                    type="button"
                    class="w-9 h-9 flex items-center justify-center rounded-sm bg-dungeon-surface border border-dungeon-border text-parchment hover:border-torch-amber transition-colors duration-200"
                    onClick={toolButtons.onToggleFeedback}
                    aria-label="Send feedback"
                  >
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
                  </button>
                  <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 whitespace-nowrap">
                    <div class="bg-dungeon-surface border border-dungeon-border text-parchment text-xs font-body px-3 py-1.5 rounded-sm">
                      Send Feedback
                    </div>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dungeon-border" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
