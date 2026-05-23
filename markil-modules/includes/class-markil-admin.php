<?php
namespace Markil;

if ( ! defined( 'ABSPATH' ) ) exit;

class Admin {
    public function __construct() {
        add_action( 'admin_menu', [ $this, 'add_menu' ] );
        add_action( 'admin_init', [ $this, 'register_settings' ] );
        add_filter( 'manage_markil_module_posts_columns', [ $this, 'add_columns' ] );
        add_action( 'manage_markil_module_posts_custom_column', [ $this, 'render_columns' ], 10, 2 );
        add_filter( 'manage_edit-markil_module_sortable_columns', [ $this, 'sortable_columns' ] );
        add_filter( 'post_row_actions', [ $this, 'add_row_actions' ], 10, 2 );
        add_filter( 'plugin_action_links_' . MARKIL_BASENAME, [ $this, 'add_action_links' ] );
    }

    public function sortable_columns( $cols ) {
        $cols['markil_views']    = 'markil_views';
        $cols['markil_price']    = 'markil_price';
        $cols['markil_installs'] = 'markil_installs';
        return $cols;
    }

    public function add_row_actions( $actions, $post ) {
        if ( $post->post_type !== 'markil_module' ) return $actions;
        $url = get_permalink( $post->ID );
        if ( $url ) {
            $actions['markil_preview'] = '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener">' . __( 'پیش‌نمایش سریع', 'markil-modules' ) . '</a>';
        }
        return $actions;
    }

    public function add_action_links( $links ) {
        $settings_link = '<a href="' . admin_url( 'edit.php?post_type=markil_module&page=markil-settings' ) . '">' . __( 'تنظیمات', 'markil-modules' ) . '</a>';
        array_unshift( $links, $settings_link );
        return $links;
    }

    public function add_menu() {
        add_submenu_page(
            'edit.php?post_type=markil_module',
            __( 'تنظیمات مارکیل', 'markil-modules' ),
            __( 'تنظیمات', 'markil-modules' ),
            'manage_options',
            'markil-settings',
            [ $this, 'settings_page' ]
        );
    }

    public function register_settings() {
        register_setting( 'markil_settings', 'markil_modules_per_page', [ 'type' => 'integer', 'default' => 12 ] );
        register_setting( 'markil_settings', 'markil_default_layout', [ 'type' => 'string', 'default' => 'grid' ] );
        register_setting( 'markil_settings', 'markil_currency', [ 'type' => 'string', 'default' => 'تومان' ] );
        register_setting( 'markil_settings', 'markil_show_price', [ 'type' => 'string', 'default' => '1' ] );
        register_setting( 'markil_settings', 'markil_show_rating', [ 'type' => 'string', 'default' => '1' ] );
        register_setting( 'markil_settings', 'markil_show_installs', [ 'type' => 'string', 'default' => '1' ] );
        register_setting( 'markil_settings', 'markil_wc_integration', [ 'type' => 'string', 'default' => '1' ] );
        register_setting( 'markil_settings', 'markil_primary_color', [ 'type' => 'string', 'default' => '#011627' ] );
        register_setting( 'markil_settings', 'markil_guarantee_title', [ 'type' => 'string', 'default' => 'ضمانت کیفیت خدمات' ] );
        register_setting( 'markil_settings', 'markil_guarantee_text',  [ 'type' => 'string', 'default' => 'ما کیفیت کار خود را تضمین می‌کنیم. در صورت نارضایتی، پشتیبانی تا رضایت شما ادامه دارد.' ] );
        // Detail page appearance
        register_setting( 'markil_settings', 'markil_fdc_primary_color', [ 'type' => 'string', 'default' => '#011627' ] );
        register_setting( 'markil_settings', 'markil_fdc_price_color',   [ 'type' => 'string', 'default' => '#011627' ] );
        register_setting( 'markil_settings', 'markil_fdc_price_font',    [ 'type' => 'string', 'default' => '' ] );
        register_setting( 'markil_settings', 'markil_fdc_btn_radius',    [ 'type' => 'string', 'default' => '12' ] );
        register_setting( 'markil_settings', 'markil_fdc_tab_radius',    [ 'type' => 'string', 'default' => '10' ] );
        register_setting( 'markil_settings', 'markil_fdc_google_fonts',  [ 'type' => 'string', 'default' => '' ] );
        // Contact form
        register_setting( 'markil_settings', 'markil_contact_enabled', [ 'type' => 'string', 'default' => '1' ] );
        register_setting( 'markil_settings', 'markil_contact_title',   [ 'type' => 'string', 'default' => 'سوالی درباره این ماژول دارید؟' ] );
        register_setting( 'markil_settings', 'markil_contact_sub',     [ 'type' => 'string', 'default' => 'پیام خود را ارسال کنید، در اسرع وقت پاسخ می‌دهیم.' ] );
    }

