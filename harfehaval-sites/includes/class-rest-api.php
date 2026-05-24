<?php
/**
 * REST API Endpoints
 *
 * @package HarfehavalSites
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class HA_Rest_API
 *
 * Provides REST API routes under the ha-sites/v1 namespace:
 *   GET /ha-sites/v1/sites   — paginated, filterable, sortable list of sites
 *   GET /ha-sites/v1/filters — available category and feature terms
 */
class HA_Rest_API {

	/**
	 * API namespace.
	 */
	const NAMESPACE = 'ha-sites/v1';

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		add_action( 'rest_api_init', array( __CLASS__, 'register' ) );
	}

	/**
	 * Register all routes.
	 *
	 * @return void
	 */
	public static function register() {
		register_rest_route(
			self::NAMESPACE,
			'/sites',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_sites' ),
				'permission_callback' => '__return_true',
				'args'                => self::sites_args(),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/filters',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_filters' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Define and validate args for /sites endpoint.
	 *
	 * @return array
	 */
	private static function sites_args() {
		return array(
			'page'     => array(
				'default'           => 1,
				'sanitize_callback' => 'absint',
				'validate_callback' => function ( $v ) {
					return is_numeric( $v ) && (int) $v >= 1;
				},
			),
			'per_page' => array(
				'default'           => 12,
				'sanitize_callback' => function ( $v ) {
					return min( 50, max( 1, absint( $v ) ) );
				},
			),
			'search'   => array(
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'category' => array(
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'features' => array(
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'sort'     => array(
				'default'           => 'newest',
				'sanitize_callback' => 'sanitize_key',
				'validate_callback' => function ( $v ) {
					return in_array( $v, array( 'newest', 'oldest', 'price_asc', 'price_desc', 'popular' ), true );
				},
			),
			'status'   => array(
				'default'           => '',
				'sanitize_callback' => 'sanitize_key',
				'validate_callback' => function ( $v ) {
					return in_array( $v, array( '', 'new', 'popular', 'featured' ), true );
				},
			),
		);
	}

	/**
	 * Handle GET /sites request.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public static function get_sites( WP_REST_Request $request ) {
		$page     = $request->get_param( 'page' );
		$per_page = $request->get_param( 'per_page' );
		$search   = $request->get_param( 'search' );
		$category = $request->get_param( 'category' );
		$features = $request->get_param( 'features' );
		$sort     = $request->get_param( 'sort' );
		$status   = $request->get_param( 'status' );

		$args = array(
			'post_type'      => 'ha_site',
			'post_status'    => 'publish',
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'no_found_rows'  => false,
		);

		// Search.
		if ( ! empty( $search ) ) {
			$args['s'] = $search;
		}

		// Taxonomy queries.
		$tax_query = array();

		// Category filter: comma-separated slugs = OR logic.
		if ( ! empty( $category ) ) {
			$cat_slugs = array_filter( array_map( 'trim', explode( ',', $category ) ) );
			if ( ! empty( $cat_slugs ) ) {
				$tax_query[] = array(
					'taxonomy' => 'ha_category',
					'field'    => 'slug',
					'terms'    => $cat_slugs,
					'operator' => 'IN',
				);
			}
		}

		// Features filter: comma-separated slugs = AND logic (all must match).
		if ( ! empty( $features ) ) {
			$feat_slugs = array_filter( array_map( 'trim', explode( ',', $features ) ) );
			foreach ( $feat_slugs as $slug ) {
				$tax_query[] = array(
					'taxonomy' => 'ha_feature',
					'field'    => 'slug',
					'terms'    => array( sanitize_key( $slug ) ),
					'operator' => 'IN',
				);
			}
		}

		if ( ! empty( $tax_query ) ) {
			if ( count( $tax_query ) > 1 ) {
				$tax_query['relation'] = 'AND';
			}
			$args['tax_query'] = $tax_query; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
		}

		// Status meta filter.
		if ( ! empty( $status ) ) {
			$args['meta_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				array(
					'key'     => '_ha_status',
					'value'   => $status,
					'compare' => '=',
				),
			);
		}

		// Sorting.
		switch ( $sort ) {
			case 'oldest':
				$args['orderby'] = 'date';
				$args['order']   = 'ASC';
				break;

			case 'price_asc':
				$args['meta_key'] = '_ha_price'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				$args['orderby']  = 'meta_value_num';
				$args['order']    = 'ASC';
				if ( empty( $args['meta_query'] ) ) {
					$args['meta_query'] = array( 'relation' => 'OR' ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				} else {
					$args['meta_query']['relation'] = 'AND';
				}
				$args['meta_query'][] = array(
					'key'     => '_ha_price',
					'compare' => 'EXISTS',
				);
				break;

			case 'price_desc':
				$args['meta_key'] = '_ha_price'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				$args['orderby']  = 'meta_value_num';
				$args['order']    = 'DESC';
				if ( empty( $args['meta_query'] ) ) {
					$args['meta_query'] = array( 'relation' => 'OR' ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				} else {
					$args['meta_query']['relation'] = 'AND';
				}
				$args['meta_query'][] = array(
					'key'     => '_ha_price',
					'compare' => 'EXISTS',
				);
				break;

			case 'popular':
				$args['meta_key'] = '_ha_sort_order'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				$args['orderby']  = 'meta_value_num';
				$args['order']    = 'ASC';
				break;

			case 'newest':
			default:
				$args['orderby'] = 'date';
				$args['order']   = 'DESC';
				break;
		}

		$query = new WP_Query( $args );

		$items = array();
		if ( $query->have_posts() ) {
			foreach ( $query->posts as $post ) {
				$items[] = self::format_site( $post );
			}
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', (int) $query->found_posts );
		$response->header( 'X-WP-TotalPages', (int) $query->max_num_pages );
		$response->header( 'X-WP-Page', (int) $page );

		return $response;
	}

	/**
	 * Handle GET /filters request.
	 * Returns all ha_category and ha_feature terms with counts.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public static function get_filters( WP_REST_Request $request ) {
		$categories = get_terms(
			array(
				'taxonomy'   => 'ha_category',
				'hide_empty' => true,
				'orderby'    => 'name',
				'order'      => 'ASC',
			)
		);

		$features = get_terms(
			array(
				'taxonomy'   => 'ha_feature',
				'hide_empty' => true,
				'orderby'    => 'count',
				'order'      => 'DESC',
			)
		);

		$formatted_cats = array();
		if ( ! is_wp_error( $categories ) ) {
			foreach ( $categories as $term ) {
				$formatted_cats[] = array(
					'slug'  => $term->slug,
					'name'  => $term->name,
					'count' => (int) $term->count,
				);
			}
		}

		$formatted_feats = array();
		if ( ! is_wp_error( $features ) ) {
			foreach ( $features as $term ) {
				$formatted_feats[] = array(
					'slug'  => $term->slug,
					'name'  => $term->name,
					'count' => (int) $term->count,
				);
			}
		}

		return rest_ensure_response(
			array(
				'categories' => $formatted_cats,
				'features'   => $formatted_feats,
			)
		);
	}

	/**
	 * Format a post into a site data array for the API response.
	 *
	 * @param WP_Post $post Post object.
	 * @return array
	 */
	public static function format_site( $post ) {
		$post_id = $post->ID;

		// Thumbnail.
		$thumb        = '';
		$thumb_srcset = '';
		if ( has_post_thumbnail( $post_id ) ) {
			$thumb_id  = get_post_thumbnail_id( $post_id );
			$thumb_arr = wp_get_attachment_image_src( $thumb_id, 'large' );
			if ( $thumb_arr ) {
				$thumb = $thumb_arr[0];
			}
			$srcset = wp_get_attachment_image_srcset( $thumb_id, 'large' );
			if ( $srcset ) {
				$thumb_srcset = $srcset;
			}
		}

		// Price: empty string or false means null (contact us).
		$price_raw = get_post_meta( $post_id, '_ha_price', true );
		$price     = ( '' !== $price_raw && false !== $price_raw ) ? (int) $price_raw : null;

		// Categories.
		$categories = array();
		$cat_terms  = get_the_terms( $post_id, 'ha_category' );
		if ( $cat_terms && ! is_wp_error( $cat_terms ) ) {
			foreach ( $cat_terms as $term ) {
				$categories[] = array(
					'slug' => $term->slug,
					'name' => $term->name,
				);
			}
		}

		// Features.
		$features   = array();
		$feat_terms = get_the_terms( $post_id, 'ha_feature' );
		if ( $feat_terms && ! is_wp_error( $feat_terms ) ) {
			foreach ( $feat_terms as $term ) {
				$features[] = array(
					'slug' => $term->slug,
					'name' => $term->name,
				);
			}
		}

		// Excerpt: prefer manual excerpt, fall back to content snippet.
		$excerpt = '';
		if ( ! empty( $post->post_excerpt ) ) {
			$excerpt = wp_strip_all_tags( $post->post_excerpt );
		} elseif ( ! empty( $post->post_content ) ) {
			$excerpt = wp_trim_words( wp_strip_all_tags( $post->post_content ), 30, '…' );
		}

		return array(
			'id'           => $post_id,
			'title'        => get_the_title( $post ),
			'excerpt'      => $excerpt,
			'thumb'        => $thumb,
			'thumb_srcset' => $thumb_srcset,
			'price'        => $price,
			'demo_url'     => (string) get_post_meta( $post_id, '_ha_demo_url', true ),
			'status'       => (string) get_post_meta( $post_id, '_ha_status', true ),
			'date_gmt'     => get_gmt_from_date( $post->post_date ),
			'categories'   => $categories,
			'features'     => $features,
		);
	}
}
