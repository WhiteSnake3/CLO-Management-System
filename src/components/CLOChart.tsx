"use client";

export default function CLOChart() {
  const courses = [
    { code: "COSC101", label: "COSC101", achieved: 92, target: 80 },
    { code: "COSC133", label: "COSC133", achieved: 76, target: 80 },
    { code: "COSC191", label: "COSC191", achieved: 68, target: 80 },
    { code: "CMPE160", label: "CMPE160", achieved: 88, target: 80 },
    { code: "CMPE490", label: "CMPE490", achieved: 72, target: 80 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">
          CLO Achievement by Courses
        </h3>
        <div className="text-sm text-slate-500 space-y-1">
          <p>Term: <span className="font-semibold">Fall 2025</span></p>
          <p>Program: <span className="font-semibold">Computer Science</span></p>
          <p>Course: <span className="font-semibold">All Courses</span></p>
        </div>
      </div>

      <div className="space-y-4">
        {courses.map((course) => (
          <div key={course.code} className="flex items-center gap-4">
            <div className="w-20 text-sm font-semibold text-slate-700">
              {course.label}
            </div>
            <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${(course.achieved / 100) * 100}%` }}
              />
            </div>
            <div className="text-sm font-semibold text-slate-700 w-12 text-right">
              {course.achieved}%
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500">
        <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-1 rounded mr-3">
          Achieved %
        </span>
        <span className="inline-block bg-slate-100 text-slate-600 px-2 py-1 rounded">
          Target 80%
        </span>
      </div>
    </div>
  );
}
