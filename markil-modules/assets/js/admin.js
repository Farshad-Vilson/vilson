/**
 * Markil Modules — Admin JS
 * Handles color pickers in the Settings page.
 */
(function($){
    'use strict';
    $(function(){
        // Initialize WordPress color pickers on settings page
        if ( $.fn.wpColorPicker ) {
            $('input[type="color"].markil-color-picker, .markil-settings-wrap input[type="color"]').wpColorPicker();
        }
    });
})(jQuery);
