'use client';
import {ArrowRight,X,Scale} from 'lucide-react';
import {fmt} from '@/lib/format.js';
import {PageHero} from '@/components/ui/primitives.jsx';
import {CardSkeleton,CatalogError,EmptyState} from '@/components/discovery/catalog-states.jsx';

/* Side-by-side comparison of up to three shortlisted entities. The one place
   the product asks a table to do the work, because that is the job a table
   does better than cards.

   Each column is its own grid, so the columns line up only because they share
   one fixed row template. That makes the child count load-bearing: the monogram
   and the name used to be two separate children against the label column's one
   "Choice" cell, which pushed every value down a row — the fee printed against
   "Duration / eligibility", the rating against "Deadline", and the last value
   fell past the bottom of the labels entirely. They are one cell now, so the
   two columns cannot drift.

   The rows are declared once and used twice — for the label column and for
   every entity column — so a label can never drift out of step with the value
   printed beneath it. That matters more than it looks: the columns are laid out
   by CSS grid, so alignment is positional, and two lists maintained by hand
   would line up on screen long after they had stopped meaning the same thing. */
const ROWS = [
  {label:'Total fee / salary',    value:(x,v)=>v==='jobs'?x.duration:fmt(x.fee), spoken:(x,v)=>v==='jobs'?x.duration:fmt(x.fee)},
  {label:'Duration / eligibility',value:(x,v)=>v==='jobs'?x.course:x.duration,   spoken:(x,v)=>v==='jobs'?x.course:x.duration},
  {label:'Approval',              value:x=>x.approval[0],                        spoken:x=>x.approval[0]},
  {label:'Rating',                value:x=>`${x.rating} ★`,                      spoken:x=>`${x.rating} out of 5`},
  {label:'Deadline',              value:x=>x.deadline,                           spoken:x=>x.deadline}
];

export function ComparePage({vertical,compare,toggleCompare,setLead,catalog}){
  const items=catalog.rows.filter(x=>compare[vertical].includes(x.id));
  /* The hero promises that "only meaningful differences are highlighted", so
     work out which rows actually differ instead of always accenting the fee.
     A row where every choice says the same thing is not what decides it. */
  const differs=ROWS.map(r=>new Set(items.map(x=>String(r.value(x,vertical)))).size>1);
  return <main id="main" tabIndex={-1} className="listing-page">
    <PageHero tone="canvas" kicker="DECISION MATRIX" title={<>Compare without<br/><em>the clutter.</em></>} lead="Only meaningful differences are highlighted. Add up to three choices and the row that actually decides it stands out." pills={<><span><Scale/>{items.length} of 3 selected</span></>}/>
    <div className="container compare-page">{catalog.state==='error'?<CatalogError error={catalog.error} retry={catalog.reload}/>:catalog.state==='loading'?<><CardSkeleton n={2}/><p className="sr-only" role="status">Loading your comparison</p></>:items.length<2?<EmptyState title="Add one more option" body="You need at least two choices for a useful comparison."/>:<>
      <div className="comparison-grid">
        <div className="compare-col labels"><b>Choice</b>{ROWS.map(r=><span key={r.label}>{r.label}</span>)}</div>
        {items.map(x=><div className="compare-col" key={x.id}>
          <button className="remove" aria-label={`Remove ${x.name} from the comparison`} onClick={()=>toggleCompare(x.id)}><X/></button>
          <div className="cc-head"><span className="entity-mark" aria-hidden="true">{x.mark}</span><b>{x.name}</b></div>
          {ROWS.map((r,i)=><span key={r.label} className={differs[i]?'different':undefined}
            aria-label={`${r.label} for ${x.name}: ${r.spoken(x,vertical)}`}>{r.value(x,vertical)}</span>)}
        </div>)}
      </div>
      <button className="btn primary compare-all" onClick={()=>setLead({title:`Enquire about ${items.length} compared choices`,interest:items.map(x=>x.id).join(',')})}>Enquire about all {items.length}<ArrowRight/></button>
    </>}</div>
  </main>;
}

export default ComparePage;
