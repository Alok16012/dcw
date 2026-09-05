'use client';
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {useCatalog,useAllCatalogs} from '@/lib/client/catalog.js';
import Image from 'next/image';
import {ArrowRight,ArrowUp,Bookmark,Building2,Check,ChevronRight,Clock3,FileText,GraduationCap,Heart,Home,MapPin,Search,ShieldCheck,Sparkles,Star,Users,X,Bell,UserRound,BookOpen,ExternalLink,TrendingUp,CalendarDays,MessageCircle,RotateCcw,Zap,Navigation,LocateFixed,Wifi,Flame,Filter,Stethoscope,Plane,Scale,Award,Briefcase,ScrollText,Laptop,Cog,Calculator,Wrench,Workflow} from 'lucide-react';
import {Plate,CardWash} from '@/components/ui/plate.jsx';
import {SectionTitle,PageHero,Accordion} from '@/components/ui/primitives.jsx';
import {CardSkeleton,CatalogError,EmptyState,CatalogGrid,CatalogFallback} from '@/components/discovery/catalog-states.jsx';
import {Repeater,ChipInput} from '@/components/forms/fields.jsx';
import dynamic from 'next/dynamic';
import {coursesOf,matchesPath,PATHS} from '@/lib/content/courses.js';
import {STREAMS,ABROAD_LABEL,readStream,matchesStream,isAbroad} from '@/lib/content/streams.js';
import {fmt,phoneDigits} from '@/lib/format.js';
import {PathCard,EntityCard} from '@/components/discovery/entity-card.jsx';
/* One of these renders per URL, so each ships as its own chunk rather than
   riding along in the shell every visitor downloads. Server rendering stays on:
   /about, /blog and /reviews are the pages a stranger reads before deciding
   whether to trust us, and they have to arrive as HTML. */
const Boards=dynamic(()=>import('@/components/tools/boards.jsx'));
const Predictor=dynamic(()=>import('@/components/tools/predictor.jsx'));
const ResumeBuilder=dynamic(()=>import('@/components/tools/resume-builder.jsx'));
const AboutPage=dynamic(()=>import('@/components/editorial/about.jsx'));
const BlogPage=dynamic(()=>import('@/components/editorial/blog.jsx'));
const ReviewsPage=dynamic(()=>import('@/components/editorial/reviews.jsx'));
const SavedPage=dynamic(()=>import('@/components/account/saved.jsx'));
const ApplicationsPage=dynamic(()=>import('@/components/account/applications.jsx'));
const AccountPage=dynamic(()=>import('@/components/account/account.jsx'));
const ComparePage=dynamic(()=>import('@/components/account/compare.jsx'));
const AutomationCenter=dynamic(()=>import('@/components/account/automations.jsx'));

const V={distance:{label:'Distance',sub:'Courses Wala',logoAlt:'Distance Courses Wala',legal:'Distance Courses Wala, Patna',mark:'/distance-mark.png',lockup:'/distance-lockup.png',theme:{'--accent':'#0B4DA8','--accent-deep':'#07356F','--accent-ink':'#0B4DA8','--accent-solid':'#0B4DA8','--wash':'#EAF1FB','--spark':'#F5C93B','--spark-ink':'#3A2A00','--spark-lift':'#F7D98C','--tint':'#B7D2F6','--mark':"url('/distance-mark.png')"}},colleges:{label:'Colleges',sub:'Colleges Wala',logoAlt:'Colleges Wala',legal:'Colleges Wala, Patna',mark:'/colleges-mark.png',lockup:'/colleges-lockup.png',theme:{'--accent':'#C1272D','--accent-deep':'#8C1A20','--accent-ink':'#C1272D','--accent-solid':'#C1272D','--wash':'#FBEDEC','--spark':'#1B3B78','--spark-ink':'#FFFFFF','--spark-lift':'#F6C9C4','--tint':'#F3C0BC','--mark':"url('/colleges-mark.png')"}},jobs:{label:'Jobs',sub:'Berojgar Bharat',logoAlt:'Berojgar Bharat',legal:'Berojgar Bharat, Patna',mark:'/jobs-mark.png',lockup:'/jobs-lockup.png',theme:{'--accent':'#E2760F','--accent-deep':'#A5520A','--accent-ink':'#A5520A','--accent-solid':'#A5520A','--wash':'#FDF2E5','--spark':'#5AB436','--spark-ink':'#0C2A05','--spark-lift':'#B6EE99','--tint':'#F8D3A6','--mark':"url('/jobs-mark.png')"}}};
/* The universities, colleges and jobs that used to be pasted here now come from
   lib/data via lib/store.js, over /api — see lib/client/catalog.js. A second
   copy in the browser bundle meant a job posted in /admin was invisible to the
   public listing, and every edit had to be made twice. */
/* ---------- Jobs ------------------------------------------------------------
   Every posting carries a city plus its coordinates. Two features depend on
   that and cannot be faked: the city filter, and "jobs near me", which asks
   the browser for a location and ranks by real great-circle distance. Remote
   roles carry wfh:true and no coordinates — they are reachable from anywhere,
   so they are surfaced separately rather than given a misleading distance.
   Indicative demo data; salaries and openings are illustrative. */
const CITY_POS={'Patna':[25.5941,85.1376],'Ranchi':[23.3441,85.3096],'Lucknow':[26.8467,80.9462],'Delhi NCR':[28.5355,77.3910],'Gurugram':[28.4595,77.0266],'Bengaluru':[12.9716,77.5946],'Hyderabad':[17.3850,78.4867],'Mumbai':[19.0760,72.8777],'Pune':[18.5204,73.8567],'Jaipur':[26.9124,75.7873],'Kolkata':[22.5726,88.3639],'Bhubaneswar':[20.2961,85.8245]};

/* Great-circle distance in kilometres. "Jobs near me" ranks by real distance,
   so a flat-earth approximation that drifts by tens of kilometres would put
   the wrong job at the top of somebody's list. */
