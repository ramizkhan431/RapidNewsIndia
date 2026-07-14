"use client";

import React, { useState } from "react";
import { submissionApi } from "../../lib/api";
import { 
  Send, Upload, HelpCircle, FileText, CheckCircle, 
  AlertTriangle, ShieldCheck, Mail, User, MapPin, Video 
} from "lucide-react";

export default function SubmissionPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form Fields
  const [type, setType] = useState<"tip" | "complaint" | "opinion">("complaint");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [district, setDistrict] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");

  // Client-side validations
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    setError("");
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (fileList.length > 3) {
      setFileError("You can upload a maximum of 3 images.");
      return;
    }

    for (const file of fileList) {
      if (!allowedTypes.includes(file.type)) {
        setFileError(`Invalid file format: ${file.name}. Only PNG, JPG, JPEG, and WEBP are allowed.`);
        return;
      }
      if (file.size > maxSize) {
        setFileError(`File too large: ${file.name}. Maximum file size is 5MB.`);
        return;
      }
    }

    setSelectedFiles(fileList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    // Validate YouTube URL if provided
    if (ytUrl) {
      const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/;
      if (!ytRegex.test(ytUrl)) {
        setError("Invalid YouTube URL. Please input a valid watch, embed, or shorts link.");
        setLoading(false);
        return;
      }
    }

    // Build Multipart form data
    const formData = new FormData();
    formData.append("submission_type", type);
    formData.append("title", title);
    formData.append("content", content);
    formData.append("reporter_email", reporterEmail);
    if (reporterName) formData.append("reporter_name", reporterName);
    if (district) formData.append("district", district);
    if (ytUrl) formData.append("youtube_url", ytUrl);
    
    // Append uploaded images
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      await submissionApi.submit(formData);
      setSuccess(true);
      // Reset Form fields
      setTitle("");
      setContent("");
      setReporterName("");
      setReporterEmail("");
      setDistrict("");
      setYtUrl("");
      setSelectedFiles([]);
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred while submitting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Banner Section */}
        <div className="bg-brand-blue text-white p-8 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-15 transform translate-x-4 translate-y-4 scale-150">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="relative space-y-2">
            <span className="px-2.5 py-0.5 bg-brand-saffron text-white text-[9px] font-black uppercase tracking-wider rounded-sm">
              Citizen Journalism
            </span>
            <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-outfit)" }}>
              Submit News Lead / Public Complaint
            </h1>
            <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
              Are you witness to public infrastructure failures, environmental issues, corruption, or stories happening in your locality? Report anonymously or share your name. Our editors will review and convert approved leads into news drafts.
            </p>
          </div>
        </div>

        {/* Content Form */}
        <div className="p-8">
          {success ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "var(--font-outfit)" }}>
                Submission Received!
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Thank you for your active participation. Our moderation panel will verify your submission. Approved items are converted to drafts for publication in our District Corners.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-6 px-5 py-2 bg-brand-blue hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-full cursor-pointer"
              >
                Submit another tip
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="flex items-center gap-2 p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Row: Type & District */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    Submission Category <HelpCircle className="w-3 h-3 text-slate-400" />
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="complaint">Civic Complaint (Potholes, water, power)</option>
                    <option value="tip">News Tip (Local alerts, events, updates)</option>
                    <option value="opinion">Citizen Opinion (Editorial pieces, reviews)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Reporting District</label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Kolkata, Lucknow, Patna"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Submission Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Grievance / Story Title</label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Provide a brief, catchy summary of the issue"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Detailed Description</label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Elaborate on details: date of event, exact location, who is involved, and what action is required..."
                  className="w-full p-4 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              {/* User credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Your Name (Optional)</label>
                  <div className="relative flex items-center bg-white rounded-lg">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Anoymous or Name"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Contact Email (Required for verification)</label>
                  <div className="relative flex items-center bg-white rounded-lg">
                    <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="citizen_journalist@gmail.com"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Multimedia Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Images Upload */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Upload Images (Images only, Max 3)</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-brand-blue rounded-xl p-4 transition-all relative flex flex-col items-center justify-center bg-slate-50 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-700">Click to upload files</span>
                    <span className="text-[9px] text-slate-400 mt-1">PNG, JPG, JPEG, WEBP (Max 5MB each)</span>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="text-xs font-semibold text-slate-600 mt-2">
                      Selected: {selectedFiles.map(f => f.name).join(", ")}
                    </div>
                  )}
                  {fileError && (
                    <div className="text-xs font-bold text-red-600 mt-1">{fileError}</div>
                  )}
                </div>

                {/* Optional YouTube Video link */}
                <div className="space-y-1.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500">Paste YouTube Video link (Optional)</label>
                    <div className="relative flex items-center">
                      <Video className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={ytUrl}
                        onChange={(e) => setYtUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 leading-tight block">
                      Include raw video clips or local news recordings hosted on YouTube.
                    </span>
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-blue hover:bg-blue-950 text-white font-bold text-xs uppercase rounded-lg shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? "Submitting Report..." : "Submit Grievance to Editors"}
              </button>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
