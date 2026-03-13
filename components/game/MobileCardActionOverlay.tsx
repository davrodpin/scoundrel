import type { Card } from "@scoundrel/engine";
import { CardImage } from "./CardImage.tsx";
import type { HealthDisplayActions } from "./HealthDisplay.tsx";

type MobileCardActionOverlayProps = {
  card: Card;
  actions: HealthDisplayActions;
  onCancel: () => void;
};

type OverlayButtonDef = {
  label: string;
  color: string;
  enabled: boolean;
  tooltip: string;
  onClick: () => void;
};

export function MobileCardActionOverlay(
  { card, actions, onCancel }: MobileCardActionOverlayProps,
) {
  const buttonDefs: OverlayButtonDef[] = [
    {
      label: "Avoid Room",
      color: "bg-torch-amber text-white border-torch-amber hover:bg-torch-glow",
      enabled: actions.avoidRoom.enabled,
      tooltip: "",
      onClick: actions.avoidRoom.onClick,
    },
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
      class="fixed inset-0 z-40 bg-shadow/80 flex flex-col items-center justify-center md:hidden"
      onClick={onCancel}
    >
      <div
        class="flex flex-col items-center gap-4 px-6 py-6"
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        {/* Selected card */}
        <CardImage card={card} />

        {/* Enabled action buttons */}
        <div class="flex flex-col gap-2 w-full">
          {enabledButtons.map(({ label, color, tooltip, onClick }) => (
            <button
              key={label}
              type="button"
              class={`min-h-[48px] px-4 py-2 text-sm rounded-sm border font-body transition-colors duration-200 ${
                tooltip ? "text-left" : "text-center"
              } ${color}`}
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

        {/* Cancel */}
        <button
          type="button"
          class="w-full min-h-[44px] px-4 py-2 text-sm rounded-sm border font-body transition-colors duration-200 bg-dungeon-surface border-dungeon-border text-parchment hover:border-torch-amber"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
