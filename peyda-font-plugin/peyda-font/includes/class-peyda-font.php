<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Peyda_Font {

	private $options;

	public function init() {
		$this->options = get_option( PEYDA_FONT_OPTION, array() );

		// preload + @font-face را اول از همه در <head> خروجی بده
		add_action( 'wp_head', array( $this, 'output_preload' ), 1 );
		add_action( 'wp_head', array( $this, 'output_font_face' ), 2 );

		// CSS اعمال فونت روی تگ‌ها را با اولویت 999 اضافه کن — بعد از theme و افزونه‌ها
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_selectors' ), 999 );

		if ( ! empty( $this->options['load_in_admin'] ) ) {
			add_action( 'admin_head', array( $this, 'output_font_face' ), 1 );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_selectors' ), 999 );
		}
	}

	private function get_variant() {
		$variant = isset( $this->options['font_variant'] ) ? $this->options['font_variant'] : 'standard';
		$valid = array( 'standard', 'farsi-numerals', 'non-english' );
		return in_array( $variant, $valid, true ) ? $variant : 'standard';
	}

	private function get_prefix() {
		$map = array(
			'standard'       => 'PeydaWeb',
			'farsi-numerals' => 'PeydaWebFaNum',
			'non-english'    => 'PeydaWebNoEn',
		);
		return $map[ $this->get_variant() ];
	}

	private function get_weights() {
		return array(
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
	}

	// preload فقط برای Regular — مرورگر فایل را زودتر دانلود می‌کند
	public function output_preload() {
		$url = PEYDA_FONT_URL . 'fonts/' . $this->get_variant() . '/woff2/' . $this->get_prefix() . '-Regular.woff2';
		echo '<link rel="preload" href="' . esc_url( $url ) . '" as="font" type="font/woff2" crossorigin>' . "\n";
	}

	// @font-face برای تمام ۹ وزن — مرورگر فقط وزن‌هایی را دانلود می‌کند که در صفحه استفاده می‌شوند
	public function output_font_face() {
		$prefix   = $this->get_prefix();
		$variant  = $this->get_variant();
		$base_w2  = PEYDA_FONT_URL . 'fonts/' . $variant . '/woff2/';
		$base_w   = PEYDA_FONT_URL . 'fonts/' . $variant . '/woff/';
		$family   = PEYDA_FONT_FAMILY;

		echo "<style id='peyda-font-face'>\n";
		foreach ( $this->get_weights() as $name => $weight ) {
			$woff2 = esc_url( $base_w2 . $prefix . '-' . $name . '.woff2' );
			$woff  = esc_url( $base_w  . $prefix . '-' . $name . '.woff' );
			echo "@font-face {\n";
			echo "  font-family: '{$family}';\n";
			echo "  font-weight: {$weight};\n";
			echo "  font-style: normal;\n";
			echo "  font-display: swap;\n";
			echo "  src: url('{$woff2}') format('woff2'),\n";
			echo "       url('{$woff}') format('woff');\n";
			echo "}\n";
		}
		echo "</style>\n";
	}

	private function get_active_selectors() {
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
			$customs = preg_split( '/[\n,]+/', $this->options['custom_selectors'] );
			foreach ( $customs as $s ) {
				$s = trim( $s );
				if ( $s !== '' ) {
					$selectors[] = $s;
				}
			}
		}

		return $selectors;
	}

	public function enqueue_selectors() {
		$selectors = $this->get_active_selectors();
		if ( empty( $selectors ) ) {
			return;
		}

		$family = PEYDA_FONT_FAMILY;
		$stack  = "'{$family}', Tahoma, Arial, sans-serif";

		/*
		 * همه سلکتورها با !important:
		 * - body با !important: Elementor روی المان‌های فرزند inline style می‌زند که inherited value را override می‌کند.
		 * - بقیه تگ‌ها با !important: تنها راه مطمئن برای override کردن theme CSS که از class selector استفاده می‌کند.
		 *
		 * برای تغییر فونت یک المان خاص در المنتور:
		 * Advanced → Custom CSS و بنویسید: selector { font-family: 'فونت‌دیگر' !important; }
		 */
		$css = implode( ",\n", $selectors ) . " {\n";
		$css .= "  font-family: {$stack} !important;\n";
		$css .= "}\n";

		wp_register_style( 'peyda-selectors', false );
		wp_enqueue_style( 'peyda-selectors' );
		wp_add_inline_style( 'peyda-selectors', $css );
	}
}
