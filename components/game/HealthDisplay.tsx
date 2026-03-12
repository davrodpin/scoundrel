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

type HealthDisplayProps = {
  health: number;
  maxHealth: number;
  playerName: string;
  damageFlash?: boolean;
  healFlash?: boolean;
  actions?: HealthDisplayActions;
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
    ? `px-3 py-1 text-xs rounded-sm border font-body transition-colors duration-200 ${color}`
    : "px-3 py-1 text-xs rounded-sm border font-body transition-colors duration-200 bg-dungeon-surface text-parchment-dark border-dungeon-border opacity-40 cursor-not-allowed";

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
        <div class="bg-dungeon-surface border border-dungeon-border text-parchment text-xs font-body px-3 py-1.5 rounded-sm text-center">
          {tooltip}
        </div>
        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dungeon-border" />
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
        color: "bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow",
        button: { ...actions.avoidRoom, tooltip: "" },
      },
      {
        label: "Fight w/ Weapon",
        color:
          "bg-weapon-steel text-parchment border-weapon-steel hover:border-torch-amber",
        button: actions.fightWithWeapon,
      },
      {
        label: "Fight Barehanded",
        color:
          "bg-blood-red text-parchment border-blood-red hover:border-blood-bright",
        button: actions.fightBarehanded,
      },
      {
        label: "Equip Weapon",
        color:
          "bg-parchment-dark text-ink border-parchment-dark hover:bg-parchment",
        button: actions.equipWeapon,
      },
      {
        label: "Drink Potion",
        color:
          "bg-potion-green text-parchment border-potion-green hover:border-torch-amber",
        button: actions.drinkPotion,
      },
    ]
    : [];

  return (
    <div
      class={`mb-10 ${damageFlash ? "animate-damage-flash" : ""} ${
        healFlash ? "animate-heal-glow" : ""
      }`}
    >
      <div class="inline-flex border border-dungeon-border bg-dungeon-surface rounded-sm divide-x divide-dungeon-border">
        {/* Name field */}
        <div class="px-5 py-3 flex flex-col gap-1.5 min-w-[140px]">
          <span class="text-parchment-dark/70 text-[10px] font-body uppercase tracking-[0.2em]">
            Adventurer
          </span>
          <span class="font-heading text-xl text-parchment border-b border-dungeon-border/60 pb-1 leading-tight">
            {playerName}
          </span>
        </div>

        {/* Health field */}
        <div class="px-5 py-3 flex flex-col gap-1.5">
          <span class="text-parchment-dark/70 text-[10px] font-body uppercase tracking-[0.2em]">
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
          <div class="px-5 py-3 flex flex-col gap-1.5">
            <span class="text-parchment-dark/70 text-[10px] font-body uppercase tracking-[0.2em]">
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
      </div>
    </div>
  );
}
