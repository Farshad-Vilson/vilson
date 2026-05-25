<?php
/**
 * Settings page.
 *
 * @package HarfehavalSitesPro
 */

defined( 'ABSPATH' ) || exit;

class HA_Sites_Pro_Settings {

	public static function defaults() {
		return array(
			'per_page'       => 12,
			'currency'       => 'تومان',
			'whatsapp'       => '',
			'whatsapp_text'  => 'سلام، برای سفارش سایت «%s» پیام می‌دهم.',
			'primary_color'  => '#011627',
			'accent_color'   => '#2ec4b6',
			'bg_color'       => '#f8fafc',
			'card_color'     => '#ffffff',
			'text_color'     => '#011627',
			'muted_color'    => '#64748b',
			'border_color'   => '#e2e8f0',
			'radius'         => 22,
			'button_radius'  => 999,
			'font_family'    => 'IRANYekan, Kalameh, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
			'neon_mode'      => 'yes',
			'isolated_style' => 'yes',
		);
	}

	public static function option_name( $key ) {
		return 'ha_sites_pro_' . $key;
	}

	public static function get( $key ) {
		$defaults = self::defaults();
		return get_option( self::option_name( $key ), $defaults[ $key ] ?? '' );
	}

	public static function ensure_defaults() {
		foreach ( self::defaults() as $key => $value ) {
			if ( false === get_option( self::option_name( $key ), false ) ) {
				add_option( self::option_name( $key ), $value );
			}
		}
	}

	public static function add_menu() {
		add_submenu_page(
			'edit.php?post_type=ha_site',
			__( 'تنظیمات حرفه‌ای', 'harfehaval-sites-pro' ),
			__( 'تنظیمات حرفه‌ای', 'harfehaval-sites-pro' ),
			'manage_options',
			'ha-sites-pro-settings',
			array( __CLASS__, 'render_page' )
		);
	}

	public static function register() {
		foreach ( self::defaults() as $key => $default ) {
			register_setting(
				'ha_sites_pro_settings',
				self::option_name( $key ),
				array(
					'default'           => $default,
					'sanitize_callback' => function ( $value ) use ( $key ) {
						return HA_Sites_Pro_Settings::sanitize_value( $key, $value );
					},
				)
			);
		}
	}

	public static function sanitize_value( $key, $value ) {
		$defaults = self::defaults();
		if ( false !== strpos( $key, 'color' ) ) {
			$color = sanitize_hex_color( $value );
			return $color ? $color : ( $defaults[ $key ] ?? '#000000' );
		}
		if ( in_array( $key, array( 'per_page', 'radius', 'button_radius' ), true ) ) {
			return absint( $value );
		}
		if ( in_array( $key, array( 'neon_mode', 'isolated_style' ), true ) ) {
			return 'yes' === $value ? 'yes' : 'no';
		}
		if ( 'whatsapp_text' === $key ) {
			return sanitize_textarea_field( $value );
		}
		return sanitize_text_field( $value );
	}

	public static function get_public_settings() {
		return array(
			'perPage'      => max( 1, min( 60, (int) self::get( 'per_page' ) ) ),
			'currency'     => self::get( 'currency' ),
			'whatsapp'     => preg_replace( '/[^0-9]/', '', (string) self::get( 'whatsapp' ) ),
			'whatsappText' => self::get( 'whatsapp_text' ),
		);
	}

	public static function inline_css() {
		$css = ':root{}';
		$vars = array(
			'--ha-pro-primary' => self::get( 'primary_color' ),
			'--ha-pro-accent'  => self::get( 'accent_color' ),
			'--ha-pro-bg'      => self::get( 'bg_color' ),
			'--ha-pro-card'    => self::get( 'card_color' ),
			'--ha-pro-text'    => self::get( 'text_color' ),
			'--ha-pro-muted'   => self::get( 'muted_color' ),
			'--ha-pro-border'  => self::get( 'border_color' ),
			'--ha-pro-radius'  => absint( self::get( 'radius' ) ) . 'px',
			'--ha-pro-btn-radius' => absint( self::get( 'button_radius' ) ) . 'px',
			'--ha-pro-font'    => self::get( 'font_family' ),
		);
		$css .= '.ha-sites-pro{';
		foreach ( $vars as $name => $value ) {
			$css .= esc_html( $name ) . ':' . esc_html( $value ) . ';';
		}
		$css .= '}';
		if ( 'yes' === self::get( 'neon_mode' ) ) {
			$css .= '.ha-sites-pro{--ha-pro-glow:0 0 0 1px color-mix(in srgb,var(--ha-pro-accent) 45%,transparent),0 20px 80px color-mix(in srgb,var(--ha-pro-accent) 22%,transparent);}';
		}
		return $css;
	}

