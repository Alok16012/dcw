'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {BookOpen,TrendingUp,Bookmark,Clock,ArrowLeft,Calendar,Tag,Share2,ChevronRight,ShieldCheck} from 'lucide-react';
import {Photo} from '@/components/ui/primitives.jsx';
import {POSTS} from '@/components/editorial/blog.jsx';
import {CONTACT} from '@/lib/contact.js';

/* HelloDoctor's blog (src/app/(site)/blog/BlogClient.tsx and
   blog/[slug]/page.tsx): a dark hero, one big and two small featured
   pictures, category pills with counts, a card grid, and a gradient updates
   band; the article is a photographic banner, a white reading card with the
   excerpt called out, an author box and related pieces, and a sidebar of
   share · article info · latest. The posts are this site's own. */

const PHOTOS=['classroom-session','university-campus','career-editorial','home-study','counsellor-desk','campus-steps','office-front','workplace-team','campus-editorial'];
const photoOf=post=>PHOTOS[POSTS.indexOf(post)%PHOTOS.length];
const initials=n=>n.split(' ').map(w=>w[0]).join('');
const Avatar=({name,size='w-7 h-7 text-[10px]'})=><span className={`${size} bg-brand-600 rounded-full flex items-center justify-center text-white font-bold shrink-0`}>{initials(name)}</span>;
const fill='absolute inset-0 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:group-hover:scale-105 [&_img]:transition-transform [&_img]:duration-500';

