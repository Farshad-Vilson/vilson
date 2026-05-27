<?php
/**
 * Plugin Name:  حرفو v7 — روح زنده حرف اول
 * Plugin URI:   https://harfo.ir
 * Description:  Harfo v7 – living first-letter character widget for WordPress.
 * Version:      7.0.0
 * Author:       Harfo Team
 * Author URI:   https://harfo.ir
 * Text Domain:  harfo-character
 * Domain Path:  /languages
 * License:      GPL-2.0-or-later
 * License URI:  https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HARFO_VERSION',    '7.0.0' );
define( 'HARFO_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'HARFO_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );

/* =========================================================
   1. ENQUEUE ASSETS
   ========================================================= */

add_action( 'wp_enqueue_scripts', 'harfo_enqueue_assets' );

function harfo_enqueue_assets() {

	/* ── CSS ── */
	wp_enqueue_style(
		'harfo-core',
		HARFO_PLUGIN_URL . 'assets/css/harfo-core.css',
		array(),
		HARFO_VERSION
	);
	wp_enqueue_style(
		'harfo-animations',
		HARFO_PLUGIN_URL . 'assets/css/harfo-animations.css',
		array( 'harfo-core' ),
		HARFO_VERSION
	);
	wp_enqueue_style(
		'harfo-ui',
		HARFO_PLUGIN_URL . 'assets/css/harfo-ui.css',
		array( 'harfo-animations' ),
		HARFO_VERSION
	);
	wp_enqueue_style(
		'harfo-expressions',
		HARFO_PLUGIN_URL . 'assets/css/harfo-expressions.css',
		array( 'harfo-ui' ),
		HARFO_VERSION
	);

	/* ── JS (all in footer = true) ── */

	/* Data layer */
	wp_enqueue_script(
		'harfo-shapes',
		HARFO_PLUGIN_URL . 'assets/js/data/shapes.js',
		array(),
		HARFO_VERSION,
		true
	);
	wp_enqueue_script(
		'harfo-phrases',
		HARFO_PLUGIN_URL . 'assets/js/data/phrases.js',
		array( 'harfo-shapes' ),
		HARFO_VERSION,
		true
	);
	wp_enqueue_script(
		'harfo-behaviors-data',
		HARFO_PLUGIN_URL . 'assets/js/data/behaviors-data.js',
		array( 'harfo-phrases' ),
		HARFO_VERSION,
		true
	);

	/* Engine layer */
	wp_enqueue_script(
		'harfo-state',
		HARFO_PLUGIN_URL . 'assets/js/engine/state.js',
		array( 'harfo-behaviors-data' ),
		HARFO_VERSION,
		true
	);
	wp_enqueue_script(
		'harfo-physics',
		HARFO_PLUGIN_URL . 'assets/js/engine/physics.js',
		array( 'harfo-state' ),
		HARFO_VERSION,
		true
	);
	wp_enqueue_script(
		'harfo-morph',
		HARFO_PLUGIN_URL . 'assets/js/engine/morph.js',
		array( 'harfo-physics' ),
		HARFO_VERSION,
		true
	);
	wp_enqueue_script(
		'harfo-particles',
		HARFO_PLUGIN_URL . 'assets/js/engine/particles.js',
		array( 'harfo-morph' ),
		HARFO_VERSION,
		true
	);
	wp_enqueue_script(
		'harfo-speech',
		HARFO_PLUGIN_URL . 'assets/js/engine/speech.js',
		array( 'harfo-particles' ),
		HARFO_VERSION,
		true
	);
	wp_enqueue_script(
		'harfo-tease',
		HARFO_PLUGIN_URL . 'assets/js/engine/tease.js',
		array( 'harfo-speech' ),
		HARFO_VERSION,
		true
	);
	wp_enqueue_script(
		'harfo-intelligence',
		HARFO_PLUGIN_URL . 'assets/js/engine/intelligence.js',
		array( 'harfo-tease' ),
		HARFO_VERSION,
		true
	);
	wp_enqueue_script(
		'harfo-ui-engine',
		HARFO_PLUGIN_URL . 'assets/js/engine/ui.js',
		array( 'harfo-intelligence' ),
		HARFO_VERSION,
		true
	);

	/* Main entry-point */
	wp_enqueue_script(
		'harfo-main',
		HARFO_PLUGIN_URL . 'assets/js/harfo-main.js',
		array( 'harfo-ui-engine' ),
		HARFO_VERSION,
		true
	);

	/* Localise */
	wp_localize_script(
		'harfo-main',
		'HarfoConfig',
		array(
			'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
			'siteUrl'   => get_site_url(),
			'isRTL'     => (int) is_rtl(),
			'lang'      => get_locale(),
			'pluginUrl' => HARFO_PLUGIN_URL,
		)
	);
}

