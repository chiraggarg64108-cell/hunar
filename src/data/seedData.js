// Realistic Seed Data and Storage Engine for HunarCard
// Sonipat / Delhi-NCR Workers across varying trust states

const STORAGE_KEY = 'hc_workers_v2'
const SEED_FLAG = 'hc_seeded_v3'

export const SKILL_METAS = {
  Plumber: { icon: '🪠', label: 'Plumber / नलसाज', color: '#0F4C81', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
  Electrician: { icon: '💡', label: 'Electrician / बिजली मिस्त्री', color: '#D97706', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
  Mason: { icon: '🧱', label: 'Mason / राजमिस्त्री', color: '#7C3AED', bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' },
  Carpenter: { icon: '🔨', label: 'Carpenter / बढ़ई', color: '#B45309', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
  Painter: { icon: '🎨', label: 'Painter / पेंटर', color: '#EC4899', bg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300' },
  'AC Technician': { icon: '❄️', label: 'AC Technician / एसी मैकेनिक', color: '#06B6D4', bg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300' },
  Other: { icon: '🛠️', label: 'Other / अन्य हुनर', color: '#4B5563', bg: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
}

export function generateSkillId(area = 'SON') {
  const code = area.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'DEL'
  const num = Math.floor(1000 + Math.random() * 9000)
  return `HC-${code}-${num}`
}

const diceAvatar = (seed) => `https://api.dicebear.com/9.x/micah/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`

export const INITIAL_WORKERS = [
  {
    id: 'worker-ramesh-001',
    skillId: 'HC-SON-8421',
    name: 'Ramesh Kumar',
    skill: 'Plumber',
    experience: 6,
    area: 'Sonipat, Haryana',
    rate: '₹300 / visit',
    rateNum: 300,
    rateType: 'visit',
    availability: '8 AM – 8 PM',
    phone: '9876543210',
    avatar: diceAvatar('RameshKumar8421'),
    verificationCount: 5,
    verifiedPhones: ['9811000001', '9811000002', '9811000003', '9811000004', '9811000005'],
    status: 'verified',
    sponsoredBy: 'Sharma Hardware & Sanitary, Sonipat',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    workMedia: [
      { id: 'wm1', type: 'image', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop', verified: true, caption: 'Bathroom Concealed Piping — Sector 14, Sonipat' },
      { id: 'wm2', type: 'image', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&h=500&fit=crop', verified: true, caption: 'Overhead Water Tank Auto-Cut Fitting' },
      { id: 'wm3', type: 'image', url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop', verified: true, caption: 'Kitchen Sink Tap & Waste Pipe Assembly' },
    ],
    reviews: [
      { id: 'rev1', phone: '9811000001', name: 'Anita Sharma ji', rating: 5, text: 'Ramesh ji time par aaye aur ek ghante mein pipe leakage theek kar di. Rate bilkul transparent tha.', audioText: 'Ramesh bhai ne bohot achha kaam kiya. Bilkul sahi rate liya aur bina kisi jhanjhat ke kaam khatam kiya.', date: '3 din pehle' },
      { id: 'rev2', phone: '9811000002', name: 'Rohit Verma ji', rating: 5, text: 'Professional tareeqe se kaam kiya. Bahut clean fitting.', audioText: 'Main Rohit bol raha hoon Sonipat se. Inka kaam bahut badiya hai, pure parivaar ko inka contact de diya hai.', date: '1 hafte pehle' },
      { id: 'rev3', phone: '9811000003', name: 'Sunita Aggarwal', rating: 4, text: 'Kaam badiya tha, standard rate liya.', audioText: 'Kaam to kafi accha tha, agle din phir bula liya tha.', date: '2 hafte pehle' },
    ],
    bookings: [
      { id: 'b1', type: 'small', date: '2026-11-28', area: 'Sector 15, Sonipat', note: 'Bathroom mixer leak kar raha hai', status: 'pending', createdAt: Date.now() - 12 * 60 * 60 * 1000 }
    ]
  },
  {
    id: 'worker-suresh-002',
    skillId: 'HC-BAH-6310',
    name: 'Suresh Yadav',
    skill: 'Electrician',
    experience: 8,
    area: 'Bahalgarh, Sonipat',
    rate: '₹350 / visit',
    rateNum: 350,
    rateType: 'visit',
    availability: '9 AM – 7 PM',
    phone: '9876543211',
    avatar: diceAvatar('SureshYadav6310'),
    verificationCount: 3,
    verifiedPhones: ['9822000001', '9822000002', '9822000003'],
    status: 'verified',
    sponsoredBy: null,
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    workMedia: [
      { id: 'wm4', type: 'image', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&h=500&fit=crop', verified: true, caption: 'Main Switchboard & MCB Distribution Box' },
      { id: 'wm5', type: 'image', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&h=500&fit=crop', verified: true, caption: 'Inverter Wiring & Heavy Fan Installation' }
    ],
    reviews: [
      { id: 'rev4', phone: '9822000001', name: 'Deepak Chawla', rating: 5, text: 'Short circuit emergency mein 20 minute mein pahunche. Zindabad!', audioText: 'Suresh bhai ne raat ko emergency mein aake bijli theek kari. Bohot imaandar karigar hain.', date: '5 din pehle' },
      { id: 'rev5', phone: '9822000002', name: 'Meenakshi ji', rating: 4, text: 'Clean wiring aur sahi bill.', audioText: 'Wiring ka kaam acche se samjhaya aur theek kiya.', date: '10 din pehle' }
    ],
    bookings: []
  },
  {
    id: 'worker-rajesh-003',
    skillId: 'HC-SON-4091',
    name: 'Rajesh Mistri',
    skill: 'Mason',
    experience: 10,
    area: 'Sonipat, Haryana',
    rate: '₹800 / day',
    rateNum: 800,
    rateType: 'day',
    availability: '8 AM – 6 PM',
    phone: '9876543212',
    avatar: diceAvatar('RajeshMistri4091'),
    verificationCount: 0,
    verifiedPhones: [],
    status: 'pending',
    sponsoredBy: null,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    workMedia: [
      { id: 'wm6', type: 'image', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&h=500&fit=crop', verified: false, caption: 'Boundary Wall Brick Masonry & Plaster' }
    ],
    reviews: [],
    bookings: []
  },
  {
    id: 'worker-mohan-004',
    skillId: 'HC-GOH-2784',
    name: 'Mohan Lal Badhai',
    skill: 'Carpenter',
    experience: 7,
    area: 'Gohana, Sonipat',
    rate: '₹600 / day',
    rateNum: 600,
    rateType: 'day',
    availability: '9 AM – 7 PM',
    phone: '9876543213',
    avatar: diceAvatar('MohanBadhai2784'),
    verificationCount: 1,
    verifiedPhones: ['9833000001'],
    status: 'verified',
    sponsoredBy: null,
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    workMedia: [
      { id: 'wm7', type: 'image', url: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=500&h=500&fit=crop', verified: true, caption: 'Modular Kitchen Wooden Cabinets' },
      { id: 'wm8', type: 'image', url: 'https://images.unsplash.com/photo-1534237710431-e2fc698436d0?w=500&h=500&fit=crop', verified: false, caption: 'Teak Wood Door Frame Repair' }
    ],
    reviews: [
      { id: 'rev6', phone: '9833000001', name: 'Harish Malik', rating: 5, text: 'Darwaze ka lock aur frame ekdum perfect fix kiya.', audioText: 'Mohan ji ne lakdi ka kaam badhiya kiya, bilkul tight fitting hai.', date: '4 din pehle' }
    ],
    bookings: []
  },
  {
    id: 'worker-dinesh-005',
    skillId: 'HC-KUN-9125',
    name: 'Dinesh Sharma',
    skill: 'Plumber',
    experience: 4,
    area: 'Kundli, Sonipat',
    rate: '₹250 / visit',
    rateNum: 250,
    rateType: 'visit',
    availability: '24x7 Emergency',
    phone: '9876543214',
    avatar: diceAvatar('DineshSharma9125'),
    verificationCount: 2,
    verifiedPhones: ['9844000001', '9844000002'],
    status: 'verified',
    sponsoredBy: null,
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
    workMedia: [
      { id: 'wm9', type: 'image', url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop', verified: true, caption: 'Bathroom Shower & Jet Spray Fitting' }
    ],
    reviews: [
      { id: 'rev7', phone: '9844000001', name: 'Kavita Singh', rating: 4, text: 'Achhi service, waqt par kaam pura kiya.', audioText: 'Dinesh ji ne nalk ka kaam badiya kiya, rate bhi theek tha.', date: '6 din pehle' }
    ],
    bookings: []
  }
]

export function initSeedData() {
  if (!localStorage.getItem(SEED_FLAG)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_WORKERS))
    localStorage.setItem(SEED_FLAG, 'true')
  }
}

export function getWorkers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : INITIAL_WORKERS
  } catch {
    return INITIAL_WORKERS
  }
}

export function getWorker(id) {
  const workers = getWorkers()
  return workers.find(w => w.id === id || w.skillId === id) || null
}

export function saveWorker(worker) {
  const workers = getWorkers()
  const idx = workers.findIndex(w => w.id === worker.id)
  if (idx >= 0) {
    workers[idx] = worker
  } else {
    workers.unshift(worker)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workers))
  return worker
}

export function addVerification(workerId, customerPhone, rating = 5, reviewText = '') {
  const worker = getWorker(workerId)
  if (!worker) return { success: false, reason: 'not_found' }

  const cleanPhone = customerPhone.replace(/\D/g, '')
  if (worker.verifiedPhones && worker.verifiedPhones.includes(cleanPhone)) {
    return { success: false, reason: 'duplicate' }
  }

  worker.verifiedPhones = [...(worker.verifiedPhones || []), cleanPhone]
  worker.verificationCount = (worker.verificationCount || 0) + 1
  worker.status = 'verified'

  const newReview = {
    id: `rev-${Date.now()}`,
    phone: cleanPhone,
    name: `Customer (•••${cleanPhone.slice(-4)})`,
    rating,
    text: reviewText.trim() || 'Kaam tasalli-bakhsh aur waqt par kiya gaya.',
    audioText: reviewText.trim() || 'Unhone kaam bahut achhi tarah se kiya, hum inko recommend karte hain.',
    date: 'Abhi-abhi'
  }

  worker.reviews = [newReview, ...(worker.reviews || [])]

  // Automatically upgrade the first pending work photo to verified!
  if (worker.workMedia && worker.workMedia.length > 0) {
    const pendingIdx = worker.workMedia.findIndex(m => !m.verified)
    if (pendingIdx >= 0) {
      worker.workMedia[pendingIdx].verified = true
    }
  }

  saveWorker(worker)
  return { success: true, worker }
}

export function addBooking(workerId, bookingData) {
  const worker = getWorker(workerId)
  if (!worker) return false

  const newBooking = {
    id: `bk-${Date.now()}`,
    ...bookingData,
    status: 'pending',
    createdAt: Date.now()
  }

  worker.bookings = [newBooking, ...(worker.bookings || [])]
  saveWorker(worker)
  return true
}

export function addWorkMedia(workerId, mediaItem) {
  const worker = getWorker(workerId)
  if (!worker) return false

  worker.workMedia = [mediaItem, ...(worker.workMedia || [])]
  saveWorker(worker)
  return true
}
