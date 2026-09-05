'use client';
import {useState} from 'react';
import {ArrowRight,ChevronDown} from 'lucide-react';

/* Layout furniture with no domain knowledge: a section heading, the one hero
   contract every interior page uses, and a disclosure. They are here rather
   than in a domain folder precisely because they must not encode one — a
   heading that knew about jobs would be copied the moment colleges needed it. */
export function SectionTitle({kicker,title,action,onAction}){return <div className="section-title"><div><span className="kicker">{kicker}</span><h2>{title}</h2></div>{action&&<button onClick={onAction}>{action}<ArrowRight/></button>}</div>}

/* One hero contract for every interior page. Content pages get the editorial
   photograph; tool pages get a generated field in the vertical's own palette,
   because stock imagery on a resume builder would be a lie about the page. */
export function PageHero({kicker,title,lead,photo,alt='',pills,children,tone='canvas'}){
  return <section className={`tool-hero page-hero ${photo?'photo-hero':'canvas-hero t-'+tone}`}>
    {photo
      ? <><picture>
          <source type="image/webp" media="(max-width:900px)" srcSet={`/${photo}-900.webp`}/>
          <source type="image/webp" srcSet={`/${photo}-full.webp`}/>
          <img src={`/${photo}.png`} alt={alt} decoding="async"/>
        </picture><span className="hero-shade" aria-hidden="true"/></>
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

export function Accordion({title,children}){const [open,setOpen]=useState(false);return <div className="accordion"><button aria-expanded={open} onClick={()=>setOpen(!open)}><b>{title}</b><ChevronDown className={open?'rotate':''}/></button>{open&&<p>{children}</p>}</div>}
