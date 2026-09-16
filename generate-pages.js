const fs = require("fs");
const path = require("path");

/*
|--------------------------------------------------------------------------
| PaycheckMint pSEO Page Generator
|--------------------------------------------------------------------------
|
| Generates:
|
| 1. State paycheck pages
|    /paycheck-calculator/california/
|
| 2. Hourly wage pages
|    /hourly-paycheck/20-dollars-an-hour/
|
| 3. sitemap.xml
|
| Total:
| 50 state pages + 15 hourly pages = 65 pSEO pages
|
|--------------------------------------------------------------------------
*/

/* -----------------------------------------------------------------------
   CONFIG
------------------------------------------------------------------------ */

const BASE_URL = (process.env.BASE_URL || "https://paymintcheck.vercel.app").replace(/\/$/, "");

const ROOT = __dirname;

const STATES_FILE = path.join(ROOT, "states.json");

const WAGES_FILE = path.join(ROOT, "wages.json");

const STATE_TEMPLATE_FILE = path.join(ROOT, "state-paycheck-template.html");

const HOURLY_TEMPLATE_FILE = path.join(ROOT, "hourly-paycheck-template.html");

const STATE_OUTPUT_DIR = path.join(ROOT, "paycheck-calculator");

const HOURLY_OUTPUT_DIR = path.join(ROOT, "hourly-paycheck");

const SITEMAP_FILE = path.join(ROOT, "sitemap.xml");

/* -----------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------------ */

function readJSON(file) {
    if (!fs.existsSync(file)) {
        throw new Error(`Missing file: ${file}`);
    }

    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        throw new Error(`Invalid JSON in ${file}: ${error.message}`);
    }
}

function readTemplate(file) {
    if (!fs.existsSync(file)) {
        throw new Error(`Missing template: ${file}`);
    }

    return fs.readFileSync(file, "utf8");
}

function ensureDir(dir) {
    fs.mkdirSync(dir, {
        recursive: true,
    });
}

function writeFile(file, content) {
    ensureDir(path.dirname(file));

    fs.writeFileSync(file, content, "utf8");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function money(value) {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/* -----------------------------------------------------------------------
   DELETE OLD GENERATED PAGES
------------------------------------------------------------------------ */

function deleteOldGeneratedPages() {
    console.log("");
    console.log("Cleaning old generated pages...");
    console.log("");

    if (fs.existsSync(STATE_OUTPUT_DIR)) {
        fs.rmSync(STATE_OUTPUT_DIR, {
            recursive: true,
            force: true,
        });

        console.log("Deleted: paycheck-calculator/");
    } else {
        console.log("No old state pages found.");
    }

    if (fs.existsSync(HOURLY_OUTPUT_DIR)) {
        fs.rmSync(HOURLY_OUTPUT_DIR, {
            recursive: true,
            force: true,
        });

        console.log("Deleted: hourly-paycheck/");
    } else {
        console.log("No old hourly pages found.");
    }

    console.log("");
}

/* -----------------------------------------------------------------------
   STATE SCHEMA
------------------------------------------------------------------------ */

function createStateSchema(state, canonical, title, description) {
    return JSON.stringify(
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: `${state.name} Paycheck Calculator 2026`,
            url: canonical,
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            description: description,
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
            },
        },
        null,
        2
    );
}

/* -----------------------------------------------------------------------
   STATE OPTION PLACEHOLDERS
------------------------------------------------------------------------ */

const STATE_ABBREVIATIONS = [
    "al",
    "ak",
    "az",
    "ar",
    "ca",
    "co",
    "ct",
    "de",
    "fl",
    "ga",
    "hi",
    "id",
    "il",
    "in",
    "ia",
    "ks",
    "ky",
    "la",
    "me",
    "md",
    "ma",
    "mi",
    "mn",
    "ms",
    "mo",
    "mt",
    "ne",
    "nv",
    "nh",
    "nj",
    "nm",
    "ny",
    "nc",
    "nd",
    "oh",
    "ok",
    "or",
    "pa",
    "ri",
    "sc",
    "sd",
    "tn",
    "tx",
    "ut",
    "vt",
    "va",
    "wa",
    "wv",
    "wi",
    "wy",
];

function replaceStateOptions(html, abbreviation) {
    for (const abbr of STATE_ABBREVIATIONS) {
        const placeholder = `{{STATE_${abbr.toUpperCase()}}}`;

        const value = abbr === abbreviation ? "selected" : "";

        html = html.replaceAll(placeholder, value);
    }

    return html;
}

/* -----------------------------------------------------------------------
   GENERATE STATE PAGES
------------------------------------------------------------------------ */

