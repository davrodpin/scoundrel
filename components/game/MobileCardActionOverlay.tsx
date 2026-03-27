import type { Card } from "@scoundrel/engine";
import { CardImage } from "./CardImage.tsx";
import type { HealthDisplayActions } from "./HealthDisplay.tsx";
import type { DeckInfo } from "@scoundrel/game";

type MobileCardActionOverlayProps = {
  card: Card;
  actions: HealthDisplayActions;
  onCancel: () => void;
  deck?: DeckInfo;
  pendingLabel?: string | null;
};

type OverlayButtonDef = {
  label: string;
  color: string;
  enabled: boolean;
  tooltip: string;
  onClick: () => void;
};

export function MobileCardActionOverlay(
  { card, actions, onCancel, deck, pendingLabel }: MobileCardActionOverlayProps,
) {
  const isPending = !!pendingLabel;
  const buttonDefs: OverlayButtonDef[] = [
    {
      label: "Fight w/ Weapon",
      color:
        "bg-weapon-steel text-white border-weapon-steel hover:border-torch-amber",
      enabled: actions.fightWithWeapon.enabled,
      tooltip: actions.fightWithWeapon.tooltip,
      onClick: actions.fightWithWeapon.onClick,
    },
    {
      label: "Fight Barehanded",
      color:
        "bg-blood-red text-white border-blood-red hover:border-blood-bright",
      enabled: actions.fightBarehanded.enabled,
      tooltip: actions.fightBarehanded.tooltip,
      onClick: actions.fightBarehanded.onClick,
    },
    {
      label: "Equip Weapon",
      color:
        "bg-parchment-dark text-white border-parchment-dark hover:bg-parchment",
      enabled: actions.equipWeapon.enabled,
      tooltip: actions.equipWeapon.tooltip,
      onClick: actions.equipWeapon.onClick,
    },
    {
      label: "Drink Potion",
      color:
        "bg-potion-green text-white border-potion-green hover:border-torch-amber",
      enabled: actions.drinkPotion.enabled,
      tooltip: actions.drinkPotion.tooltip,
      onClick: actions.drinkPotion.onClick,
    },
  ];

  const enabledButtons = buttonDefs.filter((b) => b.enabled);

  return (
    <div
      class={`fixed inset-0 z-40 overflow-y-auto md:hidden${isPending ? " pointer-events-none" : ""}`}
      onClick={isPending ? undefined : onCancel}
    >
      <div class="flex min-h-full items-center justify-center p-4 bg-shadow/80">
        <div
          class="flex flex-col items-center gap-3 px-6 py-4"
          onClick={(e: MouseEvent) => e.stopPropagation()}
        >
          {/* Selected card */}
          <CardImage
            card={card}
            deck={deck}
            sizeClass="w-[clamp(160px,45vw,260px)]"
          />

          {/* Enabled action buttons */}
          <div class="flex flex-col gap-2 w-full">
            {enabledButtons.map(({ label, color, tooltip, onClick }) => (
              <button
                key={label}
                type="button"
                class={`px-4 py-1.5 text-xs rounded-sm border font-body transition-colors duration-200 text-center ${color}`}
                onClick={onClick}
              >
                <span class="block leading-tight">{label}</span>
                {tooltip && (
                  <span class="block text-xs opacity-80 leading-tight mt-0.5">
                    {tooltip}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Pending label or Cancel */}
          {isPending
            ? (
              <div class="w-full px-4 py-1.5 text-xs text-center font-body text-torch-amber animate-pulse">
                {pendingLabel}
              </div>
            )
            : (
              <button
                type="button"
                class="w-full px-4 py-1.5 text-xs rounded-sm border font-body transition-colors duration-200 bg-dungeon-surface border-dungeon-border text-parchment hover:border-torch-amber"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
