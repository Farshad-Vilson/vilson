<?php
namespace Markil;

if ( ! defined( 'ABSPATH' ) ) exit;

class Plugin {
    private static $_instance = null;

    public static function instance() {
        if ( is_null( self::$_instance ) ) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }

    public function __construct() {
        add_action( 'init', [ $this, 'init' ] );
        add_action( 'plugins_loaded', [ $this, 'plugins_loaded' ] );
        register_activation_hook( MARKIL_BASENAME, [ $this, 'activate' ] );
    }

    public function init() {
        load_plugin_textdomain( 'markil-modules', false, dirname( MARKIL_BASENAME ) . '/languages' );
        $this->register_post_types();
        $this->register_taxonomies();
    }

    public function plugins_loaded() {
        require_once MARKIL_PATH . 'includes/class-markil-assets.php';
        require_once MARKIL_PATH . 'includes/class-markil-ajax.php';
        require_once MARKIL_PATH . 'includes/class-markil-admin.php';
        require_once MARKIL_PATH . 'includes/class-markil-meta-boxes.php';

        new Assets();
        new Ajax();
        new Admin();
        new MetaBoxes();

        if ( did_action( 'elementor/loaded' ) ) {
            require_once MARKIL_PATH . 'includes/class-markil-elementor.php';
            new Elementor();
        }
    }

    public function register_post_types() {
        register_post_type( 'markil_module', [
            'labels' => [
                'name'               => __( 'ماژول‌ها', 'markil-modules' ),
                'singular_name'      => __( 'ماژول', 'markil-modules' ),
                'add_new'            => __( 'افزودن ماژول', 'markil-modules' ),
                'add_new_item'       => __( 'افزودن ماژول جدید', 'markil-modules' ),
                'edit_item'          => __( 'ویرایش ماژول', 'markil-modules' ),
                'new_item'           => __( 'ماژول جدید', 'markil-modules' ),
                'view_item'          => __( 'مشاهده ماژول', 'markil-modules' ),
                'search_items'       => __( 'جستجو در ماژول‌ها', 'markil-modules' ),
                'not_found'          => __( 'ماژولی یافت نشد', 'markil-modules' ),
                'menu_name'          => __( 'مارکیل ماژول‌ها', 'markil-modules' ),
            ],
            'public'             => true,
            'publicly_queryable' => true,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'query_var'          => true,
            'rewrite'            => [ 'slug' => 'markil-module' ],
            'capability_type'    => 'post',
            'has_archive'        => true,
            'hierarchical'       => false,
            'menu_position'      => 25,
            'menu_icon'          => 'dashicons-layout',
            'supports'           => [ 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields', 'revisions' ],
            'show_in_rest'       => true,
        ]);
    }

    public function register_taxonomies() {
        // دسته‌بندی ماژول
        register_taxonomy( 'markil_category', 'markil_module', [
            'labels' => [
                'name'              => __( 'دسته‌بندی‌ها', 'markil-modules' ),
                'singular_name'     => __( 'دسته‌بندی', 'markil-modules' ),
                'add_new_item'      => __( 'افزودن دسته جدید', 'markil-modules' ),
                'edit_item'         => __( 'ویرایش دسته', 'markil-modules' ),
                'search_items'      => __( 'جستجو در دسته‌ها', 'markil-modules' ),
                'all_items'         => __( 'همه دسته‌ها', 'markil-modules' ),
            ],
            'hierarchical'      => true,
            'show_ui'           => true,
            'show_admin_column' => true,
            'query_var'         => true,
            'rewrite'           => [ 'slug' => 'markil-category' ],
            'show_in_rest'      => true,
        ]);

        // برچسب‌ها
        register_taxonomy( 'markil_tag', 'markil_module', [
            'labels' => [
                'name'              => __( 'برچسب‌ها', 'markil-modules' ),
                'singular_name'     => __( 'برچسب', 'markil-modules' ),
                'add_new_item'      => __( 'افزودن برچسب جدید', 'markil-modules' ),
                'edit_item'         => __( 'ویرایش برچسب', 'markil-modules' ),
                'search_items'      => __( 'جستجو در برچسب‌ها', 'markil-modules' ),
                'all_items'         => __( 'همه برچسب‌ها', 'markil-modules' ),
            ],
            'hierarchical'      => false,
            'show_ui'           => true,
            'show_admin_column' => true,
            'query_var'         => true,
            'rewrite'           => [ 'slug' => 'markil-tag' ],
            'show_in_rest'      => true,
        ]);
    }

    public function activate() {
        $this->register_post_types();
        $this->register_taxonomies();
        flush_rewrite_rules();
        $this->set_default_options();
    }

    private function set_default_options() {
        $defaults = [
            'markil_modules_per_page'   => 12,
            'markil_default_layout'     => 'grid',
            'markil_currency'           => 'تومان',
            'markil_show_price'         => '1',
            'markil_show_rating'        => '1',
            'markil_show_installs'      => '1',
            'markil_wc_integration'     => '1',
        ];
        foreach ( $defaults as $key => $value ) {
            if ( false === get_option( $key ) ) {
                update_option( $key, $value );
            }
        }
    }
}
