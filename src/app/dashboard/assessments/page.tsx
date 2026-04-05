"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import DashboardPageHeader from "@/components/DashboardPageHeader";
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

  // Grading workflow state
  const gradeFileRef = useRef<HTMLInputElement>(null);
  const [gradingAssessment, setGradingAssessment] = useState<any>(null);
  const [gradeFile, setGradeFile] = useState<File | null>(null);
  const [parsedGrades, setParsedGrades] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [processingGrades, setProcessingGrades] = useState(false);
  const [processResult, setProcessResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Reprocess state
  const [reprocessAssessment, setReprocessAssessment] = useState<any>(null);
  const [showReprocessModal, setShowReprocessModal] = useState(false);
  const [reprocessPerformances, setReprocessPerformances] = useState<any[]>([]);
  const [reprocessStudents, setReprocessStudents] = useState<any[]>([]);
  const [reprocessLoading, setReprocessLoading] = useState(false);
  const [editedScores, setEditedScores] = useState<Record<string, string>>({});
  const [savingReprocess, setSavingReprocess] = useState(false);
  const [reprocessResult, setReprocessResult] = useState<{ success: boolean; message: string } | null>(null);

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
      const [allPerformances, allStudents] = await Promise.all([
        performances.getAll(),
        students.getAll(),
      ]);
      setStudentList(allStudents);
      // Filter by assessment _id since performance records store it as assessmentId
      const filtered = allPerformances.filter((p: any) => p.assessmentId === assessmentId);
      setPerformanceList(filtered);
    } catch (err) {
      console.error("Failed to fetch performances", err);
      setPerformanceList([]);
    } finally {
      setLoadingPerformances(false);
    }
  };

  const handleDownloadGradeTemplate = () => {
    if (!gradingAssessment) return;
    const cloIds: string[] = (gradingAssessment.cloMappings ?? []).map((m: any) => m.cloId);
    const headers = ["studentid", "studentname", "grade", ...cloIds];
    const exampleRow = ["S001", "John Doe", gradingAssessment.totalMarks, ...cloIds.map(() => "")];
    const csv = [headers.join(","), exampleRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grades_template_${gradingAssessment.assessmentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseGradeCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
      return row;
    });
  };

  const handleGradeFileChange = (file: File) => {
    setGradeFile(file);
    setProcessResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setParsedGrades(parseGradeCSV(text));
    };
    reader.readAsText(file);
  };

  const handleProcessGrades = async () => {
    if (!gradingAssessment || parsedGrades.length === 0) return;
    setProcessingGrades(true);
    setProcessResult(null);
    try {
      const cloMappings: { cloId: string; weight: number }[] = gradingAssessment.cloMappings ?? [];
      const totalMarks: number = gradingAssessment.totalMarks ?? 100;
      let created = 0;
      for (const row of parsedGrades) {
        const score = parseFloat(row["grade"]) || 0;
        const cloScores = cloMappings.map((m) => {
          const rawVal = row[m.cloId.toLowerCase()] ?? row[m.cloId] ?? "";
          const cloScore = rawVal !== "" ? parseFloat(rawVal) : score * m.weight;
          return { cloId: m.cloId, score: cloScore, max: m.weight * totalMarks };
        });
        await performances.create({
          performanceId: `PERF-${gradingAssessment.assessmentId}-${row["studentid"]}-${Date.now()}-${created}`,
          studentId: row["studentid"],
          assessmentId: gradingAssessment.assessmentId,
          courseId: gradingAssessment.courseId,
          score,
          maxScore: totalMarks,
          cloScores,
          gradedBy: user?.userId ?? "admin",
          date: new Date().toISOString(),
        });
        created++;
      }
      await assessments.update(gradingAssessment._id, { status: "processed" });
      setGradeFile(null);
      setParsedGrades([]);
      setShowReviewModal(false);
      await fetchCourses();
      if (selectedCourse) await fetchAssessments(selectedCourse);
      setProcessResult({ success: true, message: `Successfully processed ${created} grade record(s).` });
    } catch (err: any) {
      setProcessResult({ success: false, message: err.message ?? "An error occurred while processing grades." });
    } finally {
      setProcessingGrades(false);
    }
  };

  const handleOpenReprocess = async (assessment: any) => {
    setReprocessAssessment(assessment);
    setShowReprocessModal(true);
    setReprocessResult(null);
    setReprocessLoading(true);
    try {
      const [allPerformances, allStudents] = await Promise.all([
        performances.getAll(),
        students.getAll(),
      ]);
      const filtered = allPerformances.filter((p: any) => p.assessmentId === assessment.assessmentId);
      setReprocessPerformances(filtered);
      setReprocessStudents(allStudents);
      const initScores: Record<string, string> = {};
      filtered.forEach((p: any) => { initScores[p._id] = String(p.score ?? ""); });
      setEditedScores(initScores);
    } catch (err) {
      console.error("Failed to load reprocess data", err);
    } finally {
      setReprocessLoading(false);
    }
  };

  const handleSaveReprocess = async () => {
    if (!reprocessAssessment) return;
    setSavingReprocess(true);
    setReprocessResult(null);
    try {
      const cloMappings: { cloId: string; weight: number }[] = reprocessAssessment.cloMappings ?? [];
      const totalMarks: number = reprocessAssessment.totalMarks ?? 100;
      let updated = 0;
      for (const perf of reprocessPerformances) {
        const newScore = parseFloat(editedScores[perf._id] ?? String(perf.score));
        const cloScores = cloMappings.map((m) => ({
          cloId: m.cloId,
          score: newScore * m.weight,
          max: m.weight * totalMarks,
        }));
        await performances.update(perf._id, { score: newScore, maxScore: totalMarks, cloScores });
        updated++;
      }
      await assessments.update(reprocessAssessment._id, { status: "processed" });
      await fetchCourses();
      if (selectedCourse) await fetchAssessments(selectedCourse);
      setReprocessResult({ success: true, message: `Updated ${updated} grade record(s) successfully.` });
    } catch (err: any) {
      setReprocessResult({ success: false, message: err.message ?? "An error occurred while saving." });
    } finally {
      setSavingReprocess(false);
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
        status: "pending",
      };
      await assessments.create(newAssessment);
      setFormData({ title: "", type: "assignment", totalMarks: 100, dueDate: "" });
      setShowForm(false);
      fetchAssessments(selectedCourse);
    } catch (err) {
      console.error("Failed to add assessment", err);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        {/* Content */}
        <div className="p-6">
          <DashboardPageHeader
            title="Assessments"
            subtitle="Upload grades, map to CLOs, and manage assessment data"
          />

          {/* Upload Process Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Step 1: Select Course */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Select course</h3>
              <p className="text-xs text-gray-500 mb-4">Choose where this assessment belongs</p>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setGradingAssessment(null);
                  setGradeFile(null);
                  setParsedGrades([]);
                  setProcessResult(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-3"
              >
                <option value="">-- Choose a Course --</option>
                {courseList.map((course) => (
                  <option key={course._id} value={course.courseId}>
                    {course.courseId} - {course.title}
                  </option>
                ))}
              </select>
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Assessment:</span>
                  <select
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
                    disabled={!selectedCourse}
                    value={gradingAssessment?.assessmentId ?? ""}
                    onChange={(e) => {
                      const found = assessmentList.find((a) => a.assessmentId === e.target.value) ?? null;
                      setGradingAssessment(found);
                      setGradeFile(null);
                      setParsedGrades([]);
                      setProcessResult(null);
                    }}
                  >
                    <option value="">{selectedCourse ? "Select assessment" : "Select a course first"}</option>
                    {assessmentList.map((a) => (
                      <option key={a._id} value={a.assessmentId}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Upload File */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Upload file</h3>
              <p className="text-xs text-gray-500 mb-4">Import grades from a .csv file</p>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  !gradingAssessment
                    ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                    : dragOver
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-300 hover:border-indigo-300 cursor-pointer"
                }`}
                onClick={() => gradingAssessment && gradeFileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (gradingAssessment) setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (!gradingAssessment) return;
                  const file = e.dataTransfer.files[0];
                  if (file && file.name.endsWith(".csv")) handleGradeFileChange(file);
                }}
              >
                {gradingAssessment ? (
                  <>
                    <p className="text-sm text-gray-500 mb-2">Drop file here or click to browse</p>
                    <p className="text-xs text-gray-400">.csv only</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Select a course and assessment first</p>
                )}
              </div>
              {gradeFile ? (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-gray-100 rounded text-sm text-gray-700">
                  <span>📄</span>
                  <span className="truncate flex-1">{gradeFile.name}</span>
                  <button
                    onClick={() => { setGradeFile(null); setParsedGrades([]); }}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >✕</button>
                </div>
              ) : (
                <div className="mt-3 h-8" />
              )}
            </div>

            {/* Step 3: Map Columns */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Map columns</h3>
              <p className="text-xs text-gray-500 mb-4">Auto-mapped from template headers</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Student ID</span>
                  <span className="text-gray-400">studentid</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Student Name</span>
                  <span className="text-gray-400">studentname</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Grade</span>
                  <span className="text-gray-400">grade (max: {gradingAssessment?.totalMarks ?? "—"})</span>
                </div>
                {(gradingAssessment?.cloMappings ?? []).map((m: any) => (
                  <div key={m.cloId} className="flex justify-between items-center">
                    <span className="text-gray-600">CLO: {m.cloId}</span>
                    <span className="text-gray-400">weight {m.weight}</span>
                  </div>
                ))}
                {!gradingAssessment && (
                  <p className="text-gray-400 text-center py-2 italic">No assessment selected</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowReviewModal(true)}
                  disabled={!gradeFile || !gradingAssessment}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 px-3 py-1.5 rounded text-xs font-medium"
                >
                  Review mapping
                </button>
                <button
                  onClick={handleProcessGrades}
                  disabled={!gradeFile || !gradingAssessment || processingGrades}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium"
                >
                  {processingGrades ? "Processing..." : "Process"}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            {processResult && (
              <div className={`flex-1 mr-4 px-4 py-2 rounded-lg text-sm font-medium ${
                processResult.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {processResult.message}
              </div>
            )}
            <div className="ml-auto">
              <button
                onClick={handleDownloadGradeTemplate}
                disabled={!gradingAssessment}
                title={!gradingAssessment ? "Select a course and assessment first" : "Download grade template CSV"}
                className="bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <span>📄</span> Download template
              </button>
            </div>
          </div>

          {/* Existing Assessments Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Existing Assessments</h3>
                  <p className="text-sm text-gray-500 mt-1">All assessments mapped to CLOs</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Processed</span>
                  <span className="text-gray-400">/</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
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
                    const course = courseList.find(c => c.courseId === assessment.courseId);
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
                          {assessment.status === "processed" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Processed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setSelectedAssessment(assessment);
                                fetchPerformancesForAssessment(assessment.assessmentId);
                              }}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-full transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleOpenReprocess(assessment)}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-full transition-colors"
                            >
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

        {/* Hidden file input for grade CSV */}
        <input
          ref={gradeFileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleGradeFileChange(file);
            e.target.value = "";
          }}
        />

        {/* Review Grades Modal */}
        {showReviewModal && gradingAssessment && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
              <div className="bg-indigo-900 text-white p-6 flex justify-between items-center sticky top-0">
                <div>
                  <h2 className="text-xl font-semibold">Review Grade Mapping</h2>
                  <p className="text-indigo-200 text-sm mt-1">{gradingAssessment.title} — {parsedGrades.length} record(s)</p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-white hover:bg-indigo-800 rounded-full p-2 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-x-auto">
                {parsedGrades.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No data parsed from file</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Student ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Grade / {gradingAssessment.totalMarks}</th>
                        {(gradingAssessment.cloMappings ?? []).map((m: any) => (
                          <th key={m.cloId} className="text-left py-3 px-4 font-semibold text-sm text-gray-700">{m.cloId}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedGrades.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-700 font-medium">{row["studentid"]}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{row["studentname"]}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{row["grade"]}</td>
                          {(gradingAssessment.cloMappings ?? []).map((m: any) => {
                            const val = row[m.cloId.toLowerCase()] ?? row[m.cloId] ?? "";
                            const auto = (parseFloat(row["grade"] || "0") * m.weight).toFixed(1);
                            return (
                              <td key={m.cloId} className="py-3 px-4 text-sm">
                                {val !== "" ? (
                                  <span className="text-gray-700">{val}</span>
                                ) : (
                                  <span className="text-gray-400 italic">auto ({auto})</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowReviewModal(false); handleProcessGrades(); }}
                  disabled={processingGrades}
                  className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors font-medium text-sm"
                >
                  {processingGrades ? "Processing..." : "Process Grades"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reprocess Modal */}
        {showReprocessModal && reprocessAssessment && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto">
              <div className="bg-indigo-900 text-white p-6 flex justify-between items-center sticky top-0">
                <div>
                  <h2 className="text-xl font-semibold">Reprocess Grades</h2>
                  <p className="text-indigo-200 text-sm mt-1">{reprocessAssessment.title} — edit scores below</p>
                </div>
                <button
                  onClick={() => { setShowReprocessModal(false); setReprocessResult(null); }}
                  className="text-white hover:bg-indigo-800 rounded-full p-2 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                {reprocessLoading ? (
                  <div className="text-center py-12 text-gray-500">Loading performances...</div>
                ) : reprocessPerformances.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No performances found for this assessment</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Student ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Current Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">New Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reprocessPerformances.map((perf) => {
                        const student = reprocessStudents.find((s: any) => s.studentId === perf.studentId);
                        const studentName = student ? `${student.firstName || ""} ${student.lastName || ""}`.trim() : "N/A";
                        return (
                          <tr key={perf._id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-700 font-medium">{perf.studentId}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{studentName}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{perf.score}/{perf.maxScore ?? reprocessAssessment.totalMarks}</td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min={0}
                                max={reprocessAssessment.totalMarks}
                                value={editedScores[perf._id] ?? ""}
                                onChange={(e) => setEditedScores((prev) => ({ ...prev, [perf._id]: e.target.value }))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-400">{reprocessAssessment.totalMarks}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {reprocessResult && (
                  <div className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
                    reprocessResult.success
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {reprocessResult.message}
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
                <button
                  onClick={() => { setShowReprocessModal(false); setReprocessResult(null); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveReprocess}
                  disabled={savingReprocess || reprocessPerformances.length === 0}
                  className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors font-medium text-sm"
                >
                  {savingReprocess ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

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
