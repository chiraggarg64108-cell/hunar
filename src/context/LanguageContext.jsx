import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext()

export const strings = {
  hi: {
    // App Branding
    appName: 'HunarCard',
    appTagline: 'Apna Hunar, Apni Pehchaan',
    location: '📍 Sonipat, Haryana',

    // Nav
    navHome: 'Home',
    navCard: 'Mera Card',
    navDirectory: 'Directory',
    navSettings: 'Settings',

    // 1-1-1 Framework
    promise1Title: '1 Minute',
    promise1Desc: 'Voice se Digital Profile',
    promise2Title: '1 Scan',
    promise2Desc: 'Aadhaar-style QR Card',
    promise3Title: '1 Tap',
    promise3Desc: 'Bina Commission Direct Booking',

    // Login
    loginWelcome: 'Digital Skill Card Banayein',
    loginSub: 'Sirf bolke apna verified portfolio aur QR card banayein',
    inputNameLabel: 'Aapka Pura Naam',
    inputNamePlaceholder: 'e.g. Ramesh Kumar',
    inputPhoneLabel: 'Mobile Number',
    inputPhonePlaceholder: '10-digit mobile number',
    loginBtn: 'Shuru Karein / Login →',
    quickDemoHint: 'Demo Note: Kisi bhi number se turant login karein (OTP ki zaroorat nahi)',

    // Home / Dashboard
    greeting: 'Namaste',
    ctaNoCardTitle: 'Apna Digital Skill Card Banayein',
    ctaNoCardSub: 'Mike dabao aur bolte jao — hamara AI aapka Aadhaar-jaisa card bana dega.',
    startVoiceBtn: 'Voice Se Card Banao 🎤',
    mySkillCardHeading: 'Aapka Digital Skill ID Card',
    actionShareWhatsapp: 'WhatsApp Par Share Karein',
    actionDownloadCard: 'ID Card Download Karein',
    actionAddMedia: 'Kaam Ki Photo/Video Dalein',
    actionViewBookings: 'Aayi Hui Bookings',
    actionSimulateVerify: 'Customer Verification Test (Demo)',
    nudgeOldCustomer: 'Apne purane customer ko QR bhejo aur pehla verification lo',

    // Conversational Voice Builder
    builderTitle: 'Voice Profile Builder',
    builderSub: 'AI Helper ke sath baat karke card banayein',
    aiGreeting: 'Namaste! Chaliye aapka HunarCard banate hain. Pehle ye bataiye — aap kya kaam karte hain?',
    listening: 'Sun raha hoon... Boliye',
    tapToSpeak: 'Bolne ke liye Mic dabayein',
    typeInstead: 'Ya text type karke bhejein',
    sendText: 'Bhejo',
    liveSummaryTitle: 'Aapka Card Ban Raha Hai...',
    fieldMissing: 'Puchh raha hoon...',
    cardReadySuccess: 'Sabhi jaankari mil gayi! Kya ye sahi hai?',
    confirmYes: 'Haan, Sab Sahi Hai ✅',
    confirmEdit: 'Dobara Sahi Karein ✏️',
    photoStepTitle: 'Apni Passport Photo Lagayein',
    photoStepSub: 'Camera se click karein ya gallery se select karein',
    photoUploadBtn: 'Photo Select Karein',
    photoSkipBtn: 'Abhi ke liye chhoden →',

    // Aadhaar Card
    idCardHeaderGov: 'डिजिटल हुनर पहचान पत्र • SKILL IDENTITY CARD',
    idCardEmblem: 'BHARAT HUNAR PRATEEK',
    idCardNumberLabel: 'SKILL ID',
    idCardNameLabel: 'Naam / Name',
    idCardTradeLabel: 'Hunar / Trade',
    idCardExpLabel: 'Tajurba / Exp',
    idCardAreaLabel: 'Kshetr / Location',
    idCardRateLabel: 'Nirdharit Dar / Rate',
    idCardStatusLabel: 'Pramanit / Status',
    verifiedStamp: 'VERIFIED SKILL',
    pendingStamp: 'PENDING VERIFICATION',
    scanToVerify: 'Scan karke kaam dekhein',

    // Directory
    dirTitle: 'Karigar Khojein',
    dirSub: 'Sonipat aur aas-paas ke verified karigar',
    searchPlaceholder: 'Naam, kaam ya area khojein...',
    filterAll: 'Sabhi Hunar',
    noWorkersFound: 'Is filter par koi karigar nahi mila',
    workerCardVerified: 'Verified by {n} Customers',
    workerCardPending: 'Verification Pending',

    // Public Profile
    fairWageHeading: 'Transparent Fair Wage',
    callNow: 'Direct Call',
    chatWhatsapp: 'WhatsApp',
    bookService: 'Book Request',
    workGallery: 'Kaam Ka Saboot (Portfolio)',
    noWorkMedia: 'Abhi photo/video add nahi kiye',
    voiceReviewsHeading: 'Customer Voice Reviews',
    noReviewsYet: 'Abhi koi customer review nahi mila',
    listenVoiceReview: 'Voice Note Sunein 🔊',
    playAgain: 'Wapas Sunein 🔊',
    stopAudio: 'Audio Roko ⏹',

    // Verification Modal
    verifyModalTitle: 'Customer Scan & Verify (Live Demo)',
    verifyModalSub: 'Aap is karigar ke kaam ko confirm karke inka status upgrade kar sakte hain.',
    customerPhoneLabel: 'Aapka Phone Number',
    customerConfirmCheck: 'Haan, maine inse kaam karwaya hai aur kaam sahi tha.',
    customerRatingLabel: 'Star Rating Dijiye',
    voiceReviewOptional: '10-Second Voice Review (Optional)',
    recordVoiceReview: 'Voice Review Record Karein',
    stopRecording: 'Recording Band Karein',
    submitVerification: 'Verify Karke Badge Dein ✅',
    alreadyVerifiedAlert: 'Is phone number se pehle hi verification ho chuka hai! (Anti-fraud rule)',
    verificationSuccessAlert: 'Status safaltapoorvak upgrade ho gaya!',

    // Booking Modal
    bookingModalTitle: 'Karigar Ko Booking Bhejo',
    bookingJobType: 'Kaam Ka Prakar',
    jobSmall: 'Chhota Kaam (1 Din / Visit)',
    jobContract: 'Multi-Day Theka / Project',
    bookingDateLabel: 'Kaam Shuru Karne Ki Tarikh',
    bookingAddressLabel: 'Aapka Pata / Landmark',
    bookingNotesLabel: 'Kaam ke baare mein kuch likhein',
    bookingPlatformFeeNote: 'Naye booking par ₹19 ka chhota platform fee lagta hai — repeat customers ke liye free.',
    submitBooking: 'Booking Request Bhejo 📅',
    bookingSuccessAlert: 'Aapki booking request karigar ke dashboard par bhej di gayi hai!',

    // Settings
    settingsTitle: 'Settings & Account',
    appearanceTheme: 'Theme (Dark / Light Mode)',
    themeLight: 'Light Mode ☀️',
    themeDark: 'Dark Mode 🌙',
    languageSection: 'Bhasha / Language',
    accountInfo: 'Account Ki Jaankari',
    proTierSection: 'HunarCard Pro Ladder',
    proBadgeTitle: 'Verified Pro Badge (₹49/mahina)',
    proBadgeDesc: '5+ Verifications ke baad unlock hota hai. Gold badge, unlimited uploads, aur directory mein top rank.',
    proLockedHint: '5+ customer verifications hone par unlock hoga',
    whyFreeSection: 'HunarCard Kyun Free Hai?',
    whyFreeExplanation: 'Worker se free, trust ban jaane ke baad optional upgrade; naye customer se chhota lead fee; existing relationship pe zero charge.',
    logoutBtn: 'Log Out Karein',

    // General Labels
    years: 'Saal',
    visit: 'Visit',
    day: 'Din',
    verified: 'Verified',
    pending: 'Pending',
    close: 'Band Karein',
    save: 'Save Karein',
    copied: 'Link Copy Ho Gaya!',
  },
  en: {
    // App Branding
    appName: 'HunarCard',
    appTagline: 'Your Work, Your Proof',
    location: '📍 Sonipat, Haryana',

    // Nav
    navHome: 'Home',
    navCard: 'My Card',
    navDirectory: 'Directory',
    navSettings: 'Settings',

    // 1-1-1 Framework
    promise1Title: '1 Minute',
    promise1Desc: 'Voice-First Profile Creation',
    promise2Title: '1 Scan',
    promise2Desc: 'Aadhaar-style Digital Card',
    promise3Title: '1 Tap',
    promise3Desc: 'Zero Commission Direct Booking',

    // Login
    loginWelcome: 'Build Your Digital Skill Card',
    loginSub: 'Speak your credentials into a verified portfolio & scannable QR card',
    inputNameLabel: 'Your Full Name',
    inputNamePlaceholder: 'e.g. Ramesh Kumar',
    inputPhoneLabel: 'Mobile Number',
    inputPhonePlaceholder: '10-digit mobile number',
    loginBtn: 'Continue / Login →',
    quickDemoHint: 'Demo Note: Login with any phone number instantly (no OTP needed)',

    // Home / Dashboard
    greeting: 'Welcome',
    ctaNoCardTitle: 'Build Your Digital Skill Card',
    ctaNoCardSub: 'Tap the mic and speak — our conversational AI crafts your official Aadhaar-style skill card.',
    startVoiceBtn: 'Build Card With Voice 🎤',
    mySkillCardHeading: 'Your Digital Skill ID Card',
    actionShareWhatsapp: 'Share Card on WhatsApp',
    actionDownloadCard: 'Download ID Card',
    actionAddMedia: 'Add Work Proof (Photos/Videos)',
    actionViewBookings: 'Incoming Bookings',
    actionSimulateVerify: 'Simulate Customer Verification (Demo)',
    nudgeOldCustomer: 'Send your QR to a previous customer to get your first verification',

    // Conversational Voice Builder
    builderTitle: 'Voice Profile Builder',
    builderSub: 'Talk to the AI assistant to assemble your card',
    aiGreeting: 'Hello! Let us build your HunarCard. First, please tell me — what trade or work do you do?',
    listening: 'Listening... Please speak',
    tapToSpeak: 'Tap Mic To Speak',
    typeInstead: 'Or type message here',
    sendText: 'Send',
    liveSummaryTitle: 'Live Card Assembly...',
    fieldMissing: 'Asking...',
    cardReadySuccess: 'All profile details gathered! Does this look accurate?',
    confirmYes: 'Yes, All Correct ✅',
    confirmEdit: 'Edit Details ✏️',
    photoStepTitle: 'Attach ID Photo',
    photoStepSub: 'Click a photo or select from your gallery',
    photoUploadBtn: 'Choose Photo',
    photoSkipBtn: 'Skip for now →',

    // Aadhaar Card
    idCardHeaderGov: 'DIGITAL SKILL IDENTITY CARD • हुनर पहचान पत्र',
    idCardEmblem: 'BHARAT SKILL AUTHORITY',
    idCardNumberLabel: 'SKILL ID',
    idCardNameLabel: 'Name / नाम',
    idCardTradeLabel: 'Trade / हुनर',
    idCardExpLabel: 'Experience / अनुभव',
    idCardAreaLabel: 'Location / क्षेत्र',
    idCardRateLabel: 'Rate / दर',
    idCardStatusLabel: 'Status / स्थिति',
    verifiedStamp: 'VERIFIED WORKER',
    pendingStamp: 'PENDING VERIFICATION',
    scanToVerify: 'Scan QR to view verified portfolio',

    // Directory
    dirTitle: 'Verified Workers Directory',
    dirSub: 'Skilled tradespersons across Sonipat & Delhi NCR',
    searchPlaceholder: 'Search by name, trade or area...',
    filterAll: 'All Trades',
    noWorkersFound: 'No workers found matching this filter',
    workerCardVerified: 'Verified by {n} Customers',
    workerCardPending: 'Verification Pending',

    // Public Profile
    fairWageHeading: 'Transparent Fair Wage',
    callNow: 'Direct Call',
    chatWhatsapp: 'WhatsApp',
    bookService: 'Request Booking',
    workGallery: 'Proof of Work (Portfolio)',
    noWorkMedia: 'No work photos uploaded yet',
    voiceReviewsHeading: 'Customer Voice Reviews',
    noReviewsYet: 'No customer voice reviews yet',
    listenVoiceReview: 'Play Voice Note 🔊',
    playAgain: 'Replay Voice Note 🔊',
    stopAudio: 'Stop Audio ⏹',

    // Verification Modal
    verifyModalTitle: 'Customer Scan & Verify (Live Demo)',
    verifyModalSub: 'Confirm that this worker completed a job for you to elevate their trust score.',
    customerPhoneLabel: 'Your Mobile Number',
    customerConfirmCheck: 'Yes, I hired this worker and the work was completed satisfactorily.',
    customerRatingLabel: 'Star Rating',
    voiceReviewOptional: '10-Second Voice Review (Optional)',
    recordVoiceReview: 'Record Voice Note',
    stopRecording: 'Stop Recording',
    submitVerification: 'Verify & Award Badge ✅',
    alreadyVerifiedAlert: 'This mobile number has already verified this worker once! (Anti-fraud restriction)',
    verificationSuccessAlert: 'Worker status successfully upgraded to Verified!',

    // Booking Modal
    bookingModalTitle: 'Send Booking Request',
    bookingJobType: 'Type of Work',
    jobSmall: 'Small Job (1 Day / Visit)',
    jobContract: 'Multi-Day Project / Contract',
    bookingDateLabel: 'Target Start Date',
    bookingAddressLabel: 'Your Address / Landmark',
    bookingNotesLabel: 'Notes or job details',
    bookingPlatformFeeNote: 'A small ₹19 platform fee applies for new customer bookings — free for repeat clients.',
    submitBooking: 'Send Booking Request 📅',
    bookingSuccessAlert: 'Booking request sent directly to the worker dashboard!',

    // Settings
    settingsTitle: 'Settings & Preferences',
    appearanceTheme: 'Theme (Dark / Light Mode)',
    themeLight: 'Light Mode ☀️',
    themeDark: 'Dark Mode 🌙',
    languageSection: 'Language / भाषा',
    accountInfo: 'Account Information',
    proTierSection: 'HunarCard Pro Ladder',
    proBadgeTitle: 'Verified Pro Badge (₹49/month)',
    proBadgeDesc: 'Unlocks at 5+ Verifications. Includes gold badge, unlimited media uploads, and top directory ranking.',
    proLockedHint: 'Unlocks automatically after 5+ customer verifications',
    whyFreeSection: 'Why Is HunarCard Free?',
    whyFreeExplanation: 'Free for workers, optional upgrade after trust builds; small lead fee from new customers; zero charge on existing relationships.',
    logoutBtn: 'Log Out',

    // General Labels
    years: 'Years',
    visit: 'Visit',
    day: 'Day',
    verified: 'Verified',
    pending: 'Pending',
    close: 'Close',
    save: 'Save',
    copied: 'Link copied to clipboard!',
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('hc_lang') || 'hi')

  const toggleLang = () => {
    const newLang = lang === 'hi' ? 'en' : 'hi'
    setLang(newLang)
    localStorage.setItem('hc_lang', newLang)
  }

  const t = (key, vars = {}) => {
    let str = strings[lang]?.[key] || strings['en']?.[key] || key
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v)
    })
    return str
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
