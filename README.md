# WEDDING AI ASSISTANT 🐈🐈‍⬛

<img src="frontend/src/assets/cleosleeping.png" alt="Cleo sleeping" width="400"/>

### TO RUN: USE .ENV IN ROOT WITH:
- LOGIN_PASSWORD:XXX
- GEMINI_API_KEY:XXX

**AND**
- Clone project 
- Docker compose / node index.js for backend 🐳
- NPM Run for frontend 🏃

### DEPLOYMENT
#### BACKEND - GOOGLE CLOUD RUN ☁️☁️☁️
#### FRONTEND - FIREBASE 🔥🔥🔥

### Known Issues and Future Improvements

*   **In-Memory Storage:** The backend uses in-memory storage for chat sessions and rate limiting. This is not suitable for production and should be replaced with a persistent data store like Redis. I opted against this as very few people will use this page.
*   **Insecure Authentication:** The current authentication is a single shared password. This should be replaced with a more secure mechanism for 'serious' production. To allow for not-so-tech-savvy grandparents - the single shared password will do.
*   **RSVP Form Backend:** The RSVP form on the frontend does not have a backend to store the data. A backend endpoint and a database should be implemented for an enterprise. Here I used google forms.
*   **Frontend State Management:** The frontend's state management can be improved by using a more robust solution like React's Context API to handle the login state.
