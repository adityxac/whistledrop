# WhistleDrop — Speak Without Being Seen

Confidential reporting for the GDG on Campus SRM recruitment task. Public users submit a report without an account and track progress with a private case code.

## Specification coverage
- Anonymous report submission: category, description, optional evidence/reference URL.
- Categories: `security`, `harassment`, `corruption`, `technical`, `other`.
- Random case code generated server-side; SHA-256 hash only is stored.
- Status workflow: `SUBMITTED` → `UNDER_REVIEW` → `RESOLVED` / `DISMISSED`.
- Token-protected moderator API to list/filter reports and update status/public update.
- Validation and meaningful HTTP responses.
- Responsive interface, moderator workspace, tests, and deployment configuration.

## Stack
Static HTML/CSS/JS; Vercel serverless Node.js routes; Supabase PostgreSQL REST API; Node built-in crypto and tests. No runtime npm dependencies.

## Setup
1. Create a Supabase project.
2. Run `migrations/001_reports.sql` in the Supabase SQL Editor.
3. Import this public repo into Vercel with the repository root as root directory.
4. Add server-side environment variables in Vercel for Preview/Production:
   - `SUPABASE_URL`: project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: service-role key (server side only)
   - `MODERATOR_TOKEN`: random secret of at least 32 characters
5. Generate a token locally using `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` and set the same value for `MODERATOR_TOKEN`. Never commit real secrets. Redeploy after changing env vars.
6. Visit `/moderator/` and enter that moderator token. The token is only held in the current tab's memory.

## Tests
Requires a recent Node.js version:

```sh
npm test
npm run check
```

## API
| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/reports` | Public | Create a report and return the case code once |
| GET | `/api/reports?code=WD-XXXX-XXXX-XXXX-XXXX` | Case code | Public status lookup and updates |
| GET | `/api/moderator/reports` | Bearer token | List up to 200 reports, filter by `category`, `status`, `search` |
| PATCH | `/api/moderator/reports` | Bearer token | Change status and public-facing status update |
| GET | `/api/health` | Public | Service/config health check |

Allowed categories: `security`, `harassment`, `corruption`, `technical`, `other`. Allowed statuses: `SUBMITTED`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`. Description length is 20–5,000 characters; evidence URL optional, HTTP(S), up to 2,048 characters; public status update up to 1,000 characters.

### Example submit
```sh
curl -X POST "$BASE_URL/api/reports" -H 'Content-Type: application/json' -d '{"category":"security","description":"The emergency exit light by the west stairwell has been out for several days.","evidenceUrl":"https://example.com/reference"}'
```
Success: HTTP 201 with `success`, `caseCode`, `status`, and a save-the-code message. The shown code is generated at runtime; examples are not real credentials.

### Track status
```sh
curl "$BASE_URL/api/reports?code=WD-ABCD-EFGH-JKLM-NPQR"
```
The public response includes category, status, timestamps and public updates, never the report description or evidence URL. Malformed code: 400. Unknown valid-format code: 404.

### Moderator list/filter
```sh
curl "$BASE_URL/api/moderator/reports?category=security&status=UNDER_REVIEW&search=stairwell" -H "Authorization: Bearer $MODERATOR_TOKEN"
```

### Moderator update
```sh
curl -X PATCH "$BASE_URL/api/moderator/reports" -H "Authorization: Bearer $MODERATOR_TOKEN" -H 'Content-Type: application/json' -d '{"id":"REPORT_UUID","status":"UNDER_REVIEW","statusUpdate":"The review team is assessing this concern."}'
```

## Privacy and security design
- No report accounts, names, emails, or reporter identity columns.
- Case codes use cryptographically secure random bytes; raw values are returned only once and never stored.
- Only SHA-256 case-code digests are stored.
- Public tracking excludes descriptions and evidence URLs.
- Moderator endpoints check the bearer token on the server.
- The Supabase service-role key is only used by serverless functions; never put it in browser code.
- Schema enables Row Level Security and revokes direct access from `anon` and `authenticated` roles.
- The application intentionally has no IP/fingerprint fields.

## HTTP behavior
- `201` created; `200` success; `400` invalid input; `401` missing/invalid moderator token; `404` missing case/report; `405` wrong method (with Allow header); `503` missing environment configuration; `502` database upstream error.

## Assumptions and limitations
A case code is a bearer secret: someone who obtains it can see status and public updates. Status updates are reporter-visible; avoid internal deliberation or personal data. Hosting providers may retain operational logs, so the product does not promise absolute anonymity. Evidence is an optional external HTTP(S) reference, not a file upload. Shared-token authentication is a simple recruitment-task solution; real high-risk usage should add rate limits, abuse controls, audit trails, stronger moderator identity management, encryption planning and incident response. This is not an emergency service.

## Deployment verification checklist
- [ ] Run Supabase migration.
- [ ] Set Vercel env vars and deploy.
- [ ] Health endpoint returns 200.
- [ ] Create valid report (201), keep returned case code and track its status.
- [ ] Public response never returns report description/evidence URL.
- [ ] Malformed case code returns 400; unknown well-formed code returns 404.
- [ ] Invalid category/description/evidence URL returns 400.
- [ ] Moderator APIs reject missing/wrong tokens with 401.
- [ ] Authenticated moderator list, filters, status update and public status tracking work.
- [ ] Check mobile/desktop UI and add screenshots to repository before submission.

## Structure
```text
api/_lib.js
api/health.js
api/reports.js
api/moderator/reports.js
migrations/001_reports.sql
public/index.html
public/styles.css
public/app.js
public/moderator/index.html
public/moderator.css
public/moderator.js
tests/api.test.js
.env.example
vercel.json
README.md
```
