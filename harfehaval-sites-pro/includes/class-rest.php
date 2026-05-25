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

	public static function sanitize_per_page( $value ) {
		return max( 1, min( 60, absint( $value ) ) );
	}

	public static function sites( WP_REST_Request $request ) {
		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = self::sanitize_per_page( $request->get_param( 'per_page' ) );
		$search   = (string) $request->get_param( 'search' );
		$category = (string) $request->get_param( 'category' );
		$features = (string) $request->get_param( 'features' );
		$status   = (string) $request->get_param( 'status' );
		$sort     = (string) $request->get_param( 'sort' );

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
			$terms = array_filter( array_map( 'sanitize_title', array_map( 'trim', explode( ',', $category ) ) ) );
			if ( $terms ) {
				$tax_query[] = array(
					'taxonomy' => HA_Sites_Pro_Post_Type::TAX_CATEGORY,
					'field'    => 'slug',
					'terms'    => $terms,
					'operator' => 'IN',
				);
			}
		}
		if ( '' !== $features ) {
			$terms = array_filter( array_map( 'sanitize_title', array_map( 'trim', explode( ',', $features ) ) ) );
			foreach ( $terms as $term ) {
				$tax_query[] = array(
					'taxonomy' => HA_Sites_Pro_Post_Type::TAX_FEATURE,
					'field'    => 'slug',
					'terms'    => array( $term ),
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
		return $response;
	}

	public static function filters() {
		$categories = self::terms( HA_Sites_Pro_Post_Type::TAX_CATEGORY, 'name', 'ASC' );
		$features = self::terms( HA_Sites_Pro_Post_Type::TAX_FEATURE, 'count', 'DESC' );
		return rest_ensure_response( array( 'categories' => $categories, 'features' => $features ) );
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
		$thumb_alt = get_the_title( $post );
		if ( has_post_thumbnail( $post_id ) ) {
			$thumb = get_the_post_thumbnail_url( $post_id, 'large' );
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
