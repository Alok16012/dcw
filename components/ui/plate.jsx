'use client';
import Image from 'next/image';

/* ---------- Generated card artwork ----------------------------------------
   The drawing layer shared by every card family, extracted from the page
   component so that a card in /jobs and a card in /colleges seed from the same
   six motifs without either domain importing the other. Nothing in this file
   knows what a course or a job is.

   public/ holds three editorial photographs and the logo lockups; there is no
   per-category or per-university imagery, and inventing a university's logo or
   campus photo would be a lie told in pixels. So a card header is DRAWN: a
   duotone field with a route line crossing it, which is the same "your next
   move, made visible" idea the hero art carries. Seeded off the card's own
   name, so a card always draws the same plate and the set reads as a family
   rather than as noise. Pass `image` and real photography takes over with no
   other change. */
export function seedOf(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
/* Cubic through the points with horizontal control handles — always smooth,
   never overshoots, and cheap enough to run per card during render. */
export function routePath(pts){return pts.map(([x,y],i,a)=>{if(i===0)return `M${x} ${y}`;const[px,py]=a[i-1];const dx=(x-px)*.5;return `C${(px+dx).toFixed(1)} ${py} ${(x-dx).toFixed(1)} ${y} ${x} ${y}`}).join('')}
/* ── PLATE ────────────────────────────────────────────────────────────────
   One motif on every card made the grid read as wallpaper: six tiles that
   differed only in the wiggle of a line. A plate now draws from six motif
   families and six tonal keys, both picked from the item's own name, so a
   card looks the same on every visit but no two neighbours look alike.
   Pass `image` and licensed photography replaces the drawing outright. */
const PLATE_MOTIFS=['route','arcs','grid','climb','orbit','strata'];

export function plateMotif(kind,h,uid){
  const R=(i)=>((h>>>((i*5)%27))&31)/31;              /* stable 0..1 per slot */
  const line='var(--plate-line)',node='var(--plate-node)';
  if(kind==='route'){
    const N=4,pts=Array.from({length:N+1},(_,i)=>[+((i/N)*120).toFixed(1),+(19+R(i)*38).toFixed(1)]);
    const d=routePath(pts);
    return <>
      {[-15,-10,-5,5,10,15].map(o=><path key={o} d={d} transform={`translate(0 ${o})`} fill="none"
        stroke={line} strokeOpacity={o%10===0?'.10':'.16'} strokeWidth=".7"/>)}
      <path d={d} fill="none" stroke={`url(#${uid}s)`} strokeWidth="1.9" strokeLinecap="round"/>
      {pts.filter((_,i)=>i%2===0).map(([x,y],i)=><g key={i}>
        <circle cx={x} cy={y} r="3.4" fill={node} opacity=".22"/><circle cx={x} cy={y} r="1.7" fill={node}/></g>)}
    </>;
  }
  if(kind==='arcs'){
    /* Widening rings from the lower-left: distance covered, not a path. */
    const cx=-4,cy=84;
    return <>
      {Array.from({length:8},(_,i)=>{const r=16+i*13.5;
        return <path key={i} d={`M${cx+r} ${cy}A${r} ${r} 0 0 1 ${cx} ${cy-r}`} fill="none" stroke={line}
          strokeOpacity={i===3?'.9':(i%2?'.13':'.2')} strokeWidth={i===3?'1.9':'.75'} strokeLinecap="round"/>})}
      {[0,1,2].map(i=>{const r=16+3*13.5,a=(.18+R(i)*.5)*Math.PI/2;
        return <g key={i} transform={`translate(${(cx+r*Math.cos(a)).toFixed(1)} ${(cy-r*Math.sin(a)).toFixed(1)})`}>
          <circle r="3.4" fill={node} opacity=".22"/><circle r="1.7" fill={node}/></g>})}
    </>;
  }
  if(kind==='grid'){
    /* A plane receding to a horizon — structure, syllabus, a laid-out plan. */
    const vy=14;
    return <>
      {Array.from({length:9},(_,i)=>{const y=+(76-62*Math.pow(1-i/9,1.75)).toFixed(1);
        return <line key={'h'+i} x1="0" y1={y} x2="120" y2={y} stroke={line} strokeOpacity={i>6?'.24':'.13'} strokeWidth=".7"/>})}
      {Array.from({length:9},(_,i)=>{const x=i*15;
        return <line key={'v'+i} x1={x} y1="76" x2={(60+(x-60)*.16).toFixed(1)} y2={vy}
          stroke={line} strokeOpacity=".12" strokeWidth=".7"/>})}
      <line x1="0" y1="76" x2="120" y2="76" stroke={line} strokeOpacity=".5" strokeWidth="1.6"/>
      {[0,1,2].map(i=><g key={i} transform={`translate(${(22+i*38+R(i)*10).toFixed(1)} ${(52+R(i+3)*14).toFixed(1)})`}>
        <circle r="3.4" fill={node} opacity=".2"/><circle r="1.7" fill={node}/></g>)}
    </>;
  }
  if(kind==='climb'){
    /* Ascending steps: a level gained, a salary band, a year completed. */
    const n=7,w=11,gap=5.4,x0=8;
    return <>
      {Array.from({length:n},(_,i)=>{const hgt=14+i*6.4+R(i)*9,x=x0+i*(w+gap);
        return <rect key={i} x={+x.toFixed(1)} y={+(70-hgt).toFixed(1)} width={w} height={+hgt.toFixed(1)} rx="2.5"
          fill={line} fillOpacity={i===n-1?'.82':(.13+i*.055).toFixed(2)}/>})}
      <line x1="0" y1="70.6" x2="120" y2="70.6" stroke={line} strokeOpacity=".42" strokeWidth="1.2"/>
    </>;
  }
  if(kind==='orbit'){
    /* Concentric reach — options circling one decision at the centre. */
    const cx=84,cy=26;
    return <>
      {[13,24,35,47,60].map((r,i)=><ellipse key={i} cx={cx} cy={cy} rx={r} ry={r*.62} fill="none"
        stroke={line} strokeOpacity={i===1?'.7':'.14'} strokeWidth={i===1?'1.7':'.75'}/>)}
      <circle cx={cx} cy={cy} r="4.6" fill={node} opacity=".2"/><circle cx={cx} cy={cy} r="2.2" fill={node}/>
      {[0,1,2,3].map(i=>{const r=[13,24,35,47][i],a=R(i)*Math.PI*2;
        return <g key={i} transform={`translate(${(cx+r*Math.cos(a)).toFixed(1)} ${(cy+r*.62*Math.sin(a)).toFixed(1)})`}>
          <circle r="3" fill={node} opacity=".2"/><circle r="1.5" fill={node}/></g>})}
    </>;
  }
  /* strata — layered ground: intakes, semesters, things that stack up. */
  const band=(off,amp)=>routePath(Array.from({length:5},(_,i)=>
    [+((i/4)*120).toFixed(1),+(off+Math.sin(i*1.3+amp)*amp).toFixed(1)]))+'L120 76L0 76Z';
  return <>
    {[0,1,2,3,4].map(i=><path key={i} d={band(28+i*11,2.4+R(i)*4)} fill={line}
      fillOpacity={(.07+i*.045).toFixed(2)}/>)}
    <path d={routePath(Array.from({length:5},(_,i)=>[+((i/4)*120).toFixed(1),+(28+Math.sin(i*1.3+2.4)*2.4).toFixed(1)]))}
      fill="none" stroke={`url(#${uid}s)`} strokeWidth="1.7" strokeLinecap="round"/>
  </>;
}

export function Plate({seed,icon,mark,tag,image,alt='',ratio,tone,motif}){
  const h=seedOf(seed);
  const uid='pl'+(h%1679616).toString(36);
  const g=tone??h%6;                       /* tonal key */
  /* In a grid the caller passes `tone`, and stride 5 (coprime with 6) then
     guarantees neighbouring cards never share a motif; the seed only decides
     which motif the row starts on, so two grids of the same length still
     differ. Loose plates fall back to the pure seed. */
  const kind=motif??(tone==null
    ? PLATE_MOTIFS[(h>>>11)%6]
    : PLATE_MOTIFS[(tone*5+((h>>>11)%6))%6]);
  const mix=58+((h>>>19)&31);              /* how far the field leans on the accent */
  const tilt=((h>>>26)&7)-3;               /* keeps the family varied without breaking it */
  return <span className={`plate g${g}`} style={{'--plate-mix':mix+'%',...(ratio?{aspectRatio:ratio}:null)}}>
    {image
      ? <Image className="plate-photo" src={image} alt={alt} fill sizes="(max-width:760px) 100vw, 33vw"/>
      : <svg className="plate-art" viewBox="0 0 120 76" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--plate-a)"/><stop offset="1" stopColor="var(--plate-b)"/>
            </linearGradient>
            <linearGradient id={uid+'s'} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--plate-line)" stopOpacity=".16"/>
              <stop offset=".62" stopColor="var(--plate-line)" stopOpacity="1"/>
              <stop offset="1" stopColor="var(--plate-line)" stopOpacity=".4"/>
            </linearGradient>
          </defs>
          <rect width="120" height="76" fill={`url(#${uid})`}/>
          <g transform={`rotate(${tilt} 60 38)`}>{plateMotif(kind,h,uid)}</g>
        </svg>}
    {tag&&<span className="plate-tag">{tag}</span>}
    {mark&&<span className="plate-mark" aria-hidden="true">{mark}</span>}
    {icon&&<span className="plate-chip" aria-hidden="true">{icon}</span>}
  </span>;
}


/* The motif family, demoted. It is no longer a picture rectangle stacked on a
   text rectangle — it is a wash inside one surface, clipped to the top-right
   corner so it supports the title instead of competing with it. */
export function CardWash({seed,motif}){
  const h=seedOf(seed);
  const uid='cw'+(h%1679616).toString(36);
  const kind=motif??PLATE_MOTIFS[(h>>>11)%6];
  return <svg className="card-wash" viewBox="0 0 120 76" preserveAspectRatio="xMidYMid slice"
    aria-hidden="true" focusable="false">
    <defs><linearGradient id={uid+'s'} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="var(--plate-line)" stopOpacity=".2"/>
      <stop offset=".62" stopColor="var(--plate-line)" stopOpacity="1"/>
      <stop offset="1" stopColor="var(--plate-line)" stopOpacity=".45"/>
    </linearGradient></defs>
    {plateMotif(kind,h,uid)}
  </svg>;
}
