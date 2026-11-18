/* Knesset Combat 26' — fighter roster (51 fighters).
 * Every fighter is built procedurally from the "look" block (low-poly, cel-shaded).
 *
 * RARITY decides how many abilities a fighter has and what they cost in the Shop:
 *   common     1 ability  — Special                                 (+14% damage, +50 HP perk)
 *   rare       2 abilities — Special + Super
 *   superrare  2 abilities — Special + Super                         (+3% damage, +20 HP perk)
 *   epic       3 abilities — Special + Down-Special + Super
 *   elite      3 abilities — Special + Down-Special + Super          (+40 HP perk)
 *   mythic     3 abilities — Special + Down-Special + Super + a unique passive
 *   legendary  3 abilities — Special + Down-Special + Super + a unique passive
 * Fighters are unlocked with shards from chests. New players start with 5 free Common fighters (KC.STARTERS).
 */
window.KC = window.KC || {};

KC.RARITY = {
  common: { id: 'common', name: 'Common', color: '#a7b1c4', abilities: 1, price: 100, power: 1.14, hp: 50 },
  rare: { id: 'rare', name: 'Rare', color: '#3d8bff', abilities: 2, price: 200, power: 1.0 },
  superrare: { id: 'superrare', name: 'Super Rare', color: '#2fd4b4', abilities: 2, price: 300, power: 1.03, hp: 20 },
  epic: { id: 'epic', name: 'Epic', color: '#b46cff', abilities: 3, price: 400, power: 1.0 },
  elite: { id: 'elite', name: 'Elite', color: '#ff8c1a', abilities: 3, price: 450, power: 1.0, hp: 40 },
  mythic: { id: 'mythic', name: 'Mythic', color: '#ff4d6d', abilities: 3, price: 500, power: 1.0 },
  legendary: { id: 'legendary', name: 'Legendary', color: '#f2c14e', abilities: 3, price: 600, power: 1.0 }
};

KC.PASSIVES = {
  thickskin: 'Takes 12% less damage from every hit.',
  survivor: 'Once per match, shrugs off a knockout blow and stays up with 1 HP.',
  momentum: 'Super meter fills 35% faster.',
  regen: 'Slowly recovers health after 2 seconds without being hit (up to 60%).'
};