function kmBetween(a,b){const R=6371,rad=x=>x*Math.PI/180;const dLat=rad(b[0]-a[0]),dLng=rad(b[1]-a[1]);const h=Math.sin(dLat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
/* Remote roles deliberately return null rather than 0 km: they are reachable
   from anywhere, and pretending they are next door would be a lie. */
function jobKm(job,here){if(!here||job.wfh)return null;const p=job.pos||CITY_POS[job.city];return p?kmBetween(here,p):null}
function nearestCity(here){const list=Object.entries(CITY_POS).map(([c,p])=>[c,kmBetween(here,p)]).sort((x,y)=>x[1]-y[1]);return list[0]}
/* Generic, sector-level duties. A real posting would carry its own text from
   the employer; these are clearly indicative, like the rest of the demo data,
   and exist so the role page reads as a job rather than a row of numbers. */
const DUTIES={
Sales:['Meet customers in your assigned area and explain the product honestly','Complete the paperwork and KYC for every closed lead','Hit a monthly target that is shared with you in writing'],
Support:['Answer customer calls and chats within the agreed response time','Log every interaction so the next agent has the full history','Escalate anything you cannot resolve, with your notes attached'],
Operations:['Enter and verify records against the source document','Flag mismatches instead of guessing at the correct value','Keep the daily queue clear before you sign off'],
Finance:['Maintain day books, vouchers and reconciliations in Tally','Support monthly closing and GST filing with the senior accountant','Follow up on outstanding payments with a written trail'],
Logistics:['Pick up and deliver consignments on your assigned route','Confirm each handover in the app with a proof of delivery','Report damage or delay the same day, not at week end'],
Retail:['Help customers on the floor and keep your section stocked','Run the billing counter accurately during peak hours','Support stock counts and visual merchandising resets'],
Technology:['Build and ship features against a reviewed ticket','Write tests for what you build and fix what you break','Take part in code review and daily stand-up'],
Healthcare:['Follow the standard operating procedure for every sample or dispense','Maintain records that satisfy an inspection without rework','Keep the workspace and equipment compliant with hygiene norms'],
Marketing:['Write and schedule content for the channels you own','Track what each post actually earned in reach and leads','Work to a monthly calendar agreed with the lead']};
const dutiesOf=job=>DUTIES[job.sector]||['Deliver the day-to-day work described in the role','Keep clear records of what you complete','Report blockers early to your reporting manager'];
/* Filter facets are derived from whatever the catalogue actually returns, so a
   city or sector an admin introduces appears in the filters without a code
   change — and one that disappears stops being offered. */
const jobCities=rows=>[...new Set(rows.map(j=>j.city).filter(Boolean))].sort((a,b)=>a==='Remote'?1:b==='Remote'?-1:a.localeCompare(b));
/* The chip row shows six cities out of thirteen, so it has to show the six with
   the most openings. Sorted alphabetically it hid Patna — the home market and
   a third of every listing — behind Bengaluru and Bhubaneswar. */
const topJobCities=rows=>{const n={};rows.forEach(j=>{if(j.city)n[j.city]=(n[j.city]??0)+1});
  return Object.keys(n).sort((a,b)=>n[b]-n[a]||a.localeCompare(b));};
const jobSectors=rows=>[...new Set(rows.map(j=>j.sector).filter(Boolean))].sort();
function BrandLockup({vertical}){const brand=V[vertical];return <span className="brand-lockup"><Image src={brand.lockup} alt={`${brand.logoAlt} logo`} width={640} height={640} sizes="128px"/></span>}
function VerticalLogo({vertical,size=46,mark=false}){const brand=V[vertical];const src=mark?brand.mark:brand.lockup;return <span className={mark?'vertical-logo':'vertical-logo is-lockup'} style={{'--logo-size':`${size}px`}}><Image src={src} alt={`${brand.logoAlt} logo`} width={mark?512:640} height={640} sizes={`${size}px`} priority/></span>}

/* The public site needs to know who is looking at it: the utility bar offers
   three different front doors when nobody is signed in, and the account itself
   once somebody is. Kept as a plain fetch rather than the console's api()
   helper so the public bundle does not pull in the admin client. */
/* Every overlay in this file opened without moving focus: the dialog appeared,
   the activeElement stayed on the body behind it, Escape did nothing, and Tab
   walked the page underneath. This gives all three the same behaviour — take
   focus on open, keep it inside while trapping, hand it back on close, and
   close on Escape. `trap` is false for the nearby popover, which is a popover
   and not a modal: it should close on Escape but must not imprison the tab. */
/* The last element focused outside any dialog. A dialog's own autoFocus runs
   during React's commit, before the effect below, so reading
   document.activeElement there can hand back a control *inside* the dialog.
   Restoring to that focuses a node which is about to be removed, and the
   keyboard user is dropped at the top of the document instead of back on the
   control they opened the dialog from. */
let lastOutsideFocus = null, focusTracked = false;
function trackOutsideFocus(){
  if(focusTracked || typeof document === 'undefined') return;
  focusTracked = true;
  document.addEventListener('focusin', e => {
    const el = e.target;
    if(el instanceof Element && !el.closest('[role="dialog"]')) lastOutsideFocus = el;
  }, true);
}

// Registered at module load, not from inside the hook: the hook only runs once a
// dialog has already mounted, by which point the control that opened it has
// long since lost focus and there is nothing left to record.
trackOutsideFocus();

function useDialogA11y(open, close, {trap = true} = {}){
  const ref = useRef(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if(!open) return;
    const node = ref.current;
    const active = document.activeElement;
    const restoreTo = (active && active !== document.body && !node?.contains(active))
      ? active : lastOutsideFocus;
    const SEL = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
    const items = () => [...(node?.querySelectorAll(SEL) ?? [])].filter(el => el.offsetParent !== null);
    // Focus the first real control rather than the container or the close
    // button: a screen reader then starts on the thing the dialog is for, and
    // typing works without a further Tab.
    const list = items();
    ((list.find(el => !el.classList.contains('modal-x')) ?? list[0]) ?? node)?.focus?.();
    const onKey = e => {
      if(e.key === 'Escape'){ e.stopPropagation(); closeRef.current?.(); return; }
      if(e.key !== 'Tab' || !trap || !node) return;
      const list = items();
      if(!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      else if(!node.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      // Only restore to something still in the document: focusing a detached
      // node silently sends focus to <body>, which is the bug this guards.
      if(restoreTo && document.contains(restoreTo)) restoreTo.focus?.();
    };
  }, [open, trap]);
  return ref;
}

function useSession(){const [s,setS]=useState({state:'loading',user:null});
const load=()=>fetch('/api/auth/session',{credentials:'include'}).then(r=>r.json()).then(d=>setS({state:'ready',user:d?.data?.authenticated?d.data.session:null})).catch(()=>setS({state:'ready',user:null}));
useEffect(()=>{let live=true;fetch('/api/auth/session',{credentials:'include'}).then(r=>r.json()).then(d=>{if(live)setS({state:'ready',user:d?.data?.authenticated?d.data.session:null})}).catch(()=>{if(live)setS({state:'ready',user:null})});return()=>{live=false}},[]);
const signOut=async()=>{try{await fetch('/api/auth/logout',{method:'POST',credentials:'include'})}catch{}await load()};
return {...s,signOut}}

function App(){const path=usePathname(),router=useRouter();const vertical=path?.split('/')[1] in V?path.split('/')[1]:'distance';const cfg=V[vertical];const [saved,setSaved]=useState([]),[compare,setCompare]=useState({distance:[],colleges:[],jobs:[]}),[query,setQuery]=useState(''),[searchOpen,setSearchOpen]=useState(false),[lead,setLead]=useState(null),[toast,setToast]=useState(''),[botOpen,setBotOpen]=useState(false);
useEffect(()=>{try{setSaved(JSON.parse(localStorage.getItem('dcw-saved-v2')||'[]'));setCompare(JSON.parse(localStorage.getItem('dcw-compare-v2')||'{"distance":[],"colleges":[],"jobs":[]}'))}catch{}},[]);
useEffect(()=>{const shortcut=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setSearchOpen(true)}};addEventListener('keydown',shortcut);return()=>removeEventListener('keydown',shortcut)},[]);
useEffect(()=>{localStorage.setItem('dcw-saved-v2',JSON.stringify(saved));localStorage.setItem('dcw-compare-v2',JSON.stringify(compare))},[saved,compare]);
const go=p=>router.push(p);const notify=t=>{setToast(t);setTimeout(()=>setToast(''),2200)};const toggleSave=id=>{setSaved(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);notify(saved.includes(id)?'Removed from saved':'Saved for later')};const toggleCompare=id=>setCompare(c=>{const arr=c[vertical];if(arr.includes(id))return {...c,[vertical]:arr.filter(x=>x!==id)};if(arr.length>=3){notify('Compare supports up to 3 choices');return c}notify('Added to comparison');return {...c,[vertical]:[...arr,id]}});
const auth=useSession();const catalog=useCatalog(vertical);
const ctx={path,vertical,cfg,go,saved,toggleSave,compare,toggleCompare,setLead,query,setQuery,setSearchOpen,notify,auth,catalog};
let page;if(path==='/about')page=<AboutPage {...ctx}/>;else if(path?.startsWith('/blog'))page=<BlogPage {...ctx}/>;else if(path==='/reviews')page=<ReviewsPage {...ctx}/>;else if(path==='/saved')page=<SavedPage {...ctx}/>;else if(path==='/applications')page=<ApplicationsPage {...ctx}/>;else if(path==='/notifications')page=<AccountPage type="notifications" {...ctx}/>;else if(path==='/profile')page=<AccountPage type="profile" {...ctx}/>;else if(path==='/automations')page=<AutomationCenter {...ctx}/>;else if(path?.endsWith('/compare'))page=<ComparePage {...ctx}/>;else if(path?.includes('resume-builder'))page=<ResumeBuilder {...ctx}/>;else if(path?.includes('neet-predictor'))page=<Predictor {...ctx}/>;else if(path?.includes('boards'))page=<Boards {...ctx}/>;else if(path?.includes('universities')||path?.includes('/search')||path?.includes('/list'))page=<Listing {...ctx}/>;else{
  const id=path?.split('/').pop();
  const entity=catalog.rows.find(x=>x.id===id);
  /* A detail URL carries at least two segments (/jobs/:id, /distance/university/:id).
     Anything shorter is a vertical home, which must render immediately rather
     than waiting on the catalogue. */
  const isDetailRoute=(path?.split('/').filter(Boolean).length??0)>=2;
  page=entity?<Detail {...ctx} entity={entity}/>
    :isDetailRoute&&catalog.state!=='ready'?<CatalogFallback catalog={catalog} go={go} vertical={vertical}/>
    :isDetailRoute?<NotFoundPage go={go} vertical={vertical}/>
    :<HomePage {...ctx}/>;
}
return <div className={`app app-${vertical}`} style={cfg.theme}><MotionLayer/><a className="skip-link" href="#main">Skip to main content</a><Header {...ctx}/>{page}<Footer go={go} vertical={vertical}/>{compare[vertical].length>0&&!path?.endsWith('/compare')&&<CompareTray {...ctx}/>}<MobileNav {...ctx}/><AskDCW open={botOpen} setOpen={setBotOpen} {...ctx}/>{searchOpen&&<SearchPanel {...ctx}/>} {lead&&<LeadFlow lead={lead} vertical={vertical} close={()=>setLead(null)} notify={notify}/>} {toast&&<div className="toast" role="status"><Check size={17}/>{toast}</div>}</div>}

function MotionLayer(){const [progress,setProgress]=useState(0),[showTop,setShowTop]=useState(false);useEffect(()=>{const reveal=()=>{document.querySelectorAll('main section,.entity-card,.path-card,.detail-section,.automation-grid section').forEach((el,i)=>{if(!el.classList.contains('motion-ready')){el.classList.add('motion-ready');el.style.setProperty('--delay',`${Math.min(i%6,5)*55}ms`)}})};reveal();const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target)}}),{threshold:.04,rootMargin:'0px 0px 120px'});const observe=()=>document.querySelectorAll('.motion-ready').forEach(el=>observer.observe(el));observe();const mutation=new MutationObserver(()=>{reveal();observe()});mutation.observe(document.body,{childList:true,subtree:true});const onScroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;setProgress(max>0?scrollY/max*100:0);setShowTop(scrollY>650)};addEventListener('scroll',onScroll,{passive:true});onScroll();return()=>{observer.disconnect();mutation.disconnect();removeEventListener('scroll',onScroll)}},[]);return <><div className="scroll-progress" aria-hidden="true"><i style={{width:`${progress}%`}}/></div><button className={`scroll-top ${showTop?'show':''}`} aria-label="Scroll to top" tabIndex={showTop?0:-1} aria-hidden={!showTop} onClick={()=>scrollTo({top:0,behavior:'smooth'})}><ArrowUp/></button></>}

/* Where each kind of user lands after signing in. The public site and the
   console share one account system, so the door you come through decides the
   room, not the credentials. */
const DOORS=[{key:'student',label:'Student',hint:'Applications & counselling',next:'/applications'},{key:'employer',label:'Employer',hint:'Post jobs, screen candidates',next:'/admin/jobs'},{key:'admin',label:'Admin',hint:'Everything across DCW',next:'/admin'}];
const HOME_FOR={admin:'/admin',employer:'/admin/jobs',student:'/applications'};

/* Utility bar — the upper half of the double nav. It carries the live line on
   the left and the three front doors on the right, so a student, an employer
   and an operator each see their own way in without the main nav having to
   grow a fourth thing to hold. */
/* The strip is labelled LIVE, so what it says has to be live. It used to read
   "Aaj 1,240 nayi vacancies · 18 walk-in drives Patna me" under "Updated 12
   minutes ago" — a count, a second count and a timestamp, none of them measured
   and none of them changing. It now states what the catalogue request that just
   returned actually contains, and the timestamp is the moment of that request.
   Before the rows arrive it says so rather than showing a number. */
/* "Updated 12 minutes ago" was a string. This is the elapsed time since the
   fetch that produced the rows on screen, re-read every 30s so a tab left open
   does not keep claiming the catalogue was read just now. */
function useAgo(ts){
  const [,tick]=useState(0);
  useEffect(()=>{if(!ts)return;const id=setInterval(()=>tick(n=>n+1),30000);return()=>clearInterval(id)},[ts]);
  if(!ts)return '';
  const m=Math.floor((Date.now()-ts)/60000);
  if(m<1)return 'just now';
  if(m<60)return `${m} min ago`;
  const h=Math.floor(m/60);
  return `${h} hr${h===1?'':'s'} ago`;
}
function UtilityBar({vertical,auth,go,catalog}){
  const user=auth?.user;
  const rows=catalog?.rows??[];
  const ago=useAgo(catalog?.fetchedAt);
  const ready=catalog?.state==='ready'&&rows.length>0;
  const label=!ready
    ?(catalog?.state==='error'?'Catalogue abhi load nahi ho paaya':'Catalogue load ho raha hai')
    :vertical==='jobs'
      ?`${rows.reduce((t,r)=>t+(r.openings??0),0)} openings live \u00b7 ${rows.filter(r=>r.postedDays!=null&&r.postedDays<=7).length} naye is hafte`
      :vertical==='colleges'
        ?`${rows.length} colleges \u00b7 cutoff aur total kharcha ek jagah`
        :`${rows.length} universities \u00b7 approval aur fees ek jagah`;
  return <div className="ticker utility"><div className="util-row">
    <p className="util-live"><span>LIVE</span><b>{label}</b><small>{ready?`Catalogue read ${ago}`:'\u2014'}</small></p>
    {auth?.state==='loading'
      ? <span className="util-skel" aria-hidden="true"/>
      : user
        ? <div className="util-auth signed-in"><span className="util-who"><b>{user.name}</b><small>{user.role}</small></span><button className="util-link strong" onClick={()=>go(HOME_FOR[user.role]||'/')}>Go to my {user.role==='student'?'dashboard':'console'}</button><button className="util-link" onClick={auth.signOut}>Sign out</button></div>
        : <nav className="util-auth" aria-label="Sign in">
            <span className="util-label">Sign in as</span>
            {DOORS.map(d=><a key={d.key} className="util-link util-role" href={`/login?role=${d.key}&next=${encodeURIComponent(d.next)}`} title={d.hint}>{d.label}</a>)}
            <a className="util-link util-compact" href="/login">Sign in</a>
          </nav>}
  </div></div>}

