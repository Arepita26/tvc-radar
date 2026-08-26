import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://tvc-radar.vercel.app",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1.0,
    },
  ];
}
