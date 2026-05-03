"use client";

import { useRouter } from "next/navigation";

interface DashboardTopBarProps {
  userName?: string;
  userRole?: string;
}

export default function DashboardTopBar({ userName, userRole }: DashboardTopBarProps) {
  const router = useRouter();
  const displayRole = userRole === "instructor" ? "Faculty" : userRole;
  const initial = userName?.charAt(0) || "U";

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">Learning Outcomes Portal</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{userName || "User"}</p>
          <p className="text-xs text-gray-500">{displayRole}</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center text-white font-semibold transition-colors cursor-pointer"
          title="Settings"
        >
          {initial}
        </button>
      </div>
    </div>
  );
}
