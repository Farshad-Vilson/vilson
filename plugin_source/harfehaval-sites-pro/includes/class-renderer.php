<?php
/**
 * Front renderer and shortcode.
 *
 * @package HarfehavalSitesPro
 */

defined( 'ABSPATH' ) || exit;

class HA_Sites_Pro_Renderer {

	public static function shortcode( $atts = array() ) {
		$atts = shortcode_atts( self::default_atts(), $atts, 'ha_sites_pro' );
		return self::render( $atts );
	}

	public static function default_atts() {
		return array(
			'columns'              => '3',
			'tablet_columns'       => '2',
			'mobile_columns'       => '1',
			'layout'               => 'grid',
			'hover_effect'         => 'scroll',
			'pagination_type'      => 'load_more',
			'show_header'          => 'yes',
			'show_search'          => 'no',
			'show_filters'         => 'yes',
			'show_feature_filter'  => 'yes',
			'show_status_filter'   => 'no',
			'show_sort'            => 'no',
			'show_layout_switcher' => 'no',
			'show_counter'         => 'yes',
			'show_stats'           => 'no',
			'show_swatches'        => 'no',
			'show_fab'             => 'no',
			'show_keyboard_hints'  => 'no',
			'show_image'           => 'yes',
			'show_badge'           => 'no',
			'show_highlight'       => 'yes',
			'show_excerpt'         => 'yes',
			'show_features'        => 'no',
			'show_price'           => 'no',
			'show_old_price'       => 'no',
			'show_rating'          => 'no',
			'show_delivery'        => 'no',
			'show_installment'     => 'no',
			'show_favorite'        => 'no',
			'show_compare'         => 'no',
			'show_preview_button'  => 'yes',
			'show_order_button'    => 'yes',
			'category'             => '',
			'feature'              => '',
			'status'               => '',
			'sort'                 => 'newest',
			'per_page'             => '',
			'card_style'           => 'markil',
			'button_style'         => 'solid',
			'modal'                => 'yes',
			'preview_mode'         => 'fullscreen',
			'header_badge'         => '',
			'header_title'         => 'نمونه وبسایت‌هایی که برای کسب‌وکارها طراحی کرده‌ایم',
			'header_subtitle'      => '',
			'header_primary_text'  => 'مشاهده نمونه‌ها',
			'header_secondary_text'=> 'مشاوره سفارش',
			'search_placeholder'   => 'جستجو در سایت‌ها، امکانات، حوزه کاری...',
			'sort_label'           => 'مرتب‌سازی',
			'all_categories_label' => 'همه پروژه‌ها',
			'all_features_label'   => 'همه ویژگی‌ها',
			'all_status_label'     => 'همه وضعیت‌ها',
			'preview_label'        => 'جزئیات بیشتر',
			'order_label'          => 'سفارش سایت',
			'new_tab_label'        => 'نمایش در مرورگر',
			'loadmore_label'       => 'نمایش پروژه‌های بیشتر',
			'reset_label'          => 'حذف فیلترها',
			'empty_title'          => 'نتیجه‌ای پیدا نشد',
			'empty_text'           => 'فیلترها یا عبارت جستجو را تغییر دهید.',
			'contact_label'        => 'تماس بگیرید',
			'desktop_label'        => 'دسکتاپ',
			'tablet_label'         => 'تبلت',
			'mobile_label'         => 'موبایل',
			'favorite_label'       => 'علاقه‌مندی',
			'compare_label'        => 'مقایسه',
			'compare_bar_label'    => 'آیتم برای مقایسه انتخاب شد',
			'preview_title'        => 'پیش‌نمایش زنده سایت',
			'preview_note'         => 'نمایش تمام‌صفحه با امکان بررسی دسکتاپ، تبلت و موبایل',
			'show_preview_helper'  => 'yes',
			'preview_helper_text'  => 'اگر سایت در این محیط به دلایل فنی اجرا نشد، روی دکمه مشاهده کامل کلیک کنید.',
			'container_mode'       => 'full',
			'container_max_width'  => '1220',
			'image_height'         => '240',
			'show_filter_counts'   => 'no',
			'show_project_type'    => 'no',
			'show_pages_count'     => 'no',
			'show_support'         => 'no',
			'show_tech_stack'      => 'no',
			'show_view_count'      => 'no',
			'show_pin'             => 'no',
			'slideshow_mode'       => 'no',
			'slideshow_interval'   => '4',
			'slideshow_autoplay'   => 'yes',
			'slideshow_pause_hover'=> 'yes',
			'slideshow_arrows'     => 'yes',
			'slideshow_dots'       => 'yes',
			'slideshow_per_view'   => 'auto',
			'show_guarantee'       => 'yes',
			'guarantee_text'       => 'ضمانت بازگشت وجه ۷ روزه',
			'show_tour'            => 'yes',
			'class'                => '',
		);
	}

