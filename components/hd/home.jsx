'use client';
import {useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,MapPin,Star,Heart,Award,BookOpen,Clock,ChevronDown,Headset,IndianRupee,Users} from 'lucide-react';
import {Photo} from '@/components/ui/primitives.jsx';
import {OFFERS,STEPS,CLOSE,FAQS} from '@/components/home/home-sections.jsx';
import {POSTS} from '@/components/editorial/blog.jsx';
import {coursesOf,matchesPath} from '@/lib/content/courses.js';
import {fmt} from '@/lib/format.js';

/* The HelloDoctor home page, section for section (src/app/(site)/page.tsx):
   StreamSection · FeaturedColleges · ScholarshipPreview · BlogPreview ·
   CTASection, plus its blue StatsSection band. Markup and classes are copied
   from those files; the words, links and rows are this site's. */

const detailHref=(vertical,id)=>vertical==='distance'?`/distance/university/${id}`:vertical==='colleges'?`/colleges/college/${id}`:`/jobs/${id}`;

/* ── StreamSection ─────────────────────────────────────────────────────── */
const VISIBLE_ON_MOBILE=3;
export function HdStreams({vertical,items,photos,title,sub,listAll}){
  const trackRef=useRef(null);
  const [active,setActive]=useState(0);
  const positions=Math.max(1,items.length-VISIBLE_ON_MOBILE+1);
  const cardStep=()=>{const t=trackRef.current;const f=t?.firstElementChild;if(!t||!f)return 0;return f.offsetWidth+parseFloat(getComputedStyle(t).columnGap||'0')};
  const onScroll=()=>{const s=cardStep();if(s)setActive(Math.min(positions-1,Math.round((trackRef.current?.scrollLeft??0)/s)))};
  const goTo=i=>trackRef.current?.scrollTo({left:i*cardStep(),behavior:'smooth'});
  const cols=items.length===4?'lg:grid-cols-4':'lg:grid-cols-6';
  return <section className="hd py-14 lg:py-16 bg-white lg:bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex items-end justify-between mb-8 lg:mb-10">
        <div>
          <p className="text-brand-600 text-sm font-semibold uppercase tracking-wider mb-2">Where do you want to start?</p>
          <h2 className="text-3xl font-black lg:font-bold text-gray-900 leading-tight">{title[0]} <span className="lg:text-brand-600">{title[1]}</span></h2>
          <p className="text-gray-500 mt-2">{sub}</p>
        </div>
        <Link href={listAll} className="hidden sm:flex items-center gap-1.5 bg-white border border-gray-200 text-brand-600 text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand-50 transition-all shrink-0">
          View Everything <ArrowRight className="w-4 h-4"/>
        </Link>
      </div>
      <div ref={trackRef} onScroll={onScroll}
        className={`flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-1 px-1 pb-2 lg:grid ${cols} lg:gap-5 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0`}>
        {items.map((s,i)=><Link key={s.name} href={s.href}
          className="group snap-start shrink-0 w-[calc((100%-1rem)/3)] lg:w-auto bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
          <div className="relative aspect-[5/4] overflow-hidden m-1.5 mb-0 rounded-xl">
            <Photo name={photos[i%photos.length]} className="absolute inset-0 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:group-hover:scale-105 [&_img]:transition-transform [&_img]:duration-300"/>
            <span className="absolute left-2 bottom-2 w-8 h-8 rounded-lg bg-white/95 text-brand-600 flex items-center justify-center shadow-sm [&_svg]:w-4 [&_svg]:h-4" aria-hidden="true">{s.icon}</span>
          </div>
          <div className="p-2.5 lg:p-4 flex flex-col flex-1">
            <h3 className="font-semibold text-gray-900 text-[13px] lg:text-sm mb-0.5 leading-snug group-hover:text-brand-600 transition-colors">{s.name}</h3>
            <p className="text-xs text-gray-400 mb-3">{s.tag??s.kicker}</p>
            <div className="mt-auto self-start text-xs font-semibold px-3 lg:px-4 py-1.5 rounded-full inline-flex items-center gap-1 bg-brand-50 text-brand-600 lg:bg-brand-600 lg:text-white group-hover:gap-1.5 transition-all">
              Explore <ArrowRight className="w-3 h-3"/>
            </div>
          </div>
        </Link>)}
      </div>
      <div className="flex justify-center gap-2 mt-5 lg:hidden">
        {Array.from({length:positions}).map((_,i)=><button key={i} type="button" aria-label={`Go to slide ${i+1}`} onClick={()=>goTo(i)}
          className={`w-2 h-2 rounded-full transition-colors ${i===active?'bg-brand-600':'bg-gray-300'}`}/>)}
      </div>
    </div>
  </section>;
}

