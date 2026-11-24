// HunarCard Real Multimodal Audio-to-Gemini Voice Agent Engine
// True Multimodal Audio Listening (MediaRecorder + Gemini 2.5 Flash / 2.0 Flash)
// Web Speech API / SpeechRecognition completely eliminated in favor of raw audio to Gemini

// 1. Text Sanitizer for Clean Human Voice Output (TTS)
export function sanitizeTextForSpeech(text) {
  if (!text) return ''
  return text
    // Remove URLs
    .replace(/https?:\/\/\S+/gi, '')
    // Remove markdown code fences & inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    // Remove markdown symbols (*, _, #, ~, [, ], (, ))
    .replace(/[*_#~[\]()]/g, '')
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    // Remove excess whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

// 2. High-Quality Indian TTS Voice Selection
let cachedVoices = []

export function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  cachedVoices = window.speechSynthesis.getVoices()
  return cachedVoices
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices()
  }
  loadVoices()
}

export function getBestVoiceForLang(langCode = 'en-IN') {
  const voices = cachedVoices.length ? cachedVoices : loadVoices()
  if (!voices || !voices.length) return null

  if (langCode === 'hi-IN' || langCode === 'hi') {
    const priorityList = [
      v => v.name.includes('Google हिन्दी') || v.name.includes('Google Hindi'),
      v => v.name.toLowerCase().includes('lekha'),
      v => v.name.toLowerCase().includes('swara'),
      v => v.name.toLowerCase().includes('madhur'),
      v => v.lang === 'hi-IN' || v.lang === 'hi_IN',
      v => v.lang.startsWith('hi'),
      v => v.name.includes('Google English (India)') || v.name.includes('Google English India'),
      v => v.name.toLowerCase().includes('rishi'),
      v => v.name.toLowerCase().includes('neerja'),
      v => v.lang === 'en-IN' || v.lang === 'en_IN'
    ]
    for (const matcher of priorityList) {
      const match = voices.find(matcher)
      if (match) return match
    }
  } else {
    const priorityList = [
      v => v.name.includes('Google हिन्दी') || v.name.includes('Google Hindi'),
      v => v.name.includes('Google English (India)') || v.name.includes('Google English India'),
      v => v.name.toLowerCase().includes('rishi'),
      v => v.name.toLowerCase().includes('neerja'),
      v => v.name.toLowerCase().includes('lekha'),
      v => v.lang === 'en-IN' || v.lang === 'en_IN',
      v => v.lang.startsWith('hi'),
      v => v.name.toLowerCase().includes('samantha'),
      v => v.lang.startsWith('en')
    ]
    for (const matcher of priorityList) {
      const match = voices.find(matcher)
      if (match) return match
    }
  }

  return voices[0] || null
}

// 3. Gemini API Key Management
export function getGeminiApiKey() {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('hunarcard_gemini_key')
    if (local && local.trim()) return local.trim()
  }
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GEMINI_API_KEY : null
  if (env && env.trim()) return env.trim()
  return ''
}

export function setGeminiApiKey(key) {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem('hunarcard_gemini_key', key.trim())
    } else {
      localStorage.removeItem('hunarcard_gemini_key')
    }
  }
}

export function isGeminiKeyConfigured() {
  return Boolean(getGeminiApiKey())
}

