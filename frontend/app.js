// Wedding photos - Vanilla JavaScript
(function() {
    'use strict';

    // In production, we use the environment-injected config or fall back to localhost for dev
    const BASE_URL = window.appConfig?.backendUrl || 'http://localhost:3001';

    const QUESTION = 'Tack för att du kom på bröllopet!\nVill du se på lite bilder?';
    const SLEEP_MESSAGE = 'Okej! Då tar jag en tupplur.\nVäck mig om du ändrar dig. Zzz...';
    const SLIDE_INTERVAL_MS = 5000;
    const ORBIT_MS = 2400;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let currentTypewriterTimeout = null;
    let photosPromise = null;
    let atTv = false;

    // DOM Elements (will be initialized after DOM loads)
    let loginContainer, loginForm, lastNameInput, errorMessage, typewriterTitle;
    let room, backdrop, sofaCard, backButton;
    let cleo, cleoBubble, cleoBubbleText, cleoImage, choices, yesButton, noButton, wakeButton;

    function init() {
        loginContainer = document.getElementById('login-container');
        loginForm = document.getElementById('login-form');
        lastNameInput = document.getElementById('last-name');
        errorMessage = document.getElementById('error-message');
        typewriterTitle = document.getElementById('typewriter-title');
        room = document.getElementById('room');
        backdrop = document.getElementById('backdrop');
        sofaCard = document.getElementById('sofa-card');
        backButton = document.getElementById('back-button');
        cleo = document.getElementById('cleo');
        cleoBubble = document.getElementById('cleo-bubble');
        cleoBubbleText = document.getElementById('cleo-bubble-text');
        cleoImage = document.getElementById('cleo-image');
        choices = document.getElementById('choices');
        yesButton = document.getElementById('yes-button');
        noButton = document.getElementById('no-button');
        wakeButton = document.getElementById('wake-button');

        loginForm.addEventListener('submit', handleLogin);
        yesButton.addEventListener('click', turnToTv);
        noButton.addEventListener('click', goToSleep);
        wakeButton.addEventListener('click', wakeUp);
        backButton.addEventListener('click', turnToCleo);
        Slideshow.init();

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

            // Start fetching the photo list while Cleo talks
            photosPromise = fetchPhotos();

            loginContainer.style.display = 'none';
            room.hidden = false;
            askQuestion();

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

    // --- Cleo ---
    function sayCleo(text, onComplete) {
        cleoBubble.classList.add('visible');
        typewriterEffect(cleoBubbleText, text, 45, onComplete);
    }

    function showChoices(buttons) {
        [yesButton, noButton, wakeButton].forEach(function(b) {
            b.hidden = !buttons.includes(b);
        });
        choices.classList.add('visible');
    }

    function hideChoices() {
        choices.classList.remove('visible');
    }

    function setSleeping(sleeping) {
        cleoImage.src = sleeping ? 'assets/cleosleeping.png' : 'assets/cleo.png';
        cleo.classList.toggle('sleeping', sleeping);
    }

    function askQuestion() {
        hideChoices();
        sayCleo(QUESTION, function() {
            showChoices([yesButton, noButton]);
        });
    }

    function goToSleep() {
        hideChoices();
        setSleeping(true);
        sayCleo(SLEEP_MESSAGE, function() {
            showChoices([wakeButton]);
        });
    }

    function wakeUp() {
        setSleeping(false);
        askQuestion();
    }

    // --- Camera orbit ---
    // The sofa turns around its own axis while the room sweeps sideways, which reads as the
    // camera circling the sofa. The end state lives in CSS (.room.at-tv) so it survives resizes;
    // the animations only run between the two states.
    function orbit(toTv) {
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
            animations.forEach(function(a) { a.cancel(); });
        });
    }

    async function turnToTv() {
        hideChoices();
        cleoBubble.classList.remove('visible');
        Slideshow.load(photosPromise || (photosPromise = fetchPhotos()));

        await orbit(true);
        atTv = true;
        backButton.hidden = false;
        Slideshow.play();
    }

    async function turnToCleo() {
        atTv = false;
        backButton.hidden = true;
        Slideshow.pause();

        await orbit(false);
        askQuestion();
    }

    // --- Slideshow on the TV ---
    const Slideshow = (function() {
        let photos = [];
        let index = 0;
        let timer = null;
        let playing = false;
        let shownSlide = 0;
        let screen, slides, message, counter, playButton, controlsTimeout;

        function init() {
            screen = document.getElementById('tv-screen');
            slides = screen.querySelectorAll('.slide');
            message = document.getElementById('tv-message');
            counter = document.getElementById('tv-counter');
            playButton = document.getElementById('play-button');

            document.getElementById('prev-button').addEventListener('click', function() { step(-1); });
            document.getElementById('next-button').addEventListener('click', function() { step(1); });
            playButton.addEventListener('click', function() {
                playing ? pause() : play();
            });

            document.addEventListener('keydown', function(e) {
                if (!atTv) return;
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
            playButton.textContent = '❚❚';
            playButton.setAttribute('aria-label', 'Pausa');
            scheduleNext();
        }

        function pause() {
            playing = false;
            clearTimeout(timer);
            playButton.textContent = '▶';
            playButton.setAttribute('aria-label', 'Spela');
        }

        return { init, load, play, pause };
    })();

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
