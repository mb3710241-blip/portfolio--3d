# Step by Step Guide (Roman Urdu)

Har step ke end pe ✅ check hai. Ek step complete karo, phir agla.

---

## Step 1: Laptop setup ✅ (ho gaya)
Node.js, VS Code, Git install. GitHub account.

## Step 2: Website laptop pe chalana
1. Ye zip Desktop pe extract karo → `portfolio-3d` folder.
2. VS Code → **File → Open Folder** → `portfolio-3d`.
3. **Terminal → New Terminal**, phir:
   ```
   npm run build-index
   npm run dev
   ```
4. Chrome mein **http://localhost:3000** kholo.
5. Band karna ho: terminal mein **Ctrl + C**. Dobara: `npm run dev`.

> Error "running scripts is disabled" aaye → terminal ke **+ ˅** arrow se **Command Prompt** chuno.

✅ Site khul gayi (placeholder avatar aur TODO text dikhega, ye normal hai).

## Step 3: Apni details dalna
1. VS Code mein `public/data/profile.json` kholo. Jahan **TODO** likha hai wahan apni info likho.
2. `data/knowledge/cv.md` mein apni CV ka text paste karo.
3. CV ki PDF ho to `public/assets/cv.pdf` naam se rakh do.
4. Terminal mein `npm run build-index` dobara chalao, browser refresh karo.

✅ Website pe tumhari details aa gayin.

## Step 4: Chatbot (AI) aur email chalana
1. **Gemini key:** https://aistudio.google.com/apikey → Google se login → **Create API key** → copy.
2. **Resend key:** https://resend.com → sign up (jis email pe messages chahiye) → **API Keys → Create** → copy.
3. Terminal mein: `copy .env.example .env`
4. `.env` file kholo aur bharo:
   ```
   GEMINI_API_KEY=yahan-gemini-key
   RESEND_API_KEY=yahan-resend-key
   CONTACT_TO_EMAIL=wahi-email-jis-se-resend-pe-signup-kiya
   ```
5. **Ctrl + C**, phir `npm run build-index` aur `npm run dev`.
6. Test: chatbot (neeche right 🤖) se poocho "What projects has he made?". Contact form se message bhejo aur email check karo (spam folder bhi).

✅ Chatbot AI answers de raha hai + email inbox mein aa gayi (iska screenshot lo, report mein chahiye).

## Step 5: Blender avatar
`docs/AVATAR_GUIDE.md` follow karo. Short mein:
1. Blender → **Scripting** tab → **Open** → `blender/create_avatar.py` → **▶ Run**.
2. Desktop pe `portfolio-avatar` folder banega: `avatar.blend` + `avatar.glb`.
3. Rang/baal/kapde apne jaise karo, phir **File → Export → glTF 2.0** (GLB).
4. `avatar.glb` ko `public/assets/models/` mein copy karo, website refresh.

✅ Website pe tumhara avatar, click karo to wave karta hai.

## Step 6: After Effects video
`docs/VIDEO_GUIDE.md` mein 45 second ka poora storyboard hai. MP4 bana ke `public/assets/video/promo.mp4` mein rakho.

✅ Video website pe chal rahi hai.

## Step 7: Online karna (GitHub + Vercel)
1. **github.com → New repository** → naam `portfolio-3d` → Create.
2. VS Code terminal mein (apna username dalna):
   ```
   git init
   git add .
   git commit -m "3D portfolio"
   git branch -M main
   git remote add origin https://github.com/APNA-USERNAME/portfolio-3d.git
   git push -u origin main
   ```
   (`.env` upload nahi hogi, keys safe rahengi.)
3. **vercel.com** → GitHub se login → **Add New → Project** → `portfolio-3d` **Import**.
4. **Environment Variables** mein teeno keys dalo (same naam: `GEMINI_API_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`) → **Deploy**.
5. Live link mil jayega: `https://portfolio-3d-xxxx.vercel.app`.
6. Vercel project → **Analytics → Enable** (extra credit).

✅ Live URL kaam kar raha hai. Baad mein koi change karo to `git add . && git commit -m "update" && git push`, Vercel khud update kar dega.

## Step 8: Screenshots aur report
`docs/screenshots/` mein ye screenshots rakho:
- Home page (avatar ke saath), har section, mobile view
- Chatbot ka answer citations ke saath
- Contact form success + inbox mein aayi email
- Blender: model, Pose Mode skeleton, Action Editor
- After Effects timeline
- Vercel deployment page

Phir Claude ko live URL + screenshots bhejo, report ki PDF ban jayegi.

---

## Submission checklist
- [ ] GitHub repo link
- [ ] Live Vercel URL
- [ ] `avatar.blend` + `avatar.glb`
- [ ] `promo.aep` + `promo.mp4`
- [ ] Project report (PDF)
- [ ] README (ye project mein already hai)
- [ ] Screenshots
