"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import DashboardPageHeader from "@/components/DashboardPageHeader";

export default function InboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch (err) {
      console.error("Failed to decode token", err);
    }
    setLoading(false);
  }, [router]);

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
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        {/* Content */}
        <div className="p-6">
          <DashboardPageHeader
            title="Inbox"
            subtitle="Generated reports and notifications"
            actions={
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                {unreadCount} Unread
              </span>
            }
          />

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
