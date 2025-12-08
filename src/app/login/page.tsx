"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  
  // Register form fields
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("student");
  const [registerUserId, setRegisterUserId] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await auth.login({ email, password });
      localStorage.setItem("token", response.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRegisterSuccess("");

    try {
      await auth.register({
        email: registerEmail,
        name: registerName,
        password: registerPassword,
        role: registerRole,
        userId: registerUserId,
      });
      setRegisterSuccess("Account created successfully! You can now login.");
      // Clear form
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterUserId("");
      setRegisterRole("student");
      // Switch back to login after 2 seconds
      setTimeout(() => {
        setShowRegister(false);
        setRegisterSuccess("");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-50">
      <div className="bg-white p-8 rounded-xl shadow-xl w-96 ring-1 ring-slate-200">
        {!showRegister ? (
          <>
            <h1 className="text-2xl font-bold mb-4 text-slate-800">CLOMS Login</h1>
            <p className="text-sm text-slate-500 mb-6">Sign in to your account to continue</p>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <form onSubmit={handleLogin}>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black"
                required
              />

              <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 text-white p-3 rounded-md shadow-md disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
            <div className="mt-4 text-center text-sm">
              <button
                onClick={() => {
                  setShowRegister(true);
                  setError("");
                }}
                className="text-indigo-600 hover:underline"
              >
                Don't have an account? Register
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4 text-slate-800">Create Account</h1>
            <p className="text-sm text-slate-500 mb-6">Register a new user account</p>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            {registerSuccess && <p className="text-green-600 mb-4">{registerSuccess}</p>}
            <form onSubmit={handleRegister}>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black"
                required
              />

              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black"
                required
              />

              <label className="block text-xs font-medium text-slate-600 mb-1">User ID</label>
              <input
                type="text"
                placeholder="S12345 or I67890"
                value={registerUserId}
                onChange={(e) => setRegisterUserId(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black"
                required
              />

              <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black"
                required
              />

              <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
              <select
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white p-3 rounded-md shadow-md disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Register"}
              </button>
            </form>
            <div className="mt-4 text-center text-sm">
              <button
                onClick={() => {
                  setShowRegister(false);
                  setError("");
                  setRegisterSuccess("");
                }}
                className="text-indigo-600 hover:underline"
              >
                Already have an account? Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}