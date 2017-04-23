describe('taBind.events', function () {
	'use strict';
	beforeEach(module('textAngular'));
	afterEach(inject(function($document){
		$document.find('body').html('');
	}));
	var $rootScope;
	
	it('should prevent mousedown from propagating up from contenteditable', inject(function($compile, $rootScope){
		var element = $compile('<div ta-bind contenteditable="true" ng-model="test"></div>')($rootScope);
		var event;
		if(angular.element === jQuery){
			event = jQuery.Event('mousedown');
			element.triggerHandler(event);
			$rootScope.$digest();
			
			expect(event.isPropagationStopped()).toBe(true);
		}else{
			var _stopPropagation = false;
			event = {stopPropagation: function(){ _stopPropagation = true; }};
			element.triggerHandler('mousedown', event);
			$rootScope.$digest();
			expect(_stopPropagation).toBe(true);
		}
	}));
	
	describe('should update from cut and paste events', function () {
		// non-contenteditable is handled by the change event now
		
		describe('on content-editable', function () {
			var $rootScope, element, $timeout;
			beforeEach(inject(function (_$compile_, _$rootScope_, _$timeout_, $document, $window) {
				$rootScope = _$rootScope_;
				$timeout = _$timeout_;
				$rootScope.html = '<p>Test Contents</p>';
				element = _$compile_('<div contenteditable="true" ta-bind ng-model="html"></div>')($rootScope);
				$document.find('body').append(element);
				$rootScope.$digest();
				var sel = $window.rangy.getSelection();
				var range = $window.rangy.createRangyRange();
				range.selectNodeContents(element.find('p')[0]);
				sel.setSingleRange(range);
			}));
			afterEach(function(){
				element.remove();
			});
			
			// var text = (e.originalEvent || e).clipboardData.getData('text/plain') || $window.clipboardData.getData('Text');
			describe('should update model from paste', function () {
				it('non-ie based w/o jquery', inject(function($window){
					element.triggerHandler('paste', {clipboardData: {types: ['text/plain'], getData: function(){ return 'Test 3 Content'; }}});
					$timeout.flush();
					$rootScope.$digest();
					expect($rootScope.html).toBe('<p>Test 3 Content</p>');
				}));
				
				it('non-ie based w/ jquery', inject(function($window){
					element.triggerHandler('paste', {originalEvent: {clipboardData: {types: ['text/plain'], getData: function(){ return 'Test 3 Content'; } }}});
					$timeout.flush();
					$rootScope.$digest();
					expect($rootScope.html).toBe('<p>Test 3 Content</p>');
				}));
				
				it('non-ie based w/o paste content', inject(function($window){
					element.triggerHandler('paste');
					$timeout.flush();
					$rootScope.$digest();
					expect($rootScope.html).toBe('<p>Test Contents</p>');
				}));
			});
	
			it('should update model from cut', function () {
				element.html('<div>Test 2 Content</div>');
				element.triggerHandler('cut');
				$timeout.flush();
				$rootScope.$digest();
				expect($rootScope.html).toBe('<div>Test 2 Content</div>');
			});
		});
		
		describe('on content-editable with readonly', function () {
			var $rootScope, element, $timeout;
			beforeEach(inject(function (_$compile_, _$rootScope_, _$timeout_, $document, $window) {
				$rootScope = _$rootScope_;
				$timeout = _$timeout_;
				$rootScope.html = '<p>Test Contents</p>';
				element = _$compile_('<div contenteditable="true" ta-readonly="true" ta-bind ng-model="html"></div>')($rootScope);
				$document.find('body').append(element);
				$rootScope.$digest();
				var sel = $window.rangy.getSelection();
				var range = $window.rangy.createRangyRange();
				range.selectNodeContents(element.find('p')[0]);
				sel.setSingleRange(range);
			}));
			afterEach(function(){
				element.remove();
			});
			
			// var text = (e.originalEvent || e).clipboardData.getData('text/plain') || $window.clipboardData.getData('Text');
			describe('should not update model from paste', function () {
				it('ie based', inject(function($window){
					$window.clipboardData = {
						getData: function(){ return 'Test 2 Content'; }
					};
					element.triggerHandler('paste');
					$rootScope.$digest();
					$timeout.flush();
					expect($rootScope.html).toBe('<p>Test Contents</p>');
					$window.clipboardData = undefined;
				}));
				
				it('non-ie based', inject(function($window){
					element.triggerHandler('paste', {clipboardData: {types: ['text/plain'], getData: function(){ return 'Test 3 Content'; }}});
					$rootScope.$digest();
					$timeout.flush();
					expect($rootScope.html).toBe('<p>Test Contents</p>');
				}));
			});
		});

		describe('on content-editable with ta-unsafe-sanitizer=true attribute', function () {
			var $rootScope, element, $timeout;
			beforeEach(inject(function (_$compile_, _$rootScope_, _$timeout_, $document, $window) {
				$rootScope = _$rootScope_;
				$timeout = _$timeout_;
				$rootScope.html = '<p>Test Contents</p>';
				element = _$compile_('<div contenteditable="true" ta-unsafe-sanitizer="true" ta-bind ng-model="html"></div>')($rootScope);
				$document.find('body').append(element);
				$rootScope.$digest();
				var sel = $window.rangy.getSelection();
				var range = $window.rangy.createRangyRange();
				range.selectNodeContents(element.find('p')[0]);
				sel.setSingleRange(range);
			}));
			afterEach(function(){
				element.remove();
			});

			// var text = (e.originalEvent || e).clipboardData.getData('text/plain') || $window.clipboardData.getData('Text');
			describe('should update model from paste keeping all styles', function () {
				it('non-ie based w/o jquery', inject(function($window){
					element.triggerHandler('paste', {clipboardData: {types: ['text/html'], getData: function(){ return '<font style="font-size:10px">Test 4 Content</font>'; }}});
					$timeout.flush();
					$rootScope.$digest();
					expect($rootScope.html).toBe('<p><font style="font-size:10px">Test 4 Content</font></p>');
				}));

				it('non-ie based w/ jquery', inject(function($window){
					element.triggerHandler('paste', {originalEvent: {clipboardData: {types: ['text/html'], getData: function(){ return '<font style="font-size:10px">Test 4 Content</font>';} }}});
					$timeout.flush();
					$rootScope.$digest();
					expect($rootScope.html).toBe('<p><font style="font-size:10px">Test 4 Content</font></p>');
				}));

			});

		});

	});
	
	describe('handles the ta-paste event correctly', function(){
		it('allows conversion of html', inject(function($window, $rootScope, _$compile_, $document, $timeout){
			$rootScope.html = '<p>Test Contents</p>';
			$rootScope.converter = function(html){
				expect(html).toBe('<font>Test 4 Content</font>');
				return '<b>Changed Content</b>';
			};
			var element = _$compile_('<div contenteditable="true" ta-paste="converter($html)" ta-bind ng-model="html"></div>')($rootScope);
			$document.find('body').append(element);
			$rootScope.$digest();
			var sel = $window.rangy.getSelection();
			var range = $window.rangy.createRangyRange();
			range.selectNodeContents(element.find('p')[0]);
			sel.setSingleRange(range);
			element.triggerHandler('paste', {originalEvent: {clipboardData: {types: ['text/html'], getData: function(){ return '<font>Test 4 Content</font>';} }}});
			$timeout.flush();
			$rootScope.$digest();
			expect($rootScope.html).toBe('<p><b>Changed Content</b></p>');
		}));
	});
	
	describe('emits the ta-drop-event event correctly', function(){
		afterEach(inject(function($timeout){
			try{
				$timeout.flush();
			}catch(e){}
		}));
		describe('without read-only attr', function(){
			var $rootScope, element;
			beforeEach(inject(function (_$compile_, _$rootScope_) {
				$rootScope = _$rootScope_;
				$rootScope.html = '<p>Test Contents</p>';
				element = _$compile_('<div ta-bind contenteditable="contenteditable" ng-model="html"></div>')($rootScope);
				$rootScope.$digest();
			}));
			it('should fire on drop event', function(){
				var success = false;
				$rootScope.$on('ta-drop-event', function(){
					success = true;
				});
				element.triggerHandler('drop');
				$rootScope.$digest();
				expect(success).toBe(true);
			});
			it('should fire on drop event only once', function(){
				var count = 0;
				$rootScope.$on('ta-drop-event', function(){
					count++;
				});
				element.triggerHandler('drop');
				$rootScope.$digest();
				element.triggerHandler('drop');
				$rootScope.$digest();
				// as we don't flush the $timeout it should never reset to being able to send another event
				expect(count).toBe(1);
			});
			it('should fire on drop event again after timeout', inject(function($timeout){
				var count = 0;
				$rootScope.$on('ta-drop-event', function(){
					count++;
				});
				element.triggerHandler('drop');
				$rootScope.$digest();
				$timeout.flush();
				element.triggerHandler('drop');
				$rootScope.$digest();
				// as we don't flush the $timeout it should never reset to being able to send another event
				expect(count).toBe(2);
			}));
		});
		describe('with read-only attr initially false', function(){
			var $rootScope, element;
			beforeEach(inject(function (_$compile_, _$rootScope_) {
				$rootScope = _$rootScope_;
				$rootScope.html = '<p>Test Contents</p>';
				$rootScope.readonly = false;
				element = _$compile_('<div ta-bind contenteditable="contenteditable" ta-readonly="readonly" ng-model="html"></div>')($rootScope);
				$rootScope.$digest();
			}));
			it('should fire on drop event', function(){
				var success = false;
				$rootScope.$on('ta-drop-event', function(){
					success = true;
				});
				element.triggerHandler('drop');
				$rootScope.$digest();
				expect(success).toBe(true);
			});
			it('should not fire on drop event when changed to readonly mode', function(){
				$rootScope.readonly = true;
				$rootScope.$digest();
				var success = false;
				$rootScope.$on('ta-drop-event', function(){
					success = true;
				});
				element.triggerHandler('drop');
				$rootScope.$digest();
				expect(success).toBe(false);
			});
		});
		describe('with read-only attr initially true', function(){
			var $rootScope, element;
			beforeEach(inject(function (_$compile_, _$rootScope_) {
				$rootScope = _$rootScope_;
				$rootScope.html = '<p>Test Contents</p>';
				$rootScope.readonly = true;
				element = _$compile_('<div ta-bind contenteditable="contenteditable" ta-readonly="readonly" ng-model="html"></div>')($rootScope);
				$rootScope.$digest();
			}));
			it('should not fire on drop event', function(){
				var success = false;
				$rootScope.$on('ta-drop-event', function(){
					success = true;
				});
				element.triggerHandler('drop');
				$rootScope.$digest();
				expect(success).toBe(false);
			});
			it('should fire on drop event when changed to not readonly mode', function(){
				$rootScope.readonly = false;
				$rootScope.$digest();
				var success = false;
				$rootScope.$on('ta-drop-event', function(){
					success = true;
				});
				element.triggerHandler('drop');
				$rootScope.$digest();
				expect(success).toBe(true);
			});
		});
	});
	
	describe('emits the ta-element-select event correctly', function(){
		var $rootScope, element;
		beforeEach(inject(function (_$compile_, _$rootScope_) {
			$rootScope = _$rootScope_;
			$rootScope.html = '<p><a>Test Contents</a><img/></p>';
			element = _$compile_('<div ta-bind contenteditable="contenteditable" ng-model="html"></div>')($rootScope);
			$rootScope.$digest();
		}));
		it('on click of <a> element', function(){
			var targetElement = element.find('a');
			var test;
			$rootScope.$on('ta-element-select', function(event, element){
				test = element;
			});
			targetElement.triggerHandler('click');
			$rootScope.$digest();
			expect(test).toBe(targetElement[0]);
		});
		it('on click of <img> element', function(){
			var targetElement = element.find('img');
			var test;
			$rootScope.$on('ta-element-select', function(event, element){
				test = element;
			});
			targetElement.triggerHandler('click');
			$rootScope.$digest();
			expect(test).toBe(targetElement[0]);
		});
	});
	
	describe('handles tab key in textarea mode', function(){
		var $rootScope, element;
		beforeEach(inject(function (_$compile_, _$rootScope_) {
			$rootScope = _$rootScope_;
			$rootScope.html = '';
			element = _$compile_('<textarea ta-bind ng-model="html"></div>')($rootScope);
			$rootScope.html = '<p><a>Test Contents</a><img/></p>';
			$rootScope.$digest();
		}));
		
		it('should insert \\t on tab key', function(){
			element.val('<p><a>Test Contents</a><img/></p>');
			triggerEvent('keydown', element, {keyCode: 9});
			expect(element.val()).toBe('\t<p><a>Test Contents</a><img/></p>');
		});
		
		describe('should remove \\t on shift-tab', function(){
			it('should remove \\t at start of line', function(){
				element.val('\t<p><a>Test Contents</a><img/></p>');
				triggerEvent('keydown', element, {keyCode: 9, shiftKey: true});
				expect(element.val()).toBe('<p><a>Test Contents</a><img/></p>');
			});
			it('should remove only one \\t at start of line', function(){
				element.val('\t\t<p><a>Test Contents</a><img/></p>');
				triggerEvent('keydown', element, {keyCode: 9, shiftKey: true});
				expect(element.val()).toBe('\t<p><a>Test Contents</a><img/></p>');
			});
			it('should do nothing if no \\t at start of line', function(){
				element.val('<p><a>Test Contents</a><img/></p>');
				triggerEvent('keydown', element, {keyCode: 9, shiftKey: true});
				expect(element.val()).toBe('<p><a>Test Contents</a><img/></p>');
			});
			// Issue with phantomjs not setting target to end? It works just not in tests.
			it('should remove only one \\t at start of the current line', function(){
				element.val('\t\t<p><a>Test Contents</a><img/></p>\n\t\t<p><a>Test Contents</a><img/></p>');
				triggerEvent('keydown', element, {keyCode: 9, shiftKey: true});
				expect(element.val()).toBe('\t<p><a>Test Contents</a><img/></p>\n\t\t<p><a>Test Contents</a><img/></p>');
			});
		});
	});
});