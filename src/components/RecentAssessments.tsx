"use client";

export default function RecentAssessments() {
  const assessments = [
    { id: 1, name: "Midterm Exam", course: "COSC101", date: "Dec 15", clos: ["CLO1", "CLO2", "CLO4", "CLO5"] },
    { id: 2, name: "Quiz 3", course: "COSC133", date: "Dec 10", clos: ["CLO3", "CLO5"] },
    { id: 3, name: "Project 1", course: "COSC191", date: "Dec 08", clos: ["CLO1", "CLO2", "CLO3"] },
    { id: 4, name: "Lab 4", course: "CMPE160", date: "Dec 05", clos: ["CLO2", "CLO4"] },
    { id: 5, name: "Final Assignment", course: "CMPE490", date: "Dec 01", clos: ["CLO1", "CLO5"] },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Assessments</h3>
      <p className="text-xs text-slate-500 mb-4">Most recent 5 across your courses</p>

      <div className="space-y-3">
        {assessments.map((assessment) => (
          <div key={assessment.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-slate-800">{assessment.name}</p>
                <p className="text-xs text-slate-500">{assessment.course}</p>
              </div>
              <p className="text-xs text-slate-500">{assessment.date}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {assessment.clos.map((clo) => (
                <span
                  key={clo}
                  className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"
                >
                  {clo}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
