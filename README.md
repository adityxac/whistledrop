# WhistleDrop — Browser-local demo

A polished demo of report submission, private case-code generation, case-status lookup, and moderator review for the GDG on Campus SRM recruitment task.

## Stack
- GitHub: source code and version history.
- Vercel: static frontend hosting.
- Browser `localStorage`: demo reports and moderator updates.
- No database service or runtime secrets are required for the demo.

## Important limitations
- Reports live only in the browser profile that submitted them. They are not shared across devices, browsers, or private sessions.
- Clearing site data can permanently delete reports.
- The moderator access code is `DEMO`. It is a client-side demonstration gate, not real authentication.
- Do not enter real confidential, sensitive, or identifying information. Browser storage is not encrypted by this app.

## Try it
1. Open the deployed site in a normal browser window.
2. Submit a report with a category and a description between 20 and 5,000 characters.
3. Copy the generated case code.
4. Use the tracking form in the same browser to view status.
5. Open `/moderator/` in the same browser and enter `DEMO`.
6. Change status and add a public update, then look up the report again.

## Categories and statuses
Categories: `security`, `harassment`, `corruption`, `technical`, `other`.
Statuses: `SUBMITTED`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`.

## Local checks
```sh
npm test
npm run check
```

## API
The previous database-backed report endpoints are disabled and return HTTP 410. `/api/health` reports `mode: browser-local-demo` and `databaseRequired: false`. The active submission, tracking, and moderator demo flows use localStorage in the browser.

## Project structure
```text
api/
public/index.html
public/styles.css
public/app.js
public/moderator/index.html
public/moderator.css
public/moderator.js
tests/api.test.js
vercel.json
README.md
```
