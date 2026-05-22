<?php
/**
 * Template: Full Detail Layout
 *
 * Used by:
 *   - Elementor widget \Markil\Widget\ModuleFullDetail
 *   - AJAX action markil_render_full_detail (modal overlay)
 *
 * Variables injected before include:
 *   $m        (array)  Module data returned by Ajax::format_module($id, true)
 *   $settings (array)  Display settings (see keys below)
 *   $currency (string) Currency label from plugin options
 *
 * Settings keys:
 *   show_breadcrumbs    'yes'|'no'
 *   show_sidebar        'yes'|'no'
 *   show_features_bar   'yes'|'no'
 *   show_sidebar_feats  'yes'|'no'
 *   show_detail_sections 'yes'|'no'
 *   show_guarantee      'yes'|'no'
 *   show_video          'yes'|'no'
 *   sidebar_position    'left'|'right'
 *   breadcrumb_home     string
 */
if ( ! defined( 'ABSPATH' ) ) exit;

// ── Display flags ──────────────────────────────────────────────────────────
$show_bc      = ( $settings['show_breadcrumbs']      ?? 'yes' ) === 'yes';
$show_sidebar = ( $settings['show_sidebar']           ?? 'yes' ) === 'yes';
$show_fb      = ( $settings['show_features_bar']      ?? 'yes' ) === 'yes';
$show_sf      = ( $settings['show_sidebar_feats']     ?? 'yes' ) === 'yes';
$show_secs    = ( $settings['show_detail_sections']   ?? 'yes' ) === 'yes';
$show_guar    = ( $settings['show_guarantee']         ?? 'yes' ) === 'yes';
$show_video   = ( $settings['show_video']             ?? 'yes' ) === 'yes';
$sidebar_pos  = $settings['sidebar_position'] ?? 'left';

// ── Module data shortcuts ──────────────────────────────────────────────────
$tabs         = $m['tabs']            ?? [];
$bc_home      = $settings['breadcrumb_home'] ?? __( 'خانه', 'markil-modules' );
$gallery      = $m['gallery_images']  ?? [];
$video_url    = $m['video_url']       ?? '';
$video_embed  = $m['video_embed']     ?? '';
$video_member = ! empty( $m['video_membership'] );
$has_video    = $show_video && ( ! empty( $video_url ) || ! empty( $video_embed ) );

// ── Button logic (uses pre-fetched $m data — no extra DB calls) ───────────
$btn1_action = $m['btn_primary_action']   ?? 'wc_add';
$btn2_action = $m['btn_secondary_action'] ?? 'detail_page';
$wc_id       = intval( $m['wc_product_id'] ?? 0 );
$detail_url  = ! empty( $m['detail_page'] ) ? $m['detail_page'] : get_permalink( $m['id'] );

$btn1_href = '#';
if     ( $btn1_action === 'wc_add'    && $wc_id )  $btn1_href = '?add-to-cart=' . $wc_id;
elseif ( $btn1_action === 'wc_page'   && $wc_id )  $btn1_href = get_permalink( $wc_id );
elseif ( $btn1_action === 'detail_page' )           $btn1_href = $detail_url;
elseif ( $btn1_action === 'custom_url' )            $btn1_href = ! empty( $m['primary_custom_url'] ) ? $m['primary_custom_url'] : $detail_url;

$btn2_href = '#';
if     ( $btn2_action === 'detail_page' )           $btn2_href = $detail_url;
elseif ( $btn2_action === 'wc_add'    && $wc_id )   $btn2_href = '?add-to-cart=' . $wc_id;
elseif ( $btn2_action === 'wc_page'   && $wc_id )   $btn2_href = get_permalink( $wc_id );
elseif ( $btn2_action === 'full_detail_modal' )      $btn2_href = '#';
elseif ( $btn2_action === 'custom_url' )             $btn2_href = ! empty( $m['secondary_custom_url'] ) ? $m['secondary_custom_url'] : $detail_url;

