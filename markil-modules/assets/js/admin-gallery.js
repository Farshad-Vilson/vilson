/**
 * Markil Modules — Admin Gallery Uploader
 *
 * Handles the WP Media Gallery picker for the gallery meta box
 * on the markil_module post edit page.
 *
 * Also shows/hides the custom URL fields based on the action dropdown selection.
 */
(function($){
    'use strict';

    /* ── Gallery Uploader ──────────────────────────────────────────────── */
    var mediaFrame;

    $('#markil-gallery-open-btn').on('click', function(e){
        e.preventDefault();

        // Re-use the media frame if already created
        if (mediaFrame) {
            mediaFrame.open();
            return;
        }

        mediaFrame = wp.media({
            title:    'انتخاب تصاویر گالری',
            button:   { text: 'افزودن به گالری' },
            multiple: true,
            library:  { type: 'image' }
        });

        mediaFrame.on('select', function(){
            var selection = mediaFrame.state().get('selection');
            var ids       = [];
            var $previews = $('#markil-gallery-previews');

            // Remove "no images" placeholder if present
            $previews.find('.markil-gallery-placeholder').remove();

            selection.each(function(attachment){
                var a    = attachment.toJSON();
                var thumb = (a.sizes && a.sizes.thumbnail) ? a.sizes.thumbnail.url : a.url;

                // Avoid duplicates
                if ($previews.find('[data-id="' + a.id + '"]').length) return;

                $previews.append(
                    '<div class="markil-gallery-item" data-id="' + a.id + '">' +
                        '<img src="' + thumb + '" alt="">' +
                        '<button type="button" class="markil-gallery-item-remove" title="حذف">✕</button>' +
                    '</div>'
                );
            });

            // Rebuild the hidden IDs field
            _rebuildIds();
        });

        mediaFrame.open();
    });

    // Remove an image from the gallery
    $(document).on('click', '.markil-gallery-item-remove', function(e){
        e.preventDefault();
        e.stopPropagation();
        $(this).closest('.markil-gallery-item').remove();
        if ($('#markil-gallery-previews .markil-gallery-item').length === 0) {
            $('#markil-gallery-previews').html('<span class="markil-gallery-placeholder">هنوز تصویری اضافه نشده — دکمه زیر را بزنید</span>');
        }
        _rebuildIds();
    });

    function _rebuildIds(){
        var ids = [];
        $('#markil-gallery-previews .markil-gallery-item').each(function(){
            var id = parseInt($(this).data('id'), 10);
            if (id) ids.push(id);
        });
        $('#markil-gallery-ids').val(ids.join(','));
    }

    /* ── Custom URL show/hide ──────────────────────────────────────────── */
    function setupCustomUrlToggle(selectName, rowClass){
        var $sel = $('[name="' + selectName + '"]');
        if (!$sel.length) return;
        $sel.on('change', function(){
            $(this).closest('table').find('.' + rowClass).toggle($(this).val() === 'custom_url');
        });
    }

    setupCustomUrlToggle('_markil_btn_primary_action',   'markil-btn1-custom-row');
    setupCustomUrlToggle('_markil_btn_secondary_action', 'markil-btn2-custom-row');

})(jQuery);
