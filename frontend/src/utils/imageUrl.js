const CDN_BASE = import.meta.env.VITE_CDN_BASE_URL || "";

export const getImageUrl = (raw, fallback = "/assets/eventbg.jpg") => {
  if (!raw || raw === "null") return fallback;
  if (raw.startsWith("http") || raw.startsWith("blob:") || raw.startsWith("data:")) return raw;
  // If the URL in the database is missing https:// (like pub-xxx.r2.dev)
  if (raw.startsWith("pub-")) return `https://${raw}`;
  // Legacy: local /uploads/ path stored before R2 migration
  const clean = raw.replace(/^(\/)?uploads\//, "");
  
  if (CDN_BASE) {
      return `${CDN_BASE}/${clean}`;
  }
  return `/uploads/${clean}`;
};
