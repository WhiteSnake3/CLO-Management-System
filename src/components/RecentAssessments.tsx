"use client";

interface RecentAssessment {
  id: string;
  title: string;
  courseId: string;
  date: string;
  cloIds: string[];
}

export default function RecentAssessments({ items }: { items: RecentAssessment[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-slate-200 flex items-center justify-center min-h-[200px]">
        <p className="text-slate-500 text-sm">No graded assessments yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <h3 className="text-base font-bold text-slate-800 mb-1">Recent Assessments</h3>
      <p className="text-xs text-slate-500 mb-4">5 most recently graded</p>

      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition">
            <div className="flex justify-between items-start mb-1.5">
              <div>
                <p className="font-semibold text-slate-800 text-sm">{a.title}</p>
                <p className="text-xs text-slate-500">{a.courseId}</p>
              </div>
              <p className="text-xs text-slate-500 shrink-0">{a.date}</p>
            </div>
            {a.cloIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {a.cloIds.map((clo) => (
                  <span
                    key={clo}
                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full"
                  >
                    {clo}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
