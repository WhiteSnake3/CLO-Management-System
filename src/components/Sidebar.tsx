"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const router = useRouter();
  const [active, setActive] = useState("home");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
      } catch {
        setUserRole(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { id: "home", label: "Home", icon: "🏠", href: "/dashboard" },
    { id: "courses", label: "Courses", icon: "📚", href: "/dashboard/courses" },
    { id: "assessments", label: "Assessments / Result", icon: "📊", href: "/dashboard/assessments" },
    { id: "clo", label: "CLO Analysis", icon: "📈", href: "/dashboard/clo-analysis" },
    { id: "reports", label: "Reports", icon: "📋", href: "/dashboard/reports" },
    { id: "inbox", label: "Inbox", icon: "📬", href: "/dashboard/inbox" },
    { id: "settings", label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
    ...(userRole === "admin" ? [{ id: "admin", label: "Admin Panel", icon: "🔐", href: "/dashboard/admin" }] : []),
  ];

  return (
    <div className="w-48 bg-white border-r border-slate-200 min-h-screen flex flex-col p-4">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <Image
          src="/aubhlogo.png"
          alt="AUBH Logo"
          width={120}
          height={60}
          className="object-contain"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setActive(item.id)}
            className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-3 transition block ${
              active === item.id
                ? "bg-indigo-100 text-indigo-700 font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-medium"
      >
        Logout
      </button>
    </div>
  );
}
