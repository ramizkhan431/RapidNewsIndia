import { MetadataRoute } from "next";
import { newsApi } from "../lib/api";
import { News } from "../types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const frontendUrl = "http://localhost:3000";

  let articles: News[] = [];
  try {
    const res = await newsApi.list({ limit: 100, status_filter: "published" });
    articles = res.articles || [];
  } catch (error) {
    // Fallback if backend is not running during static generation build
    console.warn("Sitemap: Failed to retrieve dynamic news. Building fallback structure.");
  }

  const articleUrls = articles.map((art: News) => ({
    url: `${frontendUrl}/news/${art.slug}`,
    lastModified: new Date(art.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    {
      url: frontendUrl,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1.0,
    },
    {
      url: `${frontendUrl}/videos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${frontendUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...articleUrls,
  ];
}
