const express = require('express');
const router = express.Router();
const { getPhotos } = require('../services/photoService');

router.get('/photos', async (_req, res, next) => {
  try {
    const photos = await getPhotos();
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ photos });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
