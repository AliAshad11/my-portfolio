/* Adds the site's sub-folder (basePath) to files in /public.
   asset("/images/ali.png") -> "/ali-ashad/images/ali.png" when the site lives at /ali-ashad */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const asset = (p) => {
  if (!p || typeof p !== "string" || !p.startsWith("/") || p.startsWith("//")) return p;
  if (BASE && p.startsWith(BASE + "/")) return p;
  return BASE + p;
};
