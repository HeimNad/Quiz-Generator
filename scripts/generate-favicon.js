const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function generateFavicon() {
  const inputPath = path.join(__dirname, "..", "public", "colorfulFoxLogo.png");
  const outputPath = path.join(__dirname, "..", "app", "favicon.ico");

  try {
    // Generate a 32x32 PNG buffer first (common size for favicon)
    // ICO format can contain multiple sizes, but for web, a simple resize often works
    // if we output as png and rename, browsers handle it, but true .ico is better.
    // Sharp doesn't directly output .ico.
    // Strategy: Resize to 32x32 PNG, then just save as favicon.ico (modern browsers support PNG favicons)
    // OR: Use a library for .ico if strict.
    // Let's try resizing to 32x32 and saving.

    await sharp(inputPath).resize(32, 32).toFormat("png").toFile(outputPath);

    console.log("Favicon generated successfully at app/favicon.ico");
  } catch (error) {
    console.error("Error generating favicon:", error);
  }
}

generateFavicon();
