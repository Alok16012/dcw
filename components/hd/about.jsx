'use client';
import Link from 'next/link';
import {Award,Target,Globe,CheckCircle2,Phone,ChevronRight,Shield,ShieldCheck,IndianRupee,Scale,UserRound,Star,BookOpen,Building2,Briefcase,GraduationCap,MapPin,Navigation,ExternalLink,Mail,Clock,MessageCircle,Users} from 'lucide-react';
import {CONTACT,officeEmbedUrl,officePlaceUrl,officeDirectionsUrl} from '@/lib/contact.js';

/* HelloDoctor's About page (src/app/(site)/about/page.tsx), band for band:
   gradient hero · six tinted stat tiles · purpose + mission/vision/promise
   cards · core values · what we do · how we help · CTA. The words are this
   company's own — the Patna desk, the principles, the milestones, how it is
   paid — and the office map stays, because it is the answer to "where are
   you" that an address alone is not. */

const STATS=[
  {value:'2.4 lakh',label:'Students guided since 2019',icon:<Users className="w-6 h-6"/>,color:'text-blue-600',bg:'bg-blue-50'},
  {value:'180+',label:'Programmes with approvals on file',icon:<ShieldCheck className="w-6 h-6"/>,color:'text-green-600',bg:'bg-green-50'},
  {value:'4 states',label:'Bihar, Jharkhand, UP, Delhi NCR',icon:<Globe className="w-6 h-6"/>,color:'text-purple-600',bg:'bg-purple-50'},
  {value:'₹0',label:'What our guidance costs a student',icon:<IndianRupee className="w-6 h-6"/>,color:'text-orange-600',bg:'bg-orange-50'},
  {value:'3',label:'Connected products, one record',icon:<Building2 className="w-6 h-6"/>,color:'text-yellow-600',bg:'bg-yellow-50'},
  {value:'1:1',label:'A counsellor when you want one',icon:<UserRound className="w-6 h-6"/>,color:'text-indigo-600',bg:'bg-indigo-50'}
];
const PRINCIPLES=[
  {icon:<ShieldCheck className="w-7 h-7 text-blue-600"/>,title:'We name the source',body:'Every fee, approval and salary band on this site points at where it came from. If we cannot source it, it does not go up.'},
  {icon:<IndianRupee className="w-7 h-7 text-green-600"/>,title:'The fee you see is the fee',body:'Total programme cost, not the first instalment. Exam and re-registration charges are listed separately rather than buried.'},
  {icon:<Scale className="w-7 h-7 text-purple-600"/>,title:'Ranking is not for sale',body:'Universities and employers can advertise on DCW. They cannot buy a position in a comparison or a higher rating.'},
  {icon:<UserRound className="w-7 h-7 text-red-500"/>,title:'A person, when you want one',body:'Counselling is free and optional. Nobody on the team is paid a commission on where you enrol.'}
];
const SERVICES=[
  {title:'Distance Courses Wala',desc:'UGC-DEB approved distance and online degrees, plus NIOS, BOSSE and BBOSE open schooling — compared on fee, approval and exam mode.',icon:<BookOpen className="w-7 h-7"/>,href:'/distance'},
  {title:'Colleges Wala',desc:'Colleges in India and abroad with cut-offs, seats and the total cost side by side, and a NEET predictor that turns a rank into a shortlist.',icon:<GraduationCap className="w-7 h-7"/>,href:'/colleges'},
  {title:'Berojgar Bharat',desc:'Fresher-friendly jobs from employers we have checked, with the salary stated upfront, and a free resume builder. No fee to a candidate, ever.',icon:<Briefcase className="w-7 h-7"/>,href:'/jobs'}
];
const MILESTONES=[
  {year:'2019',title:'A counselling desk in Patna',body:'Two counsellors, one whiteboard of admission dates, and a queue outside. Every answer was given face to face.'},
  {year:'2021',title:'The first fee database',body:'We started writing down what each university actually charged, semester by semester, because the brochures kept disagreeing with the accounts office.'},
  {year:'2023',title:'Jobs joined the list',body:'Students who finished a course kept asking the same next question. Berojgar Bharat began as a shared spreadsheet of verified local vacancies.'},
  {year:'2026',title:'One platform, three doors',body:'Distance, Colleges and Jobs run on the same verified records, so a decision made on one side carries into the next.'}
];
const MONEY=[
  ['Listing and advertising','Universities, colleges and employers pay to appear and to advertise. Advertising is labelled as advertising, every time.'],
  ['Admission referrals','When a student enrols through us, the institution pays a referral fee. It is the same fee across institutions in a category, so it cannot tilt what we recommend.'],
  ['What we never do','We do not sell placement in a comparison, we do not sell your phone number, and no counsellor earns a commission tied to where you enrol.']
];

