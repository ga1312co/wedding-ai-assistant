const fs = require('fs');
const path = require('path');

const weddingDataPath = path.join(__dirname, '../wedding_data.json');

const getWeddingData = () => {
  const weddingData = JSON.parse(fs.readFileSync(weddingDataPath, 'utf8'));
  return weddingData;
};

module.exports = { getWeddingData };
