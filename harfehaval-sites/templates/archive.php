<?php
/**
 * Frontend archive template for [ha_sites] shortcode.
 *
 * Variables available:
 *   $atts (array) — shortcode attributes:
 *     columns      (string) 2|3|4
 *     show_search  (bool)
 *     show_filters (bool)
 *     show_sort    (bool)
 *     category     (string) pre-filter slug
 *     feature      (string) pre-filter slug
 *
 * @package HarfehavalSites
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$ha_columns     = isset( $atts['columns'] ) ? (string) $atts['columns'] : '3';
$ha_show_search = isset( $atts['show_search'] ) ? (bool) $atts['show_search'] : true;
$ha_show_filter = isset( $atts['show_filters'] ) ? (bool) $atts['show_filters'] : true;
$ha_show_sort   = isset( $atts['show_sort'] ) ? (bool) $atts['show_sort'] : true;
$ha_init_cat    = isset( $atts['category'] ) ? esc_attr( $atts['category'] ) : '';
$ha_init_feat   = isset( $atts['feature'] ) ? esc_attr( $atts['feature'] ) : '';
$ha_per_page    = (int) get_option( 'ha_sites_per_page', 12 );
?>

<div
	id="ha-sites-app"
	class="ha-sites-app"
	data-per-page="<?php echo esc_attr( $ha_per_page ); ?>"
	data-columns="<?php echo esc_attr( $ha_columns ); ?>"
	data-init-cat="<?php echo esc_attr( $ha_init_cat ); ?>"
	data-init-feat="<?php echo esc_attr( $ha_init_feat ); ?>"
	data-show-search="<?php echo $ha_show_search ? 'true' : 'false'; ?>"
	data-show-filters="<?php echo $ha_show_filter ? 'true' : 'false'; ?>"
	data-show-sort="<?php echo $ha_show_sort ? 'true' : 'false'; ?>"
>

	<?php if ( $ha_show_search || $ha_show_sort ) : ?>
	<!-- SEARCH + SORT BAR -->
	<div class="ha-topbar">

		<?php if ( $ha_show_search ) : ?>
		<div class="ha-search-wrap">
			<svg class="ha-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="11" cy="11" r="8"></circle>
				<path d="m21 21-4.35-4.35"></path>
			</svg>
			<input
				type="search"
				id="ha-search"
				class="ha-search-input"
				placeholder="<?php esc_attr_e( 'جستجو در سایت‌ها...', 'harfehaval-sites' ); ?>"
				autocomplete="off"
				aria-label="<?php esc_attr_e( 'جستجو در سایت‌ها', 'harfehaval-sites' ); ?>"
			>
		</div>
		<?php endif; ?>

		<?php if ( $ha_show_sort ) : ?>
		<div class="ha-sort-select-wrap">
			<select id="ha-sort" class="ha-sort-select" aria-label="<?php esc_attr_e( 'مرتب‌سازی', 'harfehaval-sites' ); ?>">
				<option value="newest"><?php esc_html_e( 'جدیدترین', 'harfehaval-sites' ); ?></option>
				<option value="oldest"><?php esc_html_e( 'قدیمی‌ترین', 'harfehaval-sites' ); ?></option>
				<option value="price_asc"><?php esc_html_e( 'ارزان‌ترین', 'harfehaval-sites' ); ?></option>
				<option value="price_desc"><?php esc_html_e( 'گران‌ترین', 'harfehaval-sites' ); ?></option>
				<option value="popular"><?php esc_html_e( 'پرطرفدار', 'harfehaval-sites' ); ?></option>
			</select>
		</div>
		<?php endif; ?>

	</div>
	<?php endif; ?>

	<?php if ( $ha_show_filter ) : ?>
	<!-- CATEGORY AND FEATURE FILTERS -->
	<div class="ha-filters" id="ha-filters">

		<div class="ha-cat-filters" id="ha-cat-filters">
			<button
				class="ha-cat-btn active"
				data-slug=""
				aria-pressed="true"
			><?php esc_html_e( 'همه دسته‌ها', 'harfehaval-sites' ); ?></button>
			<!-- More category buttons loaded dynamically via JS -->
		</div>

		<div class="ha-feat-filters" id="ha-feat-filters">
			<!-- Feature pills loaded dynamically via JS -->
		</div>

	</div>
	<?php endif; ?>

	<!-- RESULTS COUNTER -->
	<div class="ha-counter" id="ha-counter" aria-live="polite" aria-atomic="true"></div>

	<!-- SITES GRID -->
	<div class="ha-grid ha-grid-cols-<?php echo esc_attr( $ha_columns ); ?>" id="ha-grid" role="list">

		<!-- Initial skeleton cards shown while first load is in progress -->
		<?php for ( $i = 0; $i < 6; $i++ ) : ?>
		<div class="ha-skeleton-card" aria-hidden="true">
			<div class="ha-skeleton-img"></div>
			<div class="ha-skeleton-line"></div>
			<div class="ha-skeleton-line short"></div>
			<div class="ha-skeleton-line short" style="width:40%"></div>
		</div>
		<?php endfor; ?>

	</div>

	<!-- LOAD MORE -->
	<div class="ha-loadmore-wrap" id="ha-loadmore-wrap">
		<button
			id="ha-loadmore"
			class="ha-loadmore-btn"
			style="display:none"
			aria-label="<?php esc_attr_e( 'نمایش سایت‌های بیشتر', 'harfehaval-sites' ); ?>"
		><?php esc_html_e( 'نمایش بیشتر', 'harfehaval-sites' ); ?></button>
	</div>

	<!-- NO RESULTS MESSAGE -->
	<div id="ha-no-results" class="ha-no-results" style="display:none" role="status">
		<div class="ha-no-results-icon" aria-hidden="true">🔍</div>
		<p><?php esc_html_e( 'نتیجه‌ای یافت نشد', 'harfehaval-sites' ); ?></p>
		<button id="ha-reset" class="ha-reset-btn">
			<?php esc_html_e( 'بازنشانی فیلترها', 'harfehaval-sites' ); ?>
		</button>
	</div>

</div><!-- /.ha-sites-app -->

<!-- QUICK-VIEW MODAL (outside the app container) -->
<div
	id="ha-modal"
	class="ha-modal"
	role="dialog"
	aria-modal="true"
	aria-labelledby="ha-modal-title"
	style="display:none"
>
	<div class="ha-modal-backdrop" id="ha-modal-backdrop"></div>

	<div class="ha-modal-inner">
		<!-- Close button -->
		<button
			class="ha-modal-close"
			id="ha-modal-close"
			aria-label="<?php esc_attr_e( 'بستن پنجره', 'harfehaval-sites' ); ?>"
		>✕</button>

		<div class="ha-modal-layout">

			<!-- LEFT: Live preview -->
			<div class="ha-modal-left">
				<div class="ha-modal-device-bar">
					<button class="ha-device-btn active" data-device="desktop" aria-pressed="true">
						🖥 <?php esc_html_e( 'دسکتاپ', 'harfehaval-sites' ); ?>
					</button>
					<button class="ha-device-btn" data-device="tablet" aria-pressed="false">
						⬜ <?php esc_html_e( 'تبلت', 'harfehaval-sites' ); ?>
					</button>
					<button class="ha-device-btn" data-device="mobile" aria-pressed="false">
						📱 <?php esc_html_e( 'موبایل', 'harfehaval-sites' ); ?>
					</button>
				</div>

				<div class="ha-iframe-wrap" id="ha-iframe-wrap">
					<iframe
						id="ha-modal-iframe"
						class="ha-modal-iframe desktop"
						src="about:blank"
						title="<?php esc_attr_e( 'پیش‌نمایش سایت', 'harfehaval-sites' ); ?>"
						sandbox="allow-scripts allow-same-origin"
					></iframe>
					<div class="ha-iframe-loader" id="ha-iframe-loader">
						<div class="ha-spinner" aria-hidden="true"></div>
						<span><?php esc_html_e( 'در حال بارگذاری...', 'harfehaval-sites' ); ?></span>
					</div>
				</div>
			</div>

			<!-- RIGHT: Site info & actions -->
			<div class="ha-modal-right">
				<div id="ha-modal-badge" class="ha-modal-badge"></div>
				<h2 id="ha-modal-title" class="ha-modal-title"></h2>
				<p id="ha-modal-desc" class="ha-modal-desc"></p>

				<div id="ha-modal-cats" class="ha-modal-cats"></div>
				<div id="ha-modal-feats" class="ha-modal-feats"></div>

				<div class="ha-modal-price-row">
					<span id="ha-modal-price" class="ha-modal-price"></span>
				</div>

				<div class="ha-modal-ctas">
					<a
						id="ha-modal-wa"
						class="ha-btn ha-btn-wa"
						href="#"
						target="_blank"
						rel="noopener noreferrer"
					>
						<!-- WhatsApp SVG icon -->
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
						</svg>
						<?php esc_html_e( 'سفارش این سایت', 'harfehaval-sites' ); ?>
					</a>
					<a
						id="ha-modal-demo"
						class="ha-btn ha-btn-demo"
						href="#"
						target="_blank"
						rel="noopener noreferrer"
					><?php esc_html_e( 'مشاهده کامل ↗', 'harfehaval-sites' ); ?></a>
				</div>
			</div>

		</div><!-- /.ha-modal-layout -->
	</div><!-- /.ha-modal-inner -->
</div><!-- /#ha-modal -->
