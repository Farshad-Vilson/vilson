<?php
/**
 * CPT, taxonomies, meta fields.
 *
 * @package HarfehavalSitesPro
 */

defined( 'ABSPATH' ) || exit;

class HA_Sites_Pro_Post_Type {

	const POST_TYPE = 'ha_site';
	const TAX_CATEGORY = 'ha_category';
	const TAX_FEATURE = 'ha_feature';
	const NONCE_ACTION = 'ha_sites_pro_save_meta';
	const NONCE_FIELD = 'ha_sites_pro_meta_nonce';

	public static function register() {
		self::register_post_type();
		self::register_taxonomies();
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_meta_boxes' ) );
		add_action( 'save_post_' . self::POST_TYPE, array( __CLASS__, 'save_meta' ), 10, 2 );
		add_filter( 'manage_' . self::POST_TYPE . '_posts_columns', array( __CLASS__, 'columns' ) );
		add_action( 'manage_' . self::POST_TYPE . '_posts_custom_column', array( __CLASS__, 'column_content' ), 10, 2 );
		add_filter( 'manage_edit-' . self::POST_TYPE . '_sortable_columns', array( __CLASS__, 'sortable_columns' ) );
	}

	private static function register_post_type() {
		$labels = array(
			'name'               => __( 'سایت‌ها', 'harfehaval-sites-pro' ),
			'singular_name'      => __( 'سایت', 'harfehaval-sites-pro' ),
			'menu_name'          => __( 'سایت‌های حرف اول', 'harfehaval-sites-pro' ),
			'add_new'            => __( 'افزودن سایت', 'harfehaval-sites-pro' ),
			'add_new_item'       => __( 'افزودن سایت جدید', 'harfehaval-sites-pro' ),
			'edit_item'          => __( 'ویرایش سایت', 'harfehaval-sites-pro' ),
			'new_item'           => __( 'سایت جدید', 'harfehaval-sites-pro' ),
			'all_items'          => __( 'همه سایت‌ها', 'harfehaval-sites-pro' ),
			'search_items'       => __( 'جستجوی سایت‌ها', 'harfehaval-sites-pro' ),
			'not_found'          => __( 'سایتی یافت نشد.', 'harfehaval-sites-pro' ),
			'featured_image'     => __( 'تصویر کارت سایت', 'harfehaval-sites-pro' ),
			'set_featured_image' => __( 'تنظیم تصویر کارت', 'harfehaval-sites-pro' ),
		);

		register_post_type(
			self::POST_TYPE,
			array(
				'labels'             => $labels,
				'public'             => false,
				'publicly_queryable' => false,
				'show_ui'            => true,
				'show_in_menu'       => true,
				'show_in_rest'       => true,
				'menu_icon'          => 'dashicons-layout',
				'menu_position'      => 22,
				'supports'           => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
				'capability_type'    => 'post',
				'has_archive'        => false,
				'rewrite'            => false,
				'query_var'          => false,
			)
		);
	}

	private static function register_taxonomies() {
		register_taxonomy(
			self::TAX_CATEGORY,
			array( self::POST_TYPE ),
			array(
				'hierarchical'      => true,
				'labels'            => array(
					'name'          => __( 'دسته‌بندی‌ها', 'harfehaval-sites-pro' ),
					'singular_name' => __( 'دسته‌بندی', 'harfehaval-sites-pro' ),
					'menu_name'     => __( 'دسته‌بندی‌ها', 'harfehaval-sites-pro' ),
				),
				'show_ui'           => true,
				'show_admin_column' => true,
				'show_in_rest'      => true,
				'query_var'         => false,
				'rewrite'           => false,
			)
		);

		register_taxonomy(
			self::TAX_FEATURE,
			array( self::POST_TYPE ),
			array(
				'hierarchical'      => false,
				'labels'            => array(
					'name'          => __( 'ویژگی‌ها', 'harfehaval-sites-pro' ),
					'singular_name' => __( 'ویژگی', 'harfehaval-sites-pro' ),
					'menu_name'     => __( 'ویژگی‌ها', 'harfehaval-sites-pro' ),
				),
				'show_ui'           => true,
				'show_admin_column' => true,
				'show_in_rest'      => true,
				'query_var'         => false,
				'rewrite'           => false,
			)
		);
	}

