"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { courses, getUserFromToken } from "@/lib/api";

export default function CoursesPage() {
  const router = useRouter();
  const [courseList, setCourseList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
      // Fetch all courses and filter by instructor
      const allCourses = await courses.getAll();
      const instructorCourses = allCourses.filter((c: any) => c.instructorId === instructorId);
      setCourseList(instructorCourses);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            + Add Course
          </button>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          {loading ? (
            <p>Loading...</p>
          ) : courseList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No courses found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseList.map((course) => (
                <div
                  key={course._id}
                  className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/dashboard/assessments?courseId=${course._id}`)}
                >
                  <h3 className="font-bold text-lg text-slate-800 mb-2">{course.title}</h3>
                  <p className="text-sm text-slate-600 mb-1">
                    <strong>Course ID:</strong> {course.courseId}
                  </p>
                  <p className="text-sm text-slate-600 mb-1">
                    <strong>Department:</strong> {course.department}
                  </p>
                  <p className="text-sm text-slate-600 mb-1">
                    <strong>Term:</strong> {course.term}
                  </p>
                  {course.CLOs && course.CLOs.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-slate-600 mb-2">CLOs:</p>
                      <div className="space-y-1">
                        {course.CLOs.map((clo: any, i: number) => (
                          <div key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                            {clo.cloId}: {clo.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
