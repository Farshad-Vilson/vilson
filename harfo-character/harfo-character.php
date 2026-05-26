<?php
/**
 * Plugin Name: حرفو v5 — راهنمای هوشمند مستقل حرف اول
 * Description: کاراکتر ژله‌ای کاملاً مستقل که سایت را با مشتری می‌گردد، روی المنت‌ها می‌نشیند، کش می‌آید، کارهای مفید انجام می‌دهد. صفر وابستگی خارجی.
 * Version:     5.0.0
 * Author:      حرف اول
 * Text Domain: harfo
 */
if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HARFO_VER', '5.0.0' );
define( 'HARFO_URL', plugin_dir_url( __FILE__ ) );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(  'harfo', HARFO_URL . 'assets/harfo.css', [], HARFO_VER );
	wp_enqueue_script( 'harfo', HARFO_URL . 'assets/harfo.js',  [], HARFO_VER, true );
} );

add_action( 'wp_footer', function () { ?>
<div id="harfo-root" aria-hidden="true" dir="rtl">
  <div id="harfo-w">
    <div id="h-hud"><p id="h-msg"></p><div id="h-acts"></div></div>
    <div id="h-zzz"><b>Z</b><b>z</b><b>z</b></div>
    <svg id="h-jelly" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="jgB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#5BE8DA"/><stop offset="50%" stop-color="#2BCFC0"/><stop offset="100%" stop-color="#16A89A"/>
        </linearGradient>
        <linearGradient id="jgH" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.9)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </linearGradient>
        <radialGradient id="jgF" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#0E2638"/><stop offset="70%" stop-color="#06121E"/><stop offset="100%" stop-color="#020812"/>
        </radialGradient>
        <filter id="jgG" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="jgS" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dy="4" result="o"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path id="h-body" d="" fill="url(#jgB)" filter="url(#jgS)"/>
      <path id="h-hl" d="" fill="url(#jgH)" opacity="0.55"/>
      <g id="h-face">
        <ellipse id="h-face-bg" cx="100" cy="80" rx="56" ry="40" fill="url(#jgF)"/>
        <ellipse cx="78" cy="68" rx="28" ry="10" fill="rgba(255,255,255,0.06)"/>
        <g id="h-eyes" filter="url(#jgG)">
          <g class="fe fe-n"><ellipse cx="78" cy="80" rx="6" ry="9" fill="#5BE8DA"/><ellipse cx="122" cy="80" rx="6" ry="9" fill="#5BE8DA"/></g>
          <g class="fe fe-s"><path d="M70,80 Q78,86 86,80" stroke="#5BE8DA" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M114,80 Q122,86 130,80" stroke="#5BE8DA" stroke-width="3" fill="none" stroke-linecap="round"/></g>
          <g class="fe fe-x"><circle cx="78" cy="80" r="10" fill="none" stroke="#5BE8DA" stroke-width="3"/><circle cx="122" cy="80" r="10" fill="none" stroke="#5BE8DA" stroke-width="3"/></g>
          <g class="fe fe-r"><path d="M70,78 Q78,75 86,78 Q78,84 70,78" fill="#5BE8DA"/><path d="M114,78 Q122,75 130,78 Q122,84 114,78" fill="#5BE8DA"/></g>
          <g class="fe fe-w"><ellipse cx="78" cy="80" rx="6" ry="9" fill="#5BE8DA"/><path d="M114,80 Q122,86 130,80" stroke="#5BE8DA" stroke-width="3" fill="none" stroke-linecap="round"/></g>
          <g class="fe fe-d"><path d="M70,75 L86,85 M86,75 L70,85" stroke="#5BE8DA" stroke-width="3" stroke-linecap="round"/><path d="M114,75 L130,85 M130,75 L114,85" stroke="#5BE8DA" stroke-width="3" stroke-linecap="round"/></g>
        </g>
        <g id="h-mouth" filter="url(#jgG)">
          <path class="fm fm-smile" d="M85,98 Q100,108 115,98" stroke="#5BE8DA" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <ellipse class="fm fm-o" cx="100" cy="102" rx="5" ry="7" fill="none" stroke="#5BE8DA" stroke-width="2.5"/>
          <path class="fm fm-flat" d="M88,102 L112,102" stroke="#5BE8DA" stroke-width="2.5" stroke-linecap="round"/>
          <path class="fm fm-grin" d="M82,98 Q100,116 118,98 Q100,108 82,98 Z" fill="#5BE8DA"/>
        </g>
      </g>
    </svg>
    <button id="h-close" aria-label="پنهان">×</button>
  </div>
  <div id="h-restore" role="button" tabindex="0" aria-label="نمایش حرفو"><span>H</span></div>
  <div id="h-toast"></div>
</div>
<?php } );
