"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [defaultEmail, setDefaultEmail] = useState("");
  const [language, setLanguage] = useState("System Default (English (United States))");
  const [timeZone, setTimeZone] = useState("Kuwait");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
      
      // Set form values from user data
      setFullName(payload.name || "");
      setDisplayName(payload.name || "");
      setDefaultEmail(payload.email || "");
    } catch (err) {
      console.error("Failed to decode token", err);
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

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-semibold">
                {user?.name?.charAt(0) || "U"}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.name || "User"}'s Settings</h2>
            </div>
            <div className="flex gap-3">
              <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                ✏️ Edit Settings
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Full Name */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4 items-start">
                <div className="text-right">
                  <label className="text-sm font-semibold text-gray-700">Full Name:</label>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-indigo-600 font-medium">{fullName}</p>
                  <p className="text-xs text-gray-500 mt-1">This name will be used for grading.</p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4 items-start">
                <div className="text-right">
                  <label className="text-sm font-semibold text-gray-700">Display Name:</label>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-indigo-600 font-medium">{displayName}</p>
                  <p className="text-xs text-gray-500 mt-1">People will see this name in discussions, messages and comments.</p>
                </div>
              </div>
            </div>

            {/* Default Email */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4 items-start">
                <div className="text-right">
                  <label className="text-sm font-semibold text-gray-700">Default Email:</label>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-indigo-600 font-medium">{defaultEmail}</p>
                </div>
              </div>
            </div>

            {/* Language */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4 items-start">
                <div className="text-right">
                  <label className="text-sm font-semibold text-gray-700">Language:</label>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-indigo-600 font-medium">{language}</p>
                </div>
              </div>
            </div>

            {/* Time Zone */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4 items-start">
                <div className="text-right">
                  <label className="text-sm font-semibold text-gray-700">Time Zone:</label>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-indigo-600 font-medium">{timeZone}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Maintenance windows: 1st and 3rd Thursday of the month from 1:05am to 3:05am (Wednesday at 10:05pm to Thursday at 12:05am UTC )
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Next window: Thu Dec 18, 2025 from 1:05am to 3:05am
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ways to Contact Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ways to Contact</h3>
            
            {/* Email Addresses */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-md font-semibold text-indigo-600">Email Addresses</h4>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-indigo-600 font-medium">{defaultEmail}</span>
                    <span className="text-yellow-500">★</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <button className="text-sm text-red-500 hover:text-red-600 font-medium">+ Email Address</button>
              </div>
            </div>

            {/* Other Contacts */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h4 className="text-md font-semibold text-indigo-600">Other Contacts</h4>
                <span className="text-sm font-semibold text-indigo-600">Type</span>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-indigo-600 font-medium">For All Devices</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">push</span>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <button className="text-sm text-red-500 hover:text-red-600 font-medium">+ Contact Method</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
