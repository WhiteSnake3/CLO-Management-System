"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import { inbox as inboxApi, reports as reportsApi } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

interface InboxMessage {
  _id: string;
  messageId: string;
  reportId: string;
  reportTitle: string;
  recipientUserId: string;
  senderUserId: string;
  senderName: string;
  read: boolean;
  createdAt: string;
}

interface FullReport {
  _id: string;
  title: string;
  content: string;
  metric?: string;
  term?: string;
  meta?: { studentCount?: number };
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (line.startsWith("## "))
        return `<h2 class="text-lg font-bold text-gray-900 mt-5 mb-2">${line.slice(3)}</h2>`;
      if (line.startsWith("### "))
        return `<h3 class="text-base font-semibold text-gray-800 mt-4 mb-1">${line.slice(4)}</h3>`;
      if (line.startsWith("- "))
        return `<li class="ml-4 list-disc text-sm text-gray-700">${line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</li>`;
      if (line.trim() === "") return `<div class="mb-2"></div>`;
      return `<p class="text-sm text-gray-700 mb-1">${line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`;
    })
    .join("");
}

// ── View Report Modal ──────────────────────────────────────────────────────

function ViewReportModal({
  report,
  onClose,
}: {
  report: FullReport;
  onClose: () => void;
}) {
  const handlePDF = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${report.title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 4px; }
    .meta { color: #666; font-size: 0.85rem; margin-bottom: 2rem; }
    h2 { font-size: 1.15rem; margin-top: 2rem; margin-bottom: 0.5rem; }
    h3 { font-size: 1rem; margin-top: 1.5rem; margin-bottom: 0.3rem; color: #333; }
    p, li { font-size: 0.9rem; line-height: 1.6; }
    ul { margin: 0.3rem 0 0.3rem 1.2rem; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <div class="meta">Generated ${formatDate(report.createdAt)}${report.term ? ` · Term: ${report.term}` : ""}${report.meta?.studentCount ? ` · ${report.meta.studentCount} students` : ""}</div>
  ${renderMarkdown(report.content)}
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{report.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Generated {formatDate(report.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ✕
          </button>
        </div>
        <div
          className="flex-1 overflow-y-auto p-6"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(report.content) }}
        />
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handlePDF}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string; userId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [viewingReport, setViewingReport] = useState<FullReport | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await inboxApi.getAll();
      setMessages(data || []);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load inbox");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch {
      router.push("/login");
      return;
    }
    loadMessages().finally(() => setLoading(false));
  }, [router, loadMessages]);

  const handleMarkRead = async (msg: InboxMessage) => {
    if (msg.read) return;
    try {
      await inboxApi.markRead(msg._id);
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, read: true } : m))
      );
    } catch {
      // non-critical, ignore
    }
  };

  const handleViewReport = async (msg: InboxMessage) => {
    handleMarkRead(msg);
    setLoadingReportId(msg._id);
    try {
      const report = await reportsApi.getById(msg.reportId);
      setViewingReport(report);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoadingReportId(null);
    }
  };

  const filteredMessages = useMemo(() => {
    if (selectedFilter === "unread") return messages.filter((m) => !m.read);
    return messages;
  }, [messages, selectedFilter]);

  const unreadCount = useMemo(() => messages.filter((m) => !m.read).length, [messages]);

  if (loading)
    return <div className="flex items-center justify-center min-h-screen">Loading…</div>;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        <div className="p-6">
          <DashboardPageHeader
            title="Inbox"
            subtitle="Reports shared with you"
            actions={
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                {unreadCount} Unread
              </span>
            }
          />

          {loadError && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {loadError}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`pb-3 px-2 text-sm font-medium transition-colors ${
                selectedFilter === "all"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              All Messages ({messages.length})
            </button>
            <button
              onClick={() => setSelectedFilter("unread")}
              className={`pb-3 px-2 text-sm font-medium transition-colors ${
                selectedFilter === "unread"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Messages List */}
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-2xl">
                📭
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No messages</p>
              <p className="text-xs text-gray-500">
                Reports posted to you will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {filteredMessages.map((msg) => (
                <div
                  key={msg._id}
                  className={`px-6 py-4 transition-colors ${
                    !msg.read ? "bg-indigo-50/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100 text-indigo-600">
                        📊
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm font-semibold ${!msg.read ? "text-gray-900" : "text-gray-700"}`}>
                            {msg.reportTitle}
                          </h3>
                          {!msg.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                          )}
                          <span className="text-gray-400">📎</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">From: {msg.senderName}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleViewReport(msg)}
                            disabled={loadingReportId === msg._id}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-3 py-1 rounded text-xs font-medium"
                          >
                            {loadingReportId === msg._id ? "Loading…" : "View Report"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Date/Time */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-700">{formatDate(msg.createdAt)}</p>
                      <p className="text-xs text-gray-500">{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewingReport && (
        <ViewReportModal report={viewingReport} onClose={() => setViewingReport(null)} />
      )}
    </div>
  );
}
