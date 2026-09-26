'use client';
import {useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Award,BookOpen,CheckCircle2,ChevronDown,Clock,FileText,HelpCircle,Lightbulb,ListChecks,MessageCircle,Phone,Scale,Shield,Star,XCircle} from 'lucide-react';
import {Photo} from '@/components/ui/primitives.jsx';
import {useApi} from '@/lib/client/api.js';

/* One open-school board — NIOS, BOSSE or BBOSE — in the same layout as a
   university or college page (components/hd/detail.jsx): photographic banner,
   a strip of quick figures, white cards down the main column and an apply
   card in the sidebar. Every figure comes from the board record the admin
   edits at /admin/boards (/api/boards); nothing here restates a fee or a
   result time by hand. The documents and steps are the general process a
   counsellor walks through, and say so. */

const Card=({id,icon,title,children})=><section id={id} className="bg-white rounded-2xl p-6 border border-gray-100 scroll-mt-40">
  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">{icon}{title}</h2>{children}</section>;

function Faq({q,children}){const [open,setOpen]=useState(false);
  return <div className="border border-gray-100 rounded-xl">
    <button type="button" aria-expanded={open} onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between gap-4 p-4 text-left font-semibold text-sm text-gray-900">
      {q}<ChevronDown className={`w-4 h-4 text-brand-600 transition-transform ${open?'rotate-180':''}`}/></button>
    {open&&<p className="px-4 pb-4 -mt-1 text-sm text-gray-600 leading-relaxed">{children}</p>}
  </div>}

const PHOTO={nios:'classroom-session',bosse:'home-study',bbose:'campus-steps'};

