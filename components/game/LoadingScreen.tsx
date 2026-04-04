/** @jsxImportSource preact */

type LoadingScreenProps = {
  loaded: number;
  total: number;
};

export function LoadingScreen({ loaded, total }: LoadingScreenProps) {
  const pct = total === 0 ? 0 : Math.round((loaded / total) * 100);

  return (
    <div class="min-h-dvh bg-dungeon-bg flex flex-col items-center justify-center gap-6">
      <h2 class="font-heading text-2xl text-parchment">
        Preparing the Dungeon...
      </h2>
      <div
        class="w-64 h-3 bg-dungeon-surface border border-dungeon-border rounded-sm overflow-hidden"
        role="progressbar"
        aria-valuenow={loaded}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          class="h-full bg-torch-amber transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p class="text-parchment-dark font-body text-sm">
        Loading cards... {loaded} / {total}
      </p>
    </div>
  );
}
