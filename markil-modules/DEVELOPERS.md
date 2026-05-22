# راهنمای توسعه‌دهندگان — Markil Modules v2.5

این سند برای هر برنامه‌نویسی که می‌خواهد افزونه را در آینده ویرایش کند نوشته شده است.

---

## ساختار فایل‌ها

```
markil-modules/
├── markil-modules.php          ← فایل اصلی (autoloader + bootstrap)
├── DEVELOPERS.md               ← همین فایل
│
├── includes/
│   ├── class-markil-plugin.php      ← ثبت CPT، دسته‌بندی، فعال‌سازی
│   ├── class-markil-assets.php      ← enqueue استایل/اسکریپت فرانت + ادمین
│   ├── class-markil-ajax.php        ← تمام AJAX handlerها + format_module()
│   ├── class-markil-meta-boxes.php  ← تمام meta boxهای ادمین
│   ├── class-markil-admin.php       ← صفحه تنظیمات افزونه
│   └── class-markil-elementor.php   ← ثبت ویجت‌های Elementor
│
├── widgets/
│   ├── class-widget-modules-grid.php       ← ویجت گرید ماژول‌ها
│   ├── class-widget-module-detail.php      ← ویجت پنل جزئیات
│   └── class-widget-module-full-detail.php ← ویجت صفحه جزئیات کامل
│
├── templates/
│   ├── full-detail-layout.php  ← قالب HTML صفحه جزئیات کامل
│   └── reviews.php             ← قالب HTML نظرات
│
└── assets/
    ├── css/
    │   ├── frontend.css         ← تمام استایل‌های فرانت‌اند
    │   └── admin.css            ← استایل‌های پنل ادمین
    └── js/
        ├── frontend.js          ← منطق JavaScript فرانت‌اند
        ├── admin.js             ← JS عمومی ادمین (color picker و...)
        └── admin-gallery.js     ← WP Media uploader برای گالری
```

---

## نحوه کارکرد سیستم

### Post Type سفارشی
- نوع پست: `markil_module`
- دسته‌بندی: `markil_category` (سلسله‌مراتبی)
- برچسب: `markil_tag` (غیر سلسله‌مراتبی)

### Autoloader
افزونه از یک autoloader ساده استفاده می‌کند:
- `Markil\ClassName` → `includes/class-markil-ClassName.php` (کوچک)
- استثنا: کلاس‌های Widget در پوشه `widgets/` با `require_once` صریح بارگذاری می‌شوند

### جریان داده (Data Flow)

```
ادمین ذخیره می‌کند
       ↓
save_meta() در class-markil-meta-boxes.php
       ↓
update_post_meta() در دیتابیس
       ↓
JS → AJAX → format_module() در class-markil-ajax.php
       ↓
آرایه PHP → JSON → JavaScript
       ↓
buildModuleCard() یا buildDetailHtml() (در frontend.js)
       یا
AJAX markil_render_full_detail → full-detail-layout.php → HTML
```

---

## Meta Fieldهای ذخیره‌شده

