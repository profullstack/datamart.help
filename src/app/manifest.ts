import type { MetadataRoute } from "next";

// 16/32/48 stay out of icons: a launcher walking the list can pick a favicon size.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Datamart: public services near you",
    short_name: "Datamart",
    description: "Libraries, schools, colleges and government services near you, with the source of every fact.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbfbfa",
    theme_color: "#0f6b5c",
    categories: ["education", "government", "utilities"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Libraries near me", url: "/lib" },
      { name: "Schools near me", url: "/edu" },
      { name: "Government services", url: "/gov" },
    ],
  };
}
