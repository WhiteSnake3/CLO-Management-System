"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardNavTabs from "@/components/DashboardNavTabs";
import { students, instructors, courses, users, assessments, enrollments, performances, backup, transactionLogs, syllabus, getUserFromToken } from "@/lib/api";

function AdminPanelContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("students");
  const [loading, setLoading] = useState(true);
  // Entity states
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [instructorsList, setInstructorsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [assessmentsList, setAssessmentsList] = useState<any[]>([]);
  const [performancesList, setPerformancesList] = useState<any[]>([]);
  const [enrollmentsList, setEnrollmentsList] = useState<any[]>([]);

  // Backup states
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");

  // Mass enrollment states
  const [massEnrollLoading, setMassEnrollLoading] = useState(false);
  const [massEnrollResult, setMassEnrollResult] = useState<any>(null);
  const massEnrollFileRef = useRef<HTMLInputElement>(null);

  // Syllabus import states
  const syllabusFileRef = useRef<HTMLInputElement>(null);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [syllabusEdits, setSyllabusEdits] = useState<any>(null);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);
  const [syllabusInstructorId, setSyllabusInstructorId] = useState("");
  const [syllabusImporting, setSyllabusImporting] = useState(false);
  const [syllabusImportResult, setSyllabusImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syllabusDragOver, setSyllabusDragOver] = useState(false);

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
      const [studentsData, usersData, instructorsData, coursesData, assessmentsData, performancesData, enrollmentsData] = await Promise.all([
        students.getAll(),
        users.getAll(),
        instructors.getAll(),
        courses.getAll(),
        assessments.getAll(),
        performances.getAll(),
        enrollments.getAll(),
      ]);
      setStudentsList(studentsData);
      setUsersList(usersData);
      setInstructorsList(instructorsData);
      setCoursesList(coursesData);
      setAssessmentsList(assessmentsData);
      setPerformancesList(performancesData);
      setEnrollmentsList(enrollmentsData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

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
      case "performances":
        return performances.create(data);
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
      case "performances":
        return performances.update(id, data);
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
      case "performances":
        return performances.delete(id);
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

  const handleDownloadTemplate = () => {
    const headers = ["studentid", "firstname", "lastname", "email", "program", "year", "courseid", "term"];
    const example = ["S001", "Jane", "Doe", "jane.doe@example.com", "Computer Science", "2", "COSC412", "Fall 2026"];
    const csvContent = headers.join(",") + "\n" + example.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mass_enrollment_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleMassEnrollUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setMassEnrollLoading(true);
    setMassEnrollResult(null);
    try {
      const text = await file.text();
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) {
        setMassEnrollResult({ error: "CSV file is empty or has no data rows." });
        return;
      }
      const parseCSVLine = (line: string) =>
        line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ""));
      const rows = lines
        .slice(1)
        .map((line) => {
          const values = parseCSVLine(line);
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
          return obj;
        })
        .filter((r) => r.studentid?.trim());

      if (rows.length === 0) {
        setMassEnrollResult({ error: "No valid data rows found in the CSV." });
        return;
      }

      const [existingStudents, existingEnrollments] = await Promise.all([
        students.getAll(),
        enrollments.getAll(),
      ]);

      const studentMap = new Map<string, boolean>();
      for (const s of existingStudents) {
        studentMap.set(String(s.studentId).toLowerCase(), true);
      }

      const enrollmentSet = new Set<string>();
      let enrollCounter = 1;
      for (const en of existingEnrollments) {
        enrollmentSet.add(
          `${String(en.studentId).toLowerCase()}|${String(en.courseId).toLowerCase()}|${String(en.term).toLowerCase()}`
        );
        const match = String(en.enrollmentId).match(/^E(\d+)$/i);
        if (match) enrollCounter = Math.max(enrollCounter, parseInt(match[1]) + 1);
      }

      let studentsCreated = 0;
      let studentsSkipped = 0;
      let enrollmentsCreated = 0;
      let enrollmentsSkipped = 0;

      for (const row of rows) {
        const { studentid, firstname, lastname, email, program, year, courseid, term } = row;
        const sidKey = String(studentid).toLowerCase();

        if (!studentMap.has(sidKey)) {
          await students.create({
            studentId: studentid,
            firstName: firstname,
            lastName: lastname,
            email: email,
            program: program,
            year: parseInt(year) || 1,
          });
          studentMap.set(sidKey, true);
          studentsCreated++;
        } else {
          studentsSkipped++;
        }

        const enrollKey = `${sidKey}|${String(courseid).toLowerCase()}|${String(term).toLowerCase()}`;
        if (!enrollmentSet.has(enrollKey)) {
          await enrollments.create({
            enrollmentId: `E${enrollCounter}`,
            studentId: studentid,
            courseId: courseid,
            term: term,
            status: "active",
          });
          enrollmentSet.add(enrollKey);
          enrollCounter++;
          enrollmentsCreated++;
        } else {
          enrollmentsSkipped++;
        }
      }

      setMassEnrollResult({ studentsCreated, studentsSkipped, enrollmentsCreated, enrollmentsSkipped });
      fetchAllData();
    } catch (err: any) {
      setMassEnrollResult({ error: `Failed: ${err.message}` });
    } finally {
      setMassEnrollLoading(false);
    }
  };

  const handleSyllabusFile = async (file: File) => {
    if (!file.name.endsWith(".pdf") && file.type !== "application/pdf") {
      setSyllabusError("Please upload a PDF file.");
      return;
    }
    setSyllabusFile(file);
    setSyllabusError(null);
    setSyllabusEdits(null);
    setSyllabusImportResult(null);
    setSyllabusLoading(true);
    try {
      const result = await syllabus.parse(file);
      setSyllabusEdits(result);
      // Pre-select instructor if name matches
      const match = instructorsList.find(
        (i: any) => i.name?.toLowerCase() === result.instructorName?.toLowerCase()
      );
      setSyllabusInstructorId(match?.instructorId ?? "");
    } catch (err: any) {
      setSyllabusError(err.message ?? "Failed to parse syllabus.");
    } finally {
      setSyllabusLoading(false);
    }
  };

  const handleSyllabusImport = async () => {
    if (!syllabusEdits) return;
    setSyllabusImporting(true);
    setSyllabusImportResult(null);
    try {
      const coursePayload = {
        courseId: syllabusEdits.courseId,
        title: syllabusEdits.title,
        department: syllabusEdits.department,
        term: syllabusEdits.term,
        instructorId: syllabusInstructorId,
        CLOs: syllabusEdits.CLOs ?? [],
      };
      await courses.create(coursePayload);
      let aCount = 0;
      for (let i = 0; i < (syllabusEdits.assessments ?? []).length; i++) {
        const a = syllabusEdits.assessments[i];
        const cloIds: string[] = a.cloIds ?? [];
        const weight = cloIds.length > 0 ? Math.round((1 / cloIds.length) * 100) / 100 : 0;
        await assessments.create({
          assessmentId: `A-${syllabusEdits.courseId}-${i + 1}-${Date.now()}`,
          courseId: syllabusEdits.courseId,
          title: a.title,
          type: a.type,
          totalMarks: a.totalMarks,
          cloMappings: cloIds.map((id: string) => ({ cloId: id, weight })),
          status: "pending",
        });
        aCount++;
      }
      setSyllabusImportResult({
        success: true,
        message: `Course "${syllabusEdits.title}" imported with ${(syllabusEdits.CLOs ?? []).length} CLOs and ${aCount} assessments.`,
      });
      fetchAllData();
    } catch (err: any) {
      setSyllabusImportResult({ success: false, message: err.message ?? "Import failed." });
    } finally {
      setSyllabusImporting(false);
    }
  };

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
      case "performances":
        return ["performanceId", "studentId", "assessmentId", "courseId", "score", "maxScore"];
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
      case "performances":
        return ["performanceId", "studentId", "assessmentId", "courseId", "score", "maxScore", "gradedBy"];
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
      case "performances":
        return performancesList;
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
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <DashboardTopBar userName={user?.name} userRole={user?.role} />
        <DashboardNavTabs userRole={user?.role || ""} />

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-white">
          <div className="px-6 flex gap-8">{["students", "users", "instructors", "courses", "assessments", "performances", "enrollments", "mass-enrollment", "syllabus-import", "backup"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 font-medium text-sm border-b-2 transition-all duration-300 ease-in-out ${
                  activeTab === tab
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {tab === "mass-enrollment" ? "Mass Enrollment" : tab === "syllabus-import" ? "Syllabus Import" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Mass Enrollment Section */}
          {activeTab === "mass-enrollment" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-1">Mass Enrollment</h3>
                <p className="text-sm text-slate-500 mb-6">Download the CSV template, fill in student and course data, then upload to create students and enroll them in bulk.</p>

                <div className="mb-6">
                  <h4 className="font-semibold text-slate-700 mb-2">Step 1 — Download Template</h4>
                  <p className="text-xs text-slate-500 mb-3">The template contains one example row. Fill it with your data and save as CSV.</p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg hover:bg-slate-300 font-semibold flex items-center gap-2"
                  >
                    ⬇️ Download Template CSV
                  </button>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-slate-700 mb-2">Step 2 — Upload Filled CSV</h4>
                  <p className="text-xs text-slate-500 mb-3">Students that already exist will not be duplicated. Enrollments that already exist will be skipped.</p>
                  <input
                    type="file"
                    accept=".csv"
                    ref={massEnrollFileRef}
                    onChange={handleMassEnrollUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => massEnrollFileRef.current?.click()}
                    disabled={massEnrollLoading}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    {massEnrollLoading ? "Processing..." : "📤 Upload CSV"}
                  </button>
                </div>

                {massEnrollResult && (
                  <div className={`p-4 rounded-lg border ${
                    massEnrollResult.error
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-green-50 border-green-200 text-green-800"
                  }`}>
                    {massEnrollResult.error ? (
                      <p className="font-medium">✗ {massEnrollResult.error}</p>
                    ) : (
                      <>
                        <p className="font-semibold mb-2">✓ Mass enrollment complete!</p>
                        <ul className="text-sm space-y-1">
                          <li>Students created: <strong>{massEnrollResult.studentsCreated}</strong></li>
                          <li>Students already existed (skipped): <strong>{massEnrollResult.studentsSkipped}</strong></li>
                          <li>Enrollments created: <strong>{massEnrollResult.enrollmentsCreated}</strong></li>
                          <li>Enrollments already existed (skipped): <strong>{massEnrollResult.enrollmentsSkipped}</strong></li>
                        </ul>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ CSV Columns:</strong> studentid, firstname, lastname, email, program, year, courseid, term
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Syllabus Import Section */}
          {activeTab === "syllabus-import" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-1">Syllabus Import</h3>
                <p className="text-sm text-slate-500 mb-6">Upload a PDF syllabus to automatically extract the course, CLOs, and assessments. Review and edit before importing.</p>

                {/* Upload Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors mb-4 ${
                    syllabusDragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-300 hover:border-indigo-300 cursor-pointer"
                  }`}
                  onClick={() => syllabusFileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setSyllabusDragOver(true); }}
                  onDragLeave={() => setSyllabusDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setSyllabusDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleSyllabusFile(file);
                  }}
                >
                  {syllabusFile ? (
                    <p className="text-sm text-indigo-700 font-medium">📄 {syllabusFile.name}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Drag & drop a PDF here, or click to browse</p>
                  )}
                </div>
                <input
                  ref={syllabusFileRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSyllabusFile(file);
                    e.target.value = "";
                  }}
                />

                {syllabusLoading && (
                  <div className="text-center py-8 text-indigo-600 font-medium">⏳ Parsing syllabus with AI...</div>
                )}

                {syllabusError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">✗ {syllabusError}</div>
                )}

                {/* Review Panel */}
                {syllabusEdits && !syllabusLoading && (
                  <div className="mt-6 space-y-6">

                    {/* Instructor warning */}
                    {!instructorsList.find((i: any) => i.instructorId === syllabusInstructorId) && (
                      <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
                        <p className="text-sm font-semibold text-amber-800 mb-2">
                          ⚠️ Instructor &quot;{syllabusEdits.instructorName}&quot; not found in the system. Select an existing instructor:
                        </p>
                        <select
                          value={syllabusInstructorId}
                          onChange={(e) => setSyllabusInstructorId(e.target.value)}
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          <option value="">— Leave unassigned —</option>
                          {instructorsList.map((i: any) => (
                            <option key={i.instructorId} value={i.instructorId}>{i.name} ({i.instructorId})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Course Info */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-3">Course Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {(["courseId", "title", "department", "term"] as const).map((field) => (
                          <div key={field}>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                            <input
                              type="text"
                              value={syllabusEdits[field] ?? ""}
                              onChange={(e) => setSyllabusEdits({ ...syllabusEdits, [field]: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CLOs Table */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-slate-800">Course Learning Outcomes ({(syllabusEdits.CLOs ?? []).length})</h4>
                        <button
                          type="button"
                          onClick={() => setSyllabusEdits({ ...syllabusEdits, CLOs: [...(syllabusEdits.CLOs ?? []), { cloId: "", description: "" }] })}
                          className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded font-medium"
                        >
                          + Add CLO
                        </button>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-slate-200">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-slate-700 w-24">CLO ID</th>
                            <th className="text-left px-3 py-2 font-semibold text-slate-700">Description</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {(syllabusEdits.CLOs ?? []).map((clo: any, idx: number) => (
                            <tr key={idx} className="bg-white">
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={clo.cloId}
                                  onChange={(e) => {
                                    const updated = [...syllabusEdits.CLOs];
                                    updated[idx] = { ...updated[idx], cloId: e.target.value };
                                    setSyllabusEdits({ ...syllabusEdits, CLOs: updated });
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={clo.description}
                                  onChange={(e) => {
                                    const updated = [...syllabusEdits.CLOs];
                                    updated[idx] = { ...updated[idx], description: e.target.value };
                                    setSyllabusEdits({ ...syllabusEdits, CLOs: updated });
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = syllabusEdits.CLOs.filter((_: any, i: number) => i !== idx);
                                    setSyllabusEdits({ ...syllabusEdits, CLOs: updated });
                                  }}
                                  className="text-red-400 hover:text-red-600 text-lg leading-none"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Assessments Table */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-slate-800">Assessments ({(syllabusEdits.assessments ?? []).length})</h4>
                        <button
                          type="button"
                          onClick={() => setSyllabusEdits({ ...syllabusEdits, assessments: [...(syllabusEdits.assessments ?? []), { title: "", type: "other", totalMarks: 0, cloIds: [] }] })}
                          className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded font-medium"
                        >
                          + Add Assessment
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-200">
                            <tr>
                              <th className="text-left px-3 py-2 font-semibold text-slate-700">Title</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-700 w-32">Type</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-700 w-24">Marks</th>
                              <th className="text-left px-3 py-2 font-semibold text-slate-700">CLOs Mapped</th>
                              <th className="w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {(syllabusEdits.assessments ?? []).map((a: any, idx: number) => (
                              <tr key={idx} className="bg-white">
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={a.title}
                                    onChange={(e) => {
                                      const updated = [...syllabusEdits.assessments];
                                      updated[idx] = { ...updated[idx], title: e.target.value };
                                      setSyllabusEdits({ ...syllabusEdits, assessments: updated });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    value={a.type}
                                    onChange={(e) => {
                                      const updated = [...syllabusEdits.assessments];
                                      updated[idx] = { ...updated[idx], type: e.target.value };
                                      setSyllabusEdits({ ...syllabusEdits, assessments: updated });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                  >
                                    {["assignment", "test", "exam", "project", "quiz", "other"].map((t) => (
                                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={a.totalMarks}
                                    onChange={(e) => {
                                      const updated = [...syllabusEdits.assessments];
                                      updated[idx] = { ...updated[idx], totalMarks: parseFloat(e.target.value) || 0 };
                                      setSyllabusEdits({ ...syllabusEdits, assessments: updated });
                                    }}
                                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-wrap gap-2">
                                    {(syllabusEdits.CLOs ?? []).map((clo: any) => (
                                      <label key={clo.cloId} className="flex items-center gap-1 text-xs">
                                        <input
                                          type="checkbox"
                                          checked={(a.cloIds ?? []).includes(clo.cloId)}
                                          onChange={(e) => {
                                            const updated = [...syllabusEdits.assessments];
                                            const current: string[] = updated[idx].cloIds ?? [];
                                            updated[idx] = {
                                              ...updated[idx],
                                              cloIds: e.target.checked
                                                ? [...current, clo.cloId]
                                                : current.filter((id: string) => id !== clo.cloId),
                                            };
                                            setSyllabusEdits({ ...syllabusEdits, assessments: updated });
                                          }}
                                        />
                                        {clo.cloId}
                                      </label>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = syllabusEdits.assessments.filter((_: any, i: number) => i !== idx);
                                      setSyllabusEdits({ ...syllabusEdits, assessments: updated });
                                    }}
                                    className="text-red-400 hover:text-red-600 text-lg leading-none"
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Import Result */}
                    {syllabusImportResult && (
                      <div className={`p-4 rounded-lg border text-sm font-medium ${syllabusImportResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>
                        {syllabusImportResult.success ? "✓" : "✗"} {syllabusImportResult.message}
                      </div>
                    )}

                    {/* Import Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleSyllabusImport}
                        disabled={syllabusImporting || !!syllabusImportResult?.success}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {syllabusImporting ? "Importing..." : "⬆ Import Course"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add New Button */}
          {activeTab !== "backup" && activeTab !== "mass-enrollment" && activeTab !== "syllabus-import" && !showForm && (
            <div className="mb-6">
              <button
                onClick={handleAdd}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-2"
              >
                <span>+</span> Add New {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
              </button>
            </div>
          )}

          {/* Add/Edit Form */}
          {activeTab !== "mass-enrollment" && activeTab !== "syllabus-import" && showForm && (
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
                    ) : field === "totalMarks" || field === "score" || field === "maxScore" ? (
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
          {activeTab !== "backup" && activeTab !== "mass-enrollment" && activeTab !== "syllabus-import" && (
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
