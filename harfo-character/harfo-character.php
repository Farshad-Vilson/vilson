<?php
/**
 * Plugin Name: حرفو - کاراکتر هوشمند حرف اول
 * Plugin URI: https://harfaval.com
 * Description: کاراکتر ژله‌ای هوشمند با هویت بصری برند حرف اول — روی دکمه‌ها می‌پرد، متن می‌خواند، می‌خوابد و بازیگوشی می‌کند.
 * Version: 1.0.0
 * Author: حرف اول
 * Author URI: https://harfaval.com
 * Text Domain: harfo
 * License: GPL v2 or later
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HARFO_VERSION', '1.0.0' );
define( 'HARFO_URL', plugin_dir_url( __FILE__ ) );
define( 'HARFO_PATH', plugin_dir_path( __FILE__ ) );

function harfo_enqueue_assets() {
	wp_enqueue_style(
		'harfo-style',
		HARFO_URL . 'assets/harfo.css',
		[],
		HARFO_VERSION
	);
	wp_enqueue_script(
		'harfo-script',
		HARFO_URL . 'assets/harfo.js',
		[],
		HARFO_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'harfo_enqueue_assets' );

function harfo_render() {
	?>
	<div id="harfo-wrapper" dir="rtl" aria-hidden="true">

		<div id="harfo-container" class="harfo-state-loading">

			<!-- حباب گفتار -->
			<div id="harfo-speech" role="status" aria-live="polite"></div>

			<!-- ZZZ خواب -->
			<div id="harfo-zzz" aria-hidden="true">
				<span class="hz hz1">Z</span>
				<span class="hz hz2">z</span>
				<span class="hz hz3">z</span>
			</div>

			<!-- SVG کاراکتر -->
			<svg id="harfo-svg" viewBox="0 0 100 112" xmlns="http://www.w3.org/2000/svg">

				<!-- سایه -->
				<ellipse id="harfo-shadow" cx="50" cy="110" rx="22" ry="4" fill="rgba(13,27,42,0.14)"/>

				<!-- بازوها (در حالت‌های خاص نمایش داده می‌شوند) -->
				<path class="harfo-arm harfo-arm-r" d="M80,52 Q97,46 93,63"
					stroke="#1DBFB4" stroke-width="7" fill="none" stroke-linecap="round"/>
				<path class="harfo-arm harfo-arm-l" d="M20,52 Q3,46 7,63"
					stroke="#1DBFB4" stroke-width="7" fill="none" stroke-linecap="round"/>

				<!-- بدن ژله‌ای -->
				<path class="harfo-blob-body"
					d="M50,8 C73,8 89,25 89,47 C89,69 77,85 63,94 C58,98 50,103 50,103
					   C50,103 42,98 37,94 C23,85 11,69 11,47 C11,25 27,8 50,8 Z"
					fill="#1DBFB4"/>

				<!-- هایلایت بدن -->
				<ellipse cx="34" cy="26" rx="9" ry="6"
					fill="rgba(255,255,255,0.2)" transform="rotate(-25 34 26)"/>

				<!-- گونه‌ها -->
				<circle cx="23" cy="60" r="10" fill="#0fb8ac" opacity="0.35"/>
				<circle cx="77" cy="60" r="10" fill="#0fb8ac" opacity="0.35"/>

				<!-- سفیدی چشم -->
				<circle cx="36" cy="45" r="12" fill="white"/>
				<circle cx="64" cy="45" r="12" fill="white"/>

				<!-- مردمک -->
				<circle class="harfo-pupil harfo-pupil-l" cx="37" cy="46" r="7.5" fill="#0D1B2A"/>
				<circle class="harfo-pupil harfo-pupil-r" cx="65" cy="46" r="7.5" fill="#0D1B2A"/>

				<!-- برق چشم -->
				<circle cx="40" cy="43" r="2.5" fill="white"/>
				<circle cx="68" cy="43" r="2.5" fill="white"/>

				<!-- پلک (برای خواب و پلک زدن) -->
				<rect class="harfo-eyelid harfo-eyelid-l" x="24" y="33" width="24" height="24" rx="12" fill="#1DBFB4"/>
				<rect class="harfo-eyelid harfo-eyelid-r" x="52" y="33" width="24" height="24" rx="12" fill="#1DBFB4"/>

				<!-- دهان - حالت‌های مختلف -->
				<path class="harfo-mouth m-happy"
					d="M37,65 Q50,75 63,65"
					stroke="#0D1B2A" stroke-width="3" fill="none" stroke-linecap="round"/>
				<path class="harfo-mouth m-sad"
					d="M37,72 Q50,63 63,72"
					stroke="#0D1B2A" stroke-width="3" fill="none" stroke-linecap="round"/>
				<path class="harfo-mouth m-open"
					d="M38,63 Q50,76 62,63 Q50,78 38,63 Z"
					stroke="#0D1B2A" stroke-width="2" fill="#0D1B2A" stroke-linecap="round"/>
				<path class="harfo-mouth m-neutral"
					d="M40,68 L60,68"
					stroke="#0D1B2A" stroke-width="3" fill="none" stroke-linecap="round"/>

			</svg>

			<!-- دکمه پنهان کردن -->
			<button id="harfo-hide-btn" title="پنهان کردن حرفو" aria-label="پنهان کردن کاراکتر">×</button>

		</div>

		<!-- دکمه نمایش (وقتی پنهان است) -->
		<button id="harfo-show-btn" title="نمایش حرفو" aria-label="نمایش کاراکتر حرفو">
			<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
				<circle cx="22" cy="22" r="20" fill="#1DBFB4"/>
				<circle cx="16" cy="20" r="4.5" fill="#0D1B2A"/>
				<circle cx="28" cy="20" r="4.5" fill="#0D1B2A"/>
				<circle cx="17.5" cy="18.5" r="1.5" fill="white"/>
				<circle cx="29.5" cy="18.5" r="1.5" fill="white"/>
				<path d="M15,28 Q22,34 29,28" stroke="#0D1B2A" stroke-width="2.5"
					fill="none" stroke-linecap="round"/>
			</svg>
		</button>

	</div>
	<?php
}
add_action( 'wp_footer', 'harfo_render' );
