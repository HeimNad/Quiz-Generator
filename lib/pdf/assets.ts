export interface PdfAssets {
  /** NotoSansSC (for Chinese titles), base64; null → fall back to Helvetica */
  font: string | null;
  logo: string | null;
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 0x8000; // stay under the argument limit of fromCharCode
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function fetchBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    return res.ok ? toBase64(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

let cached: Promise<PdfAssets> | null = null;

/** Loaded once per page load; the font is ~10 MB so re-fetching on every preview is slow */
export function loadPdfAssets(): Promise<PdfAssets> {
  cached ??= Promise.all([
    fetchBase64("/fonts/NotoSansSC-Regular.ttf"),
    fetchBase64("/colorfulFoxLogo.jpg"),
  ]).then(([font, logo]) => {
    if (!font) console.warn("Could not load Chinese font. Using Helvetica fallback.");
    return { font, logo };
  });
  return cached;
}
