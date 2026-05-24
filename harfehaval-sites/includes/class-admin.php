<?php
/**
 * Admin Panel — Settings Page, Custom Columns, Quick Edit
 *
 * @package HarfehavalSites
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class HA_Sites_Admin
 *
 * Handles the admin settings page, custom list table columns,
 * and quick-edit support for the ha_site CPT.
 */
class HA_Sites_Admin {

	/**
	 * Register all admin hooks.
	 *
	 * @return void
	 */
	public static function register() {
		// Settings page.
		add_action( 'admin_menu', array( __CLASS__, 'add_settings_page' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );

		// Custom columns.
		add_filter( 'manage_ha_site_posts_columns', array( __CLASS__, 'add_columns' ) );
		add_action( 'manage_ha_site_posts_custom_column', array( __CLASS__, 'render_column' ), 10, 2 );
		add_filter( 'manage_edit-ha_site_sortable_columns', array( __CLASS__, 'sortable_columns' ) );

		// Quick edit.
		add_action( 'quick_edit_custom_box', array( __CLASS__, 'quick_edit_box' ), 10, 2 );
		add_action( 'save_post_ha_site', array( __CLASS__, 'save_quick_edit' ), 10, 2 );
		add_action( 'admin_footer', array( __CLASS__, 'quick_edit_script' ) );
	}

	/**
	 * Add a settings sub-page under the ha_site menu.
	 *
	 * @return void
	 */
	public static function add_settings_page() {
		add_submenu_page(
			'edit.php?post_type=ha_site',
			__( 'تنظیمات سایت‌های حرف اول', 'harfehaval-sites' ),
			__( 'تنظیمات', 'harfehaval-sites' ),
			'manage_options',
			'ha-sites-settings',
			array( __CLASS__, 'render_settings_page' )
		);
	}

	/**
	 * Register plugin settings with the Settings API.
	 *
	 * @return void
	 */
	public static function register_settings() {
		register_setting(
			'ha_sites_settings',
			'ha_sites_whatsapp',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => '',
			)
		);

		register_setting(
			'ha_sites_settings',
			'ha_sites_whatsapp_text',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_textarea_field',
				'default'           => 'سلام، می‌خواهم سایت «%s» را سفارش بدهم',
			)
		);

		register_setting(
			'ha_sites_settings',
			'ha_sites_per_page',
			array(
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'default'           => 12,
			)
		);