KC.ROSTER = [
  {
    id: 'bengurion', name: 'David Ben-Gurion', short: 'BEN-GURION', title: 'The Founder', rarity: 'rare',
    group: 'pm', years: '1948–54, 1955–63',
    bio: "Israel's founding Prime Minister. Read the Declaration of Independence in 1948 — and famously did headstands on the beach.",
    look: { height: 0.9, girth: 1.12, skin: '#eab892', hair: 'tufts', hairColor: '#f4f4f0', outfit: 'shirt', top: '#cdbf8e', pants: '#5d5240', shirt: '#cdbf8e', tie: null, shoes: '#3b2a1a' },
    stats: { speed: 1, power: 0.99, defense: 1, jump: 1 },
    special: { type: 'projectile', name: 'Declaration Scroll', proj: 'scroll' },
    super: { type: 'spin', name: 'Beach Headstand Cyclone', color: '#ffd166', mult: 0.92 },
    quote: 'This whole chamber was my idea, you know.', victory: 'headstand'
  },
  {
    id: 'sharett', name: 'Moshe Sharett', short: 'SHARETT', title: 'The Diplomat', rarity: 'common', starter: true,
    group: 'pm', years: '1954–55',
    bio: "Second Prime Minister and Israel's first Foreign Minister. A polyglot diplomat with a very fast pen.",
    look: { height: 0.98, girth: 1.0, skin: '#e5b48e', hair: 'combed', hairColor: '#2b2118', mustache: true, mustacheColor: '#2b2118', outfit: 'suit', top: '#4a4f57', pants: '#40444b', shirt: '#f2f2f2', tie: '#7a2430', shoes: '#1d1d1d' },
    stats: { speed: 1.12, power: 1.03, defense: 0.98, jump: 1.05, projSpeed: 1.1 },
    special: { type: 'projectile', name: 'Diplomatic Cable', proj: 'envelope' },
    quote: 'I have expressed my objection in eleven languages.', victory: 'bow'
  },
  {
    id: 'eshkol', name: 'Levi Eshkol', short: 'ESHKOL', title: 'The Builder', rarity: 'superrare',
    group: 'pm', years: '1963–69',
    bio: 'Third Prime Minister. Built the national water network before he ever led the country.',
    look: { height: 0.96, girth: 1.08, skin: '#e8b996', hair: 'fringe', hairColor: '#bdbdb8', glasses: 'round', glassesColor: '#2a2a2a', outfit: 'suit', top: '#2f3542', pants: '#2a2f3a', shirt: '#f4f4f4', tie: '#3c5a8a', shoes: '#1d1d1d' },
    stats: { speed: 1, power: 0.91, defense: 1.05, jump: 0.95 },
    special: { type: 'projectile', name: 'Water Carrier', proj: 'water' },
    super: { type: 'wave', name: 'National Water Wave', color: '#3fa9f5' },
    quote: 'Stay hydrated. And stay down.', victory: 'fist'
  },
  {
    id: 'allon', name: 'Yigal Allon', short: 'ALLON', title: 'The Commander', rarity: 'common', starter: true,
    group: 'pm', years: '1969 (interim)',
    bio: "Served as interim Prime Minister in 1969 after Levi Eshkol's death. A former Palmach commander.",
    look: { height: 1.0, girth: 1.02, skin: '#e1ab85', hair: 'parted', hairColor: '#3b2d20', outfit: 'shirt', top: '#8c8a5c', pants: '#4e4a36', shirt: '#8c8a5c', tie: null, shoes: '#2a2018' },
    stats: { speed: 1.1, power: 1, defense: 1, jump: 1.05 },
    dash: { dist: 0.75, cd: 26, cancel: 9 },   // toned down: fast walker + rush special made his dash too strong
    special: { type: 'rush', name: 'Palmach Dash', dmg: 86 },
    quote: 'Interim? I am here to stay.', victory: 'salute'
  },
  {
    id: 'meir', name: 'Golda Meir', short: 'MEIR', title: 'The Iron Grandmother', rarity: 'mythic',
    group: 'pm', years: '1969–74',
    bio: 'Fourth Prime Minister and one of the world\'s first female heads of government. Held her famous "kitchen cabinet" meetings at home.',
    look: { height: 0.94, girth: 1.12, skin: '#e4b58f', hair: 'bun', hairColor: '#a9a7a2', outfit: 'dress', top: '#2d3142', pants: '#2d3142', shirt: '#2d3142', tie: null, shoes: '#1d1d1d', prop: 'handbag', propColor: '#3b2a20' },
    stats: { speed: 0.92, power: 1, defense: 1, jump: 0.92 },
    special: { type: 'projectile', name: 'Handbag Hurl', proj: 'handbag' },
    special2: { type: 'counter', name: 'Iron Retort' },
    super: { type: 'rain', name: 'Kitchen Cabinet', color: '#f7f3e8', obj: 'teacup' },
    passive: { id: 'thickskin', name: 'Iron Will' },
    quote: 'Sit. Have some tea. You have earned it.', victory: 'fist'
  },
  {
    id: 'rabin', name: 'Yitzhak Rabin', short: 'RABIN', title: 'The General', rarity: 'elite',
    group: 'pm', years: '1974–77, 1992–95',
    bio: 'Fifth Prime Minister, twice. Former IDF Chief of Staff and Nobel Peace Prize laureate.',
    look: { height: 1.0, girth: 1.0, skin: '#eab28f', hair: 'parted', hairColor: '#b9a38a', outfit: 'suit', top: '#3e4550', pants: '#373d47', shirt: '#f2f2f2', tie: '#26364f', shoes: '#1d1d1d' },
    stats: { speed: 1, power: 0.9, defense: 0.96, jump: 1 },
    special: { type: 'rush', name: 'Chief of Staff Charge', dmg: 80 },
    special2: { type: 'projectile', name: 'Olive Branch', proj: 'olive' },
    super: { type: 'beam', name: 'Peace Prize Beam', color: '#ffd76a', mult: 0.82 },
    quote: 'Discipline wins wars. And fights.', victory: 'salute'
  },
  {
    id: 'begin', name: 'Menachem Begin', short: 'BEGIN', title: 'The Orator', rarity: 'epic',
    group: 'pm', years: '1977–83',
    bio: 'Sixth Prime Minister. A thunderous speaker who signed the peace treaty with Egypt and won the Nobel Peace Prize.',
    look: { height: 0.96, girth: 0.98, skin: '#e6b691', hair: 'fringe', hairColor: '#3a3028', glasses: 'thick', glassesColor: '#151515', outfit: 'suit', top: '#2a2a30', pants: '#26262b', shirt: '#f2f2f2', tie: '#5a1f1f', shoes: '#1d1d1d' },
    stats: { speed: 0.97, power: 1.01, defense: 1, jump: 1, projSpeed: 1.25 },
    special: { type: 'projectile', name: 'Fiery Oration', proj: 'soundring' },
    special2: { type: 'counter', name: 'Point of Order', dmg: 118 },
    super: { type: 'wave', name: 'Thunderous Speech', color: '#ff8a3d', mult: 0.92 },
    quote: 'I yield the floor. You may stay on it.', victory: 'point'
  },
  {
    id: 'shamir', name: 'Yitzhak Shamir', short: 'SHAMIR', title: 'The Stalwart', rarity: 'superrare',
    group: 'pm', years: '1983–84, 1986–92',
    bio: 'Seventh Prime Minister, twice. Small in stature, famously unbending in style.',
    look: { height: 0.86, girth: 1.08, skin: '#e6b38c', hair: 'short', hairColor: '#e8e8e4', mustache: true, mustacheColor: '#e8e8e4', bushy: true, outfit: 'suit', top: '#3a3d44', pants: '#33363c', shirt: '#f2f2f2', tie: '#4b4b4b', shoes: '#1d1d1d' },
    stats: { speed: 0.92, power: 0.98, defense: 1.06, jump: 0.9 },
    special: { type: 'rush', name: 'Stalwart Shove', armor: true, dmg: 86 },
    super: { type: 'wave', name: 'Immovable Shockwave', color: '#b8b2a7' },
    quote: 'I did not move an inch.', victory: 'fist'
  },
  {
    id: 'peres', name: 'Shimon Peres', short: 'PERES', title: 'The Visionary', rarity: 'elite',
    group: 'pm', years: '1984–86, 1995–96',
    bio: 'Eighth Prime Minister, twice, and later President. A lifelong champion of science, start-ups and big ideas.',
    look: { height: 1.05, girth: 0.96, skin: '#ebbd9a', hair: 'combed', hairColor: '#e9e9e6', outfit: 'suit', top: '#2b2f3a', pants: '#262a34', shirt: '#f4f4f4', tie: '#1f4f8f', shoes: '#1d1d1d' },
    stats: { speed: 1.05, power: 0.98, defense: 1.03, jump: 1.08 },
    special: { type: 'projectile', name: 'Bright Idea', proj: 'bulb' },
    special2: { type: 'rising', name: 'Visionary Leap', color: '#fff3a0' },
    super: { type: 'rain', name: 'Startup Nation Storm', color: '#fff3a0', obj: 'bulb' },
    quote: 'The future belongs to the bold — and the quick.', victory: 'wave'
  },
  {
    id: 'netanyahu', name: 'Benjamin Netanyahu', short: 'NETANYAHU', title: 'The Survivor', rarity: 'legendary',
    group: 'pm', years: '1996–99, 2009–21, 2022–',
    bio: 'Israel\'s longest-serving Prime Minister. Drew a red line on a cartoon bomb at the UN in 2012.',
    look: { height: 1.0, girth: 1.04, skin: '#e9b48e', hair: 'combed', hairColor: '#d9d9d6', outfit: 'suit', top: '#1e2a44', pants: '#1b263d', shirt: '#f6f6f6', tie: '#2b6cd0', shoes: '#111111' },
    stats: { speed: 1, power: 1.07, defense: 1.05, jump: 1 },
    special: { type: 'projectile', name: 'Cartoon Bomb', proj: 'bomb', dmg: 92 },
    special2: { type: 'rising', name: 'Comeback Uppercut', color: '#5aa0ff' },
    super: { type: 'beam', name: 'The Red Line', color: '#ff2b2b', mult: 1.08 },
    passive: { id: 'survivor', name: 'Survivor' },
    quote: 'I drew a red line. You crossed it.', victory: 'point'
  },
  {
    id: 'barak', name: 'Ehud Barak', short: 'BARAK', title: 'The Commando', rarity: 'epic',
    group: 'pm', years: '1999–2001',
    bio: 'Tenth Prime Minister. Israel\'s most decorated soldier — and an accomplished classical pianist.',
    look: { height: 0.92, girth: 1.0, skin: '#e2ad86', hair: 'short', hairColor: '#9a9a96', glasses: 'thin', glassesColor: '#3a3a3a', outfit: 'suit', top: '#33363d', pants: '#2d3036', shirt: '#f2f2f2', tie: '#7a6a3a', shoes: '#1d1d1d' },
    stats: { speed: 1.18, power: 1.01, defense: 0.97, jump: 1.1 },
    special: { type: 'rush', name: 'Commando Dash' },
    special2: { type: 'rising', name: 'Commando Flip Kick', color: '#9be29b' },
    super: { type: 'drop', name: 'Grand Piano Finale', color: '#222222', obj: 'piano', mult: 0.9 },
    quote: 'That was allegro. You were largo.', victory: 'bow'
  },
  {
    id: 'sharon', name: 'Ariel Sharon', short: 'SHARON', title: 'The Bulldozer', rarity: 'mythic',
    group: 'pm', years: '2001–06',
    bio: 'Eleventh Prime Minister. A former general whose nickname said it all: "the Bulldozer".',
    look: { height: 0.97, girth: 1.5, skin: '#eab593', hair: 'short', hairColor: '#f2f2ee', outfit: 'suit', top: '#2e3440', pants: '#2a2f3a', shirt: '#f4f4f4', tie: '#40527a', shoes: '#1d1d1d' },
    stats: { speed: 0.84, power: 1.04, defense: 1.18, jump: 0.86 },
    special: { type: 'rush', name: 'Bulldozer Charge', armor: true },
    special2: { type: 'counter', name: 'Bulldozer Block' },
    super: { type: 'vehicle', name: 'The Bulldozer', color: '#f2b705', obj: 'bulldozer' },
    passive: { id: 'momentum', name: 'Momentum' },
    quote: 'Nobody stops the Bulldozer.', victory: 'fist'
  },
  {
    id: 'olmert', name: 'Ehud Olmert', short: 'OLMERT', title: 'The Mayor', rarity: 'superrare',
    group: 'pm', years: '2006–09',
    bio: 'Twelfth Prime Minister and a former Mayor of Jerusalem.',
    look: { height: 0.98, girth: 1.02, skin: '#e7b590', hair: 'fringe', hairColor: '#b5b5b0', glasses: 'thin', glassesColor: '#444444', outfit: 'suit', top: '#3a3f4b', pants: '#343944', shirt: '#f2f2f2', tie: '#8a2c2c', shoes: '#1d1d1d' },
    stats: { speed: 1, power: 0.97, defense: 1, jump: 1 },
    special: { type: 'projectile', name: 'Municipal Memo', proj: 'folder', dmg: 84 },
    super: { type: 'vehicle', name: 'Jerusalem Light Rail', color: '#d9dde3', obj: 'tram' },
    quote: 'Next stop: the floor.', victory: 'wave'
  },
  {
    id: 'bennett', name: 'Naftali Bennett', short: 'BENNETT', title: 'The Tech Boss', rarity: 'epic',
    group: 'pm', years: '2021–22',
    bio: 'Thirteenth Prime Minister. A former commando and tech entrepreneur who sold his start-up.',
    look: { height: 1.02, girth: 1.0, skin: '#e8b28c', hair: 'bald', hairColor: '#7a6a5a', kippah: '#2a2a2a', outfit: 'open', top: '#22262e', pants: '#1f232a', shirt: '#f4f4f4', tie: null, shoes: '#111111' },
    stats: { speed: 1.1, power: 0.88, defense: 0.97, jump: 1.05 },
    special: { type: 'projectile', name: 'Cyber Byte', proj: 'byte' },
    special2: { type: 'rush', name: 'Startup Sprint' },
    super: { type: 'vehicle', name: 'Unicorn Exit', color: '#ffffff', obj: 'unicorn', mult: 0.8 },
    quote: 'Exit complete. Unicorn achieved.', victory: 'fist'
  },
  {
    id: 'lapid', name: 'Yair Lapid', short: 'LAPID', title: 'The Anchor', rarity: 'superrare',
    group: 'pm', years: '2022',
    bio: 'Fourteenth Prime Minister. A former TV anchor, columnist and author.',
    look: { height: 1.02, girth: 0.98, skin: '#e7b08a', hair: 'full', hairColor: '#cfcfcb', outfit: 'open', top: '#16171b', pants: '#16171b', shirt: '#1f2026', tie: null, shoes: '#111111' },
    stats: { speed: 1.05, power: 0.97, defense: 1, jump: 1.02, projSpeed: 1.1 },
    special: { type: 'projectile', name: 'Breaking News', proj: 'mic' },
    super: { type: 'beam', name: 'Prime Time Special', color: '#7fd3ff', mult: 1.05 },
    quote: "And that's the news tonight.", victory: 'wave'
  },
  {
    id: 'gantz', name: 'Benny Gantz', short: 'GANTZ', title: 'The Chief', rarity: 'common', starter: true,
    group: 'contender', years: 'Contender',
    bio: 'Former IDF Chief of Staff and long-time contender for the top job.',
    look: { height: 1.08, girth: 1.0, skin: '#ebb895', hair: 'short', hairColor: '#a8a8a4', outfit: 'open', top: '#2c3a55', pants: '#27344c', shirt: '#f4f4f4', tie: null, shoes: '#1d1d1d' },
    stats: { speed: 1, power: 1, defense: 1.1, jump: 1.05, hp: 10 },
    special: { type: 'projectile', name: 'Blue & White Banner', proj: 'banner' },
    quote: 'My turn. It was always going to be my turn.', victory: 'salute'
  },
  {
    id: 'eisenkot', name: 'Gadi Eisenkot', short: 'EISENKOT', title: 'The Strategist', rarity: 'rare',
    group: 'contender', years: 'Contender',
    bio: 'Former IDF Chief of Staff who stepped into politics with his eyes on the top job.',
    look: { height: 0.98, girth: 1.0, skin: '#e0aa82', hair: 'fringe', hairColor: '#8e8e8a', outfit: 'suit', top: '#3b3f47', pants: '#353940', shirt: '#f2f2f2', tie: '#2a4a3a', shoes: '#1d1d1d' },
    stats: { speed: 1.1, power: 1.02, defense: 1, jump: 1 },
    special: { type: 'rush', name: "Chief's Advance", dmg: 92 },
    super: { type: 'flurry', name: 'Strategic Barrage', color: '#9be29b' },
    quote: 'Every move was in the briefing.', victory: 'salute'
  },
  {
    id: 'liberman', name: 'Avigdor Liberman', short: 'LIBERMAN', title: 'The Kingmaker', rarity: 'superrare',
    group: 'contender', years: 'Contender',
    bio: 'Long-time Yisrael Beiteinu leader, famous for deciding who gets to form a coalition.',
    look: { height: 1.0, girth: 1.25, skin: '#e8b590', hair: 'short', hairColor: '#8a8580', beard: '#9a958f', outfit: 'suit', top: '#2b2d33', pants: '#26282d', shirt: '#f2f2f2', tie: '#3a4f8c', shoes: '#1d1d1d' },
    stats: { speed: 0.9, power: 1.06, defense: 1.08, jump: 0.9 },
    special: { type: 'projectile', name: 'Kingmaker Crown', proj: 'crown' },
    super: { type: 'drop', name: 'Coalition Crusher', color: '#ffcc33', obj: 'crown', mult: 0.92 },
    quote: 'No coalition without me.', victory: 'point'
  },
  {
    id: 'golan', name: 'Yair Golan', short: 'GOLAN', title: 'The Democrat', rarity: 'common',
    group: 'contender', years: 'Contender',
    bio: 'Leader of The Democrats and a former IDF Deputy Chief of Staff.',
    look: { height: 1.0, girth: 1.0, skin: '#e5b08a', hair: 'bald', hairColor: '#9f9f9b', outfit: 'open', top: '#353946', pants: '#2f333f', shirt: '#eef2f7', tie: null, shoes: '#1d1d1d' },
    stats: { speed: 1.06, power: 1.05, defense: 1.01, jump: 1.04, projSpeed: 1.1 },
    special: { type: 'projectile', name: 'Rally Flag', proj: 'flag' },
    quote: 'The people have spoken. Loudly.', victory: 'fist'
  },
  {
    id: 'livni', name: 'Tzipi Livni', short: 'LIVNI', title: 'The Negotiator', rarity: 'common', starter: true,
    group: 'contender', years: 'Contender',
    bio: 'Former Foreign Minister and Kadima leader who won the most seats in 2009 and ran for the top job.',
    look: { height: 0.95, girth: 0.92, skin: '#ebbd9a', hair: 'bob', hairColor: '#cfae7e', outfit: 'open', top: '#34405e', pants: '#2c3650', shirt: '#eef2f7', tie: null, shoes: '#1d1d1d' },
    stats: { speed: 1.08, power: 1, defense: 0.98, jump: 1.06 },
    special: { type: 'projectile', name: 'Negotiation Briefcase', proj: 'briefcase', dmg: 80 },
    quote: 'Let us negotiate. You lose.', victory: 'wave'
  },
  {
    id: 'herzog', name: 'Isaac Herzog', short: 'HERZOG', title: 'The President', rarity: 'common',
    group: 'contender', years: 'Contender',
    bio: 'Led the Zionist Union in the 2015 race for Prime Minister and later became Israel\'s eleventh President.',
    look: { height: 0.97, girth: 0.9, skin: '#e9b896', hair: 'short', hairColor: '#5e5850', glasses: 'thin', glassesColor: '#222222', outfit: 'suit', top: '#283043', pants: '#232a3a', shirt: '#f2f2f2', tie: '#5a7bb5', shoes: '#1d1d1d' },
    stats: { speed: 1.04, power: 1, defense: 1.02, jump: 1.02 },
    special: { type: 'projectile', name: 'Presidential Seal', proj: 'seal' },
    quote: 'I call for unity. And a rematch.', victory: 'bow'
  },
  {
    id: 'weizmann', name: 'Chaim Weizmann', short: 'WEIZMANN', title: 'The Chemist', rarity: 'rare',
    group: 'icon', years: 'First President',
    bio: "Israel's first President and a celebrated chemist whose wartime research made him world-famous.",
    look: { height: 0.98, girth: 1.0, skin: '#e6b48e', hair: 'bald', hairColor: '#8a8580', beard: '#6f6a64', glasses: 'round', glassesColor: '#2a2a2a', outfit: 'suit', top: '#2f3138', pants: '#2a2c32', shirt: '#f2f2f2', tie: '#6b2f2f', shoes: '#1d1d1d' },
    stats: { speed: 0.98, power: 0.94, defense: 1.02, jump: 0.98 },
    special: { type: 'projectile', name: 'Acetone Flask', proj: 'water' },
    super: { type: 'wave', name: 'Chain Reaction', color: '#7dffb0' },
    quote: 'The experiment was a success. You were the control group.', victory: 'bow'
  },
  {
    id: 'dayan', name: 'Moshe Dayan', short: 'DAYAN', title: 'The Eyepatch', rarity: 'mythic',
    group: 'icon', years: 'Minister & MK',
    bio: 'Former IDF Chief of Staff, later Defense and Foreign Minister — instantly recognisable by his eyepatch.',
    look: { height: 0.98, girth: 1.02, skin: '#ddA27a', hair: 'fringe', hairColor: '#3a2f26', eyepatch: true, outfit: 'shirt', top: '#9a9468', pants: '#4e4a36', shirt: '#9a9468', tie: null, shoes: '#2a2018' },
    stats: { speed: 1.08, power: 1.07, defense: 1.02, jump: 1.05 },
    special: { type: 'rush', name: 'Desert Raid', dmg: 100 },
    special2: { type: 'rising', name: 'Hawk Dive', color: '#ffb347' },
    super: { type: 'spin', name: 'Sandstorm Spin', color: '#e8c27a' },
    passive: { id: 'momentum', name: 'Battle Rhythm' },
    quote: 'I only needed one eye for that.', victory: 'salute'
  },
  {
    id: 'eban', name: 'Abba Eban', short: 'EBAN', title: 'The Silver Tongue', rarity: 'rare',
    group: 'icon', years: 'Foreign Minister',
    bio: 'Foreign Minister and legendary orator, famous for speeches delivered in flawless English.',
    look: { height: 0.97, girth: 1.08, skin: '#ebbd9a', hair: 'short', hairColor: '#8a8a86', glasses: 'thick', glassesColor: '#1d1d1d', outfit: 'suit', top: '#353a46', pants: '#2f343f', shirt: '#f2f2f2', tie: '#2a4a7a', shoes: '#1d1d1d' },
    stats: { speed: 1, power: 1, defense: 1.02, jump: 1, projSpeed: 1.15, hp: 20 },
    special: { type: 'projectile', name: 'Silver Tongue', proj: 'soundring', dmg: 86 },
    super: { type: 'reflect', name: 'Diplomatic Immunity', color: '#9ad1ff' },
    quote: 'Eloquently defeated.', victory: 'bow'
  },
  {
    id: 'edelstein', name: 'Yuli Edelstein', short: 'EDELSTEIN', title: 'The Former Speaker', rarity: 'epic',
    group: 'icon', years: 'Knesset Speaker',
    bio: 'Long-serving Speaker of the Knesset who once ran this very chamber.',
    look: { height: 1.0, girth: 1.06, skin: '#e8b693', hair: 'fringe', hairColor: '#9a9590', beard: '#aaa59f', glasses: 'thin', glassesColor: '#333333', outfit: 'suit', top: '#23262e', pants: '#1f222a', shirt: '#f2f2f2', tie: '#7a6a3a', shoes: '#111111' },
    stats: { speed: 0.98, power: 1.04, defense: 1.06, jump: 0.98, hp: 15 },
    special: { type: 'projectile', name: 'Out of Order', proj: 'gavelwave' },
    special2: { type: 'counter', name: "Speaker's Ruling" },
    super: { type: 'drop', name: 'Gavel Down', color: '#8a5a2b', obj: 'gavel' },
    quote: 'The Member is out of order. And out of health.', victory: 'point'
  },
  {
    id: 'saar', name: "Gideon Sa'ar", short: "SA'AR", title: 'The Challenger', rarity: 'rare',
    group: 'contender', years: 'Contender',
    bio: 'Veteran minister who founded his own party to run for Prime Minister in 2021.',
    look: { height: 1.0, girth: 0.98, skin: '#e2ae88', hair: 'short', hairColor: '#4a4540', outfit: 'suit', top: '#2a3348', pants: '#252d40', shirt: '#f2f2f2', tie: '#3a6ab0', shoes: '#1d1d1d' },
    stats: { speed: 1.05, power: 0.95, defense: 1, jump: 1.02 },
    special: { type: 'projectile', name: 'New Hope Banner', proj: 'banner' },
    super: { type: 'beam', name: 'Breakaway Beam', color: '#8fd0ff', mult: 1.05 },
    quote: 'I always have a new plan.', victory: 'fist'
  },
  {
    id: 'shaked', name: 'Ayelet Shaked', short: 'SHAKED', title: 'The Justice', rarity: 'common',
    group: 'icon', years: 'Former Minister',
    bio: 'Former Justice Minister and Interior Minister, and a former software engineer.',
    look: { height: 0.96, girth: 0.9, skin: '#ebbd9a', hair: 'bob', hairColor: '#3a2a20', outfit: 'open', top: '#1f2b45', pants: '#1c2740', shirt: '#f4f4f4', tie: null, shoes: '#111111' },
    stats: { speed: 1.1, power: 0.96, defense: 0.98, jump: 1.1, projSpeed: 0.95 },
    special: { type: 'projectile', name: 'Judicial Memo', proj: 'folder', dmg: 84 },
    quote: 'Case closed.', victory: 'wave'
  },
  {
    id: 'yadin', name: 'Yigael Yadin', short: 'YADIN', title: 'The Archaeologist', rarity: 'mythic',
    group: 'icon', years: 'Deputy PM',
    bio: 'IDF Chief of Staff turned world-famous archaeologist who dug at Masada and studied the Dead Sea Scrolls, later Deputy Prime Minister.',
    look: { height: 1.0, girth: 0.98, skin: '#e2ad86', hair: 'bald', hairColor: '#4a3f36', glasses: 'thin', glassesColor: '#2a2a2a', outfit: 'shirt', top: '#c2b282', pants: '#5d5240', shirt: '#c2b282', tie: null, shoes: '#3b2a1a' },
    stats: { speed: 1.04, power: 0.95, defense: 1.04, jump: 1.02 },
    special: { type: 'projectile', name: 'Dead Sea Scroll', proj: 'scroll' },
    special2: { type: 'rising', name: 'Masada Leap', color: '#e8c27a' },
    super: { type: 'rain', name: 'Excavation Storm', color: '#e8c27a', obj: 'scroll' },
    passive: { id: 'thickskin', name: 'Bedrock' },
    quote: 'I have dug up older things than you.', victory: 'point'
  },
  {
    id: 'ezerweizman', name: 'Ezer Weizman', short: 'E. WEIZMAN', title: 'The Pilot', rarity: 'superrare',
    group: 'icon', years: 'President',
    bio: 'Air Force commander, Defense Minister and later President — a fighter pilot to the end.',
    look: { height: 1.08, girth: 0.98, skin: '#e6b28c', hair: 'short', hairColor: '#b9b5ae', mustache: true, mustacheColor: '#b9b5ae', outfit: 'open', top: '#2d4a7a', pants: '#26406a', shirt: '#dfe9f7', tie: null, shoes: '#111111' },
    stats: { speed: 1.12, power: 1, defense: 1, jump: 1.1 },
    special: { type: 'rush', name: 'Fighter Pilot Dive' },
    super: { type: 'beam', name: 'Afterburner', color: '#ff9a3d', mult: 0.9 },
    quote: 'Wheels up. You are grounded.', victory: 'salute'
  },
  {
    id: 'rivlin', name: 'Reuven Rivlin', short: 'RIVLIN', title: 'The Unifier', rarity: 'superrare',
    group: 'icon', years: 'President',
    bio: "Former Knesset Speaker and Israel's tenth President, known for his 'four tribes' speech.",
    look: { height: 0.96, girth: 1.06, skin: '#e9b896', hair: 'short', hairColor: '#e9e9e4', glasses: 'thin', glassesColor: '#333333', outfit: 'suit', top: '#2b3040', pants: '#262a38', shirt: '#f2f2f2', tie: '#8a2c2c', shoes: '#1d1d1d' },
    stats: { speed: 0.98, power: 0.95, defense: 1, jump: 0.98 },
    special: { type: 'projectile', name: 'Unity Seal', proj: 'seal' },
    super: { type: 'wave', name: 'Four Tribes Wave', color: '#7fd3ff' },
    quote: 'We are all in this chamber together.', victory: 'wave'
  },
  {
    id: 'navon', name: 'Yitzhak Navon', short: 'NAVON', title: 'The Playwright', rarity: 'common', starter: true,
    group: 'icon', years: 'President',
    bio: "Israel's fifth President, an educator and a playwright.",
    look: { height: 0.98, girth: 1.0, skin: '#e2ad86', hair: 'combed', hairColor: '#6b6660', outfit: 'suit', top: '#353a46', pants: '#2f343f', shirt: '#f2f2f2', tie: '#2a4a7a', shoes: '#1d1d1d' },
    stats: { speed: 1.02, power: 1.04, defense: 1.04, jump: 1 },
    special: { type: 'projectile', name: 'Script Toss', proj: 'folder' },
    quote: 'And... scene.', victory: 'bow'
  },
  {
    id: 'aloni', name: 'Shulamit Aloni', short: 'ALONI', title: 'The Advocate', rarity: 'common',
    group: 'icon', years: 'Minister & MK',
    bio: 'Founder of the Ratz party and a lifelong civil-rights campaigner who served as a minister.',
    look: { height: 0.92, girth: 0.98, skin: '#ebbd9a', hair: 'bob', hairColor: '#b8b5b0', glasses: 'round', glassesColor: '#3a3a3a', outfit: 'open', top: '#4a3a5e', pants: '#3a2f4a', shirt: '#f4f0f7', tie: null, shoes: '#1d1d1d' },
    stats: { speed: 1.04, power: 0.99, defense: 1.02, jump: 1, projSpeed: 1.08 },
    special: { type: 'projectile', name: 'Rights Banner', proj: 'flag', dmg: 80 },
    quote: 'Rights are not up for a vote.', victory: 'fist'
  },
  {
    id: 'peretz', name: 'Amir Peretz', short: 'PERETZ', title: 'The Iron Dome', rarity: 'epic',
    group: 'icon', years: 'Minister & MK',
    bio: 'Former union leader, Labor leader and Defense Minister who backed the Iron Dome program.',
    look: { height: 0.98, girth: 1.06, skin: '#d9a37c', hair: 'short', hairColor: '#8a8580', mustache: true, mustacheColor: '#1d1612', bushy: true, outfit: 'open', top: '#2b2f3a', pants: '#262a34', shirt: '#f4f4f4', tie: null, shoes: '#1d1d1d' },
    stats: { speed: 1, power: 1.06, defense: 1.08, jump: 0.98 },
    special: { type: 'projectile', name: 'Union Megaphone', proj: 'mic' },
    special2: { type: 'counter', name: 'Interceptor' },
    super: { type: 'reflect', name: 'Iron Dome', color: '#8fd0ff' },
    quote: 'Intercepted.', victory: 'fist'
  },
  {
    id: 'michaeli', name: 'Merav Michaeli', short: 'MICHAELI', title: 'The Broadcaster', rarity: 'common',
    group: 'contender', years: 'Contender',
    bio: 'Former broadcaster and journalist who led the Labor Party.',
    look: { height: 1.0, girth: 0.9, skin: '#ebbd9a', hair: 'bob', hairColor: '#141210', outfit: 'open', top: '#141418', pants: '#141418', shirt: '#1d1d22', tie: null, shoes: '#111111' },
    stats: { speed: 1.08, power: 1.03, defense: 0.98, jump: 1.05, hp: 35 },
    special: { type: 'projectile', name: 'On Air', proj: 'mic' },
    quote: 'We are back after the break. You are not.', victory: 'wave'
  },
  {
    id: 'kahlon', name: 'Moshe Kahlon', short: 'KAHLON', title: 'The Price Cutter', rarity: 'common',
    group: 'icon', years: 'Minister & MK',
    bio: 'Former Finance Minister, famous for cutting mobile phone prices as Communications Minister.',
    look: { height: 0.98, girth: 1.04, skin: '#d9a37c', hair: 'short', hairColor: '#2a2420', outfit: 'suit', top: '#2a2d36', pants: '#24272f', shirt: '#f2f2f2', tie: '#3a6ab0', shoes: '#1d1d1d' },
    stats: { speed: 1.02, power: 1, defense: 1.03, jump: 1, hp: 40 },
    special: { type: 'projectile', name: 'Price Cut Briefcase', proj: 'briefcase' },
    quote: 'Discount applied. To your health bar.', victory: 'point'
  },
  {
    id: 'abbas', name: 'Mansour Abbas', short: 'ABBAS', title: 'The Coalition Builder', rarity: 'rare',
    group: 'icon', years: 'MK',
    bio: "Leader of Ra'am, whose party in 2021 became the first independent Arab party to join a governing coalition.",
    look: { height: 0.98, girth: 1.04, skin: '#c99068', hair: 'short', hairColor: '#3a3430', beard: '#5a524a', outfit: 'suit', top: '#2f3442', pants: '#2a2e3b', shirt: '#f2f2f2', tie: '#2f6b4a', shoes: '#1d1d1d' },
    stats: { speed: 1, power: 1, defense: 0.94, jump: 1 },
    special: { type: 'projectile', name: 'Olive Branch Offer', proj: 'olive' },
    super: { type: 'wave', name: 'Bridge Builder', color: '#7dff9b' },
    quote: 'Every coalition needs the right partner.', victory: 'bow'
  },
  {
    id: 'arens', name: 'Moshe Arens', short: 'ARENS', title: 'The Engineer', rarity: 'rare',
    group: 'icon', years: 'Minister & MK',
    bio: 'Aeronautical engineer, three-time Defense Minister and champion of the Lavi jet project.',
    look: { height: 1.02, girth: 0.98, skin: '#e9b896', hair: 'fringe', hairColor: '#a8a49e', glasses: 'thick', glassesColor: '#222222', outfit: 'suit', top: '#3a3f4b', pants: '#343944', shirt: '#f2f2f2', tie: '#4b4b4b', shoes: '#1d1d1d' },
    stats: { speed: 1.02, power: 1.03, defense: 1.02, jump: 1.02 },
    special: { type: 'rush', name: 'Lavi Sortie' },
    super: { type: 'beam', name: 'Jet Stream', color: '#9fd8ff', mult: 0.95 },
    quote: 'Calculated. Engineered. Done.', victory: 'salute'
  },
  {
    id: 'benzvi', name: 'Yitzhak Ben-Zvi', short: 'BEN-ZVI', title: 'The Historian', rarity: 'common',
    group: 'icon', years: 'President',
    bio: "Israel's second and longest-serving President, and a historian of Jewish communities around the world.",
    look: { height: 0.96, girth: 1.0, skin: '#e6b48e', hair: 'combed', hairColor: '#9a958f', mustache: true, mustacheColor: '#8a8580', glasses: 'round', glassesColor: '#2a2a2a', outfit: 'suit', top: '#3a3d44', pants: '#33363c', shirt: '#f2f2f2', tie: '#4b4b4b', shoes: '#1d1d1d' },
    stats: { speed: 1, power: 1.01, defense: 1.05, jump: 1 },
    special: { type: 'projectile', name: 'History Lesson', proj: 'scroll' },
    quote: 'This will be in the history books. Page one.', victory: 'bow'
  },
  {
    id: 'shazar', name: 'Zalman Shazar', short: 'SHAZAR', title: 'The Poet', rarity: 'common',
    group: 'icon', years: 'President',
    bio: "Israel's third President — a writer, poet and scholar.",
    look: { height: 0.95, girth: 1.0, skin: '#e9b896', hair: 'full', hairColor: '#f0f0ec', outfit: 'suit', top: '#2f3138', pants: '#2a2c32', shirt: '#f2f2f2', tie: '#2a4a7a', shoes: '#1d1d1d' },
    stats: { speed: 1.04, power: 0.98, defense: 1, jump: 1.02 },
    special: { type: 'projectile', name: "Poet's Verse", proj: 'folder', dmg: 84 },
    quote: 'A sonnet for your defeat.', victory: 'bow'
  },
  {
    id: 'bennybegin', name: 'Benny Begin', short: 'B. BEGIN', title: 'The Geologist', rarity: 'common',
    group: 'icon', years: 'Minister & MK',
    bio: 'Geologist, minister and son of Menachem Begin.',
    look: { height: 0.98, girth: 0.98, skin: '#e6b691', hair: 'fringe', hairColor: '#b5b0aa', beard: '#c0bbb4', glasses: 'thin', glassesColor: '#333333', outfit: 'suit', top: '#353946', pants: '#2f333f', shirt: '#f2f2f2', tie: '#5a1f1f', shoes: '#1d1d1d' },
    stats: { speed: 1, power: 1.01, defense: 1.02, jump: 0.98, projSpeed: 0.9 },
    special: { type: 'projectile', name: 'Rock Sample', proj: 'rock', dmg: 92 },
    quote: 'Solid as bedrock.', victory: 'point'
  },
  {
    id: 'sarid', name: 'Yossi Sarid', short: 'SARID', title: 'The Educator', rarity: 'common',
    group: 'icon', years: 'Minister & MK',
    bio: 'Longtime Meretz leader and Education Minister.',
    look: { height: 1.0, girth: 1.0, skin: '#e6b48e', hair: 'full', hairColor: '#a8a49e', glasses: 'thin', glassesColor: '#2a2a2a', outfit: 'open', top: '#2b2f3a', pants: '#262a34', shirt: '#f4f4f4', tie: null, shoes: '#1d1d1d' },
    stats: { speed: 1.04, power: 1.01, defense: 1.04, jump: 1.02, hp: 20 },
    special: { type: 'projectile', name: 'Pop Quiz', proj: 'folder' },
    quote: 'Class dismissed.', victory: 'point'
  },
  {
    id: 'yachimovich', name: 'Shelly Yachimovich', short: 'YACHIMOVICH', title: 'The Reporter', rarity: 'common',
    group: 'icon', years: 'Opposition Leader',
    bio: 'Journalist and radio host who led the Labor Party and served as Leader of the Opposition.',
    look: { height: 0.96, girth: 0.9, skin: '#ebbd9a', hair: 'bob', hairColor: '#8a3b22', outfit: 'open', top: '#3a2a4a', pants: '#2c2238', shirt: '#f4f0f7', tie: null, shoes: '#111111' },
    stats: { speed: 1.05, power: 0.99, defense: 0.98, jump: 1.05, projSpeed: 1.1 },
    special: { type: 'projectile', name: 'Investigative Report', proj: 'mic' },
    quote: 'Sources confirm: you lost.', victory: 'wave'
  },
  {
    id: 'tommylapid', name: 'Tommy Lapid', short: 'T. LAPID', title: 'The Firebrand', rarity: 'rare',
    group: 'icon', years: 'Minister & MK',
    bio: 'Journalist and TV personality who led the Shinui party and served as Justice Minister — and father of Yair Lapid.',
    look: { height: 1.02, girth: 1.2, skin: '#ebbd9a', hair: 'combed', hairColor: '#f0f0ec', glasses: 'thick', glassesColor: '#1d1d1d', outfit: 'suit', top: '#2a2d36', pants: '#24272f', shirt: '#f2f2f2', tie: '#8a2c2c', shoes: '#1d1d1d' },
    stats: { speed: 0.95, power: 0.98, defense: 1.05, jump: 0.95 },
    special: { type: 'projectile', name: 'Op-Ed', proj: 'folder' },
    super: { type: 'beam', name: 'Hot Take', color: '#ff7a3d', mult: 1.1 },
    quote: 'Like father, like son — but louder.', victory: 'point'
  },
  {
    id: 'davidlevy', name: 'David Levy', short: 'D. LEVY', title: 'The Builder from Beit She\'an', rarity: 'rare',
    group: 'icon', years: 'Foreign Minister',
    bio: "Long-serving Foreign Minister and Deputy PM who started out as a construction worker in Beit She'an.",
    look: { height: 1.0, girth: 1.02, skin: '#d9a37c', hair: 'combed', hairColor: '#3a3430', mustache: true, mustacheColor: '#2a2420', outfit: 'suit', top: '#2b3040', pants: '#262a38', shirt: '#f2f2f2', tie: '#2a4a7a', shoes: '#1d1d1d' },
    stats: { speed: 1.02, power: 0.96, defense: 1, jump: 1 },
    special: { type: 'projectile', name: 'Foreign Ministry Cable', proj: 'envelope' },
    super: { type: 'wave', name: 'Grassroots Wave', color: '#ffb347' },
    quote: 'From the scaffolding to the summit.', victory: 'fist'
  },
  {
    id: 'itzik', name: 'Dalia Itzik', short: 'ITZIK', title: 'The First Speaker', rarity: 'rare',
    group: 'icon', years: 'Knesset Speaker',
    bio: 'The first woman to serve as Speaker of the Knesset.',
    look: { height: 0.95, girth: 0.98, skin: '#e6b28c', hair: 'bob', hairColor: '#c99a5a', outfit: 'open', top: '#1f2b45', pants: '#1c2740', shirt: '#eef2f7', tie: null, shoes: '#111111' },
    stats: { speed: 1.04, power: 0.99, defense: 0.98, jump: 1 },
    special: { type: 'projectile', name: "Speaker's Gavel", proj: 'gavelwave' },
    super: { type: 'drop', name: 'Session Order', color: '#8a5a2b', obj: 'gavel', mult: 0.9 },
    quote: 'The chair recognises... nobody but me.', victory: 'point'
  },
  {
    id: 'chaimherzog', name: 'Chaim Herzog', short: 'C. HERZOG', title: 'The Ambassador', rarity: 'superrare',
    group: 'icon', years: 'President',
    bio: "Israel's sixth President. As UN ambassador in 1975 he famously tore up the 'Zionism is racism' resolution at the podium.",
    look: { height: 1.02, girth: 1.0, skin: '#ebbd9a', hair: 'fringe', hairColor: '#a8a49e', glasses: 'thin', glassesColor: '#2a2a2a', outfit: 'suit', top: '#23262e', pants: '#1f222a', shirt: '#f2f2f2', tie: '#2a4a7a', shoes: '#111111' },
    stats: { speed: 1, power: 0.96, defense: 1.04, jump: 1 },
    special: { type: 'projectile', name: 'Torn Resolution', proj: 'folder' },
    super: { type: 'beam', name: 'Podium Address', color: '#8fd0ff' },
    quote: 'I tear this up. And you with it.', victory: 'point'
  },
  {
    id: 'tamanoshata', name: 'Pnina Tamano-Shata', short: 'TAMANO-SHATA', title: 'The Trailblazer', rarity: 'superrare',
    group: 'icon', years: 'Minister & MK',
    bio: 'The first Ethiopian-born woman elected to the Knesset, and later Minister of Aliyah and Integration.',
    look: { height: 0.96, girth: 0.9, skin: '#7a4a2e', hair: 'bun', hairColor: '#141210', outfit: 'open', top: '#b8322e', pants: '#2a2230', shirt: '#f4f0f0', tie: null, shoes: '#111111' },
    stats: { speed: 1.1, power: 0.9, defense: 0.96, jump: 1.08 },
    special: { type: 'projectile', name: 'Aliyah Banner', proj: 'flag' },
    super: { type: 'wave', name: 'Homecoming Wave', color: '#ffd166' },
    quote: 'Welcome home. Now please leave.', victory: 'wave'
  },
  {
    id: 'sharansky', name: 'Natan Sharansky', short: 'SHARANSKY', title: 'The Grandmaster', rarity: 'elite',
    group: 'icon', years: 'Minister & MK',
    bio: 'Soviet refusenik who spent nine years in prison — playing chess in his head — before becoming an Israeli minister.',
    look: { height: 0.86, girth: 1.02, skin: '#ebbd9a', hair: 'bald', hairColor: '#7a6a5a', outfit: 'open', top: '#2f3442', pants: '#2a2e3b', shirt: '#f2f2f2', tie: null, shoes: '#1d1d1d' },
    stats: { speed: 1.06, power: 1.01, defense: 0.97, jump: 1 },
    special: { type: 'projectile', name: 'Knight Fork', proj: 'chess' },
    special2: { type: 'counter', name: 'Gambit' },
    super: { type: 'rain', name: 'Checkmate Rain', color: '#f2f2f2', obj: 'chess' },
    quote: 'I saw this coming nine moves ago.', victory: 'fist'
  },
  {
    id: 'barbivai', name: 'Orna Barbivai', short: 'BARBIVAI', title: 'The Major General', rarity: 'elite',
    group: 'icon', years: 'Minister & MK',
    bio: 'The first woman to reach the rank of Major General in the IDF, later a Knesset member and Economy Minister.',
    look: { height: 0.96, girth: 0.94, skin: '#e2ad86', hair: 'bob', hairColor: '#4a3020', outfit: 'shirt', top: '#6b6a45', pants: '#4e4a36', shirt: '#6b6a45', tie: null, shoes: '#2a2018' },
    stats: { speed: 1.1, power: 0.93, defense: 1.02, jump: 1.06 },
    special: { type: 'rush', name: "Major General's Charge" },
    special2: { type: 'rising', name: 'Command Leap', color: '#d9e86a' },
    super: { type: 'spin', name: 'Brigade Whirlwind', color: '#d9e86a' },
    quote: 'Orders received. Opponent dismissed.', victory: 'salute'
  },
  {
    id: 'trump', name: 'Donald Trump', short: 'TRUMP', title: 'The Special Guest', rarity: 'mythic',
    group: 'guest', years: 'Special Guest',
    bio: '45th and 47th President of the United States. Moved the US embassy to Jerusalem and brokered the Abraham Accords. Visiting the plenum as a special guest.',
    look: { height: 1.08, girth: 1.2, skin: '#f0b98a', hair: 'swoop', hairColor: '#e8c46a', outfit: 'suit', top: '#1c2640', pants: '#19223a', shirt: '#f6f6f6', tie: '#d42a2a', longTie: true, shoes: '#111111' },
    stats: { speed: 0.95, power: 1.02, defense: 1.08, jump: 0.92 },
    special: { type: 'projectile', name: 'Executive Order', proj: 'order' },
    special2: { type: 'counter', name: 'The Art of the Deal' },
    super: { type: 'rain', name: '$4 Billion to Israel', color: '#2e8b57', obj: 'moneybag' },
    passive: { id: 'momentum', name: 'Rally Energy' },
    quote: 'Tremendous win. Maybe the best win in the history of the Knesset.', victory: 'point'
  },
  {
    id: 'speaker', name: 'The Speaker', short: 'THE SPEAKER', title: 'Order Incarnate', rarity: 'mythic', price: 800,
    group: 'boss', years: 'Final Boss (fictional)',
    bio: 'The fictional keeper of order in the plenum. Final boss of the Election Campaign.',
    look: { height: 1.1, girth: 1.2, skin: '#d9a37c', hair: 'short', hairColor: '#55504a', beard: '#4a4540', glasses: 'thin', glassesColor: '#d4a017', outfit: 'suit', top: '#14161c', pants: '#121318', shirt: '#f2f2f2', tie: '#d4a017', shoes: '#0d0d0d', prop: 'gavel', propColor: '#6b3e1f' },
    stats: { speed: 1, power: 1.01, defense: 1.2, jump: 1 },
    special: { type: 'projectile', name: 'Order! Order!', proj: 'gavelwave' },
    special2: { type: 'rising', name: 'Gavel Uppercut', color: '#ffcf6a' },
    super: { type: 'drop', name: 'Session Adjourned', color: '#8a5a2b', obj: 'gavel' },
    passive: { id: 'regen', name: 'Filibuster' },
    quote: 'ORDER. This session is adjourned.', victory: 'point'
  }
];

