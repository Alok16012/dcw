'use client';
import {useEffect,useLayoutEffect,useMemo,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import Image from 'next/image';
import {ArrowRight,ArrowUp,Bookmark,Building2,Check,ChevronDown,ChevronRight,Clock3,FileText,GraduationCap,Heart,Home,MapPin,Search,ShieldCheck,Sparkles,Star,Users,X,Bell,UserRound,BookOpen,ExternalLink,Download,ArrowLeft,TrendingUp,CalendarDays,MessageCircle,RotateCcw,Zap,Navigation,LocateFixed,Wifi,Flame,Filter,Stethoscope,Plane,Scale,Award,Briefcase,IndianRupee,ScrollText,Laptop,Cog,Calculator,Wrench,BadgeCheck,Landmark,Workflow} from 'lucide-react';

const V={distance:{label:'Distance',sub:'Courses Wala',logoAlt:'Distance Courses Wala',legal:'Distance Courses Wala, Patna',mark:'/distance-mark.png',lockup:'/distance-lockup.png',theme:{'--accent':'#0B4DA8','--accent-deep':'#07356F','--accent-ink':'#0B4DA8','--accent-solid':'#0B4DA8','--wash':'#EAF1FB','--spark':'#F5C93B','--spark-ink':'#3A2A00','--spark-lift':'#F7D98C','--tint':'#B7D2F6','--mark':"url('/distance-mark.png')"}},colleges:{label:'Colleges',sub:'Colleges Wala',logoAlt:'Colleges Wala',legal:'Colleges Wala, Patna',mark:'/colleges-mark.png',lockup:'/colleges-lockup.png',theme:{'--accent':'#C1272D','--accent-deep':'#8C1A20','--accent-ink':'#C1272D','--accent-solid':'#C1272D','--wash':'#FBEDEC','--spark':'#1B3B78','--spark-ink':'#FFFFFF','--spark-lift':'#F6C9C4','--tint':'#F3C0BC','--mark':"url('/colleges-mark.png')"}},jobs:{label:'Jobs',sub:'Berojgar Bharat',logoAlt:'Berojgar Bharat',legal:'Berojgar Bharat, Patna',mark:'/jobs-mark.png',lockup:'/jobs-lockup.png',theme:{'--accent':'#E2760F','--accent-deep':'#A5520A','--accent-ink':'#A5520A','--accent-solid':'#A5520A','--wash':'#FDF2E5','--spark':'#5AB436','--spark-ink':'#0C2A05','--spark-lift':'#B6EE99','--tint':'#F8D3A6','--mark':"url('/jobs-mark.png')"}}};
const universities=[
{id:'amity-online',mark:'AU',name:'Amity University Online',place:'Noida, Uttar Pradesh',type:'Private university',course:'Online MBA',fee:149000,mrp:180000,emi:'₹6,208/mo',rating:4.4,reviews:1284,approval:['UGC-DEB','NAAC A+'],duration:'2 years',mode:'100% online',deadline:'28 Aug',featured:true},
{id:'lpu',mark:'LP',name:'Lovely Professional University',place:'Jalandhar, Punjab',type:'Private university',course:'Distance BBA',fee:78000,mrp:92000,emi:'₹3,250/mo',rating:4.2,reviews:721,approval:['UGC-DEB','AICTE'],duration:'3 years',mode:'Distance',deadline:'02 Sep',featured:true},
{id:'ignou',mark:'IG',name:'IGNOU',place:'New Delhi',type:'Central university',course:'BA (General)',fee:16200,emi:'Not available',rating:4.5,reviews:3421,approval:['UGC-DEB','Lowest total fee'],duration:'3 years',mode:'Distance',deadline:'15 Sep',featured:true},
{id:'manipal-online',mark:'MU',name:'Manipal University Jaipur',place:'Jaipur, Rajasthan',type:'Private university',course:'Online BCA',fee:135000,mrp:150000,emi:'₹5,625/mo',rating:4.7,reviews:946,approval:['UGC-DEB','NAAC A+'],duration:'3 years',mode:'Online',deadline:'31 Aug'},
{id:'cu-online',mark:'CU',name:'Chandigarh University Online',place:'Mohali, Punjab',type:'Private university',course:'Online BBA',fee:109200,mrp:124000,emi:'₹4,550/mo',rating:4.6,reviews:872,approval:['UGC-DEB','NAAC A+'],duration:'3 years',mode:'Online',deadline:'24 Aug'},
{id:'jain-online',mark:'JU',name:'JAIN Online',place:'Bengaluru, Karnataka',type:'Deemed university',course:'Online MBA',fee:196000,emi:'₹8,167/mo',rating:4.5,reviews:604,approval:['UGC-DEB','NAAC A++'],duration:'2 years',mode:'Online',deadline:'30 Aug'}];
const colleges=[
{id:'gmc-patna',mark:'GM',name:'Government Medical College',place:'Patna, Bihar',type:'Government',course:'MBBS',fee:654000,emi:'100 seats',rating:4.3,reviews:486,approval:['NMC approved','NIRF #42'],duration:'5.5 years',mode:'NEET 610+',deadline:'Bihar UGMAC',featured:true},
{id:'tbilisi-smu',mark:'TS',name:'Tbilisi State Medical University',place:'Tbilisi, Georgia',type:'Government',course:'MD (MBBS)',fee:2400000,emi:'Sept intake',rating:4.1,reviews:302,approval:['NMC approved','No donation','FMGE prep'],duration:'6 years',mode:'Direct admission',deadline:'Sept intake',featured:true},
{id:'nit-patna',mark:'NP',name:'NIT Patna',place:'Patna, Bihar',type:'Government',course:'B.Tech CSE',fee:520000,emi:'94% placed',rating:4.4,reviews:551,approval:['NIRF #56','AICTE'],duration:'4 years',mode:'JEE 92 %ile',deadline:'JoSAA Round 1',featured:true},
{id:'aiims-patna',mark:'AI',name:'AIIMS Patna',place:'Patna, Bihar',type:'Government',course:'MBBS',fee:7640,emi:'125 seats',rating:4.9,reviews:614,approval:['NMC approved','INI'],duration:'5.5 years',mode:'NEET • cutoff 1947',deadline:'MCC Round 1'},
{id:'igims-patna',mark:'IG',name:'IGIMS Patna',place:'Patna, Bihar',type:'Government',course:'MBBS',fee:84200,emi:'120 seats',rating:4.7,reviews:433,approval:['NMC approved','State'],duration:'5.5 years',mode:'NEET • cutoff 7321',deadline:'Bihar UGMAC'},
{id:'nmch-sasaram',mark:'NM',name:'Narayan Medical College',place:'Sasaram, Bihar',type:'Private',course:'MBBS',fee:6750000,emi:'250 seats',rating:4.3,reviews:281,approval:['NMC approved','State'],duration:'5.5 years',mode:'NEET • cutoff 68420',deadline:'Bihar UGMAC'},
{id:'kmc-manipal',mark:'KM',name:'Kasturba Medical College',place:'Manipal, Karnataka',type:'Deemed',course:'MBBS',fee:7070000,emi:'250 seats',rating:4.8,reviews:911,approval:['NMC approved','NAAC A++'],duration:'5.5 years',mode:'NEET • cutoff 51240',deadline:'MCC Deemed'}];
/* ---------- Jobs ------------------------------------------------------------
   Every posting carries a city plus its coordinates. Two features depend on
   that and cannot be faked: the city filter, and "jobs near me", which asks
   the browser for a location and ranks by real great-circle distance. Remote
   roles carry wfh:true and no coordinates — they are reachable from anywhere,
   so they are surfaced separately rather than given a misleading distance.
   Indicative demo data; salaries and openings are illustrative. */
const CITY_POS={'Patna':[25.5941,85.1376],'Ranchi':[23.3441,85.3096],'Lucknow':[26.8467,80.9462],'Delhi NCR':[28.5355,77.3910],'Gurugram':[28.4595,77.0266],'Bengaluru':[12.9716,77.5946],'Hyderabad':[17.3850,78.4867],'Mumbai':[19.0760,72.8777],'Pune':[18.5204,73.8567],'Jaipur':[26.9124,75.7873],'Kolkata':[22.5726,88.3639],'Bhubaneswar':[20.2961,85.8245]};
const jobs=[
{id:'field-sales-executive-patna',pos:[25.5877,85.1591],mark:'BF',name:'Field Sales Executive',company:'Bajaj Finserv',city:'Patna',area:'Kankarbagh',place:'Bajaj Finserv \u2022 Patna',type:'Full-time',course:'12th pass \u2022 Freshers ok',fee:252000,emi:'24 openings',rating:4.6,reviews:203,approval:['Verified company','Freshers welcome'],duration:'\u20b918,000\u201324,000/mo',mode:'Field sales',sector:'Sales',deadline:'Apply by 22 Sep',postedDays:2,featured:true},
{id:'customer-support-hindi-remote',mark:'TP',name:'Customer Support (Hindi)',company:'Teleperformance',city:'Remote',wfh:true,place:'Teleperformance \u2022 Work from home',type:'Full-time',course:'Graduate \u2022 Any stream',fee:198000,emi:'60 openings',rating:4.5,reviews:188,approval:['Verified company','Work from home'],duration:'\u20b916,500/mo',mode:'Voice & chat support',sector:'Support',deadline:'Apply by 25 Sep',postedDays:1,featured:true},
{id:'data-entry-operator-patna',pos:[25.6210,85.1080],mark:'VI',name:'Data Entry Operator',company:'Vibrant Infotech',city:'Patna',area:'Boring Road',place:'Vibrant Infotech \u2022 Boring Road, Patna',type:'Full-time',course:'12th + typing 30 wpm',fee:168000,emi:'12 openings',rating:4.3,reviews:91,approval:['Verified company','Walk-in'],duration:'\u20b914,000/mo',mode:'Back office',sector:'Operations',deadline:'Walk-in 19 Sep',postedDays:4,featured:true},
{id:'tally-accountant',pos:[25.6100,85.1370],mark:'TC',name:'Junior Accounts Assistant',company:'Taxcare India',city:'Patna',area:'Exhibition Road',place:'Taxcare India \u2022 Patna',type:'Full-time',course:'B.Com \u2022 Tally',fee:264000,emi:'6 openings',rating:4.4,reviews:79,approval:['Salary verified','Fresher'],duration:'\u20b918,000\u201326,000/mo',mode:'Accounts',sector:'Finance',deadline:'Apply by 29 Sep',postedDays:6},
{id:'telecaller',pos:[25.6120,85.0900],mark:'NX',name:'Hindi Telecaller',company:'Nexa Services',city:'Patna',area:'Bailey Road',place:'Nexa Services \u2022 Patna',type:'Full-time',course:'12th pass',fee:204000,emi:'22 openings',rating:4.3,reviews:91,approval:['Verified company','Women preferred'],duration:'\u20b914,000\u201320,000/mo',mode:'Inside sales',sector:'Sales',deadline:'Apply by 21 Sep',postedDays:3},
{id:'delivery-partner-ranchi',pos:[23.3760,85.3330],mark:'ZP',name:'Delivery Partner',company:'Zippy Logistics',city:'Ranchi',area:'Lalpur',place:'Zippy Logistics \u2022 Ranchi',type:'Part-time',course:'10th pass \u2022 Own two-wheeler',fee:216000,emi:'40 openings',rating:4.1,reviews:64,approval:['Verified company','Daily payout'],duration:'\u20b915,000\u201322,000/mo',mode:'Field delivery',sector:'Logistics',deadline:'Walk-in daily',postedDays:1},
{id:'retail-store-associate-lucknow',pos:[26.8500,81.0000],mark:'RB',name:'Retail Store Associate',company:'Reliance Trends',city:'Lucknow',area:'Gomti Nagar',place:'Reliance Trends \u2022 Lucknow',type:'Full-time',course:'12th pass \u2022 Freshers ok',fee:228000,emi:'18 openings',rating:4.4,reviews:132,approval:['Verified company','Freshers welcome'],duration:'\u20b916,000\u201321,000/mo',mode:'Store floor',sector:'Retail',deadline:'Apply by 27 Sep',postedDays:5},
{id:'bpo-voice-associate-noida',pos:[28.6270,77.3720],mark:'CV',name:'International Voice Associate',company:'Concentrix',city:'Delhi NCR',area:'Sector 62, Noida',place:'Concentrix \u2022 Noida',type:'Full-time',course:'Graduate \u2022 Fluent English',fee:396000,emi:'75 openings',rating:4.5,reviews:412,approval:['Salary verified','Cab facility'],duration:'\u20b925,000\u201335,000/mo',mode:'Night shift',sector:'Support',deadline:'Apply by 30 Sep',postedDays:2,featured:true},
{id:'field-collections-gurugram',pos:[28.5030,77.0870],mark:'HD',name:'Collections Officer',company:'HDB Financial',city:'Gurugram',area:'Udyog Vihar',place:'HDB Financial \u2022 Gurugram',type:'Full-time',course:'Graduate \u2022 0\u20132 yrs',fee:342000,emi:'14 openings',rating:4.2,reviews:97,approval:['Verified company','Incentives'],duration:'\u20b922,000\u201332,000/mo',mode:'Field collections',sector:'Finance',deadline:'Apply by 24 Sep',postedDays:7},
{id:'junior-frontend-bengaluru',pos:[12.9352,77.6245],mark:'ZE',name:'Junior Frontend Developer',company:'Zerofold Labs',city:'Bengaluru',area:'Koramangala',place:'Zerofold Labs \u2022 Bengaluru',type:'Full-time',course:'BCA / B.Tech \u2022 React',fee:540000,emi:'4 openings',rating:4.7,reviews:58,approval:['Salary verified','Learning budget'],duration:'\u20b935,000\u201352,000/mo',mode:'Hybrid',sector:'Technology',deadline:'Apply by 28 Sep',postedDays:3,featured:true},
{id:'qa-trainee-hyderabad',pos:[17.4483,78.3915],mark:'QB',name:'QA Trainee',company:'Qbridge Systems',city:'Hyderabad',area:'Madhapur',place:'Qbridge Systems \u2022 Hyderabad',type:'Full-time',course:'Any graduate \u2022 Trained',fee:360000,emi:'10 openings',rating:4.3,reviews:44,approval:['Verified company','Paid training'],duration:'\u20b924,000\u201332,000/mo',mode:'On-site',sector:'Technology',deadline:'Apply by 26 Sep',postedDays:8},
{id:'pharmacy-assistant-mumbai',pos:[19.1136,72.8697],mark:'WM',name:'Pharmacy Assistant',company:'Wellness Mart',city:'Mumbai',area:'Andheri East',place:'Wellness Mart \u2022 Mumbai',type:'Full-time',course:'D.Pharm \u2022 Registered',fee:288000,emi:'8 openings',rating:4.2,reviews:37,approval:['Verified company','ESI + PF'],duration:'\u20b920,000\u201326,000/mo',mode:'Shift roster',sector:'Healthcare',deadline:'Apply by 23 Sep',postedDays:4},
{id:'digital-marketing-intern-pune',pos:[18.5590,73.7868],mark:'BC',name:'Digital Marketing Intern',company:'Brightcurve Media',city:'Pune',area:'Baner',place:'Brightcurve Media \u2022 Pune',type:'Internship',course:'Any stream \u2022 Final year ok',fee:144000,emi:'6 openings',rating:4.4,reviews:29,approval:['Verified company','PPO possible'],duration:'\u20b912,000/mo stipend',mode:'Hybrid internship',sector:'Marketing',deadline:'Apply by 20 Sep',postedDays:1},
{id:'back-office-executive-jaipur',pos:[26.8535,75.8100],mark:'SG',name:'Back Office Executive',company:'Sunglow Services',city:'Jaipur',area:'Malviya Nagar',place:'Sunglow Services \u2022 Jaipur',type:'Full-time',course:'12th pass \u2022 Basic computer',fee:180000,emi:'16 openings',rating:4.0,reviews:52,approval:['Verified company','Day shift'],duration:'\u20b913,000\u201317,000/mo',mode:'Back office',sector:'Operations',deadline:'Apply by 30 Sep',postedDays:9},
{id:'content-writer-remote',mark:'IN',name:'Content Writer (Hindi/English)',company:'Inkspan',city:'Remote',wfh:true,place:'Inkspan \u2022 Work from home',type:'Part-time',course:'Any graduate \u2022 Portfolio',fee:216000,emi:'9 openings',rating:4.6,reviews:71,approval:['Verified company','Work from home'],duration:'\u20b915,000\u201322,000/mo',mode:'Freelance-friendly',sector:'Marketing',deadline:'Rolling',postedDays:2},
{id:'lab-technician-bhubaneswar',pos:[20.2900,85.8460],mark:'MD',name:'Lab Technician',company:'Medicare Diagnostics',city:'Bhubaneswar',area:'Saheed Nagar',place:'Medicare Diagnostics \u2022 Bhubaneswar',type:'Full-time',course:'DMLT \u2022 Freshers ok',fee:240000,emi:'5 openings',rating:4.3,reviews:33,approval:['Verified company','Freshers welcome'],duration:'\u20b916,000\u201322,000/mo',mode:'On-site',sector:'Healthcare',deadline:'Apply by 27 Sep',postedDays:6},
{id:'relationship-officer-kolkata',pos:[22.5800,88.4200],mark:'AB',name:'Relationship Officer',company:'Axis Bank BC',city:'Kolkata',area:'Salt Lake',place:'Axis Bank BC \u2022 Kolkata',type:'Full-time',course:'Graduate \u2022 Freshers ok',fee:300000,emi:'20 openings',rating:4.1,reviews:88,approval:['Salary verified','Incentives'],duration:'\u20b918,000\u201328,000/mo',mode:'Branch banking',sector:'Finance',deadline:'Apply by 25 Sep',postedDays:3},
{id:'warehouse-supervisor-patna',pos:[25.5100,85.3050],mark:'GS',name:'Warehouse Supervisor',company:'Gati Supply Co',city:'Patna',area:'Fatuha',place:'Gati Supply Co \u2022 Patna',type:'Full-time',course:'12th pass \u2022 1 yr experience',fee:276000,emi:'3 openings',rating:4.2,reviews:41,approval:['Verified company','PF + ESI'],duration:'\u20b919,000\u201325,000/mo',mode:'Warehouse',sector:'Logistics',deadline:'Apply by 26 Sep',postedDays:5}];

/* ---------- Course catalogue -----------------------------------------------
   A card advertises one headline programme, but somebody who wants to APPLY
   has to pick the programme they are actually applying to. So each university
   carries its real menu, and the apply flow reads from here. Any institution
   without an entry falls back to its headline course, so nothing breaks when
   the catalogue is incomplete. Indicative demo data, same as the cards. */
const COURSES={
'amity-online':[['Online MBA','2 years',149000,180000,'Dual specialisation'],['Online MCA','2 years',175000,199000,'Cloud and AI electives'],['Online BBA','3 years',119000,140000,'Weekend live classes'],['Online BCA','3 years',115000,135000,'Placement support']],
'lpu':[['Distance BBA','3 years',78000,92000,'Semester exams at centre'],['Distance B.Com','3 years',66000,79000,'CA-friendly timetable'],['Distance MBA','2 years',124000,148000,'AICTE approved'],['Distance MA English','2 years',54000,64000,'Fully self-paced']],
'ignou':[['BA (General)','3 years',16200,null,'Lowest total fee'],['B.Com','3 years',18300,null,'January and July intake'],['MBA','2 years',62000,null,'OPENMAT not required'],['BCA','3 years',48000,null,'Practical labs at centre']],
'manipal-online':[['Online BCA','3 years',135000,150000,'Industry mentors'],['Online BBA','3 years',135000,150000,'Live and recorded'],['Online MBA','2 years',175000,200000,'NAAC A+ campus'],['Online M.Com','2 years',120000,140000,'Finance electives']],
'cu-online':[['Online BBA','3 years',109200,124000,'Placement cell access'],['Online BCA','3 years',109200,124000,'Coding bootcamp add-on'],['Online MBA','2 years',159000,180000,'Ten specialisations'],['Online MCA','2 years',149000,170000,'Live doubt sessions']],
'jain-online':[['Online MBA','2 years',196000,null,'NAAC A++ university'],['Online MCA','2 years',180000,null,'Data science electives'],['Online BBA','3 years',150000,null,'Global immersion option'],['Online B.Com','3 years',135000,null,'ACCA pathway']]};
/* [name, duration, fee, mrp, note] -> objects, so call sites stay readable. */
function coursesOf(item){return (COURSES[item.id]||[[item.course,item.duration,item.fee,item.mrp??null,item.mode]]).map(([name,duration,fee,mrp,note])=>({name,duration,fee,mrp,note}))}
function fmt(n){return n>=100000?`₹${(n/100000).toFixed(n%100000?1:0)}L`:`₹${n.toLocaleString('en-IN')}`}
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
const JOB_CITIES=[...new Set(jobs.map(j=>j.city))].sort((a,b)=>a==='Remote'?1:b==='Remote'?-1:a.localeCompare(b));
const JOB_SECTORS=[...new Set(jobs.map(j=>j.sector))].sort();
function BrandLockup({vertical}){const brand=V[vertical];return <span className="brand-lockup"><Image src={brand.lockup} alt={`${brand.logoAlt} logo`} width={640} height={640} sizes="128px"/></span>}
function VerticalLogo({vertical,size=46,mark=false}){const brand=V[vertical];const src=mark?brand.mark:brand.lockup;return <span className={mark?'vertical-logo':'vertical-logo is-lockup'} style={{'--logo-size':`${size}px`}}><Image src={src} alt={`${brand.logoAlt} logo`} width={mark?512:640} height={640} sizes={`${size}px`} priority/></span>}

/* The public site needs to know who is looking at it: the utility bar offers
   three different front doors when nobody is signed in, and the account itself
   once somebody is. Kept as a plain fetch rather than the console's api()
   helper so the public bundle does not pull in the admin client. */
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
const auth=useSession();
const ctx={path,vertical,cfg,go,saved,toggleSave,compare,toggleCompare,setLead,query,setQuery,setSearchOpen,notify,auth};
let page;if(path==='/about')page=<AboutPage {...ctx}/>;else if(path?.startsWith('/blog'))page=<BlogPage {...ctx}/>;else if(path==='/reviews')page=<ReviewsPage {...ctx}/>;else if(path==='/saved')page=<SavedPage {...ctx}/>;else if(path==='/applications')page=<ApplicationsPage {...ctx}/>;else if(path==='/notifications')page=<AccountPage type="notifications" {...ctx}/>;else if(path==='/profile')page=<AccountPage type="profile" {...ctx}/>;else if(path==='/automations')page=<AutomationCenter {...ctx}/>;else if(path?.endsWith('/compare'))page=<ComparePage {...ctx}/>;else if(path?.includes('resume-builder'))page=<ResumeBuilder {...ctx}/>;else if(path?.includes('neet-predictor'))page=<Predictor {...ctx}/>;else if(path?.includes('boards'))page=<Boards {...ctx}/>;else if(path?.includes('universities')||path?.includes('/search')||path?.includes('/list'))page=<Listing {...ctx}/>;else{const id=path?.split('/').pop();const pool=vertical==='distance'?universities:vertical==='colleges'?colleges:jobs;const entity=pool.find(x=>x.id===id);page=entity?<Detail {...ctx} entity={entity}/>:<HomePage {...ctx}/>}
return <div className={`app app-${vertical}`} style={cfg.theme}><MotionLayer/><Header {...ctx}/>{page}<Footer go={go} vertical={vertical}/>{compare[vertical].length>0&&!path?.endsWith('/compare')&&<CompareTray {...ctx}/>}<MobileNav {...ctx}/><AskDCW open={botOpen} setOpen={setBotOpen} {...ctx}/>{searchOpen&&<SearchPanel {...ctx}/>} {lead&&<LeadFlow lead={lead} vertical={vertical} close={()=>setLead(null)} notify={notify}/>} {toast&&<div className="toast" role="status"><Check size={17}/>{toast}</div>}</div>}

