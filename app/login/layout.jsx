/* The sign-in screen is a client component, so it cannot carry its own metadata
   and was inheriting the homepage title — a browser tab and a bookmark that both
   said "Your next move, made visible" for the account door. This layout adds
   nothing to the render tree; it exists to name the page and to keep it out of
   the index, the same way the console's layout does. */
export const metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default function LoginLayout({ children }) {
  return children;
}
