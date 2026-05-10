"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import {
  courses as coursesApi,
  enrollments as enrollmentsApi,
  assessments as assessmentsApi,
  performances as performancesApi,
  instructors as instructorsApi,
} from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface CourseDoc {
  _id: string;
  courseId: string;
  title: string;
  instructorId: string;
  department?: string;
  term?: string;
  CLOs: { cloId: string; description: string }[];
}

interface EnrollmentDoc {
  studentId: string;
  courseId: string;
  status: string;
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(score: number, max: number): string {
  if (!max) return "—";
  return `${Math.round((score / max) * 100)}%`;
}

function pctNum(score: number, max: number): number {
  if (!max) return 0;
  return Math.round((score / max) * 100);
}

function gradeColor(p: number): string {
  if (p >= 80) return "bg-green-500";
  if (p >= 70) return "bg-yellow-400";
  return "bg-red-400";
}

function badgeColor(p: number): string {
  if (p >= 80) return "bg-green-100 text-green-800";
  if (p >= 70) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GradesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("courseId");

  const [user, setUser] = useState<{ name: string; role: string; userId: string } | null>(null);
  const [myCourses, setMyCourses] = useState<CourseDoc[]>([]);
  const [allAssessments, setAllAssessments] = useState<AssessmentDoc[]>([]);
  const [myPerformances, setMyPerformances] = useState<PerformanceDoc[]>([]);
  const [instructorMap, setInstructorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "student") { router.push("/dashboard"); return; }
      setUser(payload);
      loadData(payload.userId);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const loadData = async (studentId: string) => {
    try {
      const [allCourses, allEnrollments, allAssessmentsData, allPerfs, allInstructors] =
        await Promise.all([
          coursesApi.getAll() as Promise<CourseDoc[]>,
          enrollmentsApi.getAll() as Promise<EnrollmentDoc[]>,
          assessmentsApi.getAll() as Promise<AssessmentDoc[]>,
          performancesApi.getAll() as Promise<PerformanceDoc[]>,
          instructorsApi.getAll() as Promise<{ instructorId: string; name: string }[]>,
        ]);

      // Only courses this student is actively enrolled in
      const enrolledCourseIds = new Set(
        allEnrollments
          .filter((e) => e.studentId === studentId && e.status === "active")
          .map((e) => e.courseId)
      );
      const enrolled = (allCourses ?? []).filter((c) => enrolledCourseIds.has(c.courseId));
      const myPerfs = (allPerfs ?? []).filter((p) => p.studentId === studentId);

      const iMap: Record<string, string> = {};
      (allInstructors ?? []).forEach((i) => { iMap[i.instructorId] = i.name; });

      setMyCourses(enrolled);
      setAllAssessments(allAssessmentsData ?? []);
      setMyPerformances(myPerfs);
      setInstructorMap(iMap);

      // Pre-select from URL param or first course
      const initial = preselectedCourseId && enrolledCourseIds.has(preselectedCourseId)
        ? preselectedCourseId
        : enrolled[0]?.courseId ?? null;
      setSelectedCourseId(initial);
    } catch (err) {
      console.error("Failed to load grades data", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCourse = useMemo(
    () => myCourses.find((c) => c.courseId === selectedCourseId) ?? null,
    [myCourses, selectedCourseId]
  );

  const courseAssessments = useMemo(
    () => allAssessments.filter((a) => a.courseId === selectedCourseId),
    [allAssessments, selectedCourseId]
  );

  // My performance records for the selected course
  const coursePerformances = useMemo(
    () => myPerformances.filter((p) => p.courseId === selectedCourseId),
    [myPerformances, selectedCourseId]
  );

  const perfByAssessment = useMemo(() => {
    const map: Record<string, PerformanceDoc> = {};
    coursePerformances.forEach((p) => { map[p.assessmentId] = p; });
    return map;
  }, [coursePerformances]);

  // Aggregate CLO achievement for selected course
  const cloSummary = useMemo(() => {
    if (!selectedCourse) return [];
    const totals: Record<string, { score: number; max: number; description: string }> = {};
    selectedCourse.CLOs.forEach((clo) => {
      totals[clo.cloId] = { score: 0, max: 0, description: clo.description };
    });
    coursePerformances.forEach((p) => {
      p.cloScores.forEach((cs) => {
        if (!totals[cs.cloId]) totals[cs.cloId] = { score: 0, max: 0, description: cs.cloId };
        totals[cs.cloId].score += cs.score;
        totals[cs.cloId].max += cs.max;
      });
    });
    return Object.entries(totals).map(([cloId, v]) => ({ cloId, ...v }));
  }, [selectedCourse, coursePerformances]);

  // Overall course score
  const overallScore = useMemo(() => {
    let total = 0, max = 0;
    coursePerformances.forEach((p) => { total += p.score; max += p.maxScore; });
    return { total, max };
  }, [coursePerformances]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return myCourses.filter(
      (c) => !q || c.courseId.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
    );
  }, [myCourses, searchQuery]);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        <div className="p-6">
          <DashboardPageHeader
            title="My Grades"
            subtitle="View your assessment scores and CLO achievement across enrolled courses"
          />

          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-500">Loading...</div>
          ) : myCourses.length === 0 ? (
            <div className="flex items-center justify-center py-24 text-gray-500">
              You are not enrolled in any courses.
            </div>
          ) : (
            <div className="flex gap-6">
              {/* ── Left panel: course list ── */}
              <div className="w-64 shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search courses…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {filteredCourses.map((course) => {
                    const perfs = myPerformances.filter((p) => p.courseId === course.courseId);
                    let tot = 0, mx = 0;
                    perfs.forEach((p) => { tot += p.score; mx += p.maxScore; });
                    const p = mx ? pctNum(tot, mx) : null;
                    const isActive = course.courseId === selectedCourseId;
                    return (
                      <button
                        key={course.courseId}
                        onClick={() => setSelectedCourseId(course.courseId)}
                        className={`w-full text-left px-4 py-3 transition ${
                          isActive ? "bg-indigo-50 border-l-2 border-indigo-600" : "hover:bg-gray-50"
                        }`}
                      >
                        <p className={`text-sm font-semibold truncate ${isActive ? "text-indigo-700" : "text-gray-800"}`}>
                          {course.courseId}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{course.title}</p>
                        {p !== null && (
                          <span className={`mt-1 inline-flex text-xs font-medium px-1.5 py-0.5 rounded-full ${badgeColor(p)}`}>
                            {p}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Right panel ── */}
              <div className="flex-1 space-y-6">
                {selectedCourse ? (
                  <>
                    {/* Course header */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">
                            {selectedCourse.courseId} — {selectedCourse.title}
                          </h2>
                          <p className="text-sm text-gray-500 mt-1">
                            Instructor: {instructorMap[selectedCourse.instructorId] || selectedCourse.instructorId}
                            {selectedCourse.term && <span className="ml-3">Term: {selectedCourse.term}</span>}
                          </p>
                        </div>
                        {overallScore.max > 0 && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-indigo-700">
                              {pct(overallScore.total, overallScore.max)}
                            </p>
                            <p className="text-xs text-gray-500">Overall ({overallScore.total}/{overallScore.max})</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assessments table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">Assessment Scores</h3>
                      </div>
                      <table className="w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="text-left px-5 py-2">Assessment</th>
                            <th className="text-left px-5 py-2">Type</th>
                            <th className="text-left px-5 py-2">Due Date</th>
                            <th className="text-left px-5 py-2">Score</th>
                            <th className="text-left px-5 py-2">Achievement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {courseAssessments.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-sm text-gray-400">
                                No assessments found for this course.
                              </td>
                            </tr>
                          ) : (
                            courseAssessments.map((assessment) => {
                              const perf = perfByAssessment[assessment.assessmentId];
                              const achPct = perf ? pctNum(perf.score, perf.maxScore) : null;
                              return (
                                <tr key={assessment.assessmentId} className="hover:bg-gray-50">
                                  <td className="px-5 py-3 text-sm font-medium text-gray-800">
                                    {assessment.title}
                                  </td>
                                  <td className="px-5 py-3 text-sm text-gray-500">{assessment.type}</td>
                                  <td className="px-5 py-3 text-sm text-gray-500">
                                    {assessment.dueDate
                                      ? new Date(assessment.dueDate).toLocaleDateString()
                                      : "—"}
                                  </td>
                                  <td className="px-5 py-3 text-sm text-gray-700">
                                    {perf ? `${perf.score} / ${perf.maxScore}` : <span className="text-gray-300">Not graded</span>}
                                  </td>
                                  <td className="px-5 py-3">
                                    {achPct !== null ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                          <div
                                            className={`h-2 rounded-full ${gradeColor(achPct)}`}
                                            style={{ width: `${achPct}%` }}
                                          />
                                        </div>
                                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${badgeColor(achPct)}`}>
                                          {achPct}%
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-300 text-sm">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* CLO Summary */}
                    {cloSummary.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-800">CLO Achievement</h3>
                        </div>
                        <table className="w-full">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                              <th className="text-left px-5 py-2">CLO</th>
                              <th className="text-left px-5 py-2">Description</th>
                              <th className="text-left px-5 py-2">Score</th>
                              <th className="text-left px-5 py-2">Achievement</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {cloSummary.map(({ cloId, description, score, max }) => {
                              const p = max ? pctNum(score, max) : null;
                              return (
                                <tr key={cloId} className="hover:bg-gray-50">
                                  <td className="px-5 py-3 text-sm font-semibold text-indigo-700">{cloId}</td>
                                  <td className="px-5 py-3 text-sm text-gray-600">{description}</td>
                                  <td className="px-5 py-3 text-sm text-gray-700">
                                    {max ? `${score} / ${max}` : "—"}
                                  </td>
                                  <td className="px-5 py-3">
                                    {p !== null ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                          <div
                                            className={`h-2 rounded-full ${gradeColor(p)}`}
                                            style={{ width: `${p}%` }}
                                          />
                                        </div>
                                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${badgeColor(p)}`}>
                                          {p}%
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-300 text-sm">—</span>
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
                ) : (
                  <div className="flex items-center justify-center py-24 text-gray-400">
                    Select a course to view your grades.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
