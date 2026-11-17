# Interactive 3D Web Portfolio: Muhammad Basim

A 3D personal portfolio with a custom **Blender avatar**, an **After Effects** promo video, a **RAG-based AI chatbot** and a secure **contact/email system**, deployed on **Vercel**.

**Live:** `https://YOUR-PROJECT.vercel.app` · **Repo:** `https://github.com/YOUR-USERNAME/portfolio-3d`

> 🇵🇰 Roman Urdu mein step-by-step guide: [STEP_BY_STEP.md](STEP_BY_STEP.md)

## Modules
| # | Module | Where |
|---|---|---|
| 1 | 3D web portfolio (Home, About, Skills, Projects & Achievements, Video, Education & Experience, Contact) | `public/` |
| 2 | Blender avatar (rigged, Idle + Wave animations, GLB) | `blender/create_avatar.py`, `public/assets/models/avatar.glb`, [guide](docs/AVATAR_GUIDE.md) |
| 3 | After Effects promo video | `public/assets/video/promo.mp4`, [guide](docs/VIDEO_GUIDE.md) |
| 4 | RAG chatbot | `api/chat.js`, `lib/rag.js`, `lib/gemini.js`, `scripts/build-index.mjs`, [pipeline](docs/RAG_PIPELINE.md) |
| 5 | Email / contact system | `api/contact.js` + form in `public/index.html` |
| 6 | Deployment | `vercel.json` (steps below) |

### Extra-credit features included
- ✅ 3D objects that react to the mouse (parallax, hover to grow, click empty space to spin them)
- ✅ Dark / light theme (remembered per visitor)
- ✅ Voice interaction with the chatbot (speech input + read-aloud answers)
- ✅ Multilingual chatbot (English / Urdu / Roman Urdu)
- ✅ Animated avatar gestures (wave on click, head follows the mouse)
- ✅ Project filtering and search
- ✅ Website analytics (Vercel Web Analytics)
- ✅ Accessibility (skip link, ARIA labels, keyboard focus styles, reduced-motion support)
- ✅ Chatbot source citations that link to and highlight portfolio sections

## Tech stack
Three.js (CDN, no build step) · HTML/CSS/JavaScript · Node.js serverless functions (no npm dependencies) · Google Gemini API (embeddings + LLM) · Resend (email) · Vercel

## Project structure
```
public/                    ← the website (static files)
  index.html  css/style.css  js/main.js  js/scene.js
  data/profile.json        ← ⭐ ALL your content: edit this one file
  assets/models/avatar.glb   assets/video/promo.mp4   assets/cv.pdf
api/chat.js                ← RAG chatbot endpoint
api/contact.js             ← contact form → email
lib/                       ← rag.js, gemini.js, http.js, env.js
data/knowledge/*.md        ← extra chatbot knowledge (paste CV text)
data/vector-index.json     ← generated vector index
scripts/                   ← build-index.mjs, dev-server.mjs, smoke-test.mjs
blender/create_avatar.py   ← generates the rigged avatar
docs/                      ← RAG, avatar and video guides, screenshots
```

## Setup (local)
Requires **Node.js 18+**. There are no packages to install.

```bash
cd portfolio-3d
copy .env.example .env        # Mac/Linux: cp .env.example .env   — then fill in the keys
npm run build-index           # builds the chatbot's vector index
npm run dev                   # http://localhost:3000
npm test                      # backend checks
```

### Keys (both free)
| Variable | Get it from |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| `RESEND_API_KEY` | https://resend.com → API Keys |
| `CONTACT_TO_EMAIL` | your email (the one you signed up to Resend with) |

Without keys the site still runs: the chatbot uses keyword search and the contact form prints messages in the terminal.

## Personalise
1. Edit **`public/data/profile.json`**: name, about, skills, projects, education… Replace every `TODO`.
2. Paste your CV text into `data/knowledge/cv.md`.
3. Add `public/assets/cv.pdf`, `public/assets/models/avatar.glb` and `public/assets/video/promo.mp4`.
4. Optional project images: put them in `public/assets/images/` and set `"image": "/assets/images/name.png"` in `profile.json`.
5. Run `npm run build-index` again.

## Deploy to Vercel
1. Push the project to GitHub (`.env` is git-ignored, so keys stay private).
2. vercel.com → **Add New → Project** → import the repo. Framework preset: **Other** (settings come from `vercel.json`).
3. **Settings → Environment Variables**: add `GEMINI_API_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, then **Deployments → Redeploy**.
4. **Analytics** tab → Enable Web Analytics.
5. Every deploy runs `build-index`, so the chatbot always matches `profile.json`.

## Security
- API keys live only in environment variables, never in frontend code.
- Contact form: validation on frontend and backend, honeypot field, minimum fill time, link-spam check, per-IP rate limit (5 per 10 min), HTML escaping, header-injection guard, request size limit.
- Chat: input length limits, rate limit (20/min), prompt-injection rules in the system prompt.
- Security headers via `vercel.json`.

## Screenshots
Put them in `docs/screenshots/`: hero with avatar, sections, mobile view, chatbot with citations, contact success + received email, Blender (model, rig, actions), After Effects timeline, Vercel deployment.
