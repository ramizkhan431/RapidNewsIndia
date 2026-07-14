"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { newsApi } from "../../lib/api";
import { News } from "../../types";
import { Video, Calendar, ArrowRight, Play, Eye } from "lucide-react";
import Link from "next/link";

export default function VideosPage() {
  const [page, setPage] = useState(1);
  const limit = 6;

  const { data, isLoading } = useQuery({
    queryKey: ["videos-list", page],
    queryFn: () => newsApi.listVideos({
      skip: (page - 1) * limit,
      limit: limit
    }),
  });

  const videoArticles: News[] = data?.articles || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Title Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 relative overflow-hidden shadow-lg border-b-4 border-brand-red">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 scale-150">
          <Video className="w-32 h-32" />
        </div>
        <div className="relative space-y-2">
          <span className="px-2.5 py-0.5 bg-brand-red text-white text-[9px] font-black uppercase tracking-wider rounded-sm flex items-center gap-1 w-fit">
            <Play className="w-3 h-3 fill-current animate-ping" /> Live Video Broadcasts
          </span>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-outfit)" }}>
            Rapid News India Video Broadcasts
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Watch ground reporting videos, editorial reviews, and local district coverage streams directly from our correspondents across India.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 animate-pulse rounded-xl"></div>
          <div className="h-64 bg-slate-200 animate-pulse rounded-xl"></div>
          <div className="h-64 bg-slate-200 animate-pulse rounded-xl"></div>
        </div>
      ) : videoArticles.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-700">No broadcasts available</h3>
          <p className="text-xs text-slate-400 mt-1">There are no YouTube video streams published at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoArticles.map((article) => {
            const ytMedia = article.media_items?.find(m => m.media_type === "youtube");
            return (
              <div key={article.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover-card flex flex-col justify-between">
                
                {/* Embed video container */}
                <div className="aspect-video w-full bg-black relative">
                  {ytMedia ? (
                    <iframe
                      src={ytMedia.url}
                      title={article.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-none"
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      Video stream load failed
                    </div>
                  )}
                </div>

                {/* Content info */}
                <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase text-brand-red tracking-wider bg-red-50 border border-red-100 px-2 py-0.5 rounded-sm">
                      {article.category?.name}
                    </span>
                    <Link href={`/news/${article.slug}`}>
                      <h3 
                        className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-brand-red transition-colors"
                        style={{ fontFamily: "var(--font-outfit)" }}
                      >
                        {article.title}
                      </h3>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase border-t border-slate-50 pt-2.5">
                    <span className="flex items-center gap-0.5"><Calendar className="w-3.5 h-3.5" /> {new Date(article.published_at || article.created_at).toLocaleDateString("en-IN", {month: 'short', day: 'numeric'})}</span>
                    <span className="flex items-center gap-0.5"><Eye className="w-3.5 h-3.5" /> {article.view_count} views</span>
                    <Link href={`/news/${article.slug}`} className="text-brand-blue hover:text-brand-red flex items-center gap-0.5">
                      Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