function MotionLayer(){const [progress,setProgress]=useState(0),[showTop,setShowTop]=useState(false);useEffect(()=>{const reveal=()=>{document.querySelectorAll('main section,.entity-card,.path-card,.detail-section,.automation-grid section').forEach((el,i)=>{if(!el.classList.contains('motion-ready')){el.classList.add('motion-ready');el.style.setProperty('--delay',`${Math.min(i%6,5)*55}ms`)}})};reveal();const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target)}}),{threshold:.04,rootMargin:'0px 0px 120px'});const observe=()=>document.querySelectorAll('.motion-ready').forEach(el=>observer.observe(el));observe();const mutation=new MutationObserver(()=>{reveal();observe()});mutation.observe(document.body,{childList:true,subtree:true});const onScroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;setProgress(max>0?scrollY/max*100:0);setShowTop(scrollY>650)};addEventListener('scroll',onScroll,{passive:true});onScroll();return()=>{observer.disconnect();mutation.disconnect();removeEventListener('scroll',onScroll)}},[]);return <><div className="scroll-progress" aria-hidden="true"><i style={{width:`${progress}%`}}/></div><button className={`scroll-top ${showTop?'show':''}`} aria-label="Scroll to top" onClick={()=>scrollTo({top:0,behavior:'smooth'})}><ArrowUp/></button></>}

/* Where each kind of user lands after signing in. The public site and the
   console share one account system, so the door you come through decides the
   room, not the credentials. */
const DOORS=[{key:'student',label:'Student',hint:'Applications & counselling',next:'/applications'},{key:'employer',label:'Employer',hint:'Post jobs, screen candidates',next:'/admin/jobs'},{key:'admin',label:'Admin',hint:'Everything across DCW',next:'/admin'}];
const HOME_FOR={admin:'/admin',employer:'/admin/jobs',student:'/applications'};

/* Utility bar — the upper half of the double nav. It carries the live line on
   the left and the three front doors on the right, so a student, an employer
   and an operator each see their own way in without the main nav having to
   grow a fourth thing to hold. */
