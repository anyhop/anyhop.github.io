# anyhop.github.io

The organization's landing page, served at <https://anyhop.github.io>.

This is the front door for [anyhop](https://github.com/anyhop/anyhop) — what it is,
how to install it, and where to go next. The full documentation lives at
<https://anyhop.github.io/anyhop/>, built from `docs/` in the main repository.

## Editing

Static files, no build step:

| Path | What |
| ---- | ---- |
| `index.html` | The page |
| `assets/site.css` | Styles. Design tokens are at the top; the palette and the semantic colour roles are copied from the app itself (`src/anyhop/assets/style.css` in `anyhop/anyhop`) — blue is the tool acting, teal is a live tunnel, grey is no tunnel, red is dropped traffic |
| `assets/site.js` | The copy button and the "trace a destination" interaction. The page is fully readable without it |
| `assets/fonts/` | Self-hosted Archivo and IBM Plex Mono (SIL OFL 1.1 — see the licence files alongside). Self-hosted so the page makes no third-party requests |

Preview locally:

```bash
python3 -m http.server 8000
```

Pushing to `main` deploys through `.github/workflows/pages.yml`.

## Licence

MIT — see [LICENSE](LICENSE). The bundled fonts are under the SIL Open Font
License 1.1; their licence files are in `assets/fonts/`.