function generateStatePages(states, template) {
    console.log("Generating state pages...");

    let generated = 0;

    for (const state of states) {
        if (!state || !state.name || !state.slug || !state.abbreviation) {
            console.warn("Skipping invalid state:", state);

            continue;
        }

        const name = String(state.name).trim();

        const slug = String(state.slug).trim().toLowerCase();

        const abbreviation = String(state.abbreviation).trim().toLowerCase();

        const title = `${name} Paycheck Calculator 2026 | PaycheckMint`;

        const description = `Calculate your estimated ${name} paycheck for 2026. Estimate take-home pay after federal, Social Security, Medicare and ${name} taxes with PaycheckMint.`;

        const canonical = `${BASE_URL}/paycheck-calculator/${slug}/`;

        const schema = createStateSchema(state, canonical, title, description);

        let html = template;

        /* ----------------------------------------------------------------
           BASIC PLACEHOLDERS
        ---------------------------------------------------------------- */

        html = html.replaceAll("{{TITLE}}", escapeHtml(title));

        html = html.replaceAll("{{DESCRIPTION}}", escapeHtml(description));

        html = html.replaceAll("{{CANONICAL}}", canonical);

        html = html.replaceAll("{{STATE_NAME}}", escapeHtml(name));

        html = html.replaceAll("{{STATE_SLUG}}", escapeHtml(slug));

        html = html.replaceAll("{{STATE_ABBR}}", escapeHtml(abbreviation));

        html = html.replaceAll("{{SCHEMA}}", schema);

        /* ----------------------------------------------------------------
           STATE DROPDOWN
        ---------------------------------------------------------------- */

        html = replaceStateOptions(html, abbreviation);

        /* ----------------------------------------------------------------
           OUTPUT
        ---------------------------------------------------------------- */

        const outputDir = path.join(STATE_OUTPUT_DIR, slug);

        const outputFile = path.join(outputDir, "index.html");

        writeFile(outputFile, html);

        /* ----------------------------------------------------------------
           PLACEHOLDER CHECK
        ---------------------------------------------------------------- */

        const remaining = html.match(/{{[^{}]+}}/g);

        if (remaining) {
            console.warn(`WARNING: ${slug} contains unreplaced placeholders:`, remaining);
        }

        console.log(`✓ ${name}`);

        generated++;
    }

    console.log("");

    console.log(`Generated ${generated} state pages.`);

    console.log("");

    return generated;
}

/* -----------------------------------------------------------------------
   HOURLY PAGE SCHEMA
------------------------------------------------------------------------ */

function createHourlySchema(wage, canonical, title, description) {
    return JSON.stringify(
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: title,
            url: canonical,
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            description: description,
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
            },
        },
        null,
        2
    );
}

/* -----------------------------------------------------------------------
   GENERATE HOURLY PAGES
------------------------------------------------------------------------ */

function generateHourlyPages(wages, template) {
    console.log("Generating hourly wage pages...");

    let generated = 0;

    for (const item of wages) {
        if (!item || !item.slug || typeof item.wage !== "number" || !Number.isFinite(item.wage) || item.wage <= 0) {
            console.warn("Skipping invalid wage:", item);

            continue;
        }

        const slug = String(item.slug).trim().toLowerCase();

        const wage = Number(item.wage);

        /* ----------------------------------------------------------------
           GROSS PAY ASSUMPTIONS

           40 regular hours/week
           52 weeks/year
        ---------------------------------------------------------------- */

        const weekly = wage * 40;

        const biweekly = weekly * 2;

        const annual = weekly * 52;

        const monthly = annual / 12;

        const wageText = `$${money(wage)}/hour`;

        const title = `${wageText} Take-Home Pay Calculator 2026 | PaycheckMint`;

        const description = `See how much you could take home earning ${wageText} in 2026. Estimate weekly, biweekly, monthly and annual pay after taxes and deductions with PaycheckMint.`;

        const canonical = `${BASE_URL}/hourly-paycheck/${slug}/`;

        const schema = createHourlySchema(wage, canonical, title, description);

        /*
        |------------------------------------------------------------------
        | WAGE JSON
        |------------------------------------------------------------------
        |
        | This fixes the JavaScript error from:
        |
        | const wage = {{ WAGE_JSON }};
        |
        | Both versions are supported:
        |
        | {{WAGE_JSON}}
        | {{ WAGE_JSON }}
        |
        */

        const wageJSON = JSON.stringify({
            slug: slug,
            wage: wage,
        });

        let html = template;

        /* ----------------------------------------------------------------
           REPLACE BASIC PLACEHOLDERS
        ---------------------------------------------------------------- */

        html = html.replaceAll("{{TITLE}}", escapeHtml(title));

        html = html.replaceAll("{{DESCRIPTION}}", escapeHtml(description));

        html = html.replaceAll("{{CANONICAL}}", canonical);

        html = html.replaceAll("{{SCHEMA}}", schema);

        /* ----------------------------------------------------------------
           REPLACE HOURLY PLACEHOLDERS
        ---------------------------------------------------------------- */

        html = html.replaceAll("{{WAGE_TEXT}}", escapeHtml(wageText));

        html = html.replaceAll("{{WAGE}}", String(wage));

        html = html.replaceAll("{{WAGE_JSON}}", wageJSON);

        html = html.replaceAll("{{ WAGE_JSON }}", wageJSON);

        html = html.replaceAll("{{WEEKLY}}", money(weekly));

        html = html.replaceAll("{{BIWEEKLY}}", money(biweekly));

        html = html.replaceAll("{{MONTHLY}}", money(monthly));

        html = html.replaceAll("{{ANNUAL}}", money(annual));

        html = html.replaceAll("{{WAGE_SLUG}}", escapeHtml(slug));

        /* ----------------------------------------------------------------
           OUTPUT
        ---------------------------------------------------------------- */

        const outputDir = path.join(HOURLY_OUTPUT_DIR, slug);

        const outputFile = path.join(outputDir, "index.html");

        writeFile(outputFile, html);

        /* ----------------------------------------------------------------
           PLACEHOLDER CHECK
        ---------------------------------------------------------------- */

        const remaining = html.match(/{{[^{}]+}}/g);

        if (remaining) {
            console.warn(`WARNING: ${slug} contains unreplaced placeholders:`, remaining);
        }

        console.log(`✓ ${wageText}`);

        generated++;
    }

    console.log("");

    console.log(`Generated ${generated} hourly pages.`);

    console.log("");

    return generated;
}

