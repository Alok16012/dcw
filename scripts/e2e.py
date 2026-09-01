import json, time, urllib.request, urllib.error, http.cookiejar as cj

B = 'http://localhost:3000'
P = F = 0
def check(name, cond, detail=''):
    global P, F
    if cond: P += 1; print(f'  PASS  {name}')
    else:    F += 1; print(f'  FAIL  {name}  {detail}')

class LocalPolicy(cj.DefaultCookiePolicy):
    # next start sets NODE_ENV=production, so the session cookie carries Secure.
    # Browsers send Secure cookies to http://localhost (it is a secure context);
    # http.cookiejar does not. Relax that here so the harness behaves like a browser.
    def return_ok_secure(self, cookie, request): return True

def client():
    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cj.CookieJar(policy=LocalPolicy())))

def req(op, path, method='GET', body=None):
    r = urllib.request.Request(B + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'content-type': 'application/json'})
    try:
        with op.open(r) as resp: return resp.status, json.loads(resp.read() or b'{}')
    except urllib.error.HTTPError as e:
        raw = e.read()
        try: return e.code, json.loads(raw or b'{}')
        except Exception: return e.code, {'raw': raw[:120].decode('utf8', 'replace')}

anon, admin, emp, stu = client(), client(), client(), client()

# Every run needs its own candidate: the server keeps state in memory across
# runs, and both leads and applications de-duplicate on the phone number.
RUN = str(int(time.time()))[-6:]
PHONE = '98765' + RUN[-5:]

print('\n1. UNAUTHENTICATED GUARDS')
for p in ['/api/admin/jobs', '/api/admin/stats', '/api/admin/leads', '/api/admin/applications']:
    s, _ = req(anon, p); check(f'401 on {p}', s == 401, f'got {s}')
s, _ = req(anon, '/api/admin/jobs', 'POST', {'title': 'Hack'}); check('401 on POST job', s == 401, f'got {s}')

print('\n2. LOGIN')
s, _ = req(admin, '/api/auth/login', 'POST', {'username': 'admin', 'passcode': 'nope'})
check('bad passcode 401', s == 401, f'got {s}')
for op, u, pw in [(admin,'admin','admin123'), (emp,'employer','employer123'), (stu,'student','student123')]:
    s, d = req(op, '/api/auth/login', 'POST', {'username': u, 'passcode': pw})
    check(f'{u} login', s == 200 and d.get('ok'), f'got {s} {d}')

print('\n3. ROLE SEPARATION')
s, _ = req(emp, '/api/admin/leads');    check('employer 403 on leads', s == 403, f'got {s}')
s, _ = req(admin, '/api/admin/leads');  check('admin 200 on leads', s == 200, f'got {s}')
s, _ = req(stu, '/api/admin/jobs');     check('student 403 on admin jobs', s == 403, f'got {s}')

print('\n4. CREATE -> PUBLIC VISIBILITY')
s, d = req(anon, '/api/jobs?limit=200'); before = len(d['data']['rows'])
s, d = req(admin, '/api/admin/jobs', 'POST', {
    'title': 'Field Sales Executive', 'companyName': 'Muthoot Finance', 'location': 'Lucknow',
    'salaryMin': 216000, 'salaryMax': 312000, 'jobType': 'Full-time', 'qualification': 'Graduate',
    'openings': 12, 'experienceMin': 0, 'description': 'Door-to-door gold loan sourcing.',
    'skills': ['Sales', 'Communication']})
check('create 200/201', s in (200, 201), f'got {s} {d}')
job = d['data']['job']; JID, SLUG = job['id'], job['slug']
check('slug generated', SLUG.startswith('field-sales-executive-lucknow'), SLUG)
check('company auto-created', job['companyId'] == 'muthoot-finance', job['companyId'])
s, d = req(anon, '/api/jobs?limit=200'); after = len(d['data']['rows'])
check('public listing grew by 1', after == before + 1, f'{before}->{after}')
s, d = req(anon, f'/api/jobs/{SLUG}')
check('public detail by slug 200', s == 200, f'got {s}')
if s == 200:
    dd = json.dumps(d['data'])
    check('detail carries company name', 'Muthoot Finance' in dd, dd[:160])

print('\n5. VALIDATION')
for name, payload, field in [
    ('missing title', {'companyName':'X','location':'Delhi','salaryMin':1,'salaryMax':2}, 'title'),
    ('missing location', {'title':'X','companyName':'Y','salaryMin':1,'salaryMax':2}, 'location'),
    ('bad jobType', {'title':'X','companyName':'Y','location':'D','salaryMin':1,'salaryMax':2,'jobType':'Gig'}, 'jobType'),
    ('min>max salary', {'title':'X','companyName':'Y','location':'D','salaryMin':9,'salaryMax':1}, 'salaryMax'),
    ('openings 0', {'title':'X','companyName':'Y','location':'D','salaryMin':1,'salaryMax':2,'openings':0}, 'openings')]:
    s, d = req(admin, '/api/admin/jobs', 'POST', payload)
    check(f'422 {name}', s == 422 and field in d.get('errors', {}), f'got {s} {d.get("errors")}')