function UtilityBar({vertical,auth,go}){
  const user=auth?.user;
  const label=vertical==='jobs'?'Aaj 1,240 nayi vacancies \u00b7 18 walk-in drives Patna me':vertical==='colleges'?'NEET UG counselling Round 2 live \u00b7 MBBS abroad intake Sept':'NIOS Oct block ka last date 6 din baad \u00b7 Abhi apply karein';
  return <div className="ticker utility"><div className="util-row">
    <p className="util-live"><span>LIVE</span><b>{label}</b><small>Updated 12 minutes ago</small></p>
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

function Header({vertical,cfg,go,setSearchOpen,setLead,auth}){const user=auth?.user;const initials=user?user.name.replace(/\(.*\)/,'').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase():'AK';return <><UtilityBar vertical={vertical} auth={auth} go={go}/><header><button className="brand vertical-brand" onClick={()=>go(`/${vertical}`)} aria-label={`${V[vertical].logoAlt} home`}><VerticalLogo vertical={vertical}/><span><b>{V[vertical].logoAlt}</b><small>Discover · Compare · Decide</small></span></button><nav className="verticals" aria-label="Choose a service">{Object.entries(V).map(([k,v])=><button key={k} aria-current={vertical===k?'page':undefined} className={vertical===k?'active':''} onClick={()=>go(`/${k}`)}><span>{v.label}</span><small>{v.sub}</small></button>)}</nav><button className="header-search" onClick={()=>setSearchOpen(true)}><Search size={18}/><span>Search {cfg.label.toLowerCase()}</span><kbd>⌘ K</kbd></button><div className="header-actions"><button aria-label="Notifications" onClick={()=>go('/notifications')}><Bell size={20}/><i/></button><button aria-label="Saved items" onClick={()=>go('/saved')}><Bookmark size={20}/></button><button className="avatar" aria-label={user?`Open profile — signed in as ${user.name}`:'Open profile'} onClick={()=>go('/profile')}>{initials}</button><button className="talk" onClick={()=>setLead({title:'Talk to a DCW counsellor',interest:vertical})}><MessageCircle aria-hidden="true"/>Talk to us</button></div></header></>}

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

function Hero({vertical,go,setSearchOpen}){const copy={distance:{eyebrow:'Guiding 2.4L+ student decisions',title:<>See the whole path.<br/><em>Choose your next move.</em></>,body:'Compare recognized online and distance programs with fees, approvals and honest guidance—all in one clear view.',primary:['Find my program','/distance/universities'],secondary:['Compare boards','/distance/boards']},colleges:{eyebrow:'Cutoffs, costs and choices—made clear',title:<>Your right college<br/><em>is within reach.</em></>,body:'Use real decision tools to compare cutoffs, total costs, seats and outcomes across India and abroad.',primary:['Explore colleges','/colleges/search'],secondary:['Predict from NEET rank','/colleges/neet-predictor']},jobs:{eyebrow:'Verified roles. Clear salaries. No noise.',title:<>Less searching.<br/><em>More moving forward.</em></>,body:'Discover fresher-friendly jobs, build a strong resume and apply with confidence in three simple steps.',primary:['Find verified jobs','/jobs/search'],secondary:['Build my resume','/jobs/resume-builder']}}[vertical];const art=vertical==='colleges'?'campus-editorial':vertical==='jobs'?'career-editorial':'dcw-journey-hero';return <section className="hero atlas-hero"><picture><source type="image/webp" media="(max-width:900px)" srcSet={`/${art}-900.webp`}/><source type="image/webp" srcSet={`/${art}-full.webp`}/><img src={`/${art}.png`} alt={vertical==='jobs'?'Young Indian professionals collaborating at work':vertical==='colleges'?'Indian university students walking on campus':'Student looking toward a bright education and career pathway'} fetchPriority="high" decoding="async"/></picture><div className="hero-shade"/><div className="container hero-content"><div className="hero-copy"><span className="eyebrow"><Sparkles size={16}/>{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.body}</p><button className="hero-search glass" onClick={()=>setSearchOpen(true)}><Search/><span>{vertical==='jobs'?'Search role, skill or location':vertical==='colleges'?'Search college, course, exam or city':'Search university, course or board'}</span><b>Search</b></button><div className="hero-ctas"><button className="btn primary tactile" onClick={()=>go(copy.primary[1])}>{copy.primary[0]}<ArrowRight/></button><button className="btn ghost" onClick={()=>go(copy.secondary[1])}>{copy.secondary[0]}<ChevronRight/></button></div><div className="proof glass-dark">{/* The fifth slot is `share`: the proportion the figure actually represents,
        or null when it is a count rather than a share. Only a real share earns a
        meter — a recessed track with a filled portion, which is a claim that the
        rest of the track is the remainder. The counts get a plain rule that
        draws in on reveal: same rhythm, same motion, no arithmetic implied. */}
     {(vertical==='jobs'?[['1,240','vacancies today','/jobs/search',Briefcase,null,'up 12% on last week'],['18','walk-in drives','/jobs/search',MapPin,null,'across 6 Bihar districts'],['312','hiring partners','/jobs/search',Building2,null,'each verified in person']]:vertical==='colleges'?[['100%','verified colleges','/colleges/search',ShieldCheck,100,'approvals checked at source'],['12,000+','students admitted','/applications',Users,null,'since 2019'],['1:1','counsellor for life','/counsellor',MessageCircle,null,'no cost, no sales pitch']]:[['100%','verified universities','/distance/universities',ShieldCheck,100,'UGC-DEB status confirmed'],['12,000+','students admitted','/applications',Users,null,'since 2019'],['1:1','counsellor for life','/counsellor',MessageCircle,null,'no cost, no sales pitch']]).map(([n,l,href,Icon,share,note],i)=><button key={l} onClick={()=>go(href)} style={{'--i':i}}><span className="stat-i" aria-hidden="true"><Icon/></span><StatNumber value={n} delay={140+i*110}/><small>{l}</small>{share===null?<span className="stat-rule" aria-hidden="true"/>:<span className="stat-bar" style={{'--fill':share+'%'}} role="img" aria-label={`${share}% of ${l}`}/>}<span className="stat-note"><TrendingUp/>{note}</span></button>)}</div></div></div></section>}
function HomePage(ctx){const {vertical,go}=ctx;const pool=vertical==='distance'?universities:vertical==='colleges'?colleges:jobs;return <main><Hero {...ctx}/><section className="trust-strip"><div className="container"><span><ShieldCheck/>Data checked by our research team</span><span><Users/>12,000+ students admitted</span><span><Clock3/>Updated every admission cycle</span></div></section><section className="section container"><SectionTitle kicker="CHOOSE YOUR NEXT MOVE" title={vertical==='jobs'?'Start with what you need today':vertical==='colleges'?'Explore by your ambition':'Learn on your terms'} action="View everything" onAction={()=>go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}/><div className="path-grid">{categories(vertical).map((x,i)=><PathCard key={x.name} item={x} i={i} onClick={()=>go(x.href)}/>)}</div></section><section className="section wash"><div className="container"><SectionTitle kicker="RESEARCHED, NOT RANKED BY ADS" title={vertical==='jobs'?'Fresh opportunities near you':vertical==='colleges'?'Colleges worth comparing':'Popular flexible programs'} action="See all results" onAction={()=>go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}/><div className="card-grid">{pool.slice(0,3).map(x=><EntityCard key={x.id} item={x} {...ctx}/>)}</div></div></section>{vertical!=='distance'&&<section className="section container section-plate"><SectionTitle kicker={vertical==='colleges'?'STUDY ABROAD':'SKILL TO JOB'} title={vertical==='colleges'?'Intake and total cost, country by country':'Short courses that lead to a job'} action={vertical==='colleges'?'Compare countries':'See all courses'} onAction={()=>go(vertical==='colleges'?'/colleges/search':'/jobs/search')}/><div className="path-grid">{(vertical==='colleges'?[{name:'Georgia',kicker:'MBBS',desc:'\u20b924L total \u00b7 September intake \u00b7 NMC-approved universities.',icon:<Plane/>},{name:'Russia',kicker:'MBBS',desc:'\u20b919L total \u00b7 August intake \u00b7 English-medium teaching.',icon:<Plane/>},{name:'Canada',kicker:'PG DIPLOMA',desc:'\u20b918L \u00b7 January intake \u00b7 post-study work pathway.',icon:<Plane/>},{name:'UK',kicker:'MSc \u00b7 1 YEAR',desc:'\u20b922L \u00b7 September intake \u00b7 one-year master\u2019s.',icon:<Plane/>}]:[{name:'Digital Marketing',kicker:'6 WEEKS',desc:'Certificate on completion, portfolio project included.',icon:<TrendingUp/>},{name:'Tally + GST',kicker:'8 WEEKS',desc:'Job assistance for accounts and back-office roles.',icon:<Calculator/>},{name:'Spoken English',kicker:'12 WEEKS',desc:'Live classes with practice partners, not recordings.',icon:<MessageCircle/>},{name:'Interview Prep',kicker:'MOCK + REVIEW',desc:'Mock interviews and a line-by-line resume review.',icon:<Briefcase/>}]).map((x,i)=><PathCard key={x.name} item={x} i={i} cta={vertical==='colleges'?'See cost':'See course'} onClick={()=>go(vertical==='colleges'?'/colleges/search':'/jobs/search')}/>)}</div></section>}<DecisionBlock {...ctx}/><section className="section container"><div className="human-cta"><div><span className="kicker">NEED A HUMAN POINT OF VIEW?</span><h2>Talk it through with someone<br/>who knows the details.</h2><p>Free guidance, zero pressure. Our counsellors help you compare the options that fit your goal and budget.</p></div><button className="btn light" onClick={()=>ctx.setLead({title:'Talk to a DCW counsellor',interest:vertical})}>Book a free call<ArrowRight/></button></div></section></main>}
function categories(v){if(v==='distance')return[{name:'Complete 10th',kicker:'OPEN SCHOOL',desc:'Recognised open boards with flexible exam cycles.',icon:<BookOpen/>,href:'/distance/boards'},{name:'Complete 12th',kicker:'OPEN SCHOOL',desc:'Finish 12th in as little as 45 days, gap years covered.',icon:<ScrollText/>,href:'/distance/boards'},{name:'UG distance',kicker:'BACHELOR\u2019S',desc:'BA, B.Com, BBA and BCA from UGC-DEB universities.',icon:<GraduationCap/>,href:'/distance/universities'},{name:'PG distance',kicker:'MASTER\u2019S',desc:'MBA, MCA and MA built around working hours.',icon:<Award/>,href:'/distance/universities'},{name:'Online degree',kicker:'100% ONLINE',desc:'Fully online degrees with proctored online exams.',icon:<Laptop/>,href:'/distance/universities'},{name:'Fast track',kicker:'QUICKEST ROUTE',desc:'The fastest legitimate path to your certificate.',icon:<Zap/>,href:'/distance/boards'}];if(v==='colleges')return[{name:'Medical',kicker:'MBBS & BDS',desc:'Cutoffs, seats and the full cost \u2014 not just tuition.',icon:<Stethoscope/>,href:'/colleges/search'},{name:'Engineering',kicker:'B.TECH',desc:'JEE percentile, branch-wise fees and placement records.',icon:<Cog/>,href:'/colleges/search'},{name:'Management',kicker:'BBA & MBA',desc:'Entrance accepted, fee versus average package.',icon:<TrendingUp/>,href:'/colleges/search'},{name:'Law',kicker:'BA LLB',desc:'CLAT and state law entrances with five-year options.',icon:<Scale/>,href:'/colleges/search'},{name:'Study abroad',kicker:'GLOBAL OPTIONS',desc:'Country-wise cost, approvals and intake timelines.',icon:<Plane/>,href:'/colleges/search'},{name:'Commerce',kicker:'B.COM',desc:'Regular and honours streams with CA-friendly timing.',icon:<Calculator/>,href:'/colleges/search'}];return[{name:'Jobs near me',kicker:'LOCAL ROLES',desc:'Verified Patna openings with the salary stated upfront.',icon:<MapPin/>,href:'/jobs/search'},{name:'Free resume builder',kicker:'3 SIMPLE STEPS',desc:'Create a clean, recruiter-ready resume in minutes.',icon:<FileText/>,href:'/jobs/resume-builder'},{name:'Skill to job',kicker:'SHORT COURSES',desc:'Job-linked courses from six weeks, with placement help.',icon:<Wrench/>,href:'/jobs/search'},{name:'Sarkari exam alerts',kicker:'BSSC \u00b7 SSC \u00b7 RAILWAY',desc:'Form dates and eligibility, pushed before the deadline.',icon:<Bell/>,href:'/jobs/search'}]}
function SectionTitle({kicker,title,action,onAction}){return <div className="section-title"><div><span className="kicker">{kicker}</span><h2>{title}</h2></div>{action&&<button onClick={onAction}>{action}<ArrowRight/></button>}</div>}
/* ---------- Generated card artwork ----------------------------------------
   public/ holds three editorial photographs and the logo lockups; there is no
   per-category or per-university imagery, and inventing a university's logo or
   campus photo would be a lie told in pixels. So a card header is DRAWN: a
   duotone field with a route line crossing it, which is the same "your next
   move, made visible" idea the hero art carries. Seeded off the card's own
   name, so a card always draws the same plate and the set reads as a family
   rather than as noise. Pass `image` and real photography takes over with no
   other change. */
function seedOf(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
/* Cubic through the points with horizontal control handles — always smooth,
   never overshoots, and cheap enough to run per card during render. */
function routePath(pts){return pts.map(([x,y],i,a)=>{if(i===0)return `M${x} ${y}`;const[px,py]=a[i-1];const dx=(x-px)*.5;return `C${(px+dx).toFixed(1)} ${py} ${(x-dx).toFixed(1)} ${y} ${x} ${y}`}).join('')}
/* ── PLATE ────────────────────────────────────────────────────────────────
   One motif on every card made the grid read as wallpaper: six tiles that
   differed only in the wiggle of a line. A plate now draws from six motif
   families and six tonal keys, both picked from the item's own name, so a
   card looks the same on every visit but no two neighbours look alike.
   Pass `image` and licensed photography replaces the drawing outright. */
const PLATE_MOTIFS=['route','arcs','grid','climb','orbit','strata'];

function plateMotif(kind,h,uid){
  const R=(i)=>((h>>>((i*5)%27))&31)/31;              /* stable 0..1 per slot */
  const line='var(--plate-line)',node='var(--plate-node)';
  if(kind==='route'){
    const N=4,pts=Array.from({length:N+1},(_,i)=>[+((i/N)*120).toFixed(1),+(19+R(i)*38).toFixed(1)]);
    const d=routePath(pts);
    return <>
      {[-15,-10,-5,5,10,15].map(o=><path key={o} d={d} transform={`translate(0 ${o})`} fill="none"
        stroke={line} strokeOpacity={o%10===0?'.10':'.16'} strokeWidth=".7"/>)}
      <path d={d} fill="none" stroke={`url(#${uid}s)`} strokeWidth="1.9" strokeLinecap="round"/>
      {pts.filter((_,i)=>i%2===0).map(([x,y],i)=><g key={i}>
        <circle cx={x} cy={y} r="3.4" fill={node} opacity=".22"/><circle cx={x} cy={y} r="1.7" fill={node}/></g>)}
    </>;
  }
  if(kind==='arcs'){
    /* Widening rings from the lower-left: distance covered, not a path. */
    const cx=-4,cy=84;
    return <>
      {Array.from({length:8},(_,i)=>{const r=16+i*13.5;
        return <path key={i} d={`M${cx+r} ${cy}A${r} ${r} 0 0 1 ${cx} ${cy-r}`} fill="none" stroke={line}
          strokeOpacity={i===3?'.9':(i%2?'.13':'.2')} strokeWidth={i===3?'1.9':'.75'} strokeLinecap="round"/>})}
      {[0,1,2].map(i=>{const r=16+3*13.5,a=(.18+R(i)*.5)*Math.PI/2;
        return <g key={i} transform={`translate(${(cx+r*Math.cos(a)).toFixed(1)} ${(cy-r*Math.sin(a)).toFixed(1)})`}>
          <circle r="3.4" fill={node} opacity=".22"/><circle r="1.7" fill={node}/></g>})}
    </>;
  }
  if(kind==='grid'){
    /* A plane receding to a horizon — structure, syllabus, a laid-out plan. */
    const vy=14;
    return <>
      {Array.from({length:9},(_,i)=>{const y=+(76-62*Math.pow(1-i/9,1.75)).toFixed(1);
        return <line key={'h'+i} x1="0" y1={y} x2="120" y2={y} stroke={line} strokeOpacity={i>6?'.24':'.13'} strokeWidth=".7"/>})}
      {Array.from({length:9},(_,i)=>{const x=i*15;
        return <line key={'v'+i} x1={x} y1="76" x2={(60+(x-60)*.16).toFixed(1)} y2={vy}
          stroke={line} strokeOpacity=".12" strokeWidth=".7"/>})}
      <line x1="0" y1="76" x2="120" y2="76" stroke={line} strokeOpacity=".5" strokeWidth="1.6"/>
      {[0,1,2].map(i=><g key={i} transform={`translate(${(22+i*38+R(i)*10).toFixed(1)} ${(52+R(i+3)*14).toFixed(1)})`}>
        <circle r="3.4" fill={node} opacity=".2"/><circle r="1.7" fill={node}/></g>)}
    </>;
  }
  if(kind==='climb'){
    /* Ascending steps: a level gained, a salary band, a year completed. */
    const n=7,w=11,gap=5.4,x0=8;
    return <>
      {Array.from({length:n},(_,i)=>{const hgt=14+i*6.4+R(i)*9,x=x0+i*(w+gap);
        return <rect key={i} x={+x.toFixed(1)} y={+(70-hgt).toFixed(1)} width={w} height={+hgt.toFixed(1)} rx="2.5"
          fill={line} fillOpacity={i===n-1?'.82':(.13+i*.055).toFixed(2)}/>})}
      <line x1="0" y1="70.6" x2="120" y2="70.6" stroke={line} strokeOpacity=".42" strokeWidth="1.2"/>
    </>;
  }
  if(kind==='orbit'){
    /* Concentric reach — options circling one decision at the centre. */
    const cx=84,cy=26;
    return <>
      {[13,24,35,47,60].map((r,i)=><ellipse key={i} cx={cx} cy={cy} rx={r} ry={r*.62} fill="none"
        stroke={line} strokeOpacity={i===1?'.7':'.14'} strokeWidth={i===1?'1.7':'.75'}/>)}
      <circle cx={cx} cy={cy} r="4.6" fill={node} opacity=".2"/><circle cx={cx} cy={cy} r="2.2" fill={node}/>
      {[0,1,2,3].map(i=>{const r=[13,24,35,47][i],a=R(i)*Math.PI*2;
        return <g key={i} transform={`translate(${(cx+r*Math.cos(a)).toFixed(1)} ${(cy+r*.62*Math.sin(a)).toFixed(1)})`}>
          <circle r="3" fill={node} opacity=".2"/><circle r="1.5" fill={node}/></g>})}
    </>;
  }
  /* strata — layered ground: intakes, semesters, things that stack up. */
  const band=(off,amp)=>routePath(Array.from({length:5},(_,i)=>
    [+((i/4)*120).toFixed(1),+(off+Math.sin(i*1.3+amp)*amp).toFixed(1)]))+'L120 76L0 76Z';
  return <>
    {[0,1,2,3,4].map(i=><path key={i} d={band(28+i*11,2.4+R(i)*4)} fill={line}
      fillOpacity={(.07+i*.045).toFixed(2)}/>)}
    <path d={routePath(Array.from({length:5},(_,i)=>[+((i/4)*120).toFixed(1),+(28+Math.sin(i*1.3+2.4)*2.4).toFixed(1)]))}
      fill="none" stroke={`url(#${uid}s)`} strokeWidth="1.7" strokeLinecap="round"/>
  </>;
}

function Plate({seed,icon,mark,tag,image,alt='',ratio,tone,motif}){
  const h=seedOf(seed);
  const uid='pl'+(h%1679616).toString(36);
  const g=tone??h%6;                       /* tonal key */
  /* In a grid the caller passes `tone`, and stride 5 (coprime with 6) then
     guarantees neighbouring cards never share a motif; the seed only decides
     which motif the row starts on, so two grids of the same length still
     differ. Loose plates fall back to the pure seed. */
  const kind=motif??(tone==null
    ? PLATE_MOTIFS[(h>>>11)%6]
    : PLATE_MOTIFS[(tone*5+((h>>>11)%6))%6]);
  const mix=58+((h>>>19)&31);              /* how far the field leans on the accent */
  const tilt=((h>>>26)&7)-3;               /* keeps the family varied without breaking it */
  return <span className={`plate g${g}`} style={{'--plate-mix':mix+'%',...(ratio?{aspectRatio:ratio}:null)}}>
    {image
      ? <Image className="plate-photo" src={image} alt={alt} fill sizes="(max-width:760px) 100vw, 33vw"/>
      : <svg className="plate-art" viewBox="0 0 120 76" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--plate-a)"/><stop offset="1" stopColor="var(--plate-b)"/>
            </linearGradient>
            <linearGradient id={uid+'s'} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--plate-line)" stopOpacity=".16"/>
              <stop offset=".62" stopColor="var(--plate-line)" stopOpacity="1"/>
              <stop offset="1" stopColor="var(--plate-line)" stopOpacity=".4"/>
            </linearGradient>
          </defs>
          <rect width="120" height="76" fill={`url(#${uid})`}/>
          <g transform={`rotate(${tilt} 60 38)`}>{plateMotif(kind,h,uid)}</g>
        </svg>}
    {tag&&<span className="plate-tag">{tag}</span>}
    {mark&&<span className="plate-mark" aria-hidden="true">{mark}</span>}
    {icon&&<span className="plate-chip" aria-hidden="true">{icon}</span>}
  </span>;
}
/* One hero contract for every interior page. Content pages get the editorial
   photograph; tool pages get a generated field in the vertical's own palette,
   because stock imagery on a resume builder would be a lie about the page. */
function PageHero({kicker,title,lead,photo,alt='',pills,children,tone='canvas'}){
  return <section className={`tool-hero page-hero ${photo?'photo-hero':'canvas-hero t-'+tone}`}>
    {photo
      ? <><picture>
          <source type="image/webp" media="(max-width:900px)" srcSet={`/${photo}-900.webp`}/>
          <source type="image/webp" srcSet={`/${photo}-full.webp`}/>
          <img src={`/${photo}.png`} alt={alt} decoding="async"/>
        </picture><span className="hero-shade" aria-hidden="true"/></>
      : <span className="hero-weave" aria-hidden="true"/>}
    <div className="container tool-hero-copy">
      <span className="kicker">{kicker}</span>
      <h1>{title}</h1>
      {lead&&<p>{lead}</p>}
      {children&&<div className="tool-hero-cta">{children}</div>}
      {pills&&<div className="hero-pills">{pills}</div>}
    </div>
  </section>;
}

function PathCard({item,i,cta='Explore',onClick}){
  return <article className={`path-card p${i}`}>
    <Plate seed={item.name} tone={i%6} icon={item.icon} tag={item.kicker} image={item.image} alt={item.imageAlt||''}/>
    <div className="pc-body">
      <h3><button type="button" className="pc-link" onClick={onClick}>{item.name}</button></h3>
      <p>{item.desc}</p>
      <span className="pc-go" aria-hidden="true">{cta}<ArrowRight/></span>
    </div>
  </article>;
}
/* The card now leads with a plate the same way the path cards do — item 3 asked
   for this treatment on "all the rectangular boxes". The monogram rides on the
   plate as a glass tile: an honest typographic mark, since we hold no licensed
   university logo. Pass `item.image` and real photography takes the plate over.
   The footer carries a real Apply action (item 5) next to Details, so a card is
   the end of the decision, not another hop. */
function EntityCard({item,vertical,go,saved,toggleSave,compare,toggleCompare,setLead}){
  const href=vertical==='distance'?`/distance/university/${item.id}`:vertical==='colleges'?`/colleges/college/${item.id}`:`/jobs/${item.id}`;
  const isJob=vertical==='jobs';
  const list=coursesOf(item);
  const isSaved=saved.includes(item.id);
  const apply=()=>setLead({mode:'apply',
    title:isJob?`Apply for ${item.name}`:`Apply to ${item.name}`,
    interest:item.id,interestType:isJob?'job':'course',
    course:isJob?item.name:list[0].name,
    courses:isJob?null:list.map(c=>c.name),
    where:item.place});
  return <article className="entity-card">
    <Plate seed={item.name} mark={item.mark} tag={item.approval[0]} image={item.image} alt={item.imageAlt||''}/>
    <button aria-label={isSaved?`Remove ${item.name} from saved`:`Save ${item.name}`} aria-pressed={isSaved}
      className={isSaved?'ec-save active':'ec-save'} onClick={()=>toggleSave(item.id)}><Heart/></button>
    <div className="ec-body">
      <h3><button type="button" className="ec-link" onClick={()=>go(href)}>{item.name}</button></h3>
      <p><MapPin/>{item.place} · {item.type}</p>
          {isJob&&<div className="ec-signals">
            {item.km!=null&&<span className="sig near"><Navigation/>{item.km<1?'<1':Math.round(item.km)} km away</span>}
            {item.wfh&&<span className="sig wfh"><Wifi/>Work from home</span>}
            {(item.postedDays??99)<=3&&<span className="sig fresh"><Flame/>Posted {item.postedDays===0?'today':item.postedDays===1?'yesterday':`${item.postedDays} days ago`}</span>}
          </div>}
      <div className="metrics">
        <span><small>{isJob?'SALARY':'TOTAL FEE'}</small><b>{isJob?item.duration:fmt(item.fee)}{item.mrp&&<s className="mrp">{fmt(item.mrp)}</s>}</b></span>
        <span><small>{isJob?'ELIGIBILITY':'DURATION'}</small><b>{isJob?item.course:item.duration}</b></span>
        <span><small>{isJob?'OPENINGS':'RATING'}</small><b>{isJob?item.emi:<><Star/> {item.rating}</>}</b></span>
      </div>
      <div className="tags">{item.approval.map(x=><span key={x}>{x}</span>)}<span>{item.mode}</span>{isJob&&item.sector&&<span>{item.sector}</span>}
        {!isJob&&list.length>1&&<span className="tag-more">{list.length} courses</span>}</div>
    </div>
    <div className="entity-foot">
      {!isJob&&<label className="ec-compare"><input type="checkbox" checked={compare[vertical].includes(item.id)} onChange={()=>toggleCompare(item.id)}/><span>Compare</span></label>}
      <button className="btn outline small" onClick={()=>go(href)}>{isJob?'View job':'Details'}</button>
      <button className="btn primary small" onClick={apply}>Apply now<ArrowRight/></button>
    </div>
  </article>;
}
function DecisionBlock({vertical,go}){const data=vertical==='distance'?['BOARD DECISION GUIDE','NIOS, BOSSE or BBOSE?','Compare recognition, exam speed, fees and flexibility side by side.','/distance/boards',['NIOS','BOSSE','BBOSE']]:vertical==='colleges'?['NEET COLLEGE PREDICTOR','Turn one rank into a practical shortlist.','Get strong, possible and backup choices based on category, state and budget.','/colleges/neet-predictor',['Strong chance','Possible','Backup']]:['FREE RESUME BUILDER','Your experience deserves a clear story.','Build a focused fresher resume with guided prompts and two polished templates.','/jobs/resume-builder',['Profile','Skills','Preview']];return <section className="section ink"><div className="container decision"><div><span className="kicker">{data[0]}</span><h2>{data[1]}</h2><p>{data[2]}</p><button className="btn light" onClick={()=>go(data[3])}>Try the free tool<ArrowRight/></button></div><div className="route-visual"><svg viewBox="0 0 520 220"><path d="M30 170 C150 170, 125 45, 250 85 S385 195, 495 48"/><circle cx="30" cy="170" r="8"/><circle cx="250" cy="85" r="8"/><circle cx="495" cy="48" r="8"/></svg>{data[4].map((x,i)=><span key={x} style={{left:`${i*42+4}%`,top:`${[72,25,5][i]}%`}}><b>0{i+1}</b>{x}</span>)}</div></div></section>}
/* ---------- Listing --------------------------------------------------------
   Shared by all three verticals, but jobs are a genuinely different search:
   people filter a course by money and a job by PLACE first. So the jobs branch
   leads with an editorial hero and a locator band (city chips + "use my
   location"), and only then falls into the shared filter/results layout. */
