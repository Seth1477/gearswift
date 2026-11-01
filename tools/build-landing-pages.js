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
  ['What kinds of gears do you make?', 'Spur, helical and double-helical (herringbone) gears, internal gears, worms and threaded shafts, splined gears and shafts, sprockets, and pinion shafts. If it transmits motion, send it over and we will tell you if we can make it.'],
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
  // Ads keep pointing at the three pages above.
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
    gallery: [['/img/work-herringbone.jpg', 'Herringbone gear and pinion shafts'], ['/img/replacement.jpg', 'Double-helical gear set'], ['/img/emergency.jpg', 'Double-helical gearbox']],
    about: [
      ['What is a herringbone gear?', [
        'A herringbone gear, also called a double-helical gear, has two sets of helical teeth angled in opposite directions, meeting in a V down the middle of the face. Each half pushes sideways against the other, so the axial thrust cancels out. That lets the gear carry high loads smoothly and quietly without heavy thrust bearings.',
        'That is why herringbone gears show up in the big, hard-working drives: mills, kilns, crushers, compressors, pumps, conveyors and large industrial gearboxes.',
      ]],
      ['Replacing a worn herringbone gear or pinion', [
        'Original drawings for older double-helical gearboxes are often long gone, and the OEM may quote months for a replacement, if they still make it at all. We measure your worn gear or pinion, work out the tooth data, including helix angle, hand, module or diametral pitch and centre distance, and build a replacement that meshes with the gear you keep.',
        'Send photos of the old part next to a ruler, with the outside diameter, face width, bore and tooth count, and we will come back with a price and a firm ship date.',
      ]],
    ],
    faq: [
      ['Can you replace just the pinion in a herringbone set?', 'Yes. We measure the mating gear so the new pinion matches its tooth geometry and runs at the right centre distance. If the gear is worn too, we will tell you before you order.'],
      ['Do you make double-helical gears with a centre groove?', 'Yes. Many double-helical gears have a gap between the two helices, and we build to whatever your gear or drawing calls for.'],
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
    gallery: [['/img/work-spur.jpg', 'Precision spur gear'], ['/img/production.jpg', 'Matched spur gear pair'], ['/img/work-spline.jpg', 'Spur gear with splined bore']],
    about: [
      ['Spur gears made to your spec', [
        'Spur gears have straight teeth cut parallel to the shaft. They are simple, efficient and the most common gear in machinery, from pumps and conveyors to transmissions, winches and gear reducers.',
        'We cut spur gears in metric module or diametral pitch, with whatever bore your shaft needs: plain, keyed, splined, or with a bolt pattern for a hub. Gear steels include 4140, 4340, 8620 and 9310, carburized and ground or through-hardened, and other materials on request.',
      ]],
      ['From one replacement gear to a production run', [
        'Need one gear to get a machine running? Send the old one, or photos with the outside diameter, tooth count, face width and bore. Building new equipment? Send the drawing and we will review it before anything gets cut.',
        'Once your gear is on file, reorders are faster because the tooling and CNC programs are already set up. Every order is inspected and can ship with a certificate of conformance, material certs and an inspection report.',
      ]],
    ],
    faq: [
      ['Do you cut metric and inch spur gears?', 'Yes. We make gears in metric module and in diametral pitch, and can tell which one your old gear is when we measure it.'],
      ['Can you put a spline or keyway in the bore?', 'Yes. Internal splines, keyways, set screws and bolt patterns are all common, and we match them to your shaft or hub.'],
    ],
    finalH: 'Need spur gears made?',
    finalP: 'Send a drawing or a few details and we will quote it fast.',
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

// Breadcrumb, Service and FAQ structured data for the search pages
function jsonld(p) {
  const url = `${SITE}/${p.slug}`;
  const graph = [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: p.crumb, item: url },
    ] },
    { '@type': 'Service', name: p.service, serviceType: p.service, url, description: p.desc,
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
  <div class="wrap">${p.about.map(([h, ps]) => `
    <h2 class="t">${esc(h)}</h2>${ps.map((t) => `
    <p>${esc(t)}</p>`).join('')}`).join('')}
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
    <div class="lp-gal">${p.gallery.map(([src, cap]) => `<figure><img src="${src}" alt="${esc(cap)}" loading="lazy"><figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div>
  </div>
</section>

<section class="lp-sec">
  <div class="wrap">
    <h2 class="t">What we make</h2>
    <div class="lp-two">
      <div><h3>Part types</h3><ul class="lp-list"><li>Spur gears</li><li>Helical and double-helical (herringbone) gears</li><li>Internal gears</li><li>Worms and threaded shafts</li><li>Splined gears and shafts</li><li>Sprockets and pinion shafts</li></ul></div>
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
