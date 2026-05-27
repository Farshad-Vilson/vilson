<?php
/**
 * Plugin Name: حرفو v6 — راهنمای جادویی حرف اول
 * Plugin URI:  https://harfaval.com
 * Description: کاراکتر جادویی هوشمند: بازیگوش با ماوس، راهنمای محتوا، گرافیک حرفه‌ای، صفر وابستگی خارجی.
 * Version:     6.0.0
 * Author:      حرف اول
 * Text Domain: harfo
 * License:     GPL-2.0+
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HARFO_VERSION', '6.0.0' );
define( 'HARFO_URL',     plugin_dir_url( __FILE__ ) );
define( 'HARFO_PATH',    plugin_dir_path( __FILE__ ) );

/* ── Enqueue all assets in dependency order ── */
add_action( 'wp_enqueue_scripts', 'harfo_enqueue' );
function harfo_enqueue() {
	$v = HARFO_VERSION;
	$u = HARFO_URL . 'assets/';

	/* Styles */
	wp_enqueue_style( 'harfo-anim',  $u . 'animations.css', [],           $v );
	wp_enqueue_style( 'harfo-main',  $u . 'harfo.css',      ['harfo-anim'], $v );

	/* Engine scripts — load in dependency order */
	wp_enqueue_script( 'harfo-morph',  $u . 'engine/morph.js',        [],                                          $v, true );
	wp_enqueue_script( 'harfo-phys',   $u . 'engine/physics.js',       ['harfo-morph'],                             $v, true );
	wp_enqueue_script( 'harfo-intel',  $u . 'engine/intelligence.js',  ['harfo-phys'],                              $v, true );
	wp_enqueue_script( 'harfo-behav',  $u . 'engine/behaviors.js',     ['harfo-intel'],                             $v, true );
	wp_enqueue_script( 'harfo-main',   $u . 'harfo-main.js',           ['harfo-behav'],                             $v, true );

	/* Pass PHP data to JS */
	wp_localize_script( 'harfo-main', 'harfoData', [
		'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
		'siteUrl'  => get_site_url(),
		'isRTL'    => is_rtl() ? 'true' : 'false',
		'lang'     => get_locale(),
		'pluginUrl'=> HARFO_URL,
	] );
}

