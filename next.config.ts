import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ['three'],
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'plus.unsplash.com' },
            { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
        ]
    }
};

export default nextConfig;