	private static function field( $key, $label, $type = 'text', $help = '', $attrs = '' ) {
		$name = self::option_name( $key );
		$value = self::get( $key );
		?>
		<tr>
			<th scope="row"><label for="<?php echo esc_attr( $name ); ?>"><?php echo esc_html( $label ); ?></label></th>
			<td>
				<?php if ( 'select_bool' === $type ) : ?>
					<select id="<?php echo esc_attr( $name ); ?>" name="<?php echo esc_attr( $name ); ?>">
						<option value="yes" <?php selected( $value, 'yes' ); ?>>فعال</option>
						<option value="no" <?php selected( $value, 'no' ); ?>>غیرفعال</option>
					</select>
				<?php elseif ( 'textarea' === $type ) : ?>
					<textarea id="<?php echo esc_attr( $name ); ?>" name="<?php echo esc_attr( $name ); ?>" rows="3" class="large-text"><?php echo esc_textarea( $value ); ?></textarea>
				<?php else : ?>
					<input id="<?php echo esc_attr( $name ); ?>" name="<?php echo esc_attr( $name ); ?>" type="<?php echo esc_attr( $type ); ?>" value="<?php echo esc_attr( $value ); ?>" <?php echo $attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> class="regular-text">
				<?php endif; ?>
				<?php if ( $help ) : ?><p class="description"><?php echo esc_html( $help ); ?></p><?php endif; ?>
			</td>
		</tr>
		<?php
	}

	public static function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap ha-pro-settings">
			<h1>تنظیمات حرفه‌ای سایت‌های حرف اول</h1>
			<p class="ha-pro-lead">این تنظیمات روی شورت‌کد و حالت عمومی افزونه اعمال می‌شود. در المنتور می‌توانید برای هر ویجت استایل مستقل تعریف کنید.</p>
			<form method="post" action="options.php">
				<?php settings_fields( 'ha_sites_pro_settings' ); ?>
				<div class="ha-pro-settings-card">
					<h2>رفتار و فروش</h2>
					<table class="form-table" role="presentation">
						<?php self::field( 'per_page', 'تعداد آیتم در هر بارگذاری', 'number', 'بین ۱ تا ۶۰', 'min="1" max="60"' ); ?>
						<?php self::field( 'currency', 'واحد پول', 'text', 'مثلاً تومان یا ریال' ); ?>
						<?php self::field( 'whatsapp', 'شماره واتساپ', 'text', 'فرمت پیشنهادی: 989120000000' ); ?>
						<?php self::field( 'whatsapp_text', 'متن پیام واتساپ', 'textarea', 'از %s برای نام سایت استفاده کنید.' ); ?>
					</table>
				</div>

				<div class="ha-pro-settings-card">
					<h2>استایل مستقل از قالب</h2>
					<table class="form-table" role="presentation">
						<?php self::field( 'primary_color', 'رنگ اصلی', 'color' ); ?>
						<?php self::field( 'accent_color', 'رنگ فرعی / نئونی', 'color' ); ?>
						<?php self::field( 'bg_color', 'رنگ پس‌زمینه', 'color' ); ?>
						<?php self::field( 'card_color', 'رنگ کارت', 'color' ); ?>
						<?php self::field( 'text_color', 'رنگ متن', 'color' ); ?>
						<?php self::field( 'muted_color', 'رنگ متن کم‌رنگ', 'color' ); ?>
						<?php self::field( 'border_color', 'رنگ خط و بوردر', 'color' ); ?>
						<?php self::field( 'radius', 'گردی کارت‌ها', 'number', 'پیکسل', 'min="0" max="60"' ); ?>
						<?php self::field( 'button_radius', 'گردی دکمه‌ها', 'number', 'پیکسل', 'min="0" max="999"' ); ?>
						<?php self::field( 'font_family', 'فونت اختصاصی', 'text', 'مثلاً IRANYekan, Kalameh, sans-serif' ); ?>
						<?php self::field( 'neon_mode', 'افکت نئونی مدرن', 'select_bool' ); ?>
						<?php self::field( 'isolated_style', 'ایزوله‌سازی از قالب', 'select_bool', 'برای جلوگیری از ارث‌بری استایل دکمه‌ها، سرچ، سلکت و کارت‌ها از قالب.' ); ?>
					</table>
				</div>
				<?php submit_button( 'ذخیره تنظیمات' ); ?>
			</form>
			<div class="ha-pro-settings-card">
				<h2>شورت‌کدها</h2>
				<code>[ha_sites_pro columns="3" layout="grid" show_search="yes" show_filters="yes" show_sort="yes"]</code><br><br>
				<code>[ha_sites category="medical" feature="booking" status="featured"]</code>
			</div>
		</div>
		<?php
	}
}
