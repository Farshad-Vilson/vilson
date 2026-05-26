<?php
/**
 * Plugin Name: حرفو — کاراکتر هوشمند حرف اول
 * Plugin URI:  https://harfaval.com
 * Description: کاراکتر ژله‌ای هوشمند با فیزیک واقعی، تحلیل محتوا و حافظه بازدیدکننده.
 * Version:     2.0.0
 * Author:      حرف اول
 * Text Domain: harfo
 * License:     GPL v2 or later
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HARFO_VER', '2.0.0' );
define( 'HARFO_URL', plugin_dir_url( __FILE__ ) );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(  'harfo', HARFO_URL . 'assets/harfo.css', [], HARFO_VER );
	wp_enqueue_script( 'harfo', HARFO_URL . 'assets/harfo.js',  [], HARFO_VER, true );
} );

add_action( 'wp_footer', function () { ?>
<div id="harfo-wrapper" dir="rtl" aria-hidden="true">

	<!-- ── کاراکتر اصلی ── -->
	<div id="harfo-frame" class="hm-loading">

		<!-- حباب گفتار با typing indicator -->
		<div id="harfo-bubble">
			<div id="harfo-bubble-inner">
				<div id="harfo-typing">
					<span class="hd"></span>
					<span class="hd"></span>
					<span class="hd"></span>
				</div>
				<span id="harfo-text"></span>
			</div>
		</div>

		<!-- ZZZ خواب -->
		<div id="harfo-zzz" aria-hidden="true">
			<b class="hz hz1">Z</b>
			<b class="hz hz2">z</b>
			<b class="hz hz3">z</b>
		</div>

		<!-- SVG کاراکتر — طراحی حیوان خانگی -->
		<svg id="harfo-svg" viewBox="0 0 100 112" xmlns="http://www.w3.org/2000/svg">

			<!-- سایه زمینی -->
			<ellipse id="h-shadow" cx="50" cy="110" rx="21" ry="4"
				fill="rgba(13,27,42,0.13)"/>

			<!-- دُم -->
			<path id="h-tail"
				d="M 76,92 Q 90,84 87,73 Q 84,63 91,57"
				stroke="#1DBFB4" stroke-width="8.5"
				fill="none" stroke-linecap="round"/>

			<!-- گوش چپ -->
			<circle cx="27" cy="23" r="17" fill="#1DBFB4"/>
			<ellipse cx="27" cy="26" rx="9" ry="10" fill="#0fb3a8" opacity="0.5"/>

			<!-- گوش راست -->
			<circle cx="73" cy="23" r="17" fill="#1DBFB4"/>
			<ellipse cx="73" cy="26" rx="9" ry="10" fill="#0fb3a8" opacity="0.5"/>

			<!-- بدن اصلی -->
			<ellipse cx="50" cy="70" rx="39" ry="42" fill="#1DBFB4"/>

			<!-- هایلایت بدن -->
			<ellipse cx="37" cy="52" rx="9" ry="6.5"
				fill="rgba(255,255,255,0.18)" transform="rotate(-22 37 52)"/>

			<!-- گونه‌ها -->
			<circle cx="22" cy="65" r="10" fill="#0fb3a8" opacity="0.32"/>
			<circle cx="78" cy="65" r="10" fill="#0fb3a8" opacity="0.32"/>

			<!-- سفیدی چشم -->
			<circle cx="35" cy="52" r="13" fill="white"/>
			<circle cx="65" cy="52" r="13" fill="white"/>

			<!-- مردمک‌ها (JS این‌ها را برای ردیابی چشم جابه‌جا می‌کند) -->
			<circle id="h-pl" cx="35" cy="53" r="8.5" fill="#0D1B2A"/>
			<circle id="h-pr" cx="65" cy="53" r="8.5" fill="#0D1B2A"/>

			<!-- برق چشم -->
			<circle cx="38.5" cy="50" r="2.8" fill="white"/>
			<circle cx="68.5" cy="50" r="2.8" fill="white"/>

			<!-- پلک‌ها (CSS scaleY برای بستن) -->
			<rect class="h-lid" id="h-lid-l" x="22" y="39" width="26" height="26"
				rx="13" fill="#1DBFB4"/>
			<rect class="h-lid" id="h-lid-r" x="52" y="39" width="26" height="26"
				rx="13" fill="#1DBFB4"/>

			<!-- بینی -->
			<ellipse cx="50" cy="68" rx="3.5" ry="2.5" fill="#0D1B2A" opacity="0.65"/>

			<!-- دهان — حالت لبخند (پیش‌فرض) -->
			<path class="h-mouth h-smile"
				d="M 37,76 Q 50,86 63,76"
				stroke="#0D1B2A" stroke-width="2.8" fill="none" stroke-linecap="round"/>

			<!-- دهان — ناراحت -->
			<path class="h-mouth h-sad"
				d="M 37,82 Q 50,74 63,82"
				stroke="#0D1B2A" stroke-width="2.8" fill="none" stroke-linecap="round"/>

			<!-- دهان — هیجان‌زده (باز) -->
			<path class="h-mouth h-open"
				d="M 39,75 Q 50,86 61,75 Q 50,92 39,75 Z"
				fill="#0D1B2A" stroke="none"/>

			<!-- دهان — بی‌تفاوت / خواب -->
			<path class="h-mouth h-neutral"
				d="M 41,79 L 59,79"
				stroke="#0D1B2A" stroke-width="2.8" fill="none" stroke-linecap="round"/>

			<!-- دست کمکی (در حالت helping) -->
			<path class="h-arm h-arm-r"
				d="M 83,65 Q 97,60 94,74"
				stroke="#1DBFB4" stroke-width="8" fill="none" stroke-linecap="round"/>

		</svg>

		<!-- دکمه بستن -->
		<button id="harfo-close" title="پنهان کردن حرفو" aria-label="پنهان کردن">×</button>

	</div><!-- /harfo-frame -->

	<!-- دکمه بازگشت (وقتی پنهان است) -->
	<button id="harfo-restore" title="نمایش حرفو" aria-label="باز کردن حرفو">
		<svg viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg">
			<circle cx="23" cy="23" r="21" fill="#1DBFB4"/>
			<circle cx="17" cy="21" r="5" fill="#0D1B2A"/>
			<circle cx="29" cy="21" r="5" fill="#0D1B2A"/>
			<circle cx="18.5" cy="19.5" r="1.8" fill="white"/>
			<circle cx="30.5" cy="19.5" r="1.8" fill="white"/>
			<path d="M15,29 Q23,36 31,29"
				stroke="#0D1B2A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
		</svg>
	</button>

</div>
<?php } );
