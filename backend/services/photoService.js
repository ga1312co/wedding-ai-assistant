// Lists the wedding photos in a public Google Drive folder.
// The list is cached in memory so the Drive API is hit at most once per CACHE_TTL_MS,
// and new uploads to the folder show up without a redeploy.

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const PHOTO_WIDTH = 2000; // px, long side served by Drive's resize endpoint
// "BILDER BRÖLLOP B&G" – public folder, override with DRIVE_FOLDER_ID
const DEFAULT_FOLDER_ID = '1h4UOy0rPhs6GV25S0tkimH15PObnN7Z-';

let cache = { photos: null, fetchedAt: 0 };

async function fetchFromDrive() {
  const apiKey = process.env.DRIVE_API_KEY;
  const folderId = process.env.DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;
  if (!apiKey) {
    throw new Error('DRIVE_API_KEY must be set');
  }

  const files = [];
  let pageToken;
  do {
    const params = new URLSearchParams({
      key: apiKey,
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'nextPageToken, files(id, name)',
      // Same order as Drive's "Name" sort: numbers compare as numbers, so -49a sits between -49 and -50
      orderBy: 'name_natural',
      pageSize: '1000'
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`${DRIVE_FILES_URL}?${params}`);
    if (!res.ok) {
      throw new Error(`Drive API ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    files.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files.map(f => ({
    id: f.id,
    url: `https://drive.google.com/thumbnail?id=${f.id}&sz=w${PHOTO_WIDTH}`
  }));
}

async function getPhotos() {
  if (cache.photos && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.photos;
  }
  try {
    const photos = await fetchFromDrive();
    cache = { photos, fetchedAt: Date.now() };
    return photos;
  } catch (err) {
    // Serve the last good list rather than nothing if Drive hiccups
    if (cache.photos) {
      console.error('Photo refresh failed, serving stale list:', err.message);
      return cache.photos;
    }
    throw err;
  }
}

module.exports = { getPhotos };
