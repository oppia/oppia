describe('taDOM', function(){
	'use strict';
	var taDom, document, _testEl, _testFrag, _frag1, _frag2;
	beforeEach(module('textAngular'));
	beforeEach(inject(function (_taDOM_, _$document_) {
		taDom = _taDOM_;
		document = _$document_[0];
		_frag1 = document.createDocumentFragment();
		_frag2 = document.createDocumentFragment();
	}));
	
	describe('getByAttribute', function(){
		it('gets 0 level element', function(){
			_testEl = angular.element('<p testattr="test"></p>');
			expect(taDom.getByAttribute(_testEl, 'testattr')[0].attr('testattr')).toBe('test');
		});
		
		it('gets nth level element', function(){
			_testEl = angular.element('<div><div><p testattr="test"></p></div></div>');
			expect(taDom.getByAttribute(_testEl, 'testattr')[0].attr('testattr')).toBe('test');
		});
	});
	
	describe('transferNodeAttributes', function(){
		it('should transfer all attributes', function(){
			_frag1 = angular.element('<p testattr="test" src="test2"></p>');
			_frag2 = angular.element('<p></p>');
			taDom.transferNodeAttributes(_frag1[0], _frag2[0]);
			expect(_frag2.attr('testattr')).toBe('test');
			expect(_frag2.attr('src')).toBe('test2');
		});
	});
	
	describe('transferChildNodes', function(){
		it('should transfer all children', function(){
			_testEl = document.createTextNode('TestText');
			_frag1.appendChild(_testEl);
			taDom.transferChildNodes(_frag1, _frag2);
			expect(_frag2.childNodes[0].nodeValue).toBe('TestText');
		});
	});
	
	describe('splitNodes', function(){
		it('requires splitNode or splitIndex', function(){
			expect(function(){
				taDom.splitNodes();
			}).toThrow('taDOM.splitNodes requires a splitNode or splitIndex');
		});
		it('should split all nodes at index', function(){
			_testEl = angular.element('<p><b>TestNode</b><u>Test 2</u></p>');
			taDom.splitNodes(_testEl[0].childNodes, _frag1, _frag2, undefined, undefined, 1);
			expect(_frag1.textContent).toBe('TestNode');
			expect(_frag2.textContent).toBe('Test 2');
		});
		it('should split all nodes at node', function(){
			_testEl = document.createDocumentFragment();
			_testEl.appendChild(document.createTextNode('Split Before'));
			_testFrag = document.createTextNode('Split After');
			_testEl.appendChild(_testFrag);
			taDom.splitNodes(_testEl.childNodes, _frag1, _frag2, _testFrag);
			expect(_frag1.textContent).toBe('Split Before');
			expect(_frag2.textContent).toBe('Split After');
		});
		it('should split text node for sub split', function(){
			_testEl = document.createDocumentFragment();
			_testEl.appendChild(document.createTextNode('Split BeforeSplit After'));
			taDom.splitNodes(_testEl.childNodes, _frag1, _frag2, undefined, 12, 0);
			expect(_frag1.textContent).toBe('Split Before');
			expect(_frag2.textContent).toBe('Split After');
		});
	});
});