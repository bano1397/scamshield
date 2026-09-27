// Blind held-out corpus #2. Written without viewing detector code or other corpora.
export const HOLDOUT2 = [
  // ---------------- ALARM (18) ----------------
  { expect: 'alarm', name: 'bank-security-check-card', turns: [
    "Hello, am I speaking with Mrs. Patel? This is Daniel from the fraud team at your bank.",
    "Um, we've flagged a payment of £849 to an electronics store in Birmingham, was that you?",
    "No? Okay, don't worry, I just need to verify you, so can you read me the long number on the front of your card and the three digits on the back?"
  ]},
  { expect: 'alarm', name: 'sim-swap-code', turns: [
    "Hi sir, calling from your mobile network, we're upgrading your SIM to 5G free of charge.",
    "You'll get a text in a second with a 6-digit code, uh, just read that back to me so I can finish the activation.",
  ]},
  { expect: 'alarm', name: 'amazon-refund-remote-watch', turns: [
    "Hello, this is Amazon customer service, you were charged $399 for an iPhone order.",
    "To process your refund I need you to open your computer and go to the website I'll give you, it's anydesk dot com.",
    "Okay now log in to your online banking while I watch, so I can put the refund in, yeah?"
  ]},
  { expect: 'alarm', name: 'hmrc-arrest-threat', turns: [
    "This is an automated message from HM Revenue and Customs, a case has been filed against your name for tax fraud.",
    "Press 1 to speak to an officer. Hello, madam, you owe £2,340 and there is a warrant for your arrest unless it's settled today.",
    "You can pay with Google Play vouchers from the Tesco near you, and don't tell anyone at the shop what they're for."
  ]},
  { expect: 'alarm', name: 'fbr-tax-pakistan', turns: [
    "Assalam o alaikum, main FBR se bol raha hoon, your NTN has pending tax of 85,000 rupees.",
    "Sir, if you don't pay within two hours, your bank accounts will be frozen, you understand?",
    "Just send it on JazzCash to this number, 0300 1234567, and share the OTP you receive so we can confirm."
  ]},
  { expect: 'alarm', name: 'police-money-laundering', turns: [
    "Good afternoon, this is Detective Sergeant Collins from the Metropolitan Police.",
    "Your identity has been used to open accounts involved in money laundering, and, um, we believe someone at your bank branch is involved.",
    "So it's very important you don't speak to the bank staff. We need you to move your savings into a safe account we've set up for you."
  ]},
  { expect: 'alarm', name: 'grandchild-lawyer-bail', turns: [
    "Grandma? It's me, I, I'm in trouble, please don't tell mum.",
    "There was a car accident and they've arrested me, my lawyer's gonna talk to you, okay?",
    "Hello ma'am, I'm Mr. Harris, his attorney. Bail is $8,000 and a courier can come to your house to collect cash today, it has to be discreet."
  ]},
  { expect: 'alarm', name: 'utility-disconnect-card', turns: [
    "Hi, this is Con Edison, uh, your account is showing past due and our crew is scheduled to disconnect your power in 30 minutes.",
    "To stop that I can take a payment right now over the phone, what's the card number you'd like to use?"
  ]},
  { expect: 'alarm', name: 'courier-redelivery-fee', turns: [
    "Hello, Royal Mail delivery here, we tried to deliver a parcel but there was a small customs charge.",
    "It's only £1.99, love, so I just need the card number and expiry and, um, the security code to rebook it for tomorrow."
  ]},
  { expect: 'alarm', name: 'crypto-investment', turns: [
    "Hi, is this Mr. Thompson? I'm calling from Bitwealth Capital, you registered interest in crypto trading last month.",
    "Our clients are making like 30% a month, guaranteed, the AI does the trades.",
    "You start with just $250, then we recommend moving your pension across, and I'll help you set up the wallet and transfer it today before the price goes up."
  ]},
  { expect: 'alarm', name: 'paypal-suspended-code', turns: [
    "This is PayPal security, your account has been suspended due to suspicious activity.",
    "We've sent you a verification code, please read it out to me so we can unlock the account."
  ]},
  { expect: 'alarm', name: 'overpaid-refund-send-difference', turns: [
    "Hello sir, this is from the tech support refund department, you were due a refund of $200.",
    "Oh no, oh my God, I made a mistake, I typed $20,000 instead, you see it in your account now?",
    "Please, I will lose my job, you have to send back the difference, go to Walmart and buy gift cards, I'll stay on the line."
  ]},
  { expect: 'alarm', name: 'tech-support-install', turns: [
    "Hello, I'm calling from Windows technical department, your computer is sending us error messages.",
    "There are hackers inside it right now, madam, so I need you to install a program called TeamViewer and give me the ID number.",
  ]},
  { expect: 'alarm', name: 'microsoft-type-commands', turns: [
    "Yes, this is Microsoft, uh, press the Windows key and R together.",
    "Now type eventvwr and press enter. You see all these red errors? That is the virus.",
    "Now type this, www dot support hyphen fix dot com, and download the file, and we will clean it for a one-time fee of $299."
  ]},
  { expect: 'alarm', name: 'hi-mum-new-number', turns: [
    "Hi mum, it's me, I dropped my phone in the loo, this is my new number, just save it.",
    "Listen, I'm so embarrassed, I've got a bill I need to pay today and my banking app's locked on the new phone.",
    "Can you transfer £1,450 to this account, it's my friend's, I'll pay you back tomorrow I promise, please don't ring the old number."
  ]},
  { expect: 'alarm', name: 'ceo-wire-request', turns: [
    "Hey, it's Mark, I'm about to board a flight so I have to be quick.",
    "We're closing a confidential acquisition and I need you to wire $47,000 to the vendor before end of day.",
    "Don't loop in finance, it's under NDA, I'll email you the account details, just get it done and keep it between us."
  ]},
  { expect: 'alarm', name: 'romance-customs-fee', turns: [
    "My darling, it's so good to hear your voice, I miss you so much.",
    "The gold I told you about is stuck at customs in Lagos, they say I have to pay a clearance fee.",
    "If you can send $3,500 by Western Union today, I can finally come to you next week, you trust me, don't you?"
  ]},
  { expect: 'alarm', name: 'indian-bank-kyc-slow', turns: [
    "Hello madam, I am calling from SBI head office, KYC department.",
    "Your KYC is not updated, so as per RBI rule your account will be blocked today evening.",
    "No problem madam, I'll do it for you only, you just tell me the OTP which has come on your mobile, it is only for verification."
  ]},

  // ---------------- MEDIUM (7) ----------------
  { expect: 'medium', name: 'unknown-bank-fraud-opener', turns: [
    "Hello, is this Mr. Ahmed? I'm calling from your bank's fraud prevention team.",
    "We've noticed some unusual activity on your account, uh, have you been abroad recently?"
  ]},
  { expect: 'medium', name: 'prize-winner-opener', turns: [
    "Congratulations! You've been selected as one of our lucky winners this month.",
    "You've won a brand new car and a cash prize, isn't that exciting?"
  ]},
  { expect: 'medium', name: 'accident-claim-cold', turns: [
    "Hi there, we understand you were in an accident that wasn't your fault in the last three years.",
    "You could be entitled to up to £5,000 in compensation, can I ask you a few questions?"
  ]},
  { expect: 'medium', name: 'irs-callback-robocall', turns: [
    "This call is from the Internal Revenue Service regarding an enforcement action against your name.",
    "Please call us back immediately at the number provided before the matter escalates."
  ]},
  { expect: 'medium', name: 'amazon-order-query', turns: [
    "Hello, calling from Amazon, uh, there's an order on your account for a MacBook Pro for $1,299.",
    "Did you place this order, sir?"
  ]},
  { expect: 'medium', name: 'unknown-relative-guess', turns: [
    "Hi Nana, guess who it is!",
    "Aw, you don't recognise my voice? I've got a bit of a cold, that's all."
  ]},
  { expect: 'medium', name: 'computer-virus-opener', turns: [
    "Hello, this is from your internet provider, we've detected that your router has been compromised.",
    "Is your computer on right now, madam?"
  ]},

  // ---------------- LOW (25) ----------------
  { expect: 'low', name: 'daughter-dinner', turns: [
    "Hi Mum, it's Sarah, are you still okay for Sunday dinner?",
    "I'll bring the trifle, and, um, Tom's picking up Gran on the way."
  ]},
  { expect: 'low', name: 'gp-surgery-dob-patient-called', turns: [
    "Good morning, Riverside Surgery, how can I help?",
    "Oh yes, you wanted to book your blood test. Can I just take your date of birth to find your record?",
    "Lovely, we've got Thursday at 10:20 with the nurse, is that alright?"
  ]},
  { expect: 'low', name: 'news-arrest-story', turns: [
    "Did you see on the news, they arrested that man who was scamming pensioners in Leeds?",
    "Police said he'd taken thousands off people pretending to be from the bank, awful, isn't it?"
  ]},
  { expect: 'low', name: 'son-otp-own-login', turns: [
    "Abbu, I'm logging into my own bank app on the new phone and the OTP's gone to the old SIM in the drawer at your house.",
    "No no, don't read it to anyone, just, uh, can you put the old SIM in your phone so I come pick it up tonight?"
  ]},
  { expect: 'low', name: 'grandson-gift-card-birthday', turns: [
    "Hi Grandad, thanks so much for the gift card for my birthday!",
    "I used it on a new football, I'll show you on Saturday."
  ]},
  { expect: 'low', name: 'shop-refund-initiated', turns: [
    "Hi, it's Currys calling back about the kettle you returned on Tuesday.",
    "Just to let you know the refund of £34.99 has gone back onto the card you paid with, should show in 3 to 5 days. You don't need to do anything."
  ]},
  { expect: 'low', name: 'friend-password-wifi', turns: [
    "Hiya Margaret, I'm at your house feeding the cat, what's the Wi-Fi password again?",
    "Oh it's on the back of the router, found it, ta love."
  ]},
  { expect: 'low', name: 'pin-reminder-chat', turns: [
    "Mum, I've got the letter with the new PIN for your card here, it came to my address by mistake.",
    "I'll drop it round tomorrow, don't want to say it on the phone, you know."
  ]},
  { expect: 'low', name: 'rent-transfer-landlord', turns: [
    "Hi Mr. Khan, it's Priya from flat 2, just letting you know I've done the rent transfer today.",
    "Should be £850 as usual, sorry it's a day late, the bank holiday messed it up."
  ]},
  { expect: 'low', name: 'plumber-urgent', turns: [
    "Hello, it's Dave the plumber, you left a message about an urgent leak?",
    "I can be there in about an hour, and you can just pay me when the job's done, cash or card's fine."
  ]},
  { expect: 'low', name: 'pharmacy-ready', turns: [
    "Hello, Boots pharmacy here, your prescription is ready for collection.",
    "Just bring your bank card if it's not exempt, it's £9.90 per item."
  ]},
  { expect: 'low', name: 'nephew-install-app', turns: [
    "Auntie, I'll install the WhatsApp for you when I come over Sunday, don't worry.",
    "Then you can video call Ammi in Karachi, it's very easy, I'll show you."
  ]},
  { expect: 'low', name: 'remote-work-chat', turns: [
    "Yeah I'm working remote this week so I can take Dad to his appointment on Wednesday.",
    "What time is it again, half two?"
  ]},
  { expect: 'low', name: 'police-community-meeting', turns: [
    "Hi, this is PC Jones from the neighbourhood team, returning your call about the bike that was stolen from your shed.",
    "Just wanted to give you the crime reference number and let you know we've got CCTV from the street. We'll be in touch if anything comes up."
  ]},
  { expect: 'low', name: 'account-book-club', turns: [
    "Hi Joan, it's Beryl, I've set up an account on that library app you told me about.",
    "It's brilliant, I've already borrowed two audiobooks."
  ]},
  { expect: 'low', name: 'verification-email-son', turns: [
    "Dad, did you get the verification email for your new Gmail? It's the one I set up for you yesterday.",
    "Just click the blue button in it when you get a moment, and I'll sort the rest when I'm round."
  ]},
  { expect: 'low', name: 'dentist-reminder', turns: [
    "Hi, this is Smile Dental with a reminder of your check-up tomorrow at 9:15.",
    "If you need to cancel please ring the surgery, otherwise we'll see you then."
  ]},
  { expect: 'low', name: 'payment-plan-council-called-in', turns: [
    "Hello, you're through to the council tax team, you rang earlier about setting up a payment plan?",
    "Right, I can split the balance over ten months, I'll post the direct debit form to you so you can fill it in at home."
  ]},
  { expect: 'low', name: 'code-lockbox-sister', turns: [
    "It's me, I'm outside Mum's but I forgot the code for the key box.",
    "Oh, 1966, the year she got married, course it is, thanks."
  ]},
  { expect: 'low', name: 'bank-branch-appointment', turns: [
    "Hi, it's Lisa from the Halifax branch on High Street, you booked in to talk about your ISA.",
    "Just confirming Friday at 11, bring some ID with you and we'll go through everything in person."
  ]},
  { expect: 'low', name: 'friend-lottery-joke', turns: [
    "If we win the lottery on Saturday, love, I'm buying a caravan in Whitby.",
    "Ha, you say that every week, Ron."
  ]},
  { expect: 'low', name: 'indian-cousin-wedding', turns: [
    "Arre bhai, the wedding card came? Sangeet is on the 14th, everyone is coming.",
    "Tell Chachi also, and don't forget, you are doing the speech yaar."
  ]},
  { expect: 'low', name: 'card-arrived-talk', turns: [
    "Did your new bank card arrive, Dad? The old one expires this month.",
    "Good, just activate it at the cashpoint next time you're in town, like last time."
  ]},
  { expect: 'low', name: 'mechanic-quote', turns: [
    "Hi, it's Mike from the garage, your car's passed the MOT but it needs two new tyres.",
    "It'd be about £160 fitted, want me to go ahead or will you have a think?"
  ]},
  { expect: 'low', name: 'fraud-warning-talk-daughter', turns: [
    "Mum, just so you know, the bank will never ask you for your PIN or a code over the phone, okay?",
    "If anyone rings saying they're the police or the bank, just hang up and ring me, promise?"
  ]},
];
