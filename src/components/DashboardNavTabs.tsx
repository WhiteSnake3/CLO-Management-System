"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { courses, assessments, enrollments as enrollmentsApi } from "@/lib/api";

interface DashboardNavTabsProps {
  userRole: string;
}

export default function DashboardNavTabs({ userRole }: DashboardNavTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [courseCount, setCourseCount] = useState(0);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [instructorUserId, setInstructorUserId] = useState<string | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoverUnderlineStyle, setHoverUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const p = JSON.parse(atob(token.split(".")[1]));
        if (p.role === "instructor") setInstructorUserId(p.userId ?? null);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [coursesData, assessmentsData] = await Promise.all([
          courses.getAll(),
          assessments.getAll(),
        ]);
        setCourseCount(Array.isArray(coursesData) ? coursesData.length : 0);
        setAssessmentCount(Array.isArray(assessmentsData) ? assessmentsData.length : 0);
      } catch {
        // counts silently stay at 0 on error
      }
    };
    fetchCounts();
  }, []);

  useEffect(() => {
    if (!instructorUserId) return;
    const fetchStudentCount = async () => {
      try {
        const [allCourses, allEnrollments] = await Promise.all([
          courses.getAll() as Promise<{ courseId: string; instructorId: string }[]>,
          enrollmentsApi.getAll() as Promise<{ courseId: string; studentId: string; status: string }[]>,
        ]);
        const myCourseIds = new Set(
          (allCourses ?? []).filter((c) => c.instructorId === instructorUserId).map((c) => c.courseId)
        );
        const myStudents = new Set(
          (allEnrollments ?? []).filter((e) => myCourseIds.has(e.courseId) && e.status === "active").map((e) => e.studentId)
        );
        setStudentCount(myStudents.size);
      } catch { /* ignore */ }
    };
    fetchStudentCount();
  }, [instructorUserId]);

  const getActiveKey = (): string => {
    if (pathname === "/dashboard") return "dashboard";
    if (pathname.startsWith("/dashboard/courses")) return "courses";
    if (pathname.startsWith("/dashboard/assessments")) return "assessments";
    if (pathname.startsWith("/dashboard/clo-analysis")) return "clo-analysis";
    if (pathname.startsWith("/dashboard/reports")) return "reports";
    if (pathname.startsWith("/dashboard/students")) return "students";
    if (pathname.startsWith("/dashboard/inbox")) return "inbox";
    if (pathname.startsWith("/dashboard/settings")) return "settings";
    if (pathname.startsWith("/dashboard/admin")) return "admin";
    return "";
  };

  const activeKey = getActiveKey();

  // Re-position active underline whenever active tab or rendered tabs change
  useEffect(() => {
    const el = tabRefs.current[activeKey];
    if (el) {
      setUnderlineStyle({ left: el.offsetLeft, width: el.offsetWidth });
    } else {
      setUnderlineStyle({ left: 0, width: 0 });
    }
  }, [activeKey, userRole, courseCount]);

  const handleTabHover = (key: string) => {
    const el = tabRefs.current[key];
    if (el) {
      setHoverUnderlineStyle({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    }
  };

  const handleTabLeave = () => {
    setHoverUnderlineStyle(prev => ({ ...prev, opacity: 0 }));
  };

  const baseClass = "py-3 font-medium text-sm transition-colors relative z-10";
  const activeClass = `${baseClass} text-gray-800`;
  const inactiveClass = `${baseClass} text-gray-600 hover:text-gray-800`;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6 flex gap-6 relative">
        <button
          ref={(el) => { tabRefs.current["dashboard"] = el; }}
          onClick={() => router.push("/dashboard")}
          onMouseEnter={() => handleTabHover("dashboard")}
          onMouseLeave={handleTabLeave}
          className={activeKey === "dashboard" ? activeClass : inactiveClass}
        >
          Dashboard
        </button>

        <button
          ref={(el) => { tabRefs.current["courses"] = el; }}
          onClick={() => router.push("/dashboard/courses")}
          onMouseEnter={() => handleTabHover("courses")}
          onMouseLeave={handleTabLeave}
          className={`${activeKey === "courses" ? activeClass : inactiveClass} flex items-center gap-1`}
        >
          Courses{" "}
          <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-semibold">
            {courseCount}
          </span>
        </button>

        <button
          ref={(el) => { tabRefs.current["assessments"] = el; }}
          onClick={() => router.push("/dashboard/assessments")}
          onMouseEnter={() => handleTabHover("assessments")}
          onMouseLeave={handleTabLeave}
          className={`${activeKey === "assessments" ? activeClass : inactiveClass} flex items-center gap-1`}
        >
          Assessments{" "}
          <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-semibold">
            {assessmentCount}
          </span>
        </button>

        {userRole === "instructor" && (
          <button
            ref={(el) => { tabRefs.current["students"] = el; }}
            onClick={() => router.push("/dashboard/students")}
            onMouseEnter={() => handleTabHover("students")}
            onMouseLeave={handleTabLeave}
            className={`${activeKey === "students" ? activeClass : inactiveClass} flex items-center gap-1`}
          >
            Students{" "}
            <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-semibold">
              {studentCount}
            </span>
          </button>
        )}

        <button
          ref={(el) => { tabRefs.current["clo-analysis"] = el; }}
          onClick={() => router.push("/dashboard/clo-analysis")}
          onMouseEnter={() => handleTabHover("clo-analysis")}
          onMouseLeave={handleTabLeave}
          className={activeKey === "clo-analysis" ? activeClass : inactiveClass}
        >
          CLO Analysis
        </button>

        <button
          ref={(el) => { tabRefs.current["reports"] = el; }}
          onClick={() => router.push("/dashboard/reports")}
          onMouseEnter={() => handleTabHover("reports")}
          onMouseLeave={handleTabLeave}
          className={activeKey === "reports" ? activeClass : inactiveClass}
        >
          Reports
        </button>

        <button
          ref={(el) => { tabRefs.current["inbox"] = el; }}
          onClick={() => router.push("/dashboard/inbox")}
          onMouseEnter={() => handleTabHover("inbox")}
          onMouseLeave={handleTabLeave}
          className={activeKey === "inbox" ? activeClass : inactiveClass}
        >
          Inbox
        </button>

        <button
          ref={(el) => { tabRefs.current["settings"] = el; }}
          onClick={() => router.push("/dashboard/settings")}
          onMouseEnter={() => handleTabHover("settings")}
          onMouseLeave={handleTabLeave}
          className={activeKey === "settings" ? activeClass : inactiveClass}
        >
          Settings
        </button>

        {userRole === "admin" && (
          <button
            ref={(el) => { tabRefs.current["admin"] = el; }}
            onClick={() => router.push("/dashboard/admin")}
            onMouseEnter={() => handleTabHover("admin")}
            onMouseLeave={handleTabLeave}
            className={activeKey === "admin" ? activeClass : inactiveClass}
          >
            Admin Panel
          </button>
        )}

        {/* Active underline */}
        <div
          className="absolute bottom-0 h-0.5 bg-indigo-600 transition-all duration-300 ease-in-out z-0"
          style={{ left: `${underlineStyle.left}px`, width: `${underlineStyle.width}px` }}
        />
        {/* Hover underline */}
        <div
          className="absolute bottom-0 h-0.5 bg-gray-400 transition-all duration-200 ease-in-out z-0"
          style={{
            left: `${hoverUnderlineStyle.left}px`,
            width: `${hoverUnderlineStyle.width}px`,
            opacity: hoverUnderlineStyle.opacity,
          }}
        />
      </div>
    </div>
  );
}
