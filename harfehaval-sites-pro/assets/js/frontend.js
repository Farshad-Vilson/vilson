/* Harfehaval Sites Pro v3.0 — Vanilla JS App (no jQuery) */
(function () {
	'use strict';

	var rootConfig = window.haSitesPro || {};
	var apiBase    = rootConfig.apiBase || '';
	var settings   = rootConfig.settings || {};
	var i18n       = rootConfig.i18n || {};
	var previewBase = rootConfig.previewBase || '';

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
	   App constructor
	   ══════════════════════════════════════════════════════ */
	function App(el) {
		this.el   = el;
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

		/* Infinite scroll sentinel */
		this._io = null;
		this._sentinel = null;

		this.init();
	}

	App.prototype.label = function (key, fallback) {
		return this.cfg[key] || i18n[key] || fallback || '';
	};

	App.prototype.init = function () {
		var self = this;
		this.applyLayout(this.state.layout);

		/* Pre-fill search from hash */
		if (this.refs.search && this.state.search) {
			this.refs.search.value = this.state.search;
		}
		if (this.refs.sort) this.refs.sort.value = this.state.sort;

		this.bind();
		this.renderStatuses();
		this.loadFilters();
		this.load(true);

		/* Infinite scroll setup */
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

		/* Modal/share/device/tab clicks — modal is portaled to body so listen on it directly */
		if (this.refs.modal) {
			this.refs.modal.addEventListener('click', function (e) {
				var t = e.target, b;
				if ((b = t.closest('[data-ha-modal-close]'))) { self.closeModal(); return; }
				if ((b = t.closest('[data-ha-device]')))     { self.setDevice(b.getAttribute('data-ha-device')); return; }
				if ((b = t.closest('[data-ha-preview-info-toggle]'))) { self._toggleInfo(); return; }
				if ((b = t.closest('[data-ha-side-tab]')))   { self._activateSideTab(b.getAttribute('data-ha-side-tab')); return; }

				/* Fix 5: handle .ha-pro-preview-open click explicitly for mobile */
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
				if (shareToggle) { var wrap = shareToggle.closest('.ha-pro-share'); if (wrap) wrap.classList.toggle('is-open'); e.stopPropagation(); return; }
				var shareItem = t.closest('.ha-pro-share-item');
				if (shareItem) {
					var copyVal = shareItem.getAttribute('data-copy');
					if (copyVal) copyText(copyVal).then(function (ok) { toast(ok ? 'لینک کپی شد' : 'کپی نشد', ok ? 'success' : 'error', ok ? '📋' : '⚠️'); });
					else { var url = shareItem.getAttribute('data-share-url'); if (url) window.open(url, '_blank', 'noopener'); }
					var open = shareItem.closest('.ha-pro-share'); if (open) open.classList.remove('is-open');
					return;
				}
			});

			/* Make the preview details panel scroll with the mouse wheel even when the iframe is focused nearby. */
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

		if (this.refs.loadMore) {
			this.refs.loadMore.addEventListener('click', function () { self.load(false); });
		}

		/* Delegated clicks inside the widget */
		this.el.addEventListener('click', function (e) {
			var t = e.target;

			var b;
			if ((b = t.closest('[data-ha-cat]'))     && self.el.contains(b)) { self.state.category = b.getAttribute('data-ha-cat') || ''; self.resetAndLoad(); return; }
			if ((b = t.closest('[data-ha-feature]')) && self.el.contains(b)) { self._toggleFeature(b.getAttribute('data-ha-feature')); return; }
			if ((b = t.closest('[data-ha-status]'))  && self.el.contains(b)) { self.state.status = b.getAttribute('data-ha-status') || ''; self.resetAndLoad(); return; }
			if ((b = t.closest('[data-ha-layout]'))  && self.el.contains(b)) { self.applyLayout(b.getAttribute('data-ha-layout')); return; }
			if ((b = t.closest('[data-ha-preview]')) && self.el.contains(b)) { self.openPreview(b.getAttribute('data-ha-preview')); return; }
			if ((b = t.closest('[data-ha-favorite]'))&& self.el.contains(b)) { self._toggleFavorite(b.getAttribute('data-ha-favorite')); return; }
			if ((b = t.closest('[data-ha-compare]')) && self.el.contains(b)) { self._toggleCompare(b.getAttribute('data-ha-compare')); return; }
			if ((b = t.closest('[data-ha-modal-close]')) && self.el.contains(b)) { self.closeModal(); return; }
			if ((b = t.closest('[data-ha-device]'))  && self.el.contains(b)) { self.setDevice(b.getAttribute('data-ha-device')); return; }
			if ((b = t.closest('[data-ha-preview-info-toggle]')) && self.el.contains(b)) { self._toggleInfo(); return; }
			if ((b = t.closest('[data-ha-side-tab]'))&& self.el.contains(b)) { self._activateSideTab(b.getAttribute('data-ha-side-tab')); return; }
			if ((b = t.closest('[data-ha-compare-clear]')) && self.el.contains(b)) { self.state.compare = []; self._updateCompare(); self._refreshCards(); return; }
			if ((b = t.closest('[data-ha-reset]'))   && self.el.contains(b)) { self.resetFilters(); return; }
			var heroOrder = t.closest('[data-ha-hero-order]');
			if (heroOrder && self.el.contains(heroOrder)) {
				e.preventDefault();
				var ph = (settings.whatsapp || '').replace(/\D/g, '');
				if (ph) window.open('https://wa.me/' + ph, '_blank', 'noopener');
				return;
			}

			/* Share dropdown handling (modal lives at body level after portal) */
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
			if (self._preloadUrl === item.demo_url) return; // already preloading this
			clearTimeout(self._preloadTimer);
			self._preloadTimer = setTimeout(function () {
				if (self.refs.modal && self.refs.modal.hidden !== false) {
					/* Pre-warm the iframe while modal is still closed */
					self._preloadUrl = item.demo_url;
					self.refs.frame.src = item.demo_url;
				}
			}, 200);
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
		qsa(this.el, '[data-ha-layout]').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-ha-layout') === layout); });
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
		fetch(buildUrl('filters', {}), { credentials: 'same-origin' })
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

		fetch(buildUrl('sites', this._params()), { credentials: 'same-origin', signal: this._ctrl.signal })
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
		this.refs.grid.innerHTML = reset ? html : this.refs.grid.innerHTML + html;
		this._refreshCards();
	};

	App.prototype._cardHtml = function (item) {
		var self = this;
		var cfg  = this.cfg;
		var badge = cfg.show_badge ? statusLabel(item.status) : '';
		var order = this._whatsappUrl(item);

		var img = '';
		if (cfg.show_image) {
			var imgAttrs = item.thumb_srcset ? ' srcset="' + esc(item.thumb_srcset) + '" sizes="' + esc(item.thumb_sizes || '(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw') + '"' : '';
			var thumbHtml = item.thumb
				? '<img src="' + esc(item.thumb) + '"' + imgAttrs + ' alt="' + esc(item.thumb_alt || item.title) + '" loading="lazy" decoding="async">'
				: '<div class="ha-pro-no-thumb">⌁</div>';
			var quickView = (cfg.show_preview_button && item.demo_url)
				? '<button type="button" class="ha-pro-quick-view" data-ha-quick-view="' + esc(item.id) + '">👁 پیش‌نمایش سریع</button>'
				: '';
			var codeBadge = item.code
				? '<span class="ha-pro-code-badge">' + esc(item.code) + '</span>'
				: '';
			var ratingBadge = (cfg.show_rating && item.rating)
				? '<span class="ha-pro-rating-badge">⭐ ' + esc(Number(item.rating).toLocaleString('fa-IR')) + '</span>'
				: '';
			img = '<div class="ha-pro-thumb">' +
				(badge ? '<span class="ha-pro-badge ha-pro-badge-' + esc(item.status) + '">' + esc(badge) + '</span>' : '') +
				thumbHtml +
				quickView +
				codeBadge +
				ratingBadge +
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
		if (cfg.show_pages_count && item.pages_count)  facts += '<span>📄 ' + esc(item.pages_count) + '</span>';
		if (cfg.show_support && item.support)          facts += '<span>🛟 ' + esc(item.support) + '</span>';
		if (cfg.show_tech_stack && item.tech_stack)    facts += '<span>⚙️ ' + esc(item.tech_stack) + '</span>';

		var feats = '';
		if (cfg.show_features) {
			feats = (item.features || []).slice(0, 5).map(function (f) { return '<span>' + esc(f.name) + '</span>'; }).join('');
		}

		var meta = '';
		if (cfg.show_delivery   && item.delivery)   meta += '<span class="ha-pro-meta-item">⏱ ' + esc(item.delivery) + '</span>';
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
		var was = list.indexOf(id) >= 0;
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
		if (was) list.splice(idx, 1);
		else { if (list.length >= 3) { list.shift(); toast('قدیمی‌ترین آیتم حذف شد (حداکثر ۳)', 'info', '⚠️'); } list.push(id); }
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

		/* Portal: move modal to <body> on first open to escape ALL parent
		   stacking contexts (theme headers/footers, Elementor sections, etc.) */
		if (!this._modalPortaled) {
			this._modalParent = this.refs.modal.parentNode;
			document.body.appendChild(this.refs.modal);
			this._modalPortaled = true;
		}

		/* Track recently viewed */
		this._addRecent(item.id);

		/* Clear previous error state */
		if (wrap) wrap.classList.remove('is-blocked', 'is-loading');
		var oldErr = wrap ? wrap.querySelector('.ha-pro-frame-fallback') : null;
		if (oldErr) oldErr.remove();
		if (wrap) { var oldBar = wrap.querySelector('.ha-pro-progress-bar'); if (oldBar) oldBar.remove(); }

		/* Animated progress bar (fake 0→85% while loading, 100% on load) */
		var progressBar = null;
		if (wrap) {
			progressBar = document.createElement('div');
			progressBar.className = 'ha-pro-progress-bar';
			progressBar.innerHTML = '<div class="ha-pro-progress-fill"></div>';
			wrap.appendChild(progressBar);
		}
		var fill = progressBar ? progressBar.querySelector('.ha-pro-progress-fill') : null;
		var progress = 0;
		function advanceProgress() {
			if (progress < 85) {
				progress += (85 - progress) * 0.08;
				if (fill) fill.style.width = progress.toFixed(1) + '%';
				self._progressTimer = setTimeout(advanceProgress, 300);
			}
		}
		clearTimeout(self._progressTimer);
		advanceProgress();

		/* Loading state + iframe blocked detection */
		if (wrap) wrap.classList.add('is-loading');
		clearTimeout(this._frameTimer);
		var loaded = false;

		function onFrameLoaded() {
			loaded = true;
			clearTimeout(self._frameTimer);
			clearTimeout(self._progressTimer);
			if (wrap) wrap.classList.remove('is-loading');
			/* Complete progress bar then fade out */
			if (fill) fill.style.width = '100%';
			setTimeout(function () { if (progressBar && progressBar.parentNode) progressBar.remove(); }, 500);
		}

		this.refs.frame.onload = onFrameLoaded;
		this._frameTimer = setTimeout(function () {
			if (!loaded && wrap) {
				clearTimeout(self._progressTimer);
				wrap.classList.remove('is-loading');
				if (progressBar && progressBar.parentNode) progressBar.remove();
				/* Show fallback overlay — keep modal OPEN, let user choose */
				wrap.classList.add('is-blocked');
				var fb = document.createElement('div');
				fb.className = 'ha-pro-frame-fallback';
				fb.innerHTML =
					'<div class="ha-pro-frame-fallback-box">' +
					'<div class="ha-pro-fallback-icon">🔒</div>' +
					'<h3>پیش‌نمایش مستقیم در دسترس نیست</h3>' +
					'<p>این سایت احتمالاً به دلایل فنی یا امنیتی اجازه نمایش در این قاب را نمی‌دهد. برای مشاهده کامل روی دکمه زیر کلیک کنید.</p>' +
					'<a class="ha-pro-btn ha-pro-btn-primary ha-pro-fallback-open" href="' + esc(item.demo_url) + '" target="_blank" rel="noopener noreferrer">مشاهده کامل ↗</a>' +
					'</div>';
				wrap.appendChild(fb);
			}
		}, 10000);

		/* If hover-preload already started for this URL, iframe is already loading — reuse it */
		if (this._preloadUrl !== item.demo_url) {
			this.refs.frame.src = item.demo_url;
		}
		this._preloadUrl = null; // consumed
		clearTimeout(this._preloadTimer);

		if (this.refs.previewTitle)  this.refs.previewTitle.textContent  = item.title || '';
		if (this.refs.previewDomain) this.refs.previewDomain.textContent = (this.cfg.show_preview_helper && this.cfg.preview_helper_text) ? this.cfg.preview_helper_text : (domainOf(item.demo_url) || (item.demo_url || ''));
		if (this.refs.previewOpen)   this.refs.previewOpen.href = item.demo_url;
		if (this.refs.modalInfo)     this.refs.modalInfo.innerHTML = this._sideHtml(item);

		/* Mobile UX: show the site first; details panel opens as a full-screen drawer. */
		var stage = this.refs.frame ? this.refs.frame.closest('.ha-pro-frame-stage') : null;
		if (stage) {
			var isMobilePreview = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
			stage.classList.toggle('is-info-hidden', !!isMobilePreview);
		}

		/* Inject share dropdown into header actions */
		var actions = qs(this.refs.modal, '.ha-pro-preview-actions');
		if (actions) {
			var oldShare = qs(actions, '.ha-pro-share');
			if (oldShare) oldShare.remove();
			var holder = document.createElement('span');
			holder.innerHTML = this._buildShareMenu(item);
			actions.insertBefore(holder.firstChild, actions.firstChild);
		}

		this.refs.modal.hidden = false;
		this.refs.modal.setAttribute('aria-hidden', 'false');
		document.documentElement.classList.add('ha-pro-modal-open');
		this.setDevice('desktop');

		/* Fix 2: Ensure sidebar starts hidden on mobile */
		var stageAfter = this.refs.frame ? this.refs.frame.closest('.ha-pro-frame-stage') : null;
		if (stageAfter && window.innerWidth <= 768) {
			stageAfter.classList.add('is-info-hidden');
		} else if (stageAfter) {
			stageAfter.classList.remove('is-info-hidden');
		}
	};

	App.prototype._sideHtml = function (item) {
		var self   = this;
		var order  = this._whatsappUrl(item);
		var feats  = (item.features || []).map(function (f) { return '<span>' + esc(f.name) + '</span>'; }).join('');
		var facts  = '';
		[['نوع پروژه', item.project_type],['صفحات', item.pages_count],['پشتیبانی', item.support],['تکنولوژی', item.tech_stack],['تحویل', item.delivery],['پرداخت', item.installment]].forEach(function (r) {
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
			var key = 'tab-' + i;
			var body = tab.summary || tab.content || (i === 0 && item.excerpt ? '<p>' + esc(item.excerpt) + '</p>' : '');
			nav    += '<button type="button" class="ha-pro-side-tab' + (i === 0 ? ' is-active' : '') + '" data-ha-side-tab="' + key + '">' + esc(tab.label || ('تب ' + (i+1))) + '</button>';
			panels += '<div class="ha-pro-side-tab-panel' + (i === 0 ? ' is-active' : '') + '" data-ha-side-tab-panel="' + key + '"><div class="ha-pro-side-tab-body">' + body + '</div></div>';
		});

		return '<div class="ha-pro-side-head">' +
			(item.code ? '<div style="margin-bottom:10px"><span class="ha-pro-code-badge" style="position:static;display:inline-flex">' + esc(item.code) + '</span></div>' : '') +
			(statusLabel(item.status) ? '<div class="ha-pro-badge ha-pro-badge-' + esc(item.status) + '" style="position:static;margin-bottom:8px">' + esc(statusLabel(item.status)) + '</div>' : '') +
			'<h3>' + esc(item.title) + '</h3>' +
			(item.excerpt ? '<p>' + esc(item.excerpt) + '</p>' : '') +
		'</div>' +
		(item.highlight ? '<div class="ha-pro-side-highlight">' + esc(item.highlight) + '</div>' : '') +
		'<div class="ha-pro-side-tabs"><div class="ha-pro-side-tabs-nav">' + nav + '</div><div class="ha-pro-side-tabs-content">' + panels + '</div></div>' +
		(feats ? '<div class="ha-pro-side-section-title">ویژگی‌های کلیدی</div><div class="ha-pro-card-features" style="padding:8px 20px 0">' + feats + '</div>' : '') +
		(facts ? '<ul class="ha-pro-side-facts">' + facts + '</ul>' : '') +
		(item.demo_url ? this._qrHtml(item.demo_url) : '') +
		(this.cfg.show_price ? '<div class="ha-pro-side-price"><strong>' + esc(money(item.price)) + '</strong>' + (item.old_price ? '<del>' + esc(money(item.old_price)) + '</del>' : '') + '</div>' : '') +
		'<div class="ha-pro-actions" style="padding:12px 20px 20px;flex-direction:column">' +
			'<a class="ha-pro-btn ha-pro-btn-secondary" href="' + esc(item.demo_url) + '" target="_blank" rel="noopener noreferrer" style="flex:none">' + esc(self.label('new_tab_label', 'مشاهده کامل')) + '</a>' +
			(order ? '<a class="ha-pro-btn ha-pro-btn-primary" href="' + esc(order) + '" target="_blank" rel="noopener noreferrer" style="flex:none">' + esc(self.label('order_label', 'سفارش سایت')) + '</a>' : '') +
		'</div>';
	};

	App.prototype.closeModal = function () {
		if (!this.refs.modal) return;
		this.refs.modal.hidden = true;
		this.refs.modal.setAttribute('aria-hidden', 'true');
		if (this.refs.frame) { this.refs.frame.src = 'about:blank'; this.refs.frame.onload = null; }
		clearTimeout(this._frameTimer);
		var wrap = this.refs.frame ? this.refs.frame.closest('.ha-pro-frame-wrap') : null;
		if (wrap) { wrap.classList.remove('is-loading','is-blocked'); var fb = wrap.querySelector('.ha-pro-frame-fallback'); if (fb) fb.remove(); }
		document.documentElement.classList.remove('ha-pro-modal-open');
	};

	App.prototype.setDevice = function (device) {
		var wrap = this.refs.frame ? this.refs.frame.closest('.ha-pro-frame-wrap') : null;
		if (!wrap) return;
		wrap.classList.toggle('is-tablet', device === 'tablet');
		wrap.classList.toggle('is-mobile', device === 'mobile');
		var scope = this.refs.modal || this.el;
		qsa(scope, '[data-ha-device]').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-ha-device') === device); });
	};

	App.prototype._toggleInfo = function () {
		var stage = this.refs.frame ? this.refs.frame.closest('.ha-pro-frame-stage') : null;
		if (stage) stage.classList.toggle('is-info-hidden');
	};

	App.prototype._activateSideTab = function (key) {
		var scope = this.refs.modal || this.el;
		qsa(scope, '[data-ha-side-tab]').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-ha-side-tab') === key); });
		qsa(scope, '[data-ha-side-tab-panel]').forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-ha-side-tab-panel') === key); });
	};

	/* ══════════════════════════════════════════════════════
	   ★ v3.1 NEW FEATURES
	   ══════════════════════════════════════════════════════ */

	/* Recently viewed */
	App.prototype._recentKey = function () { return 'ha_recent_' + (this.el.id || 'all'); };
	App.prototype._addRecent = function (id) {
		var list = storageGet(this._recentKey());
		list = list.filter(function (x) { return String(x) !== String(id); });
		list.unshift(String(id));
		list = list.slice(0, 12);
		storageSet(this._recentKey(), list);
		this._refreshCards();
	};
	App.prototype._isRecent = function (id) {
		return storageGet(this._recentKey()).indexOf(String(id)) >= 0;
	};

	/* QR code via reliable service with single fallback (Fix 4) */
	App.prototype._qrHtml = function (url) {
		var enc = encodeURIComponent(url);
		var src = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=2&qzone=1&data=' + enc;
		var fb  = 'https://quickchart.io/qr?size=160&margin=2&text=' + enc;
		return '<div class="ha-pro-qr">' +
			'<img src="' + esc(src) + '" onerror="this.onerror=null;this.src=\'' + fb + '\'" ' +
			'alt="QR" width="80" height="80" loading="lazy" decoding="async" ' +
			'style="width:80px;height:80px;border-radius:8px;display:block;background:#fff;">' +
			'<div class="ha-pro-qr-text">' +
			'<span>با دوربین موبایل اسکن کنید تا دمو روی گوشی باز شود.</span>' +
			'</div>' +
		'</div>';
	};

	/* Toast notifications */
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
		var w = toastWrap();
		var el = document.createElement('div');
		el.className = 'ha-pro-toast is-' + (type || 'info');
		el.innerHTML = '<span class="ha-pro-toast-icon">' + (icon || (type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️')) + '</span><span class="ha-pro-toast-text">' + esc(msg) + '</span>';
		w.appendChild(el);
		setTimeout(function () { el.classList.add('is-leaving'); setTimeout(function () { el.remove(); }, 250); }, 2000);
	}
	window.HaSitesProToast = toast;

	/* Copy to clipboard */
	function copyText(text) {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
		}
		try {
			var ta = document.createElement('textarea');
			ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
			document.body.appendChild(ta); ta.select();
			var ok = document.execCommand('copy');
			document.body.removeChild(ta);
			return Promise.resolve(ok);
		} catch (e) { return Promise.resolve(false); }
	}

	/* Share — opens dropdown or performs action */
	App.prototype._buildShareMenu = function (item) {
		var url = item.demo_url || '';
		return '<button type="button" class="ha-pro-share-btn ha-pro-share-item" data-share="copy" data-copy="' + esc(url) + '">📋 کپی لینک</button>';
	};

	/* Keyboard shortcuts */
	App.prototype._bindKeyboard = function () {
		var self = this;
		document.addEventListener('keydown', function (e) {
			if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
			if (self.refs.modal && !self.refs.modal.hidden) return; // modal owns keys
			var k = e.key.toLowerCase();
			if (k === '/') { e.preventDefault(); if (self.refs.search) self.refs.search.focus(); }
			else if (k === 'r') { self.resetFilters(); toast('فیلترها پاک شدند', 'info', '🔄'); }
		});
	};

	/* Stats strip HTML */
	App.prototype._renderStats = function () {
		var host = qs(this.el, '[data-ha-stats]');
		if (!host) return;
		var fav = this.state.favorites.length;
		var rec = storageGet(this._recentKey()).length;
		var total = this.state.total || 0;
		host.innerHTML =
			'<div class="ha-pro-stat"><div class="ha-pro-stat-icon">🗂</div><div><span class="ha-pro-stat-val">' + Number(total).toLocaleString('fa-IR') + '</span><span class="ha-pro-stat-lbl">قالب در دسترس</span></div></div>' +
			'<div class="ha-pro-stat"><div class="ha-pro-stat-icon">❤️</div><div><span class="ha-pro-stat-val">' + Number(fav).toLocaleString('fa-IR') + '</span><span class="ha-pro-stat-lbl">علاقه‌مندی شما</span></div></div>' +
			'<div class="ha-pro-stat"><div class="ha-pro-stat-icon">👁</div><div><span class="ha-pro-stat-val">' + Number(rec).toLocaleString('fa-IR') + '</span><span class="ha-pro-stat-lbl">اخیراً دیده‌شده</span></div></div>' +
			'<div class="ha-pro-stat"><div class="ha-pro-stat-icon">⚡</div><div><span class="ha-pro-stat-val">فعال</span><span class="ha-pro-stat-lbl">پشتیبانی زنده</span></div></div>';
	};

	/* Theme color swatches */
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
