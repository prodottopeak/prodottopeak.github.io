# Prodotto Peak website

The studio homepage, app directory, service page and Keli website are served by GitHub Pages at https://prodottopeak.com/. Beeper, PhoneAware and Progress Pebble use sibling GitHub Pages project repositories on the same domain.

## One app catalogue

Edit `content/studio.json` to add an app, change its launch status or select the homepage features. Set `featured: true` for **at most four apps**. Every app appears in `/apps/`, including its support and privacy links. The directory is the place for the catalogue to grow; the homepage and shared footer remain bounded.

Each entry has an ID, name, canonical path, category, tagline, status (`available` or `coming_soon`), artwork path, website repository and directory, support and privacy paths. Artwork should come from the product. Existing apps retain their own colours; additional apps get a neutral card unless a deliberate visual treatment is added.

With the website repositories checked out beside this one, run:

```sh
python3 scripts/build-studio.py --all-sites
python3 -m unittest discover -s tests -v
```

The build updates homepage cards, the full directory, their structured app lists, service-page portfolio links, the sitemap, and marked studio navigation in every product website and legal-page template. It preserves each product's local support/privacy navigation and translated page copy. Generated navigation uses `lang="en"`; service and directory pages are currently English.

The fixed studio footer lives in the builder's `navigation()` function. Its shared styles live in `assets/studio-footer.css` and are loaded from the same domain by all sites. Updating those styles requires only a studio deployment. The footer links to **All apps**, **Build an app with us**, **App support & privacy**, and email; adding another app never adds another footer link. The app directory supplies the cross-product links.

HTML is generated at build time: no client-side fetch, JavaScript dependency, server, framework or package installation is needed for navigation or indexing. A second build produces no changes. Without `--all-sites`, the command updates only this checkout.

## Publishing

Review the generated diffs and push the affected website repositories. GitHub Pages deploys each repository. Deploy the studio first when adding shared asset paths, then product repositories. Adding an app to the existing fixed navigation only changes this studio's catalogue/directory; old app repositories normally have no diff. The builder never commits or publishes implicitly.

Keep canonical URLs, Google verification files, `robots.txt` and `app-ads.txt`. Native app repositories are unrelated to this website build.
