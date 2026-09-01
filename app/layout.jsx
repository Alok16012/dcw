import './globals.css';
import './design-system.css';

const site=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
const title='DCW — Your next move, made visible';
const description='Compare verified courses, colleges and jobs with clear guidance from DCW.';

export const metadata={
  metadataBase:new URL(site),
  title:{default:title,template:'%s — DCW'},
  description,
  applicationName:'DCW',
  openGraph:{title,description,url:site,siteName:'DCW',locale:'en_IN',type:'website'},
  twitter:{card:'summary_large_image',title,description},
  robots:{index:true,follow:true}
};

export const viewport={themeColor:'#0B4DA8',width:'device-width',initialScale:1};

export default function Layout({children}){return <html lang="en"><body>{children}</body></html>}
