const CDN_BASE = import.meta.env.VITE_CDN_BASE_URL || "";

export const getImageUrl = (raw, fallback = "/assets/eventbg.jpg") => {
  if (!raw || raw === "null") return fallback;
  
  let url = raw;
  
  // If the stored URL is using the old blocked r2.dev domain, redirect it to our custom domain
  if (url.includes(".r2.dev") && CDN_BASE) {
    url = url.replace(/^https?:\/\/[^/]+\.r2\.dev/, CDN_BASE);
  }
  
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  // If the URL in the database is missing https:// (like pub-xxx.r2.dev)
  if (url.startsWith("pub-")) return `https://${url}`;
  // Legacy: local /uploads/ path stored before R2 migration
  const clean = url.replace(/^(\/)?uploads\//, "");
  
  if (CDN_BASE) {
      return `${CDN_BASE}/${clean}`;
  }
  return `/uploads/${clean}`;
};
