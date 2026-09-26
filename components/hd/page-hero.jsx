'use client';
import {Sparkles} from 'lucide-react';

/* The page header every HelloDoctor inner page opens with
   (streams/page.tsx, blog/BlogClient.tsx, predictor/page.tsx): a brand
   gradient, a glass pill, a big white headline, one light line, a row of
   small icon facts, and the page's buttons. PageHero in
   components/ui/primitives.jsx renders through this, so every interior page
   that used the old photographic hero gets this one without being edited. */
export function HdPageHero({kicker,title,lead,pills,children,icon=<Sparkles className="w-4 h-4"/>}){
  return <section className="hd bg-gradient-to-br from-brand-700 via-brand-600 to-ink py-14 sm:py-16 px-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"/>
      <div className="absolute bottom-0 left-20 w-64 h-64 bg-brand-300 rounded-full blur-3xl"/>
    </div>
    <div className="max-w-7xl mx-auto text-center relative">
      {kicker&&<div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-4 py-2 rounded-full mb-5 border border-white/20 uppercase tracking-wide">{icon}{kicker}</div>}
      <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight [&_em]:not-italic [&_em]:text-brand-100">{title}</h1>
      {lead&&<p className="text-white/80 text-lg max-w-2xl mx-auto">{lead}</p>}
      {children&&<div className="hd-hero-cta flex flex-wrap justify-center gap-4 mt-8">{children}</div>}
      {pills&&<div className="flex flex-wrap justify-center gap-6 mt-8 text-white/80 text-sm [&>span]:flex [&>span]:items-center [&>span]:gap-1.5 [&_svg]:w-4 [&_svg]:h-4">{pills}</div>}
    </div>
  </section>;
}