	public static function add_meta_boxes() {
		add_meta_box(
			'ha_sites_pro_details',
			__( 'جزئیات حرفه‌ای سایت', 'harfehaval-sites-pro' ),
			array( __CLASS__, 'render_meta_box' ),
			self::POST_TYPE,
			'normal',
			'high'
		);

		add_meta_box(
			'ha_sites_pro_preview_tabs',
			__( 'تب‌های دلخواه پیش‌نمایش و توضیحات', 'harfehaval-sites-pro' ),
			array( __CLASS__, 'render_tabs_meta_box' ),
			self::POST_TYPE,
			'normal',
			'default'
		);
	}

	public static function meta_schema() {
		return array(
			'_ha_code'        => array( 'label' => 'کد قالب', 'type' => 'text', 'sanitize' => 'sanitize_text_field', 'placeholder' => 'مثلاً k005 یا s023' ),
			'_ha_price'       => array( 'label' => 'قیمت', 'type' => 'number', 'sanitize' => 'absint', 'placeholder' => 'مثلاً 8900000' ),
			'_ha_old_price'   => array( 'label' => 'قیمت قبل از تخفیف', 'type' => 'number', 'sanitize' => 'absint', 'placeholder' => 'اختیاری' ),
			'_ha_demo_url'    => array( 'label' => 'آدرس دمو', 'type' => 'url', 'sanitize' => 'esc_url_raw', 'placeholder' => 'https://demo.example.com' ),
			'_ha_order_url'   => array( 'label' => 'لینک سفارش اختصاصی', 'type' => 'url', 'sanitize' => 'esc_url_raw', 'placeholder' => 'اختیاری؛ اگر خالی باشد واتساپ استفاده می‌شود' ),
			'_ha_status'      => array( 'label' => 'برچسب وضعیت', 'type' => 'select', 'sanitize' => 'sanitize_key' ),
			'_ha_sort_order'  => array( 'label' => 'ترتیب نمایش', 'type' => 'number', 'sanitize' => 'absint', 'placeholder' => '0' ),
			'_ha_rating'      => array( 'label' => 'امتیاز', 'type' => 'number', 'sanitize' => 'float', 'placeholder' => '4.9' ),
			'_ha_installment' => array( 'label' => 'متن پرداخت/اقساط', 'type' => 'text', 'sanitize' => 'sanitize_text_field', 'placeholder' => 'مثلاً پرداخت مرحله‌ای' ),
			'_ha_delivery'     => array( 'label' => 'زمان تحویل', 'type' => 'text', 'sanitize' => 'sanitize_text_field', 'placeholder' => 'مثلاً ۷ تا ۱۴ روز کاری' ),
			'_ha_highlight'    => array( 'label' => 'مزیت کلیدی', 'type' => 'text', 'sanitize' => 'sanitize_text_field', 'placeholder' => 'مثلاً مناسب کلینیک‌های چندپزشکه' ),
			'_ha_project_type' => array( 'label' => 'نوع پروژه', 'type' => 'text', 'sanitize' => 'sanitize_text_field', 'placeholder' => 'پزشکی، آموزشی، فروشگاهی...' ),
			'_ha_pages_count'  => array( 'label' => 'تعداد صفحات/بخش‌ها', 'type' => 'text', 'sanitize' => 'sanitize_text_field', 'placeholder' => 'مثلاً ۸ صفحه اصلی' ),
			'_ha_support'      => array( 'label' => 'پشتیبانی', 'type' => 'text', 'sanitize' => 'sanitize_text_field', 'placeholder' => 'مثلاً ۳۰ روز پشتیبانی' ),
			'_ha_tech_stack'   => array( 'label' => 'تکنولوژی/سازگاری', 'type' => 'text', 'sanitize' => 'sanitize_text_field', 'placeholder' => 'وردپرس، المنتور، ووکامرس، بوکلی...' ),
		);
	}

