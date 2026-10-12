import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const routes = ["", "/tjanster", "/boka", "/galleri", "/om-oss", "/vanliga-fragor", "/kontakt", "/integritet"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: path === "/galleri" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/boka" || path === "/tjanster" ? 0.9 : 0.6,
  }));
}
