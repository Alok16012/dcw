'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {Search,SlidersHorizontal,X,ChevronDown,ChevronUp,LayoutGrid,List,ArrowUpDown,MapPin,Star,LocateFixed,Wifi,Navigation,ArrowRight,ShieldCheck,Flame} from 'lucide-react';
import {HdCard} from '@/components/hd/home.jsx';
import {coursesOf,matchesPath,PATHS} from '@/lib/content/courses.js';
import {readStream,matchesStream,isAbroad,ABROAD_LABEL} from '@/lib/content/streams.js';
import {jobKm,nearestCity,jobCities,topJobCities,jobSectors,jobTypes} from '@/lib/content/jobs.js';
import {useDialogA11y} from '@/lib/client/dialog.js';
import {fmt} from '@/lib/format.js';

/* HelloDoctor's colleges listing (src/app/(site)/colleges/CollegesClient.tsx):
   white page header with the live count, a 64-wide sidebar of collapsible
   filter sections, a search · sort · grid/list bar, active chips, a quick
   filter row, then the cards. The filtering itself is this site's — URL-borne
   path/stream/abroad/approval/city filters, the "must have" checks, and on the
   jobs side the city strip and "jobs near me" ranking by real distance. */

const TITLES={
  distance:{h:'Distance & Online Universities — UGC-DEB Approved',noun:'universities'},
  colleges:{h:'Colleges & Universities — India & Abroad',noun:'colleges'},
  jobs:{h:'Verified Jobs — Salary Shown Upfront',noun:'openings'}
};

function FilterSection({title,children}){
  const [open,setOpen]=useState(true);
  return <div className="border-b border-gray-100 last:border-0">
    <button type="button" onClick={()=>setOpen(!open)} aria-expanded={open}
      className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
      {title}{open?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}
    </button>
    {open&&<div className="px-5 pb-4">{children}</div>}
  </div>;
}
function Radio({name,checked,onChange,label,count}){
  return <label className="flex items-center gap-2.5 py-1 cursor-pointer group">
    <input type="radio" name={name} checked={checked} onChange={onChange} className="accent-brand-600"/>
    <span className="text-sm text-gray-700 group-hover:text-brand-600 flex-1">{label}</span>
    {count!=null&&<span className="text-xs text-gray-400">{count}</span>}
  </label>;
}

