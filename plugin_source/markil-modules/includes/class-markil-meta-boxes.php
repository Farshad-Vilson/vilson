<?php
namespace Markil;

if ( ! defined( 'ABSPATH' ) ) exit;

class MetaBoxes {
    public function __construct() {
        add_action( 'add_meta_boxes', [ $this, 'add_meta_boxes' ] );
        add_action( 'save_post_markil_module', [ $this, 'save_meta' ], 10, 2 );
    }

    public function add_meta_boxes() {
        add_meta_box( 'markil_module_pricing', __( '💰 قیمت‌گذاری', 'markil-modules' ), [ $this, 'pricing_box' ], 'markil_module', 'side', 'high' );
        add_meta_box( 'markil_module_stats', __( '📊 آمار و اطلاعات', 'markil-modules' ), [ $this, 'stats_box' ], 'markil_module', 'side', 'default' );
        add_meta_box( 'markil_module_wc', __( '🛒 یکپارچه‌سازی ووکامرس', 'markil-modules' ), [ $this, 'wc_box' ], 'markil_module', 'normal', 'high' );
        add_meta_box( 'markil_module_tabs', __( '📋 محتوای تب‌ها', 'markil-modules' ), [ $this, 'tabs_box' ], 'markil_module', 'normal', 'default' );
        add_meta_box( 'markil_module_appearance', __( '🎨 ظاهر و نمایش', 'markil-modules' ), [ $this, 'appearance_box' ], 'markil_module', 'normal', 'default' );
        add_meta_box( 'markil_module_features', __( '✅ ویژگی‌های کلیدی', 'markil-modules' ), [ $this, 'features_box' ], 'markil_module', 'normal', 'default' );
    }

