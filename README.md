# anyhop.github.io

Organization landing page at <https://anyhop.github.io>.

Full documentation: <https://anyhop.github.io/anyhop/> (built from `anyhop/anyhop`).

## Edit

Static files — no build:

| Path | |
| ---- | - |
| `index.html` | Page |
| `assets/site.css` | Light-only styles; tokens at the top |
| `assets/site.js` | Copy button + rule-trace demo |
| `assets/fonts/` | Self-hosted Archivo + IBM Plex Mono (OFL) |

```bash
python3 -m http.server 8000
```

Push to `main` deploys via `.github/workflows/pages.yml`.

## Licence

MIT — [LICENSE](LICENSE). Fonts: SIL OFL 1.1 in `assets/fonts/`.