print('\n6. UPDATE')
s, d = req(admin, f'/api/admin/jobs/{JID}', 'PATCH', {'openings': 30, 'salaryMax': 360000})
check('patch 200', s == 200, f'got {s} {d}')
if s == 200:
    j = d['data']['job']
    check('openings updated', j['openings'] == 30, j['openings'])
    check('salaryMax updated', j['salaryMax'] == 360000, j['salaryMax'])
    check('title untouched', j['title'] == 'Field Sales Executive', j['title'])
s, d = req(admin, f'/api/admin/jobs/{JID}', 'PATCH', {'qualification': 'PhD'})
check('422 bad enum on patch', s == 422, f'got {s}')
s, _ = req(admin, '/api/admin/jobs/does-not-exist', 'PATCH', {'openings': 2})
check('404 unknown id', s == 404, f'got {s}')

print('\n7. EMPLOYER SCOPING')
s, d = req(emp, '/api/admin/jobs')
own = d['data']['rows'] if s == 200 else []
check('employer sees only own company', all(j['companyId'] == 'bajaj-finserv' for j in own),
      sorted({j['companyId'] for j in own}))
s, _ = req(emp, f'/api/admin/jobs/{JID}', 'PATCH', {'openings': 99})
check('employer 403 on other company job', s == 403, f'got {s}')
s, _ = req(emp, f'/api/admin/jobs/{JID}', 'DELETE')
check('employer 403 deleting other job', s == 403, f'got {s}')
s, d = req(emp, '/api/admin/jobs', 'POST', {
    'title': 'Sneaky', 'companyId': 'muthoot-finance', 'location': 'Delhi', 'salaryMin': 1, 'salaryMax': 2})
if s in (200, 201):
    check('employer post forced to own company', d['data']['job']['companyId'] == 'bajaj-finserv',
          d['data']['job']['companyId'])
else:
    check('employer post forced to own company', s == 403, f'rejected {s}')

print('\n8. DELETE')
s, d = req(admin, f'/api/admin/jobs/{JID}', 'DELETE')
check('soft delete 200', s == 200, f'got {s} {d}')
s, d = req(anon, '/api/jobs?limit=200')
check('gone from public listing', not any(r['slug'] == SLUG for r in d['data']['rows']))
s, d = req(admin, '/api/admin/jobs')
still = [j for j in d['data']['rows'] if j['id'] == JID]
check('still in admin (soft)', len(still) == 1 and still[0].get('isActive') is False,
      still[0] if still else 'missing')


print('\n9. ATS PIPELINE')
s, d = req(admin, '/api/admin/applications')
check('applications list 200', s == 200, f'got {s}')
apps = d['data']['rows']
check('seeded applications present', len(apps) >= 10, len(apps))
check('funnel stats present', 'stats' in d['data'], list(d['data'].keys()))

applied = [a for a in apps if a['status'] == 'Applied']
check('has an Applied candidate', len(applied) > 0, [a['status'] for a in apps][:6])
AID = applied[0]['id']

s, d = req(admin, f'/api/admin/applications/{AID}', 'PATCH', {'status': 'Hired'})
check('409 illegal Applied->Hired', s == 409, f'got {s} {d.get("error")}')
check('409 names allowed moves', 'Shortlisted' in json.dumps(d), json.dumps(d)[:160])

s, d = req(admin, f'/api/admin/applications/{AID}', 'PATCH', {'status': 'Shortlisted'})
check('legal Applied->Shortlisted', s == 200 and d['data']['application']['status'] == 'Shortlisted',
      f'got {s} {json.dumps(d)[:140]}')
s, d = req(admin, f'/api/admin/applications/{AID}', 'PATCH', {'rating': 4})
check('rating saved', s == 200 and d['data']['application']['rating'] == 4, f'got {s}')
s, d = req(admin, f'/api/admin/applications/{AID}', 'PATCH', {'rating': 9})
check('422 rating out of range', s == 422, f'got {s}')
s, d = req(admin, f'/api/admin/applications/{AID}', 'PATCH', {'note': 'Strong Hindi communication.'})
check('note appended', s == 200, f'got {s}')
s, d = req(admin, f'/api/admin/applications/{AID}')
check('activity trail records the move', s == 200 and any(
    'Shortlisted' in json.dumps(x) for x in d['data'].get('activity', [])),
    json.dumps(d['data'].get('activity', []))[:200])

print('\n10. PUBLIC APPLY FILES INTO PIPELINE')
s, d = req(anon, '/api/jobs?limit=5'); target = d['data']['rows'][0]['slug']
s, d = req(admin, '/api/admin/applications'); n_before = len(d['data']['rows'])
# A fresh number each run: applications de-duplicate on job + phone, so a fixed
# one would file once and then silently return the first run's row forever.
who = f'Sunita Devi {RUN}'
applicant = {'name': who, 'phone': PHONE, 'email': f'sunita{RUN}@example.com',
             'city': 'Patna', 'qualification': 'Graduate', 'experienceYears': 0}