		register_setting(
			'ha_sites_settings',
			'ha_sites_currency',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => 'تومان',
			)
		);

		register_setting(
			'ha_sites_settings',
			'ha_sites_accent_color',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_hex_color',
				'default'           => '#011627',
			)
		);

		// Sections.
		add_settings_section(
			'ha_sites_general',
			__( 'تنظیمات عمومی', 'harfehaval-sites' ),
			'__return_false',
			'ha_sites_settings'
		);

		add_settings_section(
			'ha_sites_whatsapp_section',
			__( 'تنظیمات واتساپ', 'harfehaval-sites' ),
			'__return_false',
			'ha_sites_settings'
		);

		// Fields — General.
		add_settings_field(
			'ha_sites_per_page',
			__( 'تعداد سایت در هر صفحه', 'harfehaval-sites' ),
			array( __CLASS__, 'field_per_page' ),
			'ha_sites_settings',
			'ha_sites_general'
		);

		add_settings_field(
			'ha_sites_currency',
			__( 'واحد پول', 'harfehaval-sites' ),
			array( __CLASS__, 'field_currency' ),
			'ha_sites_settings',
			'ha_sites_general'
		);

		add_settings_field(
			'ha_sites_accent_color',
			__( 'رنگ اصلی', 'harfehaval-sites' ),
			array( __CLASS__, 'field_accent_color' ),
			'ha_sites_settings',
			'ha_sites_general'
		);

		// Fields — WhatsApp.
		add_settings_field(
			'ha_sites_whatsapp',
			__( 'شماره واتساپ', 'harfehaval-sites' ),
			array( __CLASS__, 'field_whatsapp' ),
			'ha_sites_settings',
			'ha_sites_whatsapp_section'
		);

		add_settings_field(
			'ha_sites_whatsapp_text',
			__( 'متن پیام واتساپ', 'harfehaval-sites' ),
			array( __CLASS__, 'field_whatsapp_text' ),
			'ha_sites_settings',
			'ha_sites_whatsapp_section'
		);
	}

	// -------------------------------------------------------------------------
	// Settings field renderers
	// -------------------------------------------------------------------------

	/**
	 * Render per-page field.
	 *
	 * @return void
	 */
	public static function field_per_page() {
		$value = (int) get_option( 'ha_sites_per_page', 12 );
		?>
		<input
			type="number"
			name="ha_sites_per_page"
			id="ha_sites_per_page"
			value="<?php echo esc_attr( $value ); ?>"
			min="1"
			max="50"
			class="small-text"
		>
		<p class="description"><?php esc_html_e( 'تعداد کارت‌های سایت که در هر بار بارگذاری نمایش داده می‌شوند (۱ تا ۵۰).', 'harfehaval-sites' ); ?></p>
		<?php
	}

	/**
	 * Render currency field.
	 *
	 * @return void
	 */
	public static function field_currency() {
		$value = get_option( 'ha_sites_currency', 'تومان' );
		?>
		<input
			type="text"
			name="ha_sites_currency"
			id="ha_sites_currency"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text"
		>
		<p class="description"><?php esc_html_e( 'واحد پولی که پس از مبلغ نمایش داده می‌شود (مثال: تومان، ریال).', 'harfehaval-sites' ); ?></p>
		<?php
	}

	/**
	 * Render accent color field.
	 *
	 * @return void
	 */
	public static function field_accent_color() {
		$value = get_option( 'ha_sites_accent_color', '#011627' );
		?>
		<input
			type="color"
			name="ha_sites_accent_color"
			id="ha_sites_accent_color"
			value="<?php echo esc_attr( $value ); ?>"
		>
		<p class="description"><?php esc_html_e( 'رنگ اصلی پلاگین. پیش‌فرض: #011627', 'harfehaval-sites' ); ?></p>
		<?php
	}

	/**
	 * Render WhatsApp phone field.
	 *
	 * @return void
	 */
	public static function field_whatsapp() {
		$value = get_option( 'ha_sites_whatsapp', '' );
		?>
		<input
			type="text"
			name="ha_sites_whatsapp"
			id="ha_sites_whatsapp"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text"
			placeholder="989123456789"
		>
		<p class="description"><?php esc_html_e( 'شماره واتساپ به فرمت بین‌المللی بدون + (مثال: 989123456789).', 'harfehaval-sites' ); ?></p>
		<?php
	}

	/**
	 * Render WhatsApp message template field.
	 *
	 * @return void
	 */
	public static function field_whatsapp_text() {
		$value = get_option( 'ha_sites_whatsapp_text', 'سلام، می‌خواهم سایت «%s» را سفارش بدهم' );
		?>
		<textarea
			name="ha_sites_whatsapp_text"
			id="ha_sites_whatsapp_text"
			rows="3"
			class="large-text"
		><?php echo esc_textarea( $value ); ?></textarea>
		<p class="description"><?php esc_html_e( 'متن پیام واتساپ. از %s برای جای‌گذاری نام سایت استفاده کنید.', 'harfehaval-sites' ); ?></p>
		<?php
	}

	/**
	 * Render the settings page HTML.
	 *
	 * @return void
	 */
	public static function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap ha-settings">
			<h1><?php esc_html_e( 'تنظیمات سایت‌های حرف اول', 'harfehaval-sites' ); ?></h1>

			<?php if ( isset( $_GET['settings-updated'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
				<div class="notice notice-success is-dismissible">
					<p><?php esc_html_e( 'تنظیمات با موفقیت ذخیره شد.', 'harfehaval-sites' ); ?></p>
				</div>
			<?php endif; ?>

			<form method="post" action="options.php">
				<?php
				settings_fields( 'ha_sites_settings' );
				do_settings_sections( 'ha_sites_settings' );
				submit_button( __( 'ذخیره تنظیمات', 'harfehaval-sites' ) );
				?>
			</form>

			<hr>
			<h2><?php esc_html_e( 'راهنمای استفاده از شورت‌کد', 'harfehaval-sites' ); ?></h2>
			<table class="widefat striped" style="max-width:700px">
				<thead>
					<tr>
						<th><?php esc_html_e( 'پارامتر', 'harfehaval-sites' ); ?></th>
						<th><?php esc_html_e( 'مقدار پیش‌فرض', 'harfehaval-sites' ); ?></th>
						<th><?php esc_html_e( 'توضیح', 'harfehaval-sites' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<tr><td><code>columns</code></td><td>3</td><td><?php esc_html_e( 'تعداد ستون‌ها (۲، ۳ یا ۴)', 'harfehaval-sites' ); ?></td></tr>
					<tr><td><code>show_search</code></td><td>yes</td><td><?php esc_html_e( 'نمایش جستجو (yes/no)', 'harfehaval-sites' ); ?></td></tr>
					<tr><td><code>show_filters</code></td><td>yes</td><td><?php esc_html_e( 'نمایش فیلترها (yes/no)', 'harfehaval-sites' ); ?></td></tr>
					<tr><td><code>show_sort</code></td><td>yes</td><td><?php esc_html_e( 'نمایش مرتب‌سازی (yes/no)', 'harfehaval-sites' ); ?></td></tr>
					<tr><td><code>category</code></td><td></td><td><?php esc_html_e( 'فیلتر اولیه بر اساس اسلاگ دسته‌بندی', 'harfehaval-sites' ); ?></td></tr>
					<tr><td><code>feature</code></td><td></td><td><?php esc_html_e( 'فیلتر اولیه بر اساس اسلاگ ویژگی', 'harfehaval-sites' ); ?></td></tr>
				</tbody>
			</table>
			<p><strong><?php esc_html_e( 'نمونه:', 'harfehaval-sites' ); ?></strong> <code>[ha_sites columns="3" show_search="yes" show_filters="yes"]</code></p>
		</div>
		<?php
	}

	// -------------------------------------------------------------------------
	// Custom admin list table columns
	// -------------------------------------------------------------------------

	/**
	 * Add custom columns to the ha_site list table.
	 *
	 * @param array $columns Existing columns.
	 * @return array
	 */
	public static function add_columns( $columns ) {
		$new = array();
		foreach ( $columns as $key => $label ) {
			$new[ $key ] = $label;
			// Insert after title.
			if ( 'title' === $key ) {
				$new['ha_price']   = __( 'قیمت', 'harfehaval-sites' );
				$new['ha_status']  = __( 'وضعیت', 'harfehaval-sites' );
				$new['ha_demo']    = __( 'دمو', 'harfehaval-sites' );
				$new['ha_feature'] = __( 'ویژگی‌ها', 'harfehaval-sites' );
			}
		}
		return $new;
	}

	/**
	 * Render custom column content.
	 *
	 * @param string $column  Column key.
	 * @param int    $post_id Post ID.
	 * @return void
	 */
	public static function render_column( $column, $post_id ) {
		switch ( $column ) {
			case 'ha_price':
				$price = get_post_meta( $post_id, '_ha_price', true );
				if ( '' !== $price && false !== $price ) {
					$currency = get_option( 'ha_sites_currency', 'تومان' );
					echo '<strong>' . esc_html( number_format( (int) $price ) ) . '</strong> <small>' . esc_html( $currency ) . '</small>';
				} else {
					echo '<span style="color:#888">' . esc_html__( 'تماس بگیرید', 'harfehaval-sites' ) . '</span>';
				}
				break;

			case 'ha_status':
				$status = get_post_meta( $post_id, '_ha_status', true );
				$badges = array(
					'new'      => '<span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700">✨ جدید</span>',
					'popular'  => '<span style="background:#fef3c7;color:#d97706;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700">🔥 پرفروش</span>',
					'featured' => '<span style="background:#fce7f3;color:#be185d;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700">⭐ ویژه</span>',
				);
				if ( ! empty( $status ) && isset( $badges[ $status ] ) ) {
					echo wp_kses_post( $badges[ $status ] );
				} else {
					echo '<span style="color:#888">—</span>';
				}
				// Hidden data for quick edit JS population.
				echo '<span class="ha-status-data" data-status="' . esc_attr( $status ) . '" style="display:none"></span>';
				break;

			case 'ha_demo':
				$url = get_post_meta( $post_id, '_ha_demo_url', true );
				if ( ! empty( $url ) ) {
					echo '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener noreferrer" title="' . esc_attr__( 'مشاهده دمو', 'harfehaval-sites' ) . '">↗ ' . esc_html__( 'مشاهده', 'harfehaval-sites' ) . '</a>';
				} else {
					echo '<span style="color:#888">—</span>';
				}
				break;

			case 'ha_feature':
				$terms = get_the_terms( $post_id, 'ha_feature' );
				if ( $terms && ! is_wp_error( $terms ) ) {
					$tags = array_map(
						function ( $t ) {
							return '<span style="background:#f1f5f9;border-radius:999px;padding:1px 8px;font-size:11px;display:inline-block;margin:1px">' . esc_html( $t->name ) . '</span>';
						},
						$terms
					);
					echo implode( ' ', $tags ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				} else {
					echo '<span style="color:#888">—</span>';
				}
				break;
		}
	}

	/**
	 * Define sortable columns.
	 *
	 * @param array $columns Current sortable columns.
	 * @return array
	 */
	public static function sortable_columns( $columns ) {
		$columns['ha_price'] = 'ha_price';
		return $columns;
	}

	// -------------------------------------------------------------------------
	// Quick edit
	// -------------------------------------------------------------------------

	/**
	 * Add custom field to the quick-edit panel.
	 *
	 * @param string $column_name Column being rendered.
	 * @param string $post_type   Current post type.
	 * @return void
	 */
	public static function quick_edit_box( $column_name, $post_type ) {
		if ( 'ha_status' !== $column_name || 'ha_site' !== $post_type ) {
			return;
		}
		wp_nonce_field( 'ha_quick_edit_nonce', 'ha_quick_edit_nonce_field' );
		?>
		<fieldset class="inline-edit-col-right">
			<div class="inline-edit-col">
				<label>
					<span class="title"><?php esc_html_e( 'وضعیت', 'harfehaval-sites' ); ?></span>
					<select name="ha_status_quick" id="ha-quick-status">
						<option value=""><?php esc_html_e( '— عادی —', 'harfehaval-sites' ); ?></option>
						<option value="new"><?php esc_html_e( '✨ جدید', 'harfehaval-sites' ); ?></option>
						<option value="popular"><?php esc_html_e( '🔥 پرفروش', 'harfehaval-sites' ); ?></option>
						<option value="featured"><?php esc_html_e( '⭐ ویژه', 'harfehaval-sites' ); ?></option>
					</select>
				</label>
			</div>
		</fieldset>
		<?php
	}

	/**
	 * Save quick-edit data on save_post.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 * @return void
	 */
	public static function save_quick_edit( $post_id, $post ) {
		if ( ! isset( $_POST['ha_quick_edit_nonce_field'] ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['ha_quick_edit_nonce_field'] ) ), 'ha_quick_edit_nonce' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$allowed_statuses = array( '', 'new', 'popular', 'featured' );
		if ( isset( $_POST['ha_status_quick'] ) && in_array( $_POST['ha_status_quick'], $allowed_statuses, true ) ) {
			$status_val = sanitize_key( wp_unslash( $_POST['ha_status_quick'] ) );
			if ( '' === $status_val ) {
				delete_post_meta( $post_id, '_ha_status' );
			} else {
				update_post_meta( $post_id, '_ha_status', $status_val );
			}
		}
	}

	/**
	 * Inject JavaScript to populate quick-edit from the current row data.
	 *
	 * @return void
	 */
	public static function quick_edit_script() {
		$screen = get_current_screen();
		if ( ! $screen || 'ha_site' !== $screen->post_type || 'edit' !== $screen->base ) {
			return;
		}
		?>
		<script>
		(function () {
			var init = wp.hooks ? wp.hooks.addAction : null;
			document.addEventListener('click', function (e) {
				var btn = e.target.closest('.editinline');
				if (!btn) return;
				var row = btn.closest('tr');
				if (!row) return;
				var statusEl = row.querySelector('.ha-status-data');
				var status = statusEl ? statusEl.getAttribute('data-status') : '';
				setTimeout(function () {
					var sel = document.getElementById('ha-quick-status');
					if (sel) sel.value = status || '';
				}, 50);
			});
		})();
		</script>
		<?php
	}
}
