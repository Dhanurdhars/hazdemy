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

### Step 5: Optional Google Analytics

1. The site's Measurement ID, `G-PP70XTSPMM`, is already in the code (`src/lib/consent.js`). It's used in deployed builds only, so local testing with `npm run dev` doesn't add visits to your reports.
2. To use a different GA4 property, set the environment variable `VITE_GA_MEASUREMENT_ID` in Vercel and redeploy. The ID is built into the website, so a change only takes effect after a new deployment. Setting it locally in `.env.local` turns analytics on in `npm run dev` too.
3. Analytics loads only for visitors who allow it in the cookie banner ("Accept all", or the **Analytics** switch under "Customize").
4. Page views are recorded as visitors move between pages. This relies on GA4's enhanced measurement setting "Page changes based on browser history events", which is on by default; you'll find it under **Admin → Data streams → your stream → Enhanced measurement**. To check, accept cookies on the live site, click through a few pages, and watch them appear in **Reports → Realtime**.
5. Each enquiry sent is recorded as a `generate_lead` event. To count enquiries as conversions, open **Admin → Events** in Google Analytics and mark `generate_lead` as a key event.

### Step 6: Optional analytics report in /admin

The **Website analytics** tab in `/admin` shows visitors, page views, enquiries sent, top pages and courses, traffic sources, countries and devices for the last 7, 28 or 90 days. To fill it, give the site read-only access to your GA4 property:

1. In [Google Cloud Console](https://console.cloud.google.com), create or pick a project and enable the **Google Analytics Data API**.
2. Under **IAM & Admin → Service accounts**, create a service account (it needs no roles), then open **Keys → Add key → JSON**. A key file downloads. Keep it private.
3. In Google Analytics, open **Admin → Property access management** and add the service account's email (ending in `iam.gserviceaccount.com`) as a **Viewer**.
4. Copy the **Property ID** (a number, not the `G-…` Measurement ID) from **Admin → Property details**.
5. In Vercel, add `GA_PROPERTY_ID` (that number) and `GA_SERVICE_ACCOUNT_JSON` (the whole key file, pasted as is), then redeploy.

Until these are set, the tab shows these steps. The numbers include only visitors who allowed analytics cookies, and the server caches them for 5 minutes. **Refresh** fetches fresh numbers.

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
- **Spam protection:** the contact form and the API run the same checks (`lib/validate.js`):

  | Field | Refused |
  |---|---|
  | First and last name | "test", "fake", "asdf", "aaaa", keyboard mashing like "sdfghjk", names with numbers or links |
  | Work email | Personal addresses (Gmail, Yahoo, Outlook, Hotmail and others), about 100 throwaway inbox providers (Mailinator, YOPmail, 10minutemail …), sample addresses like test@… or x@example.com, and domains that don't exist or can't receive mail |
  | Phone | Fewer than 7 or more than 15 digits, 0000000, 1234567 |
  | Company and messages | Website links, HTML code, and spam words like SEO, casino or crypto |
  | Bots | A hidden trap field, or a form sent less than 3 seconds after the page opened. These are quietly thrown away, so the bot thinks it worked. |
  | Repeats | More than 3 enquiries a day from one email, or more than 5 every 10 minutes from one visitor |

  The API also requires a signed, single-use form token, quietly ignores exact repeats within a day, and stops anyone making more than 20 attempts in 10 minutes. Failed attempts don't count toward the limits above, so people who fix a mistake aren't locked out (`lib/spam.js`). Optional settings: `FORM_SECRET`, a long random string for signing form tokens (by default one is derived from your other secrets), and `EMAIL_DNS_CHECK=false`, which turns off the email-domain check. Security headers are set in `vercel.json`.
- **Personal data:** enquiries contain personal details. Keep the Vercel project and the Upstash database private to your team.
