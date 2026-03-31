/**
 * components/chat/ChatInput.tsx
 * Controlled text input with send button.
 * Submits on Enter (without Shift) or button click.
 * Disabled while a response is loading.
 */

import { KeyboardEvent, useRef } from "react";
import Spinner from "@/components/ui/Spinner";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  themeColor?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  themeColor = "#4dfe03",
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSubmit();
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder="Type a message…"
        className="
          flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2
          outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100
          disabled:bg-gray-50 disabled:text-gray-400 transition
        "
      />
      <button
        onClick={onSubmit}
        disabled={isLoading || !value.trim()}
        aria-label="Send message"
        className="w-9 h-9 flex items-center justify-center rounded-lg disabled:bg-gray-200 transition shrink-0"
        style={isLoading || !value.trim() ? undefined : { backgroundColor: themeColor }}
      >
        {isLoading ? (
          <Spinner size="sm" className="border-white border-t-transparent" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        )}
      </button>
    </div>
  );
}
