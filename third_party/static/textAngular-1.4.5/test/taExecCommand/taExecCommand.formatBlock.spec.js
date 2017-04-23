describe('taExecCommand', function(){
	'use strict';
	var $element;
	beforeEach(module('textAngular'));
	//mock for easier testing
	describe('handles formatBlock BLOCKQUOTE correctly', function(){
		beforeEach(function(){
			module(function($provide){
				$provide.value('taSelection', {
					element: undefined,
					getSelectionElement: function (){ return this.element; },
					getOnlySelectedElements: function(){ return [].slice.call(this.element.childNodes); },
					setSelectionToElementStart: function (){ return; },
					setSelectionToElementEnd: function (){ return; }
				});
			});
		});
		// in li element
		// in non-block element, ie <b>
		// in block element, <p>
		// multiple selected including text elements
		// only text selected (collapsed range selection)
		
		// all wrap and unwrap
		describe('wraps elements', function(){
			describe('doesn\'t split lists', function(){
				it('li selected', inject(function(taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><ul><li>Test</li></ul></div>');
					taSelection.element = $element.find('li')[0];
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<blockquote><ul><li>Test</li></ul></blockquote>');
				}));
				it('ul selected', inject(function(taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><ul><li>Test</li></ul></div>');
					taSelection.element = $element.find('ul')[0];
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<blockquote><ul><li>Test</li></ul></blockquote>');
				}));
				it('ol selected', inject(function(taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><ol><li>Test</li></ol></div>');
					taSelection.element = $element.find('ol')[0];
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<blockquote><ol><li>Test</li></ol></blockquote>');
				}));
			});
			describe('wraps non-list elements', function(){
				it('no selection - single space', inject(function($document, taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><p><b>Test</b></p></div>');
					$document.find('body').append($element);
					taSelection.element = $element.find('b')[0];
					taSelection.getOnlySelectedElements = function(){ return []; };
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<blockquote><p><b>Test</b></p></blockquote>');
					$element.remove();
				}));
				it('nested selection', inject(function($document, taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><p><i><b>Test</b></i></p></div>');
					$document.find('body').append($element);
					taSelection.element = $element.find('b')[0];
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<blockquote><p><i><b>Test</b></i></p></blockquote>');
					$element.remove();
				}));
				it('selection with mixed nodes', inject(function($document, taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><p>Some <b>test</b> content</p></div>');
					$document.find('body').append($element);
					taSelection.element = $element.find('b')[0];
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<blockquote><p>Some <b>test</b> content</p></blockquote>');
					$element.remove();
				}));
				it('selection with multiple nodes', inject(function($document, taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><p>Some <b>test</b> content</p><p><br/></p><p>Some <b>test</b> content</p></div>');
					$document.find('body').append($element);
					taSelection.element = $element[0];
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<blockquote><p>Some <b>test</b> content</p><p><br></p><p>Some <b>test</b> content</p></blockquote>');
					$element.remove();
				}));
			});
		});
		describe('unwraps elements', function(){
			describe('doesn\'t split lists', function(){
				it('li selected', inject(function(taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><blockquote><ul><li>Test</li></ul></blockquote></div>');
					taSelection.element = $element.find('li')[0];
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<ul><li>Test</li></ul>');
				}));
				it('ul selected', inject(function(taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><blockquote><ul><li>Test</li></ul></blockquote></div>');
					taSelection.element = $element.find('ul')[0];
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<ul><li>Test</li></ul>');
				}));
				it('ol selected', inject(function(taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><blockquote><ol><li>Test</li></ol></blockquote></div>');
					taSelection.element = $element.find('ol')[0];
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<ol><li>Test</li></ol>');
				}));
			});
			describe('unwraps non-list elements', function(){
				beforeEach(inject(function($document){
					$element = angular.element('<div class="ta-bind"><blockquote><p><b>Test</b></p></blockquote></div>');
					$document.find('body').append($element);
				}));
				afterEach(inject(function($document){
					$element.remove();
				}));
				it('no selection - single space', inject(function(taExecCommand, taSelection){
					taSelection.element = $element.find('b')[0];
					taSelection.getOnlySelectedElements = function(){ return []; };
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<p><b>Test</b></p>');
				}));
				it('inline selected', inject(function(taExecCommand, taSelection){
					taSelection.element = $element.find('b')[0];
					taSelection.getOnlySelectedElements = function(){ return taSelection.element.childNodes; };
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<p><b>Test</b></p>');
				}));
				it('block selected', inject(function(taExecCommand, taSelection){
					taSelection.element = $element.find('blockquote')[0];
					taSelection.getOnlySelectedElements = function(){ return taSelection.element; };
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<p><b>Test</b></p>');
				}));
			});
			describe('unwraps inline elements', function(){
				it('just inline element', inject(function(taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><blockquote><b>Test</b></blockquote></div>');
					taSelection.element = $element.find('b')[0];
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<p><b>Test</b></p>');
				}));
				it('inline and text element', inject(function(taExecCommand, taSelection){
					$element = angular.element('<div class="ta-bind"><blockquote>Other <b>Test</b></blockquote></div>');
					taSelection.element = $element.find('blockquote')[0];
					taExecCommand()('formatBlock', false, '<BLOCKQUOTE>');
					expect($element.html()).toBe('<p>Other <b>Test</b></p>');
				}));
			});
		});
	});

	describe('handles formatBlock correctly for other elements', function(){
		var $document, taExecCommand, taSelection;
		beforeEach(function(){
			module(function($provide){
				$provide.value('taSelection', {
					element: undefined,
					getSelectionElement: function (){ return this.element; },
					getOnlySelectedElements: function(){ return [].slice.call(this.element.childNodes); },
					setSelectionToElementStart: function (){ return; },
					setSelectionToElementEnd: function (){ return; }
				});
			});
		});
		beforeEach(inject(function(_$document_, _taExecCommand_, _taSelection_){
			$document = _$document_;
			taExecCommand = _taExecCommand_;
			taSelection = _taSelection_;
		}));
		function setupElement(html){
			$element = angular.element(html);
			$document.find('body').append($element);
		}
		afterEach(function(){
			$element.remove();
		});
		
		it('default string should insert default wrap', function(){
			setupElement('<div class="ta-bind"><h1><b>Test</b></h1></div>');
			taSelection.element = $element.find('b')[0];
			taExecCommand('def')('formatBlock', false, 'default');
			expect($element.html()).toBe('<def><b>Test</b></def>');
		});
		
		describe('heading tags', function(){
			it('can be unwrapped', function(){
				setupElement('<div class="ta-bind"><h1><b>Test</b></h1></div>');
				taSelection.element = $element.find('b')[0];
				taExecCommand()('formatBlock', false, '<H1>');
				expect($element.html()).toBe('<p><b>Test</b></p>');
			});
			describe('wrapping', function(){
				it('single block element', function(){
					setupElement('<div class="ta-bind"><p>Test</p></div>');
					taSelection.element = $element.find('p')[0];
					taExecCommand()('formatBlock', false, '<H1>');
					expect($element.html()).toBe('<h1>Test</h1>');
				});
				it('single block element with an inline element', function(){
					setupElement('<div class="ta-bind"><p><b>Test</b></p></div>');
					taSelection.element = $element.find('p')[0];
					taExecCommand()('formatBlock', false, '<H1>');
					expect($element.html()).toBe('<h1><b>Test</b></h1>');
				});
				it('replaces each selected block element', function(){
					setupElement('<div class="ta-bind"><p><b>Test</b></p><p>Line two</p><p>Line three</p></div>');
					taSelection.element = $element[0];
					// Select the first two p elements
					taSelection.getOnlySelectedElements = function(){ return [].slice.call(this.element.childNodes, 0, 2); };
					taExecCommand()('formatBlock', false, '<H1>');
					expect($element.html()).toBe('<h1><b>Test</b></h1><h1>Line two</h1><p>Line three</p>');
				});
				it('wraps all nodes for mixed nodes', function(){
					setupElement('<div class="ta-bind"><em>Italic</em>text<p><b>Test</b> content</p>In between<p>Line two</p></div>');
					taSelection.element = $element[0];
					taExecCommand()('formatBlock', false, '<H1>');
					expect($element.html()).toBe('<h1><em>Italic</em>text<p><b>Test</b> content</p>In between<p>Line two</p></h1>');
				});
			});
		});
	});
});