"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth as useGlobalAuth } from "../lib/providers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi, categoryApi } from "../lib/api";
import { Notification, Category } from "../types";
import { 
  Search, Globe, MapPin, User, LogOut, Bell, Menu, X, 
  ChevronDown, LayoutDashboard, FileText, Send 
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, logout, isAuthenticated } = useGlobalAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [currentLang, setCurrentLang] = useState(searchParams.get("lang") || "en");
  const [currentDistrict, setCurrentDistrict] = useState(searchParams.get("district") || "all");

  // Sync state with URL params
  useEffect(() => {
    setCurrentLang(searchParams.get("lang") || "en");
    setCurrentDistrict(searchParams.get("district") || "all");
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // Categories API
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories-tree"],
    queryFn: categoryApi.list,
  });

  // Notifications API (only fetch if logged in)
  const { data: notifications = [], refetch: refetchNotifs } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: notificationApi.list,
    enabled: isAuthenticated,
    refetchInterval: 30000, // every 30s
  });

  // Mark Read Mutation
  const readAllMutation = useMutation({
    mutationFn: notificationApi.readAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchQuery });
  };

  const updateFilters = (updates: { lang?: string; district?: string; search?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.lang !== undefined) {
      if (updates.lang === "en") params.delete("lang");
      else params.set("lang", updates.lang);
    }
    
    if (updates.district !== undefined) {
      if (updates.district === "all") params.delete("district");
      else params.set("district", updates.district);
    }
    
    if (updates.search !== undefined) {
      if (!updates.search) params.delete("search");
      else params.set("search", updates.search);
    }

    router.push(`/?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 z-50 shadow-sm">
      {/* Top Banner: Local Date / Weather placeholder + Language */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="hidden sm:block font-medium">
          {new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div className="flex items-center gap-6 ml-auto w-full sm:w-auto justify-between sm:justify-end">
          {/* Quick Language Links */}
          <div className="flex items-center gap-3">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <button 
              onClick={() => updateFilters({ lang: "en" })} 
              className={`hover:text-white transition-colors cursor-pointer ${currentLang === "en" ? "text-brand-saffron font-bold" : ""}`}
            >
              English
            </button>
            <span className="text-slate-600">|</span>
            <button 
              onClick={() => updateFilters({ lang: "hi" })} 
              className={`hover:text-white transition-colors cursor-pointer ${currentLang === "hi" ? "text-brand-saffron font-bold" : ""}`}
            >
              हिन्दी
            </button>
            <span className="text-slate-600">|</span>
            <button 
              onClick={() => updateFilters({ lang: "bn" })} 
              className={`hover:text-white transition-colors cursor-pointer ${currentLang === "bn" ? "text-brand-saffron font-bold" : ""}`}
            >
              বাংলা
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        {/* Mobile Menu Icon */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex flex-col select-none shrink-0 group">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black tracking-tighter text-slate-900 flex items-center">
              RAPID<span className="text-brand-red">NEWS</span>
              <span className="text-brand-blue">INDIA</span>
            </span>
            <span className="h-2 w-2 rounded-full bg-red-600 inline-block animate-pulse"></span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold -mt-1 group-hover:text-brand-red transition-colors">
            Voice of the Nation, News of the Soil
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center max-w-md w-full relative">
          <input
            type="text"
            placeholder="Search news, topics, complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-1.5 bg-slate-100 border-none rounded-full text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all"
          />
          <button type="submit" className="absolute right-3 text-slate-400 hover:text-brand-blue cursor-pointer">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {/* District selector pill */}
          <div className="relative flex items-center bg-slate-100 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-inner">
            <MapPin className="w-3.5 h-3.5 text-brand-red mr-1.5" />
            <select
              value={currentDistrict}
              onChange={(e) => updateFilters({ district: e.target.value })}
              className="bg-transparent pr-4 outline-none border-none cursor-pointer appearance-none text-slate-800"
            >
              <option value="all">All India</option>
              <option value="kolkata">Kolkata (WB)</option>
              <option value="patna">Patna (BH)</option>
              <option value="lucknow">Lucknow (UP)</option>
              <option value="mumbai">Mumbai (MH)</option>
              <option value="delhi">Delhi (DL)</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 text-slate-500 pointer-events-none" />
          </div>

          {/* Notifications Center */}
          {mounted && isAuthenticated && (
            <div className="relative">
              <button 
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setUserDropdownOpen(false);
                  if (!notifDropdownOpen && unreadCount > 0) {
                    readAllMutation.mutate();
                  }
                }}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer relative transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1.5 bg-brand-red text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Box */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-slate-100 font-bold text-sm text-slate-800 flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && <span className="text-xs text-brand-red font-semibold">New Alerts</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div key={notif.id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.is_read ? "bg-red-50/40" : ""}`}>
                        <div className="font-semibold text-xs text-slate-800">{notif.title}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{notif.message}</div>
                        <div className="text-[9px] text-slate-400 mt-1">{new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* User authentication Controls */}
          {mounted && isAuthenticated ? (
            <div className="relative">
              <button 
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-full hover:bg-slate-50 cursor-pointer transition-all"
              >
                <div className="h-6 w-6 rounded-full bg-brand-blue text-white font-bold flex items-center justify-center text-xs">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-slate-700">
                  {user?.full_name?.split(" ")[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-xs text-slate-800">{user?.full_name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-[9px] font-extrabold uppercase rounded-sm">
                      {user?.role?.name}
                    </span>
                  </div>

                  {user?.role?.name === "admin" && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-blue transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}

                  {user?.role?.name === "reporter" && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-blue transition-colors">
                      <FileText className="w-4 h-4" /> Reporter Dashboard
                    </Link>
                  )}

                  <button 
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                      router.push("/");
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-blue hover:bg-blue-950 text-white rounded-full text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" /> Login
            </Link>
          )}
        </div>
      </div>

      {/* Nav Menu row - Desktop */}
      <nav className="bg-slate-50 border-t border-slate-200 hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="px-3 py-3 text-xs font-extrabold uppercase text-slate-700 hover:text-brand-red border-b-2 border-transparent hover:border-brand-red transition-all">
              Home
            </Link>
            <Link href="/?level=national" className="px-3 py-3 text-xs font-extrabold uppercase text-slate-700 hover:text-brand-red border-b-2 border-transparent hover:border-brand-red transition-all">
              National
            </Link>
            <Link href="/?level=state" className="px-3 py-3 text-xs font-extrabold uppercase text-slate-700 hover:text-brand-red border-b-2 border-transparent hover:border-brand-red transition-all">
              State News
            </Link>
            <Link href="/?level=district" className="px-3 py-3 text-xs font-extrabold uppercase text-slate-700 hover:text-brand-red border-b-2 border-transparent hover:border-brand-red transition-all">
              District Corner
            </Link>
            <Link href="/videos" className="px-3 py-3 text-xs font-extrabold uppercase text-slate-700 hover:text-brand-red border-b-2 border-transparent hover:border-brand-red transition-all flex items-center gap-1">
              Videos
            </Link>
          </div>

          <Link 
            href="/submit" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-saffron text-white rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-orange-600 shadow-sm transition-all shrink-0 my-2"
          >
            <Send className="w-3.5 h-3.5" /> Submit Tip / Complaint
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 py-4 px-6 space-y-4 shadow-inner">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full mb-4">
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-10 py-2 bg-slate-100 rounded-md text-sm outline-none"
            />
            <button type="submit" className="absolute right-3 text-slate-400">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-col gap-3 font-semibold text-slate-700">
            <Link onClick={() => setMobileMenuOpen(false)} href="/" className="hover:text-brand-red py-1 border-b border-slate-50 text-sm">
              Home
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/?level=national" className="hover:text-brand-red py-1 border-b border-slate-50 text-sm">
              National
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/?level=state" className="hover:text-brand-red py-1 border-b border-slate-50 text-sm">
              State News
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/?level=district" className="hover:text-brand-red py-1 border-b border-slate-50 text-sm">
              District Corner
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/videos" className="hover:text-brand-red py-1 border-b border-slate-50 text-sm">
              Videos
            </Link>
            <Link onClick={() => setMobileMenuOpen(false)} href="/submit" className="hover:text-brand-red py-1 border-b border-slate-50 text-sm text-brand-saffron">
              Submit Tip / Complaint
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
