// Reference numbers: GQ-YYYYMMDD-NNN, counting up per day (Toronto time).
// The daily count lives in Vercel Blob. Writes use the blob's ETag (ifMatch) so two
// quotes arriving at the same moment can't get the same number; the loser retries.
const { get, put, BlobPreconditionFailedError } = require('@vercel/blob');

const TZ = 'America/Toronto';
const MAX_TRIES = 8;

function ymd(date = new Date()) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(date)
    .replace(/-/g, '');
}

const format = (day, n) => `GQ-${day}-${String(n).padStart(3, '0')}`;

async function nextRef(now = new Date()) {
  const day = ymd(now);
  const path = `counters/quotes-${day}.txt`;

  try {
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      const current = await get(path, { access: 'public', useCache: false });
      let count = 0;
      let etag;
      if (current && current.statusCode === 200) {
        count = parseInt(await new Response(current.stream).text(), 10) || 0;
        etag = current.blob.etag;
      }

      try {
        await put(path, String(count + 1), {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'text/plain',
          cacheControlMaxAge: 60,
          // First quote of the day: fail if someone else created the file first.
          ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
        });
        return format(day, count + 1);
      } catch (err) {
        const lostRace = err instanceof BlobPreconditionFailedError || /already exists/i.test(err.message || '');
        if (!lostRace) throw err;
        await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));
      }
    }
    throw new Error('counter contention');
  } catch (err) {
    // Never lose a quote over numbering. 9xx marks a number that didn't come from the counter.
    console.error('ref counter failed, using fallback', err);
    return format(day, 900 + Math.floor(Math.random() * 100));
  }
}

module.exports = { nextRef, ymd };
