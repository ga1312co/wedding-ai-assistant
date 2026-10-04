const { getWeddingData } = require('../services/weddingDataService');

// Planning details that no longer apply now that the wedding is over, and contact details
// that the chat should not hand out
const EXCLUDED_KEYS = new Set([
  'rsvp_info',
  'rsvp_deadline',
  'rsvp_form_help',
  'rsvp_link',
  'plus_one_policy',
  'children_policy',
  'payment_info',
  'toastmaster_casper_contact',
  'toastmaster_elsa_contact'
]);

const buildWeddingContext = () => {
  const weddingData = getWeddingData();
  let context = "";
  for (const key in weddingData) {
    if (EXCLUDED_KEYS.has(key)) continue;
    context += `${key.replace(/_/g, " ")}: ${weddingData[key]}.
`;
  }
  return context;
};

module.exports = { buildWeddingContext };