function Listing(ctx){
  const {vertical,setLead}=ctx;
  const isJobs=vertical==='jobs';
  const initial=isJobs?jobs:vertical==='colleges'?colleges:universities;
  const limit=isJobs?600000:15000000;
  const MUSTS=isJobs?['Verified salary','Freshers welcome','Work from home','Posted this week']
                    :['Verified data','Clear fees / salary','Student support','Latest intake'];
  const [type,setType]=useState('All'),[sort,setSort]=useState('Recommended'),[max,setMax]=useState(limit);
  const [must,setMust]=useState(isJobs?[]:['Verified data']);
  const [city,setCity]=useState('All'),[sector,setSector]=useState('All');
  /* geo.state: idle -> asking -> ok | denied | unsupported | error.
     Nothing is requested until the person presses the button — the browser
     prompt is theirs to accept, and every other state has a written fallback. */
  const [geo,setGeo]=useState({state:'idle'});
  const [nearbyOpen,setNearbyOpen]=useState(false);
  const reset=()=>{setType('All');setSort('Recommended');setMax(limit);setMust(isJobs?[]:['Verified data']);setCity('All');setSector('All')};

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
  [type,sort,max,must,initial,isJobs,city,sector,here]);

  /* The pop-up recommendation the location prompt earns: the three closest
     roles, plus how many sit inside a realistic daily commute. */
  const nearby=useMemo(()=>{
    if(!here)return null;
    const withKm=jobs.map(j=>({...j,km:jobKm(j,here)}));
    const commutable=withKm.filter(j=>j.km!=null&&j.km<=60);
    return {
      top:withKm.filter(j=>j.km!=null).sort((a,b)=>a.km-b.km).slice(0,3),
      commutable:commutable.length,
      remote:withKm.filter(j=>j.wfh).length
    };
  },[here]);

  const sortOptions=isJobs
    ?[...(here?['Nearest first']:[]),'Recommended','Newest first','Salary: high to low','Salary: low to high','Rating']
    :['Recommended','Price: low to high','Price: high to low','Rating'];

  const cityChips=['All',...JOB_CITIES.slice(0,6)];
  const activeFilters=[type!=='All'&&type,city!=='All'&&city,sector!=='All'&&sector,...must].filter(Boolean);

  return <main className={isJobs?'listing-page jobs-listing':'listing-page'}>

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
          <a className="btn ghost" href="#results">Browse {jobs.length} openings<ArrowRight/></a>
        </div>
        <div className="hero-pills">
          <span><ShieldCheck/>{jobs.filter(j=>j.approval.some(a=>/verified/i.test(a))).length} verified employers</span>
          <span><Wifi/>{jobs.filter(j=>j.wfh).length} work from home</span>
          <span><Flame/>{jobs.filter(j=>(j.postedDays??99)<=3).length} posted this week</span>
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
        <span><ShieldCheck/>{data.length} verified {vertical==='colleges'?'colleges':'universities'}</span>
        <span><Scale/>Compare up to 3 side by side</span>
        <span><Clock3/>Updated every admission cycle</span>
      </>}>
      <a className="btn primary tactile" href="#results">Browse {data.length} results<ArrowRight/></a>
      <button className="btn ghost" onClick={()=>setLead({title:'Talk to a DCW counsellor',interest:vertical})}>Talk to a counsellor</button>
    </PageHero>}

    {isJobs&&<div className="container locator">
      <div className="locator-head">
        <span className="kicker"><MapPin/>WHERE DO YOU WANT TO WORK?</span>
        {geo.state==='ok'
          ?<p className="locator-live"><span className="pulse" aria-hidden="true"/>Closest to <b>{geo.label}</b> · {nearby?.commutable??0} within a 60&nbsp;km commute<button className="linkish" onClick={clearLocation}>Clear</button></p>
          :geo.state==='denied'?<p className="locator-note">Location is off, so pick your city below — nothing else changes.</p>
          :geo.state==='error'?<p className="locator-note">We could not read your location. Pick your city below instead.</p>
          :geo.state==='unsupported'?<p className="locator-note">This browser cannot share a location. Pick your city below.</p>
          :<p className="locator-note">Pick a city, or share your location once and we will rank every opening by how far it actually is.</p>}
      </div>
      <div className="locator-row">
        <div className="city-chips" role="group" aria-label="Filter by city">
          {cityChips.map(c=><button key={c} type="button" aria-pressed={city===c}
            className={city===c?'chip on':'chip'} onClick={()=>setCity(c)}>
            {c==='Remote'&&<Wifi/>}{c==='All'?`All cities`:c}
            <small>{c==='All'?jobs.length:jobs.filter(j=>j.city===c).length}</small>
          </button>)}
        </div>
        <button className={geo.state==='ok'?'btn outline small locate on':'btn outline small locate'}
          onClick={askLocation} disabled={geo.state==='asking'}>
          <LocateFixed/>{geo.state==='asking'?'Finding you…':geo.state==='ok'?'Located':'Use my location'}
        </button>
      </div>
    </div>}

    <div className="container listing-layout" id="results">
      <aside className="filters">
        <div className="filter-title"><b><Filter/>Filters</b><button onClick={reset}>Reset</button></div>
        {isJobs&&<label>City<select value={city} onChange={e=>setCity(e.target.value)}>
          <option>All</option>{JOB_CITIES.map(c=><option key={c}>{c}</option>)}
        </select></label>}
        {isJobs&&<label>Industry<select value={sector} onChange={e=>setSector(e.target.value)}>
          <option>All</option>{JOB_SECTORS.map(c=><option key={c}>{c}</option>)}
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
      </aside>

      <div className="results">
        <div className="results-head">
          <h2 className="rh-count"><b>{data.length}</b> matching {isJobs?'openings':'results'}{isJobs&&city!=='All'?` in ${city}`:''}</h2>
          <label>Sort by<select value={sort} onChange={e=>setSort(e.target.value)}>
            {sortOptions.map(o=><option key={o}>{o}</option>)}
          </select></label>
        </div>
        {isJobs&&activeFilters.length>0&&<div className="active-filters">
          {activeFilters.map(f=><span key={f}>{f}</span>)}
          <button className="linkish" onClick={reset}>Clear all</button>
        </div>}
        {data.length
          ?data.map(x=><EntityCard key={x.id} item={x} {...ctx}/>)
          :<div className="empty"><Search/><h2>No exact matches</h2><p>Adjust the filters or reset them to see every option.</p><button className="btn primary" onClick={reset}>Reset filters</button></div>}
      </div>
    </div>

    {isJobs&&nearbyOpen&&nearby&&<div className="nearby-pop" role="dialog" aria-label="Jobs near you">
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
function Detail(ctx){const {entity,vertical,setLead,toggleSave,saved,toggleCompare,compare}=ctx;return <main className="detail-page"><div className="container breadcrumbs">Home <ChevronRight/> {V[vertical].label} <ChevronRight/> <b>{entity.name}</b></div><section className="detail-banner"><picture>
  <source type="image/webp" media="(max-width:900px)" srcSet={vertical==='jobs'?'/career-editorial-900.webp':'/campus-editorial-900.webp'}/>
  <source type="image/webp" srcSet={vertical==='jobs'?'/career-editorial-full.webp':'/campus-editorial-full.webp'}/>
  <img src={vertical==='jobs'?'/career-editorial.png':'/campus-editorial.png'} alt="" decoding="async"/>
</picture><span className="hero-shade" aria-hidden="true"/><div className="container db-copy">
  <span className="db-kicker">{vertical==='jobs'?'Hiring now':vertical==='colleges'?'Campus profile':'Recognised institution'}</span>
  <h2>{vertical==='jobs'?entity.company||entity.place.split(' \u2022 ')[0]:entity.name.replace(/ (University|Online).*$/,'')}</h2>
  <p><MapPin/>{vertical==='jobs'?<>{entity.wfh?'Work from home':`${entity.area?entity.area+', ':''}${entity.city}`} · {entity.sector}</>:<>{entity.place} · {entity.mode}</>}</p>
</div></section><section className="container detail-hero"><span className="entity-mark large">{entity.mark}</span><div className="detail-copy"><span className="verified"><ShieldCheck/>{entity.approval.join(' • ')}</span><h1>{entity.name}</h1><p><MapPin/>{entity.place} · {entity.type}</p><div className="detail-tags"><span><Star/> {entity.rating} ({entity.reviews} reviews)</span><span><CalendarDays/> {entity.deadline}</span><span><Clock3/> Updated today</span></div></div><div className="detail-action"><small>{vertical==='jobs'?'SALARY':'STARTING FROM'}</small><b>{vertical==='jobs'?entity.duration:fmt(entity.fee)}{entity.mrp&&<s className="mrp">{fmt(entity.mrp)}</s>}</b><button className="btn primary" onClick={()=>setLead({mode:'apply',title:`Apply to ${entity.name}`,interest:entity.id,interestType:vertical==='jobs'?'job':'course',course:vertical==='jobs'?entity.name:coursesOf(entity)[0].name,courses:vertical==='jobs'?null:coursesOf(entity).map(c=>c.name),where:entity.place})}>Apply now<ArrowRight/></button><button className="btn outline" onClick={()=>setLead({title:`Talk about ${entity.name}`,interest:entity.id})}>Request a callback<MessageCircle/></button><button className="btn outline" onClick={()=>toggleSave(entity.id)}>{saved.includes(entity.id)?'Saved':'Save for later'}<Heart/></button></div></section><nav className="anchor-nav"><div className="container"><a href="#overview">Overview</a><a href="#fees">{vertical==='jobs'?'Role details':'Courses & fees'}</a><a href="#proof">{vertical==='jobs'?'Company':'Approvals'}</a><a href="#process">Process</a><a href="#faq">FAQs</a></div></nav><div className="container detail-layout"><div><section id="overview" className="detail-section"><span className="kicker">AT A GLANCE</span><h2>{vertical==='jobs'?'A clear role with a clear starting point':'Everything important, without the brochure language'}</h2><p>{vertical==='jobs'?`This ${entity.type.toLowerCase()} opportunity is open to ${entity.course}. The salary range is disclosed and the employer has been verified by the DCW jobs team.`:`${entity.name} offers ${entity.course} in ${entity.mode.toLowerCase()} mode. We show the total fee, approval status, expected duration and deadline together so you can make a practical comparison.`}</p><div className="fact-grid"><span><small>Mode</small><b>{entity.mode}</b></span><span><small>Duration / salary</small><b>{entity.duration}</b></span><span><small>Deadline</small><b>{entity.deadline}</b></span><span><small>Student support</small><b>Dedicated mentor</b></span></div></section><section id="fees" className="detail-section"><span className="kicker">TRANSPARENT NUMBERS</span><h2>{vertical==='jobs'?'Role, requirements and benefits':'Course-wise fee structure'}</h2>{vertical==='jobs'?<div className="role-panel"><div className="rp-main"><h3>What you will actually do</h3><ul>{dutiesOf(entity).map(d=><li key={d}><Check/>{d}</li>)}</ul><div className="rp-pay"><span><small>MONTHLY PAY</small><b>{entity.duration}</b></span><span><small>ANNUAL (INDICATIVE)</small><b>{fmt(entity.fee)}</b></span><span><small>OPENINGS</small><b>{entity.emi}</b></span></div></div><dl className="rp-facts"><div><dt>Employer</dt><dd>{entity.company||entity.place.split(' \u2022 ')[0]}</dd></div><div><dt>Where</dt><dd>{entity.wfh?'Work from home':`${entity.area?entity.area+', ':''}${entity.city}`}</dd></div><div><dt>Industry</dt><dd>{entity.sector}</dd></div><div><dt>Shift / mode</dt><dd>{entity.mode}</dd></div><div><dt>Eligibility</dt><dd>{entity.course}</dd></div><div><dt>Interview</dt><dd>In-person or video · no fee</dd></div></dl></div>:<div className="course-table" role="table" aria-label="Courses, fees and how to apply"><div className="ct-head" role="row"><span role="columnheader">Course</span><span role="columnheader">Duration</span><span role="columnheader">Total fee</span><span role="columnheader"><span className="sr-only">Apply</span></span></div>{coursesOf(entity).map(c=><div className="ct-row" role="row" key={c.name}><span role="cell"><b>{c.name}</b>{c.note&&<small>{c.note}</small>}</span><span role="cell" data-lbl="Duration">{c.duration}</span><span role="cell" data-lbl="Total fee"><b>{fmt(c.fee)}</b>{c.mrp&&<s className="mrp">{fmt(c.mrp)}</s>}</span><span role="cell"><button className="btn primary small" onClick={()=>setLead({mode:'apply',title:`Apply to ${entity.name}`,interest:entity.id,interestType:'course',course:c.name,courses:coursesOf(entity).map(x=>x.name),where:entity.place})}>Apply<ArrowRight/></button></span></div>)}</div>}<p className="note"><ShieldCheck/> Indicative demo data. Verify the final offer with the institution or employer.</p></section><section id="proof" className="detail-section"><span className="kicker">VERIFICATION</span><h2>Proof you can inspect</h2><div className="proof-cards">{entity.approval.map(x=><button key={x} onClick={()=>ctx.notify(`${x} document preview opened`)}><FileText/><span><b>{x}</b><small>Verified 12 Aug 2026</small></span><ExternalLink/></button>)}</div></section><section id="process" className="detail-section"><span className="kicker">WHAT HAPPENS NEXT</span><h2>A simple, visible process</h2><ol className="steps">{(vertical==='jobs'?['Apply with your basic profile','Get interview details on WhatsApp','Attend and track your status']:['Speak with a counsellor','Check eligibility and documents','Submit to the institution','Track your application']).map((x,i)=><li key={x}><span>0{i+1}</span><b>{x}</b></li>)}</ol></section><section id="faq" className="detail-section"><span className="kicker">COMMON QUESTIONS</span><h2>Before you decide</h2><Accordion title="Is this information verified?">Our research team checks approvals, fees and key facts against official sources each admission cycle. This prototype uses clearly marked indicative data.</Accordion><Accordion title="Does counselling cost anything?">No. DCW discovery and counselling are free for students.</Accordion><Accordion title="Can I save this and decide later?">Yes. Saved items remain available on this device.</Accordion></section></div><aside className="side-card"><span className="kicker">YOUR SHORTLIST</span><h3>Compare before you decide</h3><p>Add up to three options and see fees, duration, approvals and ratings together.</p>{vertical!=='jobs'&&<button className="btn outline" onClick={()=>toggleCompare(entity.id)}>{compare[vertical].includes(entity.id)?'Remove from compare':'Add to compare'}</button>}<button className="btn primary" onClick={()=>setLead({title:`Talk about ${entity.name}`,interest:entity.id})}>Talk to a counsellor</button></aside></div></main>}
function Accordion({title,children}){const [open,setOpen]=useState(false);return <div className="accordion"><button aria-expanded={open} onClick={()=>setOpen(!open)}><b>{title}</b><ChevronDown className={open?'rotate':''}/></button>{open&&<p>{children}</p>}</div>}
/* ---------- Board comparison ------------------------------------------------
   Was a bare table plus a quiz. Item 6 asked for a hero, real cards and the
   universities a certificate actually leads to. Order follows the decision, not
   the data: see the four routes -> read the facts side by side -> answer four
   questions -> see where it takes you -> apply. The table stays, because
   comparison is the one job a table does better than cards. */
const BOARDS=[
{id:'nios',name:'NIOS',full:'National Institute of Open Schooling',kicker:'CENTRAL BOARD',icon:<BadgeCheck/>,result:'45–60 days',fee:'₹18,500',exam:'2×/yr + on-demand',accept:'88 / 100',best:'Widest acceptance — college admission and government jobs.'},
{id:'bosse',name:'BOSSE',full:'Board of Open Schooling and Skill Education, Sikkim',kicker:'STATE BOARD',icon:<Zap/>,result:'45 days',fee:'₹17,000',exam:'On-demand',accept:'62 / 100',best:'Fastest legitimate route when a deadline is close.'},
{id:'bbose',name:'BBOSE',full:'Bihar Board of Open Schooling and Examination',kicker:'STATE BOARD',icon:<IndianRupee/>,result:'60–90 days',fee:'₹9,500',exam:'On-demand',accept:'45 / 100',best:'Lowest fee for Bihar learners who can follow a schedule.'},
{id:'cbse-patrachar',name:'CBSE',full:'CBSE Patrachar (correspondence)',kicker:'CENTRAL BOARD',icon:<Landmark/>,result:'55 days',fee:'₹22,000',exam:'Once a year',accept:'98 / 100',best:'When the certificate itself has to say CBSE.'}];
function Boards(ctx){const {setLead,go}=ctx;const [step,setStep]=useState(0),[answers,setAnswers]=useState([]);
  const qs=[['What matters most?',['Widest acceptance','Fastest result','Lowest fee']],['When do you want to appear?',['Next available exam','Within 3 months','No rush']],['Where will you use it?',['College admission','Government job','Skill course']],['Your location?',['Bihar','Elsewhere in India','Abroad']]];const scores={NIOS:0,BOSSE:0,BBOSE:0};answers.forEach(a=>{if(['Widest acceptance','College admission','Government job','Abroad'].includes(a))scores.NIOS+=2;if(['Fastest result','Next available exam','Within 3 months','Skill course'].includes(a))scores.BOSSE+=2;if(['Lowest fee','Bihar','No rush'].includes(a))scores.BBOSE+=2});const winner=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];const rationale={NIOS:'Best aligned with broad acceptance and mainstream admission or government-job use.',BOSSE:'Best aligned with faster examination cycles and flexible completion.',BBOSE:'Best aligned with budget-conscious Bihar learners who can follow a regular schedule.'}[winner];
  const applyTo=b=>setLead({mode:'apply',title:`Apply through ${b.name}`,interest:b.id,interestType:'board',course:`Class 12 via ${b.name}`,courses:[`Class 10 via ${b.name}`,`Class 12 via ${b.name}`],where:b.full});
  return <main className="tool-page">
    <section className="tool-hero">
      <picture>
        <source type="image/webp" media="(max-width:900px)" srcSet="/dcw-journey-hero-900.webp"/>
        <source type="image/webp" srcSet="/dcw-journey-hero-full.webp"/>
        <img src="/dcw-journey-hero.png" alt="Student looking toward a bright education and career pathway" decoding="async"/>
      </picture>
      <div className="hero-shade"/>
      <div className="container tool-hero-copy">
        <span className="eyebrow"><BookOpen size={16}/>BOARD DECISION GUIDE</span>
        <h1>Finish 10th or 12th<br/><em>on a board that counts.</em></h1>
        <p>Four recognised open-school routes, compared on the things that decide it — acceptance, exam cycle, result time and total fee. Then apply, with a counsellor checking your documents first.</p>
        <div className="hero-ctas">
          <button className="btn primary tactile" onClick={()=>applyTo(BOARDS[0])}>Apply for admission<ArrowRight/></button>
          <a className="btn ghost" href="#compare">Compare all four<ChevronDown/></a>
        </div>
      </div>
    </section>

    <section className="section container">
      <SectionTitle kicker="YOUR FOUR ROUTES" title="Pick the board that matches your deadline" action="Jump to comparison" onAction={()=>document.getElementById('compare')?.scrollIntoView({behavior:'smooth',block:'start'})}/>
      <div className="path-grid board-grid">{BOARDS.map((b,i)=>
        <article className="path-card board-card" key={b.id}>
          <Plate seed={b.full} tone={i%6} mark={b.name} tag={b.kicker} icon={b.icon}/>
          <div className="pc-body">
            <h3>{b.name}</h3>
            <p className="bc-full">{b.full}</p>
            <dl className="bc-facts">
              <div><dt>Result in</dt><dd>{b.result}</dd></div>
              <div><dt>Exam cycle</dt><dd>{b.exam}</dd></div>
              <div><dt>Indicative fee</dt><dd>{b.fee}</dd></div>
              <div><dt>Acceptance</dt><dd>{b.accept}</dd></div>
            </dl>
            <p className="bc-best"><Check/>{b.best}</p>
            <div className="bc-foot">
              <button className="btn primary small" onClick={()=>applyTo(b)}>Apply<ArrowRight/></button>
              <button className="btn outline small" onClick={()=>setLead({title:`${b.name} eligibility check`,interest:b.id})}>Check eligibility</button>
            </div>
          </div>
        </article>)}
      </div>
    </section>

    <section className="section wash" id="compare">
      <div className="container">
        <SectionTitle kicker="SIDE BY SIDE" title="The same seven facts, for every board"/>
        <div className="board-table">
          <div className="board-row head"><b>What matters</b><b>NIOS</b><b>BOSSE</b><b>BBOSE</b></div>
          {[['Recognition','Central board','Sikkim state board','Bihar state board'],['Exam frequency','2× yearly + on-demand','On-demand','On-demand'],['Typical result','45–60 days','45 days','60–90 days'],['Acceptance score','88 / 100','62 / 100','45 / 100'],['Subject flexibility','High','High','Medium'],['Indicative fee','₹18,500','₹17,000','₹9,500'],['Best for','Widest acceptance','Fastest result','Bihar, on-demand exam']].map(r=>
            <div className="board-row" key={r[0]}>{r.map((x,i)=><span key={i} className={i===2?'highlight':''}>{x}</span>)}</div>)}
        </div>
        <p className="note"><ShieldCheck/> Indicative demo data, checked against board circulars each admission cycle.</p>
      </div>
    </section>

    <section className="container quiz">
      <div><span className="kicker">2-MINUTE RECOMMENDATION</span><h2>{step<4?`Question ${step+1} of 4`:'Your best starting point'}</h2><div className="quiz-progress"><i style={{width:`${Math.min(step+1,4)*25}%`}}/></div></div>
      {step<4
        ? <div className="question"><h3>{qs[step][0]}</h3>{qs[step][1].map(x=><button key={x} onClick={()=>{setAnswers([...answers,x]);setStep(step+1)}}>{x}<ArrowRight/></button>)}</div>
        : <div className="recommend"><span className="entity-mark large">{winner.slice(0,2)}</span><div><span className="verified"><Check/> BEST FIT FROM YOUR ANSWERS</span><h3>Start with {winner}</h3><p>{rationale}</p><div className="bc-foot"><button className="btn primary" onClick={()=>applyTo(BOARDS.find(b=>b.name===winner)||BOARDS[0])}>Apply through {winner}<ArrowRight/></button><button className="text-btn" onClick={()=>{setStep(0);setAnswers([])}}><RotateCcw/>Restart quiz</button></div></div></div>}
    </section>

    <section className="section container">
      <SectionTitle kicker="WHERE IT TAKES YOU NEXT" title="Universities that admit open-school students" action="See all universities" onAction={()=>go('/distance/universities')}/>
      <p className="section-lede">Every board on this page is UGC-recognised for further study. These universities accept an open-school certificate directly — no bridge course, no extra year.</p>
      <div className="card-grid">{['amity-online','lpu','ignou'].map(id=>universities.find(u=>u.id===id)).filter(Boolean).map(u=><EntityCard key={u.id} item={u} {...ctx}/>)}</div>
    </section>
  </main>;
}
function Predictor({setLead}){const [rank,setRank]=useState('45000'),[category,setCategory]=useState('General'),[domicile,setDomicile]=useState('Bihar'),[budget,setBudget]=useState('25'),[done,setDone]=useState(false);const n=Math.max(1,Math.min(2500000,Number(rank)||1));const offset={General:0,OBC:9000,SC:26000,ST:34000}[category];const scored=[...colleges].map(x=>({...x,fit:Math.abs((Number(x.mode.match(/\d+/)?.[0])||50000)+offset-n)})).filter(x=>budget==='50'||budget==='plus'||x.fee<=2500000).sort((a,b)=>a.fit-b.fit);const picks=[scored[0]||colleges[0],scored[1]||colleges[1],scored[2]||colleges[3]];return <main className="tool-page"><div className="container predictor"><div className="predict-copy"><span className="kicker">NEET COLLEGE PREDICTOR</span><h1>Turn your rank into a realistic shortlist.</h1><p>We use indicative previous-year closing ranks to group colleges into strong, possible and backup choices.</p><ul><li><Check/> Three results shown free</li><li><Check/> Category and domicile aware</li><li><Check/> Budget included in the match</li></ul></div><form onSubmit={e=>{e.preventDefault();setDone(true)}} className="predict-form"><label>NEET rank<input value={rank} min="1" max="2500000" onChange={e=>setRank(e.target.value.replace(/\D/g,''))} required inputMode="numeric"/></label><div className="form-grid"><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option>General</option><option>OBC</option><option>SC</option><option>ST</option></select></label><label>Domicile<select value={domicile} onChange={e=>setDomicile(e.target.value)}><option>Bihar</option><option>Delhi</option><option>Uttar Pradesh</option></select></label></div><label>Total budget<select value={budget} onChange={e=>setBudget(e.target.value)}><option value="25">Up to ₹25 lakh</option><option value="50">Up to ₹50 lakh</option><option value="plus">₹50 lakh+</option></select></label><button className="btn primary">Show my college chances<ArrowRight/></button><small>This is a deterministic demo prediction—not official counselling advice.</small></form></div>{done&&<section className="container prediction-results"><SectionTitle kicker="YOUR INDICATIVE MATCHES" title={`Results for rank ${n.toLocaleString('en-IN')} · ${category} · ${domicile}`} action="Edit details" onAction={()=>setDone(false)}/><div className="bucket-grid">{[['Strong chance',picks[0],'Closest indicative cutoff match for the details you entered.'],['Possible',picks[1],'Worth tracking across later counselling rounds.'],['Backup',picks[2],'A practical alternative within the selected budget band.']].map((x,i)=><article key={x[0]}><span className={`bucket b${i}`}>{x[0]}</span><div className="entity-top"><span className="entity-mark">{x[1].mark}</span><div><h3>{x[1].name}</h3><p><MapPin/>{x[1].place}</p></div></div><p>{x[2]}</p><b>{x[1].mode}</b></article>)}</div><button className="btn primary unlock" onClick={()=>setLead({title:'Unlock full NEET shortlist',interest:`neet-${n}-${category}-${domicile}`})}>Unlock all matches<ArrowRight/></button></section>}</main>}
/* ---------- Resume builder --------------------------------------------------
   The first version collected five strings and printed them. A fresher's
   resume is rejected for the things it LEAVES OUT, so this version models the
   sections a recruiter actually scans, scores the draft against a written
   rubric rather than a vibe, and lays it out on a real A4 page. Export is the
   browser's own print-to-PDF: it produces a genuine, selectable-text PDF with
   no library, and no promise we cannot keep. */
const RESUME_SEED={
  name:'Amit Kumar',role:'Accounts & Operations Executive',city:'Patna, Bihar',
  phone:'+91 98765 43210',email:'amit.kumar@example.com',link:'linkedin.com/in/amitkumar',
  summary:'B.Com graduate with six months of hands-on Tally and GST experience from an internship at a practising firm. Comfortable owning day books, reconciliations and vendor follow-ups without supervision.',
  education:[
    {degree:'B.Com (Accounts & Finance)',school:'Patna University',year:'2022 – 2025',score:'72%'},
    {degree:'Class 12, Commerce',school:'BSEB, Patna',year:'2022',score:'78%'}],
  experience:[
    {title:'Accounts Intern',org:'Taxcare India, Patna',period:'Jan – Jun 2025',
     points:'Maintained day books and vendor ledgers in Tally Prime for 40+ client accounts\nPrepared GSTR-1 and GSTR-3B working files ahead of every filing deadline\nCut invoice-matching time by about a third by moving the team to a shared tracker'}],
  projects:[{name:'GST filing tracker',detail:'Excel workbook that flags missing purchase invoices before the filing date. Adopted by the whole intern team.'}],
  skills:['Tally Prime','GST returns','Advanced Excel','Bank reconciliation','Hindi & English communication'],
  certifications:['Tally Essential Level 1 — TallyEducation, 2024'],
  languages:['Hindi (native)','English (professional)','Bhojpuri (conversational)']
};
const RESUME_TEMPLATES=[
  {id:'classic',name:'Classic',blurb:'One column, no graphics. The safest choice when a company screens with software.',ats:'Best for ATS'},
  {id:'sidebar',name:'Sidebar',blurb:'Contact, skills and languages in a tinted rail so the right column stays about the work.',ats:'Best for skills-led roles'},
  {id:'banded',name:'Banded',blurb:'A coloured header band with your name and role. Reads well when a human shortlists by hand.',ats:'Best for walk-ins'}];
const RESUME_ACCENTS=[['ink','#16233B'],['blue','#0B4DA8'],['teal','#0C6E62'],['plum','#6B2E63'],['rust','#A5520A']];

const bullets=t=>String(t||'').split('\n').map(x=>x.replace(/^[•\-•]\s*/,'').trim()).filter(Boolean);
const words=t=>String(t||'').trim().split(/\s+/).filter(Boolean).length;

/* One repeated block of fields. Kept generic so education, experience and
   projects all use the same add / remove behaviour and read the same way. */
function Repeater({label,items,fields,onChange,addLabel,max=4}){
  const set=(i,k,v)=>onChange(items.map((it,n)=>n===i?{...it,[k]:v}:it));
  const add=()=>onChange([...items,Object.fromEntries(fields.map(f=>[f.key,'']))]);
  const drop=i=>onChange(items.filter((_,n)=>n!==i));
  return <div className="repeater">
    {items.map((it,i)=><fieldset key={i}>
      <legend>{label} {i+1}
        {items.length>1&&<button type="button" onClick={()=>drop(i)} aria-label={`Remove ${label} ${i+1}`}><X/></button>}
      </legend>
      {fields.map(f=><label key={f.key} className={f.wide?'wide':''}>{f.label}
        {f.area
          ?<textarea rows={f.rows||3} value={it[f.key]||''} placeholder={f.hint}
             onChange={e=>set(i,f.key,e.target.value)}/>
          :<input value={it[f.key]||''} placeholder={f.hint} onChange={e=>set(i,f.key,e.target.value)}/>}
        {f.note&&<small>{f.note}</small>}
      </label>)}
    </fieldset>)}
    {items.length<max&&<button type="button" className="btn outline small add" onClick={add}>+ {addLabel}</button>}
  </div>;
}

/* Free-text in, chips out. Enter or comma commits; backspace on an empty
   field removes the last chip, which is what people expect from a tag input. */
function ChipInput({label,items,onChange,hint,max=14}){
  const [draft,setDraft]=useState('');
  const commit=v=>{const t=v.trim().replace(/,$/,'');
    if(t&&!items.includes(t)&&items.length<max)onChange([...items,t]);setDraft('')};
  return <label className="chip-input">{label}
    <div className="ci-box">
      {items.map(x=><span key={x} className="ci-chip">{x}
        <button type="button" onClick={()=>onChange(items.filter(y=>y!==x))} aria-label={`Remove ${x}`}><X/></button>
      </span>)}
      <input value={draft} placeholder={items.length?'':hint}
        onChange={e=>e.target.value.includes(',')?commit(e.target.value):setDraft(e.target.value)}
        onKeyDown={e=>{
          if(e.key==='Enter'){e.preventDefault();commit(draft)}
          else if(e.key==='Backspace'&&!draft&&items.length)onChange(items.slice(0,-1))}}
        onBlur={()=>commit(draft)}/>
    </div>
    <small>{hint} · press Enter after each one</small>
  </label>;
}

/* The rendered page. All three templates share this data and differ only in
   how the same sections are arranged — no template hides information. */
function ResumeDoc({d,template,accent}){
  const contact=[d.city,d.phone,d.email,d.link].filter(Boolean);
  const Head=()=><>
    <h2>{d.name||'Your name'}</h2>
    <p className="rd-role">{d.role||'Target role'}</p>
    <p className="rd-contact">{contact.map((c,i)=><span key={c+i}>{c}</span>)}</p>
  </>;
  const Body=({withAside})=><>
    {d.summary&&<section><h3>Profile</h3><p>{d.summary}</p></section>}
    {d.experience.some(e=>e.title||e.org)&&<section><h3>Experience</h3>
      {d.experience.filter(e=>e.title||e.org).map((e,i)=><article key={i}>
        <div className="rd-row"><b>{e.title}</b><span>{e.period}</span></div>
        <em>{e.org}</em>
        {bullets(e.points).length>0&&<ul>{bullets(e.points).map(b=><li key={b}>{b}</li>)}</ul>}
      </article>)}
    </section>}
    {d.education.some(e=>e.degree||e.school)&&<section><h3>Education</h3>
      {d.education.filter(e=>e.degree||e.school).map((e,i)=><article key={i}>
        <div className="rd-row"><b>{e.degree}</b><span>{e.year}</span></div>
        <em>{e.school}{e.score?` · ${e.score}`:''}</em>
      </article>)}
    </section>}
    {d.projects.some(p=>p.name)&&<section><h3>Projects</h3>
      {d.projects.filter(p=>p.name).map((p,i)=><article key={i}>
        <div className="rd-row"><b>{p.name}</b></div><p>{p.detail}</p>
      </article>)}
    </section>}
    {!withAside&&d.skills.length>0&&<section><h3>Skills</h3><p className="rd-inline">{d.skills.join(' · ')}</p></section>}
    {d.certifications.length>0&&<section><h3>Certifications</h3>
      <ul>{d.certifications.map(c=><li key={c}>{c}</li>)}</ul></section>}
    {!withAside&&d.languages.length>0&&<section><h3>Languages</h3><p className="rd-inline">{d.languages.join(' · ')}</p></section>}
  </>;

  if(template==='sidebar')return <div className={`resume-doc t-sidebar a-${accent}`}>
    <aside className="rd-rail">
      <span className="rd-initials" aria-hidden="true">{(d.name||'CV').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()}</span>
      <h4>Contact</h4><ul>{contact.map((c,i)=><li key={c+i}>{c}</li>)}</ul>
      {d.skills.length>0&&<><h4>Skills</h4><ul>{d.skills.map(s=><li key={s}>{s}</li>)}</ul></>}
      {d.languages.length>0&&<><h4>Languages</h4><ul>{d.languages.map(s=><li key={s}>{s}</li>)}</ul></>}
    </aside>
    <div className="rd-main">
      <h2>{d.name||'Your name'}</h2><p className="rd-role">{d.role||'Target role'}</p>
      <Body withAside/>
    </div>
  </div>;

  if(template==='banded')return <div className={`resume-doc t-banded a-${accent}`}>
    <header className="rd-band"><Head/></header>
    <div className="rd-main"><Body/></div>
  </div>;

  return <div className={`resume-doc t-classic a-${accent}`}>
    <header className="rd-plain"><Head/></header>
    <div className="rd-main"><Body/></div>
  </div>;
}

function ResumeBuilder({notify}){
  const [step,setStep]=useState(0);
  const [template,setTemplate]=useState('classic');
  const [accent,setAccent]=useState('ink');
  const [d,setD]=useState(RESUME_SEED);
  const set=(k,v)=>setD(x=>({...x,[k]:v}));
  const STEPS=['Profile','Education','Experience','Skills','Design'];

  /* A written rubric, so the score means something specific and every miss
     names the fix. No points are awarded for filling a box with anything. */
  const checks=[
    ['A phone number and an email',!!(d.phone.trim()&&d.email.trim())],
    ['A named target role',d.role.trim().length>3],
    ['A profile of 25 words or more',words(d.summary)>=25],
    ['At least one qualification with a year',d.education.some(e=>e.degree.trim()&&e.year.trim())],
    ['Experience, an internship or a project',d.experience.some(e=>e.title.trim())||d.projects.some(p=>p.name.trim())],
    ['Two or more achievement bullets',d.experience.some(e=>bullets(e.points).length>=2)],
    ['A bullet with a number in it',d.experience.some(e=>bullets(e.points).some(b=>/\d/.test(b)))],
    ['Five or more skills',d.skills.length>=5],
    ['One certification or course',d.certifications.length>=1],
    ['A language you can work in',d.languages.length>=1]];
  const done=checks.filter(c=>c[1]).length;
  const score=done;   /* out of ten, deliberately — the user asked for a 10/10 */
  const missing=checks.filter(c=>!c[1]);

  return <main className="tool-page resume-page">
    <PageHero
      tone="rust"
      kicker="FREE RESUME BUILDER · NO SIGN-UP"
      title={<>A resume that survives<br/><em>the first ten seconds.</em></>}
      lead="Recruiters scan for a role, a number and a reason to call. Fill five steps and the page updates as you type — then print it to PDF from your own browser."
      pills={<>
        <span><FileText/>5 ATS-safe templates</span>
        <span><ShieldCheck/>Nothing leaves this device</span>
        <span><Clock3/>About 6 minutes</span>
      </>}>
      <a className="btn primary tactile" href="#builder">Start building<ArrowRight/></a>
    </PageHero>

    <div className="container resume-layout" id="builder">
      <div className="resume-form">
        <ol className="stepper">{STEPS.map((x,i)=>
          <li key={x}><button onClick={()=>setStep(i)} className={step===i?'active':i<step?'done':''}>
            <b>{i<step?<Check/>:i+1}</b><span>{x}</span></button></li>)}
        </ol>

        {step===0&&<>
          <label>Full name<input value={d.name} onChange={e=>set('name',e.target.value)}/></label>
          <label>Target role<input value={d.role} placeholder="Accounts Executive" onChange={e=>set('role',e.target.value)}/>
            <small>Write the job you are applying for, not &ldquo;fresher&rdquo;.</small></label>
          <div className="two-up">
            <label>Phone<input value={d.phone} onChange={e=>set('phone',e.target.value)}/></label>
            <label>Email<input type="email" value={d.email} onChange={e=>set('email',e.target.value)}/></label>
          </div>
          <div className="two-up">
            <label>City<input value={d.city} onChange={e=>set('city',e.target.value)}/></label>
            <label>Portfolio or LinkedIn<input value={d.link} placeholder="linkedin.com/in/…" onChange={e=>set('link',e.target.value)}/></label>
          </div>
          <label>Profile<textarea rows={4} value={d.summary} onChange={e=>set('summary',e.target.value)}
            placeholder="Two or three lines: what you studied, what you can already do, and what you want next."/>
            <small>{words(d.summary)} words · aim for 25–60.</small></label>
        </>}

        {step===1&&<Repeater label="Qualification" items={d.education} onChange={v=>set('education',v)}
          addLabel="Add another qualification"
          fields={[{key:'degree',label:'Course or class',hint:'B.Com (Accounts & Finance)'},
                   {key:'school',label:'Institution or board',hint:'Patna University'},
                   {key:'year',label:'Years',hint:'2022 – 2025'},
                   {key:'score',label:'Result',hint:'72% or 7.4 CGPA'}]}/>}

        {step===2&&<>
          <Repeater label="Role" items={d.experience} onChange={v=>set('experience',v)}
            addLabel="Add another role" max={3}
            fields={[{key:'title',label:'Job title',hint:'Accounts Intern'},
                     {key:'org',label:'Organisation',hint:'Taxcare India, Patna'},
                     {key:'period',label:'Period',hint:'Jan – Jun 2025'},
                     {key:'points',label:'What you did',area:true,rows:4,wide:true,
                      hint:'One achievement per line',
                      note:'Start each line with a verb and put a number in at least one.'}]}/>
          <p className="note"><Sparkles/> No job yet? A college project counts. Describe what you built and what changed because of it.</p>
          <Repeater label="Project" items={d.projects} onChange={v=>set('projects',v)}
            addLabel="Add a project" max={3}
            fields={[{key:'name',label:'Project name',hint:'GST filing tracker'},
                     {key:'detail',label:'What it does',area:true,rows:2,wide:true,hint:'One or two sentences.'}]}/>
        </>}

        {step===3&&<>
          <ChipInput label="Skills" items={d.skills} onChange={v=>set('skills',v)}
            hint="Tally Prime, Advanced Excel, GST returns"/>
          <ChipInput label="Certifications" items={d.certifications} onChange={v=>set('certifications',v)}
            hint="Course name — issuer, year" max={6}/>
          <ChipInput label="Languages" items={d.languages} onChange={v=>set('languages',v)}
            hint="Hindi (native), English (professional)" max={6}/>
        </>}

        {step===4&&<>
          <h3>Choose a layout</h3>
          <div className="template-picks">
            {RESUME_TEMPLATES.map(t=><button key={t.id} className={template===t.id?'active':''}
              onClick={()=>setTemplate(t.id)} aria-pressed={template===t.id}>
              <span className={`tp-thumb tp-${t.id}`} aria-hidden="true"><i/><i/><i/></span>
              <b>{t.name}</b><small>{t.blurb}</small><em>{t.ats}</em>
            </button>)}
          </div>
          <h3>Accent</h3>
          <div className="accent-picks" role="group" aria-label="Accent colour">
            {RESUME_ACCENTS.map(([id,hex])=><button key={id} aria-label={id} aria-pressed={accent===id}
              className={accent===id?'active':''} style={{'--sw':hex}} onClick={()=>setAccent(id)}/>)}
          </div>
          <p className="note"><ShieldCheck/> Printing uses your browser&rsquo;s own Save&nbsp;as&nbsp;PDF, so the text stays selectable and searchable — which is exactly what screening software needs.</p>
        </>}

        <div className="wizard-actions">
          {step>0&&<button className="btn outline" onClick={()=>setStep(step-1)}><ArrowLeft/>Back</button>}
          {step<4
            ?<button className="btn primary" onClick={()=>setStep(step+1)}>Continue<ArrowRight/></button>
            :<button className="btn primary" onClick={()=>{window.print();notify('Print dialog opened — choose Save as PDF')}}><Download/>Print / Save as PDF</button>}
        </div>
      </div>

      <div className="resume-side">
        <div className="score-card">
          <div className="sc-head">
            <span className="sc-ring" style={{'--pct':`${score*10}%`}}><b>{score}</b><small>/10</small></span>
            <div><b>Resume strength</b>
              <small>{score>=9?'Ready to send.':score>=6?'Solid — close the gaps below.':'Keep going; the essentials are still missing.'}</small></div>
          </div>
          {missing.length>0
            ?<ul className="sc-miss">{missing.slice(0,4).map(([label])=><li key={label}><X/>{label}</li>)}</ul>
            :<p className="sc-done"><Check/>Every check passed. Print it and apply.</p>}
        </div>
        <ResumeDoc d={d} template={template} accent={accent}/>
        <p className="resume-hint">A4 preview · updates as you type</p>
      </div>
    </div>
  </main>;
}
function SavedPage(ctx){const all=[...universities,...colleges,...jobs].filter(x=>ctx.saved.includes(x.id));return <main className="listing-page"><PageHero tone="teal" kicker="YOUR SHORTLIST" title={<>Saved for later.</>} lead="Everything you bookmarked across courses, colleges and jobs — kept on this device, so it survives a refresh." pills={<><span><Heart/>{all.length} saved</span><span><Scale/>Ready to compare</span></>}>{all.length>0&&<button className="btn primary tactile" onClick={()=>ctx.go(`/${ctx.vertical}/compare`)}>Compare these<ArrowRight/></button>}</PageHero><div className="container saved-grid">{all.length?all.map(x=><article className="saved-row" key={x.id}><span className="entity-mark">{x.mark}</span><div><h3>{x.name}</h3><p>{x.place}</p></div><button className="btn outline" onClick={()=>ctx.toggleSave(x.id)}>Remove</button></article>):<div className="empty"><Heart/><h2>Your shortlist is empty</h2><p>Save an institution or job and it will appear here—even after refresh.</p><button className="btn primary" onClick={()=>ctx.go('/distance')}>Start exploring</button></div>}</div></main>}
function ApplicationsPage({go}){const [records,setRecords]=useState([]);useEffect(()=>{try{setRecords(JSON.parse(localStorage.getItem('dcw-enquiries-v1')||'[]'))}catch{}},[]);return <main className="listing-page"><PageHero tone="forest" kicker="YOUR ACTIVITY" title={<>Applications <em>&amp; updates.</em></>} lead="Every enquiry and application created on this device, with the stage it has reached." pills={<><span><FileText/>{records.length} in progress</span><span><Clock3/>Updated live</span></>}/><div className="container app-timeline">{records.map(r=><article key={r.id}><span className="entity-mark">{r.title.slice(0,2).toUpperCase()}</span><div><small>{r.kind||'Enquiry'} • {r.id}{r.course?` • ${r.course}`:''}</small><h3>{r.title}</h3><div className="timeline-line"><i className="done"/><i/><i/><i/></div><div className="timeline-labels"><span>Submitted</span><span>Contact</span><span>Documents</span><span>Decision</span></div></div><button className="btn outline" onClick={()=>go('/notifications')}>Updates</button></article>)}<article><span className="entity-mark">AU</span><div><small>ONLINE MBA • AMITY ONLINE</small><h3>Application in review</h3><div className="timeline-line"><i className="done"/><i className="done"/><i/><i/></div><div className="timeline-labels"><span>Enquiry sent</span><span>Counsellor called</span><span>Documents</span><span>Confirmed</span></div></div><button className="btn outline" onClick={()=>go('/distance/university/amity-online')}>View</button></article><article><span className="entity-mark">HF</span><div><small>RELATIONSHIP EXECUTIVE • HDFC SALES</small><h3>Interview details received</h3><div className="timeline-line"><i className="done"/><i className="done"/><i className="done"/><i/></div><div className="timeline-labels"><span>Applied</span><span>Shortlisted</span><span>Interview</span><span>Offer</span></div></div><button className="btn outline" onClick={()=>go('/jobs/bpo-voice-associate-noida')}>View</button></article></div></main>}
function AccountPage({type,go,notify}){const [read,setRead]=useState([]);const notices=[['Deadline approaching','Amity Online August intake closes in 3 days.','/distance/university/amity-online'],['New match found','A verified fresher role matching Accounts was added.','/jobs/search'],['Predictor update','NEET counselling dates were refreshed today.','/colleges/neet-predictor']];if(type==='profile')return <main className="listing-page"><PageHero tone="indigo" kicker="YOUR ACCOUNT" title={<>Profile <em>&amp; preferences.</em></>} lead="The details we reuse to prefill applications and sharpen recommendations."/><div className="container profile-card"><div className="profile-head"><span className="entity-mark large">AK</span><div><h2>Amit Kumar</h2><p>Graduate · Patna, Bihar</p></div><button className="btn outline" onClick={()=>notify('Profile edit mode enabled — demo only')}>Edit profile</button></div><div className="fact-grid"><button onClick={()=>go('/saved')}><small>SHORTLIST</small><b>View saved choices</b></button><button onClick={()=>go('/applications')}><small>ACTIVITY</small><b>Track applications</b></button><button onClick={()=>go('/automations')}><small>PREFERENCES</small><b>Manage alerts</b></button><button onClick={()=>notify('Document vault opened — demo only')}><small>DOCUMENTS</small><b>Open demo vault</b></button></div></div></main>;return <main className="listing-page"><div className="container page-head"><span className="kicker">STAY ON TRACK</span><h1>Notifications</h1><p>Actionable updates from your saved choices and applications.</p></div><div className="container notification-list">{notices.map((n,i)=><article className={read.includes(i)?'read':''} key={n[0]}><span><Bell/><i/></span><div><h3>{n[0]}</h3><p>{n[1]}</p><small>{i+1} hour{i?'s':''} ago</small></div><button className="btn outline" onClick={()=>{setRead(x=>x.includes(i)?x:[...x,i]);go(n[2])}}>View update</button></article>)}<button className="text-btn" onClick={()=>{setRead([0,1,2]);notify('All notifications marked as read')}}>Mark all as read</button></div></main>}
function ComparePage({vertical,compare,toggleCompare,setLead}){const pool=vertical==='distance'?universities:vertical==='colleges'?colleges:jobs;const items=pool.filter(x=>compare[vertical].includes(x.id));return <main className="listing-page"><PageHero tone="canvas" kicker="DECISION MATRIX" title={<>Compare without<br/><em>the clutter.</em></>} lead="Only meaningful differences are highlighted. Add up to three choices and the row that actually decides it stands out." pills={<><span><Scale/>{items.length} of 3 selected</span></>}/><div className="container compare-page">{items.length<2?<div className="empty"><TrendingUp/><h2>Add one more option</h2><p>You need at least two choices for a useful comparison.</p></div>:<><div className="comparison-grid"><div className="compare-col labels"><b>Choice</b><span>Total fee / salary</span><span>Duration / eligibility</span><span>Approval</span><span>Rating</span><span>Deadline</span></div>{items.map(x=><div className="compare-col" key={x.id}><button className="remove" onClick={()=>toggleCompare(x.id)}><X/></button><span className="entity-mark">{x.mark}</span><b>{x.name}</b><span className="different">{vertical==='jobs'?x.duration:fmt(x.fee)}</span><span>{vertical==='jobs'?x.course:x.duration}</span><span>{x.approval[0]}</span><span>{x.rating} ★</span><span>{x.deadline}</span></div>)}</div><button className="btn primary compare-all" onClick={()=>setLead({title:`Enquire about ${items.length} compared choices`,interest:items.map(x=>x.id).join(',')})}>Enquire about all {items.length}<ArrowRight/></button></>}</div></main>}
function AutomationCenter({notify}){const [on,setOn]=useState(['Deadline reminders','Application status updates','New matching opportunities']);const groups=[['RIGHT-TIME ALERTS',[['Deadline reminders','7, 3 and 1 day nudges for saved choices'],['New matching opportunities','Jobs and courses matching your profile'],['Fee & cutoff changes','Material changes to your shortlist']]],['APPLICATION SUPPORT',[['Application status updates','Next action when your status changes'],['Document checklist nudges','Only the missing documents, before deadline'],['Interview preparation','Reminder plus role-specific preparation']]],['CONTROL & PRIVACY',[['Weekly shortlist digest','One concise weekly summary'],['WhatsApp updates','Use WhatsApp for selected alerts'],['Abandoned-form recovery','Resume unfinished applications once']]]];return <main className="listing-page automation-page"><div className="container page-head"><span className="kicker">AUTOMATION CENTRE</span><h1>Useful nudges. Never noise.</h1><p>Configure a transparent demo of the automations DCW can support. No external messages are sent.</p></div><div className="container automation-grid"><aside><Workflow/><h2>3 automations active</h2><p>Automation saves repetition, but you remain in control of channels, frequency and consent.</p><span>DEMO ONLY</span></aside><div>{groups.map(g=><section key={g[0]}><b>{g[0]}</b>{g[1].map(x=><button key={x[0]} onClick={()=>{setOn(a=>a.includes(x[0])?a.filter(y=>y!==x[0]):[...a,x[0]]);notify(`${x[0]} ${on.includes(x[0])?'paused':'enabled'} — demo only`)}}><span><strong>{x[0]}</strong><small>{x[1]}</small></span><i className={on.includes(x[0])?'enabled':''}><em/></i></button>)}</section>)}</div></div></main>}
function AskDCW({open,setOpen,vertical,go,setLead,compare}){const [view,setView]=useState('home');const actions=vertical==='jobs'?[['Find matching jobs','jobs'],['Improve my resume','resume'],['Check application status','status']]:vertical==='colleges'?[['Predict from my NEET rank','predict'],['Compare two colleges','compare'],['Talk to a counsellor','human']]:[['Find my best program','find'],['Compare two choices','compare'],['Check board validity','boards']];const choose=id=>{if(id==='jobs'||id==='find'){setOpen(false);go(vertical==='jobs'?'/jobs/search':'/distance/universities')}else if(id==='resume'){setOpen(false);go('/jobs/resume-builder')}else if(id==='status'){setOpen(false);go('/applications')}else if(id==='predict'){setOpen(false);go('/colleges/neet-predictor')}else if(id==='compare'){if(compare[vertical].length>=2){setOpen(false);go(`/${vertical}/compare`)}else setView('need-compare')}else if(id==='boards'){setOpen(false);go('/distance/boards')}else {setOpen(false);setLead({title:'Talk to a DCW counsellor',interest:vertical})}};return <div className={`bot-wrap ${open?'open':''}`}>{open&&<section className="bot-panel glass"><header><span><MessageCircle/><b>Ask DCW</b><small>Rule-based demo assistant</small></span><button aria-label="Close assistant" onClick={()=>setOpen(false)}><X/></button></header><div className="bot-body">{view==='home'?<><div className="bot-message">Hi—what would make your next decision easier?</div>{actions.map(x=><button className="bot-action" key={x[1]} onClick={()=>choose(x[1])}><span>{x[0]}</span><ArrowRight/></button>)}</>:<><div className="bot-message">Add at least two choices from the listing. I’ll keep them in a comparison tray for you.</div><button className="bot-action" onClick={()=>{setOpen(false);go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}}>Browse choices<ArrowRight/></button><button className="bot-reset" onClick={()=>setView('home')}><RotateCcw/>Back</button></>}</div><footer><ShieldCheck/> Indicative guidance • Human handoff available</footer></section>}<button className="bot-launch tactile" aria-label="Ask DCW assistant" onClick={()=>{setOpen(!open);setView('home')}}><MessageCircle/><i/></button></div>}
function SearchPanel({vertical,setSearchOpen,query,setQuery,go}){const [active,setActive]=useState(0);const pool=vertical==='distance'?universities:vertical==='colleges'?colleges:jobs;const results=query?pool.filter(x=>`${x.name} ${x.course} ${x.place}`.toLowerCase().includes(query.toLowerCase())):pool.slice(0,3);const open=x=>{setSearchOpen(false);go(vertical==='distance'?`/distance/university/${x.id}`:vertical==='colleges'?`/colleges/college/${x.id}`:`/jobs/${x.id}`)};useEffect(()=>{const key=e=>{if(e.key==='Escape')setSearchOpen(false);if(e.key==='ArrowDown'){e.preventDefault();setActive(x=>Math.min(x+1,results.length-1))}if(e.key==='ArrowUp'){e.preventDefault();setActive(x=>Math.max(x-1,0))}if(e.key==='Enter'&&results[active]){e.preventDefault();open(results[active])}};addEventListener('keydown',key);return()=>removeEventListener('keydown',key)},[results,active]);const chips=vertical==='distance'?['MBA','BCA','IGNOU','Delhi']:vertical==='colleges'?['MBBS','Patna','Government','Manipal']:['Fresher','Patna','Remote','Accounts'];return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSearchOpen(false)}}><div className="command" role="dialog" aria-label={`Search ${V[vertical].label}`}><div className="command-input"><Search/><input autoFocus value={query} onChange={e=>{setQuery(e.target.value);setActive(0)}} placeholder="Search by course, institution, role or city"/><button aria-label="Close search" onClick={()=>setSearchOpen(false)}><X/></button></div><div className="intent-chips"><span>{query?'MATCHING RESULTS':'POPULAR RIGHT NOW'}</span>{chips.map(x=><button key={x} onClick={()=>{setQuery(x);setActive(0)}}>{x}</button>)}</div><div className="command-results">{results.length?results.map((x,i)=><button className={active===i?'active':''} key={x.id} onMouseEnter={()=>setActive(i)} onClick={()=>open(x)}><span className="entity-mark">{x.mark}</span><span><b>{x.name}</b><small>{x.course} · {x.place}</small></span><ArrowRight/></button>):<div className="empty"><Search/><h3>Nothing exact yet</h3><p>Try a broader keyword or explore the complete listing.</p><button className="btn primary" onClick={()=>{setSearchOpen(false);go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}}>Browse everything</button></div>}</div><footer><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>ENTER</kbd> Open · <kbd>ESC</kbd> Close</span></footer></div></div>}
/* One flow serves both an enquiry and a course application. `lead.mode==='apply'`
   switches the language and adds the course selector; everything downstream —
   OTP, CRM payload, the Applications list — is the same pipeline, so an
   application is never a second, weaker code path. */
