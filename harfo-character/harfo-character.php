<?php
/**
 * Plugin Name: حرفو — ماژول هوشمند مسکات
 * Description: کاراکتر کهکشانی هوشمند با درک صفحه، اسکرول، و تطبیق رنگ
 * Version:     10.0.0
 * Author:      حرف اول
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HARFO_VER', '10.0.0' );
define( 'HARFO_URL', plugin_dir_url( __FILE__ ) );

add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style(  'harfo', HARFO_URL . 'assets/harfo.css', [], HARFO_VER );
    wp_enqueue_script( 'harfo', HARFO_URL . 'assets/harfo.js',  [], HARFO_VER, true );
    wp_localize_script( 'harfo', 'HC', [
        'page' => [
            'is404'     => is_404(),
            'isSearch'  => is_search(),
            'isProduct' => class_exists('WooCommerce') && is_product(),
            'isShop'    => class_exists('WooCommerce') && function_exists('is_shop') && is_shop(),
            'isSingle'  => is_single(),
            'isHome'    => is_front_page() || is_home(),
        ]
    ] );
} );

add_action( 'wp_footer', function () { ?>
<div id="h-root" aria-hidden="true">

  <div id="h-umb">
    <svg viewBox="0 0 72 52" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ug" cx="50%" cy="0%" r="100%">
          <stop offset="0%"   stop-color="#2BCFC0"/>
          <stop offset="100%" stop-color="#0B2240"/>
        </radialGradient>
      </defs>
      <path d="M4 26 Q12 4 36 2 Q60 4 68 26 Z" fill="url(#ug)"/>
      <path d="M4 26 Q12 18 20 26"  fill="rgba(255,255,255,0.14)"/>
      <path d="M36 26 L36 48 Q36 54 30 54 Q24 54 24 48"
            stroke="#0B2240" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
  </div>

  <div id="h-w">
    <div id="h-glow"></div>
    <div id="h-ball" data-shape="ball">
      <div id="h-arm"></div>
      <div id="h-stars"></div>
      <div id="h-neb"></div>
      <div id="h-sheen"></div>
      <div id="h-face">
        <div class="h-eye" id="h-el"><div class="h-pu" id="h-pl"></div><div class="h-sh"></div></div>
        <div class="h-eye" id="h-er"><div class="h-pu" id="h-pr"></div><div class="h-sh"></div></div>
        <div id="h-mo"></div>
      </div>
      <!-- Shape-morphing icon overlay (for transform-to-X) -->
      <svg id="h-icon" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"></svg>
    </div>
    <div id="h-rain"></div>
    <div id="h-arm-w"></div>
  </div>

  <div id="h-fx"></div>

</div>
<?php } );
