# SEO Implementation Report — Serpiente de Google

**Primary keyword:** `serpiente de google` · **Target market:** Spain (es-ES) · **Date:** 2026-10-10
**Production domain (placeholder — replace before launch):** `https://serpientedegoogle.es/`

## 1. Keyword research (from SERP + competitor analysis)

Search intent for "serpiente de google" is overwhelmingly **play intent** (jugar gratis, sin descargar) + **informational** (cómo se juega, reglas, historia, trucos). Supporting sources consulted: snake.es (structure/UX reference only — no text copied), snakegame.org, Google Doodle "Año de la Serpiente 2025" coverage (lanacion.com.ar, elheraldo.co, dualmedia.fr).

**Secondary / semantic keywords woven naturally into the content:**
juego de la serpiente, jugar a la serpiente, serpiente google, juego snake, la viborita / la culebrita, juego clásico, Nokia 1997, doodle de Google, Año de la Serpiente, manzanas, puntuación / récord, teclas de flecha, WASD, deslizar el dedo, pantalla táctil, bordes del tablero, consejos y estrategias, manual / cómo jugar.

**Long-tail FAQ targets:** "serpiente de google gratis", "cómo se juega en el móvil", "quién inventó el juego de la serpiente", "por qué termina la partida", "se guarda mi récord".

## 2. Keyword density (exact match "serpiente de google", homepage)

- Analyzed: visible body text only (scripts/styles stripped), headings included.
- Total words: **1039** · Exact occurrences: **7** · **Density = 0.674%** ✓ (target 0.4–0.7%)
- Occurrences are in: site brand (header/footer), H1, two H2s, one FAQ question, footer copyright. Body copy otherwise uses natural variants ("el juego", "la serpiente", "esta versión"). Readability was prioritized over hitting the number.

## 3. On-page SEO per page

| Page | SEO title | Meta description | Canonical | H1 |
|---|---|---|---|---|
| `/` | Serpiente de Google \| Juega gratis al clásico juego de la serpiente | Juega gratis a la serpiente de Google en tu navegador… | `https://serpientedegoogle.es/` | 1 |
| `/como-jugar` | Cómo jugar a la serpiente de Google: manual completo y controles | Manual completo… | `…/como-jugar` | 1 |
| `/consejos` | Consejos y estrategias para la serpiente de Google: consigue más puntos | Estrategias para dominar… | `…/consejos` | 1 |
| `/historia` | Historia del juego de la serpiente: de Nokia 1997 al doodle de Google | La historia del juego… | `…/historia` | 1 |
| `/contacto` | Contacto \| Serpiente de Google | Contacta con el equipo… | `…/contacto` | 1 |
| `/privacidad` | Política de privacidad \| Serpiente de Google | Qué datos se guardan… | `…/privacidad` | 1 |
| 404 | Página no encontrada \| Serpiente de Google | — (noindex) | — | 1 |

All pages: `lang="es"`, `robots=index,follow` (except 404: `noindex,follow`), unique OG + Twitter card tags, absolute canonical/OG URLs, SVG favicon, descriptive alt text on images (keyword never stuffed into alt).

## 4. Structured data (JSON-LD, all validated as parseable JSON)

- **All pages:** WebSite (+ Organization with logo on homepage).
- **Homepage:** WebPage, **VideoGame** (the playable game: SinglePlayer, Arcade, browser), **FAQPage** (7 Q&As, questions/answers match visible text exactly).
- **/como-jugar:** WebPage, BreadcrumbList, **HowTo** (5 steps mirroring the manual).
- **/consejos**, **/historia:** Article + BreadcrumbList.
- **/contacto:** WebPage + BreadcrumbList.
- No invented ratings, reviews, addresses, prices, or authors anywhere.

## 5. Technical SEO / crawlability

- `robots.txt` allows all + points to sitemap. `sitemap.xml` lists 6 canonical URLs (no 404, no duplicates).
- `vercel.json`: `{"cleanUrls": true}` — clean URLs resolve on direct visit and refresh; no SPA-style catch-all rewrite.
- Semantic HTML5 (`header/main/article/nav/footer`, one H1 per page), valid heading hierarchy.
- Internal linking: contextual links between all content pages (manual ↔ consejos ↔ historia ↔ home), cards on homepage, full nav in header + footer. Zero broken internal links (checked programmatically).
- Images: original SVGs (tiny), one 1200×630 OG PNG; below-the-fold image lazy-loaded; hero game canvas is not lazy-loaded.
- Performance: zero external requests (no webfonts, no libraries, no analytics) — everything is local. JS is deferred; game uses rAF + canvas.

## 6. UI/UX improvements vs the reference

- **New color system:** deep forest teal + warm amber on cream (reference used periwinkle/lavender) — original look, same proven structure (game first, article below).
- **Game upgrades:** speed ramps up per apple, pause on tab-hide, WebAudio sound with mute toggle, best-score persistence, win state on full board, tap/swipe/d-pad/keyboard controls, direction-input queue (no dropped fast turns), accessible labels and focus states, `prefers-reduced-motion` respected.
- **Content upgrades:** original Spanish copy (not translated/copied); added "Por qué sigue enganchando" section; 7-question FAQ (vs 5); dedicated history page with timeline (Nokia 1997 → Google doodles); honest privacy page (no cookies/trackers); non-affiliation disclaimer in footer.

## 7. Game QA

`node test-game.js` — **30/30 headless logic tests pass repeatedly**: start/restart, movement, queued turns, 180°-reversal blocked, eating → score/growth/speed-up/HUD, wall collision → game over, self-collision → game over, tail-cell move legal, best-score saved to localStorage, keyboard restart keeps direction, food never spawns on snake, full-board → win overlay. Live-browser QA pass also performed (layout, play, pause, FAQ, nav, inner pages).

## 8. Outstanding / owner tasks

1. **Replace placeholder domain** `serpientedegoogle.es` with the real domain in all HTML files, `sitemap.xml`, `robots.txt` (and update `<lastmod>`).
2. **Contact email:** set your real address in `assets/js/main.js` (or connect Formspree for a real backend).
3. **Search Console:** submit `sitemap.xml` after deploy; request indexing.
4. **Schema:** re-validate in Google's Rich Results Test after the domain swap (structure already validated as JSON).
5. **PageSpeed:** run once live (lab) — the build is dependency-free by design, but real numbers need a real URL.
6. Optional content growth later: a "récords/trucos avanzados" article or English version (`/en/`) with hreflang.
