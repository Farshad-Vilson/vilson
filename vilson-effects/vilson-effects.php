<?php
/**
 * Plugin Name: Vilson Effects — Ghost Cursor & Wormhole
 * Description: دو افکت کاملاً بی‌سابقه: سایه موس با تأخیر + کرم‌چاله به صفحات مرتبط
 * Version:     1.0.0
 * Author:      حرف اول
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'VFX_VER', '1.0.0' );
define( 'VFX_URL', plugin_dir_url( __FILE__ ) );

/* ── Collect internal links for wormhole destination ── */
function vfx_nav_links() {
    $links = [];
    $menus = wp_get_nav_menus();
    foreach ( $menus as $menu ) {
        $items = wp_get_nav_menu_items( $menu->term_id );
        if ( ! $items ) continue;
        foreach ( $items as $item ) {
            if ( empty($item->url) ) continue;
            if ( home_url('/') === trailingslashit($item->url) && ! is_front_page() ) {
                $links[] = [ 'url' => $item->url, 'title' => $item->title ];
            } elseif ( $item->url !== get_permalink() ) {
                $links[] = [ 'url' => $item->url, 'title' => $item->title ];
            }
        }
        if ( count($links) >= 8 ) break;
    }
    return $links;
}

add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style(  'vfx', VFX_URL . 'assets/effects.css', [], VFX_VER );
    wp_enqueue_script( 'vfx', VFX_URL . 'assets/effects.js', [], VFX_VER, true );
    wp_localize_script( 'vfx', 'VFX', [
        'navLinks'    => vfx_nav_links(),
        'currentUrl'  => get_permalink() ?: home_url('/'),
        'siteUrl'     => home_url('/'),
    ]);
});

add_action( 'wp_footer', function () { ?>
<style>
#vfx-root{position:fixed;inset:0;pointer-events:none;z-index:2147483640;overflow:visible}
</style>
<div id="vfx-root" aria-hidden="true">

  <!-- Ghost cursor -->
  <div id="vfx-ghost">
    <div id="vfx-ghost-trail"></div>
    <div id="vfx-ghost-orb"></div>
    <div id="vfx-ghost-ring"></div>
  </div>

  <!-- Wormhole portal -->
  <div id="vfx-worm">
    <button id="vfx-worm-close" aria-label="بستن">×</button>
    <div id="vfx-worm-outer"></div>
    <div id="vfx-worm-inner">
      <div id="vfx-worm-vortex"></div>
      <div id="vfx-worm-core"></div>
    </div>
    <div id="vfx-worm-label">
      <div id="vfx-worm-hint">کاوش کن ←</div>
      <div id="vfx-worm-dest"></div>
    </div>
  </div>

</div>
<?php }, 9999 );
