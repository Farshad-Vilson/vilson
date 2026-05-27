<?php
/**
 * Plugin Name: حرفو — مسکات هوشمند حرف اول
 * Plugin URI:  https://harfeavval.ir
 * Description: کاراکتر H1 متحرک و هوشمند - مسکات برند حرف اول
 * Version:     8.0.0
 * Author:      حرف اول
 * Text Domain: harfo
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HARFO_VER',  '8.0.0' );
define( 'HARFO_URL',  plugin_dir_url( __FILE__ ) );
define( 'HARFO_PATH', plugin_dir_path( __FILE__ ) );

add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'harfo-style',
        HARFO_URL . 'assets/harfo.css',
        [],
        HARFO_VER
    );
    wp_enqueue_script(
        'harfo-js',
        HARFO_URL . 'assets/harfo.js',
        [],
        HARFO_VER,
        true
    );
    wp_localize_script( 'harfo-js', 'HarfoConfig', [
        'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
        'siteUrl'   => get_site_url(),
        'isRTL'     => is_rtl(),
        'lang'      => get_locale(),
        'pluginUrl' => HARFO_URL,
    ] );
} );

add_action( 'wp_footer', function () { ?>
<div id="harfo-root" aria-hidden="true" role="presentation">
  <div id="harfo-w">

    <svg id="h1-char"
         viewBox="0 0 90 107"
         width="90" height="107"
         xmlns="http://www.w3.org/2000/svg"
         overflow="visible">

      <!-- H — Dark Navy #0B2240 -->
      <rect x="3"  y="4"  width="14" height="36" rx="3" fill="#0B2240"/>
      <rect x="37" y="4"  width="14" height="36" rx="3" fill="#0B2240"/>
      <rect x="3"  y="24" width="48" height="14" rx="2" fill="#0B2240"/>

      <!-- Face -->
      <circle cx="12" cy="31" r="3"   fill="white"/>
      <circle cx="42" cy="31" r="3"   fill="white"/>
      <path d="M9 36 Q27 44 45 36"
            stroke="white" stroke-width="2.2"
            fill="none" stroke-linecap="round"/>

      <!-- Arms -->
      <g class="arm-l">
        <rect x="-13" y="10" width="18" height="9" rx="3" fill="#0B2240"/>
      </g>
      <g class="arm-r">
        <rect x="49" y="10" width="18" height="9" rx="3" fill="#0B2240"/>
      </g>

      <!-- H Left leg + foot -->
      <g class="leg-l">
        <rect x="3"  y="38" width="14" height="30" rx="3" fill="#0B2240"/>
        <rect x="1"  y="65" width="18" height="9"  rx="4" fill="#0B2240"/>
      </g>

      <!-- H Right leg + foot -->
      <g class="leg-r">
        <rect x="37" y="38" width="14" height="30" rx="3" fill="#0B2240"/>
        <rect x="35" y="65" width="18" height="9"  rx="4" fill="#0B2240"/>
      </g>

      <!-- 1 — Teal #2BCFC0 -->
      <rect x="58" y="7"  width="17" height="9"  rx="3" fill="#2BCFC0"
            transform="rotate(-38 67 11)"/>
      <rect x="62" y="9"  width="14" height="52" rx="3" fill="#2BCFC0"/>
      <rect x="56" y="59" width="22" height="9"  rx="4" fill="#2BCFC0"/>

      <!-- 1 Leg + foot -->
      <g class="leg-one">
        <rect x="64" y="66" width="12" height="24" rx="3" fill="#2BCFC0"/>
        <rect x="62" y="87" width="16" height="8"  rx="4" fill="#2BCFC0"/>
      </g>

    </svg>

    <div id="harfo-bubble"></div>
    <div id="harfo-menu"></div>

  </div>
</div>
<?php } );
