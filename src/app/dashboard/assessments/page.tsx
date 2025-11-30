"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { assessments, courses, performances } from "@/lib/api";

function AssessmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [courseList, setCourseList] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(courseId || "");
  const [assessmentList, setAssessmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "assignment",
    totalMarks: 100,
    dueDate: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
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
      const allCourses = await courses.getAll();
      setCourseList(allCourses);
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

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Assessments</h1>
          {selectedCourse && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              {showForm ? "Cancel" : "+ Add Assessment"}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Course Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setShowForm(false);
              }}
              className="w-full md:w-96 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">-- Choose a Course --</option>
              {courseList.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseId} - {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Add Assessment Form */}
          {showForm && selectedCourse && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg text-slate-800 mb-4">Create New Assessment</h3>
              <form onSubmit={handleAddAssessment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                      <option value="quiz">Quiz</option>
                      <option value="project">Project</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      value={formData.totalMarks}
                      onChange={(e) =>
                        setFormData({ ...formData, totalMarks: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  Create Assessment
                </button>
              </form>
            </div>
          )}

          {/* Assessments List */}
          {selectedCourse && assessmentList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No assessments for this course</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessmentList.map((assessment) => (
                <div
                  key={assessment._id}
                  className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{assessment.title}</h3>
                      <p className="text-sm text-slate-600">
                        Type: <span className="font-semibold">{assessment.type}</span>
                      </p>
                    </div>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {assessment.totalMarks} marks
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                    <div>
                      <strong>Due Date:</strong>{" "}
                      {assessment.dueDate
                        ? new Date(assessment.dueDate).toLocaleDateString()
                        : "N/A"}
                    </div>
                    <div>
                      <strong>Assessment ID:</strong> {assessment.assessmentId}
                    </div>
                  </div>
                  {assessment.cloMappings && assessment.cloMappings.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">CLO Mappings:</p>
                      <div className="flex flex-wrap gap-2">
                        {assessment.cloMappings.map((mapping: any, i: number) => (
                          <span
                            key={i}
                            className="bg-slate-100 text-slate-700 px-2 py-1 text-xs rounded"
                          >
                            {mapping.cloId} ({mapping.weight * 100}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">
                    Grade Assessment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
