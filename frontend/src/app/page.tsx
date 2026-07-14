"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { newsApi, getMediaUrl } from "../lib/api";
import { News } from "../types";
import Link from "next/link";
import { 
  Eye, Calendar, ArrowRight, Video, Flame, X, 
  MessageCircle, Send, Users, ShieldAlert, Award
} from "lucide-react";

export default function Home() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading news feed...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<News[]>([]);
  const limit = 6;

  // Read URL search params
  const lang = searchParams.get("lang") || undefined;
  const district = searchParams.get("district") || undefined;
  const level = searchParams.get("level") || undefined;
  const search = searchParams.get("search") || undefined;

  // Reset pagination and article list when filter parameters change
  useEffect(() => {
    setPage(1);
    setArticles([]);
  }, [lang, district, level, search]);

  // Fetch news using react-query
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["news-list", lang, district, level, search, page],
    queryFn: () => newsApi.list({
      language: lang,
      district: district,
      level: level,
      search: search,
      skip: (page - 1) * limit,
      limit: limit,
      status_filter: "published"
    }),
  });

  // Append new articles when loaded
  useEffect(() => {
    if (data?.articles) {
      if (page === 1) {
        setArticles(data.articles);
      } else {
        // Prevent duplicate append
        setArticles(prev => {
          const prevIds = new Set(prev.map(a => a.id));
          const fresh = data.articles.filter((a: News) => !prevIds.has(a.id));
          return [...prev, ...fresh];
        });
      }
    }
  }, [data, page]);

  // Trending news query (most viewed)
  const { data: trendingData } = useQuery({
    queryKey: ["news-trending"],
    queryFn: () => newsApi.list({ limit: 5, status_filter: "published" }), // sorting is default desc by publish date, we'll slice and mimic trending views
  });
  const trendingArticles: News[] = trendingData?.articles || [];

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const hasMore = data ? articles.length < data.total : false;
  const hasActiveFilters = !!(lang || district || level || search);

  // Filter labels mapping
  const getFilterLabel = () => {
    const list = [];
    if (lang) list.push(`Language: ${lang.toUpperCase()}`);
    if (district) list.push(`District: ${district.charAt(0).toUpperCase() + district.slice(1)}`);
    if (level) list.push(`Level: ${level.charAt(0).toUpperCase() + level.slice(1)}`);
    if (search) list.push(`Search: "${search}"`);
    return list;
  };

  // Extract featured image from news
  const getFeaturedImage = (article: News) => {
    const imgItem = article.media_items?.find(m => m.media_type === "image");
    return imgItem ? getMediaUrl(imgItem.url) : "/placeholder-news.jpg";
  };

  const featuredArticle = articles[0];
  const secondaryArticles = articles.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Active filters pill display */}
      {hasActiveFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Filters:</span>
          {getFilterLabel().map((label, idx) => (
            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-brand-red text-xs font-extrabold rounded-full border border-red-100">
              {label}
            </span>
          ))}
          <Link href="/" className="ml-auto text-xs font-bold text-slate-500 hover:text-brand-red flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Clear All
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed Section (Col-span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {isLoading && page === 1 ? (
            // Skeleton Loader
            <div className="space-y-6">
              <div className="h-96 bg-slate-200 rounded-xl animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
                <div className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 px-4 text-center">
              <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "var(--font-outfit)" }}>No articles found</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1.5">
                We couldn't find any news matching your active filters. Try clearing some tags or searching for another keyword.
              </p>
              <Link href="/" className="inline-block mt-5 px-5 py-2 bg-brand-blue hover:bg-blue-900 text-white font-bold text-xs uppercase rounded-full">
                Go to Home Feed
              </Link>
            </div>
          ) : (
            <>
              {/* Featured Headline Article (Only on page 1) */}
              {page === 1 && featuredArticle && (() => {
                const featuredVideo = featuredArticle.media_items?.find(m => m.media_type === "youtube");
                if (featuredVideo) {
                  return (
                    <div className="flex flex-col md:flex-row bg-slate-950 text-white rounded-2xl overflow-hidden shadow-lg hover-card">
                      {/* Video Side */}
                      <div className="md:w-3/5 aspect-video relative bg-black shrink-0">
                        <iframe
                          src={featuredVideo.url}
                          title={featuredArticle.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full border-none"
                        ></iframe>
                      </div>
                      {/* Info Side */}
                      <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between bg-slate-950">
                        <div className="space-y-3.5">
                          <div className="flex gap-2">
                            <span className="px-3 py-1 bg-brand-red text-white text-[10px] font-extrabold uppercase rounded-sm shadow-md">
                              {featuredArticle.category?.name || "News"}
                            </span>
                            <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-extrabold uppercase rounded-sm border border-slate-800 flex items-center gap-1 shadow-md">
                              <Video className="w-3.5 h-3.5 text-red-500 fill-current" /> Video
                            </span>
                          </div>
                          <Link href={`/news/${featuredArticle.slug}`}>
                            <h2 
                              className="text-lg sm:text-xl font-black leading-tight hover:text-orange-300 transition-colors"
                              style={{ fontFamily: "var(--font-outfit)" }}
                            >
                              {featuredArticle.title}
                            </h2>
                          </Link>
                          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                            {featuredArticle.content.replace(/<[^>]*>/g, "")}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3 text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-4">
                          <span>By {featuredArticle.author?.full_name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(featuredArticle.published_at || featuredArticle.created_at).toLocaleDateString("en-IN", {month: 'short', day: 'numeric'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="group relative bg-slate-900 text-white rounded-2xl overflow-hidden shadow-lg hover-card aspect-video md:aspect-[21/9]">
                      <img
                        src={getFeaturedImage(featuredArticle)}
                        alt={featuredArticle.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                      
                      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-3.5">
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-brand-red text-white text-[10px] font-extrabold uppercase rounded-sm shadow-md">
                            {featuredArticle.category?.name || "News"}
                          </span>
                        </div>
                        <Link href={`/news/${featuredArticle.slug}`}>
                          <h1 
                            className="text-xl sm:text-2xl md:text-3xl font-black leading-tight hover:text-orange-300 transition-colors"
                            style={{ fontFamily: "var(--font-outfit)" }}
                          >
                            {featuredArticle.title}
                          </h1>
                        </Link>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed hidden sm:block">
                          {featuredArticle.content.replace(/<[^>]*>/g, "")}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <span>By {featuredArticle.author?.full_name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(featuredArticle.published_at || featuredArticle.created_at).toLocaleDateString("en-IN", {month: 'short', day: 'numeric', year: 'numeric'})}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> {featuredArticle.view_count} views
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Feed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(page === 1 ? secondaryArticles : articles).map((article) => {
                  const ytMedia = article.media_items?.find(m => m.media_type === "youtube");
                  return (
                    <article key={article.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover-card flex flex-col">
                      {/* Image or Video Card header */}
                      <div className="relative aspect-video overflow-hidden bg-black">
                        {ytMedia ? (
                          <iframe
                            src={ytMedia.url}
                            title={article.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full border-none animate-fade-in"
                          ></iframe>
                        ) : (
                          <img
                            src={getFeaturedImage(article)}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-3 left-3 flex gap-1.5 pointer-events-none z-10">
                          <span className="px-2.5 py-0.5 bg-brand-blue text-white text-[9px] font-black uppercase rounded shadow-sm">
                            {article.category?.name}
                          </span>
                        </div>
                      </div>
                    {/* Card Content Body */}
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <Link href={`/news/${article.slug}`}>
                          <h3 
                            className="font-extrabold text-slate-900 text-base leading-snug hover:text-brand-red transition-colors line-clamp-2"
                            style={{ fontFamily: "var(--font-outfit)" }}
                          >
                            {article.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {article.content.replace(/<[^>]*>/g, "")}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span className="truncate max-w-[100px]">Rep: {article.author?.full_name.split(" ")[0]}</span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.published_at || article.created_at).toLocaleDateString("en-IN", {month: 'short', day: 'numeric'})}
                        </span>
                        <Link 
                          href={`/news/${article.slug}`} 
                          className="text-brand-blue hover:text-brand-red flex items-center gap-0.5 font-extrabold"
                        >
                          Read <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded shadow-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isFetching ? "Loading..." : "Load More Headlines"}
                  </button>
                </div>
              )}
            </>
          )}

        </div>

        {/* Sidebar Section (Col-span 4) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* WhatsApp Channel Sticky Badge */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 border border-emerald-200/80 p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute right-0 bottom-0 text-emerald-100 transform translate-x-3 translate-y-3 rotate-12 scale-150">
              <MessageCircle className="w-24 h-24 stroke-[1px]" />
            </div>
            <div className="relative space-y-3.5">
              <span className="px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-sm">
                JOIN LIVE CHANNEL
              </span>
              <h3 className="font-extrabold text-slate-800 text-sm leading-snug">
                Get Rapid News India updates directly on WhatsApp
              </h3>
              <p className="text-xs text-slate-500 leading-snug">
                Instant reports from Kolkata, Lucknow, Patna and Delhi. No spam, just core headlines.
              </p>
              <a 
                href="https://whatsapp.com/channel/placeholder" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wide rounded-md shadow transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" /> Join WhatsApp Channel
              </a>
            </div>
          </div>

          {/* Trending News widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 
              className="text-slate-900 font-extrabold text-base border-b border-slate-100 pb-3 flex items-center gap-2"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              <Flame className="w-5 h-5 text-brand-saffron fill-current" /> Trending Stories
            </h3>
            {trendingArticles.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">No trending articles</div>
            ) : (
              <div className="space-y-4">
                {trendingArticles.slice(0, 4).map((art, idx) => (
                  <div key={art.id} className="flex gap-3 group">
                    <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 font-black text-xs flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <Link href={`/news/${art.slug}`} className="text-xs font-bold text-slate-800 group-hover:text-brand-red transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </Link>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {art.category?.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Telegram Channel Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 
              className="text-slate-900 font-extrabold text-sm flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              <Send className="w-4 h-4 text-sky-500 fill-current" /> Join our Telegram Channel
            </h3>
            <p className="text-[11px] text-slate-500 leading-snug">
              Receive alert notifications and district reporting updates every 15 minutes.
            </p>
            <a 
              href="https://t.me/placeholder" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block w-full text-center py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs uppercase rounded transition-colors"
            >
              Subscribe on Telegram
            </a>
          </div>

          {/* Reporter Invitation box */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10">
              <Award className="w-24 h-24 scale-125" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-saffron" />
                <h3 className="font-extrabold text-sm" style={{ fontFamily: "var(--font-outfit)" }}>
                  Are you a Local Reporter?
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Join our decentralized network of regional correspondents across India. Tag your district, upload images, paste video leads, and publish stories.
              </p>
              <Link 
                href="/login?tab=signup-reporter" 
                className="block w-full text-center py-2 bg-brand-red hover:bg-red-700 text-white font-bold text-xs uppercase rounded transition-colors"
              >
                Apply as Reporter
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
