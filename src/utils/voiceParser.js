// Voice Parsing & Conversational AI Engine for HunarCard
// Multimodal Audio Input (MediaRecorder + Gemini Audio API) + TTS clarity + Edit Mode

export const SKILL_KEYWORDS = {
  Plumber: [
    'plumber', 'plumbing', 'nal', 'nalka', 'nalkaa', 'pipe', 'paip', 'leakage',
    'bathroom', 'toilet', 'water', 'pani', 'panikari', 'mistry pani', 'tap',
    'naal', 'plumb', 'सैनेटरी', 'प्लंबर', 'प्लम्बर', 'नल', 'पाइप', 'पानी', 'नलसाज'
  ],
  Electrician: [
    'electric', 'bijli', 'wiring', 'wire', 'switch', 'board', 'mcb', 'fan',
    'light', 'inverter', 'generator', 'electrician', 'bijlikar', 'line',
    'बिजली', 'इलेक्ट्रीशियन', 'वायरिंग', 'स्विच', 'पंखा', 'लाइट', 'इन्वर्टर', 'लाइनमैन'
  ],
  Mason: [
    'mason', 'masonry', 'cement', 'brick', 'eent', 'deewar', 'plaster', 'chhat',
    'construction', 'banai', 'nirmaan', 'rajmistri', 'raj mistri', 'raj',
    'chinai', 'chunai', 'mistry', 'deewar ka', 'karigar deewar',
    'राजमिस्त्री', 'मिस्त्री', 'चिनाई', 'दीवार', 'सीमेंट', 'ईंट', 'कंस्ट्रक्शन', 'मकान'
  ],
  Carpenter: [
    'carpenter', 'carpentry', 'wood', 'lakdi', 'furniture', 'door', 'darwaza',
    'almirah', 'table', 'chair', 'cabinet', 'badhai', 'barhai', 'khati',
    'lakdi ka', 'lakdi ka kaam',
    'बढ़ई', 'बढ़ई', 'कारपेंटर', 'लकड़ी', 'फर्नीचर', 'दरवाजा', 'अलमारी'
  ],
}

const COMMON_AREAS = [
  'Sonipat', 'Bahalgarh', 'Gohana', 'Kundli', 'Murthal', 'Kharkhoda',
  'Delhi', 'Gurugram', 'Gurgaon', 'Faridabad', 'Noida', 'Rohtak', 'Panipat',
  'Karnal', 'Sector 14', 'Sector 15', 'Model Town', 'Subhash Nagar',
  'सोनीपत', 'बहालगढ़', 'गोहाना', 'कुंडली', 'मुरथल', 'दिल्ली', 'रोहतक', 'पानीपत'
]

// Extract numbers from Hindi/English speech
function extractNumber(text) {
  const match = text.match(/\d+/)
  if (match) return parseInt(match[0], 10)
  const map = {
    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    'gyarah': 11, 'barah': 12, 'pandrah': 15, 'bees': 20, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10
  }
  const words = text.toLowerCase().split(/\s+/)
  for (const w of words) {
    if (map[w]) return map[w]
  }
  return null
}

// Check which fields are missing from current state
export function getMissingField(profile) {
  if (!profile.skill) return 'skill'
  if (!profile.name) return 'name'
  if (!profile.experience) return 'experience'
  if (!profile.area) return 'area'
  if (!profile.rate) return 'rate'
  return null
}

// Generate friendly Hindi follow-up questions
export function getFollowupQuestion(missingField, name = '') {
  switch (missingField) {
    case 'skill':
      return 'Aap kya kaam karte hain? Jaise Plumber, Bijli (Electrician), Rajmistri (Mason), ya Badhai (Carpenter)?'
    case 'name':
      return 'Bahut accha! Aapka shubh naam kya hai?'
    case 'experience':
      return `${name ? name + ' ji, ' : ''}Aapko is kaam ka kitne saal ka tajurba (experience) hai?`
    case 'area':
      return 'Aap mukhyatah kis area ya shahar mein kaam karte hain? (Jaise Sonipat, Bahalgarh, Kundli...)'
    case 'rate':
      return 'Aapka aamtaur par visit charge ya ek din ka dar (rate) kitna hota hai?'
    default:
      return 'Sabhi jaankari mil gayi hai! Kripya niche review karke confirm karein.'
  }
}

