export type Guidance = {
  disaster: string;
  emoji: string;
  color: string;
  before: string[];
  during: string[];
  after: string[];
};

export const WHO_GUIDANCE: Guidance[] = [
  {
    disaster: "Flood",
    emoji: "🌊",
    color: "from-blue-500 to-cyan-400",
    before: [
      "Store drinking water in clean containers (3L per person/day for 3 days).",
      "Keep emergency kit: torch, first-aid, ORS, dry food, documents in waterproof bag.",
      "Identify nearest elevated shelter and evacuation route.",
    ],
    during: [
      "Move to higher ground immediately. Do not walk or drive through floodwater.",
      "Avoid touching electrical equipment if wet or standing in water.",
      "Boil all drinking water for at least 1 minute before consuming.",
    ],
    after: [
      "Watch for symptoms of waterborne illness (diarrhoea, fever) — seek help fast.",
      "Discard food that touched floodwater. Disinfect surfaces with bleach solution.",
      "Wear boots and gloves when cleaning. Beware of snakes and debris.",
    ],
  },
  {
    disaster: "Earthquake",
    emoji: "🌋",
    color: "from-orange-500 to-red-500",
    before: [
      "Secure heavy furniture to walls. Know how to shut off gas, water, electricity.",
      "Identify safe spots: under sturdy tables, against interior walls.",
      "Practice drop, cover, and hold-on drills with family.",
    ],
    during: [
      "DROP to hands and knees, take COVER under a sturdy desk, HOLD ON until shaking stops.",
      "Stay away from windows, mirrors, and tall furniture.",
      "If outside, move to open area away from buildings, trees, and power lines.",
    ],
    after: [
      "Check for injuries. Do not move seriously injured persons unless in danger.",
      "Expect aftershocks. Inspect for gas leaks before using flames.",
      "Listen to official radio updates. Avoid damaged buildings.",
    ],
  },
  {
    disaster: "Cyclone",
    emoji: "🌀",
    color: "from-purple-500 to-pink-500",
    before: [
      "Track cyclone warnings on IMD and official channels.",
      "Secure loose objects outdoors. Stock up on water, food, batteries, medicine.",
      "Charge phones, prepare cash, fuel vehicles in advance.",
    ],
    during: [
      "Stay indoors away from windows. Take shelter in the strongest interior room.",
      "Do NOT venture out during the calm eye of the cyclone — winds will return suddenly.",
      "Listen to battery radio for updates if power is lost.",
    ],
    after: [
      "Stay alert for downed power lines and weakened trees/structures.",
      "Use only safe drinking water; assume tap water is contaminated until confirmed.",
      "Help neighbours, especially elderly and disabled. Report missing persons.",
    ],
  },
  {
    disaster: "Landslide",
    emoji: "⛰️",
    color: "from-amber-600 to-stone-600",
    before: [
      "Avoid building at the base or top of steep slopes.",
      "Watch for cracks in ground, tilting trees, doors that suddenly stick.",
      "Plan multiple evacuation routes.",
    ],
    during: [
      "Move away from the path of the landslide quickly to the nearest high, stable ground.",
      "If escape is impossible, curl into a tight ball and protect your head.",
      "Listen for unusual sounds (cracking, rumbling) — early warning signs.",
    ],
    after: [
      "Stay away from the slide area — additional slides may follow.",
      "Report broken utility lines to authorities.",
      "Check for trapped persons but only enter if it is safe.",
    ],
  },
];
