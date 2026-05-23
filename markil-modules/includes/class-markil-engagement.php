<?php
namespace Markil;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Engagement features: view counter + per-module contact form.
 * Designed to be cheap: view count is throttled per visitor, contact submissions are AJAX.
 */
class Engagement {
    public function __construct() {
        add_action( 'wp', [ $this, 'maybe_count_view' ] );
        add_action( 'wp_ajax_markil_contact_submit',        [ $this, 'handle_contact' ] );
        add_action( 'wp_ajax_nopriv_markil_contact_submit', [ $this, 'handle_contact' ] );
    }

    /**
     * Increment view counter on single module pages.
     * Throttles per visitor using a 12-hour transient keyed on IP+post.
     * Skips bots, admins editing posts, and previews.
     */
    public function maybe_count_view() {
        if ( ! is_singular( 'markil_module' ) ) return;
        if ( is_preview() || is_admin() ) return;
        if ( ! empty( $_SERVER['HTTP_USER_AGENT'] ) && preg_match( '/bot|crawl|spider|slurp|facebookexternalhit/i', $_SERVER['HTTP_USER_AGENT'] ) ) return;

        $post_id = get_queried_object_id();
        if ( ! $post_id ) return;

        $ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? preg_replace( '/[^0-9a-fA-F:.]/', '', $_SERVER['REMOTE_ADDR'] ) : '0';
        $key = 'markil_v_' . md5( $ip . '_' . $post_id );
        if ( get_transient( $key ) ) return;

        set_transient( $key, 1, 12 * HOUR_IN_SECONDS );
        $count = intval( get_post_meta( $post_id, '_markil_views', true ) ) + 1;
        update_post_meta( $post_id, '_markil_views', $count );
    }

    public function handle_contact() {
        check_ajax_referer( 'markil_modules_nonce', 'nonce' );

        $post_id = intval( $_POST['module_id'] ?? 0 );
        if ( ! $post_id || get_post_type( $post_id ) !== 'markil_module' ) {
            wp_send_json_error( __( 'ماژول نامعتبر است', 'markil-modules' ) );
        }

        $name    = sanitize_text_field( wp_unslash( $_POST['name']    ?? '' ) );
        $email   = sanitize_email( wp_unslash( $_POST['email']   ?? '' ) );
        $phone   = sanitize_text_field( wp_unslash( $_POST['phone']   ?? '' ) );
        $message = sanitize_textarea_field( wp_unslash( $_POST['message'] ?? '' ) );

        if ( strlen( $name ) < 2 )            wp_send_json_error( __( 'نام را وارد کنید', 'markil-modules' ) );
        if ( ! is_email( $email ) )           wp_send_json_error( __( 'ایمیل نامعتبر است', 'markil-modules' ) );
        if ( strlen( $message ) < 5 )         wp_send_json_error( __( 'پیام خیلی کوتاه است', 'markil-modules' ) );

        // Honeypot
        if ( ! empty( $_POST['website'] ) )   wp_send_json_error( __( 'خطا', 'markil-modules' ) );

        // Throttle by IP: 1 per 60 seconds
        $ip = isset( $_SERVER['REMOTE_ADDR'] ) ? preg_replace( '/[^0-9a-fA-F:.]/', '', $_SERVER['REMOTE_ADDR'] ) : '0';
        $tkey = 'markil_c_' . md5( $ip );
        if ( get_transient( $tkey ) ) {
            wp_send_json_error( __( 'لطفاً کمی صبر کنید و دوباره ارسال کنید', 'markil-modules' ) );
        }
        set_transient( $tkey, 1, 60 );

        $entry = [
            'name'    => $name,
            'email'   => $email,
            'phone'   => $phone,
            'message' => $message,
            'date'    => current_time( 'mysql' ),
            'ip'      => $ip,
        ];
        $all = get_post_meta( $post_id, '_markil_contact_messages', true ) ?: [];
        if ( ! is_array( $all ) ) $all = [];
        $all[] = $entry;
        // Cap at 500 entries to avoid bloat
        if ( count( $all ) > 500 ) $all = array_slice( $all, -500 );
        update_post_meta( $post_id, '_markil_contact_messages', $all );

        // Email admin
        $admin_email = get_option( 'admin_email' );
        $title       = get_the_title( $post_id );
        $subject     = sprintf( __( 'پیام جدید برای ماژول: %s', 'markil-modules' ), $title );
        $body        = sprintf(
            "نام: %s\nایمیل: %s\nتلفن: %s\nماژول: %s\n\nپیام:\n%s",
            $name, $email, $phone, $title, $message
        );
        wp_mail( $admin_email, $subject, $body, [ 'Reply-To: ' . $email ] );

        wp_send_json_success( [ 'message' => __( 'پیام شما با موفقیت ارسال شد', 'markil-modules' ) ] );
    }
}
