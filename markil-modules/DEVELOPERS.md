# راهنمای توسعه‌دهندگان — Markil Modules v2.6

این سند برای هر برنامه‌نویسی است که می‌خواهد افزونه را در آینده ویرایش/توسعه دهد.

---

## معماری کلی (مهم!)

افزونه دو نمای مجزا برای محتوای ماژول دارد:

```
┌─────────────────────────────────┐      ┌──────────────────────────────────┐
│  پنل کناری (Side Panel)         │      │  صفحه جزئیات کامل (Single Page)  │
│  ────────────────────           │      │  ─────────────────────────       │
│  • پیش‌نمایش سریع                │      │  • صفحه واقعی وردپرس             │
│  • تب‌ها با خلاصه (summary)     │ ───▶ │  • URL: /markil-module/slug/     │
│  • با AJAX باز می‌شود           │ کلیک │  • تب‌ها با محتوای کامل (content) │
│  • روی همان صفحه فعلی           │      │  • گالری اسلایدر، ویدیو، شورت‌کد │
└─────────────────────────────────┘      └──────────────────────────────────┘
```

**مهم:** از v2.6 پاپ‌آپ مودال حذف شد. کلیک روی «جزئیات بیشتر» = ناوبری به صفحه واقعی.

---

## ساختار فایل‌ها

```
markil-modules/
├── markil-modules.php          ← فایل اصلی (autoloader + bootstrap)
├── DEVELOPERS.md               ← همین فایل
│
├── includes/
│   ├── class-markil-plugin.php      ← ثبت CPT + template_include filter
│   ├── class-markil-assets.php      ← enqueue assets + wp_editor scripts
│   ├── class-markil-ajax.php        ← AJAX handlers + format_module()
│   ├── class-markil-meta-boxes.php  ← meta boxهای ادمین (شامل wp_editor در تب‌ها)
│   ├── class-markil-admin.php       ← صفحه تنظیمات افزونه
│   └── class-markil-elementor.php   ← ثبت ویجت‌های Elementor
│
├── widgets/
│   ├── class-widget-modules-grid.php       ← ویجت گرید + فیلتر + پنل کناری
│   ├── class-widget-module-detail.php      ← ویجت پنل جزئیات تنها
│   └── class-widget-module-full-detail.php ← ویجت صفحه جزئیات کامل (Elementor)
│
├── templates/
│   ├── single-markil_module.php  ← WordPress single template (NEW v2.6)
│   ├── full-detail-layout.php    ← قالب HTML صفحه جزئیات کامل
│   └── reviews.php                ← قالب نظرات
│
└── assets/
    ├── css/
    │   ├── frontend.css
    │   └── admin.css
    └── js/
        ├── frontend.js
        ├── admin.js
        └── admin-gallery.js
```

---

## ساختار meta `_markil_custom_tabs`

از v2.6 هر تب **دو فیلد محتوا** دارد:

```php
$custom_tabs = [
    [
        'label'   => 'جزئیات',            // نام دکمه تب
        'summary' => '<p>متن کوتاه</p>',  // ← برای پنل کناری
        'content' => '<p>متن کامل با تصویر و ویدیو...</p>',  // ← برای صفحه /markil-module/slug/
        'enabled' => '1',
    ],
    // ...
];
```

**نکات:**
- اگر `content` خالی باشد، صفحه کامل به `summary` می‌افتد.
- `summary` با textarea ساده ذخیره می‌شود — مناسب برای پاراگراف‌های کوتاه.
- `content` با `wp_editor()` ذخیره می‌شود — مناسب برای محتوای کامل (تصویر، ویدیو، جدول، شورت‌کد و...).

**شورت‌کدهای ویژه داخل summary/content:**
- `[markil_reviews]` — جایگزین می‌شود با لیست نظرات + فرم ثبت نظر.
- `[elementor-template id="123"]` — یک قالب از Elementor Saved Templates را نمایش می‌دهد.

---

## معماری template_include

