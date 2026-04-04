"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import DashboardPageHeader from "@/components/DashboardPageHeader";

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Report filters
  const [dateRange, setDateRange] = useState("This term");
  const [selectedTerm, setSelectedTerm] = useState("Fall 2025");
  const [selectedProgram, setSelectedProgram] = useState("CS program");
  const [reportType, setReportType] = useState("Course CLO summary");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch (err) {
      console.error("Failed to decode token", err);
    }
    setLoading(false);
  }, [router]);

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
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        {/* Content */}
        <div className="p-6">
          <DashboardPageHeader
            title="Reports"
            subtitle="Generate shareable reports for courses, programs, and student outcomes"
            actions={
              <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <span>✏️</span> Generate report
              </button>
            }
          />

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