// ==========================================
// PART A: Raw Audio Recorder via MediaRecorder
// ==========================================
export class RawAudioRecorder {
  constructor() {
    this.mediaRecorder = null
    this.stream = null
    this.audioChunks = []
    this.mimeType = 'audio/webm'
  }

  async start() {
    this.audioChunks = []
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        this.mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        this.mimeType = 'audio/webm'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        this.mimeType = 'audio/mp4'
      } else {
        this.mimeType = ''
      }
    }

    this.mediaRecorder = this.mimeType
      ? new MediaRecorder(this.stream, { mimeType: this.mimeType })
      : new MediaRecorder(this.stream)

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.audioChunks.push(e.data)
      }
    }

    this.mediaRecorder.start(100)
    console.log("MediaRecorder started, mimeType:", this.mimeType || 'default')
  }

  async stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve({ blob: null, base64: null, mimeType: 'audio/webm' })
        return
      }

      this.mediaRecorder.onstop = () => {
        const cleanMime = (this.mimeType || 'audio/webm').split(';')[0]
        const audioBlob = new Blob(this.audioChunks, { type: cleanMime })

        // Stop all tracks to release hardware mic
        if (this.stream) {
          this.stream.getTracks().forEach(t => t.stop())
        }

        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result
          const base64 = typeof dataUrl === 'string' ? dataUrl.split(',')[1] : null
          resolve({ blob: audioBlob, base64, mimeType: cleanMime })
        }
        reader.readAsDataURL(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  }
}

// ==========================================
// PART A & C: Process Audio directly with Gemini
// ==========================================
export async function processAudioWithGemini({
  audioBase64,
  mimeType = 'audio/webm',
  currentProfile = {},
  isEditMode = false,
  apiKey = null
}) {
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GEMINI_API_KEY : null
  const effectiveKey = apiKey || envKey

  if (!effectiveKey || !audioBase64) {
    console.warn("processAudioWithGemini: No API key or audioBase64 provided")
    return null
  }

  try {
    const promptText = isEditMode
      ? `You are HunarCard AI, listening directly to an Indian blue-collar worker who wants to EDIT their existing profile.
CURRENT WORKER PROFILE:
${JSON.stringify({
  name: currentProfile.name || null,
  skill: currentProfile.skill || null,
  experience_years: currentProfile.experience || null,
  area: currentProfile.area || null,
  rate: currentProfile.rate || null,
})}

TASK:
1. Listen carefully to the audio and transcribe what the worker said in Hindi, English, or Hinglish into the "transcript" field.
2. The user wants to update one or more fields by speaking (e.g. "Mera rate ab 400 rupaye hai" or "Area Sonipat Sector 15 kar do").
3. ONLY change the field(s) they explicitly mention in this audio, and leave all other fields exactly as they were in CURRENT WORKER PROFILE.
4. Return ONLY valid JSON in this exact shape, nothing else before or after:
{
  "transcript": "what it heard, for display purposes",
  "name": "string or null",
  "skill": "Plumber|Electrician|Mason|Carpenter or null",
  "experience_years": "number or null",
  "area": "string or null",
  "rate": "number or null",
  "missing_fields": [],
  "next_question_hindi": "Aapka card update ho gaya hai. Kya sab sahi hai?"
}`
      : `You are HunarCard AI, a friendly Indian assistant listening to a blue-collar worker speak in Hindi, English, or natural mixed Hinglish.
CURRENT PROFILE SO FAR:
${JSON.stringify({
  name: currentProfile.name || null,
  skill: currentProfile.skill || null,
  experience_years: currentProfile.experience || null,
  area: currentProfile.area || null,
  rate: currentProfile.rate || null,
})}

TASK:
1. Listen carefully to the audio and transcribe it into the "transcript" field.
2. In ONE COMBINED STEP, extract relevant profile fields:
   - name: worker's name
   - skill: Plumber (match: pipe, nal, plumber), Electrician (match: bijli, wiring, electrician), Mason (match: rajmistri, construction, deewar), Carpenter (match: badhai, lakdi, furniture), or free-text other.
   - experience_years: number of years (e.g. 6)
   - area: locality/city (e.g. Sonipat, Bahalgarh, Delhi)
   - rate: number amount only (e.g. 300, 400, 800)
3. Update new fields without erasing existing good values.
4. Identify which fields are still missing among: name, skill, experience, area, rate.
5. Generate ONE short, warm Hindi follow-up question for only the next missing field in "next_question_hindi" (or null if all 5 are present).

Respond in ONLY this exact JSON shape, nothing else:
{
  "transcript": "what it heard, for display purposes",
  "name": "string or null",
  "skill": "string or null",
  "experience_years": "number or null",
  "area": "string or null",
  "rate": "number or null",
  "missing_fields": ["list of field names still missing"],
  "next_question_hindi": "one short Hindi follow-up question, or null if nothing is missing"
}`

    const payload = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: audioBase64
              }
            },
            {
              text: promptText
            }
          ]
        }
      ]
    }

    console.log("GEMINI MULTIMODAL AUDIO PAYLOAD SENT:", { mimeType, promptLength: promptText.length })

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      const data = await res.json()
      const rawResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      console.log("RAW AI RESPONSE (Audio Multimodal):", rawResponseText)

      const cleaned = rawResponseText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
      let parsed = null
      try {
        parsed = JSON.parse(cleaned)
      } catch (err) {
        console.error("JSON.parse error on Gemini Audio response:", err, rawResponseText)
      }

      if (parsed) {
        return formatParsedResponse(parsed, currentProfile, isEditMode)
      }
    } else {
      const errBody = await res.text()
      console.warn("Gemini Audio API error:", res.status, errBody)
    }
  } catch (e) {
    console.error("processAudioWithGemini network error:", e)
  }

  return null
}

