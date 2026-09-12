/**
 * The company's own contact details.
 *
 * One module rather than three copies of the same address. It was three copies
 * that let the About page keep saying "Boring Road" long after the office moved,
 * and a phone number pasted into a footer is exactly the kind of string nobody
 * remembers to search for. Everything that shows an address, dials a number or
 * draws the office on a map reads it from here.
 *
 * NOT the same thing as an institution's address. `lib/integrations/maps.js`
 * handles those — they are catalogue data, they come from the admin console, and
 * they need a Places key for ratings. This is one fixed location that ships with
 * the build.
 */

/** Digits only, E.164. `tel:` needs the country code; the display form does not. */
const PHONE_E164 = '+919939587009';

export const CONTACT = {
  phone: { display: '099395 87009', href: `tel:${PHONE_E164}` },
  email: { display: 'info@distancecourseswala.in', href: 'mailto:info@distancecourseswala.in' },
  address: {
    /* Split so the footer can set it on two lines and the map can send the whole
       thing to Google as one query. */
    lines: ['K - 212, near SBI ATM', 'Kankarbagh, Hanuman Nagar', 'Patna, Bihar 800020'],
    full: 'K - 212, near SBI ATM, Kankarbagh, Hanuman Nagar, Patna, Bihar 800020'
  },
  hours: 'Mon–Sat, 9am–7pm IST',
  /* From the client's own Maps link. Kept as numbers rather than a pasted URL so
     the embed, the place link and the directions link are all built from one
     position and cannot point at three different pins. */
  geo: { lat: 25.5945, lng: 85.1585, zoom: 16 }
};

/**
 * The <iframe> src for the office map.
 *
 * Deliberately the keyless `output=embed` form rather than the Embed API used by
 * `lib/integrations/maps.js`. That one returns null without GOOGLE_MAPS_BROWSER_KEY,
 * which would leave the contact section with a hole in it on a fresh checkout —
 * and unlike an institution's map, this pin never changes and needs no Places
 * lookup behind it. No key, no quota, nothing to configure.
 */
export const officeEmbedUrl = () =>
  `https://maps.google.com/maps?ll=${CONTACT.geo.lat},${CONTACT.geo.lng}`
  + `&q=${encodeURIComponent(CONTACT.address.full)}`
  + `&z=${CONTACT.geo.zoom}&hl=en&gl=IN&output=embed`;

/** Opens the place in whatever map app the person actually uses. Needs no key. */
export const officePlaceUrl = () =>
  `https://www.google.com/maps/search/?api=1&query=${CONTACT.geo.lat},${CONTACT.geo.lng}`;

/** Turn-by-turn from wherever they are. */
export const officeDirectionsUrl = () =>
  `https://www.google.com/maps/dir/?api=1&destination=${CONTACT.geo.lat},${CONTACT.geo.lng}`;