	private static function bool_attr( $value ) {
		return in_array( strtolower( (string) $value ), array( '1', 'true', 'yes', 'on' ), true );
	}

	private static function choice( $value, $allowed, $fallback ) {
		return in_array( (string) $value, $allowed, true ) ? (string) $value : $fallback;
	}

	private static function label( $atts, $key, $fallback ) {
		$value = isset( $atts[ $key ] ) ? trim( wp_strip_all_tags( (string) $atts[ $key ] ) ) : '';
		return '' !== $value ? $value : $fallback;
	}

	private static function parse_tabs_attr( $value ) {
		$tabs = array();
		if ( is_array( $value ) ) {
			$raw_tabs = $value;
		} else {
			$value = trim( (string) $value );
			if ( '' === $value ) {
				return $tabs;
			}
			$decoded = json_decode( html_entity_decode( $value, ENT_QUOTES, 'UTF-8' ), true );
			$raw_tabs = is_array( $decoded ) ? $decoded : array();
		}

		foreach ( $raw_tabs as $tab ) {
			if ( ! is_array( $tab ) ) {
				continue;
			}
			$label   = isset( $tab['label'] ) ? sanitize_text_field( $tab['label'] ) : ( isset( $tab['tab_label'] ) ? sanitize_text_field( $tab['tab_label'] ) : '' );
			$summary = isset( $tab['summary'] ) ? wp_kses_post( $tab['summary'] ) : ( isset( $tab['tab_summary'] ) ? wp_kses_post( $tab['tab_summary'] ) : '' );
			$content = isset( $tab['content'] ) ? wp_kses_post( $tab['content'] ) : ( isset( $tab['tab_content'] ) ? wp_kses_post( $tab['tab_content'] ) : '' );
			if ( '' === $label && '' === trim( wp_strip_all_tags( $summary ) ) && '' === trim( wp_strip_all_tags( $content ) ) ) {
				continue;
			}
			$tabs[] = array(
				'label'   => $label ? $label : __( 'تب', 'harfehaval-sites-pro' ),
				'summary' => do_shortcode( wpautop( $summary ) ),
				'content' => do_shortcode( wpautop( $content ) ),
			);
		}
		return $tabs;
	}