s, d = req(anon, f'/api/jobs/{target}/apply', 'POST', applicant)
check('public apply accepted', s in (200, 201), f'got {s} {json.dumps(d)[:160]}')
s, d = req(admin, '/api/admin/applications'); n_after = len(d['data']['rows'])
check('candidate reached recruiter pipeline', n_after == n_before + 1, f'{n_before}->{n_after}')
hit = [a for a in d['data']['rows'] if a.get('name') == who]
check('application linked to a CRM lead', bool(hit) and hit[0].get('leadId'),
      hit[0] if hit else 'not found')
s, d = req(admin, '/api/admin/leads')
check('same person present as CRM lead', who in json.dumps(d['data']))
# Re-applying is not an error and must not file a second row against the job.
s, d = req(anon, f'/api/jobs/{target}/apply', 'POST', applicant)
check('re-apply reported as duplicate', s in (200, 201) and d['data'].get('duplicate') is True,
      f'got {s} {json.dumps(d)[:160]}')
s, d = req(admin, '/api/admin/applications')
check('re-apply files no second row', len(d['data']['rows']) == n_after,
      f'{n_after}->{len(d["data"]["rows"])}')

print('\n12. TENANT SCOPING OF AGGREGATES')
# An employer's dashboard must report on its own hiring only. `recent` carries
# candidate names and phone numbers, so an unscoped figure here is a PII leak.
s, a = req(admin, '/api/admin/stats')
s2, e = req(emp, '/api/admin/stats')
check('admin + employer stats both 200', s == 200 and s2 == 200, f'{s}/{s2}')
check('employer sees fewer jobs than admin',
      e['data']['jobs']['total'] < a['data']['jobs']['total'],
      f"emp={e['data']['jobs']['total']} admin={a['data']['jobs']['total']}")
check('employer companies count is its own', e['data']['jobs']['companies'] == 1,
      e['data']['jobs']['companies'])
check('employer pipeline is scoped',
      e['data']['pipeline']['total'] < a['data']['pipeline']['total'],
      f"emp={e['data']['pipeline']['total']} admin={a['data']['pipeline']['total']}")
s3, ea = req(emp, '/api/admin/applications')
own = {r['name'] for r in ea['data']['rows']}
leaked = [r['name'] for r in e['data']['recent'] if r['name'] not in own]
check('no foreign candidate in employer recent', not leaked, leaked)
check('employer chips agree with employer rows',
      ea['data']['stats']['total'] == len(ea['data']['rows']),
      f"chips={ea['data']['stats']['total']} rows={len(ea['data']['rows'])}")
check('employer gets no counselling lead count', e['data']['leads'] is None, e['data']['leads'])

print('\n13. IN-PIPELINE EXCLUDES TERMINAL STAGES')
pl = a['data']['pipeline']; bs = pl['byStatus']
open_stages = sum(bs[k] for k in ('Applied', 'Shortlisted', 'Interview', 'Offered'))
check('inPipeline counts only open stages', pl['inPipeline'] == open_stages,
      f"inPipeline={pl['inPipeline']} open={open_stages} hired={bs['Hired']}")
check('hired is not double-counted as in-pipeline',
      pl['inPipeline'] + pl['hired'] + bs['Rejected'] + bs['On hold'] + bs['Withdrawn'] == pl['total'],
      json.dumps(pl))

print('\n14. OTP IS PROVEN SERVER-SIDE, NOT CLAIMED')
lead = {'vertical': 'distance', 'name': f'Test Person {RUN}', 'phone': '98111' + RUN[-5:],
        'city': 'Patna', 'qualification': '12th', 'interestType': 'course', 'interestId': 'bca'}
s, d = req(anon, '/api/leads', 'POST', {**lead, 'phoneVerified': True})
check('forged phoneVerified rejected', s == 422 and d.get('error') == 'OTP_REQUIRED',
      f'got {s} {json.dumps(d)[:120]}')
s, d = req(anon, '/api/tools/rank-predictor', 'POST', {'rank': 15000, 'phoneVerified': True})
check('rank predictor still gated on forged flag', d['data']['gated'] is True, json.dumps(d)[:120])
s, d = req(anon, '/api/otp/send', 'POST', {'phone': lead['phone']}); code = d['data']['demoCode']
s, d = req(anon, '/api/otp/verify', 'POST', {'phone': lead['phone'], 'code': code})
check('otp verify 200', s == 200 and d.get('ok'), f'got {s}')
s, d = req(anon, '/api/leads', 'POST', lead)   # no phoneVerified flag sent at all
check('lead accepted after real OTP', s in (200, 201), f'got {s} {json.dumps(d)[:120]}')
s, d = req(anon, '/api/tools/rank-predictor', 'POST', {'rank': 15000, 'phone': lead['phone']})
check('rank predictor ungated after real OTP', d['data']['gated'] is False, json.dumps(d)[:120])

print('\n11. LOGOUT')
s, _ = req(admin, '/api/auth/logout', 'POST'); check('logout 200', s == 200, f'got {s}')
s, _ = req(admin, '/api/admin/jobs'); check('401 after logout', s == 401, f'got {s}')

print(f'\n{"="*46}\n  {P} passed, {F} failed\n{"="*46}')
