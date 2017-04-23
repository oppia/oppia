describe('taFixChrome', function(){
	'use strict';
	beforeEach(module('textAngular'));
	var taFixChrome;
	beforeEach(inject(function(_taFixChrome_){
		taFixChrome = _taFixChrome_;
	}));
	
	describe('should cleanse the following HTML samples from chrome', function(){
		it('should remove the style attributes on a non-span', function(){
			expect(taFixChrome('<div style="font-family: inherit; line-height: 1.428571429;">Test Content</div>')).toBe('<div>Test Content</div>');
		});
		
		it('should remove a span with only those attributes', function(){
			expect(taFixChrome('<div><span style="font-family: inherit; line-height: 1.428571429;">Test Content</span></div>')).toBe('<div>Test Content</div>');
		});
		
		it('should the style attributes on a span with other attributes', function(){
			expect(taFixChrome('<div><span style="width: 200px; font-family: inherit; line-height: 1.428571429;">Test Content</span></div>')).toBe('<div><span style="width: 200px;">Test Content</span></div>');
		});
		
		it('should leave a span with none of those attributes', function(){
			expect(taFixChrome('<div><span>Test Content</span></div>')).toBe('<div><span>Test Content</span></div>');
			expect(taFixChrome('<div><span style="width: 200px;">Test Content</span></div>')).toBe('<div><span style="width: 200px;">Test Content</span></div>');
		});
		
		it('should remove a matching span with its following br', function(){
			expect(taFixChrome('<div><span style="font-family: inherit; line-height: 1.428571429;">Test Content</span><br/></div>')).toBe('<div>Test Content</div>');
		});
	});
});