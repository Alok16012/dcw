'use client';
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {useCatalog,useAllCatalogs} from '@/lib/client/catalog.js';
import {useApi} from '@/lib/client/api.js';
import {useDialogA11y} from '@/lib/client/dialog.js';
import {CITY_POS,jobKm,nearestCity,dutiesOf,jobCities,topJobCities,jobSectors,jobTypes} from '@/lib/content/jobs.js';
import {plainFacts} from '@/lib/content/plain.js';
import Image from 'next/image';
import {ArrowRight,ArrowUp,Bookmark,Building2,Check,ChevronLeft,ChevronRight,Clock3,FileText,GraduationCap,Heart,Home,MapPin,Search,ShieldCheck,Sparkles,Star,Users,X,Bell,UserRound,BookOpen,ExternalLink,TrendingUp,CalendarDays,MessageCircle,RotateCcw,Navigation,LocateFixed,Wifi,Flame,Filter,Stethoscope,Plane,Scale,Award,Briefcase,ScrollText,Laptop,Cog,Calculator,Wrench,Workflow,Paperclip,Upload,Trash2,IndianRupee,Phone,Mail,Headset} from 'lucide-react';
import {Plate,CardWash} from '@/components/ui/plate.jsx';
import {SectionTitle,PageHero,Accordion,Photo} from '@/components/ui/primitives.jsx';
import {MarkVerified,MarkCompared,MarkCounsellor,MarkOpenings,MarkThisWeek,MarkEmployers} from '@/components/ui/proof-marks.jsx';
import {CardSkeleton,CatalogError,EmptyState,CatalogGrid,CatalogFallback} from '@/components/discovery/catalog-states.jsx';
import {Repeater,ChipInput} from '@/components/forms/fields.jsx';
import dynamic from 'next/dynamic';
import {coursesOf,matchesPath,PATHS} from '@/lib/content/courses.js';
import {STREAMS,ABROAD_LABEL,readStream,matchesStream,isAbroad} from '@/lib/content/streams.js';
import {fmt,phoneDigits} from '@/lib/format.js';
import {CONTACT,officePlaceUrl,officeDirectionsUrl,officeEmbedUrl} from '@/lib/contact.js';
import {photoFor} from '@/lib/photos.js';
import {ReviewMarquee} from '@/components/editorial/review-marquee.jsx';
import {Credentials} from '@/components/editorial/credentials.jsx';
import {PathCard,EntityCard} from '@/components/discovery/entity-card.jsx';
import {HdNavbar} from '@/components/hd/navbar.jsx';
import {HdHero} from '@/components/hd/hero.jsx';
import {HdStreams,HdFeatured,HdOffers,HdSteps,HdBlog,HdFaq,HdCta} from '@/components/hd/home.jsx';
import {HdFooter} from '@/components/hd/footer.jsx';
import {WhatsAppButton} from '@/components/hd/whatsapp.jsx';
import HdListing from '@/components/hd/listing.jsx';
import HdDetail from '@/components/hd/detail.jsx';
/* One of these renders per URL, so each ships as its own chunk rather than
   riding along in the shell every visitor downloads. Server rendering stays on:
   /about, /blog and /reviews are the pages a stranger reads before deciding
   whether to trust us, and they have to arrive as HTML. */
const Boards=dynamic(()=>import('@/components/tools/boards.jsx'));
const BoardDetail=dynamic(()=>import('@/components/hd/board-detail.jsx'));
const Predictor=dynamic(()=>import('@/components/tools/predictor.jsx'));
const ResumeBuilder=dynamic(()=>import('@/components/tools/resume-builder.jsx'));
const AboutPage=dynamic(()=>import('@/components/hd/about.jsx'));
const BlogPage=dynamic(()=>import('@/components/hd/blog.jsx'));
const ReviewsPage=dynamic(()=>import('@/components/editorial/reviews.jsx'));
const SavedPage=dynamic(()=>import('@/components/account/saved.jsx'));
const ApplicationsPage=dynamic(()=>import('@/components/account/applications.jsx'));
const AccountPage=dynamic(()=>import('@/components/account/account.jsx'));
const ComparePage=dynamic(()=>import('@/components/account/compare.jsx'));
const AutomationCenter=dynamic(()=>import('@/components/account/automations.jsx'));

/* `label`/`sub` are the two-word switcher labels the narrow breakpoints need;
   `navTitle`/`navSub` are the full pair the desktop switcher card shows, and
   `tagline` is the line under the wordmark in the masthead. They are separate
   fields rather than one string split at runtime because the mobile segment has
   room for one short word and the desktop card has room for a sentence. */
const V={distance:{label:'Distance',sub:'Courses Wala',navTitle:'Distance Courses',navSub:'Flexible Learning',tagline:'Padho. Aage Badho. Apne Dum Par.',logoAlt:'Distance Courses Wala',legal:'Distance Courses Wala, Patna',mark:'/distance-mark.png',lockup:'/distance-lockup.png',theme:{'--accent':'#2563EB','--accent-deep':'#1E3A6E','--accent-ink':'#1D4ED8','--accent-solid':'#2563EB','--wash':'#EFF6FF','--spark':'#F7A928','--spark-ink':'#3A2A00','--spark-lift':'#FFD37A','--tint':'#DBEAFE','--mark':"url('/distance-mark.png')"}},colleges:{label:'Colleges',sub:'Colleges Wala',navTitle:'Colleges Wala',navSub:'Find Your College',tagline:'Sahi College. Sahi Faisla.',logoAlt:'Colleges Wala',legal:'Colleges Wala, Patna',mark:'/colleges-mark.png',lockup:'/colleges-lockup.png',theme:{'--accent':'#C1272D','--accent-deep':'#8C1A20','--accent-ink':'#C1272D','--accent-solid':'#C1272D','--wash':'#FBEDEC','--spark':'#1B3B78','--spark-ink':'#FFFFFF','--spark-lift':'#F6C9C4','--tint':'#F3C0BC','--mark':"url('/colleges-mark.png')"}},jobs:{label:'Jobs',sub:'Berojgar Bharat',navTitle:'Berojgar Bharat',navSub:'Jobs & Opportunities',tagline:'Kaam Milega. Zindagi Badlegi.',logoAlt:'Berojgar Bharat',legal:'Berojgar Bharat, Patna',mark:'/jobs-mark.png',lockup:'/jobs-lockup.png',theme:{'--accent':'#E2760F','--accent-deep':'#A5520A','--accent-ink':'#A5520A','--accent-solid':'#A5520A','--wash':'#FDF2E5','--spark':'#5AB436','--spark-ink':'#0C2A05','--spark-lift':'#B6EE99','--tint':'#F8D3A6','--mark':"url('/jobs-mark.png')"}}};
/* The universities, colleges and jobs that used to be pasted here now come from
   lib/data via lib/store.js, over /api — see lib/client/catalog.js. A second
   copy in the browser bundle meant a job posted in /admin was invisible to the
   public listing, and every edit had to be made twice. */
