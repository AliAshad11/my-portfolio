/** @type {import('next').NextConfig} */

// Where the LIVE site lives on your domain:
//   "/ali-ashad"  -> yourdomain.com/ali-ashad/   (upload into public_html/ali-ashad)
//   ""            -> yourdomain.com/             (upload straight into public_html)
const LIVE_FOLDER = "";

// `npm run dev` always runs at http://localhost:3000/ (no 404),
// `npm run build` adds the folder for cPanel.
const isBuild = process.env.NODE_ENV === "production";
const basePath = isBuild ? LIVE_FOLDER : "";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
