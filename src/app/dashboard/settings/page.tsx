"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import { users as usersApi } from "@/lib/api";

interface UserPayload {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirm, setEditConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1])) as UserPayload;
      setUser(payload);
      setEditName(payload.name || "");
    } catch (err) {
      console.error("Failed to decode token", err);
    }
    setLoading(false);
  }, [router]);

  const handleEdit = () => {
    setEditName(user?.name || "");
    setEditPassword("");
    setEditConfirm("");
    setSaveError(null);
    setSaveSuccess(false);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!user) return;
    if (editName.trim() === "") {
      setSaveError("Name cannot be empty.");
      return;
    }
    if (editPassword && editPassword !== editConfirm) {
      setSaveError("Passwords do not match.");
      return;
    }
    if (editPassword && editPassword.length < 6) {
      setSaveError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, string> = { name: editName.trim() };
      if (editPassword) body.password = editPassword;

      const res = await usersApi.update(user.id, body) as { user: { name: string }; token: string };

      // Replace the stored token so refreshes use the updated name
      if (res?.token) {
        localStorage.setItem("token", res.token);
      }

      setUser((prev) => prev ? { ...prev, name: editName.trim() } : prev);
      setSaveSuccess(true);
      setEditing(false);
      setEditPassword("");
      setEditConfirm("");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const displayRole = (role: string) =>
    role === "instructor" ? "Instructor" : role.charAt(0).toUpperCase() + role.slice(1);

  if (loading)
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        <div className="p-6 max-w-3xl">

          {/* Page title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your profile and account details</p>
          </div>

          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
            {/* Card header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">{user?.name}</p>
                  <span className="inline-block mt-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    {displayRole(user?.role || "")}
                  </span>
                </div>
              </div>
              {!editing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 16H7v-2a2 2 0 01.586-1.414z" />
                  </svg>
                  Edit Settings
                </button>
              )}
            </div>

            {/* Fields */}
            <div className="divide-y divide-gray-100">
              {/* Name */}
              <div className="px-6 py-4 grid grid-cols-3 gap-4 items-center">
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <div className="col-span-2">
                  {editing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                  )}
                </div>
              </div>

              {/* Email — always read-only */}
              <div className="px-6 py-4 grid grid-cols-3 gap-4 items-center">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-gray-800">{user?.email}</p>
                  {editing && (
                    <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed here.</p>
                  )}
                </div>
              </div>

              {/* Role — always read-only */}
              <div className="px-6 py-4 grid grid-cols-3 gap-4 items-center">
                <p className="text-sm font-medium text-gray-500">Role</p>
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-gray-800">{displayRole(user?.role || "")}</p>
                </div>
              </div>

              {/* User ID — always read-only */}
              <div className="px-6 py-4 grid grid-cols-3 gap-4 items-center">
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <div className="col-span-2">
                  <p className="text-sm font-mono text-gray-500">{user?.userId}</p>
                </div>
              </div>

              {/* Password — only shown in edit mode */}
              {editing && (
                <>
                  <div className="px-6 py-4 grid grid-cols-3 gap-4 items-center">
                    <p className="text-sm font-medium text-gray-500">New Password</p>
                    <div className="col-span-2">
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 grid grid-cols-3 gap-4 items-center">
                    <p className="text-sm font-medium text-gray-500">Confirm Password</p>
                    <div className="col-span-2">
                      <input
                        type="password"
                        value={editConfirm}
                        onChange={(e) => setEditConfirm(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Edit mode action bar */}
            {editing && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center justify-between gap-3">
                <div>
                  {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Success toast */}
          {saveSuccess && (
            <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Profile updated successfully.</span>
              <button onClick={() => setSaveSuccess(false)} className="ml-auto text-green-500 hover:text-green-700">✕</button>
            </div>
          )}

          {/* Email addresses */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Email Addresses</h2>
            </div>
            <div className="px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{user?.email}</p>
                <p className="text-xs text-gray-400">Primary address</p>
              </div>
              <span className="ml-auto text-xs bg-indigo-100 text-indigo-600 font-medium px-2 py-0.5 rounded-full">
                Primary ★
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
