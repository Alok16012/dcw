/* One money format for the whole product. Fees, salary bands and comparison
   rows all read the same way — a lakh is written as a lakh, because that is how
   the number is spoken in the market this serves. */
export function fmt(n){return n>=100000?`₹${(n/100000).toFixed(n%100000?1:0)}L`:`₹${n.toLocaleString('en-IN')}`}

/* Phone entry, normalised on the way in.

   A visitor pasting their number almost never pastes ten bare digits — they
   paste it the way it is stored in their own contacts, which in this market is
   "+91 98765 43210". Stripping non-digits and truncating to ten turns that into
   9198765432: a *different* number that still starts with 9, so it passes both
   the client's length check and the server's /^[6-9]\d{9}$/. The OTP then goes
   to a stranger and the visitor is left staring at a code that never arrives.

   So drop the country code before truncating, and only at the exact lengths
   where it is unambiguous — 14 beginning 00, 13 beginning 091, 12 beginning 91,
   11 beginning 0. A half-typed 11-digit string is left alone and merely truncated,
   as before, so someone typing an extra digit by mistake is not silently given
   a different number. */
export function phoneDigits(raw){
  let d=String(raw??'').replace(/\D/g,'');
  if(d.length===14&&d.startsWith('00'))d=d.slice(2);   // 0091… , the dialled international form
  if(d.length===13&&d.startsWith('091'))d=d.slice(3);
  else if(d.length===12&&d.startsWith('91'))d=d.slice(2);
  else if(d.length===11&&d.startsWith('0'))d=d.slice(1);
  return d.slice(0,10);
}
