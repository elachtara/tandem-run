# Tandem Run · Route Page Generator (v2)

A small tool that turns your spreadsheet of routes + your Drive folder of .gpx files into 12+ ready-to-publish HTML detail pages.

**v2** reads your existing nested `Area/Neighborhood/Route.gpx` folder structure directly — no flattening required.

## What it produces

For each route in your CSV, you get a polished, brand-aligned detail page:

- Hero with route name, neighborhood, and short description
- Two highlight cards: **Distance** and **Starting point**
- Interactive Leaflet map showing the .gpx route line in gold with a green starting dot
- "Where you'll meet" section with the full starting point and a matching green dot
- CTA section linking to `app.tandemrun.app/signup`
- Mobile-first, brand colors (navy/gold/cream), Playfair Display + Inter fonts

Each page is a single, self-contained HTML file with a copy of its `.gpx` file alongside. No build step, no JavaScript framework. Drops directly into your existing GitHub Pages site.

## Setup (one-time, ~10 minutes)

You need Node.js installed (v18+). Check with:

```bash
node --version
```

If not installed, download from nodejs.org.

## Folder structure to create

Put everything in one folder (e.g., `~/Desktop/route-builder/`):

```
route-builder/
├── generate-routes.js     ← the generator
├── template.html          ← the HTML template
├── routes.csv             ← export your spreadsheet here
└── gpx/                   ← root of your nested .gpx folders
    ├── Boston/
    │   ├── West Roxbury/
    │   │   └── Millennium Park.gpx
    │   ├── Hyde Park/
    │   │   └── Millennium Park.gpx     (identical copy is fine)
    │   └── Brighton/
    │       └── Chestnut Hill Reservation.gpx
    ├── Cambridge/
    │   └── ...
    ├── Inner Suburbs/
    │   ├── Newton/
    │   │   └── Heartbreak Hill.gpx
    │   └── Brookline/
    │       └── Chestnut Hill Reservation.gpx
    └── South Shore/
        └── ...
```

The script recursively walks every folder under `gpx/` and finds matching .gpx files by name + neighborhood.

## How to export your spreadsheet to CSV

From Google Sheets:
1. File → Download → Comma-separated values (.csv)
2. Save as `routes.csv` in the `route-builder` folder

Required columns: `name`, `neighborhood`, `distance_miles`, `description`, `starting_point`. Other columns (`id`, `map_link`, etc.) are ignored.

## How to copy .gpx files from Drive

Since you already have the nested folder structure in Drive at `Technology/App/Routes/`:

1. In Drive, right-click the `Routes` folder → **Download**
2. Drive gives you a `.zip` of the whole folder tree
3. Unzip it
4. Rename the resulting folder from `Routes` (or whatever Drive named it) to `gpx`
5. Place it inside `route-builder/`

The full nested structure (`Boston/West Roxbury/Millennium Park.gpx` etc.) gets preserved automatically.

## Running the generator

From the `route-builder` folder:

```bash
node generate-routes.js
```

You'll see output like:

```
🏃‍♀️ Tandem Run · Route Page Generator (v2 — nested folders)

Scanning gpx/ folder recursively...
Found 12 .gpx files across nested folders.
Found 12 routes in CSV.

  ✓ /routes/heartbreak-hill/ (gpx: Inner Suburbs/Newton/Heartbreak Hill.gpx)
  ✓ /routes/chestnut-hill-reservation/ (gpx: Boston/Brighton/Chestnut Hill Reservation.gpx)
  ✓ /routes/chestnut-hill-reservation-brookline/ (gpx: Inner Suburbs/Brookline/Chestnut Hill Reservation.gpx)
  ✓ /routes/millennium-park/ (gpx: Boston/West Roxbury/Millennium Park.gpx)
  ✓ /routes/millennium-park-hyde-park/ (gpx: Boston/Hyde Park/Millennium Park.gpx)
  ...

✓ Generated 12 route pages.

📁 Output: /Users/you/route-builder/output/routes
```

Each line tells you exactly which .gpx file was matched to that page — useful for spot-checking when you have duplicates.

## Handling duplicate route names

Your CSV has the same route in multiple neighborhood rows (Chestnut Hill Reservation × 3, Millennium Park × 3). The script handles this automatically:

- The **first** row for a name gets the clean slug (`chestnut-hill-reservation`)
- Subsequent rows get the neighborhood appended (`chestnut-hill-reservation-newton`, `chestnut-hill-reservation-brookline`)

Each duplicate gets its own page with the matching neighborhood's .gpx file (which are identical anyway since you confirmed all duplicates are the same route).

## Spot-check before deploying

Open a generated page in your browser:

```bash
open output/routes/heartbreak-hill/index.html
```

You should see:
- Navy headline with the route name, neighborhood eyebrow above
- Two highlight cards (distance + starting point)
- An interactive Leaflet map with a gold route line and a green starting dot
- A "Where you'll meet" section with the full starting point
- A navy CTA card with "Apply for a match" button

If the map shows "Route preview unavailable", the .gpx file wasn't found or couldn't be parsed. Check the warnings in the generator output.

## Deploying to GitHub Pages

Copy the contents of `output/routes/` into your existing `tandem-run` GitHub Pages repo:

```bash
# Adjust paths to your local setup
cp -r output/routes/* ~/Code/tandem-run/routes/
cd ~/Code/tandem-run
git add routes/
git commit -m "Add route detail pages"
git push
```

GitHub Pages auto-deploys. Within a minute, pages are live at `https://tandemrun.app/routes/<slug>/`.

## Updating Supabase

Once the pages are live, fill in the `map_link` column in your Supabase `routes` table. The pattern is:

```
https://tandemrun.app/routes/<slug>/
```

Copy the slugs from the generator's output. The order matches your CSV, so it's quick.

## When to re-run

Re-run the script anytime you:

- Add a new route (add a CSV row + drop a .gpx file in the right nested folder)
- Change a route's description, starting point, or distance
- Tweak the template's design

The script is idempotent — running it twice produces the same output. After re-running, just re-copy `output/routes/*` into your marketing repo and push.

## Troubleshooting

**"No .gpx file found for [route name] (neighborhood: ...)"**

Check that:
- The filename matches the `name` column exactly (case-sensitive)
- The .gpx file is in a folder named after the neighborhood (or any neighborhood — the script will fall back to name-only matching)
- The folder isn't accidentally inside another folder (e.g., `gpx/Boston/Boston/...`)

The page still generates — the map just shows "Route preview unavailable" until you fix the file.

**Map shows "Route preview unavailable"**

The .gpx file exists but the script couldn't extract route points. Open it in a text editor — there should be `<trkpt>` or `<rtept>` elements with `lat` and `lon` attributes. If the file is malformed, re-export from your source app.

**Pages look broken after deploying**

GitHub Pages caches aggressively. Hard-refresh (Cmd+Shift+R / Ctrl+Shift+R) or wait 5 minutes for cache to bust.

**Hidden .DS_Store files breaking the scan**

The script skips any file or folder starting with `.` so macOS metadata files won't cause issues. If you see weird scanning behavior, you may have accidentally created a folder named after something the script can't read — check `gpx/` for anything that doesn't look like a real area or neighborhood.
