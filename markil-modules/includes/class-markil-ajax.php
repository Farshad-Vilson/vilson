<?php
namespace Markil;

if ( ! defined( 'ABSPATH' ) ) exit;

class Ajax {
    public function __construct() {
        add_action( 'wp_ajax_markil_filter_modules',            [ $this, 'filter_modules' ] );
        add_action( 'wp_ajax_nopriv_markil_filter_modules',     [ $this, 'filter_modules' ] );
        add_action( 'wp_ajax_markil_get_module_detail',         [ $this, 'get_module_detail' ] );
        add_action( 'wp_ajax_nopriv_markil_get_module_detail',  [ $this, 'get_module_detail' ] );
        add_action( 'wp_ajax_markil_submit_review',             [ $this, 'submit_review' ] );
        add_action( 'wp_ajax_markil_toggle_wishlist',           [ $this, 'toggle_wishlist' ] );
        add_action( 'wp_ajax_nopriv_markil_toggle_wishlist',    [ $this, 'toggle_wishlist' ] );
        // Modal-based full-detail AJAX (markil_render_full_detail) was removed
        // in v2.6 — the full detail page is now a real WordPress single page
        // at /markil-module/{slug}/ (see Plugin::load_single_template()).
    }

    public function filter_modules() {
        check_ajax_referer( 'markil_modules_nonce', 'nonce' );

        $args = [
            'post_type'      => 'markil_module',
            'post_status'    => 'publish',
            'posts_per_page' => intval( $_POST['per_page'] ?? 12 ),
            'paged'          => intval( $_POST['paged'] ?? 1 ),
        ];

        if ( ! empty( $_POST['search'] ) ) {
            $args['s'] = sanitize_text_field( $_POST['search'] );
        }

        if ( ! empty( $_POST['category'] ) && $_POST['category'] !== 'all' ) {
            $raw_category = sanitize_text_field( wp_unslash( $_POST['category'] ) );
            $term_ids = [];
            if ( is_numeric( $raw_category ) ) {
                $term_ids[] = absint( $raw_category );
            } else {
                $term = get_term_by( 'slug', $raw_category, 'markil_category' );
                if ( ! $term ) $term = get_term_by( 'name', $raw_category, 'markil_category' );
                if ( $term && ! is_wp_error( $term ) ) $term_ids[] = absint( $term->term_id );
            }
            if ( ! empty( $term_ids ) ) {
                $args['tax_query'] = [[ 'taxonomy' => 'markil_category', 'field' => 'term_id', 'terms' => $term_ids, 'include_children' => true, 'operator' => 'IN' ]];
            }
        }

        if ( ! empty( $_POST['tag'] ) ) {
            $raw_tag = sanitize_text_field( wp_unslash( $_POST['tag'] ) );
            $tag_ids = [];
            if ( is_numeric( $raw_tag ) ) {
                $tag_ids[] = absint( $raw_tag );
            } else {
                $term = get_term_by( 'slug', $raw_tag, 'markil_tag' );
                if ( ! $term ) $term = get_term_by( 'name', $raw_tag, 'markil_tag' );
                if ( $term && ! is_wp_error( $term ) ) $tag_ids[] = absint( $term->term_id );
            }
            if ( ! empty( $tag_ids ) ) {
                $existing = $args['tax_query'] ?? [];
                $existing[] = [ 'taxonomy' => 'markil_tag', 'field' => 'term_id', 'terms' => $tag_ids, 'operator' => 'IN' ];
                $args['tax_query'] = $existing;
            }
        }

        switch ( $_POST['orderby'] ?? 'newest' ) {
            case 'newest':     $args['orderby'] = 'date'; $args['order'] = 'DESC'; break;
            case 'price_low':  $args['meta_key'] = '_markil_price'; $args['orderby'] = 'meta_value_num'; $args['order'] = 'ASC'; break;
            case 'price_high': $args['meta_key'] = '_markil_price'; $args['orderby'] = 'meta_value_num'; $args['order'] = 'DESC'; break;
            case 'rating':     $args['meta_key'] = '_markil_rating'; $args['orderby'] = 'meta_value_num'; $args['order'] = 'DESC'; break;
            default:           $args['meta_key'] = '_markil_favorites_count'; $args['orderby'] = 'meta_value_num'; $args['order'] = 'DESC';
        }

        $meta_query = $args['meta_query'] ?? [];
        if ( ! empty( $_POST['min_price'] ) )  $meta_query[] = [ 'key' => '_markil_price', 'value' => intval( $_POST['min_price'] ), 'compare' => '>=', 'type' => 'NUMERIC' ];
        if ( ! empty( $_POST['max_price'] ) )  $meta_query[] = [ 'key' => '_markil_price', 'value' => intval( $_POST['max_price'] ), 'compare' => '<=', 'type' => 'NUMERIC' ];
        if ( ! empty( $_POST['min_rating'] ) ) $meta_query[] = [ 'key' => '_markil_rating', 'value' => floatval( $_POST['min_rating'] ), 'compare' => '>=', 'type' => 'NUMERIC' ];
        if ( ! empty( $_POST['free_only'] ) )  $meta_query[] = [ 'key' => '_markil_is_free', 'value' => '1', 'compare' => '=' ];
        if ( ! empty( $meta_query ) ) $args['meta_query'] = $meta_query;

        $query = new \WP_Query( $args );
        $modules = [];
        if ( $query->have_posts() ) {
            while ( $query->have_posts() ) { $query->the_post(); $modules[] = $this->format_module( get_the_ID() ); }
            wp_reset_postdata();
        }

        wp_send_json_success([
            'modules'     => $modules,
            'total'       => $query->found_posts,
            'total_pages' => $query->max_num_pages,
            'current'     => intval( $_POST['paged'] ?? 1 ),
        ]);
    }