// 3.1 Dynamic Gemini Model Discovery (Never hardcode deprecated models like gemini-2.0-flash)
export async function discoverWorkingModels(apiKey) {
  const key = (apiKey || getGeminiApiKey() || '').trim()
  if (!key) return ['gemini-2.5-flash']

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`)
    if (!res.ok) {
      console.warn(`[GeminiVoice] Failed to list models: HTTP ${res.status}`)
      return ['gemini-2.5-flash']
    }
    const data = await res.json()
    if (!Array.isArray(data?.models)) {
      return ['gemini-2.5-flash']
    }

    // Filter models supporting generateContent and containing 'flash'
    let candidateModels = data.models
      .filter(m => {
        const methods = m.supportedGenerationMethods || []
        const canGen = methods.includes('generateContent')
        const name = (m.name || '').toLowerCase()
        const isFlash = name.includes('flash')
        const isExcluded = name.includes('tts') || name.includes('image') || name.includes('embedding') || name.includes('thinking')
        return canGen && isFlash && !isExcluded
      })
      .map(m => (m.name || '').replace(/^models\//, ''))

    // Fallback if all were excluded
    if (candidateModels.length === 0) {
      candidateModels = data.models
        .filter(m => {
          const methods = m.supportedGenerationMethods || []
          return methods.includes('generateContent') && (m.name || '').toLowerCase().includes('flash')
        })
        .map(m => (m.name || '').replace(/^models\//, ''))
    }

    if (candidateModels.length === 0) {
      return ['gemini-2.5-flash']
    }

    // Sort: prefer gemini-2.5-flash, or latest gemini-3.*-flash / gemini-flash-latest, avoid 2.0-flash
    candidateModels.sort((a, b) => {
      const score = (raw) => {
        const n = raw.toLowerCase()
        if (n === 'gemini-2.5-flash') return 100
        if (n.startsWith('gemini-3.') && n.includes('flash')) return 95
        if (n.includes('flash-latest')) return 90
        if (n === 'gemini-1.5-flash') return 80
        if (n.includes('1.5-flash')) return 75
        if (n.includes('2.0-flash')) return 10
        return 70
      }
      return score(b) - score(a)
    })

    return candidateModels
  } catch (err) {
    console.warn('[GeminiVoice] Error listing Gemini models:', err)
    return ['gemini-2.5-flash']
  }
}

export async function getWorkingGeminiModel(apiKey, forceRefresh = false) {
  const key = (apiKey || getGeminiApiKey() || '').trim()
  if (typeof window !== 'undefined' && !forceRefresh) {
    const cached = sessionStorage.getItem('hunarcard_gemini_model')
    if (cached && !cached.includes('2.0-flash')) {
      return cached
    }
  }

  const discovered = await discoverWorkingModels(key)
  const bestModel = discovered[0] || 'gemini-2.5-flash'

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('hunarcard_gemini_model', bestModel)
  }
  return bestModel
}

// 3.2 Real Connection Test for Gemini API Key
export async function testGeminiApiKey(candidateKey) {
  const key = (candidateKey || getGeminiApiKey() || '').trim()
  if (!key) {
    return { success: false, error: 'Please enter a Gemini API key.' }
  }

  // Get active models list dynamically
  const discovered = await discoverWorkingModels(key)
  const models = [...discovered]
  if (!models.includes('gemini-2.5-flash')) {
    models.push('gemini-2.5-flash')
  }

  let lastError = ''
  let lastStatus = null

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
      console.log(`[GeminiVoice] Testing connection on ${model}...`)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply OK' }] }]
        })
      })

      lastStatus = res.status
      if (res.ok) {
        console.log(`[GeminiVoice] Connection test succeeded on model ${model}`)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('hunarcard_gemini_model', model)
        }
        return { success: true, message: '✅ Connected! Voice AI ready.', model }
      }

      let errMessage = ''
      try {
        const errJson = await res.json()
        errMessage = errJson?.error?.message || ''
      } catch {
        errMessage = await res.text()
      }
      lastError = errMessage || `HTTP ${res.status}`
      console.warn(`[GeminiVoice] Connection test on ${model} returned ${res.status}:`, lastError)

      if (res.status === 404) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('hunarcard_gemini_model')
        }
        // Proceed to next model in loop
        continue
      } else if (res.status === 400 || res.status === 403) {
        // Bad key / leaked key: stop immediately
        break
      }
    } catch (err) {
      lastError = err.message
      console.warn(`[GeminiVoice] Connection test fetch on ${model} failed:`, err)
    }
  }

  return {
    success: false,
    error: lastStatus
      ? `Error ${lastStatus}: ${lastError.slice(0, 120)}`
      : `Connection error: ${lastError || 'Network failed'}`
  }
}

// 4. Dynamic Audio MIME Type Detection for MediaRecorder & Gemini
export function cleanAudioMimeType(mimeType) {
  if (!mimeType) return 'audio/webm'
  const base = mimeType.split(';')[0].trim().toLowerCase()
  if (base.includes('webm')) return 'audio/webm'
  if (base.includes('mp4')) return 'audio/mp4'
  if (base.includes('ogg')) return 'audio/ogg'
  if (base.includes('wav')) return 'audio/wav'
  if (base.includes('aac')) return 'audio/aac'
  return 'audio/webm'
}

export function getPreferredAudioMimeType() {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm'
  }
  const candidateTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus'
  ]
  for (const t of candidateTypes) {
    if (MediaRecorder.isTypeSupported?.(t)) {
      return t
    }
  }
  return 'audio/webm'
}

// 5. Convert Audio Blob to Base64 (strip prefix cleanly)
export async function audioBlobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      try {
        const dataUrl = reader.result
        if (typeof dataUrl === 'string') {
          // Strictly remove data:...;base64, prefix
          const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '').trim()
          resolve(base64)
        } else {
          reject(new Error('FileReader result is not a string'))
        }
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// 6. Comprehensive English & Hindi Number Words Dictionary
export const COMPOUND_NUMBERS = {
  'five hundred': 500, 'paanch sau': 500, 'panch sau': 500,
  'four hundred': 400, 'chaar sau': 400, 'char sau': 400,
  'three hundred': 300, 'teen sau': 300,
  'two hundred': 200, 'do sau': 200,
  'one hundred': 100, 'ek sau': 100
}

export const NUMBER_WORDS = {
  // English words
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
  'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
  'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
  'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
  'hundred': 100,

  // Hindi words (Latin phonetic & Devanagari)
  'ek': 1, 'do': 2, 'teen': 3, 'tin': 3, 'chaar': 4, 'char': 4, 'paanch': 5, 'panch': 5,
  'che': 6, 'chhah': 6, 'chhe': 6, 'chheh': 6, 'saat': 7, 'sat': 7, 'aath': 8, 'ath': 8,
  'nau': 9, 'das': 10, 'gyarah': 11, 'baarah': 12, 'terah': 13, 'chaudah': 14,
  'pandrah': 15, 'solah': 16, 'satrah': 17, 'athaarah': 18, 'unnis': 19, 'bees': 20,
  'sau': 100,
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10, 'सौ': 100
}

export const SKILL_MAP = {
  Painter: [
    'painter', 'painting', 'paint', 'rang', 'safedi', 'distemper', 'putai',
    'wall paint', 'color', 'whitewash',
    'कलर', 'पेंट', 'पेंटर', 'सफेदी', 'पुताई', 'रंग'
  ],
  'AC Technician': [
    'ac', 'air conditioner', 'split ac', 'cooling', 'hvac', 'gas charging',
    'ac repair', 'ac service', 'compressor', 'fridge',
    'एसी', 'कूलिंग', 'एयर कंडीशनर', 'एसी मैकेनिक'
  ],
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
  Carpenter: [
    'carpenter', 'carpentry', 'wood', 'lakdi', 'furniture', 'door', 'darwaza',
    'almirah', 'table', 'chair', 'cabinet', 'badhai', 'barhai', 'khati',
    'lakdi ka', 'lakdi ka kaam',
    'बढ़ई', 'बढ़ई', 'कारपेंटर', 'लकड़ी', 'फर्नीचर', 'दरवाजा', 'अलमारी'
  ],
  Mason: [
    'mason', 'masonry', 'cement', 'brick', 'eent', 'deewar', 'plaster', 'chhat',
    'construction', 'banai', 'nirmaan', 'rajmistri', 'raj mistri', 'raj',
    'chinai', 'chunai', 'mistry', 'deewar ka', 'karigar deewar',
    'राजमिस्त्री', 'मिस्त्री', 'चिनाई', 'दीवार', 'सीमेंट', 'ईंट', 'कंस्ट्रक्शन', 'मकान'
  ]
}

const COMMON_AREAS = [
  'Sonipat', 'Bahalgarh', 'Gohana', 'Kundli', 'Murthal', 'Kharkhoda',
  'Delhi', 'Gurugram', 'Gurgaon', 'Faridabad', 'Noida', 'Rohtak', 'Panipat',
  'Karnal', 'Sector 14', 'Sector 15', 'Model Town', 'Subhash Nagar',
  'सोनीपत', 'बहालगढ़', 'गोहाना', 'कुंडली', 'मुरथल', 'दिल्ली', 'रोहतक', 'पानीपत'
]

// 7. Bulletproof Local NLP Fallback (Fixes "Six years", Hindi numbers, rate & trade parsing)
export function runLocalAgentBrain({ transcript, currentProfile = {}, mode = 'onboarding', lastQuestion = '' }) {
  const text = (transcript || '').trim()
  const lower = text.toLowerCase()
  const isEdit = mode === 'edit'

  const updates = {}
  let intent = 'provide_info'

  // A. Check Confirmation & Rejection Intents
  const yesMatches = [
    'haan', 'sahi hai', 'theek hai', 'thik hai', 'yes', 'save', 'done',
    'perfect', 'confirm', 'bilkul', 'chalega', 'yep', 'yeah', 'sahi',
    'हाँ', 'सही है', 'ठीक है', 'बिल्कुल', 'सेव'
  ]
  const noMatches = [
    'nahi', 'galat', 'no', 'badlo', 'dobara', 'change', 'nahi hai', 'wrong',
    'गलत', 'नहीं', 'बदलो'
  ]

  if (yesMatches.some(w => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w))) {
    return {
      transcript: text,
      updates: {},
      intent: 'confirm_yes',
      replyText: isEdit
        ? 'Bahut badiya! Aapka updated card save ho gaya hai.'
        : 'Bahut accha! Aapka HunarCard generate ho raha hai.',
      shouldAutoListen: false
    }
  }

  if (noMatches.some(w => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w))) {
    return {
      transcript: text,
      updates: {},
      intent: 'confirm_no',
      replyText: 'Koi baat nahi. Kya badalna chahte hain? Jaise rate, area, experience ya kaam boliye.',
      shouldAutoListen: true
    }
  }

  // B. Extract Trade / Skill
  for (const [skill, keywords] of Object.entries(SKILL_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) {
      updates.trade = skill
      updates.skill = skill
      break
    }
  }

  // C. Extract Experience — Supports digits ("6", "6 saal", "6 years") AND number words ("Six years", "paanch saal")
  // Check digit matches first
  const digitExpMatch = text.match(/(\d+)\s*(?:saal|sal|year|years|varsh|साल|वर्ष)?/i)
  let foundExp = null

  // Check if last question was asking about experience
  const askingExp = /tajurba|experience|saal|kitne saal/i.test(lastQuestion || '')

  if (digitExpMatch && (text.match(/saal|sal|year|years|varsh|साल|वर्ष/i) || askingExp)) {
    const num = parseInt(digitExpMatch[1], 10)
    if (num > 0 && num <= 50) {
      foundExp = num
    }
  }

  // Check English and Hindi number words (e.g. "Six years", "paanch saal", "ten years")
  if (!foundExp) {
    for (const [word, val] of Object.entries(NUMBER_WORDS)) {
      if (val > 0 && val <= 50) {
        const regex = new RegExp(`\\b${word}\\s*(?:saal|sal|year|years|varsh|साल|वर्ष)?\\b`, 'i')
        if (regex.test(lower)) {
          if (text.match(/saal|sal|year|years|varsh|साल|वर्ष/i) || askingExp) {
            foundExp = val
            break
          }
        }
      }
    }
  }

  if (foundExp !== null) {
    updates.experience = `${foundExp} Years`
  }

  // D. Extract Rate — Supports numbers & number words (e.g., "300 rupaye", "₹400", "three hundred", "teen sau")
  let foundRate = null
  let foundRateType = 'visit'

  const isDay = /din|day|दिन/i.test(lower)
  if (isDay) foundRateType = 'day'

  // Digit match
  const rateDigitMatch = text.match(/(?:₹|rs\.?|rupaye?|rupees?|रुपये|रु|rate)?\s*(\d{2,5})\s*(?:per|\/|ka)?\s*(visit|din|day|hour|ghanta|विजिट|दिन)?/i)
  if (rateDigitMatch && parseInt(rateDigitMatch[1], 10) >= 50) {
    foundRate = parseInt(rateDigitMatch[1], 10)
  }

  // Compound word match for rate (e.g. "three hundred", "teen sau", "four hundred")
  if (!foundRate) {
    for (const [phrase, val] of Object.entries(COMPOUND_NUMBERS)) {
      if (lower.includes(phrase)) {
        foundRate = val
        break
      }
    }
  }

  // Single word match for rate
  if (!foundRate) {
    for (const [word, val] of Object.entries(NUMBER_WORDS)) {
      if (val >= 50) {
        const regex = new RegExp(`(?:rate|charges?|rupaye?|rupees?|₹)?\\s*\\b${word}\\b`, 'i')
        if (regex.test(lower)) {
          foundRate = val
          break
        }
      }
    }
  }

  if (foundRate) {
    updates.rate = `₹${foundRate} / ${foundRateType}`
    updates.rateNum = foundRate
    updates.rateType = foundRateType
  }

  // E. Extract Area
  for (const area of COMMON_AREAS) {
    if (lower.includes(area.toLowerCase())) {
      updates.area = area === 'सोनीपत' ? 'Sonipat, Haryana' : area
      break
    }
  }

  // F. Extract Name
  const nameMatch = text.match(/(?:mera naam|my name is|naam|main hoon|naam hai|मेरा नाम|नाम है)\s+([a-zA-Z\u0900-\u097F]+(?:\s+[a-zA-Z\u0900-\u097F]+)?)/i)
  if (nameMatch && nameMatch[1]) {
    const candidate = nameMatch[1].trim()
    const excluded = [
      'plumber', 'electrician', 'mason', 'carpenter', 'painter', 'sonipat',
      'delhi', 'kaam', 'mein', 'ek', 'काम', 'यहाँ', 'नल', 'बिजली'
    ]
    if (!excluded.includes(candidate.toLowerCase())) {
      updates.name = candidate.replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  // G. Extract Availability / Timing
  if (/(?:24\s*(?:x\s*7|ghante|hours)|emergency|available|subah|shaam|am|pm|baje|timing|समय)/i.test(lower)) {
    if (/24\s*(?:x\s*7|ghante|hours)|emergency/i.test(lower)) {
      updates.availability = '24x7 Emergency'
    } else {
      const matchRange = text.match(/(?:subah\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:se|to|-)\s*(?:shaam\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i)
      if (matchRange) {
        updates.availability = `${matchRange[1]} – ${matchRange[2]}`
      } else {
        const directTime = text.match(/(\d{1,2}\s*(?:am|pm)\s*[-–to]\s*\d{1,2}\s*(?:am|pm))/i)
        if (directTime) {
          updates.availability = directTime[1]
        }
      }
    }
  }

  const hasUpdates = Object.keys(updates).length > 0
  const merged = { ...currentProfile, ...updates }

  if (isEdit) {
    intent = hasUpdates ? 'edit_field' : 'clarify'
    const replyText = hasUpdates
      ? `Aapka ${updates.availability ? 'timing ' + updates.availability : updates.rate ? 'rate ' + updates.rate : (updates.area || updates.trade || updates.experience || 'detail')} update ho gaya hai. Kya sab theek hai?`
      : 'Aap jo detail badalna chahte hain vo bolein, jaise "mera rate 400 rupaye kar do" ya "timing 9 AM to 7 PM kar do".'

    return {
      transcript: text,
      updates,
      intent,
      replyText,
      shouldAutoListen: true
    }
  }

  // Onboarding flow: Next missing field (availability is optional)
  const missing = []
  if (!merged.trade && !merged.skill) missing.push('trade')
  if (!merged.name) missing.push('name')
  if (!merged.experience) missing.push('experience')
  if (!merged.area) missing.push('area')
  if (!merged.rate) missing.push('rate')

  if (missing.length === 0) {
    intent = 'finish'
    const replyText = `Bahut badiya! Aapki details note ho gayi: ${merged.name}, ${merged.trade || merged.skill}, ${merged.experience}, ${merged.area}, rate ${merged.rate}${merged.availability ? ', timing ' + merged.availability : ''}. Kya ye sab sahi hai?`
    return {
      transcript: text,
      updates,
      intent,
      replyText,
      shouldAutoListen: true
    }
  }

  const nextField = missing[0]
  let replyText = ''
  if (nextField === 'trade') {
    replyText = 'Aap kya kaam karte hain? Jaise Plumber, Electrician, Mason, Carpenter, Painter ya AC Technician?'
  } else if (nextField === 'name') {
    replyText = 'Aapka shubh naam kya hai?'
  } else if (nextField === 'experience') {
    replyText = `${merged.name ? merged.name + ' ji, ' : ''}Aapko is kaam ka kitne saal ka tajurba hai?`
  } else if (nextField === 'area') {
    replyText = 'Aap mukhyatah kis shahar ya area mein kaam karte hain?'
  } else if (nextField === 'rate') {
    replyText = 'Aapka visit charge ya ek din ka rate kitna hai?'
  }

  return {
    transcript: text,
    updates,
    intent: hasUpdates ? 'provide_info' : 'clarify',
    replyText,
    shouldAutoListen: true
  }
}

// 8. TRUE MULTIMODAL AUDIO TO GEMINI 2.5 FLASH REST API
export async function callGeminiMultimodalAudio({
  audioBase64,
  base64Audio,
  mimeType = 'audio/webm',
  currentProfile = {},
  mode = 'onboarding',
  lastQuestion = '',
  apiKey = null
}) {
  const effectiveKey = (apiKey || getGeminiApiKey() || '').trim()
  const finalAudioBase64 = (audioBase64 || base64Audio || '').trim()

  if (!effectiveKey) {
    console.warn("[GeminiVoice] No Gemini API Key found.")
    return { error: 'Gemini API key missing: add it in Settings.' }
  }

  if (!finalAudioBase64) {
    console.error("[GeminiVoice] No base64 audio data provided.")
    return { error: 'Mic se awaaz record nahi hui, Chrome mic permission check karein' }
  }

  // CRITICAL: Strip any codecs=opus or parameters from mimeType before sending to Gemini
  const cleanMime = cleanAudioMimeType(mimeType)

  const isEdit = mode === 'edit'
  const systemInstruction = `Listen carefully to the user's audio. They may speak Hindi, English, Haryanvi, or Hinglish mixed together (e.g., 'Main plumber hoon', 'Six years', '6 saal', 'Sonipat', '300 rupaye').

CURRENT MODE: "${mode}" (${isEdit ? 'EDIT EXISTING PROFILE - ONLY update whichever field the user asked to change. Leave other fields intact.' : 'ONBOARDING NEW WORKER'})
CURRENT PROFILE: ${JSON.stringify({
    trade: currentProfile.trade || currentProfile.skill || null,
    name: currentProfile.name || null,
    experience: currentProfile.experience || null,
    area: currentProfile.area || null,
    rate: currentProfile.rate || null,
    availability: currentProfile.availability || null
  })}
LAST QUESTION ASKED: "${lastQuestion || ''}"

TASK:
1. Transcribe accurately what they ACTUALLY said in clean natural Hinglish/English.
2. Extract ANY profile fields mentioned (trade, name, experience as a number/string like '6 Years', area, rate as number/string like '₹300', availability as timing like '9 AM – 7 PM', 'Subah 8 – Shaam 6', '24x7 Emergency'). Normalize trade strictly to one of: Plumber, Electrician, Mason, Carpenter, Painter, AC Technician.
3. If in edit mode, update whichever field the user asked to change.
4. Write a short, warm, natural 1-sentence Hindi/Hinglish reply asking for the NEXT missing core field (or confirming the edit). Availability is optional.
5. Return ONLY valid JSON (no markdown fences, no conversational prose outside JSON):
{
  "transcript": "exact clean text user spoke",
  "updates": {
    "trade": "string or null",
    "name": "string or null",
    "experience": "string or number or null",
    "area": "string or null",
    "rate": "string or null",
    "availability": "string or null"
  },
  "intent": "provide_info | edit_field | confirm_yes | confirm_no | finish",
  "replyText": "short warm Hindi/Hinglish response",
  "shouldAutoListen": true
}`

  // Get active working models dynamically (never hardcode 2.0-flash)
  const initialModel = await getWorkingGeminiModel(effectiveKey)
  let models = [initialModel]
  const allDiscovered = await discoverWorkingModels(effectiveKey)
  for (const m of allDiscovered) {
    if (!models.includes(m)) models.push(m)
  }
  if (!models.includes('gemini-2.5-flash')) models.push('gemini-2.5-flash')

  let parsed = null
  let lastError = ''
  let lastStatus = null

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(effectiveKey)}`
      console.log(`[GeminiVoice] Sending request to ${model} (MIME: "${cleanMime}", payload: ${Math.round(finalAudioBase64.length / 1024)} KB)...`)

      // Parts order: text prompt first, then inlineData audio
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: systemInstruction
              },
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: finalAudioBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          maxOutputTokens: 250,
          thinkingConfig: { thinkingBudget: 0 }
        }
      }

      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      lastStatus = res.status
      console.log(`[GeminiVoice] ${model} HTTP status:`, res.status)

      // Safety fallback: if Gemini returns a 400 error mentioning thinkingConfig, retry once without thinkingConfig
      if (res.status === 400 && requestBody.generationConfig?.thinkingConfig) {
        let errPeek = ''
        try {
          const cloned = res.clone()
          const errJ = await cloned.json()
          errPeek = errJ?.error?.message || ''
        } catch {}
        if (errPeek.toLowerCase().includes('thinking')) {
          console.warn(`[GeminiVoice] 400 mentioning thinkingConfig on ${model} (${errPeek}). Retrying without thinkingConfig...`)
          delete requestBody.generationConfig.thinkingConfig
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          })
          lastStatus = res.status
          console.log(`[GeminiVoice] Retry without thinkingConfig status:`, res.status)
        }
      }

      if (res.ok) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('hunarcard_gemini_model', model)
        }
        const data = await res.json()
        console.log(`[GeminiVoice] Response JSON from ${model}:`, data)

        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const cleaned = rawText.replace(/```json\s*|```/gi, '').trim()

        try {
          parsed = JSON.parse(cleaned)
        } catch (jsonErr) {
          console.warn('[GeminiVoice] Direct JSON parse failed, trying between braces:', jsonErr)
          const firstBrace = cleaned.indexOf('{')
          const lastBrace = cleaned.lastIndexOf('}')
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
              const extracted = cleaned.slice(firstBrace, lastBrace + 1)
              parsed = JSON.parse(extracted)
            } catch (e2) {
              console.error('[GeminiVoice] Braces JSON extraction failed:', e2)
              return { error: `Gemini JSON parse error: ${cleaned.slice(0, 100)}` }
            }
          } else {
            return { error: `Gemini JSON parse error: ${cleaned.slice(0, 100)}` }
          }
        }
        break
      } else {
        let errMessage = ''
        try {
          const errJson = await res.json()
          console.error(`[GeminiVoice] Error JSON from ${model}:`, errJson)
          errMessage = errJson?.error?.message || ''
        } catch {
          errMessage = await res.text()
          console.error(`[GeminiVoice] Error text from ${model}:`, errMessage)
        }
        lastError = errMessage || `HTTP ${res.status}`
        if (res.status === 404) {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('hunarcard_gemini_model')
          }
          console.warn(`[GeminiVoice] ${model} returned 404, clearing cache and retrying next model...`)
          continue
        } else if (res.status === 429) {
          console.warn(`[GeminiVoice] ${model} returned 429 quota, retrying next model...`)
          continue
        } else if (res.status === 400 || res.status === 403) {
          break
        }
      }
    } catch (fetchErr) {
      lastError = fetchErr.message
      console.error(`[GeminiVoice] Fetch error for ${model}:`, fetchErr)
    }
  }

  if (parsed && (parsed.transcript || parsed.replyText)) {
    // Normalize updates: map trade -> skill and clean nulls
    const cleanUpdates = {}
    if (parsed.updates) {
      Object.entries(parsed.updates).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== 'null') {
          cleanUpdates[k] = v
        }
      })
      if (cleanUpdates.trade && !cleanUpdates.skill) {
        cleanUpdates.skill = cleanUpdates.trade
      }
      if (cleanUpdates.skill && !cleanUpdates.trade) {
        cleanUpdates.trade = cleanUpdates.skill
      }
      if (cleanUpdates.rate) {
        const numMatch = String(cleanUpdates.rate).match(/\d+/)
        if (numMatch) {
          cleanUpdates.rateNum = parseInt(numMatch[0], 10)
        }
      }
    }

    return {
      transcript: parsed.transcript || '',
      updates: cleanUpdates,
      intent: parsed.intent || 'provide_info',
      replyText: parsed.replyText || 'Bahut badiya!',
      shouldAutoListen: parsed.shouldAutoListen !== false
    }
  }

  return {
    error: lastStatus
      ? `Gemini Error (${lastStatus}): ${lastError.slice(0, 120)}`
      : `Gemini Connection Error: ${lastError || 'Network failed'}`
  }
}

