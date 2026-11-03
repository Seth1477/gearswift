// Shared header (with the page menu) and footer for every page on the site.
// build-landing-pages.js uses these for /lp pages and also writes them into
// index.html and quote.html between the <!-- site-header --> / <!-- site-footer --> markers.
const PHONE = '825-777-2483';
const TEL = '+18257772483';

const MENU = [
  ['Gears', [
    ['/herringbone-gears', 'Herringbone gears'],
    ['/pump-jack-gears', 'Pump jack gears'],
    ['/spur-gears', 'Spur gears'],
    ['/planetary-gears', 'Planetary gears'],
  ]],
  ['Services', [
    ['/replacement-gears', 'Replacement gears'],
    ['/custom-gears', 'Custom gears'],
    ['/gear-reverse-engineering', 'Gear reverse engineering'],
    ['/urgent-gear-replacement', 'Urgent gear replacement'],
    ['/gear-manufacturer-alberta', 'Gear manufacturer in Alberta'],
  ]],
];

const link = (cur) => ([href, text]) => `<a href="${href}"${href === cur ? ' aria-current="page"' : ''}>${text}</a>`;

// cur: this page's path, e.g. '/spur-gears'. quoteHref/quoteAttr let ad pages scroll to their own form.
function header(cur, { quoteHref = '/quote', quoteAttr = '' } = {}) {
  return `<!-- site-header -->
<div class="strip">
  <div class="wrap">
    <div><span class="maple">&#9670;</span>Canadian-built custom gears. Fast turnaround.</div>
    <div class="strip-contact"><a class="phone" href="tel:${TEL}">${PHONE}</a><a class="contact" href="mailto:hotshotgears@gmail.com">hotshotgears@gmail.com</a></div>
  </div>
</div>

<header class="site-header">
  <div class="wrap">
    <div class="hd-left">
      <details class="menu">
        <summary aria-label="Open the site menu"><span class="burger" aria-hidden="true"><i></i><i></i><i></i></span><span class="menu-word">Menu</span></summary>
        <nav class="menu-panel" aria-label="Site pages">
          ${link(cur)(['/', 'Home'])}
          ${MENU.map(([h, items]) => `<div class="menu-group"><span class="menu-h">${h}</span>${items.map(link(cur)).join('')}</div>`).join('\n          ')}
          <a class="btn btn-red" href="/quote">Request a Quote</a>
        </nav>
      </details>
      <a href="/" class="logo" aria-label="Hotshot Gears home"><img src="/img/logo/hs-mark.svg" alt="" width="48" height="48"><span class="logo-word">Hotshot<b>Gears</b></span></a>
    </div>
    <div class="hd-right">
      <a class="hd-phone" href="tel:${TEL}"><small>Call now</small>${PHONE}</a>
      <a href="${quoteHref}" class="btn btn-red"${quoteAttr}>Get a Quote</a>
    </div>
  </div>
</header>
<script>
document.addEventListener('click', function (e) { document.querySelectorAll('details.menu[open]').forEach(function (d) { if (!d.contains(e.target) || e.target.closest('.menu-panel a')) d.open = false; }); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('details.menu[open]').forEach(function (d) { d.open = false; }); });
</script>
<!-- /site-header -->`;
}

function footer(cur) {
  return `<!-- site-footer -->
<footer class="site-footer">
  <div class="wrap">
    <div class="cols">
      <div>
        <a href="/" class="logo" aria-label="Hotshot Gears home"><img src="/img/logo/hs-mark-dark.svg" alt="" width="48" height="48"><span class="logo-word">Hotshot<b>Gears</b></span></a>
        <p style="max-width:340px">Herringbone, spur and planetary gears, pump jack gearbox gears, and custom replacement gears. Built in Leduc, Alberta, near Edmonton. Shipped across Canada.</p>
      </div>
      ${MENU.map(([h, items]) => `<div>
        <h4>${h}</h4>
        <ul>${items.map((it) => `<li>${link(cur)(it)}</li>`).join('')}</ul>
      </div>`).join('\n      ')}
      <div>
        <h4>Contact</h4>
        <ul>
          <li><a href="tel:${TEL}">${PHONE}</a></li>
          <li><a href="mailto:hotshotgears@gmail.com">hotshotgears@gmail.com</a></li>
          <li><a href="/quote">Request a quote</a></li>
          <li>Shipping across Canada and North America</li>
        </ul>
      </div>
    </div>
    <div class="legal">
      <span>&copy; <span class="yr"></span> Hotshot Gears. All rights reserved.</span>
      <span>Canadian built. Fast turnaround.</span>
    </div>
  </div>
</footer>
<script>document.querySelectorAll('.yr').forEach(function (e) { e.textContent = new Date().getFullYear(); });</script>
<!-- /site-footer -->`;
}

module.exports = { header, footer };