    public function get_module_detail() {
        check_ajax_referer( 'markil_modules_nonce', 'nonce' );
        $post_id = intval( $_POST['module_id'] );
        if ( ! $post_id ) wp_send_json_error( 'Invalid ID' );
        $post = get_post( $post_id );
        if ( ! $post ) wp_send_json_error( 'Not found' );
        wp_send_json_success( $this->format_module( $post_id, true ) );
    }

    public function submit_review() {
        check_ajax_referer( 'markil_modules_nonce', 'nonce' );
        if ( ! is_user_logged_in() ) wp_send_json_error( __( 'برای ثبت نظر باید وارد شوید', 'markil-modules' ) );

        $post_id = intval( $_POST['module_id'] );
        $rating  = intval( $_POST['rating'] );
        $comment = sanitize_textarea_field( $_POST['comment'] );

        if ( $rating < 1 || $rating > 5 ) wp_send_json_error( __( 'امتیاز نامعتبر', 'markil-modules' ) );

        $user    = wp_get_current_user();
        $reviews = get_post_meta( $post_id, '_markil_reviews', true ) ?: [];
        $reviews[] = [ 'user_id' => $user->ID, 'name' => $user->display_name, 'avatar' => get_avatar_url( $user->ID, [ 'size' => 48 ] ), 'rating' => $rating, 'comment' => $comment, 'date' => current_time( 'mysql' ) ];
        update_post_meta( $post_id, '_markil_reviews', $reviews );
        $avg = array_sum( array_column( $reviews, 'rating' ) ) / count( $reviews );
        update_post_meta( $post_id, '_markil_rating', round( $avg, 1 ) );
        wp_send_json_success( [ 'message' => __( 'نظر شما با موفقیت ثبت شد', 'markil-modules' ), 'rating' => round( $avg, 1 ), 'count' => count( $reviews ) ] );
    }

    public function toggle_wishlist() {
        check_ajax_referer( 'markil_modules_nonce', 'nonce' );
        if ( ! is_user_logged_in() ) wp_send_json_error( __( 'برای افزودن به علاقه‌مندی‌ها باید وارد شوید', 'markil-modules' ) );

        $post_id  = intval( $_POST['module_id'] );
        $user_id  = get_current_user_id();
        $wishlist = get_user_meta( $user_id, '_markil_wishlist', true ) ?: [];
        $count    = intval( get_post_meta( $post_id, '_markil_favorites_count', true ) );

        if ( in_array( $post_id, $wishlist ) ) {
            $wishlist = array_diff( $wishlist, [ $post_id ] );
            $added = false; $count = max( 0, $count - 1 );
        } else {
            $wishlist[] = $post_id;
            $added = true; $count++;
        }
        update_user_meta( $user_id, '_markil_wishlist', array_values( $wishlist ) );
        update_post_meta( $post_id, '_markil_favorites_count', $count );
        wp_send_json_success( [ 'added' => $added, 'count' => $count ] );
    }

