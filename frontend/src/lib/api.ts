import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically inject Bearer Token if logged in
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Helper to construct image URL
export const getMediaUrl = (path: string) => {
  if (!path) return "/placeholder-news.jpg";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
};

// ----------------- Auth APIs -----------------
export const authApi = {
  login: async (formData: URLSearchParams) => {
    // OAuth2 password flow takes url-encoded form body
    const response = await axios.post(`${API_URL}/api/v1/auth/login`, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  },
  register: async (userData: any) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  registerReporter: async (reporterData: any) => {
    const response = await api.post("/auth/register/reporter", reporterData);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// ----------------- Category APIs -----------------
export const categoryApi = {
  list: async () => {
    const response = await api.get("/categories");
    return response.data;
  },
  create: async (categoryData: any) => {
    const response = await api.post("/categories/create", categoryData);
    return response.data;
  },
};

// ----------------- News APIs -----------------
export const newsApi = {
  list: async (params: {
    category_id?: number;
    level?: string;
    district?: string;
    language?: string;
    status_filter?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get("/news", { params });
    return response.data;
  },
  listVideos: async (params: {
    category_id?: number;
    language?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get("/news/videos", { params });
    return response.data;
  },
  get: async (slugOrId: string) => {
    const response = await api.get(`/news/${slugOrId}`);
    return response.data;
  },
  create: async (formData: FormData) => {
    const response = await api.post("/news/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  update: async (id: number, newsData: any) => {
    const response = await api.put(`/news/${id}`, newsData);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/news/${id}`);
    return response.data;
  },
};

// ----------------- Submission APIs -----------------
export const submissionApi = {
  submit: async (formData: FormData) => {
    const response = await api.post("/submissions/submit", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

// ----------------- Notification APIs -----------------
export const notificationApi = {
  list: async () => {
    const response = await api.get("/notifications");
    return response.data;
  },
  readAll: async () => {
    const response = await api.post("/notifications/read-all");
    return response.data;
  },
};

// ----------------- Admin APIs -----------------
export const adminApi = {
  getStats: async () => {
    const response = await api.get("/admin/dashboard/stats");
    return response.data;
  },
  listSubmissions: async () => {
    const response = await api.get("/admin/submissions");
    return response.data;
  },
  moderateSubmission: async (id: number, decision: { status: string; moderation_notes?: string }) => {
    const response = await api.post(`/admin/submissions/${id}/moderate`, decision);
    return response.data;
  },
  listReporters: async () => {
    const response = await api.get("/admin/reporters");
    return response.data;
  },
  approveReporter: async (id: number, approve: boolean) => {
    const response = await api.post(`/admin/reporters/${id}/approve`, null, {
      params: { approve },
    });
    return response.data;
  },
  listUsers: async () => {
    const response = await api.get("/admin/users");
    return response.data;
  },
  toggleUserStatus: async (id: number) => {
    const response = await api.post(`/admin/users/${id}/toggle-status`);
    return response.data;
  },
};
export default api;
