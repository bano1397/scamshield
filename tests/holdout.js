// Blind held-out corpus. Written without reading the detector or its existing tests.
export const HOLDOUT = [
  // ---------------- ALARM (15) ----------------
  { expect: 'alarm', name: 'otp-just-came-to-mobile', turns: [
    'Good afternoon, I am calling from the fraud team at your bank.',
    'We have blocked a payment of $740 that was trying to go through from your card.',
    'To reverse it, just read me the number that just came to your mobile, the 6-digit one.'] },
  { expect: 'alarm', name: 'otp-whatsapp-code-read-back', turns: [
    'Hi auntie, sorry, I sent a code to your phone by mistake.',
    'Can you please tell me those digits you just got in the text? I need it back quickly.'] },
  { expect: 'alarm', name: 'cvv-back-of-card', turns: [
    'This is Mark from card services, we are updating your account security today.',
    'Could you confirm the long number on the front and then the 3 digits on the back of the card for me?'] },
  { expect: 'alarm', name: 'pin-to-cancel-card', turns: [
    'Madam, your ATM card has been compromised and we are cancelling it now.',
    'For the cancellation to go through I just need you to key in or say your 4-digit PIN.'] },
  { expect: 'alarm', name: 'anydesk-refund', turns: [
    'Hello, this is regarding the refund of $399 for your antivirus subscription.',
    'Please go to your computer and download an app called AnyDesk.',
    'Once it is open, read me the 9-digit address so I can process the refund for you.'] },
  { expect: 'alarm', name: 'connect-to-computer-microsoft', turns: [
    'I am calling from the technical department, your computer is sending us error reports.',
    'Hackers have got in, so let me connect to your computer and clean it for you.',
    'Just press the Windows key and R together and type what I tell you.'] },
  { expect: 'alarm', name: 'safe-account-transfer', turns: [
    'Sir, I am from the security department of your bank and your savings are at risk.',
    'Someone inside the branch is involved, so do not speak to the staff there.',
    'We have opened a protected holding account for you, you must move the full balance there today.',
    'I will give you the sort code and account number now, stay on the line while you do it.'] },
  { expect: 'alarm', name: 'fbr-arrest-threat', turns: [
    'This is Inspector Khan from the tax office, a case has been registered against your CNIC.',
    'If you do not clear the penalty of 85,000 rupees within 2 hours the police will come to arrest you.',
    'You can pay it through JazzCash to the number I will give you, and do not disconnect this call.'] },
  { expect: 'alarm', name: 'irs-gift-cards', turns: [
    'You owe back taxes and there is a warrant out in your name.',
    'To stop the officers you need to pay $1,500 today in Google Play cards, buy them at Walgreens and read me the numbers on the back.'] },
  { expect: 'alarm', name: 'grandson-bail-secret', turns: [
    'Grandma? It is me, I am in real trouble, I had a car accident.',
    'They are saying I need $3,000 for bail or I stay in jail tonight.',
    'Please do not tell Mum and Dad, they will kill me. Can you send it by Western Union?'] },
  { expect: 'alarm', name: 'son-new-number-urgent', turns: [
    'Hi Mum, my phone broke so this is my new number.',
    'I have to pay a bill today and my banking is locked, could you transfer £950 for me?',
    'I will pay you back tomorrow, it is really urgent, just keep it between us for now.'] },
  { expect: 'alarm', name: 'delivery-fee-card', turns: [
    'Hello, this is the courier company, we tried to deliver your parcel this morning.',
    'There is an unpaid customs charge of $2.99 before we can redeliver.',
    'I can take that now over the phone, what is the card number, the expiry and the security code?'] },
  { expect: 'alarm', name: 'boss-gift-cards', turns: [
    'Hey, it is David, your manager. I am stuck in a meeting and cannot talk long.',
    'I need you to pick up some Apple gift cards for a client, 5 of them at $200 each.',
    'Scratch the backs, send me photos of the codes, and do not mention it to anyone in the office.'] },
  { expect: 'alarm', name: 'crypto-atm-police', turns: [
    'This is Officer Daniels, your identity was used in a money laundering case.',
    'To protect your funds you need to withdraw your cash and deposit it into a bitcoin machine.',
    'I will send you a QR code, scan it at the machine, and do not tell the bank teller why.'] },
  { expect: 'alarm', name: 'password-security-question', turns: [
    'Hi, this is support from your email provider, your mailbox is about to be shut down.',
    'To verify you are the owner, tell me your current password and your mother\'s maiden name.'] },

  // ---------------- MEDIUM (5) ----------------
  { expect: 'medium', name: 'bank-issue-no-request', turns: [
    'Hello, am I speaking with the account holder? I am calling from your bank.',
    'We have noticed some unusual activity on your account and need to go through a few things with you.'] },
  { expect: 'medium', name: 'unknown-dob-confirm', turns: [
    'Hi there, I am just calling to update our records.',
    'Before we continue, could you confirm your full name and date of birth for me?'] },
  { expect: 'medium', name: 'prize-winner', turns: [
    'Congratulations! Your number was selected in our annual lucky draw.',
    'You have won a brand new car, I just need to take a few details to arrange the delivery.'] },
  { expect: 'medium', name: 'investment-guaranteed', turns: [
    'I am calling about an exclusive trading opportunity with guaranteed returns of 30% a month.',
    'Only a few spots are left, would you like me to explain how it works?'] },
  { expect: 'medium', name: 'broadband-disconnection', turns: [
    'This is your internet provider, your line will be disconnected within 24 hours.',
    'Press 1 now to speak to a technician about keeping your service active.'] },

  // ---------------- LOW (25) ----------------
  { expect: 'low', name: 'garage-code-reminder', turns: [
    'Hi sweetheart, it is Dad. The garage code is still 4 4 1 9, I did not change it.',
    'Let yourself in and there is food in the fridge.'] },
  { expect: 'low', name: 'pharmacy-pickup-code', turns: [
    'Hello, this is Boots pharmacy, your prescription is ready.',
    'When you come in, just give your name and the collection code we texted you at the counter.'] },
  { expect: 'low', name: 'friend-bank-app-slow', turns: [
    'Ugh, my bank app is so slow today, it keeps asking me for my password.',
    'Anyway I will transfer you the money for dinner tonight once it loads.'] },
  { expect: 'low', name: 'sister-sent-transfer', turns: [
    'Hey, I just sent you the £200 for Mum\'s birthday present.',
    'Can you check your account and let me know if the transfer came through?'] },
  { expect: 'low', name: 'tv-scam-story', turns: [
    'Did you see that programme last night about people getting scammed?',
    'Some man called pretending to be the police and asked an old lady for gift cards. Terrible.',
    'I told Nani never to give her PIN to anyone on the phone.'] },
  { expect: 'low', name: 'colleague-share-screen', turns: [
    'Hi, it is Priya from the finance team, are you on the call yet?',
    'Could you share your screen so we can walk through the quarterly slides together?'] },
  { expect: 'low', name: 'doctor-appointment', turns: [
    'Hello, this is the surgery calling to confirm your appointment on Thursday at 10:30.',
    'Please arrive 10 minutes early. See you then.'] },
  { expect: 'low', name: 'mom-grocery-list', turns: [
    'Beta, on your way home can you pick up milk, eggs and some dhania?',
    'I will give you the money when you get here.'] },
  { expect: 'low', name: 'wifi-password-guest', turns: [
    'Hey, what is the Wi-Fi password again? My friend is over.',
    'Oh right, it is on the back of the router, never mind, found it.'] },
  { expect: 'low', name: 'birthday-gift-card-idea', turns: [
    'I was thinking of just getting Sam an Amazon gift card for his birthday.',
    'He is so hard to buy for, what do you think?'] },
  { expect: 'low', name: 'police-community-meeting', turns: [
    'Did you hear the local police are holding a community meeting on Saturday?',
    'It is about parking on our street, I think we should both go.'] },
  { expect: 'low', name: 'school-app-install', turns: [
    'Hi, the school wants all parents to install the new app for homework updates.',
    'I installed it last night, it is quite easy, you just sign in with your email.'] },
  { expect: 'low', name: 'urgent-work-deadline', turns: [
    'It is urgent, the report has to go out by 5 today.',
    'Can you send me your section as soon as you can? Thanks.'] },
  { expect: 'low', name: 'rent-split-flatmate', turns: [
    'Hey, rent is due on the 1st. I will pay the landlord and you send me your half.',
    'Same bank details as last month, no rush.'] },
  { expect: 'low', name: 'dad-new-card-arrived', turns: [
    'My new bank card came in the post today.',
    'I will activate it at the cash machine tomorrow and choose a new PIN there.'] },
  { expect: 'low', name: 'verification-new-phone-self', turns: [
    'I am setting up my new phone and WhatsApp keeps asking for a verification code.',
    'It should come by text, I will call you back once it is working.'] },
  { expect: 'low', name: 'plumber-arrival', turns: [
    'Hi, this is Tom the plumber, I am running about 20 minutes late.',
    'I should be with you by half 2, is that alright?'] },
  { expect: 'low', name: 'uncle-sending-eid-money', turns: [
    'Assalam o alaikum! I have sent Eidi to the kids through Easypaisa.',
    'Tell them it is from Chachu and give them lots of love.'] },
  { expect: 'low', name: 'tech-help-grandson-inperson', turns: [
    'Nana, when I come on Sunday I will fix your laptop screen for you.',
    'Do not click on anything strange until then, okay?'] },
  { expect: 'low', name: 'restaurant-booking', turns: [
    'Hi, I would like to book a table for four on Friday at 8 please.',
    'Lovely, the name is Ahmed. Thank you.'] },
  { expect: 'low', name: 'parent-pocket-money-app', turns: [
    'Mum, can you top up my card on the app? I have £3 left.',
    'Thanks, I only need enough for the bus this week.'] },
  { expect: 'low', name: 'bank-branch-visit-plan', turns: [
    'I am going to the bank tomorrow to open a savings account for the baby.',
    'Do you want to come with me? We could get coffee after.'] },
  { expect: 'low', name: 'office-door-code', turns: [
    'The new door code for the office is on the noticeboard.',
    'They changed it because of the refurbishment, see you Monday.'] },
  { expect: 'low', name: 'friend-weekend-plans', turns: [
    'Are we still on for the cricket match on Saturday?',
    'I will pick you up at 9, bring a jacket, it might rain.'] },
  { expect: 'low', name: 'reported-scam-to-bank', turns: [
    'I got one of those dodgy texts about a parcel, so I forwarded it to my bank.',
    'They said I did the right thing and my account is fine.'] },
];
