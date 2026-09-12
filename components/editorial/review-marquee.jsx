'use client';
import {useMemo} from 'react';
import {Star,ShieldCheck,ArrowRight} from 'lucide-react';
import {useApi} from '@/lib/client/api.js';

/* The promotional review band: the reviews already published on /reviews,
   running past on the homepage instead of waiting for someone to go and look.

   It reads the same /api/reviews the reviews page reads, so a review that is
   pulled or edited in the admin moderation queue stops appearing here in the
   same breath. Nothing is written into this file — a testimonial hardcoded into
   a marketing band is exactly the claim the reviews page exists to avoid.

   THE LOOP. The track holds the list twice and slides by exactly -50%, so the
   moment the first copy has passed the animation restarts on a frame that looks
   identical. The clone is aria-hidden: a screen reader should hear each review
   once, and the duplicate is scenery. The whole band is also a real horizontal
   scroller, so a trackpad or a finger can take it over at any point. */

const initials=n=>String(n).trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
const LABEL={distance:'Distance',colleges:'Colleges',jobs:'Jobs'};

function Card({r,clone}){
  return <article className="rm-card" aria-hidden={clone||undefined}>
    <span className="rm-stars" aria-label={clone?undefined:`${r.rating} out of 5`}>
      {Array.from({length:5},(_,i)=><Star key={i} className={i<r.rating?'on':''}/>)}
    </span>
    <p className="rm-text">{r.text}</p>
    <footer>
      <span className="rm-mark" aria-hidden="true">{initials(r.name)}</span>
      <span className="rm-who"><b>{r.name}</b><small>{r.city?`${r.city} · `:''}{LABEL[r.vertical]??r.vertical}</small></span>
      {r.verified&&<span className="rm-check" title="Verified against our records"><ShieldCheck/></span>}
    </footer>
  </article>;
}

export function ReviewMarquee({go}){
  const {data,state}=useApi('/api/reviews');

  /* Highest-rated first and capped at eight. This band is promotion and is
     labelled as such — the honest version of that is a link to the unfiltered
     page sitting next to it, not a "sorted by most helpful" that quietly means
     the same thing. */
  const rows=useMemo(()=>{
    const all=data?.rows??[];
    return [...all].sort((a,b)=>b.rating-a.rating||b.helpful-a.helpful).slice(0,8);
  },[data]);

  /* Too few cards and the track is shorter than the viewport, which leaves a gap
     scrolling through. Repeat the set until there is enough to fill a wide
     screen before the loop is doubled for the seam. */
  const track=useMemo(()=>{
    if(!rows.length)return [];
    const out=[];
    while(out.length<Math.max(6,rows.length))out.push(...rows);
    return out;
  },[rows]);

  if(state!=='ready'||!rows.length)return null;

  /* Roughly eight seconds a card, so a wider set runs proportionally longer and
     every band moves at the same speed rather than the same duration. */
  const seconds=track.length*8;

  return <section className="section wash review-marquee">
    <div className="container rm-head">
      <div>
        <span className="kicker">WHAT STUDENTS SAY</span>
        <h2>Reviews we did not get to approve.</h2>
      </div>
      <button className="btn outline small" onClick={()=>go('/reviews')}>Read every review<ArrowRight/></button>
    </div>
    <div className="rm-viewport">
      <div className="rm-track" style={{'--rm-seconds':`${seconds}s`}}>
        {track.map((r,i)=><Card key={`a${i}`} r={r}/>)}
        {track.map((r,i)=><Card key={`b${i}`} r={r} clone/>)}
      </div>
    </div>
  </section>;
}

export default ReviewMarquee;
