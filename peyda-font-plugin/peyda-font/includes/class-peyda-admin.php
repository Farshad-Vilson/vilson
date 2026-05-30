<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Peyda_Admin {

	private $options;

	public function init() {
		$this->options = get_option( PEYDA_FONT_OPTION, array() );
		add_action( 'admin_menu', array( $this, 'add_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
	}

	public function add_menu() {
		add_menu_page(
			'تنظیمات فونت پیدا',
			'فونت پیدا',
			'manage_options',
			'peyda-font',
			array( $this, 'render_settings_page' ),
			'dashicons-editor-textcolor',
			60
		);
	}

	public function register_settings() {
		register_setting( 'peyda_font_group', PEYDA_FONT_OPTION, array( $this, 'sanitize_options' ) );
	}

	public function sanitize_options( $input ) {
		$sanitized = array();

		$sanitized['font_variant'] = in_array( $input['font_variant'], array( 'standard', 'farsi-numerals', 'non-english' ) )
			? $input['font_variant'] : 'standard';

		$checkboxes = array(
			'enable_body', 'enable_h1', 'enable_h2', 'enable_h3', 'enable_h4',
			'enable_h5', 'enable_h6', 'enable_p', 'enable_a', 'enable_button',
			'enable_input', 'enable_textarea', 'enable_select', 'enable_li',
			'enable_span', 'load_in_admin',
		);
		foreach ( $checkboxes as $key ) {
			$sanitized[ $key ] = ! empty( $input[ $key ] ) ? '1' : '0';
		}

		$sanitized['custom_selectors'] = isset( $input['custom_selectors'] )
			? sanitize_textarea_field( $input['custom_selectors'] ) : '';

		return $sanitized;
	}

	public function enqueue_admin_assets( $hook ) {
		if ( 'toplevel_page_peyda-font' !== $hook ) {
			return;
		}
		wp_enqueue_style( 'peyda-admin', PEYDA_FONT_URL . 'admin/admin.css', array(), PEYDA_FONT_VERSION );
	}

	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) return;
		$options = get_option( PEYDA_FONT_OPTION, array() );
		include PEYDA_FONT_DIR . 'admin/settings-page.php';
	}
}
