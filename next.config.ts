import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ['three'],
    images: {
        domains: ['images.unsplash.com']
    }
};

export default nextConfig;