/* ── Inject character HTML into footer ── */
add_action( 'wp_footer', 'harfo_render' );
function harfo_render() {
	/* Load full SVG sprite from file */
	$svg_file = HARFO_PATH . 'assets/engine/harfo-sprite.svg';
	$sprite   = file_exists( $svg_file ) ? file_get_contents( $svg_file ) : '';
	?>
<div id="harfo-root" role="complementary" aria-label="حرفو — دستیار هوشمند" dir="rtl">

  <!-- Hidden SVG sprite/defs -->
  <svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
    <defs>
      <!-- Gradients -->
      <linearGradient id="hg-body" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="#6DEEE5"/><stop offset="40%"  stop-color="#2BCFC0"/>
        <stop offset="100%" stop-color="#0E9E93"/>
      </linearGradient>
      <linearGradient id="hg-body-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"  stop-color="#3DD8CE"/><stop offset="100%" stop-color="#0A7A72"/>
      </linearGradient>
      <linearGradient id="hg-face" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"  stop-color="#0E2638"/><stop offset="100%" stop-color="#020C18"/>
      </linearGradient>
      <linearGradient id="hg-shine" x1="0%" y1="0%" x2="40%" y2="100%">
        <stop offset="0%"  stop-color="rgba(255,255,255,0.85)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
      <linearGradient id="hg-gnd" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"  stop-color="rgba(22,168,154,0.35)"/>
        <stop offset="100%" stop-color="rgba(22,168,154,0)"/>
      </linearGradient>
      <radialGradient id="hg-aura" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="rgba(91,232,218,0.28)"/>
        <stop offset="100%" stop-color="rgba(91,232,218,0)"/>
      </radialGradient>
      <radialGradient id="hg-eyegl" cx="35%" cy="30%" r="55%">
        <stop offset="0%"  stop-color="rgba(255,255,255,0.7)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </radialGradient>

      <!-- Filters -->
      <filter id="hf-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="hf-softglow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="1.6" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="hf-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="rgba(6,18,30,0.4)"/>
      </filter>
      <filter id="hf-big-glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="6" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>

      <!-- Particle/sparkle symbol -->
      <symbol id="hs-spark" viewBox="0 0 20 20">
        <path d="M10,0 L11.5,8.5 L20,10 L11.5,11.5 L10,20 L8.5,11.5 L0,10 L8.5,8.5 Z" fill="#5BE8DA"/>
      </symbol>
      <symbol id="hs-heart" viewBox="0 0 20 20">
        <path d="M10,17 L3,10 A4.5,4.5 0 0 1 10,4 A4.5,4.5 0 0 1 17,10 Z" fill="#FF6B8A"/>
      </symbol>
      <symbol id="hs-sweat" viewBox="0 0 12 18">
        <ellipse cx="6" cy="10" rx="4" ry="7" fill="rgba(100,200,240,0.85)"/>
        <ellipse cx="6" cy="6" rx="2" ry="2" fill="rgba(150,220,255,0.7)"/>
      </symbol>
    </defs>
  </svg>

  <!-- ── Main Wrapper (physics drives this) ── -->
  <div id="harfo-w">

    <!-- Ambient aura (larger glow behind character) -->
    <div id="h-aura"></div>

    <!-- Speed lines (shown when fleeing fast) -->
    <div id="h-speedlines" aria-hidden="true">
      <div class="sl"></div><div class="sl"></div><div class="sl"></div>
      <div class="sl"></div><div class="sl"></div>
    </div>

    <!-- ── Character SVG ── -->
    <svg id="h-char" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" overflow="visible">

      <!-- Ground shadow ellipse -->
      <ellipse id="h-ground" cx="100" cy="234" rx="52" ry="9" fill="rgba(6,100,90,0.28)"/>

      <!-- Main body path (JS morphs this) -->
      <path id="h-body" d="" fill="url(#hg-body)" filter="url(#hf-shadow)"/>

      <!-- Body inner sheen (secondary highlight, bottom) -->
      <path id="h-body-sheen" d="" fill="rgba(255,255,255,0.06)"/>

      <!-- Fins / arms -->
      <g id="h-fins">
        <path id="h-fin-l" d="" fill="url(#hg-body-dark)" opacity="0.85"/>
        <path id="h-fin-r" d="" fill="url(#hg-body-dark)" opacity="0.85"/>
      </g>

      <!-- Tail (lower body tapered end) -->
      <path id="h-tail" d="" fill="url(#hg-body-dark)" opacity="0.9"/>

      <!-- Specular highlight top-left -->
      <path id="h-shine" d="" fill="url(#hg-shine)" opacity="0.7"/>

      <!-- Secondary micro-shine -->
      <ellipse id="h-shine2" cx="68" cy="52" rx="11" ry="7" fill="rgba(255,255,255,0.35)" transform="rotate(-20 68 52)"/>

      <!-- ── Face group ── -->
      <g id="h-face">
        <!-- Face screen (dark oval) -->
        <ellipse id="h-face-bg" cx="100" cy="88" rx="54" ry="38" fill="url(#hg-face)"/>
        <!-- Face inner glow -->
        <ellipse cx="100" cy="88" rx="54" ry="38" fill="none" stroke="rgba(91,232,218,0.18)" stroke-width="1.5"/>
        <!-- Face glass reflection -->
        <ellipse id="h-face-glass" cx="82" cy="76" rx="26" ry="11" fill="rgba(255,255,255,0.07)" transform="rotate(-8 82 76)"/>

        <!-- ── Eyes group ── -->
        <g id="h-eyes" filter="url(#hf-softglow)">

          <!-- NORMAL: round teal eyes -->
          <g class="he he-n">
            <ellipse cx="78"  cy="88" rx="7.5" ry="10" fill="#5BE8DA"/>
            <ellipse cx="122" cy="88" rx="7.5" ry="10" fill="#5BE8DA"/>
            <!-- Pupil glints -->
            <ellipse cx="75" cy="85" rx="2.5" ry="2.5" fill="rgba(255,255,255,0.75)"/>
            <ellipse cx="119" cy="85" rx="2.5" ry="2.5" fill="rgba(255,255,255,0.75)"/>
          </g>

          <!-- BLINK: thin closed lines -->
          <g class="he he-bl">
            <path d="M70,88 Q78,92 86,88" stroke="#5BE8DA" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M114,88 Q122,92 130,88" stroke="#5BE8DA" stroke-width="3" fill="none" stroke-linecap="round"/>
          </g>

          <!-- HAPPY: ^^ arcs -->
          <g class="he he-h">
            <path d="M70,92 Q78,82 86,92" stroke="#5BE8DA" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <path d="M114,92 Q122,82 130,92" stroke="#5BE8DA" stroke-width="3.5" fill="none" stroke-linecap="round"/>
          </g>

          <!-- SLEEP: vv droopy -->
          <g class="he he-s">
            <path d="M70,86 Q78,93 86,86" stroke="#5BE8DA" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M114,86 Q122,93 130,86" stroke="#5BE8DA" stroke-width="3" fill="none" stroke-linecap="round"/>
          </g>

          <!-- SURPRISED: big O circles -->
          <g class="he he-x">
            <circle cx="78" cy="88" r="11" fill="none" stroke="#5BE8DA" stroke-width="3"/>
            <circle cx="78" cy="88" r="4"  fill="#5BE8DA"/>
            <circle cx="122" cy="88" r="11" fill="none" stroke="#5BE8DA" stroke-width="3"/>
            <circle cx="122" cy="88" r="4"  fill="#5BE8DA"/>
          </g>

          <!-- SCARED/PANIC: eyes wide + off-center -->
          <g class="he he-sc">
            <ellipse cx="75" cy="86" rx="10" ry="12" fill="#5BE8DA"/>
            <ellipse cx="119" cy="86" rx="10" ry="12" fill="#5BE8DA"/>
            <ellipse cx="71" cy="84" rx="3"  ry="3"  fill="rgba(255,255,255,0.8)"/>
            <ellipse cx="115" cy="84" rx="3" ry="3"  fill="rgba(255,255,255,0.8)"/>
          </g>

          <!-- WINK -->
          <g class="he he-wk">
            <ellipse cx="78" cy="88" rx="7.5" ry="10" fill="#5BE8DA"/>
            <ellipse cx="75" cy="85" rx="2.5" ry="2.5" fill="rgba(255,255,255,0.75)"/>
            <path d="M114,88 Q122,94 130,88" stroke="#5BE8DA" stroke-width="3" fill="none" stroke-linecap="round"/>
          </g>

          <!-- TEASE/MISCHIEF: X-X or ><  -->
          <g class="he he-ts">
            <path d="M70,84 L86,94 M86,84 L70,94" stroke="#5BE8DA" stroke-width="3" stroke-linecap="round"/>
            <path d="M114,84 L130,94 M130,84 L114,94" stroke="#5BE8DA" stroke-width="3" stroke-linecap="round"/>
          </g>

          <!-- READING: squint -->
          <g class="he he-rd">
            <path d="M68,86 Q78,83 88,86 Q78,92 68,86" fill="#5BE8DA"/>
            <path d="M112,86 Q122,83 132,86 Q122,92 112,86" fill="#5BE8DA"/>
          </g>

          <!-- LOVE: heart eyes -->
          <g class="he he-lv">
            <path d="M78,84 a5,5 0 0 1 10,0 a5,5 0 0 1 10,0 q0,6 -10,13 q-10,-7 -10,-13 z" transform="translate(-10,0)" fill="#FF6B8A"/>
            <path d="M78,84 a5,5 0 0 1 10,0 a5,5 0 0 1 10,0 q0,6 -10,13 q-10,-7 -10,-13 z" transform="translate(34,0)"  fill="#FF6B8A"/>
          </g>

          <!-- DIZZY: spiral eyes -->
          <g class="he he-dz">
            <path d="M72,84 Q82,80 84,88 Q82,96 72,92 Q70,86 78,86" stroke="#5BE8DA" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M116,84 Q126,80 128,88 Q126,96 116,92 Q114,86 122,86" stroke="#5BE8DA" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          </g>
        </g>

        <!-- ── Mouth ── -->
        <g id="h-mouth" filter="url(#hf-softglow)">
          <path class="hm hm-sm" d="M87,106 Q100,116 113,106" stroke="#5BE8DA" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path class="hm hm-gr" d="M84,104 Q100,120 116,104 Q100,112 84,104 Z" fill="#5BE8DA"/>
          <ellipse class="hm hm-o" cx="100" cy="109" rx="5.5" ry="7" fill="none" stroke="#5BE8DA" stroke-width="2.5"/>
          <path class="hm hm-fl" d="M90,109 L110,109" stroke="#5BE8DA" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Tongue for tease -->
          <g class="hm hm-tg">
            <path d="M88,106 Q100,118 112,106 Q100,114 88,106 Z" fill="#5BE8DA"/>
            <ellipse cx="100" cy="115" rx="7" ry="5" fill="#FF6B8A"/>
          </g>
        </g>

        <!-- Sweat drop (panic/nervous) -->
        <use class="h-sweat" href="#hs-sweat" x="128" y="66" width="12" height="18" opacity="0" fill="#6BD4F8"/>
      </g>

      <!-- H1 logo watermark on body -->
      <g id="h-logo" opacity="0.13" transform="translate(72, 140)">
        <rect x="0"  y="0"  width="10" height="52" rx="2.5" fill="white"/>
        <rect x="28" y="0"  width="10" height="52" rx="2.5" fill="white"/>
        <rect x="0"  y="20" width="38" height="10"          fill="white"/>
        <rect x="40" y="10" width="9"  height="42" rx="2"   fill="#5BE8DA"/>
        <path d="M30,4 L54,4 L42,14 L30,14 Z"               fill="#5BE8DA"/>
      </g>

    </svg>

    <!-- Speech/HUD bubble -->
    <div id="h-hud" role="status" aria-live="polite">
      <div id="h-typing"><span></span><span></span><span></span></div>
      <p id="h-msg"></p>
      <div id="h-acts"></div>
    </div>

    <!-- ZZZ -->
    <div id="h-zzz" aria-hidden="true"><b>Z</b><b>z</b><b>z</b></div>

    <!-- Exclamation (surprised/alert) -->
    <div id="h-exclaim" aria-hidden="true">!</div>

    <!-- Particle container -->
    <div id="h-particles" aria-hidden="true"></div>

    <!-- Close -->
    <button id="h-close" aria-label="بستن حرفو" title="بستن">×</button>
  </div>

  <!-- Restore pill -->
  <div id="h-restore" role="button" tabindex="0" aria-label="باز کردن حرفو">
    <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="21" fill="url(#hg-body)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <ellipse cx="16" cy="20" rx="4" ry="5.5" fill="#06121E"/>
      <ellipse cx="28" cy="20" rx="4" ry="5.5" fill="#06121E"/>
      <path d="M15,28 Q22,34 29,28" stroke="#06121E" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>
  </div>

  <!-- Toast notification -->
  <div id="h-toast" role="status" aria-live="polite"></div>

  <!-- Floating TOC panel -->
  <nav id="h-toc" aria-label="فهرست مطالب"></nav>

  <!-- Search palette -->
  <div id="h-palette" role="dialog" aria-label="جستجو در سایت">
    <div id="h-pal-box">
      <input id="h-pal-inp" type="search" placeholder="جستجو در سایت..." autocomplete="off" dir="rtl"/>
      <div id="h-pal-hint">↑↓ انتخاب · Enter باز کن · Esc بستن</div>
      <div id="h-pal-list"></div>
    </div>
  </div>

</div><!-- /harfo-root -->
<?php
}
