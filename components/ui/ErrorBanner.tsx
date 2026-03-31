/**
 * components/ui/ErrorBanner.tsx
 * Inline dismissible error banner used inside the chat widget.
 */

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mx-3 mb-2"
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="text-red-400 hover:text-red-600 leading-none shrink-0"
      >
        ×
      </button>
    </div>
  );
}
