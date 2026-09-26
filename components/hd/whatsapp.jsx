'use client';
import {CONTACT} from '@/lib/contact.js';

/* WhatsApp's own glyph (the phone in a speech bubble), drawn in the brand's
   #25D366. Used for the floating chat button and the footer's WhatsApp link,
   so both read as WhatsApp at a glance rather than as a generic chat icon. */
export function WhatsAppGlyph({className='w-6 h-6'}){
  return <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="currentColor">
    <path d="M16.003 3C8.83 3 3.004 8.82 3.004 15.99c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75a12.96 12.96 0 0 0 6.32 1.62h.01c7.17 0 12.99-5.83 12.99-13S23.17 3 16.003 3Zm0 23.68h-.01a10.8 10.8 0 0 1-5.5-1.5l-.4-.24-3.96 1.04 1.06-3.86-.26-.4a10.77 10.77 0 0 1-1.65-5.73c0-5.95 4.84-10.8 10.8-10.8 2.88 0 5.6 1.13 7.63 3.17a10.72 10.72 0 0 1 3.16 7.64c0 5.96-4.85 10.8-10.8 10.8Zm5.92-8.09c-.32-.16-1.92-.95-2.22-1.06-.3-.11-.52-.16-.73.16-.22.32-.84 1.06-1.03 1.28-.19.22-.38.24-.7.08-.32-.16-1.37-.5-2.6-1.6-.96-.86-1.61-1.92-1.8-2.24-.19-.32-.02-.5.14-.66.15-.14.32-.38.49-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.56-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.69 0 1.58 1.16 3.11 1.32 3.33.16.21 2.28 3.48 5.52 4.88.77.33 1.37.53 1.84.68.77.25 1.48.21 2.03.13.62-.09 1.92-.78 2.19-1.54.27-.76.27-1.41.19-1.54-.08-.14-.3-.22-.62-.38Z"/>
  </svg>;
}

export const whatsappHref=(text='Hi, I would like some guidance.')=>
  `https://wa.me/${CONTACT.phone.href.replace(/\D/g,'')}?text=${encodeURIComponent(text)}`;

export function WhatsAppButton({brand}){
  return <div className="hd">
    <a href={whatsappHref(`Hi ${brand.logoAlt}, I would like some guidance.`)} target="_blank" rel="noopener noreferrer"
      aria-label={`Chat with ${brand.logoAlt} on WhatsApp`}
      className="fixed right-4 bottom-5 sm:right-6 sm:bottom-6 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5a] text-white flex items-center justify-center shadow-lg shadow-black/20 transition-colors">
      <WhatsAppGlyph className="w-8 h-8"/>
    </a>
  </div>;
}
