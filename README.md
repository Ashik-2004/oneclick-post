# Free One-Touch Social Poster

A fuller local web app that helps you:

- paste a topic or full content once
- generate post text for `X` and `LinkedIn`
- choose a generation tone: `professional`, `bold`, or `educational`
- review and edit both drafts
- save drafts locally
- reload or delete previous drafts
- post to both platforms from one button

## How it works

This project does **not** use paid posting APIs.

Instead it uses:

- `Express` for the local app server
- `Playwright` for browser automation
- your own logged-in browser session for `X` and `LinkedIn`
- simple built-in text templates for free post generation
- local JSON storage for draft history

## What is free here

- no OpenAI API required
- no X API required
- no LinkedIn API required
- runs on your computer

## Limits

- site layout changes on X or LinkedIn can break selectors and may need small updates
- the first time, you should use `Open sessions` and log into both sites manually
- Playwright needs Chromium installed locally

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm start
```

3. Open:

```text
http://localhost:3000
```

## Usage

1. Click `Open sessions`
2. Log into `X` and `LinkedIn` in the opened browser windows
3. Close those browser windows after login is saved
4. Enter a `topic` or paste `full content`
5. Choose a tone if you want template generation
6. Click `Generate posts`
7. Edit the previews if needed
8. Click `Save draft` if you want to keep it
9. Click `Post everywhere`

## Draft storage

Saved drafts are stored locally in:

- `data/drafts.json`

## Project structure

- `server/app.js`: local Express server and API routes
- `server/generate.js`: free template-based post generation with multiple tones
- `server/drafts.js`: local draft storage helpers
- `server/poster.js`: Playwright automation for X and LinkedIn
- `public/index.html`: full dashboard UI
- `public/app.js`: browser logic for generate, save, load, delete, and post actions
- `public/public.css`: app-specific layout styles
- `design-system/`: teal design system starter

## Notes for improvement

If you want better writing quality later, you can add an AI API for generation while keeping posting automation free.

## Quick start on Windows

- Double-click start-app.bat`n- Keep the opened terminal window running
- Then open http://localhost:3000