| کلید                        | نوع          | توضیح                                      |
|-----------------------------|--------------|---------------------------------------------|
| `_markil_price`             | text         | قیمت عددی                                   |
| `_markil_old_price`         | text         | قیمت قبلی (خط‌خورده)                        |
| `_markil_is_free`           | '1' / '0'    | آیا رایگان است                               |
| `_markil_version`           | text         | نسخه (مثل 1.2.3)                            |
| `_markil_badge`             | text         | برچسب ویژه (مثل "جدید")                     |
| `_markil_status`            | text         | active / inactive / coming_soon             |
| `_markil_rating`            | float        | امتیاز 0-5                                   |
| `_markil_installs`          | int          | تعداد نصب/سفارش                             |
| `_markil_favorites_count`   | int          | تعداد علاقه‌مندی‌ها                          |
| `_markil_icon_color`        | hex          | رنگ آیکون                                   |
| `_markil_icon_bg`           | hex          | رنگ پس‌زمینه آیکون                          |
| `_markil_wc_product_id`     | int          | شناسه محصول ووکامرس                          |
| `_markil_detail_page`       | URL          | آدرس صفحه جزئیات                            |
| `_markil_btn_primary_text`  | text         | متن دکمه اصلی                               |
| `_markil_btn_secondary_text`| text         | متن دکمه ثانویه                             |
| `_markil_btn_primary_action`| text         | wc_add / wc_page / detail_page / custom_url  |
| `_markil_btn_secondary_action`| text      | detail_page / full_detail_modal / wc_add / wc_page / custom_url |
| `_markil_primary_custom_url`| URL          | لینک دلخواه دکمه اصلی                       |
| `_markil_secondary_custom_url`| URL       | لینک دلخواه دکمه ثانویه                     |
| `_markil_delivery_time`     | text         | زمان تحویل (نمایش در سایدبار)               |
| `_markil_custom_tabs`       | serialized[] | آرایه تب‌های سفارشی [label, content, enabled] |
| `_markil_features_list`     | serialized[] | آرایه ویژگی‌های کلیدی                        |
| `_markil_features_bar`      | serialized[] | نوار ویژگی بالای صفحه [icon, label]          |
| `_markil_sidebar_features`  | serialized[] | آیکون‌های سایدبار [icon, label]              |
| `_markil_detail_sections`   | serialized[] | بخش‌های محتوا [title, icon, tab_index, items[]] |
| `_markil_gallery_images`    | string       | IDs تصاویر گالری جداشده با کاما              |
| `_markil_video_url`         | URL          | لینک ویدیو (یوتیوب/وایمو)                   |
| `_markil_video_embed`       | HTML         | کد جاسازی ویدیو (raw iframe)                |
| `_markil_video_membership`  | '1' / '0'    | پرچم محدودیت عضویت                           |
| `_markil_reviews`           | serialized[] | آرایه نظرات [user_id, name, rating, comment, date] |

---

## format_module() — مهم‌ترین تابع

فایل: `includes/class-markil-ajax.php`

این تابع داده‌های یک ماژول را از دیتابیس می‌خواند و به آرایه‌ای ساختار می‌دهد که توسط JavaScript و قالب‌ها استفاده می‌شود.

```php
// برای AJAX کارت‌ها (فقط اطلاعات پایه):
$data = $this->format_module($post_id);

// برای AJAX جزئیات (اطلاعات کامل):
$data = $this->format_module($post_id, true);
```

**اضافه کردن فیلد جدید:**
1. فیلد را در `class-markil-meta-boxes.php` اضافه کنید (meta box + save_meta)
2. فیلد را در `format_module()` اضافه کنید
3. اگر در قالب PHP استفاده می‌شود: `$m['field_name']` در `full-detail-layout.php`
4. اگر در JavaScript استفاده می‌شود: `m.field_name` در `frontend.js`

---

## قالب صفحه جزئیات کامل

فایل: `templates/full-detail-layout.php`

متغیرهای تزریق‌شده قبل از `include`:

```php
$m        // آرایه داده‌های ماژول (از format_module)
$settings // تنظیمات نمایش (از Elementor یا AJAX handler)
$currency // واحد پول (از گزینه‌های افزونه)
```

این قالب:
1. بالا: breadcrumb + عنوان + excerpt + نوار ویژگی
2. اصلی: ویدیو (اختیاری) + تب‌ها (با sections)
3. سایدبار: گالری slider + قیمت + دکمه‌ها + آمار + ضمانت

---

## AJAX Endpoints

| Action                       | فایل             | توضیح                              |
|------------------------------|------------------|------------------------------------|
| `markil_filter_modules`      | class-markil-ajax | فیلتر + صفحه‌بندی کارت‌ها          |
| `markil_get_module_detail`   | class-markil-ajax | داده JSON برای پنل جزئیات          |
| `markil_render_full_detail`  | class-markil-ajax | HTML کامل برای modal overlay        |
| `markil_submit_review`       | class-markil-ajax | ثبت نظر (نیاز به login)             |
| `markil_toggle_wishlist`     | class-markil-ajax | علاقه‌مندی‌ها (نیاز به login)       |

همه‌ی درخواست‌ها با nonce اعتبارسنجی می‌شوند: `markil_modules_nonce`

