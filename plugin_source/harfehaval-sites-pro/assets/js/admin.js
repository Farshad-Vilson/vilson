/* Admin JS — Tabs meta box */
(function($){
	'use strict';
	$(function(){
		$('.ha-pro-admin-tabs').on('click','.ha-pro-tab-remove',function(){
			$(this).closest('.ha-pro-tab-item').remove();
		});
		$('#ha-pro-add-tab').on('click',function(){
			var i = $('.ha-pro-tab-item').length;
			var tpl = $('#ha-pro-tab-tpl').html().replace(/__I__/g, i);
			$('.ha-pro-admin-tabs .ha-pro-tab-list').append(tpl);
		});
	});
}(jQuery));
