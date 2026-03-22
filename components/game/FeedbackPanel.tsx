/** @jsxImportSource preact */
import { useState } from "preact/hooks";

type FeedbackPanelProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (message: string, email?: string) => Promise<void>;
  submitting: boolean;
  submitted: boolean;
  errorMsg: string | null;
  maxMessageLength: number;
};

export function FeedbackPanel(
  {
    open,
    onClose,
    onSubmit,
    submitting,
    submitted,
    errorMsg,
    maxMessageLength,
  }: FeedbackPanelProps,
) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit() {
    const trimmedEmail = email.trim();
    onSubmit(message.trim(), trimmedEmail || undefined);
  }

  function handleClose() {
    setMessage("");
    setEmail("");
    onClose();
  }

  const canSubmit = message.trim().length > 0 && !submitting;

  return (
    <>
      {/* Backdrop */}
      <div
        class={`fixed inset-0 bg-shadow/60 z-60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Slide-in panel */}
      <div
        class={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-dungeon-surface border-l border-dungeon-border z-60 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div class="flex items-center justify-between px-5 py-4 border-b border-dungeon-border">
          <h2 class="font-heading text-xl text-torch-amber">
            Whisper to the Innkeeper
          </h2>
          <button
            type="button"
            class="text-parchment-dark hover:text-parchment transition-colors duration-200 text-xl leading-none"
            onClick={handleClose}
            aria-label="Close feedback panel"
          >
            &#x2715;
          </button>
        </div>

        {/* Content */}
        <div class="overflow-y-auto h-[calc(100%-3.5rem)] px-5 py-4">
          {submitted
            ? (
              <div class="flex flex-col items-center justify-center h-full text-center gap-4">
                <div class="text-parchment font-heading text-2xl">
                  Message Delivered
                </div>
                <p class="text-parchment-dark font-body text-sm">
                  Your words have reached the innkeeper. Thank you.
                </p>
              </div>
            )
            : (
              <div class="flex flex-col gap-4">
                <p class="text-parchment-dark font-body text-sm">
                  Share your thoughts — bugs, ideas, or tales from the dungeon.
                  Anonymous by default.
                </p>

                <div class="flex flex-col gap-1.5">
                  <label class="text-parchment-dark/70 text-xs font-body uppercase tracking-[0.2em]">
                    Your Message
                  </label>
                  <textarea
                    class="w-full px-4 py-2 rounded-sm bg-dungeon-bg border border-dungeon-border text-parchment font-body placeholder-parchment-dark/50 focus:outline-none focus:border-torch-amber transition-colors duration-200 resize-none"
                    rows={6}
                    maxLength={maxMessageLength}
                    placeholder="Speak freely, traveller..."
                    value={message}
                    onInput={(e) =>
                      setMessage((e.target as HTMLTextAreaElement).value)}
                    disabled={submitting}
                  />
                  <div class="text-parchment-dark/50 font-body text-xs text-right">
                    {message.length} / {maxMessageLength}
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-parchment-dark/70 text-xs font-body uppercase tracking-[0.2em]">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    class="w-full px-4 py-2 rounded-sm bg-dungeon-bg border border-dungeon-border text-parchment font-body placeholder-parchment-dark/50 focus:outline-none focus:border-torch-amber transition-colors duration-200"
                    placeholder="So I can reply if needed..."
                    value={email}
                    onInput={(e) =>
                      setEmail((e.target as HTMLInputElement).value)}
                    disabled={submitting}
                  />
                </div>

                {errorMsg && (
                  <p class="text-blood-bright font-body text-sm">{errorMsg}</p>
                )}

                <button
                  type="button"
                  class="w-full px-6 py-3 rounded-sm border bg-torch-amber text-ink border-torch-amber hover:bg-torch-glow font-body transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {submitting ? "Delivering..." : "Send Message"}
                </button>
              </div>
            )}
        </div>
      </div>
    </>
  );
}