function Header({vertical,cfg,go,setSearchOpen,setLead,auth,catalog}){const user=auth?.user;/* Signed out, this used to read 'AK' — hardcoded initials that belong to a
     real account on this install. A visitor who has never signed in was shown
     somebody else's monogram and an "Open profile" button leading to a profile
     that is not theirs. Signed out there is no one to abbreviate, so the avatar
     becomes a neutral glyph that says what it does: sign in. */
  const initials=user?user.name.replace(/\(.*\)/,'').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase():null;return <><UtilityBar vertical={vertical} auth={auth} go={go} catalog={catalog}/><header><button className="brand vertical-brand" onClick={()=>go(`/${vertical}`)} aria-label={`${V[vertical].logoAlt} home`}><VerticalLogo vertical={vertical}/><span><b>{V[vertical].logoAlt}</b><small>Discover · Compare · Decide</small></span></button><nav className="verticals" aria-label="Choose a service">{Object.entries(V).map(([k,v])=><button key={k} aria-current={vertical===k?'page':undefined} className={vertical===k?'active':''} onClick={()=>go(`/${k}`)}><span>{v.label}</span><small>{v.sub}</small></button>)}</nav><button className="header-search" onClick={()=>setSearchOpen(true)}><Search size={18}/><span>Search {cfg.label.toLowerCase()}</span><kbd>⌘ K</kbd></button><div className="header-actions"><button aria-label="Notifications" onClick={()=>go('/notifications')}><Bell size={20}/><i/></button><button aria-label="Saved items" onClick={()=>go('/saved')}><Bookmark size={20}/></button><button className="avatar" aria-label={user?`Open profile — signed in as ${user.name}`:'Sign in'} onClick={()=>go(user?'/profile':'/login')}>{initials||<UserRound size={18} aria-hidden="true"/>}</button><button className="talk" onClick={()=>setLead({title:'Talk to a DCW counsellor',interest:vertical})}><MessageCircle aria-hidden="true"/>Talk to us</button></div></header></>}

/* useLayoutEffect on the client, useEffect on the server — the standard escape
   from React's SSR warning. It matters here because the counter has to be reset
   to zero *before* the first paint, or the strip flashes its final figure and
   then jumps back to nothing. */
const useIsoEffect=typeof window!=='undefined'?useLayoutEffect:useEffect;

/* A statistic that arrives already finished is a picture of a number; one that
   tallies up is the number being counted. Only genuine quantities animate —
   "1:1" is a ratio with nothing to accumulate, so it is rendered straight, and
   so is everything when the reader has asked for reduced motion. The markup
   still ships the true figure, so a reader without JS sees the fact, not a nil. */
function StatNumber({value,delay=0}){
  const m=/^([^0-9]*)([0-9,]+)(.*)$/.exec(value);
  const target=m&&!value.includes(':')?Number(m[2].replace(/,/g,'')):null;
  const [n,setN]=useState(null);
  useIsoEffect(()=>{
    if(target===null)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    setN(0);
    let raf,start,timer;
    const dur=1150;
    const run=t=>{
      if(start===undefined)start=t;
      const p=Math.min(1,(t-start)/dur);
      /* ease-out quart: most of the count happens early and the last hundred
         settle slowly, which is how a tally actually feels landing. */
      setN(Math.round(target*(1-Math.pow(1-p,4))));
      if(p<1)raf=requestAnimationFrame(run);
    };
    timer=setTimeout(()=>{raf=requestAnimationFrame(run)},delay);
    return()=>{clearTimeout(timer);cancelAnimationFrame(raf)};
  },[target,delay]);
  if(target===null||n===null)return <b>{value}</b>;
  return <b>{m[1]}{n.toLocaleString('en-IN')}{m[3]}</b>;
}

/* ---------- Hero proof, derived ---------------------------------------------
   These three tiles used to be string literals: "1,240 vacancies today", "up
   12% on last week", "12,000+ students admitted since 2019". Not one of those
   figures was counted from anything — they were written to look like evidence.

   A number a student reads as proof has to be countable from the same
   catalogue that student can open in the next click, so every figure below is
   derived from the rows the API has just returned, and each note asserts only
   what those rows actually support (the salary line checks that every row does
   publish one before it claims so). While the catalogue is loading, or if the
   request failed, a tile shows an em dash: a figure that has not been measured
   yet is not a figure to print.

   The counsellor tile carries no number because it is not a measurement — it is
   the offer the business makes, and it is stated as one. */
function heroProof(vertical,catalog){
  const rows=catalog?.rows??[];
  const ready=catalog?.state==='ready'&&rows.length>0;
  const fig=v=>ready?String(v):'—';
  const waiting=catalog?.state==='error'?'catalogue unavailable':null;
  if(vertical==='jobs'){
    const openings=rows.reduce((t,r)=>t+(r.openings??0),0);
    const cities=new Set(rows.filter(r=>!r.wfh&&r.city).map(r=>r.city)).size;
    const remote=rows.some(r=>r.wfh);
    const fresh=rows.filter(r=>r.postedDays!=null&&r.postedDays<=7).length;
    const employers=new Set(rows.map(r=>r.company)).size;
    const withPay=rows.filter(r=>r.fee>0).length;
    return [
      [fig(openings),'openings live','/jobs/search',Briefcase,null,
        ready?`across ${cities} ${cities===1?'city':'cities'}${remote?' and remote':''}`:(waiting??'counting the board')],
      [fig(fresh),'posted this week','/jobs/search',Clock3,null,
        ready?`of ${rows.length} live ${rows.length===1?'role':'roles'}`:(waiting??'checking posting dates')],
      [fig(employers),'hiring employers','/jobs/search',Building2,null,
        ready?(withPay===rows.length?'every role publishes its salary':`${withPay} publish a salary`):(waiting??'reading the employer list')]
    ];
  }
  const listed=rows.length;
  const approved=rows.filter(r=>(r.approval??[]).length>0).length;
  const share=listed?Math.round(approved/listed*100):0;
  const isCol=vertical==='colleges';
  const href=isCol?'/colleges/search':'/distance/universities';
  return [
    [fig(share+'%'),isCol?'approvals on file':'approvals on file',href,ShieldCheck,ready?share:null,
      ready?`${approved} of ${listed} checked at source`:(waiting??'reading the catalogue')],
    [fig(listed),isCol?'colleges compared':'universities compared',href,GraduationCap,null,
      ready?(isCol?'cutoffs and total cost on record':'fees, EMI and mode on record'):(waiting??'loading the catalogue')],
    ['1:1','counsellor for life','#counsellor',MessageCircle,null,'no cost, no sales pitch']
  ];
}
function Hero({vertical,go,setSearchOpen,setLead,catalog}){const copy={distance:{eyebrow:'Approvals, fees and outcomes—side by side',title:<>See the whole path.<br/><em>Choose your next move.</em></>,body:'Compare recognized online and distance programs with fees, approvals and honest guidance—all in one clear view.',primary:['Find my program','/distance/universities'],secondary:['Compare boards','/distance/boards']},colleges:{eyebrow:'Cutoffs, costs and choices—made clear',title:<>Your right college<br/><em>is within reach.</em></>,body:'Use real decision tools to compare cutoffs, total costs, seats and outcomes across India and abroad.',primary:['Explore colleges','/colleges/search'],secondary:['Predict from NEET rank','/colleges/neet-predictor']},jobs:{eyebrow:'Verified roles. Clear salaries. No noise.',title:<>Less searching.<br/><em>More moving forward.</em></>,body:'Discover fresher-friendly jobs, build a strong resume and apply with confidence in three simple steps.',primary:['Find verified jobs','/jobs/search'],secondary:['Build my resume','/jobs/resume-builder']}}[vertical];const art=vertical==='colleges'?'campus-editorial':vertical==='jobs'?'career-editorial':'dcw-journey-hero';return <section className="hero atlas-hero"><picture><source type="image/webp" media="(max-width:900px)" srcSet={`/${art}-900.webp`}/><source type="image/webp" srcSet={`/${art}-full.webp`}/><img src={`/${art}.png`} alt={vertical==='jobs'?'Young Indian professionals collaborating at work':vertical==='colleges'?'Indian university students walking on campus':'Student looking toward a bright education and career pathway'} fetchPriority="high" decoding="async"/></picture><div className="hero-shade"/><div className="container hero-content"><div className="hero-copy"><span className="eyebrow"><Sparkles size={16}/>{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.body}</p><button className="hero-search glass" onClick={()=>setSearchOpen(true)}><Search/><span>{vertical==='jobs'?'Search role, skill or location':vertical==='colleges'?'Search college, course, exam or city':'Search university, course or board'}</span><b>Search</b></button><div className="hero-ctas"><button className="btn primary tactile" onClick={()=>go(copy.primary[1])}>{copy.primary[0]}<ArrowRight/></button><button className="btn ghost" onClick={()=>go(copy.secondary[1])}>{copy.secondary[0]}<ChevronRight/></button></div><div className="proof">{/* The fifth slot is `share`: the proportion the figure actually represents,
        or null when it is a count rather than a share. Only a real share earns a
        meter — a recessed track with a filled portion, which is a claim that the
        rest of the track is the remainder. The counts get a plain rule that
        draws in on reveal: same rhythm, same motion, no arithmetic implied. */}
     {heroProof(vertical,catalog).map(([n,l,href,Icon,share,note],i)=><button key={l} onClick={()=>href==='#counsellor'?setLead({title:'Talk to a DCW counsellor',interest:vertical}):go(href)} style={{'--i':i}}><span className="stat-i" aria-hidden="true"><Icon/></span><StatNumber value={n} delay={140+i*110}/><small>{l}</small><span className="stat-note">{note}</span></button>)}</div></div></div></section>}
