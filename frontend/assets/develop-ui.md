# TV view: follow-up work outside `frontend/`

Instructions for a development agent. The new TV view (living-room scene, download and enlarge
buttons, rotate hint, music player) is implemented in `frontend/`. Nothing outside `frontend/`
was changed. The items below are what is left elsewhere, in priority order.

Nothing here is required for the page to render. Items 1 and 2 are checks that may turn into work.
Item 3 is already fixed.

## What was built (context)

- `frontend/index.html`, `frontend/styles/room.css`, `frontend/app.js`: the TV wall, controls,
  music button and music player.
- `frontend/assets/natteravn.mp3`: the song, played by `<audio id="song">` through the `Song`
  module in `app.js`. It replaced an earlier Spotify embed; nothing of that embed is left.
- `frontend/assets/tv-plant.svg`, `tv-candles.svg`, `tv-candlesticks.svg`, `tv-lamp.svg`,
  `tv-chair.svg`: new illustrations.
- `frontend/assets/sofa-back.svg`: redrawn. `app.js` zooms in on it so only the top of the cats'
  heads shows along the bottom 5% of the screen. The constants `HEAD_WIDTH` and `EAR_TOP` in
  `app.js` describe the heads in this file; change them together.
- `frontend/build.js`: now skips `.md` files, so this file is not published.
- Verified in a headless browser against a mock backend (`POST /login`, `GET /photos`) at
  1440x900, 1024x768, 768x1024, 390x844, 360x640 and 844x390. The song was tested with the real
  file (play, pause, seek, keeps playing while hidden). Not verified against the real backend,
  the real Drive folder, or a real phone.

## 1. Download button: verify, and add a backend route if it fails

**Now:** the download button links to
`https://drive.google.com/uc?export=download&id=<photo id>` and opens it in a new tab
(`updateDownload()` in `frontend/app.js`). This is untested against the real folder. The slides
themselves are Drive thumbnails on another origin, so the `download` attribute cannot be used.

**Check:** log in on the deployed site, open a photo, press download. Expected: the original
file downloads. Test on desktop Chrome, iOS Safari and Android Chrome.

**If Drive shows an interstitial page, an error, or opens the image instead of downloading**, add
a download route to the backend:

1. `backend/services/photoService.js`: keep the file name. `fetchFromDrive()` already requests
   `name`; return it in the mapped object (`{ id, name, url }`). Export a lookup,
   e.g. `getPhotoById(id)`, that reads from the cached list.
2. `backend/routes/photos.js`: add `GET /photos/:id/download`.
   - Reject ids that are not in the cached list with 404. Do not proxy arbitrary Drive ids.
   - Fetch `https://www.googleapis.com/drive/v3/files/<id>?alt=media&key=<DRIVE_API_KEY>`.
   - Stream the body to the response with the upstream `Content-Type` and
     `Content-Disposition: attachment; filename="<name>"`.
   - Pass errors to `next(err)` like the existing route.
3. `frontend/app.js`: change `updateDownload()` to
   `${BASE_URL}/photos/${encodeURIComponent(id)}/download` and drop `target="_blank"` from
   `#download-button` in `frontend/index.html`.
4. No CORS change is needed (plain navigation). No new env vars.

Deploying: a push to `main` that touches `backend/**` runs
`.github/workflows/deploy-backend.yml` (Cloud Run).

## 2. The song: verify on real devices, and decide how to ship the file

`frontend/assets/natteravn.mp3` is 9.6 MB (320 kbps, 3:59). On bigger landscape screens
(at least 900x600) the player sits on the speaker; elsewhere it drops down from the music button.

**Check on the deployed site:**

- **Hidden playback.** Start the song, hide the player (music button) and go back to Cleo. The
  song must keep playing. Confirm on iOS Safari and Android Chrome.
- **Seeking.** Drag the seek bar. This needs the host to answer HTTP range requests; the local
  `serve` dev server and the test server did, Firebase Hosting is untested.
- **Rotation.** Start the song in portrait, rotate to landscape and back. It must not restart.
  The player is one element that CSS repositions; do not move or re-create it in the DOM.

**Decisions for the site owner (do not act without asking):**

- The file is a commercial recording and everything under `/assets/` is served without login,
  so it is publicly downloadable once deployed. Whether to publish it is the owner's call.
- It adds 9.6 MB to the git history once committed. Re-encoding to about 128 kbps would bring
  it to roughly 3.8 MB if size matters (`ffmpeg -i natteravn.mp3 -b:a 128k out.mp3`).

No hosting change is needed today: `firebase.json` and `frontend/nginx.conf` set no
`Content-Security-Policy`. If one is added later it must allow `media-src 'self'`, plus `img-src`
entries for `https://drive.google.com` and whichever host the Drive thumbnails redirect to
(check the network tab).

## 3. `frontend/Dockerfile` did not copy `styles/` (fixed, not yet run)

`COPY styles ./styles` was added to `frontend/Dockerfile`; before that the Docker frontend was
unstyled. The image has not been built since. To confirm: `docker compose up --build frontend`
and open `http://localhost:3000`. Note that `docker-compose.yml` points to `backend/.env`, which
does not exist; only the root `.env` does.

## 4. Asset caching rule (Firebase)

`firebase.json` serves `/assets/**` with `Cache-Control: public, max-age=31536000, immutable`.
A changed file under `frontend/assets/` with an unchanged name will not reach returning visitors.

- `sofa-back.svg` was changed in place. It had never been committed, so no deployed copy exists
  and no rename is needed.
- From now on, give a changed asset a new file name and update its reference in
  `frontend/index.html` (and `HEAD_WIDTH` / `EAR_TOP` in `frontend/app.js` if it is the sofa back).

## 5. Git and deploy

- The work is on branch `dev_photos`, uncommitted. New files to add: `frontend/assets/tv-*.svg`,
  `frontend/assets/natteravn.mp3` (see item 2 first) and `frontend/assets/develop-ui.md`.
- A push to `main` that touches `frontend/**` deploys to Firebase Hosting
  (`.github/workflows/deploy-frontend.yml`).

## 6. Docs (optional)

`frontend/README.md` still describes the old chat UI (chat history, RSVP modal). The root
`README.md` photo section is still correct. Update `frontend/README.md` if it is meant to be read.
