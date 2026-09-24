import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Con GITHUB_PAGES=true el sitio se exporta como HTML estático (vista previa).
// En producción (VPS con Node) no se activa nada de esto.
const isGitHubPages = process.env.GITHUB_PAGES === "true";

// Host del bucket S3, para que next/image pueda optimizar las fotos de speakers.
let s3Hostname: string | undefined;
try {
  s3Hostname = process.env.AWS_S3_PUBLIC_URL ? new URL(process.env.AWS_S3_PUBLIC_URL).hostname : undefined;
} catch {
  s3Hostname = undefined;
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: s3Hostname ? [{ protocol: "https", hostname: s3Hostname }] : [],
  },
  ...(isGitHubPages && {
    output: "export",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
    images: { unoptimized: true },
  }),
};

export default withNextIntl(nextConfig);
