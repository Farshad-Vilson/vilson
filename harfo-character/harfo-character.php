<?php
/**
 * Plugin Name: حرفو — توپ کهکشانی هوشمند
 * Plugin URI:  https://harfeavval.ir
 * Description: مسکات تعاملی — توپ کهکشانی با فیزیک، باران، و چتر
 * Version:     9.1.0
 * Author:      حرف اول
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HARFO_VER',  '9.1.0' );
define( 'HARFO_URL',  plugin_dir_url( __FILE__ ) );

add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style(  'harfo', HARFO_URL . 'assets/harfo.css', [], HARFO_VER );
    wp_enqueue_script( 'harfo', HARFO_URL . 'assets/harfo.js',  [], HARFO_VER, true );
    wp_localize_script( 'harfo', 'HC', [
        'page' => [
            'is404'     => is_404(),
            'isSearch'  => is_search(),
            'isProduct' => class_exists('WooCommerce') && is_product(),
            'isSingle'  => is_single(),
        ]
    ] );
} );

add_action( 'wp_footer', function () { ?>
<div id="h-root" aria-hidden="true">

  <!-- Umbrella: direct child of h-root so position:fixed works correctly -->
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
      <path d="M26 26 Q30 20 36 26" fill="rgba(255,255,255,0.08)"/>
      <line x1="36" y1="2"  x2="36" y2="26" stroke="rgba(255,255,255,0.25)" stroke-width="0.8"/>
      <line x1="20" y1="4"  x2="20" y2="26" stroke="rgba(255,255,255,0.18)" stroke-width="0.8"/>
      <line x1="52" y1="4"  x2="52" y2="26" stroke="rgba(255,255,255,0.18)" stroke-width="0.8"/>
      <path d="M36 26 L36 48 Q36 54 30 54 Q24 54 24 48"
            stroke="#0B2240" stroke-width="3" fill="none"
            stroke-linecap="round"/>
    </svg>
  </div>

  <!-- Character wrapper (physics-positioned by JS) — hidden until JS is ready -->
  <div id="h-w">
    <div id="h-glow"></div>
    <div id="h-ball">
      <div id="h-arm"></div>
      <div id="h-stars"></div>
      <div id="h-neb"></div>
      <div id="h-sheen"></div>
      <div id="h-face">
        <div class="h-eye" id="h-el">
          <div class="h-pu" id="h-pl"></div>
          <div class="h-sh"></div>
        </div>
        <div class="h-eye" id="h-er">
          <div class="h-pu" id="h-pr"></div>
          <div class="h-sh"></div>
        </div>
        <div id="h-mo"></div>
      </div>
    </div>
    <!-- Rain drops overlay (aligned on ball) -->
    <div id="h-rain"></div>
    <!-- Exit-intent wave arm -->
    <div id="h-arm-w"></div>
  </div>

  <!-- Particles: OUTSIDE #h-w to avoid transform stacking context bug -->
  <div id="h-fx"></div>

</div>
<?php } );
