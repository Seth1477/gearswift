// Builds the Google Ads landing pages in /lp from one template.
// Run from the project folder:  node tools/build-landing-pages.js
// Edit the PAGES list below to change wording, then run it and push.
const fs = require('fs');
const path = require('path');

const TAG = 'AW-18536573438';
const GA4 = 'G-8VZ6EYQ9E5';
const PHONE = '825-777-2483';
const TEL = '+18257772483';

const FAQ = [
  ['How fast can you build a gear?', 'It depends on the size, the material and whether the gear needs heat treat and grinding. Send photos and we will come back with a firm ship date. Repeat orders are faster because your tooling and programs stay on file, and expedite options are available when equipment is down.'],
  ['Do I need a drawing?', 'No. A drawing is best, but clear photos of the old gear next to a ruler, plus the outside diameter, bore, face width and tooth count, are often enough. We reverse engineer the gear from the part.'],
  ['What kinds of gears do you make?', 'Industrial gears: spur, helical and double-helical (herringbone) gears, planetary sun, planet and ring gears, pump jack reducer gearing, internal gears, worms and threaded shafts, splined gears and shafts, sprockets, and pinion shafts. We do not make automotive gears. If it transmits motion in industrial equipment, send it over and we will tell you if we can make it.'],
  ['Can you make just one?', 'Yes. Single replacement gears and prototypes are welcome, and so are production runs and repeat orders.'],
  ['Will I get paperwork with the gear?', 'Every gear is inspected before it ships, and documentation is available with your order: certificate of conformance, material certs, heat treat certs and an inspection report.'],
];

