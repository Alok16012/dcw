'use client';
import {AlertTriangle,Search} from 'lucide-react';

/* ---------- Loading, empty and error primitives -----------------------------
   The catalogue arrives over the network, so every grid that renders it needs
   three more states than a hardcoded array did. They live here so all three
   verticals show the same thing: a skeleton with the real card footprint (so
   nothing shifts when data lands), a retry that actually retries, and an empty
   state that says what to do next rather than "no results". */
export function CardSkeleton({n=3}){
  /* No wrapper: the caller already owns the layout container, and the skeleton
     must inherit it so nothing reflows when the real cards replace it. */
  /* The block order mirrors EntityCard exactly — plate, title, place, metrics,
     tags, footer — so the placeholder occupies the height the card will. */
  return Array.from({length:n},(_,i)=><div className="skeleton-card" key={i} aria-hidden="true">
    <div className="sk-line sk-plate"/>
    <div className="sk-line sk-title"/>
    <div className="sk-line sk-meta"/>
    <div className="sk-metrics"><span className="sk-line"/><span className="sk-line"/><span className="sk-line"/></div>
    <div className="sk-tags"><span className="sk-line"/><span className="sk-line"/></div>
    <div className="sk-line sk-foot"/>
  </div>);
}

export function CatalogError({error,retry,title}){
  return <div className="state-panel" role="alert">
    <span className="state-icon"><AlertTriangle/></span>
    <h2>{title||'We could not load this list'}</h2>
    <p>{error||'The catalogue did not respond.'} Your connection may have dropped.</p>
    <button className="btn outline small" onClick={retry}>Try again</button>
  </div>;
}

export function EmptyState({title,body,actionLabel,onAction}){
  return <div className="state-panel">
    <span className="state-icon"><Search/></span>
    <h2>{title}</h2>
    <p>{body}</p>
    {actionLabel&&<button className="btn outline small" onClick={onAction}>{actionLabel}</button>}
  </div>;
}

/** Renders children only when the catalogue is genuinely loaded and non-empty. */
export function CatalogGrid({catalog,children,skeleton=3,empty}){
  if(catalog.state==='loading')return <><CardSkeleton n={skeleton}/><p className="sr-only" role="status">Loading listings</p></>;
  if(catalog.state==='error')return <CatalogError error={catalog.error} retry={catalog.reload}/>;
  if(!catalog.rows.length)return empty??<EmptyState title="Nothing listed yet" body="This list is empty right now. Please check back shortly."/>;
  return children;
}

/** A detail URL whose record has not arrived, or never will. */
export function CatalogFallback({catalog,go,vertical}){
  return <main id="main" tabIndex={-1} className="state-main"><div className="container">
    {catalog.state==='error'
      ?<CatalogError error={catalog.error} retry={catalog.reload}/>
      :<><CardSkeleton n={1}/><p className="sr-only" role="status">Loading this listing</p></>}
    {catalog.state==='error'&&<button className="btn ghost small" onClick={()=>go(`/${vertical}`)}>Back to {vertical}</button>}
  </div></main>;
}
