// Google Ads conversion tracking for Hotshot Gears.
//
// Nothing loads or fires until you fill in the three values below. Once the Google Ads
// conversion actions exist, paste in the IDs and push to GitHub (Vercel redeploys on its own).
//
//   GOOGLE_TAG_ID    e.g. 'AW-1234567890'  (Google Ads > Goals > Conversions > Tag setup)
//   QUOTE_LABEL      e.g. 'AbCdEfGhIjKl'   (the label from the "Quote request" conversion's event snippet)
//   CALL_LABEL       e.g. 'MnOpQrStUvWx'   (the label from a "Click to call" website conversion, optional)
//
// Phone calls from the ad itself (the call button in the ad) are tracked by Google with no code.
// CALL_LABEL is only for people who tap the phone number on this website.
const GOOGLE_TAG_ID = '';
const QUOTE_LABEL = '';
const CALL_LABEL = '';

(function () {
  if (!GOOGLE_TAG_ID) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GOOGLE_TAG_ID);

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GOOGLE_TAG_ID);
  document.head.appendChild(s);

  function fire(label, extra) {
    if (!label || !window.gtag) return;
    window.gtag('event', 'conversion', Object.assign({ send_to: GOOGLE_TAG_ID + '/' + label }, extra || {}));
  }

  // Called by the quote form when a request has gone through.
  window.hotshotTrackQuote = function (ref) {
    fire(QUOTE_LABEL, { transaction_id: ref || '' });
  };

  // Taps on any phone number link on the site.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (a) fire(CALL_LABEL);
  });
})();