// Format and merge parsed output into profile state safely
function formatParsedResponse(parsed, currentProfile, isEditMode = false) {
  const transcript = parsed.transcript || ''
  const extractedSkill = (parsed.skill && parsed.skill !== 'null') ? parsed.skill : null
  const extractedName = (parsed.name && parsed.name !== 'null') ? parsed.name : null
  const extractedExp = parsed.experience_years ? parseInt(parsed.experience_years, 10) : null
  const extractedArea = (parsed.area && parsed.area !== 'null') ? parsed.area : null

  let formattedRate = currentProfile.rate || null
  let rateNum = currentProfile.rateNum || null
  let rateType = currentProfile.rateType || 'visit'

  if (parsed.rate && parsed.rate !== 'null') {
    const num = typeof parsed.rate === 'number' ? parsed.rate : parseInt(String(parsed.rate).replace(/\D/g, ''), 10)
    if (num && num >= 50) {
      rateNum = num
      const isDay = /din|day|दिन/i.test(String(parsed.rate)) || /din|day|दिन/i.test(transcript)
      rateType = isDay ? 'day' : 'visit'
      formattedRate = `₹${num} / ${rateType}`
    }
  }

  // PART C: Explicit Partial Merge
  const updatedProfile = {
    ...currentProfile,
    name: extractedName !== null ? extractedName : currentProfile.name,
    skill: extractedSkill !== null ? extractedSkill : currentProfile.skill,
    experience: extractedExp !== null ? extractedExp : currentProfile.experience,
    area: extractedArea !== null ? extractedArea : currentProfile.area,
    rate: formattedRate !== null ? formattedRate : currentProfile.rate,
    rateNum: rateNum !== null ? rateNum : currentProfile.rateNum,
    rateType: rateType !== null ? rateType : currentProfile.rateType,
  }

  const nextMissing = isEditMode ? null : getMissingField(updatedProfile)
  const replyMessage = parsed.next_question_hindi || (
    isEditMode
      ? `Aapka profile update ho gaya hai: ${updatedProfile.name}, ${updatedProfile.skill}, Rate ${updatedProfile.rate}. Kya sab sahi hai?`
      : (nextMissing ? getFollowupQuestion(nextMissing, updatedProfile.name) : `Bahut badiya! Aapka card taiyaar ho gaya: ${updatedProfile.name || 'Worker'}, ${updatedProfile.skill}, ${updatedProfile.experience} saal tajurba, ${updatedProfile.area}, rate ${updatedProfile.rate}. Kya ye sahi hai?`)
  )

  return {
    transcript,
    updatedProfile: { ...updatedProfile, _expecting: nextMissing },
    replyMessage,
    isComplete: !nextMissing
  }
}

