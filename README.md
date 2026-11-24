# HunarCard (हुनरकार्ड) 🛠️
> **"LinkedIn + UPI QR for Bharat's Blue-Collar Workers"**  
> *A voice-first micro-credentialing and digital identity platform converting workers' real work and customer verifications into an Aadhaar-style scannable QR Skill Card and portfolio — zero middleman, zero commission.*

---

## 💡 The One-Line Pitch

"Plumbers, electricians, masons aur carpenters ke liye ek voice-first micro-credentialing platform jo unke asli kaam ke photos/videos aur local customer verifications ko ek scannable Aadhaar-style QR Skill Card aur Instagram-style Work Portfolio mein badalta hai, bina middleman aur bina commission ke."

---

## 🚩 The Problem

Over 500 million skilled unorganized blue-collar tradespersons in India face a persistent identity & trust barrier:
1. **The Digital Divide:** Form wizards and resume builders demand high digital literacy. Workers cannot type complex details, leading to zero digital presence.
2. **The "Middleman Trap":** Aggregator platforms charge heavy commissions (25%–40%), take customer ownership away, and commoditize skilled craftspeople.
3. **The Counterfeit Trust Dilemma:** Without transparent proof, customers default to word-of-mouth or face anxiety regarding safety, skill level, and fair pricing.

---

## ✨ The Solution (Conversational Pillars)

HunarCard solves this through three seamless consumer behaviors:

- **Voice is the Resume:** The worker speaks in casual Hindi or English. Our conversational multi-turn AI helper interviews them like a friendly neighbor and extracts their name, skill, experience, area, and transparent fair wage.
- **Customer Verifications as Micro-Credentials:** Trust is established through real local customer verifications linked to telephone numbers (enforcing anti-fraud: 1 verification per phone per worker) and playable 10-second customer voice notes.
- **Aadhaar-Inspired Official Identity:** A crisp, official-looking digital skill card with unique Skill ID, photo slot, fair-wage indicator, and scannable QR code that works on any phone without installing an app.

---

## ⚡ The "1-1-1" Framework

| Framework | Promise | Experience |
|---|---|---|
| **1 Minute** | Profile Creation | Conversational multi-turn voice interaction builds the entire card. |
| **1 Scan** | Portfolio Access | Instant access to verified photo/video proof without login or app install. |
| **1 Tap** | Direct Booking | Instant direct call, pre-filled WhatsApp chat, or quick booking request. |

---

## 🎙️ How the Conversational Voice-AI Profile Builder Works

Unlike brittle single-shot forms or device-dependent browser SpeechRecognition, HunarCard features a **multimodal raw audio voice pipeline**:
1. **Raw Audio Capture via `MediaRecorder`:** Instead of relying on buggy browser speech-to-text, the mic records audio directly into a raw `.webm` / `.mp4` audio stream across mobile and desktop devices.
2. **Multimodal Audio Processing (Gemini 1.5 Flash):** Sends the audio blob directly to Gemini to listen, transcribe, and extract in **ONE combined multimodal step**:
   - Understands native Hindi, English, and mixed Hinglish code-switching without phoneme dropouts.
   - Extracts 5 core fields: Trade (`Plumber`, `Electrician`, `Mason`, `Carpenter`), Name, Experience Years, Area, and Rate.
   - In **Edit Mode**, receives existing profile JSON and performs partial updates only on the field mentioned (e.g. *"Mera rate ab 400 rupaye hai"*).
3. **High-Clarity Natural Voice Output:** Plays natural studio-quality Hindi audio through HTML `<audio>` elements with guaranteed `hi-IN` neural fallback, preventing garbled English-accent TTS.
4. **Live Card Assembly:** As fields are answered, a real-time card summary displays credentials populating live.
5. **One-Question-At-A-Time Followup:** The AI prompts specifically for whichever field remains missing until all 5 are gathered.
6. **Voice Accent-Protection Loop:** Once completed, the app reads back the entire summary in Hindi (*"Naam: Ramesh, Kaam: Plumber, Experience: 6 Saal — kya sab sahi hai?"*) for final confirmation with ✅ / ❌ buttons.

---

## 💰 Revenue Model: The "Freemium Trust Ladder"

> *"Worker se free, trust ban jaane ke baad optional upgrade; naye customer se chhota lead fee; existing relationship pe zero charge."*

- **Layer 1 — Free Forever (₹0):** Voice profile, Aadhaar-style QR Card, basic portfolio (up to 4 media posts), customer verifications. Drives frictionless grassroots adoption.
- **Layer 2 — "Verified Pro Badge" (₹49/month, Optional):** Unlocks automatically after a worker crosses 5+ authentic verifications. Grants a gold Pro badge, unlimited portfolio uploads, and boosted search placement in the directory.
- **Layer 3 — Micro-Booking Fee (₹15–19):** Charged only when a cold customer books a new job through the public directory. Direct calls or repeat client scans remain 100% free.
- **Layer 4 — Local Hardware Shop Sponsorship (₹199/month):** A "Powered by [Local Sanitary/Hardware Store]" badge beneath the worker's card, monetizing hyper-local B2B vendor partnerships.

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Design System:** Mobile-first, Dark/Light mode (`localStorage`), high-contrast tap targets, Aadhaar-inspired layout
- **Voice I/O:** Browser-native Web Speech API (`SpeechRecognition` + `speechSynthesis`)
- **AI Conversational Layer:** Gemini 1.5 Flash API + Resilient Deterministic Regex/Keyword Fallback
- **Card Rendering & Export:** `qrcode.react` + `html2canvas` for PNG ID download
- **Storage:** Browser `localStorage` with rich pre-seeded Delhi-NCR worker data
- **Icons:** `lucide-react`
- **Deployment:** Vercel-ready with SPA URL rewrites (`vercel.json`)

---

## 🚀 Quickstart & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/track6-1.git
cd track6-1

# 2. Install dependencies
npm install

# 3. (Optional) Set up Gemini API Key in .env.local
echo "VITE_GEMINI_API_KEY=your_key_here" > .env.local

# 4. Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚡ 90-Second Hackathon Demo Script (For Judges)

1. **Login Screen:** Enter your Name and Phone Number (or click a quick-fill seed shortcut for Ramesh / Suresh).
2. **Dashboard:** Notice the persistent top bar with `📍 Sonipat, Haryana`, dark/light mode toggle, and the 1-1-1 promise strip.
3. **Conversational Builder:** Click *"Voice Se Card Banao 🎤"*. Tap the glowing mic and speak: *"Main Ramesh hoon, Sonipat mein 6 saal se plumbing ka kaam karta hoon, 300 rupaye visit charge hai."*
4. **Live Card Assembly:** Watch fields populate in real-time. Confirm with the green checkmark and select a photo to view the **Aadhaar-style Skill Card with QR**.
5. **Public Profile & QR Scan:** Open `/profile/worker-ramesh-001` to view playable voice notes, Instagram-style work grid, and direct booking form.
6. **Live Verification Simulation:** Click the *"Simulate Customer Scan & Verify"* button, enter a phone number and 5-star rating, and watch the status badge immediately flip to Verified!

---

*Built with ❤️ for Bharat's skilled craftspeople — Hack with Delhi 4.0 ("Build for Bharat").*