// ── Build video embed HTML ────────────────────────────────────────────────
$embed_html = '';
if ( $has_video ) {
    if ( ! empty( $video_embed ) ) {
        $embed_html = wp_kses_post( $video_embed );
    } elseif ( ! empty( $video_url ) ) {
        if ( preg_match( '/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_\-]{11})/', $video_url, $m_yt ) ) {
            $embed_html = '<iframe class="markil-fdc-video-iframe" src="https://www.youtube.com/embed/' . esc_attr( $m_yt[1] ) . '" frameborder="0" allowfullscreen loading="lazy"></iframe>';
        } elseif ( preg_match( '/vimeo\.com\/(\d+)/', $video_url, $m_vm ) ) {
            $embed_html = '<iframe class="markil-fdc-video-iframe" src="https://player.vimeo.com/video/' . esc_attr( $m_vm[1] ) . '" frameborder="0" allowfullscreen loading="lazy"></iframe>';
        } else {
            $embed_html = '<video class="markil-fdc-video-native" controls><source src="' . esc_url( $video_url ) . '"></video>';
        }
    }
}

$layout_class = 'markil-fdc-layout markil-fdc-sidebar-' . esc_attr( $sidebar_pos );
$uniq         = 'mgal-' . intval( $m['id'] );
?>
<div class="markil-full-detail-wrap" dir="rtl">

    <?php if ( $show_bc ) : ?>
    <nav class="markil-fdc-breadcrumb" aria-label="<?php esc_attr_e('مسیر','markil-modules'); ?>">
        <a href="<?php echo esc_url( home_url() ); ?>"><?php echo esc_html( $bc_home ); ?></a>
        <span class="markil-fdc-bc-sep" aria-hidden="true">/</span>
        <?php
        $cats = $m['categories'] ?? [];
        if ( ! empty( $cats ) ) :
            $cat      = is_object( $cats[0] ) ? $cats[0] : (object) $cats[0];
            $cat_link = get_term_link( (int) $cat->term_id, 'markil_category' );
        ?>
        <a href="<?php echo esc_url( is_wp_error( $cat_link ) ? '#' : $cat_link ); ?>"><?php echo esc_html( $cat->name ); ?></a>
        <span class="markil-fdc-bc-sep" aria-hidden="true">/</span>
        <?php endif; ?>
        <span aria-current="page"><?php echo esc_html( $m['title'] ); ?></span>
    </nav>
    <?php endif; ?>

    <div class="<?php echo esc_attr( $layout_class ); ?>">

        <!-- ==================== MAIN CONTENT ==================== -->
        <div class="markil-fdc-main">

            <h1 class="markil-fdc-title"><?php echo esc_html( $m['title'] ); ?></h1>
            <?php if ( ! empty( $m['excerpt'] ) ) : ?>
            <p class="markil-fdc-excerpt"><?php echo esc_html( $m['excerpt'] ); ?></p>
            <?php endif; ?>

            <!-- Features Bar (top badges) -->
            <?php if ( $show_fb && ! empty( $m['features_bar'] ) ) : ?>
            <div class="markil-fdc-features-bar">
                <?php foreach ( $m['features_bar'] as $fb ) :
                    if ( empty( $fb['label'] ) ) continue; ?>
                <span class="markil-fdc-fb-item">
                    <?php if ( ! empty( $fb['icon'] ) ) : ?><i class="<?php echo esc_attr( $fb['icon'] ); ?>"></i><?php endif; ?>
                    <?php echo esc_html( $fb['label'] ); ?>
                </span>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>

            <!-- Video Section -->
            <?php if ( $has_video && ! empty( $embed_html ) ) : ?>
            <div class="markil-fdc-video-wrap<?php echo $video_member ? ' markil-members-only' : ''; ?>"<?php if ($video_member) echo ' data-membership="1"'; ?>>
                <div class="markil-fdc-video-inner">
                    <?php echo $embed_html; ?>
                </div>
            </div>
            <?php endif; ?>

            <!-- Content Tabs -->
            <?php if ( ! empty( $tabs ) ) :
                $detail_sections = $m['detail_sections'] ?? [];
            ?>
            <div class="markil-fdc-tabs">
                <div class="markil-fdc-tabs-nav">
                    <?php foreach ( $tabs as $ti => $tab ) : ?>
                    <button type="button" class="markil-fdc-tab-btn <?php echo $ti === 0 ? 'active' : ''; ?>"
                            data-tab="fdc-<?php echo esc_attr( $ti ); ?>">
                        <?php echo esc_html( $tab['label'] ); ?>
                    </button>
                    <?php endforeach; ?>
                </div>

                <div class="markil-fdc-tabs-content">
                <?php foreach ( $tabs as $ti => $tab ) :
                    // Sections for this tab (tab_index '' = all tabs)
                    $tab_sections = [];
                    if ( $show_secs ) {
                        foreach ( $detail_sections as $sec ) {
                            $sec_tab = (string) ( $sec['tab_index'] ?? '' );
                            if ( $sec_tab === '' || $sec_tab === (string) $ti ) {
                                $tab_sections[] = $sec;
                            }
                        }
                    }
                ?>
                <div class="markil-fdc-tab-panel <?php echo $ti === 0 ? 'active' : ''; ?>"
                     data-tab="fdc-<?php echo esc_attr( $ti ); ?>">

                    <?php
                    // Full page uses the FULL content; falls back to summary if empty.
                    $tab_full = ! empty( $tab['content'] ) ? $tab['content'] : ( $tab['summary'] ?? '' );
                    if ( ! empty( trim( wp_strip_all_tags( $tab_full ) ) ) ) :
                    ?>
                    <div class="markil-fdc-tab-body markil-tab-body">
                        <?php echo $tab_full; ?>
                    </div>
                    <?php endif; ?>

                    <?php if ( ! empty( $tab_sections ) ) : ?>
                    <div class="markil-fdc-sections">
                        <?php foreach ( $tab_sections as $sec ) :
                            if ( empty( $sec['title'] ) && empty( $sec['items'] ) ) continue;
                            $items    = $sec['items'] ?? [];
                            $grid_cls = count( $items ) > 3 ? 'markil-fdc-items-grid' : 'markil-fdc-items-cards';
                        ?>
                        <div class="markil-fdc-section">
                            <?php if ( ! empty( $sec['title'] ) ) : ?>
                            <h3 class="markil-fdc-sec-title">
                                <?php if ( ! empty( $sec['icon'] ) ) : ?>
                                <span class="markil-fdc-sec-icon"><i class="<?php echo esc_attr( $sec['icon'] ); ?>"></i></span>
                                <?php endif; ?>
                                <?php echo esc_html( $sec['title'] ); ?>
                            </h3>
                            <?php endif; ?>
                            <?php if ( ! empty( $items ) ) : ?>
                            <div class="markil-fdc-items <?php echo esc_attr( $grid_cls ); ?>">
                                <?php foreach ( $items as $item ) :
                                    if ( empty( $item['title'] ) ) continue; ?>
                                <div class="markil-fdc-item">
                                    <?php if ( ! empty( $item['icon'] ) ) : ?>
                                    <span class="markil-fdc-item-icon"><i class="<?php echo esc_attr( $item['icon'] ); ?>"></i></span>
                                    <?php endif; ?>
                                    <div class="markil-fdc-item-text">
                                        <strong><?php echo esc_html( $item['title'] ); ?></strong>
                                        <?php if ( ! empty( $item['desc'] ) ) : ?>
                                        <p><?php echo esc_html( $item['desc'] ); ?></p>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                            <?php endif; ?>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>

                </div>
                <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

        </div><!-- /markil-fdc-main -->

        <!-- ==================== SIDEBAR ==================== -->
        <?php if ( $show_sidebar ) : ?>
        <div class="markil-fdc-sidebar">
            <div class="markil-fdc-sidebar-card">

                <!-- Gallery Slider -->
                <?php
                // Build gallery: use gallery_images array, fall back to featured image
                if ( empty( $gallery ) ) {
                    $fallback_url = ! empty( $m['image_full'] ) ? $m['image_full'] : $m['image'];
                    if ( $fallback_url ) {
                        $gallery = [ [ 'url' => $fallback_url, 'thumb' => $m['image'] ?: $fallback_url ] ];
                    }
                }
                if ( ! empty( $gallery ) ) :
                    $gcount = count( $gallery );
                ?>
                <div class="markil-fdc-gallery<?php echo $gcount > 1 ? ' markil-fdc-gallery--slider' : ''; ?>" id="<?php echo esc_attr( $uniq ); ?>">
                    <div class="markil-fdc-gallery-track">
                        <?php foreach ( $gallery as $gi => $gimg ) : ?>
                        <div class="markil-fdc-gallery-slide<?php echo $gi === 0 ? ' active' : ''; ?>">
                            <img src="<?php echo esc_url( $gimg['url'] ); ?>"
                                 alt="<?php echo esc_attr( $m['title'] ); ?>"
                                 loading="<?php echo $gi === 0 ? 'eager' : 'lazy'; ?>">
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php if ( $gcount > 1 ) : ?>
                    <button type="button" class="markil-fdc-gallery-btn markil-fdc-gallery-prev" aria-label="<?php esc_attr_e('قبلی','markil-modules'); ?>">&#8250;</button>
                    <button type="button" class="markil-fdc-gallery-btn markil-fdc-gallery-next" aria-label="<?php esc_attr_e('بعدی','markil-modules'); ?>">&#8249;</button>
                    <div class="markil-fdc-gallery-dots">
                        <?php for ( $gi = 0; $gi < $gcount; $gi++ ) : ?>
                        <button type="button" class="markil-fdc-gallery-dot<?php echo $gi === 0 ? ' active' : ''; ?>"
                                data-index="<?php echo $gi; ?>"
                                aria-label="<?php echo esc_attr( sprintf( __('تصویر %d','markil-modules'), $gi + 1 ) ); ?>"></button>
                        <?php endfor; ?>
                    </div>
                    <?php endif; ?>
                </div>
                <?php else : ?>
                <div class="markil-fdc-img-placeholder" style="background:<?php echo esc_attr( $m['icon_bg'] ?? '#e6f9f6' ); ?>;color:<?php echo esc_attr( $m['icon_color'] ?? '#011627' ); ?>">
                    <span>📦</span>
                </div>
                <?php endif; ?>

                <!-- Title + Excerpt in Sidebar -->
                <h2 class="markil-fdc-sb-title"><?php echo esc_html( $m['title'] ); ?></h2>
                <?php if ( ! empty( $m['excerpt'] ) ) : ?>
                <p class="markil-fdc-sb-excerpt"><?php echo esc_html( $m['excerpt'] ); ?></p>
                <?php endif; ?>

                <!-- Sidebar Features (icon grid) -->
                <?php if ( $show_sf && ! empty( $m['sidebar_features'] ) ) : ?>
                <p class="markil-fdc-sb-by"><?php _e( 'توسط متخصصان ما', 'markil-modules' ); ?></p>
                <div class="markil-fdc-sb-features">
                    <?php foreach ( $m['sidebar_features'] as $sf ) :
                        if ( empty( $sf['label'] ) ) continue; ?>
                    <div class="markil-fdc-sf-item">
                        <?php if ( ! empty( $sf['icon'] ) ) : ?>
                        <span class="markil-fdc-sf-icon"><i class="<?php echo esc_attr( $sf['icon'] ); ?>"></i></span>
                        <?php endif; ?>
                        <span class="markil-fdc-sf-label"><?php echo esc_html( $sf['label'] ); ?></span>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>

                <!-- Price -->
                <div class="markil-fdc-price-wrap">
                    <?php if ( $m['is_free'] ) : ?>
                    <div class="markil-fdc-price free"><?php _e( 'رایگان', 'markil-modules' ); ?></div>
                    <?php elseif ( ! empty( $m['price'] ) ) : ?>
                    <div class="markil-fdc-price">
                        <?php if ( ! empty( $m['old_price'] ) ) : ?>
                        <span class="markil-fdc-old-price"><?php echo number_format( (int) $m['old_price'] ); ?></span>
                        <?php endif; ?>
                        <?php echo number_format( (int) $m['price'] ); ?>
                        <span class="markil-fdc-currency"><?php echo esc_html( $currency ); ?></span>
                    </div>
                    <?php endif; ?>
                </div>

                <!-- Action Buttons -->
                <div class="markil-fdc-actions">
                    <?php
                    $btn1_text = ! empty( $m['btn_primary_text'] ) ? $m['btn_primary_text'] : __( 'افزودن به سبد خرید', 'markil-modules' );
                    $btn2_text = ! empty( $m['btn_secondary_text'] ) ? $m['btn_secondary_text'] : __( 'جزئیات بیشتر', 'markil-modules' );
                    ?>
                    <?php if ( $btn1_href !== '#' || $btn1_action === 'custom_url' ) : ?>
                    <a href="<?php echo esc_url( $btn1_href ); ?>" class="markil-fdc-btn-primary">
                        <?php if ( $btn1_action === 'wc_add' ) : ?><span aria-hidden="true">🛒</span><?php endif; ?>
                        <?php echo esc_html( $btn1_text ); ?>
                    </a>
                    <?php else : ?>
                    <a href="<?php echo esc_url( get_permalink( $m['id'] ) ); ?>" class="markil-fdc-btn-primary">
                        <?php echo esc_html( $btn1_text ); ?>
                    </a>
                    <?php endif; ?>

                    <?php if ( $btn2_action === 'full_detail_modal' ) : // Modal trigger is already open — skip this button in full-detail page ?>
                    <?php elseif ( $btn2_href !== '#' ) : ?>
                    <a href="<?php echo esc_url( $btn2_href ); ?>" class="markil-fdc-btn-secondary">
                        <?php echo esc_html( $btn2_text ); ?>
                    </a>
                    <?php endif; ?>
                </div>

                <!-- Stats Table -->
                <div class="markil-fdc-stats">
                    <?php if ( floatval( $m['rating'] ) > 0 ) : ?>
                    <div class="markil-fdc-stat-row">
                        <span class="markil-fdc-stat-label">⭐ <?php _e( 'امتیاز کاربران', 'markil-modules' ); ?></span>
                        <span class="markil-fdc-stat-value"><?php echo esc_html( $m['rating'] ); ?></span>
                    </div>
                    <?php endif; ?>
                    <?php if ( intval( $m['installs'] ) > 0 ) : ?>
                    <div class="markil-fdc-stat-row">
                        <span class="markil-fdc-stat-label">📦 <?php _e( 'تعداد سفارشات', 'markil-modules' ); ?></span>
                        <span class="markil-fdc-stat-value"><?php echo number_format( (int) $m['installs'] ); ?>+</span>
                    </div>
                    <?php endif; ?>
                    <?php if ( ! empty( $m['delivery_time'] ) ) : ?>
                    <div class="markil-fdc-stat-row">
                        <span class="markil-fdc-stat-label">🕐 <?php _e( 'زمان تحویل', 'markil-modules' ); ?></span>
                        <span class="markil-fdc-stat-value"><?php echo esc_html( $m['delivery_time'] ); ?></span>
                    </div>
                    <?php endif; ?>
                    <?php if ( ! empty( $m['badge'] ) ) : ?>
                    <div class="markil-fdc-stat-row">
                        <span class="markil-fdc-stat-label">🏷️ <?php _e( 'وضعیت', 'markil-modules' ); ?></span>
                        <span class="markil-fdc-stat-value markil-fdc-badge-val"><?php echo esc_html( $m['badge'] ); ?></span>
                    </div>
                    <?php endif; ?>
                    <?php
                    $post_obj = get_post( $m['id'] );
                    if ( $post_obj ) :
                        $modified = get_post_modified_time( 'Y/m/d', false, $post_obj );
                    ?>
                    <div class="markil-fdc-stat-row">
                        <span class="markil-fdc-stat-label">🔄 <?php _e( 'آخرین بروزرسانی', 'markil-modules' ); ?></span>
                        <span class="markil-fdc-stat-value"><?php echo esc_html( $modified ); ?></span>
                    </div>
                    <?php endif; ?>
                    <div class="markil-fdc-stat-row">
                        <span class="markil-fdc-stat-label">🔖 <?php _e( 'نسخه', 'markil-modules' ); ?></span>
                        <span class="markil-fdc-stat-value">v<?php echo esc_html( $m['version'] ); ?></span>
                    </div>
                </div>

                <!-- Quality Guarantee Banner -->
                <?php if ( $show_guar ) : ?>
                <div class="markil-fdc-guarantee">
                    <span class="markil-fdc-guar-icon" aria-hidden="true">🛡️</span>
                    <div class="markil-fdc-guar-text">
                        <strong><?php _e( 'ضمانت کیفیت خدمات', 'markil-modules' ); ?></strong>
                        <p><?php _e( 'ما کیفیت کار خود را تضمین می‌کنیم. در صورت نارضایتی، پشتیبانی تا رضایت شما ادامه دارد.', 'markil-modules' ); ?></p>
                    </div>
                </div>
                <?php endif; ?>

            </div><!-- /markil-fdc-sidebar-card -->
        </div><!-- /markil-fdc-sidebar -->
        <?php endif; ?>

    </div><!-- /markil-fdc-layout -->

