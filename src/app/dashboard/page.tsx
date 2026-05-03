"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import CLOChart from "@/components/CLOChart";
import RecentAssessments from "@/components/RecentAssessments";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import {
  analytics as analyticsApi,
  courses as coursesApi,
  enrollments as enrollmentsApi,
  assessments as assessmentsApi,
} from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface SnapshotDoc {
  _id: string;
  date: string;
  label?: string;
  metric: string;
  target: number;
  atRisk: number;
  results: {
    courseId: string;
    courseTitle: string;
    cloId?: string;
    achievedPct: number;
    studentCount: number;
  }[];
}

interface CourseDoc {
  courseId: string;
  title: string;
}

interface EnrollmentDoc {
  courseId: string;
  status: string;
}

interface AssessmentDoc {
  assessmentId: string;
  courseId: string;
  title: string;
  dueDate?: string;
  status: "pending" | "processed";
  cloMappings: { cloId: string; weight: number }[];
}

interface ChartCourse {
  code: string;
  achieved: number;
  target: number;
}

interface RecentItem {
  id: string;
  title: string;
  courseId: string;
  date: string;
  cloIds: string[];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string; id: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const [chartSnapshot, setChartSnapshot] = useState<{
    label?: string;
    date?: string;
    courses: ChartCourse[];
    target: number;
  } | null>(null);
  const [overallAchievement, setOverallAchievement] = useState<number | null>(null);
  const [cloTarget, setCloTarget] = useState(80);
  const [totalCourses, setTotalCourses] = useState(0);
  const [activeCourses, setActiveCourses] = useState(0);
  const [totalAssessments, setTotalAssessments] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ name: payload.name || "User", role: payload.role || "Faculty", id: payload.id });
    } catch {
      setUser({ name: "User", role: "Faculty", id: null });
    }

    Promise.all([
      analyticsApi.getAll(),
      coursesApi.getAll(),
      enrollmentsApi.getAll(),
      assessmentsApi.getAll(),
    ])
      .then(([snapshotData, courseData, enrollmentData, assessmentData]) => {
        // ── CLO chart: latest CLO snapshot ──────────────────────────────
        const cloSnapshots: SnapshotDoc[] = ((snapshotData as SnapshotDoc[]) ?? [])
          .filter((s) => s.metric === "clo")
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const latest = cloSnapshots[0] ?? null;
        if (latest && latest.results.length > 0) {
          // Group results by courseId and average their achievedPct
          const courseMap: Record<string, { total: number; count: number }> = {};
          for (const r of latest.results) {
            if (!courseMap[r.courseId]) courseMap[r.courseId] = { total: 0, count: 0 };
            courseMap[r.courseId].total += r.achievedPct;
            courseMap[r.courseId].count += 1;
          }
          const chartCourses: ChartCourse[] = Object.entries(courseMap).map(([code, v]) => ({
            code,
            achieved: Math.round((v.total / v.count) * 10) / 10,
            target: latest.target,
          }));
          setChartSnapshot({ label: latest.label, date: latest.date, courses: chartCourses, target: latest.target });
          const avg = chartCourses.reduce((s, c) => s + c.achieved, 0) / chartCourses.length;
          setOverallAchievement(Math.round(avg * 10) / 10);
          setCloTarget(latest.target);
        }

        // ── Courses stats ───────────────────────────────────────────────
        const allCourses: CourseDoc[] = (courseData as CourseDoc[]) ?? [];
        const allEnrollments: EnrollmentDoc[] = (enrollmentData as EnrollmentDoc[]) ?? [];
        const activeSet = new Set(
          allEnrollments.filter((e) => e.status === "active").map((e) => e.courseId)
        );
        setTotalCourses(allCourses.length);
        setActiveCourses(activeSet.size);

        // ── Assessments stats ───────────────────────────────────────────
        const allAssessments: AssessmentDoc[] = (assessmentData as AssessmentDoc[]) ?? [];
        const processed = allAssessments.filter((a) => a.status === "processed");
        setTotalAssessments(allAssessments.length);
        setGradedCount(processed.length);

        // ── Recent assessments: 5 most recently graded by dueDate ───────
        const recent: RecentItem[] = processed
          .sort((a, b) => new Date(b.dueDate ?? 0).getTime() - new Date(a.dueDate ?? 0).getTime())
          .slice(0, 5)
          .map((a) => ({
            id: a.assessmentId,
            title: a.title,
            courseId: a.courseId,
            date: a.dueDate
              ? new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—",
            cloIds: a.cloMappings.map((c) => c.cloId),
          }));
        setRecentItems(recent);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="CLO Achievement"
              value={overallAchievement !== null ? `${overallAchievement}%` : "N/A"}
              subtitle={overallAchievement !== null ? `Target ${cloTarget}%` : "No analysis saved yet"}
              bgColor="bg-blue-50"
              textColor="text-blue-600"
            />
            <StatsCard
              title="Total Courses"
              value={totalCourses}
              subtitle={`${activeCourses} with active enrollments`}
              bgColor="bg-green-50"
              textColor="text-green-600"
            />
            <StatsCard
              title="Total Assessments"
              value={totalAssessments}
              subtitle={`Graded ${gradedCount}`}
              bgColor="bg-purple-50"
              textColor="text-purple-600"
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <CLOChart snapshot={chartSnapshot} />
            </div>
            <div>
              <RecentAssessments items={recentItems} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}