# Module 3: Promo Video (Adobe After Effects) — 45 seconds

## Setup
1. **Composition → New Composition**: name `Promo`, **1920×1080**, **30 fps**, duration **0:00:45:00**, background dark (#0B0B14).
2. Import (**Ctrl+I**): website screenshots, an avatar render (see below), a music track.
3. Save often: **File → Save As** → `promo.aep` (this is the project file you submit).

**Avatar render for the video:** in Blender press **F12** (renders the camera view) → *Image → Save As* PNG. For a turntable: select the *Avatar* rig, key rotation Z = 0° at frame 1 and 360° at frame 120, then **Render → Render Animation** (Output: PNG sequence) and import the sequence in AE.

## Storyboard

| Time | Scene | What to show | How in After Effects |
|---|---|---|---|
| 0–4 s | Intro | Gradient background + glowing particles, "Hi, I'm" | Solid layer + **Effect → Generate → 4-Color Gradient**; text with **Animation Presets → Text → Animate In → Typewriter** |
| 4–9 s | Name | **MUHAMMAD BASIM** big, then "Software Developer · 3D · AI" | Text layer, scale 0→100% with **Easy Ease (F9)**; subtitle with *Fade Up Characters* preset |
| 9–15 s | Avatar | Avatar render/turntable slides in from the right, waves | Position keyframes + **Motion Blur**; **Drop Shadow** effect |
| 15–24 s | Skills | 4 skill groups pop in (C++, JavaScript, OpenGL, Blender, RAG…) | Shape layers (rounded rectangles) + text; offset each layer 5 frames; **Trim Paths** for underline |
| 24–36 s | Projects | 3 project cards: Portfolio, Spider Game, SAP Report (screenshots) | Put screenshots in a 3D layer (cube icon), animate **Y Rotation** for a card-flip; Camera layer with slow push-in |
| 36–41 s | Chatbot | Screenshot of the AI chat answering a question | Mask reveal (**Rectangle tool** mask, animate Mask Path) |
| 41–45 s | Outro | "Explore my 3D portfolio" + website URL + email | Text + **Glow** effect, fade to black |

**Typography:** 2 fonts max (e.g. *Space Grotesk* headings, *Inter* body — the same as the website).
**Colours:** purple #7C5CFF, cyan #22D3EE, dark #0B0B14.
**Transitions:** keep them consistent (slide or fade), 10–15 frames each.

## Music (must be properly licensed)
Use royalty-free music and credit it in the report:
- **Pixabay Music** (pixabay.com/music) — free, no attribution required
- **YouTube Audio Library** (studio.youtube.com → Audio Library)
Add a soft *whoosh* sound on transitions. Fade music out in the last 2 s (audio levels keyframes).

## Export to MP4
- AE 2023+: **Composition → Add to Render Queue** → Format **H.264** → Output `promo.mp4`.
- Older AE: **File → Export → Add to Adobe Media Encoder Queue** → H.264, preset *Match Source – High bitrate*.
- Keep the file under ~25 MB (bitrate ~4–6 Mbps) so the website loads fast.

Copy `promo.mp4` to `public/assets/video/promo.mp4`. Optional poster image: save a frame as `public/assets/video/poster.jpg` and add `poster="/assets/video/poster.jpg"` to the `<video>` tag in `public/index.html`.

## Submit
- `promo.aep` (After Effects project) — use **File → Dependencies → Collect Files** so images/music travel with it
- `promo.mp4`
- Screenshot of the AE timeline for the report
