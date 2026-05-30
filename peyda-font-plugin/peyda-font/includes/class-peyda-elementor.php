<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Peyda_Elementor {

	public function init() {
		// فقط بعد از اینکه Elementor کامل لود شد اقدام کن
		add_action( 'elementor/loaded', array( $this, 'register_hooks' ) );
	}

	public function register_hooks() {
		add_filter( 'elementor/fonts/additional_fonts', array( $this, 'add_font' ) );
	}

	public function add_font( $fonts ) {
		/*
		 * نوع 'system': به المنتور می‌گوید این فونت از خارج load می‌شود (توسط افزونه ما).
		 * المنتور نامش را در لیست فونت‌ها نشان می‌دهد و وقتی انتخاب می‌شود
		 * مقدار font-family: 'Peyda' را در CSS خروجی می‌نویسد.
		 * از آنجا که ما @font-face را در wp_head لود کرده‌ایم، فونت به درستی نمایش داده می‌شود.
		 */
		$fonts[ PEYDA_FONT_FAMILY ] = 'system';
		return $fonts;
	}
}
