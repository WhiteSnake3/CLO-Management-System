"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { students } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    try {
      const data = await students.getAll();
      setStudentList(data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Students</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Student ID</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Program</th>
              </tr>
            </thead>
            <tbody>
              {studentList.map((student: any) => (
                <tr key={student._id} className="border-t">
                  <td className="p-2">{student.studentId}</td>
                  <td className="p-2">{student.firstName} {student.lastName}</td>
                  <td className="p-2">{student.email}</td>
                  <td className="p-2">{student.program}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}