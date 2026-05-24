<?php
/**
 * Elementor Widget — Sites Grid Pro v3.
 *
 * @package HarfehavalSitesPro
 */

defined( 'ABSPATH' ) || exit;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Group_Control_Background;
use Elementor\Group_Control_Text_Shadow;
use Elementor\Core\Kits\Documents\Tabs\Global_Colors;
use Elementor\Core\Kits\Documents\Tabs\Global_Typography;

class HA_Sites_Pro_Elementor_Sites_Widget extends Widget_Base {

	public function get_name(): string        { return 'ha_sites_pro'; }
	public function get_title(): string       { return __( '🌐 سایت‌های حرف اول', 'harfehaval-sites-pro' ); }
	public function get_icon(): string        { return 'eicon-gallery-grid'; }
	public function get_categories(): array   { return [ 'harfehaval-sites' ]; }
	public function get_keywords(): array     { return [ 'harfehaval', 'sites', 'portfolio', 'preview', 'نمونه‌سایت', 'حرف اول', 'قالب', 'وردپرس' ]; }
	public function get_style_depends(): array  { return [ 'ha-sites-pro-frontend' ]; }
	public function get_script_depends(): array { return [ 'ha-sites-pro-frontend' ]; }

	private function term_options( string $taxonomy, string $empty_label = '' ): array {
		$opts = [];
		if ( $empty_label ) $opts[''] = $empty_label;
		$terms = get_terms( [ 'taxonomy' => $taxonomy, 'hide_empty' => false ] );
		if ( is_wp_error( $terms ) || empty( $terms ) ) return $opts;
		foreach ( $terms as $t ) $opts[ $t->slug ] = $t->name;
		return $opts;
	}

	/* ═══════════════════════════════════════════════════════
	   REGISTER CONTROLS
	   ═══════════════════════════════════════════════════════ */

	protected function register_controls(): void {
		$this->tab_content();
		$this->tab_style();
	}

	/* ──────────────────── CONTENT TAB ──────────────────── */

	private function tab_content(): void {
		$this->section_query();
		$this->section_layout();
		$this->section_features();
		$this->section_toolbar();
		$this->section_pagination();
		$this->section_hero();
		$this->section_labels();
	}

