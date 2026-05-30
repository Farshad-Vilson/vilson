<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Peyda_Font {

	private $options;
	private $font_faces = array();

	public function init() {
		$this->options = get_option( PEYDA_FONT_OPTION, array() );
		$this->build_font_faces();
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend' ) );
		add_action( 'wp_head', array( $this, 'output_preload' ), 1 );
		if ( ! empty( $this->options['load_in_admin'] ) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_frontend' ) );
		}
	}

	private function get_variant_prefix() {
		$variant = isset( $this->options['font_variant'] ) ? $this->options['font_variant'] : 'standard';
		$map = array(
			'standard'       => 'PeydaWeb',
			'farsi-numerals' => 'PeydaWebFaNum',
			'non-english'    => 'PeydaWebNoEn',
		);
		return isset( $map[ $variant ] ) ? $map[ $variant ] : 'PeydaWeb';
	}

	private function get_variant_folder() {
		$variant = isset( $this->options['font_variant'] ) ? $this->options['font_variant'] : 'standard';
		return $variant;
	}

	private function build_font_faces() {
		// 9 weights declared but browser only downloads weights actually used on the page
		$weights = array(
			'Thin'       => 100,
			'ExtraLight' => 200,
			'Light'      => 300,
			'Regular'    => 400,
			'Medium'     => 500,
			'SemiBold'   => 600,
			'Bold'       => 700,
			'ExtraBold'  => 800,
			'Black'      => 900,
		);

		$prefix   = $this->get_variant_prefix();
		$folder   = $this->get_variant_folder();
		$base_url = PEYDA_FONT_URL . 'fonts/' . $folder . '/woff2/';

		foreach ( $weights as $weight_name => $weight_value ) {
			$this->font_faces[] = array(
				'weight' => $weight_value,
				'woff2'  => $base_url . $prefix . '-' . $weight_name . '.woff2',
			);
		}
	}

	public function get_font_face_css() {
		$css = '';
		foreach ( $this->font_faces as $face ) {
			$css .= "@font-face{font-family:'Peyda';font-weight:{$face['weight']};font-style:normal;font-display:swap;src:url('{$face['woff2']}') format('woff2')}\n";
		}
		return $css;
	}

	public function get_selectors_css() {
		$tag_map = array(
			'enable_body'     => 'body',
			'enable_h1'       => 'h1',
			'enable_h2'       => 'h2',
			'enable_h3'       => 'h3',
			'enable_h4'       => 'h4',
			'enable_h5'       => 'h5',
			'enable_h6'       => 'h6',
			'enable_p'        => 'p',
			'enable_a'        => 'a',
			'enable_button'   => 'button',
			'enable_input'    => 'input',
			'enable_textarea' => 'textarea',
			'enable_select'   => 'select',
			'enable_li'       => 'li',
			'enable_span'     => 'span',
		);

		$active_selectors = array();

		foreach ( $tag_map as $option_key => $tag ) {
			if ( ! empty( $this->options[ $option_key ] ) ) {
				$active_selectors[] = $tag;
			}
		}

		if ( ! empty( $this->options['custom_selectors'] ) ) {
			$customs = preg_split( '/[\n,]+/', $this->options['custom_selectors'] );
			foreach ( $customs as $custom ) {
				$custom = trim( $custom );
				if ( ! empty( $custom ) ) {
					$active_selectors[] = $custom;
				}
			}
		}

		if ( empty( $active_selectors ) ) {
			return '';
		}

		// No !important — Elementor's inline styles (higher specificity) override correctly
		$selector_string = implode( ',', $active_selectors );
		return $selector_string . "{font-family:'Peyda',Tahoma,Arial,sans-serif}\n";
	}

	public function output_preload() {
		$prefix   = $this->get_variant_prefix();
		$folder   = $this->get_variant_folder();
		$url      = PEYDA_FONT_URL . 'fonts/' . $folder . '/woff2/' . $prefix . '-Regular.woff2';
		echo '<link rel="preload" href="' . esc_url( $url ) . '" as="font" type="font/woff2" crossorigin>' . "\n";
	}

	public function enqueue_frontend() {
		$css = $this->get_font_face_css() . $this->get_selectors_css();
		wp_register_style( 'peyda-font', false );
		wp_enqueue_style( 'peyda-font' );
		wp_add_inline_style( 'peyda-font', $css );
	}
}