const PAGES = [
  {
    slug: 'replacement-gears',
    title: 'Replacement Gears Built Fast | Hotshot Gears',
    desc: 'Discontinued, worn or broken gear? Send a photo and get a quote on a custom replacement gear, reverse engineered to fit.',
    kicker: 'Replacement gears',
    h1: 'Replacement gears, <span>built fast.</span>',
    sub: 'Discontinued, worn out or stuck on back-order? Send a photo or the old part. We reverse engineer it and build a replacement that fits.',
    ticks: ['Reverse engineered from your old gear, a drawing or photos', 'Fast turnaround, with a firm ship date on every quote', 'Single gears welcome, not just production runs'],
    bg: '/img/replacement.jpg',
    formTitle: 'Get your replacement gear quote',
    formSub: 'Just your name and a phone or email. Add photos if you have them.',
    placeholder: 'e.g. Broken pinion on a conveyor gearbox, about 6 inch OD, 24 teeth',
    cta: 'Get My Quote',
    urgency: '',
    gallery: [['/img/replacement.jpg', 'Double-helical gear set'], ['/img/work-herringbone.jpg', 'Herringbone gear and pinion shafts'], ['/img/work-spline.jpg', 'Splined bore gear']],
    finalH: 'Need a replacement gear?',
    finalP: 'Send a photo of the old gear and we will get a quote back to you fast.',
  },
  {
    slug: 'custom-gears',
    title: 'Custom Gear Manufacturing | Hotshot Gears',
    desc: 'Custom spur, helical, herringbone, worm and splined gears made to your drawing. Fast turnaround, inspected and documented.',
    kicker: 'Custom gear manufacturing',
    h1: 'Custom gears, <span>made to order.</span>',
    sub: 'Spur, helical, herringbone, worm and splined gears made to your drawing, from one-off prototypes to production runs.',
    ticks: ['Made to your drawing, sample or photos', 'Hardened and ground, or pre-hard when speed matters most', 'Inspected in-house and shipped with documentation'],
    bg: '/img/work-herringbone.jpg',
    formTitle: 'Get your custom gear quote',
    formSub: 'Tell us what you need. A drawing or photos help, but are optional.',
    placeholder: 'e.g. 22 tooth spur gear, 4.5 inch OD, 4140 steel, qty 10',
    cta: 'Get My Quote',
    urgency: '',
    gallery: [['/img/work-spur.jpg', 'Precision spur gears'], ['/img/production.jpg', 'Matched gear pair'], ['/img/work-herringbone.jpg', 'Herringbone gear and pinions']],
    finalH: 'Ready to get your gears made?',
    finalP: 'Send your drawing or a few details and we will quote it fast.',
  },
  {
    slug: 'urgent-gear-replacement',
    title: 'Gearbox Down? Urgent Gear Replacement | Hotshot Gears',
    desc: 'Equipment down? Send a photo of the broken gear. Expedited scheduling and pre-hard options to get you running again.',
    kicker: 'Equipment down',
    h1: 'Gearbox down? <span>Get running again.</span>',
    sub: 'Send a photo of the broken gear or call now. Your job is expedited, and where the application allows we can build a pre-hard gear to get you back up sooner.',
    ticks: ['Expedited scheduling for breakdowns', 'Pre-hard option skips heat treat and grinding when it fits', 'One person keeps you updated until it ships'],
    bg: '/img/emergency.jpg',
    formTitle: 'Tell us what broke',
    formSub: 'Name and phone is enough. We will call you.',
    placeholder: 'e.g. Pinion shaft sheared on a mixer gearbox, down since this morning',
    cta: 'Get Help Now',
    urgency: 'emergency',
    gallery: [['/img/emergency.jpg', 'Open gearbox'], ['/img/replacement.jpg', 'Replacement gear set'], ['/img/production.jpg', 'Matched gears']],
    finalH: 'Every hour down costs money.',
    finalP: 'Call now or send a photo of the broken gear.',
  },

  // Search pages: same layout, but indexed by Google, with their own copy, FAQ and structured data.
  // Google Ads currently points at /pump-jack-gears.
  {
    slug: 'herringbone-gears',
    index: true,
    crumb: 'Herringbone Gears',
    service: 'Herringbone (double-helical) gear manufacturing',
    title: 'Herringbone & Double-Helical Gears, Custom Made | Hotshot Gears',
    desc: 'Custom herringbone (double-helical) gears and pinion shafts, made to your drawing or reverse engineered from a worn gear. Built in Alberta, shipped across Canada.',
    kicker: 'Herringbone gears',
    h1: 'Herringbone gears, <span>made to order.</span>',
    sub: 'Double-helical gears and pinion shafts for heavy industrial drives. Made to your drawing, or reverse engineered from the gear that wore out.',
    ticks: ['Gears, pinions and matched sets', 'Reverse engineered from your old gear, a drawing or photos', 'Inspected and shipped with documentation'],
    bg: '/img/work-herringbone.jpg',
    formTitle: 'Get a herringbone gear quote',
    formSub: 'Just your name and a phone or email. Add photos if you have them.',
    placeholder: 'e.g. Double-helical gear, about 30 inch OD, 96 teeth, mating pinion worn',
    cta: 'Get My Quote',
    urgency: '',
    gallery: [
      ['/img/gears/herringbone-gear-teeth-closeup.jpg', 'Herringbone teeth, apex up close', 'Close-up of herringbone gear teeth meeting at the apex'],
      ['/img/work-herringbone.jpg', 'Herringbone gear and pinion shafts', 'Large double-helical herringbone gear with helical pinion shafts behind it'],
      ['/img/replacement.jpg', 'Double-helical gear set', 'Double-helical gear and pinion set on the bench'],
      ['/img/emergency.jpg', 'Double-helical gearbox', 'Open industrial gearbox with double-helical gears'],
      ['/img/gears/helical-pinion-shafts.jpg', 'Helical pinion shafts', 'Row of helical pinion shafts machined from bar'],
      ['/img/gears/helical-pinion-shafts-production-run.jpg', 'Pinion shafts, production run', 'Production run of helical pinion shafts on a pallet'],
    ],
    about: [
      ["What is a herringbone gear?", [
        "A herringbone gear, also called a double-helical gear, has two sets of helical teeth angled in opposite directions, meeting in a V down the middle of the face. From the side the teeth look like the bones of a fish, which is where the name comes from. Each half pushes sideways against the other, so the axial thrust cancels out. That lets the gear carry high loads smoothly and quietly without heavy thrust bearings.",
        "Strictly speaking, a true herringbone gear has teeth that meet at a sharp apex with no gap, while a double-helical gear has a groove or gap between the two helices. In the field the two names are used for the same family of gears, and we make both.",
      ]],
      ["Herringbone vs. helical vs. spur gears", [
        { ul: [
          "Spur gears: straight teeth, simple and efficient, but only one or two teeth carry load at a time, so they get noisy at high speed and are less suited to shock loads.",
          "Single helical gears: angled teeth engage gradually and run smoother and quieter than spur gears, but the angle creates axial thrust that the bearings and housing must absorb.",
          "Herringbone (double-helical) gears: the smoothness and load capacity of a helical gear with the thrust cancelled out. Ideal for large, heavily loaded, continuous-duty drives, at the cost of more complex manufacturing.",
        ] },
        "Because the thrust cancels, one shaft in a herringbone pair is usually left free to float a little axially, so the two helices share the load evenly. A single helical gear cannot simply be swapped in for a herringbone gear without redesigning the bearings to take the thrust.",
      ]],
      ["Industries that use herringbone gears", [
        "Herringbone gears show up wherever high torque, continuous duty and shock loads meet. Common applications include:",
        { ul: [
          "Oil and gas: pump jack (beam pumping unit) gear reducers, triplex mud pumps, compressors and drilling rig drives.",
          "Mining and mineral processing: ball mill and SAG mill drives, crushers, conveyors and hoists.",
          "Cement and aggregate: kiln drives, raw and finish mills, and heavy conveyor drives.",
          "Steel and metals: rolling mill pinion stands and mill drive gearboxes, the original home of the herringbone gear.",
          "Pulp, paper and forestry: paper machine drives, calenders, chippers and debarkers.",
          "Power generation: turbine gearboxes and large fan and pump drives.",
          "Marine: propulsion reduction gears and heavy deck machinery.",
          "Sugar, food and chemical processing: cane mills, mixers and large process gearboxes.",
          "Rubber and plastics: mixer and extruder drives.",
        ] },
        { links: [['/pump-jack-gears', 'Pump jack gearbox gears'], ['/spur-gears', 'Spur gears'], ['/planetary-gears', 'Planetary gears']], lead: 'Related:' },
      ]],
      ["Signs a herringbone gear or pinion needs replacing", [
        { ul: [
          "Pitting and spalling: small craters or flaking on the tooth faces, usually starting near the pitch line.",
          "Uneven wear between the two helices: often a sign the shaft cannot float or the gearbox is out of alignment.",
          "Broken or chipped teeth: from shock loads, fatigue or debris passing through the mesh.",
          "Rising noise, heat or vibration: a change in sound is often the first warning a mesh is going.",
          "Excess backlash or axial movement: worn teeth or bearings let the gears shift more than they should.",
        ] },
        "The pinion makes more revolutions than the gear, so it usually wears first. Replacing a worn pinion before it damages the bull gear is far cheaper than replacing the whole set.",
      ]],
      ["Replacing a worn herringbone gear or pinion", [
        "Original drawings for older double-helical gearboxes are often long gone, and the OEM may quote months for a replacement, if they still make it at all. We measure your worn gear or pinion, work out the tooth data, including helix angle, hand, module or diametral pitch and centre distance, and build a replacement that meshes with the gear you keep.",
        "Send photos of the old part next to a ruler, with the outside diameter, face width, bore and tooth count, and we will come back with a price and a firm ship date.",
      ]],
      ["What we work with", [
        { ul: [
          "Gear types: herringbone and double-helical gears, bull gears, pinion shafts and matched sets.",
          "Tooth data: metric module or diametral pitch, any helix angle and hand, with or without a centre gap.",
          "Materials: gear steels such as 4140, 4340, 8620 and 9310, and other materials on request.",
          "Heat treatment: through-hardened, or carburized and ground.",
          "Documentation: certificate of conformance, material and heat treat certs, and inspection reports.",
        ] },
      ]],
    ],
    faq: [
      ['Can you replace just the pinion in a herringbone set?', 'Yes. We measure the mating gear so the new pinion matches its tooth geometry and runs at the right centre distance. If the gear is worn too, we will tell you before you order.'],
      ['Do you make double-helical gears with a centre groove?', 'Yes. Many double-helical gears have a gap between the two helices, and we build to whatever your gear or drawing calls for.'],
      ["What is the difference between a herringbone gear and a double-helical gear?", "Both have two opposed helices that cancel axial thrust. A herringbone gear has teeth that meet at a continuous apex, and a double-helical gear has a gap between the helices. Many people use the names interchangeably."],
      ["Can I replace a herringbone gear with a single helical gear?", "Not directly. A single helical gear produces axial thrust that a herringbone gearbox is not built to carry. To fit the existing housing and bearings, the replacement should be double-helical too."],
    ],
    finalH: 'Need a herringbone gear?',
    finalP: 'Send a drawing or photos of the old gear and we will quote it fast.',
  },
  {
    slug: 'spur-gears',
    index: true,
    crumb: 'Spur Gears',
    service: 'Custom spur gear manufacturing',
    title: 'Custom Spur Gears, Made to Order in Canada | Hotshot Gears',
    desc: 'Custom spur gears made to your drawing or sample: one-off replacements, prototypes and production runs. Hardened and ground or pre-hard. Fast turnaround.',
    kicker: 'Spur gears',
    h1: 'Custom spur gears, <span>built fast.</span>',
    sub: 'Single replacements, prototypes and production runs. Made to your drawing, or measured from the gear you have.',
    ticks: ['Any quantity, from one gear to a production run', 'Hardened and ground, or pre-hard when speed matters', 'Splined bores, keyways and bolt patterns to suit your shaft'],
    bg: '/img/work-spur.jpg',
    formTitle: 'Get a spur gear quote',
    formSub: 'Tell us what you need. A drawing or photos help, but are optional.',
    placeholder: 'e.g. 22 tooth spur gear, 4.5 inch OD, 4140 steel, qty 10',
    cta: 'Get My Quote',
    urgency: '',
    gallery: [
      ['/img/work-spur.jpg', 'Precision spur gear', 'Precision spur gear with four counterbored bolt holes'],
      ['/img/gears/black-oxide-spur-gears.jpg', 'Black oxide spur gears', 'Three large black-finished spur gears'],
      ['/img/gears/precision-spur-gear-pair.jpg', 'Stacked spur gear pair', 'Two matching precision spur gears stacked on a granite plate'],
      ['/img/production.jpg', 'Matched spur gear pair', 'Two matching precision spur gears side by side'],
      ['/img/work-spline.jpg', 'Spur gear with splined bore', 'Spur gear with an internal spline bore'],
      ['/img/gears/gear-hobbing-machine.jpg', 'Gear hobbing in our shop', 'Gear hobbing machine cutting gear teeth'],
    ],
    about: [
      ["What is a spur gear?", [
        "Spur gears have straight teeth cut parallel to the shaft. They are the simplest and most common type of gear, transmitting motion between parallel shafts with very high efficiency, often 98 to 99 percent per mesh. Because there is no tooth angle, spur gears create no axial thrust, which keeps bearings and housings simple.",
        "A spur gear is defined by its tooth count, its tooth size (metric module or inch diametral pitch) and its pressure angle, most often 20 degrees on modern gears and 14.5 degrees on many older machines. Get those right, along with the bore and face width, and a replacement gear will mesh with the gear it runs against.",
      ]],
      ["Spur gears vs. helical gears", [
        { ul: [
          "Spur gears: no thrust load, simple bearings, efficient and economical to make. Best at low to moderate speeds.",
          "Helical gears: quieter and smoother at high speed because teeth engage gradually, but they create axial thrust.",
        ] },
        "For many drives, especially slower, heavily loaded ones, a well-made spur gear is the most reliable and cost-effective choice.",
      ]],
      ["Industries that use spur gears", [
        "Spur gears are in almost every kind of machine. We make them for:",
        { ul: [
          "Oil and gas: pumps, winches, rig equipment and service truck drives.",
          "Agriculture: combines, balers, seeders, augers and tractor implements.",
          "Mining and construction: heavy equipment drives, winches, hoists and crushers.",
          "Forestry and sawmills: conveyors, edgers, debarkers and log handling.",
          "Material handling: conveyors, cranes, hoists and lifts.",
          "Manufacturing: machine tools, presses, packaging and printing machinery.",
          "Food processing: mixers, conveyors and processing lines.",
          "Water and wastewater: clarifier drives, pumps and screens.",
          "Gear reducers: input pinions and output gears for industrial speed reducers.",
        ] },
        { links: [['/herringbone-gears', 'Herringbone gears'], ['/planetary-gears', 'Planetary gears'], ['/gear-reverse-engineering', 'Gear reverse engineering']], lead: 'Related:' },
      ]],
      ["Spur gears made to your spec", [
        "We cut spur gears in metric module or diametral pitch, with whatever bore your shaft needs: plain, keyed, splined, or with a bolt pattern for a hub. Spur pinions can be cut integral with the shaft, and internal spur gears are made to suit your housing.",
        { ul: [
          "Materials: 4140, 4340, 8620 and 9310 gear steels, and other materials on request.",
          "Heat treatment: through-hardened, or carburized and ground for maximum wear life.",
          "Finishes: black oxide and other finishes on request.",
          "Bores: plain, keyed, set screw, internal spline or bolt pattern.",
        ] },
      ]],
      ["Signs a spur gear needs replacing", [
        { ul: [
          "Pitting or spalling on the tooth faces.",
          "Teeth worn to a point or hooked, or visible steps worn into the flanks.",
          "Cracked, chipped or missing teeth.",
          "A worn keyway or spline that lets the gear rock on its shaft.",
          "New noise, vibration or heat from the gearbox.",
        ] },
      ]],
      ["From one replacement gear to a production run", [
        "Need one gear to get a machine running? Send the old one, or photos with the outside diameter, tooth count, face width and bore. Building new equipment? Send the drawing and we will review it before anything gets cut.",
        "Once your gear is on file, reorders are faster because the tooling and CNC programs are already set up. Every order is inspected and can ship with a certificate of conformance, material certs and an inspection report.",
      ]],
    ],
    faq: [
      ['Do you cut metric and inch spur gears?', 'Yes. We make gears in metric module and in diametral pitch, and can tell which one your old gear is when we measure it.'],
      ['Can you put a spline or keyway in the bore?', 'Yes. Internal splines, keyways, set screws and bolt patterns are all common, and we match them to your shaft or hub.'],
      ["How do I tell if my spur gear is metric or inch?", "Count the teeth and measure the outside diameter. For a standard metric gear, the outside diameter in millimetres divided by the tooth count plus two gives a round module. For an inch gear, the tooth count plus two divided by the outside diameter in inches gives a whole diametral pitch. Send us the numbers and we will confirm it."],
      ["Should I replace both gears in a pair?", "If both are worn, yes, because a new gear running against a worn one wears faster. If only one is damaged and the mate is in good shape, we can build the replacement to suit it."],
    ],
    finalH: 'Need spur gears made?',
    finalP: 'Send a drawing or a few details and we will quote it fast.',
  },
  {
    slug: 'pump-jack-gears',
    index: true,
    crumb: 'Pump Jack Gears',
    service: 'Pump jack gearbox herringbone gear and pinion replacement',
    title: 'Pump Jack Gearbox Gears | Herringbone Gear & Pinion Replacement | Hotshot Gears',
    desc: 'Replacement herringbone gears and pinion shafts for pump jack gear reducers. Reverse engineered from your worn gear, built in Alberta and shipped across Canada.',
    kicker: 'Pump jack gearbox gears',
    h1: 'Pump jack gears, <span>built fast.</span>',
    sub: 'Replacement herringbone (double-helical) bull gears, intermediate gears and pinion shafts for pumping unit gear reducers. Reverse engineered from your worn gear and shipped anywhere in Canada.',
    ticks: ['Bull gears, intermediate gears and pinion shafts', 'Matched to the gear you keep, no drawing needed', 'Built in Alberta, shipped to every province'],
    bg: '/img/work-herringbone.jpg',
    formTitle: 'Get a pump jack gear quote',
    formSub: 'Just your name and a phone or email. Photos of the old gear help.',
    placeholder: 'e.g. Worn high-speed pinion on a 228 pumping unit reducer, gear still good',
    cta: 'Get My Quote',
    urgency: '',
    gallery: [
      ['/img/work-herringbone.jpg', 'Herringbone gear and pinion shafts', 'Large herringbone gear with helical pinion shafts, the type used in pump jack reducers'],
      ['/img/replacement.jpg', 'Double-helical gear set', 'Double-helical gear and pinion set'],
      ['/img/emergency.jpg', 'Open double-helical gearbox', 'Open gear reducer with double-helical gears'],
      ['/img/gears/herringbone-gear-teeth-closeup.jpg', 'Herringbone teeth up close', 'Close-up of herringbone gear teeth meeting at the apex'],
      ['/img/gears/large-helical-bull-gear.jpg', 'Large helical gear', 'Large helical gear on a cast hub'],
      ['/img/gears/helical-pinion-shafts.jpg', 'Pinion shafts', 'Row of helical pinion shafts'],
    ],
    about: [
      ['Herringbone gears for pump jack gear reducers', [
        'Most beam pumping units run a double-reduction gear reducer built with herringbone (double-helical) gearing: a high-speed pinion shaft, an intermediate gear and pinion, and a large low-speed bull gear driving the crank. The opposed helices cancel thrust and carry the heavy, cyclic torque of a pump jack stroke for years, but pitting, spalling, scuffing and broken teeth eventually take a reducer out of service.',
        'Hotshot Gears builds replacement herringbone gears and pinion shafts for pump jack gearbox repair. We work with oilfield service companies, gearbox repair shops and producers to replace the worn gearing, so a reducer can go back into service instead of being scrapped.',
      ]],
      ['Reverse engineered to mesh with the gear you keep', [
        'Older pumping units often have no drawings, and new OEM gearing can be expensive or slow to get. We measure your worn pinion or gear, work out the tooth count, helix angle and hand, pitch, pressure angle and centre distance, and check the mating gear so the new part runs properly with it, not just a copy of the worn shape.',
        'Send photos of the old gear next to a tape measure, with the outside diameter, face width, tooth count and the reducer rating from the nameplate if you have it. We will come back with a price and a firm ship date.',
      ]],
      ['Shipped across Canada', [
        'Our shop is in Leduc, Alberta, close to the oilfield service hubs of Nisku and Edmonton. We ship pump jack gears to Alberta, Saskatchewan, Manitoba, British Columbia and the rest of Canada.',
      ]],
    ],
    faq: [
      ['Can you replace just the pinion in a pump jack gearbox?', 'Yes. The high-speed pinion usually wears first. We measure the mating gear so the new pinion matches its tooth geometry and centre distance. If the gear is worn too, we will tell you before you order.'],
      ['Do you rebuild the whole gear reducer?', 'We make the gears and pinion shafts. If you need the reducer torn down, re-bearinged and reassembled, your gearbox repair shop can install our gearing, and we are happy to work directly with them.'],
      ['Do you make gears for car, truck or automotive transmissions?', 'No. We make industrial gears, such as pump jack reducer gearing, herringbone, spur and planetary gears for heavy equipment. We do not make automotive transmission or differential gears.'],
    ],
    finalH: 'Pump jack gearbox down?',
    finalP: 'Send photos of the worn gear or pinion and we will quote it fast.',
  },
  {
    slug: 'planetary-gears',
    index: true,
    crumb: 'Planetary Gears',
    service: 'Planetary gear manufacturing: sun, planet and ring gears',
    title: 'Planetary Gears: Custom Sun, Planet & Ring Gears | Hotshot Gears',
    desc: 'Custom and replacement planetary gears: sun gears, planet gears and internal ring gears for final drives, swing drives, winches and gearboxes. Built in Canada.',
    kicker: 'Planetary gears',
    h1: 'Planetary gears, <span>made to order.</span>',
    sub: 'Sun gears, planet gears and internal ring gears for final drives, swing drives, winches and planetary gearboxes. Made to your drawing or reverse engineered from the worn part.',
    ticks: ['Sun, planet and internal ring gears', 'Matched planet sets, made together', 'Reverse engineered from your old gears, a drawing or photos'],
    bg: '/img/work-spline.jpg',
    formTitle: 'Get a planetary gear quote',
    formSub: 'Tell us what you need. A drawing or photos help, but are optional.',
    placeholder: 'e.g. Set of 3 planet gears and sun gear for a winch planetary, 18 and 15 teeth',
    cta: 'Get My Quote',
    urgency: '',
    gallery: [
      ['/img/work-spline.jpg', 'Splined-bore gear', 'Gear with an internal spline bore'],
      ['/img/gears/precision-spur-gear-pair.jpg', 'Matched gear pair', 'Two matching precision gears stacked on a granite plate'],
      ['/img/gears/gear-hobbing-machine.jpg', 'Gear hobbing in our shop', 'Gear hobbing machine cutting gear teeth'],
    ],
    about: [
      ["What is a planetary gear set?", [
        "A planetary (epicyclic) gear set has a central sun gear, several planet gears that orbit it on a carrier, and an internal ring gear around the outside. Because the load is shared across several planets, a planetary set packs a large reduction and high torque into a small, compact drive, with the input and output on the same axis.",
      ]],
      ["How a planetary gear set works", [
        "In the most common arrangement the ring gear is held still, the sun gear is driven, and the planet carrier is the output. The carrier then turns slower than the sun, with a reduction ratio of one plus the ring tooth count divided by the sun tooth count. A sun gear with 18 teeth inside a ring with 72 teeth gives a 5:1 reduction in a single stage.",
        "Holding a different member changes the ratio or reverses the output. Industrial drives often stack two or three planetary stages to reach ratios of 100:1 or more in a housing that fits inside a wheel hub or winch drum.",
      ]],
      ["Why planetary gears are used", [
        { ul: [
          "High torque density: the load is split across three or more planets, so a small gearbox carries a lot of torque.",
          "Compact and coaxial: input and output share one centre line, ideal for wheel hubs, drums and in-line drives.",
          "Large ratios in a small space: multiple stages stack easily.",
          "Balanced loads: planets spaced evenly around the sun cancel radial forces on the bearings.",
        ] },
      ]],
      ["Industries that use planetary gears", [
        { ul: [
          "Construction and mining equipment: excavator and dozer track drives, wheel loader and haul truck final drives, and swing drives.",
          "Cranes and lifting: hoist and winch drives, slew and swing drives.",
          "Oil and gas: drilling and service rig winches, top drive gearboxes and rig equipment.",
          "Agriculture: tractor final drives, combine and sprayer wheel drives.",
          "Forestry: harvester and feller buncher swing and track drives, and forwarder wheel drives.",
          "Wind energy: the planetary stages of wind turbine main gearboxes.",
          "Mixers: concrete mixer drum drives and industrial mixer and agitator drives.",
          "Industrial reducers: in-line planetary gearboxes for conveyors, extruders and process equipment.",
          "Marine: deck winches, cranes and thruster drives.",
        ] },
        { links: [['/herringbone-gears', 'Herringbone gears'], ['/spur-gears', 'Spur gears'], ['/gear-reverse-engineering', 'Gear reverse engineering']], lead: 'Related:' },
      ]],
      ["Replacement sun, planet and ring gears", [
        { h3: "Sun gears" },
        "The sun gear meshes with every planet on every revolution, so it sees the most load cycles in the set and is often the first part to pit or crack. We make sun gears with splined bores, integral shafts or splined stub ends to match your input.",
        { h3: "Planet gears" },
        "Planet gears share the load, so they need to match each other closely. We make them as a matched set, with bores to suit the planet bearings or pins in your carrier.",
        { h3: "Ring gears" },
        "Internal ring gears are made to your drawing or measured from the old ring, including external splines, bolt patterns or mounting features that locate them in the housing.",
        "Gear steels include 4140, 4340, 8620 and 9310, carburized and ground or through-hardened. Send the drawing, the worn gears, or photos with tooth counts and diameters, and we will come back with a price and a firm ship date.",
      ]],
      ["Common planetary gear failures", [
        { ul: [
          "Pitting and spalling on the sun gear: the most heavily cycled gear in the set.",
          "Planet bearing failure: a failed bearing lets a planet tip, overloading its teeth and the sun.",
          "Broken teeth: from shock loads, overloads or debris in the oil.",
          "Ring gear wear: uneven wear patterns often point to a carrier or bearing problem.",
        ] },
        "When one gear fails, check the rest of the set. Metal from a failed gear travels through the oil and damages everything it passes.",
      ]],
    ],
    faq: [
      ['Should I replace all the planet gears at once?', 'Usually, yes. Planets share the load, so a new gear running beside worn ones carries more than its share. We make planet gears as a matched set so they wear evenly.'],
      ['Can you make the internal ring gear?', 'Yes. Internal ring gears are made to your drawing or measured from the old ring, including any external splines, bolt patterns or mounting features.'],
      ["What information do you need to quote planetary gears?", "Tooth counts for the sun, planets and ring, the outside diameters, face widths, and the bore or spline details. Photos of each gear next to a ruler help, and the make and model of the drive if you know it."],
      ["Do you make gears for automotive automatic transmissions?", "No. We make planetary gears for industrial, heavy equipment and oilfield drives, not car or truck transmissions."],
    ],
    finalH: 'Need planetary gears made?',
    finalP: 'Send a drawing or photos of the worn gears and we will quote it fast.',
  },
  {
    slug: 'gear-reverse-engineering',
    index: true,
    crumb: 'Gear Reverse Engineering',
    service: 'Gear reverse engineering and replacement gear manufacturing',
    title: 'Gear Reverse Engineering & Obsolete Gear Replacement | Hotshot Gears',
    desc: 'No drawing? We reverse engineer worn, broken or obsolete gears from the part or photos, then build a replacement that fits. Fast turnaround, built in Canada.',
    kicker: 'Reverse engineering',
    h1: 'No drawing? <span>No problem.</span>',
    sub: 'We measure your worn, broken or obsolete gear, work out the tooth data, and build a replacement that fits the first time.',
    ticks: ['Works from the old part, photos or partial drawings', 'For discontinued and obsolete OEM gears', 'Gear data kept on file for fast reorders'],
    bg: '/img/replacement.jpg',
    formTitle: 'Get a reverse engineering quote',
    formSub: 'Just your name and a phone or email. Add photos if you have them.',
    placeholder: 'e.g. Obsolete gear from a 1980s gearbox, no drawing, about 10 inch OD',
    cta: 'Get My Quote',
    urgency: '',
    gallery: [['/img/replacement.jpg', 'Replacement double-helical gear set'], ['/img/work-spline.jpg', 'Gear with internal spline'], ['/img/work-herringbone.jpg', 'Herringbone gear and pinions']],
    about: [
      ['How gear reverse engineering works', [
        'When there is no drawing, the gear itself is the drawing. We measure the outside and root diameters, tooth count, face width, tooth thickness and, on helical and herringbone gears, the helix angle and hand. From that we work out whether the gear is metric or inch, its pressure angle and profile shift, and the backlash it needs to run with its mate.',
        'We look at how the old gear wore, and at the mating gear when we can, so the replacement meshes properly rather than just copying the worn shape.',
      ]],
      ['Obsolete, discontinued and back-ordered gears', [
        'Older equipment often outlives its manufacturer. If the OEM part is discontinued, on a long back-order, or the company is gone, reverse engineering is usually the fastest way back up and running. Once the gear data is on file, the next one is quicker still.',
        'Start by sending clear photos of the gear next to a ruler, with the measurements you can take. If we need the part itself, we will tell you.',
      ]],
    ],
    faq: [
      ['What measurements should I send?', 'Outside diameter, tooth count, face width and bore size are the most useful, plus photos of the gear face-on and from the side next to a ruler. For helical gears, a photo showing the tooth angle helps.'],
      ['Do I need to ship you the old gear?', 'Not always. Many gears can be quoted from photos and measurements. For tight-tolerance or heavily worn gears we may ask for the part, or the mating gear, to get it right.'],
    ],
    finalH: 'Got a gear with no drawing?',
    finalP: 'Send a photo and the measurements you have, and we will quote it fast.',
  },
  {
    slug: 'gear-manufacturer-alberta',
    index: true,
    crumb: 'Gear Manufacturer in Alberta',
    service: 'Custom gear manufacturing in Alberta',
    title: 'Gear Manufacturer in Alberta | Custom Gears Near Edmonton | Hotshot Gears',
    desc: 'Custom and replacement gears built in Leduc, Alberta, just south of Edmonton. Spur, helical and herringbone gears, splines and pinions. Fast turnaround across Alberta.',
    kicker: 'Alberta gear manufacturer',
    h1: 'Custom gears, <span>built in Alberta.</span>',
    sub: 'Replacement, prototype and production gears from our shop in Leduc, just south of Edmonton. Fast turnaround, shipped anywhere in Canada.',
    ticks: ['Built in Leduc, near Edmonton and Nisku', 'Spur, helical and herringbone gears, splines and pinions', 'Fast turnaround, with a firm ship date on every quote'],
    bg: '/img/hero.jpg',
    formTitle: 'Get your gear quote',
    formSub: 'Just your name and a phone or email. Add photos if you have them.',
    placeholder: 'e.g. Broken pinion on a conveyor gearbox, about 6 inch OD, 24 teeth',
    cta: 'Get My Quote',
    urgency: '',
    gallery: [['/img/work-herringbone.jpg', 'Herringbone gear and pinion shafts'], ['/img/work-spur.jpg', 'Precision spur gear'], ['/img/production.jpg', 'Matched gear pair']],
    about: [
      ['A gear shop close to home', [
        'Hotshot Gears builds custom gears in Leduc, Alberta, minutes from Edmonton and the Nisku industrial park. When equipment is down in Alberta, waiting on an overseas OEM or a shop across the continent costs days you do not have. A local gear manufacturer means shorter shipping, easier communication and a part that gets to you sooner.',
        'We make spur, helical and double-helical (herringbone) gears, internal gears, worms, splined shafts and hubs, sprockets and pinion shafts, from single replacement gears to production runs.',
      ]],
      ['Built for the equipment Alberta runs on', [
        'Oilfield equipment, pumps, mining and aggregate machinery, conveyors, agricultural and forestry equipment and plant gearboxes all depend on gears that are hard to source when they fail. Send a drawing, the worn part, or photos with measurements, and we will work out the gear data and build it fast.',
        'Customers in Edmonton, Leduc, Nisku, Calgary, Red Deer, Fort McMurray and the rest of Alberta are welcome, and we ship across Canada and North America.',
      ]],
    ],
    faq: [
      ['Where are you located?', 'Our shop is in Leduc, Alberta, just south of Edmonton and next to the Nisku industrial area. We ship across Alberta, Canada and North America.'],
      ['Do you only work with Alberta customers?', 'No. Alberta customers get the advantage of shorter shipping, but we build and ship gears for customers anywhere in Canada and North America.'],
    ],
    finalH: 'Need a gear made in Alberta?',
    finalP: 'Send a drawing or photos of the old gear and we will quote it fast.',
  },
];

