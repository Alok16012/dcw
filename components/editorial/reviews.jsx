'use client';
import {useMemo,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {ArrowRight,Heart,MapPin,ShieldCheck,Star,MessageCircle,X} from 'lucide-react';
import {PageHero} from '@/components/ui/primitives.jsx';
import {useApi} from '@/lib/client/api.js';
/* One of the three pages a stranger checks before trusting a site with their
   marks, their money or their phone number.

   The nine reviews that used to be pasted into this file now live in
   lib/reviews-repo.js and arrive over /api/reviews, which is what makes them
   reusable (client requirement 11): the same record renders here, on the
   institution's detail page and as the star rating on its listing card, with no
   second copy to keep in step. Arriving here with `?institutionId=` — which is
   the link from a detail page — narrows this page to that one listing.

   Both buttons on this page now do what they say. "Helpful" is a PATCH that
   moves a real counter; "Write a review" is a POST that lands in the admin
   moderation queue, because a public review page is somewhere a real
   institution can be defamed and nothing should publish itself. */

const VERTICALS=[['distance','Distance'],['colleges','Colleges'],['jobs','Jobs']];
const LABEL=Object.fromEntries(VERTICALS);
const when=iso=>{const d=new Date(iso);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-IN',{month:'short',year:'numeric'})};
const initials=n=>String(n).trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();

/* Hoisted: a component declared inside the page is a different component on
   every keystroke, and React throws away the input — and the caret with it. */
function WriteForm({vertical,lockVertical,institutionId,courseName,onDone}){
  const [form,setForm]=useState({name:'',city:'',rating:5,subject:'',text:'',vertical});
  const [errors,setErrors]=useState({});
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState('');
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  async function submit(e){
    e.preventDefault();setBusy(true);setErrors({});
    try{
      const res=await fetch('/api/reviews',{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({...form,rating:Number(form.rating),vertical:lockVertical?vertical:form.vertical,
          institutionId:institutionId??undefined,courseName:courseName??undefined})});
      const body=await res.json().catch(()=>null);
      if(!res.ok||body?.ok===false){
        if(body?.errors)setErrors(body.errors);
        else setErrors({text:body?.message||'Could not save that. Try again.'});
      }else{setDone(body?.data?.message??'Thanks — your review goes live once our team has checked it.');onDone?.()}
    }catch{setErrors({text:'Could not reach the server. Check your connection.'})}
    setBusy(false);
  }

  if(done)return <div className="rv-form done"><ShieldCheck/><p>{done}</p></div>;

  return <form className="rv-form" onSubmit={submit}>
    <h2>Write a review</h2>
    <p className="rv-form-note">Say what actually happened. Low ratings are published too — that is the only reason the high ones are worth reading.</p>
    <div className="rv-form-row">
      <label>Your name<input value={form.name} onChange={e=>set('name',e.target.value)} autoComplete="name"/>{errors.name&&<em>{errors.name}</em>}</label>
      <label>City<input value={form.city} onChange={e=>set('city',e.target.value)} autoComplete="address-level2"/></label>
    </div>
    <div className="rv-form-row">
      <label>Rating
        <select value={form.rating} onChange={e=>set('rating',e.target.value)}>
          {[5,4,3,2,1].map(n=><option key={n} value={n}>{n} — {['Terrible','Poor','Mixed','Good','Excellent'][n-1]}</option>)}
        </select>{errors.rating&&<em>{errors.rating}</em>}
      </label>
      <label>What is it about<input value={form.subject} onChange={e=>set('subject',e.target.value)} placeholder="B.Com (Distance) · fee comparison"/>{errors.subject&&<em>{errors.subject}</em>}</label>
    </div>
    {!lockVertical&&<label>Which part of DCW
      <select value={form.vertical} onChange={e=>set('vertical',e.target.value)}>
        <option value="distance">Distance Courses Wala</option>
        <option value="colleges">Colleges Wala</option>
        <option value="jobs">Berojgar Bharat</option>
      </select>{errors.vertical&&<em>{errors.vertical}</em>}
    </label>}
    <label>Your review<textarea rows={5} value={form.text} onChange={e=>set('text',e.target.value)} placeholder="What you were trying to do, what happened, and whether it helped."/>{errors.text&&<em>{errors.text}</em>}</label>
    <button className="btn primary" type="submit" disabled={busy}>{busy?'Sending…':'Submit review'}<ArrowRight/></button>
  </form>;
}

export function ReviewsPage({go,notify,vertical}){
  const sp=useSearchParams();
  const institutionId=sp.get('institutionId')||'';
  const companyId=sp.get('companyId')||'';
  const linkedVertical=sp.get('vertical')||'';

  const [filter,setFilter]=useState('All');
  const [sort,setSort]=useState('Most helpful');
  const [writing,setWriting]=useState(false);
  /* Helpful counts the server has confirmed, keyed by review id, so a click
     shows the real new number rather than an optimistic guess. */
  const [bumped,setBumped]=useState({});

  const qs=new URLSearchParams();
  if(institutionId)qs.set('institutionId',institutionId);
  if(companyId)qs.set('companyId',companyId);
  const {data,state,error,reload}=useApi(`/api/reviews${qs.toString()?`?${qs}`:''}`);

  /* The name of the listing this page has been narrowed to. Resolved from the
     catalogue rather than read out of the URL — a title taken from a query
     string is a sentence anyone can put on our page. */
  const {data:inst}=useApi(institutionId&&linkedVertical?`/api/${linkedVertical}/institutions/${encodeURIComponent(institutionId)}`:null);

  const all=useMemo(()=>(data?.rows??[]).map(r=>({...r,helpful:bumped[r.id]??r.helpful})),[data,bumped]);
  const shown=useMemo(()=>{
    const list=all.filter(r=>filter==='All'||r.vertical===filter);
    return [...list].sort((a,b)=>sort==='Most helpful'?b.helpful-a.helpful
      :sort==='Highest rated'?b.rating-a.rating
      :sort==='Lowest rated'?a.rating-b.rating
      :b.createdAt.localeCompare(a.createdAt));
  },[all,filter,sort]);

  /* The distribution is drawn from the same rows the cards render, so the bars
     can never disagree with the reviews underneath them. */
  const summary=data?.summary??null;
  const total=all.length;
  const avg=summary?.average??null;
  const dist=summary?.distribution??[];
  const stars=n=>Array.from({length:5},(_,i)=><Star key={i} className={i<n?'on':''}/>);

  async function helpful(r){
    try{
      const res=await fetch('/api/reviews',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id:r.id})});
      const body=await res.json().catch(()=>null);
      if(!res.ok||body?.ok===false)throw new Error(body?.message||'Could not record that.');
      setBumped(b=>({...b,[r.id]:body.data.review.helpful}));
      notify?.('Thanks — marked as helpful');
    }catch(e){notify?.(e.message)}
  }

  const narrowed=Boolean(institutionId||companyId);
  const narrowedName=inst?.name??null;

  return <main id="main" tabIndex={-1} className="tool-page reviews-page">
    <PageHero
      tone="plum"
      kicker="STUDENT REVIEWS"
      title={<>Unedited, including<br/><em>the ones that sting.</em></>}
      lead="Reviews come from people who used DCW to choose a course, a college or a job. We do not delete low ratings and we do not pay for high ones."
      pills={<>
        <span><Star/>{total} published review{total===1?'':'s'}</span>
        <span><ShieldCheck/>Nothing removed for rating</span>
      </>}/>

    {narrowed&&<div className="container rv-narrow">
      <p><ShieldCheck/>Showing only reviews about <b>{narrowedName??'this listing'}</b>.</p>
      <button className="btn outline small" onClick={()=>go('/reviews')}><X/>Show every review</button>
    </div>}

    {state==='error'&&<div className="container"><p className="note">{error} <button className="btn outline small" onClick={reload}>Try again</button></p></div>}

    <section className="container rating-panel">
      <div className="rp-score">
        <b>{avg??'—'}</b>
        <span className="stars big" aria-label={avg?`${avg} out of 5`:'No rating yet'}>{stars(Math.round(avg??0))}</span>
        <small>{total} review{total===1?'':'s'} · {summary?.verified??0} verified</small>
      </div>
      <ul className="rp-dist">
        {dist.map(d=><li key={d.stars}>
          <span>{d.stars}<Star/></span>
          <i><b style={{width:`${total?(d.count/total)*100:0}%`}}/></i>
          <small>{d.count}</small>
        </li>)}
      </ul>
      <div className="rp-cta">
        <p><ShieldCheck/>A review is marked verified when we can match it to a counselling session or an application in our records.</p>
        <button className="btn primary" onClick={()=>setWriting(w=>!w)} aria-expanded={writing}>
          <MessageCircle/>{writing?'Close the form':'Write a review'}
        </button>
      </div>
    </section>

    {writing&&<div className="container">
      <WriteForm vertical={linkedVertical||vertical||'distance'} lockVertical={Boolean(linkedVertical&&institutionId)}
        institutionId={institutionId||null} courseName={sp.get('courseName')||null} onDone={reload}/>
    </div>}

    <div className="container results-head">
      <div className="city-chips" role="group" aria-label="Filter reviews">
        {['All',...VERTICALS.map(v=>v[0])].map(v=><button key={v} className={filter===v?'chip on':'chip'} onClick={()=>setFilter(v)}
          aria-pressed={filter===v}>{v==='All'?'All':LABEL[v]}<small>{v==='All'?total:all.filter(r=>r.vertical===v).length}</small></button>)}
      </div>
      <label>Sort
        <select value={sort} onChange={e=>setSort(e.target.value)}>
          {['Most helpful','Highest rated','Lowest rated','Newest'].map(o=><option key={o}>{o}</option>)}
        </select>
      </label>
    </div>

    {state==='loading'&&<div className="container review-grid">
      {[0,1,2].map(i=><article key={i} className="review-card"><div className="rv-skel"/><div className="rv-skel short"/><div className="rv-skel"/></article>)}
    </div>}

    <div className="container review-grid">
      {shown.map(r=><article key={r.id} className="review-card">
        <header>
          <span className="rv-mark" aria-hidden="true">{initials(r.name)}</span>
          <div><b>{r.name}</b><small><MapPin/>{r.city?`${r.city} · `:''}{when(r.createdAt)}</small></div>
          {r.verified&&<span className="rv-check"><ShieldCheck/>Verified</span>}
        </header>
        <span className="stars" aria-label={`${r.rating} out of 5`}>{stars(r.rating)}</span>
        <h2 className="rv-subject">{r.subject}</h2>
        <p className="rv-text">{r.text}</p>
        <footer><span className="rv-tag">{LABEL[r.vertical]??r.vertical}</span>
          <button aria-label={`Mark ${r.name}'s review helpful (${r.helpful} so far)`} onClick={()=>helpful(r)}
            disabled={bumped[r.id]!=null}><Heart/>Helpful · {r.helpful}</button></footer>
      </article>)}
    </div>

    {state==='ready'&&shown.length===0&&<div className="container"><p className="note">
      {narrowed?'No reviews about this listing yet. Yours would be the first.':'No reviews match that filter yet.'}
    </p></div>}

    <div className="container review-foot">
      <p>Every review here was submitted by a person and read by our team before it went live.</p>
      <button className="btn outline" onClick={()=>go('/about')}>How we verify things<ArrowRight/></button>
    </div>
  </main>;
}

export default ReviewsPage;
