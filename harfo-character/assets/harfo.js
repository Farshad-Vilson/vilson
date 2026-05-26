/* ============================================================
   HARFO v3 — Orbital Intelligence — حرف اول
   Spring physics · Mouse escape · 100+ behaviors · Built-in ML
   No external dependencies.
   ============================================================ */
;(function () {
	'use strict';

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', boot);
	else
		setTimeout(boot, 150);

	function boot() { setTimeout(core, 160); }

	/* ══════════════════════════════════════════════════════
	   CONSTANTS
	══════════════════════════════════════════════════════ */
	var K = {
		SPRING_K:    0.055,   // stiffness
		SPRING_D:    0.76,    // damping
		ORB:         90,      // px
		RIGHT:       28,      // home right offset
		BOTTOM:      28,      // home bottom offset
		FLEE_R:      145,     // mouse flee radius px
		FLEE_F:      5.2,     // flee force multiplier
		TEASE_R:     220,     // tease engage radius
		SCHED_MIN:   5000,    // min ms between behaviors
		SCHED_MAX:   14000,   // max ms
		SPEECH_CD:   9000,    // min ms between speeches
		HOVER_WAIT:  420,     // hover debounce ms
		SLEEP_AFTER: 30000,
		BORED_AFTER: 14000,
		TYPING_MS:   650      // typing indicator before text
	};

	/* ══════════════════════════════════════════════════════
	   RUNTIME STATE
	══════════════════════════════════════════════════════ */
	var S = {
		// Physics
		dx:0, dy:0, vx:0, vy:0, tx:0, ty:0,

		// Viewport
		vw: window.innerWidth, vh: window.innerHeight,

		// Mouse
		mx:0, my:0,

		// Mode
		mode: 'loading',
		fleeing: false,
		fleeOn: true,
		teasing: false,
		orbiting: false,
		orbitAngle: 0,
		patrolling: false,

		// Timers
		rafId: null,
		schedT: null,
		sleepT: null,
		boredT: null,
		hudT: null,
		typingT: null,
		hoverT: null,
		animT: null,

		// Tracking
		lastSpeech: 0,
		lastAct: 0,
		lastScroll: 0,
		scrollY: 0,
		scrollDepth: 0,
		pageTime: Date.now(),
		visitedEls: new Set(),
		speedLinesShown: false,

		// Page + style intelligence
		page: {},
		style: {},
		mem: {},

		// ML engine weights
		mlW: {}
	};

	/* DOM refs */
	var E = {};

	/* ══════════════════════════════════════════════════════
	   STYLE AI — reads site CSS/DOM
	══════════════════════════════════════════════════════ */
	var StyleAI = {
		run: function () {
			var d = {};
			var bs = window.getComputedStyle(document.body);

			/* luminance / dark mode */
			var rgb = _parseRGB(bs.backgroundColor);
			d.lum    = rgb ? (0.299*rgb.r + 0.587*rgb.g + 0.114*rgb.b) / 255 : 1;
			d.isDark = d.lum < 0.44;

			/* accent from primary button */
			var btn = document.querySelector('a.button,button.primary,.btn-primary,.btn,[class*=btn-p]');
			if (btn) {
				var bcs = window.getComputedStyle(btn);
				var ac = _parseRGB(bcs.backgroundColor);
				if (ac && !(ac.r > 220 && ac.g > 220 && ac.b > 220)) {
					d.accentR = ac.r; d.accentG = ac.g; d.accentB = ac.b;
					d.accentCSS = 'rgb('+ac.r+','+ac.g+','+ac.b+')';
				}
			}

			/* layout */
			d.hasSidebar = !!document.querySelector('.sidebar,aside,[class*=sidebar]');
			d.hasNav     = !!document.querySelector('nav,.navbar,[class*=nav-],.site-nav');
			d.hasHero    = !!document.querySelector('.hero,[class*=hero],[class*=banner]');
			d.hasFixed   = !!document.querySelector('.fixed-header,.sticky-header,[data-sticky]');

			/* counts */
			d.imgs    = document.querySelectorAll('img[src]').length;
			d.links   = document.querySelectorAll('a[href]').length;
			d.btns    = document.querySelectorAll('button,[class*=btn]').length;
			d.forms   = document.querySelectorAll('form').length;
			d.heads   = document.querySelectorAll('h1,h2,h3').length;

			/* font */
			d.font    = bs.fontFamily.split(',')[0].replace(/["']/g,'').trim();
			d.fontSize = parseInt(bs.fontSize);

			return d;
		}
	};

	/* ══════════════════════════════════════════════════════
	   PAGE AI — understands content
	══════════════════════════════════════════════════════ */
	var PageAI = {
		scan: function () {
			var p = {};
			var bc  = document.body.className || '';
			var url = window.location.pathname;

			/* type */
			if      (bc.indexOf('woocommerce-checkout') !== -1) p.type = 'checkout';
			else if (bc.indexOf('woocommerce-cart')     !== -1) p.type = 'cart';
			else if (bc.indexOf('single-product')       !== -1) p.type = 'product';
			else if (bc.indexOf('woocommerce')          !== -1) p.type = 'shop';
			else if (bc.indexOf('single-post')          !== -1) p.type = 'article';
			else if (bc.indexOf('blog')  !== -1 || bc.indexOf('archive') !== -1) p.type = 'blog';
			else if (url.indexOf('contact') !== -1) p.type = 'contact';
			else if (url.indexOf('about')   !== -1) p.type = 'about';
			else if (bc.indexOf('home') !== -1 || bc.indexOf('front-page') !== -1) p.type = 'home';
			else p.type = 'generic';

			/* title */
			var h1 = document.querySelector('h1');
			p.title = (h1 && h1.textContent.trim().slice(0,50)) ||
			           document.title.split(/[|\-–]/)[0].trim().slice(0,50);

			/* headings list */
			p.headings = [];
			document.querySelectorAll('h2,h3').forEach(function(h) {
				var t = h.textContent.trim();
				if (t && t.length < 70) p.headings.push(t);
			});

			p.hasPrice    = !!document.querySelector('.price,.woocommerce-Price-amount,[class*=price]');
			p.hasGallery  = !!document.querySelector('.gallery,[class*=gallery],[class*=slider]');
			p.hasVideo    = !!document.querySelector('video,iframe[src*=youtube],iframe[src*=vimeo]');
			p.hasForms    = document.querySelectorAll('form').length;

			var art = document.querySelector('article,.entry-content,.post-content,main');
			p.wordCount   = art ? art.textContent.trim().split(/\s+/).length : 0;
			p.readMinutes = Math.ceil(p.wordCount / 200);
			p.isLongRead  = p.wordCount > 700;

			return p;
		}
	};

	/* ══════════════════════════════════════════════════════
	   MEMORY + ML ENGINE
	══════════════════════════════════════════════════════ */
	var Mem = {
		KEY:  'harfo3_m',
		MLKEY:'harfo3_ml',
		HKEY: 'harfo3_h',

		load: function () {
			try { return JSON.parse(localStorage.getItem(this.KEY) || '{}'); }
			catch(e) { return {}; }
		},
		save: function (m) {
			try { localStorage.setItem(this.KEY, JSON.stringify(m)); } catch(e) {}
		},
		isHidden:  function() { return localStorage.getItem(this.HKEY) === '1'; },
		setHidden: function(v) {
			v ? localStorage.setItem(this.HKEY,'1') : localStorage.removeItem(this.HKEY);
		},

		loadML: function() {
			try { return JSON.parse(localStorage.getItem(this.MLKEY) || '{}'); }
			catch(e) { return {}; }
		},
		saveML: function(w) {
			try { localStorage.setItem(this.MLKEY, JSON.stringify(w)); } catch(e) {}
		}
	};

	var ML = {
		/* Get effective weight for behavior (default 1.0) */
		w: function(id) {
			return Math.max(0.1, Math.min(6.0, S.mlW[id] || 1.0));
		},

		/* Reward: user engaged after this behavior */
		reward: function(id) {
			S.mlW[id] = (S.mlW[id] || 1.0) + 0.35;
			Mem.saveML(S.mlW);
		},

		/* Penalize: behavior was ignored */
		penalize: function(id) {
			S.mlW[id] = (S.mlW[id] || 1.0) - 0.12;
			Mem.saveML(S.mlW);
		},

		/* Weighted random pick from eligible behaviors */
		pick: function(list) {
			var total = 0;
			list.forEach(function(b) { total += (b.w || 1) * ML.w(b.id); });
			var r = Math.random() * total, cum = 0;
			for (var i = 0; i < list.length; i++) {
				cum += (list[i].w || 1) * ML.w(list[i].id);
				if (r <= cum) return list[i];
			}
			return list[list.length - 1];
		}
	};

	/* ══════════════════════════════════════════════════════
	   PHYSICS — spring + mouse repulsion
	══════════════════════════════════════════════════════ */
	var Phys = {

		homeX: function() { return S.vw - K.RIGHT  - K.ORB; },
		homeY: function() { return S.vh - K.BOTTOM - K.ORB; },

		orbX: function() { return Phys.homeX() + S.dx; },
		orbY: function() { return Phys.homeY() + S.dy; },

		setWorld: function(wx, wy) {
			S.tx = wx - Phys.homeX();
			S.ty = wy - Phys.homeY();
			S.tx = Math.max(-Phys.homeX() + 12, Math.min(S.tx, S.vw - Phys.homeX() - K.ORB - 12));
			S.ty = Math.max(-Phys.homeY() + 80, Math.min(S.ty, S.vh - Phys.homeY() - K.ORB - 12));
		},

		goHome: function() { S.tx = 0; S.ty = 0; },

		approachEl: function(el, side) {
			if (!el || !el.isConnected) return;
			var r = el.getBoundingClientRect();
			var cs = K.ORB, pad = 14, vw = S.vw, vh = S.vh;
			var wx, wy;
			if (side === 'above') {
				wx = r.left + r.width/2 - cs/2;
				wy = r.top - cs - pad;
				if (wy < 80) wy = r.bottom + pad;
			} else if (side === 'right') {
				wx = r.right + pad;
				wy = r.top + r.height/2 - cs/2;
				if (wx + cs > vw - 12) wx = r.left - cs - pad;
			} else {
				wx = r.left - cs - pad;
				wy = r.top + r.height/2 - cs/2;
				if (wx < 12) wx = r.right + pad;
			}
			wx = Math.max(12, Math.min(wx, vw - cs - 12));
			wy = Math.max(80, Math.min(wy, vh - cs - 12));
			Phys.setWorld(wx, wy);
		},

		applyMouseRepulsion: function() {
			if (!S.fleeOn) return;
			var ox = Phys.orbX() + K.ORB/2;
			var oy = Phys.orbY() + K.ORB/2;
			var rx = S.mx - ox;
			var ry = S.my - oy;
			var d  = Math.sqrt(rx*rx + ry*ry) || 1;

			if (d < K.FLEE_R) {
				var t = Math.pow((K.FLEE_R - d) / K.FLEE_R, 1.8);
				S.vx -= (rx/d) * t * K.FLEE_F;
				S.vy -= (ry/d) * t * K.FLEE_F;
				S.fleeing = t > 0.3;

				/* speed lines on strong flee */
				if (t > 0.55 && !S.speedLinesShown) {
					S.speedLinesShown = true;
					_spawnSpeedLines(ox, oy, Math.atan2(-ry, -rx));
					setTimeout(function() { S.speedLinesShown = false; }, 500);
				}
			} else {
				S.fleeing = false;
			}
		},

		applyOrbit: function() {
			if (!S.orbiting) return;
			S.orbitAngle += 0.038;
			var r = 130;
			Phys.setWorld(
				S.mx + Math.cos(S.orbitAngle) * r - K.ORB/2,
				S.my + Math.sin(S.orbitAngle) * r - K.ORB/2
			);
		},

		tick: function() {
			Phys.applyMouseRepulsion();
			if (S.orbiting) Phys.applyOrbit();

			/* spring */
			S.vx = S.vx * K.SPRING_D + (S.tx - S.dx) * K.SPRING_K;
			S.vy = S.vy * K.SPRING_D + (S.ty - S.dy) * K.SPRING_K;
			S.dx += S.vx;
			S.dy += S.vy;

			/* clamp to viewport */
			var maxDx = S.vw  - Phys.homeX() - K.ORB - 10;
			var maxDy = S.vh  - Phys.homeY() - K.ORB - 10;
			var minDx = -Phys.homeX() + 10;
			var minDy = -Phys.homeY() + 80;
			if (S.dx < minDx) { S.dx = minDx; S.vx *= -0.4; }
			if (S.dy < minDy) { S.dy = minDy; S.vy *= -0.4; }
			if (S.dx > maxDx) { S.dx = maxDx; S.vx *= -0.4; }
			if (S.dy > maxDy) { S.dy = maxDy; S.vy *= -0.4; }

			if (E.w) E.w.style.transform = 'translate('+S.dx.toFixed(1)+'px,'+S.dy.toFixed(1)+'px)';

			/* shadow scale */
			var lift = Math.abs(S.dy);
			var sr = Math.max(1.5, 4 - lift * 0.014).toFixed(1);
			if (E.ground) E.ground.style.transform = 'scaleX('+(1 - lift*0.002)+')';
		},

		loop: function() {
			Phys.tick();
			S.rafId = requestAnimationFrame(Phys.loop);
		}
	};

	/* ══════════════════════════════════════════════════════
	   EXPRESSION + SPEECH
	══════════════════════════════════════════════════════ */
	var Expr = {

		set: function(m) {
			if (!E.w) return;
			E.w.className = E.w.className.replace(/hs-\S+/g,'').trim();
			E.w.classList.add('hs-' + m);
			S.mode = m;
		},

		say: function(msg, ms, force) {
			if (!msg || !E.hud) return;
			ms = ms || 3200;
			if (!force && Date.now() - S.lastSpeech < K.SPEECH_CD) return;
			S.lastSpeech = Date.now();

			E.msg.textContent = '';
			E.msg.style.display = 'none';
			E.dots.style.display = 'flex';
			E.hud.classList.add('hud-on');

			clearTimeout(S.typingT);
			S.typingT = setTimeout(function() {
				E.dots.style.display = 'none';
				E.msg.style.display = '';
				E.msg.textContent = msg;
			}, K.TYPING_MS + Math.random() * 300);

			clearTimeout(S.hudT);
			S.hudT = setTimeout(function() {
				E.hud.classList.remove('hud-on');
			}, ms + K.TYPING_MS);
		},

		forceSay: function(msg, ms) {
			S.lastSpeech = 0;
			Expr.say(msg, ms, true);
		},

		/* Add one-shot animation class to #h-orb */
		anim: function(cls, ms) {
			if (!E.orb) return;
			E.orb.classList.remove(cls);
			void E.orb.offsetWidth;
			E.orb.classList.add(cls);
			clearTimeout(S.animT);
			S.animT = setTimeout(function() { E.orb.classList.remove(cls); }, ms || 900);
		},

		/* Add class to #harfo-w (for rainbow, ping etc) */
		animW: function(cls, ms) {
			if (!E.w) return;
			E.w.classList.add(cls);
			setTimeout(function() { E.w && E.w.classList.remove(cls); }, ms || 900);
		},

		ping: function() { Expr.animW('ha-ping', 900); },
		jelly: function() { Expr.anim('ha-jelly', 650); }
	};

	/* ══════════════════════════════════════════════════════
	   MESSAGES (contextual Persian)
	══════════════════════════════════════════════════════ */
	var MSG = {
		greet:     { home:['سلام! 👋','خوش اومدی! ✨'], article:['بریم بخونیم! 📖'],
		             product:['این محصول رو ببین! 🛍️'], shop:['بریم خرید! 🛒'],
		             contact:['پیام بده! 💬'], checkout:['یه قدم مونده! 🎉'],
		             cart:['سبد خریدت آماده‌ست!'], blog:['مقاله‌های خوبی داریم! 📚'],
		             generic:['سلام! 👋','اینجام! 😊'] },
		returnNew: ['دوباره اومدی! 💙','خوش برگشتی! 🤗','هی! سلام! 👋'],
		returnOld: ['مدتیه ندیدمت! 🥹','برگشتی! 💙'],
		reading:   ['📖','🤓','💭','...','جالبه!'],
		btn:       ['اینو امتحان کن! ✨','بزن! 🚀','قشنگه!'],
		form:      ['پرش کن! 📝','بنویس، منتظرم 😊','کمک لازم داری؟'],
		price:     ['قیمت خوبیه! 💰','مناسبه!'],
		exit:      ['نرو! 🥺','بمون کمی! 💙','یه لحظه! 😢'],
		addCart:   ['آفرین! 🛒','عالی! 🎉'],
		formSent:  ['فرستادی! ✅','عالیه! 💙'],
		tap:       ['قلقلک! 😂','اوخ! 😅','هی! 😄','مرسی! 💙'],
		discover:  ['کشف کردم! 🔍','جالبه اینجا! 👀','اینو نگاه کن! ✨'],
		explore:   ['دارم میگردم... 🔍','چیز جالبی پیدا کنم! 👀'],
		longread:  ['مقاله طولانیه! '+'' ,'حدود {n} دقیقه مطالعه! 📚'],
		scroll50:  ['نیمه رو خوندی! 📖','50% تموم شد! 💪'],
		scroll100: ['همه رو خوندی! 🎉','آفرین! تمام شد! 🌟'],
		morning:   ['صبح بخیر! ☀️','صبح خوب! 😊'],
		afternoon: ['بعد از ظهر بخیر! 🌤️'],
		evening:   ['عصر بخیر! 🌅'],
		night:     ['شب بخیر! 🌙','دیروقته! 😴'],
		milestone: ['بازدید شماره {n}! 🎉','ممنون از حضورت! 💙'],
		visit5min: ['5 دقیقه گذشت! ⏱️','دیدیم که خوندی! 📖'],
		nothing:   ['...','💭','','','','','']
	};

	function _msg(k, sub) {
		var arr = sub ? (MSG[k] || {})[sub] || MSG[k].generic || [] : (MSG[k] || []);
		if (!arr.length) return '';
		return arr[Math.floor(Math.random() * arr.length)];
	}

	/* ══════════════════════════════════════════════════════
	   BEHAVIOR LIBRARY — 100+ behaviors
	══════════════════════════════════════════════════════ */

	/* Helper: canAct() — min interval between scheduled behaviors */
	function canAct() { return Date.now() - S.lastAct > 3000; }
	function markAct() { S.lastAct = Date.now(); }

	/* ── IDLE GROUP ── */
	function b_glow_ping()     { Expr.ping(); }
	function b_jelly_idle()    { Expr.jelly(); }
	function b_spin_once()     { Expr.anim('ha-spin', 750); }
	function b_spin_fast()     { Expr.anim('ha-spin2', 750); }
	function b_barrel_roll()   { Expr.anim('ha-barrel', 850); }
	function b_shake()         { Expr.anim('ha-shake', 650); }
	function b_scare_itself()  { Expr.set('surprise'); Expr.anim('ha-scare', 600); setTimeout(function(){ if(S.mode==='surprise') Expr.set('idle'); }, 700); }
	function b_tiny_mode()     { Expr.anim('ha-tiny', 1550); }
	function b_huge_mode()     { Expr.anim('ha-huge', 1350); }
	function b_ghost_pass()    { Expr.anim('ha-ghost', 1250); }
	function b_rainbow()       { Expr.animW('ha-rainbow', 1650); }
	function b_freeze_snap()   { Expr.anim('ha-freeze', 1150); }
	function b_float_high()    { Expr.anim('ha-floathigh', 1850); }
	function b_happy_dance()   { Expr.set('idle'); Expr.anim('ha-dance', 900); }
	function b_ear_wiggle()    { Expr.animW('ha-earwig', 1100); }
	function b_spiral_in()     { Expr.anim('ha-spiral', 950); }
	function b_nothing()       { /* conscious pause — do absolutely nothing */ }
	function b_nothing2()      { /* same */ }
	function b_nothing3()      { /* same */ }

	/* ── MOUSE PLAY GROUP ── */
	function b_tease_mouse() {
		if (S.orbiting || S.teasing) return;
		S.teasing = true; S.fleeOn = false;
		Expr.set('mischief');
		/* Move toward mouse slowly */
		Phys.setWorld(S.mx - K.ORB*0.5, S.my - K.ORB*0.5);
		setTimeout(function() {
			/* Then flee hard */
			S.fleeOn = true; S.teasing = false;
			S.vx += (Math.random() - 0.5) * 12;
			S.vy -= Math.random() * 8 + 4;
			Expr.jelly();
			setTimeout(function() {
				Phys.goHome();
				Expr.set('idle');
			}, 2000);
		}, 1200);
	}

	function b_orbit_mouse() {
		if (S.orbiting) return;
		S.fleeOn = false; S.orbiting = true;
		S.orbitAngle = 0;
		Expr.set('curious');
		setTimeout(function() {
			S.orbiting = false; S.fleeOn = true;
			Phys.goHome();
			Expr.set('idle');
		}, 4500);
	}

	function b_peek_then_flee() {
		S.fleeOn = false;
		Phys.setWorld(S.mx + 80, S.my);
		setTimeout(function() {
			S.fleeOn = true;
			S.vx -= 8; S.vy -= 6;
			Phys.goHome();
		}, 900);
	}

	function b_circle_escape() {
		/* Spin around then zoom away from mouse */
		Expr.anim('ha-spin2', 750);
		setTimeout(function() {
			S.vx += (Phys.orbX() + K.ORB/2 - S.mx) * 0.08;
			S.vy += (Phys.orbY() + K.ORB/2 - S.my) * 0.08;
		}, 400);
	}

	function b_zap_toward_mouse() {
		S.fleeOn = false;
		Expr.anim('ha-warpout', 300);
		setTimeout(function() {
			Phys.setWorld(S.mx - K.ORB/2, S.my - K.ORB/2);
			S.dx = S.tx; S.dy = S.ty; S.vx = 0; S.vy = 0;
			Expr.anim('ha-warpin', 300);
			setTimeout(function() {
				S.fleeOn = true;
				Phys.goHome();
			}, 2000);
		}, 320);
	}

	function b_hide_corner() {
		var corners = [
			{x:12, y:80},
			{x: S.vw - K.ORB - 12, y: 80},
			{x:12, y: S.vh - K.ORB - 12}
		];
		var c = corners[Math.floor(Math.random() * corners.length)];
		Phys.setWorld(c.x, c.y);
		setTimeout(Phys.goHome, 4000);
	}

	/* ── TUNNEL GROUP ── */
	function b_tunnel() {
		var cx = Phys.orbX() + K.ORB/2;
		var cy = Phys.orbY() + K.ORB/2;
		_portalRing(cx, cy, 110);
		Expr.anim('ha-tout', 450);

		setTimeout(function() {
			var nx = Math.random() * (S.vw - K.ORB - 60) + 30;
			var ny = Math.random() * (S.vh - K.ORB - 140) + 100;
			_portalRing(nx + K.ORB/2, ny + K.ORB/2, 110);
			Phys.setWorld(nx, ny);
			S.dx = S.tx; S.dy = S.ty; S.vx = 0; S.vy = 0;
			Expr.anim('ha-tin', 450);
			setTimeout(function() { Expr.anim('ha-land', 580); }, 440);
		}, 460);
	}

	function b_tunnel_to_mouse() {
		var cx = Phys.orbX() + K.ORB/2;
		var cy = Phys.orbY() + K.ORB/2;
		_portalRing(cx, cy, 110);
		Expr.anim('ha-tout', 420);
		setTimeout(function() {
			var nx = Math.max(12, Math.min(S.mx - K.ORB/2, S.vw - K.ORB - 12));
			var ny = Math.max(80, Math.min(S.my - K.ORB/2, S.vh - K.ORB - 12));
			_portalRing(nx + K.ORB/2, ny + K.ORB/2, 110);
			Phys.setWorld(nx, ny);
			S.dx = S.tx; S.dy = S.ty; S.vx = 0; S.vy = 0;
			Expr.anim('ha-tin', 420);
			S.fleeOn = true; /* immediately flee from mouse */
			setTimeout(function() { Phys.goHome(); }, 2500);
		}, 450);
	}

	function b_warp_across() {
		var dir = Math.random() > 0.5 ? 1 : -1;
		Expr.anim('ha-warpout', 300);
		setTimeout(function() {
			Phys.setWorld(
				dir > 0 ? S.vw - K.ORB - 14 : 14,
				Math.random() * (S.vh - K.ORB - 100) + 80
			);
			S.dx = S.tx; S.dy = S.ty; S.vx = 0; S.vy = 0;
			Expr.anim('ha-warpin', 300);
			setTimeout(function() {
				Expr.anim('ha-land', 550);
				setTimeout(Phys.goHome, 2200);
			}, 320);
		}, 320);
	}

	function b_echo_trail() {
		var ox = Phys.orbX() + K.ORB/2;
		var oy = Phys.orbY() + K.ORB/2;
		for (var i = 0; i < 3; i++) {
			(function(idx) {
				setTimeout(function() {
					var ring = document.createElement('div');
					ring.className = 'h-echo-ring';
					ring.style.cssText = 'left:'+(ox-K.ORB/2)+'px;top:'+(oy-K.ORB/2)+'px;width:'+K.ORB+'px;height:'+K.ORB+'px;';
					document.body.appendChild(ring);
					setTimeout(function() { ring.parentNode && ring.parentNode.removeChild(ring); }, 900);
				}, idx * 200);
			})(i);
		}
	}

	function b_bounce_walls() {
		/* Give a random velocity — bounces naturally from wall clamping */
		S.vx += (Math.random() - 0.5) * 14;
		S.vy += (Math.random() - 0.5) * 10;
		Expr.jelly();
		setTimeout(function() {
			S.tx = 0; S.ty = 0;
		}, 2500);
	}

	function b_gravity_fall() {
		/* Jump up then let gravity pull back */
		S.vy -= 14;
		S.vx += (Math.random() - 0.5) * 6;
		setTimeout(function() {
			Phys.goHome();
			setTimeout(function() { Expr.anim('ha-land', 550); }, 1000);
		}, 600);
	}

	/* ── DISCOVERY GROUP ── */
	function b_goto_nav() {
		var el = document.querySelector('nav,.navbar,[class*=nav-],.site-nav');
		if (!el) return b_goto_heading();
		Expr.set('curious');
		Phys.approachEl(el, 'below');
		_schedReturn(3500);
		Expr.say(_msg('explore'), 2000);
	}

	function b_goto_heading() {
		var heads = document.querySelectorAll('h1,h2,h3');
		if (!heads.length) return;
		var arr = Array.from(heads);
		var visible = arr.filter(function(h) {
			var r = h.getBoundingClientRect();
			return r.top > 50 && r.top < S.vh - 50;
		});
		var target = visible.length ? visible[Math.floor(Math.random()*visible.length)] : arr[0];
		if (!target) return;
		Expr.set('curious');
		Phys.approachEl(target, Math.random() > 0.5 ? 'left' : 'above');
		_schedReturn(3800);
		if (Math.random() < 0.35) Expr.say(_msg('discover'), 1800);
	}

	function b_goto_image() {
		var imgs = document.querySelectorAll('img[src]:not([width="1"])');
		if (!imgs.length) return;
		var big = Array.from(imgs).filter(function(img) {
			return img.naturalWidth > 150 || img.width > 100;
		});
		if (!big.length) return;
		var img = big[Math.floor(Math.random() * big.length)];
		Expr.set('curious');
		Phys.approachEl(img, 'right');
		_schedReturn(4000);
		_echoRingEl(img);
	}

	function b_goto_cta() {
		var btn = document.querySelector('.wp-block-button__link,.btn,.button,button[class]');
		if (!btn || btn.id === 'h-close' || btn.id === 'h-restore') return;
		Expr.set('curious');
		Phys.approachEl(btn, 'above');
		if (Math.random() < 0.4) Expr.say(_msg('btn'), 2000);
		_schedReturn(3500);
	}

	function b_goto_form() {
		var form = document.querySelector('form:not(#search-form)');
		if (!form) return;
		var input = form.querySelector('input:not([type=hidden]),textarea');
		if (!input) return;
		Expr.set('curious');
		Phys.approachEl(input, 'right');
		Expr.say(_msg('form'), 2500);
		_schedReturn(4000);
	}

	function b_goto_price() {
		var pel = document.querySelector('.price,.woocommerce-Price-amount,[class*=price]');
		if (!pel) return;
		Phys.approachEl(pel, 'left');
		Expr.say(_msg('price'), 2200);
		_schedReturn(3200);
	}

	function b_scan_page() {
		/* Sweep across viewport width */
		var y = S.vh/2 - K.ORB/2;
		Phys.setWorld(14, y);
		Expr.say(_msg('explore'), 2000);
		setTimeout(function() {
			Phys.setWorld(S.vw - K.ORB - 14, y);
			setTimeout(function() { Phys.goHome(); }, 1500);
		}, 1800);
	}

	function b_scan_up() {
		Phys.setWorld(Phys.homeX(), 90);
		setTimeout(function() { Phys.goHome(); }, 2200);
	}

	function b_discover_dom() {
		/* Find an element not yet visited */
		var candidates = document.querySelectorAll('h2,h3,img,button,a.btn,[class*=card]');
		var unvisited = Array.from(candidates).filter(function(el) {
			return !S.visitedEls.has(el) && el.getBoundingClientRect().top > 50;
		});
		if (!unvisited.length) { S.visitedEls.clear(); return; }
		var target = unvisited[Math.floor(Math.random() * Math.min(unvisited.length, 5))];
		S.visitedEls.add(target);
		Expr.set('curious');
		Phys.approachEl(target, 'above');
		if (Math.random() < 0.3) Expr.say(_msg('discover'), 1800);
		_schedReturn(3500);
	}

	function b_ambient_patrol() {
		/* Slowly drift along bottom edge */
		var targets = [
			{x: 50, y: S.vh - K.ORB - 50},
			{x: S.vw/2, y: S.vh - K.ORB - 50},
			{x: S.vw - K.ORB - 50, y: S.vh - K.ORB - 50}
		];
		var idx = 0;
		S.patrolling = true;
		function step() {
			if (!S.patrolling || idx >= targets.length) {
				S.patrolling = false; Phys.goHome(); return;
			}
			Phys.setWorld(targets[idx].x, targets[idx].y);
			idx++;
			setTimeout(step, 1400);
		}
		step();
		setTimeout(function() { S.patrolling = false; Phys.goHome(); }, 6000);
	}

	function b_content_highlight() {
		/* Ring around current main content area */
		var art = document.querySelector('article,.entry-content,.post-content,main');
		if (!art) return b_goto_heading();
		_echoRingEl(art);
		Phys.approachEl(art, 'left');
		_schedReturn(3000);
	}

	/* ── CONTENT REACTIONS ── */
	function b_show_read_time() {
		if (!S.page.readMinutes) return;
		var m = S.page.readMinutes;
		var msg = 'حدود ' + m + ' دقیقه مطالعه! 📚';
		Expr.forceSay(msg, 3000);
	}

	function b_show_scroll_progress() {
		var pct = Math.round(S.scrollDepth * 100);
		Expr.forceSay(pct + '٪ خوندی! 📖', 2200);
	}

	function b_react_page_type() {
		var msgs = {
			shop: 'اینجا فروشگاهه! 🛒', product: 'محصول جالبیه! 🛍️',
			article: 'مقاله خوندنیه! 📖', blog: 'وبلاگ خوبیه! ✍️',
			contact: 'ارتباط برقرار کن! 💬', about: 'درباره ما! 👋',
			checkout: 'داری خرید می‌کنی! 🎉', cart: 'سبد خریدت! 🛒'
		};
		var m = msgs[S.page.type];
		if (m) Expr.forceSay(m, 2500);
	}

	function b_react_long_article() {
		if (!S.page.isLongRead) return;
		Expr.forceSay('مقاله طولانیه — صبور باش! 💪', 2500);
	}

	function b_react_video() {
		if (!S.page.hasVideo) return;
		Expr.forceSay('ویدیو داره! 🎬', 2000);
	}

	function b_react_gallery() {
		if (!S.page.hasGallery) return;
		b_goto_image();
		Expr.say('گالری عکس! 🖼️', 2000);
	}

	function b_match_site_color() {
		if (!S.style.accentCSS) return;
		/* Temporarily tint the glow in site's accent color */
		var old = document.documentElement.style.getPropertyValue('--harfo-accent');
		document.documentElement.style.setProperty('--harfo-accent', S.style.accentCSS);
		E.w && E.w.classList.add('h-accent');
		setTimeout(function() {
			E.w && E.w.classList.remove('h-accent');
			document.documentElement.style.setProperty('--harfo-accent', old || '');
		}, 3000);
	}

	function b_report_links() {
		if (!S.style.links) return;
		Expr.forceSay(S.style.links + ' لینک در صفحه! 🔗', 2000);
	}

	function b_report_images() {
		if (!S.style.imgs) return;
		Expr.forceSay(S.style.imgs + ' تصویر در صفحه! 🖼️', 2000);
	}

	/* ── TIME BASED ── */
	function b_time_greet() {
		var h = new Date().getHours();
		var m;
		if (h >= 5  && h < 12) m = _msg('morning');
		else if (h >= 12 && h < 17) m = _msg('afternoon');
		else if (h >= 17 && h < 21) m = _msg('evening');
		else                         m = _msg('night');
		if (m) Expr.forceSay(m, 2500);
	}

	function b_visit_milestone() {
		var v = S.mem.v || 1;
		if (v % 5 !== 0) return;
		Expr.forceSay(('بازدید ' + v + ' ام! 🎉').replace(/[0-9]/g, function(d){ return '۰۱۲۳۴۵۶۷۸۹'[d]; }), 3000);
		Expr.anim('ha-dance', 880);
	}

	function b_five_min_notice() {
		if (Date.now() - S.pageTime < 290000) return;
		Expr.forceSay(_msg('visit5min'), 2500);
	}

	/* ── SCROLL REACTIONS ── */
	function b_scroll_surf() {
		/* Drift sideways as page is scrolled */
		var dir = S.scrollY > S.lastScroll ? 1 : -1;
		S.vx += dir * 3;
		setTimeout(function() { S.tx = 0; }, 1200);
	}

	function b_bounce_heading() {
		var heads = document.querySelectorAll('h2,h3');
		for (var i = 0; i < heads.length; i++) {
			var r = heads[i].getBoundingClientRect();
			if (r.top > 30 && r.top < S.vh * 0.4) {
				Phys.approachEl(heads[i], 'left');
				Expr.set('curious');
				if (Math.random() < 0.28) Expr.say(_msg('reading'), 1500);
				_schedReturn(3000);
				return;
			}
		}
	}

	/* ── MISC / RARE ── */
	function b_ping_series() {
		for (var i = 0; i < 3; i++) {
			(function(idx) {
				setTimeout(function() { Expr.ping(); }, idx * 400);
			})(i);
		}
	}

	function b_H1_flash() {
		if (!E.orb) return;
		E.orb.style.filter = 'brightness(3) saturate(2)';
		setTimeout(function() {
			E.orb.style.filter = '';
		}, 200);
	}

	function b_typewriter() {
		var msgs = ['حرف اول 🔤','به سایت خوش آمدی! 🏠','ما اینجاییم! 💙'];
		var msg = msgs[Math.floor(Math.random() * msgs.length)];
		Expr.forceSay(msg, 3500);
	}

	function b_mischief_look() {
		Expr.set('mischief');
		setTimeout(function() { if (S.mode === 'mischief') Expr.set('idle'); }, 2000);
	}

	function b_curious_wobble() {
		Expr.set('curious');
		Expr.anim('ha-shake', 620);
		setTimeout(function() { if (S.mode === 'curious') Expr.set('idle'); }, 1500);
	}

	function b_surp_jolt() {
		Expr.set('surprise');
		Expr.anim('ha-scare', 580);
		setTimeout(function() { if (S.mode === 'surprise') Expr.set('idle'); }, 800);
	}

	function b_deep_dive() {
		Phys.setWorld(Phys.homeX(), S.vh + 20);
		setTimeout(function() {
			Phys.goHome();
			Expr.anim('ha-land', 550);
		}, 1200);
	}

	function b_edge_walk_r() {
		Phys.setWorld(S.vw - K.ORB - 14, S.vh/2 - K.ORB/2);
		setTimeout(Phys.goHome, 2500);
	}

	function b_edge_walk_l() {
		Phys.setWorld(14, S.vh/2 - K.ORB/2);
		setTimeout(Phys.goHome, 2500);
	}

	function b_star_burst() {
		if (!E.core) return;
		E.core.style.setProperty('--opacity','1');
		var old = E.core.style.getPropertyValue('--opacity');
		E.core.querySelector('*') && (E.core.style.filter = 'brightness(2)');
		setTimeout(function() { E.core.style.filter = ''; }, 400);
	}

	function b_look_at_mouse() {
		/* Stop fleeing for a moment and face mouse */
		S.fleeOn = false;
		Expr.set('curious');
		setTimeout(function() {
			S.fleeOn = true;
			Expr.set('idle');
		}, 2000);
	}

	function b_stalk_from_corner() {
		/* Move to corner, then slowly creep toward mouse */
		Phys.setWorld(14, 80);
		S.fleeOn = false;
		setTimeout(function() {
			Phys.setWorld(S.mx - 80, S.my - 80);
			setTimeout(function() {
				S.fleeOn = true;
				S.vx += 8; S.vy -= 8;
				Phys.goHome();
				Expr.anim('ha-spin', 700);
			}, 1200);
		}, 1000);
	}

	function b_phase_through() {
		/* Ghost flicker while moving through center */
		Phys.setWorld(S.vw/2 - K.ORB/2, S.vh/2 - K.ORB/2);
		Expr.anim('ha-ghost', 1200);
		setTimeout(function() {
			Phys.goHome();
		}, 1500);
	}

	function b_countdown_exit() {
		var nums = ['۳','۲','۱','💙'];
		var idx = 0;
		function tick() {
			if (idx >= nums.length) return;
			Expr.forceSay(nums[idx++], 900);
			if (idx < nums.length) setTimeout(tick, 1000);
		}
		tick();
	}

	function b_celebrate_general() {
		Expr.set('idle');
		Expr.anim('ha-dance', 880);
		Expr.forceSay('🎉', 1800);
	}

	function b_idle_spin_glow() {
		Expr.anim('ha-spin', 700);
		setTimeout(function() { Expr.ping(); }, 350);
	}

	function b_tilt_left() {
		if (E.orb) {
			E.orb.style.transform = 'rotate(-18deg)';
			setTimeout(function() { E.orb.style.transform = ''; }, 800);
		}
	}

	function b_tilt_right() {
		if (E.orb) {
			E.orb.style.transform = 'rotate(18deg)';
			setTimeout(function() { E.orb.style.transform = ''; }, 800);
		}
	}

	function b_shrink_grow() {
		Expr.anim('ha-tiny', 800);
		setTimeout(function() { Expr.anim('ha-huge', 600); }, 900);
		setTimeout(function() { Expr.anim('ha-land', 550); }, 1550);
	}

	/* ── WOOCOMMERCE ── */
	function b_woo_add_cart() {
		S.lastSpeech = 0;
		Expr.forceSay(_msg('addCart'), 2800);
		Expr.anim('ha-dance', 880);
	}

	function b_woo_product_page() {
		b_goto_price();
		setTimeout(function() { Expr.say(_msg('price'), 2200); }, 600);
	}

	/* ──────────────────────────────────
	   BEHAVIOR REGISTRY
	────────────────────────────────── */
	var BLIST = [
		/* id, base weight, cooldown ms, condition fn */
		/* IDLE */
		{id:'glow_ping',    w:12, cd:5000,  fn: b_glow_ping},
		{id:'jelly_idle',   w:8,  cd:4000,  fn: b_jelly_idle},
		{id:'spin_once',    w:6,  cd:9000,  fn: b_spin_once},
		{id:'spin_fast',    w:3,  cd:15000, fn: b_spin_fast},
		{id:'barrel_roll',  w:4,  cd:20000, fn: b_barrel_roll},
		{id:'shake',        w:5,  cd:10000, fn: b_shake},
		{id:'tiny_mode',    w:4,  cd:18000, fn: b_tiny_mode},
		{id:'huge_mode',    w:4,  cd:18000, fn: b_huge_mode},
		{id:'ghost_pass',   w:5,  cd:14000, fn: b_ghost_pass},
		{id:'rainbow',      w:3,  cd:22000, fn: b_rainbow},
		{id:'freeze_snap',  w:3,  cd:20000, fn: b_freeze_snap},
		{id:'float_high',   w:6,  cd:12000, fn: b_float_high},
		{id:'happy_dance',  w:5,  cd:13000, fn: b_happy_dance},
		{id:'ear_wiggle',   w:7,  cd:8000,  fn: b_ear_wiggle},
		{id:'spiral_in',    w:4,  cd:16000, fn: b_spiral_in},
		{id:'nothing1',     w:20, cd:2000,  fn: b_nothing},
		{id:'nothing2',     w:18, cd:2000,  fn: b_nothing2},
		{id:'nothing3',     w:15, cd:2000,  fn: b_nothing3},
		{id:'ping_series',  w:5,  cd:16000, fn: b_ping_series},
		{id:'H1_flash',     w:4,  cd:14000, fn: b_H1_flash},
		{id:'tilt_left',    w:7,  cd:7000,  fn: b_tilt_left},
		{id:'tilt_right',   w:7,  cd:7000,  fn: b_tilt_right},
		{id:'shrink_grow',  w:4,  cd:18000, fn: b_shrink_grow},
		{id:'mischief',     w:5,  cd:14000, fn: b_mischief_look},
		{id:'curious_wob',  w:6,  cd:10000, fn: b_curious_wobble},
		{id:'surp_jolt',    w:4,  cd:14000, fn: b_surp_jolt},
		{id:'idle_spinglow',w:5,  cd:11000, fn: b_idle_spin_glow},
		{id:'typewriter',   w:3,  cd:20000, fn: b_typewriter},

		/* MOUSE PLAY */
		{id:'tease_mouse',  w:8,  cd:12000, fn: b_tease_mouse},
		{id:'orbit_mouse',  w:6,  cd:18000, fn: b_orbit_mouse},
		{id:'peek_flee',    w:7,  cd:10000, fn: b_peek_then_flee},
		{id:'circle_esc',   w:5,  cd:12000, fn: b_circle_escape},
		{id:'zap_toward',   w:3,  cd:22000, fn: b_zap_toward_mouse},
		{id:'hide_corner',  w:4,  cd:16000, fn: b_hide_corner},
		{id:'look_mouse',   w:6,  cd:10000, fn: b_look_at_mouse},
		{id:'stalk_corner', w:4,  cd:20000, fn: b_stalk_from_corner},

		/* TUNNEL/WARP */
		{id:'tunnel',       w:6,  cd:18000, fn: b_tunnel},
		{id:'tunnel_mouse', w:4,  cd:22000, fn: b_tunnel_to_mouse},
		{id:'warp_across',  w:5,  cd:20000, fn: b_warp_across},
		{id:'echo_trail',   w:6,  cd:12000, fn: b_echo_trail},
		{id:'bounce_walls', w:4,  cd:16000, fn: b_bounce_walls},
		{id:'gravity_fall', w:5,  cd:14000, fn: b_gravity_fall},
		{id:'phase_thru',   w:4,  cd:18000, fn: b_phase_through},
		{id:'deep_dive',    w:3,  cd:20000, fn: b_deep_dive},
		{id:'edge_walk_r',  w:5,  cd:14000, fn: b_edge_walk_r},
		{id:'edge_walk_l',  w:5,  cd:14000, fn: b_edge_walk_l},

		/* DISCOVERY */
		{id:'goto_nav',     w:7,  cd:16000, fn: b_goto_nav},
		{id:'goto_heading', w:10, cd:10000, fn: b_goto_heading},
		{id:'goto_image',   w:8,  cd:12000, fn: b_goto_image, cond: function(){ return S.style.imgs > 0; }},
		{id:'goto_cta',     w:7,  cd:14000, fn: b_goto_cta},
		{id:'goto_form',    w:6,  cd:16000, fn: b_goto_form, cond: function(){ return S.style.forms > 0; }},
		{id:'goto_price',   w:6,  cd:14000, fn: b_goto_price, cond: function(){ return S.page.hasPrice; }},
		{id:'scan_page',    w:5,  cd:18000, fn: b_scan_page},
		{id:'scan_up',      w:6,  cd:12000, fn: b_scan_up},
		{id:'discover_dom', w:9,  cd:10000, fn: b_discover_dom},
		{id:'patrol',       w:4,  cd:22000, fn: b_ambient_patrol},
		{id:'content_hl',   w:5,  cd:16000, fn: b_content_highlight},
		{id:'star_burst',   w:4,  cd:14000, fn: b_star_burst},

		/* CONTENT REACTIONS */
		{id:'show_readtime',w:5,  cd:25000, fn: b_show_read_time, cond: function(){ return S.page.readMinutes > 1; }},
		{id:'show_scroll',  w:4,  cd:20000, fn: b_show_scroll_progress},
		{id:'react_page',   w:5,  cd:25000, fn: b_react_page_type},
		{id:'react_long',   w:4,  cd:30000, fn: b_react_long_article, cond: function(){ return S.page.isLongRead; }},
		{id:'react_video',  w:5,  cd:25000, fn: b_react_video, cond: function(){ return S.page.hasVideo; }},
		{id:'react_gallery',w:5,  cd:20000, fn: b_react_gallery, cond: function(){ return S.page.hasGallery; }},
		{id:'match_color',  w:4,  cd:25000, fn: b_match_site_color, cond: function(){ return !!S.style.accentCSS; }},
		{id:'report_links', w:3,  cd:30000, fn: b_report_links},
		{id:'report_imgs',  w:3,  cd:30000, fn: b_report_images},

		/* TIME BASED */
		{id:'time_greet',   w:5,  cd:60000, fn: b_time_greet},
		{id:'milestone',    w:4,  cd:60000, fn: b_visit_milestone},
		{id:'five_min',     w:3,  cd:60000, fn: b_five_min_notice},
		{id:'scroll_surf',  w:6,  cd:6000,  fn: b_scroll_surf},
		{id:'bounce_head',  w:8,  cd:8000,  fn: b_bounce_heading},
		{id:'woo_product',  w:5,  cd:20000, fn: b_woo_product_page, cond: function(){ return S.page.type === 'product'; }},
		{id:'celebrate',    w:4,  cd:20000, fn: b_celebrate_general},
		{id:'countdown',    w:2,  cd:30000, fn: b_countdown_exit}
	];

	BLIST.forEach(function(b) { b.lastRun = 0; });

	/* ══════════════════════════════════════════════════════
	   BEHAVIOR SCHEDULER
	══════════════════════════════════════════════════════ */
	var Sched = {

		tick: function() {
			clearTimeout(S.schedT);
			var delay = K.SCHED_MIN + Math.random() * (K.SCHED_MAX - K.SCHED_MIN);
			S.schedT = setTimeout(function() {
				if (['sleeping','loading'].indexOf(S.mode) === -1 && !S.teasing && !S.orbiting) {
					Sched.run();
				}
				Sched.tick();
			}, delay);
		},

		run: function() {
			var now = Date.now();
			var eligible = BLIST.filter(function(b) {
				return (now - b.lastRun > b.cd) && (!b.cond || b.cond());
			});
			if (!eligible.length) return;

			var chosen = ML.pick(eligible);
			if (!chosen) return;

			chosen.lastRun = now;
			chosen.fn();

			/* ML: track whether user engages within 5s */
			var bid = chosen.id;
			var trackT = setTimeout(function() { ML.penalize(bid); }, 5000);
			S['_mlT_'+bid] = trackT;
		}
	};

	/* ══════════════════════════════════════════════════════
	   EVENTS
	══════════════════════════════════════════════════════ */
	function bindEvents() {

		/* Mouse tracking */
		document.addEventListener('mousemove', function(e) {
			S.mx = e.clientX; S.my = e.clientY;
		}, { passive: true });

		/* Activity → reward ML + reset sleep timer */
		var activeEv = ['click','scroll','keydown','touchstart'];
		activeEv.forEach(function(ev) {
			document.addEventListener(ev, onActivity, { passive: true });
		});

		/* Hover on interactive elements */
		var SEL = 'a[href],button,input[type=submit],input[type=button],.btn,' +
		          '.wp-block-button__link,[class*=button],h1,h2,h3,' +
		          'input:not([type=hidden]),textarea,select,' +
		          '.woocommerce-Price-amount,[class*=price],img[src]';
		var prevEl = null;

		document.addEventListener('mouseover', function(e) {
			var t = e.target.closest(SEL);
			if (!t || t.closest('#harfo-root') || t === prevEl) return;
			prevEl = t;
			clearTimeout(S.hoverT);
			S.hoverT = setTimeout(function() { onHover(t); }, K.HOVER_WAIT);
		});

		document.addEventListener('mouseout', function(e) {
			var t = e.target.closest(SEL);
			if (!t || t !== prevEl) return;
			prevEl = null;
			clearTimeout(S.hoverT);
			clearTimeout(S.returnT);
			S.returnT = setTimeout(function() {
				if (['curious','helping'].indexOf(S.mode) !== -1) {
					Phys.goHome(); Expr.set('idle');
				}
			}, 1800);
		});

		/* Scroll */
		var scrollThrottle = null;
		window.addEventListener('scroll', function() {
			S.scrollY = window.scrollY;
			var maxScroll = document.body.scrollHeight - window.innerHeight;
			S.scrollDepth = maxScroll > 0 ? S.scrollY / maxScroll : 0;

			/* Scroll milestones */
			if (S.scrollDepth >= 0.5 && !S._m50) {
				S._m50 = true;
				Expr.say(_msg('scroll50'), 2000);
			}
			if (S.scrollDepth >= 0.98 && !S._m100) {
				S._m100 = true;
				Expr.forceSay(_msg('scroll100'), 2500);
				Expr.anim('ha-dance', 880);
			}

			clearTimeout(scrollThrottle);
			scrollThrottle = setTimeout(function() {
				if (['sleeping','loading'].indexOf(S.mode) === -1) {
					b_bounce_heading();
				}
			}, 250);
		}, { passive: true });

		/* Exit intent */
		document.addEventListener('mouseleave', function(e) {
			if (e.clientY <= 5) {
				Expr.set('surprise');
				Expr.anim('ha-scare', 560);
				Phys.goHome();
				S.lastSpeech = 0;
				Expr.say(_msg('exit'), 3800);
				setTimeout(function() { if (S.mode === 'surprise') Expr.set('idle'); }, 4200);
			}
		});

		/* Form submit */
		document.addEventListener('submit', function(e) {
			if (!e.target.closest('#harfo-root')) {
				setTimeout(function() {
					S.lastSpeech = 0;
					Expr.forceSay(_msg('formSent'), 2500);
					Expr.anim('ha-dance', 880);
				}, 400);
			}
		});

		/* WooCommerce add to cart */
		document.addEventListener('click', function(e) {
			if (e.target.closest('.add_to_cart_button,.single_add_to_cart_button'))
				setTimeout(b_woo_add_cart, 500);
		});

		/* Copy text reaction */
		document.addEventListener('copy', function() {
			Expr.say('کپی کردی! 📋', 1800);
		});

		/* Tap on orb */
		if (E.orb) {
			E.orb.addEventListener('click', function(e) {
				e.stopPropagation();
				/* ML reward */
				BLIST.forEach(function(b) {
					clearTimeout(S['_mlT_'+b.id]);
					ML.reward(b.id);
				});
				if (S.mode === 'sleeping') { wakeUp(); return; }
				Expr.jelly();
				S.lastSpeech = 0;
				Expr.say(_msg('tap'), 2000);
				Expr.anim('ha-spin', 700);
			});
		}

		/* Close */
		if (E.close) {
			E.close.addEventListener('click', function(e) {
				e.stopPropagation();
				setHidden(true); Mem.setHidden(true);
			});
		}

		/* Restore */
		if (E.restore) {
			E.restore.addEventListener('click', function() {
				setHidden(false); Mem.setHidden(false);
				Expr.set('idle');
				S.lastSpeech = 0;
				Expr.say(_msg('returnNew')[0] || 'برگشتم! 👋', 2200);
				Expr.jelly();
				resetSleepTimers();
			});
			E.restore.addEventListener('keydown', function(e) {
				if (e.key === 'Enter' || e.key === ' ') E.restore.click();
			});
		}

		/* Resize */
		window.addEventListener('resize', function() {
			S.vw = window.innerWidth; S.vh = window.innerHeight;
		});
	}

	function onHover(el) {
		var isBtn   = el.matches('button,a[href],input[type=submit],[class*=btn],.wp-block-button__link');
		var isHead  = el.matches('h1,h2,h3');
		var isInput = el.matches('input:not([type=hidden]),textarea,select');
		var isPrice = !!el.closest('.woocommerce-Price-amount,[class*=price]');
		var isImg   = el.matches('img');

		if (isBtn) {
			Expr.set('curious');
			Phys.approachEl(el, 'above');
			if (Math.random() < 0.38) Expr.say(_msg('btn'), 2000);
			_schedReturn(4500);
		} else if (isInput) {
			Expr.set('curious');
			Phys.approachEl(el, 'right');
			Expr.say(_msg('form'), 2600);
			_schedReturn(4500);
		} else if (isHead) {
			if (Math.random() < 0.3) Expr.say(_msg('reading'), 1500);
		} else if (isPrice) {
			if (Math.random() < 0.4) Expr.say(_msg('price'), 2000);
		} else if (isImg && Math.random() < 0.3) {
			_echoRingEl(el);
		}
	}

	function onActivity() {
		resetSleepTimers();
		/* ML reward for last few behaviors */
		BLIST.slice(-3).forEach(function(b) {
			if (Date.now() - b.lastRun < 5000) ML.reward(b.id);
		});
	}

	/* ══════════════════════════════════════════════════════
	   SLEEP / WAKE
	══════════════════════════════════════════════════════ */
	function resetSleepTimers() {
		clearTimeout(S.boredT); clearTimeout(S.sleepT);
		if (S.mode === 'sleeping') { wakeUp(); return; }

		S.boredT = setTimeout(function() {
			if (['idle','curious','reading'].indexOf(S.mode) !== -1) {
				Expr.set('idle'); /* just quiet down */
			}
		}, K.BORED_AFTER);

		S.sleepT = setTimeout(function() {
			if (['idle','reading','curious'].indexOf(S.mode) !== -1) {
				Expr.set('sleeping'); Phys.goHome();
			}
		}, K.SLEEP_AFTER);
	}

	function wakeUp() {
		Expr.set('surprise');
		Expr.anim('ha-scare', 580);
		setTimeout(function() {
			Expr.set('idle');
			Expr.forceSay('😊', 1500);
			resetSleepTimers();
		}, 700);
	}

	/* ══════════════════════════════════════════════════════
	   ENTRANCE SEQUENCE
	══════════════════════════════════════════════════════ */
	function doArrive() {
		Expr.set('idle');
		E.w && E.w.classList.add('ha-enter');
		setTimeout(function() { E.w && E.w.classList.remove('ha-enter'); }, 1000);

		var m = S.mem.v;
		var msg;
		if (m > 8)        msg = _msg('returnNew');
		else if (m > 0 && Date.now() - (S.mem.last||0) > 72*3600000) msg = _msg('returnOld');
		else              msg = _msg('greet', S.page.type);

		setTimeout(function() {
			Expr.forceSay(msg, 3200);
			Expr.anim('ha-spiral', 920);
		}, 500);

		/* Scan page and comment after short delay */
		setTimeout(function() {
			if (S.page.isLongRead && Math.random() < 0.5) b_show_read_time();
			else if (S.page.hasVideo)  b_react_video();
			else if (S.page.hasPrice)  b_goto_price();
		}, 5000);
	}

	/* ══════════════════════════════════════════════════════
	   HELPERS
	══════════════════════════════════════════════════════ */
	function _schedReturn(ms) {
		clearTimeout(S.returnT);
		S.returnT = setTimeout(function() {
			if (['curious','helping'].indexOf(S.mode) !== -1) {
				Phys.goHome(); Expr.set('idle');
			}
		}, ms);
	}

	function _portalRing(cx, cy, size) {
		var el = document.createElement('div');
		el.className = 'h-portal-ring';
		el.style.cssText = 'left:'+(cx - size/2)+'px;top:'+(cy - size/2)+'px;width:'+size+'px;height:'+size+'px;';
		document.body.appendChild(el);
		setTimeout(function() { el.parentNode && el.parentNode.removeChild(el); }, 700);
	}

	function _spawnSpeedLines(ox, oy, angle) {
		for (var i = 0; i < 4; i++) {
			var el = document.createElement('div');
			el.className = 'h-spline';
			var spread = (Math.random() - 0.5) * 40;
			var len = 40 + Math.random() * 50;
			el.style.cssText = 'left:'+ox+'px;top:'+(oy + spread)+'px;width:'+len+'px;transform-origin:0 50%;transform:rotate('+(_deg(angle))+'deg)';
			document.body.appendChild(el);
			setTimeout(function() { el.parentNode && el.parentNode.removeChild(el); }, 500);
		}
	}

	function _echoRingEl(el) {
		var r = el.getBoundingClientRect();
		var cx = r.left + r.width/2, cy = r.top + r.height/2;
		var ring = document.createElement('div');
		ring.className = 'h-echo-ring';
		var size = Math.max(60, Math.max(r.width, r.height));
		ring.style.cssText = 'left:'+(cx-size/2)+'px;top:'+(cy-size/2)+'px;width:'+size+'px;height:'+size+'px;';
		document.body.appendChild(ring);
		setTimeout(function() { ring.parentNode && ring.parentNode.removeChild(ring); }, 900);
	}

	function _deg(rad) { return (rad * 180 / Math.PI).toFixed(1); }

	function _parseRGB(css) {
		if (!css) return null;
		var m = css.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
		return m ? { r:+m[1], g:+m[2], b:+m[3] } : null;
	}

	function setHidden(v) {
		document.getElementById('harfo-root') &&
		document.getElementById('harfo-root').classList.toggle('h-hidden', v);
	}

	/* ══════════════════════════════════════════════════════
	   INIT
	══════════════════════════════════════════════════════ */
	function core() {
		E.root    = document.getElementById('harfo-root');
		E.w       = document.getElementById('harfo-w');
		E.orb     = document.getElementById('h-orb');
		E.hud     = document.getElementById('h-hud');
		E.msg     = document.getElementById('h-msg');
		E.dots    = document.getElementById('h-dots');
		E.close   = document.getElementById('h-close');
		E.restore = document.getElementById('h-restore');
		E.core    = document.querySelector('.g-core');
		E.ground  = document.querySelector('.g-ground');

		if (!E.w) return;

		if (Mem.isHidden()) { setHidden(true); return; }

		/* Load memory + increment visit */
		S.mem = Mem.load();
		S.mem.v   = (S.mem.v || 0) + 1;
		S.mem.last = Date.now();
		Mem.save(S.mem);

		/* Load ML weights */
		S.mlW = Mem.loadML();

		/* Run intelligence modules */
		S.style = StyleAI.run();
		S.page  = PageAI.scan();

		/* Init physics */
		Phys.loop();

		/* Bind events */
		bindEvents();

		/* Sleep timers */
		resetSleepTimers();

		/* Start behavior scheduler */
		Sched.tick();

		/* Arrive */
		setTimeout(doArrive, 200);

		/* Developer API */
		window.HarfoAI = {
			mode:   function() { return S.mode; },
			page:   function() { return S.page; },
			style:  function() { return S.style; },
			mem:    function() { return S.mem; },
			ml:     function() { return S.mlW; },
			say:    Expr.forceSay,
			anim:   Expr.anim,
			beh:    function(id) {
				var b = BLIST.find(function(x){ return x.id === id; });
				if (b) b.fn();
			},
			hide:   function() { setHidden(true);  Mem.setHidden(true);  },
			show:   function() { setHidden(false); Mem.setHidden(false); }
		};
	}

})();
