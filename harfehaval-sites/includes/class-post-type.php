<?php
/**
 * Custom Post Type, Taxonomies, and Meta Boxes
 *
 * @package HarfehavalSites
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class HA_Post_Type {

	/**
	 * Register all CPTs, taxonomies, and hooks.
	 */
	public static function register_all() {
		add_action( 'init', [ __CLASS__, 'register_post_type' ] );
		add_action( 'init', [ __CLASS__, 'register_taxonomies' ] );
		add_action( 'add_meta_boxes', [ __CLASS__, 'add_meta_boxes' ] );
		add_action( 'save_post_ha_site', [ __CLASS__, 'save_meta_box' ], 10, 2 );
	}

	/**
	 * Register ha_site Custom Post Type.
	 */
	public static function register_post_type() {
		$labels = [
			'name'                  => _x( 'سایت‌ها', 'Post type general name', 'harfehaval-sites' ),
			'singular_name'         => _x( 'سایت', 'Post type singular name', 'harfehaval-sites' ),
			'menu_name'             => _x( 'سایت‌های حرف اول', 'Admin Menu text', 'harfehaval-sites' ),
			'name_admin_bar'        => _x( 'سایت', 'Add New on Toolbar', 'harfehaval-sites' ),
			'add_new'               => __( 'افزودن سایت', 'harfehaval-sites' ),
			'add_new_item'          => __( 'افزودن سایت جدید', 'harfehaval-sites' ),
			'new_item'              => __( 'سایت جدید', 'harfehaval-sites' ),
			'edit_item'             => __( 'ویرایش سایت', 'harfehaval-sites' ),
			'view_item'             => __( 'مشاهده سایت', 'harfehaval-sites' ),
			'all_items'             => __( 'همه سایت‌ها', 'harfehaval-sites' ),
			'search_items'          => __( 'جستجوی سایت‌ها', 'harfehaval-sites' ),
			'not_found'             => __( 'سایتی یافت نشد.', 'harfehaval-sites' ),
			'not_found_in_trash'    => __( 'سایتی در سطل آشغال یافت نشد.', 'harfehaval-sites' ),
			'featured_image'        => __( 'تصویر شاخص سایت', 'harfehaval-sites' ),
			'set_featured_image'    => __( 'تنظیم تصویر شاخص', 'harfehaval-sites' ),
			'remove_featured_image' => __( 'حذف تصویر شاخص', 'harfehaval-sites' ),
			'use_featured_image'    => __( 'استفاده به عنوان تصویر شاخص', 'harfehaval-sites' ),
		];

		$args = [
			'labels'             => $labels,
			'public'             => false,
			'publicly_queryable' => false,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'query_var'          => false,
			'rewrite'            => false,
			'capability_type'    => 'post',
			'has_archive'        => false,
			'hierarchical'       => false,
			'menu_position'      => 20,
			'menu_icon'          => 'dashicons-layout',
			'supports'           => [ 'title', 'thumbnail', 'excerpt' ],
			'show_in_rest'       => true,
			'rest_base'          => 'ha_sites',
		];

		register_post_type( 'ha_site', $args );
	}

	/**
	 * Register ha_category and ha_feature taxonomies.
	 */
	public static function register_taxonomies() {
		// Category taxonomy (hierarchical)
		$cat_labels = [
			'name'              => _x( 'دسته‌بندی‌ها', 'taxonomy general name', 'harfehaval-sites' ),
			'singular_name'     => _x( 'دسته‌بندی', 'taxonomy singular name', 'harfehaval-sites' ),
			'search_items'      => __( 'جستجوی دسته‌بندی‌ها', 'harfehaval-sites' ),
			'all_items'         => __( 'همه دسته‌بندی‌ها', 'harfehaval-sites' ),
			'parent_item'       => __( 'دسته‌بندی والد', 'harfehaval-sites' ),
			'parent_item_colon' => __( 'دسته‌بندی والد:', 'harfehaval-sites' ),
			'edit_item'         => __( 'ویرایش دسته‌بندی', 'harfehaval-sites' ),
			'update_item'       => __( 'بروزرسانی دسته‌بندی', 'harfehaval-sites' ),
			'add_new_item'      => __( 'افزودن دسته‌بندی جدید', 'harfehaval-sites' ),
			'new_item_name'     => __( 'نام دسته‌بندی جدید', 'harfehaval-sites' ),
			'menu_name'         => __( 'دسته‌بندی‌ها', 'harfehaval-sites' ),
		];

		register_taxonomy( 'ha_category', 'ha_site', [
			'hierarchical'      => true,
			'labels'            => $cat_labels,
			'show_ui'           => true,
			'show_admin_column' => true,
			'query_var'         => false,
			'rewrite'           => false,
			'show_in_rest'      => true,
			'rest_base'         => 'ha_category',
		] );

		// Feature taxonomy (non-hierarchical / tag-like)
		$feat_labels = [
			'name'                       => _x( 'ویژگی‌ها', 'taxonomy general name', 'harfehaval-sites' ),
			'singular_name'              => _x( 'ویژگی', 'taxonomy singular name', 'harfehaval-sites' ),
			'search_items'               => __( 'جستجوی ویژگی‌ها', 'harfehaval-sites' ),
			'popular_items'              => __( 'ویژگی‌های محبوب', 'harfehaval-sites' ),
			'all_items'                  => __( 'همه ویژگی‌ها', 'harfehaval-sites' ),
			'edit_item'                  => __( 'ویرایش ویژگی', 'harfehaval-sites' ),
			'update_item'                => __( 'بروزرسانی ویژگی', 'harfehaval-sites' ),
			'add_new_item'               => __( 'افزودن ویژگی جدید', 'harfehaval-sites' ),
			'new_item_name'              => __( 'نام ویژگی جدید', 'harfehaval-sites' ),
			'separate_items_with_commas' => __( 'با کاما جدا کنید', 'harfehaval-sites' ),
			'add_or_remove_items'        => __( 'افزودن یا حذف ویژگی‌ها', 'harfehaval-sites' ),
			'choose_from_most_used'      => __( 'انتخاب از پرکاربردها', 'harfehaval-sites' ),
			'menu_name'                  => __( 'ویژگی‌ها', 'harfehaval-sites' ),
		];

		register_taxonomy( 'ha_feature', 'ha_site', [
			'hierarchical'      => false,
			'labels'            => $feat_labels,
			'show_ui'           => true,
			'show_admin_column' => true,
			'query_var'         => false,
			'rewrite'           => false,
			'show_in_rest'      => true,
			'rest_base'         => 'ha_feature',
		] );
	}

	/**
	 * Add meta box for site details.
	 */
	public static function add_meta_boxes() {
		add_meta_box(
			'ha_site_details',
			__( 'جزئیات سایت', 'harfehaval-sites' ),
			[ __CLASS__, 'render_meta_box' ],
			'ha_site',
			'normal',
			'high'
		);
	}

	/**
	 * Render meta box HTML.
	 *
	 * @param WP_Post $post Current post object.
	 */
	public static function render_meta_box( $post ) {
		wp_nonce_field( 'ha_save_site_meta', 'ha_site_meta_nonce' );

		$price      = get_post_meta( $post->ID, '_ha_price', true );
		$demo_url   = get_post_meta( $post->ID, '_ha_demo_url', true );
		$status     = get_post_meta( $post->ID, '_ha_status', true );
		$sort_order = get_post_meta( $post->ID, '_ha_sort_order', true );
		?>
		<div class="ha-meta-box">
			<div class="ha-meta-row">
				<label for="ha_price"><?php esc_html_e( 'قیمت (تومان)', 'harfehaval-sites' ); ?></label>
				<div>
					<input
						type="number"
						id="ha_price"
						name="ha_price"
						value="<?php echo esc_attr( $price ); ?>"
						min="0"
						step="1000"
						placeholder="<?php esc_attr_e( 'خالی = تماس بگیرید', 'harfehaval-sites' ); ?>"
						class="regular-text"
					>
					<p class="description"><?php esc_html_e( 'مبلغ را به تومان وارد کنید. خالی گذاشتن یعنی "تماس بگیرید".', 'harfehaval-sites' ); ?></p>
				</div>
			</div>

			<div class="ha-meta-row">
				<label for="ha_demo_url"><?php esc_html_e( 'آدرس دمو', 'harfehaval-sites' ); ?></label>
				<div>
					<input
						type="url"
						id="ha_demo_url"
						name="ha_demo_url"
						value="<?php echo esc_url( $demo_url ); ?>"
						placeholder="https://demo.example.com"
						class="regular-text"
					>
					<p class="description"><?php esc_html_e( 'آدرس کامل پیش‌نمایش سایت.', 'harfehaval-sites' ); ?></p>
				</div>
			</div>

			<div class="ha-meta-row">
				<label for="ha_status"><?php esc_html_e( 'وضعیت', 'harfehaval-sites' ); ?></label>
				<div>
					<select id="ha_status" name="ha_status">
						<option value="" <?php selected( $status, '' ); ?>><?php esc_html_e( '— عادی —', 'harfehaval-sites' ); ?></option>
						<option value="new" <?php selected( $status, 'new' ); ?>><?php esc_html_e( '✨ جدید', 'harfehaval-sites' ); ?></option>
						<option value="popular" <?php selected( $status, 'popular' ); ?>><?php esc_html_e( '🔥 پرفروش', 'harfehaval-sites' ); ?></option>
						<option value="featured" <?php selected( $status, 'featured' ); ?>><?php esc_html_e( '⭐ ویژه', 'harfehaval-sites' ); ?></option>
					</select>
					<p class="description"><?php esc_html_e( 'برچسب وضعیت روی کارت سایت نمایش داده می‌شود.', 'harfehaval-sites' ); ?></p>
				</div>
			</div>

			<div class="ha-meta-row">
				<label for="ha_sort_order"><?php esc_html_e( 'ترتیب نمایش', 'harfehaval-sites' ); ?></label>
				<div>
					<input
						type="number"
						id="ha_sort_order"
						name="ha_sort_order"
						value="<?php echo esc_attr( $sort_order ); ?>"
						min="0"
						step="1"
						placeholder="0"
						class="small-text"
					>
					<p class="description"><?php esc_html_e( 'عدد کمتر = نمایش اول. برای مرتب‌سازی دستی.', 'harfehaval-sites' ); ?></p>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Save meta box data.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 */
	public static function save_meta_box( $post_id, $post ) {
		// Nonce check
		if (
			! isset( $_POST['ha_site_meta_nonce'] ) ||
			! wp_verify_nonce( sanitize_key( $_POST['ha_site_meta_nonce'] ), 'ha_save_site_meta' )
		) {
			return;
		}

		// Auto-save check
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		// Permissions check
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		// Price
		if ( isset( $_POST['ha_price'] ) && $_POST['ha_price'] !== '' ) {
			$price = absint( $_POST['ha_price'] );
			update_post_meta( $post_id, '_ha_price', $price );
		} else {
			delete_post_meta( $post_id, '_ha_price' );
		}

		// Demo URL
		if ( isset( $_POST['ha_demo_url'] ) ) {
			$demo_url = esc_url_raw( trim( $_POST['ha_demo_url'] ) );
			if ( $demo_url ) {
				update_post_meta( $post_id, '_ha_demo_url', $demo_url );
			} else {
				delete_post_meta( $post_id, '_ha_demo_url' );
			}
		}

		// Status
		$allowed_statuses = [ '', 'new', 'popular', 'featured' ];
		if ( isset( $_POST['ha_status'] ) && in_array( $_POST['ha_status'], $allowed_statuses, true ) ) {
			update_post_meta( $post_id, '_ha_status', sanitize_key( $_POST['ha_status'] ) );
		}

		// Sort order
		if ( isset( $_POST['ha_sort_order'] ) && $_POST['ha_sort_order'] !== '' ) {
			update_post_meta( $post_id, '_ha_sort_order', absint( $_POST['ha_sort_order'] ) );
		} else {
			update_post_meta( $post_id, '_ha_sort_order', 0 );
		}
	}
}
