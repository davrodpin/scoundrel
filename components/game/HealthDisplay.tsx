type HealthDisplayProps = {
  health: number;
  maxHealth: number;
  playerName: string;
  damageFlash?: boolean;
  healFlash?: boolean;
};

export function HealthDisplay(
  { health, maxHealth, playerName, damageFlash, healFlash }: HealthDisplayProps,
) {
  const pct = Math.max(0, (health / maxHealth) * 100);

  let barColor = "bg-potion-green";
  if (pct <= 25) barColor = "bg-blood-bright";
  else if (pct <= 50) barColor = "bg-torch-amber";

  return (
    <div
      class={`mb-6 p-3 rounded-sm ${
        damageFlash ? "animate-damage-flash" : ""
      } ${healFlash ? "animate-heal-glow" : ""}`}
    >
      <div class="flex items-center gap-6 justify-center">
        <div class="text-left">
          <div class="text-parchment-dark text-xs font-body uppercase tracking-widest mb-0.5">
            Adventurer
          </div>
          <div class="font-heading text-xl text-parchment">{playerName}</div>
        </div>
        <div class="text-center">
          <div class="font-heading text-3xl text-parchment mb-2">
            {health} / {maxHealth}
          </div>
          <div class="w-48 h-3 bg-dungeon-surface rounded-sm border border-dungeon-border overflow-hidden">
            <div
              class={`h-full ${barColor} transition-[width] duration-500`}
              style={`width: ${pct}%`}
            />
          </div>
          <div class="text-parchment-dark text-sm mt-1 font-body">Health</div>
        </div>
      </div>
    </div>
  );
}
