<?php
/**
 * Plugin Name: حرفو — ربات هوشمند مسکات
 * Description: کاراکتر کهکشانی هوشمند با درک المنتور، صفحه، و محتوا
 * Version:     10.1.0
 * Author:      حرف اول
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HARFO_VER', '10.1.0' );
define( 'HARFO_URL', plugin_dir_url( __FILE__ ) );

/* ── Collect page intelligence (for mascot's internal awareness only) ── */
function harfo_page_data() {
    global $post;
    $data = [
        'is404'       => is_404(),
        'isSearch'    => is_search(),
        'isSingle'    => is_single(),
        'isProduct'   => class_exists('WooCommerce') && is_product(),
        'isShop'      => class_exists('WooCommerce') && function_exists('is_shop') && is_shop(),
        'isHome'      => is_front_page() || is_home(),
        'postType'    => get_post_type() ?: 'generic',
        'siteTitle'   => get_bloginfo('name'),
        'postTitle'   => get_the_title() ?: '',
        'hasWoo'      => class_exists('WooCommerce'),
        /* Elementor awareness */
        'elementor'   => [
            'active'   => did_action('elementor/loaded') ? true : false,
            'template' => get_page_template_slug() ?: 'default',
            'kit'      => harfo_elementor_colors(),
        ],
    ];
    return $data;
}

/* Sample Elementor active kit's primary color (mascot uses for self-tinting) */
function harfo_elementor_colors() {
    if ( ! did_action('elementor/loaded') ) return [];
    try {
        $kit_id = get_option('elementor_active_kit');
        if ( ! $kit_id ) return [];
        $colors = get_post_meta( $kit_id, '_elementor_page_settings', true );
        if ( ! is_array($colors) || empty($colors['system_colors']) ) return [];
        $out = [];
        foreach ( $colors['system_colors'] as $c ) {
            if ( ! empty($c['color']) ) $out[] = $c['color'];
            if ( count($out) >= 4 ) break;
        }
        return $out;
    } catch ( \Throwable $e ) {
        return [];
    }
}

add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style(  'harfo', HARFO_URL . 'assets/harfo.css', [], HARFO_VER );
    wp_enqueue_script( 'harfo', HARFO_URL . 'assets/harfo.js',  [], HARFO_VER, true );
    wp_localize_script( 'harfo', 'HC', harfo_page_data() );
} );

/* Priority 9999 = runs after Elementor, all themes, all plugins */
add_action( 'wp_footer', function () { ?>
<style>
/* Inline critical styles — guaranteed to load even if CSS file has issues */
#harfo-root{position:fixed;inset:0;pointer-events:none;z-index:2147483640;overflow:visible}
#harfo-w{position:fixed;bottom:28px;right:28px;width:100px;height:100px;pointer-events:all;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none;z-index:2147483640}
#harfo-ball{position:absolute;width:64px;height:64px;top:18px;left:18px;border-radius:50%;background:radial-gradient(circle at 38% 32%,#7C3AED 0%,#2D1B6E 38%,#0D0A28 76%,#050714 100%);overflow:hidden;transform-origin:center center}
#harfo-face{position:absolute;inset:0;pointer-events:none}
.harfo-eye{position:absolute;width:17px;height:17px;border-radius:50%;background:white}
#harfo-el{left:10px;top:21px}
#harfo-er{left:37px;top:21px}
.harfo-pu{position:absolute;width:9px;height:9px;border-radius:50%;background:#1E1B4B;top:4px;left:4px}
#harfo-mo{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:18px;height:8px;border-bottom:2.5px solid rgba(20,10,60,.78);border-radius:0 0 9px 9px}
</style>

<div id="harfo-root" aria-hidden="true">

  <div id="harfo-umb">
    <svg viewBox="0 0 72 52" xmlns="http://www.w3.org/2000/svg" width="62" height="45">
      <defs><radialGradient id="harfo-ug" cx="50%" cy="0%" r="100%">
        <stop offset="0%" stop-color="#2BCFC0"/>
        <stop offset="100%" stop-color="#0B2240"/>
      </radialGradient></defs>
      <path d="M4 26 Q12 4 36 2 Q60 4 68 26 Z" fill="url(#harfo-ug)"/>
      <path d="M4 26 Q12 18 20 26" fill="rgba(255,255,255,0.14)"/>
      <path d="M36 26 L36 48 Q36 54 30 54 Q24 54 24 48"
            stroke="#0B2240" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
  </div>

  <!-- Character: visible immediately via inline CSS above, physics added by JS -->
  <div id="harfo-w">
    <div id="harfo-glow"></div>
    <div id="harfo-ball" data-mood="normal">
      <div id="harfo-arm"></div>
      <div id="harfo-stars"></div>
      <div id="harfo-neb"></div>
      <div id="harfo-sheen"></div>
      <div id="harfo-face">
        <div class="harfo-eye" id="harfo-el">
          <div class="harfo-pu" id="harfo-pl"></div>
          <div class="harfo-sh"></div>
        </div>
        <div class="harfo-eye" id="harfo-er">
          <div class="harfo-pu" id="harfo-pr"></div>
          <div class="harfo-sh"></div>
        </div>
        <div id="harfo-mo"></div>
      </div>
      <svg id="harfo-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"
           style="position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none"></svg>
    </div>
    <div id="harfo-rain"></div>
    <div id="harfo-armw"></div>
  </div>

  <div id="harfo-fx"></div>

</div>
<?php }, 9999 );
