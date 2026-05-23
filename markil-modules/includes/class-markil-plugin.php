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
        register_deactivation_hook( MARKIL_BASENAME, [ $this, 'deactivate' ] );
        add_filter( 'single_template', [ $this, 'load_single_template' ] );
    }

    /**
     * Override the single-post template for markil_module posts.
     * Themes can override by placing single-markil_module.php in their theme root.
     */
    public function load_single_template( $template ) {
        if ( is_singular( 'markil_module' ) ) {
            // Allow theme override
            $theme_template = locate_template( [ 'single-markil_module.php', 'markil-modules/single-markil_module.php' ] );
            if ( $theme_template ) return $theme_template;

            $plugin_template = MARKIL_PATH . 'templates/single-markil_module.php';
            if ( file_exists( $plugin_template ) ) return $plugin_template;
        }
        return $template;
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
        require_once MARKIL_PATH . 'includes/class-markil-engagement.php';

        new Assets();
        new Ajax();
        new Admin();
        new MetaBoxes();
        new Engagement();
        add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );

        if ( did_action( 'elementor/loaded' ) ) {
            require_once MARKIL_PATH . 'includes/class-markil-elementor.php';
            new Elementor();
        }
    }

    public function register_rest_routes() {
        register_rest_route( 'markil/v1', '/modules', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'rest_get_modules' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'per_page' => [ 'type' => 'integer', 'default' => 12, 'minimum' => 1, 'maximum' => 100 ],
                'page'     => [ 'type' => 'integer', 'default' => 1,  'minimum' => 1 ],
                'category' => [ 'type' => 'string',  'default' => '' ],
                'search'   => [ 'type' => 'string',  'default' => '' ],
            ],
        ]);
        register_rest_route( 'markil/v1', '/modules/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'rest_get_module' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => [ 'type' => 'integer', 'required' => true ],
            ],
        ]);
    }

    public function rest_get_modules( \WP_REST_Request $request ) {
        $args = [
            'post_type'      => 'markil_module',
            'post_status'    => 'publish',
            'posts_per_page' => $request->get_param( 'per_page' ),
            'paged'          => $request->get_param( 'page' ),
            'no_found_rows'  => false,
        ];
        $search = $request->get_param( 'search' );
        if ( $search ) $args['s'] = $search;
        $cat = $request->get_param( 'category' );
        if ( $cat ) {
            $args['tax_query'] = [[ 'taxonomy' => 'markil_category', 'field' => 'slug', 'terms' => $cat ]];
        }
        $q = new \WP_Query( $args );
        $ajax = new Ajax();
        $items = [];
        foreach ( $q->posts as $post ) {
            $items[] = $ajax->format_module( $post->ID );
        }
        return new \WP_REST_Response([
            'items'       => $items,
            'total'       => $q->found_posts,
            'total_pages' => $q->max_num_pages,
        ], 200);
    }

    public function rest_get_module( \WP_REST_Request $request ) {
        $id   = absint( $request->get_param( 'id' ) );
        $post = get_post( $id );
        if ( ! $post || $post->post_type !== 'markil_module' || $post->post_status !== 'publish' ) {
            return new \WP_REST_Response( [ 'error' => 'Not found' ], 404 );
        }
        $ajax = new Ajax();
        return new \WP_REST_Response( $ajax->format_module( $id, true ), 200 );
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

    public function deactivate() {
        flush_rewrite_rules();
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
