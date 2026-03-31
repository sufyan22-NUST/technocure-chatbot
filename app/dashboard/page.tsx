/**
 * app/dashboard/page.tsx
 * Server-rendered admin dashboard — displays all captured leads.
 *
 * Access control: checks the `x-admin-secret` request header against the
 * ADMIN_SECRET environment variable. For production, replace with a proper
 * auth layer (Supabase Auth, NextAuth, etc.).
 *
 * Route: /dashboard
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabaseClient";
import type { Lead } from "@/lib/types";

// ── Data fetching ──────────────────────────────────────────────────────────────

async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabaseServer
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[dashboard] Failed to fetch leads:", error.message);
    return [];
  }

  return (data as Lead[]) ?? [];
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  // Primitive header-based auth guard (MVP only)
  const headersList = headers();
  const adminSecret = headersList.get("x-admin-secret");

  if (adminSecret !== process.env.ADMIN_SECRET) {
    redirect("/");
  }

  const leads = await fetchLeads();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {leads.length} lead{leads.length !== 1 ? "s" : ""} captured
            </p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 font-medium px-3 py-1 rounded-full">
            Live
          </span>
        </div>

        {/* Table */}
        {leads.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-sm">No leads yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {TABLE_HEADERS.map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.map((lead) => (
                    <LeadRow key={lead.id} lead={lead} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const TABLE_HEADERS = ["Name", "Email", "Company", "Message", "Session", "Received"];

function LeadRow({ lead }: { lead: Lead }) {
  const date = new Date(lead.created_at).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
        {lead.name}
      </td>
      <td className="px-4 py-3 text-blue-600">
        <a href={`mailto:${lead.email}`} className="hover:underline">
          {lead.email}
        </a>
      </td>
      <td className="px-4 py-3 text-gray-600">{lead.company ?? "—"}</td>
      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={lead.message}>
        {lead.message}
      </td>
      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
        {lead.session_id ? lead.session_id.slice(0, 8) + "…" : "—"}
      </td>
      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{date}</td>
    </tr>
  );
}