function LeadFlow({lead,vertical,close,notify}){const applying=lead.mode==='apply';const [course,setCourse]=useState(lead.course||'');const [step,setStep]=useState(0),[name,setName]=useState(''),[phone,setPhone]=useState(''),[qualification,setQualification]=useState('12th pass / appearing'),[otp,setOtp]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[demoCode,setDemoCode]=useState(''),[result,setResult]=useState(null);
const api=async(url,body)=>{const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json().catch(()=>null);if(!r.ok||!j||j.ok===false)throw new Error((j&&j.message)||`Request failed (${r.status})`);return j.data};
const source=()=>{const p=new URLSearchParams(window.location.search);return{url:window.location.pathname,device:window.matchMedia('(max-width:760px)').matches?'mobile':'desktop',utm_source:p.get('utm_source'),utm_medium:p.get('utm_medium'),utm_campaign:p.get('utm_campaign')}};
const sendCode=async()=>{setBusy(true);setError('');try{const d=await api('/api/otp/send',{phone});setDemoCode(d.demoCode||'');setOtp('');setStep(1)}catch(e){setError(e.message)}finally{setBusy(false)}};
const verifyAndSubmit=async()=>{setBusy(true);setError('');try{await api('/api/otp/verify',{phone,code:otp});const d=await api('/api/leads',{vertical,name:name.trim(),phone,phoneVerified:true,whatsappSame:true,qualification,interestType:lead.interestType||'general',interestId:lead.interest||null,course:course||undefined,associateCode:new URLSearchParams(window.location.search).get('ref'),source:source()});setResult(d);const record={id:d.lead.crmLeadId,name:name.trim(),phone,qualification,interest:lead.interest,course:course||null,kind:applying?'Application':'Enquiry',title:lead.title,createdAt:new Date().toISOString(),status:d.lead.status};const current=JSON.parse(localStorage.getItem('dcw-enquiries-v1')||'[]');localStorage.setItem('dcw-enquiries-v1',JSON.stringify([record,...current]));setStep(2)}catch(e){setError(e.message)}finally{setBusy(false)}};
return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)close()}}><div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-title"><button aria-label="Close" className="modal-x" onClick={close}><X/></button>{error&&<p className="form-error" role="alert">{error}</p>}{step===0&&<><span className="kicker">{applying?<><FileText/>FREE APPLICATION SUPPORT</>:<>FREE &bull; NO PRESSURE</>}</span><h2 id="lead-title">{lead.title}</h2><p>{applying?'Pick your course and share the basics. A DCW counsellor checks your eligibility and submits the application with you — there is no application fee to DCW.':'Share the basics so the right DCW counsellor can understand your goal.'}</p>{applying&&lead.where&&<div className="lead-context"><MapPin/><span>{lead.where}</span></div>}{applying&&lead.courses&&lead.courses.length>1&&<label>Course you want to apply for<select value={course} onChange={e=>setCourse(e.target.value)}>{lead.courses.map(c=><option key={c}>{c}</option>)}</select></label>}<label>Full name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/></label><label>10-digit mobile number<input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} inputMode="numeric" placeholder="98765 43210"/></label><label>Current qualification<select value={qualification} onChange={e=>setQualification(e.target.value)}><option>12th pass / appearing</option><option>Graduate</option><option>10th pass</option></select></label><button disabled={busy||name.trim().length<2||phone.length!==10} aria-busy={busy} className="btn primary full" onClick={sendCode}>{busy?'Sending code…':'Send verification code'}{!busy&&<ArrowRight/>}</button><small>Demo mode: the code is shown on screen and no SMS is sent.</small></>}{step===1&&<><span className="kicker">VERIFY MOBILE</span><h2 id="lead-title">Enter the 6-digit code</h2><p>Sent to {phone}. {demoCode&&<>Demo code: <b>{demoCode}</b></>}</p><label>6-digit code<input autoFocus value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric"/></label><button disabled={busy||otp.length!==6} aria-busy={busy} className="btn primary full" onClick={verifyAndSubmit}>{busy?'Verifying…':applying?'Verify & submit application':'Verify & send enquiry'}{!busy&&<Check/>}</button><button className="text-btn" disabled={busy} onClick={()=>{setError('');setStep(0)}}>Change details</button></>}{step===2&&<div className="success"><span><Check/></span><h2 id="lead-title">{applying?'Application submitted':'Enquiry sent'}</h2><p>{result?.duplicate?'We already had your number on file, so this was added to your existing record.':applying?`Your application${course?` for ${course}`:''} is with a DCW counsellor, who will confirm your documents before it goes to the institution.`:'Your enquiry is with a DCW counsellor.'} Reference <b>{result?.lead?.crmLeadId}</b>{result?.lead?.assignedTo&&<> &bull; assigned to {result.lead.assignedTo}</>}</p><p className="muted-note">Demo mode: no real SMS, WhatsApp or CRM record was created.</p><button className="btn primary" onClick={()=>{notify(applying?'Application saved to Applications':'Enquiry saved to Applications');close()}}>Done</button></div>}</div></div>}
function CompareTray({vertical,compare,go}){return <div className="compare-tray glass-dark"><span><b>{compare[vertical].length} of 3 selected</b><small>{compare[vertical].length<2?'Add one more for a useful comparison':'Ready to compare side by side'}</small></span><button disabled={compare[vertical].length<2} onClick={()=>go(`/${vertical}/compare`)}>Compare now<ArrowRight/></button></div>}
function MobileNav({vertical,go,setSearchOpen,path}){return <nav className="mobile-nav" aria-label="Mobile navigation"><button className={path===`/${vertical}`?'active':''} onClick={()=>go(`/${vertical}`)}><Home/>Home</button><button className={path?.includes('search')||path?.includes('universities')?'active':''} onClick={()=>go(vertical==='distance'?'/distance/universities':`/${vertical}/search`)}><Search/>Explore</button><button className="mobile-main" onClick={()=>setSearchOpen(true)}><Search/>Search</button><button className={path==='/saved'?'active':''} onClick={()=>go('/saved')}><Heart/>Saved</button><button className={path==='/profile'?'active':''} onClick={()=>go('/profile')}><UserRound/>Profile</button></nav>}
/* ---------- About, Blog, Reviews -------------------------------------------
   The three pages a stranger checks before trusting a site with their marks,
   their money or their phone number: who runs this, what do they know, and
   what did it do for somebody like me. Everything below is placeholder content
   for the prototype — the numbers are marked indicative wherever they appear,
   because a made-up placement statistic is exactly the kind of claim this
   product exists to argue against. */

