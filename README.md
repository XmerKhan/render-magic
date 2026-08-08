# Render Magic

I'm giving you a full zip of an existing project — a video editing web app ("AutoCut Studio") built with React/Vite (frontend) and Node.js/Express + Remotion (backend). Please review the entire project, fix any bugs you find, and importantly: **redesign the video export/render architecture**, because the current approach isn't working reliably.

## Context: what's been tried and why it failed

The app needs to take a timeline (images/video clips + a voiceover audio file + a JSON script defining scene timing) and render it into a downloadable, high-quality MP4 — with real motion graphics (Ken Burns pans, transitions, captions, lower-thirds, etc.) built with Remotion.

Two approaches have been tried so far, both with problems:

1. **Client-side (browser) rendering** using `@remotion/web-renderer` or manual WebCodecs + Canvas capture — this required an experimental, unstable Chrome flag ("HTML-in-Canvas"), frequently hung or failed partway through rendering, and isn't something a real user should have to enable manually. Not viable for a real product.

2. **Server-side rendering** using Remotion's real `renderMedia()` on a separate Node.js/Express backend, deployed in a Docker container to Render.com's free web service tier. This got further — the render pipeline actually works (Chromium spins up, frames render) — but Render's free tier only has 512MB RAM, and the render process (headless Chromium + Node + Remotion) keeps exceeding that memory limit and crashing mid-render, even after reducing Chromium concurrency to 1 and using software rendering (`gl: 'swangle'`). There is no budget for a paid hosting tier.

## What I need from you

**Please remove/replace the current Render.com-dependent backend approach** and design and implement whatever solution you think will most reliably produce a smooth, downloadable, high-quality MP4 — while staying completely free (no paid cloud services, no credit card required anywhere in the pipeline). You have full latitude to redesign this however makes sense; some directions to consider (but don't feel limited to just these):

- A different free hosting platform better suited to headless-Chromium/Remotion workloads than Render's free tier (if you're aware of one with a more workable memory/CPU allowance for this use case).
- A leaner rendering approach that avoids needing a full-size headless Chromium instance at all (e.g. rendering with lower memory overhead, streaming frames instead of holding the whole render in memory, or a fundamentally different capture method).
- Reducing what needs to be rendered server-side vs. what can stay client-side, if that meaningfully reduces memory pressure without reintroducing the earlier browser-rendering reliability problems.
- Any other architecture you'd recommend, given real-world experience with what actually works for free/low-resource video rendering pipelines.

Whatever you choose, the end goal is: the user uploads images/clips + a voiceover + a timeline JSON, the app applies the configured transitions/Ken Burns/captions/color grading/etc., and produces a downloadable MP4 that plays smoothly and matches the timeline exactly (correct total duration, correct audio sync) — reliably, without crashing, for free.

## Also please do a general review of the whole codebase
- Fix any bugs, TypeScript errors, or bad error-handling you find (for example: the frontend's render-status polling loop was previously found to abort the entire export on a single failed request instead of retrying transient failures — please verify this is handled sensibly wherever it ends up in your redesigned architecture).
- Preserve the existing feature set as much as possible (aspect ratio switching 16:9/9:16/1:1/4:5, Ken Burns motion, the transition library, captions with multiple styles, color grading, lower-thirds/callouts/date-stamps/quote-cards, background music with ducking) — these were already built and working in the composition/preview; the problem has specifically been the final render/export step, not the creative features themselves.

Please start by explaining your recommended architecture and why, before implementing, so I understand the plan.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/64f3c149-7bce-4619-9360-3de265c50e7b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
