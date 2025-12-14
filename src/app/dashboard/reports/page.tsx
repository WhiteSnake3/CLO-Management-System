"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { courses, assessments } from "@/lib/api";

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoverUnderlineStyle, setHoverUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [assessmentsList, setAssessmentsList] = useState<any[]>([]);

  // Report filters
  const [dateRange, setDateRange] = useState("This term");
  const [selectedTerm, setSelectedTerm] = useState("Fall 2025");
  const [selectedProgram, setSelectedProgram] = useState("CS program");
  const [reportType, setReportType] = useState("Course CLO summary");

  const handleTabHover = (index: number) => {
    if (tabRefs.current[index]) {
      const tab = tabRefs.current[index]!;
      setHoverUnderlineStyle({
        left: tab.offsetLeft,
        width: tab.offsetWidth,
        opacity: 1,
      });
    }
  };

  const handleTabLeave = () => {
    setHoverUnderlineStyle(prev => ({ ...prev, opacity: 0 }));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
      fetchCounts();
    } catch (err) {
      console.error("Failed to decode token", err);
    }
    setLoading(false);
  }, [router]);

  const fetchCounts = async () => {
    try {
      const [coursesData, assessmentsData] = await Promise.all([
        courses.getAll(),
        assessments.getAll(),
      ]);
      setCoursesList(coursesData);
      setAssessmentsList(assessmentsData);
    } catch (err) {
      console.error("Failed to fetch counts", err);
    }
  };

  useEffect(() => {
    // Set underline position for Reports tab (would need to add to tabs)
    if (tabRefs.current[0]) {
      const tab = tabRefs.current[0];
      setUnderlineStyle({
        left: tab.offsetLeft,
        width: tab.offsetWidth,
      });
    }
  }, [user]);

  // Mock generated reports
  const generatedReports = [
    {
      id: 1,
      title: "CS502_CLO summary",
      subtitle: "Generated Oct 05 · Term: Fall 2025 · Cohort: 2023 Intake",
    },
    {
      id: 2,
      title: "CS program outcome report",
      subtitle: "Generated Oct 01 · AY: 2023-24",
    },
    {
      id: 3,
      title: "Student outcome report_2023 cohort",
      subtitle: "Generated Sep 25 · Across 8 courses",
    },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Learning Outcomes Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500">{user?.role === "instructor" ? "Faculty" : user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="px-6 flex gap-6 relative">
            <button
              ref={(el) => { tabRefs.current[0] = el; }}
              onClick={() => router.push("/dashboard")}
              onMouseEnter={() => handleTabHover(0)}
              onMouseLeave={handleTabLeave}
              className="py-3 font-medium text-sm text-gray-600 hover:text-gray-800 transition-colors relative z-10"
            >
              CLO Achievement
            </button>
            <button
              ref={(el) => { tabRefs.current[1] = el; }}
              onClick={() => router.push("/dashboard/courses")}
              onMouseEnter={() => handleTabHover(1)}
              onMouseLeave={handleTabLeave}
              className="py-3 font-medium text-sm text-gray-600 hover:text-gray-800 transition-colors relative z-10 flex items-center gap-1"
            >
              Courses <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-semibold">{coursesList.length}</span>
            </button>
            <button
              ref={(el) => { tabRefs.current[2] = el; }}
              onClick={() => router.push("/dashboard/assessments")}
              onMouseEnter={() => handleTabHover(2)}
              onMouseLeave={handleTabLeave}
              className="py-3 font-medium text-sm text-gray-600 hover:text-gray-800 transition-colors relative z-10 flex items-center gap-1"
            >
              Assessments <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-semibold">{assessmentsList.length}</span>
            </button>
            {user?.role === "instructor" && (
              <button
                ref={(el) => { tabRefs.current[3] = el; }}
                onMouseEnter={() => handleTabHover(3)}
                onMouseLeave={handleTabLeave}
                className="py-3 font-medium text-sm text-gray-600 hover:text-gray-800 transition-colors relative z-10 flex items-center gap-1"
              >
                Students <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-semibold">216</span>
              </button>
            )}
            {user?.role === "admin" && (
              <button
                ref={(el) => { tabRefs.current[4] = el; }}
                onClick={() => router.push("/dashboard/admin")}
                onMouseEnter={() => handleTabHover(4)}
                onMouseLeave={handleTabLeave}
                className="py-3 font-medium text-sm text-gray-600 hover:text-gray-800 transition-colors relative z-10"
              >
                Admin Panel
              </button>
            )}
            {/* Active underline */}
            <div
              className="absolute bottom-0 h-0.5 bg-indigo-600 transition-all duration-300 ease-in-out z-0"
              style={{
                left: `${underlineStyle.left}px`,
                width: `${underlineStyle.width}px`,
              }}
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

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
              <p className="text-sm text-gray-500 mt-1">Generate shareable reports for courses, programs, and student outcomes</p>
            </div>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <span>✏️</span> Generate report
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Date range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>This term</option>
                <option>Last term</option>
                <option>This year</option>
                <option>Custom</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Fall 2025</option>
                <option>Spring 2025</option>
                <option>Summer 2025</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Course / program</label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>CS program</option>
                <option>Business program</option>
                <option>Engineering program</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Report type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Course CLO summary</option>
                <option>Program report</option>
                <option>Student outcome report</option>
              </select>
            </div>
          </div>

          {/* Generated Reports */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generated reports</h3>
            <p className="text-sm text-gray-500 mb-4">Recently generated reports available to download</p>
            
            <div className="space-y-3">
              {generatedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{report.title}</h4>
                    <p className="text-xs text-gray-500">{report.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      View
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                      PDF
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                      Excel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Presets */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Report presets</h3>
            <p className="text-sm text-gray-500 mb-4">Frequently used combinations</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Course CLO summary</h4>
                </div>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm font-medium">
                  Per course
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Program report</h4>
                </div>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm font-medium">
                  Programwide
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Student outcome report</h4>
                </div>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm font-medium">
                  Per cohort
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Manage presets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
