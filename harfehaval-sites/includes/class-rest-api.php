<?php
/**
 * REST API Endpoints
 *
 * @package HarfehavalSites
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class HA_Rest_API {

	const NAMESPACE = 'ha-sites/v1';

	/**
	 * Register REST routes.
	 */
	public static function register_routes() {
		add_action( 'rest_api_init', [ __CLASS__, 'register' ] );
	}

	/**
	 * Register all routes.
	 */
	public static function register() {
		register_rest_route( self::NAMESPACE, '/sites', [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [ __CLASS__, 'get_sites' ],
			'permission_callback' => '__return_true',
			'args'                => self::sites_args(),
		] );

		register_rest_route( self::NAMESPACE, '/filters', [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [ __CLASS__, 'get_filters' ],
			'permission_callback' => '__return_true',
		] );
	}

	/**
	 * Define args for /sites endpoint.
	 *
	 * @return array
	 */
	private static function sites_args() {
		return [
			'page'     => [
				'default'           => 1,
				'sanitize_callback' => 'absint',
				'validate_callback' => function( $v ) { return is_numeric( $v ) && $v >= 1; },
			],
			'per_page' => [
				'default'           => 12,
				'sanitize_callback' => function( $v ) { return min( 50, max( 1, absint( $v ) ) ); },
			],
			'search'   => [
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'category' => [
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'features' => [
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'sort'     => [
				'default'           => 'newest',
				'sanitize_callback' => 'sanitize_key',
				'validate_callback' => function( $v ) {
					return in_array( $v, [ 'newest', 'oldest', 'price_asc', 'price_desc', 'popular' ], true );
				},
			],
			'status'   => [
				'default'           => '',
				'sanitize_callback' => 'sanitize_key',
				'validate_callback' => function( $v ) {
					return in_array( $v, [ '', 'new', 'popular', 'featured' ], true );
				},
			],
		];
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

		$args = [
			'post_type'      => 'ha_site',
			'post_status'    => 'publish',
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'no_found_rows'  => false,
		];

		// Search
		if ( ! empty( $search ) ) {
			$args['s'] = $search;
		}

		// Taxonomy queries
		$tax_query = [];

		// Category filter (comma-separated slugs = OR)
		if ( ! empty( $category ) ) {
			$cat_slugs = array_filter( array_map( 'trim', explode( ',', $category ) ) );
			if ( ! empty( $cat_slugs ) ) {
				$tax_query[] = [
					'taxonomy' => 'ha_category',
					'field'    => 'slug',
					'terms'    => $cat_slugs,
					'operator' => 'IN',
				];
			}
		}

		// Features filter (comma-separated slugs = AND — all must match)
		if ( ! empty( $features ) ) {
			$feat_slugs = array_filter( array_map( 'trim', explode( ',', $features ) ) );
			foreach ( $feat_slugs as $slug ) {
				$tax_query[] = [
					'taxonomy' => 'ha_feature',
					'field'    => 'slug',
					'terms'    => [ $slug ],
					'operator' => 'IN',
				];
			}
			if ( count( $feat_slugs ) > 1 ) {
				$tax_query['relation'] = 'AND';
			}
		}

		if ( ! empty( $tax_query ) ) {
			if ( count( $tax_query ) > 1 && ! isset( $tax_query['relation'] ) ) {
				$tax_query['relation'] = 'AND';
			}
			$args['tax_query'] = $tax_query;
		}

		// Status meta filter
		if ( ! empty( $status ) ) {
			$args['meta_query'] = [
				[
					'key'     => '_ha_status',
					'value'   => $status,
					'compare' => '=',
				],
			];
		}

		// Sorting
		switch ( $sort ) {
			case 'oldest':
				$args['orderby'] = 'date';
				$args['order']   = 'ASC';
				break;

			case 'price_asc':
				$args['meta_key'] = '_ha_price';
				$args['orderby']  = 'meta_value_num';
				$args['order']    = 'ASC';
				// Include posts with no price too (contact us)
				if ( empty( $args['meta_query'] ) ) {
					$args['meta_query'] = [ 'relation' => 'OR' ];
				}
				$args['meta_query'][] = [
					'key'     => '_ha_price',
					'compare' => 'EXISTS',
				];
				$args['meta_query'][] = [
					'key'     => '_ha_price',
					'compare' => 'NOT EXISTS',
				];
				break;

			case 'price_desc':
				$args['meta_key'] = '_ha_price';
				$args['orderby']  = 'meta_value_num';
				$args['order']    = 'DESC';
				if ( empty( $args['meta_query'] ) ) {
					$args['meta_query'] = [ 'relation' => 'OR' ];
				}
				$args['meta_query'][] = [
					'key'     => '_ha_price',
					'compare' => 'EXISTS',
				];
				$args['meta_query'][] = [
					'key'     => '_ha_price',
					'compare' => 'NOT EXISTS',
				];
				break;

			case 'popular':
				$args['meta_key'] = '_ha_sort_order';
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

		$items = [];
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
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public static function get_filters( WP_REST_Request $request ) {
		$categories = get_terms( [
			'taxonomy'   => 'ha_category',
			'hide_empty' => true,
			'orderby'    => 'name',
			'order'      => 'ASC',
		] );

		$features = get_terms( [
			'taxonomy'   => 'ha_feature',
			'hide_empty' => true,
			'orderby'    => 'count',
			'order'      => 'DESC',
		] );

		$formatted_cats = [];
		if ( ! is_wp_error( $categories ) ) {
			foreach ( $categories as $term ) {
				$formatted_cats[] = [
					'slug'  => $term->slug,
					'name'  => $term->name,
					'count' => (int) $term->count,
				];
			}
		}

		$formatted_feats = [];
		if ( ! is_wp_error( $features ) ) {
			foreach ( $features as $term ) {
				$formatted_feats[] = [
					'slug'  => $term->slug,
					'name'  => $term->name,
					'count' => (int) $term->count,
				];
			}
		}

		return rest_ensure_response( [
			'categories' => $formatted_cats,
			'features'   => $formatted_feats,
		] );
	}

	/**
	 * Format a post into a site data array for the API response.
	 *
	 * @param WP_Post $post Post object.
	 * @return array
	 */
	public static function format_site( $post ) {
		$post_id = $post->ID;

		// Thumbnail
		$thumb     = '';
		$thumb_srcset = '';
		if ( has_post_thumbnail( $post_id ) ) {
			$thumb_id = get_post_thumbnail_id( $post_id );
			$thumb_arr = wp_get_attachment_image_src( $thumb_id, 'large' );
			if ( $thumb_arr ) {
				$thumb = $thumb_arr[0];
			}
			$thumb_srcset = wp_get_attachment_image_srcset( $thumb_id, 'large' );
			if ( ! $thumb_srcset ) {
				$thumb_srcset = '';
			}
		}

		// Price
		$price_raw = get_post_meta( $post_id, '_ha_price', true );
		$price     = ( $price_raw !== '' && $price_raw !== false ) ? (int) $price_raw : null;

		// Categories
		$cat_terms = get_the_terms( $post_id, 'ha_category' );
		$categories = [];
		if ( $cat_terms && ! is_wp_error( $cat_terms ) ) {
			foreach ( $cat_terms as $term ) {
				$categories[] = [
					'slug' => $term->slug,
					'name' => $term->name,
				];
			}
		}

		// Features
		$feat_terms = get_the_terms( $post_id, 'ha_feature' );
		$features = [];
		if ( $feat_terms && ! is_wp_error( $feat_terms ) ) {
			foreach ( $feat_terms as $term ) {
				$features[] = [
					'slug' => $term->slug,
					'name' => $term->name,
				];
			}
		}

		// Excerpt
		$excerpt = '';
		if ( $post->post_excerpt ) {
			$excerpt = wp_strip_all_tags( $post->post_excerpt );
		} elseif ( $post->post_content ) {
			$excerpt = wp_trim_words( wp_strip_all_tags( $post->post_content ), 30 );
		}

		return [
			'id'           => $post_id,
			'title'        => get_the_title( $post ),
			'excerpt'      => $excerpt,
			'thumb'        => $thumb,
			'thumb_srcset' => $thumb_srcset,
			'price'        => $price,
			'demo_url'     => get_post_meta( $post_id, '_ha_demo_url', true ),
			'status'       => get_post_meta( $post_id, '_ha_status', true ),
			'date_gmt'     => get_gmt_from_date( $post->post_date ),
			'categories'   => $categories,
			'features'     => $features,
		];
	}
}
