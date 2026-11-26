#!/usr/bin/env node
/**
 * Builds blog/index.html from blog/index.template.html.
 * Scans every blog/<slug>/index.html, reads its metadata, and lists the
 * articles newest first. Zero dependencies (Node 18+).
 *
 * Run:  node scripts/build-blog-index.mjs
 * Optional: SITE_ROOT=/path/to/site node scripts/build-blog-index.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.SITE_ROOT ? path.resolve(process.env.SITE_ROOT) : path.resolve(here, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const TEMPLATE = path.join(BLOG_DIR, 'index.template.html');
const OUTPUT = path.join(BLOG_DIR, 'index.html');
const ORIGIN = 'https://paycheckmint.com';
const FALLBACK_IMAGE = '/images/blog-default.webp';

const decode = (s = '') => s
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const escAttr = (s = '') => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stripTags = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function meta(html, attr, name) {
  // handles either attribute order and multi-line tags
  const a = new RegExp(`<meta[^>]*\\b${attr}=["']${name}["'][^>]*\\bcontent=["']([^"']*)["'][^>]*>`, 'i');
  const b = new RegExp(`<meta[^>]*\\bcontent=["']([^"']*)["'][^>]*\\b${attr}=["']${name}["'][^>]*>`, 'i');
  const m = html.match(a) || html.match(b);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

function readPost(slug) {
  const file = path.join(BLOG_DIR, slug, 'index.html');
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');

  const robots = meta(html, 'name', 'robots').toLowerCase();
  if (robots.includes('noindex') || /<meta[^>]*name=["']draft["']/i.test(html)) return null;

  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1];
  const title = stripTags(h1 || '') || decode(meta(html, 'property', 'og:title')) ||
    decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [, slug])[1]);

  const description = decode(meta(html, 'name', 'description')) || decode(meta(html, 'property', 'og:description'));

  let image = meta(html, 'property', 'og:image');
  try { if (image) image = new URL(image, ORIGIN).pathname; } catch { /* keep as-is */ }
  if (!image) image = FALLBACK_IMAGE;

  const published = (meta(html, 'property', 'article:published_time') ||
    (html.match(/"datePublished"\s*:\s*"([^"]+)"/) || [])[1] || '').slice(0, 10);
  const stat = fs.statSync(file);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(published) ? published : stat.mtime.toISOString().slice(0, 10);

  const category = decode(meta(html, 'property', 'article:section')) || 'Guides';
  const mins = Number((html.match(/(\d+)\s*min read/i) || [])[1]) ||
    Math.max(1, Math.round(stripTags(html).split(' ').length / 220));

  const canonical = (html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1];
  let url = `/blog/${slug}/`;
  if (canonical) { try { url = new URL(canonical, ORIGIN).pathname; } catch { /* default */ } }

  return { slug, url, title, description, image, date, category, mins };
}

const fmtDate = (iso) => new Date(iso + 'T12:00:00Z')
  .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function card(p, i) {
  const img = i === 0 ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  const text = escAttr(`${p.title} ${p.description} ${p.category}`.toLowerCase());
  return `          <article class="post-card" data-cat="${escAttr(p.category)}" data-text="${text}">
            <a class="post-thumb" href="${p.url}" tabindex="-1" aria-hidden="true"><img src="${p.image}" width="1200" height="630" alt="" ${img}></a>
            <div class="post-body">
              <span class="post-cat">${escText(p.category)}</span>
              <h3><a href="${p.url}">${escText(p.title)}</a></h3>
              <p>${escText(p.description)}</p>
              <span class="post-meta"><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${p.mins} min read</span>
            </div>
          </article>`;
}

function main() {
  if (!fs.existsSync(TEMPLATE)) { console.error(`Missing template: ${TEMPLATE}`); process.exit(1); }

  const slugs = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
    .map((d) => d.name);

  const posts = slugs.map(readPost).filter(Boolean)
    // newest first; same-day posts fall back to slug order so the result is stable
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

  const cats = [...new Set(posts.map((p) => p.category))].sort((a, b) => a.localeCompare(b));
  const filters = ['          <button type="button" data-filter="all" aria-pressed="true">All</button>',
    ...cats.map((c) => `          <button type="button" data-filter="${escAttr(c)}" aria-pressed="false">${escText(c)}</button>`)].join('\n');

  const itemList = JSON.stringify(posts.map((p, i) => ({
    '@type': 'ListItem', position: i + 1, url: ORIGIN + p.url, name: p.title,
  })), null, 2).replace(/\n/g, '\n  ');

  const ogImage = ORIGIN + (posts[0] ? posts[0].image : FALLBACK_IMAGE);

  let out = fs.readFileSync(TEMPLATE, 'utf8')
    .replaceAll('{{OG_IMAGE}}', ogImage)
    .replaceAll('{{POST_COUNT}}', String(posts.length))
    .replaceAll('{{FILTER_BUTTONS}}', filters)
    .replaceAll('{{ITEMLIST_JSON}}', itemList)
    .replaceAll('{{POST_CARDS}}', posts.map(card).join('\n'));

  fs.writeFileSync(OUTPUT, out);
  console.log(`Wrote ${path.relative(ROOT, OUTPUT)} with ${posts.length} article(s), newest first:`);
  posts.forEach((p) => console.log(`  ${p.date}  ${p.url}`));
}
main();
