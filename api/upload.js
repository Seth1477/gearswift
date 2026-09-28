// Issues short-lived tokens so the browser can upload drawings/photos straight to
// Vercel Blob. This bypasses the 4.5 MB request limit on serverless functions.
const { handleUpload } = require('@vercel/blob/client');

const MAX_FILE_BYTES = 25 * 1024 * 1024;

// jpg, png, heic, pdf, dwg, dxf, step. Browsers often report CAD files and HEIC photos as
// application/octet-stream (or nothing), so that has to be allowed too.
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/octet-stream',
  'application/acad',
  'image/vnd.dwg',
  'application/dxf',
  'image/vnd.dxf',
  'model/step',
  'application/step',
  'application/x-step',
];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('quotes/')) throw new Error('Invalid upload path');
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_FILE_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error('upload token error', err);
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }
};
