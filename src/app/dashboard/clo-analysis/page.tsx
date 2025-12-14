"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { courses, assessments } from "@/lib/api";

export default function CLOAnalysisPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoverUnderlineStyle, setHoverUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [assessmentsList, setAssessmentsList] = useState<any[]>([]);

  // Filters
  const [selectedTerm, setSelectedTerm] = useState("Fall 2025");
  const [selectedCourse, setSelectedCourse] = useState("COSC210 Data Structures");
  const [selectedSection, setSelectedSection] = useState("All sections");
  const [selectedCohort, setSelectedCohort] = useState("2023 intake");

  // Mock CLO data
  const cloData = [
    { id: "COSC101", achieved: 92, target: 80, description: "Apply fundamental programming concepts" },
    { id: "COSC120", achieved: 76, target: 80, description: "Demonstrate problem-solving skills" },
    { id: "COSC101", achieved: 68, target: 80, description: "Design and implement algorithms" },
    { id: "CMPE 160", achieved: 88, target: 80, description: "Analyze data structures and complexity" },
    { id: "CMPE 490", achieved: 72, target: 80, description: "Evaluate and optimize code performance" },
  ];

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
    if (tabRefs.current[0]) {
      const tab = tabRefs.current[0];
      setUnderlineStyle({
        left: tab.offsetLeft,
        width: tab.offsetWidth,
      });
    }
  }, [user]);

  const getStatusColor = (achieved: number, target: number) => {
    if (achieved >= target) return "bg-green-500";
    if (achieved >= target - 10) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusText = (achieved: number, target: number) => {
    if (achieved >= target) return "On track";
    if (achieved >= target - 10) return "Slightly below target";
    return "At risk";
  };

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
              <h2 className="text-2xl font-bold text-gray-900">CLO Analysis</h2>
              <p className="text-sm text-gray-500 mt-1">Automated calculation of CLO achievement by cohort, course, and semester</p>
            </div>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <span>📊</span> Analysis settings
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-8">
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
              <label className="text-sm font-medium text-gray-600">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>COSC210 Data Structures</option>
                <option>COSC101 Programming Fundamentals</option>
                <option>CMPE165 Database Systems</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>All sections</option>
                <option>Section A</option>
                <option>Section B</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Cohort</label>
              <select
                value={selectedCohort}
                onChange={(e) => setSelectedCohort(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>2023 intake</option>
                <option>2024 intake</option>
                <option>2025 intake</option>
              </select>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* CLO Achievement Chart */}
            <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">CLO Achievement vs target</h3>
              <p className="text-sm text-gray-500 mb-4">Per CLO, based on processed assessments</p>
              
              {/* Legend */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-indigo-600"></div>
                  <span className="text-sm text-gray-600">Achieved %</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-gray-400"></div>
                  <span className="text-sm text-gray-600">Target 80%</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {cloData.map((clo, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 w-24">{clo.id}</span>
                    <div className="flex-1 relative h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-indigo-600 rounded-full"
                        style={{ width: `${clo.achieved}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-12 text-right">{clo.achieved}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation Method */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Calculation method</h3>
              <p className="text-sm text-gray-500 mb-4">Weighted aggregation of assessment scores by CLO contribution</p>
              
              <div className="space-y-3 mb-6">
                <div className="text-sm">
                  <p className="font-medium text-gray-700 mb-2">Method</p>
                  <ul className="space-y-1 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>Question Level CLO mapping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>Normalized to 100-point scale</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>Weighted by assessment type</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="font-medium text-gray-700 mb-2 text-sm">Population</p>
                  <p className="text-sm text-gray-600">35 students</p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="font-medium text-gray-700 mb-2 text-sm">Included assessments</p>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Exams: 4</span>
                    <span>Projects: 2</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <button className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
                  ⟲ Recalculate
                </button>
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                  View formula
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="font-medium text-gray-700 mb-3 text-sm">Status summary</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">2 CLOs on track</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-600">1 CLO slightly below target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-600">1 CLO at risk</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CLO Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">CLO Table</h3>
              <p className="text-sm text-gray-500 mt-1">Status with targets and thresholds</p>
            </div>

            <table className="w-full">
              <thead className="bg-indigo-900 text-white">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm">CLO</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Target %</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Achieved %</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cloData.map((clo, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-700">{clo.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{clo.description}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{clo.target}%</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">{clo.achieved}%</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        clo.achieved >= clo.target 
                          ? 'bg-green-100 text-green-800'
                          : clo.achieved >= clo.target - 10
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getStatusText(clo.achieved, clo.target)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
