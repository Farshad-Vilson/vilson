<?php
/**
 * Plugin Name: حرفو v3 — اوربیت هوشمند حرف اول
 * Plugin URI:  https://harfaval.com
 * Description: کره شیشه‌ای هوشمند با فیزیک ماوس، یادگیری ماشین، ۱۰۰+ رفتار و تحلیل استایل سایت.
 * Version:     3.0.0
 * Author:      حرف اول
 * Text Domain: harfo
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HARFO_VER', '3.0.0' );
define( 'HARFO_URL', plugin_dir_url( __FILE__ ) );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(  'harfo', HARFO_URL . 'assets/harfo.css', [], HARFO_VER );
	wp_enqueue_script( 'harfo', HARFO_URL . 'assets/harfo.js',  [], HARFO_VER, true );
} );

add_action( 'wp_footer', function () { ?>
<div id="harfo-root" aria-hidden="true" dir="rtl">

  <!-- ── Spring wrapper (physics transforms this) ── -->
  <div id="harfo-w" class="hs-loading">

    <!-- HUD / speech bubble -->
    <div id="h-hud">
      <div id="h-dots"><i></i><i></i><i></i></div>
      <p id="h-msg"></p>
    </div>

    <!-- ZZZ sleep bubbles -->
    <div id="h-zzz" aria-hidden="true">
      <b class="hz">Z</b><b class="hz">z</b><b class="hz">z</b>
    </div>

    <!-- ── Orb ── -->
    <div id="h-orb">

      <!-- Outer ambient aura -->
      <div class="g-aura"></div>

      <!-- Ear bumps (glass-like) -->
      <div class="g-ear g-el"></div>
      <div class="g-ear g-er"></div>

      <!-- Glass sphere layers -->
      <div class="g-sphere">

        <!-- Outer shell (ring + glow) -->
        <div class="g-shell"></div>

        <!-- Dark inner core -->
        <div class="g-core">

          <!-- Glass highlight top-left -->
          <div class="g-hl"></div>

          <!-- Face: eyes + H1 logo (SVG) -->
          <svg id="h-face" viewBox="0 0 72 70" fill="none" xmlns="http://www.w3.org/2000/svg">

            <!-- EYES: happy ^^ -->
            <path class="fe fe-h" d="M9,21 Q19,10 29,21"   stroke="#1DBFB4" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <path class="fe fe-h" d="M43,21 Q53,10 63,21"  stroke="#1DBFB4" stroke-width="3.5" fill="none" stroke-linecap="round"/>

            <!-- EYES: sleeping vv -->
            <path class="fe fe-s" d="M9,14 Q19,23 29,14"   stroke="#1DBFB4" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <path class="fe fe-s" d="M43,14 Q53,23 63,14"  stroke="#1DBFB4" stroke-width="3.5" fill="none" stroke-linecap="round"/>

            <!-- EYES: surprised OO -->
            <circle class="fe fe-x" cx="19" cy="16" r="8"  stroke="#1DBFB4" stroke-width="3" fill="rgba(29,191,180,0.1)"/>
            <circle class="fe fe-x" cx="53" cy="16" r="8"  stroke="#1DBFB4" stroke-width="3" fill="rgba(29,191,180,0.1)"/>

            <!-- EYES: mischief >< -->
            <path class="fe fe-m" d="M9,22 L29,12 M29,22 L9,12"  stroke="#1DBFB4" stroke-width="3" stroke-linecap="round"/>
            <path class="fe fe-m" d="M43,22 L63,12 M63,22 L43,12" stroke="#1DBFB4" stroke-width="3" stroke-linecap="round"/>

            <!-- EYES: curious ~ -->
            <path class="fe fe-c" d="M9,17 Q14,11 19,17 Q24,23 29,17"  stroke="#1DBFB4" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path class="fe fe-c" d="M43,17 Q48,11 53,17 Q58,23 63,17" stroke="#1DBFB4" stroke-width="3" fill="none" stroke-linecap="round"/>

            <!-- H1 LOGO MARK (always visible) -->
            <g class="g-logo">
              <!-- H — white bars -->
              <rect x="4"  y="30" width="10" height="34" rx="2.5" fill="rgba(255,255,255,0.86)"/>
              <rect x="23" y="30" width="10" height="34" rx="2.5" fill="rgba(255,255,255,0.86)"/>
              <rect x="4"  y="43" width="29" height="9"  fill="rgba(255,255,255,0.86)"/>
              <!-- 1 — teal -->
              <rect x="36" y="37" width="9" height="27" rx="2" fill="#1DBFB4"/>
              <path d="M26,30 L47,30 L36,39 L26,39 Z" fill="#1DBFB4"/>
            </g>

          </svg>

        </div><!-- /g-core -->
      </div><!-- /g-sphere -->

    </div><!-- /h-orb -->

    <!-- Ground glow reflection -->
    <div class="g-ground"></div>

    <!-- Close button -->
    <button id="h-close" aria-label="پنهان کردن">×</button>

  </div><!-- /harfo-w -->

  <!-- Restore button (visible when hidden) -->
  <div id="h-restore" role="button" tabindex="0" aria-label="نمایش حرفو">
    <div class="r-shell"></div>
    <div class="r-core"><span>H1</span></div>
  </div>

</div><!-- /harfo-root -->
<?php } );
