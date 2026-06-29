# Lefan Lai Academic Website

A polished static personal academic website for Lefan Lai, focused on HCI,
XR/MR, AI, LLMs, multimodal AI, and spatial skills training.

## Development

```bash
npm install
npm run dev
```

The local preview runs at `http://localhost:5173`.

## Build

```bash
npm run build
```

The static output is copied into `dist/`. The build script does not require
external packages.

## Deployment

This project is compatible with Vercel:

```bash
npm install
npm run build
```

Use `dist` as the output directory. It can also be deployed to GitHub Pages by
publishing the contents of `dist/`.

## Files

- `index.html`: page structure and academic content
- `styles.css`: responsive design, visual identity, animation, reduced motion
- `script.js`: scroll reveal, active navigation, mobile menu, spatial canvas
- `assets/teaser.png`: CHI 2026 publication thumbnail
- `assets/profile.jpg`: portrait image used in the hero section
- `scripts/dev-server.mjs`: dependency-free local preview server
- `scripts/build.mjs`: dependency-free static build script
