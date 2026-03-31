/**
 * app/embed/page.tsx
 * Bare embed page — renders only the ChatWidget with no surrounding UI.
 * Used by the WordPress widget loader (public/widget.js) via iframe.
 */

import ChatWidget from "@/components/chat/ChatWidget";

export const metadata = {
  robots: "noindex, nofollow",
};

export default function EmbedPage() {
  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background: transparent !important;
          overflow: hidden;
        }
      `}</style>
      <ChatWidget />
    </>
  );
}