    public function pricing_box( $post ) {
        wp_nonce_field( 'markil_save_meta', 'markil_meta_nonce' );
        $price     = get_post_meta( $post->ID, '_markil_price', true );
        $old_price = get_post_meta( $post->ID, '_markil_old_price', true );
        $is_free   = get_post_meta( $post->ID, '_markil_is_free', true );
        ?>
        <style>.markil-meta-field{margin-bottom:12px}.markil-meta-field label{display:block;font-weight:600;margin-bottom:4px;color:#1d2327}.markil-meta-field input,.markil-meta-field select,.markil-meta-field textarea{width:100%;padding:6px 8px;border:1px solid #8c8f94;border-radius:4px}</style>
        <div class="markil-meta-field">
            <label><input type="checkbox" name="_markil_is_free" value="1" <?php checked($is_free,'1'); ?>> <?php _e('رایگان است','markil-modules'); ?></label>
        </div>
        <div class="markil-meta-field">
            <label><?php _e('قیمت (تومان)','markil-modules'); ?></label>
            <input type="number" name="_markil_price" value="<?php echo esc_attr($price); ?>" min="0">
        </div>
        <div class="markil-meta-field">
            <label><?php _e('قیمت قبلی (برای نمایش خط‌خورده)','markil-modules'); ?></label>
            <input type="number" name="_markil_old_price" value="<?php echo esc_attr($old_price); ?>" min="0">
        </div>
        <?php
    }

    public function stats_box( $post ) {
        $installs = get_post_meta( $post->ID, '_markil_installs', true );
        $rating   = get_post_meta( $post->ID, '_markil_rating', true );
        $version  = get_post_meta( $post->ID, '_markil_version', true );
        $badge    = get_post_meta( $post->ID, '_markil_badge', true );
        $status   = get_post_meta( $post->ID, '_markil_status', true ) ?: 'active';
        ?>
        <div class="markil-meta-field">
            <label><?php _e('تعداد نصب‌ها','markil-modules'); ?></label>
            <input type="number" name="_markil_installs" value="<?php echo esc_attr($installs); ?>" min="0">
        </div>
        <div class="markil-meta-field">
            <label><?php _e('امتیاز (1-5)','markil-modules'); ?></label>
            <input type="number" name="_markil_rating" value="<?php echo esc_attr($rating); ?>" min="0" max="5" step="0.1">
        </div>
        <div class="markil-meta-field">
            <label><?php _e('نسخه','markil-modules'); ?></label>
            <input type="text" name="_markil_version" value="<?php echo esc_attr($version ?: '1.0.0'); ?>">
        </div>
        <div class="markil-meta-field">
            <label><?php _e('برچسب ویژه (مثال: جدید، پرفروش)','markil-modules'); ?></label>
            <input type="text" name="_markil_badge" value="<?php echo esc_attr($badge); ?>">
        </div>
        <div class="markil-meta-field">
            <label><?php _e('وضعیت','markil-modules'); ?></label>
            <select name="_markil_status">
                <option value="active" <?php selected($status,'active'); ?>><?php _e('فعال','markil-modules'); ?></option>
                <option value="inactive" <?php selected($status,'inactive'); ?>><?php _e('غیرفعال','markil-modules'); ?></option>
                <option value="coming_soon" <?php selected($status,'coming_soon'); ?>><?php _e('به زودی','markil-modules'); ?></option>
            </select>
        </div>
        <?php
    }

    public function wc_box( $post ) {
        $wc_product   = get_post_meta( $post->ID, '_markil_wc_product_id', true );
        $detail_page  = get_post_meta( $post->ID, '_markil_detail_page', true );
        $btn1_text    = get_post_meta( $post->ID, '_markil_btn_primary_text', true );
        $btn2_text    = get_post_meta( $post->ID, '_markil_btn_secondary_text', true );
        $btn1_action  = get_post_meta( $post->ID, '_markil_btn_primary_action', true ) ?: 'wc_add';
        $btn2_action  = get_post_meta( $post->ID, '_markil_btn_secondary_action', true ) ?: 'detail_page';
        ?>
        <table class="form-table">
        <tr>
            <th><label><?php _e('محصول ووکامرس (شناسه)','markil-modules'); ?></label></th>
            <td><input type="number" name="_markil_wc_product_id" value="<?php echo esc_attr($wc_product); ?>" class="regular-text">
            <p class="description"><?php _e('شناسه محصول ووکامرس را وارد کنید تا دکمه خرید به آن لینک شود','markil-modules'); ?></p></td>
        </tr>
        <tr>
            <th><label><?php _e('صفحه جزئیات (URL)','markil-modules'); ?></label></th>
            <td><input type="url" name="_markil_detail_page" value="<?php echo esc_attr($detail_page); ?>" class="regular-text">
            <p class="description"><?php _e('برای دکمه جزئیات بیشتر - اگر خالی باشد از صفحه خود ماژول استفاده می‌شود','markil-modules'); ?></p></td>
        </tr>
        <tr>
            <th><label><?php _e('متن دکمه اصلی','markil-modules'); ?></label></th>
            <td>
                <input type="text" name="_markil_btn_primary_text" value="<?php echo esc_attr($btn1_text ?: __('افزودن به سبد خرید','markil-modules')); ?>" class="regular-text">
                <select name="_markil_btn_primary_action">
                    <option value="wc_add" <?php selected($btn1_action,'wc_add'); ?>><?php _e('افزودن به سبد خرید ووکامرس','markil-modules'); ?></option>
                    <option value="wc_page" <?php selected($btn1_action,'wc_page'); ?>><?php _e('رفتن به صفحه محصول ووکامرس','markil-modules'); ?></option>
                    <option value="detail_page" <?php selected($btn1_action,'detail_page'); ?>><?php _e('رفتن به صفحه جزئیات','markil-modules'); ?></option>
                    <option value="custom_url" <?php selected($btn1_action,'custom_url'); ?>><?php _e('لینک دلخواه','markil-modules'); ?></option>
                </select>
            </td>
        </tr>
        <tr>
            <th><label><?php _e('متن دکمه ثانویه','markil-modules'); ?></label></th>
            <td>
                <input type="text" name="_markil_btn_secondary_text" value="<?php echo esc_attr($btn2_text ?: __('جزئیات بیشتر','markil-modules')); ?>" class="regular-text">
                <select name="_markil_btn_secondary_action">
                    <option value="detail_page" <?php selected($btn2_action,'detail_page'); ?>><?php _e('رفتن به صفحه جزئیات','markil-modules'); ?></option>
                    <option value="wc_add" <?php selected($btn2_action,'wc_add'); ?>><?php _e('افزودن به سبد خرید ووکامرس','markil-modules'); ?></option>
                    <option value="wc_page" <?php selected($btn2_action,'wc_page'); ?>><?php _e('رفتن به صفحه محصول ووکامرس','markil-modules'); ?></option>
                    <option value="custom_url" <?php selected($btn2_action,'custom_url'); ?>><?php _e('لینک دلخواه','markil-modules'); ?></option>
                </select>
            </td>
        </tr>
        </table>
        <?php
    }

    public function tabs_box( $post ) {
        $custom_tabs = get_post_meta( $post->ID, '_markil_custom_tabs', true );
        if ( ! is_array( $custom_tabs ) || empty( $custom_tabs ) ) {
            $custom_tabs = [
                [ 'label' => get_post_meta( $post->ID, '_markil_tab1_label', true ) ?: __( 'جزئیات', 'markil-modules' ), 'content' => get_post_meta( $post->ID, '_markil_tab_details', true ), 'enabled' => '1' ],
                [ 'label' => get_post_meta( $post->ID, '_markil_tab2_label', true ) ?: __( 'امکانات', 'markil-modules' ), 'content' => get_post_meta( $post->ID, '_markil_tab_features', true ), 'enabled' => '1' ],
                [ 'label' => get_post_meta( $post->ID, '_markil_tab3_label', true ) ?: __( 'سازگاری', 'markil-modules' ), 'content' => get_post_meta( $post->ID, '_markil_tab_compatibility', true ), 'enabled' => '1' ],
                [ 'label' => get_post_meta( $post->ID, '_markil_tab4_label', true ) ?: __( 'نقد و بررسی', 'markil-modules' ), 'content' => '[markil_reviews]', 'enabled' => '1' ],
            ];
        }
        ?>
        <style>
        .markil-tabs-builder{direction:rtl;background:#fff;border:1px solid #dcdcde;border-radius:12px;padding:14px}
        .markil-tab-builder-row{border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;margin-bottom:12px;overflow:hidden}
        .markil-tab-builder-head{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border-bottom:1px solid #e2e8f0;cursor:move}
        .markil-tab-builder-head strong{margin-left:auto;color:#1e293b}.markil-tab-builder-head input[type=text]{width:260px;max-width:100%;padding:7px 10px;border:1px solid #cbd5e1;border-radius:8px}.markil-tab-builder-body{padding:12px}.markil-tab-builder-body textarea{width:100%;min-height:130px;border:1px solid #cbd5e1;border-radius:10px;padding:10px;direction:rtl}.markil-tab-builder-actions{display:flex;gap:8px;align-items:center}.markil-remove-tab{color:#b91c1c!important;border-color:#fecaca!important}.markil-tab-help{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 12px;margin-bottom:12px;color:#334155}.markil-tab-shortcode{font-family:monospace;direction:ltr;display:inline-block;background:#fff;border:1px solid #cbd5e1;border-radius:6px;padding:2px 6px}
        </style>
        <div class="markil-tab-help">
            <?php _e('هر تب را می‌توانید حذف، غیرفعال یا اضافه کنید. نام دکمه تب و محتوای داخل آن کاملاً قابل ویرایش است. برای تب نظرات خودکار از کد ', 'markil-modules'); ?>
            <span class="markil-tab-shortcode">[markil_reviews]</span>
            <?php _e(' استفاده کنید. مثال: می‌توانید تب «مدت زمان اجرا» اضافه کنید و متن دلخواه بنویسید.', 'markil-modules'); ?>
        </div>
        <div class="markil-tabs-builder" id="markil-tabs-builder">
            <?php foreach ( $custom_tabs as $i => $tab ) :
                $label   = isset($tab['label']) ? $tab['label'] : '';
                $content = isset($tab['content']) ? $tab['content'] : '';
                $enabled = isset($tab['enabled']) ? $tab['enabled'] : '1';
            ?>
            <div class="markil-tab-builder-row">
                <div class="markil-tab-builder-head">
                    <strong><?php _e('تب', 'markil-modules'); ?></strong>
                    <input type="text" name="_markil_custom_tabs[<?php echo esc_attr($i); ?>][label]" value="<?php echo esc_attr($label); ?>" placeholder="<?php esc_attr_e('نام تب مثل جزئیات یا مدت زمان اجرا','markil-modules'); ?>">
                    <label><input type="checkbox" name="_markil_custom_tabs[<?php echo esc_attr($i); ?>][enabled]" value="1" <?php checked($enabled, '1'); ?>> <?php _e('فعال','markil-modules'); ?></label>
                    <button type="button" class="button markil-remove-tab"><?php _e('حذف','markil-modules'); ?></button>
                </div>
                <div class="markil-tab-builder-body">
                    <textarea name="_markil_custom_tabs[<?php echo esc_attr($i); ?>][content]" placeholder="<?php esc_attr_e('محتوای این تب را بنویسید. HTML ساده مجاز است.','markil-modules'); ?>"><?php echo esc_textarea($content); ?></textarea>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <p><button type="button" class="button button-primary" id="markil-add-custom-tab">+ <?php _e('افزودن تب جدید','markil-modules'); ?></button></p>
        <script>
        jQuery(function($){
            var index = $('#markil-tabs-builder .markil-tab-builder-row').length;
            $('#markil-add-custom-tab').on('click', function(){
                var row = '<div class="markil-tab-builder-row">'+
                    '<div class="markil-tab-builder-head"><strong><?php echo esc_js(__('تب','markil-modules')); ?></strong>'+
                    '<input type="text" name="_markil_custom_tabs['+index+'][label]" value="" placeholder="<?php echo esc_js(__('نام تب مثل مدت زمان اجرا','markil-modules')); ?>">'+
                    '<label><input type="checkbox" name="_markil_custom_tabs['+index+'][enabled]" value="1" checked> <?php echo esc_js(__('فعال','markil-modules')); ?></label>'+
                    '<button type="button" class="button markil-remove-tab"><?php echo esc_js(__('حذف','markil-modules')); ?></button></div>'+
                    '<div class="markil-tab-builder-body"><textarea name="_markil_custom_tabs['+index+'][content]" placeholder="<?php echo esc_js(__('محتوای این تب را بنویسید','markil-modules')); ?>"></textarea></div>'+
                    '</div>';
                $('#markil-tabs-builder').append(row); index++;
            });
            $(document).on('click','.markil-remove-tab',function(){ $(this).closest('.markil-tab-builder-row').remove(); });
        });
        </script>
        <?php
    }

    public function appearance_box( $post ) {
        $icon_color = get_post_meta( $post->ID, '_markil_icon_color', true ) ?: '#011627';
        $icon_bg    = get_post_meta( $post->ID, '_markil_icon_bg', true ) ?: '#e6f9f6';
        ?>
        <table class="form-table">
        <tr>
            <th><label><?php _e('رنگ آیکون','markil-modules'); ?></label></th>
            <td><input type="color" name="_markil_icon_color" value="<?php echo esc_attr($icon_color); ?>"></td>
        </tr>
        <tr>
            <th><label><?php _e('رنگ پس‌زمینه آیکون','markil-modules'); ?></label></th>
            <td><input type="color" name="_markil_icon_bg" value="<?php echo esc_attr($icon_bg); ?>"></td>
        </tr>
        </table>
        <?php
    }

    public function features_box( $post ) {
        $features = get_post_meta( $post->ID, '_markil_features_list', true );
        if ( ! is_array( $features ) ) $features = [];
        if ( empty( $features ) ) $features = [ '' ];
        ?>
        <p class="description"><?php _e('ویژگی‌های کلیدی که در پنل سمت چپ (جزئیات) نمایش داده می‌شوند:','markil-modules'); ?></p>
        <div id="markil-features-list">
            <?php foreach ( $features as $i => $feature ) : ?>
            <div class="markil-feature-row" style="display:flex;gap:8px;margin-bottom:8px;">
                <input type="text" name="_markil_features_list[]" value="<?php echo esc_attr($feature); ?>" style="flex:1;padding:6px 8px;border:1px solid #8c8f94;border-radius:4px" placeholder="<?php _e('یک ویژگی را وارد کنید...','markil-modules'); ?>">
                <button type="button" class="button markil-remove-feature" title="<?php _e('حذف','markil-modules'); ?>">✕</button>
            </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="button" id="markil-add-feature">+ <?php _e('افزودن ویژگی','markil-modules'); ?></button>
        <script>
        jQuery(function($){
            $('#markil-add-feature').on('click',function(){
                $('#markil-features-list').append('<div class="markil-feature-row" style="display:flex;gap:8px;margin-bottom:8px;"><input type="text" name="_markil_features_list[]" style="flex:1;padding:6px 8px;border:1px solid #8c8f94;border-radius:4px" placeholder="<?php _e('یک ویژگی را وارد کنید...','markil-modules'); ?>"><button type="button" class="button markil-remove-feature">✕</button></div>');
            });
            $(document).on('click','.markil-remove-feature',function(){
                $(this).closest('.markil-feature-row').remove();
            });
        });
        </script>
        <?php
    }

    public function save_meta( $post_id, $post ) {
        if ( ! isset( $_POST['markil_meta_nonce'] ) ) return;
        if ( ! wp_verify_nonce( $_POST['markil_meta_nonce'], 'markil_save_meta' ) ) return;
        if ( defined('DOING_AUTOSAVE') && DOING_AUTOSAVE ) return;
        if ( ! current_user_can( 'edit_post', $post_id ) ) return;

        $text_fields = [
            '_markil_price', '_markil_old_price', '_markil_version', '_markil_badge',
            '_markil_status', '_markil_icon_color', '_markil_icon_bg',
            '_markil_tab1_label', '_markil_tab2_label', '_markil_tab3_label', '_markil_tab4_label',
            '_markil_btn_primary_text', '_markil_btn_secondary_text',
            '_markil_btn_primary_action', '_markil_btn_secondary_action',
            '_markil_wc_product_id', '_markil_detail_page', '_markil_installs', '_markil_rating',
        ];

        foreach ( $text_fields as $field ) {
            if ( isset( $_POST[ $field ] ) ) {
                update_post_meta( $post_id, $field, sanitize_text_field( $_POST[ $field ] ) );
            }
        }

        // Checkbox
        update_post_meta( $post_id, '_markil_is_free', isset($_POST['_markil_is_free']) ? '1' : '0' );

        // WP Editor fields (allow HTML)
        $editor_fields = ['_markil_tab_details','_markil_tab_features','_markil_tab_compatibility'];
        foreach ( $editor_fields as $field ) {
            if ( isset( $_POST[ $field ] ) ) {
                update_post_meta( $post_id, $field, wp_kses_post( wp_unslash( $_POST[ $field ] ) ) );
            }
        }

        // Features list
        if ( isset( $_POST['_markil_features_list'] ) && is_array( $_POST['_markil_features_list'] ) ) {
            $features = array_map( 'sanitize_text_field', $_POST['_markil_features_list'] );
            $features = array_filter( $features );
            update_post_meta( $post_id, '_markil_features_list', array_values( $features ) );
        }


        // Fully dynamic tabs: label + content + enabled state.
        if ( isset( $_POST['_markil_custom_tabs'] ) && is_array( $_POST['_markil_custom_tabs'] ) ) {
            $tabs = [];
            foreach ( $_POST['_markil_custom_tabs'] as $tab ) {
                $label   = isset( $tab['label'] ) ? sanitize_text_field( wp_unslash( $tab['label'] ) ) : '';
                $content = isset( $tab['content'] ) ? wp_kses_post( wp_unslash( $tab['content'] ) ) : '';
                $enabled = isset( $tab['enabled'] ) ? '1' : '0';
                if ( $label === '' && $content === '' ) continue;
                $tabs[] = [
                    'label'   => $label ?: __( 'تب جدید', 'markil-modules' ),
                    'content' => $content,
                    'enabled' => $enabled,
                ];
            }
            update_post_meta( $post_id, '_markil_custom_tabs', $tabs );
        }
    }
}