	public static function render_meta_box( $post ) {
		wp_nonce_field( self::NONCE_ACTION, self::NONCE_FIELD );
		$schema = self::meta_schema();
		?>
		<div class="ha-pro-admin-card">
			<p class="ha-pro-admin-help">⚡ همه این فیلدها در کارت، نوار کناری مودال پیش‌نمایش و سفارش واتساپ استفاده می‌شوند. هر فیلد را که خالی بگذارید نمایش داده نمی‌شود.</p>
				<p class="ha-pro-admin-help ha-pro-admin-help-soft">💡 برای ساخت <b>تب‌های اختصاصی</b> (امکانات، توضیحات، نقد و بررسی، گالری...) از باکس «تب‌های دلخواه پیش‌نمایش» پایین همین صفحه استفاده کنید — هر تعداد تب با HTML/شورت‌کد المنتور یا متن ساده.</p>
			<div class="ha-pro-meta-grid">
				<?php foreach ( $schema as $key => $field ) : ?>
					<?php $value = get_post_meta( $post->ID, $key, true ); ?>
					<label class="ha-pro-meta-field<?php echo '_ha_code' === $key ? ' ha-pro-meta-field--code' : ''; ?>" for="<?php echo esc_attr( $key ); ?>" style="<?php echo '_ha_code' === $key ? 'grid-column:1/-1;background:linear-gradient(90deg,#011627 0%,#06314f 100%);border-radius:8px;padding:12px 16px;color:#fff;' : ''; ?>">
						<span><?php echo esc_html( $field['label'] ); ?></span>
						<?php if ( '_ha_status' === $key ) : ?>
							<select id="<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $key ); ?>">
								<option value="" <?php selected( $value, '' ); ?>>عادی</option>
								<option value="new" <?php selected( $value, 'new' ); ?>>✨ جدید</option>
								<option value="popular" <?php selected( $value, 'popular' ); ?>>🔥 پرفروش</option>
								<option value="featured" <?php selected( $value, 'featured' ); ?>>⭐ ویژه</option>
								<option value="premium" <?php selected( $value, 'premium' ); ?>>💎 پریمیوم</option>
							</select>
						<?php else : ?>
							<input id="<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $key ); ?>" type="<?php echo esc_attr( $field['type'] ); ?>" value="<?php echo esc_attr( $value ); ?>" placeholder="<?php echo esc_attr( $field['placeholder'] ?? '' ); ?>" <?php echo 'number' === $field['type'] ? 'step="any" min="0"' : ''; ?>>
						<?php endif; ?>
					</label>
				<?php endforeach; ?>
			</div>
		</div>
		<?php
	}

	public static function default_preview_tabs() {
		return array(
			array(
				'label'   => __( 'خلاصه', 'harfehaval-sites-pro' ),
				'summary' => '',
				'content' => '',
				'enabled' => '1',
			),
			array(
				'label'   => __( 'امکانات', 'harfehaval-sites-pro' ),
				'summary' => '',
				'content' => '',
				'enabled' => '1',
			),
		);
	}

