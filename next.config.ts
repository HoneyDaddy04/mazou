import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      // Dashboard API → FastAPI backend
      {
        source: "/api/dashboard/:path*",
        destination: "http://localhost:8000/api/dashboard/:path*",
      },
      // Auth API → FastAPI backend
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:8000/api/auth/:path*",
      },
      // Routing API → FastAPI backend
      {
        source: "/api/routing/:path*",
        destination: "http://localhost:8000/api/routing/:path*",
      },
      // Admin API → FastAPI backend
      {
        source: "/api/admin/:path*",
        destination: "http://localhost:8000/api/admin/:path*",
      },
      // Public API (gateway, models, keys, usage, wallet) → FastAPI backend
      {
        source: "/v1/:path*",
        destination: "http://localhost:8000/v1/:path*",
      },
      // Webhooks → FastAPI backend
      {
        source: "/webhooks/:path*",
        destination: "http://localhost:8000/webhooks/:path*",
      },
    ];
  },
};

export default nextConfig;
