<?php if(!defined('ABSPATH')) exit; ?>
<div class="markil-standalone-detail" dir="rtl">
    <?php if($settings['show_header']==='yes'): ?>
    <div class="markil-detail-header">
        <?php if($m['status']==='active'): ?>
        <span class="markil-status-badge active">● <?php _e('ماژول فعال','markil-modules'); ?></span>
        <?php elseif($m['status']==='coming_soon'): ?>
        <span class="markil-status-badge coming"><?php _e('به زودی','markil-modules'); ?></span>
        <?php endif; ?>

        <div class="markil-detail-hero">
            <?php if($m['image']): ?>
            <div class="markil-detail-icon" style="background:<?php echo esc_attr($m['icon_bg']); ?>;">
                <img src="<?php echo esc_url($m['image']); ?>" alt="<?php echo esc_attr($m['title']); ?>">
            </div>
            <?php else: ?>
            <div class="markil-detail-icon" style="background:<?php echo esc_attr($m['icon_bg']); ?>;color:<?php echo esc_attr($m['icon_color']); ?>;">
                <span style="font-size:32px">📦</span>
            </div>
            <?php endif; ?>
            <div class="markil-detail-hero-info">
                <h2 class="markil-detail-module-title"><?php echo esc_html($m['title']); ?></h2>
                <p class="markil-detail-excerpt"><?php echo esc_html($m['excerpt']); ?></p>
                <div class="markil-detail-stats">
                    <?php if($m['rating']): ?>
                    <span class="markil-stat"><span class="markil-star">⭐</span> <?php echo $m['rating']; ?> (<?php echo number_format($m['review_count']); ?>)</span>
                    <?php endif; ?>
                    <?php if($m['installs']): ?>
                    <span class="markil-stat">👥 +<?php echo number_format($m['installs']); ?> <?php _e('نصب','markil-modules'); ?></span>
                    <?php endif; ?>
                    <span class="markil-stat">📦 v<?php echo esc_html($m['version']); ?></span>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <?php if($settings['show_tabs']==='yes'): ?>
    <?php
    $detail_tabs = ! empty( $m['tabs'] ) && is_array( $m['tabs'] ) ? $m['tabs'] : [];
    if ( empty( $detail_tabs ) ) {
        $detail_tabs = [
            [ 'label' => $m['tab1_label'], 'content' => $m['tab_details'] ?: wpautop($m['excerpt']) ],
            [ 'label' => $m['tab2_label'], 'content' => $m['tab_features'] ],
            [ 'label' => $m['tab3_label'], 'content' => $m['tab_compatibility'] ?: '<p>'.esc_html__('اطلاعات سازگاری در دسترس نیست.','markil-modules').'</p>' ],
            [ 'label' => $m['tab4_label'].' ('.count($m['reviews']).')', 'content' => $m['tab_reviews_html'] ],
        ];
    }
    ?>
    <div class="markil-panel-tabs">
        <div class="markil-panel-tabs-nav">
            <?php foreach($detail_tabs as $i => $tab): ?>
                <button class="markil-panel-tab-btn <?php echo $i===0 ? 'active' : ''; ?>" data-tab="standalone-<?php echo esc_attr($i); ?>"><?php echo esc_html($tab['label']); ?></button>
            <?php endforeach; ?>
        </div>
        <div class="markil-panel-tabs-content">
            <?php foreach($detail_tabs as $i => $tab): ?>
                <div class="markil-panel-tab-content <?php echo $i===0 ? 'active' : ''; ?>" data-tab="standalone-<?php echo esc_attr($i); ?>">
                    <div class="markil-tab-body"><?php echo $tab['content']; ?></div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <?php if($settings['show_features']==='yes' && !empty($m['features_list'])): ?>
    <div class="markil-key-features">
        <h4><?php _e('ویژگی‌های کلیدی','markil-modules'); ?></h4>
        <ul>
            <?php foreach($m['features_list'] as $f): ?>
            <li><span class="markil-check">✅</span> <?php echo esc_html($f); ?></li>
            <?php endforeach; ?>
        </ul>
    </div>
    <?php endif; ?>

    <?php if($settings['show_buttons']==='yes'): ?>
    <div class="markil-panel-actions">
        <?php
        $btn1_text   = $m['btn_primary_text'];
        $btn2_text   = $m['btn_secondary_text'];
        $btn1_action = get_post_meta($m['id'],'_markil_btn_primary_action',true) ?: 'wc_add';
        $btn2_action = get_post_meta($m['id'],'_markil_btn_secondary_action',true) ?: 'detail_page';
        $wc_id       = $m['wc_product_id'];
        $detail_url  = $m['detail_page'] ?: get_permalink($m['id']);

        $btn1_href = '#';
        $btn1_attr = '';
        if($btn1_action==='wc_add' && $wc_id) {
            $btn1_href = '?add-to-cart='.$wc_id;
        } elseif($btn1_action==='wc_page' && $wc_id) {
            $btn1_href = get_permalink($wc_id);
        } elseif($btn1_action==='detail_page') {
            $btn1_href = $detail_url;
        }

        $btn2_href = '#';
        if($btn2_action==='detail_page') {
            $btn2_href = $detail_url;
        } elseif($btn2_action==='wc_add' && $wc_id) {
            $btn2_href = '?add-to-cart='.$wc_id;
        } elseif($btn2_action==='wc_page' && $wc_id) {
            $btn2_href = get_permalink($wc_id);
        }
        ?>
        <a href="<?php echo esc_url($btn1_href); ?>" class="markil-btn-primary"><?php echo esc_html($btn1_text); ?></a>
        <a href="<?php echo esc_url($btn2_href); ?>" class="markil-btn-secondary"><?php echo esc_html($btn2_text); ?></a>
    </div>
    <?php endif; ?>
</div>
<?php
// Tabs JS inline for standalone widget
?>
<script>
(function(){
    var wrap = document.currentScript ? document.currentScript.parentElement : document;
    wrap.querySelectorAll('.markil-panel-tab-btn').forEach(function(btn){
        btn.addEventListener('click',function(){
            var tab = this.dataset.tab;
            var parent = this.closest('.markil-panel-tabs');
            parent.querySelectorAll('.markil-panel-tab-btn').forEach(function(b){b.classList.remove('active');});
            parent.querySelectorAll('.markil-panel-tab-content').forEach(function(c){c.classList.remove('active');});
            this.classList.add('active');
            var content = parent.querySelector('.markil-panel-tab-content[data-tab="'+tab+'"]');
            if(content) content.classList.add('active');
        });
    });
})();
</script>
