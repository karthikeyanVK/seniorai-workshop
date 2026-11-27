/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native/Node-only packages must not be bundled into route handlers.
  serverExternalPackages: ["mssql", "node-sql-parser", "@azure/cosmos", "@azure/identity"],
};
export default nextConfig;