const SEO = PAGES.filter((p) => p.index);
const SITE = 'https://www.hotshotgears.ca';

const ticksHtml = (a) => a.map((t) => `<li>${t}</li>`).join('');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const faqOf = (p) => (p.faq || []).concat(FAQ);

// One block of page copy: a string is a paragraph, {h3} a subheading, {ul} a list
// ("Term: detail" items get a bold term), {links} a line of internal links.
function block(b) {
  if (typeof b === 'string') return `\n    <p>${esc(b)}</p>`;
  if (b.h3) return `\n    <h3>${esc(b.h3)}</h3>`;
  if (b.ul) return `\n    <ul class="lp-list lp-dl">${b.ul.map((t) => {
    const i = t.indexOf(': ');
    return i > 0 && i < 40 ? `<li><strong>${esc(t.slice(0, i))}:</strong> ${esc(t.slice(i + 2))}</li>` : `<li>${esc(t)}</li>`;
  }).join('')}</ul>`;
  if (b.links) return `\n    <p class="lp-see">${esc(b.lead || 'See also:')} ${b.links.map(([href, text]) => `<a href="${href}">${esc(text)}</a>`).join(' &middot; ')}</p>`;
  throw new Error('unknown block ' + JSON.stringify(b));
}

// Breadcrumb, Service and FAQ structured data for the search pages
function jsonld(p) {
  const url = `${SITE}/${p.slug}`;
  const graph = [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: p.crumb, item: url },
    ] },
    { '@type': 'Service', name: p.service, serviceType: p.service, url, description: p.desc,
      image: p.gallery.map(([src]) => SITE + src),
      provider: { '@id': SITE + '/#organization' }, areaServed: [{ '@type': 'State', name: 'Alberta' }, { '@type': 'Country', name: 'Canada' }] },
    { '@type': 'FAQPage', mainEntity: faqOf(p).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  return `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 1)}\n</script>`;
}

