<?php
/**
 * REST API.
 *
 * @package HarfehavalSitesPro
 */

defined( 'ABSPATH' ) || exit;

class HA_Sites_Pro_REST {

	const NAMESPACE = 'ha-sites-pro/v1';

	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE,
			'/sites',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'sites' ),
				'permission_callback' => '__return_true',
				'args'                => self::site_args(),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/sites/(?P<id>\d+)/view',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'track_view' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'id' => array( 'sanitize_callback' => 'absint' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/sites/(?P<id>\d+)/rate',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'rate_site' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'id'     => array( 'sanitize_callback' => 'absint' ),
					'rating' => array( 'sanitize_callback' => 'absint' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/filters',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'filters' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	private static function site_args() {
		return array(
			'page'     => array( 'default' => 1, 'sanitize_callback' => 'absint' ),
			'per_page' => array( 'default' => 12, 'sanitize_callback' => array( __CLASS__, 'sanitize_per_page' ) ),
			'search'   => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'category' => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'features' => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
			'status'   => array( 'default' => '', 'sanitize_callback' => 'sanitize_key' ),
			'sort'     => array( 'default' => 'newest', 'sanitize_callback' => 'sanitize_key' ),
		);
	}

	public static function track_view( WP_REST_Request $request ) {
		$post_id = absint( $request->get_param( 'id' ) );
		$post    = get_post( $post_id );
		if ( ! $post || HA_Sites_Pro_Post_Type::POST_TYPE !== $post->post_type || 'publish' !== $post->post_status ) {
			return new WP_Error( 'not_found', 'Post not found', array( 'status' => 404 ) );
		}
		$count = (int) get_post_meta( $post_id, '_ha_view_count', true );
		$count++;
		update_post_meta( $post_id, '_ha_view_count', $count );
		return rest_ensure_response( array( 'view_count' => $count ) );
	}

	public static function rate_site( WP_REST_Request $request ) {
		$post_id = absint( $request->get_param( 'id' ) );
		$rating  = max( 1, min( 5, absint( $request->get_param( 'rating' ) ) ) );
		$post    = get_post( $post_id );
		if ( ! $post || HA_Sites_Pro_Post_Type::POST_TYPE !== $post->post_type || 'publish' !== $post->post_status ) {
			return new WP_Error( 'not_found', 'Post not found', array( 'status' => 404 ) );
		}
		$sum   = (float) get_post_meta( $post_id, '_ha_user_rating_sum', true );
		$count = (int)   get_post_meta( $post_id, '_ha_user_rating_count', true );
		$sum   += $rating;
		$count += 1;
		update_post_meta( $post_id, '_ha_user_rating_sum',   $sum );
		update_post_meta( $post_id, '_ha_user_rating_count', $count );
		$avg = round( $sum / $count, 1 );
		return rest_ensure_response( array( 'avg' => $avg, 'count' => $count ) );
	}

	public static function sanitize_per_page( $value ) {
		return max( 1, min( 60, absint( $value ) ) );
	}

	/**
	 * Resolve a list of slugs (possibly Persian / percent-encoded / decoded) to numeric term IDs.
	 * Matching by term_id in WP_Query is encoding-proof, unlike matching by slug.
	 */
	private static function resolve_term_ids( $taxonomy, $slugs ) {
		$ids = array();
		foreach ( (array) $slugs as $raw ) {
			$slug = sanitize_text_field( trim( (string) $raw ) );
			if ( '' === $slug ) {
				continue;
			}
			$variants = array_unique( array( $slug, rawurldecode( $slug ), urldecode( $slug ), rawurlencode( $slug ) ) );
			$term = false;
			foreach ( $variants as $variant ) {
				$term = get_term_by( 'slug', $variant, $taxonomy );
				if ( $term && ! is_wp_error( $term ) ) {
					break;
				}
			}
			// Last resort: match by visible name.
			if ( ! $term || is_wp_error( $term ) ) {
				$term = get_term_by( 'name', $slug, $taxonomy );
			}
			if ( $term && ! is_wp_error( $term ) ) {
				$ids[] = (int) $term->term_id;
			}
		}
		return array_values( array_unique( $ids ) );
	}

	public static function sites( WP_REST_Request $request ) {
		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = self::sanitize_per_page( $request->get_param( 'per_page' ) );
		$search   = (string) $request->get_param( 'search' );
		$category = (string) $request->get_param( 'category' );
		$features = (string) $request->get_param( 'features' );
		$status   = (string) $request->get_param( 'status' );
		$sort     = (string) $request->get_param( 'sort' );
		$allowed_sorts = array( 'newest', 'oldest', 'price_asc', 'price_desc', 'popular', 'rating', 'most_viewed' );
		if ( ! in_array( $sort, $allowed_sorts, true ) ) { $sort = 'newest'; }

		$args = array(
			'post_type'      => HA_Sites_Pro_Post_Type::POST_TYPE,
			'post_status'    => 'publish',
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'no_found_rows'  => false,
		);

		if ( '' !== $search ) {
			$args['s'] = $search;
		}

		$tax_query = array();
		if ( '' !== $category ) {
			$cat_ids = self::resolve_term_ids( HA_Sites_Pro_Post_Type::TAX_CATEGORY, explode( ',', $category ) );
			if ( $cat_ids ) {
				$tax_query[] = array(
					'taxonomy' => HA_Sites_Pro_Post_Type::TAX_CATEGORY,
					'field'    => 'term_id',
					'terms'    => $cat_ids,
					'operator' => 'IN',
				);
			}
		}
		if ( '' !== $features ) {
			$feature_ids = self::resolve_term_ids( HA_Sites_Pro_Post_Type::TAX_FEATURE, explode( ',', $features ) );
			foreach ( $feature_ids as $fid ) {
				$tax_query[] = array(
					'taxonomy' => HA_Sites_Pro_Post_Type::TAX_FEATURE,
					'field'    => 'term_id',
					'terms'    => array( $fid ),
					'operator' => 'IN',
				);
			}
		}
		if ( $tax_query ) {
			$tax_query['relation'] = 'AND';
			$args['tax_query'] = $tax_query; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
		}

		$meta_query = array();
		if ( '' !== $status ) {
			$allowed = array( 'new', 'popular', 'featured', 'premium' );
			if ( in_array( $status, $allowed, true ) ) {
				$meta_query[] = array( 'key' => '_ha_status', 'value' => $status, 'compare' => '=' );
			}
		}

		switch ( $sort ) {
			case 'oldest':
				$args['orderby'] = 'date';
				$args['order'] = 'ASC';
				break;
			case 'price_asc':
				$args['meta_key'] = '_ha_price'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				$args['orderby'] = 'meta_value_num';
				$args['order'] = 'ASC';
				$meta_query[] = array( 'key' => '_ha_price', 'compare' => 'EXISTS' );
				break;
			case 'price_desc':
				$args['meta_key'] = '_ha_price'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				$args['orderby'] = 'meta_value_num';
				$args['order'] = 'DESC';
				$meta_query[] = array( 'key' => '_ha_price', 'compare' => 'EXISTS' );
				break;
			case 'popular':
				$args['meta_key'] = '_ha_sort_order'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				$args['orderby'] = 'meta_value_num';
				$args['order'] = 'ASC';
				break;
			case 'rating':
				$args['meta_key'] = '_ha_rating'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				$args['orderby'] = 'meta_value_num';
				$args['order'] = 'DESC';
				break;
			case 'most_viewed':
				$args['meta_key'] = '_ha_view_count'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				$args['orderby'] = 'meta_value_num';
				$args['order'] = 'DESC';
				break;
			case 'newest':
			default:
				$args['orderby'] = 'date';
				$args['order'] = 'DESC';
		}

		if ( $meta_query ) {
			$meta_query['relation'] = 'AND';
			$args['meta_query'] = $meta_query; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
		}

		$query = new WP_Query( $args );
		$items = array_map( array( __CLASS__, 'format_post' ), $query->posts );

		$response = rest_ensure_response(
			array(
				'items'       => $items,
				'total'       => (int) $query->found_posts,
				'total_pages' => (int) $query->max_num_pages,
				'page'        => $page,
			)
		);
		$response->header( 'X-WP-Total', (int) $query->found_posts );
		$response->header( 'X-WP-TotalPages', (int) $query->max_num_pages );
		/* Short-lived shared cache for CDN/proxy on non-authenticated requests */
		if ( ! is_user_logged_in() ) {
			$response->header( 'Cache-Control', 'public, max-age=120, s-maxage=120' );
		}
		return $response;
	}

	public static function filters() {
		$categories = self::terms( HA_Sites_Pro_Post_Type::TAX_CATEGORY, 'name', 'ASC' );
		$features   = self::terms( HA_Sites_Pro_Post_Type::TAX_FEATURE, 'count', 'DESC' );
		$response   = rest_ensure_response( array( 'categories' => $categories, 'features' => $features ) );
		if ( ! is_user_logged_in() ) {
			$response->header( 'Cache-Control', 'public, max-age=300, s-maxage=300' );
		}
		return $response;
	}

	private static function terms( $taxonomy, $orderby, $order ) {
		$terms = get_terms( array( 'taxonomy' => $taxonomy, 'hide_empty' => true, 'orderby' => $orderby, 'order' => $order ) );
		if ( is_wp_error( $terms ) ) {
			return array();
		}
		$out = array();
		foreach ( $terms as $term ) {
			$out[] = array( 'slug' => $term->slug, 'name' => $term->name, 'count' => (int) $term->count );
		}
		return $out;
	}

	public static function format_post( $post ) {
		$post_id = $post->ID;
		$thumb = '';
		$thumb_srcset = '';
		$thumb_sizes = '(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw';
		$thumb_alt = get_the_title( $post );
		if ( has_post_thumbnail( $post_id ) ) {
			$thumb = get_the_post_thumbnail_url( $post_id, 'full' );
			$thumb_srcset = wp_get_attachment_image_srcset( get_post_thumbnail_id( $post_id ), 'full' );
			$alt = get_post_meta( get_post_thumbnail_id( $post_id ), '_wp_attachment_image_alt', true );
			if ( $alt ) {
				$thumb_alt = $alt;
			}
		}
		$excerpt = $post->post_excerpt ? wp_strip_all_tags( $post->post_excerpt ) : wp_trim_words( wp_strip_all_tags( $post->post_content ), 24, '…' );
		$cats = self::format_terms( $post_id, HA_Sites_Pro_Post_Type::TAX_CATEGORY );
		$features = self::format_terms( $post_id, HA_Sites_Pro_Post_Type::TAX_FEATURE );

		return array(
			'id'          => $post_id,
			'title'       => get_the_title( $post ),
			'excerpt'     => $excerpt,
			'thumb'       => $thumb,
			'thumb_srcset'=> $thumb_srcset ? $thumb_srcset : '',
			'thumb_sizes' => $thumb_sizes,
			'thumb_alt'   => $thumb_alt,
			'code'        => (string) get_post_meta( $post_id, '_ha_code', true ),
			'price'       => self::meta_int_or_null( $post_id, '_ha_price' ),
			'old_price'   => self::meta_int_or_null( $post_id, '_ha_old_price' ),
			'demo_url'    => esc_url_raw( get_post_meta( $post_id, '_ha_demo_url', true ) ),
			'order_url'   => esc_url_raw( get_post_meta( $post_id, '_ha_order_url', true ) ),
			'status'      => (string) get_post_meta( $post_id, '_ha_status', true ),
			'rating'      => (float) get_post_meta( $post_id, '_ha_rating', true ),
			'installment'  => (string) get_post_meta( $post_id, '_ha_installment', true ),
			'delivery'     => (string) get_post_meta( $post_id, '_ha_delivery', true ),
			'highlight'    => (string) get_post_meta( $post_id, '_ha_highlight', true ),
			'project_type' => (string) get_post_meta( $post_id, '_ha_project_type', true ),
			'pages_count'  => (string) get_post_meta( $post_id, '_ha_pages_count', true ),
			'support'      => (string) get_post_meta( $post_id, '_ha_support', true ),
			'tech_stack'   => (string) get_post_meta( $post_id, '_ha_tech_stack', true ),
			'tabs'         => self::format_tabs( $post_id, $post ),
			'categories'   => $cats,
			'features'    => $features,
			'view_count'   => (int) get_post_meta( $post_id, '_ha_view_count', true ),
			'user_rating_avg'   => (float) get_post_meta( $post_id, '_ha_user_rating_sum', true )   > 0 ? round( (float) get_post_meta( $post_id, '_ha_user_rating_sum', true ) / max( 1, (int) get_post_meta( $post_id, '_ha_user_rating_count', true ) ), 1 ) : 0,
			'user_rating_count' => (int) get_post_meta( $post_id, '_ha_user_rating_count', true ),
		);
	}

	private static function format_tabs( $post_id, $post ) {
		$tabs = get_post_meta( $post_id, '_ha_preview_tabs', true );
		$out  = array();

		if ( is_array( $tabs ) ) {
			foreach ( $tabs as $tab ) {
				if ( ! is_array( $tab ) ) {
					continue;
				}
				$enabled = isset( $tab['enabled'] ) ? (string) $tab['enabled'] : '1';
				if ( '0' === $enabled ) {
					continue;
				}
				$label   = isset( $tab['label'] ) ? sanitize_text_field( $tab['label'] ) : '';
				$summary = isset( $tab['summary'] ) ? (string) $tab['summary'] : '';
				$content = isset( $tab['content'] ) ? (string) $tab['content'] : '';
				if ( '' === $label && '' === trim( wp_strip_all_tags( $summary ) ) && '' === trim( wp_strip_all_tags( $content ) ) ) {
					continue;
				}
				$out[] = array(
					'label'   => $label ? $label : __( 'تب', 'harfehaval-sites-pro' ),
					'summary' => self::process_tab_html( $summary ),
					'content' => self::process_tab_html( $content ),
				);
			}
		}

		if ( ! $out ) {
			$excerpt = $post->post_excerpt ? wp_strip_all_tags( $post->post_excerpt ) : wp_trim_words( wp_strip_all_tags( $post->post_content ), 32, '…' );
			if ( $excerpt ) {
				$out[] = array(
					'label'   => __( 'خلاصه', 'harfehaval-sites-pro' ),
					'summary' => '<p>' . esc_html( $excerpt ) . '</p>',
					'content' => '',
				);
			}
		}

		return $out;
	}

	private static function process_tab_html( $html ) {
		$html = trim( (string) $html );
		if ( '' === $html ) {
			return '';
		}
		$html = do_shortcode( wpautop( $html ) );
		return wp_kses_post( $html );
	}

	private static function meta_int_or_null( $post_id, $key ) {
		$value = get_post_meta( $post_id, $key, true );
		return '' === $value ? null : (int) $value;
	}

	private static function format_terms( $post_id, $taxonomy ) {
		$terms = get_the_terms( $post_id, $taxonomy );
		if ( ! $terms || is_wp_error( $terms ) ) {
			return array();
		}
		$out = array();
		foreach ( $terms as $term ) {
			$out[] = array( 'slug' => $term->slug, 'name' => $term->name );
		}
		return $out;
	}
}