/* -----------------------------------------------------------------------
   SITEMAP
------------------------------------------------------------------------ */

function getGeneratedUrls() {
    const urls = [];

    /* ----------------------------------------------------------------
       STATIC PAGES
    ---------------------------------------------------------------- */

    const staticUrls = [
        `${BASE_URL}/`,
        `${BASE_URL}/hourly-paycheck-calculator/`,
        `${BASE_URL}/salary-paycheck-calculator/`,
        `${BASE_URL}/paycheck-tax-calculator/`,
        `${BASE_URL}/take-home-pay-calculator/`,
        `${BASE_URL}/overtime-pay-calculator/`,
        `${BASE_URL}/weekly-paycheck-calculator/`,
        `${BASE_URL}/biweekly-paycheck-calculator/`,
        `${BASE_URL}/monthly-paycheck-calculator/`,
        `${BASE_URL}/privacy-policy/`,
        `${BASE_URL}/terms/`,
        `${BASE_URL}/contact/`,
        `${BASE_URL}/about/`,
    ];

    urls.push(...staticUrls);

    /* ----------------------------------------------------------------
       STATE PAGES
    ---------------------------------------------------------------- */

    if (fs.existsSync(STATE_OUTPUT_DIR)) {
        const states = fs.readdirSync(STATE_OUTPUT_DIR, {
            withFileTypes: true,
        });

        for (const entry of states) {
            if (!entry.isDirectory()) {
                continue;
            }

            urls.push(`${BASE_URL}/paycheck-calculator/${entry.name}/`);
        }
    }

    /* ----------------------------------------------------------------
       HOURLY PAGES
    ---------------------------------------------------------------- */

    if (fs.existsSync(HOURLY_OUTPUT_DIR)) {
        const wages = fs.readdirSync(HOURLY_OUTPUT_DIR, {
            withFileTypes: true,
        });

        for (const entry of wages) {
            if (!entry.isDirectory()) {
                continue;
            }

            urls.push(`${BASE_URL}/hourly-paycheck/${entry.name}/`);
        }
    }

    return [...new Set(urls)];
}

function generateSitemap() {
    const urls = getGeneratedUrls();

    const today = new Date().toISOString().split("T")[0];

    const xmlUrls = urls
        .map(
            (url) => `
    <url>
        <loc>${escapeXml(url)}</loc>
        <lastmod>${today}</lastmod>
    </url>`
        )
        .join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xmlUrls}