/* =========================================================
   2. FOOTER HTML
   ========================================================= */

add_action( 'wp_footer', 'harfo_render_root', 100 );

function harfo_render_root() {
	?>
<div id="harfo-root">

	<!-- ═══════════════════════════════════════════════
	     SVG DEFS  (hidden, shared symbols & filters)
	     ═══════════════════════════════════════════════ -->
	<svg xmlns="http://www.w3.org/2000/svg"
	     xmlns:xlink="http://www.w3.org/1999/xlink"
	     style="position:absolute;width:0;height:0;overflow:hidden"
	     aria-hidden="true">
		<defs>

			<!-- Body gradient: teal spectrum -->
			<linearGradient id="hg-body" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%"   stop-color="#6DEEE5"/>
				<stop offset="52%"  stop-color="#2BCFC0"/>
				<stop offset="100%" stop-color="#0E9E93"/>
			</linearGradient>

			<!-- Shade gradient -->
			<linearGradient id="hg-shade" x1="0.5" y1="0" x2="0.5" y2="1">
				<stop offset="0%"   stop-color="rgba(0,60,50,0.3)"/>
				<stop offset="100%" stop-color="transparent"/>
			</linearGradient>

			<!-- Shine gradient -->
			<linearGradient id="hg-shine" x1="0.15" y1="0" x2="0.85" y2="1">
				<stop offset="0%"   stop-color="rgba(255,255,255,0.9)"/>
				<stop offset="100%" stop-color="transparent"/>
			</linearGradient>

			<!-- Face radial gradient -->
			<radialGradient id="hg-face" cx="50%" cy="50%" r="50%">
				<stop offset="0%"   stop-color="#0E2638"/>
				<stop offset="100%" stop-color="#020C18"/>
			</radialGradient>

			<!-- Aura radial gradient -->
			<radialGradient id="hg-aura" cx="50%" cy="50%" r="50%">
				<stop offset="0%"   stop-color="rgba(91,232,218,0.3)"/>
				<stop offset="100%" stop-color="transparent"/>
			</radialGradient>

			<!-- Glow filter -->
			<filter id="hf-glow" x="-40%" y="-40%" width="180%" height="180%">
				<feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
				<feMerge>
					<feMergeNode in="blur"/>
					<feMergeNode in="SourceGraphic"/>
				</feMerge>
			</filter>

			<!-- Drop-shadow filter -->
			<filter id="hf-shadow" x="-30%" y="-20%" width="160%" height="160%">
				<feDropShadow dx="0" dy="6" stdDeviation="5"
				              flood-color="rgba(0,40,30,0.45)"/>
			</filter>

			<!-- Big blur filter -->
			<filter id="hf-bigblur" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="8"/>
			</filter>

			<!-- Spark symbol: 4-point star -->
			<symbol id="hs-spark" viewBox="0 0 20 20">
				<path d="M10,0 L11.8,8.2 L20,10 L11.8,11.8 L10,20 L8.2,11.8 L0,10 L8.2,8.2 Z"
				      fill="#5BE8DA"/>
			</symbol>

			<!-- Heart symbol -->
			<symbol id="hs-heart" viewBox="0 0 20 20">
				<path d="M10,17 C10,17 2,11.5 2,6.5 C2,3.5 4.5,2 7,2 C8.5,2 10,3 10,3
				         C10,3 11.5,2 13,2 C15.5,2 18,3.5 18,6.5 C18,11.5 10,17 10,17 Z"
				      fill="#FF6B8A"/>
			</symbol>

			<!-- Star symbol: 5-point star -->
			<symbol id="hs-star" viewBox="0 0 24 24">
				<path d="M12,2 L14.4,9.2 L22,9.2 L16,13.8 L18.4,21 L12,16.4 L5.6,21
				         L8,13.8 L2,9.2 L9.6,9.2 Z"
				      fill="#FFD93D"/>
			</symbol>

			<!-- Sweat drop symbol: teardrop -->
			<symbol id="hs-sweat" viewBox="0 0 14 22">
				<path d="M7,1 C7,1 13,10 13,14 Q13,21 7,21 Q1,21 1,14 C1,10 7,1 7,1 Z"
				      fill="rgba(100,200,240,0.9)"/>
				<ellipse cx="7" cy="14" rx="6" ry="7"
				         fill="rgba(100,200,240,0.9)"/>
			</symbol>

			<!-- Music note symbol -->
			<symbol id="hs-note" viewBox="0 0 20 20">
				<path d="M8,15 C8,16.66 6.66,18 5,18 C3.34,18 2,16.66 2,15
				         C2,13.34 3.34,12 5,12 C5.55,12 6.06,12.15 6.5,12.41
				         L6.5,5 L15,3 L15,10.41 C15.44,10.15 15.95,10 16.5,10
				         C18.16,10 19.5,11.34 19.5,13 C19.5,14.66 18.16,16 16.5,16
				         C14.84,16 13.5,14.66 13.5,13 C13.5,12.77 13.53,12.55 13.58,12.34
				         L13.5,6.22 L8.5,7.44 L8.5,15 Z"
				      fill="#5BE8DA"/>
			</symbol>

		</defs>
	</svg><!-- /SVG defs -->

	<!-- ═══════════════════════════════════════════════
	     WIDGET WRAPPER
	     ═══════════════════════════════════════════════ -->
	<div id="harfo-w">

		<!-- Ambient glow -->
		<div id="h-aura"></div>

		<!-- Speed lines (panic / flee states) -->
		<div id="h-speed">
			<div class="sl"></div>
			<div class="sl"></div>
			<div class="sl"></div>
			<div class="sl"></div>
			<div class="sl"></div>
			<div class="sl"></div>
		</div>

		<!-- ── Main character SVG ── -->
		<svg id="h-char"
		     xmlns="http://www.w3.org/2000/svg"
		     xmlns:xlink="http://www.w3.org/1999/xlink"
		     viewBox="0 0 200 250"
		     overflow="visible">

			<!-- Ground shadow -->
			<ellipse id="h-shadow"
			         cx="100" cy="244" rx="55" ry="10"
			         fill="rgba(0,30,20,0.32)"/>

			<!-- Body -->
			<path id="h-body"
			      fill="url(#hg-body)"
			      filter="url(#hf-shadow)"
			      d="M100,20 C140,20 168,55 168,100 C168,155 145,230 100,240
			         C55,230 32,155 32,100 C32,55 60,20 100,20 Z"/>

			<!-- Body shade -->
			<path id="h-body-shade"
			      fill="url(#hg-shade)"
			      opacity="0.4"
			      d="M100,20 C140,20 168,55 168,100 C168,155 145,230 100,240
			         C55,230 32,155 32,100 C32,55 60,20 100,20 Z"/>

			<!-- Fins -->
			<g id="h-fins">
				<path id="h-fin-l"
				      fill="url(#hg-body)"
				      opacity="0.82"
				      d="M38,80 C22,65 14,90 20,110 C26,130 36,120 40,112 Z"/>
				<path id="h-fin-r"
				      fill="url(#hg-body)"
				      opacity="0.82"
				      d="M162,80 C178,65 186,90 180,110 C174,130 164,120 160,112 Z"/>
			</g>

			<!-- Body shine -->
			<path id="h-shine"
			      fill="url(#hg-shine)"
			      opacity="0.72"
			      d="M80,28 C90,22 110,24 118,34 C126,44 122,62 112,70
			         C100,56 84,50 72,54 C68,44 70,34 80,28 Z"/>

			<!-- Secondary shine spot -->
			<ellipse id="h-shine2"
			         cx="68" cy="55" rx="12" ry="7"
			         fill="rgba(255,255,255,0.38)"
			         transform="rotate(-22 68 55)"/>

			<!-- ── Face group ── -->
			<g id="h-face">

				<!-- Face background -->
				<ellipse id="h-face-bg"
				         cx="100" cy="90" rx="56" ry="40"
				         fill="url(#hg-face)"/>

				<!-- Face border -->
				<ellipse cx="100" cy="90" rx="56" ry="40"
				         fill="none"
				         stroke="rgba(91,232,218,0.2)"
				         stroke-width="1.5"/>

				<!-- Face gloss -->
				<ellipse cx="82" cy="78" rx="28" ry="12"
				         fill="rgba(255,255,255,0.07)"
				         transform="rotate(-8 82 78)"/>

				<!-- ── Eye expressions ── -->
				<g id="h-eyes" filter="url(#hf-glow)">

					<!-- Normal eyes (he-n) -->
					<g class="he he-n">
						<ellipse cx="78"  cy="88" rx="11" ry="13"
						         fill="rgba(220,255,250,0.95)"/>
						<ellipse cx="122" cy="88" rx="11" ry="13"
						         fill="rgba(220,255,250,0.95)"/>
						<circle cx="80"  cy="90" r="6.5" fill="#0A1A2E"/>
						<circle cx="124" cy="90" r="6.5" fill="#0A1A2E"/>
						<circle cx="82"  cy="87" r="2.5" fill="rgba(91,232,218,0.9)"/>
						<circle cx="126" cy="87" r="2.5" fill="rgba(91,232,218,0.9)"/>
						<circle cx="83"  cy="85" r="1.2" fill="rgba(255,255,255,0.95)"/>
						<circle cx="127" cy="85" r="1.2" fill="rgba(255,255,255,0.95)"/>
					</g>

					<!-- Blink eyes (he-bl) -->
					<g class="he he-bl">
						<path d="M68,88 Q78,80 88,88"
						      fill="none" stroke="rgba(91,232,218,0.9)"
						      stroke-width="3" stroke-linecap="round"/>
						<path d="M112,88 Q122,80 132,88"
						      fill="none" stroke="rgba(91,232,218,0.9)"
						      stroke-width="3" stroke-linecap="round"/>
					</g>

					<!-- Happy eyes (he-h): ^^ arcs + cheek blush -->
					<g class="he he-h">
						<path d="M68,92 Q78,78 88,92"
						      fill="rgba(91,232,218,0.15)"
						      stroke="rgba(91,232,218,0.95)"
						      stroke-width="3" stroke-linecap="round"/>
						<path d="M112,92 Q122,78 132,92"
						      fill="rgba(91,232,218,0.15)"
						      stroke="rgba(91,232,218,0.95)"
						      stroke-width="3" stroke-linecap="round"/>
						<ellipse cx="68"  cy="99" rx="8" ry="4"
						         fill="rgba(255,140,160,0.45)"/>
						<ellipse cx="132" cy="99" rx="8" ry="4"
						         fill="rgba(255,140,160,0.45)"/>
					</g>

					<!-- Sleep eyes (he-s): droopy vv -->
					<g class="he he-s">
						<path d="M68,86 Q78,94 88,86"
						      fill="none" stroke="rgba(91,232,218,0.7)"
						      stroke-width="3" stroke-linecap="round"/>
						<path d="M112,86 Q122,94 132,86"
						      fill="none" stroke="rgba(91,232,218,0.7)"
						      stroke-width="3" stroke-linecap="round"/>
					</g>

					<!-- Surprised eyes (he-x): enlarged pupils -->
					<g class="he he-x">
						<ellipse cx="78"  cy="88" rx="13" ry="15"
						         fill="rgba(220,255,250,0.95)"/>
						<ellipse cx="122" cy="88" rx="13" ry="15"
						         fill="rgba(220,255,250,0.95)"/>
						<circle cx="78"  cy="90" r="8"   fill="#0A1A2E"/>
						<circle cx="122" cy="90" r="8"   fill="#0A1A2E"/>
						<circle cx="80"  cy="86" r="3"   fill="rgba(91,232,218,0.9)"/>
						<circle cx="124" cy="86" r="3"   fill="rgba(91,232,218,0.9)"/>
						<circle cx="82"  cy="84" r="1.5" fill="rgba(255,255,255,0.95)"/>
						<circle cx="126" cy="84" r="1.5" fill="rgba(255,255,255,0.95)"/>
					</g>

					<!-- Scared eyes (he-sc): wide + worried brows -->
					<g class="he he-sc">
						<ellipse cx="78"  cy="88" rx="12" ry="14"
						         fill="rgba(220,255,250,0.95)"/>
						<ellipse cx="122" cy="88" rx="12" ry="14"
						         fill="rgba(220,255,250,0.95)"/>
						<circle cx="78"  cy="92" r="5" fill="#0A1A2E"/>
						<circle cx="122" cy="92" r="5" fill="#0A1A2E"/>
						<circle cx="80"  cy="88" r="2" fill="rgba(91,232,218,0.9)"/>
						<circle cx="124" cy="88" r="2" fill="rgba(91,232,218,0.9)"/>
						<path d="M66,74 Q78,70 88,75"
						      fill="none" stroke="rgba(91,232,218,0.8)"
						      stroke-width="2.5" stroke-linecap="round"/>
						<path d="M112,75 Q122,70 134,74"
						      fill="none" stroke="rgba(91,232,218,0.8)"
						      stroke-width="2.5" stroke-linecap="round"/>
					</g>

					<!-- Wink eyes (he-wk) -->
					<g class="he he-wk">
						<ellipse cx="78" cy="88" rx="11" ry="13"
						         fill="rgba(220,255,250,0.95)"/>
						<circle cx="80" cy="90" r="6.5" fill="#0A1A2E"/>
						<circle cx="82" cy="87" r="2.5" fill="rgba(91,232,218,0.9)"/>
						<circle cx="83" cy="85" r="1.2" fill="rgba(255,255,255,0.95)"/>
						<path d="M112,88 Q122,80 132,88"
						      fill="none" stroke="rgba(91,232,218,0.9)"
						      stroke-width="3" stroke-linecap="round"/>
						<ellipse cx="132" cy="97" rx="8" ry="4"
						         fill="rgba(255,140,160,0.55)"/>
					</g>

					<!-- Tease eyes (he-ts): half-closed -->
					<g class="he he-ts">
						<ellipse cx="78"  cy="90" rx="11" ry="8"
						         fill="rgba(220,255,250,0.95)"/>
						<ellipse cx="78"  cy="83" rx="11" ry="8"
						         fill="url(#hg-face)"/>
						<ellipse cx="122" cy="90" rx="11" ry="8"
						         fill="rgba(220,255,250,0.95)"/>
						<ellipse cx="122" cy="83" rx="11" ry="8"
						         fill="url(#hg-face)"/>
						<circle cx="80"  cy="91" r="5.5" fill="#0A1A2E"/>
						<circle cx="124" cy="91" r="5.5" fill="#0A1A2E"/>
						<circle cx="82"  cy="89" r="2"   fill="rgba(91,232,218,0.9)"/>
						<circle cx="126" cy="89" r="2"   fill="rgba(91,232,218,0.9)"/>
					</g>

					<!-- Read eyes (he-rd): pupils shifted down-right -->
					<g class="he he-rd">
						<ellipse cx="78"  cy="88" rx="11" ry="13"
						         fill="rgba(220,255,250,0.95)"/>
						<ellipse cx="122" cy="88" rx="11" ry="13"
						         fill="rgba(220,255,250,0.95)"/>
						<circle cx="83"  cy="93" r="6.5" fill="#0A1A2E"/>
						<circle cx="127" cy="93" r="6.5" fill="#0A1A2E"/>
						<circle cx="85"  cy="91" r="2.5" fill="rgba(91,232,218,0.9)"/>
						<circle cx="129" cy="91" r="2.5" fill="rgba(91,232,218,0.9)"/>
					</g>

					<!-- Love eyes (he-lv): heart pupils + sparkles + blush -->
					<g class="he he-lv">
						<use href="#hs-heart" x="66"  y="79" width="22" height="18"/>
						<use href="#hs-heart" x="110" y="79" width="22" height="18"/>
						<use href="#hs-spark" x="56"  y="70" width="10" height="10"/>
						<use href="#hs-spark" x="132" y="70" width="10" height="10"/>
						<ellipse cx="68"  cy="102" rx="9" ry="4.5"
						         fill="rgba(255,100,140,0.55)"/>
						<ellipse cx="132" cy="102" rx="9" ry="4.5"
						         fill="rgba(255,100,140,0.55)"/>
					</g>

					<!-- Dizzy eyes (he-dz): X-X + stars -->
					<g class="he he-dz">
						<line x1="68"  y1="80" x2="88"  y2="98"
						      stroke="rgba(91,232,218,0.9)" stroke-width="3.5"
						      stroke-linecap="round"/>
						<line x1="88"  y1="80" x2="68"  y2="98"
						      stroke="rgba(91,232,218,0.9)" stroke-width="3.5"
						      stroke-linecap="round"/>
						<line x1="112" y1="80" x2="132" y2="98"
						      stroke="rgba(91,232,218,0.9)" stroke-width="3.5"
						      stroke-linecap="round"/>
						<line x1="132" y1="80" x2="112" y2="98"
						      stroke="rgba(91,232,218,0.9)" stroke-width="3.5"
						      stroke-linecap="round"/>
						<use href="#hs-star" x="56"  y="62" width="16" height="16"/>
						<use href="#hs-star" x="128" y="62" width="16" height="16"/>
					</g>

				</g><!-- /#h-eyes -->

				<!-- ── Mouth expressions ── -->
				<g id="h-mouth" filter="url(#hf-glow)">

					<!-- Small smile (hm-sm) — default -->
					<g class="hm hm-sm">
						<path d="M84,112 Q100,124 116,112"
						      fill="none" stroke="rgba(91,232,218,0.9)"
						      stroke-width="2.8" stroke-linecap="round"/>
					</g>

					<!-- Grin (hm-gr) -->
					<g class="hm hm-gr">
						<path d="M78,110 Q100,130 122,110"
						      fill="rgba(10,26,46,0.8)"
						      stroke="rgba(91,232,218,0.9)"
						      stroke-width="2.5" stroke-linecap="round"/>
						<path d="M84,112 Q100,128 116,112 L114,114
						         Q100,126 86,114 Z"
						      fill="rgba(220,255,250,0.9)"/>
					</g>

					<!-- Open mouth (hm-o) -->
					<g class="hm hm-o">
						<ellipse cx="100" cy="116" rx="16" ry="10"
						         fill="rgba(6,18,30,0.95)"
						         stroke="rgba(91,232,218,0.7)"
						         stroke-width="1.5"/>
						<ellipse cx="100" cy="116" rx="12" ry="7"
						         fill="rgba(2,8,22,0.9)"/>
					</g>

					<!-- Flat mouth (hm-fl) -->
					<g class="hm hm-fl">
						<path d="M86,114 Q100,114 114,114"
						      fill="none" stroke="rgba(91,232,218,0.8)"
						      stroke-width="2.5" stroke-linecap="round"/>
					</g>

					<!-- Tongue out (hm-tg) -->
					<g class="hm hm-tg">
						<path d="M82,110 Q100,126 118,110"
						      fill="rgba(10,26,46,0.8)"
						      stroke="rgba(91,232,218,0.8)"
						      stroke-width="2" stroke-linecap="round"/>
						<ellipse cx="100" cy="124" rx="10" ry="7"
						         fill="#FF6B8A"
						         stroke="rgba(200,60,100,0.6)"
						         stroke-width="1"/>
					</g>

				</g><!-- /#h-mouth -->

				<!-- Sweat drop -->
				<use class="h-sweat"
				     href="#hs-sweat"
				     x="132" y="68"
				     width="14" height="22"/>

			</g><!-- /#h-face -->

			<!-- Watermark H1 logo -->
			<g id="h-logo" opacity="0.12">
				<text x="100" y="210"
				      font-family="serif"
				      font-size="28"
				      font-weight="700"
				      fill="rgba(91,232,218,0.8)"
				      text-anchor="middle"
				      letter-spacing="2">H1</text>
			</g>

		</svg><!-- /#h-char -->

		<!-- ── HUD / Speech bubble ── -->
		<div id="h-hud">
			<div id="h-typing">
				<span></span>
				<span></span>
				<span></span>
			</div>
			<p id="h-msg"></p>
			<div id="h-acts"></div>
		</div>

		<!-- Sleep ZZZ -->
		<div id="h-zzz">
			<b>Z</b>
			<b>z</b>
			<b>z</b>
		</div>

		<!-- Exclamation mark -->
		<div id="h-exclaim">!</div>

		<!-- Particles container -->
		<div id="h-particles"></div>

		<!-- Close button -->
		<button id="h-close" type="button" aria-label="بستن">×</button>

	</div><!-- /#harfo-w -->

	<!-- ── Restore button (shown when widget is closed) ── -->
	<div id="h-restore" role="button" tabindex="0" aria-label="نمایش حرفو">
		<svg xmlns="http://www.w3.org/2000/svg"
		     xmlns:xlink="http://www.w3.org/1999/xlink"
		     width="54" height="54"
		     viewBox="0 0 54 54">
			<ellipse cx="27" cy="27" rx="22" ry="24"
			         fill="url(#hg-body)" filter="url(#hf-shadow)"/>
			<ellipse cx="27" cy="23" rx="15" ry="11"
			         fill="url(#hg-face)"/>
			<circle cx="22"   cy="22" r="2.8" fill="rgba(220,255,250,0.95)"/>
			<circle cx="32"   cy="22" r="2.8" fill="rgba(220,255,250,0.95)"/>
			<circle cx="22.8" cy="22.5" r="1.4" fill="#0A1A2E"/>
			<circle cx="32.8" cy="22.5" r="1.4" fill="#0A1A2E"/>
			<path d="M22,28 Q27,33 32,28"
			      fill="none" stroke="rgba(91,232,218,0.9)"
			      stroke-width="1.5" stroke-linecap="round"/>
		</svg>
	</div>

	<!-- Toast notification -->
	<div id="h-toast" role="status" aria-live="polite"></div>

	<!-- Table of contents nav -->
	<nav id="h-toc" aria-label="فهرست"></nav>

	<!-- Palette panel -->
	<div id="h-palette">
		<div id="h-pal-box">
			<input id="h-pal-inp"
			       type="text"
			       placeholder="رنگ (مثلاً #FF6B8A)"
			       autocomplete="off"
			       dir="ltr"/>
			<div id="h-pal-hint"></div>
			<div id="h-pal-list"></div>
		</div>
	</div>

</div><!-- /#harfo-root -->
	<?php
}
