type HealthDisplayProps = {
  health: number;
  maxHealth: number;
  playerName: string;
  damageFlash?: boolean;
  healFlash?: boolean;
  onAvoidRoom?: () => void;
  avoidEnabled?: boolean;
};

export function HealthDisplay(
  {
    health,
    maxHealth,
    playerName,
    damageFlash,
    healFlash,
    onAvoidRoom,
    avoidEnabled,
  }: HealthDisplayProps,
) {
  const pct = Math.max(0, (health / maxHealth) * 100);

  let barColor = "bg-potion-green";
  if (pct <= 25) barColor = "bg-blood-bright";
  else if (pct <= 50) barColor = "bg-torch-amber";

  return (
    <div
      class={`mb-6 ${damageFlash ? "animate-damage-flash" : ""} ${
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
        {onAvoidRoom !== undefined && (
          <div class="px-5 py-3 flex flex-col gap-1.5">
            <span class="text-parchment-dark/70 text-[10px] font-body uppercase tracking-[0.2em]">
              Actions
            </span>
            <button
              type="button"
              class={avoidEnabled
                ? "px-4 py-1.5 rounded-sm border font-body text-sm transition-colors duration-200 bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow"
                : "px-4 py-1.5 rounded-sm border font-body text-sm transition-colors duration-200 bg-dungeon-surface text-parchment-dark border-dungeon-border opacity-50 cursor-not-allowed"}
              onClick={avoidEnabled ? onAvoidRoom : undefined}
              disabled={!avoidEnabled}
            >
              Avoid Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
