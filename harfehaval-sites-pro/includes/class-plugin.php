<?php
/**
 * Main plugin bootstrap.
 *
 * @package HarfehavalSitesPro
 */

defined( 'ABSPATH' ) || exit;

class HA_Sites_Pro_Plugin {

	private static ?HA_Sites_Pro_Plugin $instance = null;

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->includes();
		$this->hooks();
	}

	private function includes(): void {
		require_once HA_SITES_PRO_DIR . 'includes/class-post-type.php';
		require_once HA_SITES_PRO_DIR . 'includes/class-rest.php';
		require_once HA_SITES_PRO_DIR . 'includes/class-settings.php';
		require_once HA_SITES_PRO_DIR . 'includes/class-renderer.php';
		require_once HA_SITES_PRO_DIR . 'includes/class-elementor.php';
	}

	private function hooks(): void {
		add_action( 'init',                  [ $this, 'load_textdomain' ] );
		add_action( 'init',                  [ HA_Sites_Pro_Post_Type::class, 'register' ] );
		add_action( 'rest_api_init',         [ HA_Sites_Pro_REST::class, 'register_routes' ] );
		add_action( 'admin_init',            [ HA_Sites_Pro_Settings::class, 'register' ] );
		add_action( 'admin_menu',            [ HA_Sites_Pro_Settings::class, 'add_menu' ] );

		// Register & localize frontend assets early — required for Elementor get_style/script_depends()
		add_action( 'wp_enqueue_scripts',         [ $this, 'register_frontend_assets' ] );
		add_action( 'admin_enqueue_scripts',      [ $this, 'register_frontend_assets' ] ); // Elementor editor
		add_action( 'admin_enqueue_scripts',      [ $this, 'admin_assets' ] );

		add_shortcode( 'ha_sites_pro',       [ HA_Sites_Pro_Renderer::class, 'shortcode' ] );

		add_action( 'init',                  [ $this, 'preview_rewrite' ] );
		add_filter( 'query_vars',            [ $this, 'preview_query_vars' ] );
		add_action( 'template_redirect',     [ $this, 'preview_template' ] );

		add_action( 'elementor/widgets/register',               [ HA_Sites_Pro_Elementor::class, 'register_widgets' ] );
		add_action( 'elementor/elements/categories_registered', [ HA_Sites_Pro_Elementor::class, 'add_category' ] );
	}

	public function load_textdomain(): void {
		load_plugin_textdomain( 'harfehaval-sites-pro', false, dirname( HA_SITES_PRO_BASENAME ) . '/languages' );
	}

	/**
	 * Register AND localize frontend assets.
	 * Called early on wp_enqueue_scripts / admin_enqueue_scripts.
	 * This ensures Elementor's get_style_depends() / get_script_depends() find registered handles.
	 */
	public function register_frontend_assets(): void {
		wp_register_style(
			'ha-sites-pro-frontend',
			HA_SITES_PRO_URL . 'assets/css/frontend.css',
			[],
			HA_SITES_PRO_VERSION
		);

		wp_register_script(
			'ha-sites-pro-frontend',
			HA_SITES_PRO_URL . 'assets/js/frontend.js',
			[],
			HA_SITES_PRO_VERSION,
			true
		);

		wp_localize_script( 'ha-sites-pro-frontend', 'haSitesPro', [
			'apiBase'     => rest_url( 'ha-sites-pro/v1/' ),
			'nonce'       => wp_create_nonce( 'wp_rest' ),
			'previewBase' => home_url( '/ha-preview/' ),
			'settings'    => [
				'whatsapp'      => sanitize_text_field( HA_Sites_Pro_Settings::get( 'whatsapp' ) ),
				'whatsapp_text' => HA_Sites_Pro_Settings::get( 'whatsapp_text' ),
				'currency'      => HA_Sites_Pro_Settings::get( 'currency' ),
				'per_page'      => (int) HA_Sites_Pro_Settings::get( 'per_page' ),
			],
			'i18n' => [
				'loading'       => 'در حال بارگذاری...',
				'noResults'     => 'نتیجه‌ای یافت نشد',
				'contact'       => 'تماس بگیرید',
				'preview'       => 'پیش‌نمایش',
				'order'         => 'سفارش سایت',
				'newTab'        => 'باز در تب جدید',
				'allCategories' => 'همه دسته‌بندی‌ها',
				'allFeatures'   => 'همه ویژگی‌ها',
			],
		] );
	}

	/**
	 * Enqueue frontend assets — safe to call from within render().
	 * Assets are already registered by register_frontend_assets().
	 */
	public static function enqueue_front_assets(): void {
		wp_enqueue_style( 'ha-sites-pro-frontend' );
		wp_enqueue_script( 'ha-sites-pro-frontend' );
	}

	public function admin_assets( string $hook ): void {
		$screen = get_current_screen();
		if ( ! $screen ) return;

		$is_ha_post = ( 'ha_site' === ( $screen->post_type ?? '' ) );
		$is_ha_page = str_contains( $hook, 'ha-sites-pro' );

		if ( ! $is_ha_post && ! $is_ha_page ) return;

		wp_enqueue_style(
			'ha-sites-pro-admin',
			HA_SITES_PRO_URL . 'assets/css/admin.css',
			[],
			HA_SITES_PRO_VERSION
		);

		wp_enqueue_script(
			'ha-sites-pro-admin',
			HA_SITES_PRO_URL . 'assets/js/admin.js',
			[ 'jquery' ],
			HA_SITES_PRO_VERSION,
			true
		);
	}

	public function preview_rewrite(): void {
		add_rewrite_rule( '^ha-preview/?$', 'index.php?ha_sites_preview=1', 'top' );
	}

	public function preview_query_vars( array $vars ): array {
		$vars[] = 'ha_sites_preview';
		return $vars;
	}

	public function preview_template(): void {
		if ( get_query_var( 'ha_sites_preview' ) ) {
			$tpl = HA_SITES_PRO_DIR . 'templates/preview.php';
			if ( file_exists( $tpl ) ) {
				include $tpl;
				exit;
			}
		}
	}

	public static function activate(): void {
		HA_Sites_Pro_Post_Type::register();
		add_rewrite_rule( '^ha-preview/?$', 'index.php?ha_sites_preview=1', 'top' );
		flush_rewrite_rules();
		$defaults = [
			'ha_sites_pro_per_page'      => 12,
			'ha_sites_pro_currency'      => 'تومان',
			'ha_sites_pro_whatsapp_text' => 'سلام، می‌خواهم سایت «%s» را سفارش بدهم',
		];
		foreach ( $defaults as $key => $value ) {
			if ( ! get_option( $key ) ) {
				update_option( $key, $value );
			}
		}
	}

	public static function deactivate(): void {
		flush_rewrite_rules();
	}
}
