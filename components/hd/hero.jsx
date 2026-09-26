'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,MessageCircle,ScrollText,GraduationCap,ChevronDown,Award,Laptop,BookOpen} from 'lucide-react';
import {Photo} from '@/components/ui/primitives.jsx';

/* HelloDoctor's HeroSection (src/components/HeroSection.tsx): a full-bleed
   photograph washed to white on the left, a handwritten aside tilted over the
   sky, a paper plane on a dotted trail, then badge · headline · line · three
   round-icon promises · two buttons. The words are this vertical's own, from
   HERO in site-app.jsx; the handwriting is its `script` line. */
export function HdHero({vertical,brand,h,image,setLead}){
  const words=h.script.replace(/\.$/,'').split(/\.\s*/);
  const pads=['','pl-2','pl-7','pl-14'];
  return <section className="hd relative lg:h-[clamp(480px,36vw,640px)] z-10" aria-label={`${brand.logoAlt} introduction`}>
    <div className="absolute inset-0 overflow-hidden">
    <Photo name={image} priority alt={h.alt}
      className="absolute inset-0 w-full h-full [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:object-[75%_center] lg:[&_img]:object-[70%_30%]"/>
    <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/55 via-45% to-transparent to-75% lg:from-brand-50/95 lg:via-brand-50/75 lg:via-45% lg:to-transparent lg:to-72%"/>

    <div aria-hidden="true" className="font-hand font-bold hidden lg:block absolute top-[8%] left-[63%] text-brand-700 text-4xl xl:text-5xl leading-[1.05] -rotate-12 select-none [text-shadow:0_1px_10px_rgba(255,255,255,0.9)]">
      {words.map((w,i)=><div key={w} className={pads[i]??'pl-14'}>{w}</div>)}
      <svg viewBox="0 0 200 30" className="ml-10 -mt-1 w-40 h-6" fill="none">
        <path d="M4 24 C 60 10, 120 6, 196 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    </div>

    <svg aria-hidden="true" viewBox="0 0 160 120" className="hidden lg:block absolute top-[6%] right-[10%] w-28 h-24 text-brand-500 overflow-visible" fill="none">
      <path d="M10 110 C 50 90, 70 60, 110 20" stroke="currentColor" strokeWidth="2" strokeDasharray="5 6" strokeLinecap="round"/>
      <g transform="translate(100,10) rotate(40)"><path d="M0 8 L18 0 L0 -8 L4 0 Z" fill="currentColor"/></g>
    </svg>
    </div>

    <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-0 flex flex-col justify-center">
      <div className="self-start inline-flex items-center bg-brand-100/80 text-brand-700 px-4 py-1.5 rounded-2xl sm:rounded-full text-xs font-bold tracking-wide uppercase mb-5 max-w-[16rem] sm:max-w-none">
        {brand.tagline}
      </div>

      <h1 className="text-[1.75rem] sm:text-5xl lg:text-[2rem] xl:text-[2.5rem] font-black leading-[1.15] text-gray-900 mb-4 max-w-[20rem] sm:max-w-none lg:whitespace-nowrap">
        {h.line1} <br className="lg:hidden"/>
        <span className="text-brand-600">{h.line2.replace(/\.$/,'')}</span>
      </h1>

      <p className="text-sm sm:text-lg text-gray-600 mb-7 lg:mb-8 max-w-[16rem] sm:max-w-xl">{h.body}</p>

      <div className="grid grid-cols-3 gap-3 max-w-sm sm:max-w-md lg:flex lg:max-w-none lg:gap-x-8 lg:gap-y-4 mb-7 lg:mb-9">
        {h.trust.slice(0,3).map(([label,icon])=><div key={label} className="flex flex-col items-start gap-2 lg:flex-row lg:items-center lg:gap-2.5">
          <div className="w-11 h-11 lg:w-10 lg:h-10 rounded-full bg-white shadow-md lg:shadow-sm border border-brand-100 flex items-center justify-center text-brand-600 shrink-0 [&_svg]:w-5 [&_svg]:h-5">{icon}</div>
          <span className="text-xs sm:text-sm font-medium text-gray-800 lg:text-gray-700 lg:max-w-[7rem] leading-snug [text-shadow:0_0_6px_rgba(255,255,255,1),0_0_2px_rgba(255,255,255,1)] lg:[text-shadow:none]">{label}</span>
        </div>)}
      </div>

      {vertical==='distance'?<DistancePicker/>:<div className="flex flex-wrap gap-3">
        <Link href={h.all} className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-brand-200 transition-colors">
          {h.cta.replace(/^./,c=>c.toUpperCase())}<ArrowRight className="w-5 h-5"/>
        </Link>
        <button type="button" onClick={()=>setLead({title:`Talk to a ${brand.logoAlt} counsellor`,interest:vertical})}
          className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-brand-600 font-bold px-6 py-3 rounded-xl shadow-md border border-gray-200 transition-colors">
          <MessageCircle className="w-5 h-5"/>Free Counselling
        </button>
      </div>}
    </div>
  </section>;
}

