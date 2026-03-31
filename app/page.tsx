/**
 * app/page.tsx
 * Public homepage — renders the Technocure landing content and mounts
 * the chat widget in the bottom-right corner.
 */

import ChatWidget from "@/components/chat/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-6">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-xl">
        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
          Technocure.co.za
        </span>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          Technology Solutions <br className="hidden sm:block" />
          for Modern Business
        </h1>
        <p className="text-gray-500 text-base">
          Custom software, cloud infrastructure, cybersecurity, and managed IT
          support — built for South African businesses.
        </p>
        <a
          href="mailto:hello@technocure.co.za"
          className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-lg transition"
        >
          Get in touch
        </a>
      </div>

      {/* Services grid */}
      <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full">
        {SERVICES.map(({ icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium text-gray-600 text-center">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Chat widget (client component, floating) */}
      <ChatWidget />
    </main>
  );
}

const SERVICES = [
  { icon: "💻", label: "Custom Software" },
  { icon: "☁️", label: "Cloud & Infra" },
  { icon: "🔒", label: "Cybersecurity" },
  { icon: "🛠️", label: "Managed IT" },
];