    public function format_module( $post_id, $full = false ) {
        $meta       = get_post_meta( $post_id );
        $categories = wp_get_post_terms( $post_id, 'markil_category', [ 'fields' => 'all' ] );
        $tags       = wp_get_post_terms( $post_id, 'markil_tag', [ 'fields' => 'names' ] );

        $btn2_action = $meta['_markil_btn_secondary_action'][0] ?? 'detail_page';

        $data = [
            'id'                   => $post_id,
            'title'                => get_the_title( $post_id ),
            'excerpt'              => get_the_excerpt( $post_id ),
            'image'                => get_the_post_thumbnail_url( $post_id, 'medium' ),
            'image_full'           => get_the_post_thumbnail_url( $post_id, 'large' ),
            'permalink'            => get_permalink( $post_id ),
            'price'                => $meta['_markil_price'][0] ?? '',
            'old_price'            => $meta['_markil_old_price'][0] ?? '',
            'is_free'              => ! empty( $meta['_markil_is_free'][0] ),
            'rating'               => floatval( $meta['_markil_rating'][0] ?? 0 ),
            'review_count'         => intval( $meta['_markil_review_count'][0] ?? 0 ),
            'installs'             => intval( $meta['_markil_installs'][0] ?? 0 ),
            'favorites_count'      => intval( $meta['_markil_favorites_count'][0] ?? 0 ),
            'version'              => $meta['_markil_version'][0] ?? '1.0.0',
            'badge'                => $meta['_markil_badge'][0] ?? '',
            'status'               => $meta['_markil_status'][0] ?? 'active',
            'icon_color'           => $meta['_markil_icon_color'][0] ?? '#011627',
            'icon_bg'              => $meta['_markil_icon_bg'][0] ?? '#e6f9f6',
            'categories'           => $categories,
            'tags'                 => $tags,
            'wc_product_id'        => intval( $meta['_markil_wc_product_id'][0] ?? 0 ),
            'detail_page'          => $meta['_markil_detail_page'][0] ?? '',
            'btn_primary_text'     => $meta['_markil_btn_primary_text'][0] ?? __( 'افزودن به سبد خرید', 'markil-modules' ),
            'btn_secondary_text'   => $meta['_markil_btn_secondary_text'][0] ?? __( 'جزئیات بیشتر', 'markil-modules' ),
            'btn_secondary_action' => $btn2_action,
            'delivery_time'        => $meta['_markil_delivery_time'][0] ?? '',
            'btn_primary_action'   => $meta['_markil_btn_primary_action'][0] ?? 'wc_add',
            'primary_custom_url'   => $meta['_markil_primary_custom_url'][0] ?? '',
            'secondary_custom_url' => $meta['_markil_secondary_custom_url'][0] ?? '',
        ];

        if ( $full ) {
            // Main post content: Elementor SHOULD process this (it's the Elementor-built content)
            $data['content']            = apply_filters( 'the_content', get_post_field( 'post_content', $post_id ) );
            // Legacy tab fields: must bypass Elementor to avoid full-page replacement
            $data['tab_details']        = $this->process_meta_content( $meta['_markil_tab_details'][0] ?? '' );
            $data['tab_features']       = $this->process_meta_content( $meta['_markil_tab_features'][0] ?? '' );
            $data['tab_compatibility']  = $this->process_meta_content( $meta['_markil_tab_compatibility'][0] ?? '' );
            $data['tab_reviews_html']   = $this->get_reviews_html( $post_id );
            $data['features_list']      = maybe_unserialize( $meta['_markil_features_list'][0] ?? '' ) ?: [];
            $data['compatibility_list'] = maybe_unserialize( $meta['_markil_compatibility_list'][0] ?? '' ) ?: [];
            $data['tab1_label']         = $meta['_markil_tab1_label'][0] ?? __( 'جزئیات', 'markil-modules' );
            $data['tab2_label']         = $meta['_markil_tab2_label'][0] ?? __( 'امکانات', 'markil-modules' );
            $data['tab3_label']         = $meta['_markil_tab3_label'][0] ?? __( 'سازگاری', 'markil-modules' );
            $data['tab4_label']         = $meta['_markil_tab4_label'][0] ?? __( 'نقد و بررسی', 'markil-modules' );
            $data['reviews']            = get_post_meta( $post_id, '_markil_reviews', true ) ?: [];

            $custom_tabs = maybe_unserialize( $meta['_markil_custom_tabs'][0] ?? '' );
            $tabs = [];
            if ( is_array( $custom_tabs ) && ! empty( $custom_tabs ) ) {
                foreach ( $custom_tabs as $tab ) {
                    if ( isset( $tab['enabled'] ) && $tab['enabled'] !== '1' ) continue;
                    $label     = isset( $tab['label'] )           ? sanitize_text_field( $tab['label'] ) : '';
                    $summary   = isset( $tab['summary'] )         ? $tab['summary'] : '';
                    $content   = isset( $tab['content'] )         ? $tab['content'] : '';
                    $use_main  = ! empty( $tab['use_main_editor'] ) && $tab['use_main_editor'] === '1';
                    $tab_type  = '';

                    // "Use main editor" — replaces content with processed post_content (Elementor-ready)
                    if ( $use_main ) {
                        $content = $data['content'];
                        if ( empty( $summary ) ) {
                            $summary = $data['excerpt'] ? '<p>' . esc_html( $data['excerpt'] ) . '</p>' : '';
                        }
                    }

                    // Skip truly empty tab (no label AND no content after resolution)
                    if ( trim( $label ) === '' && $content === '' && $summary === '' ) continue;

                    // Process summary: [markil_reviews] → reviews HTML, then shortcodes+filters
                    if ( strpos( (string) $summary, '[markil_reviews]' ) !== false ) {
                        $summary  = str_replace( '[markil_reviews]', $data['tab_reviews_html'], $summary );
                        $tab_type = 'reviews';
                    } elseif ( ! $use_main ) {
                        $summary = $this->process_meta_content( $summary );
                    }

                    // Process full content — bypass Elementor filter to avoid page-level override
                    if ( strpos( (string) $content, '[markil_reviews]' ) !== false ) {
                        $content  = str_replace( '[markil_reviews]', $data['tab_reviews_html'], $content );
                        $tab_type = 'reviews';
                    } elseif ( ! $use_main ) {
                        $content = $this->process_meta_content( $content );
                    }

                    $tabs[] = [
                        'label'   => $label ?: __( 'تب', 'markil-modules' ),
                        'summary' => $summary,
                        'content' => $content,
                        'type'    => $tab_type,
                    ];
                }
            }
            if ( empty( $tabs ) ) {
                // Fallback to legacy single-field tabs
                $tabs[] = [ 'label' => $data['tab1_label'], 'summary' => $data['tab_details'] ?: '<p>' . esc_html( $data['excerpt'] ) . '</p>', 'content' => $data['tab_details'],        'type' => '' ];
                $tabs[] = [ 'label' => $data['tab2_label'], 'summary' => $data['tab_features'],      'content' => $data['tab_features'],      'type' => '' ];
                $tabs[] = [ 'label' => $data['tab3_label'], 'summary' => $data['tab_compatibility'], 'content' => $data['tab_compatibility'], 'type' => '' ];
                $tabs[] = [ 'label' => $data['tab4_label'], 'summary' => $data['tab_reviews_html'],  'content' => $data['tab_reviews_html'],  'type' => 'reviews' ];
            }
            $data['tabs'] = $tabs;

            // Full Detail Page specific fields
            $raw_fb  = maybe_unserialize( $meta['_markil_features_bar'][0] ?? '' );
            $raw_sf  = maybe_unserialize( $meta['_markil_sidebar_features'][0] ?? '' );
            $raw_sec = maybe_unserialize( $meta['_markil_detail_sections'][0] ?? '' );

            $data['features_bar']     = is_array( $raw_fb )  ? $raw_fb  : [];
            $data['sidebar_features'] = is_array( $raw_sf )  ? $raw_sf  : [];
            $data['detail_sections']  = is_array( $raw_sec ) ? $raw_sec : [];

            // Gallery images (convert stored attachment IDs to full URLs)
            $gallery_raw = $meta['_markil_gallery_images'][0] ?? '';
            $gallery_ids = $gallery_raw ? array_filter( array_map( 'absint', explode( ',', $gallery_raw ) ) ) : [];
            $gallery_urls = [];
            foreach ( $gallery_ids as $att_id ) {
                $src   = wp_get_attachment_image_src( $att_id, 'large' );
                $thumb = wp_get_attachment_image_src( $att_id, 'thumbnail' );
                if ( $src ) {
                    $gallery_urls[] = [
                        'url'   => $src[0],
                        'thumb' => $thumb ? $thumb[0] : $src[0],
                    ];
                }
            }
            // Fall back to featured image if no gallery
            if ( empty( $gallery_urls ) && ! empty( $data['image_full'] ) ) {
                $gallery_urls[] = [
                    'url'   => $data['image_full'],
                    'thumb' => $data['image'] ?: $data['image_full'],
                ];
            }
            $data['gallery_images']   = $gallery_urls;
            $data['video_url']        = $meta['_markil_video_url'][0] ?? '';
            $data['video_embed']      = $meta['_markil_video_embed'][0] ?? '';
            $data['video_membership'] = ! empty( $meta['_markil_video_membership'][0] ) && $meta['_markil_video_membership'][0] === '1';
            $data['demo_url']        = $meta['_markil_demo_url'][0] ?? '';
            $data['changelog']       = $meta['_markil_changelog'][0] ?? '';
            $g_title = $meta['_markil_guarantee_title'][0] ?? '';
            $g_text  = $meta['_markil_guarantee_text'][0] ?? '';
            $data['guarantee_title'] = $g_title ?: get_option( 'markil_guarantee_title', 'ضمانت کیفیت خدمات' );
            $data['guarantee_text']  = $g_text  ?: get_option( 'markil_guarantee_text',  'ما کیفیت کار خود را تضمین می‌کنیم. در صورت نارضایتی، پشتیبانی تا رضایت شما ادامه دارد.' );
        }

        return $data;
    }

