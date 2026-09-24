import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "数学题目生成器",
    short_name: "MathGen",
    description: "为学生和老师生成课打印数学练习题.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/colorfulFoxLogo-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/colorfulFoxLogo-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/MathGen-1920x1080.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "Desktop Application",
      },
      {
        src: "/MathGen-648x1152.png",
        sizes: "648x1152",
        type: "image/png",
        label: "Mobile Application",
      },
    ],
  };
}