/* The public site needs to know who is looking at it: the utility bar offers
   three different front doors when nobody is signed in, and the account itself
   once somebody is. Kept as a plain fetch rather than the console's api()
   helper so the public bundle does not pull in the admin client. */
/* Rounding to whole KB printed "0 KB" for anything under 512 bytes, which
   reads as a failed attachment rather than a small file. */
const fileSize = b => b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b/1024)} KB` : `${(b/1048576).toFixed(1)} MB`;

function useSession(){const [s,setS]=useState({state:'loading',user:null});
const load=()=>fetch('/api/auth/session',{credentials:'include'}).then(r=>r.json()).then(d=>setS({state:'ready',user:d?.data?.authenticated?d.data.session:null})).catch(()=>setS({state:'ready',user:null}));
useEffect(()=>{let live=true;fetch('/api/auth/session',{credentials:'include'}).then(r=>r.json()).then(d=>{if(live)setS({state:'ready',user:d?.data?.authenticated?d.data.session:null})}).catch(()=>{if(live)setS({state:'ready',user:null})});return()=>{live=false}},[]);
const signOut=async()=>{try{await fetch('/api/auth/logout',{method:'POST',credentials:'include'})}catch{}await load()};
return {...s,signOut}}

function App(){const path=usePathname(),router=useRouter();const vertical=path?.split('/')[1] in V?path.split('/')[1]:'distance';const cfg=V[vertical];const [saved,setSaved]=useState([]),[compare,setCompare]=useState({distance:[],colleges:[],jobs:[]}),[query,setQuery]=useState(''),[searchOpen,setSearchOpen]=useState(false),[lead,setLead]=useState(null),[toast,setToast]=useState(''),[botOpen,setBotOpen]=useState(false);
const [hydrated,setHydrated]=useState(false);
/* Read before write, and the flag below is what enforces the order. This
   component remounts on every route change — it is the body of a catch-all
   page — so localStorage is the only thing carrying a shortlist from one screen
   to the next, and the writer two lines down used to run on mount holding the
   empty initial state and overwrite the entry this reader was about to load.
   Measured before the fix: tick two universities, reload, and both the compare
   tray and Saved came back empty. */
useEffect(()=>{try{setSaved(JSON.parse(localStorage.getItem('dcw-saved-v2')||'[]'));setCompare(JSON.parse(localStorage.getItem('dcw-compare-v2')||'{"distance":[],"colleges":[],"jobs":[]}'))}catch{}setHydrated(true)},[]);
useEffect(()=>{const shortcut=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setSearchOpen(true)}};addEventListener('keydown',shortcut);return()=>removeEventListener('keydown',shortcut)},[]);
useEffect(()=>{if(!hydrated)return;localStorage.setItem('dcw-saved-v2',JSON.stringify(saved));localStorage.setItem('dcw-compare-v2',JSON.stringify(compare))},[saved,compare,hydrated]);
const go=p=>router.push(p);const notify=t=>{setToast(t);setTimeout(()=>setToast(''),2200)};const toggleSave=id=>{setSaved(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);notify(saved.includes(id)?'Removed from saved':'Saved for later')};const toggleCompare=id=>setCompare(c=>{const arr=c[vertical];if(arr.includes(id))return {...c,[vertical]:arr.filter(x=>x!==id)};if(arr.length>=3){notify('Compare supports up to 3 choices');return c}notify('Added to comparison');return {...c,[vertical]:[...arr,id]}});
const auth=useSession();const catalog=useCatalog(vertical);
/* The invitation that opens itself.

   The reference site greets a first-time visitor with an enquiry panel over its
   hero, and that panel is the single thing on it doing the most work: most
   people who fill a form on a coaching site fill the one that was put in front
   of them, not the one they scrolled to find. This does the same job with the
   dialog the site already has — same fields, same OTP, same consent gate, same
   /api/leads — rather than a second form that only looks like one.

   Four conditions, and all of them are about not being a nuisance:
   • Signed in? Then we already have this person's details and a pop-up asking
     for them again is an insult, not an offer.
   • Only on a vertical's front page. Somebody deep in a fee table or halfway
     through the resume builder is doing something; interrupting that loses the
     thing they came for.
   • Never on top of another dialog — search, the assistant, or a lead the
     visitor opened deliberately.
   • Once per tab. The flag is written when the timer fires rather than when the
     form is sent, so closing it counts as an answer and it stays closed.

   The delay is long enough to read the headline and see the three doors first.
   Opening on load, the way the reference does, asks for a phone number from
   someone who does not yet know what we sell. */
const INVITE_KEY='dcw-invite-v1',INVITE_DELAY=8000;
useEffect(()=>{
  if(auth.state!=='ready'||auth.user)return;
  if(path!==`/${vertical}`)return;
  if(lead||searchOpen||botOpen)return;
  try{if(sessionStorage.getItem(INVITE_KEY))return}catch{return}
  const t=setTimeout(()=>{
    try{sessionStorage.setItem(INVITE_KEY,'1')}catch{}
    setLead({title:`Register with ${V[vertical].logoAlt}`,interest:vertical,popup:true});
  },INVITE_DELAY);
  return()=>clearTimeout(t);
},[path,vertical,auth.state,auth.user,lead,searchOpen,botOpen]);
const ctx={path,vertical,cfg,go,saved,toggleSave,compare,toggleCompare,setLead,query,setQuery,setSearchOpen,notify,auth,catalog};
let page;if(path==='/about')page=<AboutPage {...ctx}/>;else if(path?.startsWith('/blog'))page=<BlogPage {...ctx}/>;else if(path==='/reviews')page=<ReviewsPage {...ctx}/>;else if(path==='/saved')page=<SavedPage {...ctx}/>;else if(path==='/applications')page=<ApplicationsPage {...ctx}/>;else if(path==='/notifications')page=<AccountPage type="notifications" {...ctx}/>;else if(path==='/profile')page=<AccountPage type="profile" {...ctx}/>;else if(path==='/automations')page=<AutomationCenter {...ctx}/>;else if(path?.endsWith('/compare'))page=<ComparePage {...ctx}/>;else if(path?.includes('resume-builder'))page=<ResumeBuilder {...ctx}/>;else if(path?.includes('neet-predictor'))page=<Predictor {...ctx}/>;else if(path?.includes('boards'))page=<Boards {...ctx}/>;else if(path?.startsWith('/distance/board/'))page=<BoardDetail {...ctx}/>;else if(path?.includes('universities')||path?.includes('/search')||path?.includes('/list'))page=<HdListing {...ctx}/>;else{
  const id=path?.split('/').pop();
  const entity=catalog.rows.find(x=>x.id===id);
  /* A detail URL carries at least two segments (/jobs/:id, /distance/university/:id).
     Anything shorter is a vertical home, which must render immediately rather
     than waiting on the catalogue. */
  const isDetailRoute=(path?.split('/').filter(Boolean).length??0)>=2;
  page=entity?<HdDetail {...ctx} entity={entity}/>
    :isDetailRoute&&catalog.state!=='ready'?<CatalogFallback catalog={catalog} go={go} vertical={vertical}/>
    :isDetailRoute?<NotFoundPage go={go} vertical={vertical}/>
    :<HomePage {...ctx}/>;
}
return <div className={`app app-${vertical}`} style={cfg.theme}><MotionLayer/><a className="skip-link" href="#main">Skip to main content</a><HdNavbar vertical={vertical} brands={V} path={path} auth={auth} setSearchOpen={setSearchOpen}/>{page}<HdFooter vertical={vertical} brand={cfg} setLead={setLead}/>{compare[vertical].length>0&&!path?.endsWith('/compare')&&<CompareTray {...ctx}/>}<WhatsAppButton brand={cfg}/>{searchOpen&&<SearchPanel {...ctx}/>} {lead&&<LeadFlow lead={lead} vertical={vertical} go={go} close={()=>setLead(null)} notify={notify}/>} {toast&&<div className="toast" role="status"><Check size={17}/>{toast}</div>}</div>}

function MotionLayer(){
  const progressRef=useRef(null);
  const [showTop,setShowTop]=useState(false);
  useEffect(()=>{
    const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}
    }),{threshold:.05,rootMargin:'0px 0px 96px'});
    const register=()=>{
      document.querySelectorAll('main section,.entity-card,.path-card,.detail-section,.automation-grid section,.offer-card,.cat-tile,.proc-step,.cs-rows li').forEach((el,i)=>{
        if(!el.classList.contains('motion-ready')){
          el.classList.add('motion-ready');
          el.style.setProperty('--delay',`${Math.min(i%4,3)*65}ms`);
        }
        if(el.classList.contains('in-view'))return;
        const rect=el.getBoundingClientRect();
        if(rect.top<innerHeight+96&&rect.bottom>-96){el.classList.add('in-view');return}
        observer.observe(el);
      });
    };
    register();
    const mutation=new MutationObserver(register);
    mutation.observe(document.body,{childList:true,subtree:true});
    let frame=0;
    const paint=()=>{
      frame=0;
      const max=document.documentElement.scrollHeight-innerHeight;
      if(progressRef.current)progressRef.current.style.width=`${max>0?scrollY/max*100:0}%`;
      setShowTop(visible=>visible===(scrollY>650)?visible:!visible);
      if(reduceMotion.matches||innerWidth<760)return;
      document.querySelectorAll('.hero-showcase,.proc-photo,.photo-cta').forEach(el=>{
        const rect=el.getBoundingClientRect();
        if(rect.bottom<0||rect.top>innerHeight)return;
        const center=rect.top+rect.height/2;
        const travel=Math.max(-1,Math.min(1,(innerHeight/2-center)/(innerHeight/2+rect.height/2)));
        el.style.setProperty('--scroll-shift',`${(travel*22).toFixed(1)}px`);
      });
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint)};
    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule,{passive:true});
    reduceMotion.addEventListener('change',schedule);
    schedule();
    return()=>{observer.disconnect();mutation.disconnect();cancelAnimationFrame(frame);removeEventListener('scroll',schedule);removeEventListener('resize',schedule);reduceMotion.removeEventListener('change',schedule)};
  },[]);
  return <><div className="scroll-progress" aria-hidden="true"><i ref={progressRef}/></div><button className={`scroll-top ${showTop?'show':''}`} aria-label="Scroll to top" tabIndex={showTop?0:-1} aria-hidden={!showTop} onClick={()=>scrollTo({top:0,behavior:'smooth'})}><ArrowUp/></button></>;
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
      [fig(openings),'openings live','/jobs/search',MarkOpenings,null,
        ready?`across ${cities} ${cities===1?'city':'cities'}${remote?' and remote':''}`:(waiting??'counting the board')],
      [fig(fresh),'posted this week','/jobs/search',MarkThisWeek,null,
        ready?`of ${rows.length} live ${rows.length===1?'role':'roles'}`:(waiting??'checking posting dates')],
      [fig(employers),'hiring employers','/jobs/search',MarkEmployers,null,
        ready?(withPay===rows.length?'every role publishes its salary':`${withPay} publish a salary`):(waiting??'reading the employer list')]
    ];
  }
  const listed=rows.length;
  const approved=rows.filter(r=>(r.approval??[]).length>0).length;
  const share=listed?Math.round(approved/listed*100):0;
  const isCol=vertical==='colleges';
  const href=isCol?'/colleges/search':'/distance/universities';
  return [
    [fig(share+'%'),isCol?'approvals on file':'approvals on file',href,MarkVerified,ready?share:null,
      ready?`${approved} of ${listed} checked at source`:(waiting??'reading the catalogue')],
    [fig(listed),isCol?'colleges compared':'universities compared',href,MarkCompared,null,
      ready?(isCol?'cutoffs and total cost on record':'fees, EMI and mode on record'):(waiting??'loading the catalogue')],
    ['1:1','counsellor for life','#counsellor',MarkCounsellor,null,'no cost, no sales pitch']
  ];
}
/* The homepage hero, in the layout the brief specifies: the promise and the
   search on the left, the person and the reasons to trust us on the right.
   Everything visible here does something. The field seeds the same search panel
   ⌘K opens; the category select and the Popular chips are filters the listing
   already understands; Start Your Journey opens the enquiry form that creates
   the CRM record. Nothing here is decoration wearing the costume of a control. */
const HERO={
  distance:{
    chips:['UGC Approved','Flexible','Affordable','For every learner'],
    line1:'Learn Your Way.',line2:'A Brighter Tomorrow.',
    body:'Discover distance and online courses from India’s trusted universities. For 10th, 12th, Graduates and Working Professionals.',
    ph:'Search courses, universities, programs or skills',
    all:'/distance/universities',
    cats:[['All Categories',null],['10th / 12th Courses','/distance/boards'],['Graduation','/distance/universities?path=ug'],['Post Graduation','/distance/universities?path=pg'],['Online Degree','/distance/universities?path=online']],
    popular:[['10th Pass Courses','/distance/boards'],['12th Pass Courses','/distance/boards'],['UG Courses','/distance/universities?path=ug'],['PG Courses','/distance/universities?path=pg'],['Diploma','/distance/universities'],['Online MBA','/distance/universities?path=pg'],['Certification','/distance/universities?path=online']],
    guided:'1L+ students guided',guidedSub:'and counting, across India',
    script:'Skills. Knowledge. Confidence.',
    note:'Same education. More opportunities.',
    trust:[['Verified universities',<ShieldCheck/>],['Flexible learning',<Clock3/>],['Affordable fees',<IndianRupee/>],['Career guidance',<TrendingUp/>],['Real student reviews',<Star/>]],
    cta:'Start your journey',
    alt:'Student looking toward a bright education and career pathway'
  },
  colleges:{
    chips:['Verified data','Real cutoffs','Total cost','No paid ranking'],
    line1:'Choose With Clarity.',line2:'Not With Guesswork.',
    body:'Compare cutoffs, total cost, seats and outcomes across Indian and overseas colleges. For 12th pass students and their parents.',
    ph:'Search college, course, exam or city',
    all:'/colleges/search',
    cats:[['All Categories',null],['Medical','/colleges/search?stream=Medical'],['Engineering','/colleges/search?stream=Engineering'],['Management','/colleges/search?stream=Management'],['Commerce','/colleges/search?stream=Commerce'],['Law','/colleges/search?stream=Law'],['Study abroad','/colleges/search?abroad=1']],
    popular:[['MBBS','/colleges/search?stream=Medical'],['B.Tech','/colleges/search?stream=Engineering'],['BBA & MBA','/colleges/search?stream=Management'],['B.Com','/colleges/search?stream=Commerce'],['BA LLB','/colleges/search?stream=Law'],['NEET predictor','/colleges/neet-predictor'],['Study abroad','/colleges/search?abroad=1']],
    guided:'1L+ students guided',guidedSub:'and counting, across India',
    script:'Cutoff. Cost. Outcome.',
    note:'One shortlist, all the numbers.',
    trust:[['Verified colleges',<ShieldCheck/>],['Cutoffs on record',<TrendingUp/>],['Total cost, not just fees',<IndianRupee/>],['Free counselling',<MessageCircle/>],['Real student reviews',<Star/>]],
    cta:'Start your shortlist',
    alt:'Indian university students walking on campus'
  },
  jobs:{
    chips:['Verified employers','Salary shown','Freshers welcome','Free to apply'],
    line1:'Less Searching.',line2:'More Moving Forward.',
    body:'Find fresher-friendly jobs from employers we have checked, build a clean resume and apply in minutes. No fee, ever.',
    ph:'Search role, skill or location',
    all:'/jobs/search',
    cats:[['All Categories',null],['Jobs near me','/jobs/search?city=Patna'],['Work from home','/jobs/search'],['Short courses','/jobs/search'],['Resume builder','/jobs/resume-builder']],
    popular:[['Jobs in Patna','/jobs/search?city=Patna'],['Work from home','/jobs/search'],['Fresher jobs','/jobs/search'],['Sales & BPO','/jobs/search'],['Free resume builder','/jobs/resume-builder'],['Sarkari alerts','/jobs/search'],['Interview prep','/jobs/search']],
    guided:'1L+ students guided',guidedSub:'and counting, across India',
    script:'Skill. Apply. Earn.',
    note:'A real job beats a long list.',
    trust:[['Verified employers',<ShieldCheck/>],['Salary stated upfront',<IndianRupee/>],['Freshers welcome',<Users/>],['Free resume builder',<FileText/>],['Never any fee',<Check/>]],
    cta:'Start your job hunt',
    alt:'Young Indian professionals collaborating at work'
  }
};
/* Thumbnails for the category tiles, in the order categories() returns them.
   These are the one band allowed to repeat a photograph the page has already
   shown: they are small, an icon sits over them, and there are only ten
   pictures against fifteen slots on a homepage. The rule they do follow is
   that a tile never repeats the picture in the band directly above or below
   it — see the note in lib/photos.js for how the large slots are spent. */
const CATEGORY_PHOTOS={
  distance:['home-study','campus-editorial','university-campus','workplace-team','classroom-session','counsellor-desk'],
  colleges:['classroom-session','workplace-team','career-editorial','campus-editorial','university-campus','campus-steps'],
  jobs:['office-front','home-study','classroom-session','counsellor-desk']
};
function HomePage(ctx){const {vertical,catalog,setLead}=ctx;const pool=catalog.rows;
  const listAll=vertical==='distance'?'/distance/universities':`/${vertical}/search`;
  const noun=vertical==='jobs'?'jobs':vertical==='colleges'?'colleges':'universities';
  const h=HERO[vertical];
  /* The live figures the old closing band computed, carried into the strip
     under the offer cards — a number on a homepage should be one somebody can
     click through and check. */
  const proof=[...heroProof(vertical,catalog).map(([n,l])=>({value:n,label:l.replace(/^./,c=>c.toUpperCase())})),{value:'Free',label:`Guidance from ${V[vertical].logoAlt}`}];
  const cats=categories(vertical);
  const catTitle=vertical==='jobs'?['Start With What','You Need Today']:vertical==='colleges'?['Explore by','Your Ambition']:['Find the Course','That Fits Your Life'];
  const catSub=vertical==='jobs'?'Pick the one closest to where you are right now.':vertical==='colleges'?'Pick a stream and compare the colleges that teach it.':'Pick where you stopped studying, or where you want to go next.';
  const featured=vertical==='jobs'?{kicker:'Hiring Now',title:'Real Openings, Real Employers',sub:'Every role below states its salary and the employer behind it.'}
    :vertical==='colleges'?{kicker:'Top Colleges',title:'Good Colleges, Honest Numbers',sub:'Cutoffs, total cost and seats — checked at source, not copied.'}
    :{kicker:'Top Universities',title:'Trusted Universities, Real Opportunities',sub:'Explore UGC-approved universities offering distance and online programs.'};
  return <main id="main" tabIndex={-1}>
    <HdHero vertical={vertical} brand={V[vertical]} h={h} image={{distance:'hero1',colleges:'colleges-hero',jobs:'workplace-team'}[vertical]} setLead={setLead}/>
    <HdStreams vertical={vertical} items={cats} photos={CATEGORY_PHOTOS[vertical]} title={catTitle} sub={catSub} listAll={listAll}/>
    <HdFeatured vertical={vertical} catalog={catalog} copy={featured} listAll={listAll} noun={noun}/>
    <HdOffers vertical={vertical} proof={proof} brand={V[vertical]}/>
    <HdSteps vertical={vertical}/>
    {/* Recognition & Approval and Proof of Work — counted out of the catalogue,
        so the console is what changes them. */}
    <Credentials vertical={vertical} go={ctx.go} notify={ctx.notify}/>
    <HdBlog vertical={vertical}/>
    {/* Distance only: the reviews store is shared, and would run DCW's cards on
        the other two houses' home pages. */}
    {vertical==='distance'&&<ReviewMarquee go={ctx.go}/>}
    <HdFaq vertical={vertical} brand={V[vertical]} setLead={setLead}/>
    <HdCta vertical={vertical}/>
  </main>}
function categories(v){if(v==='distance')return[{name:'10th / 12th Courses',tag:'Build your foundation',kicker:'OPEN SCHOOL',desc:'Recognised open boards with flexible exam cycles \u2014 gap years are fine.',icon:<ScrollText/>,href:'/distance/boards'},{name:'Graduation',tag:'BA, B.Com, BSc & more',kicker:'BACHELOR\u2019S',desc:'UG degrees from UGC-DEB universities, built around a job or a family.',icon:<GraduationCap/>,href:'/distance/universities?path=ug'},{name:'Post Graduation',tag:'MA, MBA, MCA & more',kicker:'MASTER\u2019S',desc:'Master\u2019s programmes you can finish without leaving your work.',icon:<Award/>,href:'/distance/universities?path=pg'},{name:'Professional Courses',tag:'Certification & diploma',kicker:'SHORT COURSES',desc:'Job-linked certificates and diplomas, from six weeks.',icon:<Briefcase/>,href:'/jobs/search'},{name:'Government Exams',tag:'Prepare for a better future',kicker:'BSSC \u00b7 SSC \u00b7 RAILWAY',desc:'Form dates and eligibility, pushed before the deadline closes.',icon:<ShieldCheck/>,href:'/jobs/search'},{name:'International Programs',tag:'Global learning options',kicker:'STUDY ABROAD',desc:'Country-wise cost, approvals and intake timelines.',icon:<Plane/>,href:'/colleges/search?abroad=1'}];if(v==='colleges')return[{name:'Medical',kicker:'MBBS & BDS',desc:'Cutoffs, seats and the full cost \u2014 not just tuition.',icon:<Stethoscope/>,href:'/colleges/search?stream=Medical'},{name:'Engineering',kicker:'B.TECH',desc:'JEE percentile, branch-wise fees and placement records.',icon:<Cog/>,href:'/colleges/search?stream=Engineering'},{name:'Management',kicker:'BBA & MBA',desc:'Entrance accepted, fee versus average package.',icon:<TrendingUp/>,href:'/colleges/search?stream=Management'},{name:'Law',kicker:'BA LLB',desc:'CLAT and state law entrances with five-year options.',icon:<Scale/>,href:'/colleges/search?stream=Law'},{name:'Study abroad',kicker:'GLOBAL OPTIONS',desc:'Country-wise cost, approvals and intake timelines.',icon:<Plane/>,href:'/colleges/search?abroad=1'},{name:'Commerce',kicker:'B.COM',desc:'Regular and honours streams with CA-friendly timing.',icon:<Calculator/>,href:'/colleges/search?stream=Commerce'}];return[{name:'Jobs near me',kicker:'LOCAL ROLES',desc:'Verified Patna openings with the salary stated upfront.',icon:<MapPin/>,href:'/jobs/search?city=Patna'},{name:'Free resume builder',kicker:'3 SIMPLE STEPS',desc:'Create a clean, recruiter-ready resume in minutes.',icon:<FileText/>,href:'/jobs/resume-builder'},{name:'Skill to job',kicker:'SHORT COURSES',desc:'Job-linked courses from six weeks, with placement help.',icon:<Wrench/>,href:'/jobs/search'},{name:'Sarkari exam alerts',kicker:'BSSC \u00b7 SSC \u00b7 RAILWAY',desc:'Form dates and eligibility, pushed before the deadline.',icon:<Bell/>,href:'/jobs/search'}]}

function NotFoundPage({go,vertical}){
  return <main id="main" tabIndex={-1} className="state-main"><div className="container">
    <EmptyState title="We could not find that page"
      body="The link may be out of date, or the listing may have closed."
      actionLabel={`Browse ${vertical}`} onAction={()=>go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}/>
  </div></main>;
}

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
/* Courses are held as a list even when only one is on offer, so nothing
   downstream has to cope with two shapes. One application may now cover several
   courses at the same institution — /api/applications files one admission and
   one fee plan per course — which is how people actually apply: they want the
   BA and the B.Com quoted together, not two trips through the same form. */
function LeadFlow({lead,vertical,go,close,notify}){const applying=lead.mode==='apply';const [picked,setPicked]=useState(lead.course?[lead.course]:[]);const course=picked[0]||'';const multi=applying&&Array.isArray(lead.courses)&&lead.courses.length>1;const toggleCourse=n=>setPicked(p=>p.includes(n)?p.filter(x=>x!==n):[...p,n]);const [step,setStep]=useState(0),[name,setName]=useState(''),[phone,setPhone]=useState(''),[qualification,setQualification]=useState('12th pass / appearing'),[otp,setOtp]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[demoCode,setDemoCode]=useState(''),[result,setResult]=useState(null),[consent,setConsent]=useState(false),[waOptIn,setWaOptIn]=useState(false);
/* A job application without a resume is a name and a number: the recruiter
   console had nothing to open. The file is read in the browser, sent as base64
   to /api/resumes once the number is verified, and the id that comes back is
   what travels with the application — the bytes are never held in this
   component's state longer than the upload itself. Courses do not get this
   step: an admission needs marksheets, which a counsellor collects and checks
   at the "Documents pending" stage rather than through an unattended form. */
const isJob=lead.interestType==='job';
const [resume,setResume]=useState(null),[savedResumes,setSavedResumes]=useState([]),[resumeErr,setResumeErr]=useState('');
// Escape is ignored while a request is in flight: closing mid-submit would
// lose the reference number the person needs.
const dialogRef=useDialogA11y(true,()=>{if(!busy)close()});
/* Every step swaps the whole dialog body, so whatever held focus is detached
   and focus falls to <body>. Only the success step used to reclaim it. Send
   focus to the heading on each step instead: a screen reader announces the step
   the person just moved to rather than going silent, and Tab resumes inside the
   dialog. Step 0 is deliberately skipped — useDialogA11y has already put the
   caret in the name field, which is better than a heading you cannot type in. */
const prevStep=useRef(step);
useEffect(()=>{if(prevStep.current===step)return; /* idempotent: StrictMode's
  second mount pass sees the same step and does nothing. A boolean "have I run
  before" flag does not survive that, and stole focus from the name field. */
  prevStep.current=step;
  const h=dialogRef.current?.querySelector('#lead-title');
  if(h){h.tabIndex=-1;h.focus()}},[step]);
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
/* Reading the file here rather than posting a multipart form keeps one JSON
   contract across the whole flow, and lets the size be refused before anything
   leaves the phone. 2 MB is the server's limit; checking it twice means a
   student on a slow connection is told immediately instead of after a minute
   of upload. */
const pickFile=file=>{setResumeErr('');if(!file)return;
  if(file.size>2*1024*1024){setResumeErr(`That file is ${(file.size/1048576).toFixed(1)} MB. The limit is 2 MB.`);return}
  if(!/pdf|msword|officedocument\.wordprocessingml/.test(file.type)){setResumeErr('Attach a PDF, DOC or DOCX.');return}
  const r=new FileReader();
  r.onerror=()=>setResumeErr('That file could not be read. Try attaching it again.');
  r.onload=()=>setResume({fileName:file.name,mimeType:file.type,sizeBytes:file.size,dataBase64:String(r.result).split(',')[1]});
  r.readAsDataURL(file)};
/* The application is filed under a verified number, so anything that has to
   belong to that person — the resume included — is uploaded between the code
   check and the submit, never before. */
const submit=async(attach=resume)=>{let resumeId=attach?.id??null;
  if(attach&&!attach.id){const up=await api('/api/resumes',{phone,name:name.trim(),fileName:attach.fileName,mimeType:attach.mimeType,dataBase64:attach.dataBase64});resumeId=up.resume.id}
  const d=await api('/api/applications',{kind:isJob?'job':'course',vertical,name:name.trim(),phone,
    qualification,interestType:lead.interestType||'general',interestId:lead.interest||null,
    where:lead.where||null,course:course||undefined,courses:picked.length>1?picked:undefined,resumeId,
    associateCode:new URLSearchParams(window.location.search).get('ref'),
    consent:{contact:consent,whatsapp:waOptIn,text:CONSENT_TEXT},source:source()});
  setResult(d);
  /* The browser copy is now a convenience, not the record: /applications reads
     the server. It stays because it is the only thing that still renders when
     the person is offline. */
  const record={id:d.application.id,name:name.trim(),phone,qualification,interest:lead.interest,course:picked.length>1?picked.join(', '):course||null,kind:'Application',title:lead.title,createdAt:new Date().toISOString(),status:d.application.status};
  const current=JSON.parse(localStorage.getItem('dcw-enquiries-v1')||'[]');
  localStorage.setItem('dcw-enquiries-v1',JSON.stringify([record,...current]));
  setStep(3)};
/* Enquiries are not applications. Someone asking a question has not applied to
   anything, so they keep going to /api/leads and never reach a pipeline. */
const sendEnquiry=async()=>{const d=await api('/api/leads',{vertical,name:name.trim(),phone,phoneVerified:true,whatsappSame:waOptIn,consent:{contact:consent,whatsapp:waOptIn,text:CONSENT_TEXT,at:new Date().toISOString()},qualification,interestType:lead.interestType||'general',interestId:lead.interest||null,course:course||undefined,associateCode:new URLSearchParams(window.location.search).get('ref'),source:source()});
  setResult({lead:d.lead,application:null});
  const record={id:d.lead.crmLeadId,name:name.trim(),phone,qualification,interest:lead.interest,course:course||null,kind:'Enquiry',title:lead.title,createdAt:new Date().toISOString(),status:d.lead.status};
  const current=JSON.parse(localStorage.getItem('dcw-enquiries-v1')||'[]');
  localStorage.setItem('dcw-enquiries-v1',JSON.stringify([record,...current]));
  setStep(3)};
const verify=async()=>{if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');
  try{await api('/api/otp/verify',{phone,code:otp});
    if(!applying){await sendEnquiry()}
    else if(isJob){
      /* A returning applicant already has a file with us. Offering it beats
         asking them to find the same PDF on a phone a second time. Failing to
         load the list is not an error worth showing: it only means there is
         nothing to offer. */
      try{const r=await fetch('/api/resumes');const j=await r.json();if(j?.ok)setSavedResumes(j.data.resumes)}catch{}
      setStep(2)}
    else{await submit()}}
  catch(e){setError(e.message)}finally{inFlight.current=false;setBusy(false)}};
const finish=async(attach=resume)=>{if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');
  try{await submit(attach)}catch(e){setError(e.message)}finally{inFlight.current=false;setBusy(false)}};
return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)close()}}><div className={`lead-modal${lead.popup?' is-popup':''}`} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="lead-title"><button aria-label="Close" className="modal-x" onClick={close}><X/></button>{error&&<p className="form-error" role="alert">{error}</p>}{step===0&&<><span className="kicker">{applying?<><FileText/>FREE APPLICATION SUPPORT</>:<>FREE &bull; NO PRESSURE</>}</span><h2 id="lead-title">{lead.title}</h2><p>{!applying?'Share the basics so the right DCW counsellor can understand your goal.':lead.interestType==='job'?'Share the basics and attach a resume if you have one. A DCW recruiter checks the fit and passes your application to the employer — there is no fee to DCW.':'Pick your course and share the basics. A DCW counsellor checks your eligibility and submits the application with you — there is no application fee to DCW.'}</p>{lead.popup&&<button type="button" className="lm-browse" onClick={()=>{close();go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}}>Explore first — no details needed<ArrowRight aria-hidden="true"/></button>}{applying&&lead.where&&<div className="lead-context"><MapPin/><span>{lead.where}</span></div>}{/* Checkboxes rather than a <select multiple>: on a phone that collapses into
    a picker giving no sign more than one choice is allowed, and on a desktop it
    needs a held modifier key nobody discovers. "Select all" is one tap. */}
{multi&&<div className="course-pick"><div className="cp-head"><span className="field-legend">Choose your courses</span><button type="button" className="text-btn" onClick={()=>setPicked(picked.length===lead.courses.length?[]:[...lead.courses])}>{picked.length===lead.courses.length?'Clear all':'Select all'}</button></div>
<div className="cp-list">{lead.courses.map(c=><label key={c} className="resume-option"><input type="checkbox" checked={picked.includes(c)} onChange={()=>toggleCourse(c)}/><span><b>{c}</b></span></label>)}</div>
<p className="cp-note">{picked.length?`${picked.length} selected — a separate application is filed for each, so each one gets its own fee plan and status.`:'Pick at least one course to continue.'}</p></div>}<label>Full name<input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/></label><label>10-digit mobile number<input value={phone} onChange={e=>setPhone(phoneDigits(e.target.value))} inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210"/></label><label>Current qualification<select value={qualification} onChange={e=>setQualification(e.target.value)}><option>12th pass / appearing</option><option>Graduate</option><option>10th pass</option></select></label><div className="consent-block"><label className="check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} aria-describedby="consent-why"/><span>{CONSENT_TEXT}</span></label><label className="check"><input type="checkbox" checked={waOptIn} onChange={e=>setWaOptIn(e.target.checked)}/><span>Also send updates about this enquiry on WhatsApp. Optional.</span></label><p className="consent-why" id="consent-why">We cannot pass your details to a counsellor without the first permission. You can withdraw either at any time.</p></div><button disabled={busy||name.trim().length<2||phone.length!==10||!consent||(multi&&picked.length===0)} aria-busy={busy} className="btn primary full" onClick={sendCode}>{busy?'Sending code…':'Send verification code'}{!busy&&<ArrowRight/>}</button><small>Demo mode: the code is shown on screen and no SMS is sent.</small></>}{step===1&&<><span className="kicker">VERIFY MOBILE</span><h2 id="lead-title">Enter the 6-digit code</h2><p>Sent to {phone}. {demoCode&&<>Demo code: <b>{demoCode}</b></>}</p><label>6-digit code<input autoFocus value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code"/></label><button disabled={busy||otp.length!==6} aria-busy={busy} className="btn primary full" onClick={verify}>{busy?'Verifying…':!applying?'Verify & send enquiry':isJob?'Verify & continue':'Verify & submit application'}{!busy&&<Check/>}</button><button className="text-btn" disabled={busy} onClick={()=>{setError('');setStep(0)}}>Change details</button></>}{step===2&&<><span className="kicker"><Paperclip/>ATTACH YOUR RESUME</span><h2 id="lead-title">Give the employer something to read</h2><p>{lead.where?`${lead.where} sees this with your application.`:'The employer sees this with your application.'} PDF, DOC or DOCX, up to 2 MB. You can apply without one, but applications with a resume are read first.</p>
{resumeErr&&<p className="form-error" role="alert">{resumeErr}</p>}
{savedResumes.length>0&&<div className="resume-saved"><span className="field-legend">Already on file</span>{savedResumes.map(r=><label className="resume-option" key={r.id}><input type="radio" name="resume-pick" checked={resume?.id===r.id} onChange={()=>{setResumeErr('');setResume({id:r.id,fileName:r.fileName,sizeBytes:r.sizeBytes})}}/><span><b>{r.fileName}</b><small>{new Date(r.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</small></span></label>)}</div>}
{resume&&!resume.id
  ? <div className="resume-picked"><FileText/><span><b>{resume.fileName}</b><small>{fileSize(resume.sizeBytes)} &bull; ready to send</small></span><button className="text-btn" onClick={()=>setResume(null)}><Trash2/>Remove</button></div>
  : <label className="resume-drop"><input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>pickFile(e.target.files?.[0])}/><Upload/><b>{savedResumes.length?'Or upload a different file':'Choose a file'}</b><small>PDF, DOC or DOCX &bull; up to 2 MB</small></label>}
<button disabled={busy} aria-busy={busy} className="btn primary full" onClick={()=>finish()}>{busy?'Submitting…':resume?'Submit application with resume':'Submit application'}{!busy&&<Check/>}</button>
{/* Skipping is a real choice, not a hidden one: someone applying from a phone
    at a job fair may not have a file on it, and refusing the application would
    lose them the vacancy. The counsellor collects it afterwards. */}
{resume&&<button className="text-btn" disabled={busy} onClick={()=>{setResume(null);finish(null)}}>Submit without a resume</button>}
<button className="text-btn" disabled={busy} onClick={()=>{setError('');setResumeErr('');setStep(0)}}>Change details</button></>}
{step===3&&<div className="success"><span><Check/></span><h2 id="lead-title" tabIndex={-1}>{applying?'Application submitted':'Enquiry sent'}</h2>
<p>{result?.duplicate?'We already had this application on file, so this went against your existing record.':applying?(isJob?`Your application for ${String(lead.title||'this role').replace(/^Apply (for|to) /i,'')} is with the employer's DCW recruiter.`:picked.length>1?`Your ${picked.length} applications are with a DCW counsellor, who will confirm your documents before they go to the institution.`:`Your application${course?` for ${course}`:''} is with a DCW counsellor, who will confirm your documents before it goes to the institution.`):'Your enquiry is with a DCW counsellor.'} Reference <b>{result?.application?.id??result?.lead?.crmLeadId}</b>{result?.lead?.assignedTo&&<> &bull; assigned to {result.lead.assignedTo}</>}</p>
{/* The fee is stated at the moment of applying rather than sprung later. The
    first instalment is the only number that matters today, so it leads. */}
{result?.fee?.first&&<div className="lead-fee"><IndianRupee/><span><b>{'\u20B9'+result.fee.first.amount.toLocaleString('en-IN')} due by {new Date(result.fee.first.dueOn).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</b><small>{result.fee.first.label} of {result.fee.instalments} &bull; {'\u20B9'+result.fee.totalFee.toLocaleString('en-IN')} total. Nothing is payable to DCW.</small></span></div>}
{/* With several courses the fee panel above can only show one plan, so say
    which, rather than letting it read as the total for all of them. */}
{result?.applications?.length>1&&<p className="muted-note"><FileText/> {result.applications.length} applications were filed, one per course. The fee above is the plan for the first; the rest are listed in Applications.</p>}
{result?.application?.resumeUrl&&<p className="muted-note"><Paperclip/> Your resume is attached to this application.</p>}
<p className="muted-note">Demo mode: no real SMS, WhatsApp or CRM record was created.</p>
<div className="bc-foot"><button className="btn primary" onClick={()=>{notify(applying?'Application submitted \u2014 track it in Applications':'Enquiry saved to Applications');close()}}>Done</button>
{/* The stage view is the answer to the question this person will ask next. */}
{applying&&<button className="btn outline" onClick={()=>{close();go('/applications')}}>Track {result?.applications?.length>1?'these applications':'this application'}<ArrowRight/></button>}</div></div>}
{/* Last in the markup, first in the layout: CSS puts this column on the left,
    but a screen reader should reach the heading and the fields before it
    reaches a picture and a line about opening hours. Only the pop-up gets it —
    a dialog the visitor opened themselves does not need to be sold to.
    The promise under the photograph is the one the site makes everywhere else
    (counselling is free, nothing is payable to DCW) and the hours come from
    lib/contact.js, so there is no second copy to fall out of date. */}
{lead.popup&&<aside className="lm-aside">
  <Photo name={photoFor(vertical,'popup')}/>
  <span className="lm-shade" aria-hidden="true"/>
  <div className="lm-aside-copy"><b>Counselling is free</b><small>{CONTACT.hours}</small>
    <small>Nothing is payable to DCW at any stage.</small></div>
</aside>}</div></div>}
function CompareTray({vertical,compare,go}){return <div className="compare-tray glass-dark"><span><b>{compare[vertical].length} of 3 selected</b><small>{compare[vertical].length<2?'Add one more for a useful comparison':'Ready to compare side by side'}</small></span><button disabled={compare[vertical].length<2} onClick={()=>go(`/${vertical}/compare`)}>Compare now<ArrowRight/></button></div>}
export default App;
