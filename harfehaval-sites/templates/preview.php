<?php
/**
 * Standalone preview page — full HTML document.
 * Loaded via the ha_sites_preview rewrite rule (template_redirect hook).
 *
 * Gets ?browser_url=<encoded-url>, validates it, then shows a top bar with
 * device switcher, domain badge, back & new-tab links, and a full-screen
 * iframe pointing at the demo URL directly (no proxy).
 *
 * No WordPress template hierarchy is used. WordPress is still bootstrapped
 * so we can use wp_kses, esc_*, home_url, etc.
 *
 * @package HarfehavalSites
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// ---- Validate the browser_url parameter ----
$raw_url = isset( $_GET['browser_url'] ) ? wp_unslash( $_GET['browser_url'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$browser_url = filter_var( $raw_url, FILTER_VALIDATE_URL );
$domain      = '';
$is_valid     = false;

if ( $browser_url && in_array( parse_url( $browser_url, PHP_URL_SCHEME ), array( 'http', 'https' ), true ) ) {
	$is_valid = true;
	$domain   = parse_url( $browser_url, PHP_URL_HOST );
}

// ---- Page title ----
$page_title = $is_valid
	? sprintf( __( 'پیش‌نمایش: %s', 'harfehaval-sites' ), esc_html( $domain ) )
	: __( 'پیش‌نمایش سایت', 'harfehaval-sites' );

$back_url = ! empty( $_SERVER['HTTP_REFERER'] ) ? esc_url( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) : esc_url( home_url( '/' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title><?php echo esc_html( $page_title ); ?></title>
	<meta name="robots" content="noindex, nofollow">
	<style>
		*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

		:root {
			--ha-primary: #011627;
			--ha-accent:  #bff672;
			--ha-border:  #e5e7eb;
			--ha-bg-muted: #f1f5f9;
			--ha-text-muted: #5f6b7a;
			--ha-radius: 999px;
			--topbar-h: 56px;
		}

		html, body {
			height: 100%;
			font-family: system-ui, -apple-system, Tahoma, 'Segoe UI', sans-serif;
			background: var(--ha-bg-muted);
			direction: rtl;
		}

		/* ---- Top bar ---- */
		.pv-topbar {
			position: fixed;
			top: 0;
			right: 0;
			left: 0;
			height: var(--topbar-h);
			background: var(--ha-primary);
			color: #fff;
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 0 16px;
			z-index: 9999;
			box-shadow: 0 2px 8px rgba(0,0,0,.25);
		}

		.pv-back-btn {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 7px 14px;
			border-radius: var(--ha-radius);
			background: rgba(255,255,255,.12);
			color: #fff;
			text-decoration: none;
			font-size: 0.85rem;
			font-weight: 600;
			border: none;
			cursor: pointer;
			transition: background .2s;
			white-space: nowrap;
			flex-shrink: 0;
		}
		.pv-back-btn:hover { background: rgba(255,255,255,.22); }

		.pv-domain {
			flex: 1;
			display: flex;
			align-items: center;
			gap: 8px;
			overflow: hidden;
		}

		.pv-domain-badge {
			background: rgba(191,246,114,.15);
			border: 1px solid rgba(191,246,114,.35);
			color: var(--ha-accent);
			padding: 4px 12px;
			border-radius: var(--ha-radius);
			font-size: 0.82rem;
			font-weight: 700;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			max-width: 280px;
		}

		.pv-newtab-link {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			color: rgba(255,255,255,.7);
			font-size: 0.8rem;
			text-decoration: none;
			white-space: nowrap;
			flex-shrink: 0;
			transition: color .2s;
		}
		.pv-newtab-link:hover { color: #fff; }

		/* ---- Device switcher ---- */
		.pv-device-bar {
			display: flex;
			gap: 6px;
			flex-shrink: 0;
		}

		.pv-device-btn {
			padding: 5px 12px;
			border-radius: var(--ha-radius);
			border: 1.5px solid rgba(255,255,255,.2);
			background: transparent;
			color: rgba(255,255,255,.75);
			cursor: pointer;
			font-size: 0.8rem;
			transition: all .2s;
			white-space: nowrap;
		}
		.pv-device-btn:hover { border-color: rgba(255,255,255,.5); color: #fff; }
		.pv-device-btn.active {
			background: var(--ha-accent);
			border-color: var(--ha-accent);
			color: var(--ha-primary);
			font-weight: 700;
		}

		/* ---- Iframe area ---- */
		.pv-frame-wrap {
			position: fixed;
			top: var(--topbar-h);
			right: 0;
			bottom: 0;
			left: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--ha-bg-muted);
			overflow: hidden;
		}

		.pv-iframe {
			display: block;
			border: none;
			height: 100%;
			background: #fff;
			transition: width .35s cubic-bezier(.4,0,.2,1), box-shadow .35s;
		}

		.pv-iframe.desktop { width: 100%; }
		.pv-iframe.tablet  { width: 768px;  box-shadow: 0 0 0 3px var(--ha-border); }
		.pv-iframe.mobile  { width: 390px;  box-shadow: 0 0 0 3px var(--ha-border); }

		/* ---- Loader overlay ---- */
		.pv-loader {
			position: absolute;
			inset: 0;
			background: #fff;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 14px;
			z-index: 10;
			transition: opacity .3s;
		}
		.pv-loader.hidden { opacity: 0; pointer-events: none; }

		.pv-spinner {
			width: 38px;
			height: 38px;
			border: 4px solid var(--ha-bg-muted);
			border-top-color: var(--ha-primary);
			border-radius: 50%;
			animation: pv-spin .75s linear infinite;
		}
		@keyframes pv-spin { to { transform: rotate(360deg); } }

		.pv-loader-text { color: var(--ha-text-muted); font-size: 0.9rem; }

		/* ---- Error state ---- */
		.pv-error {
			display: none;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 16px;
			text-align: center;
			padding: 40px 24px;
			color: var(--ha-text-muted);
		}
		.pv-error.visible { display: flex; }
		.pv-error-icon { font-size: 3rem; }
		.pv-error-title { font-size: 1.1rem; font-weight: 700; color: var(--ha-primary); }
		.pv-error-btn {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 10px 24px;
			background: var(--ha-primary);
			color: #fff;
			border-radius: var(--ha-radius);
			text-decoration: none;
			font-weight: 700;
			font-size: 0.9rem;
		}

		/* ---- Invalid URL page ---- */
		.pv-invalid {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
			gap: 16px;
			text-align: center;
			padding: 32px;
			color: var(--ha-text-muted);
		}
		.pv-invalid-icon { font-size: 3.5rem; }
		.pv-invalid h1 { font-size: 1.3rem; font-weight: 800; color: var(--ha-primary); }

		@media (max-width: 600px) {
			.pv-device-bar { display: none; }
			.pv-domain-badge { max-width: 160px; }
			.pv-iframe.tablet,
			.pv-iframe.mobile { width: 100%; box-shadow: none; }
		}
	</style>
</head>
<body>

<?php if ( ! $is_valid ) : ?>

	<div class="pv-invalid">
		<div class="pv-invalid-icon">🔗</div>
		<h1><?php esc_html_e( 'آدرس نامعتبر', 'harfehaval-sites' ); ?></h1>
		<p><?php esc_html_e( 'آدرس سایت موردنظر معتبر نیست یا مشخص نشده است.', 'harfehaval-sites' ); ?></p>
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="pv-error-btn">
			<?php esc_html_e( 'بازگشت به خانه', 'harfehaval-sites' ); ?>
		</a>
	</div>

<?php else : ?>

	<!-- TOP BAR -->
	<div class="pv-topbar">
		<a href="<?php echo esc_url( $back_url ); ?>" class="pv-back-btn" aria-label="<?php esc_attr_e( 'بازگشت', 'harfehaval-sites' ); ?>">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
			<?php esc_html_e( 'بازگشت', 'harfehaval-sites' ); ?>
		</a>

		<div class="pv-domain">
			<span class="pv-domain-badge" title="<?php echo esc_attr( $browser_url ); ?>">
				🌐 <?php echo esc_html( $domain ); ?>
			</span>
			<a
				href="<?php echo esc_url( $browser_url ); ?>"
				class="pv-newtab-link"
				target="_blank"
				rel="noopener noreferrer"
				title="<?php esc_attr_e( 'باز کردن در تب جدید', 'harfehaval-sites' ); ?>"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
				<?php esc_html_e( 'تب جدید', 'harfehaval-sites' ); ?>
			</a>
		</div>

		<!-- Device switcher -->
		<div class="pv-device-bar" role="group" aria-label="<?php esc_attr_e( 'انتخاب دستگاه', 'harfehaval-sites' ); ?>">
			<button class="pv-device-btn active" data-device="desktop" aria-pressed="true">
				🖥 <?php esc_html_e( 'دسکتاپ', 'harfehaval-sites' ); ?>
			</button>
			<button class="pv-device-btn" data-device="tablet" aria-pressed="false">
				⬜ <?php esc_html_e( 'تبلت', 'harfehaval-sites' ); ?>
			</button>
			<button class="pv-device-btn" data-device="mobile" aria-pressed="false">
				📱 <?php esc_html_e( 'موبایل', 'harfehaval-sites' ); ?>
			</button>
		</div>
	</div>

	<!-- IFRAME AREA -->
	<div class="pv-frame-wrap" id="pv-frame-wrap">

		<iframe
			id="pv-iframe"
			class="pv-iframe desktop"
			src="<?php echo esc_url( $browser_url ); ?>"
			title="<?php echo esc_attr( sprintf( __( 'پیش‌نمایش %s', 'harfehaval-sites' ), $domain ) ); ?>"
			allowfullscreen
		></iframe>

		<!-- Loading overlay -->
		<div class="pv-loader" id="pv-loader">
			<div class="pv-spinner" aria-hidden="true"></div>
			<span class="pv-loader-text"><?php esc_html_e( 'در حال بارگذاری پیش‌نمایش...', 'harfehaval-sites' ); ?></span>
		</div>

		<!-- Error fallback (shown after 15s timeout) -->
		<div class="pv-error" id="pv-error" role="alert">
			<div class="pv-error-icon" aria-hidden="true">⚠️</div>
			<p class="pv-error-title"><?php esc_html_e( 'بارگذاری انجام نشد', 'harfehaval-sites' ); ?></p>
			<p><?php esc_html_e( 'سایت از نمایش در iframe جلوگیری می‌کند. آن را مستقیم باز کنید.', 'harfehaval-sites' ); ?></p>
			<a
				href="<?php echo esc_url( $browser_url ); ?>"
				class="pv-error-btn"
				target="_blank"
				rel="noopener noreferrer"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
				<?php esc_html_e( 'باز کردن در تب جدید', 'harfehaval-sites' ); ?>
			</a>
		</div>

	</div>

	<script>
	(function () {
		'use strict';

		var iframe   = document.getElementById('pv-iframe');
		var loader   = document.getElementById('pv-loader');
		var errorBox = document.getElementById('pv-error');
		var devBtns  = document.querySelectorAll('.pv-device-btn');
		var errorTimer;

		// ----- Loader handling -----
		function hideLoader() {
			clearTimeout(errorTimer);
			if (loader) {
				loader.classList.add('hidden');
			}
		}

		function showError() {
			hideLoader();
			if (iframe) iframe.style.display = 'none';
			if (errorBox) errorBox.classList.add('visible');
		}

		if (iframe) {
			iframe.addEventListener('load', function () {
				try {
					// If X-Frame-Options blocks the iframe the contentDocument will be
					// inaccessible and often triggers a security error, but "load" fires.
					// We can't detect it directly; we rely on the timeout for that case.
					var doc = iframe.contentDocument;
					// If we can read the doc and it's empty, it probably was blocked.
					if (doc && (!doc.body || doc.body.innerHTML.trim() === '')) {
						showError();
						return;
					}
				} catch (e) {
					// Cross-origin access denied — iframe may still be showing content.
				}
				hideLoader();
			});

			// Fallback: if still loading after 15 seconds, show error.
			errorTimer = setTimeout(function () {
				showError();
			}, 15000);
		}

		// ----- Device switcher -----
		devBtns.forEach(function (btn) {
			btn.addEventListener('click', function () {
				var device = btn.getAttribute('data-device');

				devBtns.forEach(function (b) {
					b.classList.remove('active');
					b.setAttribute('aria-pressed', 'false');
				});
				btn.classList.add('active');
				btn.setAttribute('aria-pressed', 'true');

				if (iframe) {
					iframe.className = 'pv-iframe ' + device;
				}
			});
		});
	})();
	</script>

<?php endif; ?>

</body>
</html>
