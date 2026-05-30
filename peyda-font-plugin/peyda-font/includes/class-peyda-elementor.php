<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Peyda_Elementor {

	public function init() {
		// 'system' = Elementor نمی‌خواهد فونت را load کند، ما خودمان در wp_head لود می‌کنیم
		// 'custom' مخصوص Elementor Pro است و در نسخه رایگان کار نمی‌کند
		add_filter( 'elementor/fonts/additional_fonts', array( $this, 'register_font' ) );
	}

	public function register_font( $fonts ) {
		// نام باید دقیقاً با font-family در @font-face یکی باشد
		$fonts['Peyda'] = 'system';
		return $fonts;
	}
}