function HomePage(ctx){const {vertical,go,catalog}=ctx;const pool=catalog.rows;return <main id="main" tabIndex={-1}><Hero {...ctx}/><section className="trust-strip"><div className="container"><span><ShieldCheck/>Data checked by our research team</span><span><Users/>{catalog.state==='ready'?`${pool.length} ${vertical==='jobs'?'roles':vertical==='colleges'?'colleges':'universities'} on record`:catalog.state==='error'?'Catalogue unavailable':'Catalogue loading'}</span><span><Clock3/>Updated every admission cycle</span></div></section><section className="section container"><SectionTitle kicker="CHOOSE YOUR NEXT MOVE" title={vertical==='jobs'?'Start with what you need today':vertical==='colleges'?'Explore by your ambition':'Learn on your terms'} action="View everything" onAction={()=>go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}/><div className="path-grid">{categories(vertical).map((x,i,a)=><PathCard key={x.name} item={x} i={i} featured={i===0&&(a.length+1)%3!==1} onClick={()=>go(x.href)}/>)}</div></section><section className="section wash"><div className="container"><SectionTitle kicker="RESEARCHED, NOT RANKED BY ADS" title={vertical==='jobs'?'Fresh opportunities near you':vertical==='colleges'?'Colleges worth comparing':'Popular flexible programs'} action="See all results" onAction={()=>go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}/><div className="card-grid"><CatalogGrid catalog={catalog} skeleton={3}>{pool.slice(0,3).map(x=><EntityCard key={x.id} item={x} {...ctx}/>)}</CatalogGrid></div></div></section>{vertical!=='distance'&&<section className="section container section-plate"><SectionTitle kicker={vertical==='colleges'?'STUDY ABROAD':'SKILL TO JOB'} title={vertical==='colleges'?'Intake and total cost, country by country':'Short courses that lead to a job'} action={vertical==='colleges'?'Compare countries':'See all courses'} onAction={()=>go(vertical==='colleges'?'/colleges/search':'/jobs/search')}/><div className="path-grid">{(vertical==='colleges'?[{name:'Georgia',kicker:'MBBS',desc:'\u20b924L total \u00b7 September intake \u00b7 NMC-approved universities.',icon:<Plane/>},{name:'Russia',kicker:'MBBS',desc:'\u20b919L total \u00b7 August intake \u00b7 English-medium teaching.',icon:<Plane/>},{name:'Canada',kicker:'PG DIPLOMA',desc:'\u20b918L \u00b7 January intake \u00b7 post-study work pathway.',icon:<Plane/>},{name:'UK',kicker:'MSc \u00b7 1 YEAR',desc:'\u20b922L \u00b7 September intake \u00b7 one-year master\u2019s.',icon:<Plane/>}]:[{name:'Digital Marketing',kicker:'6 WEEKS',desc:'Certificate on completion, portfolio project included.',icon:<TrendingUp/>},{name:'Tally + GST',kicker:'8 WEEKS',desc:'Job assistance for accounts and back-office roles.',icon:<Calculator/>},{name:'Spoken English',kicker:'12 WEEKS',desc:'Live classes with practice partners, not recordings.',icon:<MessageCircle/>},{name:'Interview Prep',kicker:'MOCK + REVIEW',desc:'Mock interviews and a line-by-line resume review.',icon:<Briefcase/>}]).map((x,i,a)=><PathCard key={x.name} item={x} i={i} featured={i===0&&(a.length+1)%3!==1} cta={vertical==='colleges'?'See cost':'See course'} onClick={()=>go(vertical==='colleges'?'/colleges/search':'/jobs/search')}/>)}</div></section>}<DecisionBlock {...ctx}/><section className="section container"><div className="human-cta"><div><span className="kicker">NEED A HUMAN POINT OF VIEW?</span><h2>Talk it through with someone<br/>who knows the details.</h2><p>Free guidance, zero pressure. Our counsellors help you compare the options that fit your goal and budget.</p></div><button className="btn light" onClick={()=>ctx.setLead({title:'Talk to a DCW counsellor',interest:vertical})}>Book a free call<ArrowRight/></button></div></section></main>}
function categories(v){if(v==='distance')return[{name:'Complete 10th',kicker:'OPEN SCHOOL',desc:'Recognised open boards with flexible exam cycles.',icon:<BookOpen/>,href:'/distance/boards'},{name:'Complete 12th',kicker:'OPEN SCHOOL',desc:'Finish 12th in as little as 45 days, gap years covered.',icon:<ScrollText/>,href:'/distance/boards'},{name:'UG distance',kicker:'BACHELOR\u2019S',desc:'BA, B.Com, BBA and BCA from UGC-DEB universities.',icon:<GraduationCap/>,href:'/distance/universities?path=ug'},{name:'PG distance',kicker:'MASTER\u2019S',desc:'MBA, MCA and MA built around working hours.',icon:<Award/>,href:'/distance/universities?path=pg'},{name:'Online degree',kicker:'100% ONLINE',desc:'Fully online degrees with proctored online exams.',icon:<Laptop/>,href:'/distance/universities?path=online'},{name:'Fast track',kicker:'QUICKEST ROUTE',desc:'The fastest legitimate path to your certificate.',icon:<Zap/>,href:'/distance/boards?goal=Fastest%20result'}];if(v==='colleges')return[{name:'Medical',kicker:'MBBS & BDS',desc:'Cutoffs, seats and the full cost \u2014 not just tuition.',icon:<Stethoscope/>,href:'/colleges/search?stream=Medical'},{name:'Engineering',kicker:'B.TECH',desc:'JEE percentile, branch-wise fees and placement records.',icon:<Cog/>,href:'/colleges/search?stream=Engineering'},{name:'Management',kicker:'BBA & MBA',desc:'Entrance accepted, fee versus average package.',icon:<TrendingUp/>,href:'/colleges/search?stream=Management'},{name:'Law',kicker:'BA LLB',desc:'CLAT and state law entrances with five-year options.',icon:<Scale/>,href:'/colleges/search?stream=Law'},{name:'Study abroad',kicker:'GLOBAL OPTIONS',desc:'Country-wise cost, approvals and intake timelines.',icon:<Plane/>,href:'/colleges/search?abroad=1'},{name:'Commerce',kicker:'B.COM',desc:'Regular and honours streams with CA-friendly timing.',icon:<Calculator/>,href:'/colleges/search?stream=Commerce'}];return[{name:'Jobs near me',kicker:'LOCAL ROLES',desc:'Verified Patna openings with the salary stated upfront.',icon:<MapPin/>,href:'/jobs/search?city=Patna'},{name:'Free resume builder',kicker:'3 SIMPLE STEPS',desc:'Create a clean, recruiter-ready resume in minutes.',icon:<FileText/>,href:'/jobs/resume-builder'},{name:'Skill to job',kicker:'SHORT COURSES',desc:'Job-linked courses from six weeks, with placement help.',icon:<Wrench/>,href:'/jobs/search'},{name:'Sarkari exam alerts',kicker:'BSSC \u00b7 SSC \u00b7 RAILWAY',desc:'Form dates and eligibility, pushed before the deadline.',icon:<Bell/>,href:'/jobs/search'}]}

function NotFoundPage({go,vertical}){
  return <main id="main" tabIndex={-1} className="state-main"><div className="container">
    <EmptyState title="We could not find that page"
      body="The link may be out of date, or the listing may have closed."
      actionLabel={`Browse ${vertical}`} onAction={()=>go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}/>
  </div></main>;
}

function DecisionBlock({vertical,go}){const data=vertical==='distance'?['BOARD DECISION GUIDE','NIOS, BOSSE or BBOSE?','Compare recognition, exam speed, fees and flexibility side by side.','/distance/boards',['NIOS','BOSSE','BBOSE']]:vertical==='colleges'?['NEET COLLEGE PREDICTOR','Turn one rank into a practical shortlist.','Get strong, possible and backup choices based on category, state and budget.','/colleges/neet-predictor',['Strong chance','Possible','Backup']]:['FREE RESUME BUILDER','Your experience deserves a clear story.','Build a focused fresher resume with guided prompts and two polished templates.','/jobs/resume-builder',['Profile','Skills','Preview']];return <section className="section ink"><div className="container decision"><div><span className="kicker">{data[0]}</span><h2>{data[1]}</h2><p>{data[2]}</p><button className="btn light" onClick={()=>go(data[3])}>Try the free tool<ArrowRight/></button></div><div className="route-visual"><svg viewBox="0 0 520 220"><path d="M30 170 C150 170, 125 45, 250 85 S385 195, 495 48"/><circle cx="30" cy="170" r="8"/><circle cx="250" cy="85" r="8"/><circle cx="495" cy="48" r="8"/></svg>{/* Each chip labels one of the three dots on the curve, so it is anchored to
    its dot instead of always by its left edge. The old `left:${i*42+4}%`
    put the third chip's left edge at 88% and let its ~88px of text run past
    the box, which `.route-visual{overflow:hidden}` then cut off — at every
    width measured, from 320px (46px of the label lost) to 1440px (5px).
    The percentages now match the circles in the viewBox above (x=30, 250,
    495 of 520) and the transform anchors the chips left, centre, right. */}
{data[4].map((x,i)=><span key={x} style={{left:['5.8%','48.1%','95.2%'][i],top:['72%','25%','5%'][i],transform:['none','translateX(-50%)','translateX(-100%)'][i]}}><b>0{i+1}</b>{x}</span>)}</div></div></section>}
/* ---------- Listing --------------------------------------------------------
   Shared by all three verticals, but jobs are a genuinely different search:
   people filter a course by money and a job by PLACE first. So the jobs branch
   leads with an editorial hero and a locator band (city chips + "use my
   location"), and only then falls into the shared filter/results layout. */
