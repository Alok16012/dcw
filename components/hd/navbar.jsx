'use client';
import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {Menu,X,Phone,TrendingUp,ScrollText,FileText,GraduationCap,Briefcase,Handshake,ChevronRight,Search} from 'lucide-react';
import {CONTACT} from '@/lib/contact.js';

/* HelloDoctor's Navbar (src/components/Navbar.tsx), markup and classes as
   they are there. What changed is only what has to: the six links are our
   three houses plus the editorial pages, the red button opens each house's own
   free tool, the stats bar carries each house's own four promises, and the
   login chooser lists the three account types /login actually has. */
const TOOL={
  distance:{label:'Board Guide',href:'/distance/boards',icon:ScrollText},
  colleges:{label:'NEET Predictor',href:'/colleges/neet-predictor',icon:TrendingUp},
  jobs:{label:'Resume Builder',href:'/jobs/resume-builder',icon:FileText}
};
const STATS={
  distance:[{value:'UGC-DEB',label:'Approved Universities'},{value:'Free',label:'Initial Counselling'},{value:'1L+',label:'Students Guided'},{value:'10th–PG',label:'Every Learner'}],
  colleges:[{value:'Verified',label:'College Data'},{value:'Free',label:'Initial Counselling'},{value:'1L+',label:'Students Guided'},{value:'Total Cost',label:'Not Just Fees'}],
  jobs:[{value:'Verified',label:'Employers'},{value:'Upfront',label:'Salary Shown'},{value:'Freshers',label:'Welcome'},{value:'₹0',label:'Fee, Ever'}]
};
const loginOptions=[
  {label:'Student',desc:'Applications, saved courses & counselling updates',href:'/login?role=student',icon:GraduationCap,color:'bg-green-50 text-green-600'},
  {label:'Office Staff',desc:'Admin, counsellor & team console login',href:'/login?role=staff',icon:Briefcase,color:'bg-blue-50 text-blue-600'},
  {label:'Associate',desc:'Partner portal — the enquiries your code brought in',href:'/login?role=associate',icon:Handshake,color:'bg-teal-50 text-teal-700'}
];
const HOME_FOR={admin:'/admin',employer:'/admin/jobs',student:'/applications'};

