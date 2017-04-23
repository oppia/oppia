describe('taBind.$formatters', function () {
	'use strict';
	var $rootScope, element;
	beforeEach(module('textAngular'));
	beforeEach(inject(function(_$rootScope_, $compile){
		$rootScope = _$rootScope_;
		$rootScope.html = '';
		element = $compile('<textarea ta-bind ng-model="html"></textarea>')($rootScope);
	}));
	afterEach(inject(function($document){
		$document.find('body').html('');
	}));
	
	describe('should format textarea html for readability', function(){
		it('adding newlines after immediate child tags', function(){
			$rootScope.html = '<p>Test Line 1</p><div>Test Line 2</div><span>Test Line 3</span>';
			$rootScope.$digest();
			expect(element.val()).toBe('<p>Test Line 1</p>\n<div>Test Line 2</div>\n<p><span>Test Line 3</span></p>');
		});
		it('ignore nested tags', function(){
			$rootScope.html = '<p><b>Test</b> Line 1</p><div>Test <i>Line</i> 2</div><span>Test Line <u>3</u></span>';
			$rootScope.$digest();
			expect(element.val()).toBe('<p><b>Test</b> Line 1</p>\n<div>Test <i>Line</i> 2</div>\n<p><span>Test Line <u>3</u></span></p>');
		});
		it('tab out li elements', function(){
			$rootScope.html = '<ul><li>Test Line 1</li><li>Test Line 2</li><li>Test Line 3</li></ul>';
			$rootScope.$digest();
			expect(element.val()).toBe('<ul>\n\t<li>Test Line 1</li>\n\t<li>Test Line 2</li>\n\t<li>Test Line 3</li>\n</ul>');
		});
		it('handle nested lists', function(){
			$rootScope.html = '<ol><li>Test Line 1</li><ul><li>Nested Line 1</li><li>Nested Line 2</li></ul><li>Test Line 3</li></ol>';
			$rootScope.$digest();
			expect(element.val()).toBe('<ol>\n\t<li>Test Line 1</li>\n\t<ul>\n\t\t<li>Nested Line 1</li>\n\t\t<li>Nested Line 2</li>\n\t</ul>\n\t<li>Test Line 3</li>\n</ol>');
		});
		it('handles no tags (should wrap)', function(){
			$rootScope.html = 'Test Line 1';
			$rootScope.$digest();
			expect(element.val()).toBe('<p>Test Line 1</p>');
		});
	});
});