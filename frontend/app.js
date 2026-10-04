// Wedding photos - Vanilla JavaScript
(function() {
    'use strict';

    // In production, we use the environment-injected config or fall back to localhost for dev
    const BASE_URL = window.appConfig?.backendUrl || 'http://localhost:3001';

    const THANKS = 'Tack för att du kom på bröllopet!\nBea och Gabbe är så himla tacksamma.';
    const PYTTE_QUESTION = 'Vill du se på lite bilder?';
    const SLEEP_MESSAGE = 'Okej... då tar jag en tupplur. Zzz...';
    const PYTTE_DELAY_MS = 600; // pause after Cleo's thanks before Pytte asks
    // What Cleo says when the camera comes back from the TV, one at random (never the same twice in a row)
    const BACK_LINES = [
        'Fint, va?',
        'Mjaow!',
        'Visst var det en fin dag?',
        'Jag fällde nog en liten tår där. Eller så var det kattsand i ögat.',
        'Pytte somnade vid tredje bilden. Typiskt.',
        'Skriv gärna en hälsning till Bea och Gabbe, så ser jag till att de får den!'
    ];
    const SLIDE_INTERVAL_MS = 5000;
    const ORBIT_MS = 2400;
    const ROTATE_HINT_MS = 4000;

    // The cats' heads in assets/sofa-back.svg, as fractions of its 1024px frame
    const HEAD_WIDTH = 218 / 1024; // width of one head
    const EAR_TOP = 296 / 1024;    // top of the ear tips
    // Height of the ears plus a sliver of the head, as a fraction of the head's width
    const HEAD_PEEK_RATIO = 0.173;
    // Must match transform-origin on .sofa-card (50% 85%)
    const SOFA_ORIGIN_Y = 0.85;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const portraitTouch = window.matchMedia('(orientation: portrait) and (pointer: coarse)');

    let currentTypewriterTimeout = null;
    let photosPromise = null;
    let atTv = false;
    let rotateHintTimeout = null;
    let guestName = '';
    let lastBackLine = -1;

    // DOM Elements (will be initialized after DOM loads)
    let loginContainer, loginForm, lastNameInput, errorMessage, typewriterTitle;
    let room, backdrop, sofaScene, sofaCard, backButton;
    let enlargeButton, rotateHint, musicButton;
    let cleo, cleoBubble, cleoBubbleText, cleoImage;
    let pytteBubble, pytteBubbleText, choices, yesButton, noButton;

    function init() {
        loginContainer = document.getElementById('login-container');
        loginForm = document.getElementById('login-form');
        lastNameInput = document.getElementById('last-name');
        errorMessage = document.getElementById('error-message');
        typewriterTitle = document.getElementById('typewriter-title');
        room = document.getElementById('room');
        backdrop = document.getElementById('backdrop');
        sofaScene = document.getElementById('sofa-scene');
        sofaCard = document.getElementById('sofa-card');
        backButton = document.getElementById('back-button');
        enlargeButton = document.getElementById('enlarge-button');
        rotateHint = document.getElementById('rotate-hint');
        musicButton = document.getElementById('music-button');
        cleo = document.getElementById('cleo');
        cleoBubble = document.getElementById('cleo-bubble');
        cleoBubbleText = document.getElementById('cleo-bubble-text');
        cleoImage = document.getElementById('cleo-image');
        pytteBubble = document.getElementById('pytte-bubble');
        pytteBubbleText = document.getElementById('pytte-bubble-text');
        choices = document.getElementById('choices');
        yesButton = document.getElementById('yes-button');
        noButton = document.getElementById('no-button');

        loginForm.addEventListener('submit', handleLogin);
        yesButton.addEventListener('click', answerYes);
        noButton.addEventListener('click', answerNo);
        backButton.addEventListener('click', turnToCleo);
        enlargeButton.addEventListener('click', function() {
            setEnlarged(!room.classList.contains('tv-large'));
        });
        musicButton.addEventListener('click', function() {
            setMusicOpen(!room.classList.contains('music-open'));
        });
        document.addEventListener('keydown', function(e) {
            if (atTv && e.key === 'Escape') setEnlarged(false);
        });
        Slideshow.init();
        Song.init();
        Chat.init();

        // The rotate hint has done its job once the phone is turned
        portraitTouch.addEventListener('change', function(e) {
            if (!e.matches) rotateHint.classList.remove('visible');
        });

        // Keep the cats' heads at the bottom edge whatever the window does
        window.addEventListener('resize', updateBehindTransform);
        window.addEventListener('resize', placeCleoAbovePytte);
        sofaCard.querySelectorAll('img').forEach(function(img) {
            img.addEventListener('load', updateBehindTransform);
        });

        // Fade in login page once church image is loaded
        const churchImage = document.querySelector('.church-image');
        const formContainer = document.querySelector('.login-form-container');
        function showLogin() {
            if (formContainer) formContainer.classList.add('loaded');
            if (churchImage) churchImage.classList.add('loaded');
            typewriterEffect(typewriterTitle, 'Gabriel & Beata\n08.08.2026', 100);
        }
        function triggerFade() {
            // Delay one frame so the browser paints opacity:0 first
            requestAnimationFrame(function() {
                requestAnimationFrame(showLogin);
            });
        }
        if (churchImage) {
            if (churchImage.complete) {
                triggerFade();
            } else {
                churchImage.addEventListener('load', triggerFade);
                churchImage.addEventListener('error', triggerFade);
            }
        } else {
            triggerFade();
        }
    }

    // Typewriter effect
    function typewriterEffect(element, text, delay, onComplete) {
        cancelTypewriter();
        let index = 0;
        element.textContent = '';

        function type() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                currentTypewriterTimeout = setTimeout(type, delay);
            } else if (onComplete) {
                onComplete();
            }
        }
        type();
    }

    function cancelTypewriter() {
        if (currentTypewriterTimeout) {
            clearTimeout(currentTypewriterTimeout);
            currentTypewriterTimeout = null;
        }
    }

    // --- Login ---
    async function handleLogin(e) {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const lastName = lastNameInput.value.trim().slice(0, 100);
        if (!lastName) return;

        try {
            const response = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lastName })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            guestName = data.guestName || lastName;

            // Start fetching the photo list while Cleo talks
            photosPromise = fetchPhotos();

            loginContainer.style.display = 'none';
            room.hidden = false;
            updateBehindTransform();
            startConversation();

        } catch (err) {
            console.error('Login error:', err);
            errorMessage.textContent = err.message || 'Kunde inte ansluta till servern.';
            errorMessage.style.display = 'block';
        }
    }

    async function fetchPhotos() {
        const response = await fetch(`${BASE_URL}/photos`);
        if (!response.ok) throw new Error('Kunde inte hämta bilderna.');
        const data = await response.json();
        return data.photos || [];
    }

    // --- Cleo and Pytte ---
    // Cleo thanks the guest, then Pytte asks about the photos with Ja / Nej in his bubble.
    // Nej: Cleo naps. Either way the chat opens afterwards, with a button to the photos.
    function sayCleo(text, onComplete) {
        cleoBubble.classList.add('visible');
        typewriterEffect(cleoBubbleText, text, 45, onComplete);
    }

    function hideCleo() {
        cancelTypewriter();
        cleoBubble.classList.remove('visible');
    }

    function sayPytte(text, onComplete) {
        pytteBubble.classList.add('visible');
        typewriterEffect(pytteBubbleText, text, 45, onComplete);
    }

    function hidePytte() {
        pytteBubble.classList.remove('visible');
        choices.classList.remove('visible');
        cleoBubble.style.setProperty('--cleo-lift', '0px');
    }

    // Both cats talk at once: if Cleo's bubble would overlap Pytte's, lift it above (its tail stretches)
    function placeCleoAbovePytte() {
        if (!pytteBubble.classList.contains('visible')) return;
        const typed = pytteBubbleText.textContent;
        pytteBubbleText.textContent = PYTTE_QUESTION; // measure Pytte's bubble at its full size
        cleoBubble.style.setProperty('--cleo-lift', '0px');
        const c = cleoBubble.getBoundingClientRect();
        const p = pytteBubble.getBoundingClientRect();
        pytteBubbleText.textContent = typed;
        const overlapX = c.left < p.right + 8 && p.left < c.right + 8;
        const lift = overlapX ? Math.max(0, c.bottom - p.top + 12) : 0;
        cleoBubble.style.setProperty('--cleo-lift', `${Math.ceil(lift)}px`);
    }

    function setSleeping(sleeping) {
        Chat.state.isSleeping = sleeping;
        cleoImage.src = sleeping ? 'assets/cleosleeping.png' : 'assets/cleo.png';
        cleo.classList.toggle('sleeping', sleeping);
    }

    // Cleo's thanks stays up while Pytte asks
    function startConversation() {
        sayCleo(THANKS, function() {
            setTimeout(function() {
                sayPytte(PYTTE_QUESTION, function() {
                    choices.classList.add('visible');
                });
                placeCleoAbovePytte();
            }, PYTTE_DELAY_MS);
        });
    }

    function answerYes() {
        hidePytte();
        turnToTv();
    }

    function answerNo() {
        hidePytte();
        setSleeping(true);
        sayCleo(SLEEP_MESSAGE);
        Chat.open();
    }

    function nextBackLine() {
        let i;
        do {
            i = Math.floor(Math.random() * BACK_LINES.length);
        } while (i === lastBackLine && BACK_LINES.length > 1);
        lastBackLine = i;
        return BACK_LINES[i];
    }

    // --- Camera orbit ---
    // The sofa turns around its own axis while the room sweeps sideways, which reads as the
    // camera circling the sofa. The end state lives in CSS (.room.at-tv) so it survives resizes;
    // the animations only run between the two states.
    //
    // Behind the sofa the camera sits so close that only the top of the cats' heads is left, along
    // the bottom --cat-peek percent of the screen. That takes a zoom and a drop measured from the
    // sofa's actual size and position, so it is computed here and handed to CSS as --behind-transform.
    function updateBehindTransform() {
        const width = sofaCard.offsetWidth;
        const height = sofaCard.offsetHeight;
        if (!width || !height) return; // room still hidden, or the sofa image has not loaded yet

        const roomRect = room.getBoundingClientRect();
        const cardTop = sofaScene.getBoundingClientRect().top - roomRect.top + sofaCard.offsetTop;
        const peekPercent = parseFloat(getComputedStyle(room).getPropertyValue('--cat-peek')) || 5;
        const peek = roomRect.height * peekPercent / 100;

        // Big enough to show the ears and a sliver of head, but both heads must fit side by side
        const headWidth = Math.min(roomRect.width * 0.41, peek / HEAD_PEEK_RATIO);
        const scale = headWidth / (HEAD_WIDTH * width);
        const originY = SOFA_ORIGIN_Y * height;
        const drop = roomRect.height - peek - cardTop - originY - scale * (EAR_TOP * height - originY);

        room.style.setProperty('--behind-transform',
            `translateY(${drop.toFixed(1)}px) scale(${scale.toFixed(4)}) rotateY(180deg)`);
    }

    function orbit(toTv) {
        updateBehindTransform();
        room.classList.add('orbiting');
        const options = {
            duration: reduceMotion ? 0 : ORBIT_MS,
            easing: 'ease-in-out',
            fill: 'forwards'
        };
        const behind = getComputedStyle(room).getPropertyValue('--behind-transform').trim();
        const front = 'translateY(0%) scale(1) rotateY(0deg)';
        const animations = [
            sofaCard.animate({ transform: toTv ? [front, behind] : [behind, front] }, options),
            backdrop.animate({ transform: toTv
                ? ['translateX(0vw)', 'translateX(-200vw)']
                : ['translateX(-200vw)', 'translateX(0vw)'] }, options)
        ];
        return Promise.all(animations.map(function(a) { return a.finished; })).then(function() {
            room.classList.toggle('at-tv', toTv);
            room.classList.remove('orbiting');
            animations.forEach(function(a) { a.cancel(); });
        });
    }

    async function turnToTv() {
        hidePytte();
        hideCleo();
        Chat.hideHistory();
        Slideshow.load(photosPromise || (photosPromise = fetchPhotos()));

        await orbit(true);
        atTv = true;
        setTvUi(true);
        Slideshow.play();
    }

    async function turnToCleo() {
        atTv = false;
        setTvUi(false);
        Slideshow.pause();

        await orbit(false);
        // Coming back from the photos wakes her if she was napping (unless she is done for the day)
        if (Chat.state.isSleeping && !Chat.state.rateLimitReached) setSleeping(false);
        sayCleo(nextBackLine());
        Chat.open();
    }

    // --- Around the TV: back and music buttons, enlarge, rotate hint ---
    // The music player is only hidden, never stopped, so the song keeps playing when the
    // player is tucked away or the camera turns back to Cleo.
    function setTvUi(on) {
        backButton.hidden = !on;
        musicButton.hidden = !on;
        room.classList.toggle('tv-on', on);
        if (!on) {
            setEnlarged(false);
            setMusicOpen(false);
        }
    }

    function setEnlarged(large) {
        room.classList.toggle('tv-large', large);
        enlargeButton.setAttribute('aria-pressed', String(large));
        enlargeButton.setAttribute('aria-label', large ? 'Förminska' : 'Förstora');

        // On a phone held upright the TV cannot get much bigger: suggest turning the phone
        clearTimeout(rotateHintTimeout);
        const showHint = large && portraitTouch.matches;
        rotateHint.classList.toggle('visible', showHint);
        if (showHint) {
            rotateHintTimeout = setTimeout(function() {
                rotateHint.classList.remove('visible');
            }, ROTATE_HINT_MS);
        }
    }

    function setMusicOpen(open) {
        room.classList.toggle('music-open', open);
        musicButton.setAttribute('aria-expanded', String(open));
        musicButton.setAttribute('aria-label', open ? 'Dölj musikspelaren' : 'Visa musikspelaren');
    }

    // --- Slideshow on the TV ---
    const Slideshow = (function() {
        let photos = [];
        let index = 0;
        let timer = null;
        let playing = false;
        let shownSlide = 0;
        let screen, slides, message, counter, playButton, downloadButton, controlsTimeout;

        function init() {
            screen = document.getElementById('tv-screen');
            slides = screen.querySelectorAll('.slide');
            message = document.getElementById('tv-message');
            counter = document.getElementById('tv-counter');
            playButton = document.getElementById('play-button');
            downloadButton = document.getElementById('download-button');

            document.getElementById('prev-button').addEventListener('click', function() { step(-1); });
            document.getElementById('next-button').addEventListener('click', function() { step(1); });
            playButton.addEventListener('click', function() {
                playing ? pause() : play();
            });

            document.addEventListener('keydown', function(e) {
                if (!atTv) return;
                // Leave the keys alone while a control has focus (space on a button, arrows on the song's seek bar)
                if (e.target.closest && e.target.closest('button, a, input')) return;
                if (e.key === 'ArrowLeft') step(-1);
                if (e.key === 'ArrowRight') step(1);
                if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); }
            });

            // Swipe on touch screens; a tap shows the controls for a while
            let touchX = null;
            screen.addEventListener('touchstart', function(e) {
                touchX = e.touches[0].clientX;
            }, { passive: true });
            screen.addEventListener('touchend', function(e) {
                if (touchX === null) return;
                const dx = e.changedTouches[0].clientX - touchX;
                touchX = null;
                if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
                screen.classList.add('show-controls');
                clearTimeout(controlsTimeout);
                controlsTimeout = setTimeout(function() {
                    screen.classList.remove('show-controls');
                }, 3000);
            });
        }

        async function load(promise) {
            if (photos.length) return;
            try {
                photos = await promise;
            } catch (err) {
                console.error('Photo list error:', err);
                photosPromise = null; // allow a retry on the next turn
                message.textContent = 'Kunde inte hämta bilderna just nu. Försök igen om en stund!';
                return;
            }
            if (!photos.length) {
                message.textContent = 'Inga bilder här än – kom tillbaka snart!';
                return;
            }
            show(0);
        }

        // Crossfade to photo i once it has loaded; skip photos that fail to load
        function show(i) {
            index = (i + photos.length) % photos.length;
            const requested = index;
            const next = slides[1 - shownSlide];

            next.onload = function() {
                if (requested !== index) return;
                message.textContent = '';
                slides[shownSlide].classList.remove('active');
                next.classList.add('active');
                shownSlide = 1 - shownSlide;
                updateCounter();
                updateDownload();
                preload(index + 1);
                scheduleNext();
            };
            next.onerror = function() {
                if (requested !== index) return;
                console.warn('Could not load photo', photos[requested].id);
                photos.splice(requested, 1);
                if (photos.length) {
                    show(requested);
                } else {
                    message.textContent = 'Kunde inte visa bilderna just nu.';
                }
            };
            next.src = photos[index].url;
        }

        function preload(i) {
            const photo = photos[i % photos.length];
            if (photo) new Image().src = photo.url;
        }

        function updateCounter() {
            counter.textContent = `${index + 1} / ${photos.length}`;
        }

        // The slides are resized previews on another origin, where the browser ignores the download
        // attribute. Link to Drive's own download of the original file instead (opens in a new tab).
        function updateDownload() {
            downloadButton.href =
                `https://drive.google.com/uc?export=download&id=${encodeURIComponent(photos[index].id)}`;
            downloadButton.hidden = false;
        }

        function step(direction) {
            if (!photos.length) return;
            show(index + direction);
        }

        function scheduleNext() {
            clearTimeout(timer);
            if (playing) timer = setTimeout(function() { step(1); }, SLIDE_INTERVAL_MS);
        }

        function play() {
            playing = true;
            playButton.classList.remove('paused');
            playButton.setAttribute('aria-label', 'Pausa');
            scheduleNext();
        }

        function pause() {
            playing = false;
            clearTimeout(timer);
            playButton.classList.add('paused');
            playButton.setAttribute('aria-label', 'Spela');
        }

        return { init, load, play, pause };
    })();

    // --- The song on the speaker (or behind the music button on phones) ---
    const Song = (function() {
        let audio, player, toggle, seek, time;

        function init() {
            audio = document.getElementById('song');
            player = document.getElementById('music-player');
            toggle = document.getElementById('song-toggle');
            seek = document.getElementById('song-seek');
            time = document.getElementById('song-time');

            toggle.addEventListener('click', function() {
                if (audio.paused) {
                    audio.play().catch(function(err) { console.error('Could not play the song:', err); });
                } else {
                    audio.pause();
                }
            });
            seek.addEventListener('input', function() {
                audio.currentTime = Number(seek.value);
            });

            audio.addEventListener('play', function() { setPlaying(true); });
            audio.addEventListener('pause', function() { setPlaying(false); });
            audio.addEventListener('ended', function() { audio.currentTime = 0; });
            audio.addEventListener('loadedmetadata', update);
            audio.addEventListener('timeupdate', update);
        }

        function setPlaying(playing) {
            player.classList.toggle('playing', playing);
            toggle.setAttribute('aria-label', playing ? 'Pausa musiken' : 'Spela musiken');
        }

        function update() {
            if (Number.isFinite(audio.duration)) seek.max = Math.floor(audio.duration);
            seek.value = Math.floor(audio.currentTime);
            time.textContent = format(audio.currentTime);
        }

        function format(seconds) {
            const s = Math.floor(seconds);
            return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        }

        return { init };
    })();

    // --- Chat with Cleo (Gemini on the backend, logged to a Google Sheet there) ---
    const Chat = (function() {
        const state = {
            messages: [],
            sessionId: null,
            isSleeping: false,
            rateLimitReached: false,
            sleepRequested: false
        };
        let form, input, userBubble, userBubbleContent, historyButton, photosButton;
        let historyDialog, historyMessages;

        function init() {
            state.sessionId = getOrCreateSessionId();
            form = document.getElementById('chat-form');
            input = document.getElementById('chat-input');
            userBubble = document.getElementById('user-bubble');
            userBubbleContent = document.getElementById('user-bubble-content');
            historyButton = document.getElementById('history-button');
            photosButton = document.getElementById('photos-button');
            historyDialog = document.getElementById('chat-history');
            historyMessages = document.getElementById('history-messages');

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleSendMessage();
            });
            historyButton.addEventListener('click', showHistory);
            document.getElementById('chat-history-close').addEventListener('click', hideHistory);
            historyDialog.addEventListener('click', function(e) {
                if (e.target === historyDialog) hideHistory();
            });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') hideHistory();
            });
            // The chat stays open (CSS hides it at the TV) so the sofa does not move under the orbit
            photosButton.addEventListener('click', turnToTv);
        }

        // Session ID persists during the tab session using sessionStorage
        function getOrCreateSessionId() {
            let id = null;
            try { id = sessionStorage.getItem('weddingAssistantSessionId'); } catch (e) { /* storage blocked */ }
            if (!id) {
                id = 'sess_' + Math.random().toString(16).slice(2) + Date.now().toString(36);
                try { sessionStorage.setItem('weddingAssistantSessionId', id); } catch (e) { /* storage blocked */ }
            }
            return id;
        }

        function open() {
            room.classList.add('chatting');
        }

        async function handleSendMessage() {
            const text = input.value.trim();
            if (text === '') return;
            const raw = text.toLowerCase();

            // If Cleo previously asked to sleep and the guest answers yes
            if (state.sleepRequested && !state.isSleeping && !state.rateLimitReached) {
                const affirmativeTokenRegex = /\b(ja|japp|ok|okej|okay|yes|sure|absolut|gärna|visst|kör|gör det|låter bra|ta en tupplur|ta tupplur|sov)\b/i;
                const negativeRegex = /\b(nej|inte|ej|vill inte|no|nope)\b/i;
                state.sleepRequested = false;
                if (affirmativeTokenRegex.test(raw) && !negativeRegex.test(raw)) {
                    fallAsleep(text);
                    return;
                }
            }

            // Manual sleep command
            if (raw === 'sov' && !state.isSleeping && !state.rateLimitReached) {
                state.sleepRequested = false;
                fallAsleep(text);
                return;
            }

            // Writing to Cleo wakes her up
            if (state.isSleeping && !state.rateLimitReached) {
                setSleeping(false);
            }

            addMessage(text, 'user');
            showUserBubble(text);
            input.value = '';

            if (state.rateLimitReached) return;

            sayCleo('...');
            try {
                const response = await sendMessageToApi(text);
                const botText = response.text;
                addMessage(botText, 'model');
                if (!atTv) sayCleo(botText);

                // Detect if Cleo is asking permission to sleep
                if (!state.isSleeping && !state.rateLimitReached) {
                    const sleepPromptRegex = /(tupplur|får jag.*sova|kan jag.*sova|ska jag.*sova|sova nu|får jag ta en liten tupplur|får jag vila)/i;
                    state.sleepRequested = sleepPromptRegex.test(botText);
                }
            } catch (error) {
                console.error('Error sending message:', error);
                let serverMsg;
                if (error.status === 429) {
                    state.rateLimitReached = true;
                    state.sleepRequested = false;
                    setSleeping(true);
                    serverMsg = error.message || 'Du har nått gränsen för idag. Jag sover nu.';
                } else {
                    serverMsg = 'Mjau... jag hörde inte riktigt. Försök igen om en stund!';
                }
                addMessage(serverMsg, 'model');
                if (!atTv) sayCleo(serverMsg);
            }
        }

        function fallAsleep(text) {
            setSleeping(true);
            addMessage(text, 'user');
            addMessage('Zzz...', 'model');
            showUserBubble(text);
            sayCleo('Zzz...');
            input.value = '';
        }

        function addMessage(text, sender) {
            state.messages.push({ text: text, sender: sender });
            historyButton.hidden = false;
        }

        // API call with retry logic
        async function sendMessageToApi(message) {
            const formattedHistory = state.messages.slice(0, -1).map(function(msg) {
                return { role: msg.sender === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] };
            });

            const maxAttempts = 3;
            let attempt = 0;
            let lastErr;

            while (attempt < maxAttempts) {
                try {
                    const response = await fetch(`${BASE_URL}/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message,
                            history: formattedHistory,
                            sessionId: state.sessionId,
                            guestName
                        })
                    });

                    if (!response.ok) {
                        const data = await response.json().catch(() => ({}));
                        const err = new Error(data.message || 'Request failed');
                        err.status = response.status;
                        throw err;
                    }

                    return await response.json();
                } catch (err) {
                    lastErr = err;
                    attempt++;
                    // A rate limit will not go away by retrying
                    if (err.status === 429 || attempt >= maxAttempts) break;
                    // Exponential backoff: 300ms, 600ms
                    await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt - 1)));
                }
            }
            throw lastErr;
        }

        function showUserBubble(text) {
            userBubbleContent.innerHTML = sanitizeAndLinkify(text);
            userBubble.classList.add('visible');
        }

        function showHistory() {
            historyMessages.innerHTML = '';
            state.messages.forEach(function(msg) {
                const div = document.createElement('div');
                div.className = 'history-message ' + msg.sender;
                div.innerHTML = sanitizeAndLinkify(msg.text);
                historyMessages.appendChild(div);
            });
            historyDialog.hidden = false;
            historyMessages.scrollTop = historyMessages.scrollHeight;
        }

        function hideHistory() {
            historyDialog.hidden = true;
        }

        // Escape everything, then turn [text](url) and plain URLs into links
        function sanitizeAndLinkify(text) {
            if (!text) return '';
            let content = escapeHtml(text);

            content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function(_m, label, url) {
                return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' +
                       (label === url ? url : label) + '</a>';
            });

            // Set existing anchors aside so they are not linkified twice
            const anchorTokens = [];
            content = content.replace(/<a\b[^>]*>.*?<\/a>/gi, function(m) {
                const token = '__ANCHOR_' + anchorTokens.length + '__';
                anchorTokens.push(m);
                return token;
            });

            content = content.replace(/(https?:\/\/[^\s)<>"']+)/g, function(url) {
                return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
            });

            anchorTokens.forEach(function(a, i) {
                content = content.replace('__ANCHOR_' + i + '__', a);
            });
            return content;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        return { init, open, hideHistory, state };
    })();

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