    /**
     * Process meta-box HTML content (tab fields, legacy tab fields) through
     * standard WordPress filters WITHOUT triggering Elementor's page-level
     * content replacement.
     *
     * When Elementor is active on a post, apply_filters('the_content', $anything)
     * is intercepted by Elementor's apply_builder_in_content() and returns the
     * full Elementor-rendered post instead of the passed string. This method
     * temporarily removes that filter so meta content is processed normally.
     */
    private function process_meta_content( $content ) {
        if ( $content === '' || $content === null ) return '';

        // Remove Elementor's the_content hook temporarily
        $el_removed  = false;
        $el_frontend = null;
        if ( class_exists( '\Elementor\Plugin' ) ) {
            try {
                $el_frontend = \Elementor\Plugin::instance()->frontend;
                if ( $el_frontend && has_filter( 'the_content', [ $el_frontend, 'apply_builder_in_content' ] ) ) {
                    remove_filter( 'the_content', [ $el_frontend, 'apply_builder_in_content' ] );
                    $el_removed = true;
                }
            } catch ( \Exception $e ) {
                $el_removed = false;
            }
        }

        $result = do_shortcode( apply_filters( 'the_content', $content ) );

        // Restore Elementor's filter at the same default priority (10)
        if ( $el_removed && $el_frontend ) {
            add_filter( 'the_content', [ $el_frontend, 'apply_builder_in_content' ] );
        }

        return $result;
    }

    private function get_reviews_html( $post_id ) {
        $reviews = get_post_meta( $post_id, '_markil_reviews', true ) ?: [];
        ob_start();
        include MARKIL_PATH . 'templates/reviews.php';
        return ob_get_clean();
    }
}