// Local deterministic keyword extractor (PART C: handles both create and edit)
export function extractFieldsLocal(transcript, currentProfile = {}, isEditMode = false) {
  const lower = transcript.toLowerCase()
  const updated = { ...currentProfile }

  // 1. Skill extraction
  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      updated.skill = skill
      break
    }
  }

  // 2. Name extraction (only if explicitly stated or expecting name)
  const nameMatch = transcript.match(/(?:mera naam|my name is|naam|main hoon|naam hai|मेरा नाम|नाम है)\s+([a-zA-Z\u0900-\u097F]+(?:\s+[a-zA-Z\u0900-\u097F]+)?)/i)
  if (nameMatch && nameMatch[1]) {
    const candidate = nameMatch[1].trim()
    const excluded = ['plumber', 'electrician', 'mason', 'carpenter', 'sonipat', 'delhi', 'kaam', 'mein', 'ek', 'काम', 'यहाँ', 'नल']
    if (!excluded.includes(candidate.toLowerCase())) {
      updated.name = candidate.replace(/\b\w/g, l => l.toUpperCase())
    }
  } else if (!isEditMode && currentProfile._expecting === 'name') {
    const words = transcript.trim().split(/\s+/).slice(0, 3).join(' ')
    if (words && words.length > 2) {
      updated.name = words.replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  // 3. Experience extraction
  const expMatch = transcript.match(/(\d+)\s*(?:saal|sal|year|years|varsh|साल|वर्ष)/i)
  if (expMatch) {
    updated.experience = parseInt(expMatch[1], 10)
  } else if (!isEditMode && currentProfile._expecting === 'experience') {
    const num = extractNumber(transcript)
    if (num && num > 0 && num < 60) updated.experience = num
  }

  // 4. Area extraction
  for (const area of COMMON_AREAS) {
    if (lower.includes(area.toLowerCase())) {
      updated.area = area === 'सोनीपत' ? 'Sonipat, Haryana' : area
      break
    }
  }
  if (!updated.area && !isEditMode && currentProfile._expecting === 'area') {
    const clean = transcript.replace(/[.,!?]/g, '').trim()
    if (clean.length > 2) {
      updated.area = clean.replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  // 5. Rate extraction (e.g. "400 rupaye", "₹500 per day", "mera rate 400 hai")
  const rateMatch = transcript.match(/(?:₹|rs\.?|rupaye?|rupees?|रुपये|रु|rate)?\s*(\d{2,5})\s*(?:per|\/|ka)?\s*(visit|din|day|hour|ghanta|विजिट|दिन)?/i)
  if (rateMatch && parseInt(rateMatch[1], 10) >= 50) {
    const amount = parseInt(rateMatch[1], 10)
    const isDay = /din|day|दिन/i.test(rateMatch[2] || '') || /din|day|दिन/i.test(lower)
    updated.rate = `₹${amount} / ${isDay ? 'day' : 'visit'}`
    updated.rateNum = amount
    updated.rateType = isDay ? 'day' : 'visit'
  }

  return updated
}

// Text turn processor (Fallback when user types text)
export async function processTextTurn(text, currentProfile = {}, isEditMode = false, apiKey = null) {
  console.log("PROCESSING TEXT INPUT:", text)

  const envKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GEMINI_API_KEY : null
  const effectiveKey = apiKey || envKey

  if (effectiveKey) {
    try {
      const promptText = isEditMode
        ? `You are HunarCard AI. The worker wants to EDIT their profile by typing: "${text}".
CURRENT PROFILE: ${JSON.stringify({
  name: currentProfile.name || null,
  skill: currentProfile.skill || null,
  experience_years: currentProfile.experience || null,
  area: currentProfile.area || null,
  rate: currentProfile.rate || null,
})}
ONLY change fields explicitly mentioned. Leave everything else unchanged.
Respond in ONLY this JSON shape:
{
  "transcript": "${text}",
  "name": "string or null",
  "skill": "Plumber|Electrician|Mason|Carpenter or null",
  "experience_years": "number or null",
  "area": "string or null",
  "rate": "number or null",
  "missing_fields": [],
  "next_question_hindi": "Aapka card update ho gaya hai. Kya sab sahi hai?"
}`
        : `You are HunarCard AI. Extract worker profile from text: "${text}".
CURRENT PROFILE: ${JSON.stringify(currentProfile)}
Respond in ONLY this JSON shape:
{
  "transcript": "${text}",
  "name": "string or null",
  "skill": "string or null",
  "experience_years": "number or null",
  "area": "string or null",
  "rate": "number or null",
  "missing_fields": ["list of field names still missing"],
  "next_question_hindi": "one short Hindi follow-up question, or null if nothing is missing"
}`

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      })

      if (res.ok) {
        const data = await res.json()
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const cleaned = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return formatParsedResponse(parsed, currentProfile, isEditMode)
      }
    } catch (e) {
      console.warn("processTextTurn API error, falling back to local:", e)
    }
  }

  // Deterministic local fallback
  const updated = extractFieldsLocal(text, currentProfile, isEditMode)
  const nextMissing = isEditMode ? null : getMissingField(updated)
  const replyMessage = isEditMode
    ? `Aapka rate/detail update ho gaya hai: ${updated.rate || ''}. Kya sab sahi hai?`
    : (nextMissing ? getFollowupQuestion(nextMissing, updated.name) : `Bahut badiya! Sabhi jaankari mil gayi. Kya sab sahi hai?`)

  return {
    transcript: text,
    updatedProfile: { ...updated, _expecting: nextMissing },
    replyMessage,
    isComplete: !nextMissing
  }
}

// ==========================================
// PART B: High-Clarity Voice Output (TTS)
// ==========================================
let currentAudioElement = null

export function getBestHindiVoice() {
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  // Look for exact hi-IN voice first (e.g. Google हिन्दी, Lekha, etc.)
  let voice = voices.find(v => v.lang === 'hi-IN' || v.lang === 'hi_IN')
  if (!voice) {
    voice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी'))
  }
  if (!voice) {
    voice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'))
  }
  return voice || null
}

export function speakText(text, lang = 'hi', onEnd = null) {
  stopSpeaking()

  // Clean text for speech (remove markdown symbols)
  const cleanText = text.replace(/[*_#`~[\]]/g, '').trim()
  if (!cleanText) return

  // STEP B.2: Try Natural Neural Audio first (high clarity across all phones/browsers)
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=hi&client=tw-ob&q=${encodeURIComponent(cleanText.slice(0, 180))}`
  const audio = new Audio(googleTtsUrl)
  currentAudioElement = audio

  let playedNeural = false

  audio.onended = () => {
    currentAudioElement = null
    onEnd?.()
  }

  audio.onerror = () => {
    // Fallback to speechSynthesis with guaranteed hi-IN voice selection
    if (!playedNeural) {
      fallbackSpeechSynthesis(cleanText, lang, onEnd)
    }
  }

  audio.play()
    .then(() => {
      playedNeural = true
      console.log("PLAYING NEURAL TTS AUDIO (High Clarity Hindi)")
    })
    .catch((err) => {
      console.log("Audio play blocked or offline, using SpeechSynthesis with hi-IN voice:", err.message)
      fallbackSpeechSynthesis(cleanText, lang, onEnd)
    })
}

function fallbackSpeechSynthesis(cleanText, lang, onEnd) {
  if (!('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.lang = 'hi-IN'
  utterance.rate = 0.88 // slightly measured pace for Indian ear clarity
  utterance.pitch = 1.0

  const hindiVoice = getBestHindiVoice()
  if (hindiVoice) {
    utterance.voice = hindiVoice
    console.log("SELECTED TTS VOICE:", `${hindiVoice.name} (${hindiVoice.lang})`)
  } else {
    console.log("TTS VOICE: No dedicated Hindi voice detected, using system default hi-IN")
  }

  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause()
      currentAudioElement.currentTime = 0
    } catch {}
    currentAudioElement = null
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

// Soft work photo check
export function isWorkProofImage(file) {
  if (!file) return true
  if (file.type.startsWith('video/')) return true
  const name = file.name.toLowerCase()
  const suspicious = ['selfie', 'screenshot', 'dp', 'avatar', 'profile_pic', 'me_at_home']
  return !suspicious.some(s => name.includes(s))
}
