# Hazdemy Learning: deploys to Vercel in one import

The website is built with React and Vite, and the backend is a set of Vercel serverless functions. Both live in this one repository, and a single Vercel **Import** deploys them together.

```
/            React website (globe home page, 98 courses, course pages, learning paths, chatbot, contact, /admin)
├── api/     Backend (each file becomes a URL on Vercel automatically)
│   ├── courses.js          GET  /api/courses           course catalogue
│   ├── enquiries.js        POST /api/enquiries         contact form + "Ask for details"
│   ├── health.js           GET  /api/health            status check
│   └── admin/
│       ├── enquiries.js    GET/PATCH /api/admin/enquiries   list, update status, ?format=csv
│       └── import.js       POST /api/admin/import           upload the course sheet (.xlsx)
├── lib/     Shared backend code (storage, email, sheet import, validation)
├── src/     React source
└── vercel.json
```

---

## Deploy on Vercel

### Step 1: Import the repository

1. Go to **https://vercel.com** and sign in with GitHub.
2. Click **Add New… → Project**. Find **hazdemy-app** and click **Import**.
3. Leave all the settings as they are. Vercel reads them from `vercel.json`.
4. Click **Deploy**.

The website is now live at `https://your-project.vercel.app`.

### Step 2: Turn on saving enquiries (free)

1. In your Vercel project, open the **Storage** tab.
2. Click **Create Database**, choose **Upstash → Redis** and pick the free plan.
3. When asked, connect it to this project. Vercel adds the connection settings automatically.

### Step 3: Set the admin password

1. Go to **Settings → Environment Variables**.
2. Add `ADMIN_PASSWORD`, with a long password you choose, and save.
3. Go to **Deployments**, open the **⋯** menu on the latest deployment and click **Redeploy**.

### Step 4: Optional email notifications

Add these environment variables, then redeploy:

| Name | Example |
|---|---|
| `SMTP_HOST` | `smtp.office365.com`, or `smtp.gmail.com` for Google Workspace (use an App Password) |
| `SMTP_PORT` | `587`, or `465` for Gmail |
| `SMTP_SECURE` | `false`, or `true` for port 465 |
| `SMTP_USER` | `website@hazdemy.com` |
| `SMTP_PASS` | the mailbox password or app password |
| `MAIL_FROM` | `Hazdemy Website <website@hazdemy.com>` |
| `CONTACT_TO` | `training@hazdemy.com` |
| `SEND_CONFIRMATION` | `true`, to send visitors an automatic "we received your request" email |

### Check that it's working

- Open `https://your-project.vercel.app/api/health`. It should show `"storage":"redis"` and `"admin":true`. The `"mail"` value shows `"ok"` once email is set up.
- Open `/admin` and sign in. Yellow notes at the top tell you if storage or email is still missing.

### Use your own domain

Under **Settings → Domains**, add a domain such as `new.hazdemy.com` and follow the DNS instructions. Moving `hazdemy.com` itself replaces your current website, so try a subdomain first.

---

## What works at each stage

| Setup | Website and chatbot | Enquiries | Admin and sheet upload |
|---|---|---|---|
| Just imported | ✅ | Opens the visitor's email app | — |
| + Upstash Redis + `ADMIN_PASSWORD` | ✅ | ✅ Saved and listed in `/admin` | ✅ |
| + SMTP | ✅ | ✅ Saved **and** emailed to the team | ✅ |

## Updating the courses

- **Easiest:** go to `/admin` and click **Upload course sheet (.xlsx)**. The site updates straight away, with no redeploy.
- **Or** run `npm run import -- "path/to/sheet.xlsx"`, then commit and push. Vercel redeploys automatically.

The import follows these rules:

- Every row with a **Course Description** is published, except rows marked **Retired**.
- **Status = Available** means "Available now". Anything else shows as "Coming soon".
- Only the green columns are used:
  - Product
  - Course Code
  - Course Name
  - Duration (days)
  - Course Description
  - Skill Level
  - Pre Reqs
  - Persona

## Run it on your computer (optional)

You need Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local    # set ADMIN_PASSWORD (Redis/SMTP optional locally)
npm run dev                   # website http://localhost:5173 + API http://localhost:3001
npm test                      # API tests
```

## Security

- **Passwords:** none are stored in the code. They live only in Vercel's Environment Variables, and `.env` and `.env.local` are excluded by `.gitignore`.
- **Admin access:** the admin endpoints refuse every request until `ADMIN_PASSWORD` is set, and they compare passwords securely.
- **Spam protection:** enquiries have a hidden spam-catching field and a limit of 5 per visitor every 10 minutes. Security headers are set in `vercel.json`.
- **Personal data:** enquiries contain personal details. Keep the Vercel project and the Upstash database private to your team.