const MILESTONES=[
  {year:'2019',title:'A counselling desk in Patna',body:'Two counsellors, one whiteboard of admission dates, and a queue outside. Every answer was given face to face.'},
  {year:'2021',title:'The first fee database',body:'We started writing down what each university actually charged, semester by semester, because the brochures kept disagreeing with the accounts office.'},
  {year:'2023',title:'Jobs joined the list',body:'Students who finished a course kept asking the same next question. Berojgar Bharat began as a shared spreadsheet of verified local vacancies.'},
  {year:'2026',title:'One platform, three doors',body:'Distance, Colleges and Jobs run on the same verified records, so a decision made on one side carries into the next.'}];

const PRINCIPLES=[
  {icon:<ShieldCheck/>,title:'We name the source',body:'Every fee, approval and salary band on this site points at where it came from. If we cannot source it, it does not go up.'},
  {icon:<IndianRupee/>,title:'The fee you see is the fee',body:'Total programme cost, not the first instalment. Exam and re-registration charges are listed separately rather than buried.'},
  {icon:<Scale/>,title:'Ranking is not for sale',body:'Universities and employers can advertise on DCW. They cannot buy a position in a comparison or a higher rating.'},
  {icon:<UserRound/>,title:'A person, when you want one',body:'Counselling is free and optional. Nobody on the team is paid a commission on where you enrol.'}];

