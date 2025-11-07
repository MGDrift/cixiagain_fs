import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Hint Turbopack to use this folder as the workspace root to avoid parent lockfile confusion on Windows
	turbopack: {
		root: __dirname,
	},
};

export default nextConfig;
