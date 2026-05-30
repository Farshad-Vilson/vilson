<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>
<div class="peyda-wrap" dir="rtl">

	<div class="peyda-header">
		<div class="peyda-logo">
			<span class="dashicons dashicons-editor-textcolor"></span>
		</div>
		<div class="peyda-title-box">
			<h1>تنظیمات فونت پیدا</h1>
			<p>فونت فارسی پیدا با ۹ وزن مختلف — سبک، منعطف، حرفه‌ای</p>
		</div>
	</div>

	<?php if ( isset( $_GET['settings-updated'] ) ) : ?>
		<div class="peyda-notice peyda-notice-success">
			<span class="dashicons dashicons-yes-alt"></span>
			تنظیمات با موفقیت ذخیره شد.
		</div>
	<?php endif; ?>

	<form method="post" action="options.php">
		<?php settings_fields( 'peyda_font_group' ); ?>

		<div class="peyda-grid">

			<!-- ستون راست: نوع فونت -->
			<div class="peyda-card">
				<div class="peyda-card-header">
					<span class="dashicons dashicons-art"></span>
					نوع فونت
				</div>
				<div class="peyda-card-body">
					<p class="peyda-desc">انتخاب کنید کدام نسخه فونت پیدا روی سایت بارگذاری شود:</p>

					<?php
					$variants = array(
						'standard'       => array(
							'label' => 'استاندارد (PeydaWeb)',
							'desc'  => 'نسخه پیش‌فرض — اعداد انگلیسی، مناسب اکثر سایت‌ها',
						),
						'farsi-numerals' => array(
							'label' => 'اعداد فارسی (PeydaWebFaNum)',
							'desc'  => 'اعداد به شکل فارسی نمایش داده می‌شوند — مناسب سایت‌های کاملاً فارسی',
						),
						'non-english'    => array(
							'label' => 'بدون انگلیسی (PeydaWebNoEn)',
							'desc'  => 'فقط حروف فارسی — اعداد و انگلیسی با فونت پیش‌فرض مرورگر',
						),
					);
					$current_variant = isset( $options['font_variant'] ) ? $options['font_variant'] : 'standard';
					foreach ( $variants as $key => $variant ) : ?>
						<label class="peyda-radio-card <?php echo $current_variant === $key ? 'active' : ''; ?>">
							<input type="radio" name="<?php echo PEYDA_FONT_OPTION; ?>[font_variant]"
								value="<?php echo esc_attr( $key ); ?>"
								<?php checked( $current_variant, $key ); ?>>
							<div class="peyda-radio-content">
								<strong><?php echo esc_html( $variant['label'] ); ?></strong>
								<span><?php echo esc_html( $variant['desc'] ); ?></span>
							</div>
						</label>
					<?php endforeach; ?>
				</div>
			</div>

			<!-- ستون چپ: تگ‌های اصلی -->
			<div class="peyda-card">
				<div class="peyda-card-header">
					<span class="dashicons dashicons-tag"></span>
					تگ‌های اصلی HTML
				</div>
				<div class="peyda-card-body">
					<p class="peyda-desc">فونت پیدا را روی کدام تگ‌ها فعال کنید:</p>

					<?php
					$tags = array(
						'enable_body'     => array( 'label' => 'body', 'desc' => 'کل صفحه — پیشنهادی' ),
						'enable_h1'       => array( 'label' => 'h1', 'desc' => 'عنوان اصلی' ),
						'enable_h2'       => array( 'label' => 'h2', 'desc' => 'عنوان دوم' ),
						'enable_h3'       => array( 'label' => 'h3', 'desc' => 'عنوان سوم' ),
						'enable_h4'       => array( 'label' => 'h4', 'desc' => 'عنوان چهارم' ),
						'enable_h5'       => array( 'label' => 'h5', 'desc' => 'عنوان پنجم' ),
						'enable_h6'       => array( 'label' => 'h6', 'desc' => 'عنوان ششم' ),
						'enable_p'        => array( 'label' => 'p', 'desc' => 'پاراگراف' ),
						'enable_a'        => array( 'label' => 'a', 'desc' => 'لینک' ),
						'enable_button'   => array( 'label' => 'button', 'desc' => 'دکمه' ),
						'enable_input'    => array( 'label' => 'input', 'desc' => 'فیلد ورودی' ),
						'enable_textarea' => array( 'label' => 'textarea', 'desc' => 'متن طولانی' ),
						'enable_select'   => array( 'label' => 'select', 'desc' => 'لیست کشویی' ),
						'enable_li'       => array( 'label' => 'li', 'desc' => 'آیتم لیست' ),
						'enable_span'     => array( 'label' => 'span', 'desc' => 'اسپن' ),
					);
					foreach ( $tags as $key => $tag ) :
						$checked = ! empty( $options[ $key ] );
					?>
					<label class="peyda-toggle-row">
						<div class="peyda-toggle-info">
							<code class="peyda-tag-code">&lt;<?php echo esc_html( $tag['label'] ); ?>&gt;</code>
							<span class="peyda-tag-desc"><?php echo esc_html( $tag['desc'] ); ?></span>
						</div>
						<div class="peyda-toggle-switch">
							<input type="checkbox" id="<?php echo esc_attr( $key ); ?>"
								name="<?php echo PEYDA_FONT_OPTION; ?>[<?php echo esc_attr( $key ); ?>]"
								value="1" <?php checked( $checked ); ?>>
							<span class="peyda-slider"></span>
						</div>
					</label>
					<?php endforeach; ?>
				</div>
			</div>

			<!-- تگ‌های سفارشی -->
			<div class="peyda-card peyda-card-full">
				<div class="peyda-card-header">
					<span class="dashicons dashicons-edit"></span>
					سلکتورهای سفارشی
				</div>
				<div class="peyda-card-body">
					<p class="peyda-desc">
						سلکتورهای CSS دلخواه را اینجا وارد کنید. هر سلکتور در یک خط یا با کاما جدا کنید.<br>
						<strong>مثال:</strong> <code>.my-class</code> یا <code>#my-id</code> یا <code>.elementor-widget-heading .elementor-heading-title</code>
					</p>
					<textarea
						name="<?php echo PEYDA_FONT_OPTION; ?>[custom_selectors]"
						id="peyda-custom-selectors"
						rows="6"
						placeholder=".my-class&#10;#my-id&#10;.elementor-heading-title&#10;.woocommerce-product-details__short-description"
					><?php echo esc_textarea( isset( $options['custom_selectors'] ) ? $options['custom_selectors'] : '' ); ?></textarea>
				</div>
			</div>

			<!-- تنظیمات اضافی -->
			<div class="peyda-card peyda-card-full">
				<div class="peyda-card-header">
					<span class="dashicons dashicons-admin-settings"></span>
					تنظیمات پیشرفته
				</div>
				<div class="peyda-card-body">
					<label class="peyda-toggle-row">
						<div class="peyda-toggle-info">
							<span class="peyda-tag-code">بارگذاری در پنل ادمین</span>
							<span class="peyda-tag-desc">فونت پیدا در صفحات مدیریت وردپرس هم نمایش داده شود</span>
						</div>
						<div class="peyda-toggle-switch">
							<input type="checkbox" id="load_in_admin"
								name="<?php echo PEYDA_FONT_OPTION; ?>[load_in_admin]"
								value="1" <?php checked( ! empty( $options['load_in_admin'] ) ); ?>>
							<span class="peyda-slider"></span>
						</div>
					</label>
				</div>
			</div>

		</div><!-- .peyda-grid -->

		<!-- پیش‌نمایش CSS تولیدشده -->
		<div class="peyda-card peyda-card-full peyda-preview-card">
			<div class="peyda-card-header">
				<span class="dashicons dashicons-editor-code"></span>
				پیش‌نمایش CSS نهایی
				<small>این CSS به صورت خودکار به سایت اضافه می‌شود</small>
			</div>
			<div class="peyda-card-body">
				<div class="peyda-font-preview">
					<p style="font-size:28px;font-weight:900;">پیدا بلک — Black 900</p>
					<p style="font-size:24px;font-weight:700;">پیدا بولد — Bold 700</p>
					<p style="font-size:20px;font-weight:500;">پیدا مدیوم — Medium 500</p>
					<p style="font-size:18px;font-weight:400;">پیدا رگولار — Regular 400</p>
					<p style="font-size:16px;font-weight:300;">پیدا لایت — Light 300</p>
					<p style="font-size:14px;font-weight:100;">پیدا تین — Thin 100</p>
				</div>
			</div>
		</div>

		<div class="peyda-actions">
			<?php submit_button( 'ذخیره تنظیمات', 'primary peyda-save-btn', 'submit', false ); ?>
		</div>

	</form>
</div>
