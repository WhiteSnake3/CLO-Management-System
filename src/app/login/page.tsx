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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-50">
      <div className="bg-white p-8 rounded-xl shadow-xl w-96 ring-1 ring-slate-200">
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
        <div className="mt-4 text-center text-sm text-slate-500">
          <a href="#" className="text-indigo-600 hover:underline">Forgot password?</a>
        </div>
      </div>
    </div>
  );
}