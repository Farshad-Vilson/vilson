<?php
/**
 * Plugin Name: سایت‌های حرف اول
 * Plugin URI:  https://harfehaval.ir
 * Description: نمایش، جستجو، فیلتر و فروش قالب‌های آماده وردپرس — با پیش‌نمایش زنده، سفارش واتساپ و پنل ادمین کامل
 * Version:     1.0.0
 * Author:      فرشاد معتمدی
 * Author URI:  https://harfehaval.ir
 * Text Domain: ha-sites
 * Domain Path: /languages
 * Requires PHP: 7.4
 * Requires at least: 5.8
 * License: GPL v2 or later
 */

defined( 'ABSPATH' ) || exit;

define( 'HA_SITES_VERSION',  '1.0.0' );
define( 'HA_SITES_DIR',      plugin_dir_path( __FILE__ ) );
define( 'HA_SITES_URL',      plugin_dir_url( __FILE__ ) );
define( 'HA_SITES_BASENAME', plugin_basename( __FILE__ ) );

final class HA_Sites_Plugin {

    private static ?HA_Sites_Plugin $instance = null;

    public static function instance(): self {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->includes();
        $this->register_components();
        $this->hooks();
    }

    private function includes(): void {
        require_once HA_SITES_DIR . 'includes/class-post-type.php';
        require_once HA_SITES_DIR . 'includes/class-admin.php';
        require_once HA_SITES_DIR . 'includes/class-rest-api.php';
        require_once HA_SITES_DIR . 'includes/class-shortcode.php';
    }

    private function register_components(): void {
        HA_Sites_Post_Type::register_all();
        HA_Sites_Admin::register();
        HA_Sites_REST_API::register();
        HA_Sites_Shortcode::register();
    }

    private function hooks(): void {
        add_action( 'init',                 [ $this, 'load_textdomain' ] );
        add_action( 'wp_enqueue_scripts',   [ $this, 'enqueue_frontend' ] );
        add_action( 'admin_enqueue_scripts',[ $this, 'enqueue_admin' ] );
        add_action( 'init',                 [ $this, 'add_rewrite_rule' ] );
        add_filter( 'query_vars',           [ $this, 'add_query_vars' ] );
        add_action( 'template_redirect',    [ $this, 'load_preview_template' ] );
        register_activation_hook( __FILE__, [ $this, 'activate' ] );
        register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );
    }

    public function load_textdomain(): void {
        load_plugin_textdomain( 'ha-sites', false, dirname( HA_SITES_BASENAME ) . '/languages' );
    }

    public function enqueue_frontend(): void {
        global $post;
        $has_shortcode = $post && has_shortcode( $post->post_content, 'ha_sites' );
        $has_preview   = (bool) get_query_var( 'ha_sites_preview' );
        if ( ! $has_shortcode && ! $has_preview ) {
            return;
        }

        wp_enqueue_style(
            'ha-sites',
            HA_SITES_URL . 'assets/css/frontend.css',
            [],
            HA_SITES_VERSION
        );

        wp_enqueue_script(
            'ha-sites',
            HA_SITES_URL . 'assets/js/frontend.js',
            [],
            HA_SITES_VERSION,
            true
        );

        $wa_text = get_option( 'ha_sites_whatsapp_text', 'سلام، می‌خواهم سایت «%s» را سفارش بدهم' );

        wp_localize_script( 'ha-sites', 'haSites', [
            'apiBase'     => rest_url( 'ha-sites/v1/' ),
            'nonce'       => wp_create_nonce( 'wp_rest' ),
            'perPage'     => (int) get_option( 'ha_sites_per_page', 12 ),
            'whatsapp'    => sanitize_text_field( get_option( 'ha_sites_whatsapp', '' ) ),
            'waText'      => $wa_text,
            'currency'    => get_option( 'ha_sites_currency', 'تومان' ),
            'previewBase' => home_url( '/ha-sites-preview/' ),
            'l10n'        => [
                'loadMore'    => 'نمایش بیشتر',
                'loading'     => 'در حال بارگذاری...',
                'noResults'   => 'نتیجه‌ای یافت نشد',
                'resetFilter' => 'بازنشانی فیلترها',
                'contact'     => 'تماس بگیرید',
                'order'       => 'سفارش',
                'viewDemo'    => 'مشاهده نمونه',
                'quickView'   => 'پیش‌نمایش سریع',
                'allCats'     => 'همه دسته‌ها',
                'allFeats'    => 'همه ویژگی‌ها',
                'showing'     => 'نمایش',
                'of'          => 'از',
                'results'     => 'نتیجه',
                'close'       => 'بستن',
                'new'         => '✨ جدید',
                'popular'     => '🔥 پرفروش',
                'featured'    => '⭐ ویژه',
                'sortNewest'  => 'جدیدترین',
                'sortOldest'  => 'قدیمی‌ترین',
                'sortPriceAsc'  => 'ارزان‌ترین',
                'sortPriceDesc' => 'گران‌ترین',
                'sortPopular'   => 'پرطرفدار',
                'searchPlaceholder' => 'جستجو در سایت‌ها...',
                'desktop' => '🖥 دسکتاپ',
                'tablet'  => '⬜ تبلت',
                'mobile'  => '📱 موبایل',
                'previewLoading' => 'در حال بارگذاری پیش‌نمایش...',
                'previewError'   => 'خطا در بارگذاری — باز کردن در تب جدید',
            ],
        ] );
    }

    public function enqueue_admin( string $hook ): void {
        $screen = get_current_screen();
        if ( ! $screen ) return;

        $on_ha_site = in_array( $screen->post_type ?? '', [ 'ha_site' ], true );
        $on_settings = ( $hook === 'ha_site_page_ha-sites-settings' );

        if ( ! $on_ha_site && ! $on_settings ) return;

        wp_enqueue_style(
            'ha-sites-admin',
            HA_SITES_URL . 'assets/css/admin.css',
            [],
            HA_SITES_VERSION
        );
    }

    public function add_rewrite_rule(): void {
        add_rewrite_rule( '^ha-sites-preview/?$', 'index.php?ha_sites_preview=1', 'top' );
    }

    public function add_query_vars( array $vars ): array {
        $vars[] = 'ha_sites_preview';
        return $vars;
    }

    public function load_preview_template(): void {
        if ( get_query_var( 'ha_sites_preview' ) ) {
            include HA_SITES_DIR . 'templates/preview.php';
            exit;
        }
    }

    public function activate(): void {
        HA_Sites_Post_Type::register_all();
        $this->add_rewrite_rule();
        flush_rewrite_rules();
        if ( ! get_option( 'ha_sites_per_page' ) ) {
            update_option( 'ha_sites_per_page', 12 );
        }
        if ( ! get_option( 'ha_sites_currency' ) ) {
            update_option( 'ha_sites_currency', 'تومان' );
        }
        if ( ! get_option( 'ha_sites_whatsapp_text' ) ) {
            update_option( 'ha_sites_whatsapp_text', 'سلام، می‌خواهم سایت «%s» را سفارش بدهم' );
        }
    }
}

HA_Sites_Plugin::instance();
