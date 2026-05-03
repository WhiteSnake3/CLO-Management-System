"use client";

import { useEffect, useState, useMemo } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import {
  courses as coursesApi,
  enrollments as enrollmentsApi,
  students as studentsApi,
  assessments as assessmentsApi,
  performances as performancesApi,
} from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface CourseDoc {
  _id: string;
  courseId: string;
  title: string;
  instructorId: string;
  CLOs: { cloId: string; description: string }[];
}

interface EnrollmentDoc {
  studentId: string;
  courseId: string;
  status: string;
}

interface StudentDoc {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  program?: string;
  year?: number;
}

interface AssessmentDoc {
  _id: string;
  assessmentId: string;
  courseId: string;
  title: string;
  type: string;
  totalMarks: number;
  dueDate?: string;
  cloMappings: { cloId: string; weight: number }[];
}

interface CloScore {
  cloId: string;
  score: number;
  max: number;
}

interface PerformanceDoc {
  _id: string;
  performanceId: string;
  studentId: string;
  assessmentId: string;
  courseId: string;
  score: number;
  maxScore: number;
  cloScores: CloScore[];
}

interface EditState {
  perfId: string;
  score: string;
  maxScore: string;
  cloScores: { cloId: string; score: string; max: string }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(score: number, max: number): string {
  if (!max) return "—";
  return `${Math.round((score / max) * 100)}%`;
}

function pctNum(score: number, max: number): number {
  if (!max) return 0;
  return Math.round((score / max) * 100);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string; userId: string } | null>(null);

  // Raw data
  const [myCourses, setMyCourses] = useState<CourseDoc[]>([]);
  const [myStudents, setMyStudents] = useState<StudentDoc[]>([]);
  const [allAssessments, setAllAssessments] = useState<AssessmentDoc[]>([]);
  const [allPerformances, setAllPerformances] = useState<PerformanceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Auth guard + data load ──────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    let instructorUserId: string;
    let userRole: string;
    try {
      const p = JSON.parse(atob(token.split(".")[1]));
      instructorUserId = p.userId;
      userRole = p.role;
      setUser({ name: p.name || "User", role: p.role || "instructor", userId: p.userId });
    } catch {
      router.push("/login");
      return;
    }

    if (userRole !== "instructor") {
      router.push("/dashboard");
      return;
    }

