// ============================================================
// LINEAGE — Expanded & Rebalanced Event Pool + Background Events
// Stat deltas are tuned smaller (+3 to +9) and paired with diminishing
// returns + yearly drift in lifecycle.js so stats never cap out by age 20.
// ============================================================

export const LIFE_EVENTS = [
  // ==========================================================
  // BACKGROUND-SPECIFIC EVENTS (3 per Family Background)
  // ==========================================================

  // --- Fading Old-Money Family (gentry) ---
  {
    id: 'bg_gentry_etiquette',
    bgId: 'gentry',
    stages: ['Child'],
    minAge: 7, maxAge: 12,
    once: true,
    title: 'Candlelit Dinner Inspection',
    prompt: 'At Sunday dinner in the drafty dining hall, your grandmother taps her crystal glass and quizzes you on ancestral history and posture.',
    choices: [
      {
        label: 'Sit ramrod-straight and recite the family tree flawlessly',
        hint: '+Smarts, +Looks, -Happiness',
        effects: { smarts: 5, looks: 3, happiness: -4 },
        log: 'Passed Grandmother’s grueling Sunday etiquette test at the cost of a stiff neck.',
      },
      {
        label: 'Slouch on purpose and crack a joke at the butler',
        hint: '+Happiness, stern lecture',
        effects: { happiness: 6, smarts: -2 },
        log: 'Got banished from dessert for cracking jokes during formal family dinner.',
      },
    ],
  },
  {
    id: 'bg_gentry_silverware',
    bgId: 'gentry',
    stages: ['Teen'],
    minAge: 14, maxAge: 17,
    once: true,
    title: 'The Leaking West Wing Roof',
    prompt: 'Rain drips into buckets along the upstairs portrait gallery. Your parents quietly debate pawning the 19th-century monogrammed silver to pay the roofer.',
    choices: [
      {
        label: 'Help catalog and sell the silver discreetly out of town',
        hint: '+$750, -Happiness (wounded pride)',
        effects: { money: 750, smarts: 4, happiness: -4 },
        log: 'Quietly pawned heirloom silver so the manor roof wouldn’t cave in.',
      },
      {
        label: 'Climb onto the slate roof yourself with tar and shingles',
        hint: 'Scrappy DIY, tumble risk',
        risk: {
          chance: 0.55,
          pass: { effects: { health: 4, happiness: 5 }, log: 'Patched the manor’s slate roof yourself and saved the family silver.' },
          fail: { effects: { health: -9, happiness: -4 }, log: 'Slipped on wet manor slate trying to patch the roof yourself.' },
        },
      },
    ],
  },
  {
    id: 'bg_gentry_gala',
    bgId: 'gentry',
    stages: ['Adult'],
    minAge: 23, maxAge: 45,
    once: true,
    title: 'Founders’ Club Gala',
    prompt: 'An embossed invitation arrives for the annual Founders’ Gala. Attending requires a $1,500 table contribution to prove your branch of the family still belongs.',
    choices: [
      {
        label: 'Pay $1,500, wear tailored eveningwear, and work the room',
        hint: '-$1,500, career network boost',
        effects: { money: -1500, looks: 4, happiness: 3 },
        setFlag: 'gentry_network',
        log: 'Turned heads at the Founders’ Gala and rekindled lucrative old-money connections.',
      },
      {
        label: 'Toss the invite in the fire — you answer to nobody',
        hint: '+Happiness, walk your own path',
        effects: { happiness: 7 },
        log: 'Burned the Founders’ Gala invitation and shook off old-money expectations.',
      },
    ],
  },

  // --- Corner-Store Shopkeepers (shopkeepers) ---
  {
    id: 'bg_shop_register',
    bgId: 'shopkeepers',
    stages: ['Child'],
    minAge: 8, maxAge: 12,
    once: true,
    title: 'Behind the Wooden Counter',
    prompt: 'The afternoon delivery truck arrives late while your parents are unloading crates in the alley, leaving you minding the cash register.',
    choices: [
      {
        label: 'Ring up three impatient regulars and count exact change',
        hint: '+Smarts, +$20 tip jar',
        effects: { smarts: 5, money: 20, happiness: 3 },
        log: 'Ran the corner-store register solo during the afternoon rush without missing a dime.',
      },
      {
        label: 'Sneak two sodas and a comic book off the rack',
        hint: '+Happiness, minor scolding',
        effects: { happiness: 6, smarts: -2 },
        log: 'Raided the corner-store candy rack while nobody was watching.',
      },
    ],
  },
  {
    id: 'bg_shop_chain_threat',
    bgId: 'shopkeepers',
    stages: ['Teen'],
    minAge: 14, maxAge: 17,
    once: true,
    title: 'Supermarket Across the Street',
    prompt: 'A glossy 24-hour chain store opens two blocks away, cutting your family grocery’s foot traffic in half.',
    choices: [
      {
        label: 'Set up bicycle home-delivery for elderly neighbors',
        hint: '+$350, +Health, +Smarts',
        effects: { money: 350, health: 4, smarts: 4 },
        log: 'Started a neighborhood bike-delivery route that kept loyal customers coming back.',
      },
      {
        label: 'Paint bright window signs and hand out fresh coffee samples',
        hint: '+Happiness, +Looks',
        effects: { happiness: 5, looks: 3, money: 150 },
        log: 'Charmed foot traffic back into the family shop with hand-painted signs.',
      },
    ],
  },
  {
    id: 'bg_shop_keys',
    bgId: 'shopkeepers',
    stages: ['Adult'],
    minAge: 25, maxAge: 48,
    once: true,
    title: 'Keys to the Corner Store',
    prompt: 'Your parents’ knees ache from thirty years on linoleum floors. A developer offers to buy out the shop lease, unless you want a stake in modernizing it.',
    choices: [
      {
        label: 'Invest $2,500 to renovate the deli & keep it in the family',
        hint: '-$2,500 now, boosts yearly income',
        effects: { money: -2500, happiness: 6, smarts: 3 },
        setFlag: 'family_deli',
        log: 'Modernized the family corner store and kept the neon sign glowing.',
      },
      {
        label: 'Encourage them to take the buyout and retire comfortably',
        hint: '+$2,000 family gift, +Happiness',
        effects: { money: 2000, happiness: 5 },
        log: 'Celebrated your parents’ retirement as they sold the old corner store lease.',
      },
    ],
  },

  // --- Working-Class Mechanics (mechanics) ---
  {
    id: 'bg_mech_socket',
    bgId: 'mechanics',
    stages: ['Child'],
    minAge: 7, maxAge: 12,
    once: true,
    title: 'Holding the Flashlight',
    prompt: 'Saturday morning under the hood of a Chevy pickup: grease on your elbows and stern instructions not to let the flashlight beam wander.',
    choices: [
      {
        label: 'Hand over the exact 10mm socket before being asked',
        hint: '+Smarts, proud nod',
        effects: { smarts: 5, happiness: 4 },
        log: 'Learned carburetor basics and earned high praise holding the shop flashlight.',
      },
      {
        label: 'Build a soapbox go-kart out of scrap lawnmower wheels',
        hint: '+Happiness, scraped knuckles',
        effects: { happiness: 7, health: -2 },
        log: 'Cobbled together a rattling driveway go-kart from garage spare parts.',
      },
    ],
  },
  {
    id: 'bg_mech_flip',
    bgId: 'mechanics',
    stages: ['Teen'],
    minAge: 15, maxAge: 17,
    once: true,
    title: 'Salvage Yard Coupe',
    prompt: 'A seized-up sports coupe sits in the back lot of your family’s garage. With enough weekend elbow grease, it might actually turn over.',
    choices: [
      {
        label: 'Rebuild the head gasket and flip it for cash',
        hint: '+$900, +Smarts, -Happiness (exhausting)',
        effects: { money: 900, smarts: 5, happiness: -3 },
        log: 'Rebuilt a junkyard coupe from scratch and flipped it for $900 profit.',
      },
      {
        label: 'Spray-paint racing stripes and cruise Main Street',
        hint: '+Happiness, +Looks',
        effects: { happiness: 7, looks: 4 },
        log: 'Got the salvage coupe roaring and cruised Main Street with the windows down.',
      },
    ],
  },
  {
    id: 'bg_mech_union',
    bgId: 'mechanics',
    stages: ['Adult'],
    minAge: 22, maxAge: 44,
    once: true,
    title: 'Shop Floor Solidarity',
    prompt: 'Times get lean at the local repair bay when suppliers hike parts prices overnight.',
    choices: [
      {
        label: 'Pitch in $1,000 to help buy diagnostic gear for the family bay',
        hint: '-$1,000, steady shop dividend',
        effects: { money: -1000, happiness: 6 },
        setFlag: 'shop_dividend',
        log: 'Backed the family garage upgrade and earned a modest yearly cut.',
      },
      {
        label: 'Spend weekends moonlighting tune-ups for extra cash',
        hint: '+$1,400, -Health',
        effects: { money: 1400, health: -4 },
        log: 'Turned wrenches on weekends to pad your bank account.',
      },
    ],
  },

  // --- Wandering Musicians (artists) ---
  {
    id: 'bg_art_van',
    bgId: 'artists',
    stages: ['Child'],
    minAge: 6, maxAge: 11,
    once: true,
    title: 'Asleep on Guitar Cases',
    prompt: 'The tour van breaks down outside a desert diner at midnight after a festival set.',
    choices: [
      {
        label: 'Busk on the diner porch with a tambourine for pie money',
        hint: '+Happiness, +Looks, +$35',
        effects: { happiness: 6, looks: 3, money: 35 },
        log: 'Charmed stranded truckers at a midnight diner with a tambourine.',
      },
      {
        label: 'Curl up with a flashlight and finish your school workbook',
        hint: '+Smarts',
        effects: { smarts: 6, happiness: 2 },
        log: 'Taught yourself multiplication tables in the back of a broken-down tour van.',
      },
    ],
  },
  {
    id: 'bg_art_open_mic',
    bgId: 'artists',
    stages: ['Teen'],
    minAge: 14, maxAge: 17,
    once: true,
    title: 'Friday Night Open Mic',
    prompt: 'Your folks nudge you toward the stage at a crowded coffeehouse with an acoustic guitar in hand.',
    choices: [
      {
        label: 'Play an original song you wrote in your notebook',
        hint: 'Stage risk: standing ovation or voice crack',
        risk: {
          chance: 0.6,
          pass: { effects: { happiness: 8, looks: 4, money: 80 }, log: 'Brought the coffeehouse to dead silence with an original song.' },
          fail: { effects: { happiness: -5, smarts: 3 }, log: 'Forgot the second verse onstage, bowed anyway, and learned resilience.' },
        },
      },
      {
        label: 'Run the mixing board and stage lights from the booth',
        hint: '+Smarts, +$60',
        effects: { smarts: 5, money: 60 },
        log: 'Discovered a knack for audio engineering running the coffeehouse soundboard.',
      },
    ],
  },
  {
    id: 'bg_art_royalties',
    bgId: 'artists',
    stages: ['Adult'],
    minAge: 23, maxAge: 46,
    once: true,
    title: 'Forgotten Vinyl Pressing',
    prompt: 'An indie movie director wants to license an obscure cassette your family recorded twenty years ago.',
    choices: [
      {
        label: 'Negotiate a clean royalty split instead of a flat buyout',
        hint: '+Smarts, recurring royalty perk',
        effects: { money: 800, smarts: 4, happiness: 5 },
        setFlag: 'indie_royalties',
        log: 'Negotiated soundtrack royalties on an old family recording.',
      },
      {
        label: 'Take the $2,600 lump-sum check right now',
        hint: '+$2,600 cash',
        effects: { money: 2600, happiness: 4 },
        log: 'Cashed a $2,600 sync check when an indie film used an old family track.',
      },
    ],
  },

  // --- Public-School Teachers (teachers) ---
  {
    id: 'bg_teach_red_pen',
    bgId: 'teachers',
    stages: ['Child'],
    minAge: 7, maxAge: 12,
    once: true,
    title: 'Stacks of Essay Folders',
    prompt: 'Your kitchen table disappears under ungraded history quizzes every Sunday evening.',
    choices: [
      {
        label: 'Help sort papers and quiz yourself on state capitals',
        hint: '+Smarts',
        effects: { smarts: 6, happiness: 2 },
        log: 'Absorbed trivia two grades ahead while helping sort Sunday quiz folders.',
      },
      {
        label: 'Beg everyone to put the red pens down and go sledding',
        hint: '+Happiness, +Health',
        effects: { happiness: 6, health: 3 },
        log: 'Rescued Sunday afternoon from grading piles with a family trip to the park.',
      },
    ],
  },
  {
    id: 'bg_teach_parent_teacher',
    bgId: 'teachers',
    stages: ['Teen'],
    minAge: 13, maxAge: 17,
    once: true,
    title: 'Everyone Knows Your Last Name',
    prompt: 'Having teachers for parents means every instructor in the district already expects straight A’s from you.',
    choices: [
      {
        label: 'Join the debate team and lean into academic glory',
        hint: '+Smarts, slight stress',
        effects: { smarts: 7, happiness: -2 },
        log: 'Won regional trophies on the debate squad under watchful faculty eyes.',
      },
      {
        label: 'Dye a streak in your hair and start a garage zine',
        hint: '+Happiness, +Looks',
        effects: { happiness: 6, looks: 3 },
        log: 'Carved out your own identity at school beyond the faculty lounge.',
      },
    ],
  },
  {
    id: 'bg_teach_scholarship_fund',
    bgId: 'teachers',
    stages: ['Adult'],
    minAge: 24, maxAge: 48,
    once: true,
    title: 'Classroom Book Drive',
    prompt: 'Your parents’ old school library faces budget cuts and asks alumni families for help.',
    choices: [
      {
        label: 'Donate $600 and speak at career day',
        hint: '-$600, +Happiness, +Smarts',
        effects: { money: -600, happiness: 7, smarts: 3 },
        log: 'Sponsored new library shelves at your hometown school.',
      },
      {
        label: 'Volunteer a Saturday boxing up donated paperbacks',
        hint: '+Happiness, free',
        effects: { happiness: 4, health: 2 },
        log: 'Spent a crisp Saturday organizing community book donations.',
      },
    ],
  },

  // ==========================================================
  // GENERAL EVENTS — BABY (Ages 1 - 4)
  // ==========================================================
  {
    id: 'baby_first_steps',
    stages: ['Baby'],
    minAge: 1, maxAge: 2,
    once: true,
    title: 'Wobbly First Steps',
    prompt: 'Everyone gathers in the living room holding their breath as you let go of the coffee table.',
    choices: [
      {
        label: 'Toddle boldly toward the family dog',
        hint: '+Happiness, +Health',
        effects: { happiness: 5, health: 2 },
        log: 'Took your first fearless steps straight into the family dog.',
      },
      {
        label: 'Sit right back down and inspect a wooden block',
        hint: '+Smarts',
        effects: { smarts: 4, happiness: 2 },
        log: 'Refused to rush walking; studied wooden blocks instead.',
      },
    ],
  },
  {
    id: 'baby_fevers',
    stages: ['Baby'],
    minAge: 1, maxAge: 4,
    title: 'Midnight Fever',
    prompt: 'A stubborn winter fever keeps you burning up through the night while rain lashes the windows.',
    choices: [
      {
        label: 'Swallow the bitter medicine without a fuss',
        hint: '+Health, -Happiness',
        effects: { health: 4, happiness: -4 },
        log: 'Swallowed bitter cough syrup and shook off a childhood fever.',
      },
      {
        label: 'Spit it out and wail until dawn',
        hint: '-Health',
        effects: { health: -7, happiness: -2 },
        log: 'Fought off medicine during a rough winter fever.',
      },
    ],
  },
  {
    id: 'baby_preschool_paint',
    stages: ['Baby'],
    minAge: 2, maxAge: 4,
    title: 'Fingerpaint Masterpiece',
    prompt: 'Left unsupervised for ninety seconds with tubs of red and blue fingerpaint.',
    choices: [
      {
        label: 'Paint a giant mural across the hallway wall',
        hint: '+Happiness',
        effects: { happiness: 6, smarts: 2 },
        log: 'Redecorated the hallway in bright fingerpaint.',
      },
      {
        label: 'Carefully paint inside the paper lines',
        hint: '+Smarts',
        effects: { smarts: 5, happiness: 1 },
        log: 'Earned an early gold star for remarkably neat fingerpainting.',
      },
      {
        label: 'Taste-test the blue paint',
        hint: '-Health, +Happiness',
        effects: { health: -4, happiness: 4 },
        log: 'Discovered firsthand why blue fingerpaint is labeled non-toxic.',
      },
    ],
  },
  {
    id: 'baby_daycare_toy',
    stages: ['Baby'],
    minAge: 2, maxAge: 4,
    title: 'The Red Firetruck Dispute',
    prompt: 'Another toddler at playgroup grabs the shiny red firetruck right out of your hands.',
    choices: [
      {
        label: 'Trade them a plush dinosaur so everybody wins',
        hint: '+Smarts, +Happiness',
        effects: { smarts: 4, happiness: 4 },
        log: 'Brokered your very first playground peace treaty at playgroup.',
      },
      {
        label: 'Tug it straight back with both hands',
        hint: 'Scrappy tug-of-war',
        effects: { health: 3, happiness: -2 },
        log: 'Held onto the playgroup firetruck in a fierce toddler tug-of-war.',
      },
    ],
  },
  {
    id: 'baby_thunderstorm',
    stages: ['Baby'],
    minAge: 1, maxAge: 4,
    title: 'Summer Thunderclap',
    prompt: 'Lightning flashes across your bedroom ceiling and shakes the windowpanes.',
    choices: [
      {
        label: 'Press your nose to the glass to watch the storm',
        hint: '+Smarts, +Happiness',
        effects: { smarts: 3, happiness: 4 },
        log: 'Watched summer lightning fearless from the nursery window.',
      },
      {
        label: 'Burrow under blankets until someone sings a lullaby',
        hint: '+Health, cozy rest',
        effects: { health: 3, happiness: 2 },
        log: 'Slept safe and warm through a booming midnight thunderstorm.',
      },
    ],
  },

  // ==========================================================
  // GENERAL EVENTS — CHILD (Ages 5 - 12)
  // ==========================================================
  {
    id: 'child_bike_hill',
    stages: ['Child'],
    minAge: 6, maxAge: 11,
    title: 'Dead Man’s Hill',
    prompt: 'The older neighborhood kids dare you to ride your bike down the steepest gravel hill with no brakes.',
    choices: [
      {
        label: 'Send it full speed with no hands',
        hint: 'Risk: legend status or broken arm',
        risk: {
          chance: 0.45,
          pass: { effects: { happiness: 9, looks: 2 }, log: 'Flew down Dead Man’s Hill and became a neighborhood legend.' },
          fail: { effects: { health: -13, happiness: -5 }, log: 'Broke your arm wiping out on loose gravel down Dead Man’s Hill.' },
        },
      },
      {
        label: 'Feather the brakes and steer carefully',
        hint: '+Smarts, +Happiness',
        effects: { smarts: 4, happiness: 3 },
        log: 'Made it down the steep gravel hill in one piece.',
      },
      {
        label: 'Walk your bike back home',
        hint: '+Health, slight teasing',
        effects: { happiness: -3, health: 3 },
        log: 'Turned down a reckless bike dare and kept all your bones intact.',
      },
    ],
  },
  {
    id: 'child_stray_wallet',
    stages: ['Child'],
    minAge: 7, maxAge: 12,
    once: true,
    title: 'Wallet on the Sidewalk',
    prompt: 'Walking home from school, you spot a leather wallet wedged beside a mailbox with $60 peeking out.',
    choices: [
      {
        label: 'Return it to the address on the license',
        hint: '+Happiness, +$15 reward',
        effects: { happiness: 6, money: 15 },
        setFlag: 'honest_youth',
        log: 'Returned a lost wallet; the grateful neighbor handed you $15.',
      },
      {
        label: 'Pocket the cash and ditch the wallet',
        hint: '+$60, -Happiness guilt',
        effects: { money: 60, happiness: -5 },
        setFlag: 'sticky_fingers',
        log: 'Kept $60 from a lost wallet on the walk home.',
      },
    ],
  },
  {
    id: 'child_science_fair',
    stages: ['Child'],
    minAge: 8, maxAge: 12,
    title: 'School Science Fair',
    prompt: 'Science fair projects are due tomorrow morning, and your desk is still empty.',
    choices: [
      {
        label: 'Stay up late wiring a homemade potato clock',
        hint: '+Smarts, -Health',
        effects: { smarts: 7, health: -3, happiness: 2 },
        log: 'Pulled a late night building a potato clock that won second ribbon.',
      },
      {
        label: 'Throw baking soda into a paper volcano',
        hint: 'Balanced',
        effects: { smarts: 3, happiness: 3 },
        log: 'Built a classic baking-soda volcano just before the bell.',
      },
      {
        label: 'Fake a stomachache to skip school',
        hint: '-Smarts, +Happiness',
        effects: { smarts: -4, happiness: 5 },
        log: 'Dodged the science fair with a convincing theatrical cough.',
      },
    ],
  },
  {
    id: 'child_schoolyard_bully',
    stages: ['Child'],
    minAge: 6, maxAge: 12,
    title: 'Recess Shakedown',
    prompt: 'A taller sixth-grader blocks the swings and demands your lunch money.',
    choices: [
      {
        label: 'Stand your ground and swing back',
        hint: '-Health, +Happiness',
        effects: { health: -6, happiness: 6 },
        log: 'Got a scraped lip standing up to a bully, who never bothered you again.',
      },
      {
        label: 'Defuse it with a sharp joke',
        hint: '+Smarts, +Happiness',
        effects: { smarts: 4, happiness: 4 },
        log: 'Made the whole playground laugh until the bully backed off.',
      },
      {
        label: 'Hand over the $5 and walk away',
        hint: '-$5, -Happiness',
        effects: { money: -5, happiness: -6 },
        log: 'Lost lunch money to a playground shakedown.',
      },
    ],
  },
  {
    id: 'child_spelling_bee',
    stages: ['Child'],
    minAge: 8, maxAge: 12,
    title: 'Auditorium Spelling Bee',
    prompt: 'Under hot stage lights, the microphone squeaks as the judge asks you to spell "chrysanthemum."',
    choices: [
      {
        label: 'Trace the letters on your palm and sound it out slowly',
        hint: 'Test your focus',
        risk: {
          chance: 0.55,
          pass: { effects: { smarts: 6, happiness: 5 }, log: 'Nailed your word at the school spelling bee to loud applause.' },
          fail: { effects: { smarts: 2, happiness: -4 }, log: 'Tripped over a silent letter under the auditorium lights.' },
        },
      },
      {
        label: 'Deliberately misspell it in a funny way to get offstage fast',
        hint: '+Happiness, -Smarts',
        effects: { happiness: 4, smarts: -2 },
        log: 'Bowed out of the spelling bee early with a crowd-pleasing joke.',
      },
    ],
  },
  {
    id: 'child_treehouse',
    stages: ['Child'],
    minAge: 6, maxAge: 11,
    title: 'Scrap-Wood Treehouse',
    prompt: 'You and the kids down the block haul weathered fence boards up into an old oak tree.',
    choices: [
      {
        label: 'Measure twice and nail sturdy crossbeams',
        hint: '+Smarts, +Health',
        effects: { smarts: 4, health: 3, happiness: 3 },
        log: 'Built a surprisingly solid backyard treehouse that lasted all summer.',
      },
      {
        label: 'Rig a zip-line out of clothesline rope',
        hint: 'Thrilling or painful',
        risk: {
          chance: 0.48,
          pass: { effects: { happiness: 8, health: 2 }, log: 'Soared across the yard on a homemade treehouse zip-line.' },
          fail: { effects: { health: -8, happiness: -3 }, log: 'Snapped the clothesline zip-line and landed flat in the bushes.' },
        },
      },
    ],
  },
  {
    id: 'child_dentist_braces',
    stages: ['Child'],
    minAge: 9, maxAge: 12,
    once: true,
    title: 'Orthodontist Verdict',
    prompt: 'The dentist squints at your X-rays and recommends two years of metal braces.',
    choices: [
      {
        label: 'Endure the wires and rubber bands diligently',
        hint: '+Looks long-term, -Happiness now',
        effects: { looks: 7, happiness: -4 },
        log: 'Put up with sore gums and metal braces for a noticeably straighter smile.',
      },
      {
        label: 'Chew caramel anyway and "lose" your retainer',
        hint: '+Happiness now, -Looks',
        effects: { happiness: 4, looks: -3 },
        log: 'Sabotaged your orthodontic treatment with contraband taffy.',
      },
    ],
  },

  // ==========================================================
  // GENERAL EVENTS — TEEN (Ages 13 - 17)
  // ==========================================================
  {
    id: 'teen_summer_job',
    stages: ['Teen'],
    minAge: 14, maxAge: 17,
    title: 'Summer Boardwalk Shifts',
    prompt: 'July heat rolls in. The boardwalk ice-cream stand is hiring part-time scoopers.',
    choices: [
      {
        label: 'Work double shifts all summer',
        hint: '+$650, -Happiness',
        effects: { money: 650, happiness: -4, smarts: 2 },
        setFlag: 'work_ethic',
        log: 'Worked all summer scooping ice cream and saved $650.',
      },
      {
        label: 'Spend the summer swimming at the lake with friends',
        hint: '+Happiness, +Health',
        effects: { happiness: 7, health: 4, looks: 2 },
        log: 'Spent a sun-soaked summer by the lake with friends.',
      },
      {
        label: 'Enroll in a coding & electronics workshop',
        hint: '-$120, +Smarts',
        effects: { money: -120, smarts: 8 },
        setFlag: 'tech_knack',
        log: 'Learned programming basics at a summer workshop.',
      },
    ],
  },
  {
    id: 'teen_final_exams',
    stages: ['Teen'],
    minAge: 15, maxAge: 17,
    title: 'Make-or-Break Finals',
    prompt: 'High school finals week arrives alongside an invite to the biggest bonfire party of the year.',
    choices: [
      {
        label: 'Lock in and study all weekend',
        hint: '+Smarts, -Happiness',
        effects: { smarts: 7, happiness: -4 },
        setFlag: 'honor_roll',
        log: 'Aced high school finals and made the honor roll.',
      },
      {
        label: 'Hit the bonfire and wing Monday’s exam',
        hint: '+Happiness, grade gamble',
        risk: {
          chance: 0.4,
          pass: { effects: { happiness: 8, smarts: 2 }, log: 'Partied at the bonfire and still scraped out a solid grade.' },
          fail: { effects: { happiness: 5, smarts: -7 }, log: 'Had a great night at the bonfire, then bombed Monday’s exam.' },
        },
      },
    ],
  },
  {
    id: 'teen_clunker_car',
    stages: ['Teen'],
    minAge: 16, maxAge: 17,
    once: true,
    title: 'The $500 Hatchback',
    prompt: 'A neighbor offers to sell you a rusted 20-year-old hatchback that rattles like a tin can.',
    choices: [
      {
        label: 'Buy it and learn to fix the engine yourself',
        hint: '-$500, +Smarts, +Happiness',
        effects: { money: -500, smarts: 5, happiness: 6 },
        log: 'Bought a $500 rusted hatchback and nursed it back to life.',
      },
      {
        label: 'Pass and keep your savings intact',
        hint: 'Keep cash',
        effects: { smarts: 2 },
        log: 'Turned down a questionable $500 clunker.',
      },
    ],
  },
  {
    id: 'teen_track_tryouts',
    stages: ['Teen'],
    minAge: 13, maxAge: 16,
    title: 'After-School Sweat',
    prompt: 'The varsity track coach posts sign-up sheets next to the theater club audition board.',
    choices: [
      {
        label: 'Run laps every afternoon with the track team',
        hint: '+Health, +Looks',
        effects: { health: 7, looks: 3, happiness: 2 },
        log: 'Built serious stamina running afternoon track meets.',
      },
      {
        label: 'Audition for the fall school play',
        hint: '+Happiness, +Looks',
        effects: { happiness: 6, looks: 3, smarts: 2 },
        log: 'Landed a supporting role in the school play and loved the spotlight.',
      },
      {
        label: 'Head straight home to nap and play video games',
        hint: '+Happiness, -Health',
        effects: { happiness: 4, health: -3 },
        log: 'Skipped extracurriculars in favor of couch afternoons.',
      },
    ],
  },
  {
    id: 'teen_prom_ask',
    stages: ['Teen'],
    minAge: 16, maxAge: 17,
    once: true,
    title: 'Spring Formal Nerves',
    prompt: 'Lockers slam down the hallway as everyone pairs up for the spring formal. Your crush is standing alone by the water fountain.',
    choices: [
      {
        label: 'Walk right over and ask them to the dance',
        hint: 'Bold move (-$90 outfit/tickets)',
        risk: {
          chance: 0.6,
          pass: { effects: { happiness: 9, looks: 3, money: -90 }, log: 'Asked your crush to the spring formal and danced until midnight.' },
          fail: { effects: { happiness: -6 }, log: 'Got gently turned down for the spring formal, but respected yourself for asking.' },
        },
      },
      {
        label: 'Go stag with a rowdy group of friends instead',
        hint: '-$40, steady fun',
        effects: { happiness: 5, money: -40 },
        log: 'Hit the spring formal with friends and raided the dessert table.',
      },
    ],
  },

  // ==========================================================
  // GENERAL EVENTS — ADULT (Ages 18 - 64)
  // ==========================================================
  {
    id: 'adult_crossroads_18',
    stages: ['Adult'],
    minAge: 18, maxAge: 19,
    once: true,
    title: 'Out Into the World',
    prompt: 'At eighteen, boxes are packed by the front door. What path do you set out on first?',
    choices: [
      {
        label: 'Take out loans for university',
        hint: '-$4,500, +Smarts, higher future pay',
        effects: { money: -4500, smarts: 9, happiness: 2 },
        setFlag: 'degree',
        log: 'Enrolled in university, betting on higher earnings down the road.',
      },
      {
        label: 'Apprentice in a skilled trade right away',
        hint: '+$2,200, +Health, steady pay',
        effects: { money: 2200, smarts: 4, health: 3 },
        setFlag: 'trade_cert',
        log: 'Started a paid trade apprenticeship right out of school.',
      },
      {
        label: 'Pack a bag and work odd jobs across the country',
        hint: '+Happiness, +Looks, lean wallet',
        effects: { money: 400, happiness: 9, looks: 3 },
        log: 'Hit the open road working odd jobs from town to town.',
      },
    ],
  },
  {
    id: 'adult_first_apartment',
    stages: ['Adult'],
    minAge: 19, maxAge: 25,
    once: true,
    title: 'First Lease & Terrible Roommates',
    prompt: 'Your first cheap apartment comes with peeling wallpaper and a roommate who leaves towers of unwashed pans in the sink.',
    choices: [
      {
        label: 'Pay extra to rent a tiny studio all to yourself',
        hint: '-$1,400, +Happiness',
        effects: { money: -1400, happiness: 7, smarts: 2 },
        log: 'Paid extra for a tiny solo studio and glorious peace and quiet.',
      },
      {
        label: 'Lay down a strict chore chart and split the cheap rent',
        hint: '+$800 saved, -Happiness',
        effects: { money: 800, happiness: -3 },
        log: 'Survived chaotic roommates to bank $800 in saved rent.',
      },
    ],
  },
  {
    id: 'adult_startup_pitch',
    stages: ['Adult'],
    minAge: 22, maxAge: 48,
    title: 'Garage Venture',
    prompt: 'An old friend pitches a scrappy local business idea and asks if you want in for $3,000.',
    choices: [
      {
        label: 'Invest $3,000 and grind nights & weekends',
        hint: 'High risk, big payout potential',
        risk: {
          chance: 0.46,
          pass: { effects: { money: 14500, happiness: 9, smarts: 4 }, setFlag: 'business_founder', log: 'Your garage venture took off, netting a $14,500 windfall!' },
          fail: { effects: { money: -3000, happiness: -8, health: -4 }, log: 'Sank $3,000 and sleepless months into a venture that folded.' },
        },
      },
      {
        label: 'Wish them luck and keep your nest egg safe',
        hint: 'No financial risk',
        effects: { happiness: 2 },
        log: 'Passed on a risky startup pitch.',
      },
    ],
  },
  {
    id: 'adult_romance_spark',
    stages: ['Adult'],
    minAge: 21, maxAge: 44,
    notFlag: 'has_partner',
    title: 'Coffee Shop Regular',
    prompt: 'Someone sharp, funny, and unmistakably into you keeps lingering at your table during rainy afternoons.',
    choices: [
      {
        label: 'Ask them out to dinner and lean in',
        hint: 'Start a serious relationship (-$140)',
        effects: { happiness: 9, money: -140 },
        setFlag: 'has_partner',
        log: 'Fell into a warm, serious romance.',
      },
      {
        label: 'Keep things casual and focus on your own goals',
        hint: '+Smarts, solo freedom',
        effects: { happiness: 2, smarts: 3 },
        log: 'Kept romance casual to stay focused on personal ambitions.',
      },
    ],
  },
  {
    id: 'adult_new_child',
    stages: ['Adult'],
    minAge: 24, maxAge: 45,
    reqFlag: 'has_partner',
    title: 'Growing the Family Tree',
    prompt: 'Late at night, you and your partner talk seriously about welcoming a child into the family.',
    choices: [
      {
        label: 'Welcome a child into the world',
        hint: 'Adds an Heir for next generation (-$2,500)',
        effects: { money: -2500, happiness: 10, health: -3 },
        addChild: true,
        log: 'Welcomed a new child into the family!',
      },
      {
        label: 'Hold off for now and pad your savings',
        hint: '+$1,100 saved',
        effects: { money: 1100, happiness: 1 },
        log: 'Decided to wait on kids and build up savings first.',
      },
    ],
  },
  {
    id: 'adult_burnout',
    stages: ['Adult'],
    minAge: 25, maxAge: 60,
    title: 'Long Hours & Chest Tightness',
    prompt: 'Months of relentless overtime have padded your paycheck, but your eye twitches whenever your phone buzzes.',
    choices: [
      {
        label: 'Push through for the year-end bonus',
        hint: '+$4,800, --Health, -Happiness',
        effects: { money: 4800, health: -11, happiness: -8 },
        log: 'Earned a $4,800 bonus at the cost of serious burnout.',
      },
      {
        label: 'Take a two-week coastal sabbatical',
        hint: '-$1,200, +Health, +Happiness',
        effects: { money: -1200, health: 8, happiness: 8 },
        log: 'Stepped back from burnout with a restorative trip to the coast.',
      },
      {
        label: 'Set strict 5 PM boundaries at work',
        hint: '+Health, +Happiness',
        effects: { health: 4, happiness: 4 },
        log: 'Started leaving work on time and sleeping eight hours again.',
      },
    ],
  },
  {
    id: 'adult_housing_fork',
    stages: ['Adult'],
    minAge: 26, maxAge: 58,
    notFlag: 'homeowner',
    title: 'The Fixer-Upper on Elm Street',
    prompt: 'A sunlit cottage with a sagging porch hits the market below asking price. Down payment and repairs run $8,000.',
    choices: [
      {
        label: 'Put down $8,000 and make it the family home',
        hint: '-$8,000 now, boosts yearly stability & inheritance',
        effects: { money: -8000, happiness: 8 },
        setFlag: 'homeowner',
        log: 'Bought the fixer-upper on Elm Street — a true family home.',
      },
      {
        label: 'Keep renting and stay liquid',
        hint: '+$400 interest',
        effects: { money: 400 },
        log: 'Passed on buying the Elm Street house to keep cash liquid.',
      },
    ],
  },
  {
    id: 'adult_fitness_kick',
    stages: ['Adult'],
    minAge: 23, maxAge: 62,
    title: 'Stiff Back Wake-Up Call',
    prompt: 'Climbing three flights of stairs leaves you winded enough to rethink your daily habits.',
    choices: [
      {
        label: 'Join a local rowing & lap-swim club ($450)',
        hint: '-$450, +Health, +Looks',
        effects: { money: -450, health: 8, looks: 4, happiness: 3 },
        log: 'Got into peak shape swimming laps three mornings a week.',
      },
      {
        label: 'Commit to free evening jogs around the park',
        hint: '+Health',
        effects: { health: 5, happiness: 2 },
        log: 'Made evening park jogs a steady habit.',
      },
      {
        label: 'Buy a softer ergonomic chair and ignore it',
        hint: '-$200, -Health',
        effects: { money: -200, health: -4, happiness: 2 },
        log: 'Solved getting winded on stairs by taking the elevator more often.',
      },
    ],
  },
  {
    id: 'adult_market_dip',
    stages: ['Adult'],
    minAge: 24, maxAge: 63,
    title: 'Jittery Headlines',
    prompt: 'Financial news anchors warn of a sharp market correction while index funds trade at a steep discount.',
    choices: [
      {
        label: 'Put $2,500 into broad index funds while prices are down',
        hint: 'Market gamble',
        risk: {
          chance: 0.62,
          pass: { effects: { money: 5200, smarts: 3, happiness: 4 }, log: 'Bought the market dip and rode the rebound for +$5,200.' },
          fail: { effects: { money: -2500, happiness: -5 }, log: 'Caught a falling knife in the market and lost $2,500.' },
        },
      },
      {
        label: 'Park your savings in a boring high-yield CD',
        hint: '+$450 guaranteed',
        effects: { money: 450, happiness: 1 },
        log: 'Collected a safe $450 yield while markets swung wildly.',
      },
    ],
  },
  {
    id: 'adult_night_classes',
    stages: ['Adult'],
    minAge: 22, maxAge: 55,
    title: 'Evening Seminar Series',
    prompt: 'A community institute offers a demanding twelve-week evening certificate in management and negotiation.',
    choices: [
      {
        label: 'Enroll for $800 and sharpen your edge',
        hint: '-$800, +Smarts',
        effects: { money: -800, smarts: 6, happiness: 2 },
        log: 'Completed an intensive night seminar in negotiation.',
      },
      {
        label: 'Keep your evenings free for home-cooked dinners',
        hint: '+Happiness, +Health',
        effects: { happiness: 4, health: 2 },
        log: 'Protected your free evenings and perfected three new recipes.',
      },
    ],
  },
  {
    id: 'adult_dentist_crown',
    stages: ['Adult'],
    minAge: 28, maxAge: 64,
    title: 'Cracked Molar',
    prompt: 'Halfway through a toasted bagel, a sharp crack echoes in your jaw.',
    choices: [
      {
        label: 'Pay $1,100 for a proper porcelain crown immediately',
        hint: '-$1,100, protects Health & Looks',
        effects: { money: -1100, health: 3, looks: 2 },
        log: 'Bit the bullet on a $1,100 dental crown before it got infected.',
      },
      {
        label: 'Chew on the other side and hope it settles down',
        hint: '-Health, -Happiness',
        effects: { health: -8, happiness: -6, looks: -2 },
        log: 'Ignored a cracked molar until throbbing toothaches ruined your sleep.',
      },
    ],
  },
  {
    id: 'adult_partner_trip',
    stages: ['Adult'],
    minAge: 25, maxAge: 62,
    reqFlag: 'has_partner',
    title: 'Anniversary Getaway',
    prompt: 'Routine has crept into your household. Your partner suggests booking a cabin in the mountains.',
    choices: [
      {
        label: 'Splurge $1,300 on a cedar cabin with hot springs',
        hint: '-$1,300, +Happiness, +Health',
        effects: { money: -1300, happiness: 9, health: 3 },
        log: 'Reconnected over a misty mountain cabin getaway.',
      },
      {
        label: 'Pitch a tent at the state park for $60 instead',
        hint: '-$60, cozy adventure',
        effects: { money: -60, happiness: 6, health: 2 },
        log: 'Celebrated your anniversary roasting marshmallows under the stars.',
      },
    ],
  },
  {
    id: 'adult_jury_duty',
    stages: ['Adult'],
    minAge: 21, maxAge: 63,
    title: 'Courthouse Summons',
    prompt: 'A thick envelope summons you to downtown jury selection on a complex civil fraud trial.',
    choices: [
      {
        label: 'Serve attentively and debate the evidence in deliberations',
        hint: '+Smarts, modest stipend',
        effects: { smarts: 5, money: 150, happiness: 2 },
        log: 'Served on a two-week civil jury and found deliberations fascinating.',
      },
      {
        label: 'Plead severe work hardship to get excused',
        hint: '+$600 work week saved, -Happiness',
        effects: { money: 600, happiness: -2 },
        log: 'Talked your way out of jury duty so you wouldn’t miss work.',
      },
    ],
  },
  {
    id: 'adult_ancestor_echo',
    stages: ['Adult'],
    minAge: 22, maxAge: 55,
    reqGeneration: 2,
    once: true,
    title: 'Echoes of an Ancestor',
    prompt: 'Sorting through an old cedar trunk in the attic, you uncover journals and tools left behind by an earlier generation of your family.',
    choices: [
      {
        label: 'Restore their keepsakes and carry on their craft',
        hint: '+Happiness, +Smarts',
        effects: { happiness: 8, smarts: 5 },
        log: 'Restored heirlooms from an earlier generation and felt rooted in history.',
      },
      {
        label: 'Auction the rare pieces to fund your next chapter',
        hint: '+$4,200, -Happiness',
        effects: { money: 4200, happiness: -3 },
        log: 'Sold antique family keepsakes at auction for $4,200.',
      },
    ],
  },

  // ==========================================================
  // GENERAL EVENTS — ELDER (Ages 65+)
  // ==========================================================
  {
    id: 'elder_garden_years',
    stages: ['Elder'],
    minAge: 65, maxAge: 98,
    title: 'Quiet Mornings',
    prompt: 'The pace of the neighborhood slows. Mornings smell like coffee and damp earth.',
    choices: [
      {
        label: 'Tend heirloom tomatoes and walk two miles daily',
        hint: '+Health, +Happiness',
        effects: { health: 6, happiness: 6 },
        log: 'Kept spry tending garden beds and walking every morning.',
      },
      {
        label: 'Write down the family memoirs for future heirs',
        hint: '+Smarts, +Happiness, leaves family legacy',
        effects: { smarts: 5, happiness: 6 },
        setFlag: 'wrote_memoirs',
        log: 'Filled leather notebooks with candid stories of your life.',
      },
    ],
  },
  {
    id: 'elder_hip_scare',
    stages: ['Elder'],
    minAge: 67, maxAge: 105,
    title: 'Icy Front Steps',
    prompt: 'A sheet of black ice coats the front porch after a January freeze.',
    choices: [
      {
        label: 'Pay for porch handrails & winter physical therapy ($1,400)',
        hint: '-$1,400, protects Health',
        effects: { money: -1400, health: 6, happiness: 2 },
        log: 'Installed sturdy porch rails and stayed steady through winter.',
      },
      {
        label: 'Shrug it off and brave the ice with a snow shovel',
        hint: 'Dangerous slip risk',
        risk: {
          chance: 0.45,
          pass: { effects: { happiness: 3 }, log: 'Salted the icy steps yourself without a scratch.' },
          fail: { effects: { health: -20, happiness: -8 }, log: 'Took a hard fall on January black ice.' },
        },
      },
    ],
  },
  {
    id: 'elder_estate_gift',
    stages: ['Elder'],
    minAge: 70, maxAge: 105,
    once: true,
    title: 'Orderly Affairs',
    prompt: 'An old estate lawyer asks how you want to manage your savings in your twilight years.',
    choices: [
      {
        label: 'Organize a clean trust for the next generation',
        hint: '90% inheritance retention, +Happiness',
        effects: { happiness: 6, smarts: 3 },
        setFlag: 'estate_trust',
        log: 'Put your estate in clean order for those who come next.',
      },
      {
        label: 'Book a grand world cruise while you still can!',
        hint: '-$4,500, +Happiness',
        effects: { money: -4500, happiness: 12, health: 3 },
        log: 'Sailed across two oceans on an unforgettable twilight cruise.',
      },
    ],
  },
  {
    id: 'elder_community_board',
    stages: ['Elder'],
    minAge: 65, maxAge: 95,
    title: 'Town Historical Society',
    prompt: 'Neighbors ask if you’ll chair the local historical society and mentor young apprentices.',
    choices: [
      {
        label: 'Accept the gavel and host monthly lectures',
        hint: '+Smarts, +Happiness',
        effects: { smarts: 5, happiness: 5 },
        log: 'Kept your mind sharp leading the local historical society.',
      },
      {
        label: 'Politely decline and guard your afternoon naps',
        hint: '+Health',
        effects: { health: 4, happiness: 2 },
        log: 'Turned down committee politics in favor of peaceful porch naps.',
      },
    ],
  },
  {
    id: 'elder_checkup',
    stages: ['Elder'],
    minAge: 68, maxAge: 108,
    title: 'Annual Specialist Visit',
    prompt: 'Your doctor reviews your bloodwork and suggests a pricey preventative regimen.',
    choices: [
      {
        label: 'Pay $950 out-of-pocket for the full regimen & swim therapy',
        hint: '-$950, +Health',
        effects: { money: -950, health: 8 },
        log: 'Invested in preventative care and earned a clean bill of health.',
      },
      {
        label: 'Stick with chamomile tea and stubborn optimism',
        hint: 'Free, coin-flip on Health',
        risk: {
          chance: 0.5,
          pass: { effects: { happiness: 3, health: 1 }, log: 'Shrugged off the specialist and felt spry anyway.' },
          fail: { effects: { health: -10, happiness: -3 }, log: 'Skipped preventative meds and felt your stamina slip.' },
        },
      },
    ],
  },
];
