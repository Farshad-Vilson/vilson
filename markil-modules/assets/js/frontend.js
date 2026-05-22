/**
 * مارکیل ماژول‌ها - فرانت‌اند پایدار و ایزوله
 * هر ویجت وضعیت مستقل خودش را دارد تا تغییر نما، فیلتر و پنل جزئیات با هم تداخل نکنند.
 */
(function($) {
    'use strict';

    function createState($wrapper) {
        var $container = $wrapper.find('.markil-modules-container');
        var $pagination = $wrapper.find('.markil-pagination');
        return {
            currentCategory: String($container.attr('data-category') || 'all'),
            currentSearch: '',
            currentOrderby: $container.data('orderby') || 'newest',
            currentPage: 1,
            totalPages: 1,
            loading: false,
            activeModuleId: null,
            currentTag: '',
            minPrice: '',
            maxPrice: '',
            minRating: '',
            freeOnly: false,
            paginationType: $pagination.data('type') || 'numbers',
            perPage: parseInt($container.data('per-page'), 10) || 12,
            allLoaded: false,
            idleTimer: null,
            idleIndex: 0,
            lastModules: [],
            currentLayout: $container.hasClass('markil-list') ? 'list' : 'grid'
        };
    }

    function initWrapper($wrapper) {
        if ($wrapper.data('markil-init')) return;
        $wrapper.data('markil-init', true);

        var state = createState($wrapper);
        $wrapper.data('markil-state', state);

        setLayout($wrapper, state.currentLayout);
        bindEvents($wrapper, state);
        loadModules($wrapper, state, false);
    }

    function bindEvents($wrapper, state) {
        var searchTimer;

        $wrapper.on('input', '.markil-search-input', function() {
            clearTimeout(searchTimer);
            var val = $(this).val().trim();
            searchTimer = setTimeout(function() {
                state.currentSearch = val;
                state.currentPage = 1;
                loadModules($wrapper, state, false);
            }, 350);
        });

        $wrapper.on('click', '.markil-mobile-category-toggle', function(e) {
            e.preventDefault();
            var $btn = $(this);
            var opened = $btn.attr('aria-expanded') === 'true';
            $btn.attr('aria-expanded', opened ? 'false' : 'true');
            $wrapper.find('.markil-category-tabs-wrap').toggleClass('markil-cats-open', !opened);
        });

        $wrapper.on('click', '.markil-cat-tab', function(e) {
            e.preventDefault();
            $wrapper.find('.markil-cat-tab').removeClass('active');
            $(this).addClass('active');
            $wrapper.find('.markil-category-tabs-wrap').removeClass('markil-cats-open');
            $wrapper.find('.markil-mobile-category-toggle').attr('aria-expanded', 'false');
            state.currentCategory = String($(this).attr('data-category') || 'all');
            state.currentPage = 1;
            loadModules($wrapper, state, false);
        });

        $wrapper.on('change', '.markil-sort-select', function() {
            state.currentOrderby = $(this).val();
            state.currentPage = 1;
            loadModules($wrapper, state, false);
        });

        $wrapper.on('change', '.markil-layout-select', function() {
            var layout = $(this).val() === 'list' ? 'list' : 'grid';
            state.currentLayout = layout;
            setLayout($wrapper, layout);
        });

        $wrapper.on('click', '.markil-layout-btn', function(e) {
            e.preventDefault();
            var layout = $(this).data('layout') === 'list' ? 'list' : 'grid';
            state.currentLayout = layout;
            setLayout($wrapper, layout);
        });

        $wrapper.on('click', '.markil-filter-toggle-btn', function(e) {
            e.preventDefault();
            $(this).toggleClass('active');
            $wrapper.find('.markil-filter-panel').stop(true, true).slideToggle(180);
        });

        $wrapper.on('click', '.markil-tag-chip', function(e) {
            e.preventDefault();
            $wrapper.find('.markil-tag-chip').not(this).removeClass('active');
            $(this).toggleClass('active');
            state.currentTag = $(this).hasClass('active') ? ($(this).data('tag') || '') : '';
        });

        $wrapper.on('click', '.markil-apply-filters', function(e) {
            e.preventDefault();
            state.minPrice  = $wrapper.find('.markil-min-price').val();
            state.maxPrice  = $wrapper.find('.markil-max-price').val();
            state.minRating = $wrapper.find('[name^="markil_min_rating"]:checked').val() || '';
            state.freeOnly  = $wrapper.find('.markil-free-filter').is(':checked');
            state.currentPage = 1;
            loadModules($wrapper, state, false);
            $wrapper.find('.markil-filter-panel').slideUp(180);
            $wrapper.find('.markil-filter-toggle-btn').removeClass('active');
        });

        $wrapper.on('click', '.markil-reset-filters', function(e) {
            e.preventDefault();
            state.minPrice = state.maxPrice = state.minRating = state.currentTag = '';
            state.freeOnly = false;
            state.currentPage = 1;
            $wrapper.find('.markil-min-price, .markil-max-price').val('');
            $wrapper.find('[name^="markil_min_rating"]').prop('checked', false);
            $wrapper.find('.markil-free-filter').prop('checked', false);
            $wrapper.find('.markil-tag-chip').removeClass('active');
            loadModules($wrapper, state, false);
        });

        $wrapper.on('click', '.markil-page-btn', function(e) {
            e.preventDefault();
            if ($(this).hasClass('active') || $(this).prop('disabled')) return;
            state.currentPage = parseInt($(this).data('page'), 10) || 1;
            loadModules($wrapper, state, false);
            $('html, body').animate({ scrollTop: Math.max(0, $wrapper.offset().top - 80) }, 250);
        });

        $wrapper.on('click', '.markil-load-more-btn', function(e) {
            e.preventDefault();
            if (state.loading || state.allLoaded) return;
            state.currentPage++;
            loadModules($wrapper, state, true);
        });

        $wrapper.on('click', '.markil-module-card', function(e) {
            if ($(e.target).closest('a, button, input, select, textarea').length) return;
            var id = $(this).data('id');
            if (!id) return;
            $wrapper.find('.markil-module-card').removeClass('active');
            $(this).addClass('active');
            openDetailPanel($wrapper, state, id);
        });

        $wrapper.on('click', '.markil-idle-open', function(e) {
            e.preventDefault();
            var id = $(this).data('id');
            if (id) openDetailPanel($wrapper, state, id);
        });

        $wrapper.on('click', '.markil-wishlist-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var $btn = $(this);
            var id = $btn.closest('.markil-module-card').data('id');
            if (id) toggleWishlist($btn, id);
        });


        $wrapper.on('click', '.markil-mobile-panel-close', function(e) {
            e.preventDefault();
            var $panel = $wrapper.find('.markil-detail-panel');
            $panel.removeClass('markil-panel-open');
            if (window.matchMedia && window.matchMedia('(max-width: 767px)').matches) {
                $panel.hide();
            }
        });

        $wrapper.on('click', '.markil-panel-tab-btn', function(e) {
            e.preventDefault();
            var tab = $(this).data('tab');
            var $tabs = $(this).closest('.markil-panel-tabs');
            $tabs.find('.markil-panel-tab-btn').removeClass('active');
            $(this).addClass('active');
            $tabs.find('.markil-panel-tab-content').removeClass('active');
            $tabs.find('.markil-panel-tab-content[data-tab="' + tab + '"]').addClass('active');
        });

        $wrapper.on('click', '.markil-submit-review', function(e) {
            e.preventDefault();
            var $form = $(this).closest('.markil-review-form');
            var moduleId = $form.data('module');
            var rating = $form.find('[name^="markil_review_rating"]:checked').val();
            var comment = $form.find('textarea').val().trim();
            if (!rating) { alert(MarkilModules.selectRating || 'لطفاً امتیاز انتخاب کنید'); return; }
            submitReview($form, moduleId, rating, comment);
        });

        if (state.paginationType === 'infinite') {
            $(window).on('scroll.markil-' + uniqueId($wrapper), function() {
                var $container = $wrapper.find('.markil-modules-container');
                if (!$container.length || state.loading || state.allLoaded) return;
                var bottom = $container.offset().top + $container.outerHeight();
                var scroll = $(window).scrollTop() + $(window).height();
                if (scroll > bottom - 220) {
                    state.currentPage++;
                    loadModules($wrapper, state, true);
                }
            });
        }
    }

    function setLayout($wrapper, layout) {
        var $container = $wrapper.find('.markil-modules-container');
        $container.removeClass('markil-grid markil-list').addClass('markil-' + layout).attr('data-current-layout', layout);
        $wrapper.find('.markil-layout-btn').removeClass('active').attr('aria-pressed', 'false');
        $wrapper.find('.markil-layout-btn[data-layout="' + layout + '"]').addClass('active').attr('aria-pressed', 'true');
        $wrapper.find('.markil-layout-select').val(layout);
    }

    function loadModules($wrapper, state, append) {
        if (state.loading) return;
        state.loading = true;

        var $container = $wrapper.find('.markil-modules-container');
        var settings = getCardSettings($container);

        if (!append) {
            $container.html('<div class="markil-loading"><div class="markil-spinner"></div><span>' + escHtml(MarkilModules.loading || 'در حال بارگذاری...') + '</span></div>');
            state.allLoaded = false;
        } else {
            $wrapper.find('.markil-load-more-btn').prop('disabled', true).text('در حال بارگذاری...');
        }

        $.ajax({
            url: MarkilModules.ajax_url,
            type: 'POST',
            data: {
                action: 'markil_filter_modules',
                nonce: $wrapper.data('nonce') || MarkilModules.nonce,
                search: state.currentSearch,
                category: state.currentCategory !== 'all' ? state.currentCategory : '',
                orderby: state.currentOrderby,
                paged: state.currentPage,
                per_page: state.perPage,
                tag: state.currentTag,
                min_price: state.minPrice,
                max_price: state.maxPrice,
                min_rating: state.minRating,
                free_only: state.freeOnly ? '1' : ''
            },
            success: function(res) {
                state.loading = false;
                if (!res || !res.success) {
                    showError($container, 'خطا در دریافت اطلاعات.');
                    return;
                }

                var data = res.data || {};
                var modules = data.modules || [];
                state.totalPages = parseInt(data.total_pages, 10) || 1;
                state.currentPage = parseInt(data.current, 10) || state.currentPage;
                state.allLoaded = state.currentPage >= state.totalPages;
                state.lastModules = modules;

                $wrapper.find('.markil-results-count').text(data.total || 0);

                if (!modules.length && !append) {
                    $container.html('<div class="markil-no-results"><div class="markil-no-results-icon">🔍</div><p>' + escHtml(MarkilModules.no_results || 'ماژولی یافت نشد') + '</p></div>');
                    $wrapper.find('.markil-pagination').empty();
                    startIdlePanel($wrapper, state);
                    return;
                }

                var html = modules.map(function(m) { return buildModuleCard(m, settings); }).join('');
                if (append) {
                    $container.append(html);
                } else {
                    $container.html(html);
                }
                setLayout($wrapper, state.currentLayout);
                renderPagination($wrapper, state, data);
                startIdlePanel($wrapper, state);
            },
            error: function() {
                state.loading = false;
                if (!append) showError($container, 'خطا در بارگذاری. لطفاً دوباره تلاش کنید.');
            }
        });
    }

    function getCardSettings($container) {
        try { return JSON.parse($container.attr('data-settings') || '{}'); }
        catch(e) { return {}; }
    }

    function getPanelIcons($wrapper) {
        var raw = $wrapper.find('.markil-detail-panel').attr('data-icons') || '{}';
        try { return JSON.parse(raw); } catch(e) { return {}; }
    }

    function iconHtml(settingsOrIcons, key, fallback) {
        var icons = settingsOrIcons.icons || settingsOrIcons || {};
        return icons[key] || fallback || '';
    }

    function showError($container, text) {
        $container.html('<div class="markil-no-results"><p>' + escHtml(text) + '</p></div>');
    }

    function buildModuleCard(m, s) {
        var currency = s.currency || MarkilModules.currency || 'تومان';
        var titleTag = safeTag(s.title_tag || 'h3');
        var iconStyle = 'background:' + escAttr(m.icon_bg || '#e6f9f6') + ';color:' + escAttr(m.icon_color || '#011627') + ';';
        var icons = s.icons || {};

        var imageHtml = '';
        if (s.show_image === 'yes') {
            imageHtml = '<div class="markil-card-image" style="' + iconStyle + '">';
            imageHtml += m.image ? '<img src="' + escAttr(m.image) + '" alt="' + escAttr(m.title) + '" loading="lazy">' : '<span class="markil-icon-placeholder">' + iconHtml(icons, 'placeholder', '📦') + '</span>';
            imageHtml += '</div>';
        }

        var badgeHtml = (s.show_badge === 'yes' && m.badge) ? '<span class="markil-badge">' + escHtml(m.badge) + '</span>' : '';
        var favoriteCount = parseInt(m.favorites_count || 0, 10);
        var wishlistHtml = (s.show_wishlist === 'yes') ? '<button type="button" class="markil-wishlist-btn" aria-label="افزودن به علاقه‌مندی‌ها" data-icon-off="' + escAttr(iconHtml(icons, 'wishlist', '♡')) + '" data-icon-on="' + escAttr(iconHtml(icons, 'wishlist_on', '♥')) + '"><span class="markil-heart-icon">' + iconHtml(icons, 'wishlist', '♡') + '</span><span class="markil-wishlist-number">' + formatNumber(favoriteCount) + '</span></button>' : '';
        var titleHtml = (s.show_title === 'yes') ? '<' + titleTag + ' class="markil-card-title">' + escHtml(m.title) + '</' + titleTag + '>' : '';
        var excerptHtml = (s.show_excerpt === 'yes' && m.excerpt) ? '<p class="markil-card-excerpt">' + escHtml(m.excerpt) + '</p>' : '';

        var ratingHtml = '';
        if (s.show_rating === 'yes' && parseFloat(m.rating || 0) > 0) {
            ratingHtml = '<span class="markil-rating"><span class="markil-star">' + iconHtml(icons, 'rating', '★') + '</span><span>' + escHtml(m.rating) + '</span>' + (m.review_count ? '<small>(' + escHtml(m.review_count) + ')</small>' : '') + '</span>';
        }
        var favoritesHtml = (s.show_installs === 'yes') ? '<span class="markil-favorites-count"><span class="markil-heart-mini">' + iconHtml(icons, 'wishlist_on', '♥') + '</span> ' + formatNumber(favoriteCount) + '</span>' : '';

        var priceHtml = '';
        if (s.show_price === 'yes') {
            if (m.is_free) priceHtml = '<span class="markil-card-price free">رایگان</span>';
            else if (m.price) priceHtml = '<span class="markil-card-price">' + (m.old_price ? '<span class="markil-old-price">' + formatNumber(m.old_price) + '</span> ' : '') + formatNumber(m.price) + ' ' + escHtml(currency) + '</span>';
        }
        var taxonomyHtml = '';
        var cats = (s.show_category_badge === 'yes' && m.categories && m.categories.length) ? m.categories.map(function(cat){ return '<span class="markil-category-badge">' + escHtml(cat.name || cat) + '</span>'; }).join('') : '';
        var tags = (s.show_tag_badge === 'yes' && m.tags && m.tags.length) ? m.tags.map(function(tag){ return '<span class="markil-tag-badge">#' + escHtml(tag) + '</span>'; }).join('') : '';
        taxonomyHtml = (cats || tags) ? '<div class="markil-card-taxonomy">' + cats + tags + '</div>' : '';

        return '<article class="markil-module-card" data-id="' + escAttr(m.id) + '">' +
            '<div class="markil-card-top">' + imageHtml + '<div class="markil-card-actions">' + wishlistHtml + badgeHtml + '</div></div>' +
            taxonomyHtml +
            '<div class="markil-card-body">' + titleHtml + excerptHtml + '</div>' +
            '<div class="markil-card-meta-row"><div class="markil-card-rating-side">' + ratingHtml + favoritesHtml + '</div><div class="markil-card-price-side">' + priceHtml + '</div></div>' +
        '</article>';
    }

    function renderPagination($wrapper, state, data) {
        var $pag = $wrapper.find('.markil-pagination');
        if (!$pag.length) return;
        var type = $pag.data('type') || 'numbers';
        $pag.empty();

        if (type === 'numbers') {
            if ((data.total_pages || 1) <= 1) return;
            var current = parseInt(data.current, 10) || 1;
            var total = parseInt(data.total_pages, 10) || 1;
            var html = '<button type="button" class="markil-page-btn" data-page="' + Math.max(1, current - 1) + '" ' + (current <= 1 ? 'disabled' : '') + '>‹</button>';
            for (var i = 1; i <= total; i++) {
                if (total > 7 && i > 2 && i < total - 1 && Math.abs(i - current) > 1) {
                    if (i === 3 || i === total - 2) html += '<span class="markil-page-dots">…</span>';
                    continue;
                }
                html += '<button type="button" class="markil-page-btn' + (i === current ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
            }
            html += '<button type="button" class="markil-page-btn" data-page="' + Math.min(total, current + 1) + '" ' + (current >= total ? 'disabled' : '') + '>›</button>';
            $pag.html(html);
        } else if (type === 'load_more' && !state.allLoaded) {
            var btnText = $pag.data('load-more-text') || 'نمایش بیشتر';
            $pag.html('<button type="button" class="markil-load-more-btn">' + escHtml(btnText) + '</button>');
        }
    }

    function openDetailPanel($wrapper, state, moduleId) {
        var $panel = $wrapper.find('.markil-detail-panel');
        if (!$panel.length) return;
        stopIdlePanel(state);
        state.activeModuleId = moduleId;
        var icons = getPanelIcons($wrapper);
        var closeIcon = iconHtml(icons, 'close', '×');
        $panel.removeClass('markil-panel-idle').addClass('markil-panel-open').find('.markil-panel-inner').html('<button type="button" class="markil-mobile-panel-close" aria-label="بستن">' + closeIcon + '</button><div class="markil-panel-loading"><div class="markil-spinner"></div></div>');
        $panel.show();

        $.ajax({
            url: MarkilModules.ajax_url,
            type: 'POST',
            data: {
                action: 'markil_get_module_detail',
                nonce: $wrapper.data('nonce') || MarkilModules.nonce,
                module_id: moduleId
            },
            success: function(res) {
                if (!res || !res.success) return;
                $panel.find('.markil-panel-inner').html('<button type="button" class="markil-mobile-panel-close" aria-label="بستن">' + closeIcon + '</button>' + buildDetailHtml(res.data || {}, icons));
                $panel.find('.markil-panel-tab-btn:first').addClass('active');
                $panel.find('.markil-panel-tab-content:first').addClass('active');
            }
        });
    }

    function buildDetailHtml(m, icons) {
        icons = icons || {};
        var currency = MarkilModules.currency || 'تومان';
        var statusHtml = '';

        var iconStyle = 'background:' + escAttr(m.icon_bg || '#e6f9f6') + ';color:' + escAttr(m.icon_color || '#011627') + ';';
        var detailIconHtml = m.image ? '<img src="' + escAttr(m.image) + '" alt="' + escAttr(m.title) + '">' : '<span class="markil-icon-placeholder">' + iconHtml(icons, 'placeholder', '📦') + '</span>';

        var statsHtml = '';
        if (parseFloat(m.rating || 0) > 0) statsHtml += '<span class="markil-stat markil-stat-rating"><span class="markil-star">' + iconHtml(icons, 'rating', '★') + '</span> ' + escHtml(m.rating) + ' (' + escHtml(m.review_count || 0) + ')</span>';
        if (parseInt(m.installs || 0, 10) > 0) statsHtml += '<span class="markil-stat markil-stat-installs">' + iconHtml(icons, 'installs', '👥') + ' +' + formatNumber(m.installs) + ' نصب</span>';
        statsHtml += '<span class="markil-stat markil-stat-version">' + iconHtml(icons, 'version', '📦') + ' v' + escHtml(m.version || '1.0.0') + '</span>';

        var priceHtml = '';
        if (m.is_free) priceHtml = '<div class="markil-panel-price free">رایگان</div>';
        else if (m.price) priceHtml = '<div class="markil-panel-price">' + (m.old_price ? '<span class="markil-old-price">' + formatNumber(m.old_price) + '</span> ' : '') + formatNumber(m.price) + ' ' + escHtml(currency) + '</div>';

        var reviewCount = m.reviews ? m.reviews.length : 0;
        var tabs = (m.tabs && m.tabs.length) ? m.tabs : [
            {label: m.tab1_label || 'جزئیات',    summary: m.tab_details        || (m.excerpt ? '<p>' + escHtml(m.excerpt) + '</p>' : ''), content: ''},
            {label: m.tab2_label || 'امکانات',    summary: m.tab_features       || '', content: ''},
            {label: m.tab3_label || 'سازگاری',    summary: m.tab_compatibility  || '<p class="markil-muted-empty">اطلاعات سازگاری در دسترس نیست.</p>', content: ''},
            {label: (m.tab4_label || 'نقد و بررسی') + ' (' + reviewCount + ')', summary: m.tab_reviews_html || '<p class="markil-muted-empty">هنوز نظری ثبت نشده است.</p>', content: ''}
        ];

        // Side panel uses SHORT summary (fall back to content if summary empty)
        var tabsNav = '', tabsContent = '';
        tabs.forEach(function(tab, idx) {
            var key = 'tab-' + idx;
            var shortContent = tab.summary || tab.content || '';
            tabsNav += '<button type="button" class="markil-panel-tab-btn" data-tab="' + key + '">' + escHtml(tab.label || ('تب ' + (idx + 1))) + '</button>';
            tabsContent += '<div class="markil-panel-tab-content" data-tab="' + key + '"><div class="markil-tab-body">' + shortContent + '</div></div>';
        });

        var btn1Text   = escHtml(m.btn_primary_text   || 'افزودن به سبد خرید');
        var btn2Text   = escHtml(m.btn_secondary_text || 'جزئیات بیشتر');
        var btn1Action = m.btn_primary_action   || 'wc_add';
        var btn2Action = m.btn_secondary_action || 'detail_page';
        var wc_id      = m.wc_product_id;
        var detailUrl  = m.detail_page || m.permalink || '#';

        // Resolve primary button href
        var btn1Href = '#';
        if      (btn1Action === 'wc_add'    && wc_id)  btn1Href = '?add-to-cart=' + encodeURIComponent(wc_id);
        else if (btn1Action === 'wc_page'   && wc_id)  btn1Href = m.permalink || '#';
        else if (btn1Action === 'detail_page')          btn1Href = detailUrl;
        else if (btn1Action === 'custom_url')           btn1Href = m.primary_custom_url || detailUrl;
        else if (wc_id)                                 btn1Href = '?add-to-cart=' + encodeURIComponent(wc_id);
        else                                            btn1Href = detailUrl;

        // Resolve secondary button href — always a real link, no modal
        var btn2Href = detailUrl; // default: go to /markil-module/slug/
        if      (btn2Action === 'detail_page')           btn2Href = detailUrl;
        else if (btn2Action === 'wc_add'    && wc_id)    btn2Href = '?add-to-cart=' + encodeURIComponent(wc_id);
        else if (btn2Action === 'wc_page'   && wc_id)    btn2Href = m.permalink || detailUrl;
        else if (btn2Action === 'custom_url')             btn2Href = m.secondary_custom_url || detailUrl;

        var btn2Html = '<a href="' + escAttr(btn2Href) + '" class="markil-btn-secondary">' + btn2Text + '</a>';

        return '<div class="markil-panel-content">' +
            statusHtml +
            '<div class="markil-detail-hero"><div class="markil-detail-icon" style="' + iconStyle + '">' + detailIconHtml + '</div>' +
            '<div class="markil-detail-hero-info"><h2 class="markil-panel-title">' + escHtml(m.title) + '</h2>' +
            (m.excerpt ? '<p class="markil-detail-excerpt">' + escHtml(m.excerpt) + '</p>' : '') +
            '<div class="markil-detail-stats">' + statsHtml + '</div></div></div>' +
            priceHtml +
            '<div class="markil-panel-tabs"><div class="markil-panel-tabs-nav">' + tabsNav + '</div><div class="markil-panel-tabs-content">' + tabsContent + '</div></div>' +
            '<div class="markil-panel-actions"><a href="' + escAttr(btn1Href) + '" class="markil-btn-primary">' + btn1Text + '</a>' + btn2Html + '</div>' +
        '</div>';
    }

    function startIdlePanel($wrapper, state) {
        var $panel = $wrapper.find('.markil-detail-panel');
        if (!$panel.length || $panel.data('idle-slider') !== 'yes' || state.activeModuleId) return;
        if (isMobilePanel()) {
            stopIdlePanel(state);
            $panel.removeClass('markil-panel-open markil-panel-idle').hide();
            return;
        }
        stopIdlePanel(state);
        $panel.addClass('markil-panel-idle').show();
        renderIdlePanel($wrapper, state);
        var interval = parseInt($panel.data('idle-interval'), 10) || 4500;
        state.idleTimer = setInterval(function() {
            if (state.activeModuleId) { stopIdlePanel(state); return; }
            state.idleIndex++;
            renderIdlePanel($wrapper, state);
        }, interval);
    }

    function stopIdlePanel(state) {
        if (state.idleTimer) {
            clearInterval(state.idleTimer);
            state.idleTimer = null;
        }
    }

    function renderIdlePanel($wrapper, state) {
        var $panel = $wrapper.find('.markil-detail-panel');
        var modules = state.lastModules || [];
        var title = $panel.data('idle-title') || 'ماژول‌های پیشنهادی';
        var desc = $panel.data('idle-description') || 'برای دیدن جزئیات، یک ماژول را انتخاب کنید.';
        var icons = getPanelIcons($wrapper);
        if (!modules.length) {
            $panel.find('.markil-panel-inner').html('<div class="markil-panel-empty"><div class="markil-panel-empty-icon">' + iconHtml(icons, 'empty_panel', '🏪') + '</div><h3>' + escHtml(title) + '</h3><p>' + escHtml(desc) + '</p></div>');
            return;
        }
        var m = modules[state.idleIndex % modules.length];
        var price = m.is_free ? '<span class="markil-card-price free">رایگان</span>' : (m.price ? '<span class="markil-card-price">' + formatNumber(m.price) + ' ' + escHtml(MarkilModules.currency || 'تومان') + '</span>' : '');
        var image = m.image ? '<img src="' + escAttr(m.image) + '" alt="' + escAttr(m.title) + '">' : '<span>' + iconHtml(icons, 'placeholder', '📦') + '</span>';
        var dots = modules.slice(0, Math.min(modules.length, 6)).map(function(_, i) { return '<span class="markil-idle-dot ' + (i === (state.idleIndex % modules.length) ? 'active' : '') + '"></span>'; }).join('');
        $panel.find('.markil-panel-inner').html(
            '<div class="markil-idle-slide">' +
                '<div class="markil-idle-image" style="background:' + escAttr(m.icon_bg || '#e6f9f6') + ';color:' + escAttr(m.icon_color || '#011627') + '">' + image + '</div>' +
                '<h2 class="markil-panel-title">' + escHtml(m.title) + '</h2>' +
                (m.excerpt ? '<p class="markil-detail-excerpt">' + escHtml(m.excerpt) + '</p>' : '') +
                '<div class="markil-detail-stats">' +
                    (m.rating ? '<span class="markil-stat"><span class="markil-star">' + iconHtml(icons, 'rating', '★') + '</span> ' + escHtml(m.rating) + '</span>' : '') +
                    (m.installs ? '<span class="markil-stat">' + iconHtml(icons, 'installs', '👥') + ' +' + formatNumber(m.installs) + ' نصب</span>' : '') +
                '</div>' +
                '<div class="markil-idle-price">' + price + '</div>' +
                '<button type="button" class="markil-btn-primary markil-idle-open" data-id="' + escAttr(m.id) + '">مشاهده جزئیات</button>' +
                '<div class="markil-idle-dots">' + dots + '</div>' +
            '</div>'
        );
    }

    function toggleWishlist($btn, id) {
        $.ajax({
            url: MarkilModules.ajax_url,
            type: 'POST',
            data: { action: 'markil_toggle_wishlist', nonce: MarkilModules.nonce, module_id: id },
            success: function(res) {
                if (!res || !res.success) { if (res && res.data) alert(res.data); return; }
                var onIcon = $btn.attr('data-icon-on') || '♥';
                var offIcon = $btn.attr('data-icon-off') || '♡';
                $btn.toggleClass('active', !!res.data.added).find('.markil-heart-icon').html(res.data.added ? onIcon : offIcon);
                if (typeof res.data.count !== 'undefined') {
                    $btn.find('.markil-wishlist-number').text(formatNumber(res.data.count));
                    $btn.closest('.markil-module-card').find('.markil-favorites-count').html('<span class="markil-heart-mini">' + onIcon + '</span> ' + formatNumber(res.data.count));
                }
            }
        });
    }

    function submitReview($form, moduleId, rating, comment) {
        var $btn = $form.find('.markil-submit-review');
        $btn.prop('disabled', true);
        $.ajax({
            url: MarkilModules.ajax_url,
            type: 'POST',
            data: { action: 'markil_submit_review', nonce: MarkilModules.nonce, module_id: moduleId, rating: rating, comment: comment },
            success: function(res) {
                $btn.prop('disabled', false);
                if (res && res.success) $form.html('<p class="markil-review-success">✅ ' + escHtml(res.data.message) + '</p>');
                else alert((res && res.data) || 'خطایی رخ داد');
            },
            error: function() { $btn.prop('disabled', false); }
        });
    }

    function isMobilePanel() {
        return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
    }

    function formatNumber(n) {
        var num = parseInt(n, 10);
        if (isNaN(num)) return escHtml(n);
        return num.toLocaleString('fa-IR');
    }

    function safeTag(tag) {
        tag = String(tag || '').toLowerCase();
        return ['h2','h3','h4','p','span'].indexOf(tag) >= 0 ? tag : 'h3';
    }

    function escHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
    function escAttr(str) { return escHtml(str); }

    function uniqueId($wrapper) {
        var id = $wrapper.data('markil-uid');
        if (!id) { id = Math.random().toString(36).slice(2); $wrapper.data('markil-uid', id); }
        return id;
    }

    // NOTE: The previous popup-modal full-detail system was removed in v2.6.
    // The "more details" button now navigates to the post's own permalink
    // (/markil-module/{slug}/) which renders a real WordPress page using
    // the plugin's single-markil_module.php template. This scrolls naturally
    // and works in any theme without z-index, focus-trap, or scroll issues.

    $(document).ready(function() {
        $('.markil-modules-wrapper').each(function() { initWrapper($(this)); });
    });

    $(window).on('elementor/frontend/init', function() {
        if (window.elementorFrontend) {
            elementorFrontend.hooks.addAction('frontend/element_ready/markil_modules_grid.default', function($scope) {
                $scope.find('.markil-modules-wrapper').each(function() { initWrapper($(this)); });
            });
        }
    });
})(jQuery);