const POSTS=[
  {slug:'nios-vs-bosse-2026',cat:'Boards',title:'NIOS or BOSSE in 2026: which open school actually fits you',
   dek:'Both are recognised. They differ on exam windows, credit transfer and how quickly a result reaches a university admission desk.',
   author:'Ritu Anand',role:'Board research',date:'18 Aug 2026',mins:9,featured:true,
   body:['Every week somebody asks us whether an open-school certificate will be "accepted". The honest answer is that acceptance is rarely the problem — timing is. Both NIOS and BOSSE are recognised for higher education and for most government recruitment, and both publish their results on a fixed calendar. What separates them, for a student with a deadline, is when that calendar lands.',
     'NIOS runs two public examination cycles a year with an on-demand option for several subjects. That flexibility is genuinely useful if you failed one paper and cannot afford to lose a year. BOSSE, being younger, has a shorter queue and tends to turn results around faster, which matters when a university admission window closes in six weeks.',
     'The second difference is credit transfer. If you have already cleared some subjects at another board, both will let you carry those forward, but the paperwork is not identical and the fee is not identical either. Read the transfer clause before you pay the registration, not after.',
     'Our advice is unglamorous. Work backwards from the admission deadline you actually care about, check which board can put a result in your hand before it, and choose that one. Prestige between the two is not the deciding factor for any university we have spoken to.']},
  {slug:'distance-degree-worth-it',cat:'Distance',title:'Is a distance degree worth it? Read the approval line first',
   dek:'A UGC-DEB entitlement letter is a specific document with a specific validity period. Here is how to check one in under two minutes.',
   author:'Sandeep Kumar',role:'Programme verification',date:'02 Aug 2026',mins:7,
   body:['A distance degree is worth exactly as much as the approval behind it, and approvals are narrower than the marketing suggests. A university can be UGC-recognised and still be running a programme its distance entitlement does not cover.',
     'Look for three things: the UGC-DEB entitlement letter, the specific programmes it names, and the academic years it covers. All three appear on the letter. If a counsellor sends you a screenshot of only the first page, ask for the rest.',
     'The check takes two minutes and it is the single highest-value thing you can do before paying a rupee. We run it on every programme listed here and we say plainly when a listing is pending re-verification.']},
  {slug:'first-job-without-experience',cat:'Jobs',title:'How to write a first resume when you have never had a job',
   dek:'Recruiters are not looking for experience on a fresher resume. They are looking for evidence that you finish things.',
   author:'Farah Qureshi',role:'Hiring desk',date:'26 Jul 2026',mins:6,
   body:['The blank-resume problem is really a translation problem. You have done work — a college project, a family shop, a semester of tutoring — and none of it is written down in the language a hiring manager scans for.',
     'Take the project you are proudest of and write three lines about it: what you built, who used it, and what changed because it existed. Put a number in one of those lines. That is a bullet point, and it is worth more than a paragraph about being a hard-working team player.',
     'Then name the role you want at the top of the page. "Fresher" is not a role. "Accounts Executive" is. A recruiter spends about ten seconds deciding whether to keep reading, and the top third of the page is all they see.']},
  {slug:'emi-without-a-cibil-score',cat:'Money',title:'Course EMIs when you have no credit history',
   dek:'No-cost EMI, a co-applicant, an education loan and a scholarship are four different things. Only one of them is free.',
   author:'Sandeep Kumar',role:'Programme verification',date:'14 Jul 2026',mins:8,
   body:['Most first-year students have no credit file at all, which is not a rejection — it is an absence. Lenders handle it with a co-applicant, usually a parent or guardian whose income and repayment record carry the application.',
     '"No-cost EMI" means the interest has been moved into the sticker price, not that it vanished. Ask what the same programme costs paid in full. If the difference is zero, the offer is real. If it is not, you are paying interest under another name.',
     'Scholarships and fee waivers are the only genuinely free money in this list, and they close earlier than admissions do. Check the state portal before you commit to a payment plan.']},
  {slug:'what-verified-means-here',cat:'How we work',title:'What the word “verified” means on this site',
   dek:'It is not a badge we hand out. It is a checklist, and this is the whole of it.',
   author:'Ritu Anand',role:'Board research',date:'30 Jun 2026',mins:5,
   body:['A listing carries a verified mark when four things are true: the approval document is on file and in date, the fee has been confirmed with the institution in the current academic year, the contact details reach a human, and nothing on the page contradicts the official prospectus.',
     'When one of those lapses, the mark comes off until it is restored. We would rather show you a listing with an honest gap in it than a page that looks complete and is not.',
     'This is also why some well-known names are missing. Absence here is usually paperwork we have not finished, not a judgement.']},
  {slug:'walk-in-interview-checklist',cat:'Jobs',title:'The walk-in interview checklist nobody gives you',
   dek:'Two documents, one question and a rule about fees that will save you a wasted afternoon.',
   author:'Farah Qureshi',role:'Hiring desk',date:'11 Jun 2026',mins:4,
   body:['Carry two printed copies of your resume and one photo ID. Digital copies fail exactly when the office wifi does.',
     'Ask one question before the interview starts: what is the monthly in-hand figure, and what is the deduction structure. An employer who will not answer that at the door will not answer it after you join.',
     'And the rule: a genuine employer never charges you to apply, to be trained, or to be placed. Registration fees, security deposits, kit charges — walk out. Report the posting to us and we will take it down.']}];

