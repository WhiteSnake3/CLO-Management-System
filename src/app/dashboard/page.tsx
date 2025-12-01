"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import CLOChart from "@/components/CLOChart";
import RecentAssessments from "@/components/RecentAssessments";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        name: payload.name || "User",
        role: payload.role || "Faculty",
        id: payload.id,
      });
    } catch {
      setUser({ name: "User", role: "Faculty", id: null });
    }
    setLoading(false);
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Learning Outcomes Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search"
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button className="text-slate-500 hover:text-slate-700">🔍</button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                👤
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 flex gap-8">
            {["CLO Achievement", "Courses", "Assessments", "Students", ...(user?.role === "admin" ? ["Admin Panel"] : [])].map((tab, i) => (
              <button
                key={tab}
                className={`py-4 font-medium text-sm border-b-2 transition ${
                  i === 0
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-600 hover:text-slate-800"
                }`}
              >
                {tab} {i === 3 && <span className="ml-1 bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full text-xs">99+</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="CLO Achievement"
              value="82%"
              subtitle="Target 80%"
              bgColor="bg-blue-50"
              textColor="text-blue-600"
            />
            <StatsCard
              title="Total Courses this Semester"
              value="5"
              subtitle="Active 2"
              bgColor="bg-green-50"
              textColor="text-green-600"
            />
            <StatsCard
              title="Total Assessments"
              value="136"
              subtitle="Graded 112"
              bgColor="bg-purple-50"
              textColor="text-purple-600"
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <CLOChart />
            </div>
            <div>
              <RecentAssessments />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}