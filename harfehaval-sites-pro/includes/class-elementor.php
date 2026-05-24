<?php
/**
 * Elementor integration.
 *
 * @package HarfehavalSitesPro
 */

defined( 'ABSPATH' ) || exit;

class HA_Sites_Pro_Elementor {

	public static function add_category( $manager ): void {
		$manager->add_category( 'harfehaval-sites', [
			'title' => __( '🌐 سایت‌های حرف اول', 'harfehaval-sites-pro' ),
			'icon'  => 'eicon-gallery-grid',
		] );
	}

	public static function register_widgets( $manager ): void {
		require_once HA_SITES_PRO_DIR . 'includes/elementor/class-sites-widget.php';
		$manager->register( new HA_Sites_Pro_Elementor_Sites_Widget() );
	}
}
