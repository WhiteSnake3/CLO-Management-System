"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { assessments, courses, performances, students } from "@/lib/api";

function AssessmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [courseList, setCourseList] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(courseId || "");
  const [assessmentList, setAssessmentList] = useState<any[]>([]);
  const [allAssessmentsList, setAllAssessmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoverUnderlineStyle, setHoverUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    type: "assignment",
    totalMarks: 100,
    dueDate: "",
  });
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [performanceList, setPerformanceList] = useState<any[]>([]);
  const [loadingPerformances, setLoadingPerformances] = useState(false);
  const [studentList, setStudentList] = useState<any[]>([]);

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

    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch (err) {
      console.error("Failed to decode token", err);
    }

    fetchCourses();
  }, [router]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAssessments(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const [allCourses, allAssessments, allStudents] = await Promise.all([
        courses.getAll(),
        assessments.getAll(),
        students.getAll(),
      ]);
      setCourseList(allCourses);
      setAllAssessmentsList(allAssessments);
      setStudentList(allStudents);
      if (courseId) {
        setSelectedCourse(courseId);
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async (cId: string) => {
    try {
      const allAssessments = await assessments.getAll();
      const filtered = allAssessments.filter((a: any) => a.courseId === cId);
      setAssessmentList(filtered);
    } catch (err) {
      console.error("Failed to fetch assessments", err);
    }
  };

  const fetchPerformancesForAssessment = async (assessmentId: string) => {
    setLoadingPerformances(true);
    try {
      const allPerformances = await performances.getAll();
      console.log("All performances:", allPerformances);
      console.log("Looking for assessment _id:", assessmentId);
      // Filter by assessment _id since performance records store it as assessmentId
      const filtered = allPerformances.filter((p: any) => p.assessmentId === assessmentId);
      console.log("Filtered performances:", filtered);
      setPerformanceList(filtered);
    } catch (err) {
      console.error("Failed to fetch performances", err);
      setPerformanceList([]);
    } finally {
      setLoadingPerformances(false);
    }
  };

  const handleAddAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      const newAssessment = {
        ...formData,
        courseId: selectedCourse,
        assessmentId: `A-${Date.now()}`,
        cloMappings: [],
      };
      await assessments.create(newAssessment);
      setFormData({ title: "", type: "assignment", totalMarks: 100, dueDate: "" });
      setShowForm(false);
      fetchAssessments(selectedCourse);
    } catch (err) {
      console.error("Failed to add assessment", err);
    }
  };

  useEffect(() => {
    // Set underline position for active tab (index 2 - Assessments)
    if (tabRefs.current[2]) {
      const tab = tabRefs.current[2];
      setUnderlineStyle({
        left: tab.offsetLeft,
        width: tab.offsetWidth,
      });
    }
  }, [user]);

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
              Courses <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-semibold">{courseList.length}</span>
            </button>
            <button
              ref={(el) => { tabRefs.current[2] = el; }}
              onClick={() => router.push("/dashboard/assessments")}
              onMouseEnter={() => handleTabHover(2)}
              onMouseLeave={handleTabLeave}
              className="py-3 font-medium text-sm text-gray-800 transition-colors relative z-10 flex items-center gap-1"
            >
              Assessments <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-semibold">{allAssessmentsList.length}</span>
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Assessments</h2>
            <p className="text-sm text-gray-500 mt-1">Upload grades, map to CLOs, and manage assessment data</p>
          </div>

          {/* Upload Process Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Step 1: Select Course */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Select course</h3>
              <p className="text-xs text-gray-500 mb-4">Choose where this assessment belongs</p>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-3"
              >
                <option value="">-- Choose a Course --</option>
                {courseList.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.courseId} - {course.title}
                  </option>
                ))}
              </select>
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Assessment:</span>
                  <select className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs">
                    <option>Select assessment</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Upload File */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Upload file</h3>
              <p className="text-xs text-gray-500 mb-4">Import grades from spreadsheet</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-sm text-gray-500 mb-2">Drop file here or browse</p>
                <p className="text-xs text-gray-400">.csv, .xls or .xlsx - Max 4.1 MB</p>
              </div>
              <button className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium">
                grades_export2_exported.csv
              </button>
            </div>

            {/* Step 3: Map Columns */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Map columns</h3>
              <p className="text-xs text-gray-500 mb-4">Match file columns to student IDs, grades, and CLO IDs</p>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Student ID</span>
                  <span className="text-gray-400">Column A</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Student Name</span>
                  <span className="text-gray-400">Column B</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Grade</span>
                  <span className="text-gray-400">Column C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">CLO mapping</span>
                  <span className="text-gray-400">Based on question graph</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs font-medium">
                  Review mapping
                </button>
                <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-medium">
                  Process
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mb-6">
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <span>↑</span> Upload grades
            </button>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <span>📄</span> Download template
            </button>
          </div>

          {/* Existing Assessments Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Existing Assessments</h3>
                  <p className="text-sm text-gray-500 mt-1">All assessments mapped to CLOs</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Processed / Pending</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full">
              <thead className="bg-indigo-900 text-white">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Course</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">CLO linked</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">Loading...</td>
                  </tr>
                ) : (selectedCourse ? assessmentList : allAssessmentsList).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">No assessments found</td>
                  </tr>
                ) : (
                  (selectedCourse ? assessmentList : allAssessmentsList).map((assessment) => {
                    const course = courseList.find(c => c._id === assessment.courseId);
                    return (
                      <tr key={assessment._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700 font-medium">{assessment.title}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{course?.courseId || assessment.courseId}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 capitalize">{assessment.type}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {assessment.cloMappings?.length > 0 
                            ? assessment.cloMappings.map((m: any) => m.cloId).join(', ')
                            : 'None'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Processed
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setSelectedAssessment(assessment);
                                fetchPerformancesForAssessment(assessment.assessmentId);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                              Reprocess
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Modal */}
        {selectedAssessment && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
              {/* Modal Header */}
              <div className="bg-indigo-900 text-white p-6 flex justify-between items-center sticky top-0">
                <div>
                  <h2 className="text-xl font-semibold">{selectedAssessment.title}</h2>
                  <p className="text-indigo-200 text-sm mt-1">Student Performances</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAssessment(null);
                    setPerformanceList([]);
                  }}
                  className="text-white hover:bg-indigo-800 rounded-full p-2 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {loadingPerformances ? (
                  <div className="text-center py-12 text-gray-500">Loading performances...</div>
                ) : performanceList.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No performances found for this assessment</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">StudentID</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Percentage</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {performanceList.map((perf) => {
                        const maxScore = perf.maxScore || selectedAssessment.totalMarks || 100;
                        const percentage = Math.round((perf.score / maxScore) * 100);
                        const statusColor = percentage >= 70 ? 'bg-green-100 text-green-800' : percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                        const student = studentList.find((s: any) => s.studentId === perf.studentId);
                        const studentName = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'N/A';
                        
                        return (
                          <tr key={perf._id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-700 font-medium">{perf.studentId || 'N/A'}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">{studentName}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{perf.score}/{maxScore}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{percentage}%</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                {percentage >= 70 ? 'Passed' : percentage >= 50 ? 'At Risk' : 'Failed'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedAssessment(null);
                    setPerformanceList([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssessmentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssessmentsContent />
    </Suspense>
  );
}
