<?php
namespace Markil;

if ( ! defined( 'ABSPATH' ) ) exit;

class Elementor {
    public function __construct() {
        add_action( 'elementor/widgets/register', [ $this, 'register_widgets' ] );
        add_action( 'elementor/elements/categories_registered', [ $this, 'add_category' ] );
    }

    public function add_category( $manager ) {
        $manager->add_category( 'markil', [
            'title' => __( '🏪 مارکیل ماژول‌ها', 'markil-modules' ),
            'icon'  => 'fa fa-plug',
        ]);
    }

    public function register_widgets( $manager ) {
        require_once MARKIL_PATH . 'widgets/class-widget-modules-grid.php';
        require_once MARKIL_PATH . 'widgets/class-widget-module-detail.php';
        require_once MARKIL_PATH . 'widgets/class-widget-module-full-detail.php';

        $manager->register( new \Markil\Widget\ModulesGrid() );
        $manager->register( new \Markil\Widget\ModuleDetail() );
        $manager->register( new \Markil\Widget\ModuleFullDetail() );
    }
}
