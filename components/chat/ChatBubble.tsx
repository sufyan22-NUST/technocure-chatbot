/**
 * components/chat/ChatBubble.tsx
 * Renders a single conversation turn as a styled message bubble.
 * User messages align right (blue); assistant messages align left (white).
 */

import type { ChatMessage } from "@/lib/types";

interface ChatBubbleProps {
  message: ChatMessage;
  themeColor?: string;
}

export default function ChatBubble({ message, themeColor = "#4dfe03" }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser ? "rounded-br-sm" : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm"
        }`}
        style={isUser ? { backgroundColor: themeColor, color: "#111111" } : undefined}
      >
        {message.content}
      </div>
    </div>
  );
}
