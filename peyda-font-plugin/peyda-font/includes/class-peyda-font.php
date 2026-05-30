<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Peyda_Font {

	private $options;
	private $font_faces = array();

	public function init() {
		$this->options = get_option( PEYDA_FONT_OPTION, array() );
		$this->build_font_faces();

		// @font-face را زود در <head> بارگذاری کن تا مرورگر فایل‌ها را زودتر شروع کند
		add_action( 'wp_head', array( $this, 'output_font_face' ), 1 );
		add_action( 'wp_head', array( $this, 'output_preload' ), 1 );

		// سلکتورها را با اولویت 999 بارگذاری کن — بعد از theme و تمام افزونه‌ها
		// این باعث می‌شود بدون !important هم روی theme اثر بگذارد
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_selectors' ), 999 );

		if ( ! empty( $this->options['load_in_admin'] ) ) {
			add_action( 'admin_head', array( $this, 'output_font_face' ), 1 );
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
				'url'    => $base_url . $prefix . '-' . $weight_name . '.woff2',
			);
		}
	}

	// @font-face مستقیم در <head> — نه inline style — تا مرورگر سریع‌تر فونت را بشناسد
	public function output_font_face() {
		echo "<style id='peyda-font-face'>\n";
		foreach ( $this->font_faces as $face ) {
			echo "@font-face{font-family:'Peyda';font-weight:{$face['weight']};font-style:normal;font-display:swap;src:url('" . esc_url( $face['url'] ) . "') format('woff2')}\n";
		}
		echo "</style>\n";
	}

	public function output_preload() {
		$prefix = $this->get_variant_prefix();
		$folder = $this->get_variant_folder();
		$url    = PEYDA_FONT_URL . 'fonts/' . $folder . '/woff2/' . $prefix . '-Regular.woff2';
		echo '<link rel="preload" href="' . esc_url( $url ) . '" as="font" type="font/woff2" crossorigin>' . "\n";
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

		$css = '';

		// body با !important — چون body فقط base است و Elementor فونت را روی المان‌های فرزند تغییر می‌دهد
		// Elementor روی div/h1/p فرزند inline style می‌گذارد که inherited value را override می‌کند
		if ( in_array( 'body', $active_selectors, true ) ) {
			$css .= "body{font-family:'Peyda',Tahoma,Arial,sans-serif !important}\n";
		}

		// بقیه تگ‌ها بدون !important — اولویت 999 یعنی بعد از theme CSS لود می‌شود
		// Elementor وقتی روی یک المان فونت تغییر می‌دهد، inline style می‌زند که بر این CSS غلبه می‌کند
		$other = array_filter( $active_selectors, function( $s ) {
			return $s !== 'body';
		} );

		if ( ! empty( $other ) ) {
			$css .= implode( ',', array_values( $other ) ) . "{font-family:'Peyda',Tahoma,Arial,sans-serif}\n";
		}

		return $css;
	}

	public function enqueue_selectors() {
		$css = $this->get_selectors_css();
		if ( empty( $css ) ) {
			return;
		}
		wp_register_style( 'peyda-selectors', false );
		wp_enqueue_style( 'peyda-selectors' );
		wp_add_inline_style( 'peyda-selectors', $css );
	}
}
