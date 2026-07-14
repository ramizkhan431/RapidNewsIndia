"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { newsApi } from "../lib/api";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { News } from "../types";

export default function BreakingNews() {
  const { data, isLoading } = useQuery({
    queryKey: ["breaking-news"],
    queryFn: () => newsApi.list({ limit: 5, status_filter: "published" }),
    refetchInterval: 60000, // Refetch every minute
  });

  const articles: News[] = data?.articles || [];

  if (isLoading || articles.length === 0) {
    return (
      <div className="bg-brand-red text-white py-2 px-4 flex items-center justify-center font-semibold text-sm">
        <span className="animate-pulse flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> LOADING LATEST NEWS TICKER...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-brand-red text-white py-2 flex items-center border-b border-red-700 shadow-sm relative overflow-hidden z-20">
      <div className="bg-slate-900 text-white text-xs uppercase font-extrabold px-4 py-1.5 flex items-center gap-1.5 ml-4 rounded-sm shadow-md select-none shrink-0 z-30">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block"></span>
        Breaking News
      </div>
      <div className="ticker-wrap w-full">
        <div className="ticker-content">
          {articles.concat(articles).map((article, idx) => (
            <Link
              key={`${article.id}-${idx}`}
              href={`/news/${article.slug}`}
              className="ticker-item hover:text-orange-300 transition-colors font-medium text-sm inline-flex items-center gap-2"
            >
              • {article.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
