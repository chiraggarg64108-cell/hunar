import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext()

export const strings = {
  hi: {
    // App Branding
    appName: 'हुनरकार्ड',
    appTagline: 'आपका हुनर, आपकी पहचान',
    location: '📍 सोनीपत, हरियाणा',

    // Nav
    navHome: 'होम',
    navCard: 'मेरा कार्ड',
    navDirectory: 'कारीगर',
    navSettings: 'सेटिंग्स',

    // 1-1-1 Framework
    promise1Title: '1 मिनट',
    promise1Desc: 'बोलकर डिजिटल प्रोफाइल बनाएं',
    promise2Title: '1 स्कैन',
    promise2Desc: 'आधार जैसा क्यूआर कार्ड',
    promise3Title: '1 टैप',
    promise3Desc: 'सीधी बुकिंग, बिना कमीशन',

    // Login
    loginWelcome: 'डिजिटल हुनर कार्ड बनाएं',
    loginSub: 'सिर्फ बोलकर अपना वेरिफाइड पोर्टफोलियो और QR कार्ड बनाएं',
    inputNameLabel: 'आपका पूरा नाम',
    inputNamePlaceholder: 'जैसे: रमेश कुमार',
    inputPhoneLabel: 'मोबाइल नंबर',
    inputPhonePlaceholder: '10 अंकों का मोबाइल नंबर',
    loginBtn: 'शुरू करें / लॉगिन →',
    quickDemoHint: 'डेमो नोट: किसी भी नंबर से तुरंत लॉगिन करें (OTP की ज़रूरत नहीं)',

    // Home / Dashboard
    greeting: 'नमस्ते',
    ctaNoCardTitle: 'अपना डिजिटल हुनर कार्ड बनाएं',
    ctaNoCardSub: 'माइक दबाकर बोलें — हमारा AI आपका आधार जैसा कार्ड तुरंत बना देगा।',
    startVoiceBtn: 'बोलकर कार्ड बनाएं 🎤',
    mySkillCardHeading: 'आपका डिजिटल स्किल कार्ड',
    actionShareWhatsapp: 'कार्ड शेयर करें',
    actionDownloadCard: 'कार्ड डाउनलोड करें',
    actionAddMedia: 'काम की फोटो/वीडियो जोड़ें',
    actionViewBookings: 'आई हुई बुकिंग्स',
    actionSimulateVerify: 'कस्टमर वेरिफिकेशन टेस्ट (डेमो)',
    nudgeOldCustomer: 'अपने पुराने कस्टमर को QR भेजें और पहला वेरिफिकेशन पाएं',

    // Conversational Voice Builder
    builderTitle: 'बोलकर प्रोफाइल बनाएं',
    builderSub: 'AI हेल्पर से बातचीत करके अपना कार्ड बनाएं',
    aiGreeting: 'नमस्ते! चलिए आपका हुनरकार्ड बनाते हैं। पहले यह बताइए — आप क्या काम करते हैं?',
    listening: 'सुन रही हूँ... बोलिए',
    tapToSpeak: 'बोलने के लिए माइक दबाएं',
    typeInstead: 'या यहाँ लिखकर भेजें...',
    sendText: 'भेजें',
    liveSummaryTitle: 'प्रोफाइल कार्ड तैयार हो रहा है...',
    fieldMissing: 'पूछ रही हूँ...',
    cardReadySuccess: 'सारी जानकारी मिल गई! क्या सब सही है?',
    confirmYes: 'हाँ, सब सही है ✅',
    confirmEdit: 'बदलना चाहते हैं? ✏️',
    photoStepTitle: 'पासपोर्ट फोटो लगाएं',
    photoStepSub: 'कैमरा से फोटो खींचें या गैलरी से चुनें',
    photoUploadBtn: 'फोटो चुनें',
    photoSkipBtn: 'अभी छोड़ें →',

    // Field labels
    trade: 'काम / हुनर',
    name: 'नाम',
    experience: 'तजुर्बा',
    area: 'एरिया',
    rate: 'रेट',
    selectTrade: 'अपना काम चुनें',

    // Aadhaar Card
    idCardHeaderGov: 'डिजिटल हुनर पहचान पत्र • SKILL IDENTITY CARD',
    idCardEmblem: 'भारत हुनर प्रतीक',
    idCardNumberLabel: 'SKILL ID',
    idCardNameLabel: 'नाम / Name',
    idCardTradeLabel: 'काम / Trade',
    idCardExpLabel: 'तजुर्बा / Exp',
    idCardAreaLabel: 'क्षेत्र / Location',
    idCardRateLabel: 'निर्धारित दर / Rate',
    idCardStatusLabel: 'प्रमाणित / Status',
    verifiedStamp: 'वेरिफाइड हुनर',
    pendingStamp: 'वेरिफिकेशन बाकी',
    scanToVerify: 'स्कैन करके काम देखें',

    // Directory
    dirTitle: 'कारीगर खोजें',
    dirSub: 'सोनीपत और आस-पास के वेरिफाइड कारीगर',
    searchPlaceholder: 'नाम, काम या एरिया खोजें...',
    filterAll: 'सभी हुनर',
    noWorkersFound: 'इस फ़िल्टर पर कोई कारीगर नहीं मिला',
    workerCardVerified: '{n} ग्राहकों द्वारा वेरिफाइड',
    workerCardPending: 'वेरिफिकेशन बाकी',

    // Public Profile
    fairWageHeading: 'पारदर्शी तय रेट',
    callNow: 'सीधा कॉल',
    chatWhatsapp: 'व्हाट्सएप',
    bookService: 'बुकिंग भेजें',
    workGallery: 'काम का सबूत (पोर्टफोलियो)',
    noWorkMedia: 'अभी फोटो/वीडियो नहीं जोड़े',
    voiceReviewsHeading: 'ग्राहकों के वॉयस रिव्यू',
    noReviewsYet: 'अभी कोई रिव्यू नहीं मिला',
    listenVoiceReview: 'वॉयस रिव्यू सुनें 🔊',
    playAgain: 'वापस सुनें 🔊',
    stopAudio: 'ऑडियो रोकें ⏹',

    // Verification Modal
    verifyModalTitle: 'कस्टमर स्कैन व वेरिफिकेशन (लाइव डेमो)',
    verifyModalSub: 'आप इस कारीगर के काम को कन्फर्म करके इनका स्टेटस अपग्रेड कर सकते हैं।',
    customerPhoneLabel: 'आपका फोन नंबर',
    customerConfirmCheck: 'हाँ, मैंने इनसे काम करवाया है और काम बढ़िया था।',
    customerRatingLabel: 'स्टार रेटिंग दीजिए',
    voiceReviewOptional: '10-सेकंड का वॉयस रिव्यू (वैकल्पिक)',
    recordVoiceReview: 'वॉयस रिव्यू रिकॉर्ड करें',
    stopRecording: 'रिकॉर्डिंग बंद करें',
    submitVerification: 'वेरिफाई करके बैज दें ✅',
    alreadyVerifiedAlert: 'इस नंबर से पहले ही वेरिफिकेशन हो चुका है!',
    verificationSuccessAlert: 'स्टेटस सफलतापूर्वक अपग्रेड हो गया!',

    // Booking Modal
    bookingModalTitle: 'कारीगर को बुकिंग भेजें',
    bookingJobType: 'काम का प्रकार',
    jobSmall: 'छोटा काम (1 दिन / विजिट)',
    jobContract: 'मल्टी-डे ठेका / प्रोजेक्ट',
    bookingDateLabel: 'काम शुरू करने की तारीख',
    bookingAddressLabel: 'आपका पता / लैंडमार्क',
    bookingNotesLabel: 'काम के बारे में बताएं',
    bookingPlatformFeeNote: 'नई बुकिंग पर ₹19 का छोटा प्लेटफार्म शुल्क — पुराने ग्राहकों के लिए बिल्कुल फ्री।',
    submitBooking: 'बुकिंग रिक्वेस्ट भेजें 📅',
    bookingSuccessAlert: 'आपकी बुकिंग रिक्वेस्ट कारीगर को भेज दी गई है!',

    // Settings
    settingsTitle: 'सेटिंग्स व अकाउंट',
    appearanceTheme: 'थीम (डार्क / लाइट मोड)',
    themeLight: 'लाइट मोड ☀️',
    themeDark: 'डार्क मोड 🌙',
    languageSection: 'भाषा / Language',
    accountInfo: 'अकाउंट जानकारी',
    proTierSection: 'हुनरकार्ड प्रो लैडर',
    proBadgeTitle: 'वेरिफाइड प्रो बैज (₹49/महीना)',
    proBadgeDesc: '5+ वेरिफिकेशन के बाद अनलॉक होता है। गोल्ड बैज, अनलिमिटेड फोटो अपलोड और डायरेक्टरी में टॉप रैंक।',
    proLockedHint: '5+ कस्टमर वेरिफिकेशन होने पर खुलेगा',
    whyFreeSection: 'हुनरकार्ड क्यों फ्री है?',
    whyFreeExplanation: 'कारीगरों के लिए हमेशा फ्री; भरोसा बनने के बाद ऐच्छिक प्रो अपग्रेड; नए ग्राहकों से छोटा लीड शुल्क; पुराने रिश्तों पर शून्य चार्ज।',
    logoutBtn: 'लॉग आउट करें',

    // General Labels
    years: 'साल',
    visit: 'विजिट',
    day: 'दिन',
    verified: 'वेरिफाइड',
    pending: 'बाकी',
    close: 'बंद करें',
    save: 'सेव करें',
    copied: 'लिंक कॉपी हो गया!',
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
