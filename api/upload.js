// Issues short-lived tokens so the browser can upload drawings/photos straight to
// Vercel Blob. This bypasses the 4.5 MB request limit on serverless functions.
const { handleUpload } = require('@vercel/blob/client');

const MAX_FILE_BYTES = 25 * 1024 * 1024;

// CAD formats usually arrive as application/octet-stream, so that has to be allowed.
const ALLOWED_TYPES = [
  'image/*',
  'application/pdf',
  'application/octet-stream',
  'application/zip',
  'application/x-zip-compressed',
  'application/acad',
  'application/dxf',
  'image/vnd.dxf',
  'image/vnd.dwg',
  'model/step',
  'model/iges',
  'application/step',
  'application/iges',
  'application/sla',
  'model/stl',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
