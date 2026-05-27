<?php
/**
 * Plugin Name: حرفو — توپ کهکشانی هوشمند
 * Plugin URI:  https://harfeavval.ir
 * Description: مسکات تعاملی H1 — توپ کهکشانی با فیزیک، باران، و چتر
 * Version:     9.0.0
 * Author:      حرف اول
 * Text Domain: harfo
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HARFO_VER',  '9.0.0' );
define( 'HARFO_URL',  plugin_dir_url( __FILE__ ) );

add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style(  'harfo', HARFO_URL . 'assets/harfo.css', [], HARFO_VER );
    wp_enqueue_script( 'harfo', HARFO_URL . 'assets/harfo.js',  [], HARFO_VER, true );
    wp_localize_script( 'harfo', 'HC', [
        'isRTL' => is_rtl(),
        'lang'  => substr( get_locale(), 0, 2 ),
        'url'   => HARFO_URL,
        'page'  => [
            'is404'    => is_404(),
            'isSearch' => is_search(),
            'isShop'   => class_exists('WooCommerce') && is_shop(),
            'isProduct'=> class_exists('WooCommerce') && is_product(),
            'isSingle' => is_single(),
        ]
    ] );
} );

add_action( 'wp_footer', function () { ?>
<div id="h-root" aria-hidden="true">

  <!-- ── Umbrella (draggable, appears on rain) ────────── -->
  <div id="h-umb">
    <svg viewBox="0 0 72 52" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ug" cx="50%" cy="0%" r="100%">
          <stop offset="0%"   stop-color="#2BCFC0"/>
          <stop offset="100%" stop-color="#0B2240"/>
        </radialGradient>
      </defs>
      <!-- canopy -->
      <path d="M4 26 Q12 4 36 2 Q60 4 68 26 Z" fill="url(#ug)"/>
      <path d="M4 26 Q12 18 20 26"  fill="rgba(255,255,255,0.12)"/>
      <path d="M26 26 Q30 20 36 26" fill="rgba(255,255,255,0.08)"/>
      <!-- ribs -->
      <path d="M36 2 L36 26" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" fill="none"/>
      <path d="M20 4 L20 26" stroke="rgba(255,255,255,0.2)" stroke-width="0.8" fill="none"/>
      <path d="M52 4 L52 26" stroke="rgba(255,255,255,0.2)" stroke-width="0.8" fill="none"/>
      <!-- handle -->
      <path d="M36 26 L36 48 Q36 54 30 54 Q24 54 24 48"
            stroke="#0B2240" stroke-width="3" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>

  <!-- ── Character wrapper (physics-positioned) ───────── -->
  <div id="h-w">

    <!-- outer glow (doesn't squish) -->
    <div id="h-glow"></div>

    <!-- The jelly ball (squishes) -->
    <div id="h-ball">
      <!-- Galaxy layers -->
      <div id="h-arm"></div>
      <div id="h-stars"></div>
      <div id="h-neb"></div>
      <!-- Glossy sheen -->
      <div id="h-sheen"></div>
      <!-- Face -->
      <div id="h-face">
        <div class="h-eye" id="h-el">
          <div class="h-pu"  id="h-pl"></div>
          <div class="h-sh"></div>
        </div>
        <div class="h-eye" id="h-er">
          <div class="h-pu"  id="h-pr"></div>
          <div class="h-sh"></div>
        </div>
        <div id="h-mo"></div>
      </div>
    </div>

    <!-- Rain drops (clipped to ball area) -->
    <div id="h-rain"></div>
    <!-- Particle FX -->
    <div id="h-fx"></div>

  </div><!-- /h-w -->

</div><!-- /h-root -->
<?php } );
