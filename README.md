# Tandem Run

**Find your perfect running partner in Boston.**

Tandem Run is a 1-on-1 running and walking partner app launching in Boston, June 2026. This repository contains the waitlist landing page.

---

## About

Most running apps are built for groups or solo tracking. Tandem Run is built for two — matching people by pace, schedule, neighborhood, and vibe so they can actually show up together, week after week.

Tandem Run is for runners, walkers, and everyone in between. It's built with accessibility at its core — supporting guide running, mixed-ability pairs, and wheelchair users from day one.

---

## This repo

This is a single-page static site for the pre-launch waitlist. It collects:

- Name and email
- Pace range
- Preferred run time
- Boston / Cambridge / Somerville neighborhood

Signups are sent to a Google Sheet via a Google Apps Script web app.

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/tandem-run.git
cd tandem-run
```

### 2. Connect the form to Google Sheets

1. Create a new Google Sheet
2. Go to **Extensions → Apps Script** and paste the script below
3. Deploy as a **Web App** (Execute as: Me, Access: Anyone)
4. Copy the deployment URL
5. In `index.html`, find `YOUR_APPS_SCRIPT_URL_HERE` and replace it with your URL

**Apps Script:**

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Pace', 'Preferred time', 'Neighborhood', 'Source']);
  }

  sheet.appendRow([
    new Date().toLocaleString(),
    data.name || '',
    data.email || '',
    data.pace || '',
    data.time || '',
    data.neighborhood || '',
    data.source || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3. Deploy via GitHub Pages

1. Push your changes to the `main` branch
2. Go to **Settings → Pages**
3. Set source to: `Deploy from a branch → main → / (root)`
4. Your site will be live at `https://YOUR_USERNAME.github.io/tandem-run`

### 4. Connect a custom domain (optional)

1. Register `tandem.run` at your domain registrar
2. In GitHub Pages settings, add your custom domain
3. Update your DNS records to point to GitHub Pages
4. Enable **Enforce HTTPS**

---

## Stack

- Plain HTML, CSS, JavaScript — no frameworks, no build step
- [Leaflet.js](https://leafletjs.com/) for the Boston map
- [CartoDB Dark Matter](https://carto.com/basemaps/) map tiles
- [Google Fonts](https://fonts.google.com/) — Fraunces, DM Sans, Lora
- Google Apps Script for form submissions

---

## Launch

Boston · June 2026

---

*Built by [Your Name]. Questions? hello@tandem.run*
