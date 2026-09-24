// Regenerates app/favicon.ico (a 32x32 PNG; modern browsers accept PNG favicons)
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.join(root, "public", "colorfulFoxLogo.png");
const outputPath = path.join(root, "app", "favicon.ico");

try {
  await sharp(inputPath).resize(32, 32).toFormat("png").toFile(outputPath);
  console.log("Favicon generated successfully at app/favicon.ico");
} catch (error) {
  console.error("Error generating favicon:", error);
}