export default function HdAbout({setLead,vertical}){
  const callback=()=>setLead({title:'Talk to a DCW counsellor',interest:vertical});
  return <main id="main" tabIndex={-1} className="hd bg-white min-h-screen">
    <div className="bg-gradient-to-br from-ink via-brand-700 to-brand-600 py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"/>
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-brand-300 rounded-full blur-3xl"/>
      </div>
      <div className="max-w-7xl mx-auto relative text-center">
        <div className="flex justify-center mb-6"><GraduationCap className="w-16 h-16 text-brand-200"/></div>
        <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-4 py-2 rounded-full mb-4 border border-white/20">
          <Award className="w-4 h-4 text-yellow-300"/> Patna-Based Education &amp; Career Guidance, Since 2019
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          We started because the brochure<br/>
          <span className="text-brand-200 text-2xl sm:text-3xl font-semibold">and the accounts office disagreed.</span>
        </h1>
        <p className="text-white/80 text-lg max-w-3xl mx-auto mb-8">
          Distance Courses Wala began as a counselling desk in Patna in 2019. It grew into three connected products because the questions never stopped at admission — they ran on into fees, into results, and into the first job.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/reviews" className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-7 py-3.5 rounded-xl hover:bg-brand-50 transition-colors"><Star className="w-4 h-4"/>Read What Students Say</Link>
          <a href="#principles" className="border border-white/40 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors">How We Work</a>
        </div>
      </div>
    </div>

    <div className="bg-gray-50 py-14 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Why Students Choose DCW</h2>
          <p className="text-gray-500">Stated with their basis, because numbers are the first thing a stranger tests you on</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATS.map(s=><div key={s.label} className={`${s.bg} rounded-2xl p-5 text-center border border-gray-100`}>
            <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-gray-600 text-xs mt-1 font-medium">{s.label}</p>
          </div>)}
        </div>
        <p className="text-center text-xs text-gray-400 mt-5 flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/>Prototype build. These figures are indicative placeholders and will carry a published basis before launch.</p>
      </div>
    </div>

    <div className="py-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-semibold px-3 py-1.5 rounded-full mb-4"><Target className="w-4 h-4"/> Why We Exist</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5 leading-tight">Nobody Should Have to Guess<br/><span className="text-brand-600">What a Degree Costs</span></h2>
          <p className="text-gray-600 text-base leading-relaxed mb-5">The information a student needs to make this decision already exists. It is just scattered across prospectuses, agent WhatsApp forwards, and a phone number that rings out. The gap is not knowledge — it is that nobody has put it in one place and stood behind it.</p>
          <p className="text-gray-600 text-base leading-relaxed mb-6">So that is the whole job: collect the record, check it against the institution, publish it with its source, and let a person read the comparison themselves. Where somebody wants to talk it through, a counsellor picks up. Where they do not, nothing on this site chases them.</p>
          <div className="space-y-3">
            {['Free counselling — optional, never pushed','Every fee and approval published with its source','No paid positions in any comparison','Distance, colleges and jobs on one verified record'].map(p=>
              <div key={p} className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5"/><span className="text-gray-700">{p}</span></div>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {MILESTONES.map((m,i)=><div key={m.year} className={`rounded-2xl p-6 text-white bg-gradient-to-br ${['from-brand-600 to-brand-700','from-indigo-600 to-indigo-700','from-cta-600 to-cta-700','from-green-600 to-emerald-700'][i]}`}>
            <p className="text-3xl font-black mb-2 text-white/90">{m.year}</p>
            <h3 className="font-bold text-lg mb-2">{m.title}</h3>
            <p className="text-white/80 text-sm leading-relaxed">{m.body}</p>
          </div>)}
        </div>
      </div>
    </div>

    <div className="bg-gray-50 py-16 px-4" id="principles">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">How We Work</h2>
          <p className="text-gray-500">The principles behind every listing and every conversation</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRINCIPLES.map(v=><div key={v.title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">{v.icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{v.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{v.body}</p>
          </div>)}
        </div>
      </div>
    </div>

    <div className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">What We Do</h2>
          <p className="text-gray-500">Three connected products, running on the same verified records</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map(s=><Link key={s.title} href={s.href} className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-brand-200 hover:shadow-md transition-all group">
            <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">{s.icon}</span>
            <h3 className="font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{s.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
          </Link>)}
        </div>
      </div>
    </div>

    <div className="bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Institutions Pay Us. You Do Not.</h2>
          <p className="text-gray-500">Money is the question people are too polite to ask, so it is answered first</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {MONEY.map(([t,d],i)=><div key={t} className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-11 h-11 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-4">{[<Briefcase key="a" className="w-6 h-6"/>,<IndianRupee key="b" className="w-6 h-6"/>,<Shield key="c" className="w-6 h-6"/>][i]}</div>
            <h3 className="font-bold text-gray-900 mb-2">{t}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{d}</p>
          </div>)}
        </div>
      </div>
    </div>

    <div className="py-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 items-start">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-semibold px-3 py-1.5 rounded-full mb-4"><MapPin className="w-4 h-4"/> Visit Us</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Come and Argue With Us</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">If a fee on this site is wrong, a listing is stale, or a posting asked you for money, tell us and we will fix it or take it down.</p>
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2.5"><MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5"/><span className="text-sm text-gray-700">{CONTACT.address.full}</span></div>
            <a href={CONTACT.phone.href} className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-brand-600"><Phone className="w-4 h-4 text-brand-600"/>{CONTACT.phone.display}</a>
            <a href={CONTACT.email.href} className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-brand-600"><Mail className="w-4 h-4 text-brand-600"/>{CONTACT.email.display}</a>
            <div className="flex items-center gap-2.5 text-sm text-gray-700"><Clock className="w-4 h-4 text-brand-600"/>{CONTACT.hours}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={officeDirectionsUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 border border-brand-200 hover:bg-brand-50 px-3 py-2 rounded-lg">Get directions<Navigation className="w-3.5 h-3.5"/></a>
            <a href={officePlaceUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 border border-brand-200 hover:bg-brand-50 px-3 py-2 rounded-lg">Open in Google Maps<ExternalLink className="w-3.5 h-3.5"/></a>
          </div>
        </div>
        <iframe className="w-full h-[420px] rounded-2xl border border-gray-100" src={officeEmbedUrl()} title="Map showing the Distance Courses Wala office at Kankarbagh, Patna"
          loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
      </div>
    </div>

    <div className="py-16 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <BookOpen className="w-12 h-12 text-brand-600 mx-auto mb-4"/>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Ready to Take the Next Step?</h2>
        <p className="text-gray-500 mb-7 max-w-xl mx-auto">Talk to a counsellor about a course, a college or a job. It costs nothing, and nobody on the team earns a commission on where you enrol.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button type="button" onClick={callback} className="flex items-center gap-2 bg-brand-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-brand-700 transition-colors"><MessageCircle className="w-4 h-4"/>Request a Callback</button>
          <Link href="/blog" className="flex items-center gap-2 border border-gray-300 text-gray-700 font-bold px-8 py-3.5 rounded-xl hover:border-brand-400 hover:text-brand-600 transition-colors">Read the Blog <ChevronRight className="w-4 h-4"/></Link>
        </div>
      </div>
    </div>
  </main>;
}
