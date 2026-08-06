# workout-tracker
Personalized workout tracker that logs and suggests workouts based on your body type, goals and preference!

Create a profile, log exercises by body group, and watch a front-view
body map shade in orange as volume builds up for each muscle group.
Compare everyone's training for the week on the compare page.

The app is fully static — no server, no database. Every profile and
exercise log is saved to the browser's `localStorage` (see
`public/store.js`). That means data lives in one browser only; it isn't
shared across devices, and "everyone" on the compare page means "every
profile created in this browser."

## Run locally

```
npm install
npm start
```

Then open http://localhost:3000. (`server.js` just serves the `public/`
folder — you could equally open `public/index.html` directly, or serve
it with any static file server.)

## Deploy to GitHub Pages

A workflow at `.github/workflows/deploy-pages.yml` publishes `public/`
on every push to `main`. One-time setup: in the repo's **Settings →
Pages**, set **Source** to **GitHub Actions**. After that, pushes to
`main` deploy automatically.
