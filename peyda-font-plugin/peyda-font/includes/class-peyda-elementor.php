<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Peyda_Elementor {

	public function init() {
		// Register Peyda as a custom font in Elementor's font picker
		// Type 'custom' tells Elementor: font is loaded externally, don't try to enqueue it
		add_filter( 'elementor/fonts/additional_fonts', array( $this, 'register_font' ) );
	}

	public function register_font( $fonts ) {
		$fonts['Peyda'] = 'custom';
		return $fonts;
	}
}
