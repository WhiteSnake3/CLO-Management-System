"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import CLOChart from "@/components/CLOChart";
import RecentAssessments from "@/components/RecentAssessments";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";

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
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      
      <div className="flex-1">
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

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