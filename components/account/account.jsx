'use client';
import {useState} from 'react';
import {Bell,UserRound} from 'lucide-react';
import {PageHero} from '@/components/ui/primitives.jsx';
/* Notifications and profile are the same surface with a different tab, so they
   are one component rather than two that drift apart. */
export function AccountPage({type,go,notify,auth}){const [read,setRead]=useState([]);
/* Signed out, this page used to show "AK / Amit Kumar / Graduate · Patna,
   Bihar" under the heading "The details we reuse to prefill applications" — an
   invented person presented to every visitor as their own account. Now the name
   comes from the session or the page says there is no session. */
const user=auth?.user,loading=auth?.state==='loading';
const person=user?user.name.replace(/\s*\(.*\)/,'').trim():null;
const initials=person?person.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase():null;
const ROLE={admin:'Signed in as an administrator',employer:'Signed in as an employer',student:'Student account'};const notices=[['Deadline approaching','Amity Online August intake closes in 3 days.','/distance/university/amity-online'],['New match found','A verified fresher role matching Accounts was added.','/jobs/search'],['Predictor update','NEET counselling dates were refreshed today.','/colleges/neet-predictor']];if(type==='profile')return <main id="main" tabIndex={-1} className="listing-page"><PageHero tone="indigo" kicker="YOUR ACCOUNT" title={<>Profile <em>&amp; preferences.</em></>} lead="The details we reuse to prefill applications and sharpen recommendations."/><div className="container profile-card">{loading
      ?<div className="profile-head"><span className="entity-mark large" aria-hidden="true"/><div><h2>Loading your account…</h2><p>Checking whether you are signed in.</p></div></div>
      :user
        ?<div className="profile-head"><span className="entity-mark large">{initials}</span><div><h2>{person}</h2><p>{ROLE[user.role]||'Signed in'}</p></div><button className="btn outline" onClick={()=>notify('Profile edit mode enabled — demo only')}>Edit profile</button></div>
        :<div className="profile-head"><span className="entity-mark large" aria-hidden="true"><UserRound/></span><div><h2>You are not signed in</h2><p>Your shortlist is kept on this device, so it works without an account. Sign in to keep applications and alerts with you across devices.</p></div><button className="btn primary" onClick={()=>go('/login')}>Sign in</button></div>}
      <div className="fact-grid"><button onClick={()=>go('/saved')}><small>SHORTLIST</small><b>View saved choices</b></button><button onClick={()=>go('/applications')}><small>ACTIVITY</small><b>Track applications</b></button><button onClick={()=>go('/automations')}><small>PREFERENCES</small><b>Manage alerts</b></button><button onClick={()=>notify('Document vault opened — demo only')}><small>DOCUMENTS</small><b>Open demo vault</b></button></div></div></main>;return <main id="main" tabIndex={-1} className="listing-page"><div className="container page-head"><span className="kicker">STAY ON TRACK</span><h1>Notifications</h1><p>Actionable updates from your saved choices and applications.</p></div><div className="container notification-list">{notices.map((n,i)=><article className={read.includes(i)?'read':''} key={n[0]}><span><Bell/><i/></span><div><h2>{n[0]}</h2><p>{n[1]}</p><small>{i+1} hour{i?'s':''} ago</small></div><button className="btn outline" aria-label={`View update: ${n[0]}`} onClick={()=>{setRead(x=>x.includes(i)?x:[...x,i]);go(n[2])}}>View update</button></article>)}<button className="text-btn" onClick={()=>{setRead([0,1,2]);notify('All notifications marked as read')}}>Mark all as read</button></div></main>}

export default AccountPage;