/* ── CollegeCard ───────────────────────────────────────────────────────── */
const typeColors=t=>/gov|state|central/i.test(t)?'bg-green-100 text-green-700':/deemed/i.test(t)?'bg-blue-100 text-blue-700':'bg-orange-100 text-orange-700';
const JOB_PHOTOS=['office-front','workplace-team','career-editorial','counsellor-desk','classroom-session'];
export function HdCard({item,vertical,i=0,ctx=null,coursePath=null}){
  const isJob=vertical==='jobs';
  const all=isJob?[]:coursesOf(item);
  const matched=coursePath?all.filter(c=>matchesPath(c,coursePath)):all;
  const courses=matched.length?matched:all;
  const href=detailHref(vertical,item.id);
  const isSaved=ctx?.saved?.includes(item.id);
  const apply=()=>ctx.setLead({mode:'apply',title:isJob?`Apply for ${item.name}`:`Apply to ${item.name}`,
    interest:item.id,interestType:isJob?'job':'course',course:isJob?item.name:courses[0]?.name,
    courses:isJob?null:all.map(c=>c.name),where:item.place});
  return <div className="bg-white rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-300 overflow-hidden group h-full flex flex-col">
    <div className="relative h-44 overflow-hidden shrink-0 bg-gray-100">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
        {item.image
          ?<img src={item.image} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          :<Photo name={JOB_PHOTOS[i%JOB_PHOTOS.length]} alt="" className="absolute inset-0 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:group-hover:scale-105 [&_img]:transition-transform [&_img]:duration-500"/>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
      </Link>
      {item.approval?.[0]&&<div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-full text-xs font-bold text-brand-600 pointer-events-none">{item.approval[0]}</div>}
      {ctx
        ?<button type="button" aria-label={isSaved?`Remove ${item.name} from saved`:`Save ${item.name}`} aria-pressed={!!isSaved} onClick={()=>ctx.toggleSave(item.id)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${isSaved?'bg-brand-600 text-white':'bg-white/95 text-gray-500 hover:text-brand-600'}`}><Heart className={`w-4 h-4 ${isSaved?'fill-white':''}`}/></button>
        :<div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold pointer-events-none ${isJob?'bg-green-100 text-green-700':typeColors(item.type||'')}`}>{isJob?item.type:(item.type||'').replace(/ university$/i,'')}</div>}
      {item.rating!=null&&<div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 px-2.5 py-1 rounded-full pointer-events-none">
        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500"/><span className="text-xs font-bold text-gray-800">{item.rating}</span>
      </div>}
      {item.imageIllustrative&&<div className="absolute bottom-3 left-3 text-[10px] text-white/90 font-medium pointer-events-none">Illustrative image</div>}
    </div>
    <div className="p-4 flex flex-col flex-1">
      <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 group-hover:text-brand-600 transition-colors line-clamp-2"><Link href={href}>{item.name}</Link></h3>
      <span className="inline-block text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium mb-2 self-start">{isJob?item.company:(ctx?item.type:item.course)}</span>
      <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
        <MapPin className="w-3 h-3 shrink-0"/><span className="truncate">{isJob?(item.wfh?'Work from home':`${item.area?item.area+', ':''}${item.city}`):item.place}</span>
      </div>
      {isJob&&ctx&&(item.km!=null||(item.postedDays??99)<=3)&&<div className="flex flex-wrap gap-1 mb-2">
        {item.km!=null&&<span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">{item.km<1?'<1':Math.round(item.km)} km away</span>}
        {(item.postedDays??99)<=3&&<span className="text-xs bg-cta-50 text-cta-700 px-2 py-0.5 rounded-full font-medium">Posted {item.postedDays===0?'today':item.postedDays===1?'yesterday':`${item.postedDays} days ago`}</span>}
      </div>}
      <div className="flex flex-wrap gap-1 mb-3">
        {(isJob?[item.sector,item.mode].filter(Boolean):courses.slice(0,3).map(c=>c.name)).map(s=><span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>)}
        {!isJob&&courses.length>3&&<span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{courses.length-3}</span>}
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {(item.approval??[]).slice(1,3).map(e=><span key={e} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full font-medium">{e}</span>)}
        {!isJob&&item.mode&&<span className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full font-medium">{item.mode}</span>}
      </div>
      <div className="mt-auto border-t border-gray-100 pt-3 grid grid-cols-3 gap-1">
        <div><p className="text-xs text-gray-400">{isJob?'Salary':'Total fee'}</p><p className="text-xs font-bold text-brand-600">{isJob?item.duration.replace('/mo',''):fmt(item.fee)}</p></div>
        <div className="text-center"><p className="text-xs text-gray-400">{isJob?'Openings':'Duration'}</p><p className="text-xs font-bold text-green-600">{isJob?item.openings:item.duration}</p></div>
        <div className="text-right"><p className="text-xs text-gray-400">Reviews</p><p className="text-xs font-semibold text-gray-700">{item.reviews>=1000?`${(item.reviews/1000).toFixed(1)}K`:item.reviews??'—'}</p></div>
      </div>
      {ctx&&<div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        {!isJob&&<label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer mr-auto"><input type="checkbox" className="accent-brand-600" aria-label={`Compare ${item.name}`}
          checked={ctx.compare[vertical].includes(item.id)} onChange={()=>ctx.toggleCompare(item.id)}/>Compare</label>}
        <Link href={href} className={`text-xs font-semibold text-brand-600 border border-brand-200 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors ${isJob?'mr-auto':''}`}>{isJob?'View job':'Details'}</Link>
        <button type="button" onClick={apply} className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1">Apply <ArrowRight className="w-3 h-3"/></button>
      </div>}
    </div>
  </div>;
}

/* ── FeaturedColleges ──────────────────────────────────────────────────── */
export function HdFeatured({vertical,catalog,copy,listAll,noun}){
  const rows=catalog.rows;
  const key=vertical==='jobs'?(r=>[r.sector]):(r=>r.streams??[]);
  const counts={};rows.forEach(r=>key(r).filter(Boolean).forEach(k=>{counts[k]=(counts[k]??0)+1}));
  const tabs=['All',...Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0])];
  const [activeTab,setActiveTab]=useState('All');
  const filtered=(activeTab==='All'?rows:rows.filter(r=>key(r).includes(activeTab))).slice(0,8);
  return <section className="hd py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-brand-600 text-sm font-semibold uppercase tracking-wider mb-2">{copy.kicker}</p>
          <h2 className="text-3xl font-bold text-gray-900">{copy.title}</h2>
          <p className="text-gray-500 mt-2">{copy.sub}</p>
        </div>
        <Link href={listAll} className="hidden sm:flex items-center gap-1 text-brand-600 text-sm font-medium hover:gap-2 transition-all">View All <ArrowRight className="w-4 h-4"/></Link>
      </div>
      {tabs.length>2&&<div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        {tabs.map(tab=><button key={tab} type="button" onClick={()=>setActiveTab(tab)} aria-pressed={activeTab===tab}
          className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab===tab?'bg-brand-600 text-white shadow-md shadow-brand-200':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab}</button>)}
      </div>}
      {catalog.state==='ready'
        ?<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{filtered.map((r,i)=><HdCard key={r.id} item={r} vertical={vertical} i={i}/>)}</div>
        :<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{catalog.state==='error'
          ?<p className="text-gray-500 text-sm col-span-full">The catalogue could not be loaded just now. <Link href={listAll} className="text-brand-600 font-semibold">Try the full listing →</Link></p>
          :Array.from({length:4}).map((_,i)=><div key={i} className="h-80 rounded-2xl bg-gray-100 animate-pulse"/>)}</div>}
      <div className="text-center mt-10">
        <Link href={listAll} className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors">
          View All {noun.replace(/^./,c=>c.toUpperCase())} <ArrowRight className="w-5 h-5"/>
        </Link>
      </div>
    </div>
  </section>;
}

/* ── ScholarshipPreview → the three offers ─────────────────────────────── */
const GRADS=['from-brand-600 to-brand-700','from-cta-600 to-cta-700','from-purple-600 to-purple-700'];
const BADGES=['bg-brand-50 text-brand-700 border-brand-100','bg-cta-50 text-cta-700 border-cta-100','bg-purple-50 text-purple-700 border-purple-100'];
const OFFER_TAG={distance:['Open School','Graduation','Post Graduation'],colleges:['Shortlist','NEET','Abroad'],jobs:['Near You','Resume','Skills']};
export function HdOffers({vertical,proof,brand}){
  const offers=OFFERS[vertical]??OFFERS.distance;
  return <section className="hd py-16 px-4 bg-gray-50">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3 border border-yellow-100">
            <Award className="w-3.5 h-3.5"/>What we help with
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{vertical==='jobs'?'Start Where You Are':vertical==='colleges'?'Decide With Every Number':'Pick Up Where You Stopped'}</h2>
          <p className="text-gray-500 mt-1 text-sm">Three front doors — each opens the part of {brand.logoAlt} built for it.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offers.map((o,i)=><Link key={o.need} href={o.href} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all flex flex-col">
          <div className={`bg-gradient-to-r ${GRADS[i%3]} px-5 pt-5 pb-8 relative`}>
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${BADGES[i%3]} bg-white/90 mb-3`}>{OFFER_TAG[vertical]?.[i]??''}</span>
            <h3 className="font-bold text-white text-base leading-snug line-clamp-2">{o.need}</h3>
            <span className="absolute right-5 top-5 w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5" aria-hidden="true">{o.icon}</span>
          </div>
          <div className="px-5 pt-4 pb-5 flex flex-col flex-1 -mt-3">
            <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">{o.line}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Free guidance included</span>
              <span className="text-xs text-brand-600 font-semibold group-hover:underline">{o.cta} →</span>
            </div>
          </div>
        </Link>)}
      </div>
      <div className="mt-10 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-white text-center">
        {proof.map(s=><div key={s.label}><div className="text-xl font-black">{s.value}</div><div className="text-white/75 text-xs mt-0.5">{s.label}</div></div>)}
      </div>
    </div>
  </section>;
}

/* ── StatsSection → how it works ───────────────────────────────────────── */
export function HdSteps({vertical}){
  const steps=STEPS[vertical]??STEPS.distance;
  return <section className="hd py-14 bg-brand-600">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">{steps.length} Steps, and You Can See All of Them</h2>
        <p className="text-white/75">No hidden stage, no surprise fee. You are told what happens next before it happens.</p>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${steps.length===4?'lg:grid-cols-4':'lg:grid-cols-3'} gap-6`}>
        {steps.map((s,i)=><div key={s.t} className="text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/15 text-white flex items-center justify-center [&_svg]:w-7 [&_svg]:h-7">{s.icon}</div>
          <div className="text-xs font-bold text-white/60 mb-1">STEP {String(i+1).padStart(2,'0')}</div>
          <div className="text-lg font-bold text-white mb-1">{s.t}</div>
          <div className="text-white/75 text-sm max-w-xs mx-auto">{s.d}</div>
        </div>)}
      </div>
    </div>
  </section>;
}

/* ── BlogPreview ───────────────────────────────────────────────────────── */
const BLOG_PHOTOS=['classroom-session','university-campus','career-editorial','home-study','counsellor-desk'];
const BLOG_FIRST={distance:['Boards','Distance'],colleges:['Money','How we work'],jobs:['Jobs','Money']};
export function HdBlog({vertical}){
  const first=BLOG_FIRST[vertical]??[];
  const featured=[...POSTS].sort((a,b)=>(first.includes(b.cat)?1:0)-(first.includes(a.cat)?1:0)).slice(0,3);
  return <section className="hd py-16 px-4 bg-white">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-3"><BookOpen className="w-3.5 h-3.5"/>Latest Articles</div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Tips, Guides &amp; Plain Answers</h2>
          <p className="text-gray-500 mt-1 text-sm">Written by the people who check the listings — before you pay anyone anything</p>
        </div>
        <Link href="/blog" className="hidden sm:flex items-center gap-1.5 text-brand-600 font-semibold text-sm hover:gap-2.5 transition-all">View All Articles <ArrowRight className="w-4 h-4"/></Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featured.map(post=><Link key={post.slug} href={`/blog/${post.slug}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
          <div className="relative h-48 overflow-hidden bg-gray-100">
            <Photo name={BLOG_PHOTOS[POSTS.indexOf(post)%BLOG_PHOTOS.length]} className="absolute inset-0 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:group-hover:scale-105 [&_img]:transition-transform [&_img]:duration-300"/>
            <div className="absolute top-3 left-3"><span className="bg-white/90 backdrop-blur-sm text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full">{post.cat}</span></div>
          </div>
          <div className="p-5">
            <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">{post.title}</h3>
            <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">{post.dek}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{post.author.charAt(0)}</div>
                <span className="text-xs text-gray-500">{post.author}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3"/>{post.mins} min read</div>
            </div>
          </div>
        </Link>)}
      </div>
      <div className="mt-8 text-center sm:hidden">
        <Link href="/blog" className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl text-sm">View All Articles <ArrowRight className="w-4 h-4"/></Link>
      </div>
    </div>
  </section>;
}

/* ── FAQ, in the same card language ────────────────────────────────────── */
export function HdFaq({vertical,brand,setLead}){
  const rows=FAQS[vertical]??FAQS.distance;
  return <section className="hd py-16 px-4 bg-gray-50" aria-labelledby="faq-h">
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 lg:gap-12">
      <div>
        <p className="text-brand-600 text-sm font-semibold uppercase tracking-wider mb-2">Common Questions</p>
        <h2 id="faq-h" className="text-3xl font-bold text-gray-900 mb-3">Before You Decide</h2>
        <p className="text-gray-500 mb-6">The things people ask us most often, answered plainly. If yours is not here, ask a counsellor — it costs nothing.</p>
        <button type="button" onClick={()=>setLead({title:`Ask a ${brand.logoAlt} counsellor`,interest:vertical})}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
          <Headset className="w-5 h-5"/>Ask Your Question
        </button>
      </div>
      <div className="space-y-3">
        {rows.map(([q,a])=><details key={q} className="group bg-white rounded-2xl border border-gray-100 shadow-sm open:border-brand-200 open:shadow-md transition-all">
          <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
            {q}<ChevronDown className="w-5 h-5 text-brand-600 transition-transform group-open:rotate-180"/>
          </summary>
          <p className="px-5 pb-5 -mt-1 text-sm text-gray-600 leading-relaxed">{a}</p>
        </details>)}
      </div>
    </div>
  </section>;
}

/* ── CTASection ────────────────────────────────────────────────────────── */
const PATHS={
  distance:[{icon:<Award className="w-8 h-8"/>,title:'10th / 12th',subtitle:'NIOS, BOSSE & BBOSE open schooling — compare recognition, exam speed and fees',href:'/distance/boards',label:'Compare Open Boards'},
    {icon:<BookOpen className="w-8 h-8"/>,title:'UG / PG',subtitle:'BA, B.Com, MBA, MCA & more from UGC-DEB approved universities',href:'/distance/universities',label:'Explore Universities'}],
  colleges:[{icon:<Star className="w-8 h-8"/>,title:'NEET Predictor',subtitle:'Turn one rank into strong, possible and backup choices',href:'/colleges/neet-predictor',label:'Predict My Colleges'},
    {icon:<BookOpen className="w-8 h-8"/>,title:'All Colleges',subtitle:'Medical, Engineering, Management, Law & study abroad — cutoffs and total cost',href:'/colleges/search',label:'Compare Colleges'}],
  jobs:[{icon:<Users className="w-8 h-8"/>,title:'Find Jobs',subtitle:'Verified openings with the employer and salary shown upfront',href:'/jobs/search',label:'See Openings'},
    {icon:<IndianRupee className="w-8 h-8"/>,title:'Resume Builder',subtitle:'A clean, recruiter-ready resume in three guided steps — free',href:'/jobs/resume-builder',label:'Build My Resume'}]
};
export function HdCta({vertical}){
  const c=CLOSE[vertical]??CLOSE.distance;
  const programs=PATHS[vertical]??PATHS.distance;
  return <section className="hd py-16 md:py-24 bg-gradient-to-b from-brand-50/60 to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-12 md:mb-16">
        <p className="text-brand-600 text-sm font-semibold uppercase tracking-wider mb-2">{c.k}</p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{c.h}</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">{c.p}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
        {programs.map((p,i)=>{const a=i===0;return <Link key={p.title} href={p.href}
          className="group relative bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className={`absolute -top-24 -right-24 w-56 h-56 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-500 ${a?'bg-brand-100':'bg-cta-100'}`}/>
          <div className="relative z-10 flex flex-col h-full">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${a?'bg-brand-50 text-brand-600':'bg-cta-50 text-cta-600'}`}>{p.icon}</div>
            <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">{p.title}</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">{p.subtitle}</p>
            <span className={`mt-auto inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${a?'text-brand-600':'text-cta-600'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform group-hover:translate-x-1 ${a?'bg-brand-600':'bg-cta-600'}`}>→</span>{p.label}
            </span>
          </div>
        </Link>})}
      </div>
    </div>
  </section>;
}
