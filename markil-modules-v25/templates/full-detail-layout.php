<?php
/**
 * Template: Full Detail Layout
 * Used by: Elementor widget ModuleFullDetail + AJAX modal render
 * Variables: $m (module data array), $settings (display settings array), $currency (string)
 */
if ( ! defined( 'ABSPATH' ) ) exit;

$show_bc      = ( $settings['show_breadcrumbs']     ?? 'yes' ) === 'yes';
$show_sidebar = ( $settings['show_sidebar']          ?? 'yes' ) === 'yes';
$show_fb      = ( $settings['show_features_bar']     ?? 'yes' ) === 'yes';
$show_sf      = ( $settings['show_sidebar_feats']    ?? 'yes' ) === 'yes';
$show_secs    = ( $settings['show_detail_sections']  ?? 'yes' ) === 'yes';
$show_guar    = ( $settings['show_guarantee']        ?? 'yes' ) === 'yes';
$sidebar_pos  = $settings['sidebar_position']        ?? 'left';

$tabs    = $m['tabs'] ?? [];
$bc_home = $settings['breadcrumb_home'] ?? __( 'خانه', 'markil-modules' );

$btn1_action  = get_post_meta( $m['id'], '_markil_btn_primary_action', true ) ?: 'wc_add';
$btn2_action  = get_post_meta( $m['id'], '_markil_btn_secondary_action', true ) ?: 'detail_page';
$wc_id        = $m['wc_product_id'];
$detail_url   = $m['detail_page'] ?: get_permalink( $m['id'] );

$btn1_href = '#';
if ( $btn1_action === 'wc_add' && $wc_id )     $btn1_href = '?add-to-cart=' . $wc_id;
elseif ( $btn1_action === 'wc_page' && $wc_id ) $btn1_href = get_permalink( $wc_id );
elseif ( $btn1_action === 'detail_page' )        $btn1_href = $detail_url;

$btn2_href = '#';
if ( $btn2_action === 'detail_page' )            $btn2_href = $detail_url;
elseif ( $btn2_action === 'wc_add' && $wc_id )   $btn2_href = '?add-to-cart=' . $wc_id;
elseif ( $btn2_action === 'wc_page' && $wc_id )  $btn2_href = get_permalink( $wc_id );
elseif ( $btn2_action === 'full_detail_modal' )   $btn2_href = '#';

