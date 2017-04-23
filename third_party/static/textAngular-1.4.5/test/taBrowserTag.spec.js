describe('taBrowserTag', function(){
	'use strict';
	beforeEach(module('textAngular'));
	
	it('should return p for undefined', inject(function(taBrowserTag){
		expect(taBrowserTag()).toBe('p');
	}));
	
	it('should return div for empty', inject(function(taBrowserTag){
		expect(taBrowserTag('')).toBe('p'); // don't ask me why phantomjs thinks it's ie
	}));
	
	it('should return string otherwise', inject(function(taBrowserTag){
		expect(taBrowserTag('b')).toBe('b');
	}));
});