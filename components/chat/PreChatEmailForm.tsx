/**
 * components/chat/PreChatEmailForm.tsx
 * Shown when the chat widget first opens (before the conversation begins).
 * Captures the visitor's email, validates it, and calls onSubmit.
 * A "Skip" option allows visitors to proceed without providing an email.
 */

"use client";

import { useState, FormEvent } from "react";
import Spinner from "@/components/ui/Spinner";

interface PreChatEmailFormProps {
  onSubmit: (email: string) => void;
  onSkip: () => void;
  isSubmitting: boolean;
  themeColor: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PreChatEmailForm({
  onSubmit,
  onSkip,
  isSubmitting,
  themeColor,
}: PreChatEmailFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function validate(): boolean {
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }
    setError("");
    return true;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(email.trim());
  }

  return (
    <div className="flex flex-col flex-1 px-5 py-6 justify-center">
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-4 mx-auto text-sm font-bold"
        style={{ backgroundColor: themeColor, color: "#111827" }}
      >
        TC
      </div>

      {/* Heading */}
      <p className="text-sm font-semibold text-gray-900 text-center mb-1">
        Welcome to Technocure
      </p>
      <p className="text-xs text-gray-500 text-center mb-5 leading-relaxed">
        Share your email so our team can follow up with you after this
        conversation.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        {/* Email input */}
        <div>
          <input
            type="email"
            placeholder="Your email address"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            className={`w-full text-sm border rounded-lg px-3 py-2 outline-none transition
              focus:ring-1 focus:ring-opacity-50
              ${error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}
          />
          {error && (
            <p className="mt-1 text-[10px] text-red-500">{error}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg transition disabled:opacity-60"
          style={{ backgroundColor: themeColor, color: "#111827" }}
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" />
              Please wait…
            </>
          ) : (
            "Start Chat"
          )}
        </button>

        {/* Skip */}
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-xs text-gray-400 hover:text-gray-600 transition py-1"
        >
          Skip for now
        </button>
      </form>
    </div>
  );
}
