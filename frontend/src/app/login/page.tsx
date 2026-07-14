"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/providers";
import { authApi } from "../../lib/api";
import { Lock, Mail, User as UserIcon, MapPin, AlignLeft, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto my-16 px-4">Loading login form...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"login" | "signup-reporter">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Sync tab with URL parameter if set
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "signup-reporter") {
      setActiveTab("signup-reporter");
    }
  }, [searchParams]);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Reporter Signup Form States
  const [repName, setRepName] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repPassword, setRepPassword] = useState("");
  const [repDistrict, setRepDistrict] = useState("");
  const [repState, setRepState] = useState("");
  const [repBio, setRepBio] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", loginEmail);
      formData.append("password", loginPassword);

      const data = await authApi.login(formData);
      login(data.access_token, data.role, data.full_name, data.user_id);
      
      // Redirect
      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleReporterSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      await authApi.registerReporter({
        email: repEmail,
        password: repPassword,
        full_name: repName,
        district: repDistrict,
        state: repState,
        bio: repBio,
      });

      setSuccessMessage("Reporter account registered! Please wait for system admin verification.");
      // Reset signup fields
      setRepName("");
      setRepEmail("");
      setRepPassword("");
      setRepDistrict("");
      setRepState("");
      setRepBio("");
      
      // Switch back to login after registration success
      setTimeout(() => {
        setActiveTab("login");
      }, 4000);

    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to register reporter profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => { setActiveTab("login"); setError(""); }}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeTab === "login" 
                ? "bg-white border-brand-blue text-brand-blue" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab("signup-reporter"); setError(""); }}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeTab === "signup-reporter" 
                ? "bg-white border-brand-red text-brand-red" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Reporter Join
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Brand Header */}
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
              {activeTab === "login" ? "Welcome Back" : "Apply for Press Access"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "login" 
                ? "Access news feeds, moderate reports, or post stories" 
                : "Publish regional district logs and cover news stories"
              }
            </p>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@rapidnewsindia.com"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-blue hover:bg-blue-950 text-white font-bold text-xs uppercase rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Reporter Signup Form */}
          {activeTab === "signup-reporter" && (
            <form onSubmit={handleReporterSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Full Name</label>
                  <div className="relative flex items-center">
                    <UserIcon className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={repName}
                      onChange={(e) => setRepName(e.target.value)}
                      placeholder="e.g. Joydeep Banerjee"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={repEmail}
                      onChange={(e) => setRepEmail(e.target.value)}
                      placeholder="reporter@email.com"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Password (Min 6 chars)</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={repPassword}
                      onChange={(e) => setRepPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500">District Corner</label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={repDistrict}
                        onChange={(e) => setRepDistrict(e.target.value)}
                        placeholder="Kolkata"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500">State / Region</label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={repState}
                        onChange={(e) => setRepState(e.target.value)}
                        placeholder="West Bengal"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Biography / Experience</label>
                  <div className="relative flex items-center">
                    <AlignLeft className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      value={repBio}
                      onChange={(e) => setRepBio(e.target.value)}
                      placeholder="Brief details about your media credentials..."
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red"
                    />
                  </div>
                </div>

              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-red hover:bg-red-950 text-white font-bold text-xs uppercase rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? "Registering..." : "Submit Reporter Application"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
