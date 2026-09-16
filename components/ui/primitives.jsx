'use client';
import {useId,useState} from 'react';
import {ArrowRight,ChevronDown} from 'lucide-react';
import {PHOTOS} from '@/lib/photos.js';

/* Layout furniture with no domain knowledge: a section heading, the one hero
   contract every interior page uses, and a disclosure. They are here rather
   than in a domain folder precisely because they must not encode one — a
   heading that knew about jobs would be copied the moment colleges needed it. */
/* `sub` and `children` are both optional and both additive: every existing call
   site passes neither and renders exactly what it did before. `sub` is the line
   of plain explanation requirement 3 asks for under a heading; `children` is for
   a section that needs a control next to its action — the universities rail puts
   its carousel arrows there. */
export function SectionTitle({kicker,title,sub,action,onAction,children}){return <div className="section-title"><div><span className="kicker">{kicker}</span><h2>{title}</h2>{sub&&<p className="st-sub">{sub}</p>}</div>{(action||children)&&<span className="st-actions">{action&&<button onClick={onAction}>{action}<ArrowRight/></button>}{children}</span>}</div>}

/* The `<picture>` the whole site serves photographs through. Three sources, in
   the order a browser stops reading at the first one it can use: the phone webp
   under 900px, the full webp above it, then the png every browser understands.
   It was copied by hand into PageHero, the homepage hero and the detail banner,
   which is three places to forget the 900px source — and forgetting it ships a
   1.6MB desktop asset to a phone.

   `alt` comes from lib/photos.js keyed by the same name, so the description
   lives with the file rather than with whichever band happens to show it.
   `priority` is only for the one photograph above the fold; everything else
   loads lazily, and every caller reserves the box in CSS so a late image does
   not move the page under a reader. */
export function Photo({name, alt, priority = false, className}){
  return <picture className={className}>
    <source type="image/webp" media="(max-width:900px)" srcSet={`/${name}-900.webp`}/>
    <source type="image/webp" srcSet={`/${name}-full.webp`}/>
    {/* `||` rather than `??`: PageHero's own default is an empty string, and an
        empty alt on a photograph of people is a description the reader loses,
        not a decoration they are spared. A caller that passes a real alt still
        wins over the library's. */}
    <img src={`/${name}.png`} alt={alt || PHOTOS[name] || ''} decoding="async"
      loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'}/>
  </picture>;
}

/* One hero contract for every interior page. Content pages get the editorial
   photograph; tool pages get a generated field in the vertical's own palette,
   because stock imagery on a resume builder would be a lie about the page. */
export function PageHero({kicker,title,lead,photo,alt='',pills,children,tone='canvas'}){
  return <section className={`tool-hero page-hero ${photo?'photo-hero':'canvas-hero t-'+tone}`}>
    {photo
      ? <><Photo name={photo} alt={alt} priority/><span className="hero-shade" aria-hidden="true"/></>
      : <span className="hero-weave" aria-hidden="true"/>}
    <div className="container tool-hero-copy">
      <span className="kicker">{kicker}</span>
      <h1>{title}</h1>
      {lead&&<p>{lead}</p>}
      {children&&<div className="tool-hero-cta">{children}</div>}
      {pills&&<div className="hero-pills">{pills}</div>}
    </div>
  </section>;
}

/* aria-expanded alone tells a screen reader the control is open; it does not
   tell it what opened. useId ties the panel to its button so the answer is
   announced as this question's answer, and the panel keeps a role of region so
   it can be navigated to directly rather than only stumbled into by arrowing
   past the heading. The panel is unmounted rather than hidden when closed —
   collapsed text that is still in the tree is text a screen reader reads out
   for a question nobody opened. */
export function Accordion({title,children}){
  const [open,setOpen]=useState(false);
  const id=useId();
  return <div className={`accordion${open?' is-open':''}`}>
    <button type="button" aria-expanded={open} aria-controls={`${id}-p`} id={`${id}-b`}
      onClick={()=>setOpen(!open)}>
      <b>{title}</b><ChevronDown className={open?'rotate':''} aria-hidden="true"/>
    </button>
    {open&&<p id={`${id}-p`} role="region" aria-labelledby={`${id}-b`}>{children}</p>}
  </div>;
}
