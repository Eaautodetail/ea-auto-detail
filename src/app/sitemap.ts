import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const routes = [
  "",
  "/tjanster",
  "/boka",
  "/galleri",
  "/recensioner",
  "/om-oss",
  "/vanliga-fragor",
  "/kontakt",
  "/integritet",
  ...site.towns.map((t) => `/bilvard/${t.slug}`),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: path === "/galleri" || path === "/recensioner" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/boka" || path === "/tjanster" ? 0.9 : 0.6,
  }));
}