(function () {
  var order = ['common', 'rare', 'superrare', 'epic', 'elite', 'mythic', 'legendary'];
  KC.ROSTER.forEach(function (c, i) { c._orig = i; });
  KC.ROSTER.sort(function (a, b) { return (order.indexOf(a.rarity) - order.indexOf(b.rarity)) || (a._orig - b._orig); });
})();
KC.STARTERS = ['sharett', 'allon', 'livni', 'gantz', 'navon'];   // free Common fighters every new player owns
KC.rosterById = {};
KC.ROSTER.forEach(function (c, i) { c.index = i; KC.rosterById[c.id] = c; });

/* Ability list a fighter actually has, based on rarity. */
KC.abilities = function (c) {
  var r = KC.RARITY[c.rarity], list = [{ slot: 'special', input: 'Special', name: c.special.name, type: c.special.type }];
  if (r.abilities >= 3 && c.special2) list.push({ slot: 'alt', input: 'Down + Special', name: c.special2.name, type: c.special2.type });
  if (r.abilities >= 2 && c.super) list.push({ slot: 'super', input: 'Super (full meter)', name: c.super.name, type: c.super.type });
  return list;
};
KC.hasSuper = function (c) { return KC.RARITY[c.rarity].abilities >= 2 && !!c.super; };
KC.hasAlt = function (c) { return KC.RARITY[c.rarity].abilities >= 3 && !!c.special2; };
KC.priceOf = function (c) { return c.starter ? 0 : (c.price || KC.RARITY[c.rarity].price); };