export default function HdBoardDetail({path,setLead}){
  const id=path?.split('/').pop();
  const {data,state}=useApi('/api/boards');
  const rows=data?.rows??[];
  const b=rows.find(x=>x.id===id);

  if(!b)return <main id="main" tabIndex={-1} className="hd bg-gray-50 min-h-[60vh] flex items-center justify-center px-4">
    {state==='error'||(data&&!b)
      ?<div className="text-center bg-white rounded-2xl border border-gray-100 p-10 max-w-md">
        <h1 className="text-xl font-bold text-gray-900 mb-2">We could not find that board</h1>
        <p className="text-gray-500 text-sm mb-5">The link may be out of date. All three open-school boards are compared on one page.</p>
        <Link href="/distance/boards" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl">Compare the boards<ArrowRight className="w-4 h-4"/></Link>
      </div>
      :<div className="w-full max-w-7xl h-96 rounded-2xl bg-white border border-gray-100 animate-pulse" role="status" aria-label="Loading board"/>}
  </main>;

  const others=rows.filter(x=>x.id!==b.id);
  const apply=course=>setLead({mode:'apply',title:`Apply through ${b.name}`,interest:b.id,interestType:'board',
    course:course??`Class 12 via ${b.name}`,courses:[`Class 10 via ${b.name}`,`Class 12 via ${b.name}`],where:b.full});
  const talk=()=>setLead({title:`${b.name} eligibility check`,interest:b.id});
  const quick=[['Result In',b.resultLabel,'text-brand-600'],['Exam Cycle',b.examLabel,'text-green-600'],['Indicative Fee',b.feeLabel,'text-purple-600'],
    ['Acceptance',b.acceptanceLabel,'text-gray-700'],['Flexibility',b.flexibility,'text-gray-700'],['TC Needed',b.tcRequired?'Yes':'No','text-emerald-600']];
  const docs=['Previous marksheet (last class passed)','Aadhaar card or other photo ID','Two recent passport-size photographs','Date-of-birth proof, if not on the marksheet',
    b.tcRequired?'Transfer certificate (TC) from your last school — this board asks for it':'No transfer certificate needed for this board'];
  const steps=['Tell a counsellor your last class passed and the year','Check eligibility, subjects and documents','Register with the board and pay the board fee','Study, sit the exam and receive your result'];
  const cols=['Recognition','Result in','Exam cycle','Indicative fee','Acceptance','TC needed'];
  const cell=(x,c)=>c==='Recognition'?x.recognition:c==='Result in'?x.resultLabel:c==='Exam cycle'?x.examLabel:c==='Indicative fee'?x.feeLabel:c==='Acceptance'?x.acceptanceLabel:(x.tcRequired?'Yes':'No');

  return <main id="main" tabIndex={-1} className="hd bg-gray-50 min-h-screen">
    <div className="relative h-72 sm:h-96 w-full overflow-hidden">
      <Photo name={PHOTO[b.id]??'classroom-session'} priority className="absolute inset-0 [&_img]:w-full [&_img]:h-full [&_img]:object-cover"/>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"/>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/distance/boards" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition-colors"><ArrowLeft className="w-4 h-4"/>Back to Board Guide</Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">{b.kicker}</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-blue-100 text-blue-700 border-blue-200">10th &amp; 12th</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1">{b.name} — {b.full}</h1>
              <p className="text-white/75 text-sm">{b.recognition}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl px-4 py-2.5 self-start sm:self-auto">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
              <div><div className="text-white font-bold text-lg leading-none">{b.acceptanceLabel}</div><div className="text-white/60 text-xs">acceptance score</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white border-b border-gray-100 sticky top-[104px] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-gray-100">
          {quick.map(([l,v,c])=><div key={l} className="py-3 px-3 text-center"><p className="text-xs text-gray-400 mb-0.5">{l}</p><p className={`text-sm font-bold ${c} truncate`}>{v}</p></div>)}
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card id="plain" icon={<Lightbulb className="w-5 h-5 text-yellow-500"/>} title="In Simple Words">
            <p className="text-brand-700 bg-brand-50 border-l-4 border-brand-600 px-4 py-3 rounded-r-lg text-sm font-medium mb-5 leading-relaxed">{b.plain}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[`Best for: ${b.bestFor}`,`Recognition: ${b.recognition}`,`Exams: ${b.examFrequency}`,`Result usually in ${b.resultLabel}`].map(h=>
                <div key={h} className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5"/><span className="text-sm text-gray-700">{h}</span></div>)}
            </div>
          </Card>

          <Card id="courses" icon={<BookOpen className="w-5 h-5 text-brand-600"/>} title="What You Can Complete">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['Class 10 (Secondary)','For learners who stopped before 10th or want to clear it again.'],['Class 12 (Senior Secondary)','For learners with 10th done who need a 12th for college or a job.']].map(([t,d],i)=>
                <div key={t} className="rounded-xl border border-gray-100 bg-gray-50 p-5 flex flex-col">
                  <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3"><Award className="w-5 h-5"/></span>
                  <b className="text-gray-900">{t}</b>
                  <p className="text-sm text-gray-600 mt-1 mb-4 flex-1">{d}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3"><span>Fee from <b className="text-brand-600">{b.feeLabel}</b></span><span>Result {b.resultLabel}</span></div>
                  <button type="button" onClick={()=>apply(`Class ${i?12:10} via ${b.name}`)} className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors">Apply for Class {i?12:10}</button>
                </div>)}
            </div>
          </Card>

          <Card id="documents" icon={<FileText className="w-5 h-5 text-brand-600"/>} title="Documents You Will Usually Need">
            <ul className="space-y-2.5">{docs.map((d,i)=><li key={d} className="flex items-start gap-2.5 text-sm text-gray-700">
              {i===docs.length-1&&!b.tcRequired?<XCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"/>:<CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5"/>}{d}</li>)}</ul>
            <p className="text-xs text-gray-400 mt-4">The board publishes the final list each session — a counsellor checks yours against it before anything is paid.</p>
          </Card>

          <Card id="compare" icon={<Scale className="w-5 h-5 text-brand-600"/>} title={`${b.name} Compared With the Other Two`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-brand-50"><th className="text-left px-4 py-2.5 font-semibold text-brand-700 border border-brand-100"> </th>
                  {[b,...others].map(x=><th key={x.id} className={`text-left px-4 py-2.5 font-semibold border border-brand-100 ${x.id===b.id?'text-brand-700 bg-brand-100':'text-brand-700'}`}>{x.id===b.id?x.name:<Link href={`/distance/board/${x.id}`} className="hover:underline">{x.name}</Link>}</th>)}</tr></thead>
                <tbody>{cols.map((c,i)=><tr key={c} className={i%2?'bg-gray-50':'bg-white'}>
                  <td className="px-4 py-2.5 text-gray-500 border border-gray-100 whitespace-nowrap">{c}</td>
                  {[b,...others].map(x=><td key={x.id} className={`px-4 py-2.5 border border-gray-100 ${x.id===b.id?'font-semibold text-gray-900':'text-gray-700'}`}>{cell(x,c)}</td>)}
                </tr>)}</tbody>
              </table>
            </div>
          </Card>

          <Card id="process" icon={<ListChecks className="w-5 h-5 text-green-600"/>} title="How Admission Works">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {steps.map((s,i)=><div key={s} className="bg-gray-50 rounded-xl p-4 border border-gray-100"><p className="text-xs font-bold text-brand-600 mb-1">STEP {i+1}</p><p className="text-sm font-semibold text-gray-900">{s}</p></div>)}
            </div>
          </Card>

          <Card id="faq" icon={<HelpCircle className="w-5 h-5 text-brand-600"/>} title="Common Questions">
            <div className="space-y-2">
              <Faq q={`Is a ${b.name} certificate valid for college admission?`}>{b.name} is a {b.recognition.toLowerCase()}. Its acceptance score on this site is {b.acceptanceLabel}, which reflects how widely colleges and employers we have checked accept it. Confirm with the specific college before you apply there.</Faq>
              <Faq q="I have a gap of a few years. Can I still enrol?">Yes. Open boards are built for learners with gaps. Tell a counsellor your last class passed and the year, and they will confirm what is open to you now.</Faq>
              <Faq q="How soon will I get my result?">{b.name} usually declares results in {b.resultLabel} after the exam. Its exams run {b.examFrequency.toLowerCase()}.</Faq>
              <Faq q="Does DCW charge anything?">No. Counselling is free. You pay the board&rsquo;s own fee; the figure shown here is indicative and confirmed before payment.</Faq>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden lg:sticky lg:top-44">
            <div className="bg-brand-600 p-4"><h3 className="font-bold text-white text-lg">{b.name}</h3><p className="text-white/75 text-sm">{b.full}</p></div>
            <div className="p-4 space-y-3">
              {[['Indicative fee',b.feeLabel,true],['Result in',b.resultLabel],['Exam cycle',b.examLabel],['Flexibility',b.flexibility],['TC needed',b.tcRequired?'Yes':'No']].map(([l,v,hl])=>
                <div key={l} className="flex justify-between items-center gap-3 py-1.5 border-b border-gray-50 last:border-0"><span className="text-sm text-gray-500">{l}</span><span className={`text-sm font-semibold text-right ${hl?'text-brand-600':'text-gray-800'}`}>{v}</span></div>)}
              <button type="button" onClick={()=>apply()} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors">Apply for Admission <ArrowRight className="w-4 h-4"/></button>
              <button type="button" onClick={talk} className="w-full flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 hover:border-brand-400 hover:text-brand-600 font-semibold text-sm px-3 py-2.5 rounded-xl transition-colors"><MessageCircle className="w-4 h-4"/>Check My Eligibility</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm"><Shield className="w-4 h-4 text-brand-600"/>Other Open Boards</h3>
            <div className="space-y-2">{others.map(x=><Link key={x.id} href={`/distance/board/${x.id}`} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-colors group">
              <span><b className="block text-sm text-gray-900 group-hover:text-brand-700">{x.name}</b><small className="block text-xs text-gray-500">{x.bestFor}</small></span><ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600"/></Link>)}</div>
          </div>

          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-5 text-white">
            <h3 className="font-bold text-lg mb-1">Not Sure Which Board?</h3>
            <p className="text-white/75 text-sm mb-4">Tell us your deadline and where you stopped. A counsellor will tell you which board fits — free.</p>
            <button type="button" onClick={talk} className="flex items-center justify-center gap-2 bg-white text-brand-600 font-bold text-sm px-5 py-3 rounded-xl hover:bg-brand-50 transition-colors w-full"><Phone className="w-4 h-4"/>Book Free Counselling</button>
            <p className="text-white/60 text-xs mt-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/>Usually a call back the same day</p>
          </div>
        </div>
      </div>
    </div>
  </main>;
}
