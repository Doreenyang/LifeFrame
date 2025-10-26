# ReMind

A small React app to capture and jog personal memories with voice-driven prompts, reminders, and a guided memory coach.

Built with: JavaScript (React 18), Vite, @vitejs/plugin-react, Tailwind CSS, PostCSS, Autoprefixer, Web Speech API (SpeechSynthesis & SpeechRecognition), localStorage, Node.js / npm, GitHub Actions, GitHub Pages, local JSON + image assets, custom utils (tts, storage, ai)

Quick start

Prerequisites: Node.js (16+), npm

Install and run locally:

```bash
npm ci
npm run dev
```

Build for production:

```bash
npm run build
npm run preview   # preview the built output locally
```

Voice & behavior notes

- The Voice tab shows an inline result photo after you finish speaking. Voice input does NOT change the Home filter automatically — use the "Clear all (Home & Voice)" button on the Voice tab to clear both the voice result and any persisted Home filter.
- Reminders supports swipe-right to save and swipe-left to skip. Keyboard ← → are supported.

Deployment

- This project is set up to publish to GitHub Pages via the workflow in `.github/workflows/gh-pages.yml`. The workflow builds the app and deploys the `dist/` folder.
- If Actions deployment fails with git/auth errors, you can publish manually with:

```bash
npm run build
npx gh-pages -d dist -b gh-pages -m "chore: publish site"
```

Troubleshooting

- If `npm run dev` reports `'vite' is not recognized`:
	- Ensure dependencies are installed (`npm ci`).
	- If the problem persists, run `npx vite` to invoke the local binary, or check `node_modules/.bin` is available in your PATH for your shell.

Contributing

PRs, issues, and suggestions welcome. Small UI/UX tweaks, accessibility improvements, and tests (Playwright/Jest) are good next steps.

License

MIT
