'use client';
import {ArrowRight,Heart,Scale} from 'lucide-react';
import {useAllCatalogs} from '@/lib/client/catalog.js';
import {PageHero} from '@/components/ui/primitives.jsx';
import {CardSkeleton,CatalogError} from '@/components/discovery/catalog-states.jsx';
/* The shortlist. Everything in this folder is a surface a person reaches from
   their own account rather than from discovery, which is why none of it is in
   the shell every visitor downloads. */
export function SavedPage(ctx){/* A shortlist spans verticals, so this is the one surface that loads all
   three catalogues rather than the active one. */const every=useAllCatalogs();const all=every.rows.filter(x=>ctx.saved.includes(x.id));return <main id="main" tabIndex={-1} className="listing-page"><PageHero tone="teal" kicker="YOUR SHORTLIST" title={<>Saved for later.</>} lead="Everything you bookmarked across courses, colleges and jobs — kept on this device, so it survives a refresh." pills={<><span><Heart/>{ctx.saved.length} saved</span><span><Scale/>Ready to compare</span></>}>{ctx.saved.length>0&&<button className="btn primary tactile" onClick={()=>ctx.go(`/${ctx.vertical}/compare`)}>Compare these<ArrowRight/></button>}</PageHero><div className="container saved-grid">{every.state==='error'?<CatalogError error={every.error} retry={every.reload}/>:every.state==='loading'?<><CardSkeleton n={2}/><p className="sr-only" role="status">Loading your shortlist</p></>:all.length?all.map(x=><article className="saved-row" key={x.id}><span className="entity-mark">{x.mark}</span><div><h3>{x.name}</h3><p>{x.place}</p></div><button className="btn outline" onClick={()=>ctx.toggleSave(x.id)}>Remove</button></article>):<div className="empty"><Heart/><h2>Your shortlist is empty</h2><p>Save an institution or job and it will appear here—even after refresh.</p><button className="btn primary" onClick={()=>ctx.go('/distance')}>Start exploring</button></div>}</div></main>}

export default SavedPage;
