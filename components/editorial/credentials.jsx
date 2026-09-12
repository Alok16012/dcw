'use client';
import {ShieldCheck,FileCheck2,ArrowRight,ExternalLink,Lock,Building2} from 'lucide-react';
import {SectionTitle} from '@/components/ui/primitives.jsx';
import {useApi} from '@/lib/client/api.js';

/* Recognition & Approval, and Proof of Work — two sections, on all three
   verticals, from one request.

   Neither is written down here. Both read /api/credentials/[vertical], which
   counts them out of the same catalogue records the detail pages list and the
   console edits: an approval added in /admin/catalogue, or a result sheet
   uploaded against an employer in /admin/jobs, changes this band on the next
   load. That is the difference between this and the usual homepage badge strip
   — a hand-written "UGC-approved, 20+ universities" is a claim nobody updates,
   and it is wrong the first time the catalogue moves.

   They are one component rather than two because they are one fetch and they
   sit next to each other on the page; two components would mean the browser
   asking the same endpoint twice for the same answer. Each half still renders
   nothing when its own half of the answer is empty — a recognition section with
   no recognitions in it is worse than no section. */

const MONTH=iso=>{
  if(!iso)return null;
  const d=new Date(iso);
  return Number.isNaN(d.getTime())?null:d.toLocaleDateString('en-IN',{month:'short',year:'numeric'});
};

/* Written out rather than suffixed with an 's': the distance vertical lists
   universities, and "6 universitys" is the sort of thing a homepage never
   recovers from. */
const NOUN={distance:['university','universities'],colleges:['college','colleges'],jobs:['role','roles']};

/** The one-line basis under each credential, built from the counts, not written. */
function basis(a,vertical){
  const [one,many]=NOUN[vertical]??NOUN.distance;
  const parts=[`${a.count} ${a.count===1?one:many}`];
  if(vertical==='jobs'){
    /* Only the clauses that add something. Today every live role sits at its own
       verified employer, so "16 roles · 16 employers · 16 verified" would say one
       thing three times; each extra clause therefore appears only when it differs
       from the count above it. The unverified case is the one worth calling out,
       so it is the one that always gets its own words. */
    if(a.owners&&a.owners<a.count)parts.push(`${a.owners} employer${a.owners===1?'':'s'}`);
    if(a.verified<a.count)parts.push(`${a.count-a.verified} not yet checked`);
  }else{
    parts.push(a.documents?`${a.documents} letter${a.documents===1?'':'s'} on file`:'letter requested');
    if(a.expires)parts.push(`earliest renewal ${MONTH(a.expires)}`);
  }
  return parts.join(' · ');
}

function Recognition({data,vertical,go,notify,listAll}){
  const list=data.approvals;
  if(!list.length)return null;
  /* Every chip is a real filter, not a badge. The listing reads `approval` from
     the query string, so pressing one lands on the rows that actually carry it
     — and the address bar keeps it, so the result can be shared or reloaded. */
  return <section className="section container credentials">
    <SectionTitle kicker="RECOGNITION & APPROVAL"
      title={vertical==='jobs'?'What we check before a job goes live':'The approvals these listings rest on'}
      sub={vertical==='jobs'
        ?'Every employer is checked against its own registration documents before it can post. Press any one to see the roles that carry it.'
        :`Counted from the catalogue, not typed into this page — ${data.covered} of ${data.listings} listings carry at least one approval on file.`}
      action="View everything" onAction={()=>go(listAll)}/>
    <ul className="cred-grid">
      {list.map(a=><li key={a.key}>
        <button type="button" onClick={()=>go(`${listAll}?approval=${encodeURIComponent(a.filter)}`)}>
          <span className="cr-mark" aria-hidden="true"><ShieldCheck/></span>
          <span className="cr-copy">
            <b>{a.label}</b>
            <small>{basis(a,vertical)}</small>
            {a.examples.length>0&&<em>{a.examples.join(' · ')}</em>}
          </span>
          <ArrowRight className="cr-go" aria-hidden="true"/>
        </button>
      </li>)}
    </ul>
    {/* The honest footnote. "On file" means we hold the letter; it is not the
        same as the institution having claimed the approval, and the two are
        counted separately above for exactly that reason. */}
    <p className="cred-note"><ShieldCheck aria-hidden="true"/>Approvals are recorded from the issuing body’s own letter.
      Where we have not seen the letter itself, the listing says so rather than marking itself checked.
      <button type="button" className="linkish"
        onClick={()=>notify('Thanks — tell us which listing and we will re-check the paperwork')}>Report a wrong approval</button>
    </p>
  </section>;
}

function Proof({data,vertical,go,listAll}){
  const rows=data.proof;
  if(!rows.length)return null;
  return <section className="section wash proof-of-work">
    <div className="container">
      <SectionTitle kicker="PROOF OF WORK"
        title={vertical==='jobs'?'Offers, drives and paperwork we can show you':'Results, letters and records we can show you'}
        sub={vertical==='jobs'
          ?'Evidence collected from employers who hire through us — offer letters, attendance registers, registration documents.'
          :'Result sheets, allotment letters and approval documents, filed against the listing they belong to.'}
        action={data.proofTotal>rows.length?`All ${data.proofTotal} records`:'Browse listings'}
        onAction={()=>go(listAll)}/>
      <ul className="pow-grid">
        {rows.map(p=><li key={p.id}>
          <span className="pw-kind">{p.kind}{p.year?` · ${p.year}`:''}</span>
          <b>{p.title}</b>
          {p.summary&&<p>{p.summary}</p>}
          <footer>
            <button type="button" className="pw-owner" onClick={()=>go(p.href)}>
              <i aria-hidden="true"><Building2/></i>{p.owner}
            </button>
            {/* Two states, and the difference matters: a document we can hand
                over on the spot, and one held at the office that a person has
                to ask for. Showing them alike would overstate the second. */}
            {p.url
              ?<a className="pw-open" href={p.url} target="_blank" rel="noopener noreferrer">Open<ExternalLink/></a>
              :<span className="pw-held"><Lock aria-hidden="true"/>On file</span>}
          </footer>
        </li>)}
      </ul>
      <p className="cred-note"><FileCheck2 aria-hidden="true"/>Names, marks and phone numbers are removed before anything is
        filed here. Records marked “on file” are held at our Patna office and shown on request.</p>
    </div>
  </section>;
}

export function Credentials({vertical,go,notify}){
  const {data,state}=useApi(`/api/credentials/${vertical}`);
  if(state!=='ready'||!data)return null;
  const listAll=vertical==='distance'?'/distance/universities':`/${vertical}/search`;
  return <>
    <Recognition data={data} vertical={vertical} go={go} notify={notify} listAll={listAll}/>
    <Proof data={data} vertical={vertical} go={go} listAll={listAll}/>
  </>;
}

export default Credentials;
