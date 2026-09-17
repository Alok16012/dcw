import localFont from 'next/font/local';
import './globals.css';
import './design-system.css';

/* Local variable files keep the public site and account screens consistent in
   offline builds. Manrope is only used in the admin/login surfaces. */
const mulish=localFont({src:'../public/fonts/mulish-latin.woff2',weight:'200 1000',display:'swap',variable:'--f-display'});
const manrope=localFont({src:'../public/fonts/manrope-latin.woff2',weight:'200 800',display:'swap',preload:false,variable:'--f-manrope'});
const fontVars=[mulish.variable,manrope.variable].join(' ');

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

export const viewport={themeColor:'#1263E0',width:'device-width',initialScale:1};

export default function Layout({children}){return <html lang="en" className={fontVars}><body>{children}</body></html>}
