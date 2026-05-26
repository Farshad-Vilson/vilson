<?php
/**
 * Plugin Name: حرفو v4 — ژله هوشمند کشسان حرف اول
 * Plugin URI:  https://harfaval.com
 * Description: کاراکتر ژله‌ای کشسان با صورت گلَسی، خواندن محتوا، خلاصه‌سازی، کمک هوشمند و فیزیک نرم.
 * Version:     4.0.0
 * Author:      حرف اول
 * Text Domain: harfo
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HARFO_VER', '4.0.0' );
define( 'HARFO_URL', plugin_dir_url( __FILE__ ) );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(  'harfo', HARFO_URL . 'assets/harfo.css', [], HARFO_VER );
	wp_enqueue_script( 'harfo', HARFO_URL . 'assets/harfo.js',  [], HARFO_VER, true );
} );

add_action( 'wp_footer', function () { ?>
<div id="harfo-root" aria-hidden="true" dir="rtl">

  <div id="harfo-w" class="hs-loading">

    <div id="h-hud">
      <div id="h-dots"><i></i><i></i><i></i></div>
      <p id="h-msg"></p>
      <div id="h-acts"></div>
    </div>

    <div id="h-zzz" aria-hidden="true">
      <b class="hz">Z</b><b class="hz">z</b><b class="hz">z</b>
    </div>

    <svg id="h-jelly" viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="jg-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="#5BE8DA"/>
          <stop offset="45%"  stop-color="#2BCFC0"/>
          <stop offset="100%" stop-color="#16A89A"/>
        </linearGradient>
        <linearGradient id="jg-hl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stop-color="rgba(255,255,255,0.85)"/>
          <stop offset="60%" stop-color="rgba(255,255,255,0.15)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </linearGradient>
        <radialGradient id="jg-face" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stop-color="#0E2638"/>
          <stop offset="70%"  stop-color="#06121E"/>
          <stop offset="100%" stop-color="#020812"/>
        </radialGradient>
        <filter id="jg-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="jg-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="0" dy="6" result="o"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <path id="h-body"
        d="M100,30 C140,30 160,60 160,100 C160,130 145,150 130,165 C120,175 115,195 120,220 C125,250 145,265 145,285 C145,305 125,315 100,315 C75,315 55,305 55,285 C55,265 75,250 80,220 C85,195 80,175 70,165 C55,150 40,130 40,100 C40,60 60,30 100,30 Z"
        fill="url(#jg-body)" filter="url(#jg-shadow)"/>

      <ellipse id="h-fin-l" cx="38" cy="135" rx="14" ry="22" fill="url(#jg-body)" opacity="0.78" transform="rotate(-18 38 135)"/>
      <ellipse id="h-fin-r" cx="162" cy="135" rx="14" ry="22" fill="url(#jg-body)" opacity="0.78" transform="rotate(18 162 135)"/>

      <path id="h-hl" d="M75,50 C95,40 115,42 125,55 C130,80 115,95 100,100 C85,95 70,80 75,50 Z" fill="url(#jg-hl)" opacity="0.65"/>

      <g id="h-logo" opacity="0.18" transform="translate(75,180)">
        <rect x="0"  y="0"  width="10" height="46" rx="2" fill="#ffffff"/>
        <rect x="30" y="0"  width="10" height="46" rx="2" fill="#ffffff"/>
        <rect x="0"  y="18" width="40" height="10" fill="#ffffff"/>
      </g>

      <ellipse id="h-face-bg" cx="100" cy="92" rx="58" ry="42" fill="url(#jg-face)"/>
      <ellipse id="h-face-gloss" cx="80" cy="78" rx="32" ry="14" fill="rgba(255,255,255,0.08)"/>

      <g id="h-eyes" filter="url(#jg-glow)">
        <g class="fe fe-n">
          <ellipse cx="78"  cy="92" rx="6" ry="9" fill="#5BE8DA"/>
          <ellipse cx="122" cy="92" rx="6" ry="9" fill="#5BE8DA"/>
        </g>
        <g class="fe fe-s">
          <path d="M70,92 Q78,98 86,92" stroke="#5BE8DA" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M114,92 Q122,98 130,92" stroke="#5BE8DA" stroke-width="3" fill="none" stroke-linecap="round"/>
        </g>
        <g class="fe fe-x">
          <circle cx="78"  cy="92" r="10" fill="none" stroke="#5BE8DA" stroke-width="3"/>
          <circle cx="122" cy="92" r="10" fill="none" stroke="#5BE8DA" stroke-width="3"/>
          <circle cx="78"  cy="92" r="3" fill="#5BE8DA"/>
          <circle cx="122" cy="92" r="3" fill="#5BE8DA"/>
        </g>
        <g class="fe fe-r">
          <path d="M70,90 Q78,87 86,90 Q78,96 70,90" fill="#5BE8DA"/>
          <path d="M114,90 Q122,87 130,90 Q122,96 114,90" fill="#5BE8DA"/>
        </g>
        <g class="fe fe-w">
          <ellipse cx="78" cy="92" rx="6" ry="9" fill="#5BE8DA"/>
          <path d="M114,92 Q122,98 130,92" stroke="#5BE8DA" stroke-width="3" fill="none" stroke-linecap="round"/>
        </g>
      </g>

      <g id="h-mouth" filter="url(#jg-glow)">
        <path class="fm fm-smile" d="M85,108 Q100,118 115,108" stroke="#5BE8DA" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path class="fm fm-grin"  d="M82,106 Q100,122 118,106 Q100,114 82,106 Z" fill="#5BE8DA"/>
        <ellipse class="fm fm-o"  cx="100" cy="112" rx="6" ry="7" fill="none" stroke="#5BE8DA" stroke-width="2.6"/>
        <path class="fm fm-flat"  d="M86,112 L114,112" stroke="#5BE8DA" stroke-width="2.6" stroke-linecap="round"/>
      </g>
    </svg>

    <button id="h-close" aria-label="پنهان کردن">×</button>
  </div>

  <div id="h-restore" role="button" tabindex="0" aria-label="نمایش حرفو">
    <span>H</span>
  </div>

</div>
<?php } );
