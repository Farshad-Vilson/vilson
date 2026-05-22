<?php
/**
 * Plugin Name: ماژول حرف اول
 * Plugin URI: https://markil.ir
 * Description: بهترین افزونه برای نمایش و فروش ماژول‌های وب‌سایت با المنتور - کاملاً یکپارچه با ووکامرس
 * Version: 2.6.0
 * Author: مارکیل
 * Author URI: https://markil.ir
 * Text Domain: markil-modules
 * Domain Path: /languages
 * Requires at least: 5.6
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * Elementor tested up to: 3.20
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'MARKIL_VERSION', '2.6.0' );
define( 'MARKIL_PATH', plugin_dir_path( __FILE__ ) );
define( 'MARKIL_URL', plugin_dir_url( __FILE__ ) );
define( 'MARKIL_BASENAME', plugin_basename( __FILE__ ) );

// Autoload
spl_autoload_register( function( $class ) {
    $prefix = 'Markil\\';
    if ( strpos( $class, $prefix ) !== 0 ) return;
    $relative = str_replace( '\\', '/', substr( $class, strlen( $prefix ) ) );
    $file = MARKIL_PATH . 'includes/' . $relative . '.php';
    if ( file_exists( $file ) ) require $file;
});

require_once MARKIL_PATH . 'includes/class-markil-plugin.php';

function markil_modules() {
    return \Markil\Plugin::instance();
}
markil_modules();
