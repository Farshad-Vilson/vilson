<?php if(!defined('ABSPATH')) exit; ?>
<div class="markil-reviews-list">
    <?php if(empty($reviews)): ?>
        <p class="markil-no-reviews"><?php _e('هنوز نظری ثبت نشده است.','markil-modules'); ?></p>
    <?php else: ?>
        <?php foreach($reviews as $review): ?>
        <div class="markil-review-item">
            <div class="markil-review-header">
                <img src="<?php echo esc_url($review['avatar']); ?>" alt="<?php echo esc_attr($review['name']); ?>" class="markil-review-avatar">
                <div class="markil-review-meta">
                    <span class="markil-reviewer-name"><?php echo esc_html($review['name']); ?></span>
                    <div class="markil-review-stars">
                        <?php for($i=1;$i<=5;$i++): ?>
                        <span class="markil-star <?php echo $i<=$review['rating']?'filled':''; ?>">★</span>
                        <?php endfor; ?>
                    </div>
                    <span class="markil-review-date"><?php echo date_i18n(get_option('date_format'), strtotime($review['date'])); ?></span>
                </div>
            </div>
            <?php if(!empty($review['comment'])): ?>
            <p class="markil-review-comment"><?php echo esc_html($review['comment']); ?></p>
            <?php endif; ?>
        </div>
        <?php endforeach; ?>
    <?php endif; ?>
</div>
