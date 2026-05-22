<?php
namespace Markil\Widget;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Group_Control_Background;

if ( ! defined( 'ABSPATH' ) ) exit;

class ModuleDetail extends Widget_Base {
    public function get_name()  { return 'markil_module_detail'; }
    public function get_title() { return __( '📋 جزئیات ماژول', 'markil-modules' ); }
    public function get_icon()  { return 'eicon-info-box'; }
    public function get_categories() { return [ 'markil' ]; }
    public function get_keywords() { return ['markil','module','detail','ماژول','جزئیات']; }

    protected function register_controls() {
        $this->start_controls_section('section_source', [
            'label' => __('منبع','markil-modules'),
        ]);

        $modules_query = new \WP_Query(['post_type'=>'markil_module','post_status'=>'publish','posts_per_page'=>-1,'fields'=>'ids']);
        $module_options = [0 => __('پست جاری','markil-modules')];
        if($modules_query->have_posts()) {
            foreach($modules_query->posts as $pid) {
                $module_options[$pid] = get_the_title($pid) . ' (#'.$pid.')';
            }
        }

        $this->add_control('module_id', [
            'label'   => __('ماژول','markil-modules'),
            'type'    => Controls_Manager::SELECT,
            'options' => $module_options,
            'default' => 0,
        ]);

        $this->add_control('show_header', ['label'=>__('هدر (تصویر + عنوان + آمار)','markil-modules'),'type'=>Controls_Manager::SWITCHER,'return_value'=>'yes','default'=>'yes']);
        $this->add_control('show_tabs',   ['label'=>__('تب‌های محتوا','markil-modules'),'type'=>Controls_Manager::SWITCHER,'return_value'=>'yes','default'=>'yes']);
        $this->add_control('show_features',['label'=>__('ویژگی‌های کلیدی','markil-modules'),'type'=>Controls_Manager::SWITCHER,'return_value'=>'yes','default'=>'yes']);
        $this->add_control('show_buttons',['label'=>__('دکمه‌ها','markil-modules'),'type'=>Controls_Manager::SWITCHER,'return_value'=>'yes','default'=>'yes']);
        $this->add_control('show_status', ['label'=>__('وضعیت ماژول','markil-modules'),'type'=>Controls_Manager::SWITCHER,'return_value'=>'yes','default'=>'yes']);

        $this->end_controls_section();

        // Style
        $this->start_controls_section('style_detail_wrap', [
            'label' => __('🎨 ظاهر کلی','markil-modules'),
            'tab'   => Controls_Manager::TAB_STYLE,
        ]);
        $this->add_group_control(Group_Control_Background::get_type(), [
            'name'     => 'detail_bg',
            'selector' => '{{WRAPPER}} .markil-standalone-detail',
        ]);
        $this->add_group_control(Group_Control_Border::get_type(), [
            'name'     => 'detail_border',
            'selector' => '{{WRAPPER}} .markil-standalone-detail',
        ]);
        $this->add_responsive_control('detail_border_radius', [
            'label'      => __('گوشه‌های گرد','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','%'],
            'selectors'  => ['{{WRAPPER}} .markil-standalone-detail' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);
        $this->add_group_control(Group_Control_Box_Shadow::get_type(), [
            'name'     => 'detail_shadow',
            'selector' => '{{WRAPPER}} .markil-standalone-detail',
        ]);
        $this->add_responsive_control('detail_padding', [
            'label'      => __('فاصله داخلی','markil-modules'),
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => ['px','em'],
            'selectors'  => ['{{WRAPPER}} .markil-standalone-detail' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
        ]);

        $this->add_control('detail_title_heading', ['label'=>__('عنوان','markil-modules'),'type'=>Controls_Manager::HEADING,'separator'=>'before']);
        $this->add_group_control(Group_Control_Typography::get_type(), ['name'=>'detail_title_typo','selector'=>'{{WRAPPER}} .markil-detail-module-title']);
        $this->add_control('detail_title_color', ['label'=>__('رنگ','markil-modules'),'type'=>Controls_Manager::COLOR,'selectors'=>['{{WRAPPER}} .markil-detail-module-title'=>'color: {{VALUE}};']]);
        $this->add_responsive_control('detail_title_align', ['label'=>__('تراز','markil-modules'),'type'=>Controls_Manager::CHOOSE,'options'=>['right'=>['title'=>'راست','icon'=>'eicon-text-align-right'],'center'=>['title'=>'وسط','icon'=>'eicon-text-align-center'],'left'=>['title'=>'چپ','icon'=>'eicon-text-align-left']],'selectors'=>['{{WRAPPER}} .markil-detail-module-title'=>'text-align: {{VALUE}};']]);

        $this->add_control('detail_btn_heading', ['label'=>__('دکمه‌ها','markil-modules'),'type'=>Controls_Manager::HEADING,'separator'=>'before']);
        $this->add_group_control(Group_Control_Typography::get_type(), ['name'=>'d_btn_p_typo','label'=>__('تایپوگرافی دکمه اصلی','markil-modules'),'selector'=>'{{WRAPPER}} .markil-standalone-detail .markil-btn-primary']);
        $this->add_control('d_btn_p_color', ['label'=>__('رنگ دکمه اصلی','markil-modules'),'type'=>Controls_Manager::COLOR,'selectors'=>['{{WRAPPER}} .markil-standalone-detail .markil-btn-primary'=>'color: {{VALUE}};']]);
        $this->add_control('d_btn_p_bg', ['label'=>__('پس‌زمینه دکمه اصلی','markil-modules'),'type'=>Controls_Manager::COLOR,'selectors'=>['{{WRAPPER}} .markil-standalone-detail .markil-btn-primary'=>'background-color: {{VALUE}};']]);
        $this->add_responsive_control('d_btn_p_radius', ['label'=>__('گوشه دکمه اصلی','markil-modules'),'type'=>Controls_Manager::DIMENSIONS,'size_units'=>['px','%'],'selectors'=>['{{WRAPPER}} .markil-standalone-detail .markil-btn-primary'=>'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};']]);
        $this->add_responsive_control('d_btn_p_padding', ['label'=>__('فاصله داخلی دکمه اصلی','markil-modules'),'type'=>Controls_Manager::DIMENSIONS,'size_units'=>['px','em'],'selectors'=>['{{WRAPPER}} .markil-standalone-detail .markil-btn-primary'=>'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};']]);

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        $module_id = intval($settings['module_id'] ?? 0);
        if (!$module_id) $module_id = get_the_ID();
        if (!$module_id || get_post_type($module_id) !== 'markil_module') {
            echo '<p class="markil-no-module">' . __('ماژولی انتخاب نشده','markil-modules') . '</p>';
            return;
        }

        $ajax = new \Markil\Ajax();
        $m = $ajax->format_module($module_id, true);
        $currency = get_option('markil_currency','تومان');
        include MARKIL_PATH . 'templates/standalone-detail.php';
    }
}
