"use client";

import { useRouter } from "next/navigation";

interface ChartCourse {
  code: string;
  achieved: number;
  target: number;
}

interface CLOChartProps {
  snapshot: {
    label?: string;
    date?: string;
    courses: ChartCourse[];
    target: number;
  } | null;
}

export default function CLOChart({ snapshot }: CLOChartProps) {
  const router = useRouter();

  if (!snapshot || snapshot.courses.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-slate-200 flex flex-col items-center justify-center min-h-[200px] gap-4">
        <p className="text-slate-500 text-sm">No CLO analysis saved yet.</p>
        <button
          onClick={() => router.push("/dashboard/clo-analysis")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          Go to CLO Analysis
        </button>
      </div>
    );
  }

  const { courses, target, label, date } = snapshot;

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">CLO Achievement by Course</h3>
          {label && <p className="text-xs text-slate-500 mt-0.5">{label}</p>}
        </div>
        {date && (
          <p className="text-xs text-slate-400">
            {new Date(date).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {courses.map((course) => {
          const onTrack = course.achieved >= target;
          return (
            <div key={course.code} className="flex items-center gap-3">
              <div className="w-20 text-xs font-semibold text-slate-700 shrink-0">
                {course.code}
              </div>
              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    onTrack ? "bg-indigo-500" : "bg-amber-400"
                  }`}
                  style={{ width: `${Math.min(course.achieved, 100)}%` }}
                />
              </div>
              <div
                className={`text-xs font-semibold w-10 text-right shrink-0 ${
                  onTrack ? "text-indigo-600" : "text-amber-600"
                }`}
              >
                {course.achieved}%
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
          On target (≥{target}%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
          Below target
        </span>
      </div>
    </div>
  );
}