فایل `single-markil_module.php` در پوشه `templates/` افزونه به‌صورت خودکار برای پست‌های `markil_module` لود می‌شود:

```php
// در class-markil-plugin.php
add_filter( 'single_template', [ $this, 'load_single_template' ] );

public function load_single_template( $template ) {
    if ( is_singular( 'markil_module' ) ) {
        // اجازه اور-راید توسط تم
        $theme = locate_template( [ 'single-markil_module.php', 'markil-modules/single-markil_module.php' ] );
        if ( $theme ) return $theme;
        return MARKIL_PATH . 'templates/single-markil_module.php';
    }
    return $template;
}
```

**اور-راید توسط تم:**
کاربر می‌تواند با کپی فایل به `yourtheme/single-markil_module.php` یا `yourtheme/markil-modules/single-markil_module.php` آن را اور-راید کند.

**اور-راید تنظیمات صفحه:**

```php
add_filter( 'markil_single_settings', function( $settings, $post_id, $m ) {
    $settings['sidebar_position'] = 'right';
    $settings['show_guarantee']    = 'no';
    return $settings;
}, 10, 3 );
```

---

## استفاده از Elementor برای طراحی هر بخش

افزونه به دو روش از Elementor پشتیبانی می‌کند:

### روش ۱: قالب در تب
داخل فیلد «محتوای کامل» یک تب از این شورت‌کد استفاده کنید:
```
[elementor-template id="123"]
```

که `123` شناسه قالب ذخیره‌شده در Elementor → Templates → Saved Templates است.

### روش ۲: ویجت Elementor صفحه کامل
ویجت `ModuleFullDetail` به صورت native در Elementor قابل کشیدن است و تمام بخش‌ها (فاصله، رنگ، تایپوگرافی) قابل سفارشی‌سازی هستند.

---

## Meta Fieldهای ذخیره‌شده

| کلید                          | نوع          | توضیح                                                |
|-------------------------------|--------------|------------------------------------------------------|
| `_markil_price`               | text         | قیمت                                                   |
| `_markil_old_price`           | text         | قیمت قبلی (خط‌خورده)                                   |
| `_markil_is_free`             | '1' / '0'    | رایگان                                                 |
| `_markil_version`             | text         | نسخه                                                   |
| `_markil_badge`               | text         | برچسب ویژه                                             |
| `_markil_status`              | text         | active / inactive / coming_soon                         |
| `_markil_rating`              | float        | امتیاز 0-5                                              |
| `_markil_installs`            | int          | تعداد نصب                                              |
| `_markil_favorites_count`     | int          | تعداد علاقه‌مندی                                       |
| `_markil_icon_color`          | hex          | رنگ آیکون                                              |
| `_markil_icon_bg`             | hex          | رنگ پس‌زمینه                                           |
| `_markil_wc_product_id`       | int          | محصول ووکامرس                                          |
| `_markil_detail_page`         | URL          | URL سفارشی (اختیاری — پیش‌فرض permalink)              |
| `_markil_btn_primary_text`    | text         | متن دکمه اصلی                                          |
| `_markil_btn_secondary_text`  | text         | متن دکمه ثانویه                                        |
| `_markil_btn_primary_action`  | enum         | wc_add / wc_page / detail_page / custom_url             |
| `_markil_btn_secondary_action`| enum         | detail_page / wc_add / wc_page / custom_url             |
| `_markil_primary_custom_url`  | URL          | لینک سفارشی دکمه اصلی                                  |
| `_markil_secondary_custom_url`| URL          | لینک سفارشی دکمه ثانویه                                |
| `_markil_delivery_time`       | text         | زمان تحویل (سایدبار)                                   |
| `_markil_custom_tabs`         | array[]      | **[label, summary, content, enabled]** ← v2.6+        |
| `_markil_features_list`       | string[]     | ویژگی‌های کلیدی (پنل قدیمی)                            |
| `_markil_features_bar`        | array[]      | نوار بالای صفحه [icon, label]                          |
| `_markil_sidebar_features`    | array[]      | آیکون‌های سایدبار [icon, label]                        |
| `_markil_detail_sections`     | array[]      | بخش‌های پویا [title, icon, tab_index, items[]]         |
| `_markil_gallery_images`      | string       | IDs گالری (comma-separated)                            |
| `_markil_video_url`           | URL          | لینک ویدیو (YouTube/Vimeo auto-embed)                  |
| `_markil_video_embed`         | HTML         | کد جاسازی دلخواه                                       |
| `_markil_video_membership`    | '1' / '0'    | پرچم محدودیت عضویت                                     |
| `_markil_reviews`             | array[]      | نظرات [user_id, name, rating, comment, date]           |