function Article({post,setLead}){
  const related=POSTS.filter(p=>p.slug!==post.slug&&p.cat===post.cat).slice(0,3);
  const relatedRows=related.length?related:POSTS.filter(p=>p.slug!==post.slug).slice(0,3);
  const [url,setUrl]=useState('');
  useEffect(()=>{setUrl(window.location.href)},[post.slug]);
  const share=[
    ['WhatsApp','bg-green-500 hover:bg-green-600',`https://wa.me/?text=${encodeURIComponent(post.title+' '+url)}`],
    ['LinkedIn','bg-blue-600 hover:bg-blue-700',`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`],
    ['Twitter/X','bg-gray-800 hover:bg-gray-900',`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`],
    ['Facebook','bg-blue-800 hover:bg-blue-900',`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`]
  ];
  return <main id="main" tabIndex={-1} className="hd bg-gray-50 min-h-screen">
    <div className="relative h-72 sm:h-96 w-full overflow-hidden">
      <Photo name={photoOf(post)} priority className="absolute inset-0 [&_img]:w-full [&_img]:h-full [&_img]:object-cover"/>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent"/>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition-colors"><ArrowLeft className="w-4 h-4"/> Back to Blog</Link>
          <div className="mb-3"><span className="bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">{post.cat}</span></div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight mb-3">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
            <div className="flex items-center gap-2"><Avatar name={post.author}/><span>{post.author}</span></div>
            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/>{post.date}</div>
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4"/>{post.mins} min read</div>
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <article className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
            <p className="text-brand-700 bg-brand-50 border-l-4 border-brand-600 px-4 py-3 rounded-r-lg text-sm font-medium mb-6 leading-relaxed">{post.dek}</p>
            {post.body.map((para,i)=><p key={i} className="text-gray-700 text-[15px] leading-relaxed my-4">{para}</p>)}
            <p className="text-xs text-gray-400 mt-6 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/>Written by the DCW research desk. Indicative editorial content for this prototype — no advertiser had sight of it.</p>
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400"/>
              {[post.cat,'DCW Journal',post.role].map(t=><span key={t} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">#{t.replace(/\s+/g,'')}</span>)}
            </div>
          </article>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 mt-5 flex items-center gap-4">
            <Avatar name={post.author} size="w-16 h-16 text-lg border-2 border-brand-100"/>
            <div>
              <h3 className="font-bold text-gray-900">{post.author}</h3>
              <p className="text-sm text-gray-500">{post.role}</p>
              <p className="text-xs text-brand-600 mt-1">Research desk at Distance Courses Wala</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedRows.map(p=><Link key={p.slug} href={`/blog/${p.slug}`} className="bg-white rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all overflow-hidden group">
                <div className="relative h-36 overflow-hidden"><Photo name={photoOf(p)} className={fill}/></div>
                <div className="p-4">
                  <p className="text-xs text-brand-600 font-semibold mb-1">{p.cat}</p>
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors">{p.title}</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-gray-400 text-xs"><Clock className="w-3 h-3"/>{p.mins} min read</div>
                </div>
              </Link>)}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm"><Share2 className="w-4 h-4 text-brand-600"/> Share This Article</h3>
            <div className="grid grid-cols-2 gap-2">
              {share.map(([l,c,h])=><a key={l} href={h} target="_blank" rel="noopener noreferrer" className={`${c} text-white text-xs font-semibold py-2 rounded-lg transition-colors text-center`}>{l}</a>)}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Article Info</h3>
            {[['Category',post.cat],['Published',post.date],['Read Time',`${post.mins} minutes`],['Author',post.author]].map(([l,v])=>
              <div key={l} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0"><span className="text-xs text-gray-400">{l}</span><span className="text-xs font-semibold text-gray-700">{v}</span></div>)}
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">Latest Articles</h3>
              <Link href="/blog" className="text-xs text-brand-600 font-medium flex items-center gap-0.5 hover:gap-1.5 transition-all">View All <ChevronRight className="w-3.5 h-3.5"/></Link>
            </div>
            <div className="space-y-3">
              {POSTS.filter(p=>p.slug!==post.slug).slice(0,5).map(p=><Link key={p.slug} href={`/blog/${p.slug}`} className="flex gap-3 group">
                <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0"><Photo name={photoOf(p)} className={fill}/></div>
                <div className="min-w-0"><p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-brand-600 transition-colors">{p.title}</p><p className="text-xs text-gray-400 mt-0.5">{p.date}</p></div>
              </Link>)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-5 text-white">
            <h3 className="font-bold text-lg mb-1">Have a Question?</h3>
            <p className="text-white/75 text-sm mb-4">A counsellor will answer it on a call — free, and with nothing to sell you.</p>
            <button type="button" onClick={()=>setLead({title:'Ask a DCW counsellor',interest:'distance'})} className="w-full bg-white text-brand-600 font-bold text-sm px-5 py-3 rounded-xl hover:bg-brand-50 transition-colors">Talk to a Counsellor</button>
          </div>
        </div>
      </div>
    </div>
  </main>;
}

export default function HdBlog({path,setLead}){
  const slug=path?.replace(/^\/blog\/?/,'');
  const post=POSTS.find(p=>p.slug===slug);
  const [cat,setCat]=useState('All');
  const [phone,setPhone]=useState('');
  if(post)return <Article post={post} setLead={setLead}/>;
  const cats=['All',...new Set(POSTS.map(p=>p.cat))];
  const featured=[POSTS.find(p=>p.featured)||POSTS[0],...POSTS.filter(p=>!p.featured)].slice(0,3);
  const filtered=cat==='All'?POSTS:POSTS.filter(p=>p.cat===cat);
  return <main id="main" tabIndex={-1} className="hd bg-gray-50 min-h-screen">
    <div className="bg-gradient-to-br from-gray-900 via-ink to-gray-900 py-14 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-300 text-sm font-medium px-4 py-2 rounded-full mb-5 border border-brand-500/30"><BookOpen className="w-4 h-4"/>DCW Journal</div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">Plain Answers to <span className="text-brand-400">the Expensive Questions</span></h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">Approvals, fees, boards and first jobs — written by the people who keep the records, and published whether or not it suits an advertiser.</p>
        <div className="flex flex-wrap justify-center gap-6 mt-7 text-gray-400 text-sm">
          <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-brand-400"/> {POSTS.length} Articles</span>
          <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-green-400"/> No Sponsored Placements</span>
          <span className="flex items-center gap-1.5"><Bookmark className="w-4 h-4 text-yellow-400"/> Written by the Research Desk</span>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Articles</h2>
          <span className="text-sm text-gray-500">Picked by the research desk</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Link href={`/blog/${featured[0].slug}`} className="relative block h-72 sm:h-96 rounded-2xl overflow-hidden group">
              <Photo name={photoOf(featured[0])} className={fill}/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"/>
              <div className="absolute top-4 left-4"><span className="bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">{featured[0].cat}</span></div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-brand-200 transition-colors">{featured[0].title}</h3>
                <p className="text-white/70 text-sm line-clamp-2 mb-3">{featured[0].dek}</p>
                <div className="flex items-center gap-3 text-white/60 text-xs"><span>{featured[0].author}</span><span>·</span><Clock className="w-3.5 h-3.5"/><span>{featured[0].mins} min read</span><span>·</span><span>{featured[0].date}</span></div>
              </div>
            </Link>
          </div>
          <div className="space-y-4">
            {featured.slice(1,3).map(p=><Link key={p.slug} href={`/blog/${p.slug}`} className="relative block h-44 rounded-2xl overflow-hidden group">
              <Photo name={photoOf(p)} className={fill}/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
              <div className="absolute top-3 left-3"><span className="bg-brand-600/90 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{p.cat}</span></div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="text-sm font-bold text-white mb-1 line-clamp-2 group-hover:text-brand-200 transition-colors">{p.title}</h3>
                <div className="flex items-center gap-2 text-white/60 text-xs"><Clock className="w-3 h-3"/><span>{p.mins} min</span><span>·</span><span>{p.date}</span></div>
              </div>
            </Link>)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by topic">
        {cats.map(c=><button key={c} type="button" aria-pressed={cat===c} onClick={()=>setCat(c)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${cat===c?'bg-brand-600 text-white shadow-sm':'bg-white text-gray-600 border border-gray-200 hover:border-brand-300 hover:text-brand-600'}`}>
          {c}{c!=='All'&&<span className={`ml-1.5 text-xs ${cat===c?'text-white/70':'text-gray-400'}`}>({POSTS.filter(p=>p.cat===c).length})</span>}
        </button>)}
      </div>

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900">{cat==='All'?'All Articles':cat}<span className="text-gray-400 font-normal text-base ml-2">({filtered.length})</span></h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p=><Link key={p.slug} href={`/blog/${p.slug}`} className="bg-white rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-300 overflow-hidden group h-full flex flex-col">
          <div className="relative h-48 overflow-hidden shrink-0">
            <Photo name={photoOf(p)} className={fill}/>
            <div className="absolute top-3 left-3"><span className="bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{p.cat}</span></div>
          </div>
          <div className="p-5 flex flex-col flex-1">
            <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">{p.title}</h3>
            <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">{p.dek}</p>
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <Avatar name={p.author}/>
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{p.author}</p><p className="text-xs text-gray-400">{p.date}</p></div>
              <div className="flex items-center gap-1 text-gray-400 text-xs shrink-0"><Clock className="w-3 h-3"/>{p.mins}m</div>
            </div>
          </div>
        </Link>)}
      </div>

      <div className="mt-16 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 sm:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Stay Ahead With the Latest Updates</h2>
        <p className="text-white/80 mb-6 max-w-xl mx-auto">Admission dates, board exam windows, fee changes and new openings — a counsellor will call you when something that affects you changes.</p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={e=>{e.preventDefault();setLead({title:'Get updates from DCW',interest:'distance'})}}>
          <input type="tel" inputMode="numeric" value={phone} onChange={e=>setPhone(e.target.value)} aria-label="Your mobile number" placeholder="Enter your mobile number"
            className="flex-1 px-4 py-3 rounded-xl text-sm bg-white/15 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white/60"/>
          <button type="submit" className="bg-white text-brand-600 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors text-sm whitespace-nowrap">Get Updates Free</button>
        </form>
        <p className="text-white/60 text-xs mt-3">Or call {CONTACT.phone.display}</p>
      </div>
    </div>
  </main>;
}
