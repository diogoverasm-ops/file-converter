# How to fix YouTube 429 errors on Render

When the backend runs on a cloud server (Render, Fly, AWS, etc.), YouTube
blocks most requests with HTTP 429 ("Too Many Requests") because it
distrusts datacenter IPs. The fix is to send your YouTube cookies along
with each request so YouTube treats the call as a logged-in user.

## Step 1 — Create a throwaway Google account (recommended)

Cookies act like a session: anyone with them can pose as that account in
YouTube's eyes. Create a separate Google account just for this so your
main account isn't exposed if something leaks.

## Step 2 — Install a cookie export extension on desktop Chrome

Open Chrome on your computer (not phone) and install one of these:

- [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookies-txt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
- or **EditThisCookie** (similar)

## Step 3 — Sign in to YouTube and export cookies

1. Sign in to https://www.youtube.com with the throwaway account.
2. Click the extension icon while on youtube.com.
3. Choose **Export → JSON**. Save the file.

The exported file is a JSON array that looks like:

```json
[
  { "name": "VISITOR_INFO1_LIVE", "value": "...", "domain": ".youtube.com", ... },
  { "name": "LOGIN_INFO", "value": "...", "domain": ".youtube.com", ... },
  ...
]
```

## Step 4 — Add the cookies as a Render environment variable

1. Open the Render dashboard → your **file-converter-mobile** service.
2. Click **Environment** in the left sidebar.
3. Click **Add Environment Variable**.
4. Set:
   - **Key:** `YT_COOKIES`
   - **Value:** paste the entire JSON array (everything from `[` to `]`)
5. Click **Save Changes**. Render will redeploy automatically (~2 min).

## Step 5 — Try a download again

Open the PWA on your phone and try downloading. The 429 should be gone.

## Notes

- Cookies expire. If 429 returns weeks later, repeat steps 3 + 4.
- Never share your cookies. They authenticate you to YouTube.
- If a video is age-restricted or region-locked, the cookies' account
  must be able to view it.
