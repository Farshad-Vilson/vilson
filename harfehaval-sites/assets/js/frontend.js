/**
 * Harfehaval Sites — Frontend JavaScript
 * Plugin: سایت‌های حرف اول
 * Author: فرشاد معتمدی
 *
 * Vanilla JS, no jQuery, async/await, AbortController per request batch.
 */

/* global haSites */

(function () {
	'use strict';

	// =========================================================
	// Config — injected by wp_localize_script as window.haSites
	// =========================================================
	/** @type {{ apiBase: string, nonce: string, perPage: number, whatsapp: string, waText: string, currency: string, previewBase: string, l10n: Object }} */
	var cfg = window.haSites || {};
	var l10n = cfg.l10n || {};

	// =========================================================
	// State
	// =========================================================
	var state = {
		page:          1,
		totalPages:    0,
		total:         0,
		loading:       false,
		filtersLoaded: false,
		cat:           '',
		feats:         [],
		sort:          'newest',
		search:        '',
		status:        '',
		items:         new Map(), // id -> item data (cache for modal)
	};

	// AbortController so in-flight requests can be cancelled on new searches.
	var currentController = null;

	// =========================================================
	// DOM references (populated after DOMContentLoaded)
	// =========================================================
	var app, grid, counter, catFilters, featFilters,
		loadMoreWrap, loadMoreBtn, noResults, resetBtn,
		searchInput, sortSelect, modal, modalBackdrop,
		modalClose, modalTitle, modalDesc, modalBadge,
		modalPrice, modalWa, modalDemo, modalIframe,
		modalLoader, modalCats, modalFeats, iframeWrap;

	// =========================================================
	// Utilities
	// =========================================================

	/**
	 * Escape HTML special characters.
	 * @param {string} s
	 * @returns {string}
	 */
	function escapeHTML(s) {
		if (s === null || s === undefined) return '';
		return String(s)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	/**
	 * Create a debounced version of fn.
	 * @param {Function} fn
	 * @param {number} ms
	 * @returns {Function}
	 */
	function debounce(fn, ms) {
		var timer;
		return function () {
			var args = arguments;
			var ctx  = this;
			clearTimeout(timer);
			timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
		};
	}

	/**
	 * Format a price number with Persian numerals + currency.
	 * @param {number} n
	 * @param {string} currency
	 * @returns {string}
	 */
	function formatPrice(n, currency) {
		var formatted = n.toLocaleString('fa-IR');
		return formatted + ' ' + (currency || cfg.currency || 'تومان');
	}

	/**
	 * Return a localised status label.
	 * @param {string} status
	 * @returns {string}
	 */
	function statusLabel(status) {
		var map = { 'new': l10n.new, 'popular': l10n.popular, 'featured': l10n.featured };
		return map[status] || '';
	}

	/**
	 * Build a WhatsApp URL for a given site title.
	 * @param {string} title
	 * @returns {string}
	 */
	function buildWhatsAppUrl(title) {
		if (!cfg.whatsapp) return '#';
		var template = cfg.waText || 'سلام، می‌خواهم سایت «%s» را سفارش بدهم';
		var text = template.replace('%s', title);
		return 'https://wa.me/' + encodeURIComponent(cfg.whatsapp) +
			'?text=' + encodeURIComponent(text);
	}

	/**
	 * Build the URL hash string from current state.
	 * Format: #cat:slug/feat:a,b/sort:newest/q:term
	 * @returns {string}
	 */
	function buildHash() {
		var parts = [];
		if (state.cat)             parts.push('cat:' + state.cat);
		if (state.feats.length)    parts.push('feat:' + state.feats.join(','));
		if (state.sort !== 'newest') parts.push('sort:' + state.sort);
		if (state.search)          parts.push('q:' + encodeURIComponent(state.search));
		return parts.length ? '#' + parts.join('/') : '#';
	}

	/**
	 * Parse hash string back into state properties.
	 * @param {string} hash
	 */
	function parseHash(hash) {
		if (!hash || hash === '#') return;
		hash = hash.replace(/^#/, '');
		var segments = hash.split('/');
		segments.forEach(function (seg) {
			var colon = seg.indexOf(':');
			if (colon < 0) return;
			var key = seg.slice(0, colon);
			var val = seg.slice(colon + 1);
			if (key === 'cat')  { state.cat   = val; }
			if (key === 'feat') { state.feats = val.split(',').filter(Boolean); }
			if (key === 'sort') { state.sort  = val; }
			if (key === 'q')    { state.search = decodeURIComponent(val); }
		});
	}

	/**
	 * Push the current filter state to the URL hash without triggering hashchange.
	 */
	function updateHash() {
		var hash = buildHash();
		try {
			history.replaceState(null, '', hash || window.location.pathname + window.location.search);
		} catch (e) {
			window.location.hash = hash;
		}
	}

	// =========================================================
	// Render helpers
	// =========================================================

	/**
	 * Render 6 skeleton cards into the grid.
	 */
	function renderSkeletons() {
		var html = '';
		for (var i = 0; i < 6; i++) {
			html += '<div class="ha-skeleton-card" aria-hidden="true">' +
				'<div class="ha-skeleton-img"></div>' +
				'<div class="ha-skeleton-line"></div>' +
				'<div class="ha-skeleton-line short"></div>' +
				'<div class="ha-skeleton-line short" style="width:40%"></div>' +
				'</div>';
		}
		grid.innerHTML = html;
	}

	/**
	 * Update counter text.
	 */
	function updateCounter() {
		if (!counter) return;
		var loaded = state.items.size;
		var total  = state.total;
		if (total === 0) {
			counter.textContent = '';
		} else {
			counter.textContent = (l10n.showing || 'نمایش') + ' ' +
				loaded.toLocaleString('fa-IR') + ' ' +
				(l10n.of || 'از') + ' ' +
				total.toLocaleString('fa-IR') + ' ' +
				(l10n.results || 'نتیجه');
		}
	}

	// =========================================================
	// Lazy image loading via IntersectionObserver
	// =========================================================
	var imgObserver = null;

	function initImageObserver() {
		if (!('IntersectionObserver' in window)) return;
		imgObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				var img = entry.target;
				var src = img.getAttribute('data-src');
				if (!src) {
					imgObserver.unobserve(img);
					return;
				}
				img.src = src;
				img.removeAttribute('data-src');
				img.addEventListener('load', function () {
					img.classList.remove('ha-lazy');
					img.classList.add('is-loaded');
				}, { once: true });
				img.addEventListener('error', function () {
					img.classList.remove('ha-lazy');
					img.classList.add('is-loaded');
					img.style.visibility = 'hidden';
				}, { once: true });
				imgObserver.unobserve(img);
			});
		}, { rootMargin: '200px' });
	}

	function observeImg(img) {
		if (imgObserver) {
			imgObserver.observe(img);
		} else {
			// Fallback: load immediately.
			var src = img.getAttribute('data-src');
			if (src) {
				img.src = src;
				img.removeAttribute('data-src');
				img.classList.remove('ha-lazy');
				img.classList.add('is-loaded');
			}
		}
	}

	// =========================================================
	// Card stagger animation (IntersectionObserver)
	// =========================================================
	var cardObserver = null;

	function initCardObserver() {
		if (!('IntersectionObserver' in window)) return;
		cardObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					cardObserver.unobserve(entry.target);
				}
			});
		}, { threshold: 0.08 });
	}

	function observeCard(card) {
		if (cardObserver) {
			cardObserver.observe(card);
		} else {
			card.classList.add('is-visible');
		}
	}

	// =========================================================
	// Create card DOM element
	// =========================================================

	/**
	 * Create and return a card DOM element for a site item.
	 * @param {Object} item
	 * @returns {HTMLElement}
	 */
	function createCard(item) {
		var card = document.createElement('div');
		card.className = 'ha-card';
		card.setAttribute('role', 'listitem');
		card.dataset.id = item.id;

		// Status badge
		var badgeHtml = '';
		if (item.status) {
			badgeHtml = '<span class="ha-status-badge ha-status-' + escapeHTML(item.status) + '">' +
				escapeHTML(statusLabel(item.status)) +
				'</span>';
		}

		// Image
		var imgHtml = '';
		if (item.thumb) {
			var srcsetAttr = item.thumb_srcset
				? ' data-srcset="' + escapeHTML(item.thumb_srcset) + '"'
				: '';
			imgHtml = '<img' +
				' class="ha-card-img ha-lazy"' +
				' data-src="' + escapeHTML(item.thumb) + '"' +
				srcsetAttr +
				' alt="' + escapeHTML(item.title) + '"' +
				' loading="lazy"' +
				' width="600" height="400"' +
				'>';
		} else {
			imgHtml = '<div style="width:100%;height:100%;background:var(--ha-bg-muted)"></div>';
		}

		// Feature tags
		var featTagsHtml = '';
		if (item.features && item.features.length) {
			featTagsHtml = '<div class="ha-card-features">';
			item.features.slice(0, 4).forEach(function (f) {
				featTagsHtml += '<button class="ha-feat-tag" data-slug="' +
					escapeHTML(f.slug) + '" title="' + escapeHTML(f.name) + '">' +
					escapeHTML(f.name) +
					'</button>';
			});
			featTagsHtml += '</div>';
		}

		// Price
		var priceHtml = '';
		if (item.price !== null && item.price !== undefined) {
			priceHtml = '<span class="ha-price">' +
				escapeHTML(formatPrice(item.price, cfg.currency)) +
				'</span>';
		} else {
			priceHtml = '<span class="ha-price-contact">' +
				escapeHTML(l10n.contact || 'تماس بگیرید') +
				'</span>';
		}

		// Action buttons
		var waUrl   = buildWhatsAppUrl(item.title);
		var demoUrl = item.demo_url || '#';

		var actionsHtml = '<div class="ha-card-actions">';

		if (cfg.whatsapp) {
			actionsHtml += '<a class="ha-btn ha-btn-wa" href="' + escapeHTML(waUrl) +
				'" target="_blank" rel="noopener noreferrer">' +
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
				escapeHTML(l10n.order || 'سفارش') +
				'</a>';
		}

		if (item.demo_url) {
			actionsHtml += '<a class="ha-btn ha-btn-demo" href="' + escapeHTML(demoUrl) +
				'" target="_blank" rel="noopener noreferrer">' +
				escapeHTML(l10n.viewDemo || 'مشاهده نمونه') +
				'</a>';
		}

		actionsHtml += '</div>';

		card.innerHTML =
			badgeHtml +
			'<div class="ha-card-visual">' +
				imgHtml +
				'<div class="ha-quickview-overlay">' +
					'<button class="ha-quickview-btn" type="button">' +
						escapeHTML(l10n.quickView || 'پیش‌نمایش سریع') +
					'</button>' +
				'</div>' +
			'</div>' +
			'<div class="ha-card-body">' +
				'<h3 class="ha-card-title">' + escapeHTML(item.title) + '</h3>' +
				(item.excerpt ? '<p class="ha-card-desc">' + escapeHTML(item.excerpt) + '</p>' : '') +
				featTagsHtml +
				'<div class="ha-card-footer">' +
					priceHtml +
					actionsHtml +
				'</div>' +
			'</div>';

		// Bind events.
		var qvBtn = card.querySelector('.ha-quickview-btn');
		if (qvBtn) {
			qvBtn.addEventListener('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				openModal(item);
			});
		}

		// Feature tag clicks → toggle that feature filter.
		card.querySelectorAll('.ha-feat-tag').forEach(function (btn) {
			btn.addEventListener('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				toggleFeature(btn.dataset.slug);
			});
		});

		// Lazy-load image.
		var img = card.querySelector('.ha-card-img.ha-lazy');
		if (img) {
			observeImg(img);
		}

		return card;
	}

	// =========================================================
	// API: Load filters
	// =========================================================

	/**
	 * Fetch available category and feature terms from the REST API.
	 * Populates the filter bars.
	 */
	async function loadFilters() {
		if (state.filtersLoaded) return;

		try {
			var url = cfg.apiBase + 'filters';
			var resp = await fetch(url, {
				headers: { 'X-WP-Nonce': cfg.nonce }
			});

			if (!resp.ok) throw new Error('Filters fetch failed: ' + resp.status);

			var data = await resp.json();
			state.filtersLoaded = true;

			renderCategoryButtons(data.categories || []);
			renderFeaturePills(data.features || []);

		} catch (err) {
			// Silently fail: filters just won't render.
			console.warn('[ha-sites] loadFilters error:', err);
		}
	}

	/**
	 * Render category tab buttons.
	 * @param {Array<{slug:string, name:string, count:number}>} categories
	 */
	function renderCategoryButtons(categories) {
		if (!catFilters) return;

		// Keep the "all" button (first child) and remove the rest.
		var allBtn = catFilters.querySelector('[data-slug=""]');
		catFilters.innerHTML = '';

		if (!allBtn) {
			allBtn = document.createElement('button');
			allBtn.className = 'ha-cat-btn';
			allBtn.dataset.slug = '';
		}
		allBtn.className = 'ha-cat-btn' + (state.cat === '' ? ' active' : '');
		allBtn.textContent = l10n.allCats || 'همه دسته‌ها';
		catFilters.appendChild(allBtn);

		allBtn.addEventListener('click', function () {
			if (state.cat === '') return; // already selected
			state.cat = '';
			updateCatUI();
			resetAndLoad();
		});

		categories.forEach(function (cat) {
			var btn = document.createElement('button');
			btn.className = 'ha-cat-btn' + (state.cat === cat.slug ? ' active' : '');
			btn.dataset.slug = cat.slug;
			btn.textContent = cat.name;
			btn.setAttribute('aria-pressed', state.cat === cat.slug ? 'true' : 'false');
			btn.addEventListener('click', function () {
				if (state.cat === cat.slug) {
					// Deselect → show all.
					state.cat = '';
				} else {
					state.cat = cat.slug;
				}
				updateCatUI();
				resetAndLoad();
			});
			catFilters.appendChild(btn);
		});
	}

	/**
	 * Render feature filter pills.
	 * @param {Array<{slug:string, name:string, count:number}>} features
	 */
	function renderFeaturePills(features) {
		if (!featFilters) return;
		featFilters.innerHTML = '';

		features.forEach(function (feat) {
			var btn = document.createElement('button');
			var isActive = state.feats.indexOf(feat.slug) >= 0;
			btn.className = 'ha-feat-pill' + (isActive ? ' active' : '');
			btn.dataset.slug = feat.slug;
			btn.textContent = feat.name;
			btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
			btn.addEventListener('click', function () {
				toggleFeature(feat.slug);
			});
			featFilters.appendChild(btn);
		});
	}

	/**
	 * Update the active state of category buttons in the DOM.
	 */
	function updateCatUI() {
		if (!catFilters) return;
		catFilters.querySelectorAll('.ha-cat-btn').forEach(function (btn) {
			var active = btn.dataset.slug === state.cat;
			btn.classList.toggle('active', active);
			btn.setAttribute('aria-pressed', active ? 'true' : 'false');
		});
	}

	/**
	 * Update feature pills active state in the DOM.
	 */
	function updateFeatUI() {
		if (!featFilters) return;
		featFilters.querySelectorAll('.ha-feat-pill').forEach(function (btn) {
			var active = state.feats.indexOf(btn.dataset.slug) >= 0;
			btn.classList.toggle('active', active);
			btn.setAttribute('aria-pressed', active ? 'true' : 'false');
		});
	}

	/**
	 * Toggle a feature slug in state.feats and reload.
	 * @param {string} slug
	 */
	function toggleFeature(slug) {
		var idx = state.feats.indexOf(slug);
		if (idx >= 0) {
			state.feats.splice(idx, 1);
		} else {
			state.feats.push(slug);
		}
		updateFeatUI();
		resetAndLoad();
	}

	// =========================================================
	// API: Load sites
	// =========================================================

	/**
	 * Fetch sites from the REST API and render them.
	 * @param {boolean} reset — if true, clear the grid and start from page 1.
	 */
	async function loadSites(reset) {
		if (state.loading) {
			// Cancel any in-flight request.
			if (currentController) {
				currentController.abort();
			}
		}

		if (reset) {
			state.page   = 1;
			state.total  = 0;
			state.items  = new Map();
			renderSkeletons();
			setNoResults(false);
			setLoadMore(false);
		}

		state.loading = true;
		if (loadMoreBtn) {
			loadMoreBtn.disabled = true;
			loadMoreBtn.textContent = l10n.loading || 'در حال بارگذاری...';
		}

		currentController = new AbortController();

		try {
			var params = new URLSearchParams();
			params.set('page',     state.page);
			params.set('per_page', cfg.perPage || 12);
			if (state.search)         params.set('search',   state.search);
			if (state.cat)            params.set('category', state.cat);
			if (state.feats.length)   params.set('features', state.feats.join(','));
			if (state.sort)           params.set('sort',     state.sort);
			if (state.status)         params.set('status',   state.status);

			var url  = cfg.apiBase + 'sites?' + params.toString();
			var resp = await fetch(url, {
				signal:  currentController.signal,
				headers: { 'X-WP-Nonce': cfg.nonce }
			});

			if (!resp.ok) throw new Error('Sites fetch failed: ' + resp.status);

			var total      = parseInt(resp.headers.get('X-WP-Total') || '0', 10);
			var totalPages = parseInt(resp.headers.get('X-WP-TotalPages') || '1', 10);
			var items      = await resp.json();

			state.total      = total;
			state.totalPages = totalPages;

			// Remove skeletons on first load.
			if (reset) {
				grid.querySelectorAll('.ha-skeleton-card').forEach(function (el) { el.remove(); });
			}

			if (items.length === 0 && state.page === 1) {
				// No results.
				grid.innerHTML = '';
				setNoResults(true);
				setLoadMore(false);
			} else {
				setNoResults(false);

				// Append cards with stagger.
				var fragment = document.createDocumentFragment();
				items.forEach(function (item, idx) {
					state.items.set(item.id, item);
					var card = createCard(item);
					fragment.appendChild(card);
					// Stagger visibility.
					(function (c, i) {
						setTimeout(function () { observeCard(c); }, i * 60);
					}(card, idx));
				});
				grid.appendChild(fragment);

				// Load more button.
				setLoadMore(state.page < state.totalPages);
			}

			updateCounter();
			updateHash();

		} catch (err) {
			if (err.name === 'AbortError') {
				// Request was intentionally aborted; do nothing.
				return;
			}
			console.error('[ha-sites] loadSites error:', err);
			if (grid) {
				grid.querySelectorAll('.ha-skeleton-card').forEach(function (el) { el.remove(); });
			}
		} finally {
			state.loading = false;
			if (loadMoreBtn) {
				loadMoreBtn.disabled = false;
				loadMoreBtn.textContent = l10n.loadMore || 'نمایش بیشتر';
			}
		}
	}

	/**
	 * Convenience: reset=true load.
	 */
	function resetAndLoad() {
		loadSites(true);
	}

	/**
	 * Show or hide the load-more button.
	 * @param {boolean} visible
	 */
	function setLoadMore(visible) {
		if (!loadMoreBtn) return;
		loadMoreBtn.style.display = visible ? 'inline-block' : 'none';
	}

	/**
	 * Show or hide the no-results message.
	 * @param {boolean} visible
	 */
	function setNoResults(visible) {
		if (!noResults) return;
		noResults.style.display = visible ? 'flex' : 'none';
	}

	// =========================================================
	// Modal
	// =========================================================
	var iframeErrorTimer = null;

	/**
	 * Open the quick-view modal for a given item.
	 * @param {Object} item
	 */
	function openModal(item) {
		if (!modal) return;

		// Badge
		if (modalBadge) {
			if (item.status) {
				modalBadge.textContent   = statusLabel(item.status);
				modalBadge.className     = 'ha-modal-badge ha-status-' + item.status;
				modalBadge.style.display = '';
			} else {
				modalBadge.style.display = 'none';
			}
		}

		// Title
		if (modalTitle) modalTitle.textContent = item.title || '';

		// Description
		if (modalDesc) modalDesc.textContent = item.excerpt || '';

		// Categories
		if (modalCats) {
			if (item.categories && item.categories.length) {
				modalCats.innerHTML = item.categories.map(function (c) {
					return '<span class="ha-modal-cat-tag">' + escapeHTML(c.name) + '</span>';
				}).join('');
				modalCats.style.display = '';
			} else {
				modalCats.innerHTML = '';
				modalCats.style.display = 'none';
			}
		}

		// Features
		if (modalFeats) {
			if (item.features && item.features.length) {
				modalFeats.innerHTML = item.features.map(function (f) {
					return '<span class="ha-modal-feat-tag">' + escapeHTML(f.name) + '</span>';
				}).join('');
				modalFeats.style.display = '';
			} else {
				modalFeats.innerHTML = '';
				modalFeats.style.display = 'none';
			}
		}

		// Price
		if (modalPrice) {
			if (item.price !== null && item.price !== undefined) {
				modalPrice.innerHTML = escapeHTML(formatPrice(item.price, cfg.currency));
				modalPrice.className = 'ha-modal-price';
			} else {
				modalPrice.textContent = l10n.contact || 'تماس بگیرید';
				modalPrice.className   = 'ha-modal-price ha-modal-price-contact';
			}
		}

		// WhatsApp button
		if (modalWa) {
			if (cfg.whatsapp) {
				modalWa.href         = buildWhatsAppUrl(item.title);
				modalWa.style.display = '';
			} else {
				modalWa.style.display = 'none';
			}
		}

		// Demo button
		if (modalDemo) {
			if (item.demo_url) {
				modalDemo.href         = item.demo_url;
				modalDemo.style.display = '';
			} else {
				modalDemo.style.display = 'none';
			}
		}

		// Iframe: reset device to desktop.
		setDevice('desktop');
		if (modalIframe && item.demo_url) {
			showIframeLoader();
			modalIframe.src = item.demo_url;
		} else if (modalIframe) {
			modalIframe.src = 'about:blank';
			hideIframeLoader();
		}

		// Show modal.
		modal.classList.add('is-open');
		modal.style.display = '';
		document.body.style.overflow = 'hidden';
		modal.focus();
	}

	/** Close the modal. */
	function closeModal() {
		if (!modal) return;
		modal.classList.remove('is-open');
		modal.style.display = 'none';
		document.body.style.overflow = '';

		// Reset iframe.
		if (modalIframe) {
			modalIframe.src = 'about:blank';
		}
		clearTimeout(iframeErrorTimer);
	}

	/** Show the iframe loading overlay. */
	function showIframeLoader() {
		if (modalLoader) {
			modalLoader.classList.remove('hidden');
		}
		clearTimeout(iframeErrorTimer);
		// Error fallback after 15 seconds.
		iframeErrorTimer = setTimeout(function () {
			hideIframeLoader();
		}, 15000);
	}

	/** Hide the iframe loading overlay. */
	function hideIframeLoader() {
		clearTimeout(iframeErrorTimer);
		if (modalLoader) {
			modalLoader.classList.add('hidden');
		}
	}

	/**
	 * Switch the iframe device width class.
	 * @param {string} device — 'desktop' | 'tablet' | 'mobile'
	 */
	function setDevice(device) {
		var btns = modal ? modal.querySelectorAll('.ha-device-btn') : [];
		btns.forEach(function (btn) {
			var active = btn.dataset.device === device;
			btn.classList.toggle('active', active);
			btn.setAttribute('aria-pressed', active ? 'true' : 'false');
		});
		if (modalIframe) {
			modalIframe.className = 'ha-modal-iframe ' + device;
		}
	}

	// =========================================================
	// Event bindings
	// =========================================================

	function bindEvents() {
		// Debounced search.
		if (searchInput) {
			searchInput.addEventListener('input', debounce(function () {
				state.search = searchInput.value.trim();
				resetAndLoad();
			}, 300));

			// Restore search value from state on init.
			if (state.search) {
				searchInput.value = state.search;
			}
		}

		// Sort select.
		if (sortSelect) {
			sortSelect.addEventListener('change', function () {
				state.sort = sortSelect.value;
				resetAndLoad();
			});
			// Restore from state.
			sortSelect.value = state.sort;
		}

		// Load more button.
		if (loadMoreBtn) {
			loadMoreBtn.addEventListener('click', function () {
				if (state.loading) return;
				state.page++;
				loadSites(false);
			});
		}

		// Reset button.
		if (resetBtn) {
			resetBtn.addEventListener('click', function () {
				state.cat    = '';
				state.feats  = [];
				state.search = '';
				state.sort   = 'newest';
				state.status = '';
				if (searchInput) searchInput.value = '';
				if (sortSelect)  sortSelect.value  = 'newest';
				updateCatUI();
				updateFeatUI();
				resetAndLoad();
			});
		}

		// Modal: close button.
		if (modalClose) {
			modalClose.addEventListener('click', closeModal);
		}

		// Modal: backdrop click.
		if (modalBackdrop) {
			modalBackdrop.addEventListener('click', closeModal);
		}

		// Modal: Escape key.
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
				closeModal();
			}
		});

		// Modal: device switcher buttons.
		if (modal) {
			modal.querySelectorAll('.ha-device-btn').forEach(function (btn) {
				btn.addEventListener('click', function () {
					setDevice(btn.dataset.device);
				});
			});
		}

		// Modal: iframe load event.
		if (modalIframe) {
			modalIframe.addEventListener('load', function () {
				// The load event fires even when the iframe is blocked,
				// so we try to detect an empty document.
				try {
					var doc = modalIframe.contentDocument;
					if (doc && doc.body && doc.body.innerHTML.trim() === '') {
						// Likely blocked by X-Frame-Options.
						hideIframeLoader();
						return;
					}
				} catch (e) {
					// Cross-origin: assume loaded successfully.
				}
				if (modalIframe.src !== 'about:blank') {
					hideIframeLoader();
				}
			});
		}

		// Hash change (browser back/forward).
		window.addEventListener('hashchange', function () {
			var newState = { cat: '', feats: [], sort: 'newest', search: '', status: '' };
			parseHash(window.location.hash);
			// We already mutated state in parseHash; sync UI and reload.
			updateCatUI();
			updateFeatUI();
			if (searchInput) searchInput.value = state.search;
			if (sortSelect)  sortSelect.value  = state.sort;
			resetAndLoad();
		});
	}

	// =========================================================
	// Initialise
	// =========================================================

	function init() {
		app = document.getElementById('ha-sites-app');
		if (!app) return;

		// Read data attributes from the app container.
		var perPage   = parseInt(app.dataset.perPage, 10) || 12;
		cfg.perPage   = perPage;

		var initCat   = app.dataset.initCat  || '';
		var initFeat  = app.dataset.initFeat || '';
		var columns   = app.dataset.columns  || '3';

		// Collect DOM refs.
		grid          = document.getElementById('ha-grid');
		counter       = document.getElementById('ha-counter');
		catFilters    = document.getElementById('ha-cat-filters');
		featFilters   = document.getElementById('ha-feat-filters');
		loadMoreWrap  = document.getElementById('ha-loadmore-wrap');
		loadMoreBtn   = document.getElementById('ha-loadmore');
		noResults     = document.getElementById('ha-no-results');
		resetBtn      = document.getElementById('ha-reset');
		searchInput   = document.getElementById('ha-search');
		sortSelect    = document.getElementById('ha-sort');

		// Modal refs.
		modal         = document.getElementById('ha-modal');
		modalBackdrop = document.getElementById('ha-modal-backdrop');
		modalClose    = document.getElementById('ha-modal-close');
		modalTitle    = document.getElementById('ha-modal-title');
		modalDesc     = document.getElementById('ha-modal-desc');
		modalBadge    = document.getElementById('ha-modal-badge');
		modalPrice    = document.getElementById('ha-modal-price');
		modalWa       = document.getElementById('ha-modal-wa');
		modalDemo     = document.getElementById('ha-modal-demo');
		modalIframe   = document.getElementById('ha-modal-iframe');
		modalLoader   = document.getElementById('ha-iframe-loader');
		modalCats     = document.getElementById('ha-modal-cats');
		modalFeats    = document.getElementById('ha-modal-feats');
		iframeWrap    = document.getElementById('ha-iframe-wrap');

		// Parse URL hash first (so URL state takes precedence over data-attrs).
		parseHash(window.location.hash);

		// Apply data-attr pre-filters only if hash didn't set them.
		if (!state.cat && initCat) {
			state.cat = initCat;
		}
		if (!state.feats.length && initFeat) {
			state.feats = initFeat.split(',').filter(Boolean);
		}

		// Init observers.
		initImageObserver();
		initCardObserver();

		// Bind all events.
		bindEvents();

		// Load filters then load first page of sites.
		loadFilters().then(function () {
			// After filters rendered, re-apply active states.
			updateCatUI();
			updateFeatUI();
		});

		loadSites(true);
	}

	// =========================================================
	// Bootstrap
	// =========================================================
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

})();
