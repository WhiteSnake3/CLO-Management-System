"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { students, instructors, courses, users, assessments, enrollments, backup, transactionLogs, getUserFromToken } from "@/lib/api";

function AdminPanelContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("students");
  const [loading, setLoading] = useState(true);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoverUnderlineStyle, setHoverUnderlineStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const adminTabRef = useRef<HTMLButtonElement>(null);

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

  const handleAdminTabHover = () => {
    if (adminTabRef.current) {
      const tab = adminTabRef.current;
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

  // Entity states
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [instructorsList, setInstructorsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [assessmentsList, setAssessmentsList] = useState<any[]>([]);
  const [enrollmentsList, setEnrollmentsList] = useState<any[]>([]);

  // Backup states
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cloCount, setCloCount] = useState<number>(0);
  const [cloMappingCount, setCloMappingCount] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setUser(payload);
      fetchAllData();
    } catch (err) {
      router.push("/login");
    }
  }, [router]);

  const fetchAllData = async () => {
    try {
      const [studentsData, usersData, instructorsData, coursesData, assessmentsData, enrollmentsData] = await Promise.all([
        students.getAll(),
        users.getAll(),
        instructors.getAll(),
        courses.getAll(),
        assessments.getAll(),
        enrollments.getAll(),
      ]);
      setStudentsList(studentsData);
      setUsersList(usersData);
      setInstructorsList(instructorsData);
      setCoursesList(coursesData);
      setAssessmentsList(assessmentsData);
      setEnrollmentsList(enrollmentsData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set underline position for active tab (Admin Panel)
    if (adminTabRef.current) {
      const tab = adminTabRef.current;
      setUnderlineStyle({
        left: tab.offsetLeft,
        width: tab.offsetWidth,
      });
    }
  }, [user]);

  const cleanDataForLog = (data: any) => {
    const cleaned = { ...data };
    // Remove system fields
    delete cleaned._id;
    delete cleaned.createdAt;
    delete cleaned.updatedAt;
    delete cleaned.__v;
    return cleaned;
  };

  const logAction = async (entity: string, entityId: string, action: string, newValue: any) => {
    try {
      const cleanedValue = cleanDataForLog(newValue);
      
      // Get userId from token if user state is not available
      let userId = user?.userId;
      if (!userId) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            userId = payload.userId;
          } catch {
            console.error("Failed to parse token");
          }
        }
      }
      
      const logData = {
        logId: `LOG-${Date.now()}`,
        entity,
        entityId,
        action,
        newValue: cleanedValue,
        performedBy: userId,
      };
      
      console.log("Sending log data:", logData);
      
      await transactionLogs.create(logData);
    } catch (err) {
      console.error("Failed to log action", err);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    // initialize form data for courses with empty CLOs
    if (activeTab === "courses") {
      setFormData({ CLOs: [] });
    } else if (activeTab === "assessments") {
      setFormData({ cloMappings: [] });
    } else {
      setFormData({});
    }
    setShowForm(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item._id);
    setFormData(item);
    // ensure cloCount reflects existing CLOs for courses
    if (activeTab === "courses") {
      setCloCount(Array.isArray(item?.CLOs) ? item.CLOs.length : 0);
    }
    // ensure cloMappingCount reflects existing cloMappings for assessments
    if (activeTab === "assessments") {
      setCloMappingCount(Array.isArray(item?.cloMappings) ? item.cloMappings.length : 0);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update
        const updated = await updateEntity(activeTab, editingId, formData);
        const entityIdForLog =
          formData.courseId || formData.instructorId || formData.studentId || formData.userId || editingId;
        await logAction(activeTab, entityIdForLog, "update", updated || formData);
      } else {
        // Create
        const created: any = await createEntity(activeTab, formData);
        const entityIdForLog =
          created?.courseId || created?.instructorId || created?.studentId || created?.userId || created?._id || formData.courseId || formData.instructorId || formData.studentId || formData.userId || "new";
        await logAction(activeTab, entityIdForLog, "create", created || formData);
      }
      setShowForm(false);
      setFormData({});
      fetchAllData();
    } catch (err) {
      console.error("Failed to save", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      // get readable id from the item if available
      const item = getCurrentList()?.find((it: any) => it._id === id);
      const entityIdForLog = item?.courseId || item?.instructorId || item?.studentId || item?.userId || id;
      await deleteEntity(activeTab, id);
      await logAction(activeTab, entityIdForLog, "delete", {});
      fetchAllData();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const createEntity = async (entity: string, data: any) => {
    switch (entity) {
      case "students":
        return students.create(data);
      case "users":
        return users.create(data);
      case "instructors":
        return instructors.create(data);
      case "courses":
        return courses.create(data);
      case "assessments":
        return assessments.create(data);
      case "enrollments":
        return enrollments.create(data);
    }
  };

  const updateEntity = async (entity: string, id: string, data: any) => {
    switch (entity) {
      case "students":
        return students.update(id, data);
      case "users":
        return users.update(id, data);
      case "instructors":
        return instructors.update(id, data);
      case "courses":
        return courses.update(id, data);
      case "assessments":
        return assessments.update(id, data);
      case "enrollments":
        return enrollments.update(id, data);
    }
  };

  const deleteEntity = async (entity: string, id: string) => {
    switch (entity) {
      case "students":
        return students.delete(id);
      case "users":
        return users.delete(id);
      case "instructors":
        return instructors.delete(id);
      case "courses":
        return courses.delete(id);
      case "assessments":
        return assessments.delete(id);
      case "enrollments":
        return enrollments.delete(id);
    }
  };

  // Backup functions
  const fetchBackups = async () => {
    try {
      const response = await backup.listBackups();
      setBackupsList(response.backups || []);
    } catch (err) {
      console.error("Failed to fetch backups", err);
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    setBackupMessage("");
    try {
      const response = await backup.createBackup();
      setBackupMessage(`✓ Backup created: ${response.backupDir}`);
      await fetchBackups();
    } catch (err: any) {
      setBackupMessage(`✗ Backup failed: ${err.message}`);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (backupName: string) => {
    if (!confirm(`Are you sure you want to restore from "${backupName}"? This will overwrite all current data.`)) {
      return;
    }
    setBackupLoading(true);
    setBackupMessage("");
    try {
      await backup.restore(backupName);
      setBackupMessage(`✓ Database restored from: ${backupName}`);
      await fetchAllData();
    } catch (err: any) {
      setBackupMessage(`✗ Restore failed: ${err.message}`);
    } finally {
      setBackupLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "backup") {
      fetchBackups();
    }
  }, [activeTab]);

  const getTableColumns = () => {
    switch (activeTab) {
      case "students":
        return ["studentId", "firstName", "lastName", "email", "program"];
      case "users":
        return ["email", "name", "role", "userId"];
      case "instructors":
        return ["instructorId", "name", "email", "department"];
      case "courses":
        return ["courseId", "title", "department", "term"];
      case "assessments":
        return ["assessmentId", "courseId", "title", "type", "dueDate", "totalMarks"];
      case "enrollments":
        return ["enrollmentId", "studentId", "courseId", "term", "status"];
    }
  };

  const getFormFields = () => {
    switch (activeTab) {
      case "students":
        return ["studentId", "firstName", "lastName", "email", "program", "year"];
      case "users":
        return ["email", "name", "password", "role", "userId"];
      case "instructors":
        return ["instructorId", "name", "email", "department"];
      case "courses":
        return ["courseId", "title", "department", "term", "instructorId"];
      case "assessments":
        return ["assessmentId", "courseId", "title", "type", "dueDate", "totalMarks"];
      case "enrollments":
        return ["enrollmentId", "studentId", "courseId", "term", "status"];
    }
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case "students":
        return studentsList;
      case "users":
        return usersList;
      case "instructors":
        return instructorsList;
      case "courses":
        return coursesList;
      case "assessments":
        return assessmentsList;
      case "enrollments":
        return enrollmentsList;
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== "admin") return <div>Unauthorized</div>;

  const currentList = getCurrentList();
  const columns = getTableColumns();
  const fields = getFormFields();

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
          {activeTab !== "backup" && (
            <button
              onClick={handleAdd}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              + Add {activeTab.slice(0, -1).toUpperCase()}
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-white">
          <div className="px-6 flex gap-8 relative">
            <button
              ref={(el) => { tabRefs.current[0] = el; }}
              onClick={() => router.push("/dashboard")}
              onMouseEnter={() => handleTabHover(0)}
              onMouseLeave={handleTabLeave}
              className="py-4 font-medium text-sm text-slate-600 hover:text-slate-800 transition-colors duration-300 ease-in-out relative z-10"
            >
              CLO Achievement
            </button>
            <button
              ref={(el) => { tabRefs.current[1] = el; }}
              onClick={() => router.push("/dashboard/courses")}
              onMouseEnter={() => handleTabHover(1)}
              onMouseLeave={handleTabLeave}
              className="py-4 font-medium text-sm text-slate-600 hover:text-slate-800 transition-colors duration-300 ease-in-out relative z-10"
            >
              Courses
            </button>
            <button
              ref={(el) => { tabRefs.current[2] = el; }}
              onClick={() => router.push("/dashboard/assessments")}
              onMouseEnter={() => handleTabHover(2)}
              onMouseLeave={handleTabLeave}
              className="py-4 font-medium text-sm text-slate-600 hover:text-slate-800 transition-colors duration-300 ease-in-out relative z-10"
            >
              Assessments
            </button>
            {user?.role === "instructor" && (
              <button
                ref={(el) => { tabRefs.current[3] = el; }}
                onMouseEnter={() => handleTabHover(3)}
                onMouseLeave={handleTabLeave}
                className="py-4 font-medium text-sm text-slate-600 hover:text-slate-800 transition-colors duration-300 ease-in-out relative z-10"
              >
                Students <span className="ml-1 bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full text-xs transition-all duration-300">99+</span>
              </button>
            )}
            <button
              ref={adminTabRef}
              onClick={() => router.push("/dashboard/admin")}
              onMouseEnter={handleAdminTabHover}
              onMouseLeave={handleTabLeave}
              className="py-4 font-medium text-sm text-indigo-600 transition-colors duration-300 ease-in-out relative z-10"
            >
              Admin Panel
            </button>
            {/* Active underline */}
            <div
              className="absolute bottom-0 h-0.5 bg-indigo-600 transition-all duration-300 ease-in-out"
              style={{
                left: `${underlineStyle.left}px`,
                width: `${underlineStyle.width}px`,
              }}
            />
            {/* Hover underline */}
            <div
              className="absolute bottom-0 h-0.5 bg-slate-400 transition-all duration-200 ease-in-out"
              style={{
                left: `${hoverUnderlineStyle.left}px`,
                width: `${hoverUnderlineStyle.width}px`,
                opacity: hoverUnderlineStyle.opacity,
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-white">
          <div className="px-6 flex gap-8">{["students", "users", "instructors", "courses", "assessments", "enrollments", "backup"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 font-medium text-sm border-b-2 transition-all duration-300 ease-in-out ${
                  activeTab === tab
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg text-slate-800 mb-4">
                {editingId ? "Edit" : "Add New"} {activeTab.slice(0, -1)}
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                {fields?.map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    {field === "role" ? (
                      <select
                        value={formData[field] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [field]: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="">Select Role</option>
                        <option value="admin">Admin</option>
                        <option value="instructor">Instructor</option>
                        <option value="student">Student</option>
                      </select>
                    ) : field === "year" ? (
                      <input
                        type="number"
                        value={formData[field] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [field]: parseInt(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    ) : field === "dueDate" ? (
                      <input
                        type="date"
                        value={formData[field] ? new Date(formData[field]).toISOString().slice(0, 10) : ""}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    ) : field === "totalMarks" ? (
                      <input
                        type="number"
                        value={formData[field] || ""}
                        onChange={(e) => setFormData({ ...formData, [field]: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    ) : (
                      <input
                        type={field === "password" ? "password" : "text"}
                        value={formData[field] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [field]: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        required={!editingId && field !== "password"}
                      />
                    )}
                  </div>
                ))}
                {/* Course-specific: select number of CLOs and render fields */}
                {activeTab === "courses" && (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Number of CLOs</label>
                      <input
                        type="number"
                        min={0}
                        value={cloCount}
                        onChange={(e) => {
                          const n = Math.max(0, parseInt(e.target.value || "0"));
                          setCloCount(n);
                          const existing: any[] = Array.isArray(formData.CLOs) ? formData.CLOs : [];
                          const newCLOs = Array.from({ length: n }, (_, i) => existing[i] || { cloId: "", description: "" });
                          setFormData({ ...formData, CLOs: newCLOs });
                        }}
                        className="w-40 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    {Array.from({ length: cloCount }).map((_, i) => (
                      <div key={`clo-pair-${i}`} className="col-span-2 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">CLO ID {i + 1}</label>
                          <input
                            type="text"
                            value={(formData.CLOs && formData.CLOs[i] && formData.CLOs[i].cloId) || ""}
                            onChange={(e) => {
                              const arr = Array.isArray(formData.CLOs) ? [...formData.CLOs] : [];
                              arr[i] = { ...(arr[i] || {}), cloId: e.target.value };
                              setFormData({ ...formData, CLOs: arr });
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">CLO Description {i + 1}</label>
                          <input
                            type="text"
                            value={(formData.CLOs && formData.CLOs[i] && formData.CLOs[i].description) || ""}
                            onChange={(e) => {
                              const arr = Array.isArray(formData.CLOs) ? [...formData.CLOs] : [];
                              arr[i] = { ...(arr[i] || {}), description: e.target.value };
                              setFormData({ ...formData, CLOs: arr });
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {/* Assessment-specific: select number of CLO mappings and render fields */}
                {activeTab === "assessments" && (
                  <>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Number of CLO Mappings</label>
                      <input
                        type="number"
                        min={0}
                        value={cloMappingCount}
                        onChange={(e) => {
                          const n = Math.max(0, parseInt(e.target.value || "0"));
                          setCloMappingCount(n);
                          const existing: any[] = Array.isArray(formData.cloMappings) ? formData.cloMappings : [];
                          const newMappings = Array.from({ length: n }, (_, i) => existing[i] || { cloId: "", weight: 0 });
                          setFormData({ ...formData, cloMappings: newMappings });
                        }}
                        className="w-40 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    {Array.from({ length: cloMappingCount }).map((_, i) => (
                      <div key={`clo-mapping-${i}`} className="col-span-2 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">CLO ID {i + 1}</label>
                          <input
                            type="text"
                            value={(formData.cloMappings && formData.cloMappings[i] && formData.cloMappings[i].cloId) || ""}
                            onChange={(e) => {
                              const arr = Array.isArray(formData.cloMappings) ? [...formData.cloMappings] : [];
                              arr[i] = { ...(arr[i] || {}), cloId: e.target.value };
                              setFormData({ ...formData, cloMappings: arr });
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Weight {i + 1}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={(formData.cloMappings && formData.cloMappings[i] && formData.cloMappings[i].weight) || ""}
                            onChange={(e) => {
                              const arr = Array.isArray(formData.cloMappings) ? [...formData.cloMappings] : [];
                              arr[i] = { ...(arr[i] || {}), weight: parseFloat(e.target.value) || 0 };
                              setFormData({ ...formData, cloMappings: arr });
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}
                <div className="col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold"
                  >
                    {editingId ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Backup & Restore Section */}
          {activeTab === "backup" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Database Backup & Restore</h3>
                
                {backupMessage && (
                  <div className={`p-4 rounded-lg mb-4 ${backupMessage.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {backupMessage}
                  </div>
                )}

                <div className="flex gap-4 mb-6">
                  <button
                    onClick={handleCreateBackup}
                    disabled={backupLoading}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50"
                  >
                    {backupLoading ? "Creating Backup..." : "🗄️ Create New Backup"}
                  </button>
                  <button
                    onClick={fetchBackups}
                    disabled={backupLoading}
                    className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 font-semibold disabled:opacity-50"
                  >
                    🔄 Refresh List
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-semibold text-slate-700 mb-3">Available Backups</h4>
                  
                  {backupsList.length === 0 ? (
                    <p className="text-slate-500 text-sm">No backups found. Create your first backup above.</p>
                  ) : (
                    <div className="space-y-2">
                      {backupsList.map((b) => (
                        <div key={b.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <p className="font-medium text-slate-800">{b.name}</p>
                            <p className="text-xs text-slate-500">
                              Created: {new Date(b.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRestoreBackup(b.name)}
                            disabled={backupLoading}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
                          >
                            ♻️ Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Warning:</strong> Restoring a backup will replace all current data in the database. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {activeTab !== "backup" && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {columns?.map((col) => (
                    <th key={col} className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentList?.map((item) => (
                  <tr key={item._id} className="border-t border-slate-200 hover:bg-slate-50">
                    {columns?.map((col) => (
                      <td key={col} className="px-6 py-4 text-sm text-slate-700">
                        {item[col]}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPanelPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPanelContent />
    </Suspense>
  );
}