function page(p) {
  const chip = (v, label) => `<label><input type="radio" name="urgency" value="${v}"${p.urgency === v ? ' checked' : ''}><span>${label}</span></label>`;
  return `<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${TAG}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${TAG}');
  gtag('config', '${GA4}');
</script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Hotshot Gears">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="https://www.hotshotgears.ca/${p.slug}">
<meta property="og:image" content="https://www.hotshotgears.ca/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Hotshot Gears logo, custom gear manufacturing">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://www.hotshotgears.ca/img/og-image.png">
${p.index ? `<link rel="canonical" href="${SITE}/${p.slug}">\n${jsonld(p)}` : '<meta name="robots" content="noindex, follow">'}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/css/lp.css">
<link rel="icon" href="/favicon.svg?v=4" type="image/svg+xml">
<link rel="icon" href="/favicon.ico?v=4" sizes="16x16 32x32 48x48">
<link rel="icon" href="/favicon-48.png?v=4" sizes="48x48" type="image/png">
<link rel="icon" href="/favicon-96.png?v=4" sizes="96x96" type="image/png">
<link rel="icon" href="/favicon-192.png?v=4" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4">
</head>
<body class="lp">

<header class="lp-head">
  <div class="wrap">
    <a href="/${p.index ? '' : p.slug}" class="logo" aria-label="Hotshot Gears"><img src="/img/logo/hs-mark.svg" alt="" width="40" height="40"><span class="logo-word">Hotshot<b>Gears</b></span></a>
    <div class="actions">
      <a class="lp-phone" href="tel:${TEL}"><small>Call now</small>${PHONE}</a>
      <a href="#lpCard" class="btn btn-red" data-scroll-form>Get a Quote</a>
    </div>
  </div>
</header>

<section class="lp-hero" style="--bg:url(${p.bg})">
  <div class="wrap">
    <div>
      <span class="lp-kicker">${p.kicker}</span>
      <h1>${p.h1}</h1>
      <p class="lp-sub">${p.sub}</p>
      <ul class="lp-ticks">${ticksHtml(p.ticks)}</ul>
      <div class="lp-callrow">
        <a class="lp-callbtn" href="tel:${TEL}">&#9742; ${PHONE}</a>
        <span class="lp-callnote">Prefer to talk? Call anytime.</span>
      </div>
    </div>

    <div class="lp-card" id="lpCard">
      <form id="lpForm" data-page="${p.slug}" data-urgency="${p.urgency}" novalidate>
        <div data-stage="fields">
          <h2>${p.formTitle}</h2>
          <p class="sub">${p.formSub}</p>
          <div class="hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
          <div class="f"><label class="l" for="lpName">Your name</label><input type="text" id="lpName" autocomplete="name"><div class="msg">Please enter your name</div></div>
          <div class="two">
            <div class="f"><label class="l" for="lpPhone">Phone</label><input type="tel" id="lpPhone" autocomplete="tel"><div class="msg">Add a phone number or email</div></div>
            <div class="f"><label class="l" for="lpEmail">Email</label><input type="email" id="lpEmail" autocomplete="email" inputmode="email"><div class="msg">Add a phone number or email</div></div>
          </div>
          <div class="f"><label class="l" for="lpMsg">What do you need? <span class="opt">(optional)</span></label><textarea id="lpMsg" placeholder="${esc(p.placeholder)}"></textarea></div>
          <div class="f"><span class="l">How urgent? <span class="opt">(optional)</span></span>
            <div class="lp-chips">${chip('emergency', 'Equipment down')}${chip('urgent', 'Failing soon')}${chip('planned', 'Planned')}</div></div>
          <div class="f"><span class="l">Photos or drawings <span class="opt">(optional)</span></span>
            <div class="lp-photo"><label class="pick"><input type="file" id="lpFiles" multiple accept=".jpg,.jpeg,.png,.heic,.heif,.pdf,.dwg,.dxf,.step,.stp,image/*">&#128247; Add photos</label><span class="count" id="lpCount"></span></div></div>
          <button type="submit" class="btn btn-red go">${p.cta}</button>
          <p class="fine">Free quote. No obligation. Your files are only used to prepare your quote.</p>
        </div>

        <div data-stage="sending" class="lp-send" hidden><div class="lp-spin" aria-hidden="true"></div><h2>Sending</h2><p>One moment...</p></div>

        <div data-stage="ok" class="lp-ok" hidden>
          <div class="tick">&#10003;</div>
          <h2>Got it, thanks</h2>
          <div class="ref" id="lpRef"></div>
          <p id="lpOkEmail">A confirmation is on its way to your email.</p>
          <p>We will be in touch shortly. Urgent? Call <a href="tel:${TEL}"><strong>${PHONE}</strong></a>.</p>
          <p id="lpOkFiles" hidden>Some photos didn't upload, but your request came through. We will ask for them when we call.</p>
        </div>

        <div data-stage="fallback" class="lp-ok" hidden>
          <h2>One last step</h2>
          <p>Our system is busy. Tap below to send your request straight to our inbox, already filled in.</p>
          <p style="margin-top:14px"><a class="btn btn-red" id="lpMail" href="mailto:hotshotgears@gmail.com">Send by email</a></p>
          <p style="margin-top:12px"><button type="button" class="linkish" id="lpRetry" style="background:none;border:0;text-decoration:underline;cursor:pointer;font:inherit">Or try again</button> &nbsp;|&nbsp; <a href="tel:${TEL}">Call ${PHONE}</a></p>
        </div>
      </form>
    </div>
  </div>
</section>

<section class="lp-trust">
  <div class="wrap">
    <div><strong>Fast turnaround</strong>Lead times that beat the OEM</div>
    <div><strong>From a photo</strong>Reverse engineered to fit</div>
    <div><strong>Inspected</strong>Shipped with documentation</div>
    <div><strong>Canadian built</strong>Shipped wherever you are</div>
  </div>
</section>
${p.about ? `
<section class="lp-sec lp-prose">
  <div class="wrap">${p.about.map(([h, blocks]) => `
    <h2 class="t">${esc(h)}</h2>${blocks.map(block).join('')}`).join('')}
  </div>
</section>
` : ''}
<section class="lp-sec">
  <div class="wrap">
    <h2 class="t">How it works</h2>
    <p class="lead">Three steps from broken gear to new gear.</p>
    <ol class="lp-steps">
      <li><strong>Send what you have</strong><span>Photos of the old gear, a drawing, or just the details you know. Call or fill in the form.</span></li>
      <li><strong>Get your quote</strong><span>Price and a firm ship date, usually back to you fast, with questions only if we need them.</span></li>
      <li><strong>We build and ship</strong><span>Machined, inspected and shipped with documentation. One person keeps you updated.</span></li>
    </ol>
  </div>
</section>

<section class="lp-sec paper">
  <div class="wrap">
    <h2 class="t">Real gears from our shop</h2>
    <p class="lead">Small precision gears to heavy industrial drives.</p>
    <div class="lp-gal">${p.gallery.map(([src, cap, alt]) => `<figure><img src="${src}" alt="${esc(alt || cap)}" loading="lazy"><figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div>
  </div>
</section>

<section class="lp-sec">
  <div class="wrap">
    <h2 class="t">What we make</h2>
    <div class="lp-two">
      <div><h3>Part types</h3><ul class="lp-list"><li>Herringbone (double-helical) gears</li><li>Pump jack reducer gears and pinions</li><li>Spur and helical gears</li><li>Planetary sun, planet and ring gears</li><li>Internal gears</li><li>Worms and threaded shafts</li><li>Splined gears and shafts</li><li>Sprockets and pinion shafts</li></ul></div>
      <div><h3>Why customers choose us</h3><ul class="lp-list"><li>Fast turnaround and expedite options</li><li>Hardened and ground, or pre-hard when speed matters</li><li>Single pieces to production runs</li><li>Inspected in-house, with documentation</li><li>Repeat orders get faster, tooling stays on file</li></ul></div>
    </div>
  </div>
</section>

<section class="lp-sec paper">
  <div class="wrap">
    <h2 class="t">Questions</h2>
    <div class="lp-faq">${faqOf(p).map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div>
</section>

<section class="lp-final">
  <div class="wrap">
    <h2>${p.finalH}</h2>
    <p>${p.finalP}</p>
    <div class="row">
      <a class="btn btn-dark" href="tel:${TEL}">&#9742; Call ${PHONE}</a>
      <a class="btn btn-line" href="#lpCard" data-scroll-form>Get a Quote Online</a>
    </div>
  </div>
</section>

${p.index ? `<nav class="lp-links" aria-label="More from Hotshot Gears"><div class="wrap"><a href="/">Home</a>${SEO.filter((s) => s !== p).map((s) => `<a href="/${s.slug}">${esc(s.crumb)}</a>`).join('')}<a href="/quote">Request a Quote</a></div></nav>\n` : ''}<footer class="lp-foot"><div class="wrap"><span>&copy; <span id="yr"></span> Hotshot Gears. Custom gears, built fast.</span><span><a href="mailto:hotshotgears@gmail.com">hotshotgears@gmail.com</a></span></div></footer>

<nav class="lp-bar" aria-label="Call or quote"><a class="call" href="tel:${TEL}">&#9742; Call</a><a class="quote" href="#lpCard" data-scroll-form>Get a Quote</a></nav>

<script>document.getElementById('yr').textContent = new Date().getFullYear();</script>
<script src="/js/track.js" defer></script>
<script type="module" src="/js/lp.js"></script>
</body>
</html>
`;
}

const out = path.join(__dirname, '..', 'lp');
fs.mkdirSync(out, { recursive: true });
for (const p of PAGES) {
  fs.writeFileSync(path.join(out, p.slug + '.html'), page(p));
  console.log('built lp/' + p.slug + '.html');
}
