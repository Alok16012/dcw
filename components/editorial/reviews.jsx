'use client';
import {useMemo,useState} from 'react';
import {ArrowRight,Heart,MapPin,ShieldCheck,Star,MessageCircle} from 'lucide-react';
import {PageHero} from '@/components/ui/primitives.jsx';
/* One of the three pages a stranger checks before trusting a site with their
   marks, their money or their phone number. Everything below is placeholder
   content for the prototype — the numbers are marked indicative wherever they
   appear, because a made-up placement statistic is exactly the kind of claim
   this product exists to argue against. */
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

export function ReviewsPage({go,notify}){
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

  return <main id="main" tabIndex={-1} className="tool-page reviews-page">
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
        <h2 className="rv-subject">{r.subject}</h2>
        <p className="rv-text">{r.text}</p>
        <footer><span className="rv-tag">{r.vertical}</span>
          <button aria-label={`Mark ${r.name}'s review helpful (${r.helpful} so far)`} onClick={()=>notify('Thanks — marked as helpful')}><Heart/>Helpful · {r.helpful}</button></footer>
      </article>)}
    </div>

    <div className="container review-foot">
      <p>Reviews are placeholder content in this prototype build.</p>
      <button className="btn outline" onClick={()=>go('/about')}>How we verify things<ArrowRight/></button>
    </div>
  </main>;
}

export default ReviewsPage;
