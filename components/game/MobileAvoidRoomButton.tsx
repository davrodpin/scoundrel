type MobileAvoidRoomButtonProps = {
  enabled: boolean;
  onClick: () => void;
  pending: boolean;
};

export function MobileAvoidRoomButton(
  { enabled, onClick, pending }: MobileAvoidRoomButtonProps,
) {
  if (!enabled) return null;

  return (
    <button
      type="button"
      class="w-full min-h-[48px] px-4 py-2 text-sm rounded-sm border font-body transition-colors duration-200 bg-torch-amber text-white border-torch-amber hover:bg-torch-glow"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? "Avoiding Room…" : "Avoid Room"}
    </button>
  );
}