	public static function normalize_atts( $atts ) {
		$defaults = self::default_atts();
		$atts     = wp_parse_args( $atts, $defaults );

		$columns    = self::choice( $atts['columns'], array( '1', '2', '3', '4', '5', '6' ), '3' );
		$tablet     = self::choice( $atts['tablet_columns'], array( '1', '2', '3', '4' ), '2' );
		$mobile     = self::choice( $atts['mobile_columns'], array( '1', '2', '3', '4' ), '1' );
		$layout     = self::choice( $atts['layout'], array( 'grid', 'list', 'compact' ), 'grid' );
		$sort       = self::choice( $atts['sort'], array( 'newest', 'oldest', 'price_asc', 'price_desc', 'popular', 'rating', 'most_viewed' ), 'newest' );
		$hover      = self::choice( $atts['hover_effect'], array( 'scroll', 'zoom', 'none' ), 'scroll' );
		$pagination = self::choice( $atts['pagination_type'], array( 'load_more', 'infinite' ), 'load_more' );

		return array(
			'columns'              => $columns,
			'tablet_columns'       => $tablet,
			'mobile_columns'       => $mobile,
			'layout'               => $layout,
			'hover_effect'         => $hover,
			'pagination_type'      => $pagination,
			'show_header'          => self::bool_attr( $atts['show_header'] ),
			'show_search'          => self::bool_attr( $atts['show_search'] ),
			'show_filters'         => self::bool_attr( $atts['show_filters'] ),
			'show_feature_filter'  => self::bool_attr( $atts['show_feature_filter'] ),
			'show_status_filter'   => self::bool_attr( $atts['show_status_filter'] ),
			'show_sort'            => self::bool_attr( $atts['show_sort'] ),
			'show_layout_switcher' => self::bool_attr( $atts['show_layout_switcher'] ),
			'show_counter'         => self::bool_attr( $atts['show_counter'] ),
			'show_stats'           => self::bool_attr( $atts['show_stats'] ),
			'show_swatches'        => self::bool_attr( $atts['show_swatches'] ),
			'show_fab'             => self::bool_attr( $atts['show_fab'] ),
			'show_keyboard_hints'  => self::bool_attr( $atts['show_keyboard_hints'] ),
			'show_image'           => self::bool_attr( $atts['show_image'] ),
			'show_badge'           => self::bool_attr( $atts['show_badge'] ),
			'show_highlight'       => self::bool_attr( $atts['show_highlight'] ),
			'show_excerpt'         => self::bool_attr( $atts['show_excerpt'] ),
			'show_features'        => self::bool_attr( $atts['show_features'] ),
			'show_price'           => self::bool_attr( $atts['show_price'] ),
			'show_old_price'       => self::bool_attr( $atts['show_old_price'] ),
			'show_rating'          => self::bool_attr( $atts['show_rating'] ),
			'show_delivery'        => self::bool_attr( $atts['show_delivery'] ),
			'show_installment'     => self::bool_attr( $atts['show_installment'] ),
			'show_favorite'        => self::bool_attr( $atts['show_favorite'] ),
			'show_compare'         => self::bool_attr( $atts['show_compare'] ),
			'show_preview_button'  => self::bool_attr( $atts['show_preview_button'] ),
			'show_order_button'    => self::bool_attr( $atts['show_order_button'] ),
			'category'             => sanitize_text_field( $atts['category'] ),
			'feature'              => sanitize_text_field( $atts['feature'] ),
			'status'               => sanitize_key( $atts['status'] ),
			'sort'                 => $sort,
			'per_page'             => $atts['per_page'] ? max( 1, min( 60, absint( $atts['per_page'] ) ) ) : max( 1, min( 60, (int) HA_Sites_Pro_Settings::get( 'per_page' ) ) ),
			'card_style'           => self::choice( $atts['card_style'], array( 'markil', 'glass', 'flat', 'neon', 'minimal', 'dark' ), 'markil' ),
			'button_style'         => self::choice( $atts['button_style'], array( 'solid', 'outline', 'soft' ), 'solid' ),
			'modal'                => self::bool_attr( $atts['modal'] ),
			'preview_mode'         => self::choice( $atts['preview_mode'], array( 'fullscreen', 'page', 'direct' ), 'fullscreen' ),
			'header_badge'         => self::label( $atts, 'header_badge', $defaults['header_badge'] ),
			'header_title'         => self::label( $atts, 'header_title', $defaults['header_title'] ),
			'header_subtitle'      => self::label( $atts, 'header_subtitle', $defaults['header_subtitle'] ),
			'header_primary_text'  => self::label( $atts, 'header_primary_text', $defaults['header_primary_text'] ),
			'header_secondary_text'=> self::label( $atts, 'header_secondary_text', $defaults['header_secondary_text'] ),
			'search_placeholder'   => self::label( $atts, 'search_placeholder', $defaults['search_placeholder'] ),
			'sort_label'           => self::label( $atts, 'sort_label', $defaults['sort_label'] ),
			'all_categories_label' => self::label( $atts, 'all_categories_label', $defaults['all_categories_label'] ),
			'all_features_label'   => self::label( $atts, 'all_features_label', $defaults['all_features_label'] ),
			'all_status_label'     => self::label( $atts, 'all_status_label', $defaults['all_status_label'] ),
			'preview_label'        => self::label( $atts, 'preview_label', $defaults['preview_label'] ),
			'order_label'          => self::label( $atts, 'order_label', $defaults['order_label'] ),
			'new_tab_label'        => self::label( $atts, 'new_tab_label', $defaults['new_tab_label'] ),
			'loadmore_label'       => self::label( $atts, 'loadmore_label', $defaults['loadmore_label'] ),
			'reset_label'          => self::label( $atts, 'reset_label', $defaults['reset_label'] ),
			'empty_title'          => self::label( $atts, 'empty_title', $defaults['empty_title'] ),
			'empty_text'           => self::label( $atts, 'empty_text', $defaults['empty_text'] ),
			'contact_label'        => self::label( $atts, 'contact_label', $defaults['contact_label'] ),
			'desktop_label'        => self::label( $atts, 'desktop_label', $defaults['desktop_label'] ),
			'tablet_label'         => self::label( $atts, 'tablet_label', $defaults['tablet_label'] ),
			'mobile_label'         => self::label( $atts, 'mobile_label', $defaults['mobile_label'] ),
			'favorite_label'       => self::label( $atts, 'favorite_label', $defaults['favorite_label'] ),
			'compare_label'        => self::label( $atts, 'compare_label', $defaults['compare_label'] ),
			'compare_bar_label'    => self::label( $atts, 'compare_bar_label', $defaults['compare_bar_label'] ),
			'preview_title'        => self::label( $atts, 'preview_title', $defaults['preview_title'] ),
			'preview_note'         => self::label( $atts, 'preview_note', $defaults['preview_note'] ),
			'show_preview_helper'  => self::bool_attr( $atts['show_preview_helper'] ),
			'preview_helper_text'  => self::label( $atts, 'preview_helper_text', $defaults['preview_helper_text'] ),
			'container_mode'       => self::choice( $atts['container_mode'], array( 'full', 'boxed' ), 'full' ),
			'container_max_width'  => max( 320, min( 2200, absint( $atts['container_max_width'] ) ) ),
			'image_height'         => max( 120, min( 800, absint( $atts['image_height'] ) ) ),
			'show_filter_counts'   => self::bool_attr( $atts['show_filter_counts'] ),
			'show_project_type'    => self::bool_attr( $atts['show_project_type'] ),
			'show_pages_count'     => self::bool_attr( $atts['show_pages_count'] ),
			'show_support'         => self::bool_attr( $atts['show_support'] ),
			'show_tech_stack'      => self::bool_attr( $atts['show_tech_stack'] ),
			'show_view_count'      => self::bool_attr( $atts['show_view_count'] ),
			'show_pin'             => self::bool_attr( $atts['show_pin'] ),
			'slideshow_mode'       => self::bool_attr( $atts['slideshow_mode'] ),
			'slideshow_interval'   => max( 1, min( 60, (int) ( isset( $atts['slideshow_interval'] ) ? $atts['slideshow_interval'] : 4 ) ) ),
			'slideshow_autoplay'   => self::bool_attr( $atts['slideshow_autoplay'] ),
			'slideshow_pause_hover'=> self::bool_attr( $atts['slideshow_pause_hover'] ),
			'slideshow_arrows'     => self::bool_attr( $atts['slideshow_arrows'] ),
			'slideshow_dots'       => self::bool_attr( $atts['slideshow_dots'] ),
			'slideshow_per_view'   => self::choice( isset( $atts['slideshow_per_view'] ) ? $atts['slideshow_per_view'] : 'auto', array( 'auto', '1', '2', '3', '4', '5', '6' ), 'auto' ),
			'show_guarantee'       => self::bool_attr( $atts['show_guarantee'] ),
			'guarantee_text'       => self::label( $atts, 'guarantee_text', $defaults['guarantee_text'] ),
			'show_tour'            => self::bool_attr( $atts['show_tour'] ),
			'class'                => sanitize_html_class( $atts['class'] ),
		);
	}