function Listing(ctx){
  const {vertical,setLead,catalog,go}=ctx;
  const isJobs=vertical==='jobs';
  /* The catalogue for this vertical, fetched once by App(). Everything below —
     counts, facets, distances — derives from it, so an admin edit shows up here
     without a second copy of the data existing in this file. */
  const initial=catalog.rows;
  const ready=catalog.state==='ready';
  /* Counts are facts about the catalogue. While it is still in flight there is
     no fact to state, so they show an em dash rather than a confident zero. */
  const count=n=>ready?n:'—';
  const limit=isJobs?600000:15000000;
  const MUSTS=isJobs?['Verified salary','Freshers welcome','Work from home','Posted this week']
                    :['Verified data','Clear fees / salary','Student support','Latest intake'];
  const [type,setType]=useState('All'),[sort,setSort]=useState('Recommended'),[max,setMax]=useState(limit);
  /* Measured on a 390x844 phone: the filter panel is 613px tall and sits above
     the results, so the first university card began at document y=1516 — nearly
     two full screens of controls before a single result. The panel is worth the
     space it takes on a desktop sidebar and is worth none of it on a phone, so
     below the width where the sidebar stops being a sidebar it collapses to a
     summary line the person opens on purpose. Closed is the default because the
     job of the page is results, not filters. Desktop ignores this state
     entirely — the media query keeps `.filter-body` displayed above 940px, so
     the sidebar never depends on a click to exist. */
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [must,setMust]=useState(isJobs?[]:['Verified data']);
  /* Which of the six /distance path cards the person arrived from, carried in
     the URL so it survives a reload, a share and the back button. Before this
     the cards were three links to one page: "UG distance", "PG distance" and
     "Online degree" all landed on the same unfiltered six universities, and
     nothing on the page acknowledged the choice that had just been made.
     An unknown value falls back to null rather than filtering to nothing — a
     mistyped query should show the catalogue, not an empty result. */
  const params=useSearchParams();
  const coursePath=vertical==='distance'&&PATHS[params.get('path')]?params.get('path'):null;
  /* The colleges equivalent. Six cards — Medical, Engineering, Management,
     Law, Study abroad, Commerce — all pointed at the same unfiltered list, so
     the only thing distinguishing them was the word on the card. `stream` and
     `abroad` are what they mean, read from the URL for the same reasons `path`
     is: reload, share and Back all keep working. */
  const isColleges=vertical==='colleges';
  const stream=isColleges?readStream(params.get('stream')):null;
  const abroad=isColleges&&params.get('abroad')==='1';
  /* Seeded from the URL so the "Jobs near me" card lands on Patna openings
     rather than on the same unfiltered list as every other card. It stays a
     piece of state after that, because the city strip above the results is a
     control the person keeps using; the URL only decides where they start.
     An unrecognised city filters to nothing and the empty state offers Reset,
     which clears the query string too. */
  const cityParam=isJobs?params.get('city'):null;
  const [city,setCity]=useState(cityParam||'All'),[sector,setSector]=useState('All');
  /* geo.state: idle -> asking -> ok | denied | unsupported | error.
     Nothing is requested until the person presses the button — the browser
     prompt is theirs to accept, and every other state has a written fallback. */
  const [geo,setGeo]=useState({state:'idle'});
  const [nearbyOpen,setNearbyOpen]=useState(false);
  const reset=()=>{setType('All');setSort('Recommended');setMax(limit);setMust(isJobs?[]:['Verified data']);setCity('All');setSector('All');
    // The URL-borne filters are not state, so clearing state alone would leave
    // the address bar — and a reload, or a shared link — still filtered.
    if(coursePath||stream||abroad||cityParam)go(`/${vertical}/${vertical==='distance'?'universities':'search'}`);};

  function askLocation(){
    if(typeof navigator==='undefined'||!navigator.geolocation){setGeo({state:'unsupported'});return}
    setGeo({state:'asking'});
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const here=[pos.coords.latitude,pos.coords.longitude];
        const [near,away]=nearestCity(here);
        setGeo({state:'ok',here,label:near,away:Math.round(away)});
        setSort('Nearest first');
        setCity('All');
        setNearbyOpen(true);
      },
      err=>setGeo({state:err.code===1?'denied':'error'}),
      {enableHighAccuracy:false,timeout:10000,maximumAge:300000}
    );
  }
  function clearLocation(){setGeo({state:'idle'});setNearbyOpen(false);setSort('Recommended')}


  const here=geo.state==='ok'?geo.here:null;

  const data=useMemo(()=>initial
    .filter(x=>(type==='All'||x.type.includes(type))
      &&x.fee<=max
      /* An institution belongs on this list if it teaches at least one course
         matching the path. For 'ug' and 'pg' every university here qualifies,
         and saying so honestly is the point: the count stays 6 because all six
         really do offer both. 'online' genuinely narrows it, because LPU and
         IGNOU teach in distance mode. What changes in every case is what each
         card leads with and what Apply preselects. */
      &&(!coursePath||coursesOf(x).some(c=>matchesPath(c,coursePath)))
      &&matchesStream(x,stream)
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
      (b.featured?1:0)-(a.featured?1:0)),
  [type,sort,max,must,initial,isJobs,city,sector,here,coursePath,stream,abroad]);

  /* Non-null when the emptiness is the catalogue's rather than the filters'.
     Measured against `initial` — every row the vertical holds, before a single
     sidebar filter — so it can only say "nothing published" when that is
     literally true. */
  const unpublished=data.length===0&&stream&&!initial.some(x=>matchesStream(x,stream))?`${stream.toLowerCase()} colleges`
    :data.length===0&&abroad&&!initial.some(isAbroad)?'colleges outside India'
    :null;

  /* The pop-up recommendation the location prompt earns: the three closest
     roles, plus how many sit inside a realistic daily commute. */
  const nearby=useMemo(()=>{
    if(!here)return null;
    const withKm=initial.map(j=>({...j,km:jobKm(j,here)}));
    const commutable=withKm.filter(j=>j.km!=null&&j.km<=60);
    return {
      top:withKm.filter(j=>j.km!=null).sort((a,b)=>a.km-b.km).slice(0,3),
      commutable:commutable.length,
      remote:withKm.filter(j=>j.wfh).length
    };
  },[here,initial]);

  /* A popover, not a modal: Escape dismisses it and focus starts inside, but
     the tab is not trapped — the results behind it stay reachable. */
  const nearbyRef=useDialogA11y(isJobs&&nearbyOpen&&!!nearby,()=>setNearbyOpen(false),{trap:false});

  const sortOptions=isJobs
    ?[...(here?['Nearest first']:[]),'Recommended','Newest first','Salary: high to low','Salary: low to high','Rating']
    :['Recommended','Price: low to high','Price: high to low','Rating'];

  const allCities=useMemo(()=>isJobs?jobCities(initial):[],[isJobs,initial]);
  const allSectors=useMemo(()=>isJobs?jobSectors(initial):[],[isJobs,initial]);
  const cityChips=useMemo(()=>['All',...(isJobs?topJobCities(initial).slice(0,6):[])],[isJobs,initial]);
  const activeFilters=[type!=='All'&&type,city!=='All'&&city,sector!=='All'&&sector,...must].filter(Boolean);
  /* What the collapsed filter summary reports. `activeFilters` is the jobs
     chip row and deliberately omits the cost ceiling because there is no chip
     for it; the summary must not, or a closed panel could be filtering on a
     slider nobody can see. */
  const activeCount=activeFilters.length+(max<limit?1:0);

  return <main id="main" tabIndex={-1} className={isJobs?'listing-page jobs-listing':'listing-page'}>

    {isJobs?<section className="tool-hero jobs-hero">
      <picture>
        <source type="image/webp" media="(max-width:900px)" srcSet="/career-editorial-900.webp"/>
        <source type="image/webp" srcSet="/career-editorial-full.webp"/>
        <img src="/career-editorial.png" alt="Young professionals starting work in an Indian office" decoding="async"/>
      </picture>
      <span className="hero-shade" aria-hidden="true"/>
      <div className="container tool-hero-copy">
        <span className="kicker">BEROJGAR BHARAT · VERIFIED HIRING</span>
        <h1>Work you can reach.<br/><em>Salary you can see.</em></h1>
        <p>Every posting names the employer, the city and the actual pay band. Filter by the place you can travel to — or let us find the openings closest to you.</p>
        <div className="tool-hero-cta">
          <button className="btn primary" onClick={askLocation} disabled={geo.state==='asking'}>
            <LocateFixed/>{geo.state==='asking'?'Finding you…':geo.state==='ok'?'Update my location':'Jobs near me'}
          </button>
          <a className="btn ghost" href="#results">Browse {count(initial.length)} openings<ArrowRight/></a>
        </div>
        <div className="hero-pills">
          <span><ShieldCheck/>{count(initial.filter(j=>j.approval.some(a=>/verified/i.test(a))).length)} verified employers</span>
          <span><Wifi/>{count(initial.filter(j=>j.wfh).length)} work from home</span>
          <span><Flame/>{count(initial.filter(j=>(j.postedDays??99)<=7).length)} posted this week</span>
        </div>
      </div>
    </section>
    :<PageHero
      photo="campus-editorial"
      alt="Students on an Indian university campus"
      kicker={`${V[vertical].label.toUpperCase()} · RESEARCHED, NOT RANKED BY ADS`}
      title={vertical==='colleges'
        ?<>Medical colleges,<br/><em>compared on the real numbers.</em></>
        :<>Recognised degrees,<br/><em>studied on your schedule.</em></>}
      lead={vertical==='colleges'
        ?'Total cost, seat count, approval body and cut-off — side by side, from the records we keep rather than the brochures colleges send.'
        :'UGC-entitled online and distance programmes with the fee, the approval and the exam mode stated up front. Filter it down, then shortlist.'}
      pills={<>
        <span><ShieldCheck/>{count(data.length)} verified {vertical==='colleges'?'colleges':'universities'}</span>
        <span><Scale/>Compare up to 3 side by side</span>
        <span><Clock3/>Updated every admission cycle</span>
      </>}>
      <a className="btn primary tactile" href="#results">Browse {count(data.length)} results<ArrowRight/></a>
      <button className="btn ghost" onClick={()=>setLead({title:'Talk to a DCW counsellor',interest:vertical})}>Talk to a counsellor</button>
    </PageHero>}

    {isJobs&&<div className="container locator">
      <div className="locator-head">
        <span className="kicker"><MapPin/>WHERE DO YOU WANT TO WORK?</span>
        {/* A persistent live region, not one created on demand: the whole
            paragraph below is swapped when geolocation resolves, and a live
            region that appears at the same moment as its content is announced
            unreliably. Pressing "Use my location" re-sorts all twenty cards to
            "Nearest first" — a large change that was, until this wrapper,
            completely silent to a screen reader. `polite` because it follows a
            deliberate button press and must not interrupt. */}
        <div className="locator-msg" role="status">
        {geo.state==='ok'
          ?<p className="locator-live"><span className="pulse" aria-hidden="true"/>Closest to <b>{geo.label}</b> · {nearby?.commutable??0} within a 60&nbsp;km commute<button className="linkish" onClick={clearLocation}>Clear</button></p>
          :geo.state==='denied'?<p className="locator-note">Location is off, so pick your city below — nothing else changes.</p>
          :geo.state==='error'?<p className="locator-note">We could not read your location. Pick your city below instead.</p>
          :geo.state==='unsupported'?<p className="locator-note">This browser cannot share a location. Pick your city below.</p>
          :<p className="locator-note">Pick a city, or share your location once and we will rank every opening by how far it actually is.</p>}
        </div>
      </div>
      <div className="locator-row">
        <div className="city-chips" role="group" aria-label="Filter by city">
          {cityChips.map(c=><button key={c} type="button" aria-pressed={city===c}
            className={city===c?'chip on':'chip'} onClick={()=>setCity(c)}>
            {c==='Remote'&&<Wifi/>}{c==='All'?`All cities`:c}
            <small>{c==='All'?initial.length:initial.filter(j=>j.city===c).length}</small>
          </button>)}
        </div>
        <button className={geo.state==='ok'?'btn outline small locate on':'btn outline small locate'}
          onClick={askLocation} disabled={geo.state==='asking'}>
          <LocateFixed/>{geo.state==='asking'?'Finding you…':geo.state==='ok'?'Located':'Use my location'}
        </button>
      </div>
    </div>}

    <div className="container listing-layout" id="results">
      <aside className="filters" data-open={filtersOpen?'yes':'no'}>
        <div className="filter-title">
          <b><Filter/>Filters</b>
          {/* Only rendered as a control below 940px; above it the label is the
              panel's own heading and this button is display:none. The count
              travels with the summary so a closed panel never hides the fact
              that something is filtering the list. */}
          <button type="button" className="filter-toggle" aria-expanded={filtersOpen} aria-controls="filter-body"
            onClick={()=>setFiltersOpen(o=>!o)}>
            {filtersOpen?'Hide':'Show'}{activeCount>0?` · ${activeCount}`:''}
          </button>
          <button onClick={reset}>Reset</button>
        </div>
        <div className="filter-body" id="filter-body">
        {isJobs&&<label>City<select value={city} onChange={e=>setCity(e.target.value)}>
          <option>All</option>{allCities.map(c=><option key={c}>{c}</option>)}
        </select></label>}
        {isJobs&&<label>Industry<select value={sector} onChange={e=>setSector(e.target.value)}>
          <option>All</option>{allSectors.map(c=><option key={c}>{c}</option>)}
        </select></label>}
        <label>{isJobs?'Job type':'Type'}<select value={type} onChange={e=>setType(e.target.value)}>
          <option>All</option>
          {isJobs?<><option>Full-time</option><option>Part-time</option><option>Internship</option></>
                 :<><option>Private</option><option>Government</option><option>Deemed</option></>}
        </select></label>
        <label>{isJobs?'Maximum annual salary':'Maximum total cost'}
          <input type="range" min="0" max={limit} step={isJobs?10000:100000} value={max} onChange={e=>setMax(+e.target.value)}/>
          <span>Up to {fmt(max)}</span>
        </label>
        <div className="check-list"><b>Must have</b>
          {MUSTS.map(x=><label key={x}><input type="checkbox" checked={must.includes(x)}
            onChange={()=>setMust(s=>s.includes(x)?s.filter(y=>y!==x):[...s,x])}/>{x}</label>)}
        </div>
        </div>
      </aside>

      <div className="results">
        <div className="results-head">
          <h2 className="rh-count"><b>{count(data.length)}</b> matching {(isJobs?'opening':'result')+(data.length===1?'':'s')}{isJobs&&city!=='All'?` in ${city}`:''}{coursePath?` offering ${PATHS[coursePath].toLowerCase()}`:''}{stream?` offering ${stream}`:''}{abroad?' outside India':''}</h2>
          <label>Sort by<select value={sort} onChange={e=>setSort(e.target.value)}>
            {sortOptions.map(o=><option key={o}>{o}</option>)}
          </select></label>
        </div>
        {(coursePath||stream||abroad)&&<div className="active-filters">
          {coursePath&&<span>{PATHS[coursePath]}</span>}
          {stream&&<span>{stream}</span>}
          {abroad&&<span>{ABROAD_LABEL}</span>}
          {/* Clearing navigates rather than setting state, because these
              filters live in the URL: dropping them from state alone would
              leave the address bar claiming a filter that is no longer
              applied. */}
          <button className="linkish" onClick={()=>go(isColleges?'/colleges/search':'/distance/universities')}>
            {isColleges?'Show all colleges':'Show all universities'}
          </button>
        </div>}
        {isJobs&&activeFilters.length>0&&<div className="active-filters">
          {activeFilters.map(f=><span key={f}>{f}</span>)}
          <button className="linkish" onClick={reset}>Clear all</button>
        </div>}
        {/* Four outcomes, not two: still loading, failed, loaded-but-filtered-to-
            nothing, and results. The middle two used to be indistinguishable. */}
        <CatalogGrid catalog={catalog} skeleton={4}
          empty={<EmptyState title="Nothing listed here yet"
            body={isJobs?'No openings are live for this vertical right now.':'No institutions are published for this vertical right now.'}/>}>
          {data.length
            /* {...ctx} first: it carries a `path` of its own — the router pathname —
               and a spread placed after an explicit prop silently overwrites it.
               That is exactly how the crash below was introduced, so the
               narrowing prop is named `coursePath` and set last. */
            ?data.map(x=><EntityCard key={x.id} item={x} {...ctx} coursePath={coursePath}/>)
            /* Two different emptinesses, and conflating them would mislead.
               "Reset filters" is the right advice only when the catalogue does
               hold something for this stream and the sidebar removed it. When
               the catalogue holds nothing of the kind at all, resetting will
               not produce a single row, and saying so is the only honest
               answer — the demo catalogue publishes medical and engineering
               colleges, and a Law card that pretended otherwise would be the
               fabrication this work is not allowed to make. */
            :unpublished
              ?<EmptyState title={`No ${unpublished} listed yet`}
                 body={`We publish every college we have checked, and none of them is ${unpublished==='colleges outside India'?'outside India':`a ${stream.toLowerCase()} college`} yet. A counsellor can tell you what is opening for the next intake.`}
                 actionLabel="See every college" onAction={()=>go('/colleges/search')}/>
              :<EmptyState title="No exact matches" body="Adjust the filters or reset them to see every option." actionLabel="Reset filters" onAction={reset}/>}
        </CatalogGrid>
      </div>
    </div>

    {isJobs&&nearbyOpen&&nearby&&<div className="nearby-pop" ref={nearbyRef} role="dialog" aria-label="Jobs near you">
      <div className="np-head">
        <span className="kicker"><Navigation/>NEAR YOU</span>
        <button aria-label="Dismiss nearby jobs" onClick={()=>setNearbyOpen(false)}><X/></button>
      </div>
      <p>Closest to <b>{geo.label}</b>. {nearby.commutable} {nearby.commutable===1?'opening is':'openings are'} within 60&nbsp;km, plus {nearby.remote} you can do from home.</p>
      <ul className="np-list">
        {nearby.top.map(j=><li key={j.id}>
          <span className="np-mark" aria-hidden="true">{j.mark}</span>
          <span className="np-copy"><b>{j.name}</b><small>{j.company} · {j.area?`${j.area}, `:''}{j.city}</small></span>
          <span className="np-km">{j.km<1?'<1':Math.round(j.km)}<small>km</small></span>
        </li>)}
      </ul>
      <div className="np-foot">
        <button className="btn primary small" onClick={()=>{setSort('Nearest first');setNearbyOpen(false);document.getElementById('results')?.scrollIntoView({behavior:'smooth'})}}>See all nearby<ArrowRight/></button>
        <button className="btn outline small" onClick={()=>setNearbyOpen(false)}>Not now</button>
      </div>
    </div>}
  </main>;
}
function Detail(ctx){const {entity,vertical,setLead,toggleSave,saved,toggleCompare,compare}=ctx;return <main id="main" tabIndex={-1} className="detail-page"><div className="container breadcrumbs">Home <ChevronRight/> {V[vertical].label} <ChevronRight/> <b>{entity.name}</b></div><section className="detail-banner"><picture>
  <source type="image/webp" media="(max-width:900px)" srcSet={vertical==='jobs'?'/career-editorial-900.webp':'/campus-editorial-900.webp'}/>
  <source type="image/webp" srcSet={vertical==='jobs'?'/career-editorial-full.webp':'/campus-editorial-full.webp'}/>
  <img src={vertical==='jobs'?'/career-editorial.png':'/campus-editorial.png'} alt="" decoding="async"/>
</picture><span className="hero-shade" aria-hidden="true"/><div className="container db-copy">
  <span className="db-kicker">{vertical==='jobs'?'Hiring now':vertical==='colleges'?'Campus profile':'Recognised institution'}</span>
  {/* Deliberately not a heading. This band names the employer (or, for a
      college, a shortened form of the page title) over the hero image, and it
      renders above the <h1>. As an <h2> it put a level-2 heading ahead of the
      page's own title in the outline, so anyone navigating by heading met a
      section before they met the page. The employer is still reachable as
      text — it is the "Employer" row of the role facts list — so nothing is
      lost by taking this out of the outline. */}
  <span className="db-name">{vertical==='jobs'?entity.company||entity.place.split(' \u2022 ')[0]:entity.name.replace(/ (University|Online).*$/,'')}</span>
  <p><MapPin/>{vertical==='jobs'?<>{entity.wfh?'Work from home':`${entity.area?entity.area+', ':''}${entity.city}`} · {entity.sector}</>:<>{entity.place} · {entity.mode}</>}</p>
</div></section><section className="container detail-hero"><span className="entity-mark large">{entity.mark}</span><div className="detail-copy"><span className="verified"><ShieldCheck/>{entity.approval.join(' • ')}</span><h1>{entity.name}</h1><p><MapPin/>{entity.place} · {entity.type}</p><div className="detail-tags"><span><Star/> {entity.rating} ({entity.reviews} reviews)</span><span><CalendarDays/> {entity.deadline}</span><span><Clock3/> Updated today</span></div></div><div className="detail-action"><small>{vertical==='jobs'?'SALARY':'STARTING FROM'}</small><b>{vertical==='jobs'?entity.duration:fmt(entity.fee)}{entity.mrp&&<s className="mrp">{fmt(entity.mrp)}</s>}</b><button className="btn primary" onClick={()=>setLead({mode:'apply',title:`Apply to ${entity.name}`,interest:entity.id,interestType:vertical==='jobs'?'job':'course',course:vertical==='jobs'?entity.name:coursesOf(entity)[0].name,courses:vertical==='jobs'?null:coursesOf(entity).map(c=>c.name),where:entity.place})}>Apply now<ArrowRight/></button><button className="btn outline" onClick={()=>setLead({title:`Talk about ${entity.name}`,interest:entity.id})}>Request a callback<MessageCircle/></button><button className="btn outline" onClick={()=>toggleSave(entity.id)}>{saved.includes(entity.id)?'Saved':'Save for later'}<Heart/></button></div></section><nav className="anchor-nav"><div className="container"><a href="#overview">Overview</a><a href="#fees">{vertical==='jobs'?'Role details':'Courses & fees'}</a><a href="#proof">{vertical==='jobs'?'Company':'Approvals'}</a><a href="#process">Process</a><a href="#faq">FAQs</a></div></nav><div className="container detail-layout"><div><section id="overview" className="detail-section"><span className="kicker">AT A GLANCE</span><h2>{vertical==='jobs'?'A clear role with a clear starting point':'Everything important, without the brochure language'}</h2><p>{vertical==='jobs'?`This ${entity.type.toLowerCase()} opportunity is open to ${entity.course}. The salary range is disclosed and the employer has been verified by the DCW jobs team.`:`${entity.name} offers ${entity.course} in ${entity.mode.toLowerCase()} mode. We show the total fee, approval status, expected duration and deadline together so you can make a practical comparison.`}</p><div className="fact-grid"><span><small>Mode</small><b>{entity.mode}</b></span><span><small>Duration / salary</small><b>{entity.duration}</b></span><span><small>Deadline</small><b>{entity.deadline}</b></span><span><small>Student support</small><b>Dedicated mentor</b></span></div></section><section id="fees" className="detail-section"><span className="kicker">TRANSPARENT NUMBERS</span><h2>{vertical==='jobs'?'Role, requirements and benefits':'Course-wise fee structure'}</h2>{vertical==='jobs'?<div className="role-panel"><div className="rp-main"><h3>What you will actually do</h3><ul>{dutiesOf(entity).map(d=><li key={d}><Check/>{d}</li>)}</ul><div className="rp-pay"><span><small>MONTHLY PAY</small><b>{entity.duration}</b></span><span><small>ANNUAL (INDICATIVE)</small><b>{fmt(entity.fee)}</b></span><span><small>OPENINGS</small><b>{entity.emi}</b></span></div></div><dl className="rp-facts"><div><dt>Employer</dt><dd>{entity.company||entity.place.split(' \u2022 ')[0]}</dd></div><div><dt>Where</dt><dd>{entity.wfh?'Work from home':`${entity.area?entity.area+', ':''}${entity.city}`}</dd></div><div><dt>Industry</dt><dd>{entity.sector}</dd></div><div><dt>Shift / mode</dt><dd>{entity.mode}</dd></div><div><dt>Eligibility</dt><dd>{entity.course}</dd></div><div><dt>Interview</dt><dd>In-person or video · no fee</dd></div></dl></div>:<div className="course-table" role="table" aria-label="Courses, fees and how to apply"><div className="ct-head" role="row"><span role="columnheader">Course</span><span role="columnheader">Duration</span><span role="columnheader">Total fee</span><span role="columnheader"><span className="sr-only">Apply</span></span></div>{coursesOf(entity).map(c=><div className="ct-row" role="row" key={c.name}><span role="cell"><b>{c.name}</b>{c.note&&<small>{c.note}</small>}</span><span role="cell" data-lbl="Duration">{c.duration}</span><span role="cell" data-lbl="Total fee"><b>{fmt(c.fee)}</b>{c.mrp&&<s className="mrp">{fmt(c.mrp)}</s>}</span><span role="cell"><button className="btn primary small" onClick={()=>setLead({mode:'apply',title:`Apply to ${entity.name}`,interest:entity.id,interestType:'course',course:c.name,courses:coursesOf(entity).map(x=>x.name),where:entity.place})}>Apply<ArrowRight/></button></span></div>)}</div>}<p className="note"><ShieldCheck/> Indicative demo data. Verify the final offer with the institution or employer.</p></section><section id="proof" className="detail-section"><span className="kicker">VERIFICATION</span><h2>Proof you can inspect</h2><div className="proof-cards">{entity.approval.map(x=><button key={x} onClick={()=>ctx.notify(`${x} document preview opened`)}><FileText/><span><b>{x}</b><small>{vertical==='jobs'?'Declared by the employer':'Approval held on record'}</small></span><ExternalLink/></button>)}</div></section><section id="process" className="detail-section"><span className="kicker">WHAT HAPPENS NEXT</span><h2>A simple, visible process</h2><ol className="steps">{(vertical==='jobs'?['Apply with your basic profile','Get interview details on WhatsApp','Attend and track your status']:['Speak with a counsellor','Check eligibility and documents','Submit to the institution','Track your application']).map((x,i)=><li key={x}><span>0{i+1}</span><b>{x}</b></li>)}</ol></section><section id="faq" className="detail-section"><span className="kicker">COMMON QUESTIONS</span><h2>Before you decide</h2><Accordion title="Is this information verified?">Our research team checks approvals, fees and key facts against official sources each admission cycle. This prototype uses clearly marked indicative data.</Accordion><Accordion title="Does counselling cost anything?">No. DCW discovery and counselling are free for students.</Accordion><Accordion title="Can I save this and decide later?">Yes. Saved items remain available on this device.</Accordion></section></div><aside className="side-card"><span className="kicker">YOUR SHORTLIST</span><h3>Compare before you decide</h3><p>Add up to three options and see fees, duration, approvals and ratings together.</p>{vertical!=='jobs'&&<button className="btn outline" onClick={()=>toggleCompare(entity.id)}>{compare[vertical].includes(entity.id)?'Remove from compare':'Add to compare'}</button>}<button className="btn primary" onClick={()=>setLead({title:`Talk about ${entity.name}`,interest:entity.id})}>Talk to a counsellor</button></aside></div></main>}
function AskDCW({open,setOpen,vertical,go,setLead,compare}){const [view,setView]=useState('home');const actions=vertical==='jobs'?[['Find matching jobs','jobs'],['Improve my resume','resume'],['Check application status','status']]:vertical==='colleges'?[['Predict from my NEET rank','predict'],['Compare two colleges','compare'],['Talk to a counsellor','human']]:[['Find my best program','find'],['Compare two choices','compare'],['Check board validity','boards']];const choose=id=>{if(id==='jobs'||id==='find'){setOpen(false);go(vertical==='jobs'?'/jobs/search':'/distance/universities')}else if(id==='resume'){setOpen(false);go('/jobs/resume-builder')}else if(id==='status'){setOpen(false);go('/applications')}else if(id==='predict'){setOpen(false);go('/colleges/neet-predictor')}else if(id==='compare'){if(compare[vertical].length>=2){setOpen(false);go(`/${vertical}/compare`)}else setView('need-compare')}else if(id==='boards'){setOpen(false);go('/distance/boards')}else {setOpen(false);setLead({title:'Talk to a DCW counsellor',interest:vertical})}};return <div className={`bot-wrap ${open?'open':''}`}>{open&&<section className="bot-panel glass"><header><span><MessageCircle/><b>Ask DCW</b><small>Rule-based demo assistant</small></span><button aria-label="Close assistant" onClick={()=>setOpen(false)}><X/></button></header><div className="bot-body">{view==='home'?<><div className="bot-message">Hi—what would make your next decision easier?</div>{actions.map(x=><button className="bot-action" key={x[1]} onClick={()=>choose(x[1])}><span>{x[0]}</span><ArrowRight/></button>)}</>:<><div className="bot-message">Add at least two choices from the listing. I’ll keep them in a comparison tray for you.</div><button className="bot-action" onClick={()=>{setOpen(false);go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}}>Browse choices<ArrowRight/></button><button className="bot-reset" onClick={()=>setView('home')}><RotateCcw/>Back</button></>}</div><footer><ShieldCheck/> Indicative guidance • Human handoff available</footer></section>}<button className="bot-launch tactile" aria-label="Ask DCW assistant" onClick={()=>{setOpen(!open);setView('home')}}><MessageCircle/><i/></button></div>}
function SearchPanel({vertical,setSearchOpen,query,setQuery,go,catalog}){const [active,setActive]=useState(0);const dialogRef=useDialogA11y(true,()=>setSearchOpen(false));const pool=catalog.rows;const results=query?pool.filter(x=>`${x.name} ${x.course} ${x.place}`.toLowerCase().includes(query.toLowerCase())):pool.slice(0,3);const open=x=>{setSearchOpen(false);go(vertical==='distance'?`/distance/university/${x.id}`:vertical==='colleges'?`/colleges/college/${x.id}`:`/jobs/${x.id}`)};useEffect(()=>{const key=e=>{if(e.key==='Escape')setSearchOpen(false);if(e.key==='ArrowDown'){e.preventDefault();setActive(x=>Math.min(x+1,results.length-1))}if(e.key==='ArrowUp'){e.preventDefault();setActive(x=>Math.max(x-1,0))}if(e.key==='Enter'&&results[active]){e.preventDefault();open(results[active])}};addEventListener('keydown',key);return()=>removeEventListener('keydown',key)},[results,active]);const chips=vertical==='distance'?['MBA','BCA','IGNOU','Delhi']:vertical==='colleges'?['MBBS','Patna','Government','Manipal']:['Fresher','Patna','Remote','Accounts'];return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSearchOpen(false)}}><div className="command" ref={dialogRef} role="dialog" aria-label={`Search ${V[vertical].label}`}><div className="command-input"><Search/><input autoFocus value={query} onChange={e=>{setQuery(e.target.value);setActive(0)}} placeholder="Search by course, institution, role or city"/><button aria-label="Close search" onClick={()=>setSearchOpen(false)}><X/></button></div><div className="intent-chips"><span>{query?'MATCHING RESULTS':'POPULAR RIGHT NOW'}</span>{chips.map(x=><button key={x} onClick={()=>{setQuery(x);setActive(0)}}>{x}</button>)}</div><div className="command-results">{results.length?results.map((x,i)=><button className={active===i?'active':''} key={x.id} onMouseEnter={()=>setActive(i)} onClick={()=>open(x)}><span className="entity-mark">{x.mark}</span><span><b>{x.name}</b><small>{x.course} · {x.place}</small></span><ArrowRight/></button>):<div className="empty"><Search/><h3>Nothing exact yet</h3><p>Try a broader keyword or explore the complete listing.</p><button className="btn primary" onClick={()=>{setSearchOpen(false);go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}}>Browse everything</button></div>}</div><footer><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>ENTER</kbd> Open · <kbd>ESC</kbd> Close</span></footer></div></div>}
/* One flow serves both an enquiry and a course application. `lead.mode==='apply'`
   switches the language and adds the course selector; everything downstream —
   OTP, CRM payload, the Applications list — is the same pipeline, so an
   application is never a second, weaker code path. */
