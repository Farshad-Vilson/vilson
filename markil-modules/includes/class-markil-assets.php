<?php
namespace Markil;

if ( ! defined( 'ABSPATH' ) ) exit;

class Assets {
    public function __construct() {
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin' ] );
        add_action( 'elementor/frontend/after_enqueue_styles', [ $this, 'enqueue_frontend' ] );
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
