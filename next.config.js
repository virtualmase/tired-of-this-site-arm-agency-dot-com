/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  turbopack: {
    root: __dirname,
  },

  // Images optimization
  images: {
    unoptimized: true,
  },

  // The compatibility bridge reads the canonical HTML sources at build/runtime.
  // Include them in traced server artifacts (for example, Vercel functions).
  outputFileTracingIncludes: {
    '/': ['./index.html'],
    '/[...path]': [
      './about/index.html',
      './audit/index.html',
      './brief/index.html',
      './glossary/index.html',
      './privacy/index.html',
      './resources/index.html',
      './resources/accountable-agentic-commerce-glossary/index.html',
      './resources/agentic-commerce-x402-aifi/index.html',
      './resources/buyer-intent-vs-buyer-intelligence/index.html',
      './resources/category-narrative-intelligence/index.html',
      './resources/enterprise-buying-committee-intelligence/index.html',
      './resources/enterprise-proof-readiness/index.html',
      './resources/signal-orchestration-guide/index.html',
      './sprint/index.html',
      './terms/index.html',
    ],
  },

  // Headers for security (Vercel also applies vercel.json)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      ['/resources/generative-engine-optimization-guide', '/resources/signal-orchestration-guide/'],
      ['/resources/geo-vs-seo', '/resources/buyer-intent-vs-buyer-intelligence/'],
      ['/resources/enterprise-ai-visibility-audit', '/resources/enterprise-buying-committee-intelligence/'],
      ['/resources/reputation-due-diligence-ai-search', '/resources/enterprise-proof-readiness/'],
      ['/resources/ai-reputation-management-guide', '/resources/category-narrative-intelligence/'],
      ['/resources/agentic-reputation-infrastructure', '/resources/agentic-commerce-x402-aifi/'],
    ].map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

module.exports = nextConfig;