	public static function render_tabs_meta_box( $post ) {
		wp_nonce_field( self::NONCE_ACTION, self::NONCE_FIELD );
		$tabs = get_post_meta( $post->ID, '_ha_preview_tabs', true );
		if ( ! is_array( $tabs ) || empty( $tabs ) ) {
			$tabs = self::default_preview_tabs();
		}
		?>
		<div class="ha-pro-admin-tabs" id="ha-pro-admin-tabs">
			<p class="ha-pro-admin-help">
				<?php esc_html_e( 'اینجا می‌توانید برای پیش‌نمایش هر سایت هر تعداد تب با هر نامی بسازید. خلاصه در پنل کنار پیش‌نمایش نمایش داده می‌شود و محتوای کامل می‌تواند شامل متن، HTML، تصویر، و شورت‌کد المنتور باشد.', 'harfehaval-sites-pro' ); ?>
			</p>
			<p class="ha-pro-admin-help ha-pro-admin-help-soft">
				<?php esc_html_e( 'برای محتوای طراحی‌شده با المنتور می‌توانید از شورت‌کد قالب‌های ذخیره‌شده Elementor مثل [elementor-template id="123"] داخل محتوای تب استفاده کنید.', 'harfehaval-sites-pro' ); ?>
			</p>
			<div class="ha-pro-tabs-builder" data-ha-tabs-builder>
				<?php foreach ( $tabs as $i => $tab ) :
					$label   = isset( $tab['label'] ) ? $tab['label'] : '';
					$summary = isset( $tab['summary'] ) ? $tab['summary'] : '';
					$content = isset( $tab['content'] ) ? $tab['content'] : '';
					$enabled = isset( $tab['enabled'] ) ? $tab['enabled'] : '1';
					$editor_id = 'ha_preview_tab_content_' . $post->ID . '_' . $i;
					?>
					<div class="ha-pro-tab-row" data-ha-tab-row>
						<div class="ha-pro-tab-head">
							<strong><?php echo esc_html( sprintf( __( 'تب %d', 'harfehaval-sites-pro' ), $i + 1 ) ); ?></strong>
							<input type="text" name="_ha_preview_tabs[<?php echo esc_attr( $i ); ?>][label]" value="<?php echo esc_attr( $label ); ?>" placeholder="<?php esc_attr_e( 'نام تب؛ مثل امکانات، نقد و بررسی، توضیحات', 'harfehaval-sites-pro' ); ?>">
							<label><input type="checkbox" name="_ha_preview_tabs[<?php echo esc_attr( $i ); ?>][enabled]" value="1" <?php checked( $enabled, '1' ); ?>> <?php esc_html_e( 'فعال', 'harfehaval-sites-pro' ); ?></label>
							<button type="button" class="button ha-pro-remove-tab"><?php esc_html_e( 'حذف', 'harfehaval-sites-pro' ); ?></button>
						</div>
						<div class="ha-pro-tab-body">
							<label class="ha-pro-tab-field">
								<span><b><?php esc_html_e( 'خلاصه پیش‌نمایش', 'harfehaval-sites-pro' ); ?></b><?php esc_html_e( 'برای پنل کنار پیش‌نمایش', 'harfehaval-sites-pro' ); ?></span>
								<textarea name="_ha_preview_tabs[<?php echo esc_attr( $i ); ?>][summary]" rows="4" placeholder="<?php esc_attr_e( 'متن کوتاه و قابل اسکن برای پیش‌نمایش سریع...', 'harfehaval-sites-pro' ); ?>"><?php echo esc_textarea( $summary ); ?></textarea>
							</label>
							<div class="ha-pro-tab-field">
								<span><b><?php esc_html_e( 'محتوای کامل تب', 'harfehaval-sites-pro' ); ?></b><?php esc_html_e( 'متن، تصویر، HTML یا شورت‌کد', 'harfehaval-sites-pro' ); ?></span>
								<?php
								wp_editor(
									$content,
									$editor_id,
									array(
										'textarea_name' => '_ha_preview_tabs[' . $i . '][content]',
										'editor_height' => 180,
										'media_buttons' => true,
										'tinymce'       => true,
										'quicktags'     => true,
									)
								);
								?>
							</div>
						</div>
					</div>
				<?php endforeach; ?>
			</div>
			<p><button type="button" class="button button-primary" data-ha-add-tab>+ <?php esc_html_e( 'افزودن تب جدید', 'harfehaval-sites-pro' ); ?></button></p>
		</div>
		<script>
		jQuery(function($){
			var $builder = $('[data-ha-tabs-builder]');
			var index = $builder.find('[data-ha-tab-row]').length;
			$('#post').off('submit.haTabs').on('submit.haTabs', function(){ if (typeof tinyMCE !== 'undefined') { try { tinyMCE.triggerSave(); } catch(e){} } });
			$('[data-ha-add-tab]').off('click.haTabs').on('click.haTabs', function(){
				var i = index++;
				var row = '<div class="ha-pro-tab-row" data-ha-tab-row>' +
					'<div class="ha-pro-tab-head"><strong>تب جدید</strong>' +
					'<input type="text" name="_ha_preview_tabs[' + i + '][label]" placeholder="نام تب">' +
					'<label><input type="checkbox" name="_ha_preview_tabs[' + i + '][enabled]" value="1" checked> فعال</label>' +
					'<button type="button" class="button ha-pro-remove-tab">حذف</button></div>' +
					'<div class="ha-pro-tab-body"><label class="ha-pro-tab-field"><span><b>خلاصه پیش‌نمایش</b>برای پنل کنار پیش‌نمایش</span>' +
					'<textarea name="_ha_preview_tabs[' + i + '][summary]" rows="4" placeholder="متن کوتاه..."></textarea></label>' +
					'<label class="ha-pro-tab-field"><span><b>محتوای کامل تب</b>متن، HTML یا شورت‌کد المنتور</span>' +
					'<textarea name="_ha_preview_tabs[' + i + '][content]" rows="8" placeholder="محتوای کامل تب..."></textarea></label></div></div>';
				$builder.append(row);
			});
			$(document).off('click.haRemoveTab').on('click.haRemoveTab', '.ha-pro-remove-tab', function(){ $(this).closest('[data-ha-tab-row]').remove(); });
		});
		</script>
		<?php
	}

