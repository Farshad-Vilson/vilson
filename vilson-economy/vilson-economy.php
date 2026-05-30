<?php
/**
 * Plugin Name: Vilson Economy — Brand Tokens & Temporal Site
 * Description: اقتصاد برند بدون ثبت‌نام: توکن توجه، سایت زمانی، محتوای اختصاصی، ماموریت روزانه
 * Version:     2.0.0
 * Author:      حرف اول
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'VEC_VER', '2.0.0' );
define( 'VEC_URL', plugin_dir_url( __FILE__ ) );

/* ── Shortcode: [vfx_exclusive level="3" title="..."] ── */
add_shortcode( 'vfx_exclusive', function( $atts, $content = '' ) {
    $a = shortcode_atts([
        'level' => 2,
        'title' => 'محتوای اختصاصی',
        'hint'  => 'با ادامه همراهی، این بخش برایت باز می‌شود',
    ], $atts );
    $lvl = intval( $a['level'] );
    ob_start(); ?>
    <div class="vfx-exclusive" data-level="<?php echo $lvl; ?>">
      <div class="vfx-locked-shell">
        <div class="vfx-lock-mark">◈</div>
        <div class="vfx-lock-title"><?php echo esc_html( $a['title'] ); ?></div>
        <div class="vfx-lock-hint"><?php echo esc_html( $a['hint'] ); ?></div>
      </div>
      <div class="vfx-exclusive-body"><?php echo do_shortcode( $content ); ?></div>
    </div>
    <?php return ob_get_clean();
});

add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style(  'vec', VEC_URL . 'assets/economy.css', [], VEC_VER );
    wp_enqueue_script( 'vec', VEC_URL . 'assets/economy.js',  [], VEC_VER, true );
    wp_localize_script( 'vec', 'VEC', [
        'siteKey'  => substr( md5( home_url() . AUTH_KEY ), 0, 16 ),
        'pageType' => ( is_single() || is_page() ) ? 'content' : 'index',
        'isHome'   => is_front_page() || is_home(),
    ]);
});

add_action( 'wp_footer', function () { ?>

<div id="vec-dash" aria-label="سطح همراهی شما" role="complementary">

  <!-- Collapsed pill -->
  <div id="vec-pill">
    <span id="vec-pill-mark">◆</span>
    <span id="vec-pill-label">همراه</span>
  </div>

  <!-- Expanded card -->
  <div id="vec-card">
    <div id="vec-card-head">
      <div id="vec-level-badge">
        <span id="vec-badge-mark">◆</span>
        <span id="vec-badge-name">آشنا</span>
      </div>
      <button id="vec-card-close" aria-label="بستن">✕</button>
    </div>

    <div id="vec-progress-wrap">
      <div id="vec-progress-bar"><div id="vec-progress-fill"></div></div>
      <div id="vec-progress-label"></div>
    </div>

    <!-- Streak multiplier badge -->
    <div id="vec-mult-badge"></div>

    <!-- 7-day streak calendar -->
    <div id="vec-cal-wrap">
      <div id="vec-cal-label">حضور ۷ روز اخیر</div>
      <div id="vec-cal-dots"></div>
    </div>

    <!-- Daily quest -->
    <div id="vec-quest-wrap">
      <div id="vec-quest-header">ماموریت امروز</div>
      <div id="vec-quest-label">در حال بارگذاری...</div>
      <div id="vec-quest-status">در انجام...</div>
    </div>

    <div id="vec-tokens">
      <div class="vec-token-row" id="vec-t-attn">
        <span class="vec-token-icon">◎</span>
        <span class="vec-token-name">توجه</span>
        <span class="vec-token-val">۰</span>
      </div>
      <div class="vec-token-row" id="vec-t-know">
        <span class="vec-token-icon">◉</span>
        <span class="vec-token-name">دانش</span>
        <span class="vec-token-val">۰</span>
      </div>
      <div class="vec-token-row" id="vec-t-loyal">
        <span class="vec-token-icon">◈</span>
        <span class="vec-token-name">وفاداری</span>
        <span class="vec-token-val">۰</span>
      </div>
    </div>

    <div id="vec-next-unlock"></div>

    <div id="vec-cert-wrap" style="display:none">
      <button id="vec-cert-btn">دریافت نشان وفاداری ★</button>
    </div>
  </div>

</div>

<!-- Toast -->
<div id="vec-toast" aria-live="polite"></div>

<?php }, 9999 );
