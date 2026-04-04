"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import { courses, enrollments } from "@/lib/api";

export default function CoursesPage() {
  const router = useRouter();
  const [courseList, setCourseList] = useState<any[]>([]);
  const [enrollmentsList, setEnrollmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("Fall 2025");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [selectedInstructor, setSelectedInstructor] = useState("Me");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


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
      
      // Fetch courses for this instructor
      if (payload.id) {
        fetchInstructorCourses(payload.id);
      }
    } catch (err) {
      console.error("Failed to decode token", err);
      setLoading(false);
    }
  }, [router]);

  const fetchInstructorCourses = async (instructorId: string) => {
    try {
      const [allCourses, allEnrollments] = await Promise.all([
        courses.getAll(),
        enrollments.getAll(),
      ]);
      setCourseList(allCourses);
      setEnrollmentsList(allEnrollments);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(courseList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCourses = courseList.slice(startIndex, endIndex);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        {/* Content */}
        <div className="p-6">
          <DashboardPageHeader
            title="Courses"
            subtitle="Manage Courses, enrollment, and CLO mapping"
            actions={
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-96"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            }
          />

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
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
                <label className="text-sm font-medium text-gray-600">Program</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>All Programs</option>
                  <option>Computer Science</option>
                  <option>Business</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Instructor</label>
                <select
                  value={selectedInstructor}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Me</option>
                  <option>All Instructors</option>
                </select>
              </div>
              <div className="ml-auto">
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium underline">
                  Active / Planned
                </button>
              </div>
            </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-indigo-900 text-white">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Instructor</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Enrolled</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">Loading...</td>
                  </tr>
                ) : currentCourses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">No courses found</td>
                  </tr>
                ) : (
                  currentCourses.map((course) => {
                    const enrolledCount = enrollmentsList.filter((e: any) => e.courseId === course.courseId).length;
                    return (
                    <tr key={course._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-700">{course.courseId}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 font-medium">{course.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{course.instructorId}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{enrolledCount}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => router.push(`/dashboard/assessments?courseId=${course.courseId}`)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            View
                          </button>
                          <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                            Edit
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

          {/* Pagination */}
          {!loading && courseList.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, courseList.length)} of {courseList.length} courses
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                {[...Array(Math.min(3, totalPages))].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 border rounded text-sm ${
                      currentPage === i + 1
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