const detailHref=(vertical,id)=>vertical==='distance'?`/distance/university/${id}`:vertical==='colleges'?`/colleges/college/${id}`:`/jobs/${id}`;
function ListCard({item,vertical,ctx}){
  const isJob=vertical==='jobs';
  const href=detailHref(vertical,item.id);
  const apply=()=>ctx.setLead({mode:'apply',title:isJob?`Apply for ${item.name}`:`Apply to ${item.name}`,interest:item.id,interestType:isJob?'job':'course',
    course:isJob?item.name:coursesOf(item)[0]?.name,courses:isJob?null:coursesOf(item).map(c=>c.name),where:item.place});
  return <div className="bg-white rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all p-4 flex gap-4 group">
    <Link href={href} className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-brand-50 flex items-center justify-center text-brand-600 font-black text-xl" tabIndex={-1} aria-hidden="true">
      {item.image?<img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy"/>:item.mark}
    </Link>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors"><Link href={href}>{item.name}</Link></h3>
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-0.5"><MapPin className="w-3 h-3"/>{isJob?`${item.company} · ${item.wfh?'Work from home':item.city}`:item.place}{item.km!=null&&` · ${item.km<1?'<1':Math.round(item.km)} km`}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/><span className="text-sm font-bold text-gray-800">{item.rating}</span></div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {(isJob?[item.sector,item.mode,item.type]:[...item.approval.slice(0,2),item.mode]).filter(Boolean).map(s=><span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>)}
      </div>
      <div className="flex flex-wrap items-end gap-6 mt-2">
        <div><p className="text-xs text-gray-400">{isJob?'Salary':'Total fee'}</p><p className="text-sm font-bold text-brand-600">{isJob?item.duration:fmt(item.fee)}</p></div>
        <div><p className="text-xs text-gray-400">{isJob?'Openings':'Duration'}</p><p className="text-sm font-bold text-green-600">{isJob?item.openings:item.duration}</p></div>
        <div><p className="text-xs text-gray-400">{isJob?'Eligibility':'Deadline'}</p><p className="text-sm font-semibold text-gray-700">{isJob?item.course:item.deadline}</p></div>
        <div className="ml-auto flex items-center gap-2">
          {!isJob&&<label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer"><input type="checkbox" className="accent-brand-600" aria-label={`Compare ${item.name}`}
            checked={ctx.compare[vertical].includes(item.id)} onChange={()=>ctx.toggleCompare(item.id)}/>Compare</label>}
          <button type="button" onClick={apply} className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors">Apply now</button>
        </div>
      </div>
    </div>
  </div>;
}

export default function HdListing(ctx){
  const {vertical,setLead,catalog,go,cfg}=ctx;
  const isJobs=vertical==='jobs';
  const initial=catalog.rows;
  const ready=catalog.state==='ready';
  const count=n=>ready?n:'—';
  const limit=isJobs?600000:15000000;
  const MUSTS=isJobs?['Verified salary','Freshers welcome','Work from home','Posted this week']
                    :['Verified data','Clear fees / salary','Student support','Latest intake'];
  const [type,setType]=useState('All'),[sort,setSort]=useState('Recommended'),[max,setMax]=useState(limit);
  const [showFilters,setShowFilters]=useState(false);
  const [viewMode,setViewMode]=useState('grid');
  const [q,setQ]=useState('');
  const [must,setMust]=useState(isJobs?[]:['Verified data']);
  const params=useSearchParams();
  const coursePath=vertical==='distance'&&PATHS[params.get('path')]?params.get('path'):null;
  const isColleges=vertical==='colleges';
  const stream=isColleges?readStream(params.get('stream')):null;
  const abroad=isColleges&&params.get('abroad')==='1';
  const cityParam=isJobs?params.get('city'):null;
  const approvalParam=params.get('approval');
  const [city,setCity]=useState(cityParam||'All'),[sector,setSector]=useState('All');
  const [geo,setGeo]=useState({state:'idle'});
  const [nearbyOpen,setNearbyOpen]=useState(false);
  const listPath=`/${vertical}/${vertical==='distance'?'universities':'search'}`;
  const reset=()=>{setType('All');setSort('Recommended');setMax(limit);setMust(isJobs?[]:['Verified data']);setCity('All');setSector('All');setQ('');
    if(coursePath||stream||abroad||cityParam||approvalParam)go(listPath);};

  function askLocation(){
    if(typeof navigator==='undefined'||!navigator.geolocation){setGeo({state:'unsupported'});return}
    setGeo({state:'asking'});
    navigator.geolocation.getCurrentPosition(
      pos=>{const here=[pos.coords.latitude,pos.coords.longitude];const [near,away]=nearestCity(here);
        setGeo({state:'ok',here,label:near,away:Math.round(away)});setSort('Nearest first');setCity('All');setNearbyOpen(true)},
      err=>setGeo({state:err.code===1?'denied':'error'}),
      {enableHighAccuracy:false,timeout:10000,maximumAge:300000});
  }
  function clearLocation(){setGeo({state:'idle'});setNearbyOpen(false);setSort('Recommended')}
  const here=geo.state==='ok'?geo.here:null;

  const data=useMemo(()=>{const qq=q.trim().toLowerCase();return initial
    .filter(x=>(type==='All'||x.type.includes(type))
      &&x.fee<=max
      &&(!qq||`${x.name} ${x.course} ${x.place} ${x.company??''} ${x.sector??''}`.toLowerCase().includes(qq))
      &&(!coursePath||coursesOf(x).some(c=>matchesPath(c,coursePath)))
      &&matchesStream(x,stream)
      &&(!approvalParam||(x.approval??[]).some(a=>a.toLowerCase().includes(approvalParam.toLowerCase())))
      &&(!abroad||isAbroad(x))
      &&(!isJobs||city==='All'||x.city===city)
      &&(!isJobs||sector==='All'||x.sector===sector)
      &&must.every(m=>
        m==='Verified data'?x.approval.length>0:
        m==='Clear fees / salary'?x.fee>0:
        m==='Student support'?true:
        m==='Latest intake'?!x.deadline.includes('Sep'):
        m==='Verified salary'?x.approval.some(a=>/salary/i.test(a)):
        m==='Freshers welcome'?/fresher/i.test(x.approval.join(' ')+' '+x.course):
        m==='Work from home'?!!x.wfh:
        m==='Posted this week'?(x.postedDays??99)<=7:true))
    .map(x=>isJobs?{...x,km:jobKm(x,here)}:x)
    .sort((a,b)=>
      sort==='Nearest first'?(a.km==null?1e9:a.km)-(b.km==null?1e9:b.km):
      sort==='Newest first'?(a.postedDays??99)-(b.postedDays??99):
      sort==='Price: low to high'||sort==='Salary: low to high'?a.fee-b.fee:
      sort==='Price: high to low'||sort==='Salary: high to low'?b.fee-a.fee:
      sort==='Rating'?b.rating-a.rating:
      (b.featured?1:0)-(a.featured?1:0))},
  [type,sort,max,must,initial,isJobs,city,sector,here,coursePath,stream,abroad,approvalParam,q]);

  const unpublished=data.length===0&&stream&&!initial.some(x=>matchesStream(x,stream))?`${stream.toLowerCase()} colleges`
    :data.length===0&&abroad&&!initial.some(isAbroad)?'colleges outside India':null;

  const nearby=useMemo(()=>{
    if(!here)return null;
    const withKm=initial.map(j=>({...j,km:jobKm(j,here)}));
    return {top:withKm.filter(j=>j.km!=null).sort((a,b)=>a.km-b.km).slice(0,3),
      commutable:withKm.filter(j=>j.km!=null&&j.km<=60).length,remote:withKm.filter(j=>j.wfh).length};
  },[here,initial]);
  const nearbyRef=useDialogA11y(isJobs&&nearbyOpen&&!!nearby,()=>setNearbyOpen(false),{trap:false});

  const sortOptions=isJobs
    ?[...(here?['Nearest first']:[]),'Recommended','Newest first','Salary: high to low','Salary: low to high','Rating']
    :['Recommended','Price: low to high','Price: high to low','Rating'];
  const allCities=useMemo(()=>isJobs?jobCities(initial):[],[isJobs,initial]);
  const allSectors=useMemo(()=>isJobs?jobSectors(initial):[],[isJobs,initial]);
  const allTypes=useMemo(()=>isJobs?jobTypes(initial):['Private','Government','Deemed'],[isJobs,initial]);
  const cityChips=useMemo(()=>['All',...(isJobs?topJobCities(initial).slice(0,6):[])],[isJobs,initial]);

  const chips=[
    type!=='All'&&{key:'type',label:type,clear:()=>setType('All')},
    isJobs&&city!=='All'&&{key:'city',label:city,clear:()=>setCity('All')},
    isJobs&&sector!=='All'&&{key:'sector',label:sector,clear:()=>setSector('All')},
    max<limit&&{key:'max',label:`Up to ${fmt(max)}`,clear:()=>setMax(limit)},
    ...must.map(m=>({key:m,label:m,clear:()=>setMust(s=>s.filter(x=>x!==m))})),
    coursePath&&{key:'path',label:PATHS[coursePath],clear:()=>go(listPath)},
    stream&&{key:'stream',label:stream,clear:()=>go(listPath)},
    abroad&&{key:'abroad',label:ABROAD_LABEL,clear:()=>go(listPath)},
    approvalParam&&{key:'approval',label:approvalParam,clear:()=>go(listPath)}
  ].filter(Boolean);

  const quick=isJobs?cityChips:['All','Medical','Engineering','Management','Law','Commerce'];
  const quickOn=c=>isJobs?city===c:(c==='All'?!stream:stream===c);
  const quickPick=c=>isJobs?setCity(c):go(c==='All'?'/colleges/search':`/colleges/search?stream=${c}`);
  const distanceQuick=[['All',null],...Object.entries(PATHS).map(([k,v])=>[v,k])];
  const t=TITLES[vertical];

  return <main id="main" tabIndex={-1} className="hd bg-gray-50 min-h-screen">
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.h}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Showing <span className="font-semibold text-brand-600">{count(data.length)}</span> of {count(initial.length)} {t.noun} &bull; Fees and figures are indicative — talk to our counsellors for the latest details
          </p>
        </div>
        {isJobs
          ?<button type="button" onClick={askLocation} disabled={geo.state==='asking'}
            className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0 ${geo.state==='ok'?'bg-brand-50 text-brand-700 border border-brand-200':'bg-brand-600 hover:bg-brand-700 text-white'}`}>
            <LocateFixed className="w-4 h-4"/>{geo.state==='asking'?'Finding you…':geo.state==='ok'?'Update my location':'Jobs near me'}</button>
          :<button type="button" onClick={()=>setLead({title:`Talk to a ${cfg.logoAlt} counsellor`,interest:vertical})}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors shrink-0">Free counselling <ArrowRight className="w-4 h-4"/></button>}
      </div>
      {isJobs&&<div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 -mt-2" role="status">
        {geo.state==='ok'
          ?<p className="text-sm text-gray-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true"/>Closest to <b>{geo.label}</b> · {nearby?.commutable??0} within a 60&nbsp;km commute <button type="button" className="text-brand-600 font-semibold hover:underline" onClick={clearLocation}>Clear</button></p>
          :<p className="text-sm text-gray-500">{geo.state==='denied'?'Location is off, so pick your city below — nothing else changes.':geo.state==='error'?'We could not read your location. Pick your city below instead.':geo.state==='unsupported'?'This browser cannot share a location. Pick your city below.':'Pick a city, or share your location once and we will rank every opening by how far it actually is.'}</p>}
      </div>}
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" id="results">
      <div className="flex gap-6">
        <aside className={`shrink-0 w-full lg:w-64 space-y-4 ${showFilters?'block':'hidden lg:block'} max-lg:fixed max-lg:inset-0 max-lg:z-[70] max-lg:bg-black/40 max-lg:p-4 max-lg:overflow-y-auto`}
          onClick={e=>{if(e.target===e.currentTarget)setShowFilters(false)}}>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden max-lg:max-w-sm max-lg:ml-auto">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Filters</h2>
              <div className="flex items-center gap-3">
                {chips.length>0&&<button type="button" onClick={reset} className="text-xs text-red-500 hover:text-red-600 font-medium">Clear All</button>}
                <button type="button" onClick={()=>setShowFilters(false)} className="lg:hidden p-1 text-gray-400" aria-label="Close filters"><X className="w-4 h-4"/></button>
              </div>
            </div>
            {isJobs&&<FilterSection title="City">
              <select value={city} onChange={e=>setCity(e.target.value)} className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer">
                <option value="All">All Cities</option>{allCities.map(c=><option key={c}>{c}</option>)}
              </select>
            </FilterSection>}
            {isJobs&&<FilterSection title="Industry">
              <select value={sector} onChange={e=>setSector(e.target.value)} className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer">
                <option value="All">All Industries</option>{allSectors.map(c=><option key={c}>{c}</option>)}
              </select>
            </FilterSection>}
            <FilterSection title={isJobs?'Job Type':'Institution Type'}>
              <div className="space-y-1">
                <Radio name="type" checked={type==='All'} onChange={()=>setType('All')} label="All"/>
                {allTypes.map(tp=><Radio key={tp} name="type" checked={type===tp} onChange={()=>setType(tp)} label={tp}
                  count={ready?initial.filter(x=>x.type.includes(tp)).length:null}/>)}
              </div>
            </FilterSection>
            <FilterSection title={isJobs?'Maximum Annual Salary':'Maximum Total Cost'}>
              <input type="range" min="0" max={limit} step={isJobs?10000:100000} value={max} onChange={e=>setMax(+e.target.value)} className="w-full accent-brand-600" aria-label={isJobs?'Maximum annual salary':'Maximum total cost'}/>
              <p className="text-xs text-gray-500 mt-1">Up to <b className="text-brand-600">{fmt(max)}</b></p>
            </FilterSection>
            <FilterSection title="Must Have">
              <div className="space-y-1">
                {MUSTS.map(x=><label key={x} className="flex items-center gap-2.5 py-1 cursor-pointer group">
                  <input type="checkbox" className="accent-brand-600" checked={must.includes(x)} onChange={()=>setMust(s=>s.includes(x)?s.filter(y=>y!==x):[...s,x])}/>
                  <span className="text-sm text-gray-700 group-hover:text-brand-600">{x}</span>
                </label>)}
              </div>
            </FilterSection>
            {!isJobs&&<FilterSection title="Sort By">
              <div className="space-y-1">{sortOptions.map(o=><Radio key={o} name="sort-side" checked={sort===o} onChange={()=>setSort(o)} label={o}/>)}</div>
            </FilterSection>}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input type="text" value={q} onChange={e=>setQ(e.target.value)} aria-label="Search this list"
                placeholder={isJobs?'Search role, company, city...':'Search university, course, city...'}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-50"/>
              {q&&<button type="button" onClick={()=>setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Clear search"><X className="w-4 h-4 text-gray-400"/></button>}
            </div>
            <button type="button" onClick={()=>setShowFilters(!showFilters)}
              className={`lg:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters?'bg-brand-600 text-white border-brand-600':'bg-white text-gray-700 border-gray-200'}`}>
              <SlidersHorizontal className="w-4 h-4"/>Filters
              {chips.length>0&&<span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{chips.length}</span>}
            </button>
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <ArrowUpDown className="w-4 h-4 text-gray-400"/>
              <select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort by" className="text-sm text-gray-700 outline-none bg-transparent cursor-pointer max-w-[9rem] border-0 p-0">
                {sortOptions.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="hidden sm:flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
              <button type="button" aria-label="Grid view" aria-pressed={viewMode==='grid'} onClick={()=>setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode==='grid'?'bg-brand-600 text-white':'text-gray-500 hover:bg-gray-100'}`}><LayoutGrid className="w-4 h-4"/></button>
              <button type="button" aria-label="List view" aria-pressed={viewMode==='list'} onClick={()=>setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode==='list'?'bg-brand-600 text-white':'text-gray-500 hover:bg-gray-100'}`}><List className="w-4 h-4"/></button>
            </div>
          </div>

          {chips.length>0&&<div className="flex flex-wrap gap-2 mb-4">
            {chips.map(f=><span key={f.key} className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              {f.label}<button type="button" onClick={f.clear} className="hover:text-brand-700" aria-label={`Remove ${f.label}`}><X className="w-3 h-3"/></button>
            </span>)}
            <button type="button" onClick={reset} className="text-xs text-red-500 font-medium px-2 hover:text-red-600">Clear All ×</button>
          </div>}

          {vertical!=='distance'
            ?<div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide" role="group" aria-label={isJobs?'Filter by city':'Filter by stream'}>
              {quick.map(c=><button key={c} type="button" aria-pressed={quickOn(c)} onClick={()=>quickPick(c)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all shrink-0 inline-flex items-center gap-1.5 ${quickOn(c)?'bg-brand-600 text-white':'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                {c==='Remote'&&<Wifi className="w-3.5 h-3.5"/>}{c==='All'?(isJobs?'All cities':'All'):c}
                {isJobs&&<span className={`text-xs ${quickOn(c)?'text-white/75':'text-gray-400'}`}>{c==='All'?initial.length:initial.filter(j=>j.city===c).length}</span>}
              </button>)}
            </div>
            :<div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide" role="group" aria-label="Filter by programme level">
              {distanceQuick.map(([label,key])=><button key={label} type="button" aria-pressed={coursePath===key} onClick={()=>go(key?`/distance/universities?path=${key}`:'/distance/universities')}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all shrink-0 ${coursePath===key?'bg-brand-600 text-white':'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{label}</button>)}
            </div>}

          {catalog.state==='error'
            ?<div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-2">The catalogue could not be loaded</h3>
              <p className="text-gray-500 mb-4">{catalog.error||'Please check your connection and try again.'}</p>
              {catalog.reload&&<button type="button" onClick={catalog.reload} className="text-brand-600 font-semibold underline">Try again</button>}
            </div>
          :!ready
            ?<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-96 rounded-2xl bg-white border border-gray-100 animate-pulse"/>)}</div>
          :data.length===0
            ?<div className="text-center py-20 bg-white rounded-2xl border border-gray-100 px-6">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300"/>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{initial.length===0?'Nothing listed here yet':unpublished?`No ${unpublished} listed yet`:`No ${t.noun} found`}</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">{initial.length===0?'Nothing is published for this vertical right now.':unpublished?`We publish every college we have checked, and none of them is ${unpublished==='colleges outside India'?'outside India':`a ${stream.toLowerCase()} college`} yet. A counsellor can tell you what is opening for the next intake.`:'Try adjusting your filters or search query'}</p>
              {initial.length>0&&<button type="button" onClick={unpublished?()=>go('/colleges/search'):reset} className="text-brand-600 font-semibold underline">{unpublished?'See every college':'Clear all filters'}</button>}
            </div>
          :viewMode==='grid'
            ?<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{data.map((x,i)=><HdCard key={x.id} item={x} vertical={vertical} i={i} ctx={ctx} coursePath={coursePath}/>)}</div>
            :<div className="space-y-3">{data.map(x=><ListCard key={x.id} item={x} vertical={vertical} ctx={ctx}/>)}</div>}

          {isJobs&&ready&&<div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[[<ShieldCheck key="s" className="w-4 h-4"/>,initial.filter(j=>j.approval.some(a=>/verified/i.test(a))).length,'verified employers'],[<Wifi key="w" className="w-4 h-4"/>,initial.filter(j=>j.wfh).length,'work from home'],[<Flame key="f" className="w-4 h-4"/>,initial.filter(j=>(j.postedDays??99)<=7).length,'posted this week']].map(([ic,n,l])=>
              <div key={l} className="bg-white rounded-xl border border-gray-100 p-3"><div className="flex items-center justify-center gap-1.5 text-brand-600 font-bold">{ic}{n}</div><div className="text-xs text-gray-500">{l}</div></div>)}
          </div>}
        </div>
      </div>
    </div>

    {isJobs&&nearbyOpen&&nearby&&<div ref={nearbyRef} role="dialog" aria-label="Jobs near you"
      className="fixed bottom-24 right-4 z-[65] w-[min(24rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-brand-600 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5"/>Near you</span>
        <button type="button" aria-label="Dismiss nearby jobs" onClick={()=>setNearbyOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4"/></button>
      </div>
      <p className="text-sm text-gray-600 mb-3">Closest to <b>{geo.label}</b>. {nearby.commutable} {nearby.commutable===1?'opening is':'openings are'} within 60&nbsp;km, plus {nearby.remote} you can do from home.</p>
      <ul className="space-y-2 mb-4">{nearby.top.map(j=><li key={j.id} className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">{j.mark}</span>
        <span className="flex-1 min-w-0"><b className="block text-sm text-gray-900 truncate">{j.name}</b><small className="block text-xs text-gray-500 truncate">{j.company} · {j.area?`${j.area}, `:''}{j.city}</small></span>
        <span className="text-sm font-bold text-brand-600">{j.km<1?'<1':Math.round(j.km)}<small className="text-xs text-gray-400 ml-0.5">km</small></span>
      </li>)}</ul>
      <div className="flex gap-2">
        <button type="button" className="flex-1 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg" onClick={()=>{setSort('Nearest first');setNearbyOpen(false);document.getElementById('results')?.scrollIntoView({behavior:'smooth'})}}>See all nearby</button>
        <button type="button" className="text-sm font-semibold border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50" onClick={()=>setNearbyOpen(false)}>Not now</button>
      </div>
    </div>}
  </main>;
}
