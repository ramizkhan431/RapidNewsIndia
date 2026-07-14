"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { newsApi, getMediaUrl } from "../../../lib/api";
import { News } from "../../../types";
import Link from "next/link";
import { 
  Eye, Calendar, Share2, MessageCircle, Send, 
  Globe, Link2, ArrowLeft, Video, BookOpen 
} from "lucide-react";

export default function NewsDetailsPage() {
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);

  // Fetch article details (automatically increments views on backend)
  const { data: article, isLoading, error } = useQuery<News>({
    queryKey: ["news-article", slug],
    queryFn: () => newsApi.get(slug as string),
    enabled: !!slug,
  });

  // Fetch related news (from same category)
  const { data: relatedData } = useQuery({
    queryKey: ["news-related", article?.category_id],
    queryFn: () => newsApi.list({ 
      category_id: article?.category_id, 
      limit: 4,
      status_filter: "published"
    }),
    enabled: !!article?.category_id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded"></div>
        <div className="h-10 bg-slate-200 animate-pulse rounded w-3/4"></div>
        <div className="h-6 bg-slate-200 animate-pulse rounded w-1/3"></div>
        <div className="h-[400px] bg-slate-200 animate-pulse rounded-xl"></div>
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 animate-pulse rounded"></div>
          <div className="h-4 bg-slate-200 animate-pulse rounded"></div>
          <div className="h-4 bg-slate-200 animate-pulse rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Article not found</h2>
        <p className="text-xs text-slate-500">
          The news story you are looking for might have been archived, deleted, or has scheduled publication parameters.
        </p>
        <Link href="/" className="inline-block px-5 py-2 bg-brand-blue text-white text-xs font-bold uppercase rounded-full">
          Back to Home
        </Link>
      </div>
    );
  }

  // Extract media items
  const youtubeVideo = article.media_items?.find(m => m.media_type === "youtube");
  const images = article.media_items?.filter(m => m.media_type === "image") || [];
  const primaryImage = images[0]?.url ? getMediaUrl(images[0].url) : "/placeholder-news.jpg";

  // Share Handlers
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(`${article.title} - Read more on Rapid News India: `);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Schema.org Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [
      images.length > 0 ? getMediaUrl(images[0].url) : `${pageUrl}/placeholder-news.jpg`
    ],
    "datePublished": article.published_at || article.created_at,
    "dateModified": article.updated_at,
    "author": {
      "@type": "Person",
      "name": article.author?.full_name || "Staff Reporter"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Rapid News India",
      "logo": {
        "@type": "ImageObject",
        "url": "http://localhost:8000/static/logo.png"
      }
    },
    "description": article.content.replace(/<[^>]*>/g, "").slice(0, 150)
  };

  const relatedArticles = relatedData?.articles?.filter((art: News) => art.id !== article.id).slice(0, 3) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Inject Structured Data for SEO crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Article Content Column (Col-span 8) */}
        <article className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Breadcrumb & Return navigation */}
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-red transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home Feed
          </Link>

          {/* Tag Category */}
          <div>
            <span className="px-2.5 py-1 bg-brand-blue text-white text-[10px] font-black uppercase rounded shadow-sm">
              {article.category?.name}
            </span>
          </div>

          {/* Headline */}
          <h1 
            className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            {article.title}
          </h1>

          {/* Meta & Social Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-slate-100 py-3 text-slate-400">
            {/* Reporter details */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-brand-blue text-white font-bold flex items-center justify-center rounded-full shadow-sm text-sm">
                {article.author?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-slate-800">By {article.author?.full_name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  {article.author?.role?.name === "admin" ? "Staff Editor" : "Field Reporter"}
                </p>
              </div>
            </div>

            {/* Date and View Counter */}
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(article.published_at || article.created_at).toLocaleDateString("en-IN", {month: 'short', day: 'numeric', year: 'numeric'})}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {article.view_count} views
              </span>
            </div>
          </div>

          {/* Multimedia Embed Display */}
          <div className="relative rounded-2xl overflow-hidden shadow-md">
            {youtubeVideo ? (
              // YouTube iframe container
              <div className="aspect-video w-full bg-black relative">
                <iframe
                  src={youtubeVideo.url}
                  title={article.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-none"
                ></iframe>
              </div>
            ) : (
              // Featured image fallback
              <img
                src={primaryImage}
                alt={article.title}
                className="w-full h-auto object-cover max-h-[480px] w-full"
              />
            )}
          </div>

          {/* Social Share Buttons */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1 mr-2">
              <Share2 className="w-3.5 h-3.5" /> Share story:
            </span>
            <a 
              href={`https://api.whatsapp.com/send?text=${shareText}${pageUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 rounded-full transition-all cursor-pointer shadow-sm border border-emerald-100"
            >
              <MessageCircle className="w-4.5 h-4.5 fill-current" />
            </a>
            <a 
              href={`https://t.me/share/url?url=${pageUrl}&text=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-sky-50 hover:bg-sky-500 hover:text-white text-sky-500 rounded-full transition-all cursor-pointer shadow-sm border border-sky-100"
            >
              <Send className="w-4.5 h-4.5 fill-current" />
            </a>
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-full transition-all cursor-pointer shadow-sm border border-blue-100"
            >
              <Globe className="w-4.5 h-4.5" />
            </a>
            <button 
              onClick={handleCopyLink}
              className="p-2 bg-slate-50 hover:bg-slate-800 hover:text-white text-slate-600 rounded-full transition-all cursor-pointer shadow-sm border border-slate-200 flex items-center gap-1.5 relative"
            >
              <Link2 className="w-4.5 h-4.5" />
              {copied && (
                <span className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                  Copied!
                </span>
              )}
            </button>
          </div>

          {/* Article Text Content */}
          <div 
            className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Multi-image gallery (if they exist beyond featured index) */}
          {images.length > 1 && (
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Additional Media</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.slice(1).map((img, idx) => (
                  <a 
                    key={img.id} 
                    href={getMediaUrl(img.url)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group hover:ring-2 hover:ring-brand-blue transition-all"
                  >
                    <img
                      src={getMediaUrl(img.url)}
                      alt={`Gallery media ${idx + 2}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

        </article>

        {/* Sidebar Recommended Reading Column (Col-span 4) */}
        <aside className="lg:col-span-4 space-y-8">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 
              className="text-slate-900 font-extrabold text-base border-b border-slate-100 pb-3 flex items-center gap-2"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              <BookOpen className="w-5 h-5 text-brand-blue" /> Related Headlines
            </h3>

            {relatedArticles.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">No related news found</div>
            ) : (
              <div className="space-y-5">
                {relatedArticles.map((art: News) => (
                  <div key={art.id} className="group space-y-1.5">
                    {/* Tiny thumbnail */}
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-100 shadow-inner">
                      <img
                        src={getFeaturedImage(art)}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {/* Info */}
                    <div className="space-y-1">
                      <Link 
                        href={`/news/${art.slug}`} 
                        className="text-xs font-bold text-slate-800 group-hover:text-brand-red transition-colors line-clamp-2 leading-snug"
                      >
                        {art.title}
                      </Link>
                      <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>{new Date(art.published_at || art.created_at).toLocaleDateString("en-IN", {month: 'short', day: 'numeric'})}</span>
                        {art.media_items?.some(m => m.media_type === "youtube") && (
                          <span className="flex items-center gap-0.5 text-red-500 font-extrabold">
                            <Video className="w-3 h-3 fill-current" /> Video
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </aside>

      </div>
    </div>
  );
}

// Helper local featured image extractor
function getFeaturedImage(article: News) {
  const imgItem = article.media_items?.find(m => m.media_type === "image");
  return imgItem ? getMediaUrl(imgItem.url) : "/placeholder-news.jpg";
}
