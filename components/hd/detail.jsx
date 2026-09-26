'use client';
import {useState} from 'react';
import Link from 'next/link';
import {MapPin,Star,Building2,Award,TrendingUp,BookOpen,ArrowLeft,CheckCircle2,Phone,Calendar,Shield,Users,Briefcase,IndianRupee,Heart,ArrowRight,MessageCircle,ExternalLink,Navigation,FileText,ChevronDown,Clock,ListChecks,HelpCircle,Lightbulb} from 'lucide-react';
import {Photo} from '@/components/ui/primitives.jsx';
import {HdCard} from '@/components/hd/home.jsx';
import {useApi} from '@/lib/client/api.js';
import {plainFacts} from '@/lib/content/plain.js';
import {coursesOf} from '@/lib/content/courses.js';
import {dutiesOf} from '@/lib/content/jobs.js';
import {fmt} from '@/lib/format.js';

/* HelloDoctor's college page (src/app/(site)/colleges/[id]/page.tsx): a
   photographic banner with the back link, badges, name and a glass rating
   tile; a sticky strip of six quick figures; white rounded cards down the
   main column; a sidebar with the brand-colour fact card, a gradient
   counselling card; and similar options at the foot. Every record on it —
   approvals with their documents, proof of work, the Google mapping, the
   reviews — is this site's, fetched as before. */

const onDay=iso=>{if(!iso)return null;const d=new Date(iso);return Number.isNaN(d.getTime())?null:d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})};
const Card=({id,icon,title,children,className=''})=><section id={id} className={`bg-white rounded-2xl p-6 border border-gray-100 scroll-mt-40 ${className}`}>
  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">{icon}{title}</h2>{children}</section>;

function Faq({q,children}){const [open,setOpen]=useState(false);
  return <div className="border border-gray-100 rounded-xl">
    <button type="button" aria-expanded={open} onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between gap-4 p-4 text-left font-semibold text-sm text-gray-900">
      {q}<ChevronDown className={`w-4 h-4 text-brand-600 transition-transform ${open?'rotate-180':''}`}/></button>
    {open&&<p className="px-4 pb-4 -mt-1 text-sm text-gray-600 leading-relaxed">{children}</p>}
  </div>}

