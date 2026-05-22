<?php
namespace Markil;

if ( ! defined( 'ABSPATH' ) ) exit;

class Assets {
    public function __construct() {
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin' ] );
        add_action( 'elementor/frontend/after_enqueue_styles', [ $this, 'enqueue_frontend' ] );
        add_action( 'wp_head', [ $this, 'output_detail_page_styles' ] );
    }

    public function enqueue_frontend() {
        wp_enqueue_style(
            'markil-modules-frontend',
            MARKIL_URL . 'assets/css/frontend.css',
            [],
            MARKIL_VERSION
        );
        wp_enqueue_script(
            'markil-modules-frontend',
            MARKIL_URL . 'assets/js/frontend.js',
            [ 'jquery' ],
            MARKIL_VERSION,
            true
        );
        wp_localize_script( 'markil-modules-frontend', 'MarkilModules', [
            'ajax_url'   => admin_url( 'admin-ajax.php' ),
            'nonce'      => wp_create_nonce( 'markil_modules_nonce' ),
            'loading'    => __( 'در حال بارگذاری...', 'markil-modules' ),
            'no_results' => __( 'ماژولی یافت نشد', 'markil-modules' ),
            'currency'   => get_option( 'markil_currency', 'تومان' ),
        ]);
    }

    /**
     * Output inline CSS variables for the detail page appearance settings.
     * Only outputs on markil_module single pages and pages that embed the widget.
     */
    public function output_detail_page_styles() {
        $primary    = sanitize_hex_color( get_option( 'markil_fdc_primary_color', '' ) );
        $price_clr  = sanitize_hex_color( get_option( 'markil_fdc_price_color',   '' ) );
        $price_font = get_option( 'markil_fdc_price_font',   '' );
        $btn_r      = intval( get_option( 'markil_fdc_btn_radius', 12 ) );
        $tab_r      = intval( get_option( 'markil_fdc_tab_radius', 10 ) );
        $gfonts     = esc_url_raw( get_option( 'markil_fdc_google_fonts', '' ) );

        // Build CSS variable overrides only when there's something to override
        $vars = [];
        if ( $primary )    $vars[] = '--markil-fdc-primary: ' . $primary . ';';
        if ( $price_clr )  $vars[] = '--markil-fdc-price-color: ' . $price_clr . ';';
        if ( $price_font ) $vars[] = '--markil-fdc-price-font: ' . esc_html( $price_font ) . ';';
        if ( $btn_r !== 12 ) $vars[] = '--markil-fdc-btn-radius: ' . $btn_r . 'px;';
        if ( $tab_r !== 10 ) $vars[] = '--markil-fdc-tab-radius: ' . $tab_r . 'px;';

        if ( empty( $vars ) && ! $gfonts ) return;

        echo "\n<!-- Markil Modules: detail page appearance -->\n";

        if ( $gfonts ) {
            echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
            echo '<link rel="stylesheet" href="' . esc_attr( $gfonts ) . '">' . "\n";
        }

        if ( ! empty( $vars ) ) {
            echo '<style>.markil-full-detail-wrap{' . implode( ' ', $vars ) . '}</style>' . "\n";
        }
    }

    public function enqueue_admin( $hook ) {
        wp_enqueue_style(
            'markil-modules-admin',
            MARKIL_URL . 'assets/css/admin.css',
            [],
            MARKIL_VERSION
        );
        wp_enqueue_script(
            'markil-modules-admin',
            MARKIL_URL . 'assets/js/admin.js',
            [ 'jquery', 'wp-color-picker' ],
            MARKIL_VERSION,
            true
        );
        wp_enqueue_style( 'wp-color-picker' );

        // Gallery uploader + rich tab editors - only on markil_module edit pages
        global $post_type;
        if ( in_array( $hook, [ 'post.php', 'post-new.php' ], true ) && 'markil_module' === $post_type ) {
            wp_enqueue_media();
            // Make sure wp.editor.initialize() works for dynamic tabs
            if ( function_exists( 'wp_enqueue_editor' ) ) {
                wp_enqueue_editor();
            }
            wp_enqueue_script(
                'markil-admin-gallery',
                MARKIL_URL . 'assets/js/admin-gallery.js',
                [ 'jquery', 'media-views' ],
                MARKIL_VERSION,
                true
            );
        }
    }
}
