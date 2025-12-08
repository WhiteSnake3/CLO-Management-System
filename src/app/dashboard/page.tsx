"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import CLOChart from "@/components/CLOChart";
import RecentAssessments from "@/components/RecentAssessments";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoverUnderlineStyle, setHoverUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  useEffect(() => {
    // Set underline position for active tab (index 0)
    if (tabRefs.current[0]) {
      const tab = tabRefs.current[0];
      setUnderlineStyle({
        left: tab.offsetLeft,
        width: tab.offsetWidth,
      });
    }
  }, [user]);

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
          <div className="max-w-7xl mx-auto px-6 flex gap-8 relative">
            <button
              ref={(el) => { tabRefs.current[0] = el; }}
              onClick={() => router.push("/dashboard")}
              onMouseEnter={() => handleTabHover(0)}
              onMouseLeave={handleTabLeave}
              className="py-4 font-medium text-sm text-indigo-600 transition-colors duration-300 ease-in-out relative z-10"
            >
              CLO Achievement
            </button>
            <button
              ref={(el) => { tabRefs.current[1] = el; }}
              onClick={() => router.push("/dashboard/courses")}
              onMouseEnter={() => handleTabHover(1)}
              onMouseLeave={handleTabLeave}
              className="py-4 font-medium text-sm text-slate-600 hover:text-slate-800 transition-colors duration-300 ease-in-out relative z-10"
            >
              Courses
            </button>
            <button
              ref={(el) => { tabRefs.current[2] = el; }}
              onClick={() => router.push("/dashboard/assessments")}
              onMouseEnter={() => handleTabHover(2)}
              onMouseLeave={handleTabLeave}
              className="py-4 font-medium text-sm text-slate-600 hover:text-slate-800 transition-colors duration-300 ease-in-out relative z-10"
            >
              Assessments
            </button>
            {user?.role === "instructor" && (
              <button
                ref={(el) => { tabRefs.current[3] = el; }}
                onMouseEnter={() => handleTabHover(3)}
                onMouseLeave={handleTabLeave}
                className="py-4 font-medium text-sm text-slate-600 hover:text-slate-800 transition-colors duration-300 ease-in-out relative z-10"
              >
                Students <span className="ml-1 bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full text-xs transition-all duration-300">99+</span>
              </button>
            )}
            {user?.role === "admin" && (
              <button
                ref={(el) => { tabRefs.current[4] = el; }}
                onClick={() => router.push("/dashboard/admin")}
                onMouseEnter={() => handleTabHover(4)}
                onMouseLeave={handleTabLeave}
                className="py-4 font-medium text-sm text-slate-600 hover:text-slate-800 transition-colors duration-300 ease-in-out relative z-10"
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
              className="absolute bottom-0 h-0.5 bg-slate-400 transition-all duration-200 ease-in-out z-0"
              style={{
                left: `${hoverUnderlineStyle.left}px`,
                width: `${hoverUnderlineStyle.width}px`,
                opacity: hoverUnderlineStyle.opacity,
              }}
            />
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