<?php
namespace Markil;

if ( ! defined( 'ABSPATH' ) ) exit;

class Admin {
    public function __construct() {
        add_action( 'admin_menu', [ $this, 'add_menu' ] );
        add_action( 'admin_init', [ $this, 'register_settings' ] );
        add_filter( 'manage_markil_module_posts_columns', [ $this, 'add_columns' ] );
        add_action( 'manage_markil_module_posts_custom_column', [ $this, 'render_columns' ], 10, 2 );
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
    }

    public function settings_page() {
        if ( isset( $_POST['submit'] ) ) {
            check_admin_referer( 'markil-options' );
            foreach ( [
                'markil_modules_per_page','markil_default_layout','markil_currency',
                'markil_show_price','markil_show_rating','markil_show_installs',
                'markil_wc_integration','markil_primary_color'
            ] as $opt ) {
                if ( isset( $_POST[$opt] ) ) update_option( $opt, sanitize_text_field( $_POST[$opt] ) );
                else delete_option( $opt );
            }
            echo '<div class="notice notice-success"><p>' . __('تنظیمات ذخیره شد','markil-modules') . '</p></div>';
        }
        ?>
        <div class="wrap">
            <h1>⚙️ <?php _e('تنظیمات مارکیل ماژول‌ها','markil-modules'); ?></h1>
            <form method="post">
                <?php wp_nonce_field('markil-options'); ?>
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
                        <th><?php _e('رنگ اصلی','markil-modules'); ?></th>
                        <td><input type="color" name="markil_primary_color" value="<?php echo esc_attr(get_option('markil_primary_color','#011627')); ?>"></td>
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
            case 'markil_status':
                $s = get_post_meta($post_id,'_markil_status',true) ?: 'active';
                $labels = ['active'=>'<span style="color:green">●</span> فعال','inactive'=>'<span style="color:red">●</span> غیرفعال','coming_soon'=>'<span style="color:orange">●</span> به زودی'];
                echo $labels[$s] ?? $s;
                break;
        }
    }
}