---

## format_module() — مهم‌ترین تابع

```php
// پایه — برای کارت‌های گرید:
$data = $ajax->format_module( $post_id );

// کامل — برای پنل کناری و صفحه جزئیات:
$data = $ajax->format_module( $post_id, true );
```

خروجی شامل کلید `tabs` به این شکل است:

```php
$data['tabs'] = [
    [ 'label' => 'جزئیات', 'summary' => '...', 'content' => '...' ],
    [ 'label' => 'امکانات', 'summary' => '...', 'content' => '...' ],
    // ...
];
```

---

## رفتار دکمه «جزئیات بیشتر»

از v2.6 رفتار دکمه ثانویه (`btn_secondary_action`):

| مقدار           | رفتار                                                            |
|-----------------|-----------------------------------------------------------------|
| `detail_page` (پیش‌فرض) | به `_markil_detail_page` یا `get_permalink()` می‌رود |
| `wc_add`        | افزودن به سبد ووکامرس (`?add-to-cart=ID`)                         |
| `wc_page`       | به صفحه محصول ووکامرس                                            |
| `custom_url`    | به `_markil_secondary_custom_url`                                 |

اگر `_markil_detail_page` خالی باشد، خودکار به `/markil-module/slug/` می‌رود.

---

## AJAX Endpoints

| Action                       | توضیح                              |
|------------------------------|------------------------------------|
| `markil_filter_modules`      | فیلتر + صفحه‌بندی گرید             |
| `markil_get_module_detail`   | داده JSON برای پنل کناری           |
| `markil_submit_review`       | ثبت نظر (login required)            |
| `markil_toggle_wishlist`     | علاقه‌مندی (login required)         |

**حذف‌شده در v2.6:** `markil_render_full_detail` (مودال حذف شد).

---

## فلیترهای قابل استفاده

```php
// تغییر تنظیمات صفحه single
add_filter( 'markil_single_settings', function( $s, $id, $m ) {
    return $s;
}, 10, 3 );
```

---

## نصب و تأیید

1. ZIP را در وردپرس → افزونه‌ها → آپلود → نصب
2. فعال‌سازی
3. منو «مارکیل ماژول‌ها» باید ظاهر شود
4. در ویرایش یک ماژول:
   - meta box «گالری تصاویر و ویدیو» باید دیده شود
   - meta box «محتوای تب‌ها» باید دو فیلد جدا (خلاصه + کامل) با ویرایشگر TinyMCE داشته باشد
   - meta box «صفحه جزئیات کامل» باید دیده شود

### تأیید صفحه single:
1. یک ماژول ایجاد + منتشر کنید
2. روی «مشاهده» کلیک کنید
3. URL باید `/markil-module/{slug}/` باشد
4. صفحه‌ای زیبا مانند تصویر نمونه باید نمایش داده شود

---

## تاریخچه نسخه‌ها

- **v2.4** — نسخه پایه
- **v2.5** — گالری اسلایدر + بخش ویدیو + مودال + رفع باگ‌ها
- **v2.6** — حذف مودال + اضافه شدن single page واقعی + ویرایشگر حرفه‌ای wp_editor در تب‌ها + جداسازی summary/content

---

## پشتیبانی

[markil.ir](https://markil.ir)
