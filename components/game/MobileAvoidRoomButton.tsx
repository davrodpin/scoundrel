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
    <div class="flex justify-center my-2">
      <button
        type="button"
        class="px-6 py-3 text-sm rounded-sm border font-body transition-colors duration-200 bg-torch-amber text-white border-torch-amber hover:bg-torch-glow"
        onClick={onClick}
        disabled={pending}
      >
        {pending ? "Avoiding Room…" : "Avoid Room"}
      </button>
    </div>
  );
}