export default function HdDetail(ctx){
  const {entity,vertical,setLead,toggleSave,saved,toggleCompare,compare,go,catalog,cfg}=ctx;
  const isJob=vertical==='jobs';
  const {data:full}=useApi(isJob?null:`/api/${vertical}/institutions/${entity.slug??entity.id}`);
  const {data:emp}=useApi(isJob&&entity.companyId?`/api/companies/${encodeURIComponent(entity.companyId)}`:null);
  const {data:rv}=useApi(isJob
    ?(entity.companyId?`/api/reviews?companyId=${encodeURIComponent(entity.companyId)}&limit=4`:null)
    :`/api/reviews?institutionId=${encodeURIComponent(entity.id)}&limit=4`);
  const facts=full?plainFacts(full):[];
  const approvals=full?.approvals??[];
  const proof=(isJob?emp?.proofOfWork:full?.proofOfWork)??[];
  const google=full?.googleRating??null;
  const map=full?.map??null;
  const reviews=rv?.rows??[];
  const rsum=rv?.summary??null;
  const reviewHref=isJob
    ?(entity.companyId?`/reviews?companyId=${encodeURIComponent(entity.companyId)}`:'/reviews')
    :`/reviews?institutionId=${encodeURIComponent(entity.id)}&vertical=${vertical}`;
  const courses=isJob?[]:coursesOf(entity);
  const employer=entity.company||entity.place.split(' • ')[0];
  const where=entity.wfh?'Work from home':`${entity.area?entity.area+', ':''}${entity.city}`;
  const listHref=vertical==='distance'?'/distance/universities':`/${vertical}/search`;
  const back=vertical==='distance'?'Back to Universities':vertical==='colleges'?'Back to Colleges':'Back to Jobs';
  const isSaved=saved.includes(entity.id);
  const apply=(course)=>setLead({mode:'apply',title:isJob?`Apply for ${entity.name}`:`Apply to ${entity.name}`,interest:entity.id,interestType:isJob?'job':'course',
    course:isJob?entity.name:(course??courses[0]?.name),courses:isJob?null:courses.map(c=>c.name),where:entity.place});
  const talk=()=>setLead({title:`Talk about ${entity.name}`,interest:entity.id});
  const typeColor=/gov|state|central/i.test(entity.type)?'bg-green-100 text-green-700 border-green-200':/deemed/i.test(entity.type)?'bg-blue-100 text-blue-700 border-blue-200':'bg-orange-100 text-orange-700 border-orange-200';

  const quickStats=isJob
    ?[['Monthly Pay',entity.duration,'text-brand-600'],['Annual (indicative)',fmt(entity.fee),'text-green-600'],['Openings',entity.emi,'text-purple-600'],['Rating',`${entity.rating}/5`,'text-gray-700'],['Mode',entity.mode,'text-gray-700'],['Deadline',entity.deadline,'text-emerald-600']]
    :[['Starting Fee',fmt(entity.fee),'text-brand-600'],['Duration',entity.duration,'text-green-600'],['Mode',entity.mode,'text-purple-600'],['Reviews',(entity.reviews??0).toLocaleString('en-IN'),'text-gray-700'],['Deadline',entity.deadline,'text-gray-700'],['Approval',entity.approval[0]??'—','text-emerald-600']];
  const similar=catalog.rows.filter(x=>x.id!==entity.id&&(isJob?x.sector===entity.sector:(x.streams??[]).some(s=>(entity.streams??[]).includes(s)))).slice(0,4);
  const similarRows=similar.length?similar:catalog.rows.filter(x=>x.id!==entity.id).slice(0,4);
  const steps=isJob?['Apply with your basic profile','Get interview details on WhatsApp','Attend and track your status']:['Speak with a counsellor','Check eligibility and documents','Submit to the institution','Track your application'];

  return <main id="main" tabIndex={-1} className="hd bg-gray-50 min-h-screen">
    <div className="relative h-72 sm:h-96 w-full overflow-hidden">
      {entity.imageFull||entity.image
        ?<img src={entity.imageFull||entity.image} alt={entity.imageAlt||''} className="absolute inset-0 w-full h-full object-cover"/>
        :<Photo name={isJob?'career-editorial':'campus-editorial'} priority className="absolute inset-0 [&_img]:w-full [&_img]:h-full [&_img]:object-cover"/>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"/>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="max-w-7xl mx-auto">
          <Link href={listHref} className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition-colors"><ArrowLeft className="w-4 h-4"/>{back}</Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isJob?'bg-green-100 text-green-700 border-green-200':typeColor}`}>{entity.type}</span>
                {entity.approval.slice(0,2).map((a,i)=><span key={a} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${i===0?'bg-emerald-100 text-emerald-700 border-emerald-200':'bg-blue-100 text-blue-700 border-blue-200'}`}>{a}</span>)}
                {entity.imageIllustrative&&<span className="text-[10px] text-white/70">Illustrative image</span>}
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1">{entity.name}</h1>
              <div className="flex items-center gap-1.5 text-white/75 text-sm"><MapPin className="w-4 h-4"/>{isJob?<>{employer} &nbsp;·&nbsp; {where} &nbsp;·&nbsp; {entity.sector}</>:<>{entity.place} &nbsp;·&nbsp; {entity.mode}</>}</div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl px-4 py-2.5 self-start sm:self-auto">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
              <div><div className="text-white font-bold text-lg leading-none">{entity.rating}/5</div><div className="text-white/60 text-xs">{(entity.reviews??0).toLocaleString('en-IN')} reviews</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white border-b border-gray-100 sticky top-[104px] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-gray-100">
          {quickStats.map(([l,v,c])=><div key={l} className="py-3 px-3 text-center"><p className="text-xs text-gray-400 mb-0.5">{l}</p><p className={`text-sm font-bold ${c} truncate`}>{v}</p></div>)}
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {facts.length>0&&<Card id="plain" icon={<Lightbulb className="w-5 h-5 text-yellow-500"/>} title="In Simple Words — The Six Things You Need to Know">
            {full.plainSummary&&<p className="text-brand-700 bg-brand-50 border-l-4 border-brand-600 px-4 py-3 rounded-r-lg text-sm font-medium mb-5 leading-relaxed">{full.plainSummary}</p>}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">{facts.map(f=><div key={f.q} className="bg-gray-50 rounded-xl p-4 border border-gray-100"><dt className="text-xs font-semibold text-gray-500 mb-1">{f.q}</dt><dd className="text-sm text-gray-800">{f.a}</dd></div>)}</dl>
          </Card>}

          <Card id="overview" icon={<Building2 className="w-5 h-5 text-brand-600"/>} title={isJob?'About This Role':`About ${entity.name.replace(/ (University|Online).*$/,'')}`}>
            <p className="text-gray-600 leading-relaxed text-sm mb-4">{isJob?`This ${entity.type.toLowerCase()} opportunity is open to ${entity.course}. The salary range is disclosed and the employer has been verified by the DCW jobs team.`:`${entity.name} offers ${entity.course} in ${entity.mode.toLowerCase()} mode. We show the total fee, approval status, expected duration and deadline together so you can make a practical comparison.`}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(isJob?dutiesOf(entity):[`Mode: ${entity.mode}`,`Duration: ${entity.duration}`,`Deadline: ${entity.deadline}`,'Student support: dedicated mentor']).map(h=><div key={h} className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5"/><span className="text-sm text-gray-700">{h}</span></div>)}
            </div>
          </Card>

          {isJob
            ?<Card id="fees" icon={<Briefcase className="w-5 h-5 text-green-600"/>} title="Role, Requirements and Pay">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center"><p className="text-xs text-gray-500 mb-1">Monthly Pay</p><p className="text-lg font-bold text-green-600">{entity.duration}</p></div>
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center"><p className="text-xs text-gray-500 mb-1">Annual (Indicative)</p><p className="text-lg font-bold text-brand-600">{fmt(entity.fee)}</p></div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center col-span-2 sm:col-span-1"><p className="text-xs text-gray-500 mb-1">Openings</p><p className="text-lg font-bold text-purple-600">{entity.emi}</p></div>
              </div>
              <dl className="divide-y divide-gray-50">{[['Employer',employer],['Where',where],['Industry',entity.sector],['Shift / mode',entity.mode],['Eligibility',entity.course],['Interview','In-person or video · no fee']].map(([k,v])=><div key={k} className="flex justify-between gap-4 py-2"><dt className="text-sm text-gray-500">{k}</dt><dd className="text-sm font-semibold text-gray-800 text-right">{v}</dd></div>)}</dl>
            </Card>
            :<Card id="fees" icon={<BookOpen className="w-5 h-5 text-brand-600"/>} title="Programs Offered & Fees">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead><tr className="bg-brand-50">{['Course','Duration','Total fee',''].map(h=><th key={h} className="text-left px-4 py-2.5 font-semibold text-brand-700 border border-brand-100">{h||<span className="sr-only">Apply</span>}</th>)}</tr></thead>
                  <tbody>{courses.map((c,i)=><tr key={c.name} className={i%2===0?'bg-white':'bg-gray-50'}>
                    <td className="px-4 py-2.5 text-gray-800 border border-gray-100"><b className="font-semibold">{c.name}</b>{c.note&&<span className="block text-xs text-gray-500">{c.note}</span>}</td>
                    <td className="px-4 py-2.5 text-gray-700 border border-gray-100">{c.duration}</td>
                    <td className="px-4 py-2.5 border border-gray-100"><b className="text-brand-600">{fmt(c.fee)}</b>{c.mrp&&<s className="block text-xs text-gray-400">{fmt(c.mrp)}</s>}</td>
                    <td className="px-4 py-2.5 border border-gray-100 text-right"><button type="button" onClick={()=>apply(c.name)} className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg">Apply</button></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5"/>Indicative demo data. Verify the final offer with the institution.</p>
            </Card>}

          <Card id="proof" icon={<Shield className="w-5 h-5 text-brand-600"/>} title={isJob?'What the Employer Has Declared':'Approvals & Affiliations'}>
            {approvals.length>0
              ?<ul className="space-y-3">{approvals.map((a,i)=>{const href=a.documentId?`/api/documents/${a.documentId}`:a.certificateUrl;const till=onDay(a.validTill);
                return <li key={`${a.body}-${i}`} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Shield className="w-5 h-5"/></span>
                  <div className="flex-1 min-w-0"><b className="block text-sm text-gray-900">{a.body}{a.grade?` · ${a.grade}`:''}</b>
                    <small className="block text-xs text-gray-500">{[a.scope,till?`Valid till ${till}`:null,a.verified?'Checked by DCW':'On file, not yet checked by DCW'].filter(Boolean).join(' · ')}</small>
                    {a.note&&<p className="text-xs text-gray-600 mt-1">{a.note}</p>}</div>
                  {href?<a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 border border-brand-200 hover:bg-brand-50 px-3 py-1.5 rounded-lg shrink-0">{a.documentName?'Open document':'Open certificate'}<ExternalLink className="w-3.5 h-3.5"/></a>
                    :<span className="text-xs text-gray-400 shrink-0">No document uploaded yet</span>}
                </li>})}</ul>
              :<div className="flex flex-wrap gap-2">{entity.approval.map(a=><span key={a} className="bg-gray-100 text-gray-700 border border-gray-200 text-sm font-medium px-3 py-1.5 rounded-full">✓ {a}</span>)}
                {!entity.approval.length&&<p className="text-sm text-gray-500">Nothing on record for this listing yet. Ask a counsellor before you pay anything.</p>}</div>}
            {!isJob&&approvals.length>0&&<p className="text-xs text-gray-500 mt-4">An approval is a permission to run the course. A grade — NAAC A++, for example — is a quality rating, and is not the same thing.</p>}
          </Card>

          {proof.length>0&&<Card id="work" icon={<Award className="w-5 h-5 text-yellow-500"/>} title={isJob?'Evidence From This Employer':'Proof of Work'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{proof.map(p=>{const img=/^image\//.test(p.mimeType??'');
              return <figure key={p.id} className="rounded-xl border border-gray-100 overflow-hidden bg-white">
                {img&&p.url?<img src={p.url} alt={p.title} loading="lazy" className="w-full h-40 object-cover"/>:<div className="h-20 bg-brand-50 text-brand-600 flex items-center justify-center"><FileText className="w-7 h-7"/></div>}
                <figcaption className="p-4"><b className="block text-sm text-gray-900">{p.title}</b><small className="block text-xs text-gray-500 mb-1">{[p.kind,p.courseName,p.year].filter(Boolean).join(' · ')}</small>
                  {p.summary&&<p className="text-xs text-gray-600 mb-2">{p.summary}</p>}
                  {p.url&&<a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">{img?'View full size':'Open document'}<ExternalLink className="w-3 h-3"/></a>}</figcaption>
              </figure>})}</div>
          </Card>}

          {map?.mapped&&<Card id="location" icon={<MapPin className="w-5 h-5 text-brand-600"/>} title="Location, and What Google Says">
            {map.embed&&<iframe className="w-full h-64 rounded-xl border border-gray-100 mb-4" src={map.embed} title={`Map showing ${entity.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>}
            <p className="text-sm text-gray-600 flex items-start gap-2 mb-3"><MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"/>{map.address??entity.place}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {map.place&&<a href={map.place} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 border border-brand-200 hover:bg-brand-50 px-3 py-1.5 rounded-lg">Open in Google Maps<ExternalLink className="w-3.5 h-3.5"/></a>}
              {map.directions&&<a href={map.directions} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 border border-brand-200 hover:bg-brand-50 px-3 py-1.5 rounded-lg">Get directions<Navigation className="w-3.5 h-3.5"/></a>}
            </div>
            {google?.available
              ?<div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4"><b className="text-lg text-gray-900 inline-flex items-center gap-1.5"><Star className="w-5 h-5 text-yellow-500 fill-yellow-500"/>{google.rating}</b> <span className="text-sm text-gray-600">on Google, from {google.total.toLocaleString('en-IN')} rating{google.total===1?'':'s'}</span>
                <p className="text-xs text-gray-500 mt-1">Google&rsquo;s figure, shown as Google reports it — kept apart from the DCW reviews below, because the two count different things.</p></div>
              :<p className="text-xs text-gray-500">Google has no rating on record for this place yet.</p>}
          </Card>}

          <Card id="reviews" icon={<Users className="w-5 h-5 text-brand-600"/>} title={rsum?.count?`What ${rsum.count} Student${rsum.count===1?'':'s'} Told Us`:'Student Reviews'}>
            {reviews.length>0
              ?<><div className="flex items-center gap-3 mb-4"><span className="text-3xl font-black text-gray-900">{rsum.average}</span><span className="text-sm text-gray-500 inline-flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/>average of {rsum.count} published review{rsum.count===1?'':'s'}{rsum.verified>0?` · ${rsum.verified} from a confirmed applicant`:''}</span></div>
                <ul className="space-y-3">{reviews.map(r=><li key={r.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between gap-2"><b className="text-sm text-gray-900">{r.name}{r.city?` · ${r.city}`:''}</b><span className="text-yellow-500 text-sm">{'★'.repeat(r.rating)}<span className="text-gray-300">{'★'.repeat(5-r.rating)}</span></span></div>
                  <small className="block text-xs text-gray-500 mb-1">{r.subject}{r.verified?' · Verified applicant':''}</small>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.text}</p></li>)}</ul></>
              :<p className="text-sm text-gray-600">Nobody has reviewed this listing on DCW yet. If you have studied or applied here, yours would be the first — and the most useful.</p>}
            <button type="button" onClick={()=>go(reviewHref)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 border border-brand-200 hover:bg-brand-50 px-4 py-2 rounded-xl">{reviews.length>0?'Read all reviews':'Write the first review'}<ArrowRight className="w-4 h-4"/></button>
          </Card>

          <Card id="process" icon={<ListChecks className="w-5 h-5 text-green-600"/>} title="What Happens Next">
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${steps.length===4?'lg:grid-cols-4':'lg:grid-cols-3'} gap-3`}>
              {steps.map((s,i)=><div key={s} className="bg-gray-50 rounded-xl p-4 border border-gray-100"><p className="text-xs font-bold text-brand-600 mb-1">STEP {i+1}</p><p className="text-sm font-semibold text-gray-900">{s}</p></div>)}
            </div>
          </Card>

          <Card id="faq" icon={<HelpCircle className="w-5 h-5 text-brand-600"/>} title="Common Questions">
            <div className="space-y-2">
              <Faq q="Is this information verified?">Our research team checks approvals, fees and key facts against official sources each admission cycle. This prototype uses clearly marked indicative data.</Faq>
              <Faq q="Does counselling cost anything?">No. DCW discovery and counselling are free for students.</Faq>
              <Faq q="Can I save this and decide later?">Yes. Saved items remain available on this device.</Faq>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden lg:sticky lg:top-44">
            <div className="bg-brand-600 p-4">
              <h3 className="font-bold text-white text-lg">{isJob?employer:entity.name}</h3>
              <p className="text-white/75 text-sm">{isJob?where:entity.place}</p>
            </div>
            <div className="p-4 space-y-3">
              {(isJob
                ?[['Salary',entity.duration,true],['Openings',entity.emi],['Job type',entity.type],['Industry',entity.sector],['Deadline',entity.deadline]]
                :[['Starting from',fmt(entity.fee),true],['Duration',entity.duration],['Mode',entity.mode],['Type',entity.type],['Deadline',entity.deadline]]
              ).map(([l,v,hl])=><div key={l} className="flex justify-between items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span><span className={`text-sm font-semibold text-right ${hl?'text-brand-600':'text-gray-800'}`}>{v}{hl&&entity.mrp&&<s className="ml-1.5 text-xs text-gray-400 font-normal">{fmt(entity.mrp)}</s>}</span>
              </div>)}
              <button type="button" onClick={()=>apply()} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors">Apply Now <ArrowRight className="w-4 h-4"/></button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={talk} className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 hover:border-brand-400 hover:text-brand-600 font-semibold text-xs px-3 py-2.5 rounded-xl transition-colors"><MessageCircle className="w-4 h-4"/>Callback</button>
                <button type="button" onClick={()=>toggleSave(entity.id)} aria-pressed={isSaved} className={`flex items-center justify-center gap-1.5 border font-semibold text-xs px-3 py-2.5 rounded-xl transition-colors ${isSaved?'border-brand-600 bg-brand-50 text-brand-700':'border-gray-200 text-gray-700 hover:border-brand-400 hover:text-brand-600'}`}><Heart className={`w-4 h-4 ${isSaved?'fill-brand-600 text-brand-600':''}`}/>{isSaved?'Saved':'Save'}</button>
              </div>
              {!isJob&&<button type="button" onClick={()=>toggleCompare(entity.id)} className="w-full text-xs font-semibold text-brand-600 hover:underline">{compare[vertical].includes(entity.id)?'Remove from compare':'+ Add to compare (up to 3)'}</button>}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm"><BookOpen className="w-4 h-4 text-brand-600"/>{isJob?'Skills & Eligibility':'Courses Offered'}</h3>
            <div className="flex flex-wrap gap-2">{(isJob?[entity.course,entity.qualification,entity.mode].filter(Boolean):courses.map(c=>c.name)).map(s=>
              <span key={s} className="bg-purple-50 border border-purple-200 text-purple-700 text-sm font-semibold px-3 py-1.5 rounded-lg">{s}</span>)}</div>
          </div>

          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-5 text-white">
            <h3 className="font-bold text-lg mb-1">{isJob?'Need Help Applying?':'Need Admission Help?'}</h3>
            <p className="text-white/75 text-sm mb-4">Talk to our {cfg.logoAlt} counsellors for free guidance on {entity.name}.</p>
            <button type="button" onClick={talk} className="flex items-center justify-center gap-2 bg-white text-brand-600 font-bold text-sm px-5 py-3 rounded-xl hover:bg-brand-50 transition-colors w-full"><Phone className="w-4 h-4"/>Book Free Counselling</button>
          </div>
        </div>
      </div>

      {similarRows.length>0&&<div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-5">{isJob?'Similar Jobs You May Like':vertical==='colleges'?'Similar Colleges You May Like':'Similar Universities You May Like'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{similarRows.map((c,i)=><HdCard key={c.id} item={c} vertical={vertical} i={i}/>)}</div>
      </div>}
    </div>
  </main>;
}
