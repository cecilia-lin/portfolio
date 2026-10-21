# Cecilia Lin · Data portfolio

A static portfolio for data science, engineering, and analytics, hosted on GitHub Pages. No dependency installation or framework build is required.

## Local preview

Run `python3 -m http.server 8000` from this folder and open http://localhost:8000. The site also supports GitHub Pages' `/portfolio/` prefix; links and assets are relative to each page.

## Updating projects

Edit `lib/projects.json`, then run `node scripts/sync-projects.mjs`. This updates the static previews on the homepage and Projects index. `slug` identifies the project; `featuredOrder` is a number for featured case studies and `null` for externally linked projects; `tags` supports multiple filter categories. Update the corresponding case-study HTML when a project's narrative changes.

The filter operates on static cards, so it has no runtime JSON request or loading dependency. All projects remain readable without JavaScript or if filters cannot initialize. Theme controls tolerate unavailable local storage.

## Checks and publishing

Run `node scripts/sync-projects.mjs --check` and `node scripts/check-site.mjs`. Push the reviewed changes to `main` to use the existing Pages workflow. Browser checks should cover desktop/mobile, both color schemes, reduced motion, keyboard navigation, search/category combinations, empty results, and JavaScript disabled.

## Content references

Experience and education were updated from the supplied October 2026 resume reference. The PDF is not included in the public site.

- AI: https://github.com/cecilia-lin/Multi-Agent-AI-System-for-News-Credibility-Detection — architecture, factor definitions, experimental framework. Team contribution and simpler-design outcome are from the resume. The portfolio does not present the resume's peak component accuracy as an overall accuracy figure.
- Recipes: https://cecilia-lin.github.io/RecipeProject/ — confirms 83,782 recipes, 731,927 interactions, and 234,429 cleaned merged rows; reported F1 0.87 → 0.92. The original narrative has inconsistent exact permutation p-values (0.001 / 0.002), so the portfolio uses p < 0.01 and explains the limitation. Observational results are described as associations.
- Glucose: https://g7xu.dev/secret-life-of-blood-glucose/ — confirms 15 participants, named co-developers, controls, and measures. No clinical validation or usability outcome is claimed.
- Other projects retain summaries from the existing portfolio, without adding new numerical claims.

All six original external project destinations returned HTTP 200 when checked on October 20, 2026. External content can change independently of this site.
