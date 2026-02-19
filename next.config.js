/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid SWC when binary is missing/corrupt; Babel is used via .babelrc
  swcMinify: false,
};

module.exports = nextConfig;
