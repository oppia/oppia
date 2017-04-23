describe('taExecCommand', function(){
	'use strict';
	var $element;
	beforeEach(module('textAngular'));
	//mock for easier testing
	describe('normal function', function(){
		var $document, contents, _tempExec;
		beforeEach(inject(function(_$document_){
			$document = _$document_;
			contents = angular.element('<div>');
			contents.append('<p>Test Text</p>');
			$document.find('body').append(contents);
			// Fake it till you make it
			_tempExec = $document[0].execCommand;
			$document[0].execCommand = function(){
				contents.html('<p><b>Test Text</b></p>');
			};
		}));
		afterEach(function(){
			$document[0].execCommand = _tempExec;
		});
		var $rootScope;
		
		it('shouldn\'t error for undefined', inject(function(taExecCommand){
			expect(function(){
				taExecCommand()('bold', false, null);
			}).not.toThrow();
		}));
		
		describe('document execCommand fallback', function(){
			it('should execute for elements', inject(function(taExecCommand, $window){
				var sel = $window.rangy.getSelection();
				var range = $window.rangy.createRangyRange();
				range.selectNodeContents(contents.find('p')[0]);
				sel.setSingleRange(range);
				taExecCommand()('bold', false, null);
				expect(contents.html()).toBe('<p><b>Test Text</b></p>');
			}));
		});
	});
	
	describe('insertHTML shim works', function(){
		var _selection = {
			start: {
				element: this.element,
				offset: 0
			},
			end: {
				element: this.element,
				offset: 0
			},
			container: this.element,
			collapsed: true
		};
		beforeEach(function(){
			module(function($provide){
				$provide.value('taSelection', {
					element: undefined,
					getSelection: function(){return _selection;},
					insertHtml: function(html){ angular.element(this.element).html(html); },
					getSelectionElement: function (){ return this.element; },
					getOnlySelectedElements: function(){ return [].slice.call(this.element.childNodes); },
					setSelectionToElementStart: function (){ return; },
					setSelectionToElementEnd: function (){ return; }
				});
			});
		});
		
		it('inserts collapsed', inject(function(taExecCommand, taSelection){
			$element = angular.element('<div class="ta-bind"></div>');
			taSelection.element = $element[0];
			taExecCommand()('insertHTML', false, 'bananna');
			expect($element.html()).toBe('bananna');
		}));
	});

	describe('catches collapsed link creation and fills them in', function(){
		beforeEach(function(){
			module(function($provide){
				$provide.value('taSelection', {
					element: undefined,
					getSelection: function(){return {
						start: {
							element: this.element,
							offset: 0
						},
						end: {
							element: this.element,
							offset: 0
						},
						container: this.element,
						collapsed: true
					};},
					insertHtml: function(html){ angular.element(this.element).html(html); },
					getSelectionElement: function (){ return this.element; },
					getOnlySelectedElements: function(){ return [].slice.call(this.element.childNodes); },
					setSelectionToElementStart: function (){ return; },
					setSelectionToElementEnd: function (){ return; }
				});
			});
		});

		it('correctly with target attribute default', inject(function(taExecCommand, taSelection){
			$element = angular.element('<div class="ta-bind"></div>');
			taSelection.element = $element[0];
			taExecCommand()('createLink', false, 'http://test.com', {"a":{"target":"_blank"}});
			expect($element.html()).toBe('<a href="http://test.com" target="_blank">http://test.com</a>');
		}));

		it('correctly without target attribute default', inject(function(taExecCommand, taSelection){
			$element = angular.element('<div class="ta-bind"></div>');
			taSelection.element = $element[0];
			taExecCommand()('createLink', false, 'http://test.com', {"a":{"target":""}});
			expect($element.html()).toBe('<a href="http://test.com" target="">http://test.com</a>');
		}));
	});

	describe('catches NON-collapsed link creation and fills them in', function(){
		beforeEach(function(){
			module(function($provide){
				$provide.value('taSelection', {
					element: undefined,
					getSelection: function(){return {
						start: {
							element: this.element,
							offset: 2
						},
						end: {
							element: this.element,
							offset: 1
						},
						container: this.element,
						collapsed: false
					};},
					insertHtml: function(html){ angular.element(this.element).html(html); },
					getSelectionElement: function (){ return this.element; },
					getOnlySelectedElements: function(){ return [].slice.call(this.element.childNodes); },
					setSelectionToElementStart: function (){ return; },
					setSelectionToElementEnd: function (){ return; }
				});
			});
		});

		it('correctly with target attribute default', inject(function(taExecCommand, taSelection, $window, _$document_){
			var sel = $window.rangy.getSelection(),
				range = $window.rangy.createRangyRange(),
				$document, contents;
			$document = _$document_;
			contents = angular.element('<div>');
			contents.append('<p>foo</p>');
			$document.find('body').append(contents);
			$element = contents.find('p');

			range.selectNodeContents($element[0]);
			sel.setSingleRange(range);
			taSelection.element = $element[0];
			taExecCommand()('createLink', false, 'http://test.com', {"a":{"target":"_blank"}});
			expect($element.html()).toBe('<a href="http://test.com" target="_blank">foo</a>');
		}));

		it('correctly without target attribute default', inject(function(taExecCommand, taSelection, $window, _$document_){
			var sel = $window.rangy.getSelection(),
				range = $window.rangy.createRangyRange(),
				$document, contents;
			$document = _$document_;
			contents = angular.element('<div>');
			contents.append('<p>foo</p>');
			$document.find('body').append(contents);
			$element = contents.find('p');

			range.selectNodeContents($element[0]);
			sel.setSingleRange(range);
			taSelection.element = $element[0];
			taExecCommand()('createLink', false, 'http://test.com', {"a":{"target":""}});
			expect($element.html()).toBe('<a href="http://test.com" target="">foo</a>');
		}));
	});
	describe('link creation no operation path', function() {
		beforeEach(function(){
			module(function($provide){
				$provide.value('taSelection', {
					element: null,
					getSelection: function(){return {
						collapsed: false
					};},
					getSelectionElement: function (){ return this.element; }
				});
			});
		});

		it('ignore createlink commands where the selection is not collapsed and cannot be surrounded', inject(function(taExecCommand, taSelection){
			$element = angular.element('<p>');
			taSelection.element = $element[0];
			var mock = {id:"mock", getRangeAt: function () {return {canSurroundContents: function () {return false;}};}};
			spyOn(rangy, "getSelection").andReturn(mock);
			taExecCommand()('createLink', false, 'http://test.com', {"a":{"target":""}});
			expect($element.html()).toBe('');
		}));
	});
});