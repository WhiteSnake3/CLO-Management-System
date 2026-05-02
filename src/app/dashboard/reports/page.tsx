"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import { reports as reportsApi, analytics } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

interface Snapshot {
  _id: string;
  label?: string;
  metric: "clo" | "grade";
  target: number;
  atRisk: number;
  results?: unknown[];
  meta?: { studentCount?: number; courseCount?: number; assessmentCount?: number };
  config?: { term?: string; courseSelection?: string; selectedCourseIds?: string[] };
  createdAt: string;
}

interface Report {
  _id: string;
  reportId: string;
  title: string;
  snapshotId: string;
  metric?: string;
  term?: string;
  courseIds?: string[];
  content: string;
  generatedBy?: string;
  meta?: { studentCount?: number; courseCount?: number };
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

// ── Generate Report Modal ─────────────────────────────────────────────────

function GenerateReportModal({
  snapshots,
  onClose,
  onPublish,
}: {
  snapshots: Snapshot[];
  onClose: () => void;
  onPublish: (report: Report) => void;
}) {
  const [step, setStep] = useState<"select" | "generating" | "preview">("select");
  const [selectedId, setSelectedId] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ content: string } | null>(null);
  const [publishing, setPublishing] = useState(false);

  const selectedSnapshot = snapshots.find((s) => s._id === selectedId);

  const handleGenerate = async () => {
    if (!selectedId) return;
    setError(null);
    setStep("generating");
    try {
      const result = await reportsApi.generate({ snapshotId: selectedId, title: reportTitle || undefined });
      setPreview({ content: result.content });
      setStep("preview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
      setStep("select");
    }
  };

  const handlePublish = async () => {
    if (!preview || !selectedSnapshot) return;
    setPublishing(true);
    setError(null);
    try {
      const saved = await reportsApi.save({
        snapshotId: selectedId,
        title: reportTitle || `Report – ${formatDate(selectedSnapshot.createdAt)}`,
        content: preview.content,
        metric: selectedSnapshot.metric,
        term: selectedSnapshot.config?.term,
        courseIds: selectedSnapshot.config?.selectedCourseIds,
        meta: selectedSnapshot.meta,
      });
      onPublish(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save report");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Generate Report</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {step === "select"
                ? "Select an analysis snapshot to base the report on"
                : step === "generating"
                ? "Generating report with AI…"
                : "Review the generated report before publishing"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === "select" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report title <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Fall 2025 CLO Achievement Summary"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis snapshot
                </label>
                {snapshots.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No saved snapshots found. Go to CLO Analysis and save an analysis first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {snapshots.map((s) => (
                      <label
                        key={s._id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedId === s._id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="snapshot"
                          value={s._id}
                          checked={selectedId === s._id}
                          onChange={() => setSelectedId(s._id)}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {s.label || `Analysis – ${formatDate(s.createdAt)}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {s.metric === "clo" ? "CLO scores" : "Overall grades"} · Target {s.target}% ·{" "}
                            {s.meta?.studentCount ?? "?"} students · {s.meta?.courseCount ?? "?"} courses ·{" "}
                            {formatDate(s.createdAt)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">AI is analyzing the data and writing your report…</p>
            </div>
          )}

          {step === "preview" && preview && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Report preview
                </span>
                <span className="text-xs text-gray-400">— review before publishing</span>
              </div>
              <div
                className="bg-gray-50 border border-gray-200 rounded-lg p-5"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(preview.content) }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {step === "select" && (
            <button
              onClick={handleGenerate}
              disabled={!selectedId}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate
            </button>
          )}
          {step === "preview" && (
            <>
              <button
                onClick={() => setStep("select")}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? "Publishing…" : "Upload & Publish"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── View Report Modal ──────────────────────────────────────────────────────

function ViewReportModal({ report, onClose }: { report: Report; onClose: () => void }) {
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
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [allReports, setAllReports] = useState<Report[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filterTerm, setFilterTerm] = useState("All");
  const [filterMetric, setFilterMetric] = useState("All");

  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([reportsApi.getAll(), analytics.getAll()]);
      setAllReports(r || []);
      setSnapshots((s || []).filter((snap: Snapshot) => snap.metric && snap.results));
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load data");
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
    loadData().finally(() => setPageLoading(false));
  }, [router, loadData]);

  const termOptions = useMemo(() => {
    const terms = allReports.map((r) => r.term).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(terms))];
  }, [allReports]);

  const filteredReports = useMemo(() => {
    return allReports.filter((r) => {
      if (filterTerm !== "All" && r.term !== filterTerm) return false;
      if (filterMetric !== "All" && r.metric !== filterMetric) return false;
      return true;
    });
  }, [allReports, filterTerm, filterMetric]);

  const handleDownloadPDF = (report: Report) => {
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

  if (pageLoading)
    return <div className="flex items-center justify-center min-h-screen">Loading…</div>;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        <div className="p-6">
          <DashboardPageHeader
            title="Reports"
            subtitle="Generate shareable reports for courses, programs, and student outcomes"
            actions={
              <button
                onClick={() => setGenerateOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <span>✏️</span> Generate report
              </button>
            }
          />

          {loadError && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {loadError}
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Term</label>
              <select
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {termOptions.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Metric</label>
              <select
                value={filterMetric}
                onChange={(e) => setFilterMetric(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All</option>
                <option value="clo">CLO scores</option>
                <option value="grade">Overall grades</option>
              </select>
            </div>
          </div>

          {/* Generated Reports */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Generated reports</h3>
            <p className="text-sm text-gray-500 mb-4">
              AI-generated reports based on saved analysis snapshots
            </p>

            {filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-2xl">
                  📄
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">No reports yet</p>
                <p className="text-xs text-gray-500 max-w-xs">
                  Click &quot;Generate report&quot; to create a new AI-powered report from a saved analysis snapshot.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredReports.map((report) => (
                  <div
                    key={report._id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{report.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Generated {formatDate(report.createdAt)}
                        {report.term ? ` · Term: ${report.term}` : ""}
                        {report.metric
                          ? ` · ${report.metric === "clo" ? "CLO scores" : "Overall grades"}`
                          : ""}
                        {report.meta?.studentCount ? ` · ${report.meta.studentCount} students` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewReport(report)}
                        className="px-3 py-1.5 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(report)}
                        className="px-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-medium"
                      >
                        PDF
                      </button>
                      <button
                        disabled
                        title="Inbox feature coming soon"
                        className="px-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-gray-400 text-xs font-medium cursor-not-allowed"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {generateOpen && (
        <GenerateReportModal
          snapshots={snapshots}
          onClose={() => setGenerateOpen(false)}
          onPublish={(newReport) => {
            setAllReports((prev) => [newReport, ...prev]);
            setGenerateOpen(false);
          }}
        />
      )}

      {viewReport && (
        <ViewReportModal report={viewReport} onClose={() => setViewReport(null)} />
      )}
    </div>
  );
}
