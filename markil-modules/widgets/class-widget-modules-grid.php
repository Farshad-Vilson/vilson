<?php
namespace Markil\Widget;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Group_Control_Background;
use Elementor\Icons_Manager;
use Elementor\Core\Kits\Documents\Tabs\Global_Colors;
use Elementor\Core\Kits\Documents\Tabs\Global_Typography;

if ( ! defined( 'ABSPATH' ) ) exit;

class ModulesGrid extends Widget_Base {

    public function get_name()  { return 'markil_modules_grid'; }
    public function get_title() { return __( '🏪 نمایش ماژول‌ها', 'markil-modules' ); }
    public function get_icon()  { return 'eicon-gallery-grid'; }
    public function get_categories() { return [ 'markil' ]; }
    public function get_keywords() { return [ 'markil', 'modules', 'grid', 'shop', 'ماژول' ]; }

    protected function register_controls() {
        $this->register_content_controls();
        $this->register_filter_controls();
        $this->register_style_controls();
    }

    // ===== CONTENT CONTROLS =====
    private function register_content_controls() {
        // Query
        $this->start_controls_section('section_query', [
            'label' => __( '🔍 پرس‌وجو و فیلتر', 'markil-modules' ),
        ]);

        $categories = get_terms(['taxonomy'=>'markil_category','hide_empty'=>false,'fields'=>'id=>name']);
        $cat_options = [ '' => __('همه دسته‌ها','markil-modules') ];
        if(!is_wp_error($categories)) $cat_options += $categories;

        $this->add_control('category', [
            'label'   => __('دسته‌بندی پیش‌فرض','markil-modules'),
            'type'    => Controls_Manager::SELECT,
            'options' => $cat_options,
            'default' => '',
        ]);
        $this->add_control('posts_per_page', [
            'label'   => __('تعداد ماژول','markil-modules'),
            'type'    => Controls_Manager::NUMBER,
            'default' => 12,
            'min'     => 1,
            'max'     => 100,
        ]);
        $this->add_control('orderby', [
            'label'   => __('مرتب‌سازی پیش‌فرض','markil-modules'),
            'type'    => Controls_Manager::SELECT,
            'options' => [
                'popular'    => __('پربازدیدترین','markil-modules'),
                'newest'     => __('جدیدترین','markil-modules'),
                'rating'     => __('بهترین امتیاز','markil-modules'),
                'price_low'  => __('ارزان‌ترین','markil-modules'),
                'price_high' => __('گران‌ترین','markil-modules'),
            ],
            'default' => 'newest',
        ]);

        $this->end_controls_section();

        // Layout
        $this->start_controls_section('section_layout', [
            'label' => __( '📐 چیدمان', 'markil-modules' ),
        ]);
        $this->add_control('default_layout', [
            'label'   => __('نمای پیش‌فرض','markil-modules'),
            'type'    => Controls_Manager::CHOOSE,
            'options' => [
                'grid' => ['title'=>__('شبکه‌ای','markil-modules'),'icon'=>'eicon-gallery-grid'],
                'list' => ['title'=>__('لیستی','markil-modules'),'icon'=>'eicon-list'],
            ],
            'default'      => 'grid',
            'toggle'       => false,
            'return_value' => 'grid',
        ]);
        $this->add_responsive_control('columns', [
            'label'   => __('تعداد ستون','markil-modules'),
            'type'    => Controls_Manager::NUMBER,
            'devices' => ['desktop','tablet','mobile'],
            'desktop_default' => 4,
            'tablet_default'  => 2,
            'mobile_default'  => 1,
            'min'     => 1,
            'max'     => 6,
            'selectors' => [
                '{{WRAPPER}} .markil-grid' => 'grid-template-columns: repeat({{VALUE}}, 1fr);',
            ],
        ]);
        $this->add_responsive_control('gap', [
            'label'      => __('فاصله بین کارت‌ها','markil-modules'),
            'type'       => Controls_Manager::SLIDER,
            'size_units' => ['px','rem'],
            'range'      => ['px'=>['min'=>0,'max'=>60]],
            'default'    => ['unit'=>'px','size'=>20],
            'selectors'  => [
                '{{WRAPPER}} .markil-grid' => 'gap: {{SIZE}}{{UNIT}};',
                '{{WRAPPER}} .markil-list' => 'gap: {{SIZE}}{{UNIT}};',
            ],
        ]);
        $this->add_control('show_layout_switcher', [
            'label'        => __('نمایش انتخابگر نمای شبکه‌ای/لیستی','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'label_on'     => __('نمایش','markil-modules'),
            'label_off'    => __('پنهان','markil-modules'),
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);
        $this->add_control('show_results_count', [
            'label'        => __('نمایش تعداد نتایج','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);

        $this->end_controls_section();

        // Icons
        $this->start_controls_section('section_icons', [
            'label' => __( '🎯 آیکون‌ها', 'markil-modules' ),
        ]);
        $icon_controls = [
            'icon_search'       => ['label'=>__('آیکون جستجو','markil-modules'), 'default'=>'fas fa-search'],
            'icon_all_category' => ['label'=>__('آیکون همه دسته‌ها','markil-modules'), 'default'=>'fas fa-home'],
            'icon_placeholder'  => ['label'=>__('آیکون جایگزین تصویر','markil-modules'), 'default'=>'fas fa-box'],
            'icon_empty_panel'  => ['label'=>__('آیکون پنل خالی/اسلایدر','markil-modules'), 'default'=>'fas fa-store'],
            'icon_wishlist'     => ['label'=>__('آیکون علاقه‌مندی','markil-modules'), 'default'=>'far fa-heart'],
            'icon_wishlist_on'  => ['label'=>__('آیکون علاقه‌مندی فعال','markil-modules'), 'default'=>'fas fa-heart'],
            'icon_rating'       => ['label'=>__('آیکون امتیاز','markil-modules'), 'default'=>'fas fa-star'],
            'icon_installs'     => ['label'=>__('آیکون نصب/محبوبیت','markil-modules'), 'default'=>'fas fa-users'],
            'icon_version'      => ['label'=>__('آیکون نسخه','markil-modules'), 'default'=>'fas fa-box-open'],
            'icon_filter'       => ['label'=>__('آیکون دکمه فیلتر','markil-modules'), 'default'=>'fas fa-filter'],
            'icon_close'        => ['label'=>__('آیکون بستن پاپ‌آپ موبایل','markil-modules'), 'default'=>'fas fa-times'],
        ];
        foreach ($icon_controls as $key => $args) {
            $this->add_control($key, [
                'label'   => $args['label'],
                'type'    => Controls_Manager::ICONS,
                'default' => [ 'value' => $args['default'], 'library' => 'fa-solid' ],
            ]);
        }
        $this->end_controls_section();


        // Panel Detail
        $this->start_controls_section('section_panel', [
            'label' => __( '📋 پنل جزئیات', 'markil-modules' ),
        ]);
        $this->add_control('show_detail_panel', [
            'label'        => __('نمایش پنل جزئیات کنار صفحه','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);
        $this->add_control('panel_position', [
            'label'   => __('موقعیت پنل','markil-modules'),
            'type'    => Controls_Manager::CHOOSE,
            'options' => [
                'right' => ['title'=>__('راست','markil-modules'),'icon'=>'eicon-h-align-right'],
                'left'  => ['title'=>__('چپ','markil-modules'),'icon'=>'eicon-h-align-left'],
            ],
            'default' => 'right',
            'condition' => ['show_detail_panel'=>'yes'],
        ]);
        $this->add_control('panel_width', [
            'label'      => __('عرض پنل','markil-modules'),
            'type'       => Controls_Manager::SLIDER,
            'size_units' => ['px','%'],
            'range'      => ['px'=>['min'=>200,'max'=>600],'%'=>['min'=>10,'max'=>60]],
            'default'    => ['unit'=>'px','size'=>400],
            'condition'  => ['show_detail_panel'=>'yes'],
            'selectors'  => ['{{WRAPPER}} .markil-detail-panel' => 'width: {{SIZE}}{{UNIT}};'],
        ]);

        $this->add_control('panel_idle_slider', [
            'label'        => __('اسلایدر پیش‌فرض قبل از انتخاب ماژول','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
            'condition'    => ['show_detail_panel'=>'yes'],
        ]);
        $this->add_control('panel_idle_interval', [
            'label'      => __('سرعت تعویض اسلایدر (میلی‌ثانیه)','markil-modules'),
            'type'       => Controls_Manager::NUMBER,
            'default'    => 4500,
            'min'        => 1000,
            'max'        => 20000,
            'step'       => 500,
            'condition'  => ['show_detail_panel'=>'yes','panel_idle_slider'=>'yes'],
        ]);
        $this->add_control('panel_idle_title', [
            'label'     => __('عنوان حالت پیش‌فرض پنل','markil-modules'),
            'type'      => Controls_Manager::TEXT,
            'default'   => __('ماژول‌های پیشنهادی','markil-modules'),
            'condition' => ['show_detail_panel'=>'yes'],
        ]);
        $this->add_control('panel_idle_description', [
            'label'     => __('توضیح حالت پیش‌فرض پنل','markil-modules'),
            'type'      => Controls_Manager::TEXTAREA,
            'default'   => __('برای دیدن جزئیات، یک ماژول را انتخاب کنید.','markil-modules'),
            'condition' => ['show_detail_panel'=>'yes'],
        ]);
        $this->add_responsive_control('panel_image_height', [
            'label'      => __('ارتفاع تصویر اسلاید/پنل','markil-modules'),
            'type'       => Controls_Manager::SLIDER,
            'size_units' => ['px','rem','vw'],
            'range'      => ['px'=>['min'=>60,'max'=>520],'rem'=>['min'=>4,'max'=>32],'vw'=>['min'=>10,'max'=>80]],
            'default'    => ['unit'=>'px','size'=>180],
            'selectors'  => [
                '{{WRAPPER}} .markil-idle-image' => 'height: {{SIZE}}{{UNIT}};',
                '{{WRAPPER}} .markil-detail-icon' => 'height: {{SIZE}}{{UNIT}};',
            ],
            'condition' => ['show_detail_panel'=>'yes'],
        ]);
        $this->add_responsive_control('panel_image_width', [
            'label'      => __('عرض تصویر اسلاید/پنل','markil-modules'),
            'type'       => Controls_Manager::SLIDER,
            'size_units' => ['px','%'],
            'range'      => ['px'=>['min'=>60,'max'=>520],'%'=>['min'=>20,'max'=>100]],
            'default'    => ['unit'=>'%','size'=>100],
            'selectors'  => [
                '{{WRAPPER}} .markil-idle-image' => 'width: {{SIZE}}{{UNIT}}; flex-basis: auto;',
                '{{WRAPPER}} .markil-detail-icon' => 'width: {{SIZE}}{{UNIT}}; flex-basis: auto;',
            ],
            'condition' => ['show_detail_panel'=>'yes'],
        ]);
        $this->add_control('panel_image_fit', [
            'label'   => __('نحوه نمایش تصویر اسلاید/پنل','markil-modules'),
            'type'    => Controls_Manager::SELECT,
            'options' => [
                'cover'   => __('پر کردن کادر','markil-modules'),
                'contain' => __('نمایش کامل تصویر','markil-modules'),
                'fill'    => __('کشیده شود','markil-modules'),
            ],
            'default' => 'cover',
            'selectors' => ['{{WRAPPER}} .markil-idle-image img, {{WRAPPER}} .markil-detail-icon img' => 'object-fit: {{VALUE}};'],
            'condition' => ['show_detail_panel'=>'yes'],
        ]);

        $this->end_controls_section();

        // Search & Filter bar
        $this->start_controls_section('section_search_filter', [
            'label' => __( '🔎 جستجو و فیلترها', 'markil-modules' ),
        ]);
        $this->add_control('show_search', [
            'label'        => __('جستجو','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);
        $this->add_control('search_placeholder', [
            'label'     => __('متن placeholder جستجو','markil-modules'),
            'type'      => Controls_Manager::TEXT,
            'default'   => __('جستجو در بین ماژول‌ها...','markil-modules'),
            'condition' => ['show_search'=>'yes'],
        ]);
        $this->add_control('show_category_tabs', [
            'label'        => __('تب‌های دسته‌بندی','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);
        $this->add_control('all_categories_label', [
            'label'     => __('برچسب "همه دسته‌ها"','markil-modules'),
            'type'      => Controls_Manager::TEXT,
            'default'   => __('همه دسته‌ها','markil-modules'),
            'condition' => ['show_category_tabs'=>'yes'],
        ]);
        $this->add_control('show_filters', [
            'label'        => __('دکمه فیلترها','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => '',
        ]);
        $this->add_control('filters_label', [
            'label'     => __('متن دکمه فیلتر','markil-modules'),
            'type'      => Controls_Manager::TEXT,
            'default'   => __('فیلترها','markil-modules'),
            'condition' => ['show_filters'=>'yes'],
        ]);
        $this->add_control('show_sort', [
            'label'        => __('منوی مرتب‌سازی','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);

        $this->add_control('sort_popular_label', [
            'label' => __('متن مرتب‌سازی: پربازدیدترین','markil-modules'),
            'type' => Controls_Manager::TEXT,
            'default' => __('پربازدیدترین','markil-modules'),
            'condition' => ['show_sort'=>'yes'],
        ]);
        $this->add_control('sort_newest_label', [
            'label' => __('متن مرتب‌سازی: جدیدترین','markil-modules'),
            'type' => Controls_Manager::TEXT,
            'default' => __('جدیدترین','markil-modules'),
            'condition' => ['show_sort'=>'yes'],
        ]);
        $this->add_control('sort_rating_label', [
            'label' => __('متن مرتب‌سازی: بهترین امتیاز','markil-modules'),
            'type' => Controls_Manager::TEXT,
            'default' => __('بهترین امتیاز','markil-modules'),
            'condition' => ['show_sort'=>'yes'],
        ]);
        $this->add_control('sort_price_low_label', [
            'label' => __('متن مرتب‌سازی: ارزان‌ترین','markil-modules'),
            'type' => Controls_Manager::TEXT,
            'default' => __('ارزان‌ترین','markil-modules'),
            'condition' => ['show_sort'=>'yes'],
        ]);
        $this->add_control('sort_price_high_label', [
            'label' => __('متن مرتب‌سازی: گران‌ترین','markil-modules'),
            'type' => Controls_Manager::TEXT,
            'default' => __('گران‌ترین','markil-modules'),
            'condition' => ['show_sort'=>'yes'],
        ]);
        $this->add_control('toolbar_single_line', [
            'label'        => __('چیدمان همه ابزارها در یک خط در دسکتاپ','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);
        $this->add_control('mobile_tools_heading', [
            'label'     => __('تنظیمات موبایل','markil-modules'),
            'type'      => Controls_Manager::HEADING,
            'separator' => 'before',
        ]);
        $this->add_control('mobile_category_mode', [
            'label'   => __('نمایش دسته‌بندی در موبایل','markil-modules'),
            'type'    => Controls_Manager::SELECT,
            'options' => [
                'hamburger' => __('منوی همبرگری / باز و بسته‌شونده','markil-modules'),
                'scroll'    => __('اسکرول افقی','markil-modules'),
                'hidden'    => __('مخفی','markil-modules'),
            ],
            'default' => 'hamburger',
            'condition' => ['show_category_tabs'=>'yes'],
        ]);
        $this->add_control('mobile_category_button_text', [
            'label' => __('متن دکمه دسته‌بندی موبایل','markil-modules'),
            'type' => Controls_Manager::TEXT,
            'default' => __('دسته‌بندی‌ها','markil-modules'),
            'condition' => ['show_category_tabs'=>'yes','mobile_category_mode'=>'hamburger'],
        ]);
        $this->add_control('mobile_hide_search', [
            'label'        => __('مخفی کردن جستجو در موبایل','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => '',
        ]);
        $this->add_control('mobile_hide_filters', [
            'label'        => __('مخفی کردن فیلتر در موبایل','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => '',
        ]);
        $this->add_control('mobile_hide_sort', [
            'label'        => __('مخفی کردن مرتب‌سازی در موبایل','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => '',
        ]);
        $this->add_control('mobile_hide_layout', [
            'label'        => __('مخفی کردن انتخاب نما در موبایل','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => '',
        ]);

        $this->end_controls_section();

        // Card fields
        $this->start_controls_section('section_card_fields', [
            'label' => __( '🃏 فیلدهای کارت', 'markil-modules' ),
        ]);
        foreach([
            'show_image'   => ['نمایش تصویر/آیکون','yes'],
            'show_title'   => ['نمایش عنوان','yes'],
            'show_excerpt' => ['نمایش توضیح کوتاه','yes'],
            'show_price'   => ['نمایش قیمت','yes'],
            'show_rating'  => ['نمایش امتیاز','yes'],
            'show_installs'=> ['نمایش تعداد محبوبیت/قلب در کارت','yes'],
            'show_badge'   => ['نمایش برچسب','yes'],
            'show_wishlist'=> ['دکمه علاقه‌مندی',''],
            'show_category_badge' => ['برچسب دسته‌بندی','yes'],
        ] as $ctrl=>[$label,$default]) {
            $this->add_control($ctrl,[
                'label'        => __($label,'markil-modules'),
                'type'         => Controls_Manager::SWITCHER,
                'return_value' => 'yes',
                'default'      => $default,
            ]);
        }

        $this->add_control('show_tag_badge', [
            'label'        => __('برچسب‌های تگ/هشتگ','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);

        $this->end_controls_section();

        // Pagination
        $this->start_controls_section('section_pagination', [
            'label' => __( '📄 صفحه‌بندی', 'markil-modules' ),
        ]);
        $this->add_control('show_pagination', [
            'label'        => __('نمایش صفحه‌بندی','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);
        $this->add_control('pagination_type', [
            'label'     => __('نوع صفحه‌بندی','markil-modules'),
            'type'      => Controls_Manager::SELECT,
            'options'   => [
                'numbers'    => __('شماره صفحات','markil-modules'),
                'load_more'  => __('بارگذاری بیشتر','markil-modules'),
                'infinite'   => __('بارگذاری بی‌نهایت','markil-modules'),
            ],
            'default'   => 'numbers',
            'condition' => ['show_pagination'=>'yes'],
        ]);
        $this->add_control('load_more_text', [
            'label'     => __('متن دکمه بارگذاری بیشتر','markil-modules'),
            'type'      => Controls_Manager::TEXT,
            'default'   => __('نمایش بیشتر','markil-modules'),
            'condition' => ['show_pagination'=>'yes','pagination_type'=>'load_more'],
        ]);

        $this->end_controls_section();
    }

    // ===== FILTER CONTROLS =====
    private function register_filter_controls() {
        $this->start_controls_section('section_filter_panel', [
            'label' => __( '⚙️ پنل فیلتر پیشرفته', 'markil-modules' ),
        ]);
        $this->add_control('show_price_filter', [
            'label'        => __('فیلتر قیمت','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);
        $this->add_control('show_rating_filter', [
            'label'        => __('فیلتر امتیاز','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);
        $this->add_control('show_tag_filter', [
            'label'        => __('فیلتر برچسب','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);
        $this->add_control('show_free_filter', [
            'label'        => __('فیلتر رایگان/پولی','markil-modules'),
            'type'         => Controls_Manager::SWITCHER,
            'return_value' => 'yes',
            'default'      => 'yes',
        ]);

        $this->end_controls_section();
    }

    // ===== STYLE CONTROLS =====
    private function register_style_controls() {
        $this->style_wrapper();
        $this->style_search_bar();
        $this->style_category_tabs();
        $this->style_filter_panel();
        $this->style_card();
        $this->style_card_image();
        $this->style_card_title();
        $this->style_card_excerpt();
        $this->style_card_price();
        $this->style_card_rating();
        $this->style_card_badge();
        $this->style_detail_panel();
        $this->style_tabs();
        $this->style_buttons();
        $this->style_pagination();
        $this->style_loading();
    }

    private function style_wrapper() {
        $this->start_controls_section('style_wrapper', [
            'label' => __('🎨 پس‌زمینه کلی','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'wrapper_bg',
            'label'    => __('پس‌زمینه','markil-modules'),
            'selector' => '{{WRAPPER}} .markil-modules-wrapper',
        ]);
        $this->add_responsive_control('wrapper_padding', [
            'label'      => __('فاصله داخلی','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em','%'],
            'selectors'  => ['{{WRAPPER}} .markil-modules-wrapper' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('wrapper_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-modules-wrapper' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->end_controls_section();
    }

    private function style_search_bar() {
        $this->start_controls_section('style_search_bar', [
            'label' => __('🔍 نوار جستجو','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_control('toolbar_heading', [
            'label' => __('— کادر کلی جستجو و فیلتر','markil-modules'),
            'type'  => Controls_Manager::HEADING,
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'toolbar_bg',
            'selector' => '{{WRAPPER}} .markil-toolbar',
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'toolbar_border',
            'selector' => '{{WRAPPER}} .markil-toolbar',
        ]);
        $this->add_responsive_control('toolbar_radius', [
            'label'      => __('گردی کادر ابزارها','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-toolbar' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('toolbar_padding', [
            'label'      => __('فاصله داخلی کادر ابزارها','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors'  => ['{{WRAPPER}} .markil-toolbar' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('toolbar_gap', [
            'label' => __('فاصله بین جستجو و فیلترها','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px'],
            'range' => ['px'=>['min'=>0,'max'=>60]],
            'selectors' => ['{{WRAPPER}} .markil-toolbar, {{WRAPPER}} .markil-toolbar-actions' => 'gap: {{SIZE}}{{UNIT}};'],
        ]);
        $this->add_control('search_heading', [
            'label' => __('— فیلد جستجو','markil-modules'),
            'type'  => Controls_Manager::HEADING,
            'separator' => 'before',
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'search_bg',
            'selector' => '{{WRAPPER}} .markil-search-input',
        ]);
        $this->add_control('search_text_color', [
            'label'     => __('رنگ متن','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-search-input' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('search_placeholder_color', [
            'label'     => __('رنگ placeholder','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-search-input::placeholder' => 'color: {{VALUE}};'],
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'search_border',
            'selector' => '{{WRAPPER}} .markil-search-input',
        ]);
        $this->add_responsive_control('search_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-search-input' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_group_control(Group_Control_Box_Shadow::get_type(), [
            'name'     => 'search_shadow',
            'selector' => '{{WRAPPER}} .markil-search-input',
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'search_typography',
            'selector' => '{{WRAPPER}} .markil-search-input',
        ]);
        $this->add_responsive_control('search_padding', [
            'label'      => __('فاصله داخلی','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors'  => ['{{WRAPPER}} .markil-search-input' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('search_height', [
            'label'      => __('ارتفاع فیلد جستجو','markil-modules'),
            'type'       => Controls_Manager::SLIDER,
            'size_units' => ['px'],
            'range'      => ['px'=>['min'=>30,'max'=>90]],
            'selectors'  => ['{{WRAPPER}} .markil-search-input' => 'min-height: {{SIZE}}{{UNIT}};'],
        ]);

        $this->add_control('toolbar_btn_heading', [
            'label' => __('— دکمه فیلتر، مرتب‌سازی و تغییر چیدمان','markil-modules'),
            'type'  => Controls_Manager::HEADING,
            'separator' => 'before',
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'toolbar_btn_typography',
            'selector' => '{{WRAPPER}} .markil-filter-toggle-btn, {{WRAPPER}} .markil-sort-select, {{WRAPPER}} .markil-layout-select, {{WRAPPER}} .markil-layout-btn',
        ]);
        $this->add_control('toolbar_btn_color', [
            'label' => __('رنگ متن دکمه‌ها','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-filter-toggle-btn, {{WRAPPER}} .markil-sort-select, {{WRAPPER}} .markil-layout-select, {{WRAPPER}} .markil-layout-btn' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('toolbar_btn_bg', [
            'label' => __('پس‌زمینه دکمه‌ها','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-filter-toggle-btn, {{WRAPPER}} .markil-sort-select, {{WRAPPER}} .markil-layout-select, {{WRAPPER}} .markil-layout-switcher, {{WRAPPER}} .markil-layout-btn' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_control('toolbar_btn_hover_color', [
            'label' => __('رنگ متن هاور/فعال','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-filter-toggle-btn:hover, {{WRAPPER}} .markil-filter-toggle-btn.active, {{WRAPPER}} .markil-layout-btn:hover, {{WRAPPER}} .markil-layout-btn.active' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('toolbar_btn_hover_bg', [
            'label' => __('پس‌زمینه هاور/فعال','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-filter-toggle-btn:hover, {{WRAPPER}} .markil-filter-toggle-btn.active, {{WRAPPER}} .markil-layout-btn:hover, {{WRAPPER}} .markil-layout-btn.active' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name' => 'toolbar_btn_border',
            'selector' => '{{WRAPPER}} .markil-filter-toggle-btn, {{WRAPPER}} .markil-sort-select, {{WRAPPER}} .markil-layout-select, {{WRAPPER}} .markil-layout-switcher, {{WRAPPER}} .markil-layout-btn',
        ]);
        $this->add_responsive_control('toolbar_btn_radius', [
            'label' => __('گردی دکمه‌ها','markil-modules'),
            'type' => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors' => ['{{WRAPPER}} .markil-filter-toggle-btn, {{WRAPPER}} .markil-sort-select, {{WRAPPER}} .markil-layout-select, {{WRAPPER}} .markil-layout-switcher, {{WRAPPER}} .markil-layout-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('toolbar_btn_padding', [
            'label' => __('فاصله داخلی دکمه‌ها','markil-modules'),
            'type' => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors' => ['{{WRAPPER}} .markil-filter-toggle-btn, {{WRAPPER}} .markil-sort-select, {{WRAPPER}} .markil-layout-select, {{WRAPPER}} .markil-layout-btn' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('toolbar_btn_height', [
            'label' => __('ارتفاع دکمه‌ها','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px'],
            'range' => ['px'=>['min'=>30,'max'=>90]],
            'selectors' => ['{{WRAPPER}} .markil-filter-toggle-btn, {{WRAPPER}} .markil-sort-select, {{WRAPPER}} .markil-layout-select, {{WRAPPER}} .markil-layout-switcher, {{WRAPPER}} .markil-layout-btn' => 'min-height: {{SIZE}}{{UNIT}};'],
        ]);
        $this->end_controls_section();
    }

    private function style_category_tabs() {
        $this->start_controls_section('style_cat_tabs', [
            'label' => __('📂 تب‌های دسته‌بندی','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'cat_tab_typography',
            'selector' => '{{WRAPPER}} .markil-cat-tab',
        ]);
        $this->add_control('cat_tab_color', [
            'label'     => __('رنگ متن','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-cat-tab' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('cat_tab_active_color', [
            'label'     => __('رنگ متن فعال','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-cat-tab.active' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('cat_tab_bg', [
            'label'     => __('پس‌زمینه','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-cat-tab' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_control('cat_tab_active_bg', [
            'label'     => __('پس‌زمینه فعال','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-cat-tab.active' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_control('cat_tabs_wrap_heading', [
            'label'     => __('کادر پشت دسته‌بندی‌ها','markil-modules'),
            'type'      => Controls_Manager::HEADING,
            'separator' => 'before',
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'cat_tabs_wrap_bg',
            'label'    => __('پس‌زمینه کادر دسته‌بندی‌ها','markil-modules'),
            'selector' => '{{WRAPPER}} .markil-category-tabs-wrap, {{WRAPPER}} .markil-category-tabs',
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'cat_tabs_wrap_border',
            'selector' => '{{WRAPPER}} .markil-category-tabs-wrap, {{WRAPPER}} .markil-category-tabs',
        ]);
        $this->add_responsive_control('cat_tabs_wrap_radius', [
            'label'      => __('گردی کادر دسته‌بندی‌ها','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-category-tabs-wrap, {{WRAPPER}} .markil-category-tabs' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('cat_tabs_wrap_padding', [
            'label'      => __('فاصله داخلی کادر دسته‌بندی‌ها','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors'  => ['{{WRAPPER}} .markil-category-tabs-wrap, {{WRAPPER}} .markil-category-tabs' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'cat_tab_border',
            'selector' => '{{WRAPPER}} .markil-cat-tab',
        ]);
        $this->add_responsive_control('cat_tab_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-cat-tab' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('cat_tab_padding', [
            'label'      => __('فاصله داخلی','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors'  => ['{{WRAPPER}} .markil-cat-tab' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->end_controls_section();
    }


    private function style_filter_panel() {
        $this->start_controls_section('style_filter_panel_box', [
            'label' => __('🧰 پنل فیلترها','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'filter_panel_bg',
            'selector' => '{{WRAPPER}} .markil-filter-panel',
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'filter_panel_border',
            'selector' => '{{WRAPPER}} .markil-filter-panel',
        ]);
        $this->add_group_control(Group_Control_Box_Shadow::get_type(), [
            'name'     => 'filter_panel_shadow',
            'selector' => '{{WRAPPER}} .markil-filter-panel',
        ]);
        $this->add_responsive_control('filter_panel_radius', [
            'label' => __('گردی پنل','markil-modules'),
            'type' => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors' => ['{{WRAPPER}} .markil-filter-panel' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('filter_panel_padding', [
            'label' => __('فاصله داخلی پنل','markil-modules'),
            'type' => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors' => ['{{WRAPPER}} .markil-filter-panel' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('filter_panel_gap', [
            'label' => __('فاصله آیتم‌های فیلتر','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px'],
            'range' => ['px'=>['min'=>0,'max'=>60]],
            'selectors' => ['{{WRAPPER}} .markil-filter-inner' => 'gap: {{SIZE}}{{UNIT}};'],
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'filter_heading_typography',
            'label'    => __('تایپوگرافی عنوان فیلتر','markil-modules'),
            'selector' => '{{WRAPPER}} .markil-filter-group h4',
        ]);
        $this->add_control('filter_heading_color', [
            'label' => __('رنگ عنوان فیلتر','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-filter-group h4' => 'color: {{VALUE}};'],
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'filter_text_typography',
            'label'    => __('تایپوگرافی متن فیلتر','markil-modules'),
            'selector' => '{{WRAPPER}} .markil-filter-group label, {{WRAPPER}} .markil-tag-chip, {{WRAPPER}} .markil-price-range input',
        ]);
        $this->add_control('filter_text_color', [
            'label' => __('رنگ متن فیلتر','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-filter-group label, {{WRAPPER}} .markil-tag-chip, {{WRAPPER}} .markil-price-range input' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('filter_chip_bg', [
            'label' => __('پس‌زمینه برچسب‌های فیلتر','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-tag-chip' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_control('filter_chip_active_bg', [
            'label' => __('پس‌زمینه برچسب فعال','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-tag-chip.active' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_responsive_control('filter_chip_radius', [
            'label' => __('گردی برچسب فیلتر','markil-modules'),
            'type' => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors' => ['{{WRAPPER}} .markil-tag-chip' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->end_controls_section();
    }

    private function style_card() {
        $this->start_controls_section('style_card', [
            'label' => __('🃏 کارت ماژول','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'card_bg',
            'selector' => '{{WRAPPER}} .markil-module-card',
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'card_bg_hover',
            'label'    => __('پس‌زمینه هاور','markil-modules'),
            'selector' => '{{WRAPPER}} .markil-module-card:hover',
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'card_border',
            'selector' => '{{WRAPPER}} .markil-module-card',
        ]);
        $this->add_control('card_border_hover_color', [
            'label'     => __('رنگ بوردر هاور','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'default' => '#2ec4b6',
            'selectors' => ['{{WRAPPER}} .markil-module-card:hover' => 'border-color: {{VALUE}} !important; --markil-card-hover-color: {{VALUE}};'],
        ]);
        $this->add_control('card_active_border_color', [
            'label'     => __('رنگ بوردر انتخاب شده','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'default' => '#2ec4b6',
            'selectors' => ['{{WRAPPER}} .markil-module-card.active' => 'border-color: {{VALUE}} !important; --markil-card-hover-color: {{VALUE}};'],
        ]);
        $this->add_control('card_active_bg_color', [
            'label'     => __('رنگ پس‌زمینه کارت انتخاب‌شده','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-module-card.active' => 'background-color: {{VALUE}} !important;'],
        ]);
        $this->add_control('card_active_indicator_color', [
            'label'     => __('رنگ خط/نوار کارت انتخاب‌شده','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'default'   => '#2ec4b6',
            'selectors' => ['{{WRAPPER}} .markil-module-card.active::before' => 'background-color: {{VALUE}} !important;'],
        ]);
        $this->add_responsive_control('card_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'default'    => ['top'=>'16','right'=>'16','bottom'=>'16','left'=>'16','unit'=>'px'],
            'selectors'  => ['{{WRAPPER}} .markil-module-card' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_group_control(Group_Control_Box_Shadow::get_type(), [
            'name'     => 'card_shadow',
            'selector' => '{{WRAPPER}} .markil-module-card',
        ]);
        $this->add_group_control(Group_Control_Box_Shadow::get_type(), [
            'name'     => 'card_shadow_hover',
            'label'    => __('سایه هاور','markil-modules'),
            'selector' => '{{WRAPPER}} .markil-module-card:hover',
        ]);
        $this->add_responsive_control('card_padding', [
            'label'      => __('فاصله داخلی','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'default'    => ['top'=>'20','right'=>'20','bottom'=>'20','left'=>'20','unit'=>'px'],
            'selectors'  => ['{{WRAPPER}} .markil-module-card' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_control('card_transition', [
            'label'     => __('سرعت ترانزیشن (ثانیه)','markil-modules'),
            'type'      => Controls_Manager::SLIDER,
            'range'     => ['px'=>['min'=>0,'max'=>2,'step'=>0.1]],
            'default'   => ['size'=>0.3],
            'selectors' => ['{{WRAPPER}} .markil-module-card' => 'transition: all {{SIZE}}s ease;'],
        ]);
        $this->end_controls_section();
    }

    private function style_card_image() {
        $this->start_controls_section('style_card_image', [
            'label' => __('🖼️ تصویر/آیکون کارت','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_responsive_control('image_width', [
            'label'      => __('عرض تصویر','markil-modules'),
            'type'       => Controls_Manager::SLIDER,
            'size_units' => ['px','%'],
            'range'      => ['px'=>['min'=>30,'max'=>500],'%'=>['min'=>10,'max'=>100]],
            'default'    => ['unit'=>'%','size'=>100],
            'selectors'  => [
                '{{WRAPPER}} .markil-card-image' => 'width: {{SIZE}}{{UNIT}};',
            ],
        ]);
        $this->add_responsive_control('image_height', [
            'label'      => __('ارتفاع تصویر','markil-modules'),
            'type'       => Controls_Manager::SLIDER,
            'size_units' => ['px','rem','vw'],
            'range'      => ['px'=>['min'=>40,'max'=>420],'rem'=>['min'=>3,'max'=>26],'vw'=>['min'=>5,'max'=>50]],
            'default'    => ['unit'=>'px','size'=>112],
            'selectors'  => [
                '{{WRAPPER}} .markil-card-image' => 'height: {{SIZE}}{{UNIT}};',
            ],
        ]);
        $this->add_control('image_object_fit', [
            'label'   => __('نحوه نمایش تصویر','markil-modules'),
            'type'    => Controls_Manager::SELECT,
            'options' => [
                'cover'   => __('پر کردن کادر','markil-modules'),
                'contain' => __('نمایش کامل تصویر','markil-modules'),
                'fill'    => __('کشیده شود','markil-modules'),
            ],
            'default' => 'cover',
            'selectors' => ['{{WRAPPER}} .markil-card-image img' => 'object-fit: {{VALUE}};'],
        ]);
        $this->add_responsive_control('image_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-card-image' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'image_border',
            'selector' => '{{WRAPPER}} .markil-card-image',
        ]);
        $this->add_group_control(Group_Control_Box_Shadow::get_type(), [
            'name'     => 'image_shadow',
            'selector' => '{{WRAPPER}} .markil-card-image',
        ]);
        $this->end_controls_section();
    }

    private function style_card_title() {
        $this->start_controls_section('style_card_title', [
            'label' => __('📝 عنوان کارت','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'title_typography',
            'selector' => '{{WRAPPER}} .markil-card-title',
        ]);
        $this->add_control('title_color', [
            'label'     => __('رنگ','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-card-title' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('title_hover_color', [
            'label'     => __('رنگ هاور','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-module-card:hover .markil-card-title' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('title_tag', [
            'label'   => __('تگ HTML','markil-modules'),
            'type'    => Controls_Manager::SELECT,
            'options' => ['h2'=>'H2','h3'=>'H3','h4'=>'H4','p'=>'P','span'=>'SPAN'],
            'default' => 'h3',
        ]);
        $this->add_responsive_control('title_align', [
            'label'     => __('تراز','markil-modules'),
            'type'      => Controls_Manager::CHOOSE,
            'options'   => [
                'right'  => ['title'=>'راست','icon'=>'eicon-text-align-right'],
                'center' => ['title'=>'وسط','icon'=>'eicon-text-align-center'],
                'left'   => ['title'=>'چپ','icon'=>'eicon-text-align-left'],
                'justify'=> ['title'=>'جاستیفای','icon'=>'eicon-text-align-justify'],
            ],
            'selectors' => ['{{WRAPPER}} .markil-card-title' => 'text-align: {{VALUE}};'],
        ]);
        $this->add_responsive_control('title_margin', [
            'label'      => __('فاصله خارجی','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors'  => ['{{WRAPPER}} .markil-card-title' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->end_controls_section();
    }

    private function style_card_excerpt() {
        $this->start_controls_section('style_card_excerpt', [
            'label' => __('📄 توضیح کوتاه','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'excerpt_typography',
            'selector' => '{{WRAPPER}} .markil-card-excerpt',
        ]);
        $this->add_control('excerpt_color', [
            'label'     => __('رنگ','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-card-excerpt' => 'color: {{VALUE}};'],
        ]);
        $this->add_responsive_control('excerpt_align', [
            'label'     => __('تراز','markil-modules'),
            'type'      => Controls_Manager::CHOOSE,
            'options'   => [
                'right'  => ['title'=>'راست','icon'=>'eicon-text-align-right'],
                'center' => ['title'=>'وسط','icon'=>'eicon-text-align-center'],
                'left'   => ['title'=>'چپ','icon'=>'eicon-text-align-left'],
                'justify'=> ['title'=>'جاستیفای','icon'=>'eicon-text-align-justify'],
            ],
            'selectors' => ['{{WRAPPER}} .markil-card-excerpt' => 'text-align: {{VALUE}};'],
        ]);
        $this->add_control('excerpt_lines', [
            'label'     => __('تعداد خطوط (برش متن)','markil-modules'),
            'type'      => Controls_Manager::NUMBER,
            'default'   => 2,
            'min'       => 1,
            'max'       => 10,
            'selectors' => [
                '{{WRAPPER}} .markil-card-excerpt' => '-webkit-line-clamp: {{VALUE}}; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;',
            ],
        ]);
        $this->end_controls_section();
    }

    private function style_card_price() {
        $this->start_controls_section('style_card_price', [
            'label' => __('💰 قیمت','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'price_typography',
            'selector' => '{{WRAPPER}} .markil-card-price',
        ]);
        $this->add_control('price_color', [
            'label'     => __('رنگ قیمت','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-card-price' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('price_free_color', [
            'label'     => __('رنگ "رایگان"','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-card-price.free' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('price_old_color', [
            'label'     => __('رنگ قیمت قدیمی','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-old-price' => 'color: {{VALUE}};'],
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'price_bg',
            'selector' => '{{WRAPPER}} .markil-card-price',
        ]);
        $this->add_responsive_control('price_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-card-price' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('price_padding', [
            'label'      => __('فاصله داخلی','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors'  => ['{{WRAPPER}} .markil-card-price' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->end_controls_section();
    }

    private function style_card_rating() {
        $this->start_controls_section('style_card_rating', [
            'label' => __('⭐ امتیاز','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_control('star_color', [
            'label'     => __('رنگ ستاره','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'default'   => '#f59e0b',
            'selectors' => ['{{WRAPPER}} .markil-star' => 'color: {{VALUE}};'],
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'rating_typography',
            'selector' => '{{WRAPPER}} .markil-rating',
        ]);
        $this->add_control('rating_color', [
            'label'     => __('رنگ متن امتیاز','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-rating' => 'color: {{VALUE}};'],
        ]);
        $this->end_controls_section();
    }

    private function style_card_badge() {
        $this->start_controls_section('style_card_badge', [
            'label' => __('🏷️ برچسب','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'badge_typography',
            'selector' => '{{WRAPPER}} .markil-badge',
        ]);
        $this->add_control('badge_color', [
            'label'     => __('رنگ متن','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-badge' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('badge_bg', [
            'label'     => __('رنگ پس‌زمینه','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-badge' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_responsive_control('badge_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-badge' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('badge_padding', [
            'label'      => __('فاصله داخلی','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors'  => ['{{WRAPPER}} .markil-badge' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_control('badge_position_heading', [
            'label' => __('— موقعیت برچسب روی تصویر','markil-modules'),
            'type' => Controls_Manager::HEADING,
            'separator' => 'before',
        ]);
        $this->add_responsive_control('badge_top', [
            'label' => __('فاصله برچسب از بالا','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px','%'],
            'range' => ['px'=>['min'=>-60,'max'=>120],'%'=>['min'=>-30,'max'=>100]],
            'selectors' => ['{{WRAPPER}} .markil-card-badges' => 'top: {{SIZE}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('badge_right', [
            'label' => __('فاصله برچسب از راست','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px','%'],
            'range' => ['px'=>['min'=>-60,'max'=>120],'%'=>['min'=>-30,'max'=>100]],
            'selectors' => ['{{WRAPPER}} .markil-card-badges' => 'right: {{SIZE}}{{UNIT}};'],
        ]);
        $this->add_control('wishlist_position_heading', [
            'label' => __('— موقعیت قلب روی تصویر','markil-modules'),
            'type' => Controls_Manager::HEADING,
            'separator' => 'before',
        ]);
        $this->add_responsive_control('wishlist_top', [
            'label' => __('فاصله قلب از بالا','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px','%'],
            'range' => ['px'=>['min'=>-60,'max'=>120],'%'=>['min'=>-30,'max'=>100]],
            'selectors' => ['{{WRAPPER}} .markil-card-actions' => 'top: {{SIZE}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('wishlist_left', [
            'label' => __('فاصله قلب از چپ','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px','%'],
            'range' => ['px'=>['min'=>-60,'max'=>120],'%'=>['min'=>-30,'max'=>100]],
            'selectors' => ['{{WRAPPER}} .markil-card-actions' => 'left: {{SIZE}}{{UNIT}};'],
        ]);
        $this->end_controls_section();
    }

    private function style_detail_panel() {
        $this->start_controls_section('style_detail_panel', [
            'label' => __('📋 پنل جزئیات','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'panel_bg',
            'selector' => '{{WRAPPER}} .markil-detail-panel',
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'panel_border',
            'selector' => '{{WRAPPER}} .markil-detail-panel',
        ]);
        $this->add_responsive_control('panel_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-detail-panel' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_group_control(Group_Control_Box_Shadow::get_type(), [
            'name'     => 'panel_shadow',
            'selector' => '{{WRAPPER}} .markil-detail-panel',
        ]);
        $this->add_responsive_control('panel_padding', [
            'label'      => __('فاصله داخلی خود پنل','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors'  => ['{{WRAPPER}} .markil-detail-panel' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('panel_inner_padding', [
            'label'      => __('فاصله داخلی محتوای پنل','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'default'    => ['top'=>'18','right'=>'18','bottom'=>'18','left'=>'18','unit'=>'px'],
            'selectors'  => ['{{WRAPPER}} .markil-panel-inner, {{WRAPPER}} .markil-panel-content' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('panel_blocks_gap', [
            'label' => __('فاصله بین بخش‌های پنل','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px'],
            'range' => ['px'=>['min'=>0,'max'=>60]],
            'selectors' => [
                '{{WRAPPER}} .markil-detail-hero' => 'margin-bottom: {{SIZE}}{{UNIT}};',
                '{{WRAPPER}} .markil-panel-tabs' => 'margin-top: {{SIZE}}{{UNIT}}; margin-bottom: {{SIZE}}{{UNIT}};',
                '{{WRAPPER}} .markil-panel-actions' => 'margin-top: {{SIZE}}{{UNIT}};',
            ],
        ]);

        // Panel Title
        $this->add_control('panel_title_heading', [
            'label'     => __('— عنوان پنل','markil-modules'),
            'type'      => Controls_Manager::HEADING,
            'separator' => 'before',
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'panel_title_typography',
            'selector' => '{{WRAPPER}} .markil-panel-title',
        ]);
        $this->add_control('panel_title_color', [
            'label'     => __('رنگ عنوان','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-panel-title' => 'color: {{VALUE}};'],
        ]);
        $this->add_responsive_control('panel_title_align', [
            'label'     => __('تراز عنوان','markil-modules'),
            'type'      => Controls_Manager::CHOOSE,
            'options'   => [
                'right'=>['title'=>'راست','icon'=>'eicon-text-align-right'],
                'center'=>['title'=>'وسط','icon'=>'eicon-text-align-center'],
                'left'=>['title'=>'چپ','icon'=>'eicon-text-align-left'],
            ],
            'selectors' => ['{{WRAPPER}} .markil-panel-title' => 'text-align: {{VALUE}};'],
        ]);

        $this->add_control('panel_text_heading', [
            'label'     => __('— متن توضیحات پنل و اسلاید','markil-modules'),
            'type'      => Controls_Manager::HEADING,
            'separator' => 'before',
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'panel_desc_typography',
            'selector' => '{{WRAPPER}} .markil-detail-excerpt, {{WRAPPER}} .markil-panel-empty p, {{WRAPPER}} .markil-tab-body',
        ]);
        $this->add_control('panel_desc_color', [
            'label'     => __('رنگ متن توضیحات','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-detail-excerpt, {{WRAPPER}} .markil-panel-empty p, {{WRAPPER}} .markil-tab-body' => 'color: {{VALUE}};'],
        ]);
        $this->add_responsive_control('panel_desc_align', [
            'label'     => __('تراز متن توضیحات','markil-modules'),
            'type'      => Controls_Manager::CHOOSE,
            'options'   => [
                'right'=>['title'=>'راست','icon'=>'eicon-text-align-right'],
                'center'=>['title'=>'وسط','icon'=>'eicon-text-align-center'],
                'left'=>['title'=>'چپ','icon'=>'eicon-text-align-left'],
                'justify'=>['title'=>'جاستیفای','icon'=>'eicon-text-align-justify'],
            ],
            'selectors' => ['{{WRAPPER}} .markil-detail-excerpt, {{WRAPPER}} .markil-panel-empty p, {{WRAPPER}} .markil-tab-body' => 'text-align: {{VALUE}};'],
        ]);

        $this->add_control('panel_meta_heading', [
            'label'     => __('— نصب فعال، ورژن و شماره ستاره','markil-modules'),
            'type'      => Controls_Manager::HEADING,
            'separator' => 'before',
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'panel_meta_typography',
            'selector' => '{{WRAPPER}} .markil-detail-stats, {{WRAPPER}} .markil-detail-stats .markil-stat, {{WRAPPER}} .markil-detail-stats .markil-stat-rating, {{WRAPPER}} .markil-detail-stats .markil-stat-installs, {{WRAPPER}} .markil-detail-stats .markil-stat-version',
        ]);
        $this->add_control('panel_meta_color', [
            'label'     => __('رنگ متن آمار پنل','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'default'   => '#011627',
            'selectors' => ['{{WRAPPER}} .markil-detail-stats, {{WRAPPER}} .markil-detail-stats .markil-stat' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('panel_meta_icon_color', [
            'label'     => __('رنگ آیکون/ستاره آمار پنل','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'default'   => '#2ec4b6',
            'selectors' => ['{{WRAPPER}} .markil-detail-stats .markil-star, {{WRAPPER}} .markil-detail-stats svg, {{WRAPPER}} .markil-detail-stats i' => 'color: {{VALUE}}; fill: {{VALUE}};'],
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'panel_price_typography',
            'label'    => __('تایپوگرافی قیمت پنل','markil-modules'),
            'selector' => '{{WRAPPER}} .markil-panel-price, {{WRAPPER}} .markil-idle-price, {{WRAPPER}} .markil-idle-price .markil-card-price',
        ]);
        $this->add_control('panel_price_color', [
            'label'     => __('رنگ قیمت پنل','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'default'   => '#011627',
            'selectors' => ['{{WRAPPER}} .markil-panel-price, {{WRAPPER}} .markil-idle-price, {{WRAPPER}} .markil-idle-price .markil-card-price' => 'color: {{VALUE}};'],
        ]);
        $this->end_controls_section();
    }

    private function style_tabs() {
        $this->start_controls_section('style_tabs', [
            'label' => __('📑 تب‌های پنل','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);

        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'panel_tabs_wrap_bg',
            'label'    => __('پس‌زمینه کادر تب‌ها','markil-modules'),
            'selector' => '{{WRAPPER}} .markil-panel-tabs-nav',
        ]);
        $this->add_responsive_control('panel_tabs_wrap_padding', [
            'label' => __('فاصله داخلی کادر تب‌ها','markil-modules'),
            'type' => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors' => ['{{WRAPPER}} .markil-panel-tabs-nav' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('panel_tabs_gap', [
            'label' => __('فاصله بین دکمه‌های تب','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px'],
            'range' => ['px'=>['min'=>0,'max'=>30]],
            'selectors' => ['{{WRAPPER}} .markil-panel-tabs-nav' => 'gap: {{SIZE}}{{UNIT}};'],
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'tab_typography',
            'selector' => '{{WRAPPER}} .markil-panel-tab-btn',
        ]);
        $this->add_control('tab_color', [
            'label'     => __('رنگ متن تب','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-panel-tab-btn' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('tab_active_color', [
            'label'     => __('رنگ متن تب فعال','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-panel-tab-btn.active' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('tab_active_border_color', [
            'label'     => __('رنگ خط/بوردر تب فعال','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-panel-tab-btn.active' => 'border-color: {{VALUE}};'],
        ]);
        $this->add_control('tab_bg', [
            'label' => __('پس‌زمینه تب','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-panel-tab-btn' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_control('tab_hover_bg', [
            'label' => __('پس‌زمینه هاور تب','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-panel-tab-btn:hover' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_control('tab_active_bg', [
            'label' => __('پس‌زمینه تب فعال','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-panel-tab-btn.active' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name' => 'panel_tab_border',
            'selector' => '{{WRAPPER}} .markil-panel-tab-btn',
        ]);
        $this->add_responsive_control('panel_tab_radius', [
            'label' => __('گردی دکمه تب','markil-modules'),
            'type' => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors' => ['{{WRAPPER}} .markil-panel-tab-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('panel_tab_padding', [
            'label' => __('فاصله داخلی دکمه تب','markil-modules'),
            'type' => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors' => ['{{WRAPPER}} .markil-panel-tab-btn' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('panel_tab_height', [
            'label' => __('ارتفاع دکمه تب','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px'],
            'range' => ['px'=>['min'=>26,'max'=>80]],
            'selectors' => ['{{WRAPPER}} .markil-panel-tab-btn' => 'min-height: {{SIZE}}{{UNIT}};'],
        ]);
        $this->add_group_control(Group_Control_Box_Shadow::get_type(), [
            'name' => 'panel_tab_active_shadow',
            'label' => __('سایه تب فعال','markil-modules'),
            'selector' => '{{WRAPPER}} .markil-panel-tab-btn.active',
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'tab_content_typography',
            'label'    => __('تایپوگرافی محتوای تب','markil-modules'),
            'selector' => '{{WRAPPER}} .markil-panel-tab-content',
        ]);
        $this->add_control('tab_content_color', [
            'label'     => __('رنگ محتوای تب','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-panel-tab-content' => 'color: {{VALUE}};'],
        ]);
        $this->end_controls_section();
    }

    private function style_buttons() {
        // Primary Button
        $this->start_controls_section('style_btn_primary', [
            'label' => __('🛒 دکمه اصلی','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'btn_primary_typography',
            'selector' => '{{WRAPPER}} .markil-btn-primary',
        ]);
        $this->add_control('btn_primary_color', [
            'label'     => __('رنگ متن','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-btn-primary' => 'color: {{VALUE}};'],
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'btn_primary_bg',
            'selector' => '{{WRAPPER}} .markil-btn-primary',
        ]);
        $this->add_control('btn_primary_hover_color', [
            'label'     => __('رنگ متن هاور','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-btn-primary:hover' => 'color: {{VALUE}};'],
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'btn_primary_hover_bg',
            'label'    => __('پس‌زمینه هاور','markil-modules'),
            'selector' => '{{WRAPPER}} .markil-btn-primary:hover',
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'btn_primary_border',
            'selector' => '{{WRAPPER}} .markil-btn-primary',
        ]);
        $this->add_responsive_control('btn_primary_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-btn-primary' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_group_control(Group_Control_Box_Shadow::get_type(), [
            'name'     => 'btn_primary_shadow',
            'selector' => '{{WRAPPER}} .markil-btn-primary',
        ]);
        $this->add_responsive_control('btn_primary_padding', [
            'label'      => __('فاصله داخلی','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors'  => ['{{WRAPPER}} .markil-btn-primary' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('btn_primary_width', [
            'label'      => __('عرض','markil-modules'),
            'type'       => Controls_Manager::SLIDER,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-btn-primary' => 'width: {{SIZE}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('panel_actions_gap', [
            'label' => __('فاصله بین دکمه‌های پنل','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px'],
            'range' => ['px'=>['min'=>0,'max'=>40]],
            'selectors' => ['{{WRAPPER}} .markil-panel-actions' => 'gap: {{SIZE}}{{UNIT}};'],
        ]);
        $this->end_controls_section();

        // Secondary Button
        $this->start_controls_section('style_btn_secondary', [
            'label' => __('📖 دکمه ثانویه','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'btn_secondary_typography',
            'selector' => '{{WRAPPER}} .markil-btn-secondary',
        ]);
        $this->add_control('btn_secondary_color', [
            'label'     => __('رنگ متن','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-btn-secondary' => 'color: {{VALUE}};'],
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'btn_secondary_bg',
            'selector' => '{{WRAPPER}} .markil-btn-secondary',
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'btn_secondary_border',
            'selector' => '{{WRAPPER}} .markil-btn-secondary',
        ]);
        $this->add_responsive_control('btn_secondary_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-btn-secondary' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('btn_secondary_padding', [
            'label'      => __('فاصله داخلی','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors'  => ['{{WRAPPER}} .markil-btn-secondary' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->end_controls_section();
    }

    private function style_pagination() {
        $this->start_controls_section('style_pagination', [
            'label' => __('📄 صفحه‌بندی','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'pagination_typography',
            'selector' => '{{WRAPPER}} .markil-page-btn',
        ]);
        $this->add_control('pagination_color', [
            'label'     => __('رنگ متن','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-page-btn' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('pagination_bg', [
            'label'     => __('پس‌زمینه','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-page-btn' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_control('pagination_active_color', [
            'label'     => __('رنگ متن فعال','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-page-btn.active' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('pagination_active_bg', [
            'label'     => __('پس‌زمینه فعال','markil-modules'),
            'type'      => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-page-btn.active' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'pagination_border',
            'selector' => '{{WRAPPER}} .markil-page-btn',
        ]);
        $this->add_responsive_control('pagination_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-page-btn' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->end_controls_section();
    }


    private function style_loading() {
        $this->start_controls_section('style_loading', [
            'label' => __('⏳ لودینگ','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Typography::get_type(), [
            'name'     => 'loading_typography',
            'selector' => '{{WRAPPER}} .markil-loading, {{WRAPPER}} .markil-panel-loading',
        ]);
        $this->add_control('loading_text_color', [
            'label' => __('رنگ متن لودینگ','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-loading, {{WRAPPER}} .markil-panel-loading' => 'color: {{VALUE}};'],
        ]);
        $this->add_control('loading_spinner_color', [
            'label' => __('رنگ حلقه لودینگ','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'default' => '#2ec4b6',
            'selectors' => ['{{WRAPPER}} .markil-spinner' => 'border-top-color: {{VALUE}}; border-right-color: {{VALUE}};'],
        ]);
        $this->add_control('loading_bg', [
            'label' => __('پس‌زمینه لودینگ','markil-modules'),
            'type' => Controls_Manager::COLOR,
            'selectors' => ['{{WRAPPER}} .markil-loading, {{WRAPPER}} .markil-panel-loading' => 'background-color: {{VALUE}};'],
        ]);
        $this->add_responsive_control('loading_spinner_size', [
            'label' => __('اندازه آیکون لودینگ','markil-modules'),
            'type' => Controls_Manager::SLIDER,
            'size_units' => ['px'],
            'range' => ['px'=>['min'=>16,'max'=>96]],
            'selectors' => ['{{WRAPPER}} .markil-spinner' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};'],
        ]);
        $this->add_responsive_control('loading_radius', [
            'label' => __('گردی کادر لودینگ','markil-modules'),
            'type' => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors' => ['{{WRAPPER}} .markil-loading, {{WRAPPER}} .markil-panel-loading' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->end_controls_section();
    }

    private function render_icon_html($settings, $key, $fallback = '') {
        ob_start();
        if (!empty($settings[$key]['value'])) {
            Icons_Manager::render_icon($settings[$key], ['aria-hidden' => 'true']);
        } else {
            echo esc_html($fallback);
        }
        return trim(ob_get_clean());
    }

    // ===== RENDER =====
    protected function render() {
        $settings = $this->get_settings_for_display();
        $categories = get_terms(['taxonomy'=>'markil_category','hide_empty'=>true]);
        $tags = get_terms(['taxonomy'=>'markil_tag','hide_empty'=>true]);
        $currency = get_option('markil_currency','تومان');
        $primary_color = get_option('markil_primary_color','#011627');
        $icons = [
            'search'       => $this->render_icon_html($settings, 'icon_search', '🔍'),
            'all_category' => $this->render_icon_html($settings, 'icon_all_category', '🏠'),
            'placeholder'  => $this->render_icon_html($settings, 'icon_placeholder', '📦'),
            'empty_panel'  => $this->render_icon_html($settings, 'icon_empty_panel', '🏪'),
            'wishlist'     => $this->render_icon_html($settings, 'icon_wishlist', '♡'),
            'wishlist_on'  => $this->render_icon_html($settings, 'icon_wishlist_on', '♥'),
            'rating'       => $this->render_icon_html($settings, 'icon_rating', '★'),
            'installs'     => $this->render_icon_html($settings, 'icon_installs', '👥'),
            'version'      => $this->render_icon_html($settings, 'icon_version', '📦'),
            'filter'       => $this->render_icon_html($settings, 'icon_filter', '⚙'),
            'close'        => $this->render_icon_html($settings, 'icon_close', '×'),
        ];
        $layout = $settings['default_layout'] ?? 'grid';
        $initial_category = $settings['category'] ?? '';
        // در خروجی از term_id استفاده می‌کنیم تا دسته‌بندی‌های فارسی/چندگانه بدون خطا فیلتر شوند.
        $initial_category = $initial_category !== '' ? (string) absint( $initial_category ) : '';
        ?>
        <?php
        $wrapper_classes = ['markil-modules-wrapper'];
        $wrapper_classes[] = 'markil-mobile-cats-' . sanitize_html_class($settings['mobile_category_mode'] ?? 'hamburger');
        if (($settings['mobile_hide_search'] ?? '') === 'yes')  $wrapper_classes[] = 'markil-mobile-hide-search';
        if (($settings['mobile_hide_filters'] ?? '') === 'yes') $wrapper_classes[] = 'markil-mobile-hide-filters';
        if (($settings['mobile_hide_sort'] ?? '') === 'yes')    $wrapper_classes[] = 'markil-mobile-hide-sort';
        if (($settings['mobile_hide_layout'] ?? '') === 'yes')   $wrapper_classes[] = 'markil-mobile-hide-layout';
        ?>
        <div class="<?php echo esc_attr(implode(' ', $wrapper_classes)); ?>" dir="rtl" data-nonce="<?php echo wp_create_nonce('markil_modules_nonce'); ?>">
            <!-- Toolbar -->
            <div class="markil-toolbar <?php echo ($settings['toolbar_single_line'] ?? 'yes') === 'yes' ? 'markil-toolbar-single-line' : ''; ?>">
                <?php if($settings['show_search']==='yes'): ?>
                <div class="markil-search-wrap">
                    <span class="markil-search-icon"><?php echo $icons['search']; ?></span>
                    <input type="text" class="markil-search-input" placeholder="<?php echo esc_attr($settings['search_placeholder'] ?? __('جستجو در ماژول‌ها...','markil-modules')); ?>">
                </div>
                <?php endif; ?>

                <div class="markil-toolbar-actions">
                    <?php if(($settings['show_filters'] ?? '') === 'yes'): ?>
                    <button type="button" class="markil-filter-toggle-btn"><span class="markil-filter-icon"><?php echo $icons['filter']; ?></span><span><?php echo esc_html($settings['filters_label'] ?? __('فیلترها','markil-modules')); ?></span></button>
                    <?php endif; ?>
                    <?php if($settings['show_sort']==='yes'): ?>
                    <select class="markil-sort-select" aria-label="<?php esc_attr_e('مرتب‌سازی','markil-modules'); ?>">
                        <?php $current_orderby = $settings['orderby'] ?? 'newest'; ?>
                        <option value="popular" <?php selected($current_orderby, 'popular'); ?>><?php echo esc_html($settings['sort_popular_label'] ?? __('پربازدیدترین','markil-modules')); ?></option>
                        <option value="newest" <?php selected($current_orderby, 'newest'); ?>><?php echo esc_html($settings['sort_newest_label'] ?? __('جدیدترین','markil-modules')); ?></option>
                        <option value="rating" <?php selected($current_orderby, 'rating'); ?>><?php echo esc_html($settings['sort_rating_label'] ?? __('بهترین امتیاز','markil-modules')); ?></option>
                        <option value="price_low" <?php selected($current_orderby, 'price_low'); ?>><?php echo esc_html($settings['sort_price_low_label'] ?? __('ارزان‌ترین','markil-modules')); ?></option>
                        <option value="price_high" <?php selected($current_orderby, 'price_high'); ?>><?php echo esc_html($settings['sort_price_high_label'] ?? __('گران‌ترین','markil-modules')); ?></option>
                    </select>
                    <?php endif; ?>
                    <?php if($settings['show_layout_switcher']==='yes'): ?>
                    <select class="markil-layout-select" aria-label="<?php esc_attr_e('نوع نمایش','markil-modules'); ?>">
                        <option value="grid" <?php selected($layout, 'grid'); ?>><?php esc_html_e('نمای شبکه‌ای','markil-modules'); ?></option>
                        <option value="list" <?php selected($layout, 'list'); ?>><?php esc_html_e('نمای ردیفی','markil-modules'); ?></option>
                    </select>
                    <?php endif; ?>
                </div>
            </div>

            <?php if(($settings['show_filters'] ?? '') === 'yes'): ?>
            <div class="markil-filter-panel" style="display:none;">
                <div class="markil-filter-inner">
                    <?php if(($settings['show_price_filter'] ?? 'yes') === 'yes'): ?>
                    <div class="markil-filter-group markil-price-filter">
                        <h4><?php esc_html_e('محدوده قیمت','markil-modules'); ?></h4>
                        <div class="markil-price-range">
                            <input type="number" class="markil-min-price" placeholder="<?php esc_attr_e('از','markil-modules'); ?>">
                            <input type="number" class="markil-max-price" placeholder="<?php esc_attr_e('تا','markil-modules'); ?>">
                        </div>
                    </div>
                    <?php endif; ?>
                    <?php if(($settings['show_rating_filter'] ?? 'yes') === 'yes'): ?>
                    <div class="markil-filter-group markil-rating-filter">
                        <h4><?php esc_html_e('حداقل امتیاز','markil-modules'); ?></h4>
                        <?php foreach([5,4,3,2,1] as $r): ?>
                        <label><input type="radio" name="markil_min_rating_<?php echo esc_attr($this->get_id()); ?>" value="<?php echo esc_attr($r); ?>"> <?php echo esc_html($r); ?>+</label>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>
                    <?php if(($settings['show_tag_filter'] ?? 'yes') === 'yes' && !empty($tags) && !is_wp_error($tags)): ?>
                    <div class="markil-filter-group markil-tag-filter-wrap">
                        <h4><?php esc_html_e('برچسب‌ها','markil-modules'); ?></h4>
                        <div class="markil-tag-filter">
                            <?php foreach($tags as $tag): ?>
                            <button type="button" class="markil-tag-chip" data-tag="<?php echo esc_attr($tag->term_id); ?>"><?php echo esc_html($tag->name); ?></button>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endif; ?>
                    <?php if(($settings['show_free_filter'] ?? 'yes') === 'yes'): ?>
                    <div class="markil-filter-group markil-free-filter-wrap">
                        <h4><?php esc_html_e('نوع محصول','markil-modules'); ?></h4>
                        <label><input type="checkbox" class="markil-free-filter" value="1"> <?php esc_html_e('فقط رایگان‌ها','markil-modules'); ?></label>
                    </div>
                    <?php endif; ?>
                    <div class="markil-filter-actions">
                        <button type="button" class="markil-apply-filters"><?php esc_html_e('اعمال فیلتر','markil-modules'); ?></button>
                        <button type="button" class="markil-reset-filters"><?php esc_html_e('حذف فیلترها','markil-modules'); ?></button>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Category Tabs -->
            <?php if($settings['show_category_tabs']==='yes' && !empty($categories) && !is_wp_error($categories)): ?>
            <div class="markil-category-tabs-wrap">
                <button type="button" class="markil-mobile-category-toggle" aria-expanded="false">
                    <span class="markil-mobile-category-icon">☰</span>
                    <span><?php echo esc_html($settings['mobile_category_button_text'] ?? __('دسته‌بندی‌ها','markil-modules')); ?></span>
                </button>
                <div class="markil-category-tabs">
                    <button type="button" class="markil-cat-tab <?php echo $initial_category === '' ? 'active' : ''; ?>" data-category="all">
                        <?php echo $icons['all_category']; ?> <?php echo esc_html($settings['all_categories_label']??__('همه دسته‌ها','markil-modules')); ?>
                    </button>
                    <?php foreach($categories as $cat): ?>
                    <button type="button" class="markil-cat-tab <?php echo $initial_category === (string) $cat->term_id ? 'active' : ''; ?>" data-category="<?php echo esc_attr($cat->term_id); ?>">
                        <?php echo esc_html($cat->name); ?>
                    </button>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

            <!-- Results Bar -->
            <?php if($settings['show_results_count']==='yes'): ?>
            <div class="markil-results-bar">
                <span class="markil-results-count"></span>
                <span class="markil-results-label"><?php _e('ماژول','markil-modules'); ?></span>
            </div>
            <?php endif; ?>

            <!-- Main Content -->
            <div class="markil-main-content">
                <div class="markil-modules-area">
                    <!-- Grid/List -->
                    <div class="markil-modules-container markil-<?php echo esc_attr($layout); ?>" 
                         data-per-page="<?php echo intval($settings['posts_per_page']??12); ?>"
                         data-orderby="<?php echo esc_attr($settings['orderby']??'newest'); ?>"
                         data-category="<?php echo esc_attr($initial_category); ?>"
                         data-settings='<?php echo esc_attr(json_encode([
                             'show_image'   => $settings['show_image']??'yes',
                             'show_title'   => $settings['show_title']??'yes',
                             'show_excerpt' => $settings['show_excerpt']??'yes',
                             'show_price'   => $settings['show_price']??'yes',
                             'show_rating'  => $settings['show_rating']??'yes',
                             'show_installs'=> $settings['show_installs']??'yes',
                             'show_badge'   => $settings['show_badge']??'yes',
                             'show_wishlist'=> $settings['show_wishlist']??'yes',
                             'show_category_badge' => $settings['show_category_badge']??'yes',
                             'show_tag_badge' => $settings['show_tag_badge']??'yes',
                             'icons' => $icons,
                             'title_tag'    => $settings['title_tag']??'h3',
                             'currency'     => $currency,
                         ])); ?>'>
                        <div class="markil-loading">
                            <div class="markil-spinner"></div>
                            <span><?php _e('در حال بارگذاری...','markil-modules'); ?></span>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <?php if($settings['show_pagination']==='yes'): ?>
                    <div class="markil-pagination" 
                         data-type="<?php echo esc_attr($settings['pagination_type']??'numbers'); ?>"
                         data-load-more-text="<?php echo esc_attr($settings['load_more_text']??__('نمایش بیشتر','markil-modules')); ?>">
                    </div>
                    <?php endif; ?>
                </div>

                <!-- Detail Panel -->
                <?php if($settings['show_detail_panel']==='yes'): ?>
                <div class="markil-detail-panel markil-panel-idle"
                     data-position="<?php echo esc_attr($settings['panel_position']??'right'); ?>"
                     data-idle-slider="<?php echo esc_attr($settings['panel_idle_slider']??'yes'); ?>"
                     data-idle-interval="<?php echo intval($settings['panel_idle_interval']??4500); ?>"
                     data-idle-title="<?php echo esc_attr($settings['panel_idle_title']??__('ماژول‌های پیشنهادی','markil-modules')); ?>"
                     data-idle-description="<?php echo esc_attr($settings['panel_idle_description']??__('برای دیدن جزئیات، یک ماژول را انتخاب کنید.','markil-modules')); ?>"
                     data-icons='<?php echo esc_attr(wp_json_encode($icons)); ?>'>
                    <div class="markil-panel-inner">
                        <div class="markil-panel-empty">
                            <div class="markil-panel-empty-icon"><?php echo $icons['empty_panel']; ?></div>
                            <h3><?php echo esc_html($settings['panel_idle_title']??__('ماژول‌های پیشنهادی','markil-modules')); ?></h3>
                            <p><?php echo esc_html($settings['panel_idle_description']??__('برای دیدن جزئیات، یک ماژول را انتخاب کنید.','markil-modules')); ?></p>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <style>
        :root {
            --markil-primary: <?php echo esc_attr($primary_color); ?>;
            --markil-primary-light: <?php echo esc_attr($primary_color); ?>22;
        }
        </style>
        <?php
    }
}