// 9. Process Text Turn through Gemini or Local Fallback
export async function callGeminiTextBrain({
  text,
  currentProfile = {},
  mode = 'onboarding',
  lastQuestion = '',
  apiKey = null
}) {
  const effectiveKey = apiKey || getGeminiApiKey()

  if (!effectiveKey) {
    return runLocalAgentBrain({ transcript: text, currentProfile, mode, lastQuestion })
  }

  try {
    const isEdit = mode === 'edit'
    const systemPrompt = `You are HunarCard Conversational Voice Agent.
Listen carefully to the user's input: "${text}"

CURRENT MODE: "${mode}" (${isEdit ? 'EDIT EXISTING PROFILE' : 'ONBOARDING NEW WORKER'})
CURRENT PROFILE: ${JSON.stringify({
      trade: currentProfile.trade || currentProfile.skill || null,
      name: currentProfile.name || null,
      experience: currentProfile.experience || null,
      area: currentProfile.area || null,
      rate: currentProfile.rate || null,
      availability: currentProfile.availability || null
    })}
LAST QUESTION: "${lastQuestion || ''}"

1. Transcribe accurately what they meant in clean natural Hinglish/English.
2. Extract ANY profile fields mentioned (trade, name, experience as a number/string like '6 Years', area, rate as number/string like '₹300', availability as timing like '9 AM – 7 PM', 'Subah 8 – Shaam 6', '24x7 Emergency'). Normalize trade strictly to one of: Plumber, Electrician, Mason, Carpenter, Painter, AC Technician.
3. If in edit mode, update whichever field the user asked to change.
4. Write a short, warm, natural 1-sentence Hindi/Hinglish reply asking for the NEXT missing field (or confirming the edit). Timing/availability is optional.
5. Return ONLY valid JSON (no markdown fences):
{
  "transcript": "${text}",
  "updates": { "trade": null, "name": null, "experience": null, "area": null, "rate": null, "availability": null },
  "intent": "provide_info | edit_field | confirm_yes | confirm_no | finish",
  "replyText": "short warm response",
  "shouldAutoListen": true
}`

    const activeModel = await getWorkingGeminiModel(effectiveKey)
    let models = [activeModel]
    const allDiscovered = await discoverWorkingModels(effectiveKey)
    for (const m of allDiscovered) {
      if (!models.includes(m)) models.push(m)
    }
    if (!models.includes('gemini-2.5-flash')) models.push('gemini-2.5-flash')

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(effectiveKey)}`
      const textRequestBody = {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          maxOutputTokens: 250,
          thinkingConfig: { thinkingBudget: 0 }
        }
      }

      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(textRequestBody)
      })

      // Safety fallback: if Gemini returns 400 error mentioning thinkingConfig, retry once without thinkingConfig
      if (res.status === 400 && textRequestBody.generationConfig?.thinkingConfig) {
        let errPeek = ''
        try {
          const cloned = res.clone()
          const errJ = await cloned.json()
          errPeek = errJ?.error?.message || ''
        } catch {}
        if (errPeek.toLowerCase().includes('thinking')) {
          delete textRequestBody.generationConfig.thinkingConfig
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(textRequestBody)
          })
        }
      }

      if (res.ok) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('hunarcard_gemini_model', model)
        }
        const data = await res.json()
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const cleaned = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleaned)

        const cleanUpdates = {}
        if (parsed.updates) {
          Object.entries(parsed.updates).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== 'null') {
              cleanUpdates[k] = v
            }
          })
          if (cleanUpdates.trade && !cleanUpdates.skill) cleanUpdates.skill = cleanUpdates.trade
          if (cleanUpdates.skill && !cleanUpdates.trade) cleanUpdates.trade = cleanUpdates.skill
        }

        return {
          transcript: parsed.transcript || text,
          updates: cleanUpdates,
          intent: parsed.intent || 'provide_info',
          replyText: parsed.replyText || 'Bahut badiya!',
          shouldAutoListen: parsed.shouldAutoListen !== false
        }
      }

      if (res.status === 404) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('hunarcard_gemini_model')
        }
        continue
      } else {
        break
      }
    }
  } catch (err) {
    console.warn("Gemini text call failed, falling back to local brain:", err.message)
  }

  return runLocalAgentBrain({ transcript: text, currentProfile, mode, lastQuestion })
}