/* Stored with the lead, so the record carries the wording that was shown
   rather than a bare boolean nobody can audit later. */
const CONSENT_TEXT='I agree that DCW may contact me by phone, SMS or WhatsApp about this enquiry.';
/* Focus on the success step.

   Steps 0 and 1 each autoFocus an input, so the browser keeps focus inside the
   dialog as the user moves through them. Step 2 has no input, so when the
   "Verify & submit" button unmounted, focus fell to <body> — outside a dialog
   that is still open and still aria-modal="true". That is the worst place to
   lose it: aria-modal tells assistive tech to ignore everything outside the
   dialog, so the user was left with focus in a region their screen reader has
   been told not to read, nothing announced, and the "Done" button unreachable
   without knowing to press Escape.

   Focusing the heading moves focus back inside and announces "Application
   submitted" — which is also the confirmation the step exists to deliver, so
   no separate live region is needed. */
function LeadFlow({lead,vertical,close,notify}){const applying=lead.mode==='apply';const [course,setCourse]=useState(lead.course||'');const [step,setStep]=useState(0),[name,setName]=useState(''),[phone,setPhone]=useState(''),[qualification,setQualification]=useState('12th pass / appearing'),[otp,setOtp]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[demoCode,setDemoCode]=useState(''),[result,setResult]=useState(null),[consent,setConsent]=useState(false),[waOptIn,setWaOptIn]=useState(false);
const doneRef=useRef(null);
useEffect(()=>{if(step===2)doneRef.current?.focus();},[step]);
// Escape is ignored while a request is in flight: closing mid-submit would
// lose the reference number the person needs.
const dialogRef=useDialogA11y(true,()=>{if(!busy)close()});
/* `busy` drives the disabled state and aria-busy, but it cannot *prevent* a
   double submit: setBusy is a state update, so the button's disabled prop is
   only applied on the next render. Clicks dispatched in the same tick — a
   double-click, an impatient triple-tap, a screen reader firing twice — all get
   through, and each one sends its own request. Measured before this guard: three
   clicks on "Send verification code" made three /api/otp/send calls, burning
   three of the five codes a number is allowed in an hour; three clicks on submit
   made the losing two fail with "Request a code first" (the OTP is single-use),
   which painted a role="alert" error banner over the success screen the winner
   had just produced. A ref is read and written synchronously, so it closes the
   window that state cannot. */
const inFlight=useRef(false);
/* The three fields below carry `autoComplete` because they ask the person for
   their own name, their own number and a code sent to their own handset. That
   is WCAG 1.3.5 Identify Input Purpose, an AA criterion: a field collecting
   information *about the user* has to say which information it is, in a token a
   machine can read, so a browser, a password manager or an assistive tool can
   fill it. A wrapping <label> names the field for a person; it tells software
   nothing about purpose. Before this the whole public site had autoComplete on
   exactly two inputs, both on the admin login page.
   It is also the difference between typing ten digits on a phone keypad and
   tapping one suggestion. `tel-national` rather than `tel` because the field
   holds ten digits with no country code, and phoneDigits() strips anything a
   fuller token would offer. `one-time-code` on the OTP field is the token iOS
   and Android watch for to surface the SMS code above the keyboard — inert in
   demo mode, where the code is printed on screen and no SMS is sent, and
   correct the moment a real sender is wired in. */
/* A dropped connection surfaces as a TypeError whose message is "Failed to
   fetch" — accurate for a developer, meaningless to a student on a patchy
   mobile connection, and it lands in a role="alert" banner that a screen reader
   reads out. Everything else here already carries a written message from the
   server, so only the transport failure needs translating. */
const api=async(url,body)=>{let r;try{r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})}catch{throw new Error('Could not reach DCW. Check your internet connection and try again — nothing has been sent yet.')}const j=await r.json().catch(()=>null);if(!r.ok||!j||j.ok===false)throw new Error((j&&j.message)||`Request failed (${r.status})`);return j.data};
const source=()=>{const p=new URLSearchParams(window.location.search);return{url:window.location.pathname,device:window.matchMedia('(max-width:760px)').matches?'mobile':'desktop',utm_source:p.get('utm_source'),utm_medium:p.get('utm_medium'),utm_campaign:p.get('utm_campaign')}};
const sendCode=async()=>{if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');try{const d=await api('/api/otp/send',{phone});setDemoCode(d.demoCode||'');setOtp('');setStep(1)}catch(e){setError(e.message)}finally{inFlight.current=false;setBusy(false)}};
const verifyAndSubmit=async()=>{if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');try{await api('/api/otp/verify',{phone,code:otp});const d=await api('/api/leads',{vertical,name:name.trim(),phone,phoneVerified:true,whatsappSame:waOptIn,consent:{contact:consent,whatsapp:waOptIn,text:CONSENT_TEXT,at:new Date().toISOString()},qualification,interestType:lead.interestType||'general',interestId:lead.interest||null,course:course||undefined,associateCode:new URLSearchParams(window.location.search).get('ref'),source:source()});setResult(d);const record={id:d.lead.crmLeadId,name:name.trim(),phone,qualification,interest:lead.interest,course:course||null,kind:applying?'Application':'Enquiry',title:lead.title,createdAt:new Date().toISOString(),status:d.lead.status};const current=JSON.parse(localStorage.getItem('dcw-enquiries-v1')||'[]');localStorage.setItem('dcw-enquiries-v1',JSON.stringify([record,...current]));setStep(2)}catch(e){setError(e.message)}finally{inFlight.current=false;setBusy(false)}};
return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)close()}}><div className="lead-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="lead-title"><button aria-label="Close" className="modal-x" onClick={close}><X/></button>{error&&<p className="form-error" role="alert">{error}</p>}{step===0&&<><span className="kicker">{applying?<><FileText/>FREE APPLICATION SUPPORT</>:<>FREE &bull; NO PRESSURE</>}</span><h2 id="lead-title">{lead.title}</h2><p>{applying?'Pick your course and share the basics. A DCW counsellor checks your eligibility and submits the application with you — there is no application fee to DCW.':'Share the basics so the right DCW counsellor can understand your goal.'}</p>{applying&&lead.where&&<div className="lead-context"><MapPin/><span>{lead.where}</span></div>}{applying&&lead.courses&&lead.courses.length>1&&<label>Course you want to apply for<select value={course} onChange={e=>setCourse(e.target.value)}>{lead.courses.map(c=><option key={c}>{c}</option>)}</select></label>}<label>Full name<input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/></label><label>10-digit mobile number<input value={phone} onChange={e=>setPhone(phoneDigits(e.target.value))} inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210"/></label><label>Current qualification<select value={qualification} onChange={e=>setQualification(e.target.value)}><option>12th pass / appearing</option><option>Graduate</option><option>10th pass</option></select></label><div className="consent-block"><label className="check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} aria-describedby="consent-why"/><span>{CONSENT_TEXT}</span></label><label className="check"><input type="checkbox" checked={waOptIn} onChange={e=>setWaOptIn(e.target.checked)}/><span>Also send updates about this enquiry on WhatsApp. Optional.</span></label><p className="consent-why" id="consent-why">We cannot pass your details to a counsellor without the first permission. You can withdraw either at any time.</p></div><button disabled={busy||name.trim().length<2||phone.length!==10||!consent} aria-busy={busy} className="btn primary full" onClick={sendCode}>{busy?'Sending code…':'Send verification code'}{!busy&&<ArrowRight/>}</button><small>Demo mode: the code is shown on screen and no SMS is sent.</small></>}{step===1&&<><span className="kicker">VERIFY MOBILE</span><h2 id="lead-title">Enter the 6-digit code</h2><p>Sent to {phone}. {demoCode&&<>Demo code: <b>{demoCode}</b></>}</p><label>6-digit code<input autoFocus value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code"/></label><button disabled={busy||otp.length!==6} aria-busy={busy} className="btn primary full" onClick={verifyAndSubmit}>{busy?'Verifying…':applying?'Verify & submit application':'Verify & send enquiry'}{!busy&&<Check/>}</button><button className="text-btn" disabled={busy} onClick={()=>{setError('');setStep(0)}}>Change details</button></>}{step===2&&<div className="success"><span><Check/></span><h2 id="lead-title" ref={doneRef} tabIndex={-1}>{applying?'Application submitted':'Enquiry sent'}</h2><p>{result?.duplicate?'We already had your number on file, so this was added to your existing record.':applying?`Your application${course?` for ${course}`:''} is with a DCW counsellor, who will confirm your documents before it goes to the institution.`:'Your enquiry is with a DCW counsellor.'} Reference <b>{result?.lead?.crmLeadId}</b>{result?.lead?.assignedTo&&<> &bull; assigned to {result.lead.assignedTo}</>}</p><p className="muted-note">Demo mode: no real SMS, WhatsApp or CRM record was created.</p><button className="btn primary" onClick={()=>{notify(applying?'Application saved to Applications':'Enquiry saved to Applications');close()}}>Done</button></div>}</div></div>}
function CompareTray({vertical,compare,go}){return <div className="compare-tray glass-dark"><span><b>{compare[vertical].length} of 3 selected</b><small>{compare[vertical].length<2?'Add one more for a useful comparison':'Ready to compare side by side'}</small></span><button disabled={compare[vertical].length<2} onClick={()=>go(`/${vertical}/compare`)}>Compare now<ArrowRight/></button></div>}
function MobileNav({vertical,go,setSearchOpen,path}){return <nav className="mobile-nav" aria-label="Mobile navigation"><button className={path===`/${vertical}`?'active':''} onClick={()=>go(`/${vertical}`)}><Home/>Home</button><button className={path?.includes('search')||path?.includes('universities')?'active':''} onClick={()=>go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}><Search/>Explore</button><button className="mobile-main" onClick={()=>setSearchOpen(true)}><Search/>Search</button><button className={path==='/saved'?'active':''} onClick={()=>go('/saved')}><Heart/>Saved</button><button className={path==='/profile'?'active':''} onClick={()=>go('/profile')}><UserRound/>Profile</button></nav>}
function Footer({go,vertical}){const brand=V[vertical];return <footer className="footer"><div className="container"><div><div className="brand inverse"><BrandLockup vertical={vertical}/><span><b>{brand.logoAlt}</b><small>Your next move, made visible.</small></span></div><p>Clear education and career decisions for students across India.</p><button className="automation-link" onClick={()=>go('/automations')}><Workflow/>Automation centre</button></div><div><b>Distance</b><button onClick={()=>go('/distance/universities')}>Universities</button><button onClick={()=>go('/distance/boards')}>Board comparison</button></div><div><b>Colleges</b><button onClick={()=>go('/colleges/search')}>Find colleges</button><button onClick={()=>go('/colleges/neet-predictor')}>NEET predictor</button></div><div><b>Jobs</b><button onClick={()=>go('/jobs/search')}>Find jobs</button><button onClick={()=>go('/jobs/resume-builder')}>Resume builder</button></div><div><b>Company</b><button onClick={()=>go('/about')}>About us</button><button onClick={()=>go('/blog')}>Blog</button><button onClick={()=>go('/reviews')}>Reviews</button></div></div><div className="container footer-bottom">© 2026 {brand.legal} <span>Prototype with indicative dummy data</span></div></footer>}
export default App;
