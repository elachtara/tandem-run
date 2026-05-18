#!/usr/bin/env node

/**
 * Tandem Run — Route Detail Page Generator (v2)
 *
 * Reads a CSV of routes and a nested folder of .gpx files, produces an
 * HTML detail page per route ready to deploy to GitHub Pages.
 *
 * Uses only Node.js built-ins. No `npm install` required.
 *
 * USAGE:
 *   node generate-routes.js
 *
 * EXPECTED INPUT STRUCTURE:
 *   /this-folder/
 *     generate-routes.js       (this file)
 *     template.html            (the HTML template)
 *     routes.csv               (your spreadsheet, exported as CSV)
 *     gpx/                     (root of nested gpx folders)
 *       Boston/
 *         West Roxbury/
 *           Millennium Park.gpx
 *         Hyde Park/
 *           Millennium Park.gpx     (identical copy is fine)
 *       Inner Suburbs/
 *         Newton/
 *           Heartbreak Hill.gpx
 *       ...
 *
 * OUTPUT:
 *   output/
 *     routes/
 *       millennium-park/
 *         index.html
 *         route.gpx
 *       millennium-park-hyde-park/
 *         index.html
 *         route.gpx
 *       heartbreak-hill/
 *         index.html
 *         route.gpx
 *       ...
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// CONFIG
// ============================================================

const CSV_PATH = path.join(__dirname, 'routes.csv');
const TEMPLATE_PATH = path.join(__dirname, 'template.html');
const ROUTES_INDEX_TEMPLATE_PATH = path.join(__dirname, 'routes-index-template.html');
const GPX_FOLDER = path.join(__dirname, 'gpx');
// Output goes directly to the repo's /routes/ folder for deployment.
// __dirname is .../tandem-run/assets/route_builder, so we walk up two levels.
const OUTPUT_FOLDER = path.join(__dirname, '..', '..', 'routes');

// ============================================================
// HELPERS
// ============================================================

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function readCsv(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').replace(/^"|"$/g, ''); });
    return row;
  });
}

function shortStartingPoint(full) {
  if (!full) return '';
  const cleaned = full.replace(/^"|"$/g, '').trim();
  const firstChunk = cleaned.split(/\s+·\s+|,\s+/)[0];
  return firstChunk.length > 40 ? firstChunk.slice(0, 37) + '...' : firstChunk;
}

/**
 * Recursively walk the gpx folder and build an index of every .gpx file.
 * Returns an array of { absolutePath, fileName, stemName, parentFolder, grandparentFolder }
 *   - fileName: "Heartbreak Hill.gpx"
 *   - stemName: "Heartbreak Hill"
 *   - parentFolder: "Newton" (the neighborhood)
 *   - grandparentFolder: "Inner Suburbs" (the area)
 */
function indexGpxFiles(rootFolder) {
  const index = [];
  if (!fs.existsSync(rootFolder)) return index;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // skip .DS_Store etc.

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.toLowerCase().endsWith('.gpx')) {
        index.push({
          absolutePath: fullPath,
          fileName: entry.name,
          stemName: entry.name.replace(/\.gpx$/i, ''),
          parentFolder: path.basename(dir),
          grandparentFolder: path.basename(path.dirname(dir)),
        });
      }
    }
  }

  walk(rootFolder);
  return index;
}

/**
 * Find a .gpx file matching the route. Since identical-name files in
 * different neighborhoods are duplicates of the same route, any match works.
 *
 * Match strategy:
 *   1. Exact filename + matching neighborhood folder (most specific)
 *   2. Case-insensitive filename + matching neighborhood folder
 *   3. Exact filename in ANY folder (duplicates are identical)
 *   4. Case-insensitive filename in any folder
 *   5. Partial filename match (last resort)
 */
function findGpxFile(gpxIndex, routeName, neighborhood) {
  const rn = routeName.toLowerCase();
  const nb = (neighborhood || '').toLowerCase();

  let match = gpxIndex.find(g =>
    g.stemName === routeName && g.parentFolder.toLowerCase() === nb
  );
  if (match) return match;

  match = gpxIndex.find(g =>
    g.stemName.toLowerCase() === rn && g.parentFolder.toLowerCase() === nb
  );
  if (match) return match;

  match = gpxIndex.find(g => g.stemName === routeName);
  if (match) return match;

  match = gpxIndex.find(g => g.stemName.toLowerCase() === rn);
  if (match) return match;

  match = gpxIndex.find(g => {
    const stem = g.stemName.toLowerCase();
    return stem.includes(rn) || rn.includes(stem);
  });

  return match || null;
}

function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return vars[key] !== undefined ? vars[key] : '';
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render /routes/index.html, the overview map listing every route exactly once.
 *
 * Routes that share a name across multiple neighborhoods (Millennium Park,
 * Chestnut Hill Reservation, Franklin Park, Southwest Corridor Park) use the
 * same gpx file, so we keep only the first occurrence — drawing the same
 * polyline twice would be visual noise.
 *
 * The template gets two substitutions: {{ROUTES_DATA}} (JSON array of
 * { slug, name, distance }) and {{ROUTE_COUNT}} (number of unique routes).
 */