const REVIEWS=[
  {name:'Priya Sharma',city:'Patna',rating:5,vertical:'Distance',subject:'B.Com (Distance) · Amity Online',date:'Aug 2026',
   text:'I had already paid a registration fee to an agent before I found this site. The fee table here matched what the university accounts office told me on the phone, and the agent’s number did not. That comparison alone saved me ₹18,000.',helpful:34,verified:true},
  {name:'Rahul Verma',city:'Ranchi',rating:4,vertical:'Jobs',subject:'Field Sales Executive · Bajaj Finserv',date:'Aug 2026',
   text:'The salary band on the listing was the actual band in the interview, which I did not expect. One mark off because the interview location was in a different part of the city than the posting said.',helpful:21,verified:true},
  {name:'Anjali Kumari',city:'Gaya',rating:5,vertical:'Distance',subject:'Class 12 · NIOS',date:'Jul 2026',
   text:'I dropped out in 2021 and thought I had lost the year permanently. The board comparison explained the on-demand exam option in plain Hindi and English. I sat for two subjects in October and finished.',helpful:47,verified:true},
  {name:'Mohd Imran',city:'Lucknow',rating:4,vertical:'Colleges',subject:'B.Sc Nursing counselling',date:'Jul 2026',
   text:'Counsellor called within the day and did not push a single college. She told me one of the options I was excited about had a pending approval, which I could not find anywhere else.',helpful:19,verified:true},
  {name:'Sneha Patel',city:'Pune',rating:3,vertical:'Jobs',subject:'Digital Marketing Intern',date:'Jun 2026',
   text:'Good listings and the resume builder is genuinely useful. But two of the internships I applied for had already closed, so the posted dates need to be tighter.',helpful:28,verified:false},
  {name:'Vikas Singh',city:'Delhi NCR',rating:5,vertical:'Distance',subject:'MBA (Online) · fee comparison',date:'Jun 2026',
   text:'Four universities, one table, total cost including exam fees. I had been building that spreadsheet myself for three weeks.',helpful:52,verified:true},
  {name:'Fatima Khan',city:'Kolkata',rating:5,vertical:'Jobs',subject:'Relationship Officer',date:'May 2026',
   text:'The “jobs near me” list put three openings within 8 km of my house on the screen. Every other site kept showing me Bengaluru.',helpful:31,verified:true},
  {name:'Arjun Nair',city:'Bengaluru',rating:4,vertical:'Colleges',subject:'NEET rank predictor',date:'May 2026',
   text:'The predictor was honest about being a range and not a promise, which I appreciated. My actual allotment landed inside the range it gave me.',helpful:26,verified:true},
  {name:'Deepak Yadav',city:'Patna',rating:2,vertical:'Distance',subject:'Admission support',date:'Apr 2026',
   text:'Information on the site is solid but I waited two days for a callback during the admission rush. Got it eventually and the help was good, just late.',helpful:14,verified:true}];

function AboutPage({go,notify}){
  return <main className="tool-page about-page">
    <section className="tool-hero about-hero">
      <picture>
        <source type="image/webp" media="(max-width:900px)" srcSet="/dcw-journey-hero-900.webp"/>
        <source type="image/webp" srcSet="/dcw-journey-hero-full.webp"/>
        <img src="/dcw-journey-hero.png" alt="Students walking through a college campus in India" decoding="async"/>
      </picture>
      <span className="hero-shade" aria-hidden="true"/>
      <div className="container tool-hero-copy">
        <span className="kicker">ABOUT DCW</span>
        <h1>We started because the brochure<br/><em>and the accounts office disagreed.</em></h1>
        <p>Distance Courses Wala began as a counselling desk in Patna in 2019. It grew into three connected products because the questions never stopped at admission — they ran on into fees, into results, and into the first job.</p>
        <div className="tool-hero-cta">
          <button className="btn primary" onClick={()=>go('/reviews')}><Star/>Read what students say</button>
          <a className="btn ghost" href="#principles">How we work<ArrowRight/></a>
        </div>
      </div>
    </section>

    {/* Numbers are the first thing a stranger tests you on, so they are stated
        with their basis attached rather than as decoration. */}
    <section className="container about-figures">
      <article><b>2.4 lakh</b><small>Students guided since 2019</small><em>Counselling sessions logged, indicative</em></article>
      <article><b>180+</b><small>Programmes with approvals on file</small><em>Entitlement letters held and dated</em></article>
      <article><b>4 states</b><small>Bihar, Jharkhand, UP, Delhi NCR</small><em>Where our counsellors work in person</em></article>
      <article><b>₹0</b><small>What our guidance costs a student</small><em>Institutions pay us, students never do</em></article>
      <p className="figures-note"><ShieldCheck/>Prototype build. These figures are indicative placeholders and will carry a published basis before launch.</p>
    </section>

    <section className="container about-split">
      <div className="as-copy">
        <span className="kicker">WHY WE EXIST</span>
        <h2>Nobody should have to guess what a degree costs.</h2>
        <p>The information a student needs to make this decision already exists. It is just scattered across prospectuses, agent WhatsApp forwards, and a phone number that rings out. The gap is not knowledge — it is that nobody has put it in one place and stood behind it.</p>
        <p>So that is the whole job: collect the record, check it against the institution, publish it with its source, and let a person read the comparison themselves. Where somebody wants to talk it through, a counsellor picks up. Where they do not, nothing on this site chases them.</p>
        <button className="btn outline" onClick={()=>go('/distance/universities')}>See how a listing is built<ArrowRight/></button>
      </div>
      <ul className="as-principles" id="principles">
        {PRINCIPLES.map(p=><li key={p.title}><span className="ap-icon">{p.icon}</span>
          <div><b>{p.title}</b><small>{p.body}</small></div></li>)}
      </ul>
    </section>

    <section className="wash section">
      <div className="container">
        <span className="kicker">THE ROAD SO FAR</span>
        <h2 className="about-h2">Seven years, one question at a time.</h2>
        <ol className="timeline-rail">
          {MILESTONES.map((m,i)=><li key={m.year} className={i===MILESTONES.length-1?'now':''}>
            <span className="tr-year">{m.year}</span>
            <div className="tr-card"><b>{m.title}</b><p>{m.body}</p></div>
          </li>)}
        </ol>
      </div>
    </section>

    {/* Money is the question people are too polite to ask, so it is answered
        before they have to. */}
    <section className="container about-money">
      <div>
        <span className="kicker">HOW WE ARE PAID</span>
        <h2 className="about-h2">Institutions pay us. You do not.</h2>
      </div>
      <div className="am-grid">
        <article><b>Listing and advertising</b><p>Universities, colleges and employers pay to appear and to advertise. Advertising is labelled as advertising, every time.</p></article>
        <article><b>Admission referrals</b><p>When a student enrols through us, the institution pays a referral fee. It is the same fee across institutions in a category, so it cannot tilt what we recommend.</p></article>
        <article><b>What we never do</b><p>We do not sell placement in a comparison, we do not sell your phone number, and no counsellor earns a commission tied to where you enrol.</p></article>
      </div>
    </section>

    <section className="container about-contact">
      <div>
        <h2 className="about-h2">Come and argue with us.</h2>
        <p>If a fee on this site is wrong, a listing is stale, or a posting asked you for money, tell us and we will fix it or take it down.</p>
      </div>
      <dl>
        <div><dt>Office</dt><dd>Boring Road, Patna, Bihar 800001</dd></div>
        <div><dt>Corrections</dt><dd>corrections@dcw.example</dd></div>
        <div><dt>Counselling</dt><dd>Mon–Sat, 9am–7pm IST</dd></div>
      </dl>
      <div className="ac-actions">
        <button className="btn primary" onClick={()=>notify('Counselling request noted — a counsellor will call you back')}><MessageCircle/>Request a callback</button>
        <button className="btn outline" onClick={()=>go('/blog')}>Read the blog<ArrowRight/></button>
      </div>
    </section>
  </main>;
}

function BlogPage({path,go}){
  const slug=path?.replace(/^\/blog\/?/,'');
  const post=POSTS.find(p=>p.slug===slug);
  const [cat,setCat]=useState('All');
  const cats=['All',...new Set(POSTS.map(p=>p.cat))];

  if(post){
    const more=POSTS.filter(p=>p.slug!==post.slug&&p.cat===post.cat).slice(0,2);
    return <main className="tool-page article-page">
      <div className="container breadcrumbs">
        <button className="linkish" onClick={()=>go('/blog')}>Blog</button><ChevronRight/><span>{post.cat}</span>
      </div>
      <article className="container article">
        <span className="kicker">{post.cat.toUpperCase()}</span>
        <h1>{post.title}</h1>
        <p className="art-dek">{post.dek}</p>
        <div className="art-meta">
          <span className="am-mark" aria-hidden="true">{post.author.split(' ').map(w=>w[0]).join('')}</span>
          <div><b>{post.author}</b><small>{post.role}</small></div>
          <span className="am-when"><CalendarDays/>{post.date}</span>
          <span className="am-when"><Clock3/>{post.mins} min read</span>
        </div>
        <div className="art-plate"><Plate seed={post.slug} tag={post.cat}/></div>
        <div className="art-body">{post.body.map((para,i)=><p key={i}>{para}</p>)}</div>
        <p className="note"><ShieldCheck/>Written by the DCW research desk. Indicative editorial content for this prototype — no advertiser had sight of it.</p>
      </article>
      {more.length>0&&<section className="container art-more">
        <h2 className="about-h2">More on {post.cat.toLowerCase()}</h2>
        <div className="blog-grid">{more.map(p=><PostCard key={p.slug} post={p} go={go}/>)}</div>
      </section>}
    </main>;
  }

  const lead=POSTS.find(p=>p.featured)||POSTS[0];
  /* The featured slot is only an "All" affordance. Once somebody picks a
     topic they want every piece in it, so the lead drops back into the grid
     rather than disappearing and leaving the count lying. */
  const rest=cat==='All'?POSTS.filter(p=>p!==lead):POSTS.filter(p=>p.cat===cat);
  return <main className="tool-page blog-page">
    <PageHero
      tone="indigo"
      kicker="DCW JOURNAL"
      title={<>Plain answers to<br/><em>the expensive questions.</em></>}
      lead="Approvals, fees, boards and first jobs — written by the people who keep the records, and published whether or not it suits an advertiser."
      pills={<>
        <span><FileText/>{POSTS.length} articles</span>
        <span><ShieldCheck/>No sponsored placements</span>
      </>}/>
    <div className="container">
      {cat==='All'&&<button className="blog-lead" onClick={()=>go(`/blog/${lead.slug}`)}>
        <Plate seed={lead.slug} tag={lead.cat}/>
        <div>
          <span className="kicker">{lead.cat.toUpperCase()} · FEATURED</span>
          <h2>{lead.title}</h2>
          <p>{lead.dek}</p>
          <span className="bl-meta"><b>{lead.author}</b><i/>{lead.date}<i/>{lead.mins} min read</span>
          <span className="bl-go">Read the piece<ArrowRight/></span>
        </div>
      </button>}

      <div className="city-chips blog-chips" role="group" aria-label="Filter by topic">
        {cats.map(c=><button key={c} className={cat===c?'chip on':'chip'} onClick={()=>setCat(c)}
          aria-pressed={cat===c}>{c}<small>{c==='All'?POSTS.length:POSTS.filter(p=>p.cat===c).length}</small></button>)}
      </div>

      {rest.length>0
        ?<div className="blog-grid">{rest.map((p,i)=><PostCard key={p.slug} post={p} i={i} go={go}/>)}</div>
        :<div className="empty"><BookOpen/><h2>Nothing here yet</h2><p>No other pieces filed under {cat}. Try another topic.</p></div>}
    </div>
  </main>;
}

function PostCard({post,i=0,go}){
  return <button className="post-card" onClick={()=>go(`/blog/${post.slug}`)}>
    <Plate seed={post.slug} tone={i%6} tag={post.cat}/>
    <div className="pc-body">
      <h3>{post.title}</h3>
      <p>{post.dek}</p>
      <span className="pc-meta"><b>{post.author}</b><i/>{post.date}<i/>{post.mins} min</span>
    </div>
  </button>;
}

function ReviewsPage({go,notify}){
  const [filter,setFilter]=useState('All');
  const [sort,setSort]=useState('Most helpful');
  const verticals=['All',...new Set(REVIEWS.map(r=>r.vertical))];
  const shown=useMemo(()=>{
    const list=REVIEWS.filter(r=>filter==='All'||r.vertical===filter);
    return [...list].sort((a,b)=>sort==='Most helpful'?b.helpful-a.helpful
      :sort==='Highest rated'?b.rating-a.rating
      :sort==='Lowest rated'?a.rating-b.rating:0);
  },[filter,sort]);
  /* The distribution is drawn from the same array the cards render, so the
     bars can never disagree with the reviews underneath them. */
  const avg=(REVIEWS.reduce((n,r)=>n+r.rating,0)/REVIEWS.length).toFixed(1);
  const dist=[5,4,3,2,1].map(n=>({n,count:REVIEWS.filter(r=>r.rating===n).length}));
  const stars=n=>Array.from({length:5},(_,i)=><Star key={i} className={i<n?'on':''}/>);

  return <main className="tool-page reviews-page">
    <PageHero
      tone="plum"
      kicker="STUDENT REVIEWS"
      title={<>Unedited, including<br/><em>the ones that sting.</em></>}
      lead="Reviews come from people who used DCW to choose a course, a college or a job. We do not delete low ratings and we do not pay for high ones."
      pills={<>
        <span><Star/>{REVIEWS.length} verified reviews</span>
        <span><ShieldCheck/>Nothing removed for rating</span>
      </>}/>
    <section className="container rating-panel">
      <div className="rp-score">
        <b>{avg}</b>
        <span className="stars big" aria-label={`${avg} out of 5`}>{stars(Math.round(avg))}</span>
        <small>{REVIEWS.length} reviews · {REVIEWS.filter(r=>r.verified).length} verified</small>
      </div>
      <ul className="rp-dist">
        {dist.map(d=><li key={d.n}>
          <span>{d.n}<Star/></span>
          <i><b style={{width:`${(d.count/REVIEWS.length)*100}%`}}/></i>
          <small>{d.count}</small>
        </li>)}
      </ul>
      <div className="rp-cta">
        <p><ShieldCheck/>A review is marked verified when we can match it to a counselling session or an application in our records.</p>
        <button className="btn primary" onClick={()=>notify('Review form opens after you sign in')}><MessageCircle/>Write a review</button>
      </div>
    </section>

    <div className="container results-head">
      <div className="city-chips" role="group" aria-label="Filter reviews">
        {verticals.map(v=><button key={v} className={filter===v?'chip on':'chip'} onClick={()=>setFilter(v)}
          aria-pressed={filter===v}>{v}<small>{v==='All'?REVIEWS.length:REVIEWS.filter(r=>r.vertical===v).length}</small></button>)}
      </div>
      <label>Sort
        <select value={sort} onChange={e=>setSort(e.target.value)}>
          {['Most helpful','Highest rated','Lowest rated'].map(o=><option key={o}>{o}</option>)}
        </select>
      </label>
    </div>

    <div className="container review-grid">
      {shown.map(r=><article key={r.name+r.subject} className="review-card">
        <header>
          <span className="rv-mark" aria-hidden="true">{r.name.split(' ').map(w=>w[0]).join('')}</span>
          <div><b>{r.name}</b><small><MapPin/>{r.city} · {r.date}</small></div>
          {r.verified&&<span className="rv-check"><ShieldCheck/>Verified</span>}
        </header>
        <span className="stars" aria-label={`${r.rating} out of 5`}>{stars(r.rating)}</span>
        <p className="rv-subject">{r.subject}</p>
        <p className="rv-text">{r.text}</p>
        <footer><span className="rv-tag">{r.vertical}</span>
          <button onClick={()=>notify('Thanks — marked as helpful')}><Heart/>Helpful · {r.helpful}</button></footer>
      </article>)}
    </div>

    <div className="container review-foot">
      <p>Reviews are placeholder content in this prototype build.</p>
      <button className="btn outline" onClick={()=>go('/about')}>How we verify things<ArrowRight/></button>
    </div>
  </main>;
}

function Footer({go,vertical}){const brand=V[vertical];return <footer className="footer"><div className="container"><div><div className="brand inverse"><BrandLockup vertical={vertical}/><span><b>{brand.logoAlt}</b><small>Your next move, made visible.</small></span></div><p>Clear education and career decisions for students across India.</p><button className="automation-link" onClick={()=>go('/automations')}><Workflow/>Automation centre</button></div><div><b>Distance</b><button onClick={()=>go('/distance/universities')}>Universities</button><button onClick={()=>go('/distance/boards')}>Board comparison</button></div><div><b>Colleges</b><button onClick={()=>go('/colleges/search')}>Find colleges</button><button onClick={()=>go('/colleges/neet-predictor')}>NEET predictor</button></div><div><b>Jobs</b><button onClick={()=>go('/jobs/search')}>Find jobs</button><button onClick={()=>go('/jobs/resume-builder')}>Resume builder</button></div><div><b>Company</b><button onClick={()=>go('/about')}>About us</button><button onClick={()=>go('/blog')}>Blog</button><button onClick={()=>go('/reviews')}>Reviews</button></div></div><div className="container footer-bottom">© 2026 {brand.legal} <span>Prototype with indicative dummy data</span></div></footer>}
export default App;
