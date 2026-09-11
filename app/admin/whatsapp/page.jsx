'use client';
import { useEffect, useState, useCallback } from 'react';
import { PageTop, useToast } from '../AdminShell.jsx';
import { api, ApiError, fmtWhen } from '@/lib/admin-client.js';
import { IconAlert, IconCheck, IconSend, IconEmpty, IconChat, IconUsers } from '../icons.jsx';

/** Hoisted — see JobForm for why. */
function Field({ error, label, children, hint }) {
  return (
    <label className={`adm-field${error ? ' bad' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <em className="err">{error}</em>}
      {!error && hint && <em className="err" style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{hint}</em>}
    </label>
  );
}

const ENV_LABEL = {
  accessToken: 'WHATSAPP_ACCESS_TOKEN',
  educationSender: 'WHATSAPP_PHONE_NUMBER_ID',
  berojgarSender: 'BB_WHATSAPP_PHONE_NUMBER_ID',
  wabaId: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
  webhookToken: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN'
};
const ENV_WHAT = {
  accessToken: 'System-user token from Meta Business',
  educationSender: 'Sender number for DCW and Colleges Wala',
  berojgarSender: 'Sender number for Berojgar Bharat',
  wabaId: 'WhatsApp Business Account, for template sync',
  webhookToken: 'Shared secret Meta echoes back when verifying the webhook'
};

const render = (template, vars) =>
  String(template?.preview ?? '').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k]?.trim() || `{{${k}}}`);

/**
 * WhatsApp Business messaging (client requirement 15).
 *
 * Two things this screen is careful about, both of which are enforced on the
 * server and only *reflected* here:
 *
 *  1. PIPELINE SEPARATION. DCW and Colleges Wala share one number; Berojgar
 *     Bharat has its own. The pipelines you can pick are the ones your session
 *     carries — the route filters history and refuses a send on any other,
 *     whatever the request body says.
 *  2. TEMPLATES. Outside an open 24-hour window WhatsApp only delivers approved
 *     templates, so a bulk send requires one. Free text is offered for replies
 *     inside a conversation, where it is actually allowed.
 */
export default function WhatsAppPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [crm, setCrm] = useState('');
  const [mode, setMode] = useState('one');      // one | bulk
  const [phone, setPhone] = useState('');
  const [recipients, setRecipients] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [vars, setVars] = useState({});
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    const search = new URLSearchParams();
    if (crm) search.set('crm', crm);
    try { setData(await api(`/admin/whatsapp?${search}`)); setErr(null); }
    catch (e) { setErr(e.message); }
  }, [crm]);

  useEffect(() => { load(); }, [load]);

  const template = data?.templates.find(t => t.name === templateName) ?? null;
  const creds = data?.credentials;
  const configured = creds ? Object.keys(ENV_LABEL).every(k => creds[k]) : false;

  async function send(e) {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      if (mode === 'bulk') {
        const list = recipients.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
        if (!list.length) { setErrors({ recipients: 'Add at least one number.' }); setBusy(false); return; }
        const d = await api('/admin/whatsapp', {
          method: 'POST',
          body: { crm: crm || data.crms[0]?.id, template: templateName, recipients: list.map(p => ({ phone: p, vars })) }
        });
        toast(`${d.sent} sent${d.failed ? `, ${d.failed} failed` : ''}.`);
        setRecipients('');
      } else {
        await api('/admin/whatsapp', {
          method: 'POST',
          body: {
            crm: crm || data.crms[0]?.id, phone,
            template: templateName || undefined,
            vars: templateName ? vars : undefined,
            text: templateName ? undefined : text
          }
        });
        toast('Message queued.');
        setText('');
      }
      await load();
    } catch (e2) {
      if (e2 instanceof ApiError && e2.errors) setErrors(e2.errors);
      else toast(e2.message, 'bad');
    }
    setBusy(false);
  }

  const rows = data?.rows ?? [];

  return (
    <>
      <PageTop title="WhatsApp"
        sub="Message a student or a whole list from the business number, with every message kept against the CRM record it belongs to." />

      <div className="adm-body">
        {err && <div className="adm-note bad"><IconAlert />{err}</div>}

        {creds && !configured && (
          <div className="adm-note warn" style={{ marginBottom: 14 }}>
            <IconAlert />
            <span>
              <b>Demo mode.</b> Messages are recorded against the CRM and shown below, but nothing
              leaves the server until the WhatsApp Business credentials are set and
              <code> DCW_INTEGRATION_DRIVER=live</code>. The integration itself is complete — the
              missing piece is the account.
            </span>
          </div>
        )}

        {creds && (
          <div className="adm-panel" style={{ padding: 16, marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, marginBottom: 10 }}>What this needs to go live</h3>
            <div className="adm-minilist">
              {Object.keys(ENV_LABEL).map(k => (
                <div key={k} className="adm-minirow">
                  <div><b><code>{ENV_LABEL[k]}</code></b><small>{ENV_WHAT[k]}</small></div>
                  <span className={`adm-pill s-${creds[k] ? 'active' : 'inactive'}`}>{creds[k] ? 'Set' : 'Not set'}</span>
                </div>
              ))}
              <div className="adm-minirow">
                <div><b><code>WHATSAPP_APP_SECRET</code></b><small>Optional. Verifies the X-Hub-Signature-256 on inbound webhooks.</small></div>
                <span className="adm-pill s-inactive">Optional</span>
              </div>
            </div>
            <p className="adm-more-note" style={{ margin: '12px 0 0' }}>
              Webhook URL to register with Meta: <code>/api/webhooks/whatsapp</code>. Driver currently
              <b> {creds.driver}</b>.
            </p>
          </div>
        )}

        <div className="adm-split2">
          <div className="adm-panel" style={{ padding: 0 }}>
            <div className="adm-panel-head"><h2>Conversation history</h2></div>
            {rows.length === 0
              ? <div className="adm-empty"><IconEmpty /><h3>Nothing sent yet</h3>
                  <p>Messages you send — and replies that come back through the webhook — appear here against the lead they belong to.</p></div>
              : (
                <div className="adm-scroll">
                  <table className="adm-table">
                    <thead><tr><th>Message</th><th>To</th><th>Pipeline</th><th>State</th></tr></thead>
                    <tbody>
                      {rows.map(m => (
                        <tr key={m.id}>
                          <td style={{ maxWidth: 400 }}>
                            <b>{m.direction === 'in' ? 'Reply received' : m.template ? m.template : 'Free text'}</b>
                            <span className="adm-sub" style={{ whiteSpace: 'normal', lineHeight: 1.5 }}>{m.body}</span>
                          </td>
                          <td>
                            {m.phone}
                            <span className="adm-sub">{m.leadId ? `Lead ${m.leadId}` : 'No lead linked'} · {fmtWhen(m.at)}</span>
                          </td>
                          <td>{data.crms.find(c => c.id === m.crm)?.label ?? m.crm}</td>
                          <td>
                            <span className={`adm-pill s-${m.status === 'sent' ? 'active' : m.status === 'failed' ? 'lost' : 'new'}`}>{m.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          <aside className="adm-panel adm-side" style={{ padding: 18 }}>
            <form onSubmit={send}>
              <h3 style={{ fontSize: 13, marginBottom: 12 }}>
                <IconSend style={{ width: 15, height: 15, verticalAlign: '-3px' }} /> Send a message
              </h3>

              {data && data.crms.length > 1 && (
                <Field label="Pipeline" hint="DCW and Colleges Wala share one number; Berojgar Bharat has its own.">
                  <select value={crm} onChange={e => setCrm(e.target.value)}>
                    {data.crms.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </Field>
              )}
              {data && data.crms.length === 1 && (
                <p className="adm-more-note">Sending as <b>{data.crms[0].label}</b>. Your account is scoped to this pipeline.</p>
              )}

              <div className="adm-chips" style={{ marginBottom: 14 }}>
                <button type="button" className={`adm-chip${mode === 'one' ? ' on' : ''}`} onClick={() => setMode('one')}>
                  <IconChat style={{ width: 14, height: 14 }} />One person
                </button>
                <button type="button" className={`adm-chip${mode === 'bulk' ? ' on' : ''}`} onClick={() => setMode('bulk')}>
                  <IconUsers style={{ width: 14, height: 14 }} />A list
                </button>
              </div>

              {mode === 'one' ? (
                <Field error={errors.phone} label="Mobile number">
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" inputMode="tel" />
                </Field>
              ) : (
                <Field error={errors.recipients} label="Numbers" hint="One per line, or comma separated.">
                  <textarea value={recipients} onChange={e => setRecipients(e.target.value)}
                    placeholder={'9876543210\n9123456780'} />
                </Field>
              )}

              <Field label={mode === 'bulk' ? 'Template (required)' : 'Template'}
                hint={mode === 'bulk'
                  ? 'A bulk send has to use a template WhatsApp has approved.'
                  : 'Free text only reaches someone who messaged you in the last 24 hours.'}>
                <select value={templateName} onChange={e => { setTemplateName(e.target.value); setVars({}); }}>
                  <option value="">{mode === 'bulk' ? 'Pick a template…' : 'No template — free text'}</option>
                  {(data?.templates ?? []).map(t => <option key={t.name} value={t.name}>{t.label} ({t.category.toLowerCase()})</option>)}
                </select>
              </Field>

              {template && template.vars.map(v => (
                <Field key={v} label={v.charAt(0).toUpperCase() + v.slice(1)}>
                  <input value={vars[v] ?? ''} onChange={e => setVars(p => ({ ...p, [v]: e.target.value }))} />
                </Field>
              ))}

              {!template && mode === 'one' && (
                <Field error={errors.text} label="Message">
                  <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type your reply…" />
                </Field>
              )}

              {template && (
                <div className="adm-note ok" style={{ marginBottom: 14 }}>
                  <IconCheck /><span>{render(template, vars)}</span>
                </div>
              )}

              <button type="submit" className="adm-btn pri" style={{ width: '100%' }}
                disabled={busy || (mode === 'bulk' && !templateName) || (mode === 'one' && !phone.trim())}>
                {busy ? 'Sending…' : mode === 'bulk' ? 'Send to the list' : 'Send'}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </>
  );
}
