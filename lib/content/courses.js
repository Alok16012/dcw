/* ---------- Course catalogue -----------------------------------------------
   A card advertises one headline programme, but somebody who wants to APPLY
   has to pick the programme they are actually applying to. So each university
   carries its real menu, and the apply flow reads from here. Any institution
   without an entry falls back to its headline course, so nothing breaks when
   the catalogue is incomplete. Indicative demo data, same as the cards.

   Each row carries its level and its mode as data rather than leaving them to
   be guessed from the name at render time. The /distance path cards ("UG
   distance", "PG distance", "Online degree") used to be three links to one
   unfiltered page: whichever a person picked, they got the same six
   universities and nothing on the page acknowledged the choice they had just
   made. These two fields are what those cards now carry, so the choice
   survives the click. Guessing "MBA is a master's" from a regex would have
   worked for today's six rows and quietly mislabelled the first row that did
   not fit the pattern. */
/* [name, duration, fee, mrp, note, level, mode]
   level: 'ug' | 'pg'      mode: 'online' | 'distance' */
export const COURSES={
'amity-online':[['Online MBA','2 years',149000,180000,'Dual specialisation','pg','online'],['Online MCA','2 years',175000,199000,'Cloud and AI electives','pg','online'],['Online BBA','3 years',119000,140000,'Weekend live classes','ug','online'],['Online BCA','3 years',115000,135000,'Placement support','ug','online']],
'lpu':[['Distance BBA','3 years',78000,92000,'Semester exams at centre','ug','distance'],['Distance B.Com','3 years',66000,79000,'CA-friendly timetable','ug','distance'],['Distance MBA','2 years',124000,148000,'AICTE approved','pg','distance'],['Distance MA English','2 years',54000,64000,'Fully self-paced','pg','distance']],
'ignou':[['BA (General)','3 years',16200,null,'Lowest total fee','ug','distance'],['B.Com','3 years',18300,null,'January and July intake','ug','distance'],['MBA','2 years',62000,null,'OPENMAT not required','pg','distance'],['BCA','3 years',48000,null,'Practical labs at centre','ug','distance']],
'manipal-online':[['Online BCA','3 years',135000,150000,'Industry mentors','ug','online'],['Online BBA','3 years',135000,150000,'Live and recorded','ug','online'],['Online MBA','2 years',175000,200000,'NAAC A+ campus','pg','online'],['Online M.Com','2 years',120000,140000,'Finance electives','pg','online']],
'cu-online':[['Online BBA','3 years',109200,124000,'Placement cell access','ug','online'],['Online BCA','3 years',109200,124000,'Coding bootcamp add-on','ug','online'],['Online MBA','2 years',159000,180000,'Ten specialisations','pg','online'],['Online MCA','2 years',149000,170000,'Live doubt sessions','pg','online']],
'jain-online':[['Online MBA','2 years',196000,null,'NAAC A++ university','pg','online'],['Online MCA','2 years',180000,null,'Data science electives','pg','online'],['Online BBA','3 years',150000,null,'Global immersion option','ug','online'],['Online B.Com','3 years',135000,null,'ACCA pathway','ug','online']]};
/* [name, duration, fee, mrp, note, level, mode] -> objects, so call sites stay
   readable. The fallback row has no level or mode, which `matchesPath` reads as
   "cannot rule it out" — an institution the catalogue knows less about should
   not vanish from a list it might belong on. */
export function coursesOf(item){return (COURSES[item.id]||[[item.course,item.duration,item.fee,item.mrp??null,item.mode,null,null]]).map(([name,duration,fee,mrp,note,level,mode])=>({name,duration,fee,mrp,note,level:level??null,mode:mode??null}))}

/* The three university path cards, as a predicate over one course.
   'ug'/'pg' ask about the level; 'online' asks about the mode, because a fully
   online degree is a way of studying rather than a rung on the ladder. Anything
   else — no path chosen, or a value someone typed into the URL — matches
   everything, so a bad query parameter shows the whole catalogue instead of an
   empty page. */
export const PATHS={ug:"Bachelor’s programmes",pg:"Master’s programmes",online:'Fully online degrees'};
export function matchesPath(course,path){
  if(!path||!PATHS[path])return true;
  if(path==='online')return course.mode===null||course.mode==='online';
  return course.level===null||course.level===path;
}
