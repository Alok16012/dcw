'use client';
import {ArrowRight,Heart,MapPin,Star,Navigation,Wifi,Flame} from 'lucide-react';
import {Plate,CardWash} from '@/components/ui/plate.jsx';
import {coursesOf,matchesPath,PATHS} from '@/lib/content/courses.js';
import {fmt} from '@/lib/format.js';
/* The two card families the discovery surfaces are built from. A PathCard is a
   route into the catalogue; an EntityCard is one row of it, with the fee, the
   distance and the save/compare controls a shortlist needs. They live together
   because they share the same plate artwork and must not drift apart, and they
   live outside the route file because /distance, /colleges and /jobs all render
   them. */
/* One card, one surface. Badge, title, two lines, a text action — the whole
   card is the hit target, so there is no button nested inside it. `featured`
   turns the first card of a section into a wide horizontal one, which is the
   only rhythm break: everything else stays the same compact height. */
export function PathCard({item,i,cta='Explore',onClick,featured=false}){
  return <article className={`path-card${featured?' pc-featured':''}`}>
    {item.image
      ?<img className="card-photo" src={item.image} alt={item.imageAlt||''} loading="lazy" decoding="async"/>
      :<CardWash seed={item.name}/>}
    <div className="pc-body">
      <div className="pc-head">
        <span className="pc-icon" aria-hidden="true">{item.icon}</span>
        {item.kicker&&<span className="pc-badge">{item.kicker}</span>}
      </div>
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
export function EntityCard({item,vertical,go,saved,toggleSave,compare,toggleCompare,setLead,coursePath=null}){
  const href=vertical==='distance'?`/distance/university/${item.id}`:vertical==='colleges'?`/colleges/college/${item.id}`:`/jobs/${item.id}`;
  const isJob=vertical==='jobs';
  /* `coursePath` is the /distance path card the person came from. It is not
     called `path` because the context object every call site spreads already
     carries one — the router pathname — and the collision handed this
     component a value like "/distance" where it expected "ug". It does not remove
     the card from the list — the listing already decided this institution
     belongs — it decides which of the institution's programmes the card talks
     about and which one Apply opens on. Someone who chose "PG distance" and
     then has to hunt past three bachelor's degrees was not helped by choosing.
     `all` stays available because the count chip should still say how many
     courses exist in total, and because the apply dialog offers the full menu:
     narrowing the default is a head start, not a decision taken for them. */
  const all=coursesOf(item);
  const matched=all.filter(c=>matchesPath(c,coursePath));
  const list=matched.length?matched:all;
  const isSaved=saved.includes(item.id);
  const apply=()=>setLead({mode:'apply',
    title:isJob?`Apply for ${item.name}`:`Apply to ${item.name}`,
    interest:item.id,interestType:isJob?'job':'course',
    course:isJob?item.name:list[0].name,
    courses:isJob?null:all.map(c=>c.name),
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
        {!isJob&&list.length>1&&<span className="tag-more">{list.length}{coursePath&&matched.length?` ${PATHS[coursePath].toLowerCase().replace(/ programmes| degrees/,'')}`:''} courses</span>}</div>
    </div>
    <div className="entity-foot">
      {!isJob&&<label className="ec-compare"><input type="checkbox" aria-label={`Compare ${item.name}`} checked={compare[vertical].includes(item.id)} onChange={()=>toggleCompare(item.id)}/><span>Compare</span></label>}
      <button className="btn outline small" aria-label={isJob?`View job: ${item.name}`:`Details of ${item.name}`} onClick={()=>go(href)}>{isJob?'View job':'Details'}</button>
      <button className="btn primary small" aria-label={isJob?`Apply for ${item.name}`:`Apply to ${item.name}`} onClick={apply}>Apply now<ArrowRight/></button>
    </div>
  </article>;
}