	private static function sanitize_tabs_from_request( $raw_tabs ) {
		$tabs = array();
		if ( ! is_array( $raw_tabs ) ) {
			return $tabs;
		}

		foreach ( $raw_tabs as $tab ) {
			if ( ! is_array( $tab ) ) {
				continue;
			}
			$label   = isset( $tab['label'] ) ? sanitize_text_field( wp_unslash( $tab['label'] ) ) : '';
			$summary = isset( $tab['summary'] ) ? wp_kses_post( wp_unslash( $tab['summary'] ) ) : '';
			$content = isset( $tab['content'] ) ? wp_kses_post( wp_unslash( $tab['content'] ) ) : '';
			$enabled = ! empty( $tab['enabled'] ) ? '1' : '0';
			if ( '' === $label && '' === trim( wp_strip_all_tags( $summary ) ) && '' === trim( wp_strip_all_tags( $content ) ) ) {
				continue;
			}
			$tabs[] = array(
				'label'   => $label ? $label : __( 'تب', 'harfehaval-sites-pro' ),
				'summary' => $summary,
				'content' => $content,
				'enabled' => $enabled,
			);
		}
		return $tabs;
	}

	public static function save_meta( $post_id, $post ) {
		if ( ! isset( $_POST[ self::NONCE_FIELD ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ self::NONCE_FIELD ] ) ), self::NONCE_ACTION ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		foreach ( self::meta_schema() as $key => $field ) {
			if ( ! isset( $_POST[ $key ] ) || '' === $_POST[ $key ] ) {
				delete_post_meta( $post_id, $key );
				continue;
			}
			$raw = wp_unslash( $_POST[ $key ] );
			switch ( $field['sanitize'] ) {
				case 'absint':
					$value = absint( $raw );
					break;
				case 'float':
					$value = max( 0, min( 5, (float) $raw ) );
					break;
				case 'esc_url_raw':
					$value = esc_url_raw( trim( $raw ) );
					break;
				case 'sanitize_key':
					$value = sanitize_key( $raw );
					$allowed = array( '', 'new', 'popular', 'featured', 'premium' );
					if ( ! in_array( $value, $allowed, true ) ) {
						$value = '';
					}
					break;
				default:
					$value = sanitize_text_field( $raw );
			}
			if ( '' === $value ) {
				delete_post_meta( $post_id, $key );
			} else {
				update_post_meta( $post_id, $key, $value );
			}
		}

		if ( isset( $_POST['_ha_preview_tabs'] ) ) {
			$tabs = self::sanitize_tabs_from_request( wp_unslash( $_POST['_ha_preview_tabs'] ) );
			if ( $tabs ) {
				update_post_meta( $post_id, '_ha_preview_tabs', $tabs );
			} else {
				delete_post_meta( $post_id, '_ha_preview_tabs' );
			}
		}
	}

	public static function columns( $columns ) {
		$new = array();
		foreach ( $columns as $key => $label ) {
			$new[ $key ] = $label;
			if ( 'title' === $key ) {
				$new['ha_code']   = __( 'کد قالب', 'harfehaval-sites-pro' );
				$new['ha_price']  = __( 'قیمت', 'harfehaval-sites-pro' );
				$new['ha_status'] = __( 'وضعیت', 'harfehaval-sites-pro' );
				$new['ha_demo']   = __( 'دمو', 'harfehaval-sites-pro' );
			}
		}
		return $new;
	}

	public static function column_content( $column, $post_id ) {
		switch ( $column ) {
			case 'ha_code':
				$code = get_post_meta( $post_id, '_ha_code', true );
				echo $code ? '<code style="background:#011627;color:#fff;padding:2px 8px;border-radius:5px;font-family:monospace;font-weight:700;font-size:12px;">' . esc_html( $code ) . '</code>' : '<span class="ha-muted">—</span>';
				break;
			case 'ha_price':
				$price = get_post_meta( $post_id, '_ha_price', true );
				echo $price ? '<strong>' . esc_html( number_format_i18n( (int) $price ) ) . '</strong>' : '<span class="ha-muted">تماس</span>';
				break;
			case 'ha_status':
				$status = get_post_meta( $post_id, '_ha_status', true );
				echo '<span class="ha-admin-badge ha-admin-badge-' . esc_attr( $status ? $status : 'normal' ) . '">' . esc_html( $status ? $status : 'normal' ) . '</span>';
				break;
			case 'ha_demo':
				$url = get_post_meta( $post_id, '_ha_demo_url', true );
				echo $url ? '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener">مشاهده ↗</a>' : '<span class="ha-muted">—</span>';
				break;
		}
	}

	public static function sortable_columns( $columns ) {
		$columns['ha_price'] = 'ha_price';
		return $columns;
	}
}
