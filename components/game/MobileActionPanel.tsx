import type { HealthDisplayActions } from "./HealthDisplay.tsx";

type MobileActionPanelProps = {
  actions: HealthDisplayActions;
};

type MobileButtonDef = {
  label: string;
  color: string;
  enabled: boolean;
  tooltip: string;
  onClick: () => void;
};

export function MobileActionPanel({ actions }: MobileActionPanelProps) {
  const buttonDefs: MobileButtonDef[] = [
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

  return (
    <div class="flex md:hidden flex-col gap-2 w-full mt-2">
      <div class="grid grid-cols-2 gap-2">
        {buttonDefs.map(({ label, color, enabled, tooltip, onClick }) => {
          const btnClass = enabled
            ? `min-h-[48px] px-3 py-2 text-sm rounded-sm border font-body transition-colors duration-200 text-left ${color}`
            : "min-h-[48px] px-3 py-2 text-sm rounded-sm border font-body transition-colors duration-200 text-left bg-dungeon-surface text-parchment-dark border-dungeon-border opacity-40 cursor-not-allowed";

          return (
            <button
              key={label}
              type="button"
              class={btnClass}
              onClick={enabled ? onClick : undefined}
              disabled={!enabled}
            >
              <span class="block leading-tight">{label}</span>
              {enabled && tooltip && (
                <span class="block text-xs opacity-80 leading-tight mt-0.5">
                  {tooltip}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
