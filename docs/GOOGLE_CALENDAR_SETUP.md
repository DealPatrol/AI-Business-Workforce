# Google Calendar sync: create the OAuth client (free, ~15 minutes)

Ava's two-way Google Calendar sync stays hidden until two env vars exist. This doc covers creating them in Google Cloud.
It costs nothing: the Calendar API is free, and there's no billing account.

What the owner gets once it's on: a **Connect Google Calendar** button on the Desk booking panel. After they connect,
1. Ava's open windows skip any time the owner's Google Calendar shows as busy (freeBusy), and
2. every booking Ava makes becomes an event on their primary Google Calendar ("Ava booked: name – issue",
   with the address, callback number and issue). Ava's events are created as **"show as free"**, so they don't come back as
   busy time and double-block a window Ava already counts.

If Google is slow (over 2.5 s) or down during a call, Ava falls back to her own calendar and the call goes on as usual.

---

## 1. Create a project
1. Go to https://console.cloud.google.com/ and sign in as the Google account that should own the app
   (for example the Front Porch Growth Workspace admin).
2. Use the project picker (top bar) → **New project**. Name it `Executive Receptionist`, then **Create**, and select it.

## 2. Turn on the Calendar API
1. Go to https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
2. Click **Enable**.

## 3. Consent screen (Google Auth Platform)
1. Go to https://console.cloud.google.com/auth/overview → **Get started**.
2. **App information**: App name `Executive Receptionist`; User support email: Cole's address.
3. **Audience**: choose **External** (customers use their own Google accounts).
4. **Contact information**: Cole's email. Agree to the policy, then **Create**.
5. **Branding** (https://console.cloud.google.com/auth/branding):
   - App home page `https://executivereceptionist.com`
   - Privacy policy `https://executivereceptionist.com/privacy`
   - Terms `https://executivereceptionist.com/terms`
   - Authorized domains: `executivereceptionist.com` (add `frontporchgrowth.com` too if owners also sign in there).
6. **Data Access** (https://console.cloud.google.com/auth/scopes) → **Add or remove scopes** and add exactly these two
   (paste them in "Manually add scopes"):
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.freebusy`

   Both are "sensitive" (not "restricted"): no security assessment, just Google's app verification (step 6).

## 4. Create the OAuth client
1. Go to https://console.cloud.google.com/auth/clients → **Create client**.
2. Application type: **Web application**. Name: `Ava Desk`.
3. **Authorized redirect URIs**: add one per host owners use for the Desk:
   - `https://executivereceptionist.com/api/desk/google/callback`
   - `https://frontporchgrowth.com/api/desk/google/callback`
   - optional, for testing on the preview branch:
     `https://ai-business-workforce-git-design-b47485-coles-projects-9e3181f8.vercel.app/api/desk/google/callback`

   The app sends this deployment's own origin + `/api/desk/google/callback`, unless `GOOGLE_CALENDAR_REDIRECT_URI` is set.
   That URI must match one on this list character for character.
4. Click **Create**. Copy the **Client ID** and **Client secret**. The secret is shown in full only once, so download the
   JSON or store it in a password manager.

## 5. Put the values in Vercel (project `ai-business-workforce`)
Add these in Settings → Environment Variables. Use Preview first if you want to test on the preview branch, then Production.

| Name | Value |
|---|---|
| `GOOGLE_CALENDAR_CLIENT_ID` | the Client ID (`…apps.googleusercontent.com`) |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | the Client secret |
| `AVA_TOKEN_ENCRYPTION_KEY` | a new random value (`openssl rand -base64 48`). Encrypts stored Google refresh tokens. **Set it once and never rotate it casually**: changing it disconnects every owner. |
| `GOOGLE_CALENDAR_REDIRECT_URI` | optional; only to force one callback URL |

Redeploy. The Connect button appears on the Desk booking panel (home-service plans, non-demo calendars).

## 6. Testing vs. Production status (important)
- While the app is in **Testing** (Audience page), only the Google accounts listed under **Test users** can connect
  (up to 100). Their connection **expires after 7 days** (a Google rule for Testing apps), and they'd need to reconnect.
  Add Cole's own Google account as a test user to try it.
- For real customers: Audience → **Publish app** (to "In production"). Without verification, owners see a
  "Google hasn't verified this app" screen (they can click Advanced → continue), and you're capped at 100 users.
- To remove that screen: Verification Center (https://console.cloud.google.com/auth/verification) → submit.
  For these two sensitive scopes, Google asks for:
  - verified branding (domain ownership in Search Console)
  - a one-line justification per scope
  - an unlisted YouTube video of the connect flow

  It typically takes a few business days. Suggested justifications:
  - `calendar.freebusy`: "Read only the owner's busy time ranges so the AI receptionist never offers a callback
    window that conflicts with the owner's schedule. No event titles or details are read."
  - `calendar.events`: "Create one event on the owner's calendar for each appointment the AI receptionist books
    by phone, so the owner sees it alongside their other jobs."

## 7. Check it
1. Sign in to the Desk as an owner whose booking calendar is on, then click **Connect Google Calendar** and allow both permissions.
2. The Desk shows "Google Calendar connected."
3. Put a 9–11 AM "busy" event on that Google Calendar for tomorrow. Ava's check_availability for tomorrow
   morning should no longer offer the 8–10 or 10–12 windows.
4. Book a window through Ava (a test call). The booking shows on the Desk with an **On Google** tag, and the event
   appears in Google Calendar as "Ava booked: …".
5. **Disconnect** on the Desk revokes the token. Events already created stay on the calendar.
