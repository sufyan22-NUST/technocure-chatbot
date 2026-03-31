/**
 * components/chat/LeadCaptureForm.tsx
 * Inline form rendered inside the chat widget when the API signals
 * lead-capture intent (`shouldCaptureLead: true`).
 *
 * On submit it calls `onSubmit` with the validated form values so the
 * parent ChatWidget can include them in the next API request.
 */

"use client";

import { useState, FormEvent } from "react";
import type { LeadFormValues } from "@/lib/types";
import Spinner from "@/components/ui/Spinner";

interface LeadCaptureFormProps {
  onSubmit: (values: LeadFormValues) => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const INITIAL: LeadFormValues = { name: "", email: "", company: "" };

export default function LeadCaptureForm({
  onSubmit,
  onSkip,
  isSubmitting,
}: LeadCaptureFormProps) {
  const [values, setValues] = useState<LeadFormValues>(INITIAL);
  const [errors, setErrors] = useState<Partial<LeadFormValues>>({});

  function validate(): boolean {
    const next: Partial<LeadFormValues> = {};
    if (!values.name.trim()) next.name = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = "A valid email is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(values);
  }

  function field(key: keyof LeadFormValues) {
    return {
      value: values[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setValues((v) => ({ ...v, [key]: e.target.value })),
    };
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-3 mb-3 bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3"
    >
      <p className="text-xs font-medium text-blue-800">
        Leave your details and our team will follow up with you shortly.
      </p>

      {/* Name */}
      <div>
        <input
          type="text"
          placeholder="Full name *"
          autoComplete="name"
          className={inputClass(!!errors.name)}
          {...field("name")}
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <input
          type="email"
          placeholder="Email address *"
          autoComplete="email"
          className={inputClass(!!errors.email)}
          {...field("email")}
        />
        {errors.email && <p className={errorClass}>{errors.email}</p>}
      </div>

      {/* Company (optional) */}
      <div>
        <input
          type="text"
          placeholder="Company (optional)"
          autoComplete="organization"
          className={inputClass(false)}
          {...field("company")}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-medium py-2 rounded-lg transition"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="border-white border-t-transparent" />
              Sending…
            </>
          ) : (
            "Send details"
          )}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          Skip
        </button>
      </div>
    </form>
  );
}

// ── Style helpers ──────────────────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return `w-full text-xs border rounded-lg px-3 py-2 outline-none transition
    focus:ring-1 focus:ring-blue-200 focus:border-blue-400
    ${hasError ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`;
}

const errorClass = "mt-1 text-[10px] text-red-500";
