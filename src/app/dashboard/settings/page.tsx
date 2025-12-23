"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { courses, assessments } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoverUnderlineStyle, setHoverUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [assessmentsList, setAssessmentsList] = useState<any[]>([]);

  // Form state
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [defaultEmail, setDefaultEmail] = useState("");
  const [language, setLanguage] = useState("System Default (English (United States))");
  const [timeZone, setTimeZone] = useState("Kuwait");

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

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
      
      // Set form values from user data
      setFullName(payload.name || "");
      setDisplayName(payload.name || "");
      setDefaultEmail(payload.email || "");
      
      fetchCounts();
    } catch (err) {
      console.error("Failed to decode token", err);
    }
    setLoading(false);
  }, [router]);

  const fetchCounts = async () => {
    try {
      const [coursesData, assessmentsData] = await Promise.all([
        courses.getAll(),
        assessments.getAll(),
      ]);
      setCoursesList(coursesData);
      setAssessmentsList(assessmentsData);
    } catch (err) {
      console.error("Failed to fetch counts", err);
    }
  };

  useEffect(() => {
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
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Learning Outcomes Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500">{user?.role === "instructor" ? "Faculty" : user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="px-6 flex gap-6 relative">
            <button
              ref={(el) => { tabRefs.current[0] = el; }}
              onClick={() => router.push("/dashboard")}
              onMouseEnter={() => handleTabHover(0)}
              onMouseLeave={handleTabLeave}
              className="py-3 font-medium text-sm text-gray-600 hover:text-gray-800 transition-colors relative z-10"
            >
              CLO Achievement
            </button>
            <button
              ref={(el) => { tabRefs.current[1] = el; }}
              onClick={() => router.push("/dashboard/courses")}
              onMouseEnter={() => handleTabHover(1)}
              onMouseLeave={handleTabLeave}
              className="py-3 font-medium text-sm text-gray-600 hover:text-gray-800 transition-colors relative z-10 flex items-center gap-1"
            >
              Courses <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-semibold">{coursesList.length}</span>
            </button>
            <button
              ref={(el) => { tabRefs.current[2] = el; }}
              onClick={() => router.push("/dashboard/assessments")}
              onMouseEnter={() => handleTabHover(2)}
              onMouseLeave={handleTabLeave}
              className="py-3 font-medium text-sm text-gray-600 hover:text-gray-800 transition-colors relative z-10 flex items-center gap-1"
            >
              Assessments <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-semibold">{assessmentsList.length}</span>
            </button>
            {user?.role === "instructor" && (
              <button
                ref={(el) => { tabRefs.current[3] = el; }}
                onMouseEnter={() => handleTabHover(3)}
                onMouseLeave={handleTabLeave}
                className="py-3 font-medium text-sm text-gray-600 hover:text-gray-800 transition-colors relative z-10 flex items-center gap-1"
              >
                Students <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs font-semibold">216</span>
              </button>
            )}
            {user?.role === "admin" && (
              <button
                ref={(el) => { tabRefs.current[4] = el; }}
                onClick={() => router.push("/dashboard/admin")}
                onMouseEnter={() => handleTabHover(4)}
                onMouseLeave={handleTabLeave}
                className="py-3 font-medium text-sm text-gray-600 hover:text-gray-800 transition-colors relative z-10"
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
              className="absolute bottom-0 h-0.5 bg-gray-400 transition-all duration-200 ease-in-out z-0"
              style={{
                left: `${hoverUnderlineStyle.left}px`,
                width: `${hoverUnderlineStyle.width}px`,
                opacity: hoverUnderlineStyle.opacity,
              }}
            />
          </div>
        </div>

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
