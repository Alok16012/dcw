/* Job-side helpers shared by the listing and the role page: city coordinates,
   great-circle distance, sector duties and the facets the filters are built
   from. Moved out of the route file so components/hd can use them. */
/* ---------- Jobs ------------------------------------------------------------
   Every posting carries a city plus its coordinates. Two features depend on
   that and cannot be faked: the city filter, and "jobs near me", which asks
   the browser for a location and ranks by real great-circle distance. Remote
   roles carry wfh:true and no coordinates — they are reachable from anywhere,
   so they are surfaced separately rather than given a misleading distance.
   Indicative demo data; salaries and openings are illustrative. */
export const CITY_POS={'Patna':[25.5941,85.1376],'Ranchi':[23.3441,85.3096],'Lucknow':[26.8467,80.9462],'Delhi NCR':[28.5355,77.3910],'Gurugram':[28.4595,77.0266],'Bengaluru':[12.9716,77.5946],'Hyderabad':[17.3850,78.4867],'Mumbai':[19.0760,72.8777],'Pune':[18.5204,73.8567],'Jaipur':[26.9124,75.7873],'Kolkata':[22.5726,88.3639],'Bhubaneswar':[20.2961,85.8245]};

/* Great-circle distance in kilometres. "Jobs near me" ranks by real distance,
   so a flat-earth approximation that drifts by tens of kilometres would put
   the wrong job at the top of somebody's list. */
export function kmBetween(a,b){const R=6371,rad=x=>x*Math.PI/180;const dLat=rad(b[0]-a[0]),dLng=rad(b[1]-a[1]);const h=Math.sin(dLat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
/* Remote roles deliberately return null rather than 0 km: they are reachable
   from anywhere, and pretending they are next door would be a lie. */
export function jobKm(job,here){if(!here||job.wfh)return null;const p=job.pos||CITY_POS[job.city];return p?kmBetween(here,p):null}
export function nearestCity(here){const list=Object.entries(CITY_POS).map(([c,p])=>[c,kmBetween(here,p)]).sort((x,y)=>x[1]-y[1]);return list[0]}
/* Generic, sector-level duties. A real posting would carry its own text from
   the employer; these are clearly indicative, like the rest of the demo data,
   and exist so the role page reads as a job rather than a row of numbers. */
const DUTIES={
Sales:['Meet customers in your assigned area and explain the product honestly','Complete the paperwork and KYC for every closed lead','Hit a monthly target that is shared with you in writing'],
Support:['Answer customer calls and chats within the agreed response time','Log every interaction so the next agent has the full history','Escalate anything you cannot resolve, with your notes attached'],
Operations:['Enter and verify records against the source document','Flag mismatches instead of guessing at the correct value','Keep the daily queue clear before you sign off'],
Finance:['Maintain day books, vouchers and reconciliations in Tally','Support monthly closing and GST filing with the senior accountant','Follow up on outstanding payments with a written trail'],
Logistics:['Pick up and deliver consignments on your assigned route','Confirm each handover in the app with a proof of delivery','Report damage or delay the same day, not at week end'],
Retail:['Help customers on the floor and keep your section stocked','Run the billing counter accurately during peak hours','Support stock counts and visual merchandising resets'],
Technology:['Build and ship features against a reviewed ticket','Write tests for what you build and fix what you break','Take part in code review and daily stand-up'],
Healthcare:['Follow the standard operating procedure for every sample or dispense','Maintain records that satisfy an inspection without rework','Keep the workspace and equipment compliant with hygiene norms'],
Marketing:['Write and schedule content for the channels you own','Track what each post actually earned in reach and leads','Work to a monthly calendar agreed with the lead']};
export const dutiesOf=job=>DUTIES[job.sector]||['Deliver the day-to-day work described in the role','Keep clear records of what you complete','Report blockers early to your reporting manager'];
/* Filter facets are derived from whatever the catalogue actually returns, so a
   city or sector an admin introduces appears in the filters without a code
   change — and one that disappears stops being offered. */
export const jobCities=rows=>[...new Set(rows.map(j=>j.city).filter(Boolean))].sort((a,b)=>a==='Remote'?1:b==='Remote'?-1:a.localeCompare(b));
/* The chip row shows six cities out of thirteen, so it has to show the six with
   the most openings. Sorted alphabetically it hid Patna — the home market and
   a third of every listing — behind Bengaluru and Bhubaneswar. */
export const topJobCities=rows=>{const n={};rows.forEach(j=>{if(j.city)n[j.city]=(n[j.city]??0)+1});
  return Object.keys(n).sort((a,b)=>n[b]-n[a]||a.localeCompare(b));};
export const jobSectors=rows=>[...new Set(rows.map(j=>j.sector).filter(Boolean))].sort();
/* Read off the postings for the same reason as the two above: job types are
   editable in the console now, and a filter listing three hard-coded options
   would hide every job posted under a fourth. */
export const jobTypes=rows=>[...new Set(rows.map(j=>j.type).filter(Boolean))].sort();
