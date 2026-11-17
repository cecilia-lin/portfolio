# Cecilia Lin’s portfolio

[Live site](https://cecilia-lin.github.io/portfolio/) · HTML, CSS, and JavaScript · GitHub Pages

## Preview

With Python 3 installed, run `python3 -m http.server 8000` and open http://localhost:8000.

## Update

- Projects: edit `lib/projects.json`, then run `node scripts/sync-projects.mjs`.
- Content: edit the corresponding page’s `index.html`.
- Résumé PDF: replace `files/Cecilia_Lin_Resume.pdf`.
- Portrait and hobby photos: update the images, alt text, and captions in `about/index.html`.

## Verify and publish

Using Node.js 24, run:

```sh
node scripts/sync-projects.mjs --check
node scripts/check-site.mjs
node --test tests/*.test.mjs
```

Push to `main` to publish. Pull requests run the same checks without deploying.

[Content sources](docs/content-sources.md) · [GSAP notice](vendor/gsap/NOTICE.md)
