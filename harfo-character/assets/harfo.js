/* ============================================================
   HARFO v2 — حرف اول — Intelligent Pet Character
   Spring physics · Page AI · Memory · Eye tracking
   ============================================================ */
;(function () {
	'use strict';

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', boot);
	else
		setTimeout(boot, 120);

	function boot() { setTimeout(initHarfo, 180); }

	/* ──────────────────────────────────────────
	   CONFIG
	────────────────────────────────────────── */
	var CFG = {
		SPRING_K:       0.062,  // stiffness
		SPRING_D:       0.74,   // damping
		PUPIL_MAX:      3.4,    // max pupil travel (px)
		PUPIL_EASE:     0.10,   // how quickly pupils follow
		ACT_GAP:        13000,  // min ms between proactive actions
		SPEECH_GAP:     9000,   // min ms between speeches
		HOVER_WAIT:     480,    // ms before reacting to hover
		BORED_AFTER:    16000,
		SLEEP_AFTER:    34000,
		TYPING_MS:      700,    // typing indicator duration before text
		SIZE:           92      // character px (matches CSS)
	};

	/* ──────────────────────────────────────────
	   RUNTIME STATE
	────────────────────────────────────────── */
	var S = {
		mode:  'loading',
		hidden: false,

		/* Spring physics — offsets from home */
		dx: 0,  dy: 0,
		vx: 0,  vy: 0,
		tx: 0,  ty: 0,

		/* Pupil targets and current */
		plxT: 0, plyT: 0,  plxC: 0, plyC: 0,
		prxT: 0, pryT: 0,  prxC: 0, pryC: 0,

		/* Mouse */
		mx: 0, my: 0,

		/* Timestamps */
		lastAct:    0,
		lastSpeech: 0,
		lastScroll: 0,

		/* Timers */
		rafId:    null,
		boredT:   null,
		sleepT:   null,
		hoverT:   null,
		actT:     null,
		readT:    null,
		bubbleT:  null,
		typingT:  null,
		returnT:  null,

		/* Page intelligence */
		page: {},

		/* Memory */
		mem: {}
	};

	/* ──────────────────────────────────────────
	   DOM REFS
	────────────────────────────────────────── */
	var E = {};

	/* ──────────────────────────────────────────
	   PAGE INTELLIGENCE
	────────────────────────────────────────── */
	var PageAI = {

		scan: function () {
			var p     = {};
			var bc    = document.body.className || '';
			var url   = window.location.pathname;

			/* ── page type ── */
			if      (bc.indexOf('woocommerce-checkout') !== -1) p.type = 'checkout';
			else if (bc.indexOf('woocommerce-cart')     !== -1) p.type = 'cart';
			else if (bc.indexOf('single-product')       !== -1) p.type = 'product';
			else if (bc.indexOf('woocommerce')          !== -1) p.type = 'shop';
			else if (bc.indexOf('single-post')          !== -1 ||
			         bc.indexOf('single')               !== -1) p.type = 'article';
			else if (bc.indexOf('blog')   !== -1 ||
			         bc.indexOf('archive')!== -1)               p.type = 'blog';
			else if (url.indexOf('contact') !== -1 ||
			         bc.indexOf('contact')  !== -1)             p.type = 'contact';
			else if (url.indexOf('about')   !== -1 ||
			         bc.indexOf('about')    !== -1)             p.type = 'about';
			else if (bc.indexOf('home')       !== -1 ||
			         bc.indexOf('front-page') !== -1)           p.type = 'home';
			else                                                p.type = 'generic';

			/* ── title ── */
			var h1El = document.querySelector('h1');
			p.title = (h1El && h1El.textContent.trim().slice(0, 40)) ||
			           document.title.split(/[|\-–]/)[0].trim();

			/* ── headings ── */
			p.heads = [];
			document.querySelectorAll('h2,h3').forEach(function (h) {
				var t = h.textContent.trim();
				if (t && t.length < 70) p.heads.push(t);
			});

			/* ── forms ── */
			p.formCount  = document.querySelectorAll('form').length;
			p.inputCount = document.querySelectorAll('input:not([type=hidden]),textarea').length;

			/* ── prices ── */
			var prEl = document.querySelector('.price,.woocommerce-Price-amount,[class*="price"]');
			p.hasPrice = !!prEl;
			p.priceText = prEl ? prEl.textContent.trim().slice(0, 20) : '';

			/* ── article length ── */
			var art = document.querySelector('article,.entry-content,.post-content,main');
			p.longRead = art ? art.textContent.trim().length > 900 : false;

			/* ── product image ── */
			p.hasProductImg = !!document.querySelector('.woocommerce-product-gallery,.product-images');

			return p;
		}
	};

	/* ──────────────────────────────────────────
	   MEMORY  (localStorage)
	────────────────────────────────────────── */
	var Mem = {
		KEY:     'harfo_m',
		HIDE_K:  'harfo_h',

		load: function () {
			try {
				var r = localStorage.getItem(this.KEY);
				return r ? JSON.parse(r) : { v: 0, last: 0 };
			} catch (e) { return { v: 0, last: 0 }; }
		},

		save: function (m) {
			try { localStorage.setItem(this.KEY, JSON.stringify(m)); } catch(e) {}
		},

		isHidden:  function () { return localStorage.getItem(this.HIDE_K) === '1'; },
		setHidden: function (v) {
			v ? localStorage.setItem(this.HIDE_K,'1') : localStorage.removeItem(this.HIDE_K);
		}
	};

	/* ──────────────────────────────────────────
	   MESSAGES  (contextual Persian)
	────────────────────────────────────────── */
	var M = {

		arrive: {
			home:     ['سلام! 👋', 'خوش اومدی! ✨'],
			article:  ['مقاله خوبیه! 📖', 'بریم بخونیم! 😊'],
			product:  ['این محصول رو ببین! 🛍️', 'خوشم میاد! ✨'],
			shop:     ['بریم خرید! 🛒', 'چیز خوبی پیدا می‌کنیم!'],
			contact:  ['یه پیام بده! 💬', 'خوشحال می‌شیم بشنویم!'],
			about:    ['بیا بیشتر بشناس! 😊'],
			cart:     ['تقریبا تمومه! 🛒'],
			checkout: ['یه قدم مونده! 🎉'],
			blog:     ['مقاله‌های خوبی داریم! 📚'],
			generic:  ['سلام! 👋', 'اینجام اگه کمک لازم داشتی! 😊']
		},

		returnShort:   ['دوباره اومدی! 💙', 'هی، سلام! 👋', 'خوش اومدی! 😊'],
		returnLong:    ['مدتی بود ندیدمت! 🤗', 'برگشتی! چه خوب! 💙'],

		reading:       ['📖', '🤓', '...', '💭'],
		idlePoke:      ['...', '💭', '', '', '', ''],  /* mostly empty */

		btn:           ['اینو امتحان کن! ✨', 'قشنگه! 🚀'],
		link:          ['ببین! 👀'],
		form:          ['بنویس، منتظرم 😊', 'پرش کن! 📝'],
		heading:       ['جالبه! 🤓', '💡'],
		price:         ['قیمتش مناسبه! 💰', 'خوبه! 🛍️'],

		exit:          ['نرو! 🥺', 'بمون کمی! 💙', 'یه لحظه! 😢', 'هنوز چیزا داریم! 🌟'],
		addCart:       ['آفرین! 🛒', 'عالی انتخاب کردی! 🎉'],
		formSent:      ['فرستادی! 💙', 'عالیه! ✅'],
		tap:           ['قلقلکم دادی! 😂', 'اوخ! 😅', 'هی! 😄', 'مرسی! 💙']
	};

	function pick(arr) {
		if (!arr || !arr.length) return '';
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function pickType(group) {
		var arr = group[S.page.type] || group.generic || [];
		return pick(arr);
	}

	/* ──────────────────────────────────────────
	   EXPRESSION ENGINE
	────────────────────────────────────────── */
	var Expr = {

		set: function (mode) {
			if (S.mode === mode || !E.frame) return;
			E.frame.className = E.frame.className.replace(/hm-\S+/g,'').trim();
			E.frame.classList.add('hm-' + mode);
			S.mode = mode;
		},

		say: function (msg, ms) {
			if (!msg || !E.bubble) return;
			ms = ms || 3200;

			var now = Date.now();
			if (now - S.lastSpeech < CFG.SPEECH_GAP) return;
			S.lastSpeech = now;

			/* show typing dots first */
			E.text.textContent   = '';
			E.text.style.display = 'none';
			E.typing.style.display = 'flex';
			E.bubble.classList.add('hb-show');

			clearTimeout(S.typingT);
			S.typingT = setTimeout(function () {
				E.typing.style.display = 'none';
				E.text.style.display   = '';
				E.text.textContent     = msg;
			}, CFG.TYPING_MS + Math.random() * 350);

			clearTimeout(S.bubbleT);
			S.bubbleT = setTimeout(function () {
				E.bubble.classList.remove('hb-show');
			}, ms + CFG.TYPING_MS);
		},

		forceSay: function (msg, ms) {
			S.lastSpeech = 0;
			Expr.say(msg, ms);
		},

		jelly: function () {
			if (!E.frame) return;
			E.frame.classList.remove('hf-jelly');
			void E.frame.offsetWidth;
			E.frame.classList.add('hf-jelly');
			clearTimeout(S.jellyT);
			S.jellyT = setTimeout(function () { E.frame.classList.remove('hf-jelly'); }, 700);
		},

		updatePupils: function () {
			if (!E.pl) return;

			if (S.mode === 'sleeping' || S.mode === 'bored') {
				S.plxT = 0; S.plyT = 2.5;
				S.prxT = 0; S.pryT = 2.5;
			} else {
				var r  = E.frame.getBoundingClientRect();
				var cx = r.left + r.width  / 2;
				var cy = r.top  + r.height / 2;
				var dx = S.mx - cx;
				var dy = S.my - cy;
				var d  = Math.sqrt(dx*dx + dy*dy) || 1;
				var t  = Math.min(d / 70, 1);
				S.plxT = (dx/d) * CFG.PUPIL_MAX * t;
				S.plyT = (dy/d) * CFG.PUPIL_MAX * t;
				S.prxT = S.plxT;
				S.pryT = S.plyT;
			}

			S.plxC += (S.plxT - S.plxC) * CFG.PUPIL_EASE;
			S.plyC += (S.plyT - S.plyC) * CFG.PUPIL_EASE;
			S.prxC += (S.prxT - S.prxC) * CFG.PUPIL_EASE;
			S.pryC += (S.pryT - S.pryC) * CFG.PUPIL_EASE;

			E.pl.setAttribute('cx', 35 + S.plxC);
			E.pl.setAttribute('cy', 53 + S.plyC);
			E.pr.setAttribute('cx', 65 + S.prxC);
			E.pr.setAttribute('cy', 53 + S.pryC);
		}
	};

	/* ──────────────────────────────────────────
	   PHYSICS ENGINE  (spring, RAF)
	────────────────────────────────────────── */
	var Physics = {

		/* target approach — offset from home */
		goToEl: function (el, side) {
			var r   = el.getBoundingClientRect();
			var cs  = CFG.SIZE, pad = 14;
			var vw  = window.innerWidth, vh = window.innerHeight;

			/* home position in viewport */
			var hx = vw - 28 - cs;
			var hy = vh - 28 - cs;

			var wx, wy;  /* desired absolute position */

			if (side === 'above') {
				wx = r.left + r.width/2 - cs/2;
				wy = r.top - cs - pad;
				if (wy < 80) wy = r.bottom + pad;
			} else if (side === 'right') {
				wx = r.right + pad;
				wy = r.top + r.height/2 - cs/2;
				if (wx + cs > vw - 10) wx = r.left - cs - pad;
			} else {
				wx = r.left - cs - pad;
				wy = r.top + r.height/2 - cs/2;
				if (wx < 10) wx = r.right + pad;
			}

			wx = Math.max(10, Math.min(wx, vw - cs - 10));
			wy = Math.max(70, Math.min(wy, vh - cs - 10));

			S.tx = wx - hx;
			S.ty = wy - hy;
		},

		goHome: function () {
			S.tx = 0;
			S.ty = 0;
		},

		tick: function () {
			S.vx = S.vx * CFG.SPRING_D + (S.tx - S.dx) * CFG.SPRING_K;
			S.vy = S.vy * CFG.SPRING_D + (S.ty - S.dy) * CFG.SPRING_K;
			S.dx += S.vx;
			S.dy += S.vy;

			if (E.wrapper) {
				E.wrapper.style.transform = 'translate(' + S.dx.toFixed(2) + 'px,' + S.dy.toFixed(2) + 'px)';
			}

			/* shadow grows/shrinks with movement */
			var lift = Math.abs(S.dy);
			if (E.shadow) {
				var sr = Math.max(2, 21 - lift * 0.04).toFixed(1);
				E.shadow.setAttribute('rx', sr);
			}

			/* pupils */
			Expr.updatePupils();
		},

		loop: function () {
			Physics.tick();
			S.rafId = requestAnimationFrame(Physics.loop);
		}
	};

	/* ──────────────────────────────────────────
	   BEHAVIOR BRAIN
	────────────────────────────────────────── */
	var Brain = {

		canAct: function () {
			return Date.now() - S.lastAct > CFG.ACT_GAP;
		},

		markAct: function () {
			S.lastAct = Date.now();
		},

		/* ── Arrival sequence ── */
		arrive: function () {
			Expr.set('arriving');
			setTimeout(function () {
				Expr.set('greeting');

				var msg;
				var daysSince = (Date.now() - S.mem.last) / 86400000;

				if (S.mem.v > 6) {
					msg = pick(M.returnShort);
				} else if (S.mem.v > 0 && daysSince > 3) {
					msg = pick(M.returnLong);
				} else {
					msg = pickType(M.arrive);
				}

				setTimeout(function () { Expr.forceSay(msg, 3000); }, 350);

				setTimeout(function () {
					Expr.set('idle');
					Brain.scheduleProactive();
					Brain.scheduleActivity();
				}, 2800);

			}, 800);
		},

		/* ── Schedule next proactive behaviour ── */
		scheduleProactive: function () {
			clearTimeout(S.actT);
			var delay = CFG.ACT_GAP + Math.random() * 10000;
			S.actT = setTimeout(Brain.proactive, delay);
		},

		proactive: function () {
			if (['sleeping','arriving','greeting','farewell'].indexOf(S.mode) !== -1) {
				Brain.scheduleProactive();
				return;
			}
			if (!Brain.canAct()) { Brain.scheduleProactive(); return; }

			/* Find a heading in viewport to approach */
			var inView = null;
			var heads  = document.querySelectorAll('h2,h3');
			for (var i = 0; i < heads.length; i++) {
				var r = heads[i].getBoundingClientRect();
				if (r.top > 90 && r.top < window.innerHeight - 100) {
					inView = heads[i];
					break;
				}
			}

			if (inView && Math.random() < 0.55) {
				Brain.markAct();
				Expr.set('curious');
				Physics.goToEl(inView, 'left');

				setTimeout(function () {
					if (Math.random() < 0.3) Expr.say(pick(M.reading), 1800);
					setTimeout(function () {
						Physics.goHome();
						if (S.mode === 'curious') Expr.set('idle');
						Brain.scheduleProactive();
					}, 4500);
				}, 900);
			} else {
				/* Subtle idle gesture — most of the time do nothing visible */
				if (Math.random() < 0.25) Expr.jelly();
				Brain.scheduleProactive();
			}
		},

		/* ── Activity / sleep timers ── */
		scheduleActivity: function () {
			clearTimeout(S.boredT);
			clearTimeout(S.sleepT);

			if (S.mode === 'sleeping') {
				Brain.wakeUp();
				return;
			}

			S.boredT = setTimeout(function () {
				if (['idle','reading','curious','helping'].indexOf(S.mode) !== -1) {
					Expr.set('bored');
					Physics.goHome();
				}
			}, CFG.BORED_AFTER);

			S.sleepT = setTimeout(function () {
				if (['idle','bored','reading'].indexOf(S.mode) !== -1) {
					Expr.set('sleeping');
					Physics.goHome();
				}
			}, CFG.SLEEP_AFTER);
		},

		onActivity: function () {
			Brain.scheduleActivity();
		},

		wakeUp: function () {
			Expr.set('waking');
			Expr.jelly();
			setTimeout(function () {
				if (S.mode === 'waking') {
					Expr.set('idle');
					setTimeout(function () { Expr.forceSay('😊', 1500); }, 200);
				}
			}, 700);
		},

		/* ── Hover on element ── */
		onHover: function (el) {
			clearTimeout(S.hoverT);
			S.hoverT = setTimeout(function () {
				if (!el || !el.isConnected || !Brain.canAct()) return;

				var isBtn    = el.matches('button,a[href],input[type=submit],input[type=button],.btn,.wp-block-button__link,[class*=button]');
				var isHead   = el.matches('h1,h2,h3');
				var isInput  = el.matches('input:not([type=hidden]),textarea,select');
				var isPrice  = !!el.closest('.woocommerce-Price-amount,[class*=price]');

				if (isBtn) {
					Brain.markAct();
					Expr.set('curious');
					Physics.goToEl(el, 'above');
					if (Math.random() < 0.42) {
						setTimeout(function () { Expr.say(pick(M.btn), 2000); }, 280);
					}
				} else if (isInput) {
					Brain.markAct();
					Expr.set('helping');
					Physics.goToEl(el, 'right');
					setTimeout(function () { Expr.say(pick(M.form), 2600); }, 350);
				} else if (isHead) {
					if (Math.random() < 0.28) Expr.say(pick(M.heading), 1600);
				} else if (isPrice) {
					if (Math.random() < 0.38) Expr.say(pick(M.price), 2000);
				}

				clearTimeout(S.returnT);
				S.returnT = setTimeout(function () {
					Physics.goHome();
					if (['curious','helping'].indexOf(S.mode) !== -1) Expr.set('idle');
				}, 5500);

			}, CFG.HOVER_WAIT);
		},

		onLeave: function () {
			clearTimeout(S.hoverT);
			clearTimeout(S.returnT);
			S.returnT = setTimeout(function () {
				if (['curious','helping'].indexOf(S.mode) !== -1) {
					Physics.goHome();
					Expr.set('idle');
				}
			}, 1800);
		},

		/* ── Scroll ── */
		onScroll: function () {
			if (['sleeping','arriving','greeting','farewell'].indexOf(S.mode) !== -1) return;
			if (Date.now() - S.lastScroll < 180) return;
			S.lastScroll = Date.now();

			var heads = document.querySelectorAll('h2,h3');
			for (var i = 0; i < heads.length; i++) {
				var r = heads[i].getBoundingClientRect();
				if (r.top > 0 && r.top < window.innerHeight * 0.44) {
					if (S.mode === 'idle' || S.mode === 'bored') {
						Expr.set('reading');
						if (Date.now() - S.lastSpeech > 8000 && Math.random() < 0.22) {
							Expr.say(pick(M.reading), 1400);
						}
						clearTimeout(S.readT);
						S.readT = setTimeout(function () {
							if (S.mode === 'reading') Expr.set('idle');
						}, 3200);
					}
					break;
				}
			}
		},

		/* ── Exit intent ── */
		onExit: function () {
			if (S.mode === 'farewell') return;
			Expr.set('farewell');
			Expr.jelly();
			Physics.goHome();
			S.lastSpeech = 0;
			Expr.say(pick(M.exit), 3800);
			setTimeout(function () {
				if (S.mode === 'farewell') Expr.set('idle');
			}, 4500);
		},

		/* ── WooCommerce events ── */
		onAddCart: function () {
			S.lastSpeech = 0;
			Expr.say(pick(M.addCart), 2800);
			Expr.set('reacting');
			Expr.jelly();
			setTimeout(function () { if (S.mode === 'reacting') Expr.set('idle'); }, 3000);
		},

		onFormSent: function () {
			S.lastSpeech = 0;
			Expr.say(pick(M.formSent), 2500);
			Expr.jelly();
		},

		/* ── Tap on character ── */
		onTap: function () {
			if (S.mode === 'sleeping') { Brain.wakeUp(); return; }
			Expr.jelly();
			S.lastSpeech = 0;
			Expr.say(pick(M.tap), 1800);
		}
	};

	/* ──────────────────────────────────────────
	   EVENTS
	────────────────────────────────────────── */
	function bindEvents() {

		/* Activity → reset sleep timer */
		['scroll','mousemove','keydown','touchstart','click'].forEach(function (ev) {
			document.addEventListener(ev, Brain.onActivity, { passive: true });
		});

		/* Mouse position (for pupil tracking) */
		document.addEventListener('mousemove', function (e) {
			S.mx = e.clientX;
			S.my = e.clientY;
		}, { passive: true });

		/* Element hover */
		var SEL = [
			'a[href]','button',
			'input[type=submit]','input[type=button]',
			'.btn','.wp-block-button__link','[class*=button]',
			'h1','h2','h3',
			'input:not([type=hidden])','textarea','select',
			'.woocommerce-Price-amount','[class*=price]'
		].join(',');

		var prevEl = null, prevHT = null;
		document.addEventListener('mouseover', function (e) {
			var t = e.target.closest(SEL);
			if (!t || t.closest('#harfo-wrapper')) return;
			if (t === prevEl) return;
			prevEl = t;
			Brain.onHover(t);
		});
		document.addEventListener('mouseout', function (e) {
			var t = e.target.closest(SEL);
			if (!t || t !== prevEl) return;
			prevEl = null;
			Brain.onLeave();
		});

		/* Scroll */
		window.addEventListener('scroll', Brain.onScroll, { passive: true });

		/* Exit intent */
		document.addEventListener('mouseleave', function (e) {
			if (e.clientY <= 5) Brain.onExit();
		});

		/* Form submit */
		document.addEventListener('submit', function (e) {
			if (!e.target.closest('#harfo-wrapper'))
				setTimeout(Brain.onFormSent, 400);
		});

		/* WooCommerce add to cart */
		document.addEventListener('click', function (e) {
			if (e.target.closest('.add_to_cart_button,.single_add_to_cart_button'))
				setTimeout(Brain.onAddCart, 500);
		});

		/* Tap on character */
		if (E.frame) {
			E.frame.addEventListener('click', function (e) {
				e.stopPropagation();
				Brain.onTap();
			});
		}

		/* Close / restore */
		if (E.closeBtn) {
			E.closeBtn.addEventListener('click', function (e) {
				e.stopPropagation();
				setHidden(true);
				Mem.setHidden(true);
			});
		}
		if (E.restore) {
			E.restore.addEventListener('click', function () {
				setHidden(false);
				Mem.setHidden(false);
				Expr.set('greeting');
				setTimeout(function () {
					S.lastSpeech = 0;
					Expr.say(pick(M.returnShort), 2200);
					setTimeout(function () { Expr.set('idle'); }, 2500);
				}, 300);
				Brain.scheduleActivity();
			});
		}

		/* Resize */
		window.addEventListener('resize', function () {
			if (S.tx === 0 && S.ty === 0) Physics.goHome();
		});
	}

	/* ──────────────────────────────────────────
	   HIDDEN TOGGLE
	────────────────────────────────────────── */
	function setHidden(v) {
		S.hidden = v;
		if (E.wrapper) E.wrapper.classList.toggle('harfo-hidden', v);
	}

	/* ──────────────────────────────────────────
	   INIT
	────────────────────────────────────────── */
	function initHarfo() {
		E.wrapper   = document.getElementById('harfo-wrapper');
		E.frame     = document.getElementById('harfo-frame');
		E.bubble    = document.getElementById('harfo-bubble');
		E.text      = document.getElementById('harfo-text');
		E.typing    = document.getElementById('harfo-typing');
		E.closeBtn  = document.getElementById('harfo-close');
		E.restore   = document.getElementById('harfo-restore');
		E.pl        = document.getElementById('h-pl');
		E.pr        = document.getElementById('h-pr');
		E.shadow    = document.getElementById('h-shadow');

		if (!E.wrapper) return;

		/* Hidden pref */
		if (Mem.isHidden()) { setHidden(true); return; }

		/* Memory */
		S.mem = Mem.load();
		S.mem.v++;
		S.mem.last = Date.now();
		Mem.save(S.mem);

		/* Page intelligence */
		S.page = PageAI.scan();

		/* Start RAF loop */
		Physics.loop();

		/* Bind events */
		bindEvents();

		/* Activity timer */
		Brain.scheduleActivity();

		/* Enter */
		setTimeout(Brain.arrive, 100);

		/* Public API for debugging */
		window.HarfoAI = {
			mode:   function () { return S.mode; },
			page:   function () { return S.page; },
			mem:    function () { return S.mem;  },
			say:    Expr.forceSay,
			hide:   function () { setHidden(true);  Mem.setHidden(true);  },
			show:   function () { setHidden(false); Mem.setHidden(false); }
		};
	}

})();
