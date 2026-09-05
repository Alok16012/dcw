'use client';
import {useState} from 'react';
import {X} from 'lucide-react';

/* Two input controls that hold a collection rather than a value: a repeated
   fieldset and a chip list. Both are used by the resume builder today; both are
   written against nothing but their props, so the next form that needs a list
   of things does not grow its own copy. */
/* One repeated block of fields. Kept generic so education, experience and
   projects all use the same add / remove behaviour and read the same way. */
export function Repeater({label,items,fields,onChange,addLabel,max=4}){
  const set=(i,k,v)=>onChange(items.map((it,n)=>n===i?{...it,[k]:v}:it));
  const add=()=>onChange([...items,Object.fromEntries(fields.map(f=>[f.key,'']))]);
  const drop=i=>onChange(items.filter((_,n)=>n!==i));
  return <div className="repeater">
    {items.map((it,i)=><fieldset key={i}>
      <legend>{label} {i+1}
        {items.length>1&&<button type="button" onClick={()=>drop(i)} aria-label={`Remove ${label} ${i+1}`}><X/></button>}
      </legend>
      {fields.map(f=><label key={f.key} className={f.wide?'wide':''}>{f.label}
        {f.area
          ?<textarea rows={f.rows||3} value={it[f.key]||''} placeholder={f.hint}
             onChange={e=>set(i,f.key,e.target.value)}/>
          :<input value={it[f.key]||''} placeholder={f.hint} onChange={e=>set(i,f.key,e.target.value)}/>}
        {f.note&&<small>{f.note}</small>}
      </label>)}
    </fieldset>)}
    {items.length<max&&<button type="button" className="btn outline small add" onClick={add}>+ {addLabel}</button>}
  </div>;
}

/* Free-text in, chips out. Enter or comma commits; backspace on an empty
   field removes the last chip, which is what people expect from a tag input. */
export function ChipInput({label,items,onChange,hint,max=14}){
  const [draft,setDraft]=useState('');
  const commit=v=>{const t=v.trim().replace(/,$/,'');
    if(t&&!items.includes(t)&&items.length<max)onChange([...items,t]);setDraft('')};
  return <label className="chip-input">{label}
    <div className="ci-box">
      {items.map(x=><span key={x} className="ci-chip">{x}
        <button type="button" onClick={()=>onChange(items.filter(y=>y!==x))} aria-label={`Remove ${x}`}><X/></button>
      </span>)}
      <input value={draft} placeholder={items.length?'':hint}
        onChange={e=>e.target.value.includes(',')?commit(e.target.value):setDraft(e.target.value)}
        onKeyDown={e=>{
          if(e.key==='Enter'){e.preventDefault();commit(draft)}
          else if(e.key==='Backspace'&&!draft&&items.length)onChange(items.slice(0,-1))}}
        onBlur={()=>commit(draft)}/>
    </div>
    <small>{hint} · press Enter after each one</small>
  </label>;
}