	public static function render( $atts ) {
		HA_Sites_Pro_Plugin::enqueue_front_assets();
		$config   = self::normalize_atts( $atts );
		$instance = 'ha-sites-' . wp_generate_uuid4();
		$classes  = array(
			'ha-sites-pro',
			'ha-sites-pro--' . $config['layout'],
			'ha-sites-pro--card-' . $config['card_style'],
			'ha-sites-pro--btn-' . $config['button_style'],
			'ha-sites-pro--container-' . $config['container_mode'],
		);
		if ( $config['class'] ) {
			$classes[] = $config['class'];
		}

		ob_start();
		?>
		<section
			id="<?php echo esc_attr( $instance ); ?>"
			class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>"
			data-ha-config="<?php echo esc_attr( wp_json_encode( $config ) ); ?>"
			style="--ha-pro-cols:<?php echo esc_attr( $config['columns'] ); ?>;--ha-pro-cols-tablet:<?php echo esc_attr( $config['tablet_columns'] ); ?>;--ha-pro-cols-mobile:<?php echo esc_attr( $config['mobile_columns'] ); ?>;--ha-shell-max:<?php echo esc_attr( 'boxed' === $config['container_mode'] ? $config['container_max_width'] . 'px' : '100%' ); ?>;--ha-thumb-h:<?php echo esc_attr( $config['image_height'] . 'px' ); ?>;"
		>
			<div class="ha-pro-shell">
				<?php if ( $config['show_header'] ) : ?>
					<header class="ha-pro-hero" data-ha-hero>
						<div class="ha-pro-hero-content">
							<span class="ha-pro-hero-badge"><?php echo esc_html( $config['header_badge'] ); ?></span>
							<h2><?php echo esc_html( $config['header_title'] ); ?></h2>
							<p><?php echo esc_html( $config['header_subtitle'] ); ?></p>
							<div class="ha-pro-hero-actions">
								<a class="ha-pro-hero-btn ha-pro-hero-btn-primary" href="#<?php echo esc_attr( $instance ); ?>-grid"><?php echo esc_html( $config['header_primary_text'] ); ?></a>
								<a class="ha-pro-hero-btn ha-pro-hero-btn-secondary" data-ha-hero-order href="#"><?php echo esc_html( $config['header_secondary_text'] ); ?></a>
							</div>
						</div>
						<div class="ha-pro-hero-card" aria-hidden="true">
							<span></span><strong>Live Preview</strong><em>Desktop / Tablet / Mobile</em><b></b>
						</div>
					</header>
				<?php endif; ?>

				<?php if ( $config['show_search'] || $config['show_sort'] || $config['show_layout_switcher'] ) : ?>
					<div class="ha-pro-toolbar" data-ha-toolbar>
						<?php if ( $config['show_search'] ) : ?>
							<label class="ha-pro-search" aria-label="<?php echo esc_attr( $config['search_placeholder'] ); ?>">
								<span class="ha-pro-search-icon" aria-hidden="true">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.3-4.3m1.3-5.2a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
								</span>
								<input class="ha-pro-search-input" type="search" autocomplete="off" placeholder="<?php echo esc_attr( $config['search_placeholder'] ); ?>">
							</label>
						<?php endif; ?>
						<div class="ha-pro-toolbar-actions">
							<?php if ( $config['show_sort'] ) : ?>
								<label class="ha-pro-sort-wrap">
									<span><?php echo esc_html( $config['sort_label'] ); ?></span>
									<select class="ha-pro-sort">
										<option value="newest"><?php esc_html_e( 'جدیدترین', 'harfehaval-sites-pro' ); ?></option>
										<option value="popular"><?php esc_html_e( 'پیشنهادی', 'harfehaval-sites-pro' ); ?></option>
										<option value="rating"><?php esc_html_e( 'بالاترین امتیاز', 'harfehaval-sites-pro' ); ?></option>
										<option value="price_asc"><?php esc_html_e( 'ارزان‌ترین', 'harfehaval-sites-pro' ); ?></option>
										<option value="price_desc"><?php esc_html_e( 'گران‌ترین', 'harfehaval-sites-pro' ); ?></option>
										<option value="oldest"><?php esc_html_e( 'قدیمی‌ترین', 'harfehaval-sites-pro' ); ?></option>
										<option value="most_viewed"><?php esc_html_e( 'پربازدیدترین', 'harfehaval-sites-pro' ); ?></option>
									</select>
								</label>
							<?php endif; ?>
							<?php if ( $config['show_layout_switcher'] ) : ?>
								<div class="ha-pro-layout-switcher" role="group" aria-label="<?php esc_attr_e( 'تغییر نوع نمایش', 'harfehaval-sites-pro' ); ?>">
									<button type="button" class="is-active" data-ha-layout="grid" aria-label="<?php esc_attr_e( 'نمای شبکه‌ای', 'harfehaval-sites-pro' ); ?>">▦</button>
									<button type="button" data-ha-layout="list" aria-label="<?php esc_attr_e( 'نمای لیستی', 'harfehaval-sites-pro' ); ?>">☰</button>
									<button type="button" data-ha-layout="compact" aria-label="<?php esc_attr_e( 'نمای فشرده', 'harfehaval-sites-pro' ); ?>">▤</button>
								</div>
							<?php endif; ?>
						</div>
					</div>
				<?php endif; ?>

				<?php if ( $config['show_filters'] || $config['show_feature_filter'] || $config['show_status_filter'] ) : ?>
					<div class="ha-pro-filter-panel">
						<?php if ( $config['show_filters'] ) : ?>
							<div class="ha-pro-filter-row ha-pro-cats" data-ha-cats></div>
						<?php endif; ?>
						<?php if ( $config['show_feature_filter'] ) : ?>
							<div class="ha-pro-filter-row ha-pro-features" data-ha-features></div>
						<?php endif; ?>
						<?php if ( $config['show_status_filter'] ) : ?>
							<div class="ha-pro-filter-row ha-pro-statuses" data-ha-statuses></div>
						<?php endif; ?>
					</div>
				<?php endif; ?>

				<?php if ( $config['show_stats'] ) : ?>
					<div class="ha-pro-stats" data-ha-stats></div>
				<?php endif; ?>

				<?php if ( $config['show_keyboard_hints'] ) : ?>
					<div class="ha-pro-kbd-hints" aria-hidden="true">
						<span><kbd>/</kbd> جستجوی سریع</span>
						<span><kbd>R</kbd> پاک کردن فیلترها</span>
						<span><kbd>Esc</kbd> بستن پیش‌نمایش</span>
					</div>
				<?php endif; ?>

				<?php if ( $config['show_counter'] ) : ?>
					<div class="ha-pro-counter" data-ha-counter aria-live="polite"></div>
				<?php endif; ?>

				<div class="ha-pro-grid" id="<?php echo esc_attr( $instance ); ?>-grid" data-ha-grid role="list">
					<?php for ( $i = 0; $i < min( 6, (int) $config['per_page'] ); $i++ ) : ?>
						<div class="ha-pro-skeleton" aria-hidden="true"><span></span><b></b><i></i><em></em></div>
					<?php endfor; ?>
				</div>

				<div class="ha-pro-empty" data-ha-empty hidden>
					<div class="ha-pro-empty-icon">⌕</div>
					<strong><?php echo esc_html( $config['empty_title'] ); ?></strong>
					<p><?php echo esc_html( $config['empty_text'] ); ?></p>
					<button class="ha-pro-reset" data-ha-reset type="button"><?php echo esc_html( $config['reset_label'] ); ?></button>
				</div>

				<div class="ha-pro-loadmore-wrap">
					<button class="ha-pro-loadmore" data-ha-loadmore type="button" hidden><?php echo esc_html( $config['loadmore_label'] ); ?></button>
				</div>
			</div>

			<?php if ( $config['show_compare'] ) : ?>
				<div class="ha-pro-compare-bar" data-ha-compare-bar hidden>
					<strong><span data-ha-compare-count>0</span> <?php echo esc_html( $config['compare_bar_label'] ); ?></strong>
					<div data-ha-compare-list></div>
					<button type="button" class="ha-pro-compare-bar-open" data-ha-compare-open><?php esc_html_e( 'مقایسه کردن', 'harfehaval-sites-pro' ); ?></button>
					<button type="button" data-ha-compare-clear><?php esc_html_e( 'پاک کردن', 'harfehaval-sites-pro' ); ?></button>
				</div>

				<div class="ha-pro-compare-modal" data-ha-compare-modal hidden aria-hidden="true">
					<div class="ha-pro-compare-modal-backdrop" data-ha-compare-modal-close></div>
					<div class="ha-pro-compare-modal-inner" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e( 'مقایسه قالب‌ها', 'harfehaval-sites-pro' ); ?>">
						<header class="ha-pro-compare-modal-header">
							<h2 class="ha-pro-compare-modal-title"><?php esc_html_e( 'مقایسه قالب‌ها', 'harfehaval-sites-pro' ); ?></h2>
							<button type="button" class="ha-pro-compare-modal-close-btn" data-ha-compare-modal-close aria-label="<?php esc_attr_e( 'بستن', 'harfehaval-sites-pro' ); ?>">×</button>
						</header>
						<div class="ha-pro-compare-modal-body" data-ha-compare-content></div>
					</div>
				</div>
			<?php endif; ?>

			<?php if ( $config['modal'] ) : ?>
				<div class="ha-pro-modal" id="<?php echo esc_attr( $instance ); ?>-modal" data-ha-modal hidden aria-hidden="true">
					<div class="ha-pro-modal-backdrop" data-ha-modal-close></div>
					<div class="ha-pro-preview" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e( 'پیش‌نمایش سایت', 'harfehaval-sites-pro' ); ?>">
						<header class="ha-pro-preview-header">
							<div class="ha-pro-preview-title">
								<strong data-ha-preview-title><?php echo esc_html( $config['preview_title'] ); ?></strong>
								<span data-ha-preview-domain><?php echo esc_html( $config['preview_note'] ); ?></span>
							</div>
							<div class="ha-pro-preview-devices" role="group" aria-label="<?php esc_attr_e( 'انتخاب دستگاه', 'harfehaval-sites-pro' ); ?>">
								<button type="button" data-ha-device="desktop" class="is-active">🖥 <?php echo esc_html( $config['desktop_label'] ); ?></button>
								<button type="button" data-ha-device="tablet">⬜ <?php echo esc_html( $config['tablet_label'] ); ?></button>
								<button type="button" data-ha-device="mobile">📱 <?php echo esc_html( $config['mobile_label'] ); ?></button>
							</div>
							<div class="ha-pro-preview-actions">
								<?php if ( $config['show_tour'] ) : ?>
									<button class="ha-pro-tour-launch" data-ha-tour type="button" aria-label="<?php esc_attr_e( 'راهنمای استفاده', 'harfehaval-sites-pro' ); ?>" title="<?php esc_attr_e( 'راهنمای استفاده', 'harfehaval-sites-pro' ); ?>">؟ <?php esc_html_e( 'راهنما', 'harfehaval-sites-pro' ); ?></button>
								<?php endif; ?>
								<a class="ha-pro-preview-open" data-ha-preview-open target="_blank" rel="noopener noreferrer" href="#"><?php echo esc_html( $config['new_tab_label'] ); ?> ↗</a>
								<button class="ha-pro-preview-close" data-ha-modal-close type="button" aria-label="<?php esc_attr_e( 'بستن', 'harfehaval-sites-pro' ); ?>">×</button>
							</div>
						</header>
						<div class="ha-pro-frame-stage">
							<div class="ha-pro-frame-wrap"><iframe data-ha-frame title="<?php esc_attr_e( 'پیش‌نمایش سایت', 'harfehaval-sites-pro' ); ?>" loading="lazy"></iframe></div>
							<button class="ha-pro-side-handle" data-ha-preview-info-toggle type="button" aria-label="<?php esc_attr_e( 'تغییر نمایش جزئیات', 'harfehaval-sites-pro' ); ?>"></button>
							<aside class="ha-pro-preview-side" data-ha-modal-info></aside>
						</div>
					</div>
				</div>
			<?php endif; ?>

			<?php if ( $config['show_fab'] ) :
				$wa = preg_replace( '/\D/', '', (string) HA_Sites_Pro_Settings::get( 'whatsapp' ) );
				if ( $wa ) :
			?>
				<a href="<?php echo esc_url( 'https://wa.me/' . $wa ); ?>" class="ha-pro-fab" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'تماس واتساپ', 'harfehaval-sites-pro' ); ?>" title="<?php esc_attr_e( 'پیام در واتساپ', 'harfehaval-sites-pro' ); ?>">💬</a>
			<?php endif; endif; ?>
			<?php
			require_once HA_SITES_PRO_DIR . 'includes/inline-styles.php';
			echo '<style>' . ha_sites_pro_inline_styles( $instance ) . '</style>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			?>
		</section>
		<?php
		return ob_get_clean();
	}
}
