const REF_DATA = {
  era: {
    "11": { label: "2000s–2010s Generation", years: "approx. 2000–2019", note: "Transitional era introducing ceramic bezels and updated movements." },
    "12": { label: "2020s Generation (Current)", years: "2020–present", note: "Latest generation with updated case proportions, improved luminescence, and modern calibers." },
    "16": { label: "1990s–2000s Generation", years: "approx. 1990–2002", note: "Transitional era between vintage and modern; highly collectible for purists." },
    "14": { label: "1980s–1990s Generation", years: "approx. 1980–1995", note: "Classic vintage era. Matte dials, tritium lume, and original bracelet designs." },
    "22": { label: "2020s Premium Generation", years: "2020–present", note: "Current high-end and precious metal generation." }
  },

  model: {
    "116610": { name: "Submariner Date", material: "Stainless Steel", era: "pre-2020", category: "Dive Watch", significance: "The definitive modern Submariner before the 2020 refresh. Highly liquid market with strong collector demand." },
    "116613": { name: "Submariner Date", material: "Steel + Yellow Gold (Two-Tone)", era: "pre-2020", category: "Dive Watch", significance: "The Rolesor two-tone Submariner. Nicknamed 'Bluesy' in blue dial spec; balances sportiness with luxury." },
    "116618": { name: "Submariner Date", material: "Full Yellow Gold", era: "pre-2020", category: "Dive Watch", significance: "All-gold Submariner — the pinnacle of the line's luxury expression before the 2020 update." },
    "126610": { name: "Submariner Date", material: "Stainless Steel", era: "2020–present", category: "Dive Watch", significance: "The current-generation steel Submariner with a wider bezel and updated Cal. 3235 movement." },
    "126613": { name: "Submariner Date", material: "Steel + Yellow Gold (Two-Tone)", era: "2020–present", category: "Dive Watch", significance: "Updated Rolesor Submariner with modern proportions and improved 3235 caliber." },
    "116500": { name: "Daytona", material: "Stainless Steel", era: "pre-2023", category: "Chronograph", significance: "The steel Daytona with ceramic bezel — one of the most sought-after references in modern watchmaking. Notorious waitlists." },
    "126500": { name: "Daytona", material: "Stainless Steel", era: "2023–present", category: "Chronograph", significance: "The newest Daytona generation, featuring a larger 40mm case and updated in-house movement." },
    "116520": { name: "Daytona", material: "Stainless Steel", era: "pre-2016", category: "Chronograph", significance: "Pre-ceramic bezel Daytona. The last generation with a steel bezel — a benchmark of collectibility." },
    "116710": { name: "GMT-Master II", material: "Stainless Steel", era: "pre-2019", category: "GMT / Traveler", significance: "Previous-gen GMT-Master II — origin of the Batman (BLNR) and Pepsi (BLRO) references." },
    "126710": { name: "GMT-Master II", material: "Stainless Steel", era: "2019–present", category: "GMT / Traveler", significance: "Current GMT-Master II with Jubilee bracelet option and upgraded Cal. 3285 movement." },
    "228238": { name: "Day-Date 40", material: "18k Yellow Gold", era: "2015–present", category: "Dress Watch", significance: "The 'President's Watch' in 40mm. Symbol of achievement — worn by world leaders for decades." },
    "116233": { name: "Datejust 36", material: "Steel + Yellow Gold (Two-Tone)", era: "pre-2016", category: "Dress Watch", significance: "Classic Rolesor Datejust — the original luxury sports watch, refined over generations." },
    "126334": { name: "Datejust 41", material: "Stainless Steel", era: "2016–present", category: "Dress Watch", significance: "The modern large Datejust. Versatile enough for boardroom or weekend wear." }
  },

  bezel: {
    "0": { label: "Smooth Bezel", description: "Plain polished or brushed bezel with no markings or function. Found on dress watches and precious metal references." },
    "1": { label: "Unidirectional Rotating Bezel", description: "Dive watch standard. Rotates counterclockwise only to measure elapsed dive time. Ceramic insert on modern references." },
    "2": { label: "Engraved Bezel", description: "Decoratively engraved bezel, often found on vintage and anniversary references." },
    "3": { label: "Fluted Bezel", description: "Iconic engine-turned fluting pattern. Originally functional to tighten the case; now a hallmark of precious metal and dress references." },
    "4": { label: "Gem-Set Bezel", description: "Set with diamonds or other precious stones. Found on luxury and precious metal variants." },
    "5": { label: "Bidirectional Rotating Bezel (GMT)", description: "24-hour graduated bezel that rotates in both directions to track a second time zone. Signature of the GMT-Master family." },
    "6": { label: "Tachymeter Bezel", description: "Fixed bezel calibrated to measure speed over a known distance. Exclusive to the Daytona chronograph." }
  },

  bracelet: {
    "0": { label: "Oyster Bracelet — Stainless Steel", description: "Three-link solid steel bracelet. Robust, sporty, water-resistant. The original Rolex bracelet." },
    "1": { label: "Jubilee Bracelet — Stainless Steel", description: "Five-link bracelet with center links. More refined appearance; originally created for the Datejust's debut in 1945." },
    "3": { label: "Oyster Bracelet — Two-Tone (SS + Yellow Gold)", description: "Oyster construction in Rolesor: steel outer links, yellow gold center links. Bridges sport and luxury." },
    "4": { label: "Jubilee Bracelet — Two-Tone", description: "Five-link Jubilee in Rolesor two-tone. Classic dress bracelet with precious metal warmth." },
    "8": { label: "Oyster Bracelet — Full Yellow Gold", description: "Solid 18k yellow gold Oyster bracelet. Heavy, substantial, and unmistakably luxurious." },
    "9": { label: "Oyster Bracelet — White Gold", description: "Solid 18k white gold Oyster bracelet. Cool-toned precious metal for platinum-adjacent aesthetic." }
  },

  suffix: {
    "LN":   { label: "Black Ceramic Bezel", color: "#2a2a2a", description: "Cerachrom insert in solid black. Timelessly elegant. Scratch-resistant and UV-stable." },
    "LV":   { label: "Green Ceramic Bezel", color: "#2d4a2d", description: "Cerachrom insert in vivid green. Nicknamed 'Hulk' (116610LV) or 'Kermit' on the older 16610LV." },
    "LB":   { label: "Blue Ceramic Bezel", color: "#1a2d4a", description: "Cerachrom insert in deep blue. Paired with white gold indices for a crisp nautical aesthetic." },
    "BLNR": { label: "Batman — Black/Blue Ceramic Bezel", color: "#1a1a3a", description: "Bicolor Cerachrom in black and blue. Two-tone bezel for dual time zones — day half blue, night half black. Nicknamed 'Batman'." },
    "BLRO": { label: "Pepsi — Black/Red Ceramic Bezel", color: "#3a1a1a", description: "Bicolor Cerachrom in black and red. Pays homage to the original 1955 GMT-Master 'Pepsi' bezel. Highly coveted." }
  }
};
