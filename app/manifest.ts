import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARC",
    short_name: "ARC",
    description: "ABLE RUNNING CHALLENGE 운영용 MVP",
    start_url: "/",
    display: "standalone",
    background_color: "#eef4f7",
    theme_color: "#eef4f7",
    icons: [
      {
        src: "/able-logo.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/able-logo.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
