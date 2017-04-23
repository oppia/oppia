describe('taBind.sanitize', function () {
	'use strict';
	beforeEach(module('textAngular'));
	afterEach(inject(function($document){
		$document.find('body').html('');
	}));
	var $rootScope;
	
	describe('should use taSanitize to', function () {
		var $rootScope, element;
		beforeEach(inject(function (_$compile_, _$rootScope_) {
			$rootScope = _$rootScope_;
			$rootScope.html = '<p>Test Contents</p>';
			element = _$compile_('<div ta-bind contenteditable="contenteditable" ng-model="html"></div>')($rootScope);
			$rootScope.$digest();
		}));

		it('parse from change events', function () {
			element.append('<bad-tag>Test 2 Content</bad-tag>');
			$rootScope.updateTaBind();
			$rootScope.$digest();
			expect($rootScope.html).toBe('<p>Test Contents</p><p>Test 2 Content</p>');
		});

		it('format from model change', function () {
			$rootScope.html += '<bad-tag>Test 2 Content</bad-tag>';
			$rootScope.$digest();
			expect(element.html()).toBe('<p>Test Contents</p><p>Test 2 Content</p>');
		});
	});
	
	describe('should respect taUnsafeSanitizer attribute', function () {
		var $rootScope, element;
		beforeEach(inject(function (_$compile_, _$rootScope_) {
			$rootScope = _$rootScope_;
			$rootScope.html = '<p>Test Contents</p>';
			element = _$compile_('<div ta-bind contenteditable="contenteditable" ta-unsafe-sanitizer="true" ng-model="html"></div>')($rootScope);
			$rootScope.$digest();
		}));

		it('allow bad tags', function () {
			element.append('<bad-tag>Test 2 Content</bad-tag>');
			$rootScope.updateTaBind();
			$rootScope.$digest();
			expect($rootScope.html).toBe('<p>Test Contents</p><p><bad-tag>Test 2 Content</bad-tag></p>');
		});
		
		it('not allow malformed html', function () {
			element.append('<bad-tag Test 2 Content</bad-tag>');
			$rootScope.updateTaBind();
			$rootScope.$digest();
			expect($rootScope.html).toBe('<p>Test Contents</p>');
		});
	});

});