function writeRoutesOverview(generatedRoutes) {
  if (!fs.existsSync(ROUTES_INDEX_TEMPLATE_PATH)) {
    console.log(`\n⚠️  routes-index-template.html not found — skipped writing /routes/index.html`);
    return;
  }

  const seen = new Set();
  const unique = [];
  let droppedDuplicates = 0;
  for (const route of generatedRoutes) {
    if (!route.hasGpx) continue; // a route with no map can't render a polyline
    if (seen.has(route.name)) {
      droppedDuplicates++;
      continue;
    }
    seen.add(route.name);
    unique.push({ slug: route.slug, name: route.name, distance: route.distance });
  }

  const template = fs.readFileSync(ROUTES_INDEX_TEMPLATE_PATH, 'utf8');
  // JSON.stringify is safe to drop into a JS literal — no `</script>` concerns
  // because the route fields are plain strings from the CSV.
  const json = JSON.stringify(unique, null, 2);
  const html = template
    .replace('{{ROUTES_DATA}}', json)
    .replace(/\{\{ROUTE_COUNT\}\}/g, String(unique.length));

  fs.writeFileSync(path.join(OUTPUT_FOLDER, 'index.html'), html);
  console.log(
    `\n🗺  Overview /routes/index.html written: ${unique.length} unique routes` +
    (droppedDuplicates ? ` (deduped ${droppedDuplicates} duplicate-name entries)` : '')
  );
}

// ============================================================
// MAIN
// ============================================================

function main() {
  console.log('\n🏃‍♀️ Tandem Run · Route Page Generator (v2 — nested folders)\n');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV not found at: ${CSV_PATH}`);
    console.error('   Export your spreadsheet as CSV and save it as "routes.csv" next to this script.');
    process.exit(1);
  }
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`❌ Template not found at: ${TEMPLATE_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(GPX_FOLDER)) {
    console.error(`❌ GPX folder not found at: ${GPX_FOLDER}`);
    console.error('   Create a "gpx" folder with your nested area/neighborhood structure inside.');
    process.exit(1);
  }

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const rows = readCsv(CSV_PATH);

  console.log('Scanning gpx/ folder recursively...');
  const gpxIndex = indexGpxFiles(GPX_FOLDER);
  console.log(`Found ${gpxIndex.length} .gpx files across nested folders.`);
  console.log(`Found ${rows.length} routes in CSV.\n`);

  fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });

  // Pre-count name occurrences so duplicate-name routes can be disambiguated
  // by neighborhood even on their first occurrence. This matches the CSV's
  // map_link convention where every duplicate row carries a neighborhood
  // suffix (e.g. millennium-park-west-roxbury, not millennium-park).
  const nameCounts = {};
  for (const r of rows) {
    const n = (r.name || '').trim();
    if (n) nameCounts[n] = (nameCounts[n] || 0) + 1;
  }

  const slugCounts = {};
  let generated = 0;
  let skipped = 0;
  const warnings = [];
  const generatedRoutes = []; // collected for the overview /routes/index.html

  for (const row of rows) {
    const name = (row.name || '').trim();
    if (!name) {
      warnings.push('Skipped a row with no name');
      skipped++;
      continue;
    }

    let slug = slugify(name);
    if (nameCounts[name] > 1) {
      // Name appears more than once — always append neighborhood (including
      // on the first occurrence) so every slug is unique. Fall back to a
      // number suffix if the neighborhood is blank.
      slugCounts[slug] = (slugCounts[slug] || 0) + 1;
      const neighborhoodSlug = slugify(row.neighborhood || '');
      slug = `${slug}-${neighborhoodSlug || slugCounts[slug]}`;
    }

    const gpx = findGpxFile(gpxIndex, name, row.neighborhood);
    if (!gpx) {
      warnings.push(`⚠️  No .gpx file found for "${name}" (neighborhood: ${row.neighborhood || 'none'}) — page will still generate, map will show "unavailable"`);
    }

    const routeDir = path.join(OUTPUT_FOLDER, slug);
    fs.mkdirSync(routeDir, { recursive: true });

    if (gpx) {
      fs.copyFileSync(gpx.absolutePath, path.join(routeDir, 'route.gpx'));
    }

    const vars = {
      NAME: escapeHtml(name),
      NEIGHBORHOOD: escapeHtml(row.neighborhood || 'Boston'),
      DISTANCE: escapeHtml(row.distance_miles || ''),
      DESCRIPTION: escapeHtml(row.description || ''),
      STARTING_POINT: escapeHtml(row.starting_point || ''),
      STARTING_SHORT: escapeHtml(shortStartingPoint(row.starting_point)),
      GPX_FILE: gpx ? 'route.gpx' : '',
    };

    const html = renderTemplate(template, vars);
    fs.writeFileSync(path.join(routeDir, 'index.html'), html);

    generatedRoutes.push({
      name,
      slug,
      neighborhood: row.neighborhood || '',
      distance: row.distance_miles || '',
      hasGpx: !!gpx,
    });

    const gpxInfo = gpx
      ? ` (gpx: ${gpx.grandparentFolder}/${gpx.parentFolder}/${gpx.fileName})`
      : ' (no gpx)';
    console.log(`  ✓ /routes/${slug}/${gpxInfo}`);
    generated++;
  }

  // Write the overview /routes/index.html after all detail pages.
  writeRoutesOverview(generatedRoutes);

  console.log(`\n✓ Generated ${generated} route pages.`);
  if (skipped > 0) console.log(`  Skipped: ${skipped}`);

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log(`  ${w}`));
  }

  console.log(`\n📁 Output: ${OUTPUT_FOLDER}\n`);
  console.log('Next steps:');
  console.log('  1. Open output/routes/ and spot-check one of the pages in a browser');
  console.log('  2. Copy the contents of output/routes/ into your tandem-run repo at /routes/');
  console.log('  3. Commit and push — GitHub Pages will deploy automatically');
  console.log('  4. Update map_link in your Supabase routes table:');
  console.log('     https://tandemrun.app/routes/<slug>/\n');
}

try {
  main();
} catch (err) {
  console.error('\n❌ Generator failed:', err.message);
  console.error(err.stack);
  process.exit(1);
}
