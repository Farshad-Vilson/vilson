<?php
namespace Markil\Widget;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Group_Control_Background;
use Elementor\Repeater;

if ( ! defined( 'ABSPATH' ) ) exit;

class ModuleFullDetail extends Widget_Base {

    public function get_name()       { return 'markil_module_full_detail'; }
    public function get_title()      { return __( '🖥️ صفحه جزئیات کامل ماژول', 'markil-modules' ); }
    public function get_icon()       { return 'eicon-single-page'; }
    public function get_categories() { return [ 'markil' ]; }
    public function get_keywords()   { return [ 'markil', 'module', 'detail', 'full', 'page', 'ماژول', 'جزئیات', 'صفحه کامل' ]; }

    protected function register_controls() {

        /* ===================== CONTENT: SOURCE ===================== */
        $this->start_controls_section( 'section_source', [ 'label' => __( '⚙️ منبع ماژول', 'markil-modules' ) ] );

        $modules_query   = new \WP_Query( [ 'post_type' => 'markil_module', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids' ] );
        $module_options  = [ 0 => __( 'پست جاری (auto)', 'markil-modules' ) ];
        if ( $modules_query->have_posts() ) {
            foreach ( $modules_query->posts as $pid ) {
                $module_options[ $pid ] = get_the_title( $pid ) . ' (#' . $pid . ')';
            }
        }

        $this->add_control( 'module_id', [
            'label'   => __( 'ماژول', 'markil-modules' ),
            'type'    => Controls_Manager::SELECT,
            'options' => $module_options,
            'default' => 0,
        ]);

        $this->add_control( 'sidebar_position', [
            'label'   => __( 'موقعیت سایدبار', 'markil-modules' ),
            'type'    => Controls_Manager::CHOOSE,
            'options' => [
                'left'  => [ 'title' => __( 'چپ', 'markil-modules' ),  'icon' => 'eicon-h-align-left' ],
                'right' => [ 'title' => __( 'راست', 'markil-modules' ), 'icon' => 'eicon-h-align-right' ],
            ],
            'default'   => 'left',
            'toggle'    => false,
        ]);

        $this->add_control( 'show_breadcrumbs', [
            'label'         => __( 'نمایش مسیر (Breadcrumb)', 'markil-modules' ),
            'type'          => Controls_Manager::SWITCHER,
            'return_value'  => 'yes',
            'default'       => 'yes',
        ]);

        $this->add_control( 'breadcrumb_home', [
            'label'     => __( 'متن خانه در مسیر', 'markil-modules' ),
            'type'      => Controls_Manager::TEXT,
            'default'   => __( 'خانه', 'markil-modules' ),
            'condition' => [ 'show_breadcrumbs' => 'yes' ],
        ]);

        $this->add_control( 'show_sidebar', [
            'label'        => __( 'نمایش سایدبار', 'markil-modules' ),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);

        $this->add_control( 'show_features_bar', [
            'label'        => __( 'نمایش نوار ویژگی‌ها', 'markil-modules' ),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);

        $this->add_control( 'show_sidebar_feats', [
            'label'        => __( 'نمایش ویژگی‌های سایدبار', 'markil-modules' ),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);

        $this->add_control( 'show_detail_sections', [
            'label'        => __( 'نمایش بخش‌های محتوا (Sections)', 'markil-modules' ),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);

        $this->add_control( 'show_guarantee', [
            'label'        => __( 'نمایش بنر ضمانت کیفیت', 'markil-modules' ),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);

        $this->end_controls_section();

        /* ===================== STYLE: WRAPPER ===================== */
        $this->start_controls_section( 'style_wrapper', [
            'label' => __( '🎨 ظاهر کلی', 'markil-modules' ),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_responsive_control( 'wrapper_padding', [
            'label'      => __( 'فاصله داخلی', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', 'em', '%' ],
            'selectors'  => [ '{{WRAPPER}} .markil-full-detail-wrap' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->add_group_control( Group_Control_Background::get_type(), [
            'name'     => 'wrapper_bg',
            'selector' => '{{WRAPPER}} .markil-full-detail-wrap',
        ]);

        $this->end_controls_section();

        /* ===================== STYLE: TITLE ===================== */
        $this->start_controls_section( 'style_title', [
            'label' => __( '📝 عنوان', 'markil-modules' ),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_group_control( Group_Control_Typography::get_type(), [
            'name'     => 'title_typo',
            'selector' => '{{WRAPPER}} .markil-fdc-title',
        ]);

        $this->add_control( 'title_color', [
            'label'     => __( 'رنگ', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-title' => 'color: {{VALUE}};' ],
        ]);

        $this->add_responsive_control( 'title_margin', [
            'label'      => __( 'فاصله بیرونی', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', 'em' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-title' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->end_controls_section();

        /* ===================== STYLE: FEATURES BAR ===================== */
        $this->start_controls_section( 'style_features_bar', [
            'label' => __( '🏷️ نوار ویژگی‌ها', 'markil-modules' ),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_control( 'fb_bg', [
            'label'     => __( 'رنگ پس‌زمینه برچسب', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-fb-item' => 'background: {{VALUE}};' ],
        ]);

        $this->add_control( 'fb_color', [
            'label'     => __( 'رنگ متن', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-fb-item' => 'color: {{VALUE}};' ],
        ]);

        $this->add_control( 'fb_border_color', [
            'label'     => __( 'رنگ بردر', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-fb-item' => 'border-color: {{VALUE}};' ],
        ]);

        $this->add_group_control( Group_Control_Typography::get_type(), [
            'name'     => 'fb_typo',
            'selector' => '{{WRAPPER}} .markil-fdc-fb-item',
        ]);

        $this->add_responsive_control( 'fb_radius', [
            'label'      => __( 'گوشه‌های گرد', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', '%' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-fb-item' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->end_controls_section();

        /* ===================== STYLE: TABS ===================== */
        $this->start_controls_section( 'style_tabs', [
            'label' => __( '📋 تب‌ها', 'markil-modules' ),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_group_control( Group_Control_Typography::get_type(), [
            'name'     => 'tab_btn_typo',
            'label'    => __( 'تایپوگرافی دکمه تب', 'markil-modules' ),
            'selector' => '{{WRAPPER}} .markil-fdc-tab-btn',
        ]);

        $this->start_controls_tabs( 'tabs_style_tabs' );

        $this->start_controls_tab( 'tab_normal', [ 'label' => __( 'معمولی', 'markil-modules' ) ] );
        $this->add_control( 'tab_btn_color', [
            'label'     => __( 'رنگ', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-tab-btn' => 'color: {{VALUE}};' ],
        ]);
        $this->add_control( 'tab_btn_bg', [
            'label'     => __( 'پس‌زمینه', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-tab-btn' => 'background: {{VALUE}};' ],
        ]);
        $this->end_controls_tab();

        $this->start_controls_tab( 'tab_active', [ 'label' => __( 'فعال', 'markil-modules' ) ] );
        $this->add_control( 'tab_btn_active_color', [
            'label'     => __( 'رنگ', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-tab-btn.active' => 'color: {{VALUE}};' ],
        ]);
        $this->add_control( 'tab_btn_active_bg', [
            'label'     => __( 'پس‌زمینه', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-tab-btn.active' => 'background: {{VALUE}};' ],
        ]);
        $this->add_control( 'tab_btn_active_border', [
            'label'     => __( 'رنگ بردر', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-tab-btn.active' => 'border-color: {{VALUE}};' ],
        ]);
        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->add_responsive_control( 'tab_btn_radius', [
            'label'      => __( 'گوشه‌های گرد', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', '%' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-tab-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->add_responsive_control( 'tab_btn_padding', [
            'label'      => __( 'فاصله داخلی دکمه', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', 'em' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-tab-btn' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->add_group_control( Group_Control_Border::get_type(), [
            'name'      => 'tab_content_border',
            'label'     => __( 'بردر محتوا', 'markil-modules' ),
            'selector'  => '{{WRAPPER}} .markil-fdc-tabs-content',
            'separator' => 'before',
        ]);

        $this->end_controls_section();

        /* ===================== STYLE: SECTIONS ===================== */
        $this->start_controls_section( 'style_sections', [
            'label' => __( '📦 بخش‌های محتوا', 'markil-modules' ),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_group_control( Group_Control_Typography::get_type(), [
            'name'     => 'sec_title_typo',
            'label'    => __( 'تایپوگرافی عنوان بخش', 'markil-modules' ),
            'selector' => '{{WRAPPER}} .markil-fdc-sec-title',
        ]);

        $this->add_control( 'sec_title_color', [
            'label'     => __( 'رنگ عنوان بخش', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-sec-title' => 'color: {{VALUE}};' ],
        ]);

        $this->add_group_control( Group_Control_Background::get_type(), [
            'name'     => 'item_bg',
            'label'    => __( 'پس‌زمینه آیتم', 'markil-modules' ),
            'selector' => '{{WRAPPER}} .markil-fdc-item',
        ]);

        $this->add_group_control( Group_Control_Border::get_type(), [
            'name'     => 'item_border',
            'selector' => '{{WRAPPER}} .markil-fdc-item',
        ]);

        $this->add_responsive_control( 'item_radius', [
            'label'      => __( 'گوشه‌های گرد آیتم', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', '%' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-item' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->add_control( 'item_icon_color', [
            'label'     => __( 'رنگ آیکون آیتم', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-item-icon i' => 'color: {{VALUE}};' ],
        ]);

        $this->add_control( 'item_icon_bg', [
            'label'     => __( 'پس‌زمینه آیکون', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-item-icon' => 'background: {{VALUE}};' ],
        ]);

        $this->end_controls_section();

        /* ===================== STYLE: SIDEBAR ===================== */
        $this->start_controls_section( 'style_sidebar', [
            'label' => __( '📌 سایدبار', 'markil-modules' ),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_group_control( Group_Control_Background::get_type(), [
            'name'     => 'sidebar_bg',
            'selector' => '{{WRAPPER}} .markil-fdc-sidebar-card',
        ]);

        $this->add_group_control( Group_Control_Border::get_type(), [
            'name'     => 'sidebar_border',
            'selector' => '{{WRAPPER}} .markil-fdc-sidebar-card',
        ]);

        $this->add_responsive_control( 'sidebar_radius', [
            'label'      => __( 'گوشه‌های گرد', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', '%' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-sidebar-card' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->add_group_control( Group_Control_Box_Shadow::get_type(), [
            'name'     => 'sidebar_shadow',
            'selector' => '{{WRAPPER}} .markil-fdc-sidebar-card',
        ]);

        $this->add_responsive_control( 'sidebar_padding', [
            'label'      => __( 'فاصله داخلی', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', 'em' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-sidebar-card' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->add_control( 'sidebar_width', [
            'label'      => __( 'عرض سایدبار', 'markil-modules' ),
            'type'       => Controls_Manager::SLIDER,
            'size_units' => [ 'px', '%' ],
            'range'      => [ 'px' => [ 'min' => 280, 'max' => 500 ], '%' => [ 'min' => 20, 'max' => 50 ] ],
            'default'    => [ 'unit' => 'px', 'size' => 340 ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-sidebar' => 'width: {{SIZE}}{{UNIT}}; flex: 0 0 {{SIZE}}{{UNIT}};' ],
        ]);

        $this->end_controls_section();

        /* ===================== STYLE: PRICE ===================== */
        $this->start_controls_section( 'style_price', [
            'label' => __( '💰 قیمت (سایدبار)', 'markil-modules' ),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_group_control( Group_Control_Typography::get_type(), [
            'name'     => 'price_typo',
            'selector' => '{{WRAPPER}} .markil-fdc-price',
        ]);

        $this->add_control( 'price_color', [
            'label'     => __( 'رنگ قیمت', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-price' => 'color: {{VALUE}};' ],
        ]);

        $this->add_group_control( Group_Control_Background::get_type(), [
            'name'     => 'price_bg',
            'selector' => '{{WRAPPER}} .markil-fdc-price-wrap',
        ]);

        $this->add_responsive_control( 'price_padding', [
            'label'      => __( 'فاصله داخلی', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', 'em' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-price-wrap' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->end_controls_section();

        /* ===================== STYLE: BUTTONS ===================== */
        $this->start_controls_section( 'style_buttons', [
            'label' => __( '🔘 دکمه‌ها', 'markil-modules' ),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_control( 'btn1_heading', [ 'label' => __( 'دکمه اصلی', 'markil-modules' ), 'type' => Controls_Manager::HEADING ] );

        $this->add_group_control( Group_Control_Typography::get_type(), [
            'name'     => 'btn1_typo',
            'selector' => '{{WRAPPER}} .markil-fdc-btn-primary',
        ]);

        $this->add_control( 'btn1_color', [
            'label'     => __( 'رنگ متن', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-btn-primary' => 'color: {{VALUE}};' ],
        ]);

        $this->add_control( 'btn1_bg', [
            'label'     => __( 'پس‌زمینه', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-btn-primary' => 'background-color: {{VALUE}}; border-color: {{VALUE}};' ],
        ]);

        $this->add_responsive_control( 'btn1_radius', [
            'label'      => __( 'گوشه‌های گرد', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', '%' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-btn-primary' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->add_responsive_control( 'btn1_padding', [
            'label'      => __( 'فاصله داخلی', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', 'em' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-btn-primary' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->add_control( 'btn2_heading', [ 'label' => __( 'دکمه ثانویه', 'markil-modules' ), 'type' => Controls_Manager::HEADING, 'separator' => 'before' ] );

        $this->add_control( 'btn2_color', [
            'label'     => __( 'رنگ متن', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-btn-secondary' => 'color: {{VALUE}};' ],
        ]);

        $this->add_control( 'btn2_border_color', [
            'label'     => __( 'رنگ بردر', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-btn-secondary' => 'border-color: {{VALUE}};' ],
        ]);

        $this->add_responsive_control( 'btn2_radius', [
            'label'      => __( 'گوشه‌های گرد', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', '%' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-btn-secondary' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->end_controls_section();

        /* ===================== STYLE: IMAGE ===================== */
        $this->start_controls_section( 'style_image', [
            'label' => __( '🖼️ تصویر محصول', 'markil-modules' ),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_responsive_control( 'img_height', [
            'label'      => __( 'ارتفاع', 'markil-modules' ),
            'type'       => Controls_Manager::SLIDER,
            'size_units' => [ 'px', 'vh' ],
            'range'      => [ 'px' => [ 'min' => 100, 'max' => 600 ] ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-img-wrap' => 'height: {{SIZE}}{{UNIT}};' ],
        ]);

        $this->add_control( 'img_fit', [
            'label'     => __( 'Object Fit', 'markil-modules' ),
            'type'      => Controls_Manager::SELECT,
            'options'   => [ 'cover' => 'Cover', 'contain' => 'Contain', 'fill' => 'Fill' ],
            'default'   => 'cover',
            'selectors' => [ '{{WRAPPER}} .markil-fdc-product-img' => 'object-fit: {{VALUE}};' ],
        ]);

        $this->add_responsive_control( 'img_radius', [
            'label'      => __( 'گوشه‌های گرد', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', '%' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-img-wrap, {{WRAPPER}} .markil-fdc-product-img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->end_controls_section();

        /* ===================== STYLE: GUARANTEE ===================== */
        $this->start_controls_section( 'style_guarantee', [
            'label' => __( '🛡️ بنر ضمانت', 'markil-modules' ),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_group_control( Group_Control_Background::get_type(), [
            'name'     => 'guar_bg',
            'selector' => '{{WRAPPER}} .markil-fdc-guarantee',
        ]);

        $this->add_control( 'guar_color', [
            'label'     => __( 'رنگ متن', 'markil-modules' ),
            'type'      => Controls_Manager::COLOR,
            'selectors' => [ '{{WRAPPER}} .markil-fdc-guarantee' => 'color: {{VALUE}};' ],
        ]);

        $this->add_responsive_control( 'guar_radius', [
            'label'      => __( 'گوشه‌های گرد', 'markil-modules' ),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => [ 'px', '%' ],
            'selectors'  => [ '{{WRAPPER}} .markil-fdc-guarantee' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
        ]);

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();

        $module_id = intval( $settings['module_id'] ?? 0 );
        if ( ! $module_id ) $module_id = get_the_ID();
        if ( ! $module_id || get_post_type( $module_id ) !== 'markil_module' ) {
            echo '<p class="markil-no-module">' . esc_html__( 'ماژولی انتخاب نشده یا صفحه جاری ماژول نیست.', 'markil-modules' ) . '</p>';
            return;
        }

        $ajax     = new \Markil\Ajax();
        $m        = $ajax->format_module( $module_id, true );
        $currency = get_option( 'markil_currency', 'تومان' );

        // Map Elementor settings to template settings array
        $tpl_settings = [
            'show_breadcrumbs'    => $settings['show_breadcrumbs']    ?? 'yes',
            'show_sidebar'        => $settings['show_sidebar']        ?? 'yes',
            'show_features_bar'   => $settings['show_features_bar']   ?? 'yes',
            'show_sidebar_feats'  => $settings['show_sidebar_feats']  ?? 'yes',
            'show_detail_sections'=> $settings['show_detail_sections']?? 'yes',
            'show_guarantee'      => $settings['show_guarantee']      ?? 'yes',
            'sidebar_position'    => $settings['sidebar_position']    ?? 'left',
            'breadcrumb_home'     => $settings['breadcrumb_home']     ?? __( 'خانه', 'markil-modules' ),
        ];
        $settings = $tpl_settings;

        include MARKIL_PATH . 'templates/full-detail-layout.php';
    }
}
