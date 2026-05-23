<?php
namespace Markil;

if ( ! defined( 'ABSPATH' ) ) exit;

class MetaBoxes {
    public function __construct() {
        add_action( 'add_meta_boxes', [ $this, 'add_meta_boxes' ] );
        add_action( 'save_post_markil_module', [ $this, 'save_meta' ], 10, 2 );
    }

    public function add_meta_boxes() {
        add_meta_box( 'markil_module_pricing',     __( '💰 قیمت‌گذاری', 'markil-modules' ),                       [ $this, 'pricing_box' ],     'markil_module', 'side',   'high' );
        add_meta_box( 'markil_module_stats',       __( '📊 آمار و اطلاعات', 'markil-modules' ),                   [ $this, 'stats_box' ],       'markil_module', 'side',   'default' );
        add_meta_box( 'markil_module_wc',          __( '🛒 یکپارچه‌سازی ووکامرس', 'markil-modules' ),            [ $this, 'wc_box' ],          'markil_module', 'normal', 'high' );
        add_meta_box( 'markil_module_tabs',        __( '📋 محتوای تب‌ها', 'markil-modules' ),                    [ $this, 'tabs_box' ],        'markil_module', 'normal', 'default' );
        add_meta_box( 'markil_module_appearance',  __( '🎨 ظاهر و نمایش', 'markil-modules' ),                   [ $this, 'appearance_box' ],  'markil_module', 'normal', 'default' );
        add_meta_box( 'markil_module_features',    __( '✅ ویژگی‌های کلیدی', 'markil-modules' ),                 [ $this, 'features_box' ],    'markil_module', 'normal', 'default' );
        add_meta_box( 'markil_module_gallery_video', __( '🖼️ گالری تصاویر و ویدیو', 'markil-modules' ), [ $this, 'gallery_video_box' ], 'markil_module', 'normal', 'high' );
        add_meta_box( 'markil_module_full_detail', __( '🖥️ صفحه جزئیات کامل (Full Detail Page)', 'markil-modules' ), [ $this, 'full_detail_box' ], 'markil_module', 'normal', 'default' );
        add_meta_box( 'markil_module_messages',    __( '📨 پیام‌های دریافتی', 'markil-modules' ),                   [ $this, 'messages_box' ],    'markil_module', 'normal', 'low' );
    }

    public function messages_box( $post ) {
        $messages = get_post_meta( $post->ID, '_markil_contact_messages', true );
        $views    = intval( get_post_meta( $post->ID, '_markil_views', true ) );
        if ( ! is_array( $messages ) ) $messages = [];
        ?>
        <p style="margin:0 0 10px"><strong><?php _e( 'تعداد بازدید این ماژول:', 'markil-modules' ); ?></strong> <?php echo number_format( $views ); ?></p>
        <?php if ( empty( $messages ) ) : ?>
            <p style="color:#666"><?php _e( 'تاکنون پیامی دریافت نشده است.', 'markil-modules' ); ?></p>
        <?php else :
            $messages = array_reverse( $messages );
        ?>
            <p><strong><?php echo count( $messages ); ?></strong> <?php _e( 'پیام', 'markil-modules' ); ?></p>
            <table class="widefat striped" style="margin-top:8px">
                <thead><tr>
                    <th><?php _e( 'تاریخ', 'markil-modules' ); ?></th>
                    <th><?php _e( 'نام', 'markil-modules' ); ?></th>
                    <th><?php _e( 'ایمیل', 'markil-modules' ); ?></th>
                    <th><?php _e( 'تلفن', 'markil-modules' ); ?></th>
                    <th><?php _e( 'پیام', 'markil-modules' ); ?></th>
                </tr></thead>
                <tbody>
                <?php foreach ( $messages as $msg ) : ?>
                    <tr>
                        <td><?php echo esc_html( $msg['date'] ?? '' ); ?></td>
                        <td><?php echo esc_html( $msg['name'] ?? '' ); ?></td>
                        <td><a href="mailto:<?php echo esc_attr( $msg['email'] ?? '' ); ?>"><?php echo esc_html( $msg['email'] ?? '' ); ?></a></td>
                        <td><?php echo esc_html( $msg['phone'] ?? '' ); ?></td>
                        <td style="white-space:pre-wrap"><?php echo esc_html( $msg['message'] ?? '' ); ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif;
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
            <p class="description"><?php _e('اگر خالی باشد به‌صورت خودکار به صفحه پیش‌فرض ماژول (/markil-module/slug/) هدایت می‌شود. توصیه می‌شود خالی بگذارید مگر اینکه آدرس سفارشی دارید.','markil-modules'); ?></p></td>
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
                <select name="_markil_btn_secondary_action" id="markil-btn2-action-select">
                    <option value="detail_page" <?php selected($btn2_action,'detail_page'); ?>><?php _e('رفتن به صفحه جزئیات (پیشنهاد می‌شود)','markil-modules'); ?></option>
                    <option value="wc_add" <?php selected($btn2_action,'wc_add'); ?>><?php _e('افزودن به سبد خرید ووکامرس','markil-modules'); ?></option>
                    <option value="wc_page" <?php selected($btn2_action,'wc_page'); ?>><?php _e('رفتن به صفحه محصول ووکامرس','markil-modules'); ?></option>
                    <option value="custom_url" <?php selected($btn2_action,'custom_url'); ?>><?php _e('لینک دلخواه','markil-modules'); ?></option>
                </select>
            </td>
        </tr>
        <tr class="markil-btn1-custom-row"<?php if ( $btn1_action !== 'custom_url' ) echo ' style="display:none"'; ?>>
            <th><label for="markil_primary_custom_url"><?php _e('لینک دلخواه دکمه اصلی','markil-modules'); ?></label></th>
            <td>
                <input type="url" name="_markil_primary_custom_url" id="markil_primary_custom_url"
                       value="<?php echo esc_attr( get_post_meta($post->ID,'_markil_primary_custom_url',true) ); ?>"
                       class="regular-text" placeholder="https://">
            </td>
        </tr>
        <tr class="markil-btn2-custom-row"<?php if ( $btn2_action !== 'custom_url' ) echo ' style="display:none"'; ?>>
            <th><label for="markil_secondary_custom_url"><?php _e('لینک دلخواه دکمه ثانویه','markil-modules'); ?></label></th>
            <td>
                <input type="url" name="_markil_secondary_custom_url" id="markil_secondary_custom_url"
                       value="<?php echo esc_attr( get_post_meta($post->ID,'_markil_secondary_custom_url',true) ); ?>"
                       class="regular-text" placeholder="https://">
            </td>
        </tr>
        </table>
        <script>
        jQuery(function($){
            $('#markil-btn1-action-select, [name="_markil_btn_primary_action"]').on('change', function(){
                $(this).closest('table').find('.markil-btn1-custom-row').toggle($(this).val() === 'custom_url');
            });
            $('#markil-btn2-action-select, [name="_markil_btn_secondary_action"]').on('change', function(){
                $(this).closest('table').find('.markil-btn2-custom-row').toggle($(this).val() === 'custom_url');
            });
        });
        </script>
        <?php
    }

