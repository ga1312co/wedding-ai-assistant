const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_URL;

/**
 * Log a chat interaction to Google Sheets via Apps Script webhook
 * This function is async and non-blocking - failures are logged but don't affect the user experience
 * 
 * @param {string} sessionId - The user's session ID
 * @param {string} question - The user's question
 * @param {string} response - The AI's response
 */
const logToGoogleSheet = async (sessionId, question, response) => {
  try {
    const payload = {
      sessionId,
      question,
      response
    };

    const fetchResponse = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!fetchResponse.ok) {
      console.warn(`Google Sheet logging failed with status: ${fetchResponse.status}`);
    } else {
      const result = await fetchResponse.json();
      if (result.result !== 'success') {
        console.warn('Google Sheet logging returned error:', result.error);
      }
    }
  } catch (error) {
    // Log the error but don't throw - we don't want logging failures to affect user experience
    console.warn('Failed to log to Google Sheet:', error.message);
  }
};

module.exports = { logToGoogleSheet };
