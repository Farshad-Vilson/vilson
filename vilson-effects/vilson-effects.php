<?php
/**
 * Plugin Name: Vilson Effects — Murmuration
 * Description: گله ذرات زنده با هوش دسته‌جمعی + ریسه میسلیوم روی محتوای صفحه
 * Version:     2.0.0
 * Author:      حرف اول
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'VFX_VER', '2.0.0' );
define( 'VFX_URL', plugin_dir_url( __FILE__ ) );

add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_script( 'vfx', VFX_URL . 'assets/effects.js', [], VFX_VER, true );
});
