<?php
/**
 * [ha_sites] Shortcode
 *
 * @package HarfehavalSites
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class HA_Shortcode
 *
 * Registers and renders the [ha_sites] shortcode.
 */
class HA_Shortcode {

	/**
	 * Register the shortcode.
	 *
	 * @return void
	 */
	public static function register() {
		add_shortcode( 'ha_sites', array( __CLASS__, 'render' ) );
	}

	/**
	 * Render the shortcode output.
	 *
	 * Supported attributes:
	 *   columns      (int 2|3|4, default 3)
	 *   show_search  (yes|no, default yes)
	 *   show_filters (yes|no, default yes)
	 *   show_sort    (yes|no, default yes)
	 *   category     (taxonomy slug, default '')
	 *   feature      (taxonomy slug, default '')
	 *
	 * @param array|string $atts    User-supplied attributes.
	 * @param string|null  $content Enclosed content (unused).
	 * @return string
	 */
	public static function render( $atts, $content = null ) {
		$atts = shortcode_atts(
			array(
				'columns'      => '3',
				'show_search'  => 'yes',
				'show_filters' => 'yes',
				'show_sort'    => 'yes',
				'category'     => '',
				'feature'      => '',
			),
			$atts,
			'ha_sites'
		);

		// Sanitize and normalise.
		$columns = in_array( (string) $atts['columns'], array( '2', '3', '4' ), true )
			? (string) $atts['columns']
			: '3';

		$show_search  = ( 'yes' === strtolower( trim( $atts['show_search'] ) ) );
		$show_filters = ( 'yes' === strtolower( trim( $atts['show_filters'] ) ) );
		$show_sort    = ( 'yes' === strtolower( trim( $atts['show_sort'] ) ) );
		$category     = sanitize_text_field( $atts['category'] );
		$feature      = sanitize_text_field( $atts['feature'] );

		// Build normalised atts array passed to the template.
		$atts = array(
			'columns'      => $columns,
			'show_search'  => $show_search,
			'show_filters' => $show_filters,
			'show_sort'    => $show_sort,
			'category'     => $category,
			'feature'      => $feature,
		);

		// Enqueue assets in case they weren't enqueued by has_shortcode check.
		if ( ! wp_style_is( 'ha-sites', 'enqueued' ) ) {
			wp_enqueue_style(
				'ha-sites',
				HA_SITES_URL . 'assets/css/frontend.css',
				array(),
				HA_SITES_VERSION
			);
		}
		if ( ! wp_script_is( 'ha-sites', 'enqueued' ) ) {
			wp_enqueue_script(
				'ha-sites',
				HA_SITES_URL . 'assets/js/frontend.js',
				array(),
				HA_SITES_VERSION,
				true
			);

			$wa_text = get_option( 'ha_sites_whatsapp_text', 'سلام، می‌خواهم سایت «%s» را سفارش بدهم' );

			wp_localize_script(
				'ha-sites',
				'haSites',
				array(
					'apiBase'     => rest_url( 'ha-sites/v1/' ),
					'nonce'       => wp_create_nonce( 'wp_rest' ),
					'perPage'     => (int) get_option( 'ha_sites_per_page', 12 ),
					'whatsapp'    => sanitize_text_field( get_option( 'ha_sites_whatsapp', '' ) ),
					'waText'      => $wa_text,
					'currency'    => get_option( 'ha_sites_currency', 'تومان' ),
					'previewBase' => home_url( '/ha-sites-preview/' ),
					'l10n'        => array(
						'loadMore'          => 'نمایش بیشتر',
						'loading'           => 'در حال بارگذاری...',
						'noResults'         => 'نتیجه‌ای یافت نشد',
						'resetFilter'       => 'بازنشانی فیلترها',
						'contact'           => 'تماس بگیرید',
						'order'             => 'سفارش واتساپ',
						'viewDemo'          => 'مشاهده نمونه',
						'quickView'         => 'پیش‌نمایش سریع',
						'allCats'           => 'همه دسته‌ها',
						'allFeats'          => 'همه ویژگی‌ها',
						'showing'           => 'نمایش',
						'of'                => 'از',
						'results'           => 'نتیجه',
						'close'             => 'بستن',
						'new'               => '✨ جدید',
						'popular'           => '🔥 پرفروش',
						'featured'          => '⭐ ویژه',
						'sortNewest'        => 'جدیدترین',
						'sortOldest'        => 'قدیمی‌ترین',
						'sortPriceAsc'      => 'ارزان‌ترین',
						'sortPriceDesc'     => 'گران‌ترین',
						'sortPopular'       => 'پرطرفدار',
						'searchPlaceholder' => 'جستجو در سایت‌ها...',
						'desktop'           => '🖥 دسکتاپ',
						'tablet'            => '⬜ تبلت',
						'mobile'            => '📱 موبایل',
						'previewLoading'    => 'در حال بارگذاری پیش‌نمایش...',
						'previewError'      => 'خطا در بارگذاری — باز کردن در تب جدید',
					),
				)
			);
		}

		// Capture output from template.
		ob_start();
		$template = HA_SITES_DIR . 'templates/archive.php';
		if ( file_exists( $template ) ) {
			include $template;
		} else {
			echo '<p style="color:red">' . esc_html__( 'خطا: فایل قالب یافت نشد.', 'harfehaval-sites' ) . '</p>';
		}

		return ob_get_clean();
	}
}