---

## گالری تصاویر

تصاویر گالری به صورت IDs جداشده با کاما در `_markil_gallery_images` ذخیره می‌شوند.

در `format_module($id, true)`:
- IDs به URLهای کامل (`wp_get_attachment_image_src`) تبدیل می‌شوند
- به صورت آرایه `[['url'=>'...', 'thumb'=>'...']]` برمی‌گردند
- اگر گالری خالی باشد، featured image به عنوان fallback استفاده می‌شود

در قالب: `$m['gallery_images']`  
در JavaScript: `m.gallery_images`

---

## بخش ویدیو

متغیرها:
- `_markil_video_url` — لینک یوتیوب/وایمو (خودکار به iframe تبدیل می‌شود)
- `_markil_video_embed` — کد جاسازی خودتان (اگر `video_url` خالی باشد)
- `_markil_video_membership` — اگر `'1'` باشد، کلاس `markil-members-only` اضافه می‌شود

**یکپارچه‌سازی با افزونه عضویت:**

در CSS افزونه عضویت خود اضافه کنید:
```css
.markil-members-only { display: none; }
/* یا برای اعضا: */
body.logged-in .markil-members-only { display: block; }
```

---

## Elementor Widgets

| نام کلاس             | Slug                         | کاربرد                            |
|----------------------|------------------------------|-----------------------------------|
| `ModulesGrid`        | `markil_modules_grid`        | نمایش گرید ماژول‌ها با فیلتر       |
| `ModuleDetail`       | `markil_module_detail`       | پنل جزئیات (سایدبار)              |
| `ModuleFullDetail`   | `markil_module_full_detail`  | صفحه جزئیات کامل (standalone)    |

---

## تنظیمات افزونه

در `Settings → مارکیل ماژول‌ها`:

| کلید گزینه                   | پیش‌فرض  | کاربرد                     |
|------------------------------|----------|----------------------------|
| `markil_modules_per_page`    | 12       | تعداد ماژول در هر صفحه      |
| `markil_default_layout`      | grid     | نمای پیش‌فرض (grid/list)    |
| `markil_currency`            | تومان    | واحد پول نمایشی             |
| `markil_show_price`          | 1        | نمایش قیمت در کارت          |
| `markil_show_rating`         | 1        | نمایش امتیاز در کارت        |
| `markil_show_installs`       | 1        | نمایش تعداد نصب/سفارش       |
| `markil_wc_integration`      | 1        | یکپارچه‌سازی با ووکامرس     |
| `markil_primary_color`       | #011627  | رنگ اصلی افزونه             |

---

## راهنمای نصب و تأیید

### نصب دستی (بدون به‌روزرسانی):
1. فایل ZIP را با ابزار FTP یا File Manager استخراج کنید
2. پوشه `markil-modules/` را در `wp-content/plugins/` آپلود کنید
3. **مهم:** نام پوشه باید دقیقاً `markil-modules` باشد
4. در داشبورد وردپرس → افزونه‌ها → فعال‌سازی

### تأیید فعال‌سازی:
1. در ادمین، منو `مارکیل ماژول‌ها` را ببینید
2. روی `افزودن ماژول` کلیک کنید → meta boxهای جدید باید دیده شوند
3. meta box `گالری تصاویر و ویدیو` باید قابل مشاهده باشد
4. meta box `صفحه جزئیات کامل` باید قابل مشاهده باشد

### تأیید گالری:
1. یک ماژول را ویرایش کنید
2. در meta box گالری، دکمه `افزودن/ویرایش گالری` را بزنید
3. چند تصویر انتخاب کنید → باید پیش‌نمایش ظاهر شود
4. ذخیره کنید → در صفحه جزئیات کامل باید slider ظاهر شود

---

## نسخه‌بندی

- **v2.4**: نسخه اولیه با Elementor + ووکامرس
- **v2.5**: اضافه شدن صفحه جزئیات کامل (modal + widget) + گالری slider + بخش ویدیو + رفع تمام باگ‌ها

---

## تماس و پشتیبانی

وب‌سایت: [markil.ir](https://markil.ir)
