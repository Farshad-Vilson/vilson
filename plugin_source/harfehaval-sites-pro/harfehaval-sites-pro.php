<?php
/**
 * Plugin Name: سایت‌های حرف اول Pro
 * Plugin URI:  https://harfehaval.ir
 * Description: نمایش حرفه‌ای نمونه‌سایت‌ها با استایل صفحه اصلی حرف اول، کارت‌های نمونه‌کار، فیلتر، جستجو، اسکرول hover، مودال پیش‌نمایش، تب‌های توضیحات، مقایسه، علاقه‌مندی و ویجت کامل المنتور.
 * Version:     3.7.1
 * Author:      فرشاد معتمدی
 * Author URI:  https://harfehaval.ir
 * Update URI:  false
 * Text Domain: harfehaval-sites-pro
 * Domain Path: /languages
 * Requires PHP: 7.4
 * Requires at least: 5.8
 * Elementor tested up to: 3.30.0
 * Elementor requires at least: 3.5.0
 * License: GPL v2 or later
 */

defined( 'ABSPATH' ) || exit;

define( 'HA_SITES_PRO_VERSION',  '3.7.1' );
define( 'HA_SITES_PRO_FILE',     __FILE__ );
define( 'HA_SITES_PRO_DIR',      plugin_dir_path( __FILE__ ) );
define( 'HA_SITES_PRO_URL',      plugin_dir_url( __FILE__ ) );
define( 'HA_SITES_PRO_BASENAME', plugin_basename( __FILE__ ) );

require_once HA_SITES_PRO_DIR . 'includes/class-plugin.php';

register_activation_hook( __FILE__,   array( 'HA_Sites_Pro_Plugin', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'HA_Sites_Pro_Plugin', 'deactivate' ) );

HA_Sites_Pro_Plugin::instance();