    public function tabs_box( $post ) {
        // Ensure editor scripts are loaded for wp.editor.initialize() in JS
        if ( function_exists( 'wp_enqueue_editor' ) ) wp_enqueue_editor();

        $custom_tabs = get_post_meta( $post->ID, '_markil_custom_tabs', true );
        if ( ! is_array( $custom_tabs ) || empty( $custom_tabs ) ) {
            $custom_tabs = [
                [ 'label' => __( 'جزئیات', 'markil-modules' ),     'summary' => get_post_meta( $post->ID, '_markil_tab_details', true ),       'content' => '', 'enabled' => '1' ],
                [ 'label' => __( 'امکانات', 'markil-modules' ),     'summary' => get_post_meta( $post->ID, '_markil_tab_features', true ),      'content' => '', 'enabled' => '1' ],
                [ 'label' => __( 'سازگاری', 'markil-modules' ),     'summary' => get_post_meta( $post->ID, '_markil_tab_compatibility', true ), 'content' => '', 'enabled' => '1' ],
                [ 'label' => __( 'نقد و بررسی', 'markil-modules' ), 'summary' => '[markil_reviews]', 'content' => '[markil_reviews]', 'enabled' => '1' ],
            ];
        }
        ?>
        <style>
        .markil-tabs-builder{direction:rtl;background:#fff;border:1px solid #dcdcde;border-radius:12px;padding:14px}
        .markil-tab-row{border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;margin-bottom:14px;overflow:hidden}
        .markil-tab-head{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border-bottom:1px solid #e2e8f0}
        .markil-tab-head strong{margin-left:auto;color:#1e293b;font-size:13px}
        .markil-tab-head input[type=text]{width:260px;max-width:100%;padding:7px 10px;border:1px solid #cbd5e1;border-radius:8px}
        .markil-tab-body{padding:14px}
        .markil-tab-field{margin-bottom:14px}
        .markil-tab-field-label{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#334155;margin-bottom:6px}
        .markil-tab-field-label .markil-badge-blue{background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700}
        .markil-tab-field-label .markil-badge-green{background:#d1fae5;color:#047857;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700}
        .markil-tab-field-hint{font-size:11px;color:#64748b;margin:4px 0 0;line-height:1.6}
        .markil-tab-summary-input{width:100%;min-height:70px;border:1px solid #cbd5e1;border-radius:8px;padding:10px;direction:rtl;font-family:inherit;font-size:13px}
        .markil-remove-tab{color:#b91c1c!important;border-color:#fecaca!important}
        .markil-tab-help{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin-bottom:14px;color:#334155;line-height:1.7;font-size:13px}
        .markil-tab-help code,.markil-tab-shortcode{font-family:monospace;direction:ltr;display:inline-block;background:#fff;border:1px solid #cbd5e1;border-radius:6px;padding:2px 6px;font-size:12px}
        .markil-tab-help-row{margin-bottom:6px}
        .markil-tab-help-row:last-child{margin-bottom:0}
        .markil-main-editor-lbl{font-size:12px;background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:6px;border:1px solid #fcd34d;cursor:pointer;white-space:nowrap}
        .markil-editor-notice{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;color:#166534;font-size:13px;display:none}
        .markil-badge-purple{background:#ede9fe;color:#5b21b6;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700}
        .markil-el-field-wrap{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
        .markil-el-page-id-input{width:160px;padding:7px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px}
        </style>

        <div class="markil-tab-help">
            <div class="markil-tab-help-row">
                <strong>📝 ساختار جدید v2.5+:</strong> هر تب اکنون <strong>دو فیلد جدا</strong> دارد —
                <span class="markil-badge-blue" style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:6px;font-size:11px">خلاصه</span>
                برای پنل کناری نمایش‌داده‌می‌شود، و
                <span class="markil-badge-green" style="background:#d1fae5;color:#047857;padding:2px 8px;border-radius:6px;font-size:11px">محتوای کامل</span>
                در صفحه جزئیات کامل ماژول.
            </div>
            <div class="markil-tab-help-row">
                <strong>🎨 طراحی جدا با المنتور:</strong> برای طراحی محتوای هر تب به‌صورت مستقل در المنتور، یک صفحه وردپرس بسازید، با المنتور طراحی کنید، سپس شناسه آن صفحه (Page ID) را در فیلد «🎨 المنتور» داخل همان تب وارد کنید.
            </div>
            <div class="markil-tab-help-row">
                <strong>📌 شورت‌کد المنتور:</strong> جایگزین ساده‌تر — از <code>[elementor-template id="123"]</code> در ویرایشگر تب استفاده کنید (ابتدا در Templates &gt; Saved Templates ساخته شود).
            </div>
            <div class="markil-tab-help-row">
                <strong>⭐ نظرات کاربران:</strong> برای نمایش لیست نظرات و فرم ثبت نظر از <code>[markil_reviews]</code> استفاده کنید.
            </div>
        </div>

        <div class="markil-tabs-builder" id="markil-tabs-builder">
            <?php foreach ( $custom_tabs as $i => $tab ) :
                $label             = isset($tab['label'])             ? $tab['label']             : '';
                $summary           = isset($tab['summary'])           ? $tab['summary']           : '';
                $content           = isset($tab['content'])           ? $tab['content']           : '';
                $enabled           = isset($tab['enabled'])           ? $tab['enabled']           : '1';
                $use_main          = ! empty( $tab['use_main_editor'] ) && $tab['use_main_editor'] === '1';
                $elementor_page_id = intval( $tab['elementor_page_id'] ?? 0 );
                $editor_id         = 'markil_tab_content_' . $i;
                $el_edit_url       = $elementor_page_id > 0 ? admin_url( 'post.php?post=' . $elementor_page_id . '&action=elementor' ) : '#';
            ?>
            <div class="markil-tab-row">
                <div class="markil-tab-head">
                    <strong><?php _e('تب #', 'markil-modules'); ?><?php echo $i + 1; ?></strong>
                    <input type="text" name="_markil_custom_tabs[<?php echo esc_attr($i); ?>][label]"
                           value="<?php echo esc_attr($label); ?>"
                           placeholder="<?php esc_attr_e('نام تب مثل جزئیات','markil-modules'); ?>">
                    <label><input type="checkbox" name="_markil_custom_tabs[<?php echo esc_attr($i); ?>][enabled]" value="1" <?php checked($enabled, '1'); ?>> <?php _e('فعال','markil-modules'); ?></label>
                    <label class="markil-main-editor-lbl" title="<?php esc_attr_e('محتوا از ویرایشگر اصلی صفحه (المنتور) خوانده می‌شود','markil-modules'); ?>">
                        <input type="checkbox" name="_markil_custom_tabs[<?php echo esc_attr($i); ?>][use_main_editor]" value="1" class="markil-use-main-editor" <?php checked($use_main, true); ?>>
                        🎨 <?php _e('ویرایشگر اصلی (المنتور)','markil-modules'); ?>
                    </label>
                    <button type="button" class="button markil-remove-tab"><?php _e('حذف','markil-modules'); ?></button>
                </div>
                <div class="markil-tab-body">
                    <!-- Summary (panel preview) -->
                    <div class="markil-tab-field">
                        <div class="markil-tab-field-label">
                            <span class="markil-badge-blue">خلاصه</span>
                            <?php _e('متن کوتاه برای پنل کناری (پیش‌نمایش سریع)', 'markil-modules'); ?>
                        </div>
                        <textarea class="markil-tab-summary-input"
                                  name="_markil_custom_tabs[<?php echo esc_attr($i); ?>][summary]"
                                  placeholder="<?php esc_attr_e('یک پاراگراف کوتاه — وقتی کاربر روی کارت کلیک کند، در پنل کناری همین نمایش داده می‌شود.','markil-modules'); ?>"><?php echo esc_textarea($summary); ?></textarea>
                        <p class="markil-tab-field-hint"><?php _e('پیشنهاد: ۲ تا ۴ خط کوتاه. می‌توانید HTML و شورت‌کد استفاده کنید.','markil-modules'); ?></p>
                    </div>

                    <!-- Full Content (detail page) — wp_editor OR main editor notice -->
                    <div class="markil-tab-field">
                        <div class="markil-tab-field-label">
                            <span class="markil-badge-green">محتوای کامل</span>
                            <?php _e('محتوای کامل برای صفحه جزئیات', 'markil-modules'); ?>
                        </div>
                        <!-- Notice when using main editor -->
                        <div class="markil-editor-notice"<?php if ( ! $use_main ) echo ' style="display:none"'; ?>>
                            ✅ <?php _e('این تب از <strong>ویرایشگر اصلی صفحه</strong> استفاده می‌کند. محتوا را با المنتور در بالای همین صفحه طراحی کنید.', 'markil-modules'); ?>
                        </div>
                        <div class="markil-editor-wrap"<?php if ( $use_main ) echo ' style="display:none"'; ?>>
                            <?php
                            wp_editor( $content, $editor_id, [
                                'textarea_name' => '_markil_custom_tabs[' . $i . '][content]',
                                'editor_height' => 280,
                                'media_buttons' => true,
                                'tinymce'       => [
                                    'wpautop' => true,
                                ],
                                'quicktags'     => true,
                                'drag_drop_upload' => true,
                            ]);
                            ?>
                        </div><!-- /markil-editor-wrap -->
                        <p class="markil-tab-field-hint">
                            <?php _e('این محتوا در صفحه /markil-module/slug/ نمایش داده می‌شود. می‌توانید تصویر، ویدیو، گالری، جدول، شورت‌کد المنتور و هر چیز دیگری اضافه کنید.', 'markil-modules'); ?>
                        </p>
                    </div>

                    <!-- Elementor Page ID — independent Elementor design per tab -->
                    <div class="markil-tab-field">
                        <div class="markil-tab-field-label">
                            <span class="markil-badge-purple">🎨 المنتور</span>
                            <?php _e('طراحی مستقل با المنتور (اختیاری)', 'markil-modules'); ?>
                        </div>
                        <div class="markil-el-field-wrap">
                            <input type="number" min="0"
                                   name="_markil_custom_tabs[<?php echo esc_attr($i); ?>][elementor_page_id]"
                                   value="<?php echo esc_attr( $elementor_page_id ?: '' ); ?>"
                                   class="markil-el-page-id-input"
                                   placeholder="<?php esc_attr_e('شناسه صفحه المنتور (Page ID)', 'markil-modules'); ?>">
                            <a href="<?php echo esc_url( $el_edit_url ); ?>"
                               class="button markil-el-edit-btn"
                               target="_blank" rel="noopener"
                               <?php if ( ! $elementor_page_id ) echo 'style="display:none"'; ?>>
                                🎨 <?php _e('ویرایش در المنتور', 'markil-modules'); ?>
                            </a>
                            <a href="<?php echo esc_url( admin_url('post-new.php?post_type=page') ); ?>"
                               class="button" target="_blank" rel="noopener">
                                + <?php _e('ایجاد صفحه جدید', 'markil-modules'); ?>
                            </a>
                        </div>
                        <p class="markil-tab-field-hint">
                            <?php _e('یک صفحه وردپرس بسازید، با المنتور طراحی کنید، شناسه (ID) آن را اینجا وارد کنید. وقتی پر باشد، محتوای این تب از آن صفحه خوانده می‌شود و ویرایشگر بالا نادیده گرفته می‌شود.', 'markil-modules'); ?>
                        </p>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <p>
            <button type="button" class="button button-primary" id="markil-add-custom-tab">
                + <?php _e('افزودن تب جدید','markil-modules'); ?>
            </button>
        </p>

        <script>
        jQuery(function($){
            // Sync all TinyMCE editors to textareas before publish/update
            $('#post').off('submit.markil').on('submit.markil', function(){
                if (typeof tinyMCE !== 'undefined') {
                    try { tinyMCE.triggerSave(); } catch(e){}
                }
            });

            // Toggle editor/notice when "use main editor" checkbox changes
            $(document).on('change', '.markil-use-main-editor', function(){
                var $row = $(this).closest('.markil-tab-row');
                var $wrap = $row.find('.markil-editor-wrap');
                var $notice = $row.find('.markil-editor-notice');
                if ($(this).is(':checked')) {
                    $wrap.hide();
                    $notice.show();
                } else {
                    $wrap.show();
                    $notice.hide();
                }
            });

            var index = $('#markil-tabs-builder .markil-tab-row').length;

            function initEditor(id){
                if (typeof wp === 'undefined' || !wp.editor || !wp.editor.initialize) return;
                try {
                    wp.editor.initialize(id, {
                        tinymce: {
                            wpautop: true,
                            plugins: 'charmap,colorpicker,hr,lists,media,paste,tabfocus,textcolor,fullscreen,wordpress,wpautoresize,wpeditimage,wpemoji,wpgallery,wplink,wpdialogs,wptextpattern,wpview',
                            toolbar1: 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,wp_more,fullscreen,wp_adv',
                            toolbar2: 'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help'
                        },
                        quicktags: true,
                        mediaButtons: true
                    });
                } catch(e) { console.warn('Markil editor init failed:', e); }
            }

            $('#markil-add-custom-tab').on('click', function(){
                var i = index;
                var editorId = 'markil_tab_content_' + i;
                var row =
                    '<div class="markil-tab-row">' +
                        '<div class="markil-tab-head">' +
                            '<strong>تب جدید</strong>' +
                            '<input type="text" name="_markil_custom_tabs[' + i + '][label]" placeholder="نام تب">' +
                            '<label><input type="checkbox" name="_markil_custom_tabs[' + i + '][enabled]" value="1" checked> فعال</label>' +
                            '<button type="button" class="button markil-remove-tab">حذف</button>' +
                        '</div>' +
                        '<div class="markil-tab-body">' +
                            '<div class="markil-tab-field">' +
                                '<div class="markil-tab-field-label"><span class="markil-badge-blue">خلاصه</span> متن کوتاه برای پنل کناری</div>' +
                                '<textarea class="markil-tab-summary-input" name="_markil_custom_tabs[' + i + '][summary]" placeholder="یک پاراگراف کوتاه"></textarea>' +
                            '</div>' +
                            '<div class="markil-tab-field">' +
                                '<div class="markil-tab-field-label"><span class="markil-badge-green">محتوای کامل</span> برای صفحه جزئیات</div>' +
                                '<textarea id="' + editorId + '" name="_markil_custom_tabs[' + i + '][content]" rows="10" style="width:100%"></textarea>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                $('#markil-tabs-builder').append(row);
                initEditor(editorId);
                index++;
            });

            // Update "Edit in Elementor" link when page ID changes
            $(document).on('input change', '.markil-el-page-id-input', function(){
                var id  = parseInt($(this).val(), 10);
                var $btn = $(this).closest('.markil-el-field-wrap').find('.markil-el-edit-btn');
                if (id > 0) {
                    var base = (typeof ajaxurl !== 'undefined') ? ajaxurl.replace('admin-ajax.php', '') : '/wp-admin/';
                    $btn.attr('href', base + 'post.php?post=' + id + '&action=elementor').show();
                } else {
                    $btn.attr('href', '#').hide();
                }
            });

            $(document).on('click','.markil-remove-tab',function(){
                var $row = $(this).closest('.markil-tab-row');
                var editorId = $row.find('textarea[id^="markil_tab_content_"]').attr('id');
                if (editorId && wp.editor && wp.editor.remove) {
                    try { wp.editor.remove(editorId); } catch(e){}
                }
                $row.remove();
            });
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

    public function gallery_video_box( $post ) {
        $gallery_raw      = get_post_meta( $post->ID, '_markil_gallery_images', true );
        $gallery_ids      = $gallery_raw ? array_filter( array_map( 'absint', explode( ',', $gallery_raw ) ) ) : [];
        $video_url        = get_post_meta( $post->ID, '_markil_video_url', true );
        $video_embed      = get_post_meta( $post->ID, '_markil_video_embed', true );
        $video_membership = get_post_meta( $post->ID, '_markil_video_membership', true );
        ?>
        <style>
        .markil-gallery-box{direction:rtl}
        .markil-gallery-previews{display:flex;gap:10px;flex-wrap:wrap;min-height:70px;padding:12px;background:#f8fafc;border:2px dashed #e2e8f0;border-radius:10px;align-items:flex-start;margin-bottom:10px}
        .markil-gallery-item{position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid #e2e8f0;flex-shrink:0;cursor:grab}
        .markil-gallery-item img{width:100%;height:100%;object-fit:cover;display:block}
        .markil-gallery-item-remove{position:absolute;top:2px;left:2px;background:rgba(239,68,68,.9);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;padding:0}
        .markil-gallery-placeholder{color:#94a3b8;font-size:13px;display:flex;align-items:center;justify-content:center;width:100%;min-height:50px}
        .markil-video-section{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-top:20px}
        .markil-gallery-box h4{font-size:14px;font-weight:800;color:#1e293b;margin:0 0 8px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;display:flex;align-items:center;gap:6px}
        .markil-gallery-box p.markil-hint{font-size:12px;color:#64748b;margin:0 0 10px;line-height:1.6}
        </style>
        <div class="markil-gallery-box">

            <!-- ===== Gallery Images ===== -->
            <h4>🖼️ <?php _e( 'گالری تصاویر اسلایدر', 'markil-modules' ); ?></h4>
            <p class="markil-hint">
                <?php _e( 'تصاویر گالری در سایدبار صفحه جزئیات کامل به صورت اسلایدشو نمایش داده می‌شوند. اولین تصویر به عنوان تصویر اصلی محصول نمایش داده می‌شود.', 'markil-modules' ); ?>
            </p>
            <div class="markil-gallery-previews" id="markil-gallery-previews">
                <?php if ( ! empty( $gallery_ids ) ) :
                    foreach ( $gallery_ids as $att_id ) :
                        $thumb = wp_get_attachment_image_src( $att_id, 'thumbnail' );
                        if ( ! $thumb ) continue;
                ?>
                <div class="markil-gallery-item" data-id="<?php echo esc_attr( $att_id ); ?>">
                    <img src="<?php echo esc_url( $thumb[0] ); ?>" alt="">
                    <button type="button" class="markil-gallery-item-remove" title="<?php esc_attr_e('حذف','markil-modules'); ?>">✕</button>
                </div>
                <?php
                    endforeach;
                else : ?>
                <span class="markil-gallery-placeholder"><?php _e( 'هنوز تصویری اضافه نشده — دکمه زیر را بزنید', 'markil-modules' ); ?></span>
                <?php endif; ?>
            </div>
            <input type="hidden" name="_markil_gallery_images" id="markil-gallery-ids"
                   value="<?php echo esc_attr( implode( ',', $gallery_ids ) ); ?>">
            <button type="button" class="button button-primary" id="markil-gallery-open-btn">
                🖼️ <?php _e( 'افزودن / ویرایش گالری', 'markil-modules' ); ?>
            </button>

            <!-- ===== Video Section ===== -->
            <div class="markil-video-section">
                <h4>🎬 <?php _e( 'بخش ویدیو (برای آینده)', 'markil-modules' ); ?></h4>
                <p class="markil-hint">
                    <?php _e( 'ویدیو در بالای تب‌های صفحه جزئیات نمایش داده می‌شود. لینک یوتیوب یا وایمو را وارد کنید — افزونه به‌صورت خودکار آن را Embed می‌کند. یا می‌توانید کد جاسازی خودتان را استفاده کنید. برای محدود کردن نمایش به اعضا، تیک زیر را بزنید — این یک پرچم برای افزونه عضویت شماست.', 'markil-modules' ); ?>
                </p>
                <table class="form-table" style="margin:0">
                    <tr>
                        <th style="width:180px"><label><?php _e('لینک ویدیو (یوتیوب/وایمو)','markil-modules'); ?></label></th>
                        <td>
                            <input type="url" name="_markil_video_url" value="<?php echo esc_attr($video_url); ?>"
                                   class="regular-text" placeholder="https://www.youtube.com/watch?v=...">
                        </td>
                    </tr>
                    <tr>
                        <th><label><?php _e('کد جاسازی (Embed Code)','markil-modules'); ?></label></th>
                        <td>
                            <textarea name="_markil_video_embed" rows="4"
                                      style="width:100%;font-family:monospace;direction:ltr;border:1px solid #cbd5e1;border-radius:8px;padding:8px"
                                      placeholder='<iframe src="..." ...></iframe>'><?php echo esc_textarea($video_embed); ?></textarea>
                            <p class="description"><?php _e( 'اگر لینک ویدیو وارد کرده‌اید این فیلد را خالی بگذارید. برای سرویس‌های خاص از کد Embed استفاده کنید.', 'markil-modules' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><label><?php _e('محدودیت عضویت','markil-modules'); ?></label></th>
                        <td>
                            <label>
                                <input type="checkbox" name="_markil_video_membership" value="1" <?php checked($video_membership,'1'); ?>>
                                <?php _e('فقط اعضای سایت این ویدیو را ببینند (برای استفاده با افزونه عضویت)','markil-modules'); ?>
                            </label>
                            <p class="description"><?php _e('این گزینه کلاس CSS <code>markil-members-only</code> را اضافه می‌کند. برای پنهان کردن از غیراعضا، افزونه عضویت خود را روی این کلاس تنظیم کنید.','markil-modules'); ?></p>
                        </td>
                    </tr>
                </table>
            </div>

        </div>
        <?php
    }

    public function full_detail_box( $post ) {
        $features_bar     = get_post_meta( $post->ID, '_markil_features_bar', true );
        $sidebar_features = get_post_meta( $post->ID, '_markil_sidebar_features', true );
        $detail_sections  = get_post_meta( $post->ID, '_markil_detail_sections', true );
        $delivery_time    = get_post_meta( $post->ID, '_markil_delivery_time', true );

        if ( ! is_array( $features_bar ) )     $features_bar     = [];
        if ( ! is_array( $sidebar_features ) ) $sidebar_features = [];
        if ( ! is_array( $detail_sections ) )  $detail_sections  = [];
        if ( empty( $features_bar ) )     $features_bar     = [ ['icon'=>'fas fa-shipping-fast','label'=>'تحویل سریع'], ['icon'=>'fas fa-headset','label'=>'پشتیبانی اولیه'], ['icon'=>'fas fa-lock','label'=>'پرداخت امن'], ['icon'=>'fas fa-certificate','label'=>'تضمین کیفیت'] ];
        if ( empty( $sidebar_features ) ) $sidebar_features = [ ['icon'=>'fas fa-user-tie','label'=>'نصب توسط متخصص'], ['icon'=>'fas fa-ban','label'=>'بدون نیاز به دانش فنی'], ['icon'=>'fas fa-headset','label'=>'پشتیبانی اولیه'], ['icon'=>'fas fa-check-circle','label'=>'آماده استفاده'] ];
        ?>
        <style>
        .markil-fd-box { direction: rtl; font-family: inherit; }
        .markil-fd-section-wrap { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
        .markil-fd-section-title { font-size: 14px; font-weight: 800; color: #1e293b; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 6px; }
        .markil-fd-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
        .markil-fd-row input[type=text] { flex: 1; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; }
        .markil-fd-row .markil-fd-icon-input { flex: 0 0 200px; }
        .markil-fd-row .markil-fd-label-input { flex: 1; }
        .markil-fd-help { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #334155; margin-bottom: 12px; }
        .markil-fd-help code { background: #fff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 1px 5px; font-family: monospace; }
        .markil-section-block { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 14px; overflow: hidden; }
        .markil-section-block-head { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; cursor: pointer; user-select: none; }
        .markil-section-block-head input[type=text] { flex: 1; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
        .markil-section-block-head .toggle-arrow { font-size: 12px; color: #64748b; transition: transform 0.2s; }
        .markil-section-block-head.collapsed .toggle-arrow { transform: rotate(-90deg); }
        .markil-section-block-body { padding: 12px; }
        .markil-section-items-wrap { background: #f8fafc; border-radius: 8px; padding: 10px; margin-top: 10px; }
        .markil-section-items-label { font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px; display: block; }
        .markil-item-row { display: flex; gap: 6px; margin-bottom: 6px; align-items: center; }
        .markil-item-row input { padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; }
        .markil-item-row .item-icon-in { flex: 0 0 160px; }
        .markil-item-row .item-title-in { flex: 1; }
        .markil-item-row .item-desc-in { flex: 1.5; }
        .markil-fd-remove-btn { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; white-space: nowrap; }
        .markil-fd-add-btn { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-top: 6px; }
        .markil-fd-add-section-btn { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; }
        .col-labels { display: flex; gap: 6px; margin-bottom: 4px; }
        .col-labels span { font-size: 11px; color: #94a3b8; }
        .col-labels .c1 { flex: 0 0 160px; }
        .col-labels .c2 { flex: 1; }
        .col-labels .c3 { flex: 1.5; }
        </style>
        <div class="markil-fd-box">

            <!-- ===== نوار ویژگی‌های بالای صفحه ===== -->
            <div class="markil-fd-section-wrap">
                <h4 class="markil-fd-section-title">🏷️ نوار ویژگی‌ها (بالای صفحه جزئیات – ۱ تا ۶ مورد)</h4>
                <div class="markil-fd-help">
                    آیکون‌های FontAwesome مانند <code>fas fa-bolt</code> یا <code>fas fa-shield-alt</code> یا از Dashicons مانند <code>dashicons-yes</code> استفاده کنید.
                </div>
                <div class="col-labels"><span class="c1">کلاس آیکون</span><span class="c2">متن برچسب</span></div>
                <div id="markil-fb-list">
                    <?php foreach ( $features_bar as $i => $fb ) : ?>
                    <div class="markil-fd-row">
                        <input type="text" class="markil-fd-icon-input" name="_markil_features_bar[<?php echo $i; ?>][icon]" value="<?php echo esc_attr($fb['icon'] ?? ''); ?>" placeholder="fas fa-bolt">
                        <input type="text" class="markil-fd-label-input" name="_markil_features_bar[<?php echo $i; ?>][label]" value="<?php echo esc_attr($fb['label'] ?? ''); ?>" placeholder="تحویل سریع">
                        <button type="button" class="markil-fd-remove-btn markil-remove-fb">حذف</button>
                    </div>
                    <?php endforeach; ?>
                </div>
                <button type="button" class="button markil-fd-add-btn" id="markil-add-fb">+ افزودن ویژگی</button>
            </div>

            <!-- ===== ویژگی‌های سایدبار ===== -->
            <div class="markil-fd-section-wrap">
                <h4 class="markil-fd-section-title">🔷 ویژگی‌های سایدبار (آیکون‌های زیر توضیحات در سایدبار)</h4>
                <div class="markil-fd-help">این آیکون‌ها در کارت سایدبار نمایش داده می‌شوند.</div>
                <div class="col-labels"><span class="c1">کلاس آیکون</span><span class="c2">متن</span></div>
                <div id="markil-sf-list">
                    <?php foreach ( $sidebar_features as $i => $sf ) : ?>
                    <div class="markil-fd-row">
                        <input type="text" class="markil-fd-icon-input" name="_markil_sidebar_features[<?php echo $i; ?>][icon]" value="<?php echo esc_attr($sf['icon'] ?? ''); ?>" placeholder="fas fa-user-tie">
                        <input type="text" class="markil-fd-label-input" name="_markil_sidebar_features[<?php echo $i; ?>][label]" value="<?php echo esc_attr($sf['label'] ?? ''); ?>" placeholder="نصب توسط متخصص">
                        <button type="button" class="markil-fd-remove-btn markil-remove-sf">حذف</button>
                    </div>
                    <?php endforeach; ?>
                </div>
                <button type="button" class="button markil-fd-add-btn" id="markil-add-sf">+ افزودن</button>
            </div>

            <!-- ===== بخش‌های محتوا (Dynamic Sections) ===== -->
            <div class="markil-fd-section-wrap">
                <h4 class="markil-fd-section-title">📦 بخش‌های محتوا (هر بخش می‌تواند تعداد دلخواه آیتم داشته باشد)</h4>
                <div class="markil-fd-help">
                    هر بخش یک عنوان و آیکون دارد و می‌تواند چند آیتم با آیکون + عنوان + توضیح داشته باشد.
                    برای نمایش در صفحه جزئیات کامل (Full Detail) از ویجت المنتور «جزئیات کامل ماژول» استفاده کنید.
                    بخش‌ها در داخل هر تب قابل تنظیم هستند.
                </div>
                <div id="markil-sections-list">
                <?php foreach ( $detail_sections as $si => $section ) :
                    $sec_title  = $section['title'] ?? '';
                    $sec_icon   = $section['icon'] ?? '';
                    $sec_tab    = $section['tab_index'] ?? '';
                    $sec_items  = $section['items'] ?? [];
                ?>
                <div class="markil-section-block" data-section="<?php echo $si; ?>">
                    <div class="markil-section-block-head">
                        <span class="toggle-arrow">▼</span>
                        <input type="text" name="_markil_detail_sections[<?php echo $si; ?>][icon]" value="<?php echo esc_attr($sec_icon); ?>" placeholder="fas fa-gem" style="flex:0 0 160px">
                        <input type="text" name="_markil_detail_sections[<?php echo $si; ?>][title]" value="<?php echo esc_attr($sec_title); ?>" placeholder="عنوان بخش مثل امکانات اصلی">
                        <select name="_markil_detail_sections[<?php echo $si; ?>][tab_index]" style="padding:6px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px">
                            <option value="" <?php selected($sec_tab,''); ?>>همه تب‌ها</option>
                            <option value="0" <?php selected($sec_tab,'0'); ?>>تب اول</option>
                            <option value="1" <?php selected($sec_tab,'1'); ?>>تب دوم</option>
                            <option value="2" <?php selected($sec_tab,'2'); ?>>تب سوم</option>
                            <option value="3" <?php selected($sec_tab,'3'); ?>>تب چهارم</option>
                            <option value="4" <?php selected($sec_tab,'4'); ?>>تب پنجم</option>
                            <option value="5" <?php selected($sec_tab,'5'); ?>>تب ششم</option>
                        </select>
                        <button type="button" class="markil-fd-remove-btn markil-remove-section">حذف بخش</button>
                    </div>
                    <div class="markil-section-block-body">
                        <div class="markil-section-items-wrap">
                            <span class="markil-section-items-label">آیتم‌های بخش:</span>
                            <div class="col-labels" style="display:flex;gap:6px;margin-bottom:4px">
                                <span style="font-size:11px;color:#94a3b8;flex:0 0 160px">کلاس آیکون</span>
                                <span style="font-size:11px;color:#94a3b8;flex:1">عنوان آیتم</span>
                                <span style="font-size:11px;color:#94a3b8;flex:1.5">توضیحات (اختیاری)</span>
                            </div>
                            <div class="markil-items-list" data-section="<?php echo $si; ?>">
                                <?php foreach ( $sec_items as $ii => $item ) : ?>
                                <div class="markil-item-row">
                                    <input type="text" class="item-icon-in" name="_markil_detail_sections[<?php echo $si; ?>][items][<?php echo $ii; ?>][icon]" value="<?php echo esc_attr($item['icon'] ?? ''); ?>" placeholder="fas fa-check">
                                    <input type="text" class="item-title-in" name="_markil_detail_sections[<?php echo $si; ?>][items][<?php echo $ii; ?>][title]" value="<?php echo esc_attr($item['title'] ?? ''); ?>" placeholder="عنوان آیتم">
                                    <input type="text" class="item-desc-in" name="_markil_detail_sections[<?php echo $si; ?>][items][<?php echo $ii; ?>][desc]" value="<?php echo esc_attr($item['desc'] ?? ''); ?>" placeholder="توضیحات (اختیاری)">
                                    <button type="button" class="markil-fd-remove-btn markil-remove-item">✕</button>
                                </div>
                                <?php endforeach; ?>
                            </div>
                            <button type="button" class="button markil-fd-add-btn markil-add-item" data-section="<?php echo $si; ?>">+ افزودن آیتم</button>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
                </div>
                <button type="button" class="button markil-fd-add-section-btn" id="markil-add-section">+ افزودن بخش جدید</button>
            </div>

            <!-- ===== زمان تحویل ===== -->
            <div class="markil-fd-section-wrap">
                <h4 class="markil-fd-section-title">⏱️ زمان تحویل (نمایش در سایدبار)</h4>
                <div class="markil-fd-row">
                    <input type="text" name="_markil_delivery_time" value="<?php echo esc_attr($delivery_time); ?>" placeholder="مثال: ۲ تا ۴ روز کاری" style="flex:1;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px">
                </div>
            </div>

            <!-- ===== ضمانت کیفیت ===== -->
            <div class="markil-fd-section-wrap">
                <h4 class="markil-fd-section-title">🛡️ ضمانت کیفیت (اختیاری - اگر خالی باشد از تنظیمات سایت می‌خواند)</h4>
                <div class="markil-meta-field">
                    <label>عنوان ضمانت</label>
                    <input type="text" name="_markil_guarantee_title" value="<?php echo esc_attr(get_post_meta($post->ID,'_markil_guarantee_title',true)); ?>" placeholder="ضمانت کیفیت خدمات">
                </div>
                <div class="markil-meta-field" style="margin-top:8px">
                    <label>متن ضمانت</label>
                    <textarea name="_markil_guarantee_text" rows="3" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px"><?php echo esc_textarea(get_post_meta($post->ID,'_markil_guarantee_text',true)); ?></textarea>
                </div>
                <!-- Demo URL -->
                <h4 class="markil-fd-section-title" style="margin-top:18px">🔗 لینک دمو (اختیاری)</h4>
                <input type="url" name="_markil_demo_url" value="<?php echo esc_attr(get_post_meta($post->ID,'_markil_demo_url',true)); ?>" placeholder="https://demo.example.com" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px">
                <!-- Changelog -->
                <h4 class="markil-fd-section-title" style="margin-top:18px">📋 تاریخچه تغییرات (Changelog)</h4>
                <div class="markil-fd-help">هر نسخه در یک خط جدید — مثال: v1.2 — افزودن قابلیت جدید</div>
                <textarea name="_markil_changelog" rows="6" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;direction:rtl"><?php echo esc_textarea(get_post_meta($post->ID,'_markil_changelog',true)); ?></textarea>
            </div>

        </div>
        <script>
        jQuery(function($){
            /* === Features Bar === */
            var fbCount = $('#markil-fb-list .markil-fd-row').length;
            $('#markil-add-fb').on('click', function(){
                $('#markil-fb-list').append(
                    '<div class="markil-fd-row">' +
                    '<input type="text" class="markil-fd-icon-input" name="_markil_features_bar[' + fbCount + '][icon]" placeholder="fas fa-bolt">' +
                    '<input type="text" class="markil-fd-label-input" name="_markil_features_bar[' + fbCount + '][label]" placeholder="ویژگی جدید">' +
                    '<button type="button" class="markil-fd-remove-btn markil-remove-fb">حذف</button>' +
                    '</div>'
                );
                fbCount++;
            });
            $(document).on('click', '.markil-remove-fb', function(){ $(this).closest('.markil-fd-row').remove(); });

            /* === Sidebar Features === */
            var sfCount = $('#markil-sf-list .markil-fd-row').length;
            $('#markil-add-sf').on('click', function(){
                $('#markil-sf-list').append(
                    '<div class="markil-fd-row">' +
                    '<input type="text" class="markil-fd-icon-input" name="_markil_sidebar_features[' + sfCount + '][icon]" placeholder="fas fa-check">' +
                    '<input type="text" class="markil-fd-label-input" name="_markil_sidebar_features[' + sfCount + '][label]" placeholder="ویژگی">' +
                    '<button type="button" class="markil-fd-remove-btn markil-remove-sf">حذف</button>' +
                    '</div>'
                );
                sfCount++;
            });
            $(document).on('click', '.markil-remove-sf', function(){ $(this).closest('.markil-fd-row').remove(); });

            /* === Sections Toggle === */
            $(document).on('click', '.markil-section-block-head', function(e){
                if ($(e.target).is('input, select, button')) return;
                $(this).toggleClass('collapsed');
                $(this).next('.markil-section-block-body').slideToggle(180);
            });

            /* === Remove Section === */
            $(document).on('click', '.markil-remove-section', function(e){
                e.stopPropagation();
                if (confirm('این بخش حذف شود؟')) $(this).closest('.markil-section-block').remove();
            });

            /* === Add Section === */
            var secCount = $('#markil-sections-list .markil-section-block').length;
            $('#markil-add-section').on('click', function(){
                var tabOpts = '<option value="">همه تب‌ها</option><option value="0">تب اول</option><option value="1">تب دوم</option><option value="2">تب سوم</option><option value="3">تب چهارم</option><option value="4">تب پنجم</option><option value="5">تب ششم</option>';
                var block =
                    '<div class="markil-section-block" data-section="' + secCount + '">' +
                    '<div class="markil-section-block-head">' +
                    '<span class="toggle-arrow">▼</span>' +
                    '<input type="text" name="_markil_detail_sections[' + secCount + '][icon]" placeholder="fas fa-gem" style="flex:0 0 160px">' +
                    '<input type="text" name="_markil_detail_sections[' + secCount + '][title]" placeholder="عنوان بخش">' +
                    '<select name="_markil_detail_sections[' + secCount + '][tab_index]" style="padding:6px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px">' + tabOpts + '</select>' +
                    '<button type="button" class="markil-fd-remove-btn markil-remove-section">حذف بخش</button>' +
                    '</div>' +
                    '<div class="markil-section-block-body">' +
                    '<div class="markil-section-items-wrap">' +
                    '<span class="markil-section-items-label">آیتم‌های بخش:</span>' +
                    '<div class="markil-items-list" data-section="' + secCount + '"></div>' +
                    '<button type="button" class="button markil-fd-add-btn markil-add-item" data-section="' + secCount + '">+ افزودن آیتم</button>' +
                    '</div></div></div>';
                $('#markil-sections-list').append(block);
                secCount++;
            });

            /* === Add Item to Section === */
            $(document).on('click', '.markil-add-item', function(){
                var secIdx = $(this).data('section');
                var $list = $(this).prev('.markil-items-list');
                if (!$list.length) $list = $(this).closest('.markil-section-items-wrap').find('.markil-items-list');
                var itemCount = $list.find('.markil-item-row').length;
                $list.append(
                    '<div class="markil-item-row">' +
                    '<input type="text" class="item-icon-in" name="_markil_detail_sections[' + secIdx + '][items][' + itemCount + '][icon]" placeholder="fas fa-check">' +
                    '<input type="text" class="item-title-in" name="_markil_detail_sections[' + secIdx + '][items][' + itemCount + '][title]" placeholder="عنوان آیتم">' +
                    '<input type="text" class="item-desc-in" name="_markil_detail_sections[' + secIdx + '][items][' + itemCount + '][desc]" placeholder="توضیحات (اختیاری)">' +
                    '<button type="button" class="markil-fd-remove-btn markil-remove-item">✕</button>' +
                    '</div>'
                );
            });

            /* === Remove Item === */
            $(document).on('click', '.markil-remove-item', function(){ $(this).closest('.markil-item-row').remove(); });
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
            '_markil_delivery_time', '_markil_primary_custom_url', '_markil_secondary_custom_url',
            '_markil_video_url', '_markil_demo_url', '_markil_guarantee_title',
        ];

        foreach ( $text_fields as $field ) {
            if ( isset( $_POST[ $field ] ) ) {
                update_post_meta( $post_id, $field, sanitize_text_field( $_POST[ $field ] ) );
            }
        }

        update_post_meta( $post_id, '_markil_is_free', isset($_POST['_markil_is_free']) ? '1' : '0' );

        $editor_fields = ['_markil_tab_details','_markil_tab_features','_markil_tab_compatibility'];
        foreach ( $editor_fields as $field ) {
            if ( isset( $_POST[ $field ] ) ) {
                update_post_meta( $post_id, $field, wp_kses_post( wp_unslash( $_POST[ $field ] ) ) );
            }
        }

        if ( isset( $_POST['_markil_features_list'] ) && is_array( $_POST['_markil_features_list'] ) ) {
            $features = array_map( 'sanitize_text_field', $_POST['_markil_features_list'] );
            $features = array_filter( $features );
            update_post_meta( $post_id, '_markil_features_list', array_values( $features ) );
        }

        if ( isset( $_POST['_markil_custom_tabs'] ) && is_array( $_POST['_markil_custom_tabs'] ) ) {
            $tabs = [];
            foreach ( $_POST['_markil_custom_tabs'] as $tab ) {
                $label             = isset( $tab['label'] )            ? sanitize_text_field( wp_unslash( $tab['label'] ) ) : '';
                $summary           = isset( $tab['summary'] )          ? wp_kses_post( wp_unslash( $tab['summary'] ) ) : '';
                $content           = isset( $tab['content'] )          ? wp_kses_post( wp_unslash( $tab['content'] ) ) : '';
                $enabled           = isset( $tab['enabled'] )          ? '1' : '0';
                $use_main          = ! empty( $tab['use_main_editor'] ) ? '1' : '0';
                $elementor_page_id = intval( $tab['elementor_page_id'] ?? 0 );
                if ( $label === '' && $summary === '' && $content === '' && $use_main === '0' && $elementor_page_id === 0 ) continue;
                $tabs[] = [
                    'label'             => $label ?: __( 'تب جدید', 'markil-modules' ),
                    'summary'           => $summary,
                    'content'           => $content,
                    'enabled'           => $enabled,
                    'use_main_editor'   => $use_main,
                    'elementor_page_id' => $elementor_page_id,
                ];
            }
            update_post_meta( $post_id, '_markil_custom_tabs', $tabs );
        }

        // Features Bar
        if ( isset( $_POST['_markil_features_bar'] ) && is_array( $_POST['_markil_features_bar'] ) ) {
            $fb_items = [];
            foreach ( $_POST['_markil_features_bar'] as $fb ) {
                $icon  = sanitize_text_field( wp_unslash( $fb['icon'] ?? '' ) );
                $label = sanitize_text_field( wp_unslash( $fb['label'] ?? '' ) );
                if ( $label !== '' ) {
                    $fb_items[] = [ 'icon' => $icon, 'label' => $label ];
                }
            }
            update_post_meta( $post_id, '_markil_features_bar', $fb_items );
        }

        // Sidebar Features
        if ( isset( $_POST['_markil_sidebar_features'] ) && is_array( $_POST['_markil_sidebar_features'] ) ) {
            $sf_items = [];
            foreach ( $_POST['_markil_sidebar_features'] as $sf ) {
                $icon  = sanitize_text_field( wp_unslash( $sf['icon'] ?? '' ) );
                $label = sanitize_text_field( wp_unslash( $sf['label'] ?? '' ) );
                if ( $label !== '' ) {
                    $sf_items[] = [ 'icon' => $icon, 'label' => $label ];
                }
            }
            update_post_meta( $post_id, '_markil_sidebar_features', $sf_items );
        }

        // Detail Sections
        if ( isset( $_POST['_markil_detail_sections'] ) && is_array( $_POST['_markil_detail_sections'] ) ) {
            $sections = [];
            foreach ( $_POST['_markil_detail_sections'] as $sec ) {
                $title     = sanitize_text_field( wp_unslash( $sec['title'] ?? '' ) );
                $icon      = sanitize_text_field( wp_unslash( $sec['icon'] ?? '' ) );
                $tab_index = sanitize_text_field( wp_unslash( $sec['tab_index'] ?? '' ) );
                $items     = [];
                if ( isset( $sec['items'] ) && is_array( $sec['items'] ) ) {
                    foreach ( $sec['items'] as $item ) {
                        $i_icon  = sanitize_text_field( wp_unslash( $item['icon'] ?? '' ) );
                        $i_title = sanitize_text_field( wp_unslash( $item['title'] ?? '' ) );
                        $i_desc  = sanitize_text_field( wp_unslash( $item['desc'] ?? '' ) );
                        if ( $i_title !== '' ) {
                            $items[] = [ 'icon' => $i_icon, 'title' => $i_title, 'desc' => $i_desc ];
                        }
                    }
                }
                if ( $title !== '' || ! empty( $items ) ) {
                    $sections[] = [ 'title' => $title, 'icon' => $icon, 'tab_index' => $tab_index, 'items' => $items ];
                }
            }
            update_post_meta( $post_id, '_markil_detail_sections', $sections );
        }

        // Gallery Images (stored as comma-separated attachment IDs)
        if ( isset( $_POST['_markil_gallery_images'] ) ) {
            $raw_ids = sanitize_text_field( wp_unslash( $_POST['_markil_gallery_images'] ) );
            $ids     = array_filter( array_map( 'absint', explode( ',', $raw_ids ) ) );
            update_post_meta( $post_id, '_markil_gallery_images', implode( ',', $ids ) );
        }

        if ( isset( $_POST['_markil_guarantee_text'] ) ) {
            update_post_meta( $post_id, '_markil_guarantee_text', sanitize_textarea_field( wp_unslash( $_POST['_markil_guarantee_text'] ) ) );
        }
        if ( isset( $_POST['_markil_changelog'] ) ) {
            update_post_meta( $post_id, '_markil_changelog', sanitize_textarea_field( wp_unslash( $_POST['_markil_changelog'] ) ) );
        }

        // Video
        if ( isset( $_POST['_markil_video_embed'] ) ) {
            update_post_meta( $post_id, '_markil_video_embed', wp_kses_post( wp_unslash( $_POST['_markil_video_embed'] ) ) );
        }
        update_post_meta( $post_id, '_markil_video_membership', isset( $_POST['_markil_video_membership'] ) ? '1' : '0' );
    }
}
