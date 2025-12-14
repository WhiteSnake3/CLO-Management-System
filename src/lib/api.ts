const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
) => {
const url = `${API_URL}${endpoint}`;
  // use the Headers API to avoid indexing a union type and to work with all HeadersInit shapes
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = localStorage.getItem("token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle error responses
  if (!response.ok) {
    // Try to extract error message from response body
    const contentLength = response.headers.get("content-length");
    if (contentLength !== "0") {
      try {
        const text = await response.text();
        if (text) {
          const errorData = JSON.parse(text);
          throw new Error(errorData.msg || errorData.error || `API error: ${response.statusText}`);
        }
      } catch (parseErr: any) {
        // If JSON parsing fails, use the status text
        if (parseErr.message && !parseErr.message.includes("JSON")) {
          throw parseErr;
        }
      }
    }
    throw new Error(`API error: ${response.statusText}`);
  }

  // Handle empty responses (like 204 No Content)
  const contentLength = response.headers.get("content-length");
  if (response.status === 204 || contentLength === "0") {
    return null;
  }

  // Check if response has content
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

// Auth endpoints
export const auth = {
  register: (data: { email: string; name: string; password: string; role: string; userId?: string }) =>
    apiCall("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    apiCall("/auth/login", { method: "POST", body: JSON.stringify(data) }),
};

// Users endpoints
export const users = {
  getAll: () => apiCall("/auth"),
  getById: (id: string) => apiCall(`/auth/${id}`),
  create: (data: any) => apiCall("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/auth/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/auth/${id}`, { method: "DELETE" }),
};

// Students endpoints
export const students = {
  getAll: () => apiCall("/students"),
  getById: (id: string) => apiCall(`/students/${id}`),
  create: (data: any) => apiCall("/students", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/students/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/students/${id}`, { method: "DELETE" }),
};

// Courses endpoints
export const courses = {
  getAll: () => apiCall("/courses"),
  getById: (id: string) => apiCall(`/courses/${id}`),
  create: (data: any) => apiCall("/courses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/courses/${id}`, { method: "DELETE" }),
};

// Instructors endpoints
export const instructors = {
  getAll: () => apiCall("/instructors"),
  getById: (id: string) => apiCall(`/instructors/${id}`),
  create: (data: any) => apiCall("/instructors", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/instructors/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/instructors/${id}`, { method: "DELETE" }),
};

// Assessments endpoints
export const assessments = {
  getAll: () => apiCall("/assessments"),
  getById: (id: string) => apiCall(`/assessments/${id}`),
  create: (data: any) => apiCall("/assessments", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/assessments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/assessments/${id}`, { method: "DELETE" }),
};

// Enrollments endpoints
export const enrollments = {
  getAll: () => apiCall("/enrollments"),
  getById: (id: string) => apiCall(`/enrollments/${id}`),
  create: (data: any) => apiCall("/enrollments", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/enrollments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/enrollments/${id}`, { method: "DELETE" }),
};

// Performances endpoints
export const performances = {
  getAll: () => apiCall("/performances"),
  getById: (id: string) => apiCall(`/performances/${id}`),
  create: (data: any) => apiCall("/performances", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/performances/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/performances/${id}`, { method: "DELETE" }),
};
// Transaction Logs endpoints
export const transactionLogs = {
  getAll: () => apiCall("/transaction-logs"),
  create: (data: any) => apiCall("/transaction-logs", { method: "POST", body: JSON.stringify(data) }),
};

// Analytics endpoints
export const analytics = {
  getCLOAchievement: (courseId?: string) =>
    apiCall(`/analytics${courseId ? `?courseId=${courseId}` : ""}`),
};

// Backup endpoints
export const backup = {
  createBackup: () => apiCall("/backup/backup", { method: "POST" }),
  listBackups: () => apiCall("/backup/backups"),
  restore: (backupName: string) => apiCall(`/backup/restore/${backupName}`, { method: "POST" }),
};

// Utility: Decode JWT to get user info
export const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
};