export function HdNavbar({vertical,brands,path,auth,setSearchOpen}){
  const [isOpen,setIsOpen]=useState(false);
  const [loginOpen,setLoginOpen]=useState(false);
  const brand=brands[vertical];
  const tool=TOOL[vertical];const ToolIcon=tool.icon;
  const user=auth?.user;
  const navLinks=[
    ...Object.entries(brands).map(([k,v])=>({label:v.navTitle,href:`/${k}`,active:vertical===k&&path?.startsWith(`/${k}`)})),
    {label:'Blog',href:'/blog',active:path?.startsWith('/blog')},
    {label:'Reviews',href:'/reviews',active:path==='/reviews'},
    {label:'About',href:'/about',active:path==='/about'}
  ];
  const counsel=(extra='')=><a href={CONTACT.phone.href} className={extra}><Phone className="w-4 h-4"/>
    <span className="flex flex-col leading-none"><span>Counselling</span><span className="text-[10px] font-normal text-brand-500">{CONTACT.phone.display}</span></span></a>;

  return <div className="hd contents">
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100" aria-label="Main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${vertical}`} className="flex items-center gap-2.5" aria-label={`${brand.logoAlt} home`}>
            <Image src={brand.lockup} alt={`${brand.logoAlt} logo`} width={60} height={60} className="object-contain rounded-lg w-[52px] h-[52px]" priority/>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black text-ink tracking-wide">{brand.logoAlt}</span>
              <span className="text-[10px] font-semibold text-brand-600 tracking-tight mt-0.5">{brand.navSub}</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map(link=><Link key={link.label} href={link.href} aria-current={link.active?'page':undefined}
              className={`text-sm font-medium transition-colors ${link.active?'text-brand-600':'text-gray-600 hover:text-brand-600'}`}>{link.label}</Link>)}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button type="button" aria-label="Search" onClick={()=>setSearchOpen(true)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-600 transition-colors"><Search className="w-5 h-5"/></button>
            <Link href={tool.href} className="bg-cta-600 hover:bg-cta-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-md shadow-cta-200 transition-colors text-sm flex items-center gap-1.5">
              <ToolIcon className="w-4 h-4"/>{tool.label}
            </Link>
            {counsel('flex items-center gap-1.5 text-sm text-brand-600 border border-brand-600 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors font-medium')}
            {user
              ?<Link href={HOME_FOR[user.role]||'/'} className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium">My {user.role==='student'?'dashboard':'console'}</Link>
              :<button type="button" onClick={()=>setLoginOpen(true)} className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium">Login</button>}
          </div>

          <button type="button" aria-label={isOpen?'Close menu':'Open menu'} aria-expanded={isOpen}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100" onClick={()=>setIsOpen(!isOpen)}>
            {isOpen?<X className="w-5 h-5"/>:<Menu className="w-5 h-5"/>}
          </button>
        </div>
      </div>

      <div className="bg-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-6 sm:gap-10 py-2.5 text-white">
            {STATS[vertical].map(item=><div key={item.label} className="text-center">
              <div className="text-sm sm:text-base font-bold leading-tight">{item.value}</div>
              <div className="text-[10px] sm:text-xs text-white/75 leading-tight">{item.label}</div>
            </div>)}
          </div>
        </div>
      </div>
    </nav>

    {isOpen&&<div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 shadow-sm">
      {navLinks.map(link=><Link key={link.label} href={link.href} onClick={()=>setIsOpen(false)}
        className={`block text-sm font-medium py-2 ${link.active?'text-brand-600':'text-gray-700 hover:text-brand-600'}`}>{link.label}</Link>)}
      <div className="pt-2 flex flex-col gap-2">
        <Link href={tool.href} onClick={()=>setIsOpen(false)} className="flex items-center justify-center gap-2 text-sm bg-cta-600 text-white px-4 py-2.5 rounded-lg font-bold shadow-md">
          <ToolIcon className="w-4 h-4"/>{tool.label}
        </Link>
        <a href={CONTACT.phone.href} className="flex items-center justify-center gap-2 text-sm text-brand-600 border border-brand-600 px-4 py-2 rounded-lg font-medium">
          <Phone className="w-4 h-4"/>Counselling · {CONTACT.phone.display}
        </a>
        {user
          ?<Link href={HOME_FOR[user.role]||'/'} onClick={()=>setIsOpen(false)} className="text-center text-sm bg-brand-600 text-white px-4 py-2 rounded-lg font-medium">My {user.role==='student'?'dashboard':'console'}</Link>
          :<button type="button" className="text-center text-sm bg-brand-600 text-white px-4 py-2 rounded-lg font-medium" onClick={()=>{setIsOpen(false);setLoginOpen(true)}}>Login</button>}
      </div>
    </div>}

    {loginOpen&&<div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={()=>setLoginOpen(false)}>
      <div role="dialog" aria-modal="true" aria-label="Login" className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-ink">Login</h2>
            <p className="text-sm text-gray-500 mt-0.5">Choose how you want to sign in</p>
          </div>
          <button type="button" onClick={()=>setLoginOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" aria-label="Close"><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-3">
          {loginOptions.map(({label,desc,href,icon:Icon,color})=><Link key={label} href={href} onClick={()=>setLoginOpen(false)}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-brand-500 hover:shadow-md transition-all group">
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}><Icon className="w-5 h-5"/></span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-gray-900">{label}</span>
              <span className="block text-xs text-gray-500">{desc}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-600"/>
          </Link>)}
        </div>
      </div>
    </div>}
  </div>;
}
