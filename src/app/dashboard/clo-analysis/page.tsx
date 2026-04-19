"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import {
  students as studentsApi,
  courses as coursesApi,
  analytics,
} from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface StudentRecord {
  studentId: string;
  firstName: string;
  lastName: string;
  program?: string;
  year?: number;
}

interface CourseRecord {
  courseId: string;
  title: string;
  term?: string;
}

interface AnalysisConfig {
  mode: "single" | "group";
  studentId: string;
  groupFilterType: "all" | "program" | "year";
  groupFilterValue: string;
  courseSelection: "all" | "custom";
  selectedCourseIds: string[];
  term: string;
  metric: "clo" | "grade";
  target: number;
  atRisk: number;
}

interface ResultRow {
  cloId?: string;
  courseId: string;
  courseTitle: string;
  description?: string;
  achievedPct: number;
  studentCount: number;
}

interface AnalysisResult {
  meta: { studentCount: number; courseCount: number; assessmentCount: number };
  metric: "clo" | "grade";
  target: number;
  atRisk: number;
  results: ResultRow[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: AnalysisConfig = {
  mode: "group",
  studentId: "",
  groupFilterType: "all",
  groupFilterValue: "",
  courseSelection: "all",
  selectedCourseIds: [],
  term: "",
  metric: "clo",
  target: 80,
  atRisk: 70,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getStatus(
  achieved: number,
  target: number,
  atRisk: number
): "on-track" | "below" | "at-risk" {
  if (achieved >= target) return "on-track";
  if (achieved >= atRisk) return "below";
  return "at-risk";
}

function generatePreviewText(cfg: AnalysisConfig): string {
  const population =
    cfg.mode === "single"
      ? `single student (${cfg.studentId || "not selected"})`
      : cfg.groupFilterType === "all"
      ? "all enrolled students"
      : cfg.groupFilterType === "program"
      ? `students in ${cfg.groupFilterValue || "a program"}`
      : `Year ${cfg.groupFilterValue || "?"} students`;

  const coursePart =
    cfg.courseSelection === "all"
      ? "all courses"
      : cfg.selectedCourseIds.length === 0
      ? "no courses selected"
      : cfg.selectedCourseIds.join(", ");

  const termPart = cfg.term ? ` (${cfg.term})` : "";
  const metricPart =
    cfg.metric === "clo" ? "CLO achievement scores" : "overall course grades";

  return `Calculating ${metricPart} for ${population} across ${coursePart}${termPart}. Target: ${cfg.target}%, at-risk below ${cfg.atRisk}%.`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusPill({
  achieved,
  target,
  atRisk,
}: {
  achieved: number;
  target: number;
  atRisk: number;
}) {
  const status = getStatus(achieved, target, atRisk);
  const cls = {
    "on-track": "bg-green-100 text-green-800",
    below: "bg-yellow-100 text-yellow-800",
    "at-risk": "bg-red-100 text-red-800",
  }[status];
  const label = {
    "on-track": "On track",
    below: "Below target",
    "at-risk": "At risk",
  }[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function ChartBar({
  label,
  achieved,
  target,
  atRisk,
}: {
  label: string;
  achieved: number;
  target: number;
  atRisk: number;
}) {
  const barColor =
    achieved >= target
      ? "bg-green-500"
      : achieved >= atRisk
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span
        className="text-sm text-gray-600 w-36 shrink-0 truncate"
        title={label}
      >
        {label}
      </span>
      <div className="flex-1 relative h-6">
        <div className="absolute inset-0 bg-gray-100 rounded-full" />
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ${barColor}`}
          style={{ width: `${Math.min(achieved, 100)}%` }}
        />
        <div
          className="absolute inset-y-[-3px] w-0.5 bg-orange-400 z-10"
          style={{ left: `${Math.min(target, 100)}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-12 text-right">
        {achieved}%
      </span>
    </div>
  );
}

// ── Settings Modal ─────────────────────────────────────────────────────────

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialConfig: AnalysisConfig;
  onCalculate: (config: AnalysisConfig) => void;
  studentsList: StudentRecord[];
  coursesList: CourseRecord[];
  calculating: boolean;
}

function SettingsModal({
  open,
  onClose,
  initialConfig,
  onCalculate,
  studentsList,
  coursesList,
  calculating,
}: SettingsModalProps) {
  const [cfg, setCfg] = useState<AnalysisConfig>(initialConfig);

  useEffect(() => {
    if (open) setCfg(initialConfig);
  }, [open, initialConfig]);

  const programs = useMemo(
    () =>
      [...new Set(studentsList.map((s) => s.program).filter(Boolean))] as string[],
    [studentsList]
  );
  const years = useMemo(
    () =>
      ([...new Set(studentsList.map((s) => s.year).filter(Boolean))] as number[]).sort(
        (a, b) => a - b
      ),
    [studentsList]
  );
  const terms = useMemo(
    () =>
      [...new Set(coursesList.map((c) => c.term).filter(Boolean))] as string[],
    [coursesList]
  );

  const set = <K extends keyof AnalysisConfig>(
    key: K,
    value: AnalysisConfig[K]
  ) => setCfg((prev) => ({ ...prev, [key]: value }));

  const toggleCourse = (courseId: string) =>
    setCfg((prev) => ({
      ...prev,
      selectedCourseIds: prev.selectedCourseIds.includes(courseId)
        ? prev.selectedCourseIds.filter((id) => id !== courseId)
        : [...prev.selectedCourseIds, courseId],
    }));

  const canCalculate =
    !calculating &&
    (cfg.mode === "group" || (cfg.mode === "single" && cfg.studentId !== "")) &&
    (cfg.courseSelection === "all" || cfg.selectedCourseIds.length > 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Analysis Settings
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Configure population, courses, and calculation method
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8">
          {/* Population */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Population
            </h3>
            <div className="flex gap-3 mb-4">
              {(["group", "single"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => set("mode", m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    cfg.mode === m
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {m === "group" ? "Group" : "Single Student"}
                </button>
              ))}
            </div>

            {cfg.mode === "single" ? (
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Select student
                </label>
                <select
                  value={cfg.studentId}
                  onChange={(e) => set("studentId", e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— select a student —</option>
                  {studentsList.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.firstName} {s.lastName} ({s.studentId})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-6">
                  {(
                    [
                      ["all", "All students"],
                      ["program", "By program"],
                      ["year", "By year"],
                    ] as const
                  ).map(([type, label]) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={cfg.groupFilterType === type}
                        onChange={() => set("groupFilterType", type)}
                        className="accent-indigo-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {cfg.groupFilterType === "program" && (
                  <select
                    value={cfg.groupFilterValue}
                    onChange={(e) => set("groupFilterValue", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">— select program —</option>
                    {programs.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                )}
                {cfg.groupFilterType === "year" && (
                  <select
                    value={cfg.groupFilterValue}
                    onChange={(e) => set("groupFilterValue", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">— select year —</option>
                    {years.map((y) => (
                      <option key={y} value={String(y)}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </section>

          {/* Courses */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Courses
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfg.courseSelection === "all"}
                  onChange={(e) =>
                    set("courseSelection", e.target.checked ? "all" : "custom")
                  }
                  className="accent-indigo-600"
                />
                All courses
              </label>
              <div className="ml-auto flex items-center gap-2">
                <label className="text-sm text-gray-600">Term</label>
                <select
                  value={cfg.term}
                  onChange={(e) => set("term", e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All terms</option>
                  {terms.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {cfg.courseSelection === "custom" && (
              <div className="border border-gray-200 rounded-lg max-h-44 overflow-y-auto divide-y divide-gray-100">
                {coursesList.map((c) => (
                  <label
                    key={c.courseId}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={cfg.selectedCourseIds.includes(c.courseId)}
                      onChange={() => toggleCourse(c.courseId)}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {c.courseId}
                    </span>
                    <span className="text-sm text-gray-500">{c.title}</span>
                    {c.term && (
                      <span className="ml-auto text-xs text-gray-400">
                        {c.term}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Calculation */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Calculation
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Metric</p>
                <div className="flex gap-6">
                  {(
                    [
                      ["clo", "CLO scores"],
                      ["grade", "Full grades"],
                    ] as const
                  ).map(([val, label]) => (
                    <label
                      key={val}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={cfg.metric === val}
                        onChange={() => set("metric", val)}
                        className="accent-indigo-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-6">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Target %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={cfg.target}
                    onChange={(e) => set("target", Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    At-risk threshold %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={cfg.atRisk}
                    onChange={(e) => set("atRisk", Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Preview */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Preview
            </h3>
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800 leading-relaxed">
              {generatePreviewText(cfg)}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onCalculate(cfg)}
            disabled={!canCalculate}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {calculating ? "Calculating…" : "Calculate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CLOAnalysisPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [config, setConfig] = useState<AnalysisConfig>(DEFAULT_CONFIG);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const [studentsList, setStudentsList] = useState<StudentRecord[]>([]);
  const [coursesList, setCoursesList] = useState<CourseRecord[]>([]);

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

    Promise.all([studentsApi.getAll(), coursesApi.getAll()])
      .then(([s, c]) => {
        setStudentsList(s || []);
        setCoursesList(c || []);
      })
      .catch(console.error)
      .finally(() => setPageLoading(false));
  }, [router]);

  const handleCalculate = async (cfg: AnalysisConfig) => {
    setCalculating(true);
    setCalcError(null);
    try {
      const body = {
        mode: cfg.mode,
        ...(cfg.mode === "single" ? { studentId: cfg.studentId } : {}),
        ...(cfg.mode === "group"
          ? { groupFilter: { type: cfg.groupFilterType, value: cfg.groupFilterValue } }
          : {}),
        courseIds: (cfg.courseSelection === "all" ? "all" : cfg.selectedCourseIds) as "all" | string[],
        ...(cfg.term ? { term: cfg.term } : {}),
        metric: cfg.metric,
        target: cfg.target,
        atRisk: cfg.atRisk,
      };
      const data = await analytics.calculate(body);
      setResults(data);
      setConfig(cfg);
      setSettingsOpen(false);
    } catch (err: unknown) {
      setCalcError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setCalculating(false);
    }
  };

  const statusCounts = useMemo(() => {
    if (!results) return { onTrack: 0, below: 0, atRisk: 0 };
    const { target, atRisk } = results;
    return results.results.reduce(
      (acc, r) => {
        const s = getStatus(r.achievedPct, target, atRisk);
        if (s === "on-track") acc.onTrack++;
        else if (s === "below") acc.below++;
        else acc.atRisk++;
        return acc;
      },
      { onTrack: 0, below: 0, atRisk: 0 }
    );
  }, [results]);

  const groupedByCourse = useMemo((): Record<string, ResultRow[]> | null => {
    if (!results || results.metric !== "clo" || config.mode !== "single") return null;
    const map: Record<string, ResultRow[]> = {};
    for (const r of results.results) {
      if (!map[r.courseId]) map[r.courseId] = [];
      map[r.courseId].push(r);
    }
    return map;
  }, [results, config.mode]);

  if (pageLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading…
      </div>
    );

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        <div className="p-6">
          <DashboardPageHeader
            title="CLO Analysis"
            subtitle="Data-driven CLO achievement by population, course, and term"
            actions={
              <button
                onClick={() => setSettingsOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <span>⚙</span> Analysis settings
              </button>
            }
          />

          {/* Error banner */}
          {calcError && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {calcError}
            </div>
          )}

          {/* Config summary pills */}
          {results && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs text-gray-500 mr-1">Current analysis:</span>
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                {config.mode === "single"
                  ? `Single · ${config.studentId}`
                  : config.groupFilterType === "all"
                  ? "All students"
                  : config.groupFilterType === "program"
                  ? `Program: ${config.groupFilterValue}`
                  : `Year: ${config.groupFilterValue}`}
              </span>
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                {config.courseSelection === "all"
                  ? "All courses"
                  : `${config.selectedCourseIds.length} course(s)`}
                {config.term ? ` · ${config.term}` : ""}
              </span>
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                {config.metric === "clo" ? "CLO scores" : "Full grades"} · Target{" "}
                {config.target}%
              </span>
            </div>
          )}

          {/* Empty state */}
          {!results && !calculating && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-3xl">
                📊
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No analysis yet
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                Configure the population, courses, and calculation method to
                generate a CLO achievement report.
              </p>
              <button
                onClick={() => setSettingsOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
              >
                Open Analysis Settings
              </button>
            </div>
          )}

          {/* Calculating state */}
          {calculating && (
            <div className="flex items-center justify-center py-24 text-gray-500 text-sm gap-2">
              <span className="animate-spin inline-block">⟳</span> Calculating…
            </div>
          )}

          {/* Results */}
          {results && !calculating && (
            <>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Chart */}
                <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {results.metric === "clo"
                      ? "CLO Achievement vs Target"
                      : "Grade Achievement vs Target"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {results.metric === "clo"
                      ? "Average of per-student percentages, per CLO"
                      : "Average of per-student grades, per course"}
                  </p>

                  <div className="flex items-center gap-6 mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-indigo-600" />
                      <span className="text-sm text-gray-600">Achieved %</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-4 bg-orange-400" />
                      <span className="text-sm text-gray-600">
                        Target {results.target}%
                      </span>
                    </div>
                  </div>

                  {results.results.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      No processed assessment data found for this selection.
                    </p>
                  ) : results.metric === "clo" &&
                    config.mode === "single" &&
                    groupedByCourse ? (
                    <div className="space-y-7">
                      {Object.entries(groupedByCourse).map(([courseId, rows]) => (
                        <div key={courseId}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            {courseId} — {rows[0]?.courseTitle}
                          </p>
                          <div className="space-y-3">
                            {rows.map((row) => (
                              <ChartBar
                                key={row.cloId}
                                label={row.cloId ?? ""}
                                achieved={row.achievedPct}
                                target={results.target}
                                atRisk={results.atRisk}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {results.results.map((r, i) => (
                        <ChartBar
                          key={i}
                          label={
                            results.metric === "clo"
                              ? `${r.cloId} · ${r.courseId}`
                              : r.courseId
                          }
                          achieved={r.achievedPct}
                          target={results.target}
                          atRisk={results.atRisk}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right panel */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-5">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Calculation method
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {results.metric === "clo"
                        ? "Mean of per-student CLO score percentages across all processed assessments"
                        : "Mean of per-student total score percentages per course"}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Students</span>
                      <span className="font-semibold text-gray-900">
                        {results.meta.studentCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Courses</span>
                      <span className="font-semibold text-gray-900">
                        {results.meta.courseCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Assessments</span>
                      <span className="font-semibold text-gray-900">
                        {results.meta.assessmentCount}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Status summary
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                        <span className="text-gray-600">
                          {statusCounts.onTrack} on track
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                        <span className="text-gray-600">
                          {statusCounts.below} below target
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                        <span className="text-gray-600">
                          {statusCounts.atRisk} at risk
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setSettingsOpen(true)}
                      className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      ⟲ Recalculate
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {results.metric === "clo" ? "CLO Results" : "Grade Results"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Detailed view with targets and status
                  </p>
                </div>
                <table className="w-full">
                  <thead className="bg-indigo-900 text-white">
                    <tr>
                      {results.metric === "clo" && (
                        <>
                          <th className="text-left py-3 px-4 font-semibold text-sm">CLO</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Course</th>
                          <th className="text-left py-3 px-4 font-semibold text-sm">Description</th>
                        </>
                      )}
                      {results.metric === "grade" && (
                        <th className="text-left py-3 px-4 font-semibold text-sm">Course</th>
                      )}
                      <th className="text-left py-3 px-4 font-semibold text-sm">Target %</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Achieved %</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Students</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.results.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {results.metric === "clo" && (
                          <>
                            <td className="py-3 px-4 text-sm font-medium text-gray-700">
                              {r.cloId}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {r.courseId}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                              {r.description}
                            </td>
                          </>
                        )}
                        {results.metric === "grade" && (
                          <td className="py-3 px-4 text-sm font-medium text-gray-700">
                            {r.courseId} — {r.courseTitle}
                          </td>
                        )}
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {results.target}%
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                          {r.achievedPct}%
                        </td>
                        <td className="py-3 px-4">
                          <StatusPill
                            achieved={r.achievedPct}
                            target={results.target}
                            atRisk={results.atRisk}
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {r.studentCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialConfig={config}
        onCalculate={handleCalculate}
        studentsList={studentsList}
        coursesList={coursesList}
        calculating={calculating}
      />
    </div>
  );
}
