# Putting DCW on a public URL

The app is a Node server, not a static site: `/admin`, the login and every
`/api/*` route need a running process. Two options, and the difference matters.

## Use Render (permanent link)

`render.yaml` in the repo root is a Render blueprint, so there is nothing to
configure by hand.

1. Go to <https://dashboard.render.com/blueprints> and click **New Blueprint
   Instance**.
2. Pick `Alok16012/dcw`. Render reads `render.yaml`, shows one web service
   called `dcw`, and fills in the build and start commands itself.
3. Click **Apply**. First build takes roughly 3–5 minutes.

You get `https://dcw-<suffix>.onrender.com`. It redeploys on every push to
`main`.

`DCW_SESSION_SECRET` is marked `generateValue: true`, so Render mints a random
secret at create time. Without it `lib/auth.js:22` falls back to a hardcoded
demo string, which would let anyone forge a session cookie. Nobody has to type
or store a secret for this to be correct.

### What the free plan does

The instance sleeps after about 15 minutes of no traffic. Two consequences:

- The first request after a sleep takes ~30 seconds. Open the link yourself a
  minute before a client call so it is already awake.
- **Anything created during a demo is lost on sleep.** The seed data comes
  back; a job posted in `/admin` does not.

That second point is not a Render limitation, it is this codebase:
`lib/jobs-repo.js`, `lib/integrations/ats.js` and `lib/integrations/crm.js`
hold their records in process memory as a stand-in for a real database (see the
header of `lib/store.js`). A paid instance sleeps less but still loses
everything on any restart or deploy. Durable data means doing the Supabase
swap, which those modules were written to accommodate.

## Use a tunnel (temporary link, live from your laptop)

Better for a screen-share where you want to add a job and have it stay added,
because it is your own machine serving it.

```bash
npm run build && npm start          # terminal 1
cloudflared tunnel --url http://localhost:3000   # terminal 2
```

The second command prints a `https://<random>.trycloudflare.com` URL after a
few seconds. It dies when you close that terminal.

## Either way, this is a public URL

There is no gate in front of it. `/admin` is reachable by anyone who has the
link, and the login screen prints its own demo passcodes on purpose. Every
record is fabricated demo data, so nothing real is exposed — but do not treat
the link as private, and do not put real candidate details behind it until
`lib/auth.js` has proper password hashing.
