import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RigLog",
    short_name: "RigLog",
    description:
      "Compliance checklists, equipment inventory, and service logs for mobile trailer fleets.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#17324a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
