import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LiaGo",
    short_name: "LiaGo",
    description: "LiaGo — Tu negocio en movimiento",
    start_url: "/app",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
  };
}
