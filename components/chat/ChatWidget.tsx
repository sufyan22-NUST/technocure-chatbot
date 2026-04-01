/**
 * components/chat/ChatWidget.tsx
 * Full stateful chat widget. Applies branding metadata received from the API
 * (theme_color, avatar_url, font_family) to the widget UI at runtime.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import LeadCaptureForm from "./LeadCaptureForm";
import PreChatEmailForm from "./PreChatEmailForm";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";
import type {
  BrandingMeta,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ConversationTurn,
  LeadFormValues,
  Lead,
} from "@/lib/types";

// ── Constants ──────────────────────────────────────────────────────────────────

const EMAIL_CAPTURE_KEY = "tc_email_captured";
/** Milliseconds of inactivity before the conversation summary is sent. */
const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

/** Default branding shown before the first API response arrives. */
const DEFAULT_BRANDING: BrandingMeta = {
  theme_color: "#4dfe03",
  logo_url: "https://drive.google.com/file/d/14q9TxCTWJO_qjKbihc2U5N_MdBwg0xFw/view?usp=drive_link",
  avatar_url: "https://drive.google.com/file/d/1lYkAA_z51dsKBchBR31rLo90QB87ZDZR/view?usp=drive_link",
  font_family: "Inter",
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome. I am the Technocure Assistant, and I am here to help you explore how we can support your organisation's growth and transformation. Please feel free to ask me anything — no question is too small, and I am here to ensure you leave with clarity and confidence.",
  timestamp: new Date(),
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [pendingLeadMessage, setPendingLeadMessage] = useState<string | null>(null);
  const [branding, setBranding] = useState<BrandingMeta>(DEFAULT_BRANDING);

  // Pre-chat email capture
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  useEffect(() => {
    // Show email form the first time the widget opens (if not already captured)
    if (isOpen && !localStorage.getItem(EMAIL_CAPTURE_KEY)) {
      setShowEmailForm(true);
    }
  }, [isOpen]);

  const sessionId = useRef<string>(uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Stable ref so sendMessage always reads current messages without stale closures
  const messagesRef = useRef<ChatMessage[]>([WELCOME_MESSAGE]);
  // Inactivity timer — fires summary after INACTIVITY_MS of no new messages
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const summarySentRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ── Inactivity summary ────────────────────────────────────────────────────

  const sendSummary = useCallback(async () => {
    if (summarySentRef.current) return;
    const turns = messagesRef.current.filter((m) => m.id !== "welcome");
    if (turns.length < 2) return; // nothing meaningful to summarise

    summarySentRef.current = true;
    const email = localStorage.getItem(EMAIL_CAPTURE_KEY);
    const visitorEmail = email && email !== "skipped" ? email : undefined;

    const payload = {
      email: visitorEmail,
      messages: turns.map((m) => ({ role: m.role, content: m.content })),
    };

    try {
      await fetch("/api/send-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Best-effort — never surface email errors to the visitor
    }
  }, []);

  /** Resets the inactivity countdown on every new message. */
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(sendSummary, INACTIVITY_MS);
  }, [sendSummary]);

  // Start/reset timer whenever messages change (only after first real exchange)
  useEffect(() => {
    const realMessages = messages.filter((m) => m.id !== "welcome");
    if (realMessages.length >= 2) resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Send summary when the page/tab is closed (best-effort via sendBeacon)
  useEffect(() => {
    function handleUnload() {
      if (summarySentRef.current) return;
      const turns = messagesRef.current.filter((m) => m.id !== "welcome");
      if (turns.length < 2) return;
      const email = localStorage.getItem(EMAIL_CAPTURE_KEY);
      const visitorEmail = email && email !== "skipped" ? email : undefined;
      const payload = JSON.stringify({
        email: visitorEmail,
        messages: turns.map((m) => ({ role: m.role, content: m.content })),
      });
      navigator.sendBeacon("/api/send-summary", new Blob([payload], { type: "application/json" }));
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showLeadForm]);

  // ── API call ───────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (userText: string, lead?: Omit<Lead, "id" | "created_at">) => {
      setError(null);
      setIsLoading(true);

      // Snapshot history from current messages (before appending the new user message)
      const history: ConversationTurn[] = messagesRef.current
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: userText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const payload: ChatRequest = {
        message: userText,
        sessionId: sessionId.current,
        history,
        ...(lead ? { lead } : {}),
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data: ChatResponse | { error: string } = await res.json();

        if (!res.ok || "error" in data) {
          const msg = "error" in data ? data.error : "Unexpected server error.";
          setError(msg);
          return;
        }

        const { reply, savedLead, shouldCaptureLead, branding: responseBranding } =
          data as ChatResponse;

        if (responseBranding) setBranding(responseBranding);

        const assistantMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (savedLead) setLeadSaved(true);
        if (shouldCaptureLead && !leadSaved) {
          setPendingLeadMessage(userText);
          setShowLeadForm(true);
        }
      } catch {
        setError("Network error — please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [leadSaved]
  );

  // ── Event handlers ─────────────────────────────────────────────────────────

  async function handleEmailSubmit(email: string) {
    setIsSubmittingEmail(true);
    try {
      await fetch("/api/capture-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sessionId: sessionId.current }),
      });
    } catch {
      // Best-effort — don't block the chat if this fails
    } finally {
      localStorage.setItem(EMAIL_CAPTURE_KEY, email);
      setShowEmailForm(false);
      setIsSubmittingEmail(false);
    }
  }

  function handleEmailSkip() {
    localStorage.setItem(EMAIL_CAPTURE_KEY, "skipped");
    setShowEmailForm(false);
  }

  function handleSend() {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue("");
    sendMessage(text);
  }

  async function handleLeadSubmit(values: LeadFormValues) {
    setIsSubmittingLead(true);
    const lead: Omit<Lead, "id" | "created_at"> = {
      name: values.name,
      email: values.email,
      company: values.company || null,
      message: pendingLeadMessage ?? "Contact request from chat widget",
      session_id: sessionId.current,
    };
    await sendMessage(
      `My details: ${values.name}, ${values.email}${values.company ? `, ${values.company}` : ""}.`,
      lead
    );
    setShowLeadForm(false);
    setPendingLeadMessage(null);
    setIsSubmittingLead(false);
  }

  function handleLeadSkip() {
    setShowLeadForm(false);
    setPendingLeadMessage(null);
  }

  // ── Derived branding styles ────────────────────────────────────────────────

  const headerStyle = { backgroundColor: branding.theme_color };
  const buttonStyle = { backgroundColor: branding.theme_color };
  const fontStyle = { fontFamily: branding.font_family };

  // Determine readable text color based on theme (dark text on light bg, vice versa)
  const isLightTheme =
    parseInt(branding.theme_color.replace("#", ""), 16) > 0xffffff / 2;
  const textOnTheme = isLightTheme ? "#111111" : "#ffffff";
  const subtextOnTheme = isLightTheme ? "#333333" : "#e5e5e5";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-5 w-[340px] h-[520px] bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50"
          style={fontStyle}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-3 shrink-0"
            style={headerStyle}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
              style={{ backgroundColor: isLightTheme ? "#00000020" : "#ffffff30", color: textOnTheme }}
            >
              <img
                src={branding.avatar_url}
                alt="Technocure Assistant"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (e.currentTarget.parentElement as HTMLElement).innerText = "TC";
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight" style={{ color: textOnTheme }}>
                Technocure Assistant
              </p>
              <p className="text-[10px]" style={{ color: subtextOnTheme }}>
                {isLoading ? "Typing…" : "Online"}
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="transition text-xl leading-none"
              style={{ color: textOnTheme }}
            >
              ×
            </button>
          </div>

          {/* Pre-chat email capture */}
          {showEmailForm && (
            <PreChatEmailForm
              onSubmit={handleEmailSubmit}
              onSkip={handleEmailSkip}
              isSubmitting={isSubmittingEmail}
              themeColor={branding.theme_color}
            />
          )}

          {/* Messages + input (hidden while email form is shown) */}
          {!showEmailForm && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} themeColor={branding.theme_color} />
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                      <Spinner size="sm" />
                    </div>
                  </div>
                )}
                {leadSaved && !showLeadForm && (
                  <p className="text-center text-[10px] text-green-600 font-medium">
                    ✓ Details received — we&apos;ll be in touch soon.
                  </p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error banner */}
              {error && (
                <ErrorBanner message={error} onDismiss={() => setError(null)} />
              )}

              {/* Lead capture form */}
              {showLeadForm && !leadSaved && (
                <LeadCaptureForm
                  onSubmit={handleLeadSubmit}
                  onSkip={handleLeadSkip}
                  isSubmitting={isSubmittingLead}
                />
              )}

              {/* Input */}
              {!showLeadForm && (
                <div className="shrink-0">
                  <ChatInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSubmit={handleSend}
                    isLoading={isLoading}
                    themeColor={branding.theme_color}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-5 w-[52px] h-[52px] rounded-full shadow-xl flex items-center justify-center transition-opacity z-50 hover:opacity-90"
        style={buttonStyle}
      >
        {isOpen ? (
          <span className="text-2xl leading-none" style={{ color: textOnTheme }}>×</span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={textOnTheme}
            className="w-5 h-5"
          >
            <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
          </svg>
        )}
      </button>
    </>
  );
}