    public function settings_page() {
        $all_opts = [
            'markil_modules_per_page','markil_default_layout','markil_currency',
            'markil_show_price','markil_show_rating','markil_show_installs',
            'markil_wc_integration','markil_primary_color',
            'markil_guarantee_title','markil_guarantee_text',
            'markil_fdc_primary_color','markil_fdc_price_color','markil_fdc_price_font',
            'markil_fdc_btn_radius','markil_fdc_tab_radius','markil_fdc_google_fonts',
            'markil_contact_enabled','markil_contact_title','markil_contact_sub',
        ];
        if ( isset( $_POST['submit'] ) ) {
            check_admin_referer( 'markil-options' );
            $textarea_opts = [ 'markil_guarantee_text', 'markil_contact_sub' ];
            foreach ( $all_opts as $opt ) {
                if ( isset( $_POST[$opt] ) ) {
                    $val = in_array( $opt, $textarea_opts, true )
                        ? sanitize_textarea_field( $_POST[$opt] )
                        : sanitize_text_field( $_POST[$opt] );
                    update_option( $opt, $val );
                } else {
                    delete_option( $opt );
                }
            }
            echo '<div class="notice notice-success"><p>' . __('تنظیمات ذخیره شد','markil-modules') . '</p></div>';
        }
        ?>
        <div class="wrap">
            <h1>⚙️ <?php _e('تنظیمات مارکیل ماژول‌ها','markil-modules'); ?></h1>
            <form method="post">
                <?php wp_nonce_field('markil-options'); ?>

                <h2><?php _e('تنظیمات عمومی','markil-modules'); ?></h2>
                <table class="form-table">
                    <tr>
                        <th><?php _e('تعداد ماژول در هر صفحه','markil-modules'); ?></th>
                        <td><input type="number" name="markil_modules_per_page" value="<?php echo esc_attr(get_option('markil_modules_per_page',12)); ?>" min="1" max="100"></td>
                    </tr>
                    <tr>
                        <th><?php _e('چیدمان پیش‌فرض','markil-modules'); ?></th>
                        <td>
                            <select name="markil_default_layout">
                                <option value="grid" <?php selected(get_option('markil_default_layout'),'grid'); ?>><?php _e('شبکه‌ای','markil-modules'); ?></option>
                                <option value="list" <?php selected(get_option('markil_default_layout'),'list'); ?>><?php _e('لیستی','markil-modules'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('واحد پول','markil-modules'); ?></th>
                        <td><input type="text" name="markil_currency" value="<?php echo esc_attr(get_option('markil_currency','تومان')); ?>"></td>
                    </tr>
                    <tr>
                        <th><?php _e('نمایش قیمت','markil-modules'); ?></th>
                        <td><label><input type="checkbox" name="markil_show_price" value="1" <?php checked(get_option('markil_show_price'),'1'); ?>> <?php _e('فعال','markil-modules'); ?></label></td>
                    </tr>
                    <tr>
                        <th><?php _e('نمایش امتیاز','markil-modules'); ?></th>
                        <td><label><input type="checkbox" name="markil_show_rating" value="1" <?php checked(get_option('markil_show_rating'),'1'); ?>> <?php _e('فعال','markil-modules'); ?></label></td>
                    </tr>
                    <tr>
                        <th><?php _e('نمایش تعداد نصب','markil-modules'); ?></th>
                        <td><label><input type="checkbox" name="markil_show_installs" value="1" <?php checked(get_option('markil_show_installs'),'1'); ?>> <?php _e('فعال','markil-modules'); ?></label></td>
                    </tr>
                    <tr>
                        <th><?php _e('یکپارچه‌سازی ووکامرس','markil-modules'); ?></th>
                        <td><label><input type="checkbox" name="markil_wc_integration" value="1" <?php checked(get_option('markil_wc_integration'),'1'); ?>> <?php _e('فعال','markil-modules'); ?></label></td>
                    </tr>
                    <tr>
                        <th><?php _e('رنگ اصلی (گرید)','markil-modules'); ?></th>
                        <td><input type="color" name="markil_primary_color" value="<?php echo esc_attr(get_option('markil_primary_color','#011627')); ?>"></td>
                    </tr>
                    <tr>
                        <th><?php _e('عنوان بخش ضمانت','markil-modules'); ?></th>
                        <td><input type="text" name="markil_guarantee_title" value="<?php echo esc_attr(get_option('markil_guarantee_title','ضمانت کیفیت خدمات')); ?>" style="width:320px"></td>
                    </tr>
                    <tr>
                        <th><?php _e('متن ضمانت','markil-modules'); ?></th>
                        <td><textarea name="markil_guarantee_text" rows="3" style="width:420px"><?php echo esc_textarea(get_option('markil_guarantee_text','ما کیفیت کار خود را تضمین می‌کنیم. در صورت نارضایتی، پشتیبانی تا رضایت شما ادامه دارد.')); ?></textarea></td>
                    </tr>
                </table>

                <hr>
                <h2><?php _e('ظاهر صفحه جزئیات ماژول','markil-modules'); ?></h2>
                <p style="color:#666"><?php _e('این تنظیمات روی صفحه‌ی /markil-module/{slug}/ اعمال می‌شود.','markil-modules'); ?></p>
                <table class="form-table">
                    <tr>
                        <th><?php _e('رنگ اصلی صفحه جزئیات','markil-modules'); ?></th>
                        <td>
                            <input type="color" name="markil_fdc_primary_color" value="<?php echo esc_attr(get_option('markil_fdc_primary_color','#011627')); ?>">
                            <p class="description"><?php _e('رنگ دکمه‌ها، تب فعال و لینک‌ها در صفحه جزئیات.','markil-modules'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('رنگ قیمت','markil-modules'); ?></th>
                        <td>
                            <input type="color" name="markil_fdc_price_color" value="<?php echo esc_attr(get_option('markil_fdc_price_color','#011627')); ?>">
                            <p class="description"><?php _e('رنگ نمایش قیمت در سایدبار صفحه جزئیات.','markil-modules'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('فونت قیمت (CSS)','markil-modules'); ?></th>
                        <td>
                            <input type="text" name="markil_fdc_price_font" value="<?php echo esc_attr(get_option('markil_fdc_price_font','')); ?>" placeholder="مثال: 'IRANSans', sans-serif" style="width:320px">
                            <p class="description"><?php _e('مقدار font-family برای قیمت. اگر خالی باشد، از فونت اصلی سایت استفاده می‌شود.','markil-modules'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('لینک گوگل فونت','markil-modules'); ?></th>
                        <td>
                            <input type="url" name="markil_fdc_google_fonts" value="<?php echo esc_attr(get_option('markil_fdc_google_fonts','')); ?>" placeholder="https://fonts.googleapis.com/css2?family=..." style="width:420px">
                            <p class="description"><?php _e('لینک @import گوگل فونت — اگر از فونت سفارشی استفاده می‌کنید اینجا وارد کنید.','markil-modules'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('شعاع دکمه‌های عملیات (px)','markil-modules'); ?></th>
                        <td>
                            <input type="number" name="markil_fdc_btn_radius" value="<?php echo esc_attr(get_option('markil_fdc_btn_radius','12')); ?>" min="0" max="40" style="width:80px">
                            <span>px</span>
                            <p class="description"><?php _e('border-radius دکمه‌های «افزودن به سبد» و «جزئیات بیشتر».','markil-modules'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('شعاع دکمه‌های تب (px)','markil-modules'); ?></th>
                        <td>
                            <input type="number" name="markil_fdc_tab_radius" value="<?php echo esc_attr(get_option('markil_fdc_tab_radius','10')); ?>" min="0" max="40" style="width:80px">
                            <span>px</span>
                            <p class="description"><?php _e('border-radius تب‌های جزئیات / امکانات / سازگاری / نقد.','markil-modules'); ?></p>
                        </td>
                    </tr>
                </table>

                <hr>
                <h2><?php _e('فرم تماس ماژول','markil-modules'); ?></h2>
                <p style="color:#666"><?php _e('فرم تماس در پایین صفحه‌ی هر ماژول نمایش داده می‌شود. پیام‌ها در دیتابیس ذخیره و به ایمیل مدیر ارسال می‌گردد.','markil-modules'); ?></p>
                <table class="form-table">
                    <tr>
                        <th><?php _e('فعال‌سازی فرم تماس','markil-modules'); ?></th>
                        <td><label><input type="checkbox" name="markil_contact_enabled" value="1" <?php checked(get_option('markil_contact_enabled','1'),'1'); ?>> <?php _e('فعال','markil-modules'); ?></label></td>
                    </tr>
                    <tr>
                        <th><?php _e('عنوان فرم','markil-modules'); ?></th>
                        <td><input type="text" name="markil_contact_title" value="<?php echo esc_attr(get_option('markil_contact_title','سوالی درباره این ماژول دارید؟')); ?>" style="width:420px"></td>
                    </tr>
                    <tr>
                        <th><?php _e('زیرنویس فرم','markil-modules'); ?></th>
                        <td><textarea name="markil_contact_sub" rows="2" style="width:420px"><?php echo esc_textarea(get_option('markil_contact_sub','پیام خود را ارسال کنید، در اسرع وقت پاسخ می‌دهیم.')); ?></textarea></td>
                    </tr>
                </table>

                <p><input type="submit" name="submit" class="button button-primary" value="<?php _e('ذخیره تنظیمات','markil-modules'); ?>"></p>
            </form>
        </div>
        <?php
    }

    public function add_columns( $columns ) {
        $new = [];
        foreach ( $columns as $key => $label ) {
            $new[$key] = $label;
            if ( $key === 'title' ) {
                $new['markil_price']    = __('قیمت','markil-modules');
                $new['markil_rating']   = __('امتیاز','markil-modules');
                $new['markil_installs'] = __('نصب‌ها','markil-modules');
                $new['markil_views']    = __('بازدید','markil-modules');
                $new['markil_status']   = __('وضعیت','markil-modules');
            }
        }
        return $new;
    }

    public function render_columns( $column, $post_id ) {
        switch ( $column ) {
            case 'markil_price':
                $price = get_post_meta($post_id,'_markil_price',true);
                $free  = get_post_meta($post_id,'_markil_is_free',true);
                echo $free ? '<span style="color:green">رایگان</span>' : ( $price ? number_format($price) . ' ' . get_option('markil_currency','تومان') : '—' );
                break;
            case 'markil_rating':
                $r = get_post_meta($post_id,'_markil_rating',true);
                echo $r ? '⭐ ' . $r : '—';
                break;
            case 'markil_installs':
                $i = intval(get_post_meta($post_id,'_markil_installs',true));
                echo $i ? '+' . number_format($i) : '—';
                break;
            case 'markil_views':
                $v = intval(get_post_meta($post_id,'_markil_views',true));
                echo $v ? '👁 ' . number_format($v) : '—';
                break;
            case 'markil_status':
                $s = get_post_meta($post_id,'_markil_status',true) ?: 'active';
                $labels = ['active'=>'<span style="color:green">●</span> فعال','inactive'=>'<span style="color:red">●</span> غیرفعال','coming_soon'=>'<span style="color:orange">●</span> به زودی'];
                echo $labels[$s] ?? $s;
                break;
        }
    }
}
