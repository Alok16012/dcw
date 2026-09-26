import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

/* The CRM (github.com/Alok16012/dcwcrm) is its own Next app, built with
   basePath '/crm'. This site proxies /crm/* to it, so staff, associates,
   students and Berojgar Bharat all sign in on distancecourseswala.com/crm.
   beforeFiles, because the public catch-all route would otherwise claim /crm. */
const CRM_ORIGIN=(process.env.CRM_ORIGIN||'https://dcwcrm.vercel.app').replace(/\/$/,'');

/** @type {import('next').NextConfig} */
const nextConfig={
  images:{unoptimized:true},
  turbopack:{root:dirname(fileURLToPath(import.meta.url))},
  async rewrites(){
    return {beforeFiles:[
      {source:'/crm',destination:`${CRM_ORIGIN}/crm`},
      {source:'/crm/:path*',destination:`${CRM_ORIGIN}/crm/:path*`}
    ]};
  }
};
export default nextConfig;
