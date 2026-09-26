'use client';
import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {MapPin,Phone,Mail,Clock,MessageCircle} from 'lucide-react';
import {CONTACT,officePlaceUrl} from '@/lib/contact.js';

/* HelloDoctor's Footer (src/components/Footer.tsx): a brand-colour updates
   band, then gray-900 with the brand and contact block over two columns and
   three link columns, then the bottom bar. The round icons are the channels
   this company actually answers on — a social circle that links to "#" is a
   broken button with a nice shape. */
const COLUMNS=[
  ['Distance',[['Universities','/distance/universities'],['UG courses','/distance/universities?path=ug'],['PG courses','/distance/universities?path=pg'],['Board comparison','/distance/boards']]],
  ['Colleges & Jobs',[['Find colleges','/colleges/search'],['NEET predictor','/colleges/neet-predictor'],['Study abroad','/colleges/search?abroad=1'],['Find jobs','/jobs/search'],['Resume builder','/jobs/resume-builder']]],
  ['Quick Links',[['About us','/about'],['Blog','/blog'],['Reviews','/reviews'],['Saved','/saved'],['My applications','/applications'],['Automation centre','/automations']]]
];

export function HdFooter({vertical,brand,setLead}){
  const [phone,setPhone]=useState('');
  const wa=`https://wa.me/${CONTACT.phone.href.replace(/\D/g,'')}`;
  const social=[
    {label:`Call ${brand.logoAlt}`,href:CONTACT.phone.href,icon:<Phone className="w-4 h-4"/>},
    {label:`WhatsApp ${brand.logoAlt}`,href:wa,icon:<MessageCircle className="w-4 h-4"/>,ext:true},
    {label:`Email ${brand.logoAlt}`,href:CONTACT.email.href,icon:<Mail className="w-4 h-4"/>},
    {label:'Open the office in Maps',href:officePlaceUrl(),icon:<MapPin className="w-4 h-4"/>,ext:true}
  ];
  return <footer className="hd bg-gray-900 text-gray-300">
    <div className="bg-brand-600 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-white text-xl font-bold mb-1">{vertical==='jobs'?'Get New Job Openings First':vertical==='colleges'?'Get Admission & Cutoff Updates':'Get Admission & Exam Updates'}</h3>
          <p className="text-white/75 text-sm">Never miss a deadline. Leave your number and a counsellor will call you back — free.</p>
        </div>
        <form className="flex w-full sm:w-auto gap-2" onSubmit={e=>{e.preventDefault();setLead({title:`Register with ${brand.logoAlt}`,interest:vertical})}}>
          <input type="tel" inputMode="numeric" value={phone} onChange={e=>setPhone(e.target.value)} aria-label="Your mobile number"
            placeholder="Enter your mobile number" className="flex-1 sm:w-72 px-4 py-2.5 rounded-xl text-gray-800 text-sm outline-none bg-white border-0"/>
          <button type="submit" className="bg-white text-brand-600 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-50 transition-colors whitespace-nowrap">Call Me Back</button>
        </form>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <Link href={`/${vertical}`} className="flex items-center gap-2.5 mb-4">
            <Image src={brand.lockup} alt={`${brand.logoAlt} logo`} width={44} height={44} className="object-contain rounded-lg bg-white w-11 h-11"/>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black text-white tracking-wide">{brand.logoAlt}</span>
              <span className="text-[10px] font-semibold text-brand-400 tracking-tight mt-0.5">{brand.navSub}</span>
            </div>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed mb-5">Patna-based education and career guidance for students across India — distance courses, colleges and jobs, with honest, end-to-end help. <span className="text-gray-300 font-medium">{brand.tagline}</span></p>
          <div className="flex gap-2.5 mb-6">
            {social.map(s=><a key={s.label} href={s.href} aria-label={s.label} {...(s.ext?{target:'_blank',rel:'noopener noreferrer'}:{})}
              className="w-8 h-8 bg-gray-800 hover:bg-brand-600 rounded-lg flex items-center justify-center transition-colors text-gray-300 hover:text-white">{s.icon}</a>)}
          </div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5"><MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5"/>
              <a href={officePlaceUrl()} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-xs leading-relaxed hover:text-white transition-colors">{CONTACT.address.full}</a></div>
            <div className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-brand-400 shrink-0"/>
              <div className="text-xs text-gray-400">
                <a href={CONTACT.phone.href} className="hover:text-white transition-colors block">{CONTACT.phone.display} (Call)</a>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors block">{CONTACT.phone.display} (WhatsApp)</a>
              </div></div>
            <div className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-brand-400 shrink-0"/>
              <a href={CONTACT.email.href} className="text-xs text-gray-400 hover:text-white transition-colors">{CONTACT.email.display}</a></div>
            <div className="flex items-center gap-2.5"><Clock className="w-4 h-4 text-brand-400 shrink-0"/>
              <span className="text-xs text-gray-400">{CONTACT.hours}</span></div>
          </div>
        </div>
        {COLUMNS.map(([title,links])=><div key={title}>
          <h4 className="text-white font-semibold text-sm mb-4">{title}</h4>
          <ul className="space-y-2.5">{links.map(([label,href])=><li key={label}><Link href={href} className="text-gray-400 hover:text-white text-sm transition-colors">{label}</Link></li>)}</ul>
        </div>)}
      </div>
    </div>

    <div className="border-t border-gray-800 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <p>© 2026 {brand.legal}. All rights reserved. <span className="text-gray-600">· Prototype with indicative dummy data</span></p>
        <div className="flex gap-4">
          <Link href="/distance" className="hover:text-white transition-colors">Distance Courses Wala</Link>
          <Link href="/colleges" className="hover:text-white transition-colors">Colleges Wala</Link>
          <Link href="/jobs" className="hover:text-white transition-colors">Berojgar Bharat</Link>
        </div>
      </div>
    </div>
  </footer>;
}