</urlset>
`;

    fs.writeFileSync(SITEMAP_FILE, sitemap, "utf8");

    console.log(`✓ sitemap.xml generated with ${urls.length} URLs`);

    console.log("");
}

/* -----------------------------------------------------------------------
   XML ESCAPE
------------------------------------------------------------------------ */

function escapeXml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/* -----------------------------------------------------------------------
   VALIDATION
------------------------------------------------------------------------ */

function validateGeneratedPages() {
    console.log("Checking generated pages...");

    let filesChecked = 0;
    let errors = 0;

    function scanDirectory(directory) {
        if (!fs.existsSync(directory)) {
            return;
        }

        const entries = fs.readdirSync(directory, {
            withFileTypes: true,
        });

        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                scanDirectory(fullPath);

                continue;
            }

            if (entry.name !== "index.html") {
                continue;
            }

            const html = fs.readFileSync(fullPath, "utf8");

            filesChecked++;

            const placeholders = html.match(/{{[^{}]+}}/g);

            if (placeholders) {
                console.error(`✗ Unreplaced placeholders in ${fullPath}:`, placeholders);

                errors++;
            }
        }
    }

    scanDirectory(STATE_OUTPUT_DIR);

    scanDirectory(HOURLY_OUTPUT_DIR);

    console.log(`Checked ${filesChecked} generated HTML files.`);

    if (errors > 0) {
        console.error(`Found ${errors} files with errors.`);

        return false;
    }

    console.log("✓ No unreplaced placeholders found.");

    console.log("");

    return true;
}

/* -----------------------------------------------------------------------
   COUNT VALIDATION
------------------------------------------------------------------------ */

function validateCounts(states, wages, stateCount, hourlyCount) {
    console.log("Checking page counts...");

    let valid = true;

    if (states.length !== 50) {
        console.warn(`WARNING: states.json contains ${states.length} states. Expected 50.`);

        valid = false;
    }

    if (wages.length !== 15) {
        console.warn(`WARNING: wages.json contains ${wages.length} wage entries. Expected 15.`);

        valid = false;
    }

    if (stateCount !== states.length) {
        console.warn(`WARNING: Only ${stateCount} of ${states.length} state pages were generated.`);

        valid = false;
    }

    if (hourlyCount !== wages.length) {
        console.warn(`WARNING: Only ${hourlyCount} of ${wages.length} hourly pages were generated.`);

        valid = false;
    }

    if (stateCount + hourlyCount !== 65) {
        console.warn(`WARNING: Total pSEO pages = ${stateCount + hourlyCount}. Expected 65.`);

        valid = false;
    }

    if (valid) {
        console.log("✓ Page count is correct: 50 + 15 = 65");
    }

    console.log("");

    return valid;
}

/* -----------------------------------------------------------------------
   MAIN
------------------------------------------------------------------------ */

function main() {
    console.log("");

    console.log("==========================================");

    console.log(" PaycheckMint pSEO Generator");

    console.log("==========================================");

    console.log("");

    console.log("Base URL:", BASE_URL);

    console.log("");

    /* ----------------------------------------------------------------
       READ SOURCE FILES
    ---------------------------------------------------------------- */

    const states = readJSON(STATES_FILE);

    const wages = readJSON(WAGES_FILE);

    const stateTemplate = readTemplate(STATE_TEMPLATE_FILE);

    const hourlyTemplate = readTemplate(HOURLY_TEMPLATE_FILE);

    /* ----------------------------------------------------------------
       DELETE OLD GENERATED PAGES
    ---------------------------------------------------------------- */

    deleteOldGeneratedPages();

    /* ----------------------------------------------------------------
       GENERATE STATE PAGES
    ---------------------------------------------------------------- */

    const stateCount = generateStatePages(states, stateTemplate);

    /* ----------------------------------------------------------------
       GENERATE HOURLY PAGES
    ---------------------------------------------------------------- */

    const hourlyCount = generateHourlyPages(wages, hourlyTemplate);

    /* ----------------------------------------------------------------
       GENERATE SITEMAP
    ---------------------------------------------------------------- */

    generateSitemap();

    /* ----------------------------------------------------------------
       VALIDATE PAGE COUNTS
    ---------------------------------------------------------------- */

    const countValid = validateCounts(states, wages, stateCount, hourlyCount);

    /* ----------------------------------------------------------------
       VALIDATE GENERATED HTML
    ---------------------------------------------------------------- */

    const pagesValid = validateGeneratedPages();

    /* ----------------------------------------------------------------
       FINAL RESULT
    ---------------------------------------------------------------- */

    console.log("==========================================");

    console.log(" Generation complete");

    console.log("==========================================");

    console.log("");

    console.log(`State pages:  ${stateCount}`);

    console.log(`Hourly pages: ${hourlyCount}`);

    console.log(`Total pSEO:   ${stateCount + hourlyCount}`);

    console.log("");

    if (!countValid || !pagesValid) {
        console.error("Generation finished with errors.");

        process.exit(1);
    }

    console.log("✓ All 65 pSEO pages generated successfully.");

    console.log("✓ sitemap.xml generated successfully.");

    console.log("");
}

/* -----------------------------------------------------------------------
   RUN
------------------------------------------------------------------------ */

try {
    main();
} catch (error) {
    console.error("");

    console.error("ERROR:", error.message);

    console.error("");

    process.exit(1);
}