$layout_class = 'markil-fdc-layout markil-fdc-sidebar-' . esc_attr( $sidebar_pos );
?>
<div class="markil-full-detail-wrap" dir="rtl">

    <?php if ( $show_bc ) : ?>
    <nav class="markil-fdc-breadcrumb">
        <a href="<?php echo esc_url( home_url() ); ?>"><?php echo esc_html( $bc_home ); ?></a>
        <span class="markil-fdc-bc-sep">/</span>
        <?php
        $cats = $m['categories'] ?? [];
        if ( ! empty( $cats ) ) :
            $cat = is_object( $cats[0] ) ? $cats[0] : (object) $cats[0];
            $cat_link = get_term_link( (int) $cat->term_id, 'markil_category' );
        ?>
        <a href="<?php echo esc_url( is_wp_error( $cat_link ) ? '#' : $cat_link ); ?>"><?php echo esc_html( $cat->name ); ?></a>
        <span class="markil-fdc-bc-sep">/</span>
        <?php endif; ?>
        <span><?php echo esc_html( $m['title'] ); ?></span>
    </nav>
    <?php endif; ?>

    <div class="<?php echo $layout_class; ?>">

        <!-- ==================== MAIN CONTENT ==================== -->
        <div class="markil-fdc-main">

            <!-- Title + Excerpt -->
            <h1 class="markil-fdc-title"><?php echo esc_html( $m['title'] ); ?></h1>
            <?php if ( ! empty( $m['excerpt'] ) ) : ?>
            <p class="markil-fdc-excerpt"><?php echo esc_html( $m['excerpt'] ); ?></p>
            <?php endif; ?>

            <!-- Features Bar -->
            <?php if ( $show_fb && ! empty( $m['features_bar'] ) ) : ?>
            <div class="markil-fdc-features-bar">
                <?php foreach ( $m['features_bar'] as $fb ) :
                    if ( empty( $fb['label'] ) ) continue;
                ?>
                <span class="markil-fdc-fb-item">
                    <?php if ( ! empty( $fb['icon'] ) ) : ?>
                    <i class="<?php echo esc_attr( $fb['icon'] ); ?>"></i>
                    <?php endif; ?>
                    <?php echo esc_html( $fb['label'] ); ?>
                </span>
                <?php endforeach; ?>
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
                    // Collect sections for this tab index (or 'all')
                    $tab_sections = [];
                    if ( $show_secs ) {
                        foreach ( $detail_sections as $sec ) {
                            $sec_tab = $sec['tab_index'] ?? '';
                            if ( $sec_tab === '' || (string) $sec_tab === (string) $ti ) {
                                $tab_sections[] = $sec;
                            }
                        }
                    }
                ?>
                <div class="markil-fdc-tab-panel <?php echo $ti === 0 ? 'active' : ''; ?>"
                     data-tab="fdc-<?php echo esc_attr( $ti ); ?>">

                    <?php if ( ! empty( trim( wp_strip_all_tags( $tab['content'] ) ) ) ) : ?>
                    <div class="markil-fdc-tab-body markil-tab-body">
                        <?php echo $tab['content']; ?>
                    </div>
                    <?php endif; ?>

                    <?php if ( ! empty( $tab_sections ) ) : ?>
                    <div class="markil-fdc-sections">
                        <?php foreach ( $tab_sections as $sec ) :
                            if ( empty( $sec['title'] ) && empty( $sec['items'] ) ) continue;
                            $items     = $sec['items'] ?? [];
                            $item_cnt  = count( $items );
                            $grid_cls  = $item_cnt > 3 ? 'markil-fdc-items-grid' : 'markil-fdc-items-cards';
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
                            <div class="markil-fdc-items <?php echo $grid_cls; ?>">
                                <?php foreach ( $items as $item ) :
                                    if ( empty( $item['title'] ) ) continue;
                                ?>
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

                <!-- Product Image -->
                <?php if ( ! empty( $m['image_full'] ) || ! empty( $m['image'] ) ) : ?>
                <div class="markil-fdc-img-wrap">
                    <img src="<?php echo esc_url( $m['image_full'] ?: $m['image'] ); ?>"
                         alt="<?php echo esc_attr( $m['title'] ); ?>"
                         class="markil-fdc-product-img">
                </div>
                <?php else : ?>
                <div class="markil-fdc-img-placeholder" style="background:<?php echo esc_attr( $m['icon_bg'] ); ?>;color:<?php echo esc_attr( $m['icon_color'] ); ?>">
                    <span>📦</span>
                </div>
                <?php endif; ?>

                <!-- Title + Excerpt in Sidebar -->
                <h2 class="markil-fdc-sb-title"><?php echo esc_html( $m['title'] ); ?></h2>
                <?php if ( ! empty( $m['excerpt'] ) ) : ?>
                <p class="markil-fdc-sb-excerpt"><?php echo esc_html( $m['excerpt'] ); ?></p>
                <?php endif; ?>

                <!-- Sidebar Features (small icons) -->
                <?php if ( $show_sf && ! empty( $m['sidebar_features'] ) ) : ?>
                <p class="markil-fdc-sb-by"><?php _e( 'توسط متخصصان ما', 'markil-modules' ); ?></p>
                <div class="markil-fdc-sb-features">
                    <?php foreach ( $m['sidebar_features'] as $sf ) :
                        if ( empty( $sf['label'] ) ) continue;
                    ?>
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
                    <?php if ( ! empty( $m['btn_primary_text'] ) && $btn1_href !== '#' ) : ?>
                    <a href="<?php echo esc_url( $btn1_href ); ?>" class="markil-fdc-btn-primary markil-btn-primary">
                        <?php if ( $btn1_action === 'wc_add' ) : ?><span>🛒</span><?php endif; ?>
                        <?php echo esc_html( $m['btn_primary_text'] ); ?>
                    </a>
                    <?php elseif ( ! empty( $m['btn_primary_text'] ) ) : ?>
                    <a href="<?php echo esc_url( get_permalink( $m['id'] ) ); ?>" class="markil-fdc-btn-primary markil-btn-primary">
                        <?php echo esc_html( $m['btn_primary_text'] ); ?>
                    </a>
                    <?php endif; ?>

                    <?php if ( ! empty( $m['btn_secondary_text'] ) && $btn2_action !== 'full_detail_modal' ) : ?>
                    <a href="<?php echo esc_url( $btn2_href ); ?>" class="markil-fdc-btn-secondary markil-btn-secondary">
                        <?php if ( $btn2_action === 'wc_page' || $btn2_action === 'wc_add' ) : ?><span>📞</span><?php endif; ?>
                        <?php echo esc_html( $m['btn_secondary_text'] ); ?>
                    </a>
                    <?php endif; ?>
                </div>

                <!-- Stats Table -->
                <div class="markil-fdc-stats">
                    <?php if ( $m['rating'] > 0 ) : ?>
                    <div class="markil-fdc-stat-row">
                        <span class="markil-fdc-stat-label"><span class="markil-star">⭐</span> <?php _e( 'امتیاز کاربران', 'markil-modules' ); ?></span>
                        <span class="markil-fdc-stat-value"><?php echo esc_html( $m['rating'] ); ?></span>
                    </div>
                    <?php endif; ?>

                    <?php if ( $m['installs'] > 0 ) : ?>
                    <div class="markil-fdc-stat-row">
                        <span class="markil-fdc-stat-label">📦 <?php _e( 'تعداد سفارشات', 'markil-modules' ); ?></span>
                        <span class="markil-fdc-stat-value"><?php echo number_format( $m['installs'] ); ?>+</span>
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
                    $post_mod = get_post( $m['id'] );
                    if ( $post_mod ) :
                        $modified = get_post_modified_time( 'Y/m/d', false, $post_mod );
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
                    <span class="markil-fdc-guar-icon">🛡️</span>
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
    document.querySelectorAll('.markil-fdc-tabs').forEach(function(tabsWrap){
        tabsWrap.querySelectorAll('.markil-fdc-tab-btn').forEach(function(btn){
            btn.addEventListener('click', function(){
                var tab = this.dataset.tab;
                tabsWrap.querySelectorAll('.markil-fdc-tab-btn').forEach(function(b){ b.classList.remove('active'); });
                tabsWrap.querySelectorAll('.markil-fdc-tab-panel').forEach(function(p){ p.classList.remove('active'); });
                this.classList.add('active');
                var panel = tabsWrap.querySelector('.markil-fdc-tab-panel[data-tab="' + tab + '"]');
                if (panel) panel.classList.add('active');
            });
        });
    });
})();
</script>
