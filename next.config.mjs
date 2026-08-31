import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig={images:{unoptimized:true},turbopack:{root:dirname(fileURLToPath(import.meta.url))}};
export default nextConfig;
