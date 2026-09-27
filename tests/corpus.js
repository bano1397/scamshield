// Labelled conversations for detection quality. Each entry is a list of turns as they would
// arrive from live speech-to-text (no speaker labels). `expect` is the level the rule layer must
// reach: 'low' = no alarm, 'medium' = caution only, 'alarm' = HIGH or CRITICAL (voice warning).
export const CORPUS = [
  // ---------- clearly safe ----------
  { expect: 'low', name: 'own login code', turns: ['I received a verification code for my own login, so I typed it in and it worked.'] },
  { expect: 'low', name: 'dentist reminder', turns: ['Hi, this is Sarah from Bright Smile Dental.', 'Just a reminder about your cleaning on Thursday at ten.', 'Please bring your insurance card.'] },
  { expect: 'low', name: 'dinner plans', turns: ['Hi mum, I will be home for dinner at seven.', 'Can you pick up milk and bread on the way back?'] },
  { expect: 'low', name: 'parcel', turns: ['Your parcel will be delivered tomorrow between nine and twelve.'] },

  // ---------- benign but full of risky words ----------
  { expect: 'low', name: 'going to the bank', turns: ["I'm going to the bank this afternoon to deposit my pension.", 'Do you need me to get some cash for you?'] },
  { expect: 'low', name: 'rent transfer from son', turns: ["Hi Mum, it's Ali. I'll transfer the money for the rent tonight.", 'The bank app sent me a code but I already used it, all sorted.'] },
  { expect: 'low', name: 'wifi password', turns: ['Grandma, can you tell me the wifi password? It is on the back of the router.'] },
  { expect: 'low', name: 'birthday gift card', turns: ['I bought Sarah a gift card for her birthday.', 'She loves that bookshop.'] },
  { expect: 'low', name: 'forgot password', turns: ['I forgot my password for the library website again.', 'I will reset it tomorrow.'] },
  { expect: 'low', name: 'news about scams', turns: ['Did you see the news? The police arrested a man for fraud.', 'He was stealing money from pensioners.'] },
  { expect: 'low', name: 'door code', turns: ['When you arrive, the door code is four five six one.'] },
  { expect: 'low', name: 'account balance chat', turns: ['My account balance is lower this month because of the car repairs.', 'I need to be careful with money.'] },
  { expect: 'low', name: 'app update', turns: ['You should install the app update on your phone, the new version is faster.'] },

  // ---------- suspicious (caution, no alarm) ----------
  { expect: 'medium', name: 'bank wants to verify', turns: ['Hello, this is Mark calling from your bank.', 'We need to verify something on your account.'] },
  { expect: 'medium', name: 'suspicious activity', turns: ['This is the fraud department.', 'We detected suspicious activity on your account.'] },

  // ---------- dangerous ----------
  { expect: 'alarm', name: 'bank OTP', turns: ["I'm from your bank.", 'Read me the six digit code we just sent.'] },
  { expect: 'alarm', name: 'what code did you receive', turns: ['This is the security team.', 'What code did you receive on your phone just now?'] },
  { expect: 'alarm', name: 'tell me the verification number', turns: ['Please tell me the verification number from the text message.'] },
  { expect: 'alarm', name: 'give me the six digit code', turns: ['Give me the six digit code so I can stop the payment.'] },
  { expect: 'alarm', name: 'PIN request', turns: ['For security, please confirm your card PIN.'] },
  { expect: 'alarm', name: 'CVV request', turns: ['Can you read me the three digits on the back of your card, the CVV?'] },
  { expect: 'alarm', name: 'frozen + transfer', turns: ['Your account will be frozen in ten minutes unless you transfer the money now.'] },
  { expect: 'alarm', name: 'safe account', turns: ['Your savings are at risk.', 'You must move your money to a safe account today.'] },
  { expect: 'alarm', name: 'remote install', turns: ['Install this application so I can help you secure your account.'] },
  { expect: 'alarm', name: 'anydesk', turns: ['I am from Microsoft support. Please download AnyDesk.'] },
  { expect: 'alarm', name: 'share screen', turns: ['This is Apple support. Please share your screen with me so I can check your iCloud.'] },
  { expect: 'alarm', name: 'gift card tax', turns: ['This is the tax office.', 'You can pay the fine with Google Play gift cards. Read me the numbers on the back.'] },
  { expect: 'alarm', name: 'crypto atm', turns: ['Take the cash to a bitcoin ATM and send it to this address. Do this immediately.'] },
  { expect: 'alarm', name: 'arrest + pay', turns: ['There is a warrant for your arrest.', 'If you do not pay today the police will come.'] },
  { expect: 'alarm', name: 'grandchild bail', turns: ["Grandma, it's me, your grandson.", "I'm in jail and need bail money.", "Please don't tell mom."] },
  { expect: 'alarm', name: 'new number family', turns: ["Hi Mum, I lost my phone, this is my new number.", 'Can you send me five hundred pounds urgently? Please do not tell dad.'] },
  { expect: 'alarm', name: 'courier fee', turns: ['This is DHL, your parcel is held at customs.', 'Pay the release fee now with your card number and security code.'] },
  { expect: 'alarm', name: 'employer gift cards', turns: ["It's your manager. I'm in a meeting and need you to buy gift cards for a client right now.", 'Keep this between us and send me the codes.'] },
];
