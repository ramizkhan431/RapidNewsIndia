"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/providers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, categoryApi, newsApi, getMediaUrl } from "../../lib/api";
import { Category, Submission, Reporter, User, News } from "../../types";
import { 
  Users, FileText, CheckCircle, XCircle, LayoutDashboard, 
  Send, PenTool, CheckSquare, Eye, FolderPlus, Upload, Video, 
  Lock, AlertCircle, ShieldAlert 
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, role, isLoading, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"stats" | "moderate" | "reporters" | "users" | "write" | "my-articles">("stats");

  // Client-side authentication check
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (role !== "admin" && role !== "reporter") {
        router.push("/");
      }
      // Set default tab for reporter
      if (role === "reporter") {
        setActiveTab("write");
      }
    }
  }, [isAuthenticated, role, isLoading, router]);

  // Analytics query (admin only)
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminApi.getStats,
    enabled: role === "admin",
  });

  // Submissions query (admin only)
  const { data: submissions = [] } = useQuery<Submission[]>({
    queryKey: ["admin-submissions"],
    queryFn: adminApi.listSubmissions,
    enabled: role === "admin",
  });

  // Reporters query (admin only)
  const { data: reporters = [] } = useQuery<Reporter[]>({
    queryKey: ["admin-reporters"],
    queryFn: adminApi.listReporters,
    enabled: role === "admin",
  });

  // Users query (admin only)
  const { data: usersList = [] } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: adminApi.listUsers,
    enabled: role === "admin",
  });

  // Categories list query
  const { data: categoriesList = [] } = useQuery<Category[]>({
    queryKey: ["categories-list"],
    queryFn: categoryApi.list,
  });

  // News list for reporter tracking
  const { data: myNewsData } = useQuery({
    queryKey: ["my-news", user?.id],
    queryFn: () => newsApi.list({ skip: 0, limit: 100, status_filter: "all" }), // in services we can filter, here we'll just slice
    enabled: !!user?.id,
  });
  const myNews: News[] = myNewsData?.articles?.filter((art: News) => art.author_id === user?.id) || [];

  // Mutations
  const moderateMutation = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: { status: string; moderation_notes?: string } }) => 
      adminApi.moderateSubmission(id, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["news-list"] });
    }
  });

  const approveReporterMutation = useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) => 
      adminApi.approveReporter(id, approve),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reporters"] });
    }
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  // ----------------- Write News Form State -----------------
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsCategory, setNewsCategory] = useState("");
  const [newsLanguage, setNewsLanguage] = useState("en");
  const [newsStatus, setNewsStatus] = useState("draft");
  const [newsPublishDate, setNewsPublishDate] = useState("");
  const [newsYtUrls, setNewsYtUrls] = useState("");
  const [newsImages, setNewsImages] = useState<File[]>([]);
  const [writeError, setWriteError] = useState("");
  const [writeSuccess, setWriteSuccess] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Set default category when loaded
  useEffect(() => {
    if (categoriesList.length > 0 && !newsCategory) {
      setNewsCategory(String(categoriesList[0].id));
    }
  }, [categoriesList, newsCategory]);

  const handleNewsImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWriteError("");
    if (e.target.files) {
      const filesList = Array.from(e.target.files);
      if (filesList.length > 3) {
        setWriteError("Maximum of 3 images can be uploaded.");
        return;
      }
      setNewsImages(filesList);
    }
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWriteError("");
    setWriteSuccess("");
    setSubmitLoading(true);

    if (role === "reporter" && user && (!user.is_active || !user.reporter_profile?.is_approved)) {
      setWriteError("Your reporter profile is pending verification. You cannot publish until approved.");
      setSubmitLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", newsTitle);
    formData.append("content", newsContent);
    formData.append("category_id", newsCategory);
    formData.append("language", newsLanguage);
    formData.append("status", newsStatus);
    
    if (newsPublishDate) {
      // Convert local datetime to ISO format
      const isoDate = new Date(newsPublishDate).toISOString();
      formData.append("published_at", isoDate);
    }
    if (newsYtUrls) {
      formData.append("youtube_urls", newsYtUrls);
    }
    newsImages.forEach((img) => {
      formData.append("images", img);
    });

    try {
      await newsApi.create(formData);
      setWriteSuccess("News article successfully created!");
      // Reset Write form fields
      setNewsTitle("");
      setNewsContent("");
      setNewsYtUrls("");
      setNewsPublishDate("");
      setNewsImages([]);
      queryClient.invalidateQueries({ queryKey: ["news-list"] });
    } catch (err: any) {
      setWriteError(err.response?.data?.detail || "An error occurred while creating the article.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <span className="animate-spin h-8 w-8 border-4 border-brand-blue border-t-transparent rounded-full inline-block"></span>
        <p className="text-xs text-slate-400 mt-2">Verifying credentials, loading panel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md border-b-4 border-brand-blue">
        <div className="space-y-2">
          <span className="px-2.5 py-0.5 bg-brand-blue text-white text-[9px] font-black uppercase tracking-wider rounded-sm">
            CONTROL CENTER
          </span>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-outfit)" }}>
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-400">
            Current Session Role: <span className="text-brand-saffron font-bold uppercase">{role}</span>
            {role === "reporter" && !user?.reporter_profile?.is_approved && (
              <span className="text-red-500 font-bold ml-1">• Pending verification</span>
            )}
          </p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1 bg-white p-1 rounded-lg shadow-sm">
        {role === "admin" && (
          <>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "stats" ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview
            </button>
            <button
              onClick={() => setActiveTab("moderate")}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "moderate" ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CheckSquare className="w-4 h-4" /> Moderation ({submissions.filter(s=>s.status==='pending').length})
            </button>
            <button
              onClick={() => setActiveTab("reporters")}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "reporters" ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" /> Verify Reporters ({reporters.filter(r=>!r.is_approved).length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "users" ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" /> Manage Users
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab("write")}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "write" ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <PenTool className="w-4 h-4" /> Write News
        </button>

        {role === "reporter" && (
          <button
            onClick={() => setActiveTab("my-articles")}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "my-articles" ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FileText className="w-4 h-4" /> My Submissions ({myNews.length})
          </button>
        )}
      </div>

      {/* Tab Panel contents */}
      <div className="space-y-6">

        {/* 1. STATS TAB */}
        {activeTab === "stats" && role === "admin" && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Total News Articles</span>
              <p className="text-3xl font-black text-slate-900">{stats.news_count}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Registered Users</span>
              <p className="text-3xl font-black text-slate-900">{stats.users_count}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Field Reporters</span>
              <p className="text-3xl font-black text-slate-900">{stats.reporters_count}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Total Article Views</span>
              <p className="text-3xl font-black text-brand-blue">{stats.views_count}</p>
            </div>
          </div>
        )}

        {/* 2. CONTENT MODERATION TAB */}
        {activeTab === "moderate" && role === "admin" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-sm text-slate-800">
              Grievance Submissions Requiring Moderation
            </div>
            {submissions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No submissions found</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-sm text-[9px] font-black uppercase text-slate-500">
                          {sub.submission_type}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-base">{sub.title}</h3>
                        <p className="text-[10px] text-slate-400">
                          Submitted by {sub.reporter_name || "Anonymous"} ({sub.reporter_email}) in district {sub.district || "All"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {sub.status === "pending" ? (
                          <>
                            <button
                              onClick={() => moderateMutation.mutate({ id: sub.id, decision: { status: "approved", moderation_notes: "Approved by Admin" } })}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-200 rounded-md text-xs font-bold uppercase transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => moderateMutation.mutate({ id: sub.id, decision: { status: "rejected", moderation_notes: "Rejected by Admin" } })}
                              className="px-3 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 rounded-md text-xs font-bold uppercase transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            sub.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}>
                            {sub.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{sub.content}</p>
                    
                    {/* Media Attachments */}
                    {sub.media_items && sub.media_items.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {sub.media_items.map((m) => (
                          <div key={m.id} className="relative h-20 aspect-video bg-slate-900 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                            {m.media_type === "image" ? (
                              <img src={getMediaUrl(m.url)} alt="attach" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-500 text-[10px] uppercase font-extrabold gap-0.5">
                                <Video className="w-3.5 h-3.5" /> Video Link
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. REPORTER VERIFICATION TAB */}
        {activeTab === "reporters" && role === "admin" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-sm text-slate-800">
              Reporter Access Applicant Profiles
            </div>
            {reporters.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No applicants found</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reporters.map((rep) => (
                  <div key={rep.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-800 text-sm">{rep.user?.full_name}</h3>
                      <p className="text-xs text-slate-500">{rep.user?.email}</p>
                      <p className="text-xs text-slate-700">
                        Assigned Zone: <span className="font-bold text-slate-800">{rep.district}, {rep.state}</span>
                      </p>
                      {rep.bio && <p className="text-xs text-slate-400 italic mt-2">"{rep.bio}"</p>}
                    </div>

                    <div className="flex gap-2">
                      {!rep.is_approved ? (
                        <>
                          <button
                            onClick={() => approveReporterMutation.mutate({ id: rep.id, approve: true })}
                            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-200 rounded-md text-xs font-bold uppercase transition-colors cursor-pointer"
                          >
                            Verify & Approve
                          </button>
                          <button
                            onClick={() => approveReporterMutation.mutate({ id: rep.id, approve: false })}
                            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 rounded-md text-xs font-bold uppercase transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-extrabold uppercase">
                          <CheckCircle className="w-4.5 h-4.5" /> Approved Reporter
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. MANAGE USERS TAB */}
        {activeTab === "users" && role === "admin" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-sm text-slate-800">
              Registered Accounts Management
            </div>
            <div className="divide-y divide-slate-100">
              {usersList.map((usr) => (
                <div key={usr.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-slate-800 text-sm">{usr.full_name}</p>
                    <p className="text-xs text-slate-500">{usr.email}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      usr.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {usr.is_active ? "Active" : "Blocked"}
                    </span>
                    <button
                      onClick={() => toggleUserStatusMutation.mutate(usr.id)}
                      className={`px-3 py-1 border rounded text-xs font-bold uppercase transition-colors cursor-pointer ${
                        usr.is_active 
                          ? "bg-red-50 border-red-200 hover:bg-red-600 hover:text-white text-red-600" 
                          : "bg-emerald-50 border-emerald-200 hover:bg-emerald-600 hover:text-white text-emerald-600"
                      }`}
                    >
                      {usr.is_active ? "Block" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. WRITE / PUBLISH NEWS TAB */}
        {activeTab === "write" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-8">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-lg font-black text-slate-800" style={{ fontFamily: "var(--font-outfit)" }}>
                Compose News Broadcast
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Draft new bulletins, load multi-image galleries, and format YouTube video links
              </p>
            </div>

            <form onSubmit={handleNewsSubmit} className="space-y-6">
              {writeError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{writeError}</span>
                </div>
              )}

              {writeSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
                  <span>{writeSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">News Title / Headline</label>
                <input
                  type="text"
                  required
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="e.g. Traffic halts on Howrah Bridge due to heavy pre-monsoon showers"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              {/* Form Row: Category & Lang & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Select Category</label>
                  <select
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Language</label>
                  <select
                    value={newsLanguage}
                    onChange={(e) => setNewsLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50"
                  >
                    <option value="en">English (default)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Publishing Mode</label>
                  <select
                    value={newsStatus}
                    onChange={(e) => setNewsStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50"
                  >
                    <option value="draft">Save as Draft</option>
                    <option value="published">Publish Immediately</option>
                    <option value="scheduled">Scheduled Publishing</option>
                  </select>
                </div>
              </div>

              {/* Publish Date - only visible if scheduled */}
              {newsStatus === "scheduled" && (
                <div className="space-y-1.5 max-w-sm">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newsPublishDate}
                    onChange={(e) => setNewsPublishDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              )}

              {/* News Body editor */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Article Content (HTML tags supported)</label>
                <textarea
                  required
                  rows={8}
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  placeholder="<p>State highway services came to a standstill...</p><p>Local civic committees have launched clean up drives...</p>"
                  className="w-full p-4 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              {/* Media uploads: Youtube URLs and local images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 border border-slate-200/60 rounded-xl">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-red-500" /> YouTube Video link (Optional)
                  </label>
                  <input
                    type="text"
                    value={newsYtUrls}
                    onChange={(e) => setNewsYtUrls(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5 text-brand-blue" /> Upload Featured Images (Max 3)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleNewsImageChange}
                    className="w-full text-xs font-semibold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-brand-blue hover:file:bg-blue-100 cursor-pointer"
                  />
                  {newsImages.length > 0 && (
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">
                      Selected: {newsImages.map(img => img.name).join(", ")}
                    </p>
                  )}
                </div>

              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-3 bg-brand-blue hover:bg-blue-950 text-white font-bold text-xs uppercase rounded-lg shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitLoading ? "Publishing bulletin..." : "Post News Bulletin"}
              </button>
            </form>
          </div>
        )}

        {/* 6. MY ARTICLES TRACKER (For reporters) */}
        {activeTab === "my-articles" && role === "reporter" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-sm text-slate-800">
              Track My Publications & Status
            </div>
            {myNews.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No articles drafted yet</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myNews.map((art) => (
                  <div key={art.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{art.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Language: {art.language.toUpperCase()} | Views: {art.view_count}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        art.status === "published" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : art.status === "scheduled" 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-amber-100 text-amber-700"
                      }`}>
                        {art.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