/* Gold "Election Night" alt skin — win 3 matches with a fighter, or buy it for coins. */
KC.ALT_SKIN = { top: '#c9a227', pants: '#3a2f12', shirt: '#fffbea', tie: '#111111', dress: '#c9a227', name: 'Election Night Gold' };
/* Used automatically for P2 in mirror matches. */
KC.MIRROR_SKIN = { top: '#7a1f2b', pants: '#4a141c', shirt: '#f4f4f4', tie: '#f2c14e', dress: '#7a1f2b', name: 'Opposition Red' };
KC.ALT_SKIN_WINS = 3;
KC.ALT_SKIN_PRICE = 150;

/* Coin payouts per match. */
KC.COINS = { session: 20, round: 15, win: 30, perfect: 20, superKO: 15, campaignStop: 20, campaignClear: 250,
  difficulty: { easy: 10, normal: 25, hard: 45, boss: 60 } };

/* ---------- Upgrades: every fighter can be ranked up 0 → 5 with coins ---------- */
KC.UPGRADE = {
  max: 5,
  power: 0.05, defense: 0.05, health: 50,           // per rank
  mult: { common: 1, rare: 1.5, superrare: 1.75, epic: 2, elite: 2.1, mythic: 2.25, legendary: 2.5 },
  cost: function (ch, toRank) { return Math.round(80 * toRank * KC.UPGRADE.mult[ch.rarity]); },
  describe: function (rank) {
    return rank ? '+' + Math.round(rank * KC.UPGRADE.power * 100) + '% damage · +' + Math.round(rank * KC.UPGRADE.defense * 100) + '% defense · +' + rank * KC.UPGRADE.health + ' HP · ' + Math.min(6, 3 + rank) + ' projectiles' : 'No upgrades yet · 3 projectiles';
  }
};