</div><!-- /markil-full-detail-wrap -->

<script>
(function(){
    // Tab switching
    document.querySelectorAll('.markil-fdc-tabs').forEach(function(wrap){
        wrap.querySelectorAll('.markil-fdc-tab-btn').forEach(function(btn){
            btn.addEventListener('click', function(){
                var tab = this.dataset.tab;
                wrap.querySelectorAll('.markil-fdc-tab-btn').forEach(function(b){ b.classList.remove('active'); });
                wrap.querySelectorAll('.markil-fdc-tab-panel').forEach(function(p){ p.classList.remove('active'); });
                this.classList.add('active');
                var panel = wrap.querySelector('.markil-fdc-tab-panel[data-tab="' + tab + '"]');
                if (panel) panel.classList.add('active');
            });
        });
    });

    // Gallery slider
    document.querySelectorAll('.markil-fdc-gallery--slider').forEach(function(gallery){
        var slides = gallery.querySelectorAll('.markil-fdc-gallery-slide');
        var dots   = gallery.querySelectorAll('.markil-fdc-gallery-dot');
        if (slides.length <= 1) return;
        var cur = 0;
        function goTo(idx){
            slides[cur].classList.remove('active');
            if (dots[cur]) dots[cur].classList.remove('active');
            cur = ((idx % slides.length) + slides.length) % slides.length;
            slides[cur].classList.add('active');
            if (dots[cur]) dots[cur].classList.add('active');
        }
        var prev = gallery.querySelector('.markil-fdc-gallery-prev');
        var next = gallery.querySelector('.markil-fdc-gallery-next');
        if (prev) prev.addEventListener('click', function(){ goTo(cur - 1); });
        if (next) next.addEventListener('click', function(){ goTo(cur + 1); });
        dots.forEach(function(dot, i){ dot.addEventListener('click', function(){ goTo(i); }); });

        // Touch/swipe support
        var startX = 0;
        gallery.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; }, {passive:true});
        gallery.addEventListener('touchend', function(e){
            var diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 40) goTo(diff < 0 ? cur + 1 : cur - 1);
        }, {passive:true});
    });
})();
</script>
