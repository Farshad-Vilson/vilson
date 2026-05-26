/* =========================================
   HARFO CHARACTER — حرف اول
   Version 1.0.0
   ========================================= */
(function () {
	'use strict';

	/* ---- Bootstrap ---- */
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}

	function boot() {
		/* slight delay so page paints first */
		setTimeout(initHarfo, 300);
	}

	function initHarfo() {

		/* ---- DOM refs ---- */
		const wrapper   = document.getElementById('harfo-wrapper');
		const container = document.getElementById('harfo-container');
		const speech    = document.getElementById('harfo-speech');
		const showBtn   = document.getElementById('harfo-show-btn');
		const hideBtn   = document.getElementById('harfo-hide-btn');

		if (!container) return;

		/* ---- Config ---- */
		const CFG = {
			IDLE_MS:    9000,   /* after this → bored */
			SLEEP_MS:   22000,  /* after this → sleeping */
			RIPPLE_CHANCE: 0.45 /* probability of ripple per click */
		};

		/* ---- Messages ---- */
		const MSG = {
			wave:    ['سلام! 👋', 'خوش اومدی! ✨', 'هی! 😄', 'اینجام 💙'],
			excited: ['بزن! 🎯', 'عالیه! 💡', 'برو برو! 🚀', 'این خوبه!'],
			reading: ['جالبه! 🤓', 'آها... 💭', 'بخون! 📖', 'ادامه بده! 👀'],
			exit:    ['نرو! 🥺', 'بمون! 💙', 'یه لحظه! 😢', 'هنوز چیز داریم!'],
			bored:   ['...', 'هنوز اینجام 🙂', '😴', 'بیا بریم بالا!'],
			tap:     ['هی! 😄', 'قلقلکم دادی! 😂', 'اوخ! 😅', 'مرسی! 💙']
		};

		/* ---- State ---- */
		let state       = 'init';
		let hidden      = false;
		let timers      = {};
		let atHome      = true;
		let lastTarget  = null;

		/* ---- Check hidden pref ---- */
		if (localStorage.getItem('harfo_hidden') === '1') {
			setHidden(true);
			return;
		}

		/* ---- Bind ---- */
		bindEvents();

		/* ---- Entrance ---- */
		enter();

		/* ========================================
		   CORE STATE MACHINE
		   ======================================== */

		function setState(s) {
			if (state === s) return;
			container.className = container.className
				.replace(/harfo-state-\S+/g, '').trim();
			container.classList.add('harfo-state-' + s);
			state = s;
		}

		function enter() {
			setState('entering');
			resetSleepTimers();
			setTimeout(function () {
				setState('waving');
				say(rand(MSG.wave), 2400);
				setTimeout(function () {
					setState('idle');
				}, 2400);
			}, 950);
		}

		function jelly() {
			container.classList.remove('harfo-jelly');
			/* force reflow */
			void container.offsetWidth;
			container.classList.add('harfo-jelly');
			clearTimeout(timers.jelly);
			timers.jelly = setTimeout(function () {
				container.classList.remove('harfo-jelly');
			}, 700);
		}

		function say(msg, duration) {
			if (!msg) return;
			duration = duration || 2600;
			speech.textContent = msg;
			speech.classList.add('visible');
			clearTimeout(timers.speech);
			timers.speech = setTimeout(function () {
				speech.classList.remove('visible');
			}, duration);
		}

		function wakeUp() {
			setState('startled');
			jelly();
			setTimeout(function () {
				if (state === 'startled') setState('idle');
			}, 600);
		}

		function resetSleepTimers() {
			clearTimeout(timers.idle);
			clearTimeout(timers.sleep);

			if (state === 'sleeping') {
				wakeUp();
			}

			timers.idle = setTimeout(function () {
				if (['idle', 'reading', 'curious'].indexOf(state) !== -1) {
					setState('bored');
					say(rand(MSG.bored), 2200);
				}
			}, CFG.IDLE_MS);

			timers.sleep = setTimeout(function () {
				if (['idle', 'bored'].indexOf(state) !== -1) {
					setState('sleeping');
				}
			}, CFG.SLEEP_MS);
		}

		/* ========================================
		   EVENT BINDING
		   ======================================== */

		function bindEvents() {

			/* Activity → reset sleep */
			['scroll', 'mousemove', 'keydown', 'touchstart'].forEach(function (ev) {
				document.addEventListener(ev, resetSleepTimers, { passive: true });
			});

			/* Interactive element hover */
			var SEL = [
				'a[href]',
				'button',
				'input[type="submit"]',
				'input[type="button"]',
				'.wp-block-button__link',
				'.btn',
				'[class*="button"]',
				'h1', 'h2', 'h3'
			].join(',');

			var hoverDebounce = null;
			document.addEventListener('mouseover', function (e) {
				var el = e.target.closest(SEL);
				if (!el || el.closest('#harfo-wrapper')) return;
				if (el === lastTarget) return;
				clearTimeout(hoverDebounce);
				hoverDebounce = setTimeout(function () {
					onHover(el);
				}, 80);
			});

			document.addEventListener('mouseout', function (e) {
				var el = e.target.closest(SEL);
				if (!el || el.closest('#harfo-wrapper')) return;
				clearTimeout(hoverDebounce);
				if (el === lastTarget) {
					lastTarget = null;
					returnHome(true);
				}
			});

			/* Scroll → reading state */
			var scrollT = null;
			window.addEventListener('scroll', function () {
				clearTimeout(scrollT);
				scrollT = setTimeout(onScroll, 180);
			}, { passive: true });

			/* Exit intent */
			document.addEventListener('mouseleave', function (e) {
				if (e.clientY <= 5 && state !== 'pleading') {
					onExitIntent();
				}
			});

			/* Click → ripple + jelly */
			document.addEventListener('click', function (e) {
				if (e.target.closest('#harfo-wrapper')) return;
				resetSleepTimers();
				if (Math.random() < CFG.RIPPLE_CHANCE) {
					createRipple(e.clientX, e.clientY);
				}
				if (Math.random() < 0.28) jelly();
			});

			/* Tap on harfo */
			container.addEventListener('click', function (e) {
				e.stopPropagation();
				if (state === 'sleeping') {
					wakeUp();
					return;
				}
				jelly();
				say(rand(MSG.tap), 1800);
				setState('excited');
				setTimeout(function () {
					if (state === 'excited') setState('idle');
				}, 1800);
			});

			/* Hide button */
			if (hideBtn) {
				hideBtn.addEventListener('click', function (e) {
					e.stopPropagation();
					setHidden(true);
					localStorage.setItem('harfo_hidden', '1');
				});
			}

			/* Show button */
			if (showBtn) {
				showBtn.addEventListener('click', function () {
					setHidden(false);
					localStorage.removeItem('harfo_hidden');
					jelly();
					say(rand(MSG.wave), 2000);
					setState('idle');
					resetSleepTimers();
				});
			}
		}

		/* ========================================
		   ELEMENT HOVER REACTION
		   ======================================== */

		function onHover(el) {
			lastTarget = el;
			var isBtn  = el.matches('a,button,input[type="submit"],input[type="button"],.wp-block-button__link,.btn,[class*="button"]');
			var isHead = el.matches('h1,h2,h3');

			if (isBtn) {
				setState('excited');
				moveNear(el, 'top');
				if (Math.random() < 0.45) say(rand(MSG.excited), 1600);
			} else if (isHead) {
				setState('curious');
				moveNear(el, 'side');
				if (Math.random() < 0.35) say(rand(MSG.reading), 1600);
			}

			clearTimeout(timers.autoReturn);
			timers.autoReturn = setTimeout(function () {
				returnHome(false);
			}, 5000);
		}

		/* ========================================
		   SCROLL REACTION
		   ======================================== */

		function onScroll() {
			if (['excited', 'waving', 'entering', 'pleading', 'startled'].indexOf(state) !== -1) return;

			var heads = document.querySelectorAll('h2, h3, h4');
			var mid   = window.innerHeight * 0.42;

			for (var i = 0; i < heads.length; i++) {
				var r = heads[i].getBoundingClientRect();
				if (r.top > 0 && r.top < mid) {
					setState('reading');
					if (Math.random() < 0.3) say(rand(MSG.reading), 1800);
					clearTimeout(timers.readEnd);
					timers.readEnd = setTimeout(function () {
						if (state === 'reading') setState('idle');
					}, 2800);
					break;
				}
			}
		}

		/* ========================================
		   EXIT INTENT
		   ======================================== */

		function onExitIntent() {
			setState('pleading');
			jelly();
			say(rand(MSG.exit), 3200);
			clearTimeout(timers.plead);
			timers.plead = setTimeout(function () {
				if (state === 'pleading') setState('idle');
			}, 3800);
		}

		/* ========================================
		   POSITIONING
		   ======================================== */

		function moveNear(el, pos) {
			var r   = el.getBoundingClientRect();
			var cw  = 90, ch = 90, pad = 14;
			var vw  = window.innerWidth;
			var vh  = window.innerHeight;
			var x, y;

			if (pos === 'top') {
				x = r.left + r.width / 2 - cw / 2;
				y = r.top - ch - pad;
				/* if element is near top, put below */
				if (y < 70) y = r.bottom + pad;
			} else {
				/* side */
				x = r.right + pad;
				y = r.top + r.height / 2 - ch / 2;
				if (x + cw > vw - 10) {
					x = r.left - cw - pad;
				}
			}

			/* Clamp */
			x = Math.max(10, Math.min(x, vw - cw - 10));
			y = Math.max(70, Math.min(y, vh - ch - 10));

			wrapper.classList.add('harfo-moving');
			wrapper.style.position = 'fixed';
			wrapper.style.right    = 'auto';
			wrapper.style.bottom   = 'auto';
			wrapper.style.left     = x + 'px';
			wrapper.style.top      = y + 'px';
			atHome = false;
		}

		function returnHome(changeState) {
			clearTimeout(timers.autoReturn);
			wrapper.style.position = 'fixed';
			wrapper.style.left     = 'auto';
			wrapper.style.top      = 'auto';
			wrapper.style.right    = '28px';
			wrapper.style.bottom   = '28px';
			atHome = true;

			if (changeState && ['excited', 'curious', 'reading'].indexOf(state) !== -1) {
				setState('idle');
			}
		}

		/* ========================================
		   RIPPLE
		   ======================================== */

		function createRipple(x, y) {
			var el = document.createElement('div');
			el.className = 'harfo-ripple';
			el.style.left = x + 'px';
			el.style.top  = y + 'px';
			document.body.appendChild(el);
			el.addEventListener('animationend', function () {
				el.parentNode && el.parentNode.removeChild(el);
			}, { once: true });
		}

		/* ========================================
		   HIDDEN / SHOW
		   ======================================== */

		function setHidden(val) {
			hidden = val;
			if (val) {
				wrapper.classList.add('harfo-hidden');
			} else {
				wrapper.classList.remove('harfo-hidden');
			}
		}

		/* ========================================
		   HELPERS
		   ======================================== */

		function rand(arr) {
			return arr[Math.floor(Math.random() * arr.length)];
		}

		/* expose for debugging */
		window.HarfoCharacter = {
			setState: setState,
			say:      say,
			jelly:    jelly,
			hide:     function () { setHidden(true);  localStorage.setItem('harfo_hidden','1'); },
			show:     function () { setHidden(false); localStorage.removeItem('harfo_hidden'); }
		};
	}

})();