    Promise.all([
      coursesApi.getAll() as Promise<CourseDoc[]>,
      enrollmentsApi.getAll() as Promise<EnrollmentDoc[]>,
      studentsApi.getAll() as Promise<StudentDoc[]>,
      assessmentsApi.getAll() as Promise<AssessmentDoc[]>,
      performancesApi.getAll() as Promise<PerformanceDoc[]>,
    ])
      .then(([courses, enrollments, students, assessments, performances]) => {
        // Filter to instructor's courses
        const instructorCourses = (courses ?? []).filter(
          (c) => c.instructorId === instructorUserId
        );
        const myCourseIds = new Set(instructorCourses.map((c) => c.courseId));

        // Active student IDs enrolled in my courses
        const enrolledStudentIds = new Set(
          (enrollments ?? [])
            .filter((e) => myCourseIds.has(e.courseId) && e.status === "active")
            .map((e) => e.studentId)
        );

        const filteredStudents = (students ?? []).filter((s) =>
          enrolledStudentIds.has(s.studentId)
        );

        const filteredAssessments = (assessments ?? []).filter((a) =>
          myCourseIds.has(a.courseId)
        );

        const filteredPerformances = (performances ?? []).filter(
          (p) => enrolledStudentIds.has(p.studentId) && myCourseIds.has(p.courseId)
        );

        setMyCourses(instructorCourses);
        setMyStudents(filteredStudents);
        setAllAssessments(filteredAssessments);
        setAllPerformances(filteredPerformances);

        if (filteredStudents.length > 0) {
          setSelectedStudentId(filteredStudents[0].studentId);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  // ── Derived: courses for selected student ──────────────────────────────
  const selectedStudent = useMemo(
    () => myStudents.find((s) => s.studentId === selectedStudentId) ?? null,
    [myStudents, selectedStudentId]
  );

  const studentCourses = useMemo(() => {
    if (!selectedStudentId) return [];
    const enrolled = new Set(
      allPerformances
        .filter((p) => p.studentId === selectedStudentId)
        .map((p) => p.courseId)
    );
    return myCourses.filter((c) => enrolled.has(c.courseId));
  }, [selectedStudentId, allPerformances, myCourses]);

  // Auto-select first course when student changes
  useEffect(() => {
    if (studentCourses.length > 0) {
      setSelectedCourseId(studentCourses[0].courseId);
    } else {
      setSelectedCourseId(null);
    }
    setEditState(null);
    setSaveError("");
  }, [selectedStudentId, studentCourses]);

  // ── Derived: assessments + performances for selected student + course ──
  const courseAssessments = useMemo(() => {
    if (!selectedCourseId) return [];
    return allAssessments.filter((a) => a.courseId === selectedCourseId);
  }, [allAssessments, selectedCourseId]);

  const perfByAssessment = useMemo(() => {
    const map: Record<string, PerformanceDoc> = {};
    allPerformances
      .filter(
        (p) => p.studentId === selectedStudentId && p.courseId === selectedCourseId
      )
      .forEach((p) => { map[p.assessmentId] = p; });
    return map;
  }, [allPerformances, selectedStudentId, selectedCourseId]);

  // ── Derived: CLO summary for selected course ──────────────────────────
  const cloSummary = useMemo(() => {
    const selectedCourse = myCourses.find((c) => c.courseId === selectedCourseId);
    if (!selectedCourse) return [];
    const agg: Record<string, { total: number; max: number; count: number }> = {};
    selectedCourse.CLOs.forEach((clo) => {
      agg[clo.cloId] = { total: 0, max: 0, count: 0 };
    });
    Object.values(perfByAssessment).forEach((perf) => {
      perf.cloScores.forEach((cs) => {
        if (!agg[cs.cloId]) agg[cs.cloId] = { total: 0, max: 0, count: 0 };
        agg[cs.cloId].total += cs.score;
        agg[cs.cloId].max += cs.max;
        agg[cs.cloId].count += 1;
      });
    });
    return selectedCourse.CLOs.map((clo) => ({
      cloId: clo.cloId,
      description: clo.description,
      score: agg[clo.cloId]?.total ?? 0,
      max: agg[clo.cloId]?.max ?? 0,
    }));
  }, [myCourses, selectedCourseId, perfByAssessment]);

  // ── Filtered student list ──────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase();
    return myStudents.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q)
    );
  }, [myStudents, search]);

  // ── Edit handlers ──────────────────────────────────────────────────────
  function startEdit(perf: PerformanceDoc) {
    setEditState({
      perfId: perf._id,
      score: String(perf.score ?? ""),
      maxScore: String(perf.maxScore ?? ""),
      cloScores: perf.cloScores.map((cs) => ({
        cloId: cs.cloId,
        score: String(cs.score ?? ""),
        max: String(cs.max ?? ""),
      })),
    });
    setSaveError("");
  }

  function cancelEdit() {
    setEditState(null);
    setSaveError("");
  }

  async function saveEdit() {
    if (!editState) return;
    setSaving(true);
    setSaveError("");
    try {
      const body = {
        score: Number(editState.score),
        maxScore: Number(editState.maxScore),
        cloScores: editState.cloScores.map((cs) => ({
          cloId: cs.cloId,
          score: Number(cs.score),
          max: Number(cs.max),
        })),
      };
      const updated = await performancesApi.update(editState.perfId, body) as PerformanceDoc;
      setAllPerformances((prev) =>
        prev.map((p) => (p._id === editState.perfId ? { ...p, ...updated } : p))
      );
      setEditState(null);
    } catch (e: any) {
      setSaveError(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-slate-500">Loading students…</div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Student list ─────────────────────────────────────────── */}
          <aside className="w-72 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-slate-100">
              <input
                type="text"
                placeholder="Search students…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <p className="text-slate-400 text-sm text-center mt-8 px-4">
                  {search ? "No students match your search." : "No students found."}
                </p>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = s.studentId === selectedStudentId;
                  // count distinct courses this student has performances in
                  const coursesEnrolled = new Set(
                    allPerformances.filter((p) => p.studentId === s.studentId).map((p) => p.courseId)
                  ).size;
                  return (
                    <button
                      key={s.studentId}
                      onClick={() => { setSelectedStudentId(s.studentId); setEditState(null); }}
                      className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors ${
                        isSelected ? "bg-indigo-50 border-l-4 border-l-indigo-500" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? "text-indigo-700" : "text-slate-800"}`}>
                            {s.firstName} {s.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{s.studentId}</p>
                        </div>
                        <span className="ml-auto text-xs text-slate-400 flex-shrink-0">
                          {coursesEnrolled} {coursesEnrolled === 1 ? "course" : "courses"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer count */}
            <div className="p-3 border-t border-slate-100 text-xs text-slate-400 text-center">
              {filteredStudents.length} of {myStudents.length} students
            </div>
          </aside>

          {/* ── Detail panel ──────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto p-6">
            {!selectedStudent ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400">Select a student to view their grades.</p>
              </div>
            ) : (
              <>
                {/* Student header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-indigo-600 text-white text-xl font-bold flex items-center justify-center">
                    {selectedStudent.firstName[0]}{selectedStudent.lastName[1] ?? selectedStudent.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedStudent.studentId}
                      {selectedStudent.program ? ` · ${selectedStudent.program}` : ""}
                      {selectedStudent.year ? ` · Year ${selectedStudent.year}` : ""}
                    </p>
                    <p className="text-sm text-slate-400">{selectedStudent.email}</p>
                  </div>
                </div>

                {studentCourses.length === 0 ? (
                  <p className="text-slate-400 text-sm">No performance data recorded for this student yet.</p>
                ) : (
                  <>
                    {/* Course tabs */}
                    <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
                      {studentCourses.map((c) => (
                        <button
                          key={c.courseId}
                          onClick={() => { setSelectedCourseId(c.courseId); setEditState(null); }}
                          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                            selectedCourseId === c.courseId
                              ? "border-indigo-600 text-indigo-700"
                              : "border-transparent text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {c.courseId} — {c.title}
                        </button>
                      ))}
                    </div>

                    {selectedCourseId && (
                      <>
                        {/* ── Assessment scores table ────────────────── */}
                        <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
                          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800">Assessment Scores</h3>
                            {saveError && (
                              <span className="text-xs text-red-500">{saveError}</span>
                            )}
                          </div>

                          {courseAssessments.length === 0 ? (
                            <p className="text-slate-400 text-sm p-5">No assessments for this course.</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                                  <th className="text-left px-5 py-3 font-medium">Assessment</th>
                                  <th className="text-left px-4 py-3 font-medium">Type</th>
                                  <th className="text-center px-4 py-3 font-medium">Score</th>
                                  <th className="text-center px-4 py-3 font-medium">Max</th>
                                  <th className="text-center px-4 py-3 font-medium">%</th>
                                  <th className="px-4 py-3"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {courseAssessments.map((assessment) => {
                                  const perf = perfByAssessment[assessment.assessmentId];
                                  const isEditing = editState?.perfId === perf?._id;

                                  if (!perf) {
                                    return (
                                      <tr key={assessment.assessmentId} className="text-slate-400">
                                        <td className="px-5 py-3 font-medium text-slate-600">{assessment.title}</td>
                                        <td className="px-4 py-3 text-xs">{assessment.type}</td>
                                        <td colSpan={4} className="px-4 py-3 text-center text-xs italic">No data</td>
                                      </tr>
                                    );
                                  }

                                  return (
                                    <React.Fragment key={assessment.assessmentId}>
                                      <tr className="hover:bg-slate-50">
                                        <td className="px-5 py-3 font-medium text-slate-800">{assessment.title}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 capitalize">{assessment.type}</td>
                                        <td className="px-4 py-3 text-center">
                                          {isEditing ? (
                                            <input
                                              type="number"
                                              min={0}
                                              value={editState.score}
                                              onChange={(e) =>
                                                setEditState((prev) => prev ? { ...prev, score: e.target.value } : prev)
                                              }
                                              className="w-20 border border-indigo-300 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            />
                                          ) : (
                                            <span className="font-medium text-slate-700">{perf.score ?? "—"}</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {isEditing ? (
                                            <input
                                              type="number"
                                              min={0}
                                              value={editState.maxScore}
                                              onChange={(e) =>
                                                setEditState((prev) => prev ? { ...prev, maxScore: e.target.value } : prev)
                                              }
                                              className="w-20 border border-indigo-300 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            />
                                          ) : (
                                            <span className="text-slate-500">{perf.maxScore ?? "—"}</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {!isEditing && perf.maxScore ? (
                                            <div className="flex items-center justify-center gap-2">
                                              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                  className={`h-full rounded-full ${
                                                    pctNum(perf.score, perf.maxScore) >= 80
                                                      ? "bg-green-400"
                                                      : pctNum(perf.score, perf.maxScore) >= 60
                                                      ? "bg-amber-400"
                                                      : "bg-red-400"
                                                  }`}
                                                  style={{ width: `${pctNum(perf.score, perf.maxScore)}%` }}
                                                />
                                              </div>
                                              <span className="text-xs font-medium text-slate-600">
                                                {pct(perf.score, perf.maxScore)}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 text-xs">—</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          {isEditing ? (
                                            <div className="flex gap-2 justify-end">
                                              <button
                                                onClick={saveEdit}
                                                disabled={saving}
                                                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded disabled:opacity-50"
                                              >
                                                {saving ? "Saving…" : "Save"}
                                              </button>
                                              <button
                                                onClick={cancelEdit}
                                                disabled={saving}
                                                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => startEdit(perf)}
                                              className="text-indigo-500 hover:text-indigo-700 p-1 rounded hover:bg-indigo-50 transition-colors"
                                              title="Edit score"
                                            >
                                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                              </svg>
                                            </button>
                                          )}
                                        </td>
                                      </tr>

                                      {/* CLO score rows when editing */}
                                      {isEditing && editState.cloScores.length > 0 && (
                                        <tr>
                                          <td colSpan={6} className="px-5 pb-4 bg-indigo-50">
                                            <p className="text-xs font-semibold text-indigo-700 mb-2 mt-1">CLO Scores</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                              {editState.cloScores.map((cs, i) => (
                                                <div key={cs.cloId} className="flex items-center gap-2">
                                                  <span className="text-xs text-slate-600 w-8 font-medium">{cs.cloId}</span>
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    placeholder="Score"
                                                    value={cs.score}
                                                    onChange={(e) =>
                                                      setEditState((prev) => {
                                                        if (!prev) return prev;
                                                        const updated = [...prev.cloScores];
                                                        updated[i] = { ...updated[i], score: e.target.value };
                                                        return { ...prev, cloScores: updated };
                                                      })
                                                    }
                                                    className="w-16 border border-indigo-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 text-center"
                                                  />
                                                  <span className="text-xs text-slate-400">/</span>
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    placeholder="Max"
                                                    value={cs.max}
                                                    onChange={(e) =>
                                                      setEditState((prev) => {
                                                        if (!prev) return prev;
                                                        const updated = [...prev.cloScores];
                                                        updated[i] = { ...updated[i], max: e.target.value };
                                                        return { ...prev, cloScores: updated };
                                                      })
                                                    }
                                                    className="w-16 border border-indigo-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 text-center"
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* ── CLO Summary ────────────────────────────── */}
                        {cloSummary.length > 0 && (
                          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100">
                              <h3 className="font-semibold text-slate-800">CLO Achievement Summary</h3>
                              <p className="text-xs text-slate-400 mt-0.5">Aggregated across all graded assessments in this course</p>
                            </div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                                  <th className="text-left px-5 py-3 font-medium w-16">CLO</th>
                                  <th className="text-left px-4 py-3 font-medium">Description</th>
                                  <th className="text-center px-4 py-3 font-medium">Score</th>
                                  <th className="text-center px-4 py-3 font-medium">Max</th>
                                  <th className="text-center px-4 py-3 font-medium w-36">Achievement</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {cloSummary.map((clo) => {
                                  const achieved = pctNum(clo.score, clo.max);
                                  return (
                                    <tr key={clo.cloId} className="hover:bg-slate-50">
                                      <td className="px-5 py-3">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                          {clo.cloId}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-slate-600 text-xs leading-relaxed">{clo.description}</td>
                                      <td className="px-4 py-3 text-center font-medium text-slate-700">
                                        {clo.max > 0 ? clo.score : "—"}
                                      </td>
                                      <td className="px-4 py-3 text-center text-slate-500">
                                        {clo.max > 0 ? clo.max : "—"}
                                      </td>
                                      <td className="px-4 py-3">
                                        {clo.max > 0 ? (
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                              <div
                                                className={`h-full rounded-full ${
                                                  achieved >= 80 ? "bg-green-400" : achieved >= 60 ? "bg-amber-400" : "bg-red-400"
                                                }`}
                                                style={{ width: `${achieved}%` }}
                                              />
                                            </div>
                                            <span className={`text-xs font-semibold w-9 text-right ${
                                              achieved >= 80 ? "text-green-600" : achieved >= 60 ? "text-amber-600" : "text-red-500"
                                            }`}>
                                              {achieved}%
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 text-xs text-center block">No data</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
