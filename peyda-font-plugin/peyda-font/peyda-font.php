<?php
/**
 * Plugin Name: فونت پیدا - Peyda Font
 * Plugin URI:  https://vilson.ir
 * Description: افزونه فونت فارسی پیدا با پشتیبانی کامل از المنتور و تنظیمات پیشرفته
 * Version:     1.1.0
 * Author:      فرشاد معتمدی‌پور
 * Text Domain: peyda-font
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PEYDA_FONT_VERSION', '1.1.0' );
define( 'PEYDA_FONT_DIR', plugin_dir_path( __FILE__ ) );
define( 'PEYDA_FONT_URL', plugin_dir_url( __FILE__ ) );
define( 'PEYDA_FONT_OPTION', 'peyda_font_settings' );
define( 'PEYDA_FONT_FAMILY', 'Peyda' );

require_once PEYDA_FONT_DIR . 'includes/class-peyda-font.php';
require_once PEYDA_FONT_DIR . 'includes/class-peyda-admin.php';
require_once PEYDA_FONT_DIR . 'includes/class-peyda-elementor.php';

function peyda_font_init() {
	$plugin = new Peyda_Font();
	$plugin->init();

	if ( is_admin() ) {
		$admin = new Peyda_Admin();
		$admin->init();
	}

	$elementor = new Peyda_Elementor();
	$elementor->init();
}
add_action( 'plugins_loaded', 'peyda_font_init' );

register_activation_hook( __FILE__, 'peyda_font_activate' );
function peyda_font_activate() {
	$defaults = array(
		'font_variant'    => 'standard',
		'enable_body'     => '1',
		'enable_h1'       => '1',
		'enable_h2'       => '1',
		'enable_h3'       => '1',
		'enable_h4'       => '1',
		'enable_h5'       => '1',
		'enable_h6'       => '1',
		'enable_p'        => '1',
		'enable_a'        => '1',
		'enable_button'   => '1',
		'enable_input'    => '1',
		'enable_textarea' => '1',
		'enable_select'   => '1',
		'enable_li'       => '0',
		'enable_span'     => '0',
		'custom_selectors' => '',
		'load_in_admin'   => '0',
	);
	if ( ! get_option( PEYDA_FONT_OPTION ) ) {
		add_option( PEYDA_FONT_OPTION, $defaults );
	}
}

register_deactivation_hook( __FILE__, 'peyda_font_deactivate' );
function peyda_font_deactivate() {}