	private function section_query(): void {
		$this->start_controls_section( 'sec_query', [
			'label' => __( '🔍 کوئری و فیلتر اولیه', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_CONTENT,
		] );

		$this->add_control( 'category', [
			'label'       => __( 'دسته‌بندی اولیه', 'harfehaval-sites-pro' ),
			'type'        => Controls_Manager::SELECT2,
			'options'     => $this->term_options( HA_Sites_Pro_Post_Type::TAX_CATEGORY, __( 'همه دسته‌بندی‌ها', 'harfehaval-sites-pro' ) ),
			'default'     => '',
			'label_block' => true,
		] );

		$this->add_control( 'feature', [
			'label'       => __( 'ویژگی اولیه', 'harfehaval-sites-pro' ),
			'type'        => Controls_Manager::SELECT2,
			'options'     => $this->term_options( HA_Sites_Pro_Post_Type::TAX_FEATURE, __( 'همه ویژگی‌ها', 'harfehaval-sites-pro' ) ),
			'default'     => '',
			'label_block' => true,
		] );

		$this->add_control( 'status', [
			'label'   => __( 'وضعیت اولیه', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::SELECT,
			'options' => [
				''        => __( 'همه وضعیت‌ها', 'harfehaval-sites-pro' ),
				'new'     => __( '✨ جدید', 'harfehaval-sites-pro' ),
				'popular' => __( '🔥 پرفروش', 'harfehaval-sites-pro' ),
				'featured'=> __( '⭐ ویژه', 'harfehaval-sites-pro' ),
				'premium' => __( '💎 پریمیوم', 'harfehaval-sites-pro' ),
			],
			'default' => '',
		] );

		$this->add_control( 'sort', [
			'label'   => __( 'مرتب‌سازی پیش‌فرض', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::SELECT,
			'options' => [
				'newest'     => __( 'جدیدترین', 'harfehaval-sites-pro' ),
				'popular'    => __( 'پیشنهادی', 'harfehaval-sites-pro' ),
				'rating'     => __( 'بالاترین امتیاز', 'harfehaval-sites-pro' ),
				'price_asc'  => __( 'ارزان‌ترین', 'harfehaval-sites-pro' ),
				'price_desc' => __( 'گران‌ترین', 'harfehaval-sites-pro' ),
				'oldest'     => __( 'قدیمی‌ترین', 'harfehaval-sites-pro' ),
			],
			'default' => 'newest',
		] );

		$this->add_control( 'per_page', [
			'label'   => __( 'تعداد سایت در هر بار', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::NUMBER,
			'default' => 12,
			'min'     => 1,
			'max'     => 60,
		] );

		$this->end_controls_section();
	}

	private function section_layout(): void {
		$this->start_controls_section( 'sec_layout', [
			'label' => __( '🎨 چیدمان و استایل کارت', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_CONTENT,
		] );

		$this->add_control( 'columns', [
			'label'   => __( 'ستون (دسکتاپ)', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::SELECT,
			'options' => [ '2' => '۲', '3' => '۳', '4' => '۴', '5' => '۵', '6' => '۶' ],
			'default' => '3',
		] );

		$this->add_control( 'tablet_columns', [
			'label'   => __( 'ستون (تبلت)', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::SELECT,
			'options' => [ '1' => '۱', '2' => '۲', '3' => '۳' ],
			'default' => '2',
		] );

		$this->add_control( 'mobile_columns', [
			'label'   => __( 'ستون (موبایل)', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::SELECT,
			'options' => [ '1' => '۱', '2' => '۲' ],
			'default' => '1',
		] );

		$this->add_control( 'layout', [
			'label'   => __( 'نوع نمایش پیش‌فرض', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::SELECT,
			'options' => [
				'grid'    => __( 'شبکه‌ای', 'harfehaval-sites-pro' ),
				'list'    => __( 'لیستی', 'harfehaval-sites-pro' ),
				'compact' => __( 'فشرده', 'harfehaval-sites-pro' ),
			],
			'default' => 'grid',
		] );

		$this->add_control( 'card_style', [
			'label'   => __( 'سبک کارت', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::SELECT,
			'options' => [
				'markil'  => __( 'مارکیل (پیش‌فرض)', 'harfehaval-sites-pro' ),
				'glass'   => __( 'شیشه‌ای', 'harfehaval-sites-pro' ),
				'flat'    => __( 'تخت', 'harfehaval-sites-pro' ),
				'neon'    => __( 'نئون', 'harfehaval-sites-pro' ),
				'minimal' => __( 'مینیمال', 'harfehaval-sites-pro' ),
				'dark'    => __( 'تاریک', 'harfehaval-sites-pro' ),
			],
			'default' => 'markil',
		] );

		$this->add_control( 'button_style', [
			'label'   => __( 'سبک دکمه‌ها', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::SELECT,
			'options' => [
				'solid'   => __( 'توپر', 'harfehaval-sites-pro' ),
				'outline' => __( 'خط‌دار', 'harfehaval-sites-pro' ),
				'soft'    => __( 'نرم', 'harfehaval-sites-pro' ),
			],
			'default' => 'solid',
		] );

		$this->add_control( 'hover_effect', [
			'label'   => __( '✨ افکت hover روی تصویر', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::SELECT,
			'options' => [
				'scroll' => __( 'اسکرول (نمایش کل صفحه)', 'harfehaval-sites-pro' ),
				'zoom'   => __( 'زوم', 'harfehaval-sites-pro' ),
				'none'   => __( 'بدون افکت', 'harfehaval-sites-pro' ),
			],
			'default' => 'scroll',
		] );

		$this->add_control( 'hover_scroll_speed', [
			'label'       => __( 'سرعت اسکرول (ثانیه)', 'harfehaval-sites-pro' ),
			'type'        => Controls_Manager::SLIDER,
			'range'       => [ 's' => [ 'min' => 1, 'max' => 15, 'step' => 0.5 ] ],
			'size_units'  => [ 's' ],
			'default'     => [ 'size' => 6, 'unit' => 's' ],
			'selectors'   => [
				'{{WRAPPER}} .ha-pro-thumb' => '--ha-scroll-speed: {{SIZE}}{{UNIT}};',
			],
			'condition'   => [ 'hover_effect' => 'scroll' ],
		] );

		$this->end_controls_section();
	}

	private function section_features(): void {
		$this->start_controls_section( 'sec_features', [
			'label' => __( '🔧 نمایش عناصر', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_CONTENT,
		] );

		$fields = [
			'show_header'          => 'نمایش هدر Hero',
			'show_search'          => 'نمایش جستجو',
			'show_filters'         => 'نمایش فیلترها',
			'show_status_filter'   => 'نمایش فیلتر وضعیت',
			'show_sort'            => 'نمایش مرتب‌سازی',
			'show_layout_switcher' => 'نمایش تغییر چیدمان',
			'show_counter'         => 'نمایش شمارنده',
			'show_image'           => 'نمایش تصویر',
			'show_badge'           => 'نمایش برچسب وضعیت',
			'show_excerpt'         => 'نمایش توضیح مختصر',
			'show_features'        => 'نمایش ویژگی‌ها',
			'show_price'           => 'نمایش قیمت',
			'show_old_price'       => 'نمایش قیمت قبلی',
			'show_rating'          => 'نمایش امتیاز',
			'show_delivery'        => 'نمایش زمان تحویل',
			'show_installment'     => 'نمایش اقساط',
			'show_favorite'        => 'دکمه علاقه‌مندی',
			'show_compare'         => 'دکمه مقایسه',
			'show_preview_button'  => 'دکمه پیش‌نمایش',
			'show_order_button'    => 'دکمه سفارش',
		];

		foreach ( $fields as $key => $label ) {
			$this->add_control( $key, [
				'label'        => __( $label, 'harfehaval-sites-pro' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => __( 'بله', 'harfehaval-sites-pro' ),
				'label_off'    => __( 'خیر', 'harfehaval-sites-pro' ),
				'return_value' => 'yes',
				'default'      => 'yes',
			] );
		}

		$this->add_control( 'modal', [
			'label'        => __( 'مودال پیش‌نمایش', 'harfehaval-sites-pro' ),
			'type'         => Controls_Manager::SWITCHER,
			'return_value' => 'yes',
			'default'      => 'yes',
		] );

		$this->add_control( 'preview_mode', [
			'label'     => __( 'نحوه باز کردن پیش‌نمایش', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::SELECT,
			'options'   => [
				'fullscreen' => __( 'تمام‌صفحه (مودال)', 'harfehaval-sites-pro' ),
				'page'       => __( 'صفحه اختصاصی', 'harfehaval-sites-pro' ),
				'direct'     => __( 'مستقیم در تب جدید', 'harfehaval-sites-pro' ),
			],
			'default'   => 'fullscreen',
			'condition' => [ 'modal' => 'yes' ],
		] );

		$this->end_controls_section();
	}

	private function section_toolbar(): void {
		$this->start_controls_section( 'sec_toolbar', [
			'label' => __( '🛠️ نوار ابزار', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_CONTENT,
		] );

		$this->add_control( 'search_placeholder', [
			'label'   => __( 'متن راهنمای جستجو', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::TEXT,
			'default' => 'جستجو در سایت‌ها، امکانات، حوزه کاری...',
		] );

		$this->end_controls_section();
	}

	private function section_pagination(): void {
		$this->start_controls_section( 'sec_pagination', [
			'label' => __( '📄 صفحه‌بندی', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_CONTENT,
		] );

		$this->add_control( 'pagination_type', [
			'label'   => __( 'نوع صفحه‌بندی', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::SELECT,
			'options' => [
				'load_more' => __( 'دکمه نمایش بیشتر', 'harfehaval-sites-pro' ),
				'infinite'  => __( 'اسکرول بی‌نهایت', 'harfehaval-sites-pro' ),
			],
			'default' => 'load_more',
		] );

		$this->end_controls_section();
	}

	private function section_hero(): void {
		$this->start_controls_section( 'sec_hero', [
			'label'     => __( '🦸 هدر Hero', 'harfehaval-sites-pro' ),
			'tab'       => Controls_Manager::TAB_CONTENT,
			'condition' => [ 'show_header' => 'yes' ],
		] );

		$this->add_control( 'header_badge', [
			'label'   => __( 'برچسب Hero', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::TEXT,
			'default' => 'نمونه‌سایت‌های آماده',
		] );

		$this->add_control( 'header_title', [
			'label'   => __( 'عنوان Hero', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::TEXT,
			'default' => 'انتخاب هوشمند سایت آماده برای شروع سریع‌تر',
		] );

		$this->add_control( 'header_subtitle', [
			'label'      => __( 'زیرعنوان Hero', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::TEXTAREA,
			'default'    => 'جستجو، فیلتر، مقایسه و پیش‌نمایش زنده قالب‌ها در یک محیط حرفه‌ای.',
			'rows'       => 2,
		] );

		$this->add_control( 'header_primary_text', [
			'label'   => __( 'متن دکمه اصلی', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::TEXT,
			'default' => 'مشاهده نمونه‌ها',
		] );

		$this->add_control( 'header_secondary_text', [
			'label'   => __( 'متن دکمه فرعی', 'harfehaval-sites-pro' ),
			'type'    => Controls_Manager::TEXT,
			'default' => 'مشاوره سفارش',
		] );

		$this->end_controls_section();
	}

	private function section_labels(): void {
		$this->start_controls_section( 'sec_labels', [
			'label' => __( '💬 برچسب‌های رابط کاربری', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_CONTENT,
		] );

		$labels = [
			'all_categories_label' => [ 'همه دسته‌بندی‌ها', 'متن دکمه همه دسته‌ها' ],
			'all_features_label'   => [ 'همه ویژگی‌ها', 'متن دکمه همه ویژگی‌ها' ],
			'all_status_label'     => [ 'همه وضعیت‌ها', 'متن دکمه همه وضعیت' ],
			'preview_label'        => [ 'پیش‌نمایش', 'دکمه پیش‌نمایش' ],
			'order_label'          => [ 'سفارش سایت', 'دکمه سفارش' ],
			'new_tab_label'        => [ 'مشاهده کامل', 'دکمه تب جدید' ],
			'loadmore_label'       => [ 'نمایش بیشتر', 'دکمه نمایش بیشتر' ],
			'reset_label'          => [ 'حذف فیلترها', 'دکمه ریست فیلترها' ],
			'empty_title'          => [ 'نتیجه‌ای پیدا نشد', 'عنوان حالت خالی' ],
			'empty_text'           => [ 'فیلترها یا عبارت جستجو را تغییر دهید.', 'متن حالت خالی' ],
			'contact_label'        => [ 'تماس بگیرید', 'برچسب قیمت تماس' ],
			'sort_label'           => [ 'مرتب‌سازی', 'برچسب مرتب‌سازی' ],
			'desktop_label'        => [ 'دسکتاپ', 'برچسب دسکتاپ' ],
			'tablet_label'         => [ 'تبلت', 'برچسب تبلت' ],
			'mobile_label'         => [ 'موبایل', 'برچسب موبایل' ],
			'favorite_label'       => [ 'علاقه‌مندی', 'برچسب علاقه‌مندی' ],
			'compare_label'        => [ 'مقایسه', 'برچسب مقایسه' ],
			'compare_bar_label'    => [ 'آیتم برای مقایسه', 'متن نوار مقایسه' ],
		];

		foreach ( $labels as $key => [ $default, $desc ] ) {
			$this->add_control( $key, [
				'label'   => __( $desc, 'harfehaval-sites-pro' ),
				'type'    => Controls_Manager::TEXT,
				'default' => $default,
			] );
		}

		$this->end_controls_section();
	}

	/* ──────────────────── STYLE TAB ──────────────────── */

	private function tab_style(): void {
		$this->style_layout();
		$this->style_card();
		$this->style_image();
		$this->style_badge();
		$this->style_title();
		$this->style_excerpt();
		$this->style_features();
		$this->style_price();
		$this->style_btn_primary();
		$this->style_btn_secondary();
		$this->style_toolbar();
		$this->style_search();
		$this->style_filter_chips();
		$this->style_hero();
		$this->style_modal();
	}

	private function style_layout(): void {
		$this->start_controls_section( 'sty_layout', [
			'label' => __( '📐 فاصله‌گذاری شبکه', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_control( 'grid_gap', [
			'label'      => __( 'فاصله بین کارت‌ها', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', 'rem' ],
			'range'      => [ 'px' => [ 'min' => 0, 'max' => 60 ] ],
			'default'    => [ 'size' => 24, 'unit' => 'px' ],
			'selectors'  => [
				'{{WRAPPER}} .ha-pro-grid' => 'gap: {{SIZE}}{{UNIT}};',
			],
		] );

		$this->add_responsive_control( 'wrap_padding', [
			'label'      => __( 'پدینگ کل ویجت', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::DIMENSIONS,
			'size_units' => [ 'px', 'rem', '%' ],
			'selectors'  => [
				'{{WRAPPER}} .ha-pro-shell' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
			],
		] );

		$this->end_controls_section();
	}

	private function style_card(): void {
		$this->start_controls_section( 'sty_card', [
			'label' => __( '🃏 کارت', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->start_controls_tabs( 'tabs_card' );

		// Normal
		$this->start_controls_tab( 'tab_card_normal', [ 'label' => __( 'حالت عادی', 'harfehaval-sites-pro' ) ] );

		$this->add_group_control( Group_Control_Background::get_type(), [
			'name'     => 'card_bg',
			'label'    => __( 'پس‌زمینه کارت', 'harfehaval-sites-pro' ),
			'types'    => [ 'classic', 'gradient' ],
			'selector' => '{{WRAPPER}} .ha-pro-card',
		] );

		$this->add_group_control( Group_Control_Border::get_type(), [
			'name'     => 'card_border',
			'selector' => '{{WRAPPER}} .ha-pro-card',
		] );

		$this->add_control( 'card_radius', [
			'label'      => __( 'گردی گوشه‌ها', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', '%', 'rem' ],
			'range'      => [ 'px' => [ 'min' => 0, 'max' => 40 ] ],
			'selectors'  => [
				'{{WRAPPER}} .ha-pro-card' => 'border-radius: {{SIZE}}{{UNIT}};',
			],
		] );

		$this->add_group_control( Group_Control_Box_Shadow::get_type(), [
			'name'     => 'card_shadow',
			'selector' => '{{WRAPPER}} .ha-pro-card',
		] );

		$this->add_responsive_control( 'card_padding', [
			'label'      => __( 'پدینگ کارت', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::DIMENSIONS,
			'size_units' => [ 'px', 'rem' ],
			'selectors'  => [
				'{{WRAPPER}} .ha-pro-card-body' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
			],
		] );

		$this->end_controls_tab();

		// Hover
		$this->start_controls_tab( 'tab_card_hover', [ 'label' => __( 'حالت hover', 'harfehaval-sites-pro' ) ] );

		$this->add_group_control( Group_Control_Background::get_type(), [
			'name'     => 'card_bg_hover',
			'label'    => __( 'پس‌زمینه کارت (hover)', 'harfehaval-sites-pro' ),
			'types'    => [ 'classic', 'gradient' ],
			'selector' => '{{WRAPPER}} .ha-pro-card:hover',
		] );

		$this->add_control( 'card_border_color_hover', [
			'label'     => __( 'رنگ بوردر (hover)', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-card:hover' => 'border-color: {{VALUE}};' ],
		] );

		$this->add_group_control( Group_Control_Box_Shadow::get_type(), [
			'name'     => 'card_shadow_hover',
			'label'    => __( 'سایه (hover)', 'harfehaval-sites-pro' ),
			'selector' => '{{WRAPPER}} .ha-pro-card:hover',
		] );

		$this->add_control( 'card_lift', [
			'label'      => __( 'ارتفاع بالا آمدن (hover)', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px' ],
			'range'      => [ 'px' => [ 'min' => 0, 'max' => 20 ] ],
			'default'    => [ 'size' => 6 ],
			'selectors'  => [
				'{{WRAPPER}} .ha-pro-card:hover' => 'transform: translateY(-{{SIZE}}px);',
			],
		] );

		$this->end_controls_tab();
		$this->end_controls_tabs();

		$this->end_controls_section();
	}

	private function style_image(): void {
		$this->start_controls_section( 'sty_image', [
			'label' => __( '🖼️ تصویر کارت', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_control( 'thumb_height', [
			'label'      => __( 'ارتفاع تصویر', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', 'vh' ],
			'range'      => [ 'px' => [ 'min' => 80, 'max' => 600 ] ],
			'default'    => [ 'size' => 240, 'unit' => 'px' ],
			'selectors'  => [
				'{{WRAPPER}} .ha-pro-thumb' => 'height: {{SIZE}}{{UNIT}}; --ha-thumb-h: {{SIZE}}{{UNIT}};',
			],
		] );

		$this->add_control( 'thumb_radius', [
			'label'      => __( 'گردی تصویر', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', '%' ],
			'range'      => [ 'px' => [ 'min' => 0, 'max' => 30 ] ],
			'selectors'  => [
				'{{WRAPPER}} .ha-pro-thumb' => 'border-radius: {{SIZE}}{{UNIT}} {{SIZE}}{{UNIT}} 0 0;',
			],
		] );

		$this->add_control( 'overlay_color', [
			'label'     => __( 'رنگ روکش (overlay)', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [
				'{{WRAPPER}} .ha-pro-thumb::after' => 'background: {{VALUE}};',
			],
		] );

		$this->add_control( 'overlay_hover_color', [
			'label'     => __( 'رنگ روکش (hover)', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [
				'{{WRAPPER}} .ha-pro-card:hover .ha-pro-thumb::after' => 'background: {{VALUE}};',
			],
		] );

		$this->end_controls_section();
	}

	private function style_badge(): void {
		$this->start_controls_section( 'sty_badge', [
			'label' => __( '🏷️ برچسب وضعیت', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'badge_typo',
			'selector' => '{{WRAPPER}} .ha-pro-badge',
		] );

		$this->add_control( 'badge_radius', [
			'label'      => __( 'گردی برچسب', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', 'rem' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-badge' => 'border-radius: {{SIZE}}{{UNIT}};' ],
		] );

		$statuses = [
			'new'      => [ 'جدید', '#1d4ed8', '#dbeafe' ],
			'popular'  => [ 'پرفروش', '#92400e', '#fef3c7' ],
			'featured' => [ 'ویژه', '#6b21a8', '#ede9fe' ],
			'premium'  => [ 'پریمیوم', '#065f46', '#d1fae5' ],
		];

		foreach ( $statuses as $slug => [ $label, $default_color, $default_bg ] ) {
			$this->add_control( "badge_{$slug}_color", [
				'label'     => __( "رنگ متن: {$label}", 'harfehaval-sites-pro' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => $default_color,
				'selectors' => [ "{{WRAPPER}} .ha-pro-badge-{$slug}" => 'color: {{VALUE}};' ],
			] );
			$this->add_control( "badge_{$slug}_bg", [
				'label'     => __( "رنگ پس‌زمینه: {$label}", 'harfehaval-sites-pro' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => $default_bg,
				'selectors' => [ "{{WRAPPER}} .ha-pro-badge-{$slug}" => 'background-color: {{VALUE}};' ],
			] );
		}

		$this->end_controls_section();
	}

	private function style_title(): void {
		$this->start_controls_section( 'sty_title', [
			'label' => __( '✏️ عنوان سایت', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'title_typo',
			'selector' => '{{WRAPPER}} .ha-pro-card-title',
			'global'   => [ 'default' => Global_Typography::TYPOGRAPHY_PRIMARY ],
		] );

		$this->start_controls_tabs( 'tabs_title_color' );

		$this->start_controls_tab( 'tab_title_normal', [ 'label' => __( 'عادی', 'harfehaval-sites-pro' ) ] );
		$this->add_control( 'title_color', [
			'label'     => __( 'رنگ عنوان', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-card-title' => 'color: {{VALUE}};' ],
		] );
		$this->end_controls_tab();

		$this->start_controls_tab( 'tab_title_hover', [ 'label' => __( 'hover', 'harfehaval-sites-pro' ) ] );
		$this->add_control( 'title_color_hover', [
			'label'     => __( 'رنگ عنوان (hover)', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-card:hover .ha-pro-card-title' => 'color: {{VALUE}};' ],
		] );
		$this->end_controls_tab();
		$this->end_controls_tabs();

		$this->add_responsive_control( 'title_margin', [
			'label'      => __( 'فاصله عنوان', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::DIMENSIONS,
			'size_units' => [ 'px', 'rem' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-card-title' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
		] );

		$this->end_controls_section();
	}

	private function style_excerpt(): void {
		$this->start_controls_section( 'sty_excerpt', [
			'label' => __( '📝 توضیح مختصر', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'excerpt_typo',
			'selector' => '{{WRAPPER}} .ha-pro-card-excerpt',
		] );

		$this->add_control( 'excerpt_color', [
			'label'     => __( 'رنگ توضیح', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-card-excerpt' => 'color: {{VALUE}};' ],
		] );

		$this->add_control( 'excerpt_lines', [
			'label'     => __( 'تعداد خط نمایش', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::NUMBER,
			'min'       => 1,
			'max'       => 8,
			'default'   => 2,
			'selectors' => [
				'{{WRAPPER}} .ha-pro-card-excerpt' => '-webkit-line-clamp: {{VALUE}}; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;',
			],
		] );

		$this->end_controls_section();
	}

	private function style_features(): void {
		$this->start_controls_section( 'sty_features', [
			'label' => __( '🔖 برچسب‌های ویژگی', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'feat_typo',
			'selector' => '{{WRAPPER}} .ha-pro-card-features span',
		] );

		$this->add_control( 'feat_color', [
			'label'     => __( 'رنگ متن', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-card-features span' => 'color: {{VALUE}};' ],
		] );

		$this->add_control( 'feat_bg', [
			'label'     => __( 'رنگ پس‌زمینه', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-card-features span' => 'background-color: {{VALUE}};' ],
		] );

		$this->add_control( 'feat_radius', [
			'label'      => __( 'گردی', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', 'rem' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-card-features span' => 'border-radius: {{SIZE}}{{UNIT}};' ],
		] );

		$this->end_controls_section();
	}

	private function style_price(): void {
		$this->start_controls_section( 'sty_price', [
			'label' => __( '💰 قیمت', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'price_typo',
			'selector' => '{{WRAPPER}} .ha-pro-price',
		] );

		$this->add_control( 'price_color', [
			'label'     => __( 'رنگ قیمت', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-price' => 'color: {{VALUE}};' ],
		] );

		$this->add_control( 'price_contact_color', [
			'label'     => __( 'رنگ "تماس بگیرید"', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-price.is-free' => 'color: {{VALUE}};' ],
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'old_price_typo',
			'label'    => __( 'تایپوگرافی قیمت قدیم', 'harfehaval-sites-pro' ),
			'selector' => '{{WRAPPER}} .ha-pro-old-price',
		] );

		$this->add_control( 'old_price_color', [
			'label'     => __( 'رنگ قیمت قدیم', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-old-price' => 'color: {{VALUE}};' ],
		] );

		$this->end_controls_section();
	}

	private function style_btn_primary(): void {
		$this->start_controls_section( 'sty_btn_primary', [
			'label' => __( '🟢 دکمه سفارش (اصلی)', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'btn1_typo',
			'selector' => '{{WRAPPER}} .ha-pro-btn-primary',
		] );

		$this->start_controls_tabs( 'tabs_btn1' );

		$this->start_controls_tab( 'tab_btn1_normal', [ 'label' => __( 'عادی', 'harfehaval-sites-pro' ) ] );
		$this->add_control( 'btn1_color', [
			'label'     => __( 'رنگ متن', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-btn-primary' => 'color: {{VALUE}};' ],
		] );
		$this->add_group_control( Group_Control_Background::get_type(), [
			'name'     => 'btn1_bg',
			'label'    => __( 'پس‌زمینه', 'harfehaval-sites-pro' ),
			'types'    => [ 'classic', 'gradient' ],
			'selector' => '{{WRAPPER}} .ha-pro-btn-primary',
		] );
		$this->add_group_control( Group_Control_Box_Shadow::get_type(), [
			'name'     => 'btn1_shadow',
			'selector' => '{{WRAPPER}} .ha-pro-btn-primary',
		] );
		$this->end_controls_tab();

		$this->start_controls_tab( 'tab_btn1_hover', [ 'label' => __( 'hover', 'harfehaval-sites-pro' ) ] );
		$this->add_control( 'btn1_color_hover', [
			'label'     => __( 'رنگ متن (hover)', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-btn-primary:hover' => 'color: {{VALUE}};' ],
		] );
		$this->add_group_control( Group_Control_Background::get_type(), [
			'name'     => 'btn1_bg_hover',
			'label'    => __( 'پس‌زمینه (hover)', 'harfehaval-sites-pro' ),
			'types'    => [ 'classic', 'gradient' ],
			'selector' => '{{WRAPPER}} .ha-pro-btn-primary:hover',
		] );
		$this->end_controls_tab();
		$this->end_controls_tabs();

		$this->add_control( 'btn1_radius', [
			'label'      => __( 'گردی', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', 'rem', '%' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-btn-primary' => 'border-radius: {{SIZE}}{{UNIT}};' ],
		] );

		$this->add_responsive_control( 'btn1_padding', [
			'label'      => __( 'پدینگ', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::DIMENSIONS,
			'size_units' => [ 'px', 'rem', 'em' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-btn-primary' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
		] );

		$this->end_controls_section();
	}

	private function style_btn_secondary(): void {
		$this->start_controls_section( 'sty_btn_secondary', [
			'label' => __( '🔵 دکمه پیش‌نمایش (فرعی)', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'btn2_typo',
			'selector' => '{{WRAPPER}} .ha-pro-btn-secondary',
		] );

		$this->start_controls_tabs( 'tabs_btn2' );

		$this->start_controls_tab( 'tab_btn2_normal', [ 'label' => __( 'عادی', 'harfehaval-sites-pro' ) ] );
		$this->add_control( 'btn2_color', [
			'label'     => __( 'رنگ متن', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-btn-secondary' => 'color: {{VALUE}};' ],
		] );
		$this->add_group_control( Group_Control_Background::get_type(), [
			'name'     => 'btn2_bg',
			'types'    => [ 'classic', 'gradient' ],
			'selector' => '{{WRAPPER}} .ha-pro-btn-secondary',
		] );
		$this->end_controls_tab();

		$this->start_controls_tab( 'tab_btn2_hover', [ 'label' => __( 'hover', 'harfehaval-sites-pro' ) ] );
		$this->add_control( 'btn2_color_hover', [
			'label'     => __( 'رنگ متن (hover)', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-btn-secondary:hover' => 'color: {{VALUE}};' ],
		] );
		$this->add_group_control( Group_Control_Background::get_type(), [
			'name'     => 'btn2_bg_hover',
			'types'    => [ 'classic', 'gradient' ],
			'selector' => '{{WRAPPER}} .ha-pro-btn-secondary:hover',
		] );
		$this->end_controls_tab();
		$this->end_controls_tabs();

		$this->add_control( 'btn2_radius', [
			'label'      => __( 'گردی', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', 'rem', '%' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-btn-secondary' => 'border-radius: {{SIZE}}{{UNIT}};' ],
		] );

		$this->add_responsive_control( 'btn2_padding', [
			'label'      => __( 'پدینگ', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::DIMENSIONS,
			'size_units' => [ 'px', 'rem', 'em' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-btn-secondary' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
		] );

		$this->end_controls_section();
	}

	private function style_toolbar(): void {
		$this->start_controls_section( 'sty_toolbar', [
			'label' => __( '🛠️ نوار ابزار', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_group_control( Group_Control_Background::get_type(), [
			'name'     => 'toolbar_bg',
			'types'    => [ 'classic', 'gradient' ],
			'selector' => '{{WRAPPER}} .ha-pro-toolbar',
		] );

		$this->add_group_control( Group_Control_Border::get_type(), [
			'name'     => 'toolbar_border',
			'selector' => '{{WRAPPER}} .ha-pro-toolbar',
		] );

		$this->add_control( 'toolbar_radius', [
			'label'      => __( 'گردی', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', 'rem' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-toolbar' => 'border-radius: {{SIZE}}{{UNIT}};' ],
		] );

		$this->add_responsive_control( 'toolbar_padding', [
			'label'      => __( 'پدینگ', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::DIMENSIONS,
			'size_units' => [ 'px', 'rem' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-toolbar' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
		] );

		$this->end_controls_section();
	}

	private function style_search(): void {
		$this->start_controls_section( 'sty_search', [
			'label' => __( '🔎 باکس جستجو', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'search_typo',
			'selector' => '{{WRAPPER}} .ha-pro-search-input',
		] );

		$this->add_control( 'search_text_color', [
			'label'     => __( 'رنگ متن', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-search-input' => 'color: {{VALUE}};' ],
		] );

		$this->add_control( 'search_placeholder_color', [
			'label'     => __( 'رنگ placeholder', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-search-input::placeholder' => 'color: {{VALUE}};' ],
		] );

		$this->add_control( 'search_bg', [
			'label'     => __( 'رنگ پس‌زمینه', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-search' => 'background: {{VALUE}};' ],
		] );

		$this->add_control( 'search_icon_color', [
			'label'     => __( 'رنگ آیکون جستجو', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-search-icon' => 'color: {{VALUE}};' ],
		] );

		$this->add_group_control( Group_Control_Border::get_type(), [
			'name'     => 'search_border',
			'selector' => '{{WRAPPER}} .ha-pro-search',
		] );

		$this->add_control( 'search_border_focus', [
			'label'     => __( 'رنگ بوردر (focus)', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-search:focus-within' => 'border-color: {{VALUE}};' ],
		] );

		$this->add_control( 'search_radius', [
			'label'      => __( 'گردی', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', 'rem' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-search' => 'border-radius: {{SIZE}}{{UNIT}};' ],
		] );

		$this->end_controls_section();
	}

	private function style_filter_chips(): void {
		$this->start_controls_section( 'sty_chips', [
			'label' => __( '🏷️ تگ‌های فیلتر', 'harfehaval-sites-pro' ),
			'tab'   => Controls_Manager::TAB_STYLE,
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'chip_typo',
			'selector' => '{{WRAPPER}} .ha-pro-chip',
		] );

		$this->start_controls_tabs( 'tabs_chips' );

		$this->start_controls_tab( 'tab_chip_normal', [ 'label' => __( 'غیرفعال', 'harfehaval-sites-pro' ) ] );
		$this->add_control( 'chip_color', [
			'label'     => __( 'رنگ متن', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-chip:not(.is-active)' => 'color: {{VALUE}};' ],
		] );
		$this->add_control( 'chip_bg', [
			'label'     => __( 'رنگ پس‌زمینه', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-chip:not(.is-active)' => 'background: {{VALUE}};' ],
		] );
		$this->add_group_control( Group_Control_Border::get_type(), [
			'name'     => 'chip_border',
			'selector' => '{{WRAPPER}} .ha-pro-chip:not(.is-active)',
		] );
		$this->end_controls_tab();

		$this->start_controls_tab( 'tab_chip_active', [ 'label' => __( 'فعال', 'harfehaval-sites-pro' ) ] );
		$this->add_control( 'chip_active_color', [
			'label'     => __( 'رنگ متن (فعال)', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-chip.is-active' => 'color: {{VALUE}};' ],
		] );
		$this->add_control( 'chip_active_bg', [
			'label'     => __( 'رنگ پس‌زمینه (فعال)', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-chip.is-active' => 'background: {{VALUE}};' ],
		] );
		$this->end_controls_tab();
		$this->end_controls_tabs();

		$this->add_control( 'chip_radius', [
			'label'      => __( 'گردی', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', 'rem', '%' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-chip' => 'border-radius: {{SIZE}}{{UNIT}};' ],
		] );

		$this->add_responsive_control( 'chip_padding', [
			'label'      => __( 'پدینگ', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::DIMENSIONS,
			'size_units' => [ 'px', 'rem', 'em' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-chip' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
		] );

		$this->end_controls_section();
	}

	private function style_hero(): void {
		$this->start_controls_section( 'sty_hero', [
			'label'     => __( '🦸 هدر Hero', 'harfehaval-sites-pro' ),
			'tab'       => Controls_Manager::TAB_STYLE,
			'condition' => [ 'show_header' => 'yes' ],
		] );

		$this->add_group_control( Group_Control_Background::get_type(), [
			'name'     => 'hero_bg',
			'label'    => __( 'پس‌زمینه Hero', 'harfehaval-sites-pro' ),
			'types'    => [ 'classic', 'gradient' ],
			'selector' => '{{WRAPPER}} .ha-pro-hero',
		] );

		$this->add_control( 'hero_radius', [
			'label'      => __( 'گردی Hero', 'harfehaval-sites-pro' ),
			'type'       => Controls_Manager::SLIDER,
			'size_units' => [ 'px', 'rem' ],
			'selectors'  => [ '{{WRAPPER}} .ha-pro-hero' => 'border-radius: {{SIZE}}{{UNIT}};' ],
		] );

		$this->add_control( 'hero_badge_color', [
			'label'     => __( 'رنگ برچسب', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-hero-badge' => 'color: {{VALUE}};' ],
		] );

		$this->add_control( 'hero_badge_bg', [
			'label'     => __( 'پس‌زمینه برچسب', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-hero-badge' => 'background-color: {{VALUE}};' ],
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'hero_title_typo',
			'label'    => __( 'تایپوگرافی عنوان', 'harfehaval-sites-pro' ),
			'selector' => '{{WRAPPER}} .ha-pro-hero h2',
		] );

		$this->add_control( 'hero_title_color', [
			'label'     => __( 'رنگ عنوان', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-hero h2' => 'color: {{VALUE}};' ],
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'hero_subtitle_typo',
			'label'    => __( 'تایپوگرافی زیرعنوان', 'harfehaval-sites-pro' ),
			'selector' => '{{WRAPPER}} .ha-pro-hero p',
		] );

		$this->add_control( 'hero_subtitle_color', [
			'label'     => __( 'رنگ زیرعنوان', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-hero p' => 'color: {{VALUE}};' ],
		] );

		$this->end_controls_section();
	}

	private function style_modal(): void {
		$this->start_controls_section( 'sty_modal', [
			'label'     => __( '🔲 مودال پیش‌نمایش', 'harfehaval-sites-pro' ),
			'tab'       => Controls_Manager::TAB_STYLE,
			'condition' => [ 'modal' => 'yes' ],
		] );

		$this->add_control( 'modal_backdrop', [
			'label'     => __( 'رنگ backdrop', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-modal-backdrop' => 'background: {{VALUE}};' ],
		] );

		$this->add_control( 'modal_header_bg', [
			'label'     => __( 'پس‌زمینه هدر مودال', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-preview-header' => 'background: {{VALUE}};' ],
		] );

		$this->add_control( 'modal_side_bg', [
			'label'     => __( 'پس‌زمینه پنل کناری', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-preview-side' => 'background: {{VALUE}};' ],
		] );

		$this->add_group_control( Group_Control_Typography::get_type(), [
			'name'     => 'modal_device_typo',
			'label'    => __( 'تایپوگرافی دکمه‌های دستگاه', 'harfehaval-sites-pro' ),
			'selector' => '{{WRAPPER}} .ha-pro-preview-devices button',
		] );

		$this->add_control( 'modal_device_active_color', [
			'label'     => __( 'رنگ دکمه دستگاه (فعال)', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-preview-devices button.is-active' => 'color: {{VALUE}};' ],
		] );

		$this->add_control( 'modal_device_active_bg', [
			'label'     => __( 'پس‌زمینه دستگاه (فعال)', 'harfehaval-sites-pro' ),
			'type'      => Controls_Manager::COLOR,
			'selectors' => [ '{{WRAPPER}} .ha-pro-preview-devices button.is-active' => 'background: {{VALUE}};' ],
		] );

		$this->end_controls_section();
	}

	/* ═══════════════════════════════════════════════════════
	   RENDER
	   ═══════════════════════════════════════════════════════ */

	protected function render(): void {
		HA_Sites_Pro_Plugin::enqueue_front_assets();

		$s = $this->get_settings_for_display();

		$atts = [
			'columns'              => $s['columns'] ?? '3',
			'tablet_columns'       => $s['tablet_columns'] ?? '2',
			'mobile_columns'       => $s['mobile_columns'] ?? '1',
			'layout'               => $s['layout'] ?? 'grid',
			'card_style'           => $s['card_style'] ?? 'markil',
			'button_style'         => $s['button_style'] ?? 'solid',
			'hover_effect'         => $s['hover_effect'] ?? 'scroll',
			'show_header'          => $s['show_header'] ?? 'yes',
			'show_search'          => $s['show_search'] ?? 'yes',
			'show_filters'         => $s['show_filters'] ?? 'yes',
			'show_status_filter'   => $s['show_status_filter'] ?? 'yes',
			'show_sort'            => $s['show_sort'] ?? 'yes',
			'show_layout_switcher' => $s['show_layout_switcher'] ?? 'yes',
			'show_counter'         => $s['show_counter'] ?? 'yes',
			'show_image'           => $s['show_image'] ?? 'yes',
			'show_badge'           => $s['show_badge'] ?? 'yes',
			'show_excerpt'         => $s['show_excerpt'] ?? 'yes',
			'show_features'        => $s['show_features'] ?? 'yes',
			'show_price'           => $s['show_price'] ?? 'yes',
			'show_old_price'       => $s['show_old_price'] ?? 'yes',
			'show_rating'          => $s['show_rating'] ?? 'yes',
			'show_delivery'        => $s['show_delivery'] ?? 'yes',
			'show_installment'     => $s['show_installment'] ?? 'yes',
			'show_favorite'        => $s['show_favorite'] ?? 'yes',
			'show_compare'         => $s['show_compare'] ?? 'yes',
			'show_preview_button'  => $s['show_preview_button'] ?? 'yes',
			'show_order_button'    => $s['show_order_button'] ?? 'yes',
			'modal'                => $s['modal'] ?? 'yes',
			'preview_mode'         => $s['preview_mode'] ?? 'fullscreen',
			'pagination_type'      => $s['pagination_type'] ?? 'load_more',
			'category'             => $s['category'] ?? '',
			'feature'              => $s['feature'] ?? '',
			'status'               => $s['status'] ?? '',
			'sort'                 => $s['sort'] ?? 'newest',
			'per_page'             => $s['per_page'] ?? 12,
			'search_placeholder'   => $s['search_placeholder'] ?? '',
			'header_badge'         => $s['header_badge'] ?? '',
			'header_title'         => $s['header_title'] ?? '',
			'header_subtitle'      => $s['header_subtitle'] ?? '',
			'header_primary_text'  => $s['header_primary_text'] ?? '',
			'header_secondary_text'=> $s['header_secondary_text'] ?? '',
			'all_categories_label' => $s['all_categories_label'] ?? '',
			'all_features_label'   => $s['all_features_label'] ?? '',
			'all_status_label'     => $s['all_status_label'] ?? '',
			'preview_label'        => $s['preview_label'] ?? '',
			'order_label'          => $s['order_label'] ?? '',
			'new_tab_label'        => $s['new_tab_label'] ?? '',
			'loadmore_label'       => $s['loadmore_label'] ?? '',
			'reset_label'          => $s['reset_label'] ?? '',
			'empty_title'          => $s['empty_title'] ?? '',
			'empty_text'           => $s['empty_text'] ?? '',
			'contact_label'        => $s['contact_label'] ?? '',
			'sort_label'           => $s['sort_label'] ?? '',
			'desktop_label'        => $s['desktop_label'] ?? '',
			'tablet_label'         => $s['tablet_label'] ?? '',
			'mobile_label'         => $s['mobile_label'] ?? '',
			'favorite_label'       => $s['favorite_label'] ?? '',
			'compare_label'        => $s['compare_label'] ?? '',
			'compare_bar_label'    => $s['compare_bar_label'] ?? '',
		];

		echo HA_Sites_Pro_Renderer::render( $atts ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
