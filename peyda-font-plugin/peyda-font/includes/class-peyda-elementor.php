<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class Peyda_Elementor {

	public function init() {
		add_action( 'elementor/fonts/additional_fonts', array( $this, 'register_fonts' ) );
		add_filter( 'elementor/fonts/groups', array( $this, 'add_font_group' ) );
	}

	public function add_font_group( $groups ) {
		$groups['peyda'] = array(
			'label' => 'فونت پیدا',
		);
		return $groups;
	}

	public function register_fonts( $fonts ) {
		$options = get_option( PEYDA_FONT_OPTION, array() );
		$variant = isset( $options['font_variant'] ) ? $options['font_variant'] : 'standard';

		$variant_map = array(
			'standard'       => 'PeydaWeb',
			'farsi-numerals' => 'PeydaWebFaNum',
			'non-english'    => 'PeydaWebNoEn',
		);

		$prefix = isset( $variant_map[ $variant ] ) ? $variant_map[ $variant ] : 'PeydaWeb';

		$fonts['Peyda']                = 'peyda';
		$fonts[ $prefix . ' Thin' ]      = 'peyda';
		$fonts[ $prefix . ' ExtraLight' ] = 'peyda';
		$fonts[ $prefix . ' Light' ]     = 'peyda';
		$fonts[ $prefix . ' Regular' ]   = 'peyda';
		$fonts[ $prefix . ' Medium' ]    = 'peyda';
		$fonts[ $prefix . ' SemiBold' ]  = 'peyda';
		$fonts[ $prefix . ' Bold' ]      = 'peyda';
		$fonts[ $prefix . ' ExtraBold' ] = 'peyda';
		$fonts[ $prefix . ' Black' ]     = 'peyda';

		return $fonts;
	}
}