KC.MASTERY_TEXT = 'Chain any punch or kick into any other (4-hit strings), cancel specials and charges into your Super, and deal +15% damage from the 4th hit of a combo.';

KC.RARITY_ORDER = ['common', 'rare', 'superrare', 'epic', 'elite', 'mythic', 'legendary'];

/* ---------- Campaign: 100 levels vs CPU ---------- */
KC.LEVELS = 250;
KC.level = function (n) {
  // Opponent rarity: Common for 1-50, Rare 51-100, Super Rare 101-150, Epic 151-200, Mythic 201-250.
  // Every 10th level is a boss one rarity higher; every 50th is two rarities higher. Level 250 = Legendary.
  var ORDER = KC.RARITY_ORDER, boss = n % 10 === 0;
  var band = Math.min(4, Math.floor((n - 1) / 50));
  var tierIdx = Math.min(ORDER.indexOf('elite'), band + (n % 50 === 0 ? 2 : boss ? 1 : 0));   // bosses top out at Elite (no Mythics); level 250 is Netanyahu
  var pool = KC.ROSTER.filter(function (c) { return c.rarity === ORDER[tierIdx]; });
  var ch = n === KC.LEVELS ? KC.rosterById.netanyahu : pool[(n * 7 + Math.floor(n / 10) * 3) % pool.length];
  var ai = n <= 30 ? 'easy' : n <= 100 ? 'normal' : n <= 180 ? 'hard' : 'boss';
  if (boss && ai !== 'boss') ai = n <= 40 ? 'normal' : 'hard';
  return {
    n: n, ch: ch, ai: ai, boss: boss,
    rank: Math.min(KC.UPGRADE.max, Math.floor((n - 1) / 45) + (boss ? 1 : 0)),
    boost: 1 + (n - 1) * 0.0025,
    reward: 25 + n * 2 + (boss ? 100 : 0),
    chestTier: KC.chestBase(n),
    skill: Math.min(0.97, 0.30 + Math.pow((n - 1) / 249, 1.4) * 0.65 + (boss && n > 1 ? 0.04 : 0))   // 30% at level 1, gentle early curve, ~95% at 250
  };
};