/* Distance Courses Wala's two doors, in the slot where HelloDoctor puts its
   NEET UG / NEET PG pair. Each opens a small panel of the actual choices:
   the three open-school boards, or the three kinds of degree. Every option
   is a route that already exists — a board card on /distance/boards, or the
   universities list filtered to that level. */
const PICKS={
  school:{label:'10th / 12th',icon:ScrollText,title:'Finish 10th or 12th through an open board',all:['Compare all three boards','/distance/boards'],items:[
    {name:'NIOS',full:'National Institute of Open Schooling',note:'Widest acceptance — college admission and government jobs',href:'/distance/boards#board-nios',icon:Award},
    {name:'BOSSE',full:'Board of Open Schooling & Skill Education, Sikkim',note:'Fastest legitimate route when a deadline is close',href:'/distance/boards#board-bosse',icon:ScrollText},
    {name:'BBOSE',full:'Bihar Board of Open Schooling & Examination',note:'Lowest fee for Bihar learners on a schedule',href:'/distance/boards#board-bbose',icon:BookOpen}]},
  degree:{label:'Degree',icon:GraduationCap,title:'Distance & online degrees from UGC-DEB universities',all:['See all universities','/distance/universities'],items:[
    {name:'UG Degree',full:'BA, B.Com, BSc, BBA, BCA',note:'Bachelor’s degrees you can study around a job',href:'/distance/universities?path=ug',icon:GraduationCap},
    {name:'PG Degree',full:'MA, M.Com, MBA, MCA',note:'Master’s programmes without leaving your work',href:'/distance/universities?path=pg',icon:Award},
    {name:'Online Degree',full:'100% online programmes',note:'Classes and exams from home',href:'/distance/universities?path=online',icon:Laptop}]}
};
function DistancePicker(){
  const [open,setOpen]=useState(null);
  const ref=useRef(null);
  useEffect(()=>{if(!open)return;
    const out=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(null)};
    const esc=e=>{if(e.key==='Escape')setOpen(null)};
    document.addEventListener('mousedown',out);document.addEventListener('keydown',esc);
    return()=>{document.removeEventListener('mousedown',out);document.removeEventListener('keydown',esc)}},[open]);
  const pick=open&&PICKS[open];
  return <div ref={ref} className="relative">
    <div className="flex flex-wrap gap-3">
      {Object.entries(PICKS).map(([k,p],i)=>{const Icon=p.icon;const on=open===k;
        return <button key={k} type="button" aria-expanded={on} aria-controls="dcw-picker" onClick={()=>setOpen(on?null:k)}
          className={i===0
            ?`inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl shadow-lg transition-colors ${on?'bg-brand-700 text-white shadow-brand-200':'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-200'}`
            :`inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl shadow-md border transition-colors ${on?'bg-brand-50 text-brand-700 border-brand-300':'bg-white hover:bg-gray-50 text-brand-600 border-gray-200'}`}>
          <Icon className="w-5 h-5"/>{p.label}<ChevronDown className={`w-4 h-4 transition-transform ${on?'rotate-180':''}`}/>
        </button>})}
    </div>
    {pick&&<div id="dcw-picker" className="absolute left-0 top-full mt-3 z-30 w-[min(40rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3 px-1">{pick.title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {pick.items.map(it=>{const Icon=it.icon;return <Link key={it.name} href={it.href} onClick={()=>setOpen(null)}
          className="group rounded-xl border border-gray-100 hover:border-brand-300 hover:bg-brand-50 p-4 transition-colors flex flex-col">
          <span className="w-10 h-10 rounded-xl bg-brand-50 group-hover:bg-white text-brand-600 flex items-center justify-center mb-3"><Icon className="w-5 h-5"/></span>
          <span className="font-bold text-gray-900 group-hover:text-brand-700">{it.name}</span>
          <span className="text-xs text-gray-500 mt-0.5">{it.full}</span>
          <span className="text-xs text-gray-600 mt-2 leading-snug flex-1">{it.note}</span>
          <span className="text-xs font-semibold text-brand-600 mt-3 inline-flex items-center gap-1">Explore <ArrowRight className="w-3 h-3"/></span>
        </Link>})}
      </div>
      <Link href={pick.all[1]} onClick={()=>setOpen(null)} className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">{pick.all[0]} <ArrowRight className="w-4 h-4"/></Link>
    </div>}
  </div>;
}
