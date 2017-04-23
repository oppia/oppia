describe('taBind._taBlankTest', function () {
	'use strict';
	beforeEach(module('textAngular'));
	afterEach(inject(function($document){
		$document.find('body').html('');
	}));
	var testString = function(result){ return function(_str){
		it(_str, inject(function (_taBlankTest) {
			expect(_taBlankTest('<p><br></p>')(_str)).toBe(result);
		}));
	};};
	
	describe('should return true for', function () {
		it('undefined', inject(function (_taBlankTest) {
			expect(_taBlankTest('<p><br></p>')()).toBe(true);
		}));
		angular.forEach(['<p></p>','<p><br></p>','', '<pre><br/></pre>'], testString(true));
	});
	
	describe('should return false for', function () {
		angular.forEach(
			[
				'<p>test</p>',
				'<p>Test Some<br></p>',
				'Some Test',
				'<p><img class="ta-insert-video" src="https://img.youtube.com/vi/sbQQKI1Fwo4/hqdefault.jpg" ta-insert-video="https://www.youtube.com/embed/sbQQKI1Fwo4" contenteditable="false" allowfullscreen="true" frameborder="0"><br></p>',
				'<p></p><p style="color: rgb(68, 68, 68);text-align: left;background-color: rgb(255, 255, 255);"><u><b>ATTITUDES:</b></u></p>',
				'<div class="AppContainer" style="width: 1280px;color: rgb(0, 0, 0);">' + // a real world case from #512
    '<div id="c_base" class="c_base">' +
        '<div id="c_content" class="c_main">' +
            '<div id="pageContent">' +
                '<div id="pageInbox" class="v-Page">' +
                    '<div id="inboxControl0f">' +
                        '<div class="containsYSizerBar" style="height: 849px;width: 1280px;">' +
                            '<div class="ContentRight WithRightRail FullView">' +
                                '<div class="ContentRightInner t_mbgc t_qtc t_urtc" style="color: rgb(68, 68, 68);background-color: rgb(255, 255, 255);">' +
                                    '<div id="inboxControl0fv-ReadMessageContainer" class="v-ReadMessageContainer slideOnResize">' +
                                        '<div class="c-ReadMessage" style="height: 818.03125px;width: 895px;">' +
                                            '<div class="rmMessages ClearBoth" id="ReadMessageScrollableSection">' +
                                                '<div id="readMessagePartControl1604f" class="c-ReadMessagePart ReadMsgContainer HasLayout ClearBoth HideShadows FullPart NoHistory Read RmIc">' +
                                                    '<div class="c-ReadMessagePartBody">' +
                                                        '<div class="readMsgBody">' +
                                                            '<div id="bodyreadMessagePartBodyControl1609f" class="ExternalClass MsgBodyContainer">' +
                                                                '<p><u><b>Lorem ipsum</b></u></p>' +
                                                                '<p><b>Lorem ipsum</b></p>' +
				'</div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></div>'
			],
			testString(false)
		);
	});

});