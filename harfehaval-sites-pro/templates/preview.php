<?php
/**
 * Standalone full-screen preview page for Harfehaval Sites Pro.
 *
 * @package HarfehavalSitesPro
 */

defined( 'ABSPATH' ) || exit;

$raw_url = isset( $_GET['browser_url'] ) ? wp_unslash( $_GET['browser_url'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$browser_url = filter_var( $raw_url, FILTER_VALIDATE_URL );
$domain = '';
$is_valid = false;

if ( $browser_url && in_array( parse_url( $browser_url, PHP_URL_SCHEME ), array( 'http', 'https' ), true ) ) {
	$is_valid = true;
	$domain = (string) parse_url( $browser_url, PHP_URL_HOST );
}

$page_title = $is_valid ? sprintf( 'پیش‌نمایش: %s', $domain ) : 'پیش‌نمایش سایت';
$back_url = ! empty( $_SERVER['HTTP_REFERER'] ) ? esc_url( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) : esc_url( home_url( '/' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?> dir="rtl">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title><?php echo esc_html( $page_title ); ?></title>
	<meta name="robots" content="noindex,nofollow">
	<style>
		*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
		:root{--ha-primary:#011627;--ha-accent:#2ec4b6;--ha-border:#dbe5ef;--ha-muted:#8aa0b5;--ha-topbar:68px;--ha-font:IRANYekan,Vazirmatn,Tahoma,system-ui,-apple-system,"Segoe UI",sans-serif}
		html,body{height:100%;overflow:hidden;background:#dfe7f1;font-family:var(--ha-font);direction:rtl;color:#fff}
		.pv-invalid{height:100%;display:flex;align-items:center;justify-content:center;padding:24px;color:#011627;background:#f8fafc;text-align:center}
		.pv-invalid-box{width:min(520px,100%);padding:28px;border:1px solid var(--ha-border);border-radius:24px;background:#fff;box-shadow:0 22px 70px rgba(1,22,39,.10)}
		.pv-invalid-icon{font-size:42px;margin-bottom:10px}.pv-invalid h1{font-size:22px;margin-bottom:8px}.pv-invalid p{color:#64748b;line-height:1.9;margin-bottom:18px}.pv-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:8px 16px;border-radius:999px;background:var(--ha-primary);color:#fff;text-decoration:none;font-weight:900}
		.pv-topbar{position:fixed;inset:0 0 auto 0;height:var(--ha-topbar);z-index:10;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:10px 14px;background:var(--ha-primary);box-shadow:0 8px 32px rgba(0,0,0,.22)}
		.pv-back,.pv-newtab,.pv-device button{appearance:none;border:1px solid rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:8px 13px;border-radius:999px;background:rgba(255,255,255,.10);color:#fff;text-decoration:none;font-family:var(--ha-font);font-size:12px;font-weight:950;cursor:pointer;transition:.18s ease;white-space:nowrap}
		.pv-back:hover,.pv-newtab:hover,.pv-device button:hover,.pv-device button.active{background:var(--ha-accent);border-color:var(--ha-accent);color:var(--ha-primary)}
		.pv-domain{min-width:0;display:flex;flex-direction:column;gap:2px}.pv-domain strong{font-size:14px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pv-domain span{direction:ltr;text-align:right;font-size:12px;color:rgba(255,255,255,.66);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
		.pv-right{display:flex;align-items:center;gap:8px;min-width:0}.pv-device{display:flex;align-items:center;gap:7px}.pv-frame-wrap{position:fixed;inset:var(--ha-topbar) 0 0 0;display:flex;align-items:stretch;justify-content:center;overflow:auto;background:#dfe7f1}.pv-frame{width:100%;height:100%;border:0;background:#fff;transition:.2s ease}.pv-frame.tablet{width:768px;max-width:100%;height:calc(100% - 44px);min-height:720px;margin:22px;border-radius:18px;box-shadow:0 18px 56px rgba(1,22,39,.22)}.pv-frame.mobile{width:390px;max-width:100%;height:calc(100% - 44px);min-height:720px;margin:22px;border-radius:28px;box-shadow:0 18px 56px rgba(1,22,39,.22)}
		.pv-loader{position:fixed;inset:var(--ha-topbar) 0 0 0;display:flex;align-items:center;justify-content:center;gap:12px;background:rgba(223,231,241,.88);color:#011627;font-weight:900;z-index:5;transition:opacity .2s ease}.pv-loader.hidden{opacity:0;pointer-events:none}.pv-spinner{width:30px;height:30px;border-radius:50%;border:3px solid rgba(1,22,39,.13);border-top-color:var(--ha-accent);animation:spin .75s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
		.pv-error{position:fixed;inset:var(--ha-topbar) 0 0 0;display:none;align-items:center;justify-content:center;padding:24px;color:#011627;text-align:center}.pv-error.visible{display:flex}.pv-error-box{width:min(520px,100%);padding:28px;border:1px solid var(--ha-border);border-radius:24px;background:#fff;box-shadow:0 22px 70px rgba(1,22,39,.10)}
		@media(max-width:850px){:root{--ha-topbar:148px}.pv-topbar{grid-template-columns:1fr;height:var(--ha-topbar)}.pv-right{overflow-x:auto}.pv-device{overflow-x:auto}.pv-back,.pv-newtab,.pv-device button{min-height:36px;padding:6px 10px;font-size:11px}}
	</style>
</head>
<body>
<?php if ( ! $is_valid ) : ?>
	<div class="pv-invalid"><div class="pv-invalid-box"><div class="pv-invalid-icon">🔗</div><h1>لینک پیش‌نمایش معتبر نیست</h1><p>آدرس دمو باید با http یا https ارسال شود.</p><a class="pv-btn" href="<?php echo esc_url( home_url( '/' ) ); ?>">بازگشت به سایت</a></div></div>
<?php else : ?>
	<header class="pv-topbar">
		<a class="pv-back" href="<?php echo esc_url( $back_url ); ?>">← بازگشت</a>
		<div class="pv-domain"><strong><?php echo esc_html( $page_title ); ?></strong><span><?php echo esc_html( $browser_url ); ?></span></div>
		<div class="pv-right">
			<div class="pv-device" role="group" aria-label="انتخاب دستگاه">
				<button type="button" class="active" data-device="desktop">🖥 دسکتاپ</button>
				<button type="button" data-device="tablet">⬜ تبلت</button>
				<button type="button" data-device="mobile">📱 موبایل</button>
			</div>
			<a class="pv-newtab" href="<?php echo esc_url( $browser_url ); ?>" target="_blank" rel="noopener noreferrer">تب جدید ↗</a>
		</div>
	</header>
	<main class="pv-frame-wrap">
		<iframe id="pv-frame" class="pv-frame desktop" src="<?php echo esc_url( $browser_url ); ?>" title="<?php echo esc_attr( $page_title ); ?>" allowfullscreen></iframe>
	</main>
	<div class="pv-loader" id="pv-loader"><span class="pv-spinner"></span><span>در حال بارگذاری پیش‌نمایش...</span></div>
	<div class="pv-error" id="pv-error"><div class="pv-error-box"><div style="font-size:42px;margin-bottom:10px">⚠️</div><h2>پیش‌نمایش داخل iframe باز نشد</h2><p style="margin:8px 0 18px;color:#64748b;line-height:1.9">بعضی سایت‌ها نمایش داخل iframe را مسدود می‌کنند. می‌توانید دمو را مستقیم باز کنید.</p><a class="pv-btn" href="<?php echo esc_url( $browser_url ); ?>" target="_blank" rel="noopener noreferrer">باز کردن در تب جدید</a></div></div>
	<script>
	(function(){var frame=document.getElementById('pv-frame'),loader=document.getElementById('pv-loader'),error=document.getElementById('pv-error'),timer;function hide(){clearTimeout(timer);if(loader)loader.classList.add('hidden')}function showError(){hide();if(frame)frame.style.display='none';if(error)error.classList.add('visible')}if(frame){frame.addEventListener('load',hide);timer=setTimeout(showError,15000)}document.querySelectorAll('[data-device]').forEach(function(btn){btn.addEventListener('click',function(){document.querySelectorAll('[data-device]').forEach(function(b){b.classList.remove('active')});btn.classList.add('active');if(frame)frame.className='pv-frame '+btn.getAttribute('data-device')})})})();
	</script>
<?php endif; ?>
</body>
</html>
