/* Harfehaval Sites Pro v3.4.1 — Optimized Vanilla JS App */
(function () {
	'use strict';

	var rootConfig  = window.haSitesPro || {};
	var apiBase     = rootConfig.apiBase || '';
	var settings    = rootConfig.settings || {};
	var i18n        = rootConfig.i18n || {};
	var previewBase = rootConfig.previewBase || '';
	var nonce = rootConfig.nonce || '';

	/* ── Utilities ── */
	function qs(ctx, sel)  { return (ctx || document).querySelector(sel); }
	function qsa(ctx, sel) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

	function esc(v) {
		return String(v == null ? '' : v).replace(/[&<>'"]/g, function (c) {
			return { '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;' }[c];
		});
	}

	function buildUrl(path, params) {
		var url = new URL(apiBase + path, window.location.origin);
		Object.keys(params || {}).forEach(function (k) {
			if (params[k] !== '' && params[k] != null) url.searchParams.set(k, params[k]);
		});
		return url.toString();
	}

	function debounce(fn, ms) {
		var t;
		return function () {
			var a = arguments, ctx = this;
			clearTimeout(t);
			t = setTimeout(function () { fn.apply(ctx, a); }, ms || 300);
		};
	}

	function money(val) {
		if (val === null || val === '' || val === undefined) return i18n.contact || 'تماس بگیرید';
		return Number(val).toLocaleString('fa-IR') + ' ' + (settings.currency || 'تومان');
	}

	function statusLabel(v) {
		return ({ new:'✨ جدید', popular:'🔥 پرفروش', featured:'⭐ ویژه', premium:'💎 پریمیوم' })[v] || '';
	}

	function domainOf(url) {
		try { return new URL(url).hostname.replace(/^www\./, ''); } catch(e) { return ''; }
	}

	function storageGet(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch(e) { return []; } }
	function storageSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} }

	/* Rating throttle: one rating per project per day, persisted in localStorage as "YYYY-M-D|rating" */
	function todayStr() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
	function getRatedToday(id) {
		try {
			var v = localStorage.getItem('ha_rated_' + id);
			if (!v) return null;
			var p = v.split('|');
			return p[0] === todayStr() ? (parseInt(p[1], 10) || 0) : null;
		} catch (e) { return null; }
	}
	function setRatedToday(id, rating) { try { localStorage.setItem('ha_rated_' + id, todayStr() + '|' + rating); } catch (e) {} }

	/* ── Hash state ──
	   Disabled by request: we no longer write filter state to the URL hash (it produced
	   ugly double-encoded Persian slugs like #cat=%25d8...). Filtering is held in memory only. */
	function parseHash() { return {}; }
	function encodeHash() { /* intentionally no-op — do not pollute the URL */ }

	/* ══════════════════════════════════════════════════════
	   Lazy Image Loader — IntersectionObserver based
	   ══════════════════════════════════════════════════════ */
	var _lazyObserver = null;

	function getLazyObserver() {
		if (_lazyObserver) return _lazyObserver;
		if (!('IntersectionObserver' in window)) return null;
		_lazyObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				var img = entry.target;
				var src    = img.getAttribute('data-src');
				var srcset = img.getAttribute('data-srcset');
				if (src) {
					img.src = src;
					img.removeAttribute('data-src');
				}
				if (srcset) {
					img.srcset = srcset;
					img.removeAttribute('data-srcset');
				}
				img.classList.remove('ha-lazy');
				_lazyObserver.unobserve(img);
			});
		}, { rootMargin: '300px 0px', threshold: 0 });
		return _lazyObserver;
	}

	function observeLazyImages(container) {
		var observer = getLazyObserver();
		if (!observer) {
			/* Fallback for browsers without IntersectionObserver */
			qsa(container || document, '.ha-lazy[data-src]').forEach(function (img) {
				img.src = img.getAttribute('data-src') || '';
				var s = img.getAttribute('data-srcset');
				if (s) img.srcset = s;
				img.removeAttribute('data-src');
				img.removeAttribute('data-srcset');
				img.classList.remove('ha-lazy');
			});
			return;
		}
		qsa(container || document, '.ha-lazy[data-src]').forEach(function (img) {
			observer.observe(img);
		});
	}

	/* ══════════════════════════════════════════════════════
	   App constructor
	   ══════════════════════════════════════════════════════ */
	function App(el) {
		this.el        = el;
		this._prefetched = {};
		this.cfg  = JSON.parse(el.getAttribute('data-ha-config') || '{}');
		this.hover = this.cfg.hover_effect || 'scroll';
		this.refs  = {
			grid:          qs(el, '[data-ha-grid]'),
			cats:          qs(el, '[data-ha-cats]'),
			features:      qs(el, '[data-ha-features]'),
			statuses:      qs(el, '[data-ha-statuses]'),
			search:        qs(el, '.ha-pro-search-input'),
			sort:          qs(el, '.ha-pro-sort'),
			counter:       qs(el, '[data-ha-counter]'),
			loadMore:      qs(el, '[data-ha-loadmore]'),
			empty:         qs(el, '[data-ha-empty]'),
			modal:         qs(el, '[data-ha-modal]'),
			frame:         qs(el, '[data-ha-frame]'),
			modalInfo:     qs(el, '[data-ha-modal-info]'),
			previewTitle:  qs(el, '[data-ha-preview-title]'),
			previewDomain: qs(el, '[data-ha-preview-domain]'),
			previewOpen:   qs(el, '[data-ha-preview-open]'),
			compareBar:    qs(el, '[data-ha-compare-bar]'),
			compareCount:  qs(el, '[data-ha-compare-count]'),
			compareList:   qs(el, '[data-ha-compare-list]'),
			compareModal:  qs(el, '[data-ha-compare-modal]'),
			compareContent:qs(el, '[data-ha-compare-content]'),
		};

		/* Parse URL hash into initial state */
		var hash = parseHash();
		this.state = {
			page:       1,
			loading:    false,
			total:      0,
			totalPages: 0,
			items:      {},
			order:      [],
			search:     hash.q   || '',
			category:   hash.cat || this.cfg.category || '',
			features:   (hash.feat ? hash.feat.split(',').filter(Boolean) : (this.cfg.feature ? String(this.cfg.feature).split(',').filter(Boolean) : [])),
			status:     hash.status || this.cfg.status || '',
			sort:       hash.sort   || this.cfg.sort   || 'newest',
			layout:     this.cfg.layout || 'grid',
			favorites:  storageGet('ha_fav_' + (el.id || 'all')),
			compare:    [],
		};

		this._io       = null;
		this._sentinel = null;

		this.init();
	}

	App.prototype.label = function (key, fallback) {
		return this.cfg[key] || i18n[key] || fallback || '';
	};

	App.prototype.init = function () {
		var self = this;
		/* Clean any old filter hash left in the URL by previous versions */
		if (location.hash && /(?:^|#)(cat|feat|status|q|sort)=/.test(location.hash)) {
			try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
		}
		this.applyLayout(this.state.layout);

		if (this.refs.search && this.state.search) {
			this.refs.search.value = this.state.search;
		}
		if (this.refs.sort) this.refs.sort.value = this.state.sort;

		this.bind();
		this.renderStatuses();
		this.loadFilters();
		this.load(true);

		/* Infinite scroll */
		if (this.cfg.pagination_type === 'infinite') {
			this._sentinel = document.createElement('div');
			this._sentinel.style.height = '10px';
			if (this.refs.loadMore && this.refs.loadMore.parentNode) {
				this.refs.loadMore.parentNode.insertBefore(this._sentinel, this.refs.loadMore.nextSibling);
				this.refs.loadMore.hidden = true;
			}
			this._io = new IntersectionObserver(function (entries) {
				if (entries[0].isIntersecting && !self.state.loading && self.state.page <= self.state.totalPages) {
					self.load(false);
				}
			}, { rootMargin: '200px' });
			this._io.observe(this._sentinel);
		}
	};

	App.prototype._modalContains = function (node) {
		return this.refs.modal && this.refs.modal.contains(node);
	};

	App.prototype.bind = function () {
		var self = this;

		/* Modal event delegation */
		if (this.refs.modal) {
			this.refs.modal.addEventListener('click', function (e) {
				var t = e.target, b;
				if ((b = t.closest('[data-ha-modal-close]')))      { self.closeModal(); return; }
				if ((b = t.closest('[data-ha-device]')))           { self.setDevice(b.getAttribute('data-ha-device')); return; }
				if ((b = t.closest('[data-ha-preview-info-toggle]'))) { self._toggleInfo(); return; }
				if ((b = t.closest('[data-ha-side-tab]')))         { self._activateSideTab(b.getAttribute('data-ha-side-tab')); return; }
				if ((b = t.closest('[data-ha-rate]'))) {
					var rating = parseInt(b.getAttribute('data-ha-rate'), 10);
					self._submitRating(rating);
					return;
				}

				if ((b = t.closest('.ha-pro-preview-open'))) {
					e.preventDefault();
					var href = b.href || b.getAttribute('href');
					if (href && href !== '#' && href !== window.location.href) {
						window.open(href, '_blank', 'noopener,noreferrer');
					} else if (self._currentItem && self._currentItem.demo_url) {
						window.open(self._currentItem.demo_url, '_blank', 'noopener,noreferrer');
					}
					return;
				}

				var shareToggle = t.closest('[data-ha-share-toggle]');
				if (shareToggle) {
					var wrap = shareToggle.closest('.ha-pro-share');
					if (wrap) wrap.classList.toggle('is-open');
					e.stopPropagation();
					return;
				}
				var shareItem = t.closest('.ha-pro-share-item');
				if (shareItem) {
					var copyVal = shareItem.getAttribute('data-copy');
					if (copyVal) {
						copyText(copyVal).then(function (ok) {
							toast(ok ? 'لینک کپی شد' : 'کپی نشد', ok ? 'success' : 'error', ok ? '📋' : '⚠️');
						});
					} else {
						var url = shareItem.getAttribute('data-share-url');
						if (url) window.open(url, '_blank', 'noopener');
					}
					var open = shareItem.closest('.ha-pro-share');
					if (open) open.classList.remove('is-open');
					return;
				}
			});

			this.refs.modal.addEventListener('wheel', function (e) {
				var side = e.target.closest('.ha-pro-preview-side');
				if (!side) return;
				if (side.scrollHeight > side.clientHeight) {
					e.preventDefault();
					side.scrollTop += e.deltaY;
				}
			}, { passive: false });
		}

		if (this.refs.search) {
			this.refs.search.addEventListener('input', debounce(function () {
				self.state.search = self.refs.search.value.trim();
				self.resetAndLoad();
			}, 300));
		}

		if (this.refs.sort) {
			this.refs.sort.addEventListener('change', function () {
				self.state.sort = self.refs.sort.value;
				self.resetAndLoad();
			});
		}

		/* Pre-fetch demo URL on hover so modal opens instantly */
		if (this.refs.grid) {
			this.refs.grid.addEventListener('mouseover', function (e) {
				var card = e.target.closest('[data-ha-card]');
				if (!card) return;
				var id = card.getAttribute('data-ha-card');
				if (!id || self._prefetched[id]) return;
				var item = self.state.items[id];
				if (!item || !item.demo_url) return;
				self._prefetched[id] = true;
				var link = document.createElement('link');
				link.rel  = 'prefetch';
				link.href = item.demo_url;
				document.head.appendChild(link);
			});
		}

		if (this.refs.loadMore) {
			this.refs.loadMore.addEventListener('click', function () { self.load(false); });
		}

		/* Delegated clicks inside the widget */
		this.el.addEventListener('click', function (e) {
			var t = e.target, b;
			if ((b = t.closest('[data-ha-cat]'))      && self.el.contains(b)) { self.state.category = b.getAttribute('data-ha-cat') || ''; self.resetAndLoad(); return; }
			if ((b = t.closest('[data-ha-feature]'))  && self.el.contains(b)) { self._toggleFeature(b.getAttribute('data-ha-feature')); return; }
			if ((b = t.closest('[data-ha-status]'))   && self.el.contains(b)) { self.state.status = b.getAttribute('data-ha-status') || ''; self.resetAndLoad(); return; }
			if ((b = t.closest('[data-ha-layout]'))   && self.el.contains(b)) { self.applyLayout(b.getAttribute('data-ha-layout')); return; }
			if ((b = t.closest('[data-ha-preview]'))  && self.el.contains(b)) { self.openPreview(b.getAttribute('data-ha-preview')); return; }
			if ((b = t.closest('[data-ha-favorite]')) && self.el.contains(b)) { self._toggleFavorite(b.getAttribute('data-ha-favorite')); return; }
			if ((b = t.closest('[data-ha-compare]'))  && self.el.contains(b)) { self._toggleCompare(b.getAttribute('data-ha-compare')); return; }
			if ((b = t.closest('[data-ha-modal-close]')) && self.el.contains(b)) { self.closeModal(); return; }
			if ((b = t.closest('[data-ha-device]'))   && self.el.contains(b)) { self.setDevice(b.getAttribute('data-ha-device')); return; }
			if ((b = t.closest('[data-ha-preview-info-toggle]')) && self.el.contains(b)) { self._toggleInfo(); return; }
			if ((b = t.closest('[data-ha-side-tab]')) && self.el.contains(b)) { self._activateSideTab(b.getAttribute('data-ha-side-tab')); return; }
			if ((b = t.closest('[data-ha-compare-open]'))  && self.el.contains(b)) { self._openCompareModal(); return; }
			if ((b = t.closest('[data-ha-compare-modal-close]')) && self.refs.compareModal && !self.refs.compareModal.hidden) { self._closeCompareModal(); return; }
			if ((b = t.closest('[data-ha-compare-clear]')) && self.el.contains(b)) { self.state.compare = []; self._updateCompare(); self._refreshCards(); return; }
			if ((b = t.closest('[data-ha-reset]'))    && self.el.contains(b)) { self.resetFilters(); return; }

			var heroOrder = t.closest('[data-ha-hero-order]');
			if (heroOrder && self.el.contains(heroOrder)) {
				e.preventDefault();
				var ph = (settings.whatsapp || '').replace(/\D/g, '');
				if (ph) window.open('https://wa.me/' + ph, '_blank', 'noopener');
				return;
			}

			var shareToggle = t.closest('[data-ha-share-toggle]');
			if (shareToggle) {
				var swrap = shareToggle.closest('.ha-pro-share');
				if (swrap) swrap.classList.toggle('is-open');
				e.stopPropagation();
				return;
			}
			var shareItem = t.closest('.ha-pro-share-item');
			if (shareItem) {
				var copyVal = shareItem.getAttribute('data-copy');
				if (copyVal) {
					copyText(copyVal).then(function (ok) {
						toast(ok ? 'لینک کپی شد' : 'کپی نشد', ok ? 'success' : 'error', ok ? '📋' : '⚠️');
					});
				} else {
					var surl = shareItem.getAttribute('data-share-url');
					if (surl) window.open(surl, '_blank', 'noopener');
				}
				var sopen = shareItem.closest('.ha-pro-share');
				if (sopen) sopen.classList.remove('is-open');
				return;
			}

			var qv = t.closest('[data-ha-quick-view]');
			if (qv) { e.preventDefault(); e.stopPropagation(); self.openPreview(qv.getAttribute('data-ha-quick-view')); return; }
		});

		/* Close share dropdown on outside click */
		document.addEventListener('click', function (e) {
			if (!e.target.closest('.ha-pro-share')) {
				qsa(document, '.ha-pro-share.is-open').forEach(function (s) { s.classList.remove('is-open'); });
			}
		});

		document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { self.closeModal(); self._closeCompareModal(); } });

		/* Preload iframe on card hover for instant open */
		this.el.addEventListener('mouseover', function (e) {
			var btn = e.target.closest('[data-ha-quick-view],[data-ha-preview]');
			if (!btn) return;
			var id = btn.getAttribute('data-ha-quick-view') || btn.getAttribute('data-ha-preview');
			var item = id && self.state.items[id];
			if (!item || !item.demo_url || !self.refs.frame) return;
			if (self._preloadUrl === item.demo_url) return;
			clearTimeout(self._preloadTimer);
			self._preloadTimer = setTimeout(function () {
				if (self.refs.modal && self.refs.modal.hidden !== false) {
					self._preloadUrl = item.demo_url;
					self.refs.frame.src = item.demo_url;
				}
			}, 300);
		});
		this.el.addEventListener('mouseout', function (e) {
			var btn = e.target.closest('[data-ha-quick-view],[data-ha-preview]');
			if (!btn) return;
			clearTimeout(self._preloadTimer);
		});
	};

	App.prototype._toggleFeature = function (slug) {
		if (!slug) { this.state.features = []; }
		else {
			var i = this.state.features.indexOf(slug);
			if (i >= 0) this.state.features.splice(i, 1);
			else this.state.features.push(slug);
		}
		this.resetAndLoad();
	};

	App.prototype.applyLayout = function (layout) {
		this.state.layout = layout;
		this.el.classList.remove('ha-sites-pro--grid', 'ha-sites-pro--list', 'ha-sites-pro--compact');
		this.el.classList.add('ha-sites-pro--' + layout);
		qsa(this.el, '[data-ha-layout]').forEach(function (b) {
			b.classList.toggle('is-active', b.getAttribute('data-ha-layout') === layout);
		});
	};

	App.prototype.resetAndLoad = function () {
		this.state.page = 1;
		encodeHash(this.state);
		this.load(true);
		this._syncFilters();
	};

	App.prototype.resetFilters = function () {
		this.state.search   = '';
		this.state.category = '';
		this.state.features = [];
		this.state.status   = '';
		if (this.refs.search) this.refs.search.value = '';
		this.resetAndLoad();
	};

	App.prototype._params = function () {
		return {
			page:     this.state.page,
			per_page: this.cfg.per_page || settings.per_page || 12,
			search:   this.state.search,
			category: this.state.category,
			features: this.state.features.join(','),
			status:   this.state.status,
			sort:     this.state.sort,
			/* cache-buster: guarantees filtered/search requests never hit a stale CDN/browser cache */
			_:        Date.now(),
		};
	};

	App.prototype.loadFilters = function () {
		var self = this;
		var cacheKey = 'ha_filters_v2_' + (apiBase || '');
		/* Paint cached chips instantly (if any), then refresh from the network */
		try {
			var cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
			if (cached && cached.categories) self._renderFilters(cached.categories, cached.features || []);
		} catch (e) {}
		fetch(buildUrl('filters', {}), { credentials: 'same-origin', headers: nonce ? { 'X-WP-Nonce': nonce } : {} })
			.then(function (r) { return r.json(); })
			.then(function (d) {
				self._renderFilters(d.categories || [], d.features || []);
				try { sessionStorage.setItem(cacheKey, JSON.stringify(d)); } catch (e) {}
			})
			.catch(function () {});
	};

	App.prototype._renderFilters = function (cats, feats) {
		var self = this;
		var showCounts = !!this.cfg.show_filter_counts;

		/* Use the numeric term ID as the filter value — it never gets mangled by URL/CDN
		   encode-decode the way Persian slugs do. Falls back to slug for old cached data. */
		function termVal(t) { return (t.id !== undefined && t.id !== null) ? String(t.id) : String(t.slug); }

		if (this.refs.cats) {
			var h = '<button type="button" class="ha-pro-chip ' + (!this.state.category ? 'is-active' : '') + '" data-ha-cat="">' + esc(this.label('all_categories_label', 'همه دسته‌بندی‌ها')) + '</button>';
			h += cats.map(function (t) {
				var v = termVal(t);
				return '<button type="button" class="ha-pro-chip' + (self.state.category === v ? ' is-active' : '') + '" data-ha-cat="' + esc(v) + '">' + esc(t.name) + (showCounts ? '<small>' + esc(t.count) + '</small>' : '') + '</button>';
			}).join('');
			this.refs.cats.innerHTML = h;
		}

		if (this.refs.features) {
			var fh = '<button type="button" class="ha-pro-chip ' + (!this.state.features.length ? 'is-active' : '') + '" data-ha-feature="">' + esc(this.label('all_features_label', 'همه ویژگی‌ها')) + '</button>';
			fh += feats.map(function (t) {
				var v = termVal(t);
				return '<button type="button" class="ha-pro-chip' + (self.state.features.indexOf(v) >= 0 ? ' is-active' : '') + '" data-ha-feature="' + esc(v) + '">' + esc(t.name) + (showCounts ? '<small>' + esc(t.count) + '</small>' : '') + '</button>';
			}).join('');
			this.refs.features.innerHTML = fh;
		}
	};

	App.prototype.renderStatuses = function () {
		if (!this.refs.statuses) return;
		var self = this;
		var items = [
			['', this.label('all_status_label', 'همه وضعیت‌ها')],
			['new','✨ جدید'], ['popular','🔥 پرفروش'], ['featured','⭐ ویژه'], ['premium','💎 پریمیوم'],
		];
		this.refs.statuses.innerHTML = items.map(function (s) {
			return '<button type="button" class="ha-pro-chip ha-pro-status-chip' + (self.state.status === s[0] ? ' is-active' : '') + '" data-ha-status="' + esc(s[0]) + '">' + esc(s[1]) + '</button>';
		}).join('');
	};

	App.prototype.load = function (reset) {
		var self = this;
		/* A "load more" (reset=false) while a request is already running is a duplicate — ignore it.
		   But a reset (filter/category/search change) must ALWAYS go through: abort the in-flight
		   request and start fresh, otherwise filter clicks during a slow load are silently dropped. */
		if (this.state.loading && !reset) return;
		if (this._ctrl) this._ctrl.abort();
		this._ctrl = new AbortController();
		this.state.loading = true;

		if (reset) {
			this.state.items = {};
			this.state.order = [];
			this._renderSkeleton();
		}

		var thisCtrl = this._ctrl;
		fetch(buildUrl('sites', this._params()), { credentials: 'same-origin', cache: 'no-store', signal: thisCtrl.signal, headers: nonce ? { 'X-WP-Nonce': nonce } : {} })
			.then(function (r) { return r.json(); })
			.then(function (d) {
				var items = d.items || [];
				self.state.total      = d.total || 0;
				self.state.totalPages = d.total_pages || 0;
				items.forEach(function (item) {
					self.state.items[item.id] = item;
					if (self.state.order.indexOf(String(item.id)) < 0) self.state.order.push(String(item.id));
				});
				self._renderItems(items, reset);
				self._updateUi();
				self.state.page += 1;
			})
			.catch(function (err) { if (err.name !== 'AbortError') self._renderError(); })
			.finally(function () { if (thisCtrl === self._ctrl) self.state.loading = false; });
	};

	App.prototype._renderSkeleton = function () {
		if (!this.refs.grid) return;
		var n = Math.min(6, Number(this.cfg.per_page || 6));
		this.refs.grid.innerHTML = Array.from({ length: n }).map(function () {
			return '<div class="ha-pro-skeleton" aria-hidden="true"><span></span><b></b><i></i><em></em></div>';
		}).join('');
	};

	App.prototype._renderError = function () {
		if (this.refs.grid) this.refs.grid.innerHTML = '';
		if (this.refs.empty) this.refs.empty.hidden = false;
	};

	App.prototype._renderItems = function (items, reset) {
		if (!this.refs.grid) return;
		var html = items.map(this._cardHtml.bind(this)).join('');
		if (reset) {
			this.refs.grid.innerHTML = html;
		} else {
			this.refs.grid.innerHTML += html;
		}
		this._refreshCards();
		/* Activate lazy loading for newly inserted images */
		observeLazyImages(this.refs.grid);
	};

	App.prototype._cardHtml = function (item) {
		var self = this;
		var cfg  = this.cfg;
		var badge = cfg.show_badge ? statusLabel(item.status) : '';
		var order = this._whatsappUrl(item);

		var img = '';
		if (cfg.show_image) {
			var thumbHtml;
			if (item.thumb) {
				/* Use data-src / data-srcset for lazy loading — src gets a 1px transparent placeholder */
				var srcsetAttr = item.thumb_srcset
					? ' data-srcset="' + esc(item.thumb_srcset) + '" sizes="' + esc(item.thumb_sizes || '(min-width:1200px) 33vw,(min-width:768px) 50vw,100vw') + '"'
					: '';
				thumbHtml = '<img class="ha-lazy"' +
					' src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'/%3E"' +
					' data-src="' + esc(item.thumb) + '"' +
					srcsetAttr +
					' alt="' + esc(item.thumb_alt || item.title) + '"' +
					' decoding="async" width="800" height="600">';
			} else {
				thumbHtml = '<div class="ha-pro-no-thumb">⌁</div>';
			}

			var quickView = (cfg.show_preview_button && item.demo_url)
				? '<button type="button" class="ha-pro-quick-view" data-ha-quick-view="' + esc(item.id) + '">👁 پیش‌نمایش سریع</button>'
				: '';
			var codeBadge = item.code
				? '<span class="ha-pro-code-badge">' + esc(item.code) + '</span>'
				: '';
			var ratingBadge = (cfg.show_rating && item.rating)
				? '<span class="ha-pro-rating-badge">⭐ ' + esc(Number(item.rating).toLocaleString('fa-IR')) + '</span>'
				: '';
			var viewBadge = (cfg.show_view_count && item.view_count)
				? '<span class="ha-pro-view-count">👁 ' + esc(Number(item.view_count).toLocaleString('fa-IR')) + '</span>'
				: '';

			img = '<div class="ha-pro-thumb">' +
				(badge ? '<span class="ha-pro-badge ha-pro-badge-' + esc(item.status) + '">' + esc(badge) + '</span>' : '') +
				thumbHtml + quickView + codeBadge + ratingBadge + viewBadge +
				'</div>';
		}

		var tools = '';
		if (cfg.show_favorite || cfg.show_compare) {
			tools = '<div class="ha-pro-card-tools">' +
				(cfg.show_favorite ? '<button type="button" class="ha-pro-tool" data-ha-favorite="' + esc(item.id) + '" aria-label="علاقه‌مندی">♡</button>' : '') +
				(cfg.show_compare  ? '<button type="button" class="ha-pro-tool" data-ha-compare="'  + esc(item.id) + '" aria-label="مقایسه">⇄</button>' : '') +
				'</div>';
		}

		var facts = '';
		if (cfg.show_project_type && item.project_type) facts += '<span>🏷 ' + esc(item.project_type) + '</span>';
		if (cfg.show_pages_count  && item.pages_count)  facts += '<span>📄 ' + esc(item.pages_count) + '</span>';
		if (cfg.show_support      && item.support)       facts += '<span>🛟 ' + esc(item.support) + '</span>';
		if (cfg.show_tech_stack   && item.tech_stack)    facts += '<span>⚙️ ' + esc(item.tech_stack) + '</span>';

		var feats = '';
		if (cfg.show_features) {
			feats = (item.features || []).slice(0, 5).map(function (f) { return '<span>' + esc(f.name) + '</span>'; }).join('');
		}

		var meta = '';
		if (cfg.show_delivery    && item.delivery)    meta += '<span class="ha-pro-meta-item">⏱ ' + esc(item.delivery) + '</span>';
		if (cfg.show_installment && item.installment) meta += '<span class="ha-pro-meta-item">💳 ' + esc(item.installment) + '</span>';

		var previewBtn = '';
		if (cfg.show_preview_button && item.demo_url) {
			previewBtn = '<button type="button" class="ha-pro-btn ha-pro-btn-secondary" data-ha-preview="' + esc(item.id) + '"><span class="ha-pro-btn-text">' + esc(self.label('preview_label', 'جزئیات بیشتر')) + '</span><span class="ha-pro-btn-arrow" aria-hidden="true">←</span></button>';
		}
		var orderBtn = '';
		if (cfg.show_order_button && item.demo_url) {
			orderBtn = '<a class="ha-pro-btn ha-pro-btn-primary" href="' + esc(item.demo_url) + '" target="_blank" rel="noopener noreferrer">' + esc(self.label('new_tab_label', 'نمایش در مرورگر')) + '</a>';
		} else if (cfg.show_order_button && order) {
			orderBtn = '<a class="ha-pro-btn ha-pro-btn-primary" href="' + esc(order) + '" target="_blank" rel="noopener noreferrer">' + esc(self.label('order_label', 'سفارش سایت')) + '</a>';
		}

		return '<article class="ha-pro-card" data-ha-card="' + esc(item.id) + '" data-hover="' + esc(this.hover) + '" role="listitem">' +
			img + tools +
			'<div class="ha-pro-card-body">' +
				(item.highlight ? '<div class="ha-pro-highlight">' + esc(item.highlight) + '</div>' : '') +
				'<h3 class="ha-pro-card-title">' + esc(item.title) + '</h3>' +
				(cfg.show_excerpt ? '<p class="ha-pro-card-excerpt">' + esc(item.excerpt || '') + '</p>' : '') +
				(facts ? '<div class="ha-pro-facts">' + facts + '</div>' : '') +
				(feats ? '<div class="ha-pro-card-features">' + feats + '</div>' : '') +
				(meta  ? '<div class="ha-pro-meta">' + meta + '</div>' : '') +
				(cfg.show_price ? '<div class="ha-pro-price-row"><div>' +
					'<div class="ha-pro-price' + (item.price === null ? ' is-free' : '') + '">' + esc(money(item.price)) + '</div>' +
					(cfg.show_old_price && item.old_price ? '<div class="ha-pro-old-price">' + esc(money(item.old_price)) + '</div>' : '') +
				'</div></div>' : '') +
				((previewBtn || orderBtn) ? '<div class="ha-pro-actions">' + previewBtn + orderBtn + '</div>' : '') +
			'</div>' +
		'</article>';
	};

	App.prototype._whatsappUrl = function (item) {
		if (item.order_url) return item.order_url;
		var ph = (settings.whatsapp || '').replace(/\D/g, '');
		if (!ph) return '';
		var title = item.title || '';
		var code  = item.code  || '';
		var msg;
		if (code) {
			msg = 'سلام، می‌خواهم قالب «' + title + '» با کد «' + code + '» را سفارش دهم. مشخصات: ';
		} else {
			msg = settings.whatsapp_text
				? settings.whatsapp_text.replace('%s', title)
				: 'سلام، می‌خواهم سایت «' + title + '» را سفارش بدهم';
		}
		return 'https://wa.me/' + ph + '?text=' + encodeURIComponent(msg);
	};

	App.prototype._updateUi = function () {
		var shown = Math.min(this.state.page * Number(this.cfg.per_page || 12), this.state.total);
		if (this.refs.counter) {
			this.refs.counter.textContent = this.state.total
				? ('نمایش ' + shown.toLocaleString('fa-IR') + ' از ' + Number(this.state.total).toLocaleString('fa-IR') + ' نتیجه')
				: '';
		}
		if (this.refs.empty)    this.refs.empty.hidden    = this.state.total !== 0;
		if (this.refs.loadMore) this.refs.loadMore.hidden = !(this.state.page <= this.state.totalPages) || this.cfg.pagination_type === 'infinite';
		this._syncFilters();
		this.renderStatuses();
	};

	App.prototype._syncFilters = function () {
		var self = this;
		qsa(this.el, '[data-ha-cat]').forEach(function (b)     { b.classList.toggle('is-active', (b.getAttribute('data-ha-cat') || '') === self.state.category); });
		qsa(this.el, '[data-ha-feature]').forEach(function (b) {
			var slug = b.getAttribute('data-ha-feature') || '';
			b.classList.toggle('is-active', slug ? self.state.features.indexOf(slug) >= 0 : self.state.features.length === 0);
		});
		qsa(this.el, '[data-ha-status]').forEach(function (b)  { b.classList.toggle('is-active', (b.getAttribute('data-ha-status') || '') === self.state.status); });
	};

	App.prototype._toggleFavorite = function (id) {
		id = String(id);
		var list = this.state.favorites;
		var was  = list.indexOf(id) >= 0;
		if (was) list = list.filter(function (x) { return x !== id; });
		else list.push(id);
		this.state.favorites = list;
		storageSet('ha_fav_' + (this.el.id || 'all'), list);
		this._refreshCards();
		toast(was ? 'از علاقه‌مندی‌ها حذف شد' : 'به علاقه‌مندی‌ها افزوده شد', was ? 'info' : 'success', was ? '🤍' : '❤️');
	};

	App.prototype._toggleCompare = function (id) {
		id = String(id);
		var list = this.state.compare.slice();
		var idx  = list.indexOf(id);
		var was  = idx >= 0;
		if (was) {
			list.splice(idx, 1);
		} else {
			if (list.length >= 3) { list.shift(); toast('قدیمی‌ترین آیتم حذف شد (حداکثر ۳)', 'info', '⚠️'); }
			list.push(id);
		}
		this.state.compare = list;
		this._updateCompare();
		this._refreshCards();
		if (!was && list.length) toast('به مقایسه افزوده شد', 'success', '⇄');
	};

	App.prototype._refreshCards = function () {
		var self = this;
		qsa(this.el, '[data-ha-card]').forEach(function (card) {
			var id = String(card.getAttribute('data-ha-card'));
			card.classList.toggle('is-favorite', self.state.favorites.indexOf(id) >= 0);
			card.classList.toggle('is-compared',  self.state.compare.indexOf(id) >= 0);
			var fav = qs(card, '[data-ha-favorite]');
			if (fav) fav.innerHTML = self.state.favorites.indexOf(id) >= 0 ? '♥' : '♡';
			var cmp = qs(card, '[data-ha-compare]');
			if (cmp) cmp.classList.toggle('is-active', self.state.compare.indexOf(id) >= 0);
		});
	};

	App.prototype._updateCompare = function () {
		var self = this;
		if (!this.refs.compareBar) return;
		this.refs.compareBar.hidden = !this.state.compare.length;
		if (this.refs.compareCount) this.refs.compareCount.textContent = Number(this.state.compare.length).toLocaleString('fa-IR');
		if (this.refs.compareList) {
			this.refs.compareList.innerHTML = this.state.compare.map(function (id) {
				return self.state.items[id] ? '<span>' + esc(self.state.items[id].title) + '</span>' : '';
			}).join('');
		}
	};

	App.prototype._openCompareModal = function () {
		if (!this.refs.compareModal || !this.state.compare.length) return;
		if (this.refs.compareContent) this.refs.compareContent.innerHTML = this._buildCompareHtml();
		this.refs.compareModal.hidden = false;
		this.refs.compareModal.setAttribute('aria-hidden', 'false');
		document.documentElement.classList.add('ha-pro-modal-open');

		/* Route all wheel events inside the modal to the scrollable body */
		var body = this.refs.compareContent && this.refs.compareContent.closest('.ha-pro-compare-modal-body');
		if (body && !this._cmpWheelBound) {
			this._cmpWheelHandler = function (e) {
				/* if the body itself can scroll in the requested direction, consume the event */
				var atTop    = body.scrollTop === 0;
				var atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
				if (!(atTop && e.deltaY < 0) && !(atBottom && e.deltaY > 0)) {
					e.stopPropagation();
				}
				/* always prevent page scroll */
				e.preventDefault();
				body.scrollTop += e.deltaY;
			};
			this.refs.compareModal.addEventListener('wheel', this._cmpWheelHandler, { passive: false });
			this._cmpWheelBound = true;
		}
	};

	App.prototype._closeCompareModal = function () {
		if (!this.refs.compareModal) return;
		this.refs.compareModal.hidden = true;
		this.refs.compareModal.setAttribute('aria-hidden', 'true');
		if (!this.refs.modal || this.refs.modal.hidden) document.documentElement.classList.remove('ha-pro-modal-open');
		if (this._cmpWheelHandler) {
			this.refs.compareModal.removeEventListener('wheel', this._cmpWheelHandler);
			this._cmpWheelBound  = false;
			this._cmpWheelHandler = null;
		}
	};

	App.prototype._buildCompareHtml = function () {
		var self  = this;
		var items = this.state.compare.map(function (id) { return self.state.items[id]; }).filter(Boolean);
		if (!items.length) return '<p class="ha-pro-compare-empty">موردی برای مقایسه انتخاب نشده است.</p>';

		function techBadges(stack) {
			if (!stack) return '—';
			return stack.split(/[,،]/).map(function (t) {
				var s = t.trim();
				return s ? '<span class="ha-pro-tech-badge">' + esc(s) + '</span>' : '';
			}).join('');
		}
		function stars(avg) {
			if (!avg) return '—';
			var full = Math.round(avg);
			var out = '';
			for (var i = 1; i <= 5; i++) out += i <= full ? '★' : '☆';
			return '<span class="ha-pro-compare-stars">' + out + ' <small>' + avg.toFixed(1) + '</small></span>';
		}
		function feats(item) {
			if (!item.features || !item.features.length) return '—';
			return item.features.map(function (f) { return '<span class="ha-pro-tech-badge">' + esc(f.name) + '</span>'; }).join('');
		}
		function price(item) {
			if (!item.price) return '—';
			var p = Number(item.price).toLocaleString('fa-IR');
			var old = item.old_price ? '<del>' + Number(item.old_price).toLocaleString('fa-IR') + '</del> ' : '';
			return old + p + ' تومان';
		}

		var cols = items.length;
		var colWidth = Math.floor(100 / cols) + '%';

		var rows = [
			{ label: 'تصویر',    render: function (item) { return item.thumb ? '<img class="ha-pro-compare-thumb" src="' + esc(item.thumb) + '" alt="' + esc(item.title) + '" loading="lazy">' : '<div class="ha-pro-compare-no-thumb">بدون تصویر</div>'; } },
			{ label: 'عنوان',    render: function (item) { return '<strong>' + esc(item.title) + '</strong>'; } },
			{ label: 'قیمت',     render: price },
			{ label: 'امتیاز',   render: function (item) { return stars(item.user_rating_avg); } },
			{ label: 'نوع',      render: function (item) { return esc(item.project_type) || '—'; } },
			{ label: 'تکنولوژی', render: function (item) { return techBadges(item.tech_stack); } },
			{ label: 'تحویل',    render: function (item) { return esc(item.delivery) || '—'; } },
			{ label: 'پشتیبانی', render: function (item) { return esc(item.support) || '—'; } },
			{ label: 'امکانات',  render: feats },
		];

		var html = '<div class="ha-pro-compare-grid" style="--ha-cmp-cols:' + cols + '">';

		/* Header row with remove buttons */
		html += '<div class="ha-pro-compare-row ha-pro-compare-header-row">';
		html += '<div class="ha-pro-compare-label-cell"></div>';
		items.forEach(function (item) {
			html += '<div class="ha-pro-compare-cell ha-pro-compare-head-cell">' +
				'<span>' + esc(item.title) + '</span>' +
				'</div>';
		});
		html += '</div>';

		rows.forEach(function (row) {
			html += '<div class="ha-pro-compare-row">';
			html += '<div class="ha-pro-compare-label-cell">' + row.label + '</div>';
			items.forEach(function (item) {
				html += '<div class="ha-pro-compare-cell">' + row.render(item) + '</div>';
			});
			html += '</div>';
		});

		html += '</div>';

		/* Action row */
		html += '<div class="ha-pro-compare-actions">';
		items.forEach(function (item) {
			if (item.demo_url) {
				html += '<a class="ha-pro-btn ha-pro-btn-primary" href="' + esc(item.demo_url) + '" target="_blank" rel="noopener noreferrer">مشاهده ' + esc(item.title) + '</a>';
			}
		});
		html += '</div>';

		return html;
	};

	/* ── Modal ── */
	App.prototype.openPreview = function (id) {
		var item = this.state.items[id];
		if (!item || !item.demo_url) return;
		if (this.cfg.preview_mode === 'direct' || !this.cfg.modal) { window.open(item.demo_url, '_blank', 'noopener'); return; }
		if (this.cfg.preview_mode === 'page') { window.open(previewBase + '?browser_url=' + encodeURIComponent(item.demo_url), '_blank', 'noopener'); return; }
		this._openModal(item);
	};

	App.prototype._openModal = function (item) {
		if (!this.refs.modal || !this.refs.frame) return;
		this._currentItem = item;
		var self = this;
		var wrap = this.refs.frame.closest('.ha-pro-frame-wrap');

		/* Portal: move modal to <body> on first open */
		if (!this._modalPortaled) {
			this._modalParent = this.refs.modal.parentNode;
			document.body.appendChild(this.refs.modal);
			this._modalPortaled = true;
		}

		this._addRecent(item.id);

		/* Track view — fire and forget */
		(function(id, state) {
			fetch(buildUrl('sites/' + id + '/view', {}), { method: 'POST', headers: nonce ? { 'X-WP-Nonce': nonce } : {} })
				.then(function(r) { return r.ok ? r.json() : null; })
				.then(function(d) { if (d && d.view_count !== undefined && state[id]) state[id].view_count = d.view_count; })
				.catch(function() {});
		})(item.id, this.state.items);

		/* Clear previous state */
		if (wrap) wrap.classList.remove('is-blocked', 'is-loading');
		var oldErr = wrap ? wrap.querySelector('.ha-pro-frame-fallback') : null;
		if (oldErr) oldErr.remove();
		var oldLdr = wrap ? wrap.querySelector('.ha-pro-loading-overlay') : null;
		if (oldLdr) oldLdr.remove();

		/* ── Beautiful circular loading overlay ── */
		var TIMEOUT_MS   = 30000; /* 30 seconds — gives slow servers time to respond */
		var circumference = 263.9; /* 2 * π * 42 */
		var loadingEl    = null;
		var fillEl       = null;
		var pctEl        = null;
		var startTime    = Date.now();
		var loaded       = false;

		if (wrap) {
			loadingEl = document.createElement('div');
			loadingEl.className = 'ha-pro-loading-overlay';
			var domain = domainOf(item.demo_url) || item.demo_url || '';
			loadingEl.innerHTML =
				'<div class="ha-pro-ldr-ring">' +
					'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
						'<circle class="ha-pro-ldr-track" cx="50" cy="50" r="42"/>' +
						'<circle class="ha-pro-ldr-fill"  cx="50" cy="50" r="42"/>' +
					'</svg>' +
					'<span class="ha-pro-ldr-pct">0%</span>' +
				'</div>' +
				'<div class="ha-pro-ldr-label">' +
					'در حال بارگذاری' +
					'<span class="ha-pro-ldr-dots"><span>.</span><span>.</span><span>.</span></span>' +
				'</div>' +
				(domain ? '<div class="ha-pro-ldr-domain">' + esc(domain) + '</div>' : '');
			wrap.appendChild(loadingEl);
			fillEl = loadingEl.querySelector('.ha-pro-ldr-fill');
			pctEl  = loadingEl.querySelector('.ha-pro-ldr-pct');
		}

		/* ── Mobile: while the site loads, nudge the user to read the details below ── */
		var loadStage = wrap ? wrap.closest('.ha-pro-frame-stage') : null;
		this._removeLoadingHint = function () {
			if (loadStage) loadStage.classList.remove('is-loading-hint');
			var h = loadStage ? loadStage.querySelector('.ha-pro-load-hint') : null;
			if (h && h.parentNode) h.remove();
		};
		if (loadStage && window.innerWidth <= 768) {
			this._removeLoadingHint();
			var hint = document.createElement('div');
			hint.className = 'ha-pro-load-hint';
			hint.innerHTML =
				'<span class="ha-pro-load-hint-text">تا بارگذاری سایت، جزئیات قالب را ببینید</span>' +
				'<span class="ha-pro-load-hint-arrow" aria-hidden="true">⌄</span>';
			loadStage.appendChild(hint);
			loadStage.classList.add('is-loading-hint');
		}

		/* rAF loop: smoothly advance progress 0→98% over TIMEOUT_MS */
		function rafTick() {
			if (loaded) return;
			var elapsed = Date.now() - startTime;
			var pct     = Math.min(98, (elapsed / TIMEOUT_MS) * 100);
			if (fillEl) fillEl.style.strokeDashoffset = String(circumference * (1 - pct / 100));
			if (pctEl)  pctEl.textContent = Math.round(pct) + '%';
			if (pct < 98) self._ldrRaf = requestAnimationFrame(rafTick);
		}
		cancelAnimationFrame(self._ldrRaf);
		self._ldrRaf = requestAnimationFrame(rafTick);

		clearTimeout(this._frameTimer);

		function onFrameLoaded() {
			loaded = true;
			cancelAnimationFrame(self._ldrRaf);
			clearTimeout(self._frameTimer);
			if (self._removeLoadingHint) self._removeLoadingHint();
			/* Complete to 100% then fade out */
			if (fillEl) fillEl.style.strokeDashoffset = '0';
			if (pctEl)  pctEl.textContent = '100%';
			if (loadingEl) {
				loadingEl.style.opacity = '0';
				setTimeout(function () { if (loadingEl && loadingEl.parentNode) loadingEl.remove(); }, 420);
			}
			if (wrap) wrap.classList.remove('is-loading');
		}

		this.refs.frame.onload = onFrameLoaded;

		this._frameTimer = setTimeout(function () {
			if (!loaded && wrap) {
				loaded = true;
				cancelAnimationFrame(self._ldrRaf);
				if (self._removeLoadingHint) self._removeLoadingHint();
				if (loadingEl && loadingEl.parentNode) loadingEl.remove();
				wrap.classList.add('is-blocked');
				var fb = document.createElement('div');
				fb.className = 'ha-pro-frame-fallback';
				fb.innerHTML =
					'<div class="ha-pro-frame-fallback-box">' +
					'<div class="ha-pro-fallback-icon">🔒</div>' +
					'<h3>پیش‌نمایش مستقیم در دسترس نیست</h3>' +
					'<p>به دلایل فنی یا امنیتی، این سایت اجازه نمایش داخل قاب را نمی‌دهد.<br>برای مشاهده سایت اصلی، دکمه زیر را بزنید:</p>' +
					'<a class="ha-pro-btn ha-pro-btn-primary ha-pro-fallback-open" href="' + esc(item.demo_url) + '" target="_blank" rel="noopener noreferrer">مشاهده کامل سایت ↗</a>' +
					'</div>';
				wrap.appendChild(fb);
			}
		}, TIMEOUT_MS);

		if (this._preloadUrl !== item.demo_url) {
			this.refs.frame.src = item.demo_url;
		}
		this._preloadUrl = null;
		clearTimeout(this._preloadTimer);

		if (this.refs.previewTitle)  this.refs.previewTitle.textContent  = item.title || '';
		if (this.refs.previewDomain) this.refs.previewDomain.textContent = domainOf(item.demo_url) || item.demo_url || '';
		if (this.refs.previewOpen)   this.refs.previewOpen.href = item.demo_url;
		if (this.refs.modalInfo)     this.refs.modalInfo.innerHTML = this._sideHtml(item);

		/* Share button — remove old first, then insert fresh (prevents duplication) */
		var actions = qs(this.refs.modal, '.ha-pro-preview-actions');
		if (actions) {
			var oldShare = qs(actions, '[data-ha-copy-btn]');
			if (oldShare) oldShare.remove();
			var copyBtn = document.createElement('button');
			copyBtn.type = 'button';
			copyBtn.className = 'ha-pro-share-copy-btn';
			copyBtn.setAttribute('data-ha-copy-btn', '1');
			copyBtn.setAttribute('data-copy', item.demo_url || '');
			copyBtn.innerHTML = '<span class="ha-pro-copy-icon">📋</span>کپی لینک';
			copyBtn.addEventListener('click', function () {
				copyText(item.demo_url || '').then(function (ok) {
					toast(ok ? 'لینک کپی شد' : 'کپی نشد', ok ? 'success' : 'error', ok ? '📋' : '⚠️');
				});
			});
			actions.insertBefore(copyBtn, actions.firstChild);
		}

		this.refs.modal.hidden = false;
		this.refs.modal.setAttribute('aria-hidden', 'false');
		document.documentElement.classList.add('ha-pro-modal-open');

		/* Urgency counter — smart, based on real view count (hidden for low-traffic items) */
		var urgencyEl = this.refs.modal ? this.refs.modal.querySelector('.ha-pro-urgency') : null;
		if (this._urgencyTimer) { clearInterval(this._urgencyTimer); this._urgencyTimer = null; }
		if (urgencyEl) {
			var viewers = this._urgencyViewers(item);
			if (viewers >= 2) {
				urgencyEl.textContent = viewers + ' نفر در حال مشاهده';
				this._startUrgencyTick(urgencyEl, item);
			} else {
				urgencyEl.textContent = '';
			}
		}

		this.setDevice('desktop');

		/* Mobile: details panel starts CLOSED */
		var stage = this.refs.frame ? this.refs.frame.closest('.ha-pro-frame-stage') : null;
		if (stage) {
			var isMobile = window.innerWidth <= 768;
			stage.classList.toggle('is-info-hidden', isMobile);
		}
	};

	App.prototype._sideHtml = function (item) {
		var self  = this;
		var order = this._whatsappUrl(item);
		var feats = (item.features || []).map(function (f) { return '<span>' + esc(f.name) + '</span>'; }).join('');
		var facts = '';
		[['نوع پروژه', item.project_type], ['صفحات', item.pages_count], ['پشتیبانی', item.support], ['تحویل', item.delivery], ['پرداخت', item.installment]].forEach(function (r) {
			if (r[1]) facts += '<li><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></li>';
		});
		if (item.tech_stack) {
			var techHtml = item.tech_stack.split(/[,،]/).map(function (t) {
				var s = t.trim(); return s ? '<span class="ha-pro-tech-badge">' + esc(s) + '</span>' : '';
			}).join('');
			facts += '<li class="ha-pro-facts-tech"><b>تکنولوژی</b><span class="ha-pro-tech-badges">' + techHtml + '</span></li>';
		}

		var tabs = (item.tabs && item.tabs.length) ? item.tabs : [];
		if (!tabs.length) {
			tabs = [
				{ label: 'خلاصه',   summary: item.excerpt ? '<p>' + esc(item.excerpt) + '</p>' : '', content: '' },
				{ label: 'امکانات', summary: feats ? '<div class="ha-pro-card-features">' + feats + '</div>' : '', content: '' },
			];
		}

		var nav = '', panels = '';
		tabs.forEach(function (tab, i) {
			var key  = 'tab-' + i;
			var body = tab.summary || tab.content || (i === 0 && item.excerpt ? '<p>' + esc(item.excerpt) + '</p>' : '');
			nav    += '<button type="button" class="ha-pro-side-tab' + (i === 0 ? ' is-active' : '') + '" data-ha-side-tab="' + key + '">' + esc(tab.label || ('تب ' + (i + 1))) + '</button>';
			panels += '<div class="ha-pro-side-tab-panel' + (i === 0 ? ' is-active' : '') + '" data-ha-side-tab-panel="' + key + '"><div class="ha-pro-side-tab-body">' + body + '</div></div>';
		});

		var avgRating  = item.user_rating_avg  || 0;
		var rateCount  = item.user_rating_count || 0;
		var myRating   = getRatedToday(item.id); /* null, or 1-5 if rated today */
		var shownStars = myRating !== null ? myRating : Math.round(avgRating);
		var starsHtml  = '';
		for (var s = 1; s <= 5; s++) {
			starsHtml += '<button type="button" class="ha-pro-star' + (s <= shownStars ? ' is-filled' : '') + '" data-ha-rate="' + s + '" aria-label="' + s + ' ستاره">' + (s <= shownStars ? '★' : '☆') + '</button>';
		}
		var countText = rateCount ? '(' + rateCount + ' امتیاز' + (avgRating ? ' — ' + avgRating.toFixed(1) : '') + ')' : 'اولین نفر باشید!';
		var ratingHtml = '<div class="ha-pro-side-rating' + (myRating !== null ? ' is-rated' : '') + '" data-ha-rating-box>' +
			'<div class="ha-pro-stars" data-ha-stars>' + starsHtml + '</div>' +
			'<span class="ha-pro-rating-count" data-ha-rating-count>' + esc(countText) + '</span>' +
		'</div>';

		var urgencyHtml = '<div class="ha-pro-urgency"></div>';

		/* view count + stars in one compact row */
		var metaRowHtml =
			'<div class="ha-pro-side-meta-row">' +
			(item.view_count ? '<span class="ha-pro-side-view-count"><span aria-hidden="true">👁</span>' + esc(Number(item.view_count).toLocaleString('fa-IR')) + ' بازدید</span>' : '') +
			ratingHtml +
			'</div>' +
			urgencyHtml;

		return '<div class="ha-pro-side-head">' +
			(item.code ? '<div style="margin-bottom:10px"><span class="ha-pro-code-badge" style="position:static;display:inline-flex">' + esc(item.code) + '</span></div>' : '') +
			(statusLabel(item.status) ? '<div class="ha-pro-badge ha-pro-badge-' + esc(item.status) + '" style="position:static;margin-bottom:8px">' + esc(statusLabel(item.status)) + '</div>' : '') +
			'<h3>' + esc(item.title) + '</h3>' +
			(item.excerpt ? '<p>' + esc(item.excerpt) + '</p>' : '') +
			metaRowHtml +
			'</div>' +
			(item.highlight ? '<div class="ha-pro-side-highlight">' + esc(item.highlight) + '</div>' : '') +
			'<div class="ha-pro-side-tabs"><div class="ha-pro-side-tabs-nav">' + nav + '</div><div class="ha-pro-side-tabs-content">' + panels + '</div></div>' +
			(feats ? '<div class="ha-pro-side-section-title">ویژگی‌های کلیدی</div><div class="ha-pro-card-features" style="padding:8px 20px 0">' + feats + '</div>' : '') +
			(facts ? '<ul class="ha-pro-side-facts">' + facts + '</ul>' : '') +
			(item.demo_url ? this._qrHtml(item.demo_url) : '') +
			(this.cfg.show_price ? '<div class="ha-pro-side-price"><strong>' + esc(money(item.price)) + '</strong>' + (item.old_price ? '<del>' + esc(money(item.old_price)) + '</del>' : '') + '</div>' : '') +
			'<div class="ha-pro-side-action-group">' +
				'<a class="ha-pro-btn ha-pro-side-view-btn" href="' + esc(item.demo_url) + '" target="_blank" rel="noopener noreferrer">' +
				'<span class="ha-pro-side-btn-icon">🔗</span>' + esc(self.label('new_tab_label', 'مشاهده کامل')) +
				'</a>' +
				(order ? '<a class="ha-pro-btn ha-pro-btn-whatsapp" href="' + esc(order) + '" target="_blank" rel="noopener noreferrer">' +
				'<span class="ha-pro-side-btn-icon">💬</span>' + esc(self.label('order_label', 'سفارش با واتساپ')) +
				'</a>' : '') +
			'</div>';
	};

	/* Smart "live viewers" derived from the project's real view count.
	   Popular templates show more concurrent viewers; low-traffic ones show none. */
	App.prototype._urgencyBase = function (item) {
		var views = (item && item.view_count) ? Number(item.view_count) : 0;
		if (views < 8) return 0; /* not enough real interest → don't fake urgency */
		/* gentle log curve: ~2 at 8 views, ~5 at 100, ~7 at 1000, capped at 12 */
		var base = Math.round(Math.log(views) / Math.log(2.2));
		return Math.max(2, Math.min(12, base));
	};

	App.prototype._urgencyViewers = function (item) {
		var base = this._urgencyBase(item);
		if (base === 0) return 0;
		var key = 'ha_viewers_' + (item ? item.id : 'x');
		var stored = sessionStorage.getItem(key);
		if (stored) return parseInt(stored, 10);
		var jitter = Math.floor(Math.random() * 3) - 1; /* -1..+1 around the base */
		var n = Math.max(2, base + jitter);
		sessionStorage.setItem(key, n);
		return n;
	};

	App.prototype._startUrgencyTick = function (el, item) {
		var base = this._urgencyBase(item);
		if (base === 0) return;
		var lo = Math.max(2, base - 2);
		var hi = base + 2;
		var key = 'ha_viewers_' + item.id;
		if (this._urgencyTimer) clearInterval(this._urgencyTimer);
		this._urgencyTimer = setInterval(function () {
			var n = parseInt(sessionStorage.getItem(key) || String(base), 10);
			n += Math.random() < 0.5 ? 1 : -1;
			n = Math.max(lo, Math.min(hi, n));
			sessionStorage.setItem(key, n);
			if (el && el.parentNode) el.textContent = n + ' نفر در حال مشاهده';
		}, 18000 + Math.random() * 12000); /* every 18-30 seconds */
	};

	App.prototype._submitRating = function (rating) {
		var self = this;
		var item = this._currentItem;
		if (!item) return;
		/* One rating per project per day */
		if (getRatedToday(item.id) !== null) {
			toast('امروز قبلاً به این قالب امتیاز داده‌اید', 'info', '🌟');
			return;
		}
		setRatedToday(item.id, rating);

		/* Optimistically fill the stars to the user's choice (no layout shift) */
		var box   = this.refs.modal ? this.refs.modal.querySelector('[data-ha-rating-box]') : null;
		var stars = box ? box.querySelector('[data-ha-stars]') : null;
		if (stars) {
			var s2 = '';
			for (var i = 1; i <= 5; i++) s2 += '<button type="button" class="ha-pro-star' + (i <= rating ? ' is-filled' : '') + '" data-ha-rate="' + i + '" aria-label="' + i + ' ستاره">' + (i <= rating ? '★' : '☆') + '</button>';
			stars.innerHTML = s2;
		}
		if (box) box.classList.add('is-rated');

		fetch(buildUrl('sites/' + item.id + '/rate', {}), {
			method: 'POST',
			headers: Object.assign({ 'Content-Type': 'application/json' }, nonce ? { 'X-WP-Nonce': nonce } : {}),
			body: JSON.stringify({ rating: rating }),
		})
		.then(function (r) { return r.ok ? r.json() : null; })
		.then(function (d) {
			if (!d) return;
			item.user_rating_avg   = d.avg;
			item.user_rating_count = d.count;
			var countEl = box ? box.querySelector('[data-ha-rating-count]') : null;
			if (countEl) countEl.textContent = '(' + d.count + ' امتیاز' + (d.avg ? ' — ' + d.avg.toFixed(1) : '') + ')';
			/* transient confirmation that comes and goes without disturbing the layout */
			toast('✓ امتیاز شما ثبت شد', 'success', '⭐');
		})
		.catch(function () {});
	};

	App.prototype.closeModal = function () {
		if (!this.refs.modal) return;
		this.refs.modal.hidden = true;
		this.refs.modal.setAttribute('aria-hidden', 'true');
		if (this.refs.frame) { this.refs.frame.src = 'about:blank'; this.refs.frame.onload = null; }
		clearTimeout(this._frameTimer);
		if (this._urgencyTimer) { clearInterval(this._urgencyTimer); this._urgencyTimer = null; }
		if (this._removeLoadingHint) this._removeLoadingHint();
		clearTimeout(this._progressTimer);
		var wrap = this.refs.frame ? this.refs.frame.closest('.ha-pro-frame-wrap') : null;
		if (wrap) {
			wrap.classList.remove('is-loading', 'is-blocked');
			var fb = wrap.querySelector('.ha-pro-frame-fallback');
			if (fb) fb.remove();
		}
		document.documentElement.classList.remove('ha-pro-modal-open');
	};

	App.prototype.setDevice = function (device) {
		var wrap = this.refs.frame ? this.refs.frame.closest('.ha-pro-frame-wrap') : null;
		if (!wrap) return;
		wrap.classList.toggle('is-tablet', device === 'tablet');
		wrap.classList.toggle('is-mobile', device === 'mobile');
		var scope = this.refs.modal || this.el;
		qsa(scope, '[data-ha-device]').forEach(function (b) {
			b.classList.toggle('is-active', b.getAttribute('data-ha-device') === device);
		});
	};

	App.prototype._toggleInfo = function () {
		var stage = this.refs.frame ? this.refs.frame.closest('.ha-pro-frame-stage') : null;
		if (stage) stage.classList.toggle('is-info-hidden');
		/* User engaged with the details — the loading nudge is no longer needed */
		if (this._removeLoadingHint) this._removeLoadingHint();
	};

	App.prototype._activateSideTab = function (key) {
		var scope = this.refs.modal || this.el;
		qsa(scope, '[data-ha-side-tab]').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-ha-side-tab') === key); });
		qsa(scope, '[data-ha-side-tab-panel]').forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-ha-side-tab-panel') === key); });
	};

	/* ── Recently viewed ── */
	App.prototype._recentKey = function () { return 'ha_recent_' + (this.el.id || 'all'); };
	App.prototype._addRecent = function (id) {
		var list = storageGet(this._recentKey());
		list = list.filter(function (x) { return String(x) !== String(id); });
		list.unshift(String(id));
		list = list.slice(0, 12);
		storageSet(this._recentKey(), list);
		this._refreshCards();
	};

	/* ── QR code ── */
	App.prototype._qrHtml = function (url) {
		var enc = encodeURIComponent(url);
		var src = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=2&qzone=1&data=' + enc;
		var fb  = 'https://quickchart.io/qr?size=160&margin=2&text=' + enc;
		return '<div class="ha-pro-qr">' +
			'<img src="' + esc(src) + '" onerror="this.onerror=null;this.src=\'' + esc(fb) + '\'" ' +
			'alt="QR" width="80" height="80" loading="lazy" decoding="async" ' +
			'style="width:80px;height:80px;border-radius:8px;display:block;background:#fff;">' +
			'<div class="ha-pro-qr-text"><span>با دوربین موبایل اسکن کنید تا دمو روی گوشی باز شود.</span></div>' +
			'</div>';
	};

	/* ── Share ── */
	App.prototype._buildShareMenu = function (item) {
		var url = item.demo_url || '';
		return '<button type="button" class="ha-pro-share-btn ha-pro-share-item" data-share="copy" data-copy="' + esc(url) + '">📋 کپی لینک</button>';
	};

	/* ── Toast ── */
	function toastWrap() {
		var w = document.getElementById('ha-pro-toast-wrap');
		if (w) return w;
		w = document.createElement('div');
		w.id = 'ha-pro-toast-wrap';
		w.className = 'ha-pro-toast-wrap';
		document.body.appendChild(w);
		return w;
	}

	function toast(msg, type, icon) {
		var w  = toastWrap();
		var el = document.createElement('div');
		el.className = 'ha-pro-toast is-' + (type || 'info');
		el.innerHTML = '<span class="ha-pro-toast-icon">' + (icon || (type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️')) + '</span><span class="ha-pro-toast-text">' + esc(msg) + '</span>';
		w.appendChild(el);
		setTimeout(function () { el.classList.add('is-leaving'); setTimeout(function () { el.remove(); }, 250); }, 2200);
	}
	window.HaSitesProToast = toast;

	/* ── Copy to clipboard ── */
	function copyText(text) {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
		}
		try {
			var ta = document.createElement('textarea');
			ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
			document.body.appendChild(ta); ta.select();
			var ok = document.execCommand('copy');
			document.body.removeChild(ta);
			return Promise.resolve(ok);
		} catch (e) { return Promise.resolve(false); }
	}

	/* ── Swatches ── */
	App.prototype._bindSwatches = function () {
		var self = this;
		qsa(this.el, '[data-ha-swatch]').forEach(function (b) {
			b.addEventListener('click', function () {
				var color = b.getAttribute('data-ha-swatch');
				var dark  = b.getAttribute('data-ha-swatch-dark') || color;
				self.el.style.setProperty('--ha-accent', color);
				self.el.style.setProperty('--ha-accent-2', dark);
				self.el.style.setProperty('--ha-soft', color + '22');
				self.el.style.setProperty('--ha-glow', '0 0 0 3px ' + color + '40');
				qsa(self.el, '[data-ha-swatch]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
				try { localStorage.setItem('ha_theme_' + (self.el.id || 'all'), color + '|' + dark); } catch(e){}
			});
		});
		try {
			var saved = localStorage.getItem('ha_theme_' + (this.el.id || 'all'));
			if (saved) {
				var parts = saved.split('|');
				var match = qs(this.el, '[data-ha-swatch="' + parts[0] + '"]');
				if (match) match.click();
			}
		} catch(e){}
	};

	/* ── Stats ── */
	App.prototype._renderStats = function () {
		var host  = qs(this.el, '[data-ha-stats]');
		if (!host) return;
		var fav   = this.state.favorites.length;
		var rec   = storageGet(this._recentKey()).length;
		var total = this.state.total || 0;
		host.innerHTML =
			'<div class="ha-pro-stat"><div class="ha-pro-stat-icon">🗂</div><div><span class="ha-pro-stat-val">' + Number(total).toLocaleString('fa-IR') + '</span><span class="ha-pro-stat-lbl">قالب در دسترس</span></div></div>' +
			'<div class="ha-pro-stat"><div class="ha-pro-stat-icon">❤️</div><div><span class="ha-pro-stat-val">' + Number(fav).toLocaleString('fa-IR') + '</span><span class="ha-pro-stat-lbl">علاقه‌مندی شما</span></div></div>' +
			'<div class="ha-pro-stat"><div class="ha-pro-stat-icon">👁</div><div><span class="ha-pro-stat-val">' + Number(rec).toLocaleString('fa-IR') + '</span><span class="ha-pro-stat-lbl">اخیراً دیده‌شده</span></div></div>' +
			'<div class="ha-pro-stat"><div class="ha-pro-stat-icon">⚡</div><div><span class="ha-pro-stat-val">فعال</span><span class="ha-pro-stat-lbl">پشتیبانی زنده</span></div></div>';
	};

	/* ══════════════════════════════════════════════════════
	   Boot
	   ══════════════════════════════════════════════════════ */
	function boot() {
		qsa(document, '.ha-sites-pro:not([data-ha-mounted])').forEach(function (el) {
			el.setAttribute('data-ha-mounted', '1');
			new App(el);
		});
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
	else boot();

	window.HaSitesProBoot = boot;

	/* Elementor editor support */
	function bindElementor() {
		if (!window.elementorFrontend || !window.elementorFrontend.hooks) return;
		window.elementorFrontend.hooks.addAction('frontend/element_ready/ha_sites_pro.default', boot);
	}
	if (window.elementorFrontend && window.elementorFrontend.hooks) bindElementor();
	else window.addEventListener('elementor/frontend/init', bindElementor);
})();
