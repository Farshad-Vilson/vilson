<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Peyda_Font {

	private $options;

	public function init() {
		$this->options = get_option( PEYDA_FONT_OPTION, array() );

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue' ), 999 );
		add_action( 'wp_head',            array( $this, 'output_preload' ), 1 );

		if ( ! empty( $this->options['load_in_admin'] ) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ), 999 );
			add_action( 'admin_head',            array( $this, 'output_preload' ), 1 );
		}
	}

	private function get_variant() {
		$v = isset( $this->options['font_variant'] ) ? $this->options['font_variant'] : 'standard';
		return in_array( $v, array( 'standard', 'farsi-numerals', 'non-english' ), true ) ? $v : 'standard';
	}

	private function get_prefix() {
		$map = array(
			'standard'       => 'PeydaWeb',
			'farsi-numerals' => 'PeydaWebFaNum',
			'non-english'    => 'PeydaWebNoEn',
		);
		return $map[ $this->get_variant() ];
	}

	/*
	 * preload فقط برای وزن Regular (400):
	 * مرورگر را مطلع می‌کند که این فایل را زودتر شروع به دانلود کند
	 * بدون اینکه rendering را block کند.
	 * crossorigin الزامی است چون فونت‌ها به صورت cross-origin fetch می‌شوند.
	 */
	public function output_preload() {
		$url = PEYDA_FONT_URL . 'fonts/' . $this->get_variant() . '/woff2/' . $this->get_prefix() . '-Regular.woff2';
		printf(
			'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n",
			esc_url( $url )
		);
	}

	/*
	 * @font-face را به عنوان فایل CSS خارجی enqueue می‌کنیم.
	 * مزایا نسبت به inline style:
	 * - مرورگر فایل CSS را کش می‌کند → بارگذاری‌های بعدی سریع‌تر
	 * - HTML کوچک‌تر → parse سریع‌تر
	 * - CDN و افزونه‌های کش می‌توانند آن را بهینه کنند
	 *
	 * CSS selector را inline می‌نویسیم چون کوچک و پویاست (بر اساس تنظیمات کاربر).
	 */
	public function enqueue() {
		// ۱. فایل CSS خارجی برای @font-face (کشینگ دارد)
		$css_url = PEYDA_FONT_URL . 'fonts/' . $this->get_variant() . '/font-face.css';
		wp_enqueue_style( 'peyda-font-face', $css_url, array(), PEYDA_FONT_VERSION );

		// ۲. CSS سلکتورها: کوچک و inline — بدون request اضافه
		$selector_css = $this->build_selector_css();
		if ( $selector_css !== '' ) {
			wp_add_inline_style( 'peyda-font-face', $selector_css );
		}
	}

	private function build_selector_css() {
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

		$selectors = array();
		foreach ( $tag_map as $key => $tag ) {
			if ( ! empty( $this->options[ $key ] ) ) {
				$selectors[] = $tag;
			}
		}

		if ( ! empty( $this->options['custom_selectors'] ) ) {
			foreach ( preg_split( '/[\n,]+/', $this->options['custom_selectors'] ) as $s ) {
				$s = trim( $s );
				if ( $s !== '' ) {
					$selectors[] = $s;
				}
			}
		}

		if ( empty( $selectors ) ) {
			return '';
		}

		return implode( ',', $selectors ) . "{font-family:'" . PEYDA_FONT_FAMILY . "',Tahoma,Arial,sans-serif !important}";
	}
}
