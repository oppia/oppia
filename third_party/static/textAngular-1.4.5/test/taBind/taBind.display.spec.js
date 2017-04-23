describe('taBind.display', function () {
	'use strict';
	beforeEach(module('textAngular'));
	afterEach(inject(function($document){
		$document.find('body').html('');
	}));
	
	var $rootScope;
	
	describe('should respect HTML5 placeholder', function () {
		describe('and require an id', function(){
			it('should error', inject(function ($compile, $rootScope) {
				expect(function(){
					$rootScope.html = '';
					$compile('<div ta-bind contenteditable="true" ng-model="html" placeholder="Add Comment"></div>')($rootScope);
				}).toThrow('textAngular Error: An unique ID is required for placeholders to work');
			}));
		});
		
		describe('and cleanup after itself on $destroy', function(){
			it('removing specific styles', inject(function ($compile, $rootScope, $document) {
				$rootScope.html = '';
				var element = $compile('<div ta-bind id="test" contenteditable="true" ng-model="html" placeholder="Add Comment"></div>')($rootScope);
				$rootScope.$digest();
				expect(document.styleSheets[1].rules.length).toBe(1);
				element.scope().$destroy();
				$rootScope.$digest();
				expect(document.styleSheets[1].rules.length).toBe(0);
			}));
		});
		
		describe('as contenteditable div initially blank', function(){
			var $rootScope, element, $window;
			beforeEach(inject(function (_$compile_, _$rootScope_, _$window_, $document) {
				$window = _$window_;
				$rootScope = _$rootScope_;
				$rootScope.html = '';
				element = _$compile_('<div ta-bind id="test" contenteditable="true" ng-model="html" placeholder="Add Comment"></div>')($rootScope);
				$document.find('body').append(element);
				$rootScope.$digest();
			}));
			
			afterEach(function(){
				element.remove();
			});
			// Cases: '' value; _defaultVal (<p><br></p>); Other Value
			it('should add the placeholder-text class', function () {
				expect(element.hasClass('placeholder-text')).toBe(true);
			});
			it('should add the placeholder text', function () {
				expect(element.html()).toEqual('<p><br></p>');
				expect($window.getComputedStyle(element[0], ':before').getPropertyValue('content')).toBe("'Add Comment'");
			});
			it('should remove the placeholder-text class on focusin', function () {
				element.triggerHandler('focus');
				$rootScope.$digest();
				expect(element.hasClass('placeholder-text')).toBe(false);
			});
			it('should add the placeholder text back on blur if the input is blank', function () {
				element.triggerHandler('focus');
				$rootScope.$digest();
				expect(element.html()).toEqual('<p><br></p>');
				expect($window.getComputedStyle(element[0], ':before').length).toBe(0);
				element.triggerHandler('blur');
				$rootScope.$digest();
				expect(element.html()).toEqual('<p><br></p>');
				expect($window.getComputedStyle(element[0], ':before').getPropertyValue('content')).toBe("'Add Comment'");
			});
			it('should add the placeholder-text class back on blur if the input is blank', function () {
				element.triggerHandler('focus');
				$rootScope.$digest();
				expect(element.hasClass('placeholder-text')).toBe(false);
				element.triggerHandler('blur');
				$rootScope.$digest();
				expect(element.hasClass('placeholder-text')).toBe(true);
			});
			it('should not add the placeholder text back on blur if the input is not blank', function () {
				element.triggerHandler('focus');
				$rootScope.$digest();
				$rootScope.html = '<p>Lorem Ipsum</p>';
				element.triggerHandler('blur');
				$rootScope.$digest();
				expect($window.getComputedStyle(element[0], ':before').getPropertyValue('display')).toBe("");
				expect(element.html()).toEqual('<p>Lorem Ipsum</p>');
			});
			it('should not add the placeholder-text class back on blur if the input is not blank', function () {
				element.triggerHandler('focus');
				$rootScope.$digest();
				expect(element.hasClass('placeholder-text')).toBe(false);
				$rootScope.html = '<p>Lorem Ipsum</p>';
				$rootScope.$digest();
				element.triggerHandler('blur');
				$rootScope.$digest();
				expect(element.hasClass('placeholder-text')).toBe(false);
			});
			it('should not add the placeholder text back if focussed and blank', function () {
				element.triggerHandler('focus');
				$rootScope.$digest();
				$rootScope.html = '<p>Lorem Ipsum</p>';
				$rootScope.$digest();
				$rootScope.html = '';
				$rootScope.$digest();
				expect($window.getComputedStyle(element[0], ':before').getPropertyValue('display')).toBe("");
				expect(element.html()).toEqual('<p><br></p>');
			});
		});
		describe('as contenteditable div initially with content', function(){
			var $rootScope, element, $window;
			beforeEach(inject(function (_$compile_, _$rootScope_, _$window_, $document) {
				$window = _$window_;
				$rootScope = _$rootScope_;
				$rootScope.html = '<p>Lorem Ipsum</p>';
				element = _$compile_('<div ta-bind id="test" contenteditable="true" ng-model="html" placeholder="Add Comment"></div>')($rootScope);
				$document.find('body').append(element);
				$rootScope.$digest();
			}));
			afterEach(function(){
				element.remove();
			});
			// Cases: '' value; _defaultVal (<p><br></p>); Other Value
			it('should not add the placeholder-text class', function () {
				expect(element.hasClass('placeholder-text')).toBe(false);
			});
			it('should add the placeholder text', function () {
				expect(element.html()).toEqual('<p>Lorem Ipsum</p>');
				expect($window.getComputedStyle(element[0], ':before').length).toBe(0);
			});
			it('should remove the placeholder text on focusin', function () {
				element.triggerHandler('focus');
				$rootScope.$digest();
				expect(element.html()).toEqual('<p>Lorem Ipsum</p>');
			});
			it('should remove the placeholder-text class on focusin', function () {
				element.triggerHandler('focus');
				$rootScope.$digest();
				expect(element.hasClass('placeholder-text')).toBe(false);
			});
			it('should add the placeholder text back on blur if the input is blank', function () {
				element.triggerHandler('focus');
				$rootScope.$digest();
				expect(element.html()).toEqual('<p>Lorem Ipsum</p>');
				expect($window.getComputedStyle(element[0], ':before').length).toBe(0);
				element.triggerHandler('blur');
				$rootScope.$digest();
				expect(element.html()).toEqual('<p>Lorem Ipsum</p>');
				expect($window.getComputedStyle(element[0], ':before').length).toBe(0);
			});
			it('should add the placeholder-text class back on blur if the input is blank', function () {
				element.triggerHandler('focus');
				$rootScope.$digest();
				expect(element.hasClass('placeholder-text')).toBe(false);
				element.triggerHandler('blur');
				$rootScope.$digest();
				expect(element.hasClass('placeholder-text')).toBe(false);
			});
		});
	});

	describe('should function as a display div', function () {
		var $rootScope, element;
		beforeEach(inject(function (_$compile_, _$rootScope_) {
			$rootScope = _$rootScope_;
			$rootScope.html = '<p>Test Contents</p>';
			element = _$compile_('<div ta-bind ng-model="html"></div>')($rootScope);
			$rootScope.$digest();
		}));

		it('should display model contents', function () {
			expect(element.html()).toBe('<p>Test Contents</p>');
		});
		it('should NOT update model from keyup', inject(function ($timeout) {
			element.html('<div>Test 2 Content</div>');
			element.triggerHandler('keyup');
			$rootScope.$digest();
			$timeout.flush();
			expect($rootScope.html).toBe('<p>Test Contents</p>');
		}));
		it('should error on update model from update function', function () {
			element.html('<div>Test 2 Content</div>');
			expect(function () {
				$rootScope.updateTaBind();
			}).toThrow('textAngular Error: attempting to update non-editable taBind');
		});
		it('should update display from model change', function () {
			$rootScope.html = '<div>Test 2 Content</div>';
			$rootScope.$digest();
			expect(element.html()).toBe('<div>Test 2 Content</div>');
		});
	});
});