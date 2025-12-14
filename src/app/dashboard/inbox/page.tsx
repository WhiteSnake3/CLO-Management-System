"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { courses, assessments } from "@/lib/api";

export default function InboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoverUnderlineStyle, setHoverUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [assessmentsList, setAssessmentsList] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Hard-coded inbox messages (reports)
  const inboxMessages = [
    {
      id: 1,
      type: "report",
      subject: "CLO Achievement Report - Fall 2025",
      sender: "System",
      date: "Dec 14, 2025",
      time: "10:30 AM",
      preview: "Your CLO Achievement report for Fall 2025 semester has been generated successfully.",
      unread: true,
      attachment: true,
      reportType: "CLO Achievement"
    },
    {
      id: 2,
      type: "report",
      subject: "Course Analytics Report - COSC210",
      sender: "System",
      date: "Dec 13, 2025",
      time: "3:45 PM",
      preview: "Analytics report for COSC210 Data Structures is ready for download.",
      unread: true,
      attachment: true,
      reportType: "Course Analytics"
    },
    {
      id: 3,
      type: "notification",
      subject: "Assessment Upload Confirmation",
      sender: "Learning Outcomes Portal",
      date: "Dec 12, 2025",
      time: "2:15 PM",
      preview: "Your assessment grades for Final Exam have been processed successfully.",
      unread: false,
      attachment: false,
    },
    {
      id: 4,
      type: "report",
      subject: "Student Performance Report - Fall 2025",
      sender: "System",
      date: "Dec 10, 2025",
      time: "11:20 AM",
      preview: "Comprehensive student performance analysis for Fall 2025 is now available.",
      unread: false,
      attachment: true,
      reportType: "Student Performance"
    },
    {
      id: 5,
      type: "report",
      subject: "Program Outcomes Report - Computer Science",
      sender: "System",
      date: "Dec 8, 2025",
      time: "9:00 AM",
      preview: "Program-level outcomes report for Computer Science has been generated.",
      unread: false,
      attachment: true,
      reportType: "Program Outcomes"
    },
    {
      id: 6,
      type: "notification",
      subject: "CLO Target Alert - COSC191",
      sender: "Learning Outcomes Portal",
      date: "Dec 5, 2025",
      time: "4:30 PM",
      preview: "One or more CLOs in COSC191 are below the target threshold.",
      unread: false,
      attachment: false,
    },
  ];

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

  const filteredMessages = selectedFilter === "all" 
    ? inboxMessages 
    : selectedFilter === "reports"
    ? inboxMessages.filter(msg => msg.type === "report")
    : inboxMessages.filter(msg => msg.unread);

  const unreadCount = inboxMessages.filter(msg => msg.unread).length;

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
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Inbox</h2>
              <p className="text-sm text-gray-500 mt-1">Generated reports and notifications</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                {unreadCount} Unread
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`pb-3 px-2 text-sm font-medium transition-colors ${
                selectedFilter === "all"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              All Messages ({inboxMessages.length})
            </button>
            <button
              onClick={() => setSelectedFilter("reports")}
              className={`pb-3 px-2 text-sm font-medium transition-colors ${
                selectedFilter === "reports"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Reports ({inboxMessages.filter(msg => msg.type === "report").length})
            </button>
            <button
              onClick={() => setSelectedFilter("unread")}
              className={`pb-3 px-2 text-sm font-medium transition-colors ${
                selectedFilter === "unread"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Messages List */}
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  message.unread ? "bg-indigo-50/30" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === "report" ? "bg-indigo-100 text-indigo-600" : "bg-blue-100 text-blue-600"
                    }`}>
                      {message.type === "report" ? "📊" : "🔔"}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-semibold ${
                          message.unread ? "text-gray-900" : "text-gray-700"
                        }`}>
                          {message.subject}
                        </h3>
                        {message.unread && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        )}
                        {message.attachment && (
                          <span className="text-gray-400">📎</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">From: {message.sender}</p>
                      <p className={`text-sm ${
                        message.unread ? "text-gray-700" : "text-gray-600"
                      }`}>
                        {message.preview}
                      </p>
                      {message.reportType && (
                        <div className="mt-2 flex gap-2">
                          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium">
                            View Report
                          </button>
                          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded text-xs font-medium">
                            Download PDF
                          </button>
                          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded text-xs font-medium">
                            Download Excel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date/Time */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-gray-700">{message.date}</p>
                    <p className="text-xs text-gray-500">{message.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMessages.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No messages found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