/* ---------- Shards: collect fragments of a leader to recruit them ---------- */
KC.SHARDS = { common: 10, rare: 15, superrare: 17, epic: 20, elite: 22, mythic: 25, legendary: 30 };
KC.shardsNeeded = function (c) { return c.starter ? 0 : KC.SHARDS[c.rarity]; };
KC.shardPrice = function (c) { return Math.ceil(KC.priceOf(c) * 1.25 / KC.shardsNeeded(c)) * 15; };   // single shards are a premium shortcut
KC.SHARD_DUPE_COINS = 8;   // shards of fighters you already own turn into coins
KC.WILD_CHANCE = 0.01;     // 1% per chest: a Wild Shard that unlocks any locked fighter of its rarity

/* ---------- Ballot-box chests ---------- */
KC.CHESTS = [
  { id: 'wood',   name: 'Wooden Ballot Box',  color: '#a8743f', glow: '#ffcf8a', coins: [10, 25],   shards: [1, 2],   picks: 1, w: { common: 70, rare: 25, superrare: 12, epic: 5, elite: 4, mythic: 2, legendary: 0 } },
  { id: 'silver', name: 'Silver Ballot Box',  color: '#c9d2df', glow: '#ffffff', coins: [15, 35],   shards: [2, 3],   picks: 1, w: { common: 50, rare: 35, superrare: 19, epic: 12, elite: 8, mythic: 5, legendary: 3 } },
  { id: 'gold',   name: 'Golden Ballot Box',  color: '#f2c14e', glow: '#fff3b0', coins: [25, 50],   shards: [3, 5],   picks: 2, w: { common: 30, rare: 40, superrare: 25, epic: 22, elite: 16, mythic: 10, legendary: 8 } },
  { id: 'epic',   name: 'Epic Ballot Box',    color: '#b46cff', glow: '#e6ccff', coins: [40, 80],   shards: [5, 8],   picks: 2, w: { common: 10, rare: 35, superrare: 30, epic: 40, elite: 29, mythic: 18, legendary: 15 } },
  { id: 'mythic', name: 'Mythic Ballot Box',  color: '#ff4d6d', glow: '#ffc2cf', coins: [60, 120],  shards: [8, 12],  picks: 3, w: { common: 0, rare: 25, superrare: 28, epic: 45, elite: 35, mythic: 25, legendary: 30 } },
  { id: 'legend', name: 'Legendary Ballot Box', color: '#7ef0ff', glow: '#ffffff', coins: [100, 200], shards: [12, 20], picks: 3, w: { common: 0, rare: 10, superrare: 18, epic: 35, elite: 32, mythic: 30, legendary: 55 } }
];
/* base chest tier climbs every 50 levels; boss levels (every 10th) add +1 */
KC.chestBase = function (n) { return Math.min(3, Math.floor((n - 1) / 80) + (n % 10 === 0 ? 1 : 0)); };   // lower-tier chests: base rises every 80 levels, max Epic
KC.TAP_CHANCE = 0.3;     // every tap has a 30% chance to upgrade the chest one tier
KC.BASE_TAPS = 3;
KC.CAMPAIGN_CHEST_COINS = 2;   // campaign chests pay double coins        // every chest starts with 3 upgrade taps
KC.TAP_UPGRADE = [0.3, 0.3, 0.3];
/* Chest Store: buy chests with coins; lucky chests come with extra upgrade taps */
KC.CHEST_STORE = [
  { id: 'wood',    tier: 0, taps: 3, price: 150,  name: 'Wooden Ballot Box',        desc: '3 upgrade taps' },
  { id: 'silver',  tier: 1, taps: 3, price: 300,  name: 'Silver Ballot Box',        desc: '3 upgrade taps' },
  { id: 'luckys',  tier: 1, taps: 5, price: 450,  name: 'Lucky Silver Box',         desc: '5 upgrade taps' },
  { id: 'gold',    tier: 2, taps: 3, price: 550,  name: 'Golden Ballot Box',        desc: '3 upgrade taps' },
  { id: 'luckyg',  tier: 2, taps: 6, price: 850,  name: 'Super Lucky Golden Box',   desc: '6 upgrade taps' },
  { id: 'epic',    tier: 3, taps: 3, price: 1000, name: 'Epic Ballot Box',          desc: '3 upgrade taps' },
  { id: 'jackpot', tier: 3, taps: 8, price: 1600, name: 'Jackpot Epic Box',         desc: '8 upgrade taps' }
];
KC.chestItem = function (x) { return typeof x === 'number' ? { tier: x, taps: KC.BASE_TAPS } : x; };
