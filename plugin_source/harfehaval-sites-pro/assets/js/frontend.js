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

	/* ── Hash state ── */
	function parseHash() {
		var out = {};
		try {
			var h = decodeURIComponent(location.hash.replace('#', ''));
			if (!h) return out;
			h.split('&').forEach(function (pair) {
				var kv = pair.split('=');
				if (kv[0]) out[kv[0]] = kv[1] || '';
			});
		} catch(e) {}
		return out;
	}

	function encodeHash(state) {
		var parts = [];
		if (state.category) parts.push('cat=' + encodeURIComponent(state.category));
		if (state.features && state.features.length) parts.push('feat=' + encodeURIComponent(state.features.join(',')));
		if (state.status)   parts.push('status=' + encodeURIComponent(state.status));
		if (state.search)   parts.push('q=' + encodeURIComponent(state.search));
		if (state.sort && state.sort !== 'newest') parts.push('sort=' + encodeURIComponent(state.sort));
		history.replaceState(null, '', parts.length ? '#' + parts.join('&') : location.pathname + location.search);
	}

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

		document.addEventListener('keydown', function (e) { if (e.key === 'Escape') self.closeModal(); });

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
		};
	};

	App.prototype.loadFilters = function () {
		var self = this;
		fetch(buildUrl('filters', {}), { credentials: 'same-origin', headers: nonce ? { 'X-WP-Nonce': nonce } : {} })
			.then(function (r) { return r.json(); })
			.then(function (d) { self._renderFilters(d.categories || [], d.features || []); })
			.catch(function () {});
	};

	App.prototype._renderFilters = function (cats, feats) {
		var self = this;
		var showCounts = !!this.cfg.show_filter_counts;

		if (this.refs.cats) {
			var h = '<button type="button" class="ha-pro-chip ' + (!this.state.category ? 'is-active' : '') + '" data-ha-cat="">' + esc(this.label('all_categories_label', 'همه دسته‌بندی‌ها')) + '</button>';
			h += cats.map(function (t) {
				return '<button type="button" class="ha-pro-chip' + (self.state.category === t.slug ? ' is-active' : '') + '" data-ha-cat="' + esc(t.slug) + '">' + esc(t.name) + (showCounts ? '<small>' + esc(t.count) + '</small>' : '') + '</button>';
			}).join('');
			this.refs.cats.innerHTML = h;
		}

		if (this.refs.features) {
			var fh = '<button type="button" class="ha-pro-chip ' + (!this.state.features.length ? 'is-active' : '') + '" data-ha-feature="">' + esc(this.label('all_features_label', 'همه ویژگی‌ها')) + '</button>';
			fh += feats.map(function (t) {
				return '<button type="button" class="ha-pro-chip' + (self.state.features.indexOf(t.slug) >= 0 ? ' is-active' : '') + '" data-ha-feature="' + esc(t.slug) + '">' + esc(t.name) + (showCounts ? '<small>' + esc(t.count) + '</small>' : '') + '</button>';
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
		if (this.state.loading) return;
		this.state.loading = true;
		if (this._ctrl) this._ctrl.abort();
		this._ctrl = new AbortController();

		if (reset) {
			this.state.items = {};
			this.state.order = [];
			this._renderSkeleton();
		}

		fetch(buildUrl('sites', this._params()), { credentials: 'same-origin', signal: this._ctrl.signal, headers: nonce ? { 'X-WP-Nonce': nonce } : {} })
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
			.finally(function () { self.state.loading = false; });
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
		[['نوع پروژه', item.project_type], ['صفحات', item.pages_count], ['پشتیبانی', item.support], ['تکنولوژی', item.tech_stack], ['تحویل', item.delivery], ['پرداخت', item.installment]].forEach(function (r) {
			if (r[1]) facts += '<li><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></li>';
		});

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
		var userRated  = sessionStorage.getItem('ha_rated_' + item.id);
		var starsHtml  = '';
		for (var s = 1; s <= 5; s++) {
			starsHtml += '<button type="button" class="ha-pro-star' + (s <= Math.round(avgRating) ? ' is-filled' : '') + '" data-ha-rate="' + s + '" aria-label="' + s + ' ستاره">' + (s <= Math.round(avgRating) ? '★' : '☆') + '</button>';
		}
		var ratingHtml = '<div class="ha-pro-side-rating" data-ha-rating-box>' +
			'<div class="ha-pro-stars" data-ha-stars>' + starsHtml + '</div>' +
			(rateCount ? '<span class="ha-pro-rating-count">(' + esc(rateCount) + ' امتیاز' + (avgRating ? ' — ' + esc(avgRating.toFixed(1)) : '') + ')</span>' : '<span class="ha-pro-rating-count">اولین نفر باشید!</span>') +
			(userRated ? '<span class="ha-pro-rated-badge">✓ امتیاز شما ثبت شد</span>' : '') +
		'</div>';

		var urgencyHtml = '<div class="ha-pro-urgency"></div>';

		return '<div class="ha-pro-side-head">' +
			(item.code ? '<div style="margin-bottom:10px"><span class="ha-pro-code-badge" style="position:static;display:inline-flex">' + esc(item.code) + '</span></div>' : '') +
			(statusLabel(item.status) ? '<div class="ha-pro-badge ha-pro-badge-' + esc(item.status) + '" style="position:static;margin-bottom:8px">' + esc(statusLabel(item.status)) + '</div>' : '') +
			'<h3>' + esc(item.title) + '</h3>' +
			(item.excerpt ? '<p>' + esc(item.excerpt) + '</p>' : '') +
			(item.view_count ? '<div class="ha-pro-side-view-count"><span>👁</span> ' + esc(Number(item.view_count).toLocaleString('fa-IR')) + ' بازدید</div>' : '') +
			urgencyHtml +
			ratingHtml +
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
		var item = this._currentItem;
		if (!item) return;
		var key = 'ha_rated_' + item.id;
		if (sessionStorage.getItem(key)) return; /* already rated this session */
		sessionStorage.setItem(key, rating);
		fetch(buildUrl('sites/' + item.id + '/rate', {}), {
			method: 'POST',
			headers: Object.assign({ 'Content-Type': 'application/json' }, nonce ? { 'X-WP-Nonce': nonce } : {}),
			body: JSON.stringify({ rating: rating }),
		})
		.then(function (r) { return r.ok ? r.json() : null; })
		.then(function (d) {
			if (!d) return;
			if (item) {
				item.user_rating_avg   = d.avg;
				item.user_rating_count = d.count;
			}
			var box = self.refs.modal ? self.refs.modal.querySelector('[data-ha-rating-box]') : null;
			if (!box) return;
			var stars = box.querySelector('[data-ha-stars]');
			if (stars) {
				var s2 = '';
				for (var i = 1; i <= 5; i++) s2 += '<button type="button" class="ha-pro-star' + (i <= rating ? ' is-filled' : '') + '" data-ha-rate="' + i + '">' + (i <= rating ? '★' : '☆') + '</button>';
				stars.innerHTML = s2;
			}
			box.insertAdjacentHTML('beforeend', '<span class="ha-pro-rated-badge">✓ امتیاز شما ثبت شد</span>');
		})
		.catch(function () {});
		var self = this;
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